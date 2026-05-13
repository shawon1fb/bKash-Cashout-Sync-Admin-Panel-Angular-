# bKash Cashout Sync — Admin Panel (Angular)

> bKash Cashout Transaction Sync Platform এর জন্য একটি সম্পূর্ণ Angular 21 Admin Dashboard।
> এটি Admin এবং Agent দুই ধরনের ইউজারের জন্য আলাদা আলাদা UI ও রোল-বেসড অ্যাক্সেস সাপোর্ট করে।

---

## প্রজেক্ট সংক্ষিপ্ত বিবরণ

এই প্রজেক্টটি bKash Cashout SMS থেকে ট্রানজাকশন পার্স করে সিঙ্ক করার একটি প্ল্যাটফর্মের অ্যাডমিন প্যানেল। ইউজাররা (Agent/Admin) OTP দিয়ে লগইন করে, Dashboard দেখতে পারে, Transaction ম্যানেজ করতে পারে, এবং Reports দেখতে পারে। Admin গণ Agent ম্যানেজ করতে পারে এবং সব Agent এর Transaction দেখতে পারে।

### মূল ফিচারসমূহ
- OTP ভিত্তিক লগইন (Phone → OTP → Verify)
- Role-based Dashboard (Admin vs Agent)
- ট্রানজাকশন লিস্ট, আপলোড, এবং Status Change (Received → Paid)
- Agent Management (Create, Edit, Deactivate)
- রিপোর্টস ও চার্টস (ApexCharts)
- Dark/Light Mode Toggle
- Responsive Layout (Desktop / Tablet / Mobile)
- Bengali Phone Format (`017-1122-3344`) এবং Amount Format (`৳ 1,500.00`) পাইপ

---

## টেক স্ট্যাক

| প্রযুক্তি | সংস্করণ | উদ্দেশ্য |
|-----------|--------|---------|
| Angular | 21 | ফ্রন্টএন্ড ফ্রেমওয়ার্ক |
| TypeScript | ~5.9 | টাইপ-সেফ কোড |
| TailwindCSS | 4+ | Utility-first CSS |
| ApexCharts | 5 | চার্ট ও গ্রাফ |
| ng-apexcharts | 2 | Angular wrapper for ApexCharts |
| date-fns | 4 | Date formatting |
| RxJS | 7 | Reactive programming |

### আর্কিটেকচার হাইলাইটস
- **Standalone Components** — কোনো NgModule ব্যবহার করা হয়নি
- **Zoneless Change Detection** — `provideZonelessChangeDetection()`
- **Angular Signals** — সব State Management `signal()`, `computed()`, `resource()` দিয়ে
- **Functional Interceptors** — `authInterceptor` ও `refreshInterceptor`
- **Lazy Loaded Routes** — প্রতিটি Feature route lazy-loaded

---

## ফোল্ডার স্ট্রাকচার

```
src/
├── app/
│   ├── core/
│   │   ├── interceptors/     # auth.interceptor.ts, refresh.interceptor.ts
│   │   ├── guards/           # auth.guard.ts, role.guard.ts
│   │   ├── services/         # auth, api, transaction, agent, toast, theme, storage, drawer
│   │   └── models/           # user.model.ts, transaction.model.ts, api-response.model.ts
│   ├── features/
│   │   ├── auth/login/
│   │   ├── dashboard/
│   │   ├── transactions/     # list, my-transactions, upload
│   │   ├── agents/           # list, detail
│   │   ├── reports/          # admin-reports, my-reports
│   │   └── settings/
│   ├── shared/
│   │   ├── components/       # sidebar, topbar, stat-card, status-badge, charts, dialogs, pagination
│   │   ├── layout/           # admin-layout, auth-layout
│   │   └── pipes/            # amount.pipe.ts, phone.pipe.ts, icon.pipe.ts
│   ├── app.ts                # Root component
│   ├── app.config.ts         # App configuration (router, http, zoneless)
│   └── app.routes.ts         # Route definitions
├── environments/
│   ├── environment.ts        # dev: http://localhost:3000
│   └── environment.prod.ts # prod: https://api.yourdomain.com
├── styles.scss               # Global styles, CSS variables, design tokens
└── main.ts                   # Bootstrap
```

---

## Prerequisites

তোমার সিস্টেমে নিচের জিনিসগুলো ইনস্টল থাকতে হবে:

- **Node.js** v22+ (অথবা LTS)
- **npm** 11+ (package.json-এ `packageManager: npm@11.11.0`)

```bash
node -v   # v22.x বা উপরে
npm -v    # 11.x বা উপরে
```

---

## ইনস্টলেশন

রেপোজিটরি ক্লোন বা এক্সট্রাক্ট করে টার্মিনালে যাও:

```bash
cd bkash-admin   # অথবা প্রজেক্ট ফোল্ডার
npm install
```

---

