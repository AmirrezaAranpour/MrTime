# IMPLEMENTATION_STATUS.md

Last updated: 2026-07-03

Feature-by-feature implementation status for the **barber-reservation-frontend**.
Status markers: **Done** | **Partial** | **Stub/Demo** | **Not started**

For project architecture and conventions, see [`AGENTS.md`](AGENTS.md).

---

## Customer Pages

| Page | Route | Status | API Integration | Notes |
|------|-------|--------|-----------------|-------|
| Home | `/` | **Done** | `GET /api/barbers/` via `useActiveBarbers` | Demo decoration for ratings/addresses; upcoming banner reads localStorage |
| Search | `/search` | **Done** | `GET /api/barbers/` via `useActiveBarbers` | Client-side text + category filter over decorated barbers |
| Barber Detail | `/barber/:id` | **Done** | `GET /api/barbers/<id>/`, `GET /api/services/barber-services/<id>/` | Reviews and location are demo data |
| Booking | `/booking/:barberId` | **Done** | services, slots, OTP, create appointment | 3-step wizard; inline OTP auth at final step; also writes localStorage (redundant) |
| Success | `/success` | **Done** | — | Reads router state; redirects to `/` if absent |
| Appointments | `/appointments` | **Done** | `GET /api/reservations/my-appointments/`, cancel endpoint | Full API; cancel gated on `can_cancel`; English errors mapped to Persian |
| Profile | `/profile` | **Partial** | OTP auth + `PATCH /auth/customer/profile/` | Notifications and settings menu items are non-functional stubs |

## Barber Pages

| Page | Route | Status | API Integration | Notes |
|------|-------|--------|-----------------|-------|
| Login/Register | `/barber-panel/login` | **Done** | `POST /auth/barber/register/`, `POST /auth/barber/login/` | Redirects if already barber |
| Dashboard Layout | `/barber-panel` | **Done** | — | Sidebar nav + logout |
| Appointments | `/barber-panel/appointments` | **Stub/Demo** | — (localStorage only) | Uses `appointmentsStore.ts`; "new appointment" shows "coming soon" toast |
| Services | `/barber-panel/services` | **Done** | Full CRUD on `/api/services/barber/` | Create/edit/delete with form validation |
| Weekly Availability | `/barber-panel/availability/weekly` | **Done** | `GET/PATCH /api/availability/barber/weekly/` | 7-day bulk save, 30-min grid, copy-to-all |
| Date Availability | `/barber-panel/availability/dates` | **Done** | `GET/POST/DELETE /api/availability/barber/date/` | Jalali calendar; delete-then-recreate on save |

## API Layer

| Module | Status | Methods | Notes |
|--------|--------|---------|-------|
| `client.ts` | **Done** | `request`, `ApiError`, `extractErrorMessage` | JWT auto-refresh on 401, single in-flight refresh |
| `tokenStore.ts` | **Done** | get/set/clear/subscribe | `localStorage['nobat.auth']` |
| `auth.ts` | **Done** | 7 methods | register, login, OTP, logout, profile get/update |
| `barbers.ts` | **Done** | 3 methods | list, detail, public services |
| `services.ts` | **Done** | 4 methods | list, create, update, remove |
| `availability.ts` | **Done** | 5 methods | weekly get/save, date list/create/delete |
| `reservations.ts` | **Done** | 4 methods | slots (no auth), create, my-appointments, cancel |
| `index.ts` | **Done** | barrel exports | — |

## Components

| Component | Status | Used By | Notes |
|-----------|--------|---------|-------|
| `CustomerLayout` | **Done** | Customer routes | Header + Outlet + BottomNav |
| `ProtectedRoute` | **Done** | Barber panel | Role-based auth guard |
| `Header` | **Partial** | CustomerLayout | Bell button is decorative |
| `BottomNav` | **Done** | CustomerLayout | Hidden on certain routes |
| `Avatar` | **Done** | Search, detail, home | Initial-based avatar with color |
| `Stars` | **Done** | Search, detail, home | Demo ratings display |
| `BarberListItem` | **Done** | SearchPage | Full-width barber row |
| `ServiceItem` | **Done** | BookingPage | Selectable service row |
| `TimeSelect` | **Done** | Availability editors | 30-min grid dropdown |
| `BarberCard` | **Not started** | — | Exists but **unused** |
| `icons.tsx` | **Done** | Various | ~40 SVG icons; some unused |

## Hooks & Context

| Module | Status | Notes |
|--------|--------|-------|
| `useActiveBarbers` | **Done** | Fetches + decorates barbers; unmount-safe |
| `AuthContext` | **Done** | Session state, role derivation, logout with server blacklist |
| `ToastContext` | **Done** | Transient messages, 3s auto-hide |

## lib/ Helpers

| File | Status | Notes |
|------|--------|-------|
| `dates.ts` | **Done** | Full Jalali engine + Intl labels; weekday 0=Saturday |
| `format.ts` | **Done** | Persian digits, price formatting, time labels |
| `timeGrid.ts` | **Done** | 30-min grid for availability editors |
| `demo.ts` | **Done** | Fake ratings, reviews, salon, address, categories |
| `appointmentsStore.ts` | **Partial** | localStorage demo store; used by barber appointments + HomePage banner |

## Types

| File | Status | Notes |
|------|--------|-------|
| `src/types/api.ts` | **Done** | Mirrors backend serializers; price as string, weekday 0=Saturday |

## Styling & i18n

| Feature | Status | Notes |
|---------|--------|-------|
| Persian/RTL UI | **Done** | All UI text in Persian |
| Jalali date display | **Done** | `dates.ts` helpers throughout |
| Persian digit rendering | **Done** | `toPersianNum`, `formatPrice` |
| Global CSS (no CSS-in-JS) | **Done** | `styles.css` + `dashboard.css` |
| Relative asset paths | **Done** | Vite `base: './'` |

## Infrastructure

| Feature | Status | Notes |
|---------|--------|-------|
| Vite dev proxy | **Done** | `/api`, `/auth`, `/availability`, `/admin`, `/static` → backend |
| Docker production build | **Done** | Multi-stage node → nginx |
| nginx same-origin proxy | **Done** | Proxies API routes to backend container |
| Committed `dist/` build | **Done** | Production build in repo |
| TypeScript strict mode | **Done** | `noUnusedLocals`/`noUnusedParameters` |
| Test runner | **Not started** | No test framework configured |
| ESLint | **Not started** | No lint config; typecheck is the only gate |

## Not Started / Blocked

| Feature | Status | Blocker |
|---------|--------|---------|
| Barber real appointment management | **Not started** | No backend list-appointments-for-barber endpoint |
| Payment UI | **Not started** | No backend payment flow (`is_paid` ignored) |
| Push notifications | **Not started** | — |
| Customer reviews/ratings | **Not started** | All demo data; no backend endpoint |
| Image upload (barber avatar) | **Not started** | `profile_image` commented out in backend |
| Profile notifications/settings | **Not started** | Menu stubs only |
| Automated tests | **Not started** | No test runner |

---

## Agent maintenance rule

> **Every agent that makes changes to this project MUST update this file before finishing.**
> Mark new features as **Done**, in-progress work as **Partial**, and demo/stub features
> accordingly. Also update [`AGENTS.md`](AGENTS.md) if architecture or conventions change.
