import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Phone,
  School,
  MapPin,
  BookOpen,
  Wallet,
  ClipboardCheck,
  KeyRound,
  CalendarClock,
} from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, pct } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  AttendanceBadge,
  HomeworkBadge,
  PaymentBadge,
} from "@/components/attendance-badge";
import {
  StudentActions,
  type StudentActionData,
} from "@/components/students/student-actions";

export const metadata: Metadata = { title: "Student" };

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto truncate text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tutor } = await requireTutor();
  const { id } = await params;

  const [student, presentCount, totalAttendance] = await Promise.all([
    prisma.student.findFirst({
      where: { id, tutorId: tutor.id },
      include: {
        schedules: {
          where: { startTime: { gte: new Date() } },
          orderBy: { startTime: "asc" },
          take: 5,
        },
        homeworks: { orderBy: { createdAt: "desc" }, take: 5 },
        payments: {
          orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
          take: 6,
        },
        noteEntries: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.attendance.count({
      where: { studentId: id, status: "PRESENT" },
    }),
    prisma.attendance.count({
      where: { studentId: id },
    }),
  ]);

  if (!student) notFound();

  const attendanceRate = pct(presentCount, totalAttendance);
  const totalPaid = student.payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);

  const actionData: StudentActionData = {
    id: student.id,
    name: student.name,
    subject: student.subject ?? "",
    gradeClass: student.gradeClass ?? "",
    school: student.school ?? "",
    phone: student.phone ?? "",
    parentPhone: student.parentPhone ?? "",
    monthlyFee: student.monthlyFee ? String(student.monthlyFee) : "",
    address: student.address ?? "",
    notes: student.notes ?? "",
    status: student.status,
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
        <Link href="/students">
          <ArrowLeft className="size-4" /> Back to students
        </Link>
      </Button>

      <PageHeader title={student.name}>
        <StudentActions student={actionData} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <Avatar name={student.name} className="size-14 text-base" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{student.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[student.subject, student.gradeClass]
                      .filter(Boolean)
                      .join(" · ") || "No subject"}
                  </p>
                  {student.status === "ARCHIVED" && (
                    <Badge variant="secondary" className="mt-1">
                      Archived
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 divide-y">
                <InfoRow icon={Phone} label="Student" value={student.phone} />
                <InfoRow
                  icon={Phone}
                  label="Parent"
                  value={student.parentPhone}
                />
                <InfoRow icon={School} label="School" value={student.school} />
                <InfoRow
                  icon={MapPin}
                  label="Address"
                  value={student.address}
                />
                <InfoRow
                  icon={Wallet}
                  label="Monthly fee"
                  value={
                    student.monthlyFee
                      ? formatCurrency(Number(student.monthlyFee))
                      : null
                  }
                />
                <InfoRow
                  icon={KeyRound}
                  label="Claim code"
                  value={student.claimCode}
                />
              </div>

              {student.notes && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                  {student.notes}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Attendance</p>
              <p className="mt-1 text-xl font-bold">{attendanceRate}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total paid</p>
              <p className="mt-1 text-xl font-bold">
                {formatCurrency(totalPaid)}
              </p>
            </Card>
          </div>
        </div>

        {/* Activity */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
              <CardTitle>Upcoming classes</CardTitle>
            </CardHeader>
            <CardContent>
              {student.schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No upcoming classes scheduled.
                </p>
              ) : (
                <ul className="divide-y">
                  {student.schedules.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <span>{s.subject ?? "Class"}</span>
                      <span className="text-muted-foreground">
                        {format(s.startTime, "EEE, MMM d · h:mm a")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <BookOpen className="size-4 text-muted-foreground" />
              <CardTitle>Recent homework</CardTitle>
            </CardHeader>
            <CardContent>
              {student.homeworks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No homework assigned yet.
                </p>
              ) : (
                <ul className="divide-y">
                  {student.homeworks.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                    >
                      <span className="truncate">{h.title}</span>
                      <HomeworkBadge status={h.status} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {student.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No payment records.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {student.payments.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0"
                      >
                        <span>
                          {format(
                            new Date(p.periodYear, p.periodMonth - 1),
                            "MMM yyyy",
                          )}
                        </span>
                        <PaymentBadge status={p.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center gap-2">
                <ClipboardCheck className="size-4 text-muted-foreground" />
                <CardTitle>Recent notes</CardTitle>
              </CardHeader>
              <CardContent>
                {student.noteEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notes yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {student.noteEntries.map((n) => (
                      <li
                        key={n.id}
                        className="rounded-lg bg-muted/50 p-2.5 text-sm"
                      >
                        {n.content}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
