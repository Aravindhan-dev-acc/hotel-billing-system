const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/report.controller');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard', ctrl.dashboard);
router.get('/daily', ctrl.daily);
router.get('/monthly', ctrl.monthly);
router.get('/yearly', ctrl.yearly);
router.get('/custom', ctrl.custom);
router.post('/send-closing-summary', authorize('ADMIN', 'OWNER'), ctrl.sendClosingSummaryNow);

module.exports = router;
