You are building a complete Angular 21 admin panel frontend for a bKash Cashout Transaction Sync Platform. Build the ENTIRE project — routing, auth, all pages, all components, API integration, guards, interceptors, dark mode, responsive layout. Do not stop until every page listed is working.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK (mandatory, no alternatives)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Angular 21 (standalone components, zoneless, signals)
- Angular Material 21 (for UI components)
- TailwindCSS 4+ (for layout and utility classes)
- ApexCharts + ng-apexcharts (for all charts)
- Angular Router (lazy-loaded routes, withComponentInputBinding)
- Angular HttpClient with withInterceptors() (functional interceptors)
- @angular/cdk (overlay, drag-drop, portal)
- date-fns v3+ (date formatting/manipulation)
- rxjs 7+ (observables, operators)

State management: Angular Signals ONLY
  — Use signal(), computed(), effect() for ALL reactive state
  — Use toSignal() to bridge Observables to Signals in components
  — Use linkedSignal() for derived writable state
  — Use resource() / rxResource() for async data fetching in components
  — Services may use Subject/BehaviorSubject internally for event streams,
    but ALWAYS expose signals to the outside world
  — NO BehaviorSubject in components, NO NgRx, NO external state library

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANGULAR 21 RULES (strictly follow)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- All components must be standalone: true — never use NgModules
- Use inject() function for ALL dependency injection (no constructor injection)
- Use provideExperimentalZonelessChangeDetection() — no zone.js
- Signal-based component inputs:
    name = input<string>()
    required = input.required<string>()
- Signal-based outputs:
    clicked = output<void>()
- Two-way binding with model():
    value = model<string>('')
- Use @if, @for, @switch control flow blocks in ALL templates (never *ngIf, *ngFor, *ngSwitch)
- Use @defer blocks for heavy sections (charts, large tables) with @placeholder and @loading
- Register interceptors functionally:
    provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor]))
- Router setup:
    provideRouter(routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withRouterConfig({ paramsInheritanceStrategy: 'always' })
    )
- Use takeUntilDestroyed() (inject DestroyRef) for any manual subscriptions
- Use afterRenderEffect() instead of ngAfterViewInit where appropriate
- Route params injected directly as signal inputs via withComponentInputBinding()
  (no need for ActivatedRoute in components — just declare `id = input<string>()`)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Base URL: environment.apiUrl (default: http://localhost:8000)
All authenticated requests: Authorization: Bearer <accessToken>

── RESPONSE ENVELOPE ──
Success:
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": <T>,
  "meta": {             // only on paginated responses
    "total": number,
    "page": number,
    "limit": number,
    "totalPages": number,
    "hasNextPage": boolean,
    "hasPreviousPage": boolean
  }
}

Error:
{
  "success": false,
  "statusCode": 400,
  "message": "string",
  "errors": ["field: validation message"]   // only on 400
}

── AUTH ENDPOINTS (public, no token needed) ──

POST /auth/otp/send
Body: { "phone": "01711223344" }   // Bangladeshi format: ^01[3-9]\d{8}$
Response data: { success: bool, message: str, phone: str, expiresInMinutes: number }

POST /auth/otp/verify
Body: { "phone": "01711223344", "otp": "123456" }   // OTP = 6 digits
Response data: {
  accessToken: string,     // JWT, short-lived
  refreshToken: string,    // JWT, long-lived (7d)
  user: UserResponse
}

POST /auth/refresh
Body: { "refreshToken": "string" }
Response data: { accessToken: string, refreshToken: string }

POST /auth/logout          (requires token)
Response: { message: "Logged out successfully" }

── USERS (requires token) ──

GET    /users/profile                    → UserResponse
PATCH  /users/profile    body: { name?: string }   → UserResponse

GET    /users            admin only — query: { page,limit,search,role,isActive,sortBy,sortOrder }
                         → paginated UserResponse[]
GET    /users/:uuid      admin only → UserResponse
PATCH  /users/:uuid      admin only — body: { name?,isActive? } → UserResponse

UserResponse shape:
{
  id: string (uuid),
  name: string,
  phone: string,
  role: "admin" | "agent",
  isActive: boolean,
  createdAt: string (ISO),
  updatedAt: string (ISO)
}

── TRANSACTIONS (requires token) ──

POST /transactions/upload
Body: { "rawMessage": "Cash Out Tk 1,500.00 from 01711223344 successful. TrxID A2B3C4D5E6. Fee Tk 15.00. Balance Tk 5,000.00. 12/05/26 2:30 PM" }
Response data: TransactionResponse

GET  /transactions/verify/:transactionId   (PUBLIC — no token)
Response data: TransactionResponse

PATCH /transactions/:transactionId/status
Body: { "status": "paid" | "received" }
Response data: TransactionResponse

