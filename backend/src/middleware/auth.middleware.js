const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db/database');

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the decoded user (id, email, role) to req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication token missing.' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = db
      .prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/**
 * Restricts access to the given list of roles.
 * Usage: authorize('ADMIN', 'OWNER')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
