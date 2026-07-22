import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LicenseService } from '../../../core/services/license.service';

@Component({
  selector: 'app-license-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="banner" *ngIf="license.state() as s">
      <ng-container *ngIf="s.status === 'TRIAL_ACTIVE'">
        <span class="badge badge-warning">
          Trial: {{ s.daysRemaining }} day(s) / {{ s.billsRemaining }} bill(s) left
        </span>
      </ng-container>
      <ng-container *ngIf="s.status === 'EXPIRED' || s.status === 'BLOCKED'">
        <a routerLink="/license" class="badge badge-danger">
          License expired - Click to activate
        </a>
      </ng-container>
      <ng-container *ngIf="s.status === 'ACTIVE'">
        <span class="badge badge-success">Licensed</span>
      </ng-container>
    </div>
  `,
  styles: [`
    .banner { display: flex; align-items: center; }
    a.badge { text-decoration: none; cursor: pointer; }
  `],
})
export class LicenseBannerComponent implements OnInit {
  license = inject(LicenseService);

  async ngOnInit() {
    try {
      await this.license.refreshStatus();
    } catch {
      // silent - user may not be authenticated yet on first paint
    }
  }
}
