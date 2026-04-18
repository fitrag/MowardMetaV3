const express = require('express');
const crypto = require('crypto');
const { db } = require('../../db');
const { encryptText, decryptText } = require('../../lib/crypto');
const { asyncHandler, AppError } = require('../../lib/http');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const rows = db.prepare(`SELECT ap.*, (SELECT COUNT(*) FROM provider_models WHERE provider_id = ap.id) as model_count FROM ai_providers ap ORDER BY ap.id DESC`).all();
  res.json({ success: true, data: rows });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Provider not found');
  const models = db.prepare('SELECT * FROM provider_models WHERE provider_id = ?').all(req.params.id);
  res.json({ success: true, data: { ...p, models } });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, slug, driver, base_url, description } = req.body;
  if (!name || !slug || !driver) throw new AppError(400, 'Required fields missing');
  
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO ai_providers (name, slug, driver, base_url, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(name, slug, driver, base_url || null, description || null, 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Not found');
  
  const { name, slug, driver, base_url, description, status } = req.body;
  db.prepare('UPDATE ai_providers SET name = ?, slug = ?, driver = ?, base_url = ?, description = ?, status = ?, updated_at = ? WHERE id = ?').run(name || p.name, slug || p.slug, driver || p.driver, base_url || p.base_url, description || p.description, status || p.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM ai_providers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// API Keys
router.get('/api-keys', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT sak.*, ap.name as provider_name FROM system_api_keys sak JOIN ai_providers ap ON ap.id = sak.provider_id ORDER BY sak.id DESC').all();
  rows.forEach(r => r.encrypted_key = undefined);
  res.json({ success: true, data: rows });
}));

router.post('/api-keys', asyncHandler(async (req, res) => {
  const { providerId, name, apiKey, status = 'active' } = req.body;
  if (!providerId || !name || !apiKey) throw new AppError(400, 'Required');
  
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO system_api_keys (provider_id, name, encrypted_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(providerId, name, encryptText(apiKey), status, now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, name, providerId, status, key: apiKey } });
}));

router.patch('/api-keys/:id', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM system_api_keys WHERE id = ?').get(req.params.id);
  if (!key) throw new AppError(404, 'Not found');
  
  const { name, apiKey, status } = req.body;
  db.prepare('UPDATE system_api_keys SET name = ?, encrypted_key = ?, status = ?, updated_at = ? WHERE id = ?').run(name || key.name, apiKey ? encryptText(apiKey) : key.encrypted_key, status || key.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/api-keys/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM system_api_keys WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

router.post('/api-keys/:id/roll', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM system_api_keys WHERE id = ?').get(req.params.id);
  if (!key) throw new AppError(404, 'Not found');
  
  const newKey = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE system_api_keys SET encrypted_key = ?, updated_at = ? WHERE id = ?').run(encryptText(newKey), new Date().toISOString(), req.params.id);
  res.json({ success: true, data: { id: key.id, name: key.name, newApiKey: newKey } });
}));

router.post('/api-keys/:id/reset-health', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM system_api_keys WHERE id = ?').get(req.params.id);
  if (!key) throw new AppError(404, 'Not found');
  
  db.prepare('UPDATE system_api_keys SET is_rate_limited = 0, cooldown_until = NULL, error_count = 0, updated_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
  res.json({ success: true, message: 'Key health reset' });
}));

// Models
router.get('/:id/models', asyncHandler(async (req, res) => {
  const models = db.prepare('SELECT * FROM provider_models WHERE provider_id = ?').all(req.params.id);
  res.json({ success: true, data: models });
}));

router.post('/:id/models', asyncHandler(async (req, res) => {
  const { name, modelCode, isDefault = false } = req.body;
  if (!name || !modelCode) throw new AppError(400, 'Required');
  
  if (isDefault) db.prepare('UPDATE provider_models SET is_default = 0 WHERE provider_id = ?').run(req.params.id);
  
  const now = new Date().toISOString();
  db.prepare('INSERT INTO provider_models (provider_id, name, model_code, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, name, modelCode, isDefault ? 1 : 0, 'active', now, now);
  res.status(201).json({ success: true });
}));

router.patch('/models/:id', asyncHandler(async (req, res) => {
  const m = db.prepare('SELECT * FROM provider_models WHERE id = ?').get(req.params.id);
  if (!m) throw new AppError(404, 'Not found');
  
  const { name, modelCode, isDefault, status } = req.body;
  if (isDefault) db.prepare('UPDATE provider_models SET is_default = 0 WHERE provider_id = ?').run(m.provider_id);
  db.prepare('UPDATE provider_models SET name = ?, model_code = ?, is_default = ?, status = ?, updated_at = ? WHERE id = ?').run(name || m.name, modelCode || m.model_code, isDefault ? 1 : (m.is_default || 0), status || m.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/models/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM provider_models WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

module.exports = router;