import type { Metadata } from "next";
import { startOfDay, addDays, format, isSameDay, isToday } from "date-fns";
import { CalendarDays } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { ScheduleBadge } from "@/components/attendance-badge";
import { AddClassButton } from "@/components/schedules/add-class-button";

export const metadata: Metadata = { title: "Calendar" };

const WINDOW_DAYS = 14;

export default async function CalendarPage() {
  const { tutor } = await requireTutor();
  const from = startOfDay(new Date());
  const to = addDays(from, WINDOW_DAYS);

  const [students, schedules] = await Promise.all([
    prisma.student.findMany({
      where: { tutorId: tutor.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.schedule.findMany({
      where: { tutorId: tutor.id, startTime: { gte: from, lt: to } },
      include: { student: { select: { name: true } } },
      orderBy: { startTime: "asc" },
    }),
  ]);

  // Group sessions into day buckets.
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => addDays(from, i));

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Your next two weeks of classes."
      >
        <AddClassButton students={students} />
      </PageHeader>

      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No classes scheduled"
          description="Schedule a one-off or recurring class to fill your calendar."
        >
          <AddClassButton students={students} />
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const items = schedules.filter((s) => isSameDay(s.startTime, day));
            if (items.length === 0) return null;
            return (
              <div key={day.toISOString()}>
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {format(day, "EEEE, MMM d")}
                  </h2>
                  {isToday(day) && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Today
                    </span>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => (
                    <Card key={s.id} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.student.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.subject ?? "Class"}
                            {s.location ? ` · ${s.location}` : ""}
                          </p>
                        </div>
                        <ScheduleBadge status={s.status} />
                      </div>
                      <p className="mt-2 text-xs font-medium text-primary">
                        {format(s.startTime, "h:mm a")} –{" "}
                        {format(s.endTime, "h:mm a")}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
