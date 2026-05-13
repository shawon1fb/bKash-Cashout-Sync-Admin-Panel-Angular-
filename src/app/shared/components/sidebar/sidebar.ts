import { Component, input, output } from '@angular/core';
import { UserResponse } from '../../../core/models/user.model';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [],
  template: `
    <aside class="sidebar">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px 14px">
        <div class="brand-mark">
          <div class="brand-glyph">b</div>
          @if (!collapsed()) { <span>Cashout Sync</span> }
        </div>
        @if (!collapsed()) {
          <button class="btn btn-ghost btn-icon btn-sm" (click)="collapseToggle.emit()" title="Collapse">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
        }
      </div>

      @if (!collapsed()) {
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);padding:10px 10px 6px">Main</div>
      }
      @for (item of mainNav(); track item.path) {
        <div class="nav-item" [class.active]="currentPath() === item.path" (click)="navigate.emit(item.path)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon" [innerHTML]="iconPath(item.icon)"></svg>
          @if (!collapsed()) { <span>{{ item.label }}</span> }
        </div>
      }

      @if (!collapsed()) {
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);padding:14px 10px 6px">Workspace</div>
      }
      @for (item of utilityNav; track item.path) {
        <div class="nav-item" [class.active]="currentPath() === item.path" (click)="navigate.emit(item.path)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon" [innerHTML]="iconPath(item.icon)"></svg>
          @if (!collapsed()) { <span>{{ item.label }}</span> }
        </div>
      }

      <div style="flex:1"></div>

      @if (collapsed()) {
        <button class="btn btn-ghost btn-icon" (click)="collapseToggle.emit()" title="Expand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
        </button>
      } @else {
        <div style="border-top:1px solid var(--divider);margin:8px -12px 0;padding:12px 12px 0">
          <div style="display:flex;align-items:center;gap:10px;padding:4px 6px">
            <div class="avatar">{{ initials() }}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ user()?.name }}</div>
              <div style="font-size:11px;color:var(--text-muted);text-transform:capitalize">{{ user()?.role }}</div>
            </div>
            <button class="btn btn-ghost btn-icon btn-sm" (click)="logout.emit()" title="Logout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      }
    </aside>
  `,
})
export class Sidebar {
  currentPath = input<string>('');
  collapsed   = input<boolean>(false);
  role        = input<string>('admin');
  user        = input<UserResponse | null>(null);

  navigate        = output<string>();
  collapseToggle  = output<void>();
  logout          = output<void>();

  readonly utilityNav: NavItem[] = [
    { path: 'upload',   label: 'Upload SMS', icon: 'upload' },
    { path: 'settings', label: 'Settings',   icon: 'settings' },
  ];

  readonly mainNav = () => {
    if (this.role() === 'admin') {
      return [
        { path: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
        { path: 'transactions', label: 'Transactions', icon: 'transactions' },
        { path: 'agents',       label: 'Agents',       icon: 'agents' },
        { path: 'reports',      label: 'Reports',      icon: 'reports' },
      ];
    }
    return [
      { path: 'dashboard',       label: 'Dashboard',       icon: 'dashboard' },
      { path: 'my-transactions', label: 'My Transactions', icon: 'transactions' },
      { path: 'my-reports',      label: 'My Reports',      icon: 'reports' },
    ];
  };

  readonly initials = () => {
    const name = this.user()?.name || '';
    return name.split(' ').map((s: string) => s[0]).slice(0, 2).join('');
  };

  iconPath(icon: string): string {
    const map: Record<string, string> = {
      dashboard:    '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
      transactions: '<path d="M7 10h14M7 10l4-4M7 10l4 4M17 14H3M17 14l-4-4M17 14l-4 4"/>',
      agents:       '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
      reports:      '<path d="M3 3v18h18"/><path d="M7 16l4-5 4 3 5-7"/>',
      upload:       '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
      settings:     '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    };
    return map[icon] ?? '';
  }
}
