import type { Metadata } from "next";
import { Wallet, AlertCircle } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, periodLabel } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { PaymentBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Payments" };

export default async function PortalPaymentsPage() {
  const { student } = await requireStudent();
  const payments = await prisma.payment.findMany({
    where: { studentId: student.id },
    orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
  });

  const outstanding = payments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);
  const paid = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      <PageHeader title="Payments" description="Your fee history and dues." />

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} icon={AlertCircle} tone="warning" />
        <StatCard label="Total paid" value={formatCurrency(paid)} icon={Wallet} tone="success" />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payment records"
          description="Your fee history will appear here."
        />
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <Card key={p.id} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium">
                  {periodLabel(p.periodYear, p.periodMonth)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Number(p.amount))}
                  {p.method ? ` · ${p.method}` : ""}
                </p>
              </div>
              <PaymentBadge status={p.status} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
