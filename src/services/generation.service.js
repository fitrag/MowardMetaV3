const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const crypto = require('crypto');
const { db } = require('../db');
const { decryptText } = require('../lib/crypto');
const { AppError } = require('../lib/http');
const { getSetting } = require('./settings.service');
const { logAudit } = require('./audit.service');

const ANALYSIS_PROMPT = `You are an expert Adobe Stock metadata specialist. Analyze this image and return JSON:
{
  "title": "A concise, descriptive title (max 200 chars)",
  "keywords": ["keyword1", "keyword2", "..."],
  "categories": ["Category1", "Category2"],
  "description": "A detailed description (max 200 chars)",
  "dominant_colors": ["#hex1", "#hex2", "#hex3"],
  "orientation": "landscape|portrait|square",
  "image_type": "photo|illustration|vector|3d",
  "people_count": 0,
  "commercial_viability": "high|medium|low|editorial"
}

KEYWORD RULES:
- ALL keywords MUST be single words only
- Include 30-50 keywords: SUBJECT, ACTION, CONCEPT, MOOD, LOCATION, TIME/LIGHTING, STYLE, COLORS, USAGE, SYNONYMS
- Return ONLY valid JSON, no markdown.`;

const DEFAULT_TIMEOUT_MS = 60_000;

function extractJson(text) {
  if (!text || typeof text !== 'string') throw new AppError(500, 'Provider response is empty');
  const mark = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (mark) return mark[1];
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s === -1 || e === -1 || e <= s) {
    const aS = text.indexOf('['), aE = text.lastIndexOf(']');
    if (aS !== -1 && aE !== -1 && aE > aS) return text.slice(aS, aE + 1);
    throw new AppError(500, 'Invalid JSON');
  }
  return text.slice(s, e + 1);
}

function safeParseJson(text, msg = "Parse error") {
  try { return JSON.parse(text); }
  catch (e) { throw new AppError(500, `${msg}: ${e.message}`); }
}

function getProvider(id) {
  
  const pid = id || getSetting('generation.default_provider_id', 1);
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ? AND status = ?').get(pid, 'active');
  if (!p) throw new AppError(404, 'Provider not found');
  return p;
}

function getProviderModel(pid, mid) {
  
  if (mid) {
    const m = db.prepare('SELECT * FROM provider_models WHERE id = ? AND provider_id = ? AND status = ?').get(mid, pid, 'active');
    if (m) return m;
  }
  const def = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? AND is_default = 1 AND status = ?').get(pid, 'active');
  if (def) return def;
  const fb = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? AND status = ?').get(pid, 'active');
  if (!fb) throw new AppError(404, 'Model not found');
  return fb;
}

function getActiveEntitlements(uid) {
  
  const now = new Date().toISOString();
  const rows = db.prepare('SELECT * FROM user_subscriptions WHERE user_id = ? AND status = ? AND (expires_at IS NULL OR expires_at > ?)').all(uid, 'active', now);
  return { duration: rows.find(r => r.package_type === 'duration'), byok: rows.find(r => r.package_type === 'byok') };
}

function pickSystemApiKey(pid) {
  
  return db.prepare(`
    SELECT * FROM system_api_keys
    WHERE provider_id = ? AND status = 'active'
      AND (cooldown_until IS NULL OR cooldown_until < datetime('now'))
      AND is_rate_limited = 0
    ORDER BY CASE WHEN last_used_at IS NULL THEN 0 ELSE 1 END, last_used_at ASC, id ASC
    LIMIT 1
  `).get(pid);
}

function pickUserApiKey(uid, pid) {
  
  return db.prepare(`
    SELECT * FROM user_byok_keys
    WHERE user_id = ? AND provider_id = ? AND status = 'active'
      AND (cooldown_until IS NULL OR cooldown_until < datetime('now'))
      AND is_rate_limited = 0
    ORDER BY CASE WHEN last_used_at IS NULL THEN 0 ELSE 1 END, last_used_at ASC, id ASC
    LIMIT 1
  `).get(uid, pid);
}

function markKeyRateLimited(kid, tbl) {
  
  const now = new Date().toISOString();
  const cd = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  db.prepare(`UPDATE ${tbl} SET is_rate_limited = 1, cooldown_until = ?, error_count = error_count + 1, last_error_at = ?, updated_at = ? WHERE id = ?`).run(cd, now, now, kid);
}

