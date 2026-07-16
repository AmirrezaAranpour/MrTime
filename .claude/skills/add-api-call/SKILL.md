---
name: add-api-call
description: Wire a new backend endpoint into this React frontend's typed API layer following its exact conventions — a TypeScript type mirroring the contract, a method on the right resource module that calls request<T>(), the barrel export, and consuming it in a component with the project's fetch/loading/error pattern. Use when integrating any new or changed backend endpoint (auth, barbers, services, availability, reservations).
---

# Add an API call (frontend ↔ backend integration)

Use this when the backend gains/changes an endpoint and the UI needs to call it. This repo
never calls `fetch` from components — everything goes through one typed client. Copy the
existing modules in `src/api/`; don't invent new patterns.

## Checklist (do all of these)

1. **Type** the request/response in `src/types/api.ts` — mirror the backend serializer.
2. **Method** on the resource object in `src/api/<resource>.ts` calling `request<T>()`.
3. **Export** it from `src/api/index.ts` if a new module/type was added.
4. **Consume** it in the component/hook with the standard loading + error pattern.
5. **Proxy** — if the endpoint uses a new top-level path prefix, add it to `vite.config.ts`.
6. **Verify**: `npm run typecheck` is clean.

## Conventions (match these exactly)

### Types — mirror the backend contract
- Add an interface to `src/types/api.ts`. Name it after the resource/response
  (`AvailableSlotsResponse`, `CustomerAppointment`). Comment the endpoint it maps to.
- Respect backend quirks already documented there: **DecimalField prices are strings**,
  the date-availability serializer **omits `id`**, weekday is **`0 = Saturday … 6 = Friday`**,
  times are `"HH:MM"` or `"HH:MM:SS"`, datetimes are ISO strings.
- Don't model the fake demo fields (ratings/reviews/salon) — those are derived locally in
  `lib/demo.ts`, not returned by the API.

### Resource module — one method per endpoint
- Put the method on the resource object in `src/api/<resource>.ts` (e.g. `reservationsApi`,
  `servicesApi`). Return `request<TheResponseType>(path, options)`.
- `request<T>(path, options)` options:
  - `method`: defaults to `GET`.
  - `body`: any value — auto-`JSON.stringify`d with `Content-Type: application/json`.
  - `query`: `Record<string, string | number | undefined>` — `undefined`/`''` keys dropped.
  - `auth: true`: attach the Bearer token and auto-refresh-on-401. **Set this for any
    endpoint that needs a logged-in user.** Public reads omit it.
- Use the correct prefix: auth `/auth/…`, barbers `/api/barbers/`, services
  `/api/services/…`, availability `/api/availability/…`, reservations `/api/reservations/…`.
- Re-export new modules/types from `src/api/index.ts` (the barrel everything imports from).

Example shape (from `src/api/reservations.ts`):
```ts
export const reservationsApi = {
  availableSlots(params: { barber_id: number; service_id: number; date: string }) {
    return request<AvailableSlotsResponse>('/api/reservations/available-slots/', { query: params });
  },
  createAppointment(data: { service_id: number; date: string; start_time: string }) {
    return request<Appointment>('/api/reservations/appointments/', { method: 'POST', body: data, auth: true });
  },
};
```

### Consuming it — the fetch/loading/error pattern
- Fetch in `useEffect` with an `active` guard so a late response can't set state after
  unmount:
  ```ts
  useEffect(() => {
    let active = true;
    servicesApi.list()
      .then((list) => active && setServices(list))
      .catch(() => active && setServices([]))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [deps]);
  ```
- If the call is reused across screens, extract a hook (see `hooks/useActiveBarbers.ts`)
  returning `{ data, loading, error }`.
- **Errors**: the client throws `ApiError` (with `status`, `payload`, message). For
  user-facing failures show `err instanceof Error ? err.message : 'خطایی رخ داد'` via
  `useToast()` or an inline `.inline-error`. Import `ApiError` when you must branch on
  `status` or map specific backend strings to Persian (see `CANCEL_ERRORS` in
  `AppointmentsPage.tsx`).
- Never read tokens or build headers in a component — that's the client's job.

### Auth-gated flows
- After a login/verify call, persist the session with `useAuth().setAuth({ access, refresh, user })`
  — do **not** write `localStorage` directly. `logout()` clears it.
- Customer auth = phone + OTP (`authApi.customerRequestOtp` → `customerVerifyOtp`); barber
  auth = phone + password (`authApi.barberLogin` / `barberRegister`).

## Reference implementations to copy from
- Query-param GET: `reservationsApi.availableSlots` in `src/api/reservations.ts`.
- Auth'd POST returning a created object: `reservationsApi.createAppointment`.
- Full CRUD resource: `servicesApi` in `src/api/services.ts` (list/create/update/remove).
- Bulk PATCH payload: `availabilityApi.saveWeekly` + `WeeklyBulkPayload` type.
- Token refresh / 401 handling: `request` + `refreshAccessToken` in `src/api/client.ts`
  (don't reimplement — just pass `auth: true`).

## Before finishing
Run `npm run typecheck`. Confirm the new type matches the backend serializer (check
`/api/docs/swagger/` if unsure), and that any new path prefix is in the `vite.config.ts`
proxy list. Report the endpoint added and where it's consumed.
