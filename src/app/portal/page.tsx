import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  CalendarClock,
  BookOpen,
  Megaphone,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pct } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HomeworkBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Home" };

export default async function PortalHomePage() {
  const { user, student } = await requireStudent();
  const now = new Date();

  const [nextClass, pendingHw, announcements, attendance] = await Promise.all([
    prisma.schedule.findFirst({
      where: { studentId: student.id, startTime: { gte: now }, status: "SCHEDULED" },
      orderBy: { startTime: "asc" },
    }),
    prisma.homework.findMany({
      where: { studentId: student.id, status: { not: "COMPLETED" } },
      orderBy: [{ dueDate: "asc" }],
      take: 5,
    }),
    prisma.announcement.findMany({
      where: { tutorId: student.tutorId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id },
      select: { status: true },
    }),
  ]);

  const present = attendance.filter((a) => a.status === "PRESENT").length;
  const rate = pct(present, attendance.length);

  return (
    <>
      <PageHeader
        title={`Hi, ${user.firstName ?? "there"} 👋`}
        description="Here's your learning at a glance."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Next class"
          value={nextClass ? format(nextClass.startTime, "MMM d") : "—"}
          icon={CalendarClock}
          hint={nextClass ? format(nextClass.startTime, "h:mm a") : "Nothing scheduled"}
        />
        <StatCard label="Pending homework" value={pendingHw.length} icon={BookOpen} tone="warning" />
        <StatCard label="Attendance" value={`${rate}%`} icon={ClipboardCheck} tone="success" />
        <StatCard label="Updates" value={announcements.length} icon={Megaphone} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pending homework</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/portal/homework">
                All <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingHw.length === 0 ? (
              <p className="text-sm text-muted-foreground">You&apos;re all caught up! 🎉</p>
            ) : (
              <ul className="divide-y">
                {pendingHw.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{h.title}</p>
                      {h.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due {format(h.dueDate, "MMM d")}
                        </p>
                      )}
                    </div>
                    <HomeworkBadge status={h.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-lg border bg-card p-3">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {a.body}
                    </p>
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
