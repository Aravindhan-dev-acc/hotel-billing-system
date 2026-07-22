const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/settings.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.getAll);
router.put('/', authorize('ADMIN', 'OWNER'), ctrl.update);

module.exports = router;
