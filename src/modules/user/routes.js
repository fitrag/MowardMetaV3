const express = require('express');
const { db } = require('../../db');
const { asyncHandler } = require('../../lib/http');
const { authenticate } = require('../auth/routes');

const router = express.Router();
router.use(authenticate);

// Packages
router.get('/packages', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM subscription_packages WHERE status = ? ORDER BY price_amount ASC').all('active');
  const data = rows.map(p => ({
    id: p.id,
    name: p.name,
    packageType: p.package_type,
    priceAmount: p.price_amount,
    currency: p.currency,
    creditAmount: p.credit_amount,
    durationDays: p.duration_days,
    description: p.description,
    status: p.status
  }));
  res.json({ success: true, data });
}));

// Credits
router.get('/credits', asyncHandler(async (req, res) => {
  try {
    const { getTotalCredit, getActiveSubscriptions } = require('../../services/subscriptions.service');
    const subCredit = getTotalCredit(req.user.id);
    const subs = getActiveSubscriptions(req.user.id);
    const hasDuration = subs.some(s => s.package_type === 'duration' || s.package_type === 'hybrid');
    const data = { currentCredit: subCredit, hasDuration, _debug: { subs: subs.map(s => s.package_type) } };
    console.log('[creditsAPI] Response:', JSON.stringify(data));
    res.json({ success: true, data });
  } catch(e) {
    console.error('[credits] Error:', e.message, e.stack);
    res.json({ success: true, data: { currentCredit: 0, hasDuration: false } });
  }
}));

// Subscription
router.get('/subscription', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT us.*, sp.name as package_name, sp.package_type, sp.credit_amount, sp.duration_days FROM user_subscriptions us JOIN subscription_packages sp ON sp.id = us.package_id WHERE us.user_id = ?').all(req.user.id);
  const data = rows.map(s => ({
    id: s.id,
    userId: s.user_id,
    packageId: s.package_id,
    packageName: s.package_name,
    packageType: s.package_type,
    status: s.status,
    startedAt: s.started_at,
    expiresAt: s.expires_at,
    creditGranted: s.credit_granted,
    durationDays: s.duration_days,
    createdAt: s.created_at
  }));
  res.json({ success: true, data });
}));

// Payment Methods
router.get('/payment-methods', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM payment_methods WHERE status = ? ORDER BY id').all('active');
  const data = rows.map(pm => ({
    id: pm.id,
    name: pm.name,
    code: pm.code,
    type: pm.type,
    accountName: pm.account_name,
    accountNumber: pm.account_number,
    instructions: pm.instructions,
    status: pm.status
  }));
  res.json({ success: true, data });
}));

// BYOK Keys
router.get('/byok-keys', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT ubk.*, ap.name as provider_name FROM user_byok_keys ubk JOIN ai_providers ap ON ap.id = ubk.provider_id WHERE ubk.user_id = ?').all(req.user.id);
  rows.forEach(r => r.encrypted_key = undefined);
  res.json({ success: true, data: rows });
}));

router.post('/byok-keys', asyncHandler(async (req, res) => {
  const { providerId, name, apiKey } = req.body;
  if (!providerId || !name || !apiKey) throw new Error('Required');
  const now = new Date().toISOString();
  const { encryptText } = require('../../lib/crypto');
  const result = db.prepare('INSERT INTO user_byok_keys (user_id, provider_id, name, encrypted_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.user.id, providerId, name, encryptText(apiKey), 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, name, providerId } });
}));

router.patch('/byok-keys/:id', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM user_byok_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new Error('Not found');
  const { name, apiKey, status } = req.body;
  const { encryptText } = require('../../lib/crypto');
  db.prepare('UPDATE user_byok_keys SET name = ?, encrypted_key = ?, status = ?, updated_at = ? WHERE id = ?').run(name || key.name, apiKey ? encryptText(apiKey) : key.encrypted_key, status || key.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/byok-keys/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM user_byok_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
}));

