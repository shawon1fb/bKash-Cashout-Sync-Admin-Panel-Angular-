import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { StorageService } from './storage.service';
import { ToastService } from './toast.service';
import { UserResponse } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthData extends AuthTokens {
  user: UserResponse;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private toast = inject(ToastService);

  readonly currentUser = signal<UserResponse | null>(this.storage.get<UserResponse>('bk_user'));
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  get accessToken(): string | null {
    return this.storage.get<string>('bk_access_token');
  }

  get refreshToken(): string | null {
    return this.storage.get<string>('bk_refresh_token');
  }

  sendOtp(phone: string): Observable<ApiResponse<{ success: boolean; message: string; phone: string; expiresInMinutes: number }>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/auth/otp/send`, { phone });
  }

  verifyOtp(phone: string, otp: string): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/otp/verify`, { phone, otp }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storeAuth(res.data);
        }
      })
    );
  }

  refresh(): Observable<ApiResponse<AuthTokens>> {
    return this.http.post<ApiResponse<AuthTokens>>(`${environment.apiUrl}/auth/refresh`, {
      refreshToken: this.refreshToken
    }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.storage.set('bk_access_token', res.data.accessToken);
          this.storage.set('bk_refresh_token', res.data.refreshToken);
        }
      })
    );
  }

  logout(): void {
    if (this.accessToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe({ error: () => {} });
    }
    this.clearAuth();
    this.router.navigate(['/login']);
    this.toast.info('Signed out');
  }

  clearAuth(): void {
    this.currentUser.set(null);
    this.storage.remove('bk_user');
    this.storage.remove('bk_access_token');
    this.storage.remove('bk_refresh_token');
  }

  private storeAuth(data: AuthData): void {
    this.currentUser.set(data.user);
    this.storage.set('bk_user', data.user);
    this.storage.set('bk_access_token', data.accessToken);
    this.storage.set('bk_refresh_token', data.refreshToken);
  }
}
