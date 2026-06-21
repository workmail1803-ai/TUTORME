import type { Metadata } from "next";
import { startOfMonth, subMonths, format } from "date-fns";
import { Users, CalendarCheck, Wallet, BookOpen } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EarningsChart, AttendanceChart } from "@/components/reports/reports-charts";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const { tutor } = await requireTutor();
  const now = new Date();
  const sixMonthsAgo = startOfMonth(subMonths(now, 5));

  const [
    studentCount,
    classesThisMonth,
    paidPayments,
    attendanceGroups,
    totalEarnedAgg,
    homeworkCount,
  ] = await Promise.all([
    prisma.student.count({ where: { tutorId: tutor.id, status: "ACTIVE" } }),
    prisma.schedule.count({
      where: { tutorId: tutor.id, startTime: { gte: startOfMonth(now) } },
    }),
    prisma.payment.findMany({
      where: {
        tutorId: tutor.id,
        status: "PAID",
        OR: [
          { periodYear: { gt: sixMonthsAgo.getFullYear() } },
          {
            periodYear: sixMonthsAgo.getFullYear(),
            periodMonth: { gte: sixMonthsAgo.getMonth() + 1 },
          },
        ],
      },
      select: { amount: true, periodYear: true, periodMonth: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { schedule: { tutorId: tutor.id } },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { tutorId: tutor.id, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.homework.count({ where: { tutorId: tutor.id } }),
  ]);

  // Build last-6-months earnings buckets.
  const months = Array.from({ length: 6 }, (_, i) =>
    startOfMonth(subMonths(now, 5 - i)),
  );
  const earnings = months.map((m) => {
    const y = m.getFullYear();
    const mo = m.getMonth() + 1;
    const amount = paidPayments
      .filter((p) => p.periodYear === y && p.periodMonth === mo)
      .reduce((s, p) => s + Number(p.amount), 0);
    return { label: format(m, "MMM"), amount };
  });

  const labelMap: Record<string, string> = {
    PRESENT: "Present",
    ABSENT: "Absent",
    RESCHEDULED: "Rescheduled",
    CANCELLED: "Cancelled",
  };
  const attendance = attendanceGroups.map((g) => ({
    name: labelMap[g.status] ?? g.status,
    value: g._count,
  }));

  return (
    <>
      <PageHeader
        title="Reports"
        description="Your tutoring at a glance."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active students" value={studentCount} icon={Users} />
        <StatCard
          label="Classes this month"
          value={classesThisMonth}
          icon={CalendarCheck}
        />
        <StatCard
          label="Total earned"
          value={formatCurrency(Number(totalEarnedAgg._sum.amount ?? 0))}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Homework assigned"
          value={homeworkCount}
          icon={BookOpen}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <EarningsChart data={earnings} />
        <AttendanceChart data={attendance} />
      </div>
    </>
  );
}
