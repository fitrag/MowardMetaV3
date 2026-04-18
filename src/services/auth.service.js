const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { db } = require('../db');

const JWT_EXPIRES = '7d';
const cache = new Map();

function cacheGet(key) {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) return item.value;
  cache.delete(key);
  return null;
}

function cacheSet(key, value, ttl = 60000) {
  cache.set(key, { value, expires: Date.now() + ttl });
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.jwtSecret,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function authenticateUser(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user || user.status !== 'active') {
    throw new Error('Invalid credentials');
  }
  if (!verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid credentials');
  }
  
  const token = generateToken(user);
  return { user, token };
}

function loginWithGoogle(googleUser) {
  let oauth = db.prepare('SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?').get('google', googleUser.providerUserId);
  
  if (oauth) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(oauth.user_id);
    if (user && user.status === 'active') {
      return { user, token: generateToken(user) };
    }
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(googleUser.email);
  if (existing) {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      existing.id, 'google', googleUser.providerUserId, googleUser.email, JSON.stringify(googleUser), now, now
    );
    return { user: existing, token: generateToken(existing) };
  }

  const now = new Date().toISOString();
  const name = googleUser.name || googleUser.email.split('@')[0];
  const passwordHash = hashPassword(Date.now().toString(36));
  
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role, status, account_type, current_credit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    name, googleUser.email, passwordHash, 'user', 'active', 'subscription', 10, now, now
  );

  db.prepare('INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, profile_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    result.lastInsertRowid, 'google', googleUser.providerUserId, googleUser.email, JSON.stringify(googleUser), now, now
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  return { user, token: generateToken(user) };
}

function registerUser({ name, email, password, role = 'user' }) {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);
  const result = db.prepare('INSERT INTO users (name, email, password_hash, role, status, account_type, current_credit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    name, email, passwordHash, role, 'active', 'free', 0, now, now
  );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = generateToken(user);
  return { user, token };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateUser,
  loginWithGoogle,
  registerUser,
  cacheGet,
  cacheSet
};