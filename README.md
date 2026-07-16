# — Barber Reservation Frontend

A React + TypeScript single-page app for an online barber-shop reservation system.
It is the customer-facing and barber-facing UI for the
[barber-reservation Django REST backend](https://gitlab.com/erfan.sajjadi.others/barber-reservation).

The interface is in **Persian (Farsi)** and renders **right-to-left** (`<html lang="fa" dir="rtl">`).

## What it does

The app has two distinct experiences served from one SPA:

- **Customer app** (`/`) — browse active barbers, view a barber's services, pick a
  service / date / time, and book a reservation. First-time customers authenticate with a
  **phone number + OTP** during checkout. Customers can view and cancel their upcoming
  appointments.
- **Barber panel** (`/barber-panel`) — barbers log in with **phone number + password**
  (or self-register), then manage their service catalog, weekly working hours, date-level
  availability overrides, and view their appointments.

## Tech stack

- [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) (strict mode)
- [Vite 5](https://vitejs.dev/) — dev server, build, and dev API proxy
- [React Router 6](https://reactrouter.com/) — client-side routing
- No UI/state libraries — plain React Context, hand-rolled CSS, and a small typed `fetch` wrapper

## Getting started

Requirements: **Node 18+** and the Django backend running locally (see below).

```bash
npm install
cp .env.example .env          # then edit VITE_BACKEND_URL if your backend isn't on :8000
npm run dev                   # starts Vite on http://localhost:5173
```

Open <http://localhost:5173>. The customer app is at `/`; the barber panel login is at
`/barber-panel/login`.

### Scripts

| Command             | What it does                                              |
|---------------------|-----------------------------------------------------------|
| `npm run dev`       | Start the Vite dev server (port 5173) with the API proxy. |
| `npm run build`     | Type-check (`tsc --noEmit`) and build to `dist/`.         |
| `npm run preview`   | Serve the production build locally.                       |
| `npm run typecheck` | Type-check only, no build.                                |

There is no test runner or linter wired up; `tsc` strict mode is the safety net, so keep
the build clean (`npm run typecheck`).

## Environment variables

Vite only exposes variables prefixed with `VITE_`. They are read from `.env` (git-ignored).

| Variable           | Used by              | Default                 | Purpose                                                                 |
|--------------------|----------------------|-------------------------|-------------------------------------------------------------------------|
| `VITE_BACKEND_URL` | `vite.config.ts`     | `http://localhost:8000` | Target the **dev proxy** forwards API calls to. Dev only.               |
| `VITE_API_BASE`    | `src/api/client.ts`  | `''` (empty)            | Prefix prepended to every API path at **runtime**. Leave empty in dev.  |

These two are deliberately separate — see [Connecting to the backend](#connecting-to-the-backend).

## Connecting to the backend

The frontend talks to the Django REST API over `fetch`. All requests go through the typed
client in [`src/api/client.ts`](src/api/client.ts), and each resource has a small module in
[`src/api/`](src/api) (`auth`, `barbers`, `services`, `availability`, `reservations`).

**The backend has no CORS configured**, so in development we don't call it cross-origin.
Instead the Vite dev server **proxies** these path prefixes to `VITE_BACKEND_URL`:

```
/api  /auth  /availability  /admin  /static
```

Because of the proxy, `VITE_API_BASE` is empty in dev and the client requests *relative*
paths (e.g. `/api/barbers/`) that Vite forwards to the backend — same-origin, no CORS.

For a **production** deployment where the static build is served from a different origin
than the API, set `VITE_API_BASE` to the backend's absolute URL (e.g.
`https://api.example.com`) so the client targets it directly. You must also enable CORS on
the backend in that scenario.

### Auth model

- **JWT** (SimpleJWT) — login/verify endpoints return `{ access, refresh, user }`.
- Tokens and the user are persisted in `localStorage` under `nobat.auth` by
  [`src/api/tokenStore.ts`](src/api/tokenStore.ts).
- The client attaches `Authorization: Bearer <access>` only when a request opts in with
  `auth: true`. On a `401`, it transparently refreshes the access token once via
  `/api/token/refresh/` and retries; if that fails, it clears the session.
- **Customers** authenticate by phone + OTP (`/auth/customer/request-otp/`,
  `/auth/customer/verify-otp/`). **Barbers** authenticate by phone + password
  (`/auth/barber/login/`, `/auth/barber/register/`).

> In dev mode the backend returns the OTP `code` in the request-OTP response, and the UI
> shows it as a hint so you can test without SMS.

### API base paths

| Area         | Prefix                  |
|--------------|-------------------------|
| Auth         | `/auth/…`               |
| Barbers      | `/api/barbers/`         |
| Services     | `/api/services/…`       |
| Availability | `/api/availability/…`   |
| Reservations | `/api/reservations/…`   |
| JWT tokens   | `/api/token/…`          |

Backend API docs (when the backend is running): Swagger at `/api/docs/swagger/`, ReDoc at
`/api/docs/redoc/`.

## Project structure

```
src/
├── api/          Typed fetch client + one module per backend resource
├── components/   Reusable UI (layouts, cards, nav, icons)
├── context/      React Context providers (auth, toast)
├── hooks/        Custom hooks (e.g. useActiveBarbers)
├── lib/          Pure helpers: Jalali dates, price/number formatting, local stores, demo data
├── pages/        Route components, split into customer/ and barber/
├── styles/       Global CSS (styles.css for customer app, dashboard.css for barber panel)
├── types/        api.ts — TypeScript mirrors of the backend contracts
├── App.tsx       Route table
└── main.tsx      App bootstrap + providers
```

The `@/` import alias maps to `src/` (configured in both `tsconfig.json` and `vite.config.ts`).

## Notes & gotchas

- **Persian/RTL throughout.** UI strings are Persian; numbers are converted to Persian
  digits with `toPersianNum` ([`src/lib/format.ts`](src/lib/format.ts)). Dates are shown on
  the Jalali calendar via `Intl` ([`src/lib/dates.ts`](src/lib/dates.ts)) but sent to the
  backend as Gregorian `YYYY-MM-DD`.
- **No "my appointments" endpoint.** The backend doesn't expose a list of a customer's
  appointments, so bookings are cached in `localStorage` by
  [`src/lib/appointmentsStore.ts`](src/lib/appointmentsStore.ts) to power that screen.
  Cancellation still calls the real API.
- **Demo decoration.** Ratings, reviews, salon names, and addresses don't exist in the
  backend — they are deterministically derived from the barber id in
  [`src/lib/demo.ts`](src/lib/demo.ts) so the UI looks complete. Real data (names, services,
  slots) always comes from the API.
- The Vite build uses a **relative base** (`base: './'`) so the `dist/` output works served
  from any path or sub-directory.

For deeper architecture and conventions, see [CLAUDE.md](CLAUDE.md).
