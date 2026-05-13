# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Not yet scaffolded. `plan.md` is the authoritative spec. `bKash Cashout Sync Admin Panel (Angular)-handoff.zip` contains the visual design reference (HTML prototypes in `project/src/`). Build steps are in `plan.md` under "BUILD STEPS".

## Commands

```bash
# Scaffold
ng new bkash-admin --routing --style=scss --standalone

# Install deps
ng add @angular/material
npm install ng-apexcharts apexcharts date-fns
npm install -D tailwindcss @tailwindcss/vite

# Dev server
ng serve

# Build
ng build
ng build --configuration=production

# Tests
ng test
ng test --include="**/auth.service.spec.ts"   # single file

# Lint
ng lint
```

## Architecture

### Stack
- **Angular 21** — standalone components only, no NgModules, no zone.js
- **State** — Angular Signals exclusively: `signal()`, `computed()`, `effect()`, `resource()` / `rxResource()` for async; services may use `Subject` internally but **expose signals outward**
- **UI** — Angular Material 21 + TailwindCSS 4 (CSS-first config via `@theme` in `styles.css`, no `tailwind.config.js`)
- **Charts** — ApexCharts via `ng-apexcharts`
- **Dates** — `date-fns` v3+; format as `"12 May 2026, 2:30 PM"`
- **HTTP** — functional interceptors only: `withInterceptors([authInterceptor, refreshInterceptor])`

### DI & Component Rules
- Use `inject()` for all DI — never constructor injection
- Signal inputs: `name = input<string>()` / `name = input.required<string>()`
- Signal outputs: `clicked = output<void>()`
- Two-way: `value = model<string>('')`
- Templates: `@if` / `@for` / `@switch` only — never `*ngIf`, `*ngFor`, `*ngSwitch`
- `@defer` for charts and large tables (with `@placeholder` and `@loading`)
- Route params as signal inputs via `withComponentInputBinding()` — no `ActivatedRoute` in components
- `takeUntilDestroyed()` for any manual subscriptions

### Backend API
Base URL: `environment.apiUrl` (default `http://localhost:8000`)  
Auth header: `Authorization: Bearer <accessToken>`

All responses wrap in `{ success, statusCode, message, data, meta? }`. Errors: `{ success: false, errors?: string[] }`.

Key endpoint groups:
- `/auth/otp/send`, `/auth/otp/verify`, `/auth/refresh`, `/auth/logout`
- `/users/profile` (PATCH name)
- `/transactions` (GET list, POST upload, PATCH status, GET summary, GET verify/:id)
- `/admin/transactions`, `/admin/agents`, `/admin/agents/:uuid/summary`

### Auth Flow
1. Phone → OTP → verify → store `{ accessToken, refreshToken, user }` in localStorage
2. `authInterceptor`: skip `/auth/*` URLs, attach Bearer otherwise
3. `refreshInterceptor`: on 401 → call `/auth/refresh` → retry; on refresh failure → logout + redirect `/login`
4. `AuthService` signals: `currentUser`, `isAuthenticated` (computed), `isAdmin` (computed)
5. Populate `currentUser` from localStorage on app init

### Routing
All feature routes lazy-loaded. `AuthGuard` on all except `/login`. `RoleGuard` on admin routes (agent → redirect `/dashboard`).

| Path | Role |
|------|------|
| `/login` | public |
| `/dashboard` | auth |
| `/transactions`, `/agents`, `/reports` | admin |
| `/my-transactions`, `/my-reports` | agent |
| `/transactions/upload`, `/settings` | auth |

### Error Handling
All HTTP errors handled in services, never in components. 400 → show `errors[]`; 401 → `refreshInterceptor`; 403/404/409/500 → toast.

### Styling
- Dark mode: `class="dark"` on `<html>`, toggled via localStorage
- **Never hardcode colors** — only CSS variables (`--primary`, `--bg`, `--surface`, `--text`, etc.)
- Font: DM Sans (Google Fonts), base 14px
- Cards: `border-radius: 12px`, `background: var(--surface)`, `padding: 24px`
- Amounts: `AmountPipe` → `"৳ 1,500.00"`
- Phones: `PhonePipe` → `"017-1122-3344"`
- UUIDs never shown to users — display name or TrxID instead

### Design Reference
Visual prototypes inside the zip at `project/src/` (JSX + CSS). Read `project/index.html` first, then follow imports. Recreate pixel-accurately in Angular; do not copy prototype structure.
