import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/**
 * Centralized HTTP error handling:
 * - 401  -> logs out and redirects to /login
 * - 402  -> license/trial expired; redirect to the activation screen
 * - other errors -> surfaced via the toast NotificationService
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      } else if (err.status === 402) {
        router.navigate(['/license']);
      } else if (err.status === 0) {
        notify.error('Cannot reach the server. Please check your connection.');
      } else if (err.error?.message) {
        notify.error(err.error.message);
      }
      return throwError(() => err);
    })
  );
};
