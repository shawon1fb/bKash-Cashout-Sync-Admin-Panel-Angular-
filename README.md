# bKash Cashout Sync — Admin Panel

> bKash Cashout SMS থেকে Transaction parse করে sync করার platform-এর Angular 21 Admin Dashboard।
> Admin এবং Agent — দুই role এর জন্য আলাদা UI ও access control।

---

## সূচিপত্র

- [ফিচার](#ফিচার)
- [টেক স্ট্যাক](#টেক-স্ট্যাক)
- [শুরু করো](#শুরু-করো)
- [পরিবেশ কনফিগারেশন](#পরিবেশ-কনফিগারেশন)
- [NPM Scripts](#npm-scripts)
- [রাউট ও Access Control](#রাউট-ও-access-control)
- [Auth Flow](#auth-flow)
- [Backend API](#backend-api)
- [আর্কিটেকচার](#আর্কিটেকচার)
- [Styling Guide](#styling-guide)
- [ট্রাবলশুটিং](#ট্রাবলশুটিং)
- [Deploy](#deploy)

---

## ফিচার

- **Phone OTP Login** — Phone → 6-digit OTP → Verify
- **Role-based Dashboard** — Admin ও Agent এর জন্য আলাদা stat, chart, table
- **Transaction Management** — List, SMS upload, status change (Received → Paid)
- **Transaction Detail Drawer** — Raw SMS, timeline, agent info সহ side panel
- **Agent Management** — Create, Edit, Deactivate (Admin only)
- **Reports & Charts** — Period selector, ApexCharts (line, bar, donut)
- **Dark / Light Mode** — Default dark; toggle করলে `html.light` class লাগে
- **Responsive** — Desktop sidebar, mobile hidden sidebar
- **Custom Pipes** — `৳ 1,500.00` (AmountPipe), `017-1122-3344` (PhonePipe)

---

## টেক স্ট্যাক

| প্রযুক্তি | Version | ব্যবহার |
|-----------|---------|---------|
| Angular | 21 | Framework (standalone, zoneless) |
| TypeScript | ~5.9 | |
| TailwindCSS | 4 | Layout utilities |
| ApexCharts + ng-apexcharts | 5 / 2 | Charts |
| date-fns | 4 | Date formatting |
| RxJS | 7 | Observables in services |
| Vitest | 4 | Unit tests |

---

## শুরু করো

**Prerequisites:** Node.js v22+, npm 11+

```bash
# version check
node -v   # v22.x
npm -v    # 11.x

# install
npm install

# dev server চালু করো
npm start
```

Browser এ খুলো: **http://localhost:4200**

---

## পরিবেশ কনফিগারেশন

### Development — `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000',  // backend URL এখানে change করো
};
```

### Production — `src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
};
```

> Build-time এ Angular environment file swap করে — runtime `.env` কাজ করে না।

---

## NPM Scripts

| Command | কাজ |
|---------|-----|
| `npm start` | Dev server (`http://localhost:4200`) |
| `npm run build` | Production build → `dist/bkash-admin/browser/` |
| `npm run watch` | Dev mode watch build |
| `npm test` | Vitest দিয়ে সব unit test |

---

## রাউট ও Access Control

| Route | কে দেখতে পারবে | Component |
|-------|--------------|-----------|
| `/login` | সবাই (public) | LoginPage |
| `/dashboard` | Admin + Agent | DashboardPage |
| `/transactions` | Admin only | TransactionListPage |
| `/my-transactions` | Agent only | TransactionListPage |
| `/upload` | Admin + Agent | UploadPage |
| `/agents` | Admin only | AgentListPage |
| `/agents/:id` | Admin only | AgentDetailPage |
| `/reports` | Admin only | ReportsPage |
| `/my-reports` | Agent only | ReportsPage |
| `/settings` | Admin + Agent | SettingsPage |

**Guards:**
- `authGuard` → login না থাকলে `/login`
- `roleGuard` → wrong role হলে `/dashboard`

---

## Auth Flow

```
1. Phone input  →  POST /auth/otp/send
2. 6-digit OTP  →  POST /auth/otp/verify
3. Response এ accessToken + refreshToken + user → localStorage এ store
       Keys: bk_access_token | bk_refresh_token | bk_user | bk_theme
4. প্রতি API request এ:  Authorization: Bearer <accessToken>
5. 401 পেলে:  refreshInterceptor → POST /auth/refresh → retry
6. Refresh fail:  localStorage clear → /login redirect
7. Logout:  POST /auth/logout → clear → /login
```

---

## Backend API

**Base URL:** `environment.apiUrl` (default: `http://localhost:8000`)

**Response envelope:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "...",
  "data": {},
  "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1 }
}
```

**Error envelope:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "...",
  "errors": ["field: message"]
}
```

### Auth (Public — token লাগে না)

| Method | Endpoint | Body |
|--------|----------|------|
| POST | `/auth/otp/send` | `{ phone }` |
| POST | `/auth/otp/verify` | `{ phone, otp }` |
| POST | `/auth/refresh` | `{ refreshToken }` |
| POST | `/auth/logout` | — |

### Users

| Method | Endpoint | Note |
|--------|----------|------|
| GET | `/users/profile` | নিজের profile |
| PATCH | `/users/profile` | `{ name }` update |

### Transactions

| Method | Endpoint | Note |
|--------|----------|------|
| GET | `/transactions` | Agent এর নিজের list (paginated) |
| POST | `/transactions/upload` | `{ rawMessage }` — SMS paste করে create |
| GET | `/transactions/verify/:id` | Public verify (no token) |
| PATCH | `/transactions/:id/status` | `{ status: "paid" \| "received" }` |
| GET | `/transactions/summary` | `?period=daily\|weekly\|monthly\|custom` |

### Admin

| Method | Endpoint | Note |
|--------|----------|------|
| GET | `/admin/transactions` | সব transaction (paginated) |
| GET | `/admin/transactions/summary` | Admin summary |
| GET | `/admin/agents` | Agent list |
| POST | `/admin/agents` | `{ name, phone }` create |
| PATCH | `/admin/agents/:uuid` | `{ name?, isActive? }` |
| DELETE | `/admin/agents/:uuid` | Deactivate |
| GET | `/admin/agents/:uuid/transactions` | Agent এর transaction |
| GET | `/admin/agents/:uuid/summary` | Agent এর summary |

---

## আর্কিটেকচার

```
src/app/
├── core/
│   ├── guards/          auth.guard.ts · role.guard.ts
│   ├── interceptors/    auth.interceptor.ts · refresh.interceptor.ts
│   ├── models/          user · transaction · api-response
│   └── services/
│       ├── auth.service.ts       signals: currentUser, isAuthenticated, isAdmin
│       ├── theme.service.ts      signal: theme ('dark'|'light')
│       ├── drawer.service.ts     signal: tx — transaction detail drawer খোলে
│       ├── storage.service.ts    localStorage wrapper
│       ├── api.service.ts        base HTTP methods
│       ├── transaction.service.ts
│       ├── agent.service.ts
│       └── toast.service.ts
├── features/
│   ├── auth/login/
│   ├── dashboard/
│   ├── transactions/    transaction-list.ts · upload/
│   ├── agents/          agent-list.ts · agent-detail.ts
│   ├── reports/         reports.ts
│   └── settings/
└── shared/
    ├── components/      sidebar · topbar · stat-card · status-badge
    │                    charts/ · confirm-dialog · pagination
    │                    toast · transaction-drawer
    ├── layout/          admin-layout · auth-layout
    ├── pipes/           amount.pipe · phone.pipe · icon.pipe
    └── utils/           date.utils · mock-data (dev only)
```

**Key patterns:**
- `inject()` সব DI তে — constructor injection নয়
- Component state: `signal()` / `computed()` / `resource()`
- Template: `@if` / `@for` / `@switch` — `*ngIf` / `*ngFor` কখনো নয়
- HTTP error: service এ handle, component এ নয়
- Route param: `id = input.required<string>()` (no `ActivatedRoute`)

---

## Styling Guide

সব global style `src/styles.scss` এ। Component এ আলাদা SCSS কম রাখো।

**Dark mode:** Default dark (কোনো class নেই)। Light mode এ `html.light` class লাগে।
`ThemeService.toggle()` দিয়ে switch হয়, localStorage এ `bk_theme` key তে save থাকে।

**Brand color:** `--brand: #E2136E` (bKash pink)

**Key CSS variables:**

```scss
/* Surfaces */
--bg · --surface · --surface-2 · --surface-3 · --hover

/* Text */
--text · --text-2 · --text-muted · --text-dim

/* Borders */
--border · --border-strong · --divider

/* Semantic */
--brand · --brand-2 · --brand-soft · --brand-ring
--success · --warning · --danger · --info   (+ -soft variants)

/* Misc */
--shadow-sm · --shadow-md · --shadow-lg
--r-xs · --r-sm · --r-md · --r-lg · --r-xl · --r-pill
```

**কখনো hardcode করো না** — সবসময় `var(--brand)`, `var(--surface)` ব্যবহার করো।

**Ready-made utility classes:** `.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.input`, `.label`, `.pill`, `.pill-success/warning/danger/info`, `.tbl`, `.skel`, `.stat`, `.avatar`, `.seg`, `.chip`, `.timeline-*`, `.page`, `.drawer`, `.dialog`, `.toast`

---

## ট্রাবলশুটিং

| সমস্যা | সমাধান |
|--------|--------|
| `npm install` fail | Node v22+ ও npm 11+ আছে কিনা চেক করো |
| `ng: command not found` | `npm start` বা `npx ng serve` ব্যবহার করো |
| API call fail / CORS | `src/environments/environment.ts` এর `apiUrl` ঠিক করো |
| Login loop (বারবার `/login` যাচ্ছে) | Browser localStorage clear করো (F12 → Application → Clear) |
| Charts দেখা যাচ্ছে না | Console এ ApexCharts error দেখো; `@defer` block এর `@error` check করো |
| Build error: budget exceeded | `angular.json` এর `budgets` limit বাড়াও বা lazy load ঠিক করো |
| Dark mode কাজ করছে না | `html` tag এ `class="light"` আছে কিনা দেখো; `ThemeService` inject হয়েছে কিনা দেখো |

---

## Deploy

```bash
# 1. Production build
npm run build

# 2. Output folder
dist/bkash-admin/browser/

# 3. Static file server এ serve করো (Nginx / Cloudflare Pages / S3+CDN)
# 4. SPA fallback — সব unknown route → index.html
# 5. API URL production environment.prod.ts এ set করো
```

**Nginx SPA config (example):**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Smoke test after deploy:** Login → Dashboard → Upload SMS → Transactions → Reports → Logout

---

*Private — Internal use only.*
