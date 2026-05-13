import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () => import('./shared/layout/admin-layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/transactions/transaction-list').then(m => m.TransactionListPage),
        canActivate: [roleGuard], data: { role: 'admin' },
      },
      {
        path: 'my-transactions',
        loadComponent: () => import('./features/transactions/transaction-list').then(m => m.TransactionListPage),
        canActivate: [roleGuard], data: { role: 'agent' },
      },
      {
        path: 'upload',
        loadComponent: () => import('./features/transactions/upload/upload').then(m => m.UploadPage),
      },
      {
        path: 'agents',
        loadComponent: () => import('./features/agents/agent-list').then(m => m.AgentListPage),
        canActivate: [roleGuard], data: { role: 'admin' },
      },
      {
        path: 'agents/:id',
        loadComponent: () => import('./features/agents/agent-detail').then(m => m.AgentDetailPage),
        canActivate: [roleGuard], data: { role: 'admin' },
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports').then(m => m.ReportsPage),
        canActivate: [roleGuard], data: { role: 'admin' },
      },
      {
        path: 'my-reports',
        loadComponent: () => import('./features/reports/reports').then(m => m.ReportsPage),
        canActivate: [roleGuard], data: { role: 'agent' },
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings').then(m => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
