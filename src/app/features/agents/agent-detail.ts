import { Component, inject, signal, computed, input, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { DrawerService } from '../../core/services/drawer.service';
import { AgentService } from '../../core/services/agent.service';
import { TransactionService } from '../../core/services/transaction.service';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { LineAreaChart } from '../../shared/components/charts/line-area-chart';
import { DonutChart } from '../../shared/components/charts/donut-chart';
import { AmountPipe, fmtAmountShort } from '../../shared/pipes/amount.pipe';
import { UserResponse } from '../../core/models/user.model';
import { TransactionResponse, SummaryResponse } from '../../core/models/transaction.model';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { dailySeries, fmtDateShort, fmtRelative } from '../../shared/utils/date.utils';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [FormsModule, StatusBadge, StatCard, ConfirmDialog, LineAreaChart, DonutChart, AmountPipe, PhonePipe],
  template: `
    @if (agentRes.isLoading()) {
      <div class="page"><div class="skel" style="height:120px;border-radius:var(--r-lg)"></div></div>
    } @else if (agentRes.error()) {
      <div class="page"><div style="color:var(--danger)">Failed to load agent.</div></div>
    } @else if (agent()) {
      <div class="page">
        <!-- Breadcrumb -->
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">
          <button class="btn btn-ghost btn-sm" (click)="router.navigate(['/agents'])">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Agents
          </button>
          <span style="color:var(--text-dim)">/</span>
          <span style="color:var(--text-2)">{{ agent()!.name }}</span>
        </div>

        <!-- Agent card -->
        <div class="card" style="margin-bottom:14px;padding:24px;display:flex;align-items:center;gap:20px">
          <div class="avatar avatar-xl" style="background:linear-gradient(135deg,var(--brand),var(--brand-2))">{{ initials(agent()!.name) }}</div>
          <div style="flex:1">
            @if (editing()) {
              <input class="input" style="font-size:20px;font-weight:600;padding:6px 10px;max-width:360px" [ngModel]="editName()" (ngModelChange)="editName.set($event)" autoFocus/>
            } @else {
              <div style="font-size:22px;font-weight:600;letter-spacing:-0.02em">{{ agent()!.name }}</div>
            }
            <div style="display:flex;align-items:center;gap:14px;margin-top:6px;font-size:13px;color:var(--text-muted)">
              <span style="display:flex;align-items:center;gap:6px">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span class="mono">{{ agent()!.phone | phone }}</span>
              </span>
              <span class="dot-sep"></span>
              <span>Joined {{ fmtDateShort(agent()!.createdAt) }}</span>
              <span class="dot-sep"></span>
              <app-status-badge [status]="agent()!.isActive ? 'active' : 'inactive'"/>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            @if (editing()) {
              <button class="btn" (click)="editing.set(false)">Cancel</button>
              <button class="btn btn-primary" (click)="saveEdit()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Save
              </button>
            } @else {
              <button class="btn" (click)="editing.set(true)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button class="btn" [class.btn-danger]="agent()!.isActive" (click)="showConfirm.set(true)">
                {{ agent()!.isActive ? 'Deactivate' : 'Reactivate' }}
              </button>
            }
          </div>
        </div>

        <!-- Summary stats -->
        @if (summaryRes.isLoading()) {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
            @for (_ of [1,2,3,4]; track _) { <app-stat-card label="—" value="—" [loading]="true"/> }
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px">
            <app-stat-card label="Lifetime paid" [value]="totalPaidShort()" [currency]="true" icon="wallet"/>
            <app-stat-card label="Transactions" [value]="totalTxCount()" icon="transactions"/>
            <app-stat-card label="Pending payout" [value]="pendingCount()" icon="clock"/>
            <app-stat-card label="Avg transaction" [value]="avgShort()" [currency]="true" icon="trending-up"/>
          </div>
        }

        <!-- Charts -->
        @if (!txRes.isLoading()) {
          <div style="display:grid;grid-template-columns:1.65fr 1fr;gap:14px;margin-bottom:14px">
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">Earnings — last 14 days</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Daily paid amount</div>
              </div>
              <div style="padding:8px 12px 14px">
                <app-line-area-chart [data]="dailyData()" [height]="220" valueKey="paidAmount" labelKey="shortLabel"/>
              </div>
            </div>
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">Distribution</div>
              </div>
              <div style="padding:20px;display:grid;place-items:center">
                <app-donut-chart [segments]="donutSegments()" centerLabel="Total" [centerValue]="agentTx().length" [size]="160"/>
              </div>
            </div>
          </div>

          <!-- Transactions table -->
          <div class="card" style="padding:0;overflow:hidden">
            <div style="padding:16px 20px;border-bottom:1px solid var(--divider)">
              <div style="font-size:13px;font-weight:500">Recent transactions</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ agentTx().length }} loaded</div>
            </div>
            <table class="tbl">
              <thead><tr><th>TrxID</th><th>Sender</th><th class="tbl-num">Amount</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                @for (t of agentTx().slice(0, 15); track t.id) {
                  <tr (click)="drawer.open(t)">
                    <td class="mono" style="font-size:12px">{{ t.transactionId }}</td>
                    <td class="mono" style="font-size:12px">{{ t.senderPhone | phone }}</td>
                    <td class="tbl-num mono">{{ t.amount | amount }}</td>
                    <td><app-status-badge [status]="t.status"/></td>
                    <td style="font-size:12px;color:var(--text-muted)">{{ fmtRelative(t.transactionTime) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    } @else {
      <div class="page"><div style="color:var(--text-muted)">Agent not found.</div></div>
    }

    @if (showConfirm() && agent()) {
      <app-confirm-dialog
        [title]="agent()!.isActive ? 'Deactivate this agent?' : 'Reactivate this agent?'"
        [message]="'This ' + (agent()!.isActive ? 'removes' : 'restores') + ' ' + agent()!.name + ' from the active matching pool.'"
        [confirmLabel]="agent()!.isActive ? 'Deactivate' : 'Reactivate'"
        [isDanger]="agent()!.isActive"
        (close)="showConfirm.set(false)"
        (confirm)="toggleActive()"
      />
    }
  `,
})
export class AgentDetailPage {
  id = input<string>('');

