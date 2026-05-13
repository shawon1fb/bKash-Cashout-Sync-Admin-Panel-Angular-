import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AgentService } from '../../core/services/agent.service';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { LineAreaChart } from '../../shared/components/charts/line-area-chart';
import { BarChart } from '../../shared/components/charts/bar-chart';
import { MiniBar } from '../../shared/components/charts/mini-bar';
import { AmountPipe, fmtAmountShort } from '../../shared/pipes/amount.pipe';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { dailySeries, monthlySeries } from '../../shared/utils/date.utils';
import { TransactionResponse, SummaryResponse } from '../../core/models/transaction.model';
import { UserResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, StatCard, LineAreaChart, BarChart, MiniBar, AmountPipe, PhonePipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">{{ isAdmin() ? 'Reports' : 'My reports' }}</h1>
          <div class="page-sub">Performance breakdown — pick a period to slice</div>
        </div>
        <button class="btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
      </div>

      <!-- Filters -->
      <div class="card" style="padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">
        <div>
          <div class="label" style="margin-bottom:4px">Period</div>
          <div class="seg">
            @for (p of periods; track p.key) {
              <button [class.on]="period() === p.key" (click)="period.set(p.key)">{{ p.label }}</button>
            }
          </div>
        </div>
        @if (isAdmin()) {
          <div>
            <div class="label" style="margin-bottom:4px">Agent</div>
            <select class="input" style="width:200px;padding:6px 28px 6px 10px;font-size:12px" [ngModel]="agentFilter()" (ngModelChange)="agentFilter.set($event)">
              <option value="all">All agents</option>
              @for (a of agentsRes.value() ?? []; track a.id) {
                <option [value]="a.id">{{ a.name }}</option>
              }
            </select>
          </div>
        }
        @if (period() === 'custom') {
          <div>
            <div class="label" style="margin-bottom:4px">From</div>
            <input class="input" type="date" [ngModel]="customFrom()" (ngModelChange)="customFrom.set($event)" style="width:160px"/>
          </div>
          <div>
            <div class="label" style="margin-bottom:4px">To</div>
            <input class="input" type="date" [ngModel]="customTo()" (ngModelChange)="customTo.set($event)" style="width:160px"/>
          </div>
        }
      </div>

      <!-- Summary stats from API -->
      @if (summaryRes.isLoading()) {
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
          @for (_ of [1,2,3]; track _) { <app-stat-card label="—" value="—" [loading]="true"/> }
        </div>
      } @else {
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px">
          <app-stat-card label="Total paid" [value]="totalPaidShort()" [currency]="true" icon="wallet"/>
          <app-stat-card label="Total transactions" [value]="summaryRes.value()?.totalTransactionCount ?? 0" icon="transactions"/>
          <app-stat-card label="Average amount" [value]="avgShort()" [currency]="true" icon="trending-up"/>
        </div>
      }

      <!-- Charts from transaction list -->
      @if (txRes.isLoading()) {
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px">
          <div class="card" style="height:320px;display:grid;place-items:center"><div class="skel" style="width:80%;height:200px"></div></div>
          <div class="card" style="height:320px;display:grid;place-items:center"><div class="skel" style="width:80%;height:200px"></div></div>
        </div>
      } @else {
        <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px">
          <div class="card">
            <div style="padding:16px 20px 0">
              <div style="font-size:13px;font-weight:500">Revenue trend</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ period() === 'monthly' ? 'Last 6 months' : 'Last 14 days' }}</div>
            </div>
            <div style="padding:8px 12px 14px">
              <app-line-area-chart [data]="chartSeries()" [height]="260" valueKey="paidAmount" [labelKey]="period() === 'monthly' ? 'label' : 'shortLabel'"/>
            </div>
          </div>
          <div class="card">
            <div style="padding:16px 20px 0">
              <div style="font-size:13px;font-weight:500">Transaction volume</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Count by {{ period() === 'monthly' ? 'month' : 'day' }}</div>
            </div>
            <div style="padding:8px 12px 14px">
              <app-bar-chart [data]="chartSeries()" [height]="260" valueKey="count" [labelKey]="period() === 'monthly' ? 'label' : 'shortLabel'" [currency]="false"/>
            </div>
          </div>
        </div>
      }

      <!-- Agent leaderboard (admin only) -->
      @if (isAdmin() && !txRes.isLoading()) {
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:16px 20px;display:flex;justify-content:space-between;border-bottom:1px solid var(--divider)">
            <div>
              <div style="font-size:13px;font-weight:500">Agent leaderboard</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Sorted by total paid</div>
            </div>
          </div>
          <table class="tbl">
            <thead><tr>
              <th style="width:40px">#</th><th>Agent</th><th>Phone</th>
              <th class="tbl-num">Total paid</th><th class="tbl-num">Txns</th>
              <th class="tbl-num">Avg amount</th><th style="width:180px">Performance</th>
            </tr></thead>
            <tbody>
              @for (p of agentPerf(); track p.agent.id; let i = $index) {
                <tr (click)="router.navigate(['/agents', p.agent.id])">
                  <td style="color:var(--text-muted);font-family:var(--font-mono)">
                    @if (i === 0) { <span style="color:var(--brand)">★</span> } @else { {{ (i+1).toString().padStart(2,'0') }} }
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px">
                      <div class="avatar" [style.background]="'hsl('+((i*53)%360)+',60%,55%)'">{{ initials(p.agent.name) }}</div>
                      <span style="font-size:13px;font-weight:500">{{ p.agent.name }}</span>
                    </div>
                  </td>
                  <td class="mono" style="font-size:12px;color:var(--text-muted)">{{ p.agent.phone | phone }}</td>
                  <td class="tbl-num mono" style="font-weight:500">{{ p.total | amount }}</td>
                  <td class="tbl-num mono">{{ p.count }}</td>
                  <td class="tbl-num mono" style="color:var(--text-muted)">{{ p.count ? p.total / p.count : 0 | amount }}</td>
                  <td><app-mini-bar [value]="p.total" [max]="agentPerf()[0]?.total || 1"/></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class ReportsPage {
  protected router = inject(Router);
  private auth     = inject(AuthService);
  private txSvc    = inject(TransactionService);
  private agentSvc = inject(AgentService);

  readonly isAdmin     = computed(() => this.auth.currentUser()?.role === 'admin');
  readonly period      = signal('monthly');
  readonly agentFilter = signal('all');
  readonly customFrom  = signal('');
  readonly customTo    = signal('');

  readonly periods = [
    { key: 'daily', label: 'Daily' }, { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' }, { key: 'custom', label: 'Custom' },
  ];

  private readonly summaryQuery = computed((): { period: string; agentId?: string; from?: string; to?: string } => ({
    period: this.period(),
    agentId: this.isAdmin() && this.agentFilter() !== 'all' ? this.agentFilter() : undefined,
    from: this.period() === 'custom' && this.customFrom() ? new Date(this.customFrom()).toISOString() : undefined,
    to:   this.period() === 'custom' && this.customTo()   ? new Date(this.customTo()).toISOString()   : undefined,
  }));

  private readonly txQuery = computed((): { agentId?: string; from?: string; to?: string; limit: number } => ({
    agentId: this.isAdmin() && this.agentFilter() !== 'all' ? this.agentFilter() : undefined,
    ...this.dateParams(),
    limit: 300,
  }));

  // Summary from API
  readonly summaryRes = rxResource({
    params: this.summaryQuery,
    stream: ({ params }) => {
      if (this.isAdmin()) return this.txSvc.adminSummary({ period: params.period, from: params.from, to: params.to }).pipe(map(r => r.data));
      return this.txSvc.summary({ period: params.period, from: params.from, to: params.to }).pipe(map(r => r.data));
    },
  });

  // Transactions for chart rendering
  readonly txRes = rxResource({
    params: this.txQuery,
    stream: ({ params }) => {
      if (this.isAdmin()) return this.txSvc.adminList(params as any).pipe(map(r => r.data ?? []));
      return this.txSvc.list(params as any).pipe(map(r => r.data ?? []));
    },
  });

  readonly agentsRes = rxResource({
    stream: () => this.agentSvc.list({ limit: 100 }).pipe(map(r => r.data ?? [])),
  });

  readonly txList = computed(() => this.txRes.value() ?? []);

  readonly chartSeries = computed(() =>
    this.period() === 'monthly' ? monthlySeries(this.txList(), 6) : dailySeries(this.txList(), 14)
  );

  readonly totalPaidShort = computed(() => fmtAmountShort(this.summaryRes.value()?.totalPaidAmount ?? 0).replace('৳ ', ''));
  readonly avgShort = computed(() => {
    const paid  = this.summaryRes.value()?.totalPaidAmount ?? 0;
    const count = this.summaryRes.value()?.totalTransactionCount ?? 0;
    return fmtAmountShort(count ? paid / count : 0).replace('৳ ', '');
  });

  readonly agentPerf = computed(() => {
    const txs = this.txList();
    return (this.agentsRes.value() ?? [])
      .map(a => {
        const mine = txs.filter(t => t.agentId === a.id && t.status === 'paid');
        return { agent: a, total: mine.reduce((s, t) => s + parseFloat(t.amount), 0), count: mine.length };
      })
      .sort((a, b) => b.total - a.total);
  });

  private dateParams(): { from?: string; to?: string } {
    if (this.period() === 'custom') {
      const from = this.customFrom() ? new Date(this.customFrom()).toISOString() : undefined;
      const to   = this.customTo()   ? new Date(this.customTo()).toISOString()   : undefined;
      return { from, to };
    }
    const daysMap: Record<string, number> = { daily: 14, weekly: 90, monthly: 180 };
    const days = daysMap[this.period()] ?? 90;
    const from = new Date(); from.setDate(from.getDate() - days);
    return { from: from.toISOString() };
  }

  initials(name: string): string { return name.split(' ').map((s: string) => s[0]).slice(0, 2).join(''); }
}
