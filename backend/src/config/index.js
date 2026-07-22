/**
 * Centralized application configuration.
 * All environment variables are read once here and exposed as a typed object,
 * so the rest of the app never touches process.env directly.
 */
require('dotenv').config();
const path = require('path');

function bool(val, def = false) {
  if (val === undefined || val === null || val === '') return def;
  return String(val).toLowerCase() === 'true';
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:4200',

  db: {
    path: path.resolve(process.cwd(), process.env.DB_PATH || './data/hotel_billing.db'),
    backupDir: path.resolve(process.cwd(), process.env.DB_BACKUP_DIR || './backups'),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  defaultUsers: {
    adminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@hotel.com',
    adminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
    ownerEmail: process.env.DEFAULT_OWNER_EMAIL || 'owner@hotel.com',
    ownerPassword: process.env.DEFAULT_OWNER_PASSWORD || 'Owner@123',
  },

  email: {
    enabled: bool(process.env.EMAIL_ENABLED, false),
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'Hotel Billing System <no-reply@hotel.com>',
    ownerEmail: process.env.OWNER_NOTIFICATION_EMAIL,
  },

  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'none', // none | twilio | meta
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_WHATSAPP_FROM,
      ownerNumber: process.env.OWNER_WHATSAPP_NUMBER,
    },
    meta: {
      phoneNumberId: process.env.META_WA_PHONE_NUMBER_ID,
      accessToken: process.env.META_WA_ACCESS_TOKEN,
      recipientNumber: process.env.META_WA_RECIPIENT_NUMBER,
    },
  },

  license: {
    trialDays: parseInt(process.env.LICENSE_TRIAL_DAYS, 10) || 30,
    trialBillLimit: parseInt(process.env.LICENSE_TRIAL_BILL_LIMIT, 10) || 100,
    signingSecret: process.env.LICENSE_SIGNING_SECRET || 'dev_license_secret_change_me',
  },

  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
