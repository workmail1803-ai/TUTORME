import type { Metadata } from "next";
import { format, isSameDay } from "date-fns";
import { CalendarDays } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { ScheduleBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Schedule" };

export default async function PortalSchedulePage() {
  const { student } = await requireStudent();
  const schedules = await prisma.schedule.findMany({
    where: { studentId: student.id, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
    take: 30,
  });

  const days: Date[] = [];
  for (const s of schedules) {
    if (!days.some((d) => isSameDay(d, s.startTime))) days.push(s.startTime);
  }

  return (
    <>
      <PageHeader title="Schedule" description="Your upcoming classes." />
      {schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming classes"
          description="Your tutor hasn't scheduled any classes yet."
        />
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.toISOString()}>
              <h2 className="mb-2 text-sm font-semibold">
                {format(day, "EEEE, MMM d")}
              </h2>
              <div className="space-y-2">
                {schedules
                  .filter((s) => isSameDay(s.startTime, day))
                  .map((s) => (
                    <Card key={s.id} className="flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {s.subject ?? "Class"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {format(s.startTime, "h:mm a")} – {format(s.endTime, "h:mm a")}
                          {s.location ? ` · ${s.location}` : ""}
                        </p>
                      </div>
                      <ScheduleBadge status={s.status} />
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
