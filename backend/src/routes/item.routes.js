const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/item.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/categories', ctrl.categories);
router.get('/:id', ctrl.getById);

const itemValidators = [
  body('itemCode').notEmpty().withMessage('Item code is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('taxPercent').optional().isFloat({ min: 0, max: 100 }),
];

// Only ADMIN and OWNER can modify the item catalogue; STAFF can only view/search for billing
router.post('/', authorize('ADMIN', 'OWNER'), itemValidators, validate, ctrl.create);
router.put('/:id', authorize('ADMIN', 'OWNER'), itemValidators, validate, ctrl.update);
router.delete('/:id', authorize('ADMIN', 'OWNER'), ctrl.remove);

module.exports = router;
