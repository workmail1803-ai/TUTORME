import "server-only";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";
import { prisma } from "@/lib/prisma";
import { pct } from "@/lib/utils";

export async function getTutorDashboard(tutorId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    todayClasses,
    upcomingClasses,
    studentCount,
    pendingHomework,
    pendingPaymentsAgg,
    paidThisMonthAgg,
    attendanceThisMonth,
  ] = await Promise.all([
    // Today's classes (any status), earliest first.
    prisma.schedule.findMany({
      where: { tutorId, startTime: { gte: todayStart, lte: todayEnd } },
      include: { student: { select: { name: true } }, attendance: true },
      orderBy: { startTime: "asc" },
    }),
    // Next upcoming scheduled classes (after now, within 7 days).
    prisma.schedule.findMany({
      where: {
        tutorId,
        status: "SCHEDULED",
        startTime: { gt: now, lte: addDays(now, 7) },
      },
      include: { student: { select: { name: true } } },
      orderBy: { startTime: "asc" },
      take: 6,
    }),
    prisma.student.count({ where: { tutorId, status: "ACTIVE" } }),
    prisma.homework.count({ where: { tutorId, status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { tutorId, status: { in: ["DUE", "OVERDUE"] } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        tutorId,
        status: "PAID",
        periodYear: now.getFullYear(),
        periodMonth: now.getMonth() + 1,
      },
      _sum: { amount: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { schedule: { tutorId }, markedAt: { gte: monthStart, lte: monthEnd } },
      _count: true,
    }),
  ]);

  const present =
    attendanceThisMonth.find((a) => a.status === "PRESENT")?._count ?? 0;
  const absent =
    attendanceThisMonth.find((a) => a.status === "ABSENT")?._count ?? 0;
  const totalMarked = attendanceThisMonth.reduce((s, a) => s + a._count, 0);

  return {
    todayClasses,
    upcomingClasses,
    studentCount,
    pendingHomework,
    pendingPaymentsCount: pendingPaymentsAgg._count,
    pendingPaymentsAmount: Number(pendingPaymentsAgg._sum.amount ?? 0),
    monthlyEarnings: Number(paidThisMonthAgg._sum.amount ?? 0),
    missedThisMonth: absent,
    attendanceRate: pct(present, totalMarked),
    attendanceMarked: totalMarked,
  };
}

export type TutorDashboard = Awaited<ReturnType<typeof getTutorDashboard>>;
