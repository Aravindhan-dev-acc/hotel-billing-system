const backupService = require('../services/backup.service');
const { asyncHandler } = require('../middleware/error.middleware');

const create = asyncHandler(async (req, res) => {
  const backupPath = backupService.createBackup();
  res.json({ success: true, message: 'Backup created successfully.', data: { path: backupPath } });
});

const list = asyncHandler(async (req, res) => {
  res.json({ success: true, data: backupService.listBackups() });
});

const download = asyncHandler(async (req, res) => {
  const path = require('path');
  const config = require('../config');
  const fileName = path.basename(req.params.fileName);
  res.download(path.join(config.db.backupDir, fileName));
});

const restore = asyncHandler(async (req, res) => {
  backupService.restoreBackup(req.body.fileName);
  res.json({
    success: true,
    message: 'Database restored successfully. Please restart the backend server to ensure a clean reload.',
  });
});

module.exports = { create, list, download, restore };
