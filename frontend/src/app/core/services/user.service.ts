import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/users`;

  list() {
    return this.http.get<ApiResponse<User[]>>(this.base);
  }
  create(payload: { name: string; email: string; password: string; role: string }) {
    return this.http.post<ApiResponse<User>>(this.base, payload);
  }
  update(id: number, payload: Partial<{ name: string; role: string; isActive: boolean }>) {
    return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, payload);
  }
  resetPassword(id: number, newPassword: string) {
    return this.http.post<ApiResponse<null>>(`${this.base}/${id}/reset-password`, { newPassword });
  }
}
