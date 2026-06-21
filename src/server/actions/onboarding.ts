"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/utils";
import type { ActionResult } from "@/server/actions/students";

async function uniqueTutorInviteCode() {
  for (let i = 0; i < 8; i++) {
    const code = generateCode(6);
    if (!(await prisma.tutor.findUnique({ where: { inviteCode: code } })))
      return code;
  }
  return generateCode(10);
}

export async function becomeTutor(): Promise<ActionResult> {
  const user = await requireUser();
  if (user.tutor) return { ok: true };
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "TUTOR" } }),
    prisma.tutor.create({
      data: { userId: user.id, inviteCode: await uniqueTutorInviteCode() },
    }),
  ]);
  return { ok: true };
}

const joinSchema = z.object({
  inviteCode: z.string().trim().min(4, "Enter your tutor's invite code"),
  claimCode: z.string().trim().optional().or(z.literal("")),
});

export type JoinInput = z.infer<typeof joinSchema>;

/**
 * Link the current user to a tutor as a student. If a claimCode is provided and
 * matches a pre-created student profile, that profile is claimed; otherwise a
 * fresh student profile is created under the tutor.
 */
export async function joinAsStudent(input: JoinInput): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const { inviteCode, claimCode } = parsed.data;

  const tutor = await prisma.tutor.findUnique({
    where: { inviteCode: inviteCode.toUpperCase() },
    select: { id: true },
  });
  if (!tutor) return { ok: false, error: "No tutor found with that code." };

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email.split("@")[0];

  if (claimCode) {
    const target = await prisma.student.findFirst({
      where: { claimCode: claimCode.toUpperCase(), tutorId: tutor.id },
      select: { id: true, userId: true },
    });
    if (!target) return { ok: false, error: "Invalid claim code for this tutor." };
    if (target.userId && target.userId !== user.id)
      return { ok: false, error: "That profile is already claimed." };

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT" } }),
      prisma.student.update({
        where: { id: target.id },
        data: { userId: user.id, claimCode: null },
      }),
    ]);
    return { ok: true };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "STUDENT" } }),
    prisma.student.create({
      data: {
        tutorId: tutor.id,
        userId: user.id,
        name: fullName,
        phone: null,
      },
    }),
  ]);
  return { ok: true };
}
