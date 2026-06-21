"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentBadge } from "@/components/attendance-badge";
import { setPaymentStatus, deletePayment } from "@/server/actions/payments";
import type { PaymentStatus } from "@prisma/client";

export type PaymentRowData = {
  id: string;
  studentName: string;
  periodLabel: string;
  amount: string;
  method: string | null;
  status: PaymentStatus;
};

export function PaymentRow({ p }: { p: PaymentRowData }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();

  function update(status: PaymentStatus) {
    start(async () => {
      const res = await setPaymentStatus(p.id, status);
      if (res.ok) {
        toast.success(`Marked ${status.toLowerCase()}`);
        router.refresh();
      } else toast.error(res.error);
    });
  }

  function remove() {
    start(async () => {
      const res = await deletePayment(p.id);
      if (res.ok) {
        toast.success("Payment removed");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{p.studentName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {p.periodLabel}
          {p.method ? ` · ${p.method}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold">{p.amount}</span>
        <PaymentBadge status={p.status} />
        {p.status !== "PAID" ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-success hover:bg-success/10"
            onClick={() => update("PAID")}
            disabled={pending}
            aria-label="Mark paid"
          >
            <Check className="size-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => update("DUE")}
            disabled={pending}
            aria-label="Mark due"
          >
            <Clock className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:bg-destructive/10"
          onClick={remove}
          disabled={pending}
          aria-label="Delete"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
