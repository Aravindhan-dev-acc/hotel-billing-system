const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/backup.controller');

const router = express.Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:fileName/download', ctrl.download);
router.post('/restore', [body('fileName').notEmpty()], validate, ctrl.restore);

module.exports = router;
