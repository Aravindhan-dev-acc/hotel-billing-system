const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/user.controller');

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', ctrl.list);

router.post(
  '/',
  [
    body('name').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['ADMIN', 'STAFF', 'OWNER']),
  ],
  validate,
  ctrl.create
);

router.put('/:id', [body('role').optional().isIn(['ADMIN', 'STAFF', 'OWNER'])], validate, ctrl.update);

router.post('/:id/reset-password', [body('newPassword').isLength({ min: 6 })], validate, ctrl.resetPassword);

module.exports = router;
