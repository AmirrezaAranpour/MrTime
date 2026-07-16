# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.
Read this first — it explains the project so you don't need to be given every file.

## What this project is

The **frontend** for a barber-shop reservation system: a React + TypeScript single-page
app (Vite) that consumes a separate **Django REST API backend**. It's a Persian (Farsi),
right-to-left UI with two audiences in one SPA:

- **Customers** (`/`) browse barbers, pick a service/date/time, and book — authenticating
  with **phone + OTP** at checkout.
- **Barbers** (`/barber-panel`) log in with **phone + password**, and manage their
  services, weekly hours, date overrides, and appointments.

This repo is **frontend-only**. The backend lives in a separate project (the Django
`barber-reservation` repo). When a copy of the backend is checked out alongside, the API
contracts in `src/types/api.ts` are the source of truth for the integration.

## Tech stack

- React 18 + TypeScript 5 (**strict** mode; `noUnusedLocals`/`noUnusedParameters` on)
- Vite 5 (dev server, build, dev API proxy)
- React Router 6 (`BrowserRouter`)
- **No** Redux/Zustand/React Query, **no** axios, **no** UI kit. State is plain React
  Context + module-level stores; data fetching is a hand-rolled typed `fetch` wrapper;
  styling is global CSS.

## How to run things

```bash
npm install
cp .env.example .env        # set VITE_BACKEND_URL if backend isn't on http://localhost:8000
npm run dev                 # Vite dev server on :5173, proxies API to the backend
npm run build               # tsc --noEmit && vite build  → dist/
npm run typecheck           # tsc --noEmit only
npm run preview             # serve the production build
```

There is **no test runner and no ESLint config**. The type-checker is the only automated
gate — always finish a change with `npm run typecheck` (or `npm run build`) clean. Strict
mode means unused vars/params fail the build.

## Directory map

| Path             | What lives here |
|------------------|-----------------|
| `src/api/`       | Typed `fetch` client (`client.ts`) + one module per backend resource (`auth`, `barbers`, `services`, `availability`, `reservations`), the `tokenStore`, and a barrel `index.ts`. |
| `src/types/api.ts` | TypeScript interfaces mirroring backend request/response shapes. The integration contract. |
| `src/context/`   | `AuthContext` (session) and `ToastContext` (transient messages). |
| `src/hooks/`     | Custom hooks, e.g. `useActiveBarbers`. |
| `src/components/`| Reusable UI: layouts (`CustomerLayout`), `ProtectedRoute`, cards, `BottomNav`, `Header`, `icons.tsx`. |
| `src/pages/`     | Route components, split `customer/` and `barber/`. One file per screen. |
| `src/lib/`       | Pure/standalone helpers: `dates.ts` (Jalali), `format.ts` (price + Persian digits), `appointmentsStore.ts` & `demo.ts` (see gotchas). |
| `src/styles/`    | `styles.css` (customer app) and `dashboard.css` (barber panel). Global, class-based. |
| `App.tsx`        | The route table. |
| `main.tsx`       | Bootstrap: `BrowserRouter` → `AuthProvider` → `ToastProvider` → `App`. |

`@/` is an import alias for `src/` (set in `tsconfig.json` **and** `vite.config.ts` — keep
them in sync).

## How the frontend talks to the backend

All HTTP goes through `request<T>()` in [`src/api/client.ts`](src/api/client.ts). Never call
`fetch` directly from a component — add/extend a resource module under `src/api/` instead.

- **Base URL.** `request` prepends `API_BASE = import.meta.env.VITE_API_BASE ?? ''`. In dev
  it's empty, so paths are relative (`/api/...`) and the **Vite proxy** forwards them to
  `VITE_BACKEND_URL` (the backend has no CORS — the proxy is what avoids it). The proxied
  prefixes are defined in `vite.config.ts`: `/api`, `/auth`, `/availability`, `/admin`,
  `/static`. If you introduce a new top-level path prefix, add it to that proxy list.
- **Auth.** JWT (SimpleJWT). `tokenStore` ([`src/api/tokenStore.ts`](src/api/tokenStore.ts))
  persists `{ access, refresh, user }` in `localStorage` (`nobat.auth`) and notifies
  subscribers. A request opts into auth with `{ auth: true }`; the client adds the Bearer
  header, and on `401` refreshes the access token **once** via `/api/token/refresh/` (with
  a single in-flight refresh shared across callers) then retries. If refresh fails it
  clears the session.
- **Errors.** Non-2xx throws an `ApiError` (`status`, `payload`, and a human message).
  `extractErrorMessage` flattens DRF error bodies (`detail`, field arrays, nested objects)
  into one string. Catch `ApiError` when you need the status/field detail; otherwise show
  `err instanceof Error ? err.message : '…'`.
