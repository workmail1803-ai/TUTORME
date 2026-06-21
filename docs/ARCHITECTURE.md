# Architecture

## 1. System overview

TutorTrack is a **single full-stack Next.js 16 application**. There is no
separate API service: **React Server Components** read data directly through
Prisma, and **Server Actions** (`"use server"`) are the write/RPC layer. This
keeps one type-safe codebase, one deploy, and end-to-end TypeScript from DB to UI.

```
┌────────────────────────────────────────────────────────────┐
│                        Browser / PWA                        │
│   Server Components (HTML)  +  Client Components (islands)   │
└───────────────┬───────────────────────────┬────────────────┘
                │ RSC payload                │ Server Action calls
                ▼                            ▼
┌────────────────────────────────────────────────────────────┐
│                 Next.js 16 (Vercel, Node runtime)           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │ Server        │  │ Server Actions│  │ Route Handlers   │  │
│  │ Components    │  │ src/server/   │  │ /api/webhooks/*  │  │
│  │ (read)        │  │ actions (write)│ │ (Clerk sync)     │  │
│  └──────┬───────┘  └───────┬───────┘  └────────┬─────────┘  │
│         └──────────────────┴───────────────────┘            │
│                      Prisma Client                          │
└──────────────────────────────┬─────────────────────────────┘
                               │ SQL
                               ▼
                    PostgreSQL (Supabase)
                               ▲
            Clerk  ─────────── webhook ──► /api/webhooks/clerk
        (auth, sessions, user identity)
```

## 2. Request lifecycle

1. `src/middleware.ts` runs `clerkMiddleware` on every non-public route and
   calls `auth.protect()` (unauthenticated → redirect to `/sign-in`).
2. A Server Component (e.g. `dashboard/page.tsx`) calls `requireTutor()`.
3. `requireTutor()` → `getDbUser()` resolves the Clerk session to a `User` row
   (lazy-upserting on first sight; React `cache()` dedupes within a request),
   auto-provisions a `Tutor` for tutor-role users, else redirects to onboarding.
4. The component runs parallel Prisma queries and renders.
5. Mutations call a Server Action, which **re-derives the tutor from the session**
   and verifies ownership before writing, then `revalidatePath()` refreshes the
   affected routes.

## 3. Folder structure

```
tutortrack/
├─ prisma/
│  ├─ schema.prisma            # 12 models + enums (source of truth)
│  └─ seed.ts                  # demo data
├─ public/                     # icon.svg, manifest.webmanifest
├─ src/
│  ├─ middleware.ts            # Clerk route protection
│  ├─ app/
│  │  ├─ layout.tsx            # ClerkProvider + ThemeProvider + Toaster
│  │  ├─ globals.css           # Tailwind 4 tokens, light/dark, utilities
│  │  ├─ page.tsx              # marketing landing (static)
│  │  ├─ (auth)/               # sign-in, sign-up (Clerk catch-all routes)
│  │  ├─ onboarding/           # role selection / join a tutor
│  │  ├─ (app)/                # TUTOR portal (route group, shared shell)
│  │  │  ├─ layout.tsx         # requireTutor → AppShell(variant="tutor")
│  │  │  ├─ dashboard/ students/ calendar/ homework/
│  │  │  ├─ attendance/ payments/ reports/ announcements/ settings/
│  │  ├─ portal/               # STUDENT portal (/portal/*)
│  │  │  ├─ layout.tsx         # requireStudent → AppShell(variant="student")
│  │  │  ├─ page.tsx schedule/ homework/ attendance/ notes/ payments/
│  │  └─ api/webhooks/clerk/   # Svix-verified user sync
│  ├─ components/
│  │  ├─ ui/                   # shadcn-style primitives (Radix-free)
│  │  ├─ app-shell/            # responsive sidebar + bottom-nav + drawer
│  │  ├─ students/ schedules/ homework/ attendance/ payments/
│  │  ├─ announcements/ reports/ settings/ onboarding/
│  │  └─ page-header, stat-card, empty-state, attendance-badge, theme-*
│  ├─ lib/
│  │  ├─ prisma.ts             # singleton client
│  │  ├─ auth.ts               # getDbUser / requireUser/Tutor/Student
│  │  ├─ utils.ts              # cn, formatCurrency, codes, pct…
│  │  ├─ constants.ts          # nav config, app metadata
│  │  └─ validations/          # zod schemas (student, schedule)
│  └─ server/
│     ├─ actions/              # students, schedules, homework, payments,
│     │                        #   announcements, tutor, onboarding
│     └─ queries/              # read aggregations (dashboard)
└─ docs/                       # PRD, ER, architecture, deployment, testing
```

