const express = require('express');
const { db } = require('../../db');
const { hashPassword, verifyPassword, generateToken, verifyToken, authenticateUser, loginWithGoogle, registerUser } = require('../../services/auth.service');
const { asyncHandler, AppError } = require('../../lib/http');

const router = express.Router();

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) throw new AppError(401, 'No token');
  try {
    const token = auth.slice(7);
    const decoded = verifyToken(token);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) throw new AppError(401, 'User not found');
    req.user = user;
    next();
  } catch (e) { throw new AppError(401, 'Invalid token'); }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw new AppError(403, 'No permission');
    next();
  };
}

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError(400, 'Required');
  const r = authenticateUser(email, password);
  res.json({ success: true, data: { user: { id: r.user.id, name: r.user.name, email: r.user.email, role: r.user.role, currentCredit: r.user.current_credit }, accessToken: r.token, refreshToken: r.token } });
}));

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) throw new AppError(400, 'Required');
  const r = registerUser({ name, email, password });
  res.status(201).json({ success: true, data: { user: { id: r.user.id, name: r.user.name, email: r.user.email, role: r.user.role, currentCredit: r.user.current_credit }, accessToken: r.token, refreshToken: r.token } });
}));

router.post('/google', asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) throw new AppError(400, 'idToken required');
  const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
  const r = loginWithGoogle({ providerUserId: payload.sub, email: payload.email, name: payload.name });
  res.json({ success: true, data: { user: { id: r.user.id, name: r.user.name, email: r.user.email, role: r.user.role, currentCredit: r.user.current_credit }, accessToken: r.token, refreshToken: r.token } });
}));

router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, currentCredit: req.user.current_credit, status: req.user.status, accountType: req.user.account_type } });
}));

router.patch('/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const now = new Date().toISOString();
  if (newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, req.user.password_hash)) throw new AppError(400, 'Wrong password');
    db.prepare('UPDATE users SET name = ?, password_hash = ?, updated_at = ? WHERE id = ?').run(name || req.user.name, hashPassword(newPassword), now, req.user.id);
  } else {
    db.prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?').run(name || req.user.name, now, req.user.id);
  }
  res.json({ success: true });
}));

router.get('/credits', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { currentCredit: req.user.current_credit } });
}));

router.get('/subscription', authenticate, asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT us.*, sp.name as package_name, sp.package_type, sp.credit_amount, sp.duration_days FROM user_subscriptions us JOIN subscription_packages sp ON sp.id = us.package_id WHERE us.user_id = ?').all(req.user.id);
  res.json({ success: true, data: rows });
}));

router.get('/packages', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT * FROM subscription_packages WHERE status = ? ORDER BY price_amount ASC').all('active');
  res.json({ success: true, data: rows });
}));

router.get('/settings', asyncHandler(async (req, res) => {
  const { getPublicSettings } = require('../../services/settings.service');
  res.json({ success: true, data: getPublicSettings() });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out' });
}));

module.exports = router;
module.exports.authenticate = authenticate;
module.exports.requireRole = requireRole;