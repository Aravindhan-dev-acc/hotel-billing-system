import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LicenseService } from '../../core/services/license.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-license-activation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './license-activation.component.html',
  styleUrl: './license-activation.component.css',
})
export class LicenseActivationComponent implements OnInit {
  licenseService = inject(LicenseService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  auth = inject(AuthService);

  licenseKey = '';
  activating = signal(false);

  ngOnInit() {
    this.licenseService.refreshStatus().catch(() => {});
  }

  activate() {
    if (!this.licenseKey.trim()) return;
    this.activating.set(true);
    this.licenseService.activate(this.licenseKey.trim()).subscribe({
      next: () => {
        this.notify.success('License activated successfully! You can now continue billing.');
        this.activating.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: () => this.activating.set(false),
    });
  }
}
