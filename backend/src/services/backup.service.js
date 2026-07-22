const fs = require('fs');
const path = require('path');
const config = require('../config');
const { AppError } = require('../middleware/error.middleware');

function ensureBackupDir() {
  if (!fs.existsSync(config.db.backupDir)) {
    fs.mkdirSync(config.db.backupDir, { recursive: true });
  }
}

/** Creates a timestamped copy of the SQLite database file. Returns the backup path. */
function createBackup() {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `hotel_billing_backup_${timestamp}.db`;
  const backupPath = path.join(config.db.backupDir, backupName);

  fs.copyFileSync(config.db.path, backupPath);
  return backupPath;
}

/** Lists all available backup files, most recent first. */
function listBackups() {
  ensureBackupDir();
  return fs
    .readdirSync(config.db.backupDir)
    .filter((f) => f.endsWith('.db'))
    .map((f) => {
      const fullPath = path.join(config.db.backupDir, f);
      const stat = fs.statSync(fullPath);
      return { fileName: f, sizeBytes: stat.size, createdAt: stat.birthtime };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** Restores the database from a chosen backup file. Requires app restart to take effect cleanly. */
function restoreBackup(fileName) {
  ensureBackupDir();
  const safeName = path.basename(fileName); // prevent path traversal
  const backupPath = path.join(config.db.backupDir, safeName);

  if (!fs.existsSync(backupPath)) {
    throw new AppError('Backup file not found.', 404);
  }

  // Take a safety snapshot of the current DB before overwriting
  const preRestoreSnapshot = path.join(
    config.db.backupDir,
    `pre_restore_snapshot_${Date.now()}.db`
  );
  fs.copyFileSync(config.db.path, preRestoreSnapshot);

  fs.copyFileSync(backupPath, config.db.path);
  return true;
}

module.exports = { createBackup, listBackups, restoreBackup };
