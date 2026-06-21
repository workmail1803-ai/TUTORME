import type { Metadata } from "next";
import { format } from "date-fns";
import { ClipboardCheck } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pct } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { AttendanceBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Attendance" };

export default async function PortalAttendancePage() {
  const { student } = await requireStudent();
  const records = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: { schedule: { select: { startTime: true, subject: true } } },
    orderBy: { markedAt: "desc" },
    take: 60,
  });

  const present = records.filter((r) => r.status === "PRESENT").length;
  const rate = pct(present, records.length);

  return (
    <>
      <PageHeader title="Attendance" description="Your class attendance record." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Attendance rate" value={`${rate}%`} icon={ClipboardCheck} tone="success" />
        <StatCard label="Present" value={present} icon={ClipboardCheck} />
        <StatCard label="Total marked" value={records.length} icon={ClipboardCheck} />
      </div>

      {records.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No attendance yet"
          description="Attendance will appear after your classes."
        />
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <Card key={r.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {r.schedule.subject ?? "Class"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {format(r.schedule.startTime, "EEE, MMM d · h:mm a")}
                </p>
              </div>
              <AttendanceBadge status={r.status} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
