const { db } = require('../db');

function logAudit({ actorUserId, action, entityType, entityId, payload }) {
  try {
    const payloadJson = payload ? JSON.stringify(payload) : null;
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(actorUserId, action, entityType, entityId, payloadJson, now);
  } catch (e) {
    console.log('[Audit] Error:', e.message);
  }
}

module.exports = { logAudit };