router.post('/byok-keys/:id/roll', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT * FROM user_byok_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new Error('Not found');
  const crypto = require('crypto');
  const newKey = crypto.randomBytes(32).toString('hex');
  const { encryptText } = require('../../lib/crypto');
  db.prepare('UPDATE user_byok_keys SET encrypted_key = ?, updated_at = ? WHERE id = ?').run(encryptText(newKey), new Date().toISOString(), req.params.id);
  res.json({ success: true, data: { newApiKey: newKey } });
}));

router.post('/byok-keys/:id/fetch-models', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT ubk.*, ap.driver, ap.base_url FROM user_byok_keys ubk JOIN ai_providers ap ON ap.id = ubk.provider_id WHERE ubk.id = ? AND ubk.user_id = ?').get(req.params.id, req.user.id);
  if (!key) throw new Error('Not found');
  // This would call fetchModelsFromProvider - simplified response
  res.json({ success: true, data: [] });
}));

// Provider Models
router.get('/models', asyncHandler(async (req, res) => {
  const providerId = req.query.providerId;
  if (!providerId) throw new Error('providerId required');
  const rows = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? AND status = ?').all(providerId, 'active');
  const data = rows.map(m => ({
    id: m.id,
    providerId: m.provider_id,
    name: m.name,
    modelCode: m.model_code,
    isDefault: m.is_default,
    status: m.status
  }));
  res.json({ success: true, data });
}));

// Stats
router.get('/stats', asyncHandler(async (req, res) => {
  const period = req.query.period || '30d';
  let days = 30;
  if (period === '7d') days = 7;
  else if (period === '90d') days = 90;
  else if (period === 'all') days = 3650;
  
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  
  const totalGenerations = db.prepare('SELECT COUNT(*) as c FROM metadata_generations WHERE user_id = ?').get(req.user.id).c;
  const recentGenerations = db.prepare('SELECT COUNT(*) as c FROM metadata_generations WHERE user_id = ? AND created_at > ?').get(req.user.id, since).c;
  const successfulGenerations = db.prepare('SELECT COUNT(*) as c FROM metadata_generations WHERE user_id = ? AND status = ? AND created_at > ?').get(req.user.id, 'success', since).c;
  const failedGenerations = db.prepare('SELECT COUNT(*) as c FROM metadata_generations WHERE user_id = ? AND status = ? AND created_at > ?').get(req.user.id, 'failed', since).c;
  const totalCreditsUsed = db.prepare('SELECT SUM(credit_used) as c FROM metadata_generations WHERE user_id = ? AND created_at > ?').get(req.user.id, since).c || 0;
  
  const successRate = recentGenerations > 0 ? Math.round((successfulGenerations / recentGenerations) * 100) : 0;
  
  const overview = {
    totalGenerations,
    totalSuccess: successfulGenerations,
    totalFailed: failedGenerations,
    totalCreditsUsed,
    successRate
  };
  
  const generationsByDay = db.prepare(`
    SELECT DATE(created_at) as date, 
           SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
           SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
    FROM metadata_generations 
    WHERE user_id = ? AND created_at > ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(req.user.id, since);
  
  const creditsUsedByDay = db.prepare(`
    SELECT DATE(created_at) as date, SUM(credit_used) as credits
    FROM metadata_generations 
    WHERE user_id = ? AND created_at > ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(req.user.id, since);
  
  const providerBreakdown = db.prepare(`
    SELECT ap.name as provider, COUNT(*) as count
    FROM metadata_generations mg
    JOIN ai_providers ap ON ap.id = mg.provider_id
    WHERE mg.user_id = ? AND mg.created_at > ?
    GROUP BY ap.name
  `).all(req.user.id, since);
  
  const ordersByMonth = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count, SUM(price_amount) as revenue
    FROM orders 
    WHERE user_id = ? AND created_at > ?
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month
  `).all(req.user.id, since);
  
  res.json({ success: true, data: { overview, generationsByDay, creditsUsedByDay, providerBreakdown, ordersByMonth } });
}));

module.exports = router;