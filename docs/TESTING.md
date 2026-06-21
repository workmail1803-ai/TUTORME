# Testing Strategy

A pragmatic test pyramid for a Next.js + Prisma + Server-Actions app.

## 1. Static guarantees (already in place)

- **TypeScript strict** + `npm run typecheck` — catches the majority of contract
  errors at build time.
- **`next build`** type-checks every route and Server Action end to end.
- **zod** schemas validate all mutation inputs at runtime.

## 2. Unit tests — pure logic (recommended: Vitest)

Fast, no DB. Target the deterministic helpers and validators:

- `lib/utils.ts` — `formatCurrency`, `pct`, `getInitials`, `generateCode`,
  `periodLabel`.
- `lib/validations/*` — valid/invalid payloads, coercion (`monthlyFee` string →
  number), empty-string → undefined behavior.
- Recurrence expansion in `actions/schedules.ts` — factor the date-generation
  loop into a pure function and assert occurrence counts/dates for given weekday
  sets and `untilDate`.

```bash
npm i -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

## 3. Integration tests — Server Actions against a real DB

Spin up a disposable Postgres (Docker or Supabase branch / Testcontainers), run
`prisma migrate deploy`, then call actions directly:

- **Ownership/authorization**: a tutor cannot mutate another tutor's student
  (mock `requireTutor` to return tutor A, attempt to edit tutor B's row → expect
  "not found").
- **Idempotency**: `generateMonthlyInvoices` twice for the same month creates
  invoices only once; `markAttendance` upserts (no duplicate rows).
- **Cascade rules**: deleting a student removes its schedules/payments/etc.
- **Payment uniqueness**: `(studentId, year, month)` constraint enforced.

Mock the Clerk boundary (`@clerk/nextjs/server`) so `auth()`/`currentUser()`
return fixtures.

## 4. Component tests

React Testing Library for client islands:

- `StudentForm` — renders field errors from `fieldErrors`, disables submit while
  pending, calls `onDone` on success.
- `AttendanceRow` — optimistic update then revert on failure.
- `Modal` — closes on Escape and backdrop click; locks body scroll.

## 5. End-to-end (Playwright)

Critical user journeys against a seeded environment:

1. Sign up → onboarded as tutor → dashboard.
2. Add student → schedule recurring class → appears on calendar.
3. Mark attendance → reflected on dashboard + student portal.
4. Assign homework → student sees it as pending; complete → moves to done.
5. Record payment / generate invoices → earnings + outstanding update.
6. Student joins via invite code → sees their schedule/homework/attendance.

```bash
npm i -D @playwright/test && npx playwright install
```

Use a dedicated test Clerk instance (or Clerk's testing tokens) and a throwaway
database; reset state between specs with a transaction or `prisma migrate reset`.

## 6. CI pipeline (suggested)

```
install → typecheck → unit (vitest) → build → integration (ephemeral PG) → e2e (Playwright)
```

Gate merges on typecheck + unit + build (fast); run integration/e2e on PRs to
main. Track coverage on `lib/` and `server/actions/` where the business logic
lives.
