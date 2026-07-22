const db = require('../db/database');

function getAll() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  return rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});
}

function get(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

/** Upserts multiple settings at once from a flat key-value object. */
function updateMany(obj) {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);
  const txn = db.transaction((entries) => {
    for (const [k, v] of entries) upsert.run(k, String(v));
  });
  txn(Object.entries(obj));
  return getAll();
}

module.exports = { getAll, get, updateMany };
