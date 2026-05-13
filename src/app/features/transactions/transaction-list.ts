import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource, toSignal, toObservable } from '@angular/core/rxjs-interop';
import { map, debounceTime } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DrawerService } from '../../core/services/drawer.service';
import { ToastService } from '../../core/services/toast.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AgentService } from '../../core/services/agent.service';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { Pagination } from '../../shared/components/pagination/pagination';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { fmtRelative, fmtDateShort } from '../../shared/utils/date.utils';
import { ApiResponse } from '../../core/models/api-response.model';
import { UserResponse } from '../../core/models/user.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [FormsModule, StatusBadge, Pagination, AmountPipe, PhonePipe],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">{{ isAdmin() ? 'Transactions' : 'My transactions' }}</h1>
          <div class="page-sub">
            {{ totalItems() }} txns
            <span class="dot-sep"></span>
            <span class="mono">{{ totalAmount() | amount }}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" (click)="router.navigate(['/upload'])">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Upload SMS
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="padding:14px;margin-bottom:14px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="position:relative;flex:0 0 300px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-muted)"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="input" style="padding-left:32px" placeholder="Search TrxID or sender phone…" [ngModel]="search()" (ngModelChange)="onSearch($event)"/>
          </div>
          <div style="display:flex;gap:6px">
            @for (s of statusOptions; track s.key) {
              <button class="chip" [class.on]="statusFilter() === s.key" (click)="statusFilter.set(s.key); page.set(1)">
                @if (s.key !== 'all') {
                  <span style="width:7px;height:7px;border-radius:50%" [style.background]="s.key === 'paid' ? 'var(--success)' : 'var(--warning)'"></span>
                }
                {{ s.label }}
              </button>
            }
          </div>
          @if (isAdmin()) {
            <select class="input" style="width:auto;padding:6px 28px 6px 10px;font-size:12px" [ngModel]="agentFilter()" (ngModelChange)="agentFilter.set($event); page.set(1)">
              <option value="all">All agents</option>
              @for (a of agentsRes.value() ?? []; track a.id) {
                <option [value]="a.id">{{ a.name }}</option>
              }
            </select>
          }
          <div class="seg">
            @for (r of dateRanges; track r.key) {
              <button [class.on]="dateRange() === r.key" (click)="dateRange.set(r.key); page.set(1)">{{ r.label }}</button>
            }
          </div>
          <div style="flex:1"></div>
          @if (search() || statusFilter() !== 'all' || agentFilter() !== 'all') {
            <button class="btn btn-sm btn-ghost" (click)="resetFilters()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Reset
            </button>
          }
        </div>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="overflow-x:auto">
          <table class="tbl">
            <thead>
              <tr>
                <th>TrxID</th>
                @if (isAdmin()) { <th>Agent</th> }
                <th>Sender</th>
                <th class="tbl-num">Amount</th>
                <th class="tbl-num">Fee</th>
                <th>Status</th>
                <th>Time</th>
                <th style="width:100px"></th>
              </tr>
            </thead>
            <tbody>
              @if (txRes.isLoading()) {
                @for (_ of skelRows; track _) {
                  <tr>
                    <td colspan="8">
                      <div class="skel" style="height:20px;width:100%;border-radius:4px"></div>
                    </td>
                  </tr>
                }
              } @else if (txRes.error()) {
                <tr><td [attr.colspan]="isAdmin() ? 8 : 7" style="padding:40px;text-align:center;color:var(--danger)">Failed to load. Check backend.</td></tr>
              } @else if (!items().length) {
                <tr>
                  <td [attr.colspan]="isAdmin() ? 8 : 7" style="padding:60px;text-align:center">
                    <div style="color:var(--text-muted)">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4;margin-bottom:8px;display:block;margin-inline:auto"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <div style="font-size:14px">No transactions match your filters</div>
                    </div>
                  </td>
                </tr>
              }
              @for (t of items(); track t.id) {
                <tr (click)="drawer.open(t)" [class.row-new]="t.isNew">
                  <td>
                    <div style="display:flex;align-items:center;gap:6px">
                      <span class="mono" style="font-size:12px;font-weight:500">{{ t.transactionId }}</span>
                      <button class="btn btn-ghost btn-sm btn-icon" title="Copy" (click)="copy(t.transactionId, $event)">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    </div>
                  </td>
                  @if (isAdmin()) {
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="avatar" style="width:22px;height:22px;font-size:9px">{{ initials(t.agentName) }}</div>
                        <span style="font-size:13px">{{ t.agentName }}</span>
                      </div>
                    </td>
                  }
                  <td class="mono" style="font-size:12px;color:var(--text-2)">{{ t.senderPhone | phone }}</td>
                  <td class="tbl-num mono" style="font-weight:500">{{ t.amount | amount }}</td>
                  <td class="tbl-num mono" style="color:var(--text-muted);font-size:12px">{{ t.fee | amount:false }}</td>
                  <td><app-status-badge [status]="t.status"/></td>
                  <td>
                    <div style="font-size:12px">{{ fmtRelative(t.transactionTime) }}</div>
                    <div style="font-size:10px;color:var(--text-dim)">{{ fmtDateShort(t.transactionTime) }}</div>
                  </td>
                  <td style="text-align:right">
                    @if (t.status === 'received') {
                      <button class="btn btn-sm" (click)="markPaid(t.transactionId, $event)">Mark paid</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-pagination
          [page]="page()"
          [totalPages]="totalPages()"
          [pageSize]="pageSize()"
          [totalItems]="totalItems()"
          (pageChange)="page.set($event)"
          (pageSizeChange)="pageSize.set($event); page.set(1)"/>
      </div>
    </div>
  `,
})
export class TransactionListPage {
  protected router = inject(Router);
  protected drawer = inject(DrawerService);
  private auth     = inject(AuthService);
  private toast    = inject(ToastService);
  private txSvc    = inject(TransactionService);
  private agentSvc = inject(AgentService);

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'admin');

  readonly search       = signal('');
  readonly statusFilter = signal('all');
  readonly agentFilter  = signal('all');
  readonly dateRange    = signal('30d');
  readonly sortDesc     = signal(true);
  readonly page         = signal(1);
  readonly pageSize     = signal(25);

  private readonly debouncedSearch = toSignal(
    toObservable(this.search).pipe(debounceTime(400)),
    { initialValue: '' }
  );

  readonly skelRows = [1,2,3,4,5,6,7,8];

  readonly statusOptions = [
    { key: 'all', label: 'All' }, { key: 'paid', label: 'Paid' }, { key: 'received', label: 'Received' },
  ];
  readonly dateRanges = [
    { key: '7d', label: '7d' }, { key: '30d', label: '30d' }, { key: '90d', label: '90d' }, { key: 'all', label: 'All time' },
  ];

  // Agents list for admin filter dropdown
  readonly agentsRes = rxResource({
    stream: () => this.agentSvc.list({ limit: 100 }).pipe(map(r => r.data ?? [])),
  });

  private readonly txQuery = computed(() => ({
    page: this.page(),
    limit: this.pageSize(),
    status: this.statusFilter() !== 'all' ? (this.statusFilter() as any) : undefined,
    agentId: this.isAdmin() && this.agentFilter() !== 'all' ? this.agentFilter() : undefined,
    search: this.debouncedSearch() || undefined,
    ...this.dateRangeParams(),
    _r: this.txSvc.reloadTrigger(),
  }));

  // Transactions — reactive to all filter signals
  readonly txRes = rxResource({
    params: this.txQuery,
    stream: ({ params }) => {
      const { _r, ...query } = params as any;
      const obs = this.isAdmin()
        ? this.txSvc.adminList(query)
        : this.txSvc.list(query);
      return obs.pipe(map(r => r));
    },
  });

  readonly items      = computed(() => this.txRes.value()?.data ?? []);
  readonly totalItems = computed(() => this.txRes.value()?.meta?.total ?? 0);
  readonly totalPages = computed(() => this.txRes.value()?.meta?.totalPages ?? 1);
  readonly totalAmount = computed(() => this.items().reduce((s, t) => s + parseFloat(t.amount), 0));

  fmtRelative  = fmtRelative;
  fmtDateShort = fmtDateShort;

  initials(name: string | undefined): string {
    return (name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('');
  }

  private dateRangeParams(): { from?: string } {
    const days: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const d = days[this.dateRange()];
    if (!d) return {};
    const from = new Date();
    from.setDate(from.getDate() - d);
    return { from: from.toISOString() };
  }

  onSearch(v: string): void {
    this.search.set(v);
    this.page.set(1);
  }

  resetFilters(): void {
    this.search.set(''); this.statusFilter.set('all'); this.agentFilter.set('all');
    this.page.set(1);
  }

  copy(id: string, e: Event): void {
    e.stopPropagation(); navigator.clipboard?.writeText(id);
  }

  markPaid(id: string, e: Event): void {
    e.stopPropagation();
    this.txSvc.updateStatus(id, 'paid').subscribe({
      next: () => { this.toast.success('Marked as paid'); this.txRes.reload(); },
      error: () => this.toast.error('Failed to update status'),
    });
  }
}
