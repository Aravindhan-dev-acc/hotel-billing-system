import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LicenseState } from '../models';

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/license`;

  state = signal<LicenseState | null>(null);

  async refreshStatus(): Promise<LicenseState> {
    const res = await firstValueFrom(this.http.get<ApiResponse<LicenseState>>(`${this.base}/status`));
    this.state.set(res.data);
    return res.data;
  }

  activate(licenseKey: string) {
    return this.http.post<ApiResponse<LicenseState>>(`${this.base}/activate`, { licenseKey });
  }

  generateKey(customerName: string, expiryDate?: string) {
    return this.http.post<ApiResponse<{ licenseKey: string }>>(`${this.base}/generate-key`, {
      customerName,
      expiryDate,
    });
  }
}
