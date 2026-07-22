import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface BackupFile { fileName: string; sizeBytes: number; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class BackupService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/backups`;

  list() {
    return this.http.get<ApiResponse<BackupFile[]>>(this.base);
  }
  create() {
    return this.http.post<ApiResponse<{ path: string }>>(this.base, {});
  }
  restore(fileName: string) {
    return this.http.post<ApiResponse<null>>(`${this.base}/restore`, { fileName });
  }
  downloadUrl(fileName: string) {
    return `${this.base}/${encodeURIComponent(fileName)}/download`;
  }
}
