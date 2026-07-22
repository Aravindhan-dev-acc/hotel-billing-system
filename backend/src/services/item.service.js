const db = require('../db/database');
const { AppError } = require('../middleware/error.middleware');

function list({ page = 1, limit = 20, search = '', category = '', availableOnly = false }) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (page - 1) * limit;

  const where = [];
  const params = {};

  if (search) {
    where.push('(name LIKE @search OR item_code LIKE @search)');
    params.search = `%${search}%`;
  }
  if (category) {
    where.push('category = @category');
    params.category = category;
  }
  if (availableOnly === true || availableOnly === 'true') {
    where.push('is_available = 1');
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS c FROM items ${whereClause}`).get(params).c;
  const rows = db
    .prepare(`SELECT * FROM items ${whereClause} ORDER BY name ASC LIMIT @limit OFFSET @offset`)
    .all({ ...params, limit, offset });

  return {
    data: rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

function getById(id) {
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
}

function create(data) {
  const existing = db.prepare('SELECT id FROM items WHERE item_code = ?').get(data.itemCode);
  if (existing) throw new AppError('An item with this code already exists.', 409);

  const result = db
    .prepare(
      `INSERT INTO items (item_code, name, category, price, tax_percent, is_available)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      data.itemCode,
      data.name,
      data.category || 'General',
      data.price,
      data.taxPercent || 0,
      data.isAvailable === undefined ? 1 : data.isAvailable ? 1 : 0
    );
  return getById(result.lastInsertRowid);
}

function update(id, data) {
  getById(id); // throws if not found
  db.prepare(
    `UPDATE items SET item_code = ?, name = ?, category = ?, price = ?, tax_percent = ?,
     is_available = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(
    data.itemCode,
    data.name,
    data.category || 'General',
    data.price,
    data.taxPercent || 0,
    data.isAvailable ? 1 : 0,
    id
  );
  return getById(id);
}

function remove(id) {
  getById(id);
  const usedInBills = db.prepare('SELECT COUNT(*) AS c FROM bill_items WHERE item_id = ?').get(id).c;
  if (usedInBills > 0) {
    // Soft-disable instead of hard delete to preserve historical bill integrity
    db.prepare("UPDATE items SET is_available = 0, updated_at = datetime('now') WHERE id = ?").run(id);
    return { softDeleted: true };
  }
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  return { softDeleted: false };
}

function listCategories() {
  return db.prepare('SELECT DISTINCT category FROM items ORDER BY category ASC').all().map((r) => r.category);
}

module.exports = { list, getById, create, update, remove, listCategories };
