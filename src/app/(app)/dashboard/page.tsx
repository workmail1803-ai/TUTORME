import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  Users,
  CalendarClock,
  BookOpen,
  Wallet,
  TrendingUp,
  CalendarX,
  ClipboardCheck,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { getTutorDashboard } from "@/server/queries/dashboard";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AttendanceBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, tutor } = await requireTutor();
  const d = await getTutorDashboard(tutor.id);

  const firstName = user.firstName ?? "there";

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description="Here's what's happening across your tutoring today."
      >
        <Button asChild>
          <Link href="/calendar">
            <CalendarDays className="size-4" /> Schedule a class
          </Link>
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Active students"
          value={d.studentCount}
          icon={Users}
        />
        <StatCard
          label="Today's classes"
          value={d.todayClasses.length}
          icon={CalendarClock}
        />
        <StatCard
          label="Homework due"
          value={d.pendingHomework}
          icon={BookOpen}
          tone="warning"
        />
        <StatCard
          label="Missed this month"
          value={d.missedThisMonth}
          icon={CalendarX}
          tone="destructive"
        />
        <StatCard
          label="Monthly earnings"
          value={formatCurrency(d.monthlyEarnings)}
          icon={TrendingUp}
          tone="success"
          hint={format(new Date(), "MMMM yyyy")}
        />
        <StatCard
          label="Pending payments"
          value={formatCurrency(d.pendingPaymentsAmount)}
          icon={Wallet}
          tone="warning"
          hint={`${d.pendingPaymentsCount} unpaid`}
        />
        <StatCard
          label="Attendance rate"
          value={`${d.attendanceRate}%`}
          icon={ClipboardCheck}
          tone="success"
          hint={`${d.attendanceMarked} marked`}
        />
        <StatCard
          label="Upcoming (7d)"
          value={d.upcomingClasses.length}
          icon={CalendarDays}
        />
      </div>

      {/* Today + Upcoming */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Today&apos;s classes</CardTitle>
            <Badge variant="secondary">{d.todayClasses.length}</Badge>
          </CardHeader>
          <CardContent>
            {d.todayClasses.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No classes today"
                description="Enjoy the breather, or schedule a new session."
              />
            ) : (
              <ul className="divide-y">
                {d.todayClasses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.student.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.subject ?? "Class"}
                        {c.location ? ` · ${c.location}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.attendance ? (
                        <AttendanceBadge status={c.attendance.status} />
                      ) : null}
                      <span className="whitespace-nowrap text-sm font-medium text-primary">
                        {format(c.startTime, "h:mm a")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming this week</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calendar">
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {d.upcomingClasses.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nothing scheduled"
                description="Add recurring classes from the calendar."
              />
            ) : (
              <ul className="divide-y">
                {d.upcomingClasses.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {c.student.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.subject ?? "Class"}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {format(c.startTime, "EEE, MMM d · h:mm a")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
