const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/items', require('./item.routes'));
router.use('/bills', require('./bill.routes'));
router.use('/reports', require('./report.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/license', require('./license.routes'));
router.use('/backups', require('./backup.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy', time: new Date() }));

module.exports = router;
