import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, Item, PaginatedResponse } from '../models';

export interface ItemQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  availableOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/items`;

  list(query: ItemQuery = {}) {
    const params: Record<string, string> = {};
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params[k] = String(v);
    });
    return this.http.get<PaginatedResponse<Item>>(this.base, { params });
  }

  getById(id: number) {
    return this.http.get<ApiResponse<Item>>(`${this.base}/${id}`);
  }

  categories() {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/categories`);
  }

  create(payload: Partial<Item> & { itemCode: string; taxPercent?: number; isAvailable?: boolean }) {
    return this.http.post<ApiResponse<Item>>(this.base, payload);
  }

  update(id: number, payload: any) {
    return this.http.put<ApiResponse<Item>>(`${this.base}/${id}`, payload);
  }

  remove(id: number) {
    return this.http.delete<ApiResponse<null>>(`${this.base}/${id}`);
  }
}