function markKeyError(kid, tbl) {
  
  const now = new Date().toISOString();
  db.prepare(`UPDATE ${tbl} SET error_count = error_count + 1, last_error_at = ?, updated_at = ? WHERE id = ?`).run(now, now, kid);
}

function clearKeyHealth(kid, tbl) {
  
  db.prepare(`UPDATE ${tbl} SET is_rate_limited = 0, cooldown_until = NULL, error_count = 0, updated_at = ? WHERE id = ?`).run(new Date().toISOString(), kid);
}

function classifyError(err) {
  const m = err.message || '';
  if (m.includes('429') || m.toLowerCase().includes('rate limit')) return 'rate_limit';
  if (m.includes('401') || m.includes('403') || m.toLowerCase().includes('unauthorized')) return 'auth_error';
  return 'other';
}

async function callGemini({ apiKey, img, to = DEFAULT_TIMEOUT_MS, prompt = ANALYSIS_PROMPT, mCode }) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), to);
  try {
    const gen = new GoogleGenerativeAI(apiKey);
    const model = gen.getGenerativeModel({ model: mCode || 'gemini-2.0-flash-exp-02-05' });
    const res = await model.generateContent([prompt, { inlineData: { data: img.buffer.toString('base64'), mimeType: img.mimetype } }]);
    return safeParseJson(extractJson(res.response.text()));
  } catch (e) {
    if (e.name === 'AbortError') throw new AppError(504, 'Request timed out');
    throw e;
  } finally { clearTimeout(tid); }
}

async function callKie({ apiKey, img, to = DEFAULT_TIMEOUT_MS, prompt = ANALYSIS_PROMPT, mCode }) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), to);
  try {
    const r = await fetch('https://api.kie.ai/gemini/v1/models/' + (mCode || 'gemini-3-flash-v1betamodels') + ':streamGenerateContent?alt=json', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ stream: false, contents: [{ role: 'user', parts: [{ text: prompt }, { inline_data: { mime_type: img.mimetype, data: img.buffer.toString('base64') } }] }], generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 2048, responseMimeType: 'application/json' } }),
      signal: ctrl.signal
    });
    if (!r.ok) throw new AppError(502, `Kie error: ${r.statusText}`);
    const d = await r.json();
    const t = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!t.trim()) throw new AppError(500, 'Empty response');
    return safeParseJson(extractJson(t));
  } catch (e) {
    if (e.name === 'AbortError') throw new AppError(408, 'Request timed out');
    if (e instanceof AppError) throw e;
    throw new AppError(500, `Kie failed: ${e.message}`);
  } finally { clearTimeout(tid); }
}

async function callCloudflare({ apiKey, prov, img, to = DEFAULT_TIMEOUT_MS, prompt = ANALYSIS_PROMPT, mCode }) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), to);
  try {
    const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + apiKey + '/ai/run/@cf/meta/meta-model', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', url: `data:${img.mimetype};base64,${img.buffer.toString('base64')}` }] }] }),
      signal: ctrl.signal
    });
    if (!r.ok) throw new AppError(502, `Cloudflare error: ${r.status}`);
    const d = await r.json();
    if (d.error) throw new AppError(502, d.error.message || 'Cloudflare failed');
    const t = d.result?.response || '';
    return safeParseJson(extractJson(t));
  } catch (e) {
    if (e.name === 'AbortError') throw new AppError(408, 'Request timed out');
    if (e instanceof AppError) throw e;
    throw new AppError(500, `Cloudflare failed: ${e.message}`);
  } finally { clearTimeout(tid); }
}

async function callOpenAI({ apiKey, prov, img, to = DEFAULT_TIMEOUT_MS, prompt = ANALYSIS_PROMPT, mCode }) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), to);
  try {
    const r = await fetch((prov.base_url || 'https://api.openai.com/v1') + '/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: mCode || 'gpt-4o-mini', messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${img.mimetype};base64,${img.buffer.toString('base64')}` } }] }], temperature: 0.1 }),
      signal: ctrl.signal
    });
    if (!r.ok) throw new AppError(502, `API error: ${r.status}`);
    const p = await r.json();
    return safeParseJson(extractJson(p.choices?.[0]?.message?.content || ''));
  } catch (e) {
    if (e.name === 'AbortError') throw new AppError(504, 'Request timed out');
    throw e;
  } finally { clearTimeout(tid); }
}

