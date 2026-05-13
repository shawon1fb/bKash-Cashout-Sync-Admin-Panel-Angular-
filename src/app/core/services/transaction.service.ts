import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TransactionResponse, TransactionQuery, SummaryResponse, TransactionStatus } from '../models/transaction.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private api = inject(ApiService);

  readonly reloadTrigger = signal(0);

  reload(): void {
    this.reloadTrigger.update(n => n + 1);
  }

  list(query?: TransactionQuery): Observable<ApiResponse<TransactionResponse[]>> {
    return this.api.get<TransactionResponse[]>('/transactions', query as Record<string, any>);
  }

  adminList(query?: TransactionQuery): Observable<ApiResponse<TransactionResponse[]>> {
    return this.api.get<TransactionResponse[]>('/admin/transactions', query as Record<string, any>);
  }

  upload(rawMessage: string, agentId?: string): Observable<ApiResponse<TransactionResponse>> {
    const body: Record<string, string> = { rawMessage };
    if (agentId) body['agentId'] = agentId;
    return this.api.post<TransactionResponse>('/transactions/upload', body);
  }

  verify(transactionId: string): Observable<ApiResponse<TransactionResponse>> {
    return this.api.get<TransactionResponse>(`/transactions/verify/${transactionId}`);
  }

  updateStatus(transactionId: string, status: TransactionStatus): Observable<ApiResponse<TransactionResponse>> {
    return this.api.patch<TransactionResponse>(`/transactions/${transactionId}/status`, { status }).pipe(
      tap(() => this.reload())
    );
  }

  summary(params: { period: string; from?: string; to?: string }): Observable<ApiResponse<SummaryResponse>> {
    return this.api.get<SummaryResponse>('/transactions/summary', params);
  }

  adminSummary(params: { period: string; from?: string; to?: string }): Observable<ApiResponse<SummaryResponse>> {
    return this.api.get<SummaryResponse>('/admin/transactions/summary', params);
  }

  agentTransactions(agentId: string, query?: TransactionQuery): Observable<ApiResponse<TransactionResponse[]>> {
    return this.api.get<TransactionResponse[]>(`/admin/agents/${agentId}/transactions`, query as Record<string, any>);
  }

  agentSummary(agentId: string, params: { period: string; from?: string; to?: string }): Observable<ApiResponse<SummaryResponse>> {
    return this.api.get<SummaryResponse>(`/admin/agents/${agentId}/summary`, params);
  }
}
