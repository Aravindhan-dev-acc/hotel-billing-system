/**
 * Seeds the database with default users, sample items, a trial license row,
 * and default settings. Safe to run multiple times (idempotent - only inserts
 * missing data).
 */
const bcrypt = require('bcryptjs');
const db = require('./database');
const config = require('../config');
const logger = require('../utils/logger');

function seed() {
  // ---------- Default Users ----------
  const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const adminHash = bcrypt.hashSync(config.defaultUsers.adminPassword, 10);
    const ownerHash = bcrypt.hashSync(config.defaultUsers.ownerPassword, 10);
    const staffHash = bcrypt.hashSync('Staff@123', 10);

    insertUser.run('Administrator', config.defaultUsers.adminEmail, adminHash, 'ADMIN');
    insertUser.run('Hotel Owner', config.defaultUsers.ownerEmail, ownerHash, 'OWNER');
    insertUser.run('Front Desk Staff', 'staff@hotel.com', staffHash, 'STAFF');

    logger.info('Seeded default users (admin, owner, staff).');
  }

  // ---------- Sample Items ----------
  const itemCount = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  if (itemCount === 0) {
    const insertItem = db.prepare(`
      INSERT INTO items (item_code, name, category, price, tax_percent, is_available)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    const sampleItems = [
      ['RM-DLX', 'Deluxe Room (per night)', 'Room', 3500, 12],
      ['RM-STD', 'Standard Room (per night)', 'Room', 2200, 12],
      ['RM-STE', 'Suite Room (per night)', 'Room', 5500, 12],
      ['FB-BRK', 'Breakfast Buffet', 'Food & Beverage', 350, 5],
      ['FB-LUN', 'Lunch Buffet', 'Food & Beverage', 450, 5],
      ['FB-DIN', 'Dinner Buffet', 'Food & Beverage', 500, 5],
      ['FB-TEA', 'Tea / Coffee', 'Food & Beverage', 60, 5],
      ['LN-WASH', 'Laundry Service (per item)', 'Laundry', 80, 0],
      ['SP-SPA', 'Spa Session (60 min)', 'Spa & Wellness', 1800, 18],
      ['MB-WATER', 'Mineral Water Bottle', 'Minibar', 40, 5],
      ['MB-SNACK', 'Minibar Snacks', 'Minibar', 120, 5],
      ['SV-AIRPORT', 'Airport Pickup/Drop', 'Services', 900, 5],
    ];
    const insertMany = db.transaction((rows) => {
      for (const row of rows) insertItem.run(...row);
    });
    insertMany(sampleItems);
    logger.info(`Seeded ${sampleItems.length} sample items.`);
  }

  // ---------- License (Trial) ----------
  const licenseCount = db.prepare('SELECT COUNT(*) AS c FROM license').get().c;
  if (licenseCount === 0) {
    db.prepare(`
      INSERT INTO license (status, trial_start_date, trial_bill_limit, trial_bill_count)
      VALUES ('TRIAL', datetime('now'), ?, 0)
    `).run(config.license.trialBillLimit);
    logger.info('Seeded trial license record.');
  }

  // ---------- Default Settings ----------
  const defaultSettings = {
    hotel_name: 'Grand Palace Hotel',
    hotel_address: '123 Main Street, City, State - 000000',
    hotel_phone: '+91 90000 00000',
    hotel_email: 'contact@hotel.com',
    hotel_gstin: '',
    hotel_logo_url: '',
    currency_symbol: 'INR',
    default_tax_percent: '5',
    invoice_prefix: 'INV',
    invoice_footer_note: 'Thank you for staying with us!',
    receipt_paper_size: '80mm', // 80mm | A4
    printer_name: '',
    smtp_configured: 'false',
    whatsapp_configured: 'false',
  };
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);
  const insertSettings = db.transaction((obj) => {
    for (const [k, v] of Object.entries(obj)) insertSetting.run(k, v);
  });
  insertSettings(defaultSettings);

  logger.info('Seed process complete.');
}

if (require.main === module) {
  seed();
  process.exit(0);
}

module.exports = seed;