- **Endpoints** (backend prefixes): auth `/auth/…`, barbers `/api/barbers/`, services
  `/api/services/…`, availability `/api/availability/…`, reservations
  `/api/reservations/…`, JWT `/api/token/…`. Backend Swagger: `/api/docs/swagger/`.

### Two-experience auth

`AuthContext` derives `isCustomer` / `isBarber` from `user.role` (`'admin' | 'barber' |
'customer'`). Route guarding is done by [`ProtectedRoute`](src/components/ProtectedRoute.tsx)
(`<ProtectedRoute role="barber" redirectTo="/barber-panel/login" />`). Customer pages are
public; many work logged-out and only require auth at the booking step.

## Conventions to follow (match the existing code)

**Adding/using API calls**
- One method per endpoint on a resource object in `src/api/<resource>.ts`, typed with
  interfaces from `src/types/api.ts`. Export it from `src/api/index.ts`.
- Pass `{ method, body, query, auth }` to `request<T>()`. `body` is auto-`JSON.stringify`d
  with the right `Content-Type`; `query` drops `undefined`/empty values. Set `auth: true`
  for any endpoint requiring a logged-in user.
- Keep `src/types/api.ts` in lockstep with the backend serializers. Note backend quirks
  already captured there (e.g. DecimalField prices arrive as **strings**; date-availability
  responses omit `id`; weekday `0 = Saturday`).

**Components & pages**
- Function components, default-exported from their file. Hooks at the top, helpers
  (small presentational sub-components) below the main component in the same file.
- Data fetching: `useEffect` + `useState`, with an `let active = true` flag and a cleanup
  that flips it to `false` so a late response can't set state after unmount (see
  `BookingPage`, `useActiveBarbers`). Prefer extracting a hook when the fetch is reused.
- Routes are registered in `App.tsx`. Customer screens render inside `CustomerLayout`
  (Header + BottomNav); barber screens inside `ProtectedRoute` → `BarberDashboardLayout`.

**Forms & validation**
- Controlled inputs with `useState`. Phone fields strip non-digits
  (`value.replace(/\D/g, '')`), are `maxLength={11}`, `dir="ltr"`, left-aligned.
- Validate client-side before calling the API, surfacing errors via `useToast()` (toast) or
  an inline `error` state (`.inline-error`). The backend re-validates — show its message on
  failure rather than trusting the client check alone.
- Show a `<span className="spinner" />` and disable the submit button while a request is in
  flight (`busy`/`submitting`/`saving` boolean).

**Styling & i18n**
- No CSS-in-JS or modules — use existing global classes from `styles/`. Inline `style={}`
  only for one-off tweaks, as the current code does.
- UI text is Persian. Render numbers with `toPersianNum`, prices with `formatPrice`, times
  with `timeLabel`/`shortTime`, and dates with the `dates.ts` helpers. Send Gregorian
  `YYYY-MM-DD` and `HH:MM` to the backend.

## Gotchas / non-obvious decisions

- **`VITE_API_BASE` vs `VITE_BACKEND_URL` are different vars.** `VITE_BACKEND_URL` is the
  dev *proxy target* (build-time, Vite config). `VITE_API_BASE` is the runtime path prefix
  the client prepends — empty in dev (proxy handles it), set to the backend's absolute URL
  for a cross-origin production deploy (which then also needs backend CORS).
- **Customer appointments come from the API.** `AppointmentsPage` lists the logged-in
  customer's own bookings via `GET /api/reservations/my-appointments/` (auth required, so a
  logged-out visitor sees none). The card's cancel button is gated on the backend's
  `can_cancel` flag, and cancel hits the real API. `appointmentsStore.ts` (localStorage) is
  now only used by the **barber panel** demo screen, not the customer appointments list.
- **Demo data is fake by design.** `lib/demo.ts` deterministically derives ratings, reviews,
  salon names, addresses, categories, and avatar colors from the barber `id`. Real fields
  (name, services, available slots) come from the API. Don't try to fetch the fake fields.
- **Backend returns English error strings**; some screens map specific ones to Persian (see
  the `CANCEL_ERRORS` map in `AppointmentsPage.tsx`). Add to such maps rather than showing
  raw English to users.
- **Weekday ordering is `0 = Saturday … 6 = Friday`** (matches the backend), not JS's
  Sunday-first. The weekly-availability UI submits all 7 days every save so cleared days are
  deleted server-side.
- Vite build uses **`base: './'`** (relative asset paths) so `dist/` works from any
  sub-path; don't switch it back to absolute `/` without reason (blank-page risk).

## Skills

Project-specific skills live in `.claude/skills/`:
- `add-api-call` — wire a new backend endpoint into the typed API layer and consume it.
- `add-page` — add a new route/page or component following the conventions above.
- `review-frontend` — review branch changes for integration/convention bugs before pushing.