GET /transactions     query: { page,limit,status,from,to }
                      → paginated TransactionResponse[]

GET /transactions/summary   query: { period: "daily"|"weekly"|"monthly"|"custom", from?,to? }
                            → SummaryResponse

TransactionResponse shape:
{
  id: string (uuid),
  transactionId: string,      // bKash TrxID e.g. "A2B3C4D5E6"
  amount: string,             // decimal string e.g. "1500.00"
  transactionTime: string (ISO),
  status: "received" | "paid",
  agentId: string (uuid),
  senderPhone: string | null,
  receiverPhone: string,
  rawMessage: string,
  createdAt: string (ISO)
}

SummaryResponse shape:
{
  totalPaidAmount: number,
  totalTransactionCount: number,
  period: string,
  from: string,    // "YYYY-MM-DD"
  to: string       // "YYYY-MM-DD"
}

── ADMIN (requires token + admin role) ──

GET   /admin/transactions         query: { page,limit,agentId?,status?,from?,to? }
                                  → paginated TransactionResponse[]

GET   /admin/transactions/summary  query: { period,from?,to? } → SummaryResponse

GET   /admin/agents               query: { page,limit,search?,isActive?,sortBy?,sortOrder? }
                                  → paginated UserResponse[]

POST  /admin/agents
Body: { name: string (2-100 chars), phone: string (BD format) }
Response data: UserResponse

PATCH /admin/agents/:uuid
Body: { name?: string, isActive?: boolean }
Response data: UserResponse

DELETE /admin/agents/:uuid        → UserResponse (with isActive: false)

GET   /admin/agents/:uuid/summary   query: { period,from?,to? } → SummaryResponse

GET   /admin/agents/:uuid/transactions  query: { page,limit,status?,from?,to? }
                                        → paginated TransactionResponse[]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
src/
  app/
    core/
      interceptors/
        auth.interceptor.ts       # adds Bearer token to all requests
        refresh.interceptor.ts    # on 401: refresh token then retry
      guards/
        auth.guard.ts             # redirect to /login if not authenticated
        role.guard.ts             # redirect if wrong role
      services/
        auth.service.ts           # signals: currentUser, isAuthenticated, isAdmin
        storage.service.ts        # localStorage wrapper
        api.service.ts            # base HTTP methods returning Observables
        transaction.service.ts
        agent.service.ts
        toast.service.ts          # wraps MatSnackBar
      models/
        user.model.ts
        transaction.model.ts
        api-response.model.ts
    features/
      auth/
        login/
      dashboard/
      transactions/
        list/                     # admin: all transactions
        my-transactions/          # agent: own transactions
        detail/                   # transaction detail modal/drawer
        upload/                   # upload SMS form
      agents/
        list/
        detail/
        create/                   # dialog component
      reports/
        admin-reports/
        my-reports/
      settings/
    shared/
      components/
        sidebar/
        topbar/
        data-table/
        status-badge/
        stat-card/
        confirm-dialog/
        empty-state/
        loading-skeleton/
        pagination/
        chart-card/
      layout/
        admin-layout/
        auth-layout/
      pipes/
        amount.pipe.ts            # "৳ 1,500.00"
        phone.pipe.ts             # "017-1122-3344"
  environments/
    environment.ts
    environment.prod.ts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROUTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/login                        → AuthLayout > LoginPage        [public]
/                             → redirect to /dashboard
/dashboard                    → AdminLayout > DashboardPage   [auth]
/transactions                 → AdminLayout > TransactionListPage  [auth, admin]
/transactions/upload          → AdminLayout > UploadPage      [auth]
/my-transactions              → AdminLayout > MyTransactionsPage [auth, agent]
/agents                       → AdminLayout > AgentListPage   [auth, admin]
/agents/:id                   → AdminLayout > AgentDetailPage [auth, admin]
/reports                      → AdminLayout > ReportsPage     [auth, admin]
/my-reports                   → AdminLayout > MyReportsPage   [auth, agent]
/settings                     → AdminLayout > SettingsPage    [auth]

- Lazy load every feature route
- AuthGuard on all routes except /login
- RoleGuard on admin-only routes (redirect agent → /dashboard)
- AgentDetailPage receives route param `id` as signal input (withComponentInputBinding)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTH FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. User enters phone → POST /auth/otp/send
2. Show 6-digit OTP input → POST /auth/otp/verify
3. Store { accessToken, refreshToken, user } in localStorage
4. Auth interceptor attaches Bearer token to every request
5. On 401: refresh interceptor calls POST /auth/refresh, updates tokens, retries original request
6. On refresh failure: clear storage, redirect /login
7. Logout: POST /auth/logout, clear storage, redirect /login

AuthService must expose these signals:
  currentUser  = signal<UserResponse | null>(null)
  isAuthenticated = computed(() => !!this.currentUser())
  isAdmin = computed(() => this.currentUser()?.role === 'admin')

