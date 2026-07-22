/**
 * License / trial management.
 *
 * Trial rule: the app is usable for 30 days OR 100 bills, WHICHEVER COMES FIRST.
 * Once a valid license key is activated, billing is unblocked (subject to
 * the license's own expiry date, if any - perpetual keys have expiry_date = NULL).
 *
 * License key format (self-issued, offline-verifiable):
 *   HBMS-<base64url(payload)>-<hmac-signature>
 * payload = "<customerName>|<expiryDateISO or 'PERPETUAL'>|<issuedAtISO>"
 * This lets an admin activate offline (no server-side license server required),
 * while still being cryptographically tied to LICENSE_SIGNING_SECRET so keys
 * cannot be forged without the secret.
 */
const crypto = require('crypto');
const db = require('../db/database');
const config = require('../config');
const { AppError } = require('../middleware/error.middleware');

function getRow() {
  return db.prepare('SELECT * FROM license ORDER BY id LIMIT 1').get();
}

function sign(payload) {
  return crypto.createHmac('sha256', config.license.signingSecret).update(payload).digest('hex').slice(0, 24);
}

/** Generates a valid license key (used by the license-issuing admin/vendor). */
function generateLicenseKey(customerName, expiryDateISO = null) {
  const payload = `${customerName}|${expiryDateISO || 'PERPETUAL'}|${new Date().toISOString()}`;
  const payloadB64 = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = sign(payload);
  return `HBMS-${payloadB64}-${signature}`;
}

/** Validates a license key's structure & signature; returns decoded payload or null. */
function verifyLicenseKey(key) {
  if (!key || typeof key !== 'string' || !key.startsWith('HBMS-')) return null;
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  const [, payloadB64, signature] = parts;

  let payload;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }
  if (sign(payload) !== signature) return null;

  const [customerName, expiry, issuedAt] = payload.split('|');
  return { customerName, expiry: expiry === 'PERPETUAL' ? null : expiry, issuedAt };
}

/** Computes the current effective license/trial state. */
function getLicenseState() {
  const row = getRow();
  if (!row) throw new AppError('License record missing. Please reseed the database.', 500);

  const now = new Date();

  if (row.status === 'ACTIVE') {
    if (row.expiry_date && new Date(row.expiry_date) < now) {
      db.prepare('UPDATE license SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(
        'EXPIRED',
        row.id
      );
      return { status: 'EXPIRED', reason: 'License key expired.', ...rowToPublic(row) };
    }
    return { status: 'ACTIVE', ...rowToPublic(row) };
  }

  if (row.status === 'BLOCKED') {
    return { status: 'BLOCKED', reason: 'License blocked by administrator.', ...rowToPublic(row) };
  }

  // TRIAL mode: check both day limit and bill-count limit
  const trialStart = new Date(row.trial_start_date);
  const daysElapsed = (now - trialStart) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.ceil(config.license.trialDays - daysElapsed));
  const billsRemaining = Math.max(0, row.trial_bill_limit - row.trial_bill_count);

  const expiredByDays = daysElapsed >= config.license.trialDays;
  const expiredByBills = row.trial_bill_count >= row.trial_bill_limit;

  if (expiredByDays || expiredByBills) {
    return {
      status: 'EXPIRED',
      reason: expiredByBills
        ? `Trial bill limit of ${row.trial_bill_limit} reached.`
        : `Trial period of ${config.license.trialDays} days has ended.`,
      ...rowToPublic(row),
      daysRemaining: 0,
      billsRemaining: 0,
    };
  }

  return {
    status: 'TRIAL_ACTIVE',
    ...rowToPublic(row),
    daysRemaining,
    billsRemaining,
  };
}

function rowToPublic(row) {
  return {
    licenseKey: row.license_key ? maskKey(row.license_key) : null,
    activationDate: row.activation_date,
    expiryDate: row.expiry_date,
    trialStartDate: row.trial_start_date,
    trialBillLimit: row.trial_bill_limit,
    trialBillCount: row.trial_bill_count,
    customerName: row.customer_name,
  };
}

function maskKey(key) {
  if (key.length <= 12) return key;
  return `${key.slice(0, 9)}...${key.slice(-6)}`;
}

/** Increments the trial bill counter. Called after each bill is created while still on TRIAL. */
function incrementTrialBillCount() {
  const row = getRow();
  if (row.status === 'TRIAL') {
    db.prepare('UPDATE license SET trial_bill_count = trial_bill_count + 1, updated_at = datetime(\'now\') WHERE id = ?').run(
      row.id
    );
  }
}

/** Activates the application with a license key. */
function activate(licenseKey) {
  const decoded = verifyLicenseKey(licenseKey);
  if (!decoded) {
    throw new AppError('Invalid license key.', 400);
  }
  if (decoded.expiry && new Date(decoded.expiry) < new Date()) {
    throw new AppError('This license key has already expired.', 400);
  }

  const row = getRow();
  db.prepare(`
    UPDATE license
    SET license_key = ?, status = 'ACTIVE', activation_date = datetime('now'),
        expiry_date = ?, customer_name = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(licenseKey, decoded.expiry, decoded.customerName, row.id);

  return getLicenseState();
}

module.exports = {
  getLicenseState,
  incrementTrialBillCount,
  activate,
  generateLicenseKey,
  verifyLicenseKey,
};