  protected router = inject(Router);
  protected drawer = inject(DrawerService);
  private toast    = inject(ToastService);
  private agentSvc = inject(AgentService);
  private txSvc    = inject(TransactionService);

  readonly editing     = signal(false);
  readonly showConfirm = signal(false);
  readonly editName    = signal('');

  readonly agentRes = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.agentSvc.get(params).pipe(map(r => r.data)),
  });

  readonly summaryRes = rxResource({
    params: () => ({ id: this.id(), period: 'monthly' }),
    stream: ({ params }) => this.txSvc.agentSummary(params.id, { period: params.period }).pipe(map(r => r.data)),
  });

  readonly txRes = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.txSvc.agentTransactions(params, { limit: 100 }).pipe(map(r => r.data ?? [])),
  });

  readonly agent = computed(() => this.agentRes.value() ?? null);
  readonly agentTx = computed(() => this.txRes.value() ?? []);

  readonly totalPaidShort = computed(() => fmtAmountShort(this.summaryRes.value()?.totalPaidAmount ?? 0).replace('৳ ', ''));
  readonly totalTxCount   = computed(() => this.summaryRes.value()?.totalTransactionCount ?? 0);
  readonly pendingCount   = computed(() => this.agentTx().filter(t => t.status === 'received').length);
  readonly avgShort       = computed(() => {
    const paid = this.summaryRes.value()?.totalPaidAmount ?? 0;
    const count = this.summaryRes.value()?.totalTransactionCount ?? 0;
    return fmtAmountShort(count ? paid / count : 0).replace('৳ ', '');
  });

  readonly dailyData = computed(() => dailySeries(this.agentTx(), 14));
  readonly donutSegments = computed(() => [
    { label: 'Paid',     value: this.agentTx().filter(t => t.status === 'paid').length,     color: 'var(--success)' },
    { label: 'Received', value: this.agentTx().filter(t => t.status === 'received').length, color: 'var(--warning)' },
  ]);

  readonly periods = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }, { key: 'custom', label: 'Custom' },
  ];

  fmtDateShort = fmtDateShort;
  fmtRelative  = fmtRelative;
  initials(name: string): string { return name.split(' ').map((s: string) => s[0]).slice(0, 2).join(''); }

  saveEdit(): void {
    const a = this.agent();
    if (!a) return;
    this.agentSvc.update(a.id, { name: this.editName() }).subscribe({
      next: (res) => { this.agentRes.reload(); this.editing.set(false); this.toast.success('Agent updated'); },
      error: () => this.toast.error('Failed to update agent'),
    });
  }

  toggleActive(): void {
    const a = this.agent();
    if (!a) return;
    this.agentSvc.update(a.id, { isActive: !a.isActive }).subscribe({
      next: () => { this.agentRes.reload(); this.toast.show(!a.isActive ? 'success' : 'info', `Agent ${!a.isActive ? 'reactivated' : 'deactivated'}`); this.showConfirm.set(false); },
      error: () => this.toast.error('Failed to update agent'),
    });
  }
}