On app init (APP_INITIALIZER or constructor effect), read user from localStorage
and populate currentUser signal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE SPECIFICATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[LOGIN PAGE]
- Phone input (BD format validation: ^01[3-9]\d{8}$)
- "Send OTP" button → calls /auth/otp/send
- After OTP sent: show 6-digit OTP input (auto-focus, numeric only)
- Countdown timer showing OTP expiry (5 minutes) using signal + interval
- "Resend OTP" link (visible after countdown expires)
- "Verify & Login" button → calls /auth/otp/verify
- isLoading = signal<boolean>(false) on each step
- Error toast on failure
- Centered card on gradient background

[DASHBOARD PAGE]
Admin sees:
  Top stat cards: Total Transactions | Total Paid Amount | Total Agents | Total Received Amount
  Charts:
    - Daily transaction count (last 7 days) — line chart
    - Monthly revenue (last 6 months) — bar chart
    - Transaction status split — donut chart (received vs paid)
  Recent Transactions table (last 10, links to detail)
  Recent Agents (last 5)

Agent sees:
  Stat cards: Today Paid | This Week Paid | This Month Paid | Today Transaction Count
  Charts:
    - Daily earnings (last 7 days) — line chart
    - Transaction volume by status — donut chart
  Recent Transactions table (own, last 10)

Data sources: /transactions/summary + /admin/transactions/summary + /admin/agents
Use resource() for each async data chunk with loading/error states via signal.

[TRANSACTIONS PAGE — admin]
- Server-side paginated table
- Columns: TrxID | Amount | Time | Status badge | Agent Name | Actions
- Filters: search by TrxID, status dropdown, date range picker (from/to)
  — All filter values stored in signals; computed() builds query params
- Sort by time (desc default)
- Pagination: page size 10/25/50
- "Mark as Paid" (only for status=received) with confirm dialog
- "View Details" opens side drawer
- Export CSV button (client-side, from currently loaded data)

[TRANSACTION DETAIL — side drawer]
- All TransactionResponse fields
- Raw SMS in monospace box
- Status badge + change status button
- Agent info card (name, phone)
- Timeline: created → received → paid

[MY TRANSACTIONS PAGE — agent]
Same table as admin transactions but:
- Only own transactions (GET /transactions)
- No agent column
- Agent can mark own transactions as paid

[AGENTS PAGE — admin only]
- Paginated table: Name | Phone | Status | Created Date | Actions
- Search by name/phone
- Filter: active/inactive
- Actions: View | Edit | Deactivate (confirm dialog)
- "Add Agent" → opens CreateAgentDialog

[CREATE AGENT DIALOG]
- Name input (2-100 chars)
- Phone input (BD format, validates on blur)
- isCreating = signal<boolean>(false)
- Show 409 conflict error inline

[AGENT DETAIL PAGE]
- `id = input.required<string>()` (from route via withComponentInputBinding)
- Agent info card (name, phone, status, created)
- Edit button → inline edit
- Deactivate / Reactivate toggle with confirm dialog
- Summary cards: Total Paid | Total Transactions
- Period selector (daily/weekly/monthly/custom) — selectedPeriod = signal()
  updates summary via resource() reacting to signal
- Agent's transaction table, paginated

[REPORTS PAGE — admin]
- Period selector: Daily | Weekly | Monthly | Custom
- Summary cards: Total Paid | Total Transactions | Average Amount
- Charts: Revenue area chart | Transaction volume bar chart
- Agent performance table: Agent | Total Paid | Count — sorted desc

[MY REPORTS PAGE — agent]
- Same period selector
- Uses /transactions/summary
- Charts: Earnings line chart | Transaction count bar chart

[SETTINGS PAGE]
Profile tab:
  - Name input (pre-filled from currentUser signal)
  - Phone (read-only)
  - Save → PATCH /users/profile → update currentUser signal

Theme tab:
  - Dark/light mode toggle (updates <html> class + localStorage)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARED COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SIDEBAR]
Desktop (>1024px): fixed 240px sidebar, always visible
Tablet (768-1024px): icon-only collapsed mode
Mobile (<768px): off-canvas drawer, hamburger toggle

Sidebar state: isCollapsed = signal<boolean>(false)

Admin nav items:
  Dashboard | Transactions | Agents | Reports | Settings

Agent nav items:
  Dashboard | My Transactions | My Reports | Settings

- Active route highlight (RouterLinkActive)
- Role-based menu (hide admin items for agent) — driven by isAdmin signal
- Bottom: user avatar + name + logout button

[STAT CARD]
Inputs (signal-based):
  label = input.required<string>()
  value = input.required<string | number>()
  icon = input.required<string>()
  trend = input<string>()
  loading = input<boolean>(false)
