const express = require('express');
const { db } = require('../../db');
const { asyncHandler, AppError } = require('../../lib/http');

const router = express.Router();

// Public providers
router.get('/', asyncHandler(async (req, res) => {
  const rows = db.prepare('SELECT id, name, slug, driver, base_url, description FROM ai_providers ORDER BY id').all();
  res.json({ success: true, data: rows });
}));

module.exports = router;