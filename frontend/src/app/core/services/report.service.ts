import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface DashboardSummary {
  todaySales: { total: number; count: number };
  monthlySales: { total: number; count: number };
  recentBills: any[];
  topSellingItems: { name: string; totalQty: number; totalRevenue: number }[];
  last7DaysTrend: { day: string; total: number }[];
}

export interface RangeReport {
  range: { from: string; to: string };
  totals: { subtotal: number; tax: number; discount: number; total: number; billCount: number };
  byDay: { day: string; billCount: number; total: number }[];
  byPaymentMethod: { payment_method: string; billCount: number; total: number }[];
  topItems: { name: string; code: string; totalQty: number; totalRevenue: number }[];
  bills: any[];
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/reports`;

  dashboard() {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.base}/dashboard`);
  }
  daily(date?: string) {
    return this.http.get<ApiResponse<RangeReport>>(`${this.base}/daily`, { params: date ? { date } : {} });
  }
  monthly(year?: number, month?: number) {
    const params: any = {};
    if (year) params.year = year;
    if (month) params.month = month;
    return this.http.get<ApiResponse<RangeReport>>(`${this.base}/monthly`, { params });
  }
  yearly(year?: number) {
    return this.http.get<ApiResponse<RangeReport>>(`${this.base}/yearly`, { params: year ? { year } : {} });
  }
  custom(from: string, to: string) {
    return this.http.get<ApiResponse<RangeReport>>(`${this.base}/custom`, { params: { from, to } });
  }
  sendClosingSummaryNow(date?: string) {
    return this.http.post<ApiResponse<any>>(`${this.base}/send-closing-summary`, {}, { params: date ? { date } : {} });
  }
}
