import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  email = 'admin@hotel.com';
  password = '';
  loading = signal(false);
  errorMsg = signal<string | null>(null);

  async submit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMsg.set(null);
    try {
      await this.auth.login(this.email, this.password);
      this.notify.success('Welcome back!');
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.errorMsg.set(err?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      this.loading.set(false);
    }
  }
}
