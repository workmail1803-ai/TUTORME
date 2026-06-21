# TutorTrack — Product Requirements Document

## 1. Vision

A complete tutor–student management platform that lets independent private
tutors run their whole business — students, schedules, homework, attendance,
notes, and payments — from one premium, simple, mobile-first app. Students (and
optionally parents) get a clean portal to stay on top of classes and dues.

## 2. Target users & roles

| Role        | Primary jobs-to-be-done                                                      |
| ----------- | ---------------------------------------------------------------------------- |
| **Tutor**   | Add students, schedule recurring classes, mark attendance, assign & track homework, record payments, broadcast announcements, review analytics. |
| **Student** | See next class & weekly schedule, track homework (pending/overdue/done), check attendance %, read teacher notes, view fee history. |
| **Parent** _(phase 2)_ | Monitor a child's progress, homework, attendance and payments. (Schema supports it; UI is deferred.) |

## 3. Goals & non-goals

**Goals (Phase 1 — delivered)**

- Authenticated, multi-tenant tutor accounts (each tutor's data is isolated).
- Full student lifecycle: add / edit / archive / delete.
- Recurring scheduling and an agenda calendar.
- Permanent attendance history.
- Homework assignment + status tracking.
- Monthly payment tracking with earnings/outstanding reporting and invoice
  generation.
- Tutor analytics (earnings trend, attendance breakdown).
- Student portal (read-oriented).
- Light/dark theme, responsive, installable PWA.

**Non-goals (Phase 1)**

- Native iOS/Android binaries (covered by PWA; native wrapper is a later phase).
- Real-time push notifications (modeled, not wired to FCM yet).
- File uploads for attachments.
- AI assistant (planned; data layer is ready).
- Online payment collection (we _track_ payments; we don't process them).

## 4. Functional requirements

### 4.1 Authentication & onboarding
- Email/social sign-up via Clerk.
- First-time users choose a role. Tutors are auto-provisioned a profile +
  invite code. Students join by entering a tutor's invite code (and optionally a
  per-student claim code to adopt a pre-created profile).

### 4.2 Tutor dashboard
Shows: today's classes, upcoming (7-day) classes, homework due, missed-this-month,
active student count, monthly earnings, pending payments, attendance rate.

### 4.3 Students
CRUD + archive. Profile fields: name, phone, parent phone, class/grade, school,
subject, monthly fee, address, notes. Detail view aggregates upcoming classes,
recent homework, payments, notes, attendance %, total paid, and the claim code.

### 4.4 Scheduling
Create one-off or weekly-recurring classes (pick weekdays + "repeat until").
Fields: student, subject, location, date, start/end time, notes. Agenda calendar
groups the next 14 days by date. Recurring rows share a `seriesId`.

### 4.5 Attendance
Per session, mark Present / Absent / Rescheduled / Cancelled. Outcome updates the
session status and is stored permanently; students see their own history and %.

### 4.6 Homework
Assign with title, description, due date, priority. Auto-flag overdue. Tutor
toggles completion; students see pending/overdue/completed.

### 4.7 Notes
Tutor writes per-student notes with `PRIVATE` or `SHARED` visibility. Students see
only `SHARED` notes.

### 4.8 Payments
One record per student per month (`amount`, `status`, period, method). Bulk
"generate this month's invoices" for all active students with a fee. Mark
paid/due/overdue. Reports surface earnings and outstanding totals.

### 4.9 Announcements
Tutor broadcasts; each linked student receives an in-app `Notification`.

### 4.10 Reports
6-month earnings bar chart, attendance-status donut, headline KPIs.

## 5. Non-functional requirements

- **Performance**: server components + parallelized queries; static landing page.
- **Security**: every mutation re-derives the tutor from the session and checks
  row ownership before writing (no client-trusted IDs). See ARCHITECTURE §Auth.
- **Accessibility**: semantic markup, keyboard-dismissable modals, focus rings.
- **Responsive**: mobile bottom-nav + drawer; desktop sidebar. Installable PWA.
- **Theming**: system/light/dark with no flash (class strategy + `next-themes`).

## 6. Success metrics (illustrative)

- Time to add a student + schedule first class < 2 minutes.
- % of classes with attendance marked.
- Outstanding dues trending down month over month.
- Weekly active tutors / student portal logins.

## 7. Release phases

1. **Foundation (this repo)** — everything in §4 above.
2. **Engagement** — FCM push, email reminders, attachments (Supabase Storage).
3. **Intelligence** — AI assistant over the existing data model.
4. **Reach** — parent portal, React Native/Expo app, online payments.
