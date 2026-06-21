"use server";

import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";
import { studentSchema, type StudentInput } from "@/lib/validations/student";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

async function uniqueClaimCode() {
  for (let i = 0; i < 8; i++) {
    const code = generateCode(7);
    const taken = await prisma.student.findUnique({ where: { claimCode: code } });
    if (!taken) return code;
  }
  return generateCode(11);
}

export async function createStudent(
  input: StudentInput,
): Promise<ActionResult<{ id: string }>> {
  const { tutor } = await requireTutor();
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const student = await prisma.student.create({
    data: {
      tutorId: tutor.id,
      claimCode: await uniqueClaimCode(),
      name: parsed.data.name,
      phone: parsed.data.phone,
      parentPhone: parsed.data.parentPhone,
      gradeClass: parsed.data.gradeClass,
      school: parsed.data.school,
      subject: parsed.data.subject,
      monthlyFee: parsed.data.monthlyFee,
      address: parsed.data.address,
      notes: parsed.data.notes,
    },
  });

  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: student.id } };
}

/** Ensure the student belongs to the current tutor before mutating. */
async function assertOwned(tutorId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, tutorId },
    select: { id: true },
  });
  if (!student) throw new Error("Student not found");
}

export async function updateStudent(
  id: string,
  input: StudentInput,
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  await assertOwned(tutor.id, id);

  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await prisma.student.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      parentPhone: parsed.data.parentPhone ?? null,
      gradeClass: parsed.data.gradeClass ?? null,
      school: parsed.data.school ?? null,
      subject: parsed.data.subject ?? null,
      monthlyFee: parsed.data.monthlyFee ?? null,
      address: parsed.data.address ?? null,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { ok: true };
}

export async function setStudentStatus(
  id: string,
  status: "ACTIVE" | "ARCHIVED",
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  await assertOwned(tutor.id, id);
  await prisma.student.update({ where: { id }, data: { status } });
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { ok: true };
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  await assertOwned(tutor.id, id);
  await prisma.student.delete({ where: { id } });
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { ok: true };
}
