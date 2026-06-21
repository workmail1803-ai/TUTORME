"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/server/actions/students";

const homeworkSchema = z.object({
  studentId: z.string().min(1, "Pick a student"),
  title: z.string().trim().min(1, "Title is required").max(160),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type HomeworkInput = z.infer<typeof homeworkSchema>;

export async function createHomework(
  input: HomeworkInput,
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const parsed = homeworkSchema.safeParse(input);
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

  await prisma.homework.create({
    data: {
      tutorId: tutor.id,
      studentId: d.studentId,
      title: d.title,
      description: d.description || null,
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      priority: d.priority,
      notes: d.notes || null,
    },
  });

  revalidatePath("/homework");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setHomeworkStatus(
  id: string,
  status: "PENDING" | "SUBMITTED" | "COMPLETED" | "OVERDUE",
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const hw = await prisma.homework.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true },
  });
  if (!hw) return { ok: false, error: "Homework not found." };
  await prisma.homework.update({ where: { id }, data: { status } });
  revalidatePath("/homework");
  return { ok: true };
}

export async function deleteHomework(id: string): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const hw = await prisma.homework.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true },
  });
  if (!hw) return { ok: false, error: "Homework not found." };
  await prisma.homework.delete({ where: { id } });
  revalidatePath("/homework");
  return { ok: true };
}
