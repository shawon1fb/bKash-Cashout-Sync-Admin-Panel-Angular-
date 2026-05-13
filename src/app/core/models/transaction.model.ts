export type TransactionStatus = 'received' | 'paid';

export interface TransactionResponse {
  id: string;
  transactionId: string;
  amount: string;
  fee?: string;
  balance?: string;
  transactionTime: string;
  status: TransactionStatus;
  agentId: string;
  agentName?: string;
  agentPhone?: string;
  senderPhone: string | null;
  receiverPhone: string;
  rawMessage: string;
  createdAt: string;
  updatedAt?: string;
  isNew?: boolean;
}

export interface SummaryResponse {
  totalPaidAmount: number;
  totalTransactionCount: number;
  period: string;
  from: string;
  to: string;
}

export interface TransactionQuery {
  page?: number;
  limit?: number;
  status?: TransactionStatus | 'all';
  from?: string;
  to?: string;
  agentId?: string;
}
