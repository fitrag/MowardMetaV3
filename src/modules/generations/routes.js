const express = require('express');
const { imageUpload } = require('../../utils/upload');
const { db } = require('../../db');
const { asyncHandler, AppError } = require('../../lib/http');
const { generateForImage, fetchModelsFromProvider } = require('../../services/generation.service');
const { getSetting } = require('../../services/settings.service');
const { authenticate } = require('../auth/routes');

const router = express.Router();
router.use(authenticate);

router.post('/', imageUpload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, 'image required');
  const r = await generateForImage({ user: { ...req.user }, providerId: req.body.providerId ? Number(req.body.providerId) : null, modelId: req.body.modelId ? Number(req.body.modelId) : null, image: req.file });
  res.status(201).json({ success: true, data: r });
}));

router.post('/batch-stream', imageUpload.array('images', 100), asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) throw new AppError(400, 'images required');
  const maxBatch = getSetting('generation.max_batch_items', 5);
  if (req.files.length > maxBatch) throw new AppError(400, `Max ${maxBatch}`);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const userObj = { ...req.user };
  const send = (e, d) => { try { res.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`); } catch (x) {} };

  const delayMs = req.body.delayMs ? Number(req.body.delayMs) : 0;
  for (let i = 0; i < req.files.length; i++) {
    const f = req.files[i];
    try {
      const r = await generateForImage({ user: userObj, providerId: req.body.providerId ? Number(req.body.providerId) : null, modelId: req.body.modelId ? Number(req.body.modelId) : null, image: f });
      send('progress', { index: i, filename: f.originalname, success: true, data: r });
    } catch (err) {
      send('progress', { index: i, filename: f.originalname, success: false, error: err.message });
    }
    if (delayMs > 0 && i < req.files.length - 1) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  send('complete', { type: 'complete', total: req.files.length });
  res.end();
}));

router.post('/batch', imageUpload.array('images', 20), asyncHandler(async (req, res) => {
  const maxBatch = getSetting('generation.max_batch_items', 5);
  if (!req.files || req.files.length === 0) throw new AppError(400, 'images required');
  if (req.files.length > maxBatch) throw new AppError(400, `Max ${maxBatch}`);

  const results = [];
  const userObj = { ...req.user };
  for (const f of req.files) {
    results.push(await generateForImage({ user: userObj, providerId: req.body.providerId ? Number(req.body.providerId) : null, modelId: req.body.modelId ? Number(req.body.modelId) : null, image: f }));
  }
  res.status(201).json({ success: true, data: results });
}));

function mapGeneration(row) {
  let metadata = {};
  try {
    if (row.response_payload) {
      metadata = JSON.parse(row.response_payload);
    }
  } catch (e) {}
  
  return {
    id: row.id,
    inputFilename: row.input_filename,
    mimeType: row.mime_type,
    status: row.status,
    creditUsed: row.credit_used,
    keySource: row.key_source,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    errorMessage: row.error_message,
    providerName: row.provider_name,
    modelName: row.model_name,
    provider: row.provider_id ? { id: row.provider_id, name: row.provider_name } : null,
    model: row.provider_model_id ? { id: row.provider_model_id, name: row.model_name } : null,
    title: metadata.title || null,
    keywords: metadata.keywords || [],
    description: metadata.description || null,
    categories: metadata.categories || [],
    dominantColors: metadata.dominantColors || [],
    orientation: metadata.orientation || null,
    imageType: metadata.imageType || null,
    peopleCount: metadata.peopleCount ?? null,
    commercialViability: metadata.commercialViability || null
  };
}

router.get('/:id', asyncHandler(async (req, res) => {
  const row = db.prepare(`
    SELECT mg.*, ap.name as provider_name, pm.name as model_name
    FROM metadata_generations mg 
    JOIN ai_providers ap ON ap.id = mg.provider_id
    LEFT JOIN provider_models pm ON pm.id = mg.provider_model_id
    WHERE mg.id = ? AND mg.user_id = ?
  `).get(req.params.id, req.user.id);
  
  if (!row) {
    throw new AppError(404, 'Not found');
  }
  
  const data = mapGeneration(row);
  res.json({ success: true, data });
}));

router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const rows = db.prepare(`
    SELECT mg.*, ap.name as provider_name, pm.name as model_name
    FROM metadata_generations mg 
    JOIN ai_providers ap ON ap.id = mg.provider_id
    LEFT JOIN provider_models pm ON pm.id = mg.provider_model_id
    WHERE mg.user_id = ? 
    ORDER BY mg.id DESC 
    LIMIT ? OFFSET ?
  `).all(req.user.id, limit, offset);
  
  const data = rows.map(mapGeneration);
  res.json({ success: true, data });
}));

router.get('/byok-keys', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT ubk.*, ap.name as provider_name FROM user_byok_keys ubk JOIN ai_providers ap ON ap.id = ubk.provider_id WHERE ubk.user_id = ?').all(req.user.id);
  rows.forEach(r => r.encrypted_key = undefined);
  res.json({ success: true, data: rows });
}));

router.post('/byok-keys', asyncHandler(async (req, res) => {
  const { providerId, name, apiKey, status = 'active' } = req.body;
  if (!providerId || !name || !apiKey) throw new AppError(400, 'Required');
  const { encryptText } = require('../../lib/crypto');
  const now = new Date().toISOString();
  
  console.log('[DEBUG BYOK INSERT] user_id:', req.user.id, 'providerId:', providerId, 'name:', name, 'status:', status);
  
  const result = db.prepare('INSERT INTO user_byok_keys (user_id, provider_id, name, encrypted_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.user.id, providerId, name, encryptText(apiKey), status, now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, providerId, name, status } });
}));

router.patch('/byok-keys/:id', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM user_byok_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new AppError(404, 'Not found');
  const { encryptText } = require('../../lib/crypto');
  db.prepare('UPDATE user_byok_keys SET name = ?, encrypted_key = ?, status = ?, updated_at = ? WHERE id = ?').run(req.body.name || key.name, req.body.apiKey ? encryptText(req.body.apiKey) : key.encrypted_key, req.body.status || key.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/byok-keys/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM user_byok_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
}));

router.post('/byok-keys/:id/roll', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM user_byok_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new AppError(404, 'Not found');
  const newKey = crypto.randomBytes(32).toString('hex');
  const { encryptText } = require('../../lib/crypto');
  db.prepare('UPDATE user_byok_keys SET encrypted_key = ?, updated_at = ? WHERE id = ?').run(encryptText(newKey), new Date().toISOString(), req.params.id);
  res.json({ success: true, data: { id: key.id, name: key.name, newApiKey: newKey } });
}));

router.post('/byok-keys/:id/fetch-models', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM user_byok_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new AppError(404, 'Not found');
  const { decryptText } = require('../../lib/crypto');
  const models = await fetchModelsFromProvider(key.provider_id, decryptText(key.encrypted_key));
  res.json({ success: true, data: models });
}));

module.exports = router;