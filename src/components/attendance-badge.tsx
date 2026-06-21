import type {
  AttendanceStatus,
  HomeworkStatus,
  PaymentStatus,
  ScheduleStatus,
} from "@prisma/client";
import { Badge, type BadgeProps } from "@/components/ui/badge";

const attendanceMap: Record<
  AttendanceStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PRESENT: { label: "Present", variant: "success" },
  ABSENT: { label: "Absent", variant: "destructive" },
  RESCHEDULED: { label: "Rescheduled", variant: "warning" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const m = attendanceMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const paymentMap: Record<
  PaymentStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PAID: { label: "Paid", variant: "success" },
  DUE: { label: "Due", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const m = paymentMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const homeworkMap: Record<
  HomeworkStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  SUBMITTED: { label: "Submitted", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  OVERDUE: { label: "Overdue", variant: "destructive" },
};

export function HomeworkBadge({ status }: { status: HomeworkStatus }) {
  const m = homeworkMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

const scheduleMap: Record<
  ScheduleStatus,
  { label: string; variant: BadgeProps["variant"] }
> = {
  SCHEDULED: { label: "Scheduled", variant: "default" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  RESCHEDULED: { label: "Rescheduled", variant: "warning" },
};

export function ScheduleBadge({ status }: { status: ScheduleStatus }) {
  const m = scheduleMap[status];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
