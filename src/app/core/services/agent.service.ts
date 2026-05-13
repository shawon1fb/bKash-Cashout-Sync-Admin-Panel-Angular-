import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { UserResponse } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

export interface AgentQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TopAgent {
  agentId: string;
  name: string;
  phone: string;
  totalPaid: number;
  txCount: number;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private api = inject(ApiService);

  readonly reloadTrigger = signal(0);

  reload(): void {
    this.reloadTrigger.update(n => n + 1);
  }

  list(query?: AgentQuery): Observable<ApiResponse<UserResponse[]>> {
    return this.api.get<UserResponse[]>('/admin/agents', query as Record<string, any>);
  }

  get(uuid: string): Observable<ApiResponse<UserResponse>> {
    return this.api.get<UserResponse>(`/admin/agents/${uuid}`);
  }

  create(data: { name: string; phone: string }): Observable<ApiResponse<UserResponse>> {
    return this.api.post<UserResponse>('/admin/agents', data).pipe(
      tap(() => this.reload())
    );
  }

  update(uuid: string, data: { name?: string; isActive?: boolean }): Observable<ApiResponse<UserResponse>> {
    return this.api.patch<UserResponse>(`/admin/agents/${uuid}`, data).pipe(
      tap(() => this.reload())
    );
  }

  delete(uuid: string): Observable<ApiResponse<UserResponse>> {
    return this.api.delete<UserResponse>(`/admin/agents/${uuid}`).pipe(
      tap(() => this.reload())
    );
  }

  topAgents(limit = 5): Observable<ApiResponse<TopAgent[]>> {
    return this.api.get<TopAgent[]>('/admin/agents/top', { limit });
  }

  userProfile(): Observable<ApiResponse<UserResponse>> {
    return this.api.get<UserResponse>('/users/profile');
  }

  updateProfile(data: { name?: string }): Observable<ApiResponse<UserResponse>> {
    return this.api.patch<UserResponse>('/users/profile', data);
  }
}
