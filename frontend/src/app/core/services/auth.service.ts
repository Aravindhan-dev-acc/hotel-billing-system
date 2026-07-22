import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models';

const ACCESS_TOKEN_KEY = 'hbms_access_token';
const REFRESH_TOKEN_KEY = 'hbms_refresh_token';
const USER_KEY = 'hbms_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiUrl}/auth`;

  /** Reactive signal holding the currently logged-in user (or null). */
  currentUser = signal<User | null>(this.readStoredUser());

  private readStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  async login(email: string, password: string): Promise<User> {
    const res = await firstValueFrom(
      this.http.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
        `${this.base}/login`,
        { email, password }
      )
    );
    const { user, accessToken, refreshToken } = res.data;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    return user;
  }

  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await firstValueFrom(
        this.http.post<ApiResponse<{ accessToken: string; user: User }>>(`${this.base}/refresh`, {
          refreshToken,
        })
      );
      localStorage.setItem(ACCESS_TOKEN_KEY, res.data.accessToken);
      return res.data.accessToken;
    } catch {
      this.logout();
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  hasRole(...roles: string[]): boolean {
    const role = this.currentUser()?.role;
    return !!role && roles.includes(role);
  }
}
