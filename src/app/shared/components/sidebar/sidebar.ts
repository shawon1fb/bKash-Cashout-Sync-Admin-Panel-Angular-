import { Component, input, output } from '@angular/core';
import { UserResponse } from '../../../core/models/user.model';
import { IconPipe } from '../../pipes/icon.pipe';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [IconPipe],
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon" [innerHTML]="item.icon | icon"></svg>
          @if (!collapsed()) { <span>{{ item.label }}</span> }
        </div>
      }

      @if (!collapsed()) {
        <div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-dim);padding:14px 10px 6px">Workspace</div>
      }
      @for (item of utilityNav; track item.path) {
        <div class="nav-item" [class.active]="currentPath() === item.path" (click)="navigate.emit(item.path)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ni-icon" [innerHTML]="item.icon | icon"></svg>
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

}
