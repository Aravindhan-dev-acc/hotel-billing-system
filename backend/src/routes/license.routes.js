const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/license.controller');

const router = express.Router();

// Status must be checkable even without full auth context in some flows (activation screen),
// but we still require a valid JWT since the app is already logged in when this is shown.
router.get('/status', authenticate, ctrl.status);

router.post(
  '/activate',
  authenticate,
  authorize('ADMIN'),
  [body('licenseKey').notEmpty()],
  validate,
  ctrl.activate
);

// Internal/vendor utility - restrict or remove in production deployments
router.post(
  '/generate-key',
  authenticate,
  authorize('ADMIN'),
  [body('customerName').notEmpty()],
  validate,
  ctrl.generateKey
);

module.exports = router;
