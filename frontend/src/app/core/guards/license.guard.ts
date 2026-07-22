import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LicenseService } from '../services/license.service';

/**
 * Blocks navigation to the billing page once the trial/license has expired,
 * redirecting to the activation screen instead. Read-only areas (dashboard,
 * reports, items) remain accessible - the backend's own license middleware
 * still enforces the rule server-side regardless of what the client does.
 */
export const licenseGuard: CanActivateFn = async () => {
  const licenseService = inject(LicenseService);
  const router = inject(Router);

  const state = await licenseService.refreshStatus();
  if (state.status === 'ACTIVE' || state.status === 'TRIAL_ACTIVE') return true;

  router.navigate(['/license']);
  return false;
};
