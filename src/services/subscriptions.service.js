const { db } = require('../db');

function checkExpiredSubscriptions() {
  const now = new Date().toISOString();
  
  const expiredSubs = db.prepare(`
    SELECT us.*, u.email as user_email
    FROM user_subscriptions us
    JOIN users u ON u.id = us.user_id
    WHERE us.status = 'active' 
      AND us.expires_at IS NOT NULL 
      AND us.expires_at < ?
  `).all(now);

  if (expiredSubs.length === 0) {
    return { checked: 0, updated: 0 };
  }

  let updated = 0;
  
  for (const sub of expiredSubs) {
    db.prepare('UPDATE user_subscriptions SET status = ?, updated_at = ? WHERE id = ?')
      .run('expired', now, sub.id);
    
    const otherActive = db.prepare(`
      SELECT COUNT(*) as cnt FROM user_subscriptions
      WHERE user_id = ? AND status = 'active' 
        AND (expires_at IS NULL OR expires_at > ?)
    `).get(sub.user_id, now);

    if (otherActive.cnt === 0) {
      db.prepare('UPDATE users SET account_type = ?, updated_at = ? WHERE id = ?')
        .run('free', now, sub.user_id);
      console.log(`[Subscription] User ${sub.user_id} downgraded to free`);
      updated++;
    }
  }

  console.log(`[Subscription] Checked ${expiredSubs.length}, downgraded ${updated}`);
  return { checked: expiredSubs.length, updated };
}

function getActiveSubscriptions(userId) {
  const now = new Date().toISOString();
  
  return db.prepare(`
    SELECT us.*, sp.name as package_name, sp.package_type, sp.credit_amount, sp.duration_days
    FROM user_subscriptions us
    JOIN subscription_packages sp ON sp.id = us.package_id
    WHERE us.user_id = ? AND us.status = 'active'
      AND (us.expires_at IS NULL OR us.expires_at > ?)
    ORDER BY us.created_at DESC
  `).all(userId, now);
}

function hasActiveSubscription(userId, types = null) {
  const now = new Date().toISOString();
  
  let sql = `
    SELECT COUNT(*) as cnt FROM user_subscriptions
    WHERE user_id = ? AND status = 'active'
      AND (expires_at IS NULL OR expires_at > ?)
  `;
  
  const params = [userId, now];
  
  if (types && types.length > 0) {
    const placeholders = types.map(() => '?').join(',');
    sql += ` AND package_type IN (${placeholders})`;
    params.push(...types);
  }
  
  const result = db.prepare(sql).get(...params);
  return result.cnt > 0;
}

// ====== CREDIT MANAGEMENT ======

function getTotalCredit(userId) {
  // Get all credit from credit and hybrid packages (not expired)
  const now = new Date().toISOString();
  
  const subs = db.prepare(`
    SELECT package_type, credit_granted, credit_used
    FROM user_subscriptions
    WHERE user_id = ? 
      AND status = 'active'
      AND credit_granted > 0
      AND (expires_at IS NULL OR expires_at > ?)
  `).all(userId, now);

  let total = 0;
  for (const sub of subs) {
    const remaining = sub.credit_granted - (sub.credit_used || 0);
    total += Math.max(0, remaining);
  }

  console.log('[Credit] User', userId, 'total credit:', total);
  return total;
}

function getAllCreditPackages(userId) {
  return db.prepare(`
    SELECT id, credit_granted, credit_used, package_type, expires_at
    FROM user_subscriptions
    WHERE user_id = ? 
      AND credit_granted > 0
    ORDER BY 
      CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END,
      expires_at ASC
  `).all(userId);
}

function consumeCredit(userId, amount) {
  // Consume credit from oldest packages first
  const packages = getAllCreditPackages(userId);
  
  let remaining = amount;
  const now = new Date().toISOString();
  
  for (const pkg of packages) {
    if (remaining <= 0) break;
    
    const used = pkg.credit_used || 0;
    const available = pkg.credit_granted - used;
    
    if (available <= 0) continue;
    
    const toConsume = Math.min(available, remaining);
    const newUsed = used + toConsume;
    
    db.prepare('UPDATE user_subscriptions SET credit_used = ?, updated_at = ? WHERE id = ?')
      .run(newUsed, now, pkg.id);
    
    // Also update user's total credit
    db.prepare('UPDATE users SET current_credit = current_credit - ?, updated_at = ? WHERE id = ?')
      .run(toConsume, now, userId);
    
    remaining -= toConsume;
    console.log('[Credit] Consumed', toConsume, 'from subscription', pkg.id);
  }

  const success = remaining === 0;
  if (!success) {
    console.log('[Credit] Warning: Could not consume full amount. Remaining:', remaining);
  }
  return success;
}

function addCredit(userId, amount, subscriptionId = null) {
  // Add credit to user (called when admin approves credit package order)
  const now = new Date().toISOString();
  
  // Update user's credit balance
  db.prepare('UPDATE users SET current_credit = current_credit + ?, updated_at = ? WHERE id = ?')
    .run(amount, now, userId);
  
  console.log('[Credit] Added', amount, 'credit to user', userId);
  return true;
}

function refundCredit(userId, amount) {
  // Refund credit to oldest active subscription (if generation failed after consuming)
  const packages = db.prepare(`
    SELECT id, credit_used
    FROM user_subscriptions
    WHERE user_id = ?
      AND status = 'active'
      AND credit_granted > 0
      AND credit_used > 0
    ORDER BY created_at ASC
    LIMIT 1
  `).get(userId);

  if (!packages) return false;

  const now = new Date().toISOString();
  const newUsed = Math.max(0, packages.credit_used - amount);
  db.prepare('UPDATE user_subscriptions SET credit_used = ?, updated_at = ? WHERE id = ?')
    .run(newUsed, now, packages.id);

  console.log('[Credit] Refunded', amount, 'to subscription', packages.id);
  return true;
}

module.exports = {
  checkExpiredSubscriptions,
  getActiveSubscriptions,
  hasActiveSubscription,
  getTotalCredit,
  getAllCreditPackages,
  consumeCredit,
  refundCredit
};