## Development Server চালু করা

```bash
npm start
# অথবা
ng serve
```

ব্রাউজারে খুলো: `http://localhost:4200`

Angular CLI এর দেওয়া হট-রিলোড সাপোর্ট আছে — কোড চেঞ্জ করলে অটো রিফ্রেশ হবে।

---

## Build করা

### Development Build
```bash
ng build
# অথবা
ng build --configuration=development
```

### Production Build
```bash
ng build --configuration=production
```

Production build এর output `dist/bkash-admin` ফোল্ডারে যাবে।

---

## Environment Configuration

### `src/environments/environment.ts` (Development)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'   # তোমার local/dev API URL
};
```

### `src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};
```

**API Base URL চেঞ্জ করতে** `src/environments/environment.ts` ফাইলটি এডিট করো।

---

## Tests চালানো

### সব Test
```bash
ng test
```

### নির্দিষ্ট ফাইলের Test
```bash
ng test --include="**/auth.service.spec.ts"
```

---

## Linting

```bash
ng lint
```

---

## Auth Flow (কিভাবে লগইন কাজ করে)

1. **Phone Input** → `POST /auth/otp/send` → OTP পাঠানো হয়
2. **6-digit OTP** → `POST /auth/otp/verify` → Token পাওয়া যায়
3. **Token Store** → localStorage-এ `accessToken`, `refreshToken`, এবং `user` সংরক্ষণ
4. **API Calls** → প্রতিটি রিকোয়েস্টে `Authorization: Bearer <token>` যায়
5. **401 Handling** → `refreshInterceptor` রিফ্রেশ টোকেন দিয়ে রিট্রাই করে
6. **Logout** → `POST /auth/logout` → localStorage ক্লিয়ার → `/login`-এ রিডাইরেক্ট

---

## Routing ও Access Control

| Route | Role | লেআউট |
|-------|------|--------|
| `/login` | Public | AuthLayout |
| `/dashboard` | Auth (All) | AdminLayout |
| `/transactions` | Admin | AdminLayout |
| `/my-transactions` | Agent | AdminLayout |
| `/upload` | Auth (All) | AdminLayout |
| `/agents` | Admin | AdminLayout |
| `/agents/:id` | Admin | AdminLayout |
| `/reports` | Admin | AdminLayout |
| `/my-reports` | Agent | AdminLayout |
| `/settings` | Auth (All) | AdminLayout |

- `AuthGuard` — লগইন না থাকলে `/login`-এ পাঠিয়ে দেয়
- `RoleGuard` — Admin route Agent কে `/dashboard`-এ পাঠিয়ে দেয়

---

## Backend API Endpoints

অ্যাপটি নিচের API Endpoints ব্যবহার করে:

### Auth (Public)
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `POST /auth/refresh`
- `POST /auth/logout`

### Users (Authenticated)
- `GET /users/profile`
- `PATCH /users/profile`
- `GET /users` (Admin only)

### Transactions (Authenticated)
- `GET /transactions` — Paginated list
- `POST /transactions/upload` — SMS থেকে ট্রানজাকশন ক্রিয়েট
- `PATCH /transactions/:id/status` — Status update (paid/received)
- `GET /transactions/summary` — Summary/Reports
- `GET /transactions/verify/:id` — Public verify

### Admin (Admin only)
- `GET /admin/transactions`
- `GET /admin/transactions/summary`
- `GET /admin/agents`
- `POST /admin/agents`
- `PATCH /admin/agents/:uuid`
- `DELETE /admin/agents/:uuid`
- `GET /admin/agents/:uuid/summary`
- `GET /admin/agents/:uuid/transactions`

---

## Dark Mode

Dark/Light mode CSS variables (`styles.scss`) এবং `html` ট্যাগের `class="dark"` বা `class="light"` দিয়ে নিয়ন্ত্রিত হয়। User-এর Preference localStorage-এ সংরক্ষিত থাকে।

---

## Custom Pipes

| Pipe | Input | Output |
|------|-------|--------|
| `AmountPipe` | `1500.00` | `৳ 1,500.00` |
| `PhonePipe` | `01711223344` | `017-1122-3344` |

---

## Development Tips

1. **Always use `inject()`** — কোনো constructor injection নয়
2. **Signals for state** — Component-এ `signal()`, `computed()`, `resource()` ব্যবহার করো
3. **Templates** — `@if`, `@for`, `@switch` ব্যবহার করো (`*ngIf`, `*ngFor` এড়িয়ে চলো)
4. **Defer heavy UI** — Chart / Table এর জন্য `@defer` ব্লক ব্যবহার করো
5. **Never hardcode colors** — সবসময় CSS Variables ব্যবহার করো (`var(--brand)`, `var(--surface)`)
6. **Forms** — ReactiveFormsModule ব্যবহার করো (template-driven নয়)

---

## License

Private — Internal use only.
