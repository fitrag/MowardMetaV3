const crypto = require('crypto');
const env = require('../config/env');

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const secret = env.encryptionSecret || 'default-32-char-secret-key-here!!';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptText(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decryptText(encryptedData) {
  if (!encryptedData) return '';
  try {
    const data = Buffer.from(encryptedData, 'base64');
    const iv = data.subarray(0, IV_LEN);
    const tag = data.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const text = data.subarray(IV_LEN + TAG_LEN);
    const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(text) + decipher.final('utf8');
  } catch (e) {
    console.error('Decrypt error:', e.message);
    return '';
  }
}

module.exports = { encryptText, decryptText };