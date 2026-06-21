import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  BookOpen,
  Wallet,
  BarChart3,
  Bell,
  GraduationCap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: CalendarDays,
    title: "Smart scheduling",
    desc: "Recurring classes, drag-and-drop calendar, and day/week/month views.",
  },
  {
    icon: ClipboardCheck,
    title: "Attendance tracking",
    desc: "Mark present, absent, rescheduled or cancelled — kept forever.",
  },
  {
    icon: BookOpen,
    title: "Homework & notes",
    desc: "Assign work with due dates and priorities, share feedback instantly.",
  },
  {
    icon: Wallet,
    title: "Payment tracking",
    desc: "Monthly fees, dues, receipts, and earnings — never chase a payment again.",
  },
  {
    icon: BarChart3,
    title: "Analytics & reports",
    desc: "Earnings, attendance rates, and student progress at a glance.",
  },
  {
    icon: Bell,
    title: "Notifications",
    desc: "Class reminders, homework alerts, and fee nudges for students & parents.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-grid">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-success" />
          Built for private tutors & coaching teachers
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Run your entire tutoring business in{" "}
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
            one place
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
          {APP_NAME} brings students, schedules, homework, attendance and
          payments together — so you spend less time on admin and more time
          teaching.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/sign-up">
              Start free <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">I already have an account</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          No credit card required · Works on web, Android & iOS
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-12">
          <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Everything your students need, on their phone
              </h2>
              <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                {[
                  "See their next class and weekly schedule",
                  "Track homework — pending, completed, overdue",
                  "Check attendance and teacher feedback",
                  "View fee history and payment status",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
              <Button className="mt-7" asChild>
                <Link href="/sign-up">
                  Create your account <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Today</p>
                <span className="text-xs text-muted-foreground">3 classes</span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { t: "Maths · Algebra", time: "7:00 PM", who: "Aarav" },
                  { t: "Physics · Optics", time: "8:00 PM", who: "Diya" },
                  { t: "Chemistry", time: "9:00 PM", who: "Kabir" },
                ].map((c) => (
                  <div
                    key={c.who}
                    className="flex items-center justify-between rounded-lg border bg-background p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.t}</p>
                      <p className="text-xs text-muted-foreground">{c.who}</p>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {c.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p>Made for teachers, by people who love teaching.</p>
        </div>
      </footer>
    </div>
  );
}
