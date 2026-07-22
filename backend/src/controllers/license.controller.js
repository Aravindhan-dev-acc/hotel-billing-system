const licenseService = require('../services/license.service');
const { asyncHandler } = require('../middleware/error.middleware');

const status = asyncHandler(async (req, res) => {
  res.json({ success: true, data: licenseService.getLicenseState() });
});

const activate = asyncHandler(async (req, res) => {
  const { licenseKey } = req.body;
  const state = licenseService.activate(licenseKey);
  res.json({ success: true, message: 'License activated successfully.', data: state });
});

/**
 * Vendor/admin utility to generate a valid license key for a customer.
 * In production, restrict this route or move it to a separate internal tool -
 * it is exposed here (ADMIN-only) so the whole activation loop is testable end-to-end.
 */
const generateKey = asyncHandler(async (req, res) => {
  const { customerName, expiryDate } = req.body;
  const key = licenseService.generateLicenseKey(customerName || 'Licensed Customer', expiryDate || null);
  res.json({ success: true, data: { licenseKey: key } });
});

module.exports = { status, activate, generateKey };
