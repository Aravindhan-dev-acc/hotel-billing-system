const licenseService = require('../services/license.service');

/**
 * Blocks bill creation once the trial period/bill-count is exceeded and no
 * valid license key has been activated. Read-only routes (reports, dashboard,
 * items) are NOT blocked so the admin can still view data and go activate.
 */
function requireActiveLicense(req, res, next) {
  const state = licenseService.getLicenseState();

  if (state.status === 'ACTIVE' || state.status === 'TRIAL_ACTIVE') {
    return next();
  }

  return res.status(402).json({
    success: false,
    code: 'LICENSE_EXPIRED',
    message:
      state.status === 'EXPIRED'
        ? 'Your license has expired. Please activate the application to continue billing.'
        : 'Your trial period has ended. Please activate the application to continue billing.',
    license: state,
  });
}

module.exports = { requireActiveLicense };
