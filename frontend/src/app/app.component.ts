import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { LicenseBannerComponent } from './shared/components/license-banner/license-banner.component';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, LicenseBannerComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = signal(false);

  navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'STAFF', 'OWNER'] },
    { path: '/billing', label: 'Billing', icon: '🧾', roles: ['ADMIN', 'STAFF', 'OWNER'] },
    { path: '/bills', label: 'Bill History', icon: '📜', roles: ['ADMIN', 'STAFF', 'OWNER'] },
    { path: '/items', label: 'Items', icon: '🍽️', roles: ['ADMIN', 'OWNER'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['ADMIN', 'OWNER'] },
    { path: '/users', label: 'Users', icon: '👥', roles: ['ADMIN'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN', 'OWNER'] },
  ];

  get visibleNavItems() {
    const role = this.auth.currentUser()?.role;
    return this.navItems.filter((i) => !role || i.roles.includes(role));
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