async function callMistral({ apiKey, img, to = DEFAULT_TIMEOUT_MS, prompt = ANALYSIS_PROMPT, mCode }) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), to);
  try {
    const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: mCode || 'pixtral-12b-240914', messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: `data:${img.mimetype};base64,${img.buffer.toString('base64')}` }] }], temperature: 0.1 }),
      signal: ctrl.signal
    });
    if (!r.ok) throw new AppError(502, `Mistral error: ${r.status}`);
    const d = await r.json();
    return safeParseJson(extractJson(d.choices?.[0]?.message?.content || ''));
  } catch (e) {
    if (e.name === 'AbortError') throw new AppError(504, 'Request timed out');
    throw new AppError(500, `Mistral failed: ${e.message}`);
  } finally { clearTimeout(tid); }
}

async function invokeProvider({ prov, model, apiKey, img, to, prompt }) {
  const mc = model.model_code;
  if (prov.driver === 'gemini') return callGemini({ apiKey, img, to, prompt, mCode: mc });
  if (prov.driver === 'kie') return callKie({ apiKey, img, to, prompt, mCode: mc });
  if (prov.driver === 'cloudflare') return callCloudflare({ apiKey, prov, img, to, prompt, mCode: mc });
  if (prov.driver === 'openai') return callOpenAI({ apiKey, prov, img, to, prompt, mCode: mc });
  if (prov.driver === 'mistral') return callMistral({ apiKey, img, to, prompt, mCode: mc });
  throw new AppError(400, `Driver ${prov.driver} not supported`);
}

function normalizeColors(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, 5).map(c => typeof c === 'string' ? (c.startsWith('#') ? c : '#' + c) : '#' + String(c));
}

function buildPayload(raw) {
  return {
    title: raw.title || '',
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    description: raw.description || '',
    dominantColors: normalizeColors(raw.dominant_colors || raw.dominantColors),
    orientation: raw.orientation || 'unknown',
    imageType: raw.image_type || raw.imageType || 'unknown',
    peopleCount: raw.people_count ?? raw.peopleCount ?? 0,
    commercialViability: raw.commercial_viability || raw.commercialViability || 'unknown'
  };
}

function getImageData(img) {
  if (img.buffer) {
    return { buffer: img.buffer, mimetype: img.mimetype };
  }
  if (img.path) {
    const fs = require('fs');
    const buffer = fs.readFileSync(img.path);
    return { buffer, mimetype: img.mimetype };
  }
  throw new AppError(400, 'Invalid image object');
}

