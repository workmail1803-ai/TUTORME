import { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, addDays } from "date-fns";

const prisma = new PrismaClient();

// Mirror of getTutorDashboard() so we can run it standalone against prod data.
async function runDashboard(tutorId: string) {
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
    prisma.schedule.findMany({
      where: { tutorId, startTime: { gte: todayStart, lte: todayEnd } },
      include: { student: { select: { name: true } }, attendance: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.schedule.findMany({
      where: { tutorId, status: "SCHEDULED", startTime: { gt: now, lte: addDays(now, 7) } },
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
      where: { tutorId, status: "PAID", periodYear: now.getFullYear(), periodMonth: now.getMonth() + 1 },
      _sum: { amount: true },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { schedule: { tutorId }, markedAt: { gte: monthStart, lte: monthEnd } },
      _count: true,
    }),
  ]);

  return { todayClasses, upcomingClasses, studentCount, pendingHomework, pendingPaymentsAgg, paidThisMonthAgg, attendanceThisMonth };
}

async function main() {
  const tutors = await prisma.tutor.findMany({ include: { user: true } });
  for (const t of tutors) {
    process.stdout.write(`Tutor ${t.user.email} ... `);
    try {
      const d = await runDashboard(t.id);
      console.log(`OK (students=${d.studentCount}, today=${d.todayClasses.length}, attendanceGroups=${d.attendanceThisMonth.length})`);
    } catch (e) {
      console.log("FAILED");
      console.error(e);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
