const { db } = require('../db');

function getSetting(key, defaultValue) {
  const row = db.prepare('SELECT value_text, value_type FROM app_settings WHERE setting_key = ?').get(key);
  if (!row) return defaultValue ?? null;
  switch (row.value_type) {
    case 'number': return parseFloat(row.value_text);
    case 'boolean': return row.value_text === 'true';
    case 'json': try { return JSON.parse(row.value_text); } catch { return defaultValue; }
    default: return row.value_text || defaultValue;
  }
}

function getSettings(group) {
  const rows = db.prepare('SELECT * FROM app_settings WHERE group_key = ? ORDER BY sort_order').all(group);
  return rows.map(r => ({
    id: r.id, group: r.group_key, key: r.setting_key,
    value: getSettingRaw(r), type: r.value_type,
    isPublic: r.is_public === 1, isEditable: r.is_editable === 1,
    description: r.description, sortOrder: r.sort_order
  }));
}

function getSettingRaw(row) {
  if (!row) return null;
  if (row.value_type === 'number') return parseFloat(row.value_text);
  if (row.value_type === 'boolean') return row.value_text === 'true';
  if (row.value_type === 'json') try { return JSON.parse(row.value_text); } catch { return null; }
  return row.value_text;
}

function getPublicSettings() {
  const rows = db.prepare('SELECT * FROM app_settings ORDER BY sort_order').all();
  return rows.map(r => ({ settingKey: r.setting_key, value: getSettingRaw(r), valueType: r.value_type }));
}

function updateSetting(key, value, userId) {
  const row = db.prepare('SELECT * FROM app_settings WHERE setting_key = ?').get(key);
  if (!row || !row.is_editable) return false;

  let valueText;
  if (typeof value === 'object') valueText = JSON.stringify(value);
  else valueText = String(value);

  const now = new Date().toISOString();
  db.prepare('UPDATE app_settings SET value_text = ?, updated_at = ? WHERE id = ?').run(valueText, now, row.id);
  db.prepare('INSERT INTO app_settings_history (setting_id, old_value_text, new_value_text, changed_by, created_at) VALUES (?, ?, ?, ?, ?)').run(row.id, row.value_text, valueText, userId, now);

  return true;
}

module.exports = { getSetting, getSettings, getPublicSettings, updateSetting };