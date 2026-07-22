const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config');
const { AppError } = require('../middleware/error.middleware');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
}

function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !user.is_active) {
    throw new AppError('Invalid email or password.', 401);
  }

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match) {
    throw new AppError('Invalid email or password.', 401);
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return {
    user: safeUser,
    accessToken: signAccessToken(safeUser),
    refreshToken: signRefreshToken(safeUser),
  };
}

function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }
  const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(payload.sub);
  if (!user || !user.is_active) throw new AppError('User not found or inactive.', 401);

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return { accessToken: signAccessToken(safeUser), user: safeUser };
}

function changePassword(userId, currentPassword, newPassword) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new AppError('User not found.', 404);

  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    throw new AppError('Current password is incorrect.', 400);
  }
  const newHash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
    newHash,
    userId
  );
  return true;
}

module.exports = { login, refresh, changePassword, signAccessToken, signRefreshToken };
