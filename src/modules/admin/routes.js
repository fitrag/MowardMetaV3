const express = require('express');
const { db } = require('../../db');
const { asyncHandler, AppError } = require('../../lib/http');
const { authenticate, requireRole } = require('../auth/routes');
const { encryptText, decryptText } = require('../../lib/crypto');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('admin', 'operator'));

// Dashboard
router.get('/dashboard-summary', asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active').count;
  const providers = db.prepare('SELECT COUNT(*) as count FROM ai_providers WHERE status = ?').get('active').count;
  const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending').count;
  const generations = db.prepare('SELECT COUNT(*) as count FROM metadata_generations WHERE created_at > ?').get(thirtyDaysAgo).count;
  const credits = db.prepare('SELECT SUM(current_credit) as total FROM users').get().total || 0;

  res.json({ success: true, data: { userCount: users, activeUsers, providerCount: providers, orderCount: orders, pendingOrders, generationCount: generations, totalCredits: credits } });
}));

// Providers
router.get('/providers', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT ap.*, (SELECT COUNT(*) FROM provider_models WHERE provider_id = ap.id) as model_count FROM ai_providers ap ORDER BY ap.id').all();
  res.json({ success: true, data: rows });
}));

router.get('/providers/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Provider not found');
  const models = db.prepare('SELECT * FROM provider_models WHERE provider_id = ?').all(req.params.id);
  res.json({ success: true, data: { ...p, models } });
}));

router.get('/providers/:id/models', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM provider_models WHERE provider_id = ?').all(req.params.id);
  res.json({ success: true, data: rows });
}));

