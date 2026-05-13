import { Component, inject, signal, computed, output, input } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { AgentService, AgentQuery } from '../../core/services/agent.service';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { AmountPipe } from '../../shared/pipes/amount.pipe';
import { PhonePipe } from '../../shared/pipes/phone.pipe';
import { fmtDateShort } from '../../shared/utils/date.utils';
import { UserResponse } from '../../core/models/user.model';
import { ApiResponse } from '../../core/models/api-response.model';

@Component({
  selector: 'app-create-agent-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dialog-backdrop" (click)="close.emit()">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div style="padding:18px 22px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--divider)">
          <div>
            <div style="font-size:16px;font-weight:600">Add new agent</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">They'll appear in the matching pool immediately.</div>
          </div>
          <button class="btn btn-ghost btn-icon" (click)="close.emit()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style="padding:22px">
          <div style="margin-bottom:14px">
            <label class="label">Full name</label>
            <input class="input" placeholder="e.g. Rakib Hasan" [ngModel]="name()" (ngModelChange)="name.set($event); nameErr.set('')" autoFocus/>
            @if (nameErr()) { <div style="color:var(--danger);font-size:12px;margin-top:5px">{{ nameErr() }}</div> }
          </div>
          <div>
            <label class="label">Agent phone number</label>
            <div style="position:relative">
              <span style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text-muted);pointer-events:none">+880</span>
              <input class="input" style="padding-left:50px;font-family:var(--font-mono)" placeholder="01XXXXXXXXX"
                [ngModel]="phone()" (ngModelChange)="onPhoneInput($event)" maxlength="11"/>
            </div>
            @if (phoneErr()) { <div style="color:var(--danger);font-size:12px;margin-top:5px">{{ phoneErr() }}</div> }
            <div style="font-size:11px;color:var(--text-muted);margin-top:6px">Must be the bKash-registered agent SIM</div>
          </div>
        </div>
        <div style="padding:14px 22px;border-top:1px solid var(--divider);display:flex;justify-content:flex-end;gap:8px">
          <button class="btn" (click)="close.emit()">Cancel</button>
          <button class="btn btn-primary" (click)="submit()" [disabled]="busy()" [style.opacity]="busy() ? 0.6 : 1">
            @if (busy()) { Creating… } @else {
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Create agent
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CreateAgentDialog {
  existingPhones = input<string[]>([]);
  close   = output<void>();
  created = output<{ name: string; phone: string }>();

  readonly name     = signal('');
  readonly phone    = signal('');
  readonly nameErr  = signal('');
  readonly phoneErr = signal('');
  readonly busy     = signal(false);

  onPhoneInput(v: string): void { this.phone.set(v.replace(/\D/g, '').slice(0, 11)); this.phoneErr.set(''); }

  submit(): void {
    let valid = true;
    if (this.name().length < 2 || this.name().length > 100) { this.nameErr.set('Name must be 2–100 characters'); valid = false; }
    if (!/^01[3-9]\d{8}$/.test(this.phone())) { this.phoneErr.set('Invalid Bangladeshi number'); valid = false; }
    else if (this.existingPhones().includes(this.phone())) { this.phoneErr.set('Phone already registered'); valid = false; }
    if (!valid) return;
    this.busy.set(true);
    setTimeout(() => { this.created.emit({ name: this.name(), phone: this.phone() }); this.busy.set(false); }, 100);
  }
}

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [FormsModule, StatusBadge, ConfirmDialog, PhonePipe, CreateAgentDialog],
  template: `
    <div class="page">
      <div class="page-head">
        <div>
          <h1 class="page-title">Agents</h1>
          <div class="page-sub">
            {{ totalItems() }} total
            <span class="dot-sep"></span>
            <span style="color:var(--success)">{{ activeCount() }} active</span>
          </div>
        </div>
        <button class="btn btn-primary" (click)="showCreate.set(true)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add agent
        </button>
      </div>

      <div class="card" style="padding:14px;margin-bottom:14px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div style="position:relative;flex:0 0 320px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--text-muted)"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="input" style="padding-left:32px" placeholder="Search by name or phone…" [ngModel]="search()" (ngModelChange)="onSearch($event)"/>
          </div>
          <div class="seg">
            <button [class.on]="activeFilter() === 'all'"      (click)="activeFilter.set('all'); page.set(1)">All</button>
            <button [class.on]="activeFilter() === 'active'"   (click)="activeFilter.set('active'); page.set(1)">Active</button>
            <button [class.on]="activeFilter() === 'inactive'" (click)="activeFilter.set('inactive'); page.set(1)">Inactive</button>
          </div>
          <div style="flex:1"></div>
          <span style="font-size:12px;color:var(--text-muted)">Sort:</span>
          <select class="input" style="width:auto;padding:6px 26px 6px 10px;font-size:12px" [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
            <option value="name">Name</option>
            <option value="createdAt">Date added</option>
          </select>
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden">
        <table class="tbl">
          <thead><tr>
            <th>Agent</th><th>Phone</th><th>Status</th><th>Joined</th><th style="width:100px"></th>
          </tr></thead>
          <tbody>
            @if (agentsRes.isLoading()) {
              @for (_ of [1,2,3,4,5]; track _) {
                <tr><td colspan="5"><div class="skel" style="height:20px;width:100%;border-radius:4px"></div></td></tr>
              }
            } @else if (agentsRes.error()) {
              <tr><td colspan="5" style="padding:40px;text-align:center;color:var(--danger)">Failed to load agents.</td></tr>
            } @else if (!items().length) {
              <tr><td colspan="5" style="padding:60px;text-align:center;color:var(--text-muted)">
                <div style="font-size:14px">No agents match your filters</div>
              </td></tr>
            }
            @for (a of items(); track a.id; let i = $index) {
              <tr (click)="router.navigate(['/agents',a.id])">
                <td>
                  <div style="display:flex;align-items:center;gap:10px">
                    <div class="avatar" [style.background]="'linear-gradient(135deg,hsl('+((i*53)%360)+',60%,55%),hsl('+((i*53+40)%360)+',60%,45%))'">{{ initials(a.name) }}</div>
                    <div>
                      <div style="font-size:13px;font-weight:500">{{ a.name }}</div>
                      <div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono)">{{ a.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="mono" style="font-size:12px">{{ a.phone | phone }}</td>
                <td><app-status-badge [status]="a.isActive ? 'active' : 'inactive'"/></td>
                <td style="font-size:12px;color:var(--text-muted)">{{ fmtDateShort(a.createdAt) }}</td>
                <td style="text-align:right">
                  <div style="display:inline-flex;gap:4px">
                    <button class="btn btn-sm btn-ghost btn-icon" (click)="$event.stopPropagation(); router.navigate(['/agents',a.id])" title="View">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="btn btn-sm btn-ghost btn-icon" (click)="$event.stopPropagation(); confirm.set(a)" [title]="a.isActive ? 'Deactivate' : 'Reactivate'">
                      @if (a.isActive) {
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      } @else {
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (showCreate()) {
      <app-create-agent-dialog
        [existingPhones]="items().map(toPhone)"
        (close)="showCreate.set(false)"
        (created)="onCreated($event)"/>
    }

    @if (confirm()) {
      <app-confirm-dialog
        [title]="confirm()!.isActive ? 'Deactivate agent?' : 'Reactivate agent?'"
        [message]="confirm()!.isActive ? 'This will prevent ' + confirm()!.name + ' from being matched on incoming transactions.' : 'This will reactivate ' + confirm()!.name + '.'"
        [confirmLabel]="confirm()!.isActive ? 'Deactivate' : 'Reactivate'"
        [isDanger]="confirm()!.isActive"
        (close)="confirm.set(null)"
        (confirm)="deactivate(confirm()!)"
      />
    }
  `,
})
export class AgentListPage {
  protected router  = inject(Router);
  private toast     = inject(ToastService);
  private agentSvc  = inject(AgentService);

