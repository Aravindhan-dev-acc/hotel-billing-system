import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, RangeReport } from '../../core/services/report.service';
import { NotificationService } from '../../core/services/notification.service';

type ReportMode = 'daily' | 'monthly' | 'yearly' | 'custom';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private notify = inject(NotificationService);

  mode = signal<ReportMode>('daily');
  report = signal<RangeReport | null>(null);
  loading = signal(false);

  // Filter inputs
  date = new Date().toISOString().slice(0, 10);
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  customFrom = new Date().toISOString().slice(0, 10);
  customTo = new Date().toISOString().slice(0, 10);

  years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  months = [
    { v: 1, l: 'January' }, { v: 2, l: 'February' }, { v: 3, l: 'March' },
    { v: 4, l: 'April' }, { v: 5, l: 'May' }, { v: 6, l: 'June' },
    { v: 7, l: 'July' }, { v: 8, l: 'August' }, { v: 9, l: 'September' },
    { v: 10, l: 'October' }, { v: 11, l: 'November' }, { v: 12, l: 'December' },
  ];

  ngOnInit() {
    this.load();
  }

  setMode(m: ReportMode) {
    this.mode.set(m);
    this.load();
  }

  load() {
    this.loading.set(true);
    const mode = this.mode();
    const req =
      mode === 'daily' ? this.reportService.daily(this.date) :
      mode === 'monthly' ? this.reportService.monthly(this.year, this.month) :
      mode === 'yearly' ? this.reportService.yearly(this.year) :
      this.reportService.custom(this.customFrom, this.customTo);

    req.subscribe({
      next: (res) => { this.report.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  exportCsv() {
    const r = this.report();
    if (!r) return;
    const rows = [
      ['Bill Number', 'Customer', 'Amount', 'Payment Method', 'Status', 'Date'],
      ...r.bills.map((b: any) => [b.bill_number, b.customer_name || 'Walk-in', b.total_amount, b.payment_method, b.payment_status, b.created_at]),
    ];
    const csv = rows.map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${r.range.from}_to_${r.range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  sendClosingNow() {
    this.reportService.sendClosingSummaryNow(this.date).subscribe({
      next: () => this.notify.success('Daily closing summary sent to owner (email + WhatsApp).'),
    });
  }
}
