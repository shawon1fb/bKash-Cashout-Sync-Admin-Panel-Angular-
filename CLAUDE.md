# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server
ng serve

# Build
ng build
ng build --configuration=production

# Tests (vitest via @angular/build:unit-test)
ng test
npx vitest run src/app/core/services/auth.service.spec.ts   # single file

# Lint
ng lint

# Format
npx prettier --write "src/**/*.{ts,html,scss}"
```

## Architecture

### Stack
- **Angular 21** — standalone components, zoneless (`provideZonelessChangeDetection`), no NgModules
- **State** — Angular Signals exclusively: `signal()`, `computed()`, `effect()`, `resource()` / `rxResource()` for async; services may use `Subject` internally but expose signals outward
- **UI** — custom CSS design system in `src/styles.scss` (no Angular Material); TailwindCSS 4 via `@tailwindcss/postcss`
- **Charts** — `ng-apexcharts` v2; wrapped in `src/app/shared/components/charts/` (bar-chart, donut-chart, heatmap, line-area-chart, mini-bar, sparkline)
- **Dates** — `date-fns` v4; helper in `src/app/shared/utils/date.utils.ts`
- **HTTP** — functional interceptors: `withInterceptors([authInterceptor, refreshInterceptor])`
- **Tests** — vitest (not Karma), configured via `@angular/build:unit-test`

### DI & Component Rules
- `inject()` for all DI — never constructor injection (exception: `ThemeService` uses constructor for `effect()` init)
- Signal inputs: `name = input<string>()` / `name = input.required<string>()`
- Signal outputs: `clicked = output<void>()`
- Two-way: `value = model<string>('')`
- Templates: `@if` / `@for` / `@switch` only — never `*ngIf`, `*ngFor`, `*ngSwitch`
- `@defer` for charts and large tables (with `@placeholder` and `@loading`)
- Route params via `withComponentInputBinding()` — no `ActivatedRoute` in components
- `takeUntilDestroyed()` for any manual subscriptions

### Project Structure

```
src/app/
  app.config.ts           — provideZonelessChangeDetection, router, http, ThemeService init
  app.routes.ts           — all lazy routes
  core/
    guards/               — auth.guard.ts, role.guard.ts
    interceptors/         — auth.interceptor.ts, refresh.interceptor.ts
    models/               — api-response.model.ts, transaction.model.ts, user.model.ts
    services/
      auth.service.ts     — signals: currentUser, isAuthenticated, isAdmin; localStorage keys: bk_user/bk_access_token/bk_refresh_token
      theme.service.ts    — signal: theme ('dark'|'light'); key: bk_theme
      drawer.service.ts   — signal: tx (open transaction detail drawer)
      storage.service.ts  — localStorage wrapper
      api.service.ts      — base HTTP methods
      transaction.service.ts
      agent.service.ts
      toast.service.ts
  features/
    auth/login/login.ts
    dashboard/dashboard.ts
    transactions/
      transaction-list.ts   — shared by /transactions (admin) and /my-transactions (agent)
      upload/upload.ts      — route: /upload (not /transactions/upload)
    agents/
      agent-list.ts
      agent-detail.ts       — id = input.required<string>() from route
    reports/reports.ts      — shared by /reports (admin) and /my-reports (agent)
    settings/settings.ts
  shared/
    components/
      charts/               — bar-chart, donut-chart, heatmap, line-area-chart, mini-bar, sparkline
      confirm-dialog/
      pagination/
      sidebar/
      sparkline/
      stat-card/
      status-badge/
      toast/
      topbar/
      transaction-drawer/   — opened via DrawerService
    layout/
      admin-layout/admin-layout.ts
      auth-layout/auth-layout.ts
    pipes/
      amount.pipe.ts        — "৳ 1,500.00"
      phone.pipe.ts         — "017-1122-3344"
      icon.pipe.ts
    utils/
      date.utils.ts
      mock-data.ts          — dev-only seed data for agents/transactions
  environments/
    environment.ts          — apiUrl: 'http://localhost:8000'
    environment.prod.ts
```

### Routing

| Path | Component | Guard |
|------|-----------|-------|
| `/login` | LoginPage | public |
| `/dashboard` | DashboardPage | auth |
| `/transactions` | TransactionListPage | auth + role:admin |
| `/my-transactions` | TransactionListPage | auth + role:agent |
| `/upload` | UploadPage | auth |
| `/agents` | AgentListPage | auth + role:admin |
| `/agents/:id` | AgentDetailPage | auth + role:admin |
| `/reports` | ReportsPage | auth + role:admin |
| `/my-reports` | ReportsPage | auth + role:agent |
| `/settings` | SettingsPage | auth |

### Auth & Tokens
- localStorage keys: `bk_user`, `bk_access_token`, `bk_refresh_token`, `bk_theme`
- `authInterceptor`: skips `/auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`; attaches Bearer otherwise
- `refreshInterceptor`: 401 → POST `/auth/refresh` → retry; refresh failure → `AuthService.clearAuth()` + redirect `/login`
- `currentUser` populated from localStorage on service instantiation

### Styling System (styles.scss)
All styles are global utility classes in `src/styles.scss` — components use these class names directly, no component-level SCSS except for layout-specific overrides.

**Theme**: dark is default (no class on `<html>`); `html.light` activates light mode. Toggled via `ThemeService.toggle()`.

**Brand**: bKash pink `--brand: #E2136E` / `--brand-2: #FF3D87` (not blue — `plan.md` color values are wrong)

**Key CSS variables** (dark defaults, overridden in `html.light`):
- `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--hover`
- `--border`, `--border-strong`, `--divider`
- `--text`, `--text-2`, `--text-muted`, `--text-dim`
- `--brand`, `--brand-2`, `--brand-soft`, `--brand-ring`
- `--success`, `--warning`, `--danger`, `--info` (+ `-soft` variants)
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-brand`
- `--r-xs/sm/md/lg/xl/pill` — border radius tokens

**Key utility classes**: `.card`, `.card-pad`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon`, `.input`, `.label`, `.pill`, `.pill-success/warning/danger/info/muted/brand`, `.tbl`, `.skel`, `.stat`, `.drawer`, `.dialog`, `.toast`, `.avatar`, `.seg`, `.chip`, `.timeline-*`, `.auth-wrap`, `.auth-card`, `.otp-cell`, `.page`, `.page-head`, `.topbar`, `.sidebar`, `.nav-item`

**Font**: "Inter Tight" / "Inter" (not DM Sans — `plan.md` is wrong)

### Backend API
Base URL: `environment.apiUrl` (default `http://localhost:8000`)
All responses: `{ success, statusCode, message, data, meta? }`. Errors: `{ success: false, errors?: string[] }`.

All HTTP errors handled in services, never in components. 400 → show `errors[]`; 401 → refreshInterceptor; 403/404/409/500 → toast.

### Design Reference
`plan.md` is the feature/API spec. The visual zip at `bKash Cashout Sync Admin Panel (Angular)-handoff.zip` (`project/src/`) contains HTML prototypes — read `project/index.html` first. **Note**: actual CSS variables and brand colors implemented in `styles.scss` take precedence over `plan.md` spec values.