router.post('/providers/:id/models', asyncHandler(async (req, res) => {
  const { name, modelCode, isDefault } = req.body;
  if (!name || !modelCode) throw new AppError(400, 'Required');
  const existing = db.prepare('SELECT id FROM provider_models WHERE provider_id = ? AND model_code = ?').get(req.params.id, modelCode);
  if (existing) throw new AppError(400, 'Model already exists');
  if (isDefault) db.prepare('UPDATE provider_models SET is_default = 0 WHERE provider_id = ?').run(req.params.id);
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO provider_models (provider_id, name, model_code, is_default, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, name, modelCode, isDefault ? 1 : 0, 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/provider-models/:id', asyncHandler(async (req, res) => {
  const m = db.prepare('SELECT * FROM provider_models WHERE id = ?').get(req.params.id);
  if (!m) throw new AppError(404, 'Not found');
  const { name, modelCode, isDefault, status } = req.body;
  if (isDefault) db.prepare('UPDATE provider_models SET is_default = 0 WHERE provider_id = ?').run(m.provider_id);
  db.prepare('UPDATE provider_models SET name = ?, model_code = ?, is_default = ?, status = ?, updated_at = ? WHERE id = ?').run(name || m.name, modelCode || m.model_code, isDefault ? 1 : m.is_default, status || m.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/provider-models/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM provider_models WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

router.post('/providers/:id/models/fetch', asyncHandler(async (req, res) => {
  const { fetchModelsFromProvider } = require('../../services/generation.service');
  const providerId = parseInt(req.params.id);
  
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(providerId);
  if (!p) throw new AppError(404, 'Provider not found');
  
  const key = db.prepare('SELECT encrypted_key FROM system_api_keys WHERE provider_id = ? AND status = ? ORDER BY id').get(p.id, 'active');
  if (!key) {
    res.json({ success: true, data: [], message: 'No API key configured for this provider' });
    return;
  }
  
  const { decryptText } = require('../../lib/crypto');
  const apiKey = decryptText(key.encrypted_key);
  try {
    const models = await fetchModelsFromProvider(p.id, apiKey);
    res.json({ success: true, data: models });
  } catch (e) {
    throw new AppError(400, e.message);
  }
}));

router.post('/providers', asyncHandler(async (req, res) => {
  const { name, slug, driver, base_url, description } = req.body;
  if (!name || !slug || !driver) throw new AppError(400, 'Required fields missing');
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO ai_providers (name, slug, driver, base_url, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(name, slug, driver, base_url || null, description || null, 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/providers/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Not found');
  const { name, slug, driver, base_url, description, status } = req.body;
  db.prepare('UPDATE ai_providers SET name = ?, slug = ?, driver = ?, base_url = ?, description = ?, status = ?, updated_at = ? WHERE id = ?').run(name || p.name, slug || p.slug, driver || p.driver, base_url || p.base_url, description || p.description, status || p.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/providers/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM ai_providers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// API Keys
router.get('/api-keys', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT sak.*, ap.name as provider_name FROM system_api_keys sak JOIN ai_providers ap ON ap.id = sak.provider_id ORDER BY sak.id DESC').all();
  const data = rows.map(k => ({
    id: k.id,
    providerId: k.provider_id,
    providerName: k.provider_name,
    name: k.name,
    status: k.status,
    usageCount: k.usage_count,
    lastUsedAt: k.last_used_at,
    errorCount: k.error_count,
    lastErrorAt: k.last_error_at,
    cooldownUntil: k.cooldown_until,
    isRateLimited: k.is_rate_limited,
    createdAt: k.created_at
  }));
  res.json({ success: true, data });
}));

router.get('/api-keys/:id', asyncHandler(async (req, res) => {
  const key = db.prepare('SELECT sak.*, ap.name as provider_name FROM system_api_keys sak JOIN ai_providers ap ON ap.id = sak.provider_id WHERE sak.id = ?').get(req.params.id);
  if (!key) throw new AppError(404, 'Not found');
  res.json({ success: true, data: key });
}));

router.post('/api-keys', asyncHandler(async (req, res) => {
  const { providerId, name, apiKey, status } = req.body;
  if (!providerId || !name || !apiKey) throw new AppError(400, 'Required');
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO system_api_keys (provider_id, name, encrypted_key, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(providerId, name, encryptText(apiKey), status || 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, name, providerId, status: status || 'active', key: apiKey } });
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

// Packages
router.get('/packages', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM subscription_packages ORDER BY price_amount ASC').all();
  const data = rows.map(p => ({
    id: p.id,
    name: p.name,
    packageType: p.package_type,
    priceAmount: p.price_amount,
    currency: p.currency,
    creditAmount: p.credit_amount,
    durationDays: p.duration_days,
    description: p.description,
    status: p.status,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));
  res.json({ success: true, data });
}));

router.get('/packages/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM subscription_packages WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Not found');
  res.json({ success: true, data: p });
}));

router.post('/packages', asyncHandler(async (req, res) => {
  const { name, package_type, price_amount, credit_amount, duration_days, description, status } = req.body;
  if (!name || !package_type || !price_amount) throw new AppError(400, 'Required');
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO subscription_packages (name, package_type, price_amount, credit_amount, duration_days, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, package_type, price_amount, credit_amount || 0, duration_days || 0, description || null, status || 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/packages/:id', asyncHandler(async (req, res) => {
  const p = db.prepare('SELECT * FROM subscription_packages WHERE id = ?').get(req.params.id);
  if (!p) throw new AppError(404, 'Not found');
  const { name, package_type, price_amount, credit_amount, duration_days, description, status } = req.body;
  db.prepare('UPDATE subscription_packages SET name = ?, package_type = ?, price_amount = ?, credit_amount = ?, duration_days = ?, description = ?, status = ?, updated_at = ? WHERE id = ?').run(name || p.name, package_type || p.package_type, price_amount || p.price_amount, credit_amount ?? p.credit_amount, duration_days ?? p.duration_days, description || p.description, status || p.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/packages/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM subscription_packages WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Subscriptions
router.get('/subscriptions', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT us.*, sp.name as package_name, u.email as user_email FROM user_subscriptions us JOIN subscription_packages sp ON sp.id = us.package_id JOIN users u ON u.id = us.user_id ORDER BY us.id DESC').all();
  res.json({ success: true, data: rows });
}));

router.get('/subscriptions/:id', asyncHandler(async (req, res) => {
  const s = db.prepare('SELECT us.*, sp.name as package_name, u.email as user_email FROM user_subscriptions us JOIN subscription_packages sp ON sp.id = us.package_id JOIN users u ON u.id = us.user_id WHERE us.id = ?').get(req.params.id);
  if (!s) throw new AppError(404, 'Not found');
  res.json({ success: true, data: s });
}));

// Payment Methods
router.get('/payment-methods', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM payment_methods ORDER BY id').all();
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

router.post('/payment-methods', asyncHandler(async (req, res) => {
  const { name, code, type, account_name, account_number, instructions, status } = req.body;
  if (!name || !code || !type) throw new AppError(400, 'Required');
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO payment_methods (name, code, type, account_name, account_number, instructions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(name, code, type, account_name || null, account_number || null, instructions || null, status || 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/payment-methods/:id', asyncHandler(async (req, res) => {
  const pm = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(req.params.id);
  if (!pm) throw new AppError(404, 'Not found');
  const { name, code, type, account_name, account_number, instructions, status } = req.body;
  db.prepare('UPDATE payment_methods SET name = ?, code = ?, type = ?, account_name = ?, account_number = ?, instructions = ?, status = ?, updated_at = ? WHERE id = ?').run(name || pm.name, code || pm.code, type || pm.type, account_name || pm.account_name, account_number || pm.account_number, instructions || pm.instructions, status || pm.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.delete('/payment-methods/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Orders
router.get('/orders', asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, 
    u.name as user_name, u.email as user_email, 
    pm.name as payment_method_name,
    sp.name as package_name, sp.package_type, sp.price_amount
    FROM orders o 
    JOIN users u ON u.id = o.user_id 
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    LEFT JOIN subscription_packages sp ON sp.id = o.package_id
    ORDER BY o.id DESC
  `).all();
  
  const data = rows.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    priceAmount: o.price_amount,
    currency: o.currency,
    discountAmount: 0,
    createdAt: o.created_at,
    user: { id: o.user_id, name: o.user_name, email: o.user_email },
    package: o.package_name ? { id: o.package_id, name: o.package_name, packageType: o.package_type } : null,
    paymentMethod: o.payment_method_name ? { name: o.payment_method_name } : null
  }));
  
  res.json({ success: true, data });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const o = db.prepare(`
    SELECT o.*, 
    u.name as user_name, u.email as user_email,
    pm.name as payment_method_name, pm.code as payment_method_code, pm.type as payment_method_type,
    pm.account_name as payment_method_account_name, pm.account_number as payment_method_account_number,
    pm.instructions as payment_instructions,
    sp.name as package_name, sp.package_type, sp.price_amount, sp.credit_amount, sp.duration_days, sp.description as package_description
    FROM orders o 
    JOIN users u ON u.id = o.user_id 
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    LEFT JOIN subscription_packages sp ON sp.id = o.package_id
    WHERE o.id = ?
  `).get(req.params.id);
  if (!o) throw new AppError(404, 'Order not found');
  
  const order = {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    notes: o.notes,
    rejectionReason: o.rejection_reason,
    priceAmount: o.price_amount,
    currency: o.currency,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    user: {
      id: o.user_id,
      name: o.user_name,
      email: o.user_email
    },
    package: o.package_name ? {
      id: o.package_id,
      name: o.package_name,
      packageType: o.package_type,
      priceAmount: o.price_amount,
      creditAmount: o.credit_amount,
      durationDays: o.duration_days,
      description: o.package_description
    } : null,
    paymentMethod: o.payment_method_name ? {
      id: o.payment_method_id,
      name: o.payment_method_name,
      code: o.payment_method_code,
      type: o.payment_method_type,
      accountName: o.payment_method_account_name,
      accountNumber: o.payment_method_account_number,
      instructions: o.payment_instructions
    } : null
  };
  
  res.json({ success: true, data: order });
}));

router.patch('/orders/:id', asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) throw new AppError(404, 'Not found');
  const { status, notes } = req.body;
  db.prepare('UPDATE orders SET status = ?, notes = ?, updated_at = ? WHERE id = ?').run(status || o.status, notes || o.notes, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

router.post('/sync-account-types', asyncHandler(async (req, res) => {
  const now = new Date().toISOString();
  
  const durationSubs = db.prepare(`
    SELECT DISTINCT user_id FROM user_subscriptions 
    WHERE status = 'active' AND package_type IN ('duration', 'byok') 
    AND (expires_at IS NULL OR expires_at > ?)
  `).all(now);
  
  for (const s of durationSubs) {
    db.prepare('UPDATE users SET account_type = ?, updated_at = ? WHERE id = ?').run('subscription', now, s.user_id);
  }
  
  res.json({ success: true, data: { synced: durationSubs.length } });
}));

router.post('/migrate-subscriptions', asyncHandler(async (req, res) => {
  const approvedOrders = db.prepare(`
    SELECT o.*, sp.package_type, sp.credit_amount, sp.duration_days
    FROM orders o
    JOIN subscription_packages sp ON sp.id = o.package_id
    WHERE o.status = 'approved'
  `).all();
  
  const now = new Date().toISOString();
  let count = 0;
  
  for (const o of approvedOrders) {
    const existing = db.prepare('SELECT id FROM user_subscriptions WHERE user_id = ? AND package_id = ?').get(o.user_id, o.package_id);
    if (existing) continue;
    
    let expiresAt = null;
    if (o.package_type === 'duration' || o.package_type === 'byok') {
      expiresAt = new Date(Date.now() + (o.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
    }
    
    db.prepare('INSERT INTO user_subscriptions (user_id, package_id, package_type, status, started_at, expires_at, credit_granted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(o.user_id, o.package_id, o.package_type, 'active', now, expiresAt, o.credit_amount || 0, now, now);
    
    if (o.package_type === 'credit' && o.credit_amount > 0) {
      db.prepare('UPDATE users SET current_credit = current_credit + ?, updated_at = ? WHERE id = ?').run(o.credit_amount, now, o.user_id);
    }
    
    if (o.package_type === 'duration' || o.package_type === 'byok') {
      db.prepare('UPDATE users SET account_type = ?, updated_at = ? WHERE id = ?').run('subscription', now, o.user_id);
    }
    
    count++;
  }
  
  res.json({ success: true, data: { migrated: count } });
}));

router.patch('/orders/:id/approve', asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) throw new AppError(404, 'Not found');
  if (o.status !== 'pending') throw new AppError(400, 'Order not pending');
  
  const pkg = db.prepare('SELECT * FROM subscription_packages WHERE id = ?').get(o.package_id);
  if (!pkg) throw new AppError(404, 'Package not found');
  
  const now = new Date().toISOString();
  let expiresAt = null;
  let creditToAdd = 0;
  
  // Calculate expiration and credit based on package type
  if (pkg.package_type === 'credit') {
    creditToAdd = pkg.credit_amount || 0;
    // Credit packages expire in 1 year
    expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  } else if (pkg.package_type === 'duration') {
    // Duration packages: 1-12 months
    expiresAt = new Date(Date.now() + (pkg.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
  } else if (pkg.package_type === 'byok') {
    // BYOK: duration + brings own API key
    expiresAt = new Date(Date.now() + (pkg.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
  } else if (pkg.package_type === 'hybrid') {
    // Hybrid: credit + duration
    creditToAdd = pkg.credit_amount || 0;
    expiresAt = new Date(Date.now() + (pkg.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Create subscription record
  db.prepare(`
    INSERT INTO user_subscriptions 
    (user_id, package_id, package_type, status, started_at, expires_at, credit_granted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(o.user_id, o.package_id, pkg.package_type, 'active', now, expiresAt, creditToAdd, now, now);
  
  // Add credit if any
  if (creditToAdd > 0) {
    db.prepare('UPDATE users SET current_credit = current_credit + ?, updated_at = ? WHERE id = ?')
      .run(creditToAdd, now, o.user_id);
  }
  
  // Update user to subscription account type (for any non-credit package)
  if (pkg.package_type !== 'credit') {
    db.prepare('UPDATE users SET account_type = ?, updated_at = ? WHERE id = ?')
      .run('subscription', now, o.user_id);
  }
  
  // Update order status
  db.prepare('UPDATE orders SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?')
    .run('approved', req.user.id, now, now, req.params.id);
  
  res.json({ success: true });
}));

router.patch('/orders/:id/reject', asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) throw new AppError(404, 'Not found');
  const { rejectionReason } = req.body;
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?').run('rejected', rejectionReason || null, now, req.params.id);
  res.json({ success: true });
}));

// Users
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const rows = db.prepare('SELECT id, name, email, role, status, account_type, current_credit, created_at FROM users ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, offset);
  const data = rows.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    accountType: u.account_type,
    currentCredit: u.current_credit,
    createdAt: u.created_at
  }));
  res.json({ success: true, data });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) throw new AppError(404, 'User not found');
  const subs = db.prepare('SELECT us.*, sp.name as package_name FROM user_subscriptions us JOIN subscription_packages sp ON sp.id = us.package_id WHERE us.user_id = ?').all(req.params.id);
  const ords = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 10').all(req.params.id);
  res.json({ success: true, data: { ...u, subscriptions: subs, orders: ords } });
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) throw new AppError(404, 'Not found');
  const { name, email, role, status, currentCredit } = req.body;
  const now = new Date().toISOString();
  if (currentCredit !== undefined) {
    db.prepare('UPDATE users SET current_credit = ?, updated_at = ? WHERE id = ?').run(currentCredit, now, req.params.id);
  }
  db.prepare('UPDATE users SET name = ?, email = ?, role = ?, status = ?, updated_at = ? WHERE id = ?').run(name || u.name, email || u.email, role || u.role, status || u.status, now, req.params.id);
  res.json({ success: true });
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Coupons
router.get('/coupons', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
  const data = rows.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    minPurchaseAmount: c.min_purchase_amount,
    maxDiscountAmount: c.max_discount_amount,
    usageLimit: c.usage_limit,
    usageCount: c.usage_count,
    usageLimitPerUser: c.usage_limit_per_user,
    validFrom: c.valid_from,
    validUntil: c.valid_until,
    status: c.status,
    description: c.description
  }));
  res.json({ success: true, data });
}));

router.post('/coupons', asyncHandler(async (req, res) => {
  const { code, name, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until, description, status } = req.body;
  if (!code || !name || !discount_type || discount_value === undefined) throw new AppError(400, 'Required');
  const now = new Date().toISOString();
  const result = db.prepare('INSERT INTO coupons (code, name, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, valid_from, valid_until, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(code, name, discount_type, discount_value, min_purchase_amount || 0, max_discount_amount || null, usage_limit || null, valid_from || null, valid_until || null, description || null, status || 'active', now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/coupons/:id', asyncHandler(async (req, res) => {
  const c = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!c) throw new AppError(404, 'Not found');
  const { status } = req.body;
  db.prepare('UPDATE coupons SET status = ?, updated_at = ? WHERE id = ?').run(status || c.status, new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

// Settings
router.get('/settings', asyncHandler(async (req, res) => {
  const { getSettings } = require('../../services/settings.service');
  const groups = db.prepare('SELECT DISTINCT group_key FROM app_settings ORDER BY sort_order').all();
  const data = groups.map(g => ({ group: g.group_key, settings: getSettings(g.group_key) }));
  res.json({ success: true, data });
}));

router.patch('/settings/:key', asyncHandler(async (req, res) => {
  console.log('[Admin] Updating setting:', req.params.key, 'value:', req.body.value);
  const { updateSetting } = require('../../services/settings.service');
  const { value } = req.body;
  if (value === undefined) throw new AppError(400, 'value required');
  const ok = updateSetting(req.params.key, value, req.user.id);
  if (!ok) throw new AppError(400, 'Setting not editable');
  res.json({ success: true });
}));

module.exports = router;