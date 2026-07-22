import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService } from '../../core/services/bill.service';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Bill, HotelSettings } from '../../core/models';
import { ReceiptComponent } from '../billing/receipt.component';

@Component({
  selector: 'app-bill-history',
  standalone: true,
  imports: [CommonModule, FormsModule, ReceiptComponent],
  templateUrl: './bill-history.component.html',
  styleUrl: './bill-history.component.css',
})
export class BillHistoryComponent implements OnInit {
  private billService = inject(BillService);
  private settingsService = inject(SettingsService);
  private notify = inject(NotificationService);
  auth = inject(AuthService);

  bills = signal<Bill[]>([]);
  loading = signal(false);
  page = signal(1);
  totalPages = signal(1);

  search = '';
  from = '';
  to = '';

  settings = signal<HotelSettings | null>(null);
  viewingBill = signal<Bill | null>(null);

  ngOnInit() {
    this.settingsService.getAll().subscribe({ next: (res) => this.settings.set(res.data) });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.billService
      .list({ page: this.page(), limit: 15, search: this.search, from: this.from, to: this.to })
      .subscribe({
        next: (res) => {
          this.bills.set(res.data);
          this.totalPages.set(res.pagination.totalPages);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilters() {
    this.page.set(1);
    this.load();
  }

  changePage(delta: number) {
    const next = this.page() + delta;
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
    this.load();
  }

  view(bill: Bill) {
    this.billService.getById(bill.id).subscribe({ next: (res) => this.viewingBill.set(res.data) });
  }

  closeView() {
    this.viewingBill.set(null);
  }

  printReceipt() {
    window.print();
  }

  cancelBill(bill: Bill) {
    if (!confirm(`Cancel bill ${bill.bill_number}? This cannot be undone.`)) return;
    this.billService.cancel(bill.id).subscribe({
      next: () => {
        this.notify.success('Bill cancelled.');
        this.load();
      },
    });
  }
}
