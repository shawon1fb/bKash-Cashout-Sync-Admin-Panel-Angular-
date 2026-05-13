import { Component, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DrawerService } from '../../core/services/drawer.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AgentService } from '../../core/services/agent.service';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { LineAreaChart } from '../../shared/components/charts/line-area-chart';
import { BarChart } from '../../shared/components/charts/bar-chart';
import { DonutChart } from '../../shared/components/charts/donut-chart';
import { Heatmap } from '../../shared/components/charts/heatmap';
import { MiniBar } from '../../shared/components/charts/mini-bar';
import { AmountPipe, fmtAmountShort } from '../../shared/pipes/amount.pipe';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { dailySeries, monthlySeries, fmtDate, fmtRelative } from '../../shared/utils/date.utils';
import { TransactionResponse } from '../../core/models/transaction.model';
import { UserResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatCard, StatusBadge, LineAreaChart, BarChart, DonutChart, Heatmap, MiniBar, AmountPipe, PhonePipe],
  template: `
    @if (isAdmin()) {
      <!-- Admin Dashboard -->
      <div class="page">
        <div class="page-head">
          <div>
            <div style="display:flex;align-items:center;gap:10px">
              <h1 class="page-title">Overview</h1>
              <span class="pill pill-success" style="font-size:11px"><span class="live-dot"></span>Live</span>
            </div>
            <div class="page-sub">{{ today }} — Across all agents</div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary" (click)="router.navigate(['/upload'])">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Upload SMS
            </button>
          </div>
        </div>

        @if (adminTxRes.isLoading() || agentsRes.isLoading()) {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
            @for (_ of [1,2,3,4]; track _) { <app-stat-card label="Loading" value="—" [loading]="true"/> }
          </div>
        } @else if (adminTxRes.error()) {
          <div style="padding:40px;text-align:center;color:var(--danger)">Failed to load data. Check backend connection.</div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
            <app-stat-card label="Total paid amount" [value]="totalPaidShort()" [currency]="true" trend="+12.4% vs last month" trendDir="up" icon="wallet" [sparkData]="dailyData().slice(-12).map(toAmount)"/>
            <app-stat-card label="Total transactions" [value]="allTx().length" icon="transactions" [sparkData]="dailyData().slice(-12).map(toCount)"/>
            <app-stat-card label="Active agents" [value]="activeAgentCount()" [trend]="(allAgents().length - activeAgentCount()) + ' inactive'" trendDir="down" icon="agents"/>
            <app-stat-card label="Pending (received)" [value]="receivedTx().length" [trend]="receivedAmountShort()" icon="clock" [sparkData]="dailyData().slice(-12).map(toRecvCount)"/>
          </div>

          <div style="display:grid;grid-template-columns:1.65fr 1fr;gap:14px;margin-bottom:14px">
            <div class="card">
              <div style="padding:16px 20px 0;display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <div style="font-size:13px;font-weight:500">Daily volume</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Paid amount, last 14 days</div>
                </div>
              </div>
              <div style="padding:8px 12px 14px">
                <app-line-area-chart [data]="dailyData()" [height]="240" valueKey="paidAmount" labelKey="shortLabel"/>
              </div>
            </div>
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">Status split</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ allTx().length }} total transactions</div>
              </div>
              <div style="padding:20px;display:grid;place-items:center">
                <app-donut-chart [segments]="donutSegments()" centerLabel="Total" [centerValue]="allTx().length" [size]="170"/>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">Monthly revenue</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Last 6 months</div>
              </div>
              <div style="padding:8px 12px 14px">
                <app-bar-chart [data]="monthlyData()" [height]="210" valueKey="paidAmount" labelKey="label"/>
              </div>
            </div>
            <div class="card">
              <div style="padding:16px 20px 0;display:flex;justify-content:space-between">
                <div>
                  <div style="font-size:13px;font-weight:500">Transaction activity</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Last 7 weeks · darker = busier</div>
                </div>
              </div>
              <div style="padding:20px;display:grid;place-items:center">
                <app-heatmap [data]="heatmapData()" [days]="49"/>
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1.7fr 1fr;gap:14px">
            <div class="card">
              <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--divider)">
                <div>
                  <div style="font-size:13px;font-weight:500">Recent transactions</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Latest activity across all agents</div>
                </div>
                <button class="btn btn-sm btn-ghost" (click)="router.navigate(['/transactions'])">View all
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
              <div style="overflow:auto">
                <table class="tbl">
                  <thead><tr><th>TrxID</th><th>Agent</th><th class="tbl-num">Amount</th><th>Status</th><th>Time</th></tr></thead>
                  <tbody>
                    @for (t of recentTx(); track t.id) {
                      <tr (click)="drawer.open(t)">
                        <td><span class="mono" style="font-size:12px">{{ t.transactionId }}</span></td>
                        <td>
                          <div style="display:flex;align-items:center;gap:8px">
                            <div class="avatar" style="width:22px;height:22px;font-size:9px">{{ initials(t.agentName) }}</div>
                            <span style="font-size:13px">{{ (t.agentName || '').split(' ')[0] }}</span>
                          </div>
                        </td>
                        <td class="tbl-num mono">{{ t.amount | amount }}</td>
                        <td><app-status-badge [status]="t.status"/></td>
                        <td style="color:var(--text-muted);font-size:12px">{{ fmtRelative(t.transactionTime) }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <div class="card">
              <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--divider)">
                <div>
                  <div style="font-size:13px;font-weight:500">Top agents</div>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:2px">By paid amount</div>
                </div>
                <button class="btn btn-sm btn-ghost" (click)="router.navigate(['/agents'])">All agents
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
              <div style="padding:14px">
                @for (a of topAgents(); track a.agent.id; let i = $index) {
                  <div style="padding:10px 8px;cursor:pointer" [style.border-bottom]="i < topAgents().length-1 ? '1px solid var(--divider)' : 'none'" (click)="router.navigate(['/agents',a.agent.id])">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                      <div class="avatar" [style.background]="'hsl('+((i*67)%360)+',60%,55%)'">{{ initials(a.agent.name) }}</div>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:13px;font-weight:500">{{ a.agent.name }}</div>
                        <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">{{ a.agent.phone | phone }}</div>
                      </div>
                      <div style="text-align:right">
                        <div class="mono" style="font-size:13px;font-weight:500">{{ fmtShort(a.totalPaid) }}</div>
                        <div style="font-size:10px;color:var(--text-muted)">{{ a.txCount }} txns</div>
                      </div>
                    </div>
                    <app-mini-bar [value]="a.totalPaid" [max]="topAgents()[0].totalPaid || 1"/>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    } @else {
      <!-- Agent Dashboard -->
      <div class="page">
        <div class="page-head">
          <div>
            <h1 class="page-title">Welcome, {{ firstName() }}</h1>
            <div class="page-sub">{{ today }} — Your activity at a glance</div>
          </div>
        </div>

        @if (agentTxRes.isLoading()) {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
            @for (_ of [1,2,3,4]; track _) { <app-stat-card label="Loading" value="—" [loading]="true"/> }
          </div>
        } @else {
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
            <app-stat-card label="Today paid" [value]="agentTodayPaidShort()" [currency]="true" icon="wallet" [trend]="myTodayTx().length + ' txns'" trendDir="up"/>
            <app-stat-card label="This week" [value]="agentWeekPaidShort()" [currency]="true" icon="trending-up" [sparkData]="myDailyData().slice(-7).map(toAmount)"/>
            <app-stat-card label="This month" [value]="agentMonthPaidShort()" [currency]="true" icon="trending-up"/>
            <app-stat-card label="Today txns" [value]="myTodayTx().length" icon="transactions" [trend]="myTodayTx().filter(isPending).length + ' pending'"/>
          </div>

          <div style="display:grid;grid-template-columns:1.65fr 1fr;gap:14px;margin-bottom:14px">
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">Daily earnings</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Last 14 days</div>
              </div>
              <div style="padding:8px 12px 14px">
                <app-line-area-chart [data]="myDailyData()" [height]="220" valueKey="paidAmount" labelKey="shortLabel"/>
              </div>
            </div>
            <div class="card">
              <div style="padding:16px 20px 0">
                <div style="font-size:13px;font-weight:500">By status</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ myTx().length }} total</div>
              </div>
              <div style="padding:20px;display:grid;place-items:center">
                <app-donut-chart [segments]="myDonutSegments()" centerLabel="Txns" [centerValue]="myTx().length" [size]="160"/>
              </div>
            </div>
          </div>

          <div class="card">
            <div style="padding:16px 20px;border-bottom:1px solid var(--divider)">
              <div style="font-size:13px;font-weight:500">My recent transactions</div>
            </div>
            <table class="tbl">
              <thead><tr><th>TrxID</th><th>Sender</th><th class="tbl-num">Amount</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                @for (t of myRecentTx(); track t.id) {
                  <tr (click)="drawer.open(t)">
                    <td><span class="mono" style="font-size:12px">{{ t.transactionId }}</span></td>
                    <td class="mono" style="font-size:12px">{{ t.senderPhone | phone }}</td>
                    <td class="tbl-num mono">{{ t.amount | amount }}</td>
                    <td><app-status-badge [status]="t.status"/></td>
                    <td style="color:var(--text-muted);font-size:12px">{{ fmtRelative(t.transactionTime) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    }
  `,
})
export class DashboardPage {
  protected router = inject(Router);
  protected drawer = inject(DrawerService);
  private auth     = inject(AuthService);
  private txSvc    = inject(TransactionService);
  private agentSvc = inject(AgentService);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');
  readonly today   = fmtDate(new Date().toISOString(), false);
  readonly firstName = computed(() => this.auth.currentUser()?.name?.split(' ')[0] ?? '');

