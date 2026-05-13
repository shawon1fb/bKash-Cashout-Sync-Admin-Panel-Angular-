import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { AgentService } from '../../../core/services/agent.service';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { PhonePipe } from '../../../shared/pipes/phone.pipe';
import { UserResponse } from '../../../core/models/user.model';

interface ParsedSms {
  amount: string; senderPhone: string; transactionId: string;
  fee: string; balance: string; date: string; time: string;
}

const SAMPLES = [
  'Cash Out Tk 2,500.00 from 01755112233 successful. TrxID K8M3P7N2Q4. Fee Tk 25.00. Balance Tk 12,450.00. 13/05/26 11:42 AM',
  'Cash Out Tk 800.00 from 01911334455 successful. TrxID R3T5V7Y9Z1. Fee Tk 8.00. Balance Tk 8,200.00. 13/05/26 09:15 AM',
  'Cash Out Tk 5,000.00 from 01612998877 successful. TrxID B4G6H8J2K5. Fee Tk 50.00. Balance Tk 22,800.00. 12/05/26 4:08 PM',
];

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [FormsModule, StatusBadge, PhonePipe],
  template: `
    <div class="page" style="max-width:900px">
      <div class="page-head">
        <div>
          <h1 class="page-title">Upload SMS</h1>
          <div class="page-sub">{{ isAdmin() ? "Paste a Cash Out SMS — pick which agent it belongs to and we'll add it to their ledger." : "Paste a bKash Cash Out SMS — we'll extract the details and add it to your ledger." }}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 320px;gap:14px">
        <div class="card card-pad">
          @if (isAdmin()) {
            <div style="margin-bottom:18px">
              <label class="label">Assign to agent</label>
              <div style="position:relative">
                <button (click)="pickerOpen.set(!pickerOpen())" class="input" style="display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;padding:8px 12px;width:100%">
                  @if (selectedAgent()) {
                    <div class="avatar" style="width:22px;height:22px;font-size:9px">{{ initials(selectedAgent()?.name) }}</div>
                    <div style="flex:1;min-width:0">
                      <div style="font-size:13px;font-weight:500">{{ selectedAgent()?.name }}</div>
                      <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">{{ selectedAgent()?.phone | phone }}</div>
                    </div>
                  } @else {
                    <span style="color:var(--text-muted);flex:1">Select an agent…</span>
                  }
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-muted)" [style.transform]="pickerOpen() ? 'rotate(180deg)' : ''"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                @if (pickerOpen()) {
                  <div style="position:fixed;inset:0;z-index:30" (click)="pickerOpen.set(false)"></div>
                  <div style="position:absolute;top:calc(100% + 4px);left:0;right:0;background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-lg);z-index:40;max-height:320px;display:flex;flex-direction:column">
                    <div style="padding:8px;border-bottom:1px solid var(--divider);position:relative">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;left:18px;top:50%;transform:translateY(-50%);color:var(--text-muted)"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input class="input" style="padding-left:30px;font-size:12px" placeholder="Search agent…" [ngModel]="agentSearch()" (ngModelChange)="agentSearch.set($event)" autoFocus/>
                    </div>
                    <div style="overflow-y:auto;padding:4px">
                      @for (a of filteredAgents(); track a.id) {
                        <div (click)="selectedAgentId.set(a.id); pickerOpen.set(false); agentSearch.set('')"
                          style="padding:8px 10px;border-radius:var(--r-sm);display:flex;align-items:center;gap:10px;cursor:pointer"
                          [style.background]="a.id === selectedAgentId() ? 'var(--surface-2)' : 'transparent'">
                          <div class="avatar" style="width:22px;height:22px;font-size:9px">{{ initials(a.name) }}</div>
                          <div style="flex:1;min-width:0">
                            <div style="font-size:13px">{{ a.name }}</div>
                            <div style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">{{ a.phone | phone }}</div>
                          </div>
                          @if (a.id === selectedAgentId()) {
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:var(--brand)"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:6px;display:flex;align-items:center;gap:5px">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                The transaction will be added to <b style="color:var(--text-2)">{{ selectedAgent()?.name || '—' }}</b>'s ledger.
              </div>
            </div>
          } @else {
            <div style="margin-bottom:18px;padding:12px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);display:flex;align-items:center;gap:10px">
              <div class="avatar" style="width:26px;height:26px">{{ initials(currentUser()?.name) }}</div>
              <div style="flex:1">
                <div style="font-size:12px;color:var(--text-muted)">Uploading to your ledger</div>
                <div style="font-size:13px;font-weight:500">{{ currentUser()?.name }}</div>
              </div>
              <span class="pill pill-muted"><span class="pill-dot"></span>You</span>
            </div>
          }

          <label class="label">SMS message</label>
          <textarea class="input" style="min-height:180px;font-family:var(--font-mono);font-size:13px;line-height:1.6;resize:vertical"
            placeholder="Cash Out Tk 1,500.00 from 01711223344 successful. TrxID A2B3C4D5E6. Fee Tk 15.00. Balance Tk 5,000.00. 13/05/26 2:30 PM"
            [ngModel]="text()" (ngModelChange)="text.set($event); parseError.set('')"></textarea>

          @if (parseError()) {
            <div style="color:var(--danger);font-size:12px;margin-top:8px;display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {{ parseError() }}
            </div>
          }

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;gap:10px">
            <div style="font-size:12px;color:var(--text-muted)">{{ text().length }} characters</div>
            <div style="display:flex;gap:8px">
              <button class="btn" (click)="text.set(''); parsed.set(null); parseError.set('')">Clear</button>
              <button class="btn btn-primary" (click)="parseSms()" [disabled]="busy() || !text().trim()" [style.opacity]="(busy() || !text().trim()) ? 0.6 : 1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                {{ busy() ? 'Parsing…' : 'Parse SMS' }}
              </button>
            </div>
          </div>

          @if (parsed()) {
            <div style="margin-top:22px;padding:18px;background:var(--success-soft);border:1px solid rgba(52,211,153,0.22);border-radius:var(--r-md)">
              <div style="display:flex;align-items:center;gap:7px;color:var(--success);font-weight:500;margin-bottom:12px;font-size:13px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                Parsed successfully
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;font-size:12px">
                @for (field of parsedFields(); track field.label) {
                  <div>
                    <div style="color:var(--text-muted);font-size:11px">{{ field.label }}</div>
                    <div style="margin-top:2px;font-weight:500" [class.mono]="field.mono">{{ field.value }}</div>
                  </div>
                }
              </div>
              <button class="btn btn-primary" style="margin-top:14px;width:100%;justify-content:center" (click)="confirm()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm &amp; add to ledger
              </button>
            </div>
          }
        </div>

        <div>
          <div class="card card-pad">
            <div style="display:flex;align-items:center;gap:7px;margin-bottom:10px">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:var(--info)"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <div style="font-size:13px;font-weight:500">Sample SMS</div>
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Click to try one</div>
            @for (s of samples; track $index) {
              <div (click)="text.set(s); parsed.set(null); parseError.set('')"
                style="padding:10px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--r-sm);font-size:11px;font-family:var(--font-mono);line-height:1.5;margin-bottom:8px;cursor:pointer;color:var(--text-2);transition:background 0.1s"
                (mouseenter)="onSampleHover($event, true)"
                (mouseleave)="onSampleHover($event, false)">
                {{ s }}
              </div>
            }
          </div>

          <div class="card card-pad" style="margin-top:14px">
            <div style="font-size:13px;font-weight:500;margin-bottom:8px">How it works</div>
            <ol style="padding-left:18px;margin:0;font-size:12px;color:var(--text-2);line-height:1.7">
              <li>Receive the Cash Out SMS on the agent SIM</li>
              <li>Forward or paste it here</li>
              <li>We parse amount, sender, TrxID, fee and balance</li>
              <li>Status starts as <app-status-badge status="received"/></li>
              <li>Mark <app-status-badge status="paid"/> after handing over cash</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UploadPage {
  protected router  = inject(Router);
  private auth      = inject(AuthService);
  private toast     = inject(ToastService);
  private txSvc     = inject(TransactionService);
  private agentSvc  = inject(AgentService);

  readonly isAdmin     = computed(() => this.auth.currentUser()?.role === 'admin');
  readonly currentUser = computed(() => this.auth.currentUser());

  readonly text            = signal('');
  readonly parsed          = signal<ParsedSms | null>(null);
  readonly parseError      = signal('');
  readonly busy            = signal(false);
  readonly pickerOpen      = signal(false);
  readonly agentSearch     = signal('');
  readonly selectedAgentId = signal('');

  readonly samples = SAMPLES;

  // Fetch active agents from API
  readonly agentsRes = rxResource({
    stream: () => this.agentSvc.list({ isActive: true, limit: 100 }).pipe(map(r => r.data ?? [])),
  });

  readonly activeAgents = computed(() => this.agentsRes.value() ?? []);

  readonly filteredAgents = computed(() =>
    this.activeAgents().filter(a =>
      !this.agentSearch() || a.name.toLowerCase().includes(this.agentSearch().toLowerCase()) || a.phone.includes(this.agentSearch())
    )
  );

  readonly selectedAgent = computed((): UserResponse | null | undefined => {
    if (!this.isAdmin()) return this.currentUser() as any;
    const id = this.selectedAgentId() || this.activeAgents()[0]?.id;
    return this.activeAgents().find(a => a.id === id);
  });

  initials(name: string | undefined): string {
    return (name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join('');
  }

  parseSms(): void {
    this.parseError.set('');
    if (!this.text().trim()) { this.parseError.set('Paste an SMS first'); return; }
    this.busy.set(true);
    setTimeout(() => {
      const p = this.doParse(this.text());
      if (!p) {
        this.parseError.set("Couldn't parse this SMS. Make sure it's the standard bKash Cash Out format.");
        this.busy.set(false); return;
      }
      this.parsed.set(p); this.busy.set(false);
    }, 500);
  }

  private doParse(raw: string): ParsedSms | null {
    const re = /Cash Out Tk\s+([\d,]+\.\d{2})\s+from\s+(01\d{9})\s+successful\.\s+TrxID\s+([A-Z0-9]+)\.\s+Fee Tk\s+([\d,]+\.\d{2})\.\s+Balance Tk\s+([\d,]+\.\d{2})\.\s+(\d{2}\/\d{2}\/\d{2})\s+([\d:]+\s*[AP]M)/;
    const m = raw.trim().match(re);
    if (!m) return null;
    return { amount: m[1].replace(/,/g,''), senderPhone: m[2], transactionId: m[3], fee: m[4].replace(/,/g,''), balance: m[5].replace(/,/g,''), date: m[6], time: m[7] };
  }

  readonly parsedFields = computed(() => {
    const p = this.parsed();
    if (!p) return [];
    return [
      { label: 'Amount', value: `৳ ${parseFloat(p.amount).toLocaleString('en-IN',{minimumFractionDigits:2})}`, mono: false },
      { label: 'TrxID',  value: p.transactionId, mono: true },
      { label: 'From',   value: p.senderPhone.slice(0,3)+'-'+p.senderPhone.slice(3,7)+'-'+p.senderPhone.slice(7), mono: true },
      { label: 'Fee',    value: `৳ ${parseFloat(p.fee).toLocaleString('en-IN',{minimumFractionDigits:2})}`, mono: false },
      { label: 'Balance after', value: `৳ ${parseFloat(p.balance).toLocaleString('en-IN',{minimumFractionDigits:2})}`, mono: false },
      { label: 'Date/Time', value: `${p.date} ${p.time}`, mono: false },
    ];
  });

  onSampleHover(e: MouseEvent, hover: boolean): void {
    const el = e.currentTarget as HTMLElement;
    el.style.background = hover ? 'var(--surface-3)' : 'var(--surface-2)';
  }

  confirm(): void {
    const p = this.parsed();
    if (!p) return;
    const agent = this.selectedAgent();
    if (this.isAdmin() && !agent) { this.parseError.set('Select an agent first'); return; }
    this.busy.set(true);
    const agentId = this.isAdmin() ? (agent as any).id : undefined;
    this.txSvc.upload(this.text(), agentId).subscribe({
      next: (res) => {
        this.toast.success(`Added ${p.transactionId} · ৳ ${parseFloat(p.amount).toLocaleString()} to ledger`);
        this.busy.set(false);
        this.router.navigate(['/transactions']);
      },
      error: () => {
        this.toast.error('Failed to upload transaction');
        this.busy.set(false);
      },
    });
  }
}
