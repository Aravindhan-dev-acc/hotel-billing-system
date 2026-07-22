const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { requireActiveLicense } = require('../middleware/license.middleware');
const ctrl = require('../controllers/bill.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  requireActiveLicense, // blocks bill creation once trial/license has expired
  [
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.itemId').isInt(),
    body('items.*.quantity').isFloat({ gt: 0 }),
    body('paymentMethod').optional().isIn(['CASH', 'CARD', 'UPI', 'ONLINE', 'OTHER']),
  ],
  validate,
  ctrl.create
);

router.post('/:id/cancel', authorize('ADMIN', 'OWNER'), ctrl.cancel);

module.exports = router;