## 4. Authentication & authorization flow

- **Identity**: Clerk owns sign-up/in, sessions, and the user record. A
  `CLERK_WEBHOOK_SIGNING_SECRET`-verified webhook (`/api/webhooks/clerk`) keeps
  the local `User` table in sync (`user.created/updated/deleted`).
- **Resilience**: even without webhooks (local dev), `getDbUser()` lazily
  upserts the `User` from the live Clerk session, so the app works immediately.
- **Authorization model**: multi-tenant by tutor. There is **no trust of
  client-supplied owner IDs**. Every Server Action:
  1. calls `requireTutor()` (or `requireStudent()`),
  2. confirms the target row belongs to that tutor (`assertOwned` / scoped
     `findFirst`), and only then mutates.
- **Roles**: stored on `User.role` (`TUTOR | STUDENT | PARENT`). Route groups
  enforce role: `(app)/*` requires a tutor, `portal/*` requires a student.

## 5. API / Server-Action contract

All mutations return a discriminated union:

```ts
type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };
```

| Action                          | File                         | Purpose |
| ------------------------------- | ---------------------------- | ------- |
| `createStudent / updateStudent / setStudentStatus / deleteStudent` | `actions/students.ts` | Student CRUD + archive |
| `createSchedule / deleteSchedule / markAttendance` | `actions/schedules.ts` | Recurring scheduling + attendance |
| `createHomework / setHomeworkStatus / deleteHomework` | `actions/homework.ts` | Homework lifecycle |
| `recordPayment / setPaymentStatus / generateMonthlyInvoices / deletePayment` | `actions/payments.ts` | Payment tracking |
| `createAnnouncement / deleteAnnouncement` | `actions/announcements.ts` | Broadcasts + notification fan-out |
| `updateTutorProfile`            | `actions/tutor.ts`           | Profile |
| `becomeTutor / joinAsStudent`   | `actions/onboarding.ts`      | Role selection / linking |

Reads live in Server Components and `src/server/queries`. Validation is
centralized with **zod**; action params use the schema's `input` type and the
parsed `output` type is used for writes.

A REST/GraphQL surface (for a future native app) can wrap these same functions
in Route Handlers without changing business logic.

## 6. Frontend architecture

- **Server-first**: pages are Server Components; only interactive leaves
  (`"use client"`) are client islands (forms, modals, theme toggle, charts).
- **Design system**: Tailwind 4 CSS-variable tokens (`globals.css`) with an
  `oklch` palette, mapped via `@theme inline` so `bg-card`, `text-muted-foreground`,
  etc. resolve in both themes. Components in `components/ui` are shadcn-style but
  **Radix-free** (a tiny `asChild`, a Framer-Motion `Modal`, a native `Select`)
  to keep the dependency surface small.
- **Responsiveness**: `AppShell` renders a desktop sidebar, a mobile top bar +
  slide-over drawer, and a mobile bottom tab bar from a single nav config.
- **PWA**: `manifest.webmanifest` + maskable icon + theme-color make it
  installable and standalone on Android/iOS.

## 7. Data integrity notes

- `Payment` has a unique `(studentId, periodYear, periodMonth)` → idempotent
  invoice generation via `upsert`/`createMany` + pre-filter.
- `Attendance` is 1:1 with `Schedule` (`upsert` on `scheduleId`).
- Recurring schedules cap at 120 generated occurrences for safety.
- Cascade/SetNull delete rules are declared in the schema (see ER diagram).