  // ── Admin: fetch last 300 transactions for charts ─────────────────
  readonly adminTxRes = rxResource({
    stream: () => this.txSvc.adminList({ limit: 300, page: 1 }).pipe(map(r => r.data ?? [])),
  });

  readonly agentsRes = rxResource({
    stream: () => this.agentSvc.list({ limit: 100 }).pipe(map(r => r.data ?? [])),
  });

  readonly allTx     = computed(() => this.adminTxRes.value() ?? []);
  readonly allAgents = computed(() => this.agentsRes.value() ?? []);

  readonly paidTx     = computed(() => this.allTx().filter(t => t.status === 'paid'));
  readonly receivedTx = computed(() => this.allTx().filter(t => t.status === 'received'));
  readonly activeAgentCount = computed(() => this.allAgents().filter(a => a.isActive).length);

  readonly totalPaidShort      = computed(() => fmtAmountShort(this.paidTx().reduce((s, t) => s + parseFloat(t.amount), 0)).replace('৳ ', ''));
  readonly receivedAmountShort = computed(() => fmtAmountShort(this.receivedTx().reduce((s, t) => s + parseFloat(t.amount), 0)));

  readonly dailyData   = computed(() => dailySeries(this.allTx(), 14));
  readonly monthlyData = computed(() => monthlySeries(this.allTx(), 6));
  readonly heatmapData = computed(() => dailySeries(this.allTx(), 49));
  readonly recentTx    = computed(() => this.allTx().slice(0, 8));

