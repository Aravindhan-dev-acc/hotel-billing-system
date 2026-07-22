import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  toasts = signal<Toast[]>([]);
  private counter = 0;

  private push(message: string, type: Toast['type']) {
    const id = ++this.counter;
    this.toasts.update((list) => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  success(message: string) { this.push(message, 'success'); }
  error(message: string) { this.push(message, 'error'); }
  info(message: string) { this.push(message, 'info'); }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
