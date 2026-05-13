import { Injectable, signal } from '@angular/core';
import { TransactionResponse } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  readonly tx = signal<TransactionResponse | null>(null);
  open(tx: TransactionResponse): void { this.tx.set(tx); }
  close(): void { this.tx.set(null); }
}
