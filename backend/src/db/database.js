/**
 * SQLite database connection (better-sqlite3 - synchronous, fast, zero-config).
 * Creates all tables automatically if they do not exist (idempotent).
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

// Ensure the data directory exists
const dataDir = path.dirname(config.db.path);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(config.db.path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    -- ========== USERS ==========
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN','STAFF','OWNER')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ========== ITEMS ==========
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      price REAL NOT NULL CHECK(price >= 0),
      tax_percent REAL NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

    -- ========== BILLS ==========
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_number TEXT NOT NULL UNIQUE,
      customer_name TEXT,
      customer_phone TEXT,
      room_number TEXT,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK(payment_method IN ('CASH','CARD','UPI','ONLINE','OTHER')),
      payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK(payment_status IN ('PAID','PENDING','CANCELLED')),
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
    CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);

    -- ========== BILL ITEMS ==========
    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_code TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity REAL NOT NULL CHECK(quantity > 0),
      tax_percent REAL NOT NULL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );
    CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
    CREATE INDEX IF NOT EXISTS idx_bill_items_item_id ON bill_items(item_id);

    -- ========== LICENSE ==========
    CREATE TABLE IF NOT EXISTS license (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT,
      status TEXT NOT NULL DEFAULT 'TRIAL' CHECK(status IN ('TRIAL','ACTIVE','EXPIRED','BLOCKED')),
      activation_date TEXT,
      expiry_date TEXT,
      trial_start_date TEXT NOT NULL DEFAULT (datetime('now')),
      trial_bill_limit INTEGER NOT NULL DEFAULT 100,
      trial_bill_count INTEGER NOT NULL DEFAULT 0,
      customer_name TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ========== SETTINGS (key-value store, one row per setting) ==========
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ========== NOTIFICATION LOG ==========
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('EMAIL','WHATSAPP')),
      event TEXT NOT NULL,
      recipient TEXT,
      status TEXT NOT NULL CHECK(status IN ('SENT','FAILED')),
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  logger.info('Database schema verified/created.');
}

initSchema();

module.exports = db;
