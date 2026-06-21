import type { Metadata } from "next";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, periodLabel } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { PaymentControls } from "@/components/payments/payment-controls";
import { PaymentRow, type PaymentRowData } from "@/components/payments/payment-row";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { tutor } = await requireTutor();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [students, payments, paidAgg, dueAgg] = await Promise.all([
    prisma.student.findMany({
      where: { tutorId: tutor.id, status: "ACTIVE" },
      select: { id: true, name: true, monthlyFee: true },
      orderBy: { name: "asc" },
    }),
    prisma.payment.findMany({
      where: { tutorId: tutor.id },
      include: { student: { select: { name: true } } },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }, { status: "asc" }],
      take: 100,
    }),
    prisma.payment.aggregate({
      where: { tutorId: tutor.id, status: "PAID", periodYear: year, periodMonth: month },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { tutorId: tutor.id, status: { in: ["DUE", "OVERDUE"] } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const rows: PaymentRowData[] = payments.map((p) => ({
    id: p.id,
    studentName: p.student.name,
    periodLabel: periodLabel(p.periodYear, p.periodMonth),
    amount: formatCurrency(Number(p.amount)),
    method: p.method,
    status: p.status,
  }));

  const studentOptions = students.map((s) => ({
    id: s.id,
    name: s.name,
    monthlyFee: s.monthlyFee ? String(s.monthlyFee) : null,
  }));

  return (
    <>
      <PageHeader
        title="Payments"
        description="Track monthly fees, dues and earnings."
      >
        <PaymentControls students={studentOptions} year={year} month={month} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Earned this month"
          value={formatCurrency(Number(paidAgg._sum.amount ?? 0))}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Outstanding"
          value={formatCurrency(Number(dueAgg._sum.amount ?? 0))}
          icon={AlertCircle}
          tone="warning"
          hint={`${dueAgg._count} unpaid`}
        />
        <StatCard
          label="Active students"
          value={students.length}
          icon={Wallet}
        />
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No payments recorded"
            description="Record a payment or generate this month's invoices for all students with a monthly fee."
          />
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <PaymentRow key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
