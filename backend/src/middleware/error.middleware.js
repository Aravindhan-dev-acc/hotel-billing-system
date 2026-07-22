const logger = require('../utils/logger');

/** Custom application error with an HTTP status code. */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

/** Catches unmatched routes. */
function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Centralized error handler - must be registered last. */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(err);
  } else {
    logger.warn(`${statusCode} - ${err.message} - ${req.method} ${req.originalUrl}`);
  }

  // SQLite constraint errors -> friendlier message
  let message = err.message || 'Internal server error.';
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    message = 'A record with the same unique value already exists.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

/** Wraps async route handlers so thrown errors reach errorHandler. */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { AppError, notFoundHandler, errorHandler, asyncHandler };
