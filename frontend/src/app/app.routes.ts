import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { licenseGuard } from './core/guards/license.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },

  {
    path: 'billing',
    canActivate: [authGuard, licenseGuard],
    loadComponent: () =>
      import('./features/billing/billing.component').then((m) => m.BillingComponent),
  },

  {
    path: 'bills',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/billing/bill-history.component').then((m) => m.BillHistoryComponent),
  },

  {
    path: 'items',
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
    loadComponent: () => import('./features/items/items.component').then((m) => m.ItemsComponent),
  },

  {
    path: 'reports',
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
    loadComponent: () =>
      import('./features/reports/reports.component').then((m) => m.ReportsComponent),
  },

  {
    path: 'settings',
    canActivate: [authGuard, roleGuard(['ADMIN', 'OWNER'])],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },

  {
    path: 'users',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/users/users.component').then((m) => m.UsersComponent),
  },

  {
    path: 'license',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/license/license-activation.component').then(
        (m) => m.LicenseActivationComponent
      ),
  },

  { path: '**', redirectTo: 'dashboard' },
];
