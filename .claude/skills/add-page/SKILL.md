---
name: add-page
description: Add a new route/page or reusable component to this React + TypeScript frontend following its exact conventions — file placement, routing in App.tsx, layouts and route guards, the useEffect data-fetch pattern, controlled forms with toast/inline errors, and Persian/RTL formatting. Use when adding a customer or barber screen, a shared component, or wiring a new route.
---

# Add a page or component

Use this when adding a screen, route, or reusable component. Match the existing files —
this codebase has no UI kit, no CSS-in-JS, and a consistent hand-rolled style.

## Checklist (do all of these)

1. **File** in the right place: `src/pages/customer/`, `src/pages/barber/`, or
   `src/components/`. One default-exported function component per file.
2. **Route** registered in `src/App.tsx` under the correct layout/guard (for pages).
3. **Data** fetched with the `active`-guarded `useEffect` pattern (or a `src/api` call).
4. **Forms** controlled, validated, with spinner + disabled submit and toast/inline errors.
5. **i18n** — Persian UI text, Persian-digit numbers, Jalali dates; Gregorian to the API.
6. **Verify**: `npm run typecheck` is clean (strict mode flags unused vars/params).

## Conventions (match these exactly)

### File & component shape
- Function component, `export default`, named to match the file. Hooks first, then the
  JSX return, then small presentational sub-components **below** the main one in the same
  file (see `ProgressStep`/`ConfirmRow` in `pages/customer/BookingPage.tsx`).
- Import from the `@/` alias (`@/api`, `@/context/AuthContext`, `@/lib/format`), not deep
  relative paths.
- Icons come from `src/components/icons.tsx` — reuse, don't inline new SVGs in pages.

### Routing (pages)
- Add a `<Route>` in `src/App.tsx`. Decide the bucket:
  - **Customer screen** → inside the `<Route element={<CustomerLayout />}>` group (gets
    Header + BottomNav, scroll-to-top on navigation). Usually public.
  - **Barber screen** → inside `<ProtectedRoute role="barber" …>` → `BarberDashboardLayout`.
- Guard auth with `ProtectedRoute` (`role` + `redirectTo`), never by checking the role
  inline in the page. Read auth state from `useAuth()` (`isAuthenticated`, `isCustomer`,
  `isBarber`, `user`).
- Navigate with `useNavigate()` / `<Link>`; read params with `useParams` / `useSearchParams`.

### Data fetching
- `useEffect` + `useState` with an `active` flag and cleanup (so late responses don't set
  state after unmount):
  ```ts
  useEffect(() => {
    let active = true;
    barbersApi.publicServices(barberId)
      .then((list) => active && setServices(list))
      .catch(() => active && setServices([]));
    return () => { active = false; };
  }, [barberId]);
  ```
- Reused fetches become a hook in `src/hooks/` returning `{ data, loading, error }`
  (`useActiveBarbers`). All HTTP goes through `src/api/` modules — see the `add-api-call`
  skill; never `fetch` directly.

### Forms & validation
- Controlled inputs (`value` + `onChange` → `useState`). Phone inputs:
  `onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}`, `maxLength={11}`,
  `dir="ltr"`, left-aligned.
- Validate before the API call; show errors with `useToast()` (transient) or an inline
  `error` state rendered as `.inline-error`. The backend re-validates — surface its message
  on failure (map known English strings to Persian where a screen already does, e.g.
  `CANCEL_ERRORS` in `AppointmentsPage.tsx`).
- During a request: keep a `busy`/`submitting`/`saving` boolean, disable the button, and
  render `<span className="spinner" />` (use `spinner dark` on light backgrounds).

### Styling & i18n
- Use existing global classes from `src/styles/styles.css` (customer) and `dashboard.css`
  (barber). Inline `style={}` only for one-off tweaks, as the current code does. Don't add
  CSS modules or a styling library.
- All user-facing text is **Persian**. Format with the `lib` helpers:
  - `toPersianNum(n)` — Persian digits.
  - `formatPrice(price)` — "۱۲٬۰۰۰ تومان" (prices arrive as strings from the backend).
  - `timeLabel` / `shortTime` — `"HH:MM"` display.
  - `dates.ts` — `generateDates`, `fullDateLabel`, `toIsoDate` (Jalali labels, Gregorian
    ISO to the API). Remember weekday `0 = Saturday`.

### State & context
- Session lives in `AuthContext`; transient messages in `ToastContext`. Get them via
  `useAuth()` / `useToast()`. No global store library — component state + these contexts +
  the module-level stores in `src/lib` (e.g. `appointmentsStore`) are the whole model.

## Reference implementations to copy from
- Multi-step flow with fetch + auth + form: `pages/customer/BookingPage.tsx`.
- Auth form (login/register toggle, inline error, spinner): `pages/barber/BarberLoginPage.tsx`.
- List + API action (cancel) + local store sync: `pages/customer/AppointmentsPage.tsx`.
- Bulk-edit form posting a payload: `pages/barber/WeeklyAvailabilityPage.tsx`.
- Layout + guard: `components/CustomerLayout.tsx`, `components/ProtectedRoute.tsx`.

## Before finishing
Run `npm run typecheck`. Confirm the route renders under the right layout/guard and that
no Persian text, number, or date bypasses the formatting helpers. Report the page/route
added.
