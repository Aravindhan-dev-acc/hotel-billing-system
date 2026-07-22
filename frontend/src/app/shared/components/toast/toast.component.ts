import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container no-print">
      <div *ngFor="let t of notify.toasts()" class="toast" [class]="'toast-' + t.type" (click)="notify.dismiss(t.id)">
        {{ t.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 340px;
    }
    .toast {
      padding: 12px 16px;
      border-radius: 8px;
      color: #fff;
      font-size: 13.5px;
      box-shadow: 0 6px 20px rgba(0,0,0,0.15);
      cursor: pointer;
      animation: slideIn 0.2s ease;
    }
    .toast-success { background: #16a34a; }
    .toast-error { background: #dc2626; }
    .toast-info { background: #2563eb; }
    @keyframes slideIn {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `],
})
export class ToastComponent {
  notify = inject(NotificationService);
}
