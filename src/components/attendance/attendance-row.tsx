"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { markAttendance } from "@/server/actions/schedules";
import type { AttendanceStatus } from "@prisma/client";

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "PRESENT", label: "Present", active: "bg-success text-success-foreground border-success" },
  { value: "ABSENT", label: "Absent", active: "bg-destructive text-destructive-foreground border-destructive" },
  { value: "RESCHEDULED", label: "Resched.", active: "bg-warning text-warning-foreground border-warning" },
  { value: "CANCELLED", label: "Cancel", active: "bg-secondary text-secondary-foreground border-border" },
];

export function AttendanceRow({
  scheduleId,
  studentName,
  subtitle,
  current,
}: {
  scheduleId: string;
  studentName: string;
  subtitle: string;
  current: AttendanceStatus | null;
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<AttendanceStatus | null>(current);
  const [pending, start] = React.useTransition();

  function mark(value: AttendanceStatus) {
    const prev = status;
    setStatus(value); // optimistic
    start(async () => {
      const res = await markAttendance({ scheduleId, status: value });
      if (res.ok) {
        router.refresh();
      } else {
        setStatus(prev);
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{studentName}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-busy={pending}>
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => mark(o.value)}
            disabled={pending}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
              status === o.value
                ? o.active
                : "text-muted-foreground hover:bg-accent",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