  readonly topAgents = computed(() => {
    const txs = this.allTx();
    return this.allAgents()
      .map(a => {
        const mine = txs.filter(t => t.agentId === a.id && t.status === 'paid');
        return { agent: a, totalPaid: mine.reduce((s, t) => s + parseFloat(t.amount), 0), txCount: mine.length };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 5);
  });

  readonly donutSegments = computed(() => [
    { label: 'Paid',     value: this.paidTx().length,     color: 'var(--success)' },
    { label: 'Received', value: this.receivedTx().length, color: 'var(--warning)' },
  ]);

  // ── Agent: fetch own transactions ─────────────────────────────────
  readonly agentTxRes = rxResource({
    stream: () => this.txSvc.list({ limit: 300, page: 1 }).pipe(map(r => r.data ?? [])),
  });

  readonly myTx = computed(() => this.agentTxRes.value() ?? []);
  readonly myDailyData = computed(() => dailySeries(this.myTx(), 14));

  readonly myTodayTx = computed(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.myTx().filter(t => new Date(t.transactionTime) >= today);
  });
  readonly myWeekTx = computed(() => {
    const w = new Date(); w.setDate(w.getDate() - 7);
    return this.myTx().filter(t => new Date(t.transactionTime) >= w);
  });
  readonly myMonthTx = computed(() => {
    const m = new Date(); m.setMonth(m.getMonth() - 1);
    return this.myTx().filter(t => new Date(t.transactionTime) >= m);
  });

  readonly agentTodayPaidShort  = computed(() => fmtAmountShort(this.myTodayTx().filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount), 0)).replace('৳ ', ''));
  readonly agentWeekPaidShort   = computed(() => fmtAmountShort(this.myWeekTx().filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount), 0)).replace('৳ ', ''));
  readonly agentMonthPaidShort  = computed(() => fmtAmountShort(this.myMonthTx().filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount), 0)).replace('৳ ', ''));
  readonly myRecentTx           = computed(() => this.myTx().slice(0, 8));
  readonly myDonutSegments      = computed(() => [
    { label: 'Paid',     value: this.myTx().filter(t => t.status === 'paid').length,     color: 'var(--success)' },
    { label: 'Received', value: this.myTx().filter(t => t.status === 'received').length, color: 'var(--warning)' },
  ]);

  readonly toAmount    = (d: any) => d.paidAmount;
  readonly toCount     = (d: any) => d.count;
  readonly toRecvCount = (d: any) => d.receivedCount;
  readonly isPending   = (t: TransactionResponse) => t.status === 'received';

  fmtRelative = fmtRelative;
  fmtShort    = fmtAmountShort;
  initials(name: string | undefined): string {
    return (name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('');
  }
}
