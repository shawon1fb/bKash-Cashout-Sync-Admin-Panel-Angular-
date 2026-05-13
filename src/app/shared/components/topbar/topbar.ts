import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <div class="topbar">
      <div style="flex:1;min-width:0">
        <div style="font-size:18px;font-weight:600;letter-spacing:-0.02em">{{ title() }}</div>
        @if (subtitle()) {
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px">{{ subtitle() }}</div>
        }
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div style="position:relative">
          <button class="chip" (click)="showRoleMenu.set(!showRoleMenu())" style="text-transform:capitalize">
            <span class="live-dot"></span>
            {{ role() }}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          @if (showRoleMenu()) {
            <div style="position:fixed;inset:0;z-index:30" (click)="showRoleMenu.set(false)"></div>
            <div style="position:absolute;right:0;top:calc(100% + 6px);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-md);box-shadow:var(--shadow-lg);min-width:200px;padding:6px;z-index:40">
              <div style="font-size:11px;color:var(--text-muted);padding:6px 10px 8px;text-transform:uppercase;letter-spacing:0.06em">Switch role (demo)</div>
              @for (r of ['admin','agent']; track r) {
                <div class="nav-item" (click)="switchRole.emit(r); showRoleMenu.set(false)" style="margin-bottom:0">
                  @if (r === 'admin') {
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  } @else {
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  }
                  <span style="text-transform:capitalize">{{ r }}</span>
                  @if (role() === r) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto;color:var(--brand)"><polyline points="20 6 9 17 4 12"/></svg>
                  }
                </div>
              }
            </div>
          }
        </div>
        <button class="btn btn-ghost btn-icon" (click)="toggleTheme.emit()" title="Toggle theme">
          @if (theme() === 'dark') {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          } @else {
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
        <button class="btn btn-ghost btn-icon" title="Notifications">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </button>
      </div>
    </div>
  `,
})
export class Topbar {
  title       = input<string>('');
  subtitle    = input<string>('');
  theme       = input<string>('dark');
  role        = input<string>('admin');
  toggleTheme = output<void>();
  switchRole  = output<string>();

  protected readonly showRoleMenu = signal(false);
}
