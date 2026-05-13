import { Component, input, output, inject } from '@angular/core';
import { TransactionResponse } from '../../../core/models/transaction.model';
import { StatusBadge } from '../status-badge/status-badge';
import { AmountPipe } from '../../pipes/amount.pipe';
import { PhonePipe } from '../../pipes/phone.pipe';
import { fmtDate, fmtRelative } from '../../utils/date.utils';
import { ToastService } from '../../../core/services/toast.service';
import { TransactionService } from '../../../core/services/transaction.service';

@Component({
  selector: 'app-transaction-drawer',
  standalone: true,
  imports: [StatusBadge, AmountPipe, PhonePipe],
  template: `
    <div class="drawer-backdrop" (click)="close.emit()"></div>
    <aside class="drawer">
      <div style="padding:16px 22px;border-bottom:1px solid var(--divider);display:flex;align-items:center;gap:12px">
        <div style="flex:1">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Transaction</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:3px">
            <span class="mono" style="font-size:16px;font-weight:600">{{ tx().transactionId }}</span>
            <button class="btn btn-ghost btn-sm btn-icon" (click)="copyTrxId()" title="Copy">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
        <app-status-badge [status]="tx().status"/>
        <button class="btn btn-ghost btn-icon" (click)="close.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style="overflow:auto;flex:1;padding:22px">
        <!-- Amount block -->
        <div style="padding:20px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-lg);margin-bottom:18px">
          <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em">Amount</div>
          <div style="font-size:30px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-0.02em;margin-top:4px;font-family:var(--font-display)">
            <span style="color:var(--text-muted);font-weight:400;margin-right:4px">৳</span>{{ tx().amount | amount:false }}
          </div>
          <div style="display:flex;gap:24px;margin-top:14px;font-size:12px">
            <div>
              <div style="color:var(--text-muted);font-size:11px">Fee</div>
              <div class="mono" style="margin-top:2px">{{ tx().fee | amount }}</div>
            </div>
            <div>
              <div style="color:var(--text-muted);font-size:11px">Balance after</div>
              <div class="mono" style="margin-top:2px">{{ tx().balance | amount }}</div>
            </div>
            <div>
              <div style="color:var(--text-muted);font-size:11px">Net</div>
              <div class="mono" style="margin-top:2px;color:var(--success)">+{{ net() | amount }}</div>
            </div>
          </div>
        </div>

        <!-- From/To -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px">
          <div>
            <div class="label">From</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="background:var(--surface-3);color:var(--text-2);font-size:11px">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <div class="mono" style="font-size:13px">{{ tx().senderPhone | phone }}</div>
                <div style="font-size:11px;color:var(--text-muted)">Sender</div>
              </div>
            </div>
          </div>
          <div>
            <div class="label">To (Agent)</div>
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar">{{ agentInitials() }}</div>
              <div>
                <div style="font-size:13px;font-weight:500">{{ tx().agentName || '—' }}</div>
                <div class="mono" style="font-size:11px;color:var(--text-muted)">{{ tx().agentPhone || tx().receiverPhone | phone }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div style="margin-bottom:18px">
          <div class="label">Timeline</div>
          <div class="timeline" style="margin-top:4px">
            <div class="timeline-item done">
              <div class="timeline-label">Captured</div>
              <div class="timeline-time">{{ fmt(tx().createdAt) }}</div>
            </div>
            <div class="timeline-item done">
              <div class="timeline-label">Received in queue</div>
              <div class="timeline-time">{{ fmt(tx().transactionTime) }}</div>
            </div>
            <div class="timeline-item" [class.done]="tx().status === 'paid'" [class.current]="tx().status === 'received'">
              <div class="timeline-label">Paid out</div>
              <div class="timeline-time">{{ tx().status === 'paid' ? fmt(tx().updatedAt || tx().transactionTime) : 'Pending' }}</div>
            </div>
          </div>
        </div>

        <!-- Raw SMS -->
        <div style="margin-bottom:18px">
          <div class="label">Raw SMS</div>
          <div style="padding:14px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-md);font-family:var(--font-mono);font-size:12px;line-height:1.6;color:var(--text-2)">{{ tx().rawMessage }}</div>
        </div>

        <!-- Metadata -->
        <div>
          <div class="label">Metadata</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:12px">
            <div style="color:var(--text-muted)">Internal ID</div>
            <div class="mono">{{ tx().id }}</div>
            <div style="color:var(--text-muted)">Created</div>
            <div>{{ fmt(tx().createdAt) }}</div>
            <div style="color:var(--text-muted)">Transaction time</div>
            <div>{{ fmt(tx().transactionTime) }}</div>
          </div>
        </div>
      </div>

      <div style="padding:14px 22px;border-top:1px solid var(--divider);display:flex;gap:8px;justify-content:flex-end">
        <button class="btn" (click)="close.emit()">Close</button>
        @if (tx().status === 'received') {
          <button class="btn btn-primary" (click)="onMarkPaid()">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Mark as paid
          </button>
        }
      </div>
    </aside>
  `,
})
export class TransactionDrawer {
  tx    = input.required<TransactionResponse>();
  close = output<void>();

  private txService = inject(TransactionService);
  private toast     = inject(ToastService);

  readonly net = () => {
    const amt = parseFloat(this.tx().amount || '0');
    const fee = parseFloat(this.tx().fee || '0');
    return amt - fee;
  };

  readonly agentInitials = () =>
    (this.tx().agentName || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('');

  fmt(iso: string | undefined): string { return iso ? fmtDate(iso) : '—'; }

  copyTrxId(): void { navigator.clipboard?.writeText(this.tx().transactionId); }

  onMarkPaid(): void {
    this.txService.updateStatus(this.tx().transactionId, 'paid').subscribe({
      next: () => { this.toast.success('Marked as paid'); this.close.emit(); },
      error: () => this.toast.error('Failed to update status'),
    });
  }
}
