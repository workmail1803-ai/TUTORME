# TutorTrack

The all-in-one platform for private tutors to manage students, schedules,
homework, attendance, notes and payments — with a dedicated portal for students.

Built as a **mobile-first, installable PWA** so the same codebase serves web,
Android and iOS browsers (add-to-home-screen → standalone app).

---

## ✨ Highlights

- **Tutor portal** — dashboard, student roster, calendar, homework, attendance,
  payments, reports, announcements, settings.
- **Student portal** — next class, schedule, homework, attendance %, teacher
  notes, fee history.
- **Recurring scheduling** — generate weekly classes across selected weekdays.
- **Attendance** — present / absent / rescheduled / cancelled, stored
  permanently and reflected on each session.
- **Payments** — monthly fee tracking, one-click "generate this month's
  invoices", paid/due/overdue status, earnings & outstanding reporting.
- **Reports** — 6-month earnings bar chart + attendance breakdown donut.
- **Light / dark / system** theme, smooth Framer Motion transitions, loading
  skeletons, toast feedback.

> **Status:** Phase 1 (foundation) is complete and **builds clean** (`next build`
> passes — 22 routes). See [Roadmap](#-roadmap) for what's intentionally
> deferred to later phases (push notifications, file attachments, AI assistant,
> native wrapper).

---

## 🧱 Tech stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router, Server Actions, Turbopack)    |
| UI           | **React 19**, **Tailwind CSS 4**, shadcn-style components |
| Animation    | **Framer Motion**                                         |
| Charts       | **Recharts**                                              |
| Auth         | **Clerk**                                                 |
| Database     | **PostgreSQL** (Supabase) + **Prisma 6** ORM              |
| Language     | **TypeScript** (strict)                                   |
| Hosting      | **Vercel** (app) + **Supabase** (database)                |

> Architecture decision: a single full-stack Next.js app (Server Actions as the
> API layer) was chosen over a separate NestJS service for faster delivery and
> simpler ops. The `src/server/actions` directory **is** the backend.

---

## 🚀 Getting started

### 1. Prerequisites

- Node.js 20+ (tested on 24)
- A PostgreSQL database — [Supabase](https://supabase.com) free tier is perfect
- A [Clerk](https://clerk.com) application (free)

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL` / `DIRECT_URL` — from Supabase → Project Settings → Database
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — from Clerk → API Keys
- `CLERK_WEBHOOK_SIGNING_SECRET` — from Clerk → Webhooks (see
  [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md))

### 4. Set up the database

```bash
npm run db:push      # create tables from the Prisma schema
npm run db:seed      # (optional) load demo tutor + students + classes
```

### 5. Run

```bash
npm run dev
```

Open <http://localhost:3000>. Sign up → you'll be provisioned as a **tutor** and
land on the dashboard. To experience the **student** portal, open the app in a
second browser/incognito, sign up, choose "I'm a student" and enter the tutor's
invite code (shown in the tutor's sidebar / Settings).

---

## 📜 Scripts

| Script              | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Start the dev server (Turbopack)             |
| `npm run build`     | `prisma generate` + production build         |
| `npm run start`     | Run the production build                     |
| `npm run typecheck` | `tsc --noEmit`                               |
| `npm run db:push`   | Push the schema to the database              |
| `npm run db:migrate`| Create a versioned migration                 |
| `npm run db:seed`   | Seed demo data                               |
| `npm run db:studio` | Open Prisma Studio                           |

---

## 📚 Documentation

- [Product Requirements (PRD)](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md) — system design, folder structure, auth
  flow, API/Server-Action contract
- [ER Diagram](docs/ER-DIAGRAM.md) — Mermaid entity-relationship model
- [Deployment Guide](docs/DEPLOYMENT.md) — Vercel + Supabase + Clerk
- [Testing Strategy](docs/TESTING.md)

---

## 🗺 Roadmap

Phase 1 (this repo) is the working foundation. Deliberately deferred:

- **Push notifications** (Firebase Cloud Messaging) — the `Notification` table
  and in-app fan-out already exist; FCM wiring + service worker push is next.
- **File attachments** (Supabase Storage) — `Homework.attachments` is modeled;
  upload UI/signed URLs pending.
- **AI assistant** — natural-language queries ("show unpaid students", "generate
  weekly report"). Schema + query helpers are ready to back it.
- **Drag-and-drop calendar** & month grid — current calendar is an agenda view.
- **Native app** — the PWA covers mobile today; a React Native/Expo wrapper can
  reuse the same Server-Action API in a shared monorepo later.
- **Automated tests** — see [docs/TESTING.md](docs/TESTING.md) for the plan.

---

## 📄 License

Provided as a starter/reference implementation. Use freely.
