"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/server/actions/students";

const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  body: z.string().trim().min(1, "Message is required").max(4000),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const announcement = await prisma.announcement.create({
    data: { tutorId: tutor.id, title: parsed.data.title, body: parsed.data.body },
  });

  // Fan out an in-app notification to every linked student account.
  const students = await prisma.student.findMany({
    where: { tutorId: tutor.id, userId: { not: null } },
    select: { userId: true },
  });
  const recipients = students
    .map((s) => s.userId)
    .filter((id): id is string => Boolean(id));

  if (recipients.length) {
    await prisma.notification.createMany({
      data: recipients.map((userId) => ({
        userId,
        type: "ANNOUNCEMENT" as const,
        title: parsed.data.title,
        body: parsed.data.body,
        data: { announcementId: announcement.id },
      })),
    });
  }

  revalidatePath("/announcements");
  return { ok: true };
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const a = await prisma.announcement.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true },
  });
  if (!a) return { ok: false, error: "Announcement not found." };
  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/announcements");
  return { ok: true };
}