- Skeleton shown when loading() is true
- Hover lift animation

[STATUS BADGE]
  status = input.required<'received' | 'paid' | 'active' | 'inactive'>()
- received: amber pill
- paid: green pill
- inactive: gray pill
- active: blue pill

[DATA TABLE]
Generic component:
  columns = input.required<ColumnDef[]>()
  data = input.required<T[]>()
  loading = input<boolean>(false)
  totalItems = input<number>(0)
  page = input<number>(1)
  pageSize = input<number>(10)
  pageChange = output<number>()
- Shows skeleton rows when loading
- Empty state when data is empty and not loading

[CONFIRM DIALOG]
- Uses Angular CDK Dialog (not MatDialog)
- Inputs: title, message, confirmLabel, isDanger
- Returns boolean via dialog result

[TOAST SERVICE]
- Wraps MatSnackBar
- Methods: success(msg), error(msg), info(msg)
- Auto-dismiss 4s
- Color-coded

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERCEPTORS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Both must be functional interceptors (HttpInterceptorFn):

authInterceptor:
  - Skip: /auth/otp/send, /auth/otp/verify, /auth/refresh
  - Attach: Authorization: Bearer <accessToken>

refreshInterceptor:
  - On 401:
    1. POST /auth/refresh with stored refreshToken
    2. Update stored tokens
    3. Retry original request with new token
    4. If refresh fails → logout → redirect /login
  - Use switchMap + catchError, prevent concurrent refresh loops

Register in app.config.ts:
  provideHttpClient(withInterceptors([authInterceptor, refreshInterceptor]))

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ERROR HANDLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All HTTP errors handled in service layer, never in components:
  400 → show errors[] array as toast or inline field errors
  401 → handled by refreshInterceptor
  403 → "Access denied" toast
  404 → "Not found" toast
  409 → specific conflict message (e.g. "Phone already registered")
  500 → "Server error, please try again" toast
  Network error → "Connection failed" toast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLING RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CSS Variables (light / dark):
  --primary: #2563EB / same
  --primary-light: #3B82F6 / same
  --success: #16A34A / same
  --warning: #D97706 / same
  --danger: #DC2626 / same
  --bg: #F8FAFC / #0F172A
  --surface: #FFFFFF / #1E293B
  --surface-2: #F1F5F9 / #334155
  --border: #E2E8F0 / #475569
  --text: #0F172A / #F8FAFC
  --text-muted: #64748B / #94A3B8

Dark mode: class="dark" on <html>. Toggle stored in localStorage.
Never hardcode colors — always use CSS variables.

Typography:
  Font: DM Sans (Google Fonts) — clean and modern
  Base: 14px, headings weight 600

Cards:
  background: var(--surface)
  border-radius: 12px
  box-shadow: 0 1px 3px rgba(0,0,0,0.08)
  padding: 24px

Responsive: sm=640 md=768 lg=1024 xl=1280 (Tailwind defaults)
TailwindCSS 4 config: use CSS-first config (@theme in styles.css), no tailwind.config.js needed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com'
};

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD STEPS (do in order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ng new bkash-admin --routing --style=scss --standalone
2. Install:
   ng add @angular/material
   npm install ng-apexcharts apexcharts date-fns
   npm install -D tailwindcss @tailwindcss/vite  (TailwindCSS 4 setup)
3. Configure TailwindCSS 4 with Angular (CSS-first @import "tailwindcss")
4. Set up environments
5. Build core: models → storage → auth service → interceptors → guards
6. Build shared layouts: AdminLayout + AuthLayout + Sidebar + Topbar
7. Build shared components: StatCard, StatusBadge, DataTable, ConfirmDialog, LoadingSkeleton, Pagination
8. Build shared pipes: AmountPipe, PhonePipe
9. Build pages in order:
   Login → Dashboard → Transactions → MyTransactions → Upload →
   Agents → AgentDetail → Reports → MyReports → Settings
10. Wire routing with lazy loading
11. Add dark mode toggle
12. Test all API integrations
13. ng build --configuration=production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IMPORTANT RULES (strictly enforce)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Standalone components ONLY — zero NgModules
- inject() for all DI — no constructor injection
- Signals for ALL state — no manual subscribe in components
- resource() / rxResource() for async data — no tap() + manual signal set where avoidable
- All API calls go through typed service methods — never HttpClient directly in components
- @if / @for / @switch in ALL templates — never structural directives
- ReactiveFormsModule ONLY — no template-driven forms
- Every table: loading skeleton + empty state
- Never hardcode colors — only CSS variables
- Amounts formatted as "৳ 1,500.00" using AmountPipe
- Dates formatted as "12 May 2026, 2:30 PM" using date-fns
- Phones displayed as "017-1122-3344" using PhonePipe
- UUIDs never shown to user — always show name/TrxID instead