import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportService, DashboardSummary } from '../../core/services/report.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private reportService = inject(ReportService);

  summary = signal<DashboardSummary | null>(null);
  loading = signal(true);

  maxTrend = 0;

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.reportService.dashboard().subscribe({
      next: (res) => {
        this.summary.set(res.data);
        this.maxTrend = Math.max(1, ...res.data.last7DaysTrend.map((d) => d.total));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  barHeight(total: number): string {
    return `${Math.max(4, (total / this.maxTrend) * 100)}%`;
  }
}
