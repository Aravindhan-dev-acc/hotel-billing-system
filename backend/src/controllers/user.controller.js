const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

const list = asyncHandler(async (req, res) => {
  const users = db
    .prepare('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ success: true, data: users });
});

const create = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new AppError('A user with this email already exists.', 409);

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, hash, role);

  const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: user });
});

const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, role, isActive } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  db.prepare(
    "UPDATE users SET name = ?, role = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name ?? user.name, role ?? user.role, isActive === undefined ? user.is_active : (isActive ? 1 : 0), id);

  const updated = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new AppError('User not found.', 404);

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, id);
  res.json({ success: true, message: 'Password reset successfully.' });
});

module.exports = { list, create, update, resetPassword };