async function generateForImage({ user, providerId, modelId, image, options = {} }) {
   
  const provider = getProvider(providerId);
  const model = getProviderModel(provider.id, modelId);
  const ents = getActiveEntitlements(user.id);
  const { getTotalCredit, consumeCredit } = require('./subscriptions.service');
  const subs = db.prepare('SELECT * FROM user_subscriptions WHERE user_id = ?').all(user.id);
  console.log('[DEBUG] User subscriptions:', JSON.stringify(subs));
  const totalCredit = getTotalCredit(user.id);
  console.log('[DEBUG] getTotalCredit result:', totalCredit);
  let keySource = 'system', creditUsed = 0;

  if (totalCredit > 0) {
    keySource = 'system';
    creditUsed = 1;
    const ok = consumeCredit(user.id, 1);
    console.log('[Generation] Consumed 1 credit, success:', ok, 'Remaining:', getTotalCredit(user.id));
  } else if (ents.byok) {
    keySource = 'byok';
  } else if (ents.duration) {
    keySource = 'system';
  } else {
    throw new AppError(400, 'Insufficient credit. Please purchase a credit package or subscription.');
  }

  const to = getSetting('generation.request_timeout_ms', DEFAULT_TIMEOUT_MS);
  const tbl = keySource === 'byok' ? 'user_byok_keys' : 'system_api_keys';
  let lastErr = null;
  const tried = new Set();

  const imgData = getImageData(image);

  while (true) {
    const keyRec = keySource === 'byok' ? pickUserApiKey(user.id, provider.id) : pickSystemApiKey(provider.id);
    if (!keyRec || tried.has(keyRec.id)) {
      if (creditUsed > 0) {
        const { refundCredit } = require('./subscriptions.service');
        refundCredit(user.id, creditUsed);
      }
      throw new AppError(502, lastErr ? `All keys failed: ${lastErr.message}` : 'No key available');
    }
    tried.add(keyRec.id);
    const apiKey = decryptText(keyRec.encrypted_key);
    const now = new Date().toISOString();
    let retries = 0;
    const MAX_RETRIES = 3;

    while (retries < MAX_RETRIES) {
      try {
        console.log('[DEBUG] Before invokeProvider, retry:', retries + 1);
        const raw = await invokeProvider({ prov: provider, model, apiKey, img: { ...imgData, originalname: image.originalname }, to, prompt: ANALYSIS_PROMPT });
        console.log('[DEBUG] After invokeProvider, raw:', raw ? 'exists' : 'null');
        clearKeyHealth(keyRec.id, tbl);
      
const payloadJson = JSON.stringify({ filename: image.originalname });
      const responseJson = JSON.stringify(buildPayload(raw));
      const params = [user.id, provider.id, model.id, keySource, image.originalname, image.mimetype, creditUsed, 'success', payloadJson, responseJson, null, now];
      console.log('[DEBUG] Params:', params.length);
      db.prepare(`INSERT INTO metadata_generations (user_id, provider_id, provider_model_id, key_source, input_filename, mime_type, credit_used, status, request_payload, response_payload, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(...params);

      if (keySource === 'system') {
        console.log('[DEBUG] Before UPDATE system_api_keys');
        db.prepare('UPDATE system_api_keys SET usage_count = usage_count + 1, last_used_at = ?, updated_at = ? WHERE id = ?').run(now, now, keyRec.id);
        console.log('[DEBUG] After UPDATE system_api_keys');
      }

      console.log('[DEBUG] Before logAudit');
      logAudit({ actorUserId: user.id, action: 'generation.created', entityType: 'metadata_generation', payload: { providerId: provider.id, modelId: model.id, keySource, keyId: keyRec.id } });
      console.log('[DEBUG] About to return');

      return { provider: { id: provider.id, name: provider.name, driver: provider.driver }, model: { id: model.id, name: model.name, code: model.model_code }, keySource, creditUsed, metadata: buildPayload(raw) };
      } catch (err) {
        console.log('[DEBUG] Key error:', err.message);
        lastErr = err;
        const typ = classifyError(err);
        
        markKeyError(keyRec.id, tbl);
        console.log(`[Key] Error with key ${keyRec.id}, stopping: ${err.message}`);
        throw new AppError(500, err.message);
      }
    }
  }
}

async function fetchModelsFromProvider(pid, apiKey) {
  const prov = getDb().prepare('SELECT * FROM ai_providers WHERE id = ?').get(pid);
  if (!prov) throw new AppError(404, 'Provider not found');
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 30000);

  try {
    if (prov.driver === 'gemini') {
      const g = new GoogleGenerativeAI(apiKey);
      const ms = await g.listModels();
      return ms.map(m => ({ name: m.name.replace('models/', ''), modelCode: m.name, description: m.description || '' }));
    }
    if (prov.driver === 'kie') return [{ name: 'Gemini 3 Flash', modelCode: 'gemini-3-flash-v1betamodels', description: 'Kie.ai Gemini' }];
    if (prov.driver === 'cloudflare') {
      const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + apiKey + '/ai/models', { signal: ctrl.signal });
      if (!r.ok) throw new AppError(502, 'Failed');
      const d = await r.json();
      return d.result?.map(m => ({ name: m.name, modelCode: m.name, description: m.description || '' })) || [];
    }
    if (prov.driver === 'openai') {
      const r = await fetch((prov.base_url || 'https://api.openai.com/v1') + '/models', { headers: { Authorization: `Bearer ${apiKey}` }, signal: ctrl.signal });
      if (!r.ok) throw new AppError(502, 'Failed');
      const d = await r.json();
      return d.data?.map(m => ({ name: m.id, modelCode: m.id, description: m.owned_by || '' })) || [];
    }
    throw new AppError(400, `Driver ${prov.driver} not supported`);
  } finally { clearTimeout(ctrl.timeout); }
}

module.exports = { generateForImage, fetchModelsFromProvider };