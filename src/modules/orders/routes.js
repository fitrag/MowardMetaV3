const express = require('express');
const { imageUpload } = require('../../utils/upload');
const { db } = require('../../db');
const { asyncHandler, AppError } = require('../../lib/http');
const { authenticate, requireRole } = require('../auth/routes');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const rows = db.prepare(`
    SELECT o.*, pm.name as payment_method_name, pm.instructions as payment_instructions,
    sp.name as package_name, sp.package_type, sp.price_amount, sp.credit_amount, sp.description as package_description
    FROM orders o 
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    LEFT JOIN subscription_packages sp ON sp.id = o.package_id
    WHERE o.user_id = ? 
    ORDER BY o.id DESC
  `).all(req.user.id);
  
  const data = rows.map(o => ({
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    priceAmount: o.price_amount,
    currency: o.currency,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    package: o.package_name ? {
      name: o.package_name,
      packageType: o.package_type,
      priceAmount: o.price_amount,
      creditAmount: o.credit_amount,
      description: o.package_description
    } : null,
    paymentMethod: o.payment_method_name ? {
      name: o.payment_method_name,
      instructions: o.payment_instructions
    } : null
  }));
  
  res.json({ success: true, data });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const o = db.prepare(`
    SELECT o.*, 
    pm.name as payment_method_name, pm.code as payment_method_code, pm.type as payment_method_type,
    pm.account_name as payment_method_account_name, pm.account_number as payment_method_account_number,
    pm.instructions as payment_instructions,
    sp.name as package_name, sp.package_type, sp.price_amount, sp.credit_amount, sp.duration_days, sp.description as package_description
    FROM orders o 
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    LEFT JOIN subscription_packages sp ON sp.id = o.package_id
    WHERE o.id = ? AND o.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!o) throw new AppError(404, 'Not found');
  
  const o2 = {
    id: o.id,
    orderNumber: o.order_number,
    status: o.status,
    notes: o.notes,
    rejectionReason: o.rejection_reason,
    priceAmount: o.price_amount,
    currency: o.currency,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    package: o.package_name ? {
      name: o.package_name,
      packageType: o.package_type,
      priceAmount: o.price_amount,
      creditAmount: o.credit_amount,
      durationDays: o.duration_days,
      description: o.package_description
    } : null,
    paymentMethod: o.payment_method_name ? {
      name: o.payment_method_name,
      code: o.payment_method_code,
      type: o.payment_method_type,
      accountName: o.payment_method_account_name,
      accountNumber: o.payment_method_account_number,
      instructions: o.payment_instructions
    } : null,
    paymentProofs: []
  };
  
  res.json({ success: true, data: o2 });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { packageId, paymentMethodId, couponCode, notes } = req.body;
  if (!packageId || !paymentMethodId) throw new AppError(400, 'Required');
  const pkg = db.prepare('SELECT * FROM subscription_packages WHERE id = ?').get(packageId);
  if (!pkg || pkg.status !== 'active') throw new AppError(400, 'Not available');
  const method = db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(paymentMethodId);
  if (!method) throw new AppError(400, 'Method not available');

  let discount = 0;
  if (couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND status = ?').get(couponCode, 'active');
    if (coupon) {
      if (coupon.discount_type === 'percentage') {
        discount = Math.floor(pkg.price_amount * coupon.discount_value / 100);
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) discount = coupon.max_discount_amount;
      } else {
        discount = coupon.discount_value;
      }
    }
  }

  const now = new Date().toISOString();
  const orderNumber = 'ORD' + Date.now() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const result = db.prepare('INSERT INTO orders (order_number, user_id, package_id, payment_method_id, package_name, package_type, price_amount, currency, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(orderNumber, req.user.id, packageId, paymentMethodId, pkg.name, pkg.package_type, pkg.price_amount, 'IDR', 'pending', notes || null, now, now);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, orderNumber, priceAmount: pkg.price_amount } });
}));

router.post('/:id/proof', imageUpload.single('file'), asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!o) throw new AppError(404, 'Not found');
  if (o.status !== 'pending') throw new AppError(400, 'Not pending');
  if (!req.file) throw new AppError(400, 'File required');
  
  const fs = require('fs');
  const path = require('path');
  const dir = './uploads/proofs';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, req.file.filename);
  
  db.prepare('INSERT INTO order_payment_proofs (order_id, file_path, original_name, mime_type, created_at) VALUES (?, ?, ?, ?, ?)').run(req.params.id, filePath, req.file.originalname, req.file.mimetype, new Date().toISOString());
  res.json({ success: true });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!o) throw new AppError(404, 'Not found');
  if (o.status !== 'pending') throw new AppError(400, 'Cannot cancel');
  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run('cancelled', new Date().toISOString(), req.params.id);
  res.json({ success: true });
}));

module.exports = router;