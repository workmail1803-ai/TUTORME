"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/server/actions/students";

const paymentSchema = z.object({
  studentId: z.string().min(1, "Pick a student"),
  amount: z.coerce.number().min(0).max(1_000_000),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000).max(2100),
  status: z.enum(["PAID", "DUE", "OVERDUE"]).default("DUE"),
  method: z.string().trim().max(60).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export async function recordPayment(
  input: PaymentInput,
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  const owned = await prisma.student.findFirst({
    where: { id: d.studentId, tutorId: tutor.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Student not found." };

  // One record per student per billing period — upsert keeps it idempotent.
  await prisma.payment.upsert({
    where: {
      studentId_periodYear_periodMonth: {
        studentId: d.studentId,
        periodYear: d.periodYear,
        periodMonth: d.periodMonth,
      },
    },
    create: {
      tutorId: tutor.id,
      studentId: d.studentId,
      amount: d.amount,
      periodMonth: d.periodMonth,
      periodYear: d.periodYear,
      status: d.status,
      method: d.method || null,
      note: d.note || null,
      paidAt: d.status === "PAID" ? new Date() : null,
    },
    update: {
      amount: d.amount,
      status: d.status,
      method: d.method || null,
      note: d.note || null,
      paidAt: d.status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setPaymentStatus(
  id: string,
  status: "PAID" | "DUE" | "OVERDUE",
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const p = await prisma.payment.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true },
  });
  if (!p) return { ok: false, error: "Payment not found." };
  await prisma.payment.update({
    where: { id },
    data: { status, paidAt: status === "PAID" ? new Date() : null },
  });
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { ok: true };
}

/**
 * Create DUE invoices for the given period for every active student who has a
 * monthly fee and doesn't already have a record for that period.
 */
export async function generateMonthlyInvoices(
  periodYear: number,
  periodMonth: number,
): Promise<ActionResult<{ created: number }>> {
  const { tutor } = await requireTutor();

  const students = await prisma.student.findMany({
    where: { tutorId: tutor.id, status: "ACTIVE", monthlyFee: { not: null } },
    select: { id: true, monthlyFee: true },
  });

  const existing = await prisma.payment.findMany({
    where: { tutorId: tutor.id, periodYear, periodMonth },
    select: { studentId: true },
  });
  const have = new Set(existing.map((e) => e.studentId));

  const toCreate = students
    .filter((s) => !have.has(s.id))
    .map((s) => ({
      tutorId: tutor.id,
      studentId: s.id,
      amount: s.monthlyFee!,
      periodYear,
      periodMonth,
      status: "DUE" as const,
      dueDate: new Date(periodYear, periodMonth - 1, 5),
    }));

  if (toCreate.length) {
    await prisma.payment.createMany({ data: toCreate });
  }

  revalidatePath("/payments");
  return { ok: true, data: { created: toCreate.length } };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const p = await prisma.payment.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true },
  });
  if (!p) return { ok: false, error: "Payment not found." };
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/payments");
  return { ok: true };
}
