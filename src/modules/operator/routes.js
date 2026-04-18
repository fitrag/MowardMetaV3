const express = require('express');
const { db } = require('../../db');
const { asyncHandler, AppError } = require('../../lib/http');
const { authenticate, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('operator', 'admin'));

router.get('/dashboard-summary', asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE status = ?').get('active').count;
  const orders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending').count;
  const generations = db.prepare('SELECT COUNT(*) as count FROM metadata_generations WHERE created_at > ?').get(thirtyDaysAgo).count;

  res.json({ success: true, data: { users, activeUsers, orders, pendingOrders, generations } });
}));

router.get('/orders', asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email, pm.name as payment_method_name, sp.name as package_name, sp.package_type
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
    notes: o.notes,
    rejectionReason: o.rejection_reason,
    priceAmount: o.price_amount,
    currency: o.currency,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    user: { id: o.user_id, name: o.user_name, email: o.user_email },
    package: o.package_name ? { id: o.package_id, name: o.package_name, packageType: o.package_type } : null,
    paymentMethod: o.payment_method_name ? { name: o.payment_method_name } : null
  }));
  res.json({ success: true, data });
}));

router.get('/orders/:id', asyncHandler(async (req, res) => {
  const o = db.prepare(`
    SELECT o.*, u.name as user_name, u.email as user_email, pm.name as payment_method_name 
    FROM orders o 
    JOIN users u ON u.id = o.user_id 
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id 
    WHERE o.id = ?
  `).get(req.params.id);
  if (!o) throw new AppError(404, 'Order not found');
  res.json({ success: true, data: o });
}));

router.patch('/orders/:id/approve', asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) throw new AppError(404, 'Order not found');
  
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE id = ?').run('approved', req.user.id, now, now, req.params.id);
  res.json({ success: true });
}));

router.patch('/orders/:id/reject', asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) throw new AppError(404, 'Order not found');
  
  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = ?, rejection_reason = ?, updated_at = ? WHERE id = ?').run('rejected', rejectionReason, now, req.params.id);
  res.json({ success: true });
}));

router.get('/users', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT id, name, email, role, status, current_credit, created_at FROM users ORDER BY id DESC').all();
  res.json({ success: true, data: rows });
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) throw new AppError(404, 'User not found');
  res.json({ success: true, data: u });
}));

router.get('/generations', asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT mg.*, u.name as user_name, ap.name as provider_name 
    FROM metadata_generations mg 
    JOIN users u ON u.id = mg.user_id 
    JOIN ai_providers ap ON ap.id = mg.provider_id 
    ORDER BY mg.id DESC LIMIT 100
  `).all();
  res.json({ success: true, data: rows });
}));

module.exports = router;