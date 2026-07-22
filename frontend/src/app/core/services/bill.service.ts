import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Bill, PaginatedResponse } from '../models';

export interface CreateBillPayload {
  items: { itemId: number; quantity: number }[];
  customerName?: string;
  customerPhone?: string;
  roomNumber?: string;
  discountAmount?: number;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'OTHER';
}

export interface BillQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
  paymentStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/bills`;

  create(payload: CreateBillPayload) {
    return this.http.post<ApiResponse<Bill>>(this.base, payload);
  }

  list(query: BillQuery = {}) {
    const params: Record<string, string> = {};
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params[k] = String(v);
    });
    return this.http.get<PaginatedResponse<Bill>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Bill>>(`${this.base}/${id}`);
  }

  cancel(id: number) {
    return this.http.post<ApiResponse<Bill>>(`${this.base}/${id}/cancel`, {});
  }
}
