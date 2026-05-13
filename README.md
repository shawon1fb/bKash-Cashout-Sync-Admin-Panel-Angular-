# bKash Cashout Sync — Admin Panel (Angular)

> bKash Cashout Transaction Sync Platform এর জন্য একটি সম্পূর্ণ Angular 21 Admin Dashboard।
> Admin এবং Agent — দুই ধরনের ইউজারের জন্য আলাদা UI ও রোল-বেসড অ্যাক্সেস সাপোর্ট করে।

---

## সূচিপত্র

- [সংক্ষিপ্ত বিবরণ](#সংক্ষিপ্ত-বিবরণ)
- [প্রধান ফিচার](#প্রধান-ফিচার)
- [টেক স্ট্যাক](#টেক-স্ট্যাক)
- [আর্কিটেকচার](#আর্কিটেকচার)
- [ফোল্ডার স্ট্রাকচার](#ফোল্ডার-স্ট্রাকচার)
- [প্রerequisites](#prerequisites)
- [ইনস্টলেশন ও স্ক্রিপ্ট](#ইনস্টলেশন-ও-স্ক্রিপ্ট)
- [ডেভেলপমেন্ট সার্ভার](#ডেভেলপমেন্ট-সার্ভার)
- [বিল্ড](#বিল্ড)
- [এনভায়রনমেন্ট কনফিগারেশন](#এনভায়রনমেন্ট-কনফিগারেশন)
- [টেস্ট](#টেস্ট)
- [অথেনটিকেশন ফ্লো](#অথেনটিকেশন-ফ্লো)
- [রাউটিং ও অ্যাক্সেস কন্ট্রোল](#রাউটিং-ও-অ্যাক্সেস-কন্ট্রোল)
- [ব্যাকএন্ড API](#ব্যাকএন্ড-api)
- [স্টেট ম্যানেজমেন্ট ও কনভেনশন](#স্টেট-ম্যানেজমেন্ট-ও-কনভেনশন)
- [কাস্টম পাইপ](#কাস্টম-পাইপ)
- [ডার্ক মোড](#ডার্ক-মোড)
- [ট্রাবলশুটিং](#ট্রাবলশুটিং)
- [ডেপ্লয়মেন্ট](#ডেপ্লয়মেন্ট)
- [লাইসেন্স](#লাইসেন্স)

---

## সংক্ষিপ্ত বিবরণ

এই প্রজেক্টটি bKash Cashout SMS থেকে ট্রানজাকশন পার্স করে সিঙ্ক করার একটি প্ল্যাটফর্মের অ্যাডমিন প্যানেল।

ইউজাররা (Agent/Admin) OTP দিয়ে লগইন করে, Dashboard দেখতে পারে, Transaction ম্যানেজ করতে পারে এবং Reports দেখতে পারে। Admin গণ Agent ম্যানেজ করতে পারে এবং সব Agent এর Transaction দেখতে পারে।

---

## প্রধান ফিচার

- OTP ভিত্তিক লগইন (Phone → OTP → Verify)
- Role-based Dashboard (Admin vs Agent)
- Transaction লিস্ট, আপলোড এবং Status Change (Received → Paid)
- Agent Management (Create, Edit, Deactivate)
- Reports ও Charts (ApexCharts)
- Dark/Light Mode Toggle
- Responsive Layout (Desktop / Tablet / Mobile)
- Bengali Phone Format (`017-1122-3344`) এবং Amount Format (`৳ 1,500.00`) Pipe

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
| Vitest | 4 | Unit testing (Angular 21+ default) |

---

## আর্কিটেকচার

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
│   └── environment.prod.ts   # prod: https://api.yourdomain.com
├── styles.scss               # Global styles, CSS variables, design tokens
└── main.ts                   # Bootstrap
```

---

## Prerequisites

- **Node.js** v22+ (LTS recommended)
- **npm** 11+ (package.json-এ `packageManager: npm@11.11.0`)

চেক করো:

```bash
node -v   # v22.x বা উপরে
npm -v    # 11.x বা উপরে
```

---

## ইনস্টলেশন ও স্ক্রিপ্ট

```bash
cd bkash-admin   # অথবা প্রজেক্ট ফোল্ডার
npm install
```

### Available NPM Scripts

| Command | কাজ |
|---------|-----|
| `npm start` | ডেভেলপমেন্ট সার্ভার চালু করে (`ng serve`) |
| `npm run build` | ডিফল্ট production build তৈরি করে |
| `npm run watch` | development mode এ watch build চালায় |
| `npm test` | unit tests চালায় (Vitest) |

---

## ডেভেলপমেন্ট সার্ভার

```bash
npm start
# অথবা
npx ng serve
```

ব্রাউজারে খুলো: `http://localhost:4200`

Angular CLI এর হট-রিলোড সাপোর্ট আছে — কোড চেঞ্জ করলে অটো রিফ্রেশ হবে।

---

## বিল্ড

### Development Build

```bash
npx ng build --configuration=development
```

### Production Build

```bash
npm run build
# অথবা
npx ng build --configuration=production
```

Production build এর output: `dist/bkash-admin/browser/`

---

## এনভায়রনমেন্ট কনফিগারেশন

### `src/environments/environment.ts` (Development)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',   // তোমার local/dev API URL
};
```

### `src/environments/environment.prod.ts` (Production)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com',
};
```

**API Base URL চেঞ্জ করতে** `src/environments/environment.ts` ফাইলটি এডিট করো।

### CI/CD Convention

পাইপলাইনে environment variable inject করতে চাইলে নিচের keys ব্যবহার করো:

- `API_URL` → `environment.apiUrl`
- `APP_ENV` → `production` flag নির্ধারণে

Note: Angular runtime-এ `.env` সরাসরি পড়ে না; build-time replace বা pipeline template ব্যবহার করতে হবে।

---

## টেস্ট

### সব Test চালানো

```bash
npm test
# অথবা
npx ng test
```

### নির্দিষ্ট ফাইলের Test

```bash
npx ng test --include="**/auth.service.spec.ts"
```

Note: এই প্রজেক্টে Angular 21+ এর সাথে Vitest ব্যবহার করা হয়েছে (Karma/Jasmine নয়)।

---

## অথেনটিকেশন ফ্লো

1. **Phone Input** → `POST /auth/otp/send` → OTP পাঠানো হয়
2. **6-digit OTP** → `POST /auth/otp/verify` → Token পাওয়া যায়
3. **Token Store** → localStorage-এ `accessToken`, `refreshToken` এবং `user` সংরক্ষণ
4. **API Calls** → প্রতিটি রিকোয়েস্টে `Authorization: Bearer <token>` যায়
5. **401 Handling** → `refreshInterceptor` refresh token দিয়ে retry করে
6. **Logout** → `POST /auth/logout` → localStorage ক্লিয়ার → `/login`-এ রিডাইরেক্ট

---

## রাউটিং ও অ্যাক্সেস কন্ট্রোল

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

- `authGuard` — লগইন না থাকলে `/login`-এ পাঠিয়ে দেয়
- `roleGuard` — Admin route Agent কে `/dashboard`-এ পাঠিয়ে দেয়

---

## ব্যাকএন্ড API

### Auth (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/otp/send` | Phone number এ OTP পাঠায় |
| POST | `/auth/otp/verify` | OTP verify করে token দেয় |
| POST | `/auth/refresh` | Access token refresh করে |
| POST | `/auth/logout` | Session invalidate করে |

### Users (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/profile` | বর্তমান user এর প্রোফাইল |
| PATCH | `/users/profile` | প্রোফাইল আপডেট |

### Transactions (Authenticated)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | Paginated transaction list |
| POST | `/transactions/upload` | SMS থেকে transaction create |
| GET | `/transactions/verify/:id` | Public transaction verify |
| PATCH | `/transactions/:id/status` | Status update (paid/received) |
| GET | `/transactions/summary` | Summary / Reports |

### Admin (Admin only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/transactions` | সব transaction list |
| GET | `/admin/transactions/summary` | সব transaction summary |
| GET | `/admin/agents` | Agent list |
| POST | `/admin/agents` | নতুন Agent create |
| GET | `/admin/agents/:uuid` | নির্দিষ্ট Agent detail |
| PATCH | `/admin/agents/:uuid` | Agent update |
| DELETE | `/admin/agents/:uuid` | Agent deactivate/delete |
| GET | `/admin/agents/:uuid/transactions` | Agent এর transaction list |
| GET | `/admin/agents/:uuid/summary` | Agent এর summary |
| GET | `/admin/agents/top` | Top agents |

### Error Response Convention (Suggested)

Backend error ideally নিচের shape এ consistent হলে frontend handling সহজ হয়:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "phone": ["Phone number is invalid"]
  }
}
```

---

## স্টেট ম্যানেজমেন্ট ও কনভেনশন

1. **Always use `inject()`** — constructor injection এড়িয়ে চলো
2. **Signals for state** — Component-এ `signal()`, `computed()`, `resource()` ব্যবহার করো
3. **Templates** — `@if`, `@for`, `@switch` ব্যবহার করো (`*ngIf`, `*ngFor` এড়িয়ে চলো)
4. **Defer heavy UI** — Chart / Table এর জন্য `@defer` ব্লক ব্যবহার করো
5. **Never hardcode colors** — সবসময় CSS Variables ব্যবহার করো (`var(--brand)`, `var(--surface)`)
6. **Forms** — ReactiveFormsModule ব্যবহার করো (template-driven নয়)

---

## কাস্টম পাইপ

| Pipe | Input | Output |
|------|-------|--------|
| `AmountPipe` | `1500.00` | `৳ 1,500.00` |
| `PhonePipe` | `01711223344` | `017-1122-3344` |

---

## ডার্ক মোড

Dark/Light mode CSS variables (`styles.scss`) এবং `html` ট্যাগের `class="dark"` বা `class="light"` দিয়ে নিয়ন্ত্রিত হয়। User-এর Preference localStorage-এ সংরক্ষিত থাকে।

---

## ট্রাবলশুটিং

| সমস্যা | সমাধান |
|--------|--------|
| `npm install` error (engine mismatch) | Node.js `v22+` এবং npm `11+` আছে কিনা চেক করো |
| `ng` command not found | `npm start` ব্যবহার করো, বা `npx ng serve` চালাও |
| CORS / API call fail | `environment.ts` এর `apiUrl` backend URL এর সাথে মিলাও |
| Auth loop (login page এ ফিরে যায়) | localStorage clear করে আবার login করো |
| Charts render না হলে | browser console দেখে ApexCharts related error verify করো |
| Build output খুঁজে পাওয়া যাচ্ছে না | `dist/bkash-admin/browser/` চেক করো |

---

## ডেপ্লয়মেন্ট

1. `npm run build` (production build)
2. `dist/bkash-admin/browser/` থেকে static assets serve করো (Nginx / Cloudflare Pages / S3+CDN)
3. SPA fallback configure করো — সব unknown route `index.html`-এ fallback করবে
4. API base URL production environment অনুযায়ী set করো
5. Deploy পর login, dashboard, upload, reports flow smoke test করো

---

## লাইসেন্স

Private — Internal use only.
