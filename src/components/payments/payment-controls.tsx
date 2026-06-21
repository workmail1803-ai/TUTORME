"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wallet, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { recordPayment, generateMonthlyInvoices } from "@/server/actions/payments";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function PaymentControls({
  students,
  year,
  month,
}: {
  students: { id: string; name: string; monthlyFee: string | null }[];
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [genPending, startGen] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [fee, setFee] = React.useState("");

  function onPickStudent(id: string) {
    const s = students.find((x) => x.id === id);
    if (s?.monthlyFee) setFee(s.monthlyFee);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    start(async () => {
      const res = await recordPayment({
        studentId: String(fd.get("studentId") ?? ""),
        amount: Number(fd.get("amount") ?? 0),
        periodMonth: Number(fd.get("periodMonth") ?? month),
        periodYear: Number(fd.get("periodYear") ?? year),
        status: String(fd.get("status") ?? "DUE") as "PAID" | "DUE" | "OVERDUE",
        method: String(fd.get("method") ?? ""),
        note: "",
      });
      if (res.ok) {
        toast.success("Payment saved");
        setOpen(false);
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  function generate() {
    startGen(async () => {
      const res = await generateMonthlyInvoices(year, month);
      if (res.ok) {
        toast.success(
          res.data?.created
            ? `${res.data.created} invoice(s) created for ${MONTHS[month - 1]}`
            : "Everyone already invoiced this month",
        );
        router.refresh();
      } else toast.error(res.error);
    });
  }

  const err = (k: string) =>
    errors[k]?.[0] ? (
      <p className="text-xs text-destructive">{errors[k][0]}</p>
    ) : null;

  return (
    <>
      <Button variant="outline" onClick={generate} disabled={genPending}>
        {genPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Receipt className="size-4" />
        )}
        Generate this month
      </Button>
      <Button onClick={() => setOpen(true)} disabled={students.length === 0}>
        <Wallet className="size-4" /> Record payment
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Record a payment">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student *</Label>
            <Select
              id="studentId"
              name="studentId"
              defaultValue=""
              required
              onChange={(e) => onPickStudent(e.target.value)}
            >
              <option value="" disabled>
                Select a student…
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {err("studentId")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={0}
                step="1"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
              />
              {err("amount")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="PAID">
                <option value="PAID">Paid</option>
                <option value="DUE">Due</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="periodMonth">Month</Label>
              <Select id="periodMonth" name="periodMonth" defaultValue={month}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="periodYear">Year</Label>
              <Input
                id="periodYear"
                name="periodYear"
                type="number"
                defaultValue={year}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="method">Method</Label>
            <Input
              id="method"
              name="method"
              placeholder="Cash, UPI, bank transfer…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