  readonly search       = signal('');
  readonly activeFilter = signal('all');
  readonly sortBy       = signal('name');
  readonly page         = signal(1);
  readonly pageSize     = signal(50);
  readonly showCreate   = signal(false);
  readonly confirm      = signal<UserResponse | null>(null);
  private searchTimeout: any;

  private readonly agentQuery = computed((): AgentQuery => ({
    search: this.search() || undefined,
    isActive: this.activeFilter() === 'all' ? undefined : this.activeFilter() === 'active',
    sortBy: this.sortBy(),
    sortOrder: 'asc',
    limit: this.pageSize(),
    page: this.page(),
  }));

  readonly agentsRes = rxResource({
    params: this.agentQuery,
    stream: ({ params }) => this.agentSvc.list(params).pipe(map(r => r)),
  });

  readonly items       = computed(() => this.agentsRes.value()?.data ?? []);
  readonly totalItems  = computed(() => this.agentsRes.value()?.meta?.total ?? this.items().length);
  readonly activeCount = computed(() => this.items().filter(a => a.isActive).length);

  fmtDateShort = fmtDateShort;
  toPhone = (a: UserResponse) => a.phone;
  initials(name: string): string { return name.split(' ').map((s: string) => s[0]).slice(0, 2).join(''); }

  onSearch(v: string): void {
    this.search.set(v);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.page.set(1), 400);
  }

  deactivate(a: UserResponse): void {
    this.agentSvc.update(a.id, { isActive: !a.isActive }).subscribe({
      next: () => {
        this.toast.show(a.isActive ? 'info' : 'success', `${a.name} ${a.isActive ? 'deactivated' : 'reactivated'}`);
        this.agentsRes.reload();
        this.confirm.set(null);
      },
      error: () => this.toast.error('Failed to update agent'),
    });
  }

  onCreated(data: { name: string; phone: string }): void {
    this.agentSvc.create(data).subscribe({
      next: (res) => {
        this.toast.success(`Agent ${res.data.name} created`);
        this.agentsRes.reload();
        this.showCreate.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Failed to create agent';
        this.toast.error(msg);
      },
    });
  }
}
