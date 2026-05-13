import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DrawerService } from '../../../core/services/drawer.service';
import { Sidebar } from '../../components/sidebar/sidebar';
import { Topbar } from '../../components/topbar/topbar';
import { TransactionDrawer } from '../../components/transaction-drawer/transaction-drawer';
import { ToastComponent } from '../../components/toast/toast';

const TITLES: Record<string, [string, string]> = {
  '/dashboard':       ['Dashboard',    'Overview across all agents'],
  '/transactions':    ['Transactions', 'All cash-out transactions across the platform'],
  '/my-transactions': ['My Transactions', 'Transactions assigned to you'],
  '/upload':          ['Upload SMS',   'Add a new transaction from a bKash Cash Out SMS'],
  '/agents':          ['Agents',       'Manage the agent roster'],
  '/reports':         ['Reports',      'Performance analytics and exports'],
  '/my-reports':      ['My Reports',   'Your performance summary'],
  '/settings':        ['Settings',     'Account and preferences'],
};

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, Topbar, TransactionDrawer, ToastComponent],
  template: `
    <div class="app" [class.collapsed]="collapsed()">
      <app-sidebar
        [currentPath]="currentPath()"
        [collapsed]="collapsed()"
        [role]="role()"
        [user]="authService.currentUser()"
        (navigate)="navigate($event)"
        (collapseToggle)="collapsed.set(!collapsed())"
        (logout)="authService.logout()"
      />
      <div class="main">
        <app-topbar
          [title]="title()"
          [subtitle]="subtitle()"
          [theme]="themeService.theme()"
          (toggleTheme)="themeService.toggle()"
        />
        <router-outlet />
      </div>
      @if (drawerService.tx()) {
        <app-transaction-drawer
          [tx]="drawerService.tx()!"
          (close)="drawerService.close()"
        />
      }
    </div>
    <app-toast />
  `,
})
export class AdminLayout implements OnInit {
  protected authService   = inject(AuthService);
  protected themeService  = inject(ThemeService);
  protected drawerService = inject(DrawerService);
  private router          = inject(Router);

  readonly collapsed  = signal(false);
  readonly currentPath = signal('dashboard');

  readonly role = computed(() => this.authService.currentUser()?.role ?? 'admin');

  readonly pageTitle = signal<[string, string]>(['Dashboard', '']);
  readonly title    = computed(() => this.pageTitle()[0]);
  readonly subtitle = computed(() => {
    const [, sub] = this.pageTitle();
    if (sub === 'Overview across all agents' && this.role() === 'agent') {
      return 'Your personal overview';
    }
    return sub;
  });

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((e: any) => {
      this.updateFromUrl(e.urlAfterRedirects || e.url);
    });
  }

  ngOnInit(): void {
    this.updateFromUrl(this.router.url);
  }

  private updateFromUrl(url: string): void {
    const path = url.split('?')[0];
    const seg = path.replace(/^\//, '').split('/')[0];
    this.currentPath.set(seg || 'dashboard');

    const entry = Object.entries(TITLES).find(([k]) => path === k || path.startsWith(k + '/'));
    this.pageTitle.set(entry ? entry[1] : ['', '']);
  }

  navigate(path: string): void {
    this.router.navigate(['/' + path]);
  }

}
