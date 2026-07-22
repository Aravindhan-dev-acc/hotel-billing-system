import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Restricts a route to specific roles. Usage in routes:
 *   { path: 'items', canActivate: [roleGuard(['ADMIN','OWNER'])], ... }
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(...allowedRoles)) return true;
    router.navigate(['/dashboard']);
    return false;
  };
};
