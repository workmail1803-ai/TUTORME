import type { Metadata } from "next";
import { startOfDay, endOfDay, addDays, format, isSameDay } from "date-fns";
import { ClipboardCheck } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AttendanceRow } from "@/components/attendance/attendance-row";

export const metadata: Metadata = { title: "Attendance" };

export default async function AttendancePage() {
  const { tutor } = await requireTutor();
  // Sessions you can mark: the last 14 days up to end of today.
  const from = addDays(startOfDay(new Date()), -14);
  const to = endOfDay(new Date());

  const schedules = await prisma.schedule.findMany({
    where: { tutorId: tutor.id, startTime: { gte: from, lte: to } },
    include: {
      student: { select: { name: true } },
      attendance: { select: { status: true } },
    },
    orderBy: { startTime: "desc" },
  });

  // Group by day (most recent first).
  const dayKeys: Date[] = [];
  for (const s of schedules) {
    if (!dayKeys.some((d) => isSameDay(d, s.startTime))) {
      dayKeys.push(s.startTime);
    }
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Mark attendance for recent and today's classes."
      />

      {schedules.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No recent classes"
          description="Once you've scheduled classes, mark attendance here after each session."
        />
      ) : (
        <div className="space-y-5">
          {dayKeys.map((day) => {
            const items = schedules.filter((s) => isSameDay(s.startTime, day));
            return (
              <div key={day.toISOString()}>
                <h2 className="mb-2 text-sm font-semibold">
                  {format(day, "EEEE, MMM d")}
                </h2>
                <div className="space-y-2">
                  {items.map((s) => (
                    <AttendanceRow
                      key={s.id}
                      scheduleId={s.id}
                      studentName={s.student.name}
                      subtitle={`${s.subject ?? "Class"} · ${format(s.startTime, "h:mm a")}`}
                      current={s.attendance?.status ?? null}
                    />
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
