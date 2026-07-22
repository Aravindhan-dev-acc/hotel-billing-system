import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, HotelSettings } from '../models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/settings`;

  getAll() {
    return this.http.get<ApiResponse<HotelSettings>>(this.base);
  }

  update(payload: Partial<HotelSettings>) {
    return this.http.put<ApiResponse<HotelSettings>>(this.base, payload);
  }
}
