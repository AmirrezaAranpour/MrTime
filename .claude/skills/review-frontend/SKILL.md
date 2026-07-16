---
name: review-frontend
description: Review the current branch's changes before pushing to main. Diffs against main and flags logic bugs and code that doesn't match this frontend's established patterns (typed API layer, auth/token handling, fetch/effect cleanup, Persian/RTL formatting, routing/guards, strict-mode/typecheck). Use when the user says "review before I push", "review my changes", "check this branch", or is about to open an MR / merge to main.
---

# Review this frontend branch before pushing

Goal: catch logic mistakes and pattern inconsistencies **before** code reaches `main`. Be a
strict but concrete reviewer — every finding points at a `file:line` and says what to
change. Don't nitpick style; there is no linter, so focus on correctness and conventions.

## Step 1 — Get the diff

```bash
git fetch origin main --quiet 2>/dev/null
git diff main...HEAD --stat        # what changed
git diff main...HEAD               # the actual changes
```
Fall back to `origin/main...HEAD`, then `git log main..HEAD`, if `main` isn't local. Read
the full file when a change's correctness depends on surrounding code.

## Step 2 — Review for LOGIC bugs

- **`fetch` in effects without an `active` guard + cleanup** — late responses setting state
  after unmount. Every `useEffect` data fetch must use the `let active = true; … return () =>
  { active = false; }` pattern (see `BookingPage`, `useActiveBarbers`).
- **Stale closures / missing deps** — `useEffect`/`useCallback`/`useMemo` dep arrays. Flag a
  fetch keyed off a param not in its deps.
- **Auth/token handling** — session must go through `tokenStore`/`useAuth().setAuth`, never
  direct `localStorage` writes. Don't reimplement Bearer/refresh logic in a component — that
  belongs to `request` in `src/api/client.ts` (just pass `auth: true`).
- **Error handling** — promise chains should `.catch`; user-facing failures show
  `err.message` (or a mapped Persian string), not a raw thrown object or silent swallow.
- **Number/date correctness** — sending Persian-digit strings or Jalali labels to the API
  (must send ASCII digits, Gregorian `YYYY-MM-DD`, `HH:MM`). Weekday must be `0 = Saturday`.
  Date math should use `toIsoDate`/`parseIso` from `lib/dates.ts`, not `toISOString()` (UTC
  off-by-one).
- General: unhandled `null`/`undefined`, off-by-one, wrong route param parsing
  (`Number(param)` → `NaN`), booking/cancel state not synced to `appointmentsStore`.

## Step 3 — Review for PATTERN consistency

Read the canonical conventions first, then judge the diff against them:

1. **`CLAUDE.md`** (repo root) — architecture, integration model, and gotchas.
2. **`.claude/skills/add-api-call/SKILL.md`** — how API calls must be built (typed module +
   `request<T>()`, `src/types/api.ts`, barrel export, `auth: true`, proxy prefix).
3. **`.claude/skills/add-page/SKILL.md`** — page/component/form/routing conventions.
4. **The real reference code** — `src/api/`, `pages/customer/BookingPage.tsx`,
   `pages/barber/BarberLoginPage.tsx`. "Consistent with our style" means it matches these.

Flag anything that diverges: a component calling `fetch` directly instead of an `src/api`
module; a missing type in `src/types/api.ts` (or one that ignores backend quirks — string
prices, missing `id`, weekday order); a new endpoint prefix not added to the `vite.config.ts`
proxy; auth checked inline instead of via `ProtectedRoute`/`useAuth`; a route added under the
wrong layout/guard; hard-coded Persian numbers/dates instead of `lib/format` & `lib/dates`
helpers; CSS-in-JS or a new styling lib instead of the global classes; `localStorage`
accessed outside the `tokenStore`/`lib` stores.

If `CLAUDE.md` or the skills disagree with this file, **they win** — mention the drift.

## Step 4 — Verify it builds

```bash
npm run typecheck       # tsc --noEmit — the only automated gate
npm run build           # optional: full type-check + production build
```
There are no tests, so the type-checker passing is the bar. Strict mode flags unused
locals/params — those must be clean.

## Step 5 — Report

Concise report, grouped by severity:

- **🔴 Blocker** — logic bug, auth/token misuse, failing `typecheck`, data sent in the wrong
  format to the API.
- **🟡 Should fix** — pattern inconsistency (direct `fetch`, missing effect cleanup, untyped
  response, formatting helper bypassed, route under wrong guard).
- **🟢 Nice to have** — minor, non-blocking.

Each finding: `path:line` → what's wrong → the concrete fix. End with a one-line verdict:
**READY TO PUSH** or **NOT READY** (and the blocker count). Do not push or commit — only
report. Offer to fix the 🔴/🟡 items if the user wants.
