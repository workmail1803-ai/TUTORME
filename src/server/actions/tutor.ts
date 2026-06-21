"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/server/actions/students";

const profileSchema = z.object({
  headline: z.string().trim().max(120).optional().or(z.literal("")),
  bio: z.string().trim().max(1000).optional().or(z.literal("")),
  subjects: z.string().trim().max(400).optional().or(z.literal("")),
  timezone: z.string().trim().max(60).optional().or(z.literal("")),
  hourlyRate: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(0).max(100000).optional(),
  ),
});

// Use the schema's *input* type: callers pass raw form values (strings) that
// the schema coerces/validates.
export type ProfileInput = z.input<typeof profileSchema>;

export async function updateTutorProfile(
  input: ProfileInput,
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const d = parsed.data;

  await prisma.tutor.update({
    where: { id: tutor.id },
    data: {
      headline: d.headline || null,
      bio: d.bio || null,
      subjects: d.subjects
        ? d.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      timezone: d.timezone || "UTC",
      hourlyRate: d.hourlyRate ?? null,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}
