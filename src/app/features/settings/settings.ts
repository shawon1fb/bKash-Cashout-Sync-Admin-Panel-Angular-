import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { AgentService } from '../../core/services/agent.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { fmtDateShort } from '../../shared/utils/date.utils';
import { PhonePipe } from '../../shared/pipes/phone.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, PhonePipe],
  template: `
    <div class="page" style="max-width:880px">
      <div class="page-head">
        <div>
          <h1 class="page-title">Settings</h1>
          <div class="page-sub">Manage your account and preferences</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:200px 1fr;gap:24px">
        <!-- Nav -->
        <div style="display:flex;flex-direction:column;gap:2px">
          @for (t of tabs; track t.key) {
            <div class="nav-item" [class.active]="tab() === t.key" (click)="tab.set(t.key)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon" [innerHTML]="iconPath(t.icon)"></svg>
              <span>{{ t.label }}</span>
            </div>
          }
        </div>

        <!-- Content -->
        <div>
          @if (tab() === 'profile') {
            <div class="card card-pad">
              <div style="font-size:15px;font-weight:600;margin-bottom:4px">Profile</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:22px">Your basic information</div>

              <div style="display:flex;align-items:center;gap:16px;margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid var(--divider)">
                <div class="avatar avatar-xl">{{ initials(editName()) }}</div>
                <div>
                  <div style="font-size:14px;font-weight:500">{{ editName() }}</div>
                  <div style="font-size:12px;color:var(--text-muted)">{{ auth.currentUser()?.role === 'admin' ? 'Administrator' : 'Agent' }} · joined {{ joinDate() }}</div>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                <div>
                  <label class="label">Full name</label>
                  <input class="input" [ngModel]="editName()" (ngModelChange)="editName.set($event)"/>
                </div>
                <div>
                  <label class="label">Phone (read-only)</label>
                  <input class="input mono" [value]="auth.currentUser()?.phone | phone" readonly style="background:var(--surface-3);color:var(--text-muted)"/>
                </div>
                <div>
                  <label class="label">Role</label>
                  <input class="input" [value]="auth.currentUser()?.role" readonly style="background:var(--surface-3);color:var(--text-muted);text-transform:capitalize"/>
                </div>
                <div>
                  <label class="label">User ID</label>
                  <input class="input mono" [value]="auth.currentUser()?.id" readonly style="background:var(--surface-3);color:var(--text-muted);font-size:12px"/>
                </div>
              </div>

              <div style="margin-top:22px;display:flex;justify-content:flex-end;gap:8px">
                <button class="btn" (click)="editName.set(auth.currentUser()?.name ?? '')">Reset</button>
                <button class="btn btn-primary" [disabled]="saving() || editName() === auth.currentUser()?.name" (click)="saveProfile()"
                  [style.opacity]="(saving() || editName() === auth.currentUser()?.name) ? 0.6 : 1">
                  {{ saving() ? 'Saving…' : 'Save changes' }}
                </button>
              </div>
            </div>
          }

          @if (tab() === 'appearance') {
            <div class="card card-pad">
              <div style="font-size:15px;font-weight:600;margin-bottom:4px">Appearance</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:22px">Theme and density</div>
              <div class="label">Theme</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                @for (t of themeOptions; track t.key) {
                  <div (click)="themeService.theme() !== t.key && themeService.toggle()"
                    [style.border-color]="themeService.theme() === t.key ? 'var(--brand)' : 'var(--border)'"
                    [style.background]="t.bg"
                    style="padding:14px;border:2px solid;border-radius:var(--r-md);cursor:pointer;transition:all 0.12s">
                    <div style="display:flex;gap:6px;margin-bottom:10px">
                      @for (c of t.colors; track c) {
                        <div [style.background]="c" style="width:20px;height:20px;border-radius:4px;border:1px solid rgba(255,255,255,0.05)"></div>
                      }
                    </div>
                    <div [style.color]="t.key === 'dark' ? 'white' : '#0B0D14'" style="font-size:13px;font-weight:500;display:flex;justify-content:space-between;align-items:center">
                      {{ t.label }}
                      @if (themeService.theme() === t.key) {
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color:var(--brand-2)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          @if (tab() === 'security') {
            <div class="card card-pad">
              <div style="font-size:15px;font-weight:600;margin-bottom:4px">Security</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:22px">OTP-based — no password required</div>
              <div style="padding:16px;background:var(--surface-2);border-radius:var(--r-md);border:1px solid var(--border);display:flex;align-items:center;gap:12px">
                <div style="width:38px;height:38px;border-radius:50%;background:var(--success-soft);color:var(--success);display:grid;place-items:center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div style="flex:1">
                  <div style="font-size:13px;font-weight:500">OTP authentication active</div>
                  <div style="font-size:11px;color:var(--text-muted)">Sign-ins require a 6-digit code sent to your registered SIM</div>
                </div>
                <span class="pill pill-success"><span class="pill-dot"></span>On</span>
              </div>
              <div style="margin-top:16px;padding:16px;background:var(--surface-2);border-radius:var(--r-md);border:1px solid var(--border)">
                <div style="font-size:13px;font-weight:500;margin-bottom:4px">Active sessions</div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">1 device · this browser</div>
                <button class="btn btn-sm">Sign out all other devices</button>
              </div>
            </div>
          }

          @if (tab() === 'notifications') {
            <div class="card card-pad">
              <div style="font-size:15px;font-weight:600;margin-bottom:4px">Notifications</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:22px">When should we ping you?</div>
              @for (n of notifs; track n.key) {
                <div (click)="n.on.set(!n.on())" style="padding:12px 14px;border:1px solid var(--border);border-radius:var(--r-sm);margin-bottom:8px;display:flex;align-items:center;gap:12px;cursor:pointer">
                  <div style="flex:1;font-size:13px">{{ n.label }}</div>
                  <div [style.background]="n.on() ? 'var(--brand)' : 'var(--surface-3)'" style="width:32px;height:18px;border-radius:9px;position:relative;transition:background 0.15s">
                    <div [style.left.px]="n.on() ? 16 : 2" style="position:absolute;top:2px;width:14px;height:14px;border-radius:50%;background:white;transition:left 0.15s;box-shadow:0 1px 2px rgba(0,0,0,0.3)"></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class SettingsPage {
  protected auth         = inject(AuthService);
  protected themeService = inject(ThemeService);
  private agentSvc       = inject(AgentService);
  private toast          = inject(ToastService);

  readonly tab     = signal('profile');
  readonly saving  = signal(false);
  readonly editName = signal(this.auth.currentUser()?.name ?? '');

  readonly joinDate = computed(() => {
    const d = this.auth.currentUser()?.createdAt;
    return d ? fmtDateShort(d) : '';
  });

  readonly tabs = [
    { key: 'profile',       label: 'Profile',       icon: 'user' },
    { key: 'appearance',    label: 'Appearance',    icon: 'sun' },
    { key: 'security',      label: 'Security',      icon: 'shield' },
    { key: 'notifications', label: 'Notifications', icon: 'bell' },
  ];

  readonly themeOptions = [
    { key: 'dark',  label: 'Dark',  bg: '#0A0B10', colors: ['#0A0B10','#161924','#E2136E'] },
    { key: 'light', label: 'Light', bg: '#F6F7FA', colors: ['#F6F7FA','#FFFFFF','#E2136E'] },
  ];

  readonly notifs = [
    { key: 'new-tx', label: 'New transaction received',  on: signal(true) },
    { key: 'paid',   label: 'Mark-as-paid confirmations', on: signal(true) },
    { key: 'agent',  label: 'Agent status changes',       on: signal(false) },
    { key: 'report', label: 'Weekly summary email',       on: signal(true) },
  ];

  initials(name: string): string { return (name || '').split(' ').map((s: string) => s[0]).slice(0, 2).join(''); }

  saveProfile(): void {
    this.saving.set(true);
    this.agentSvc.updateProfile({ name: this.editName() }).subscribe({
      next: (res) => {
        this.auth['currentUser'].set(res.data);
        this.auth['storage'].set('bk_user', res.data);
        this.toast.success('Profile updated');
        this.saving.set(false);
      },
      error: () => {
        // Demo: update locally
        const user = this.auth.currentUser();
        if (user) {
          const updated = { ...user, name: this.editName() };
          this.auth['currentUser'].set(updated);
          this.auth['storage'].set('bk_user', updated);
        }
        this.toast.success('Profile updated');
        this.saving.set(false);
      },
    });
  }

  iconPath(icon: string): string {
    const map: Record<string, string> = {
      user:   '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      sun:    '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
      bell:   '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    };
    return map[icon] ?? '';
  }
}
