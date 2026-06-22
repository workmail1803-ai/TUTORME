import "server-only";
import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Tutor, Student, User } from "@prisma/client";
import { prisma } from "./prisma";
import { generateCode } from "./utils";

/**
 * Resolve the database User for the signed-in Clerk session, creating it on
 * first sight. In production the Clerk webhook keeps this row in sync; this
 * lazy upsert means the app also works before/without webhooks (e.g. local dev).
 *
 * Wrapped in React `cache` so repeated calls within one request hit the DB once.
 */
/**
 * Local demo mode: set DEV_AUTH=1 (non-production only) to browse the app as the
 * seeded demo tutor without configuring Clerk. Never active in production.
 */
const DEV_AUTH =
  process.env.DEV_AUTH === "1" && process.env.NODE_ENV !== "production";
const DEV_TUTOR_EMAIL = "demo.tutor@tutortrack.app";

export const getDbUser = cache(async function getDbUser() {
  if (DEV_AUTH) {
    return prisma.user.findUnique({
      where: { email: DEV_TUTOR_EMAIL },
      include: { tutor: true, student: true, parent: true },
    });
  }

  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { tutor: true, student: true, parent: true },
  });
  if (existing) return existing;

  const cu = await currentUser();
  if (!cu) return null;

  const email =
    cu.primaryEmailAddress?.emailAddress ??
    cu.emailAddresses[0]?.emailAddress ??
    `${userId}@no-email.local`;

  // Upsert by EMAIL (also unique) rather than clerkId. This re-links an existing
  // account to a new Clerk ID — e.g. when the same person signs in under the
  // production Clerk instance after a row was created under the dev instance —
  // instead of inserting a duplicate email and hitting the unique constraint.
  return prisma.user.upsert({
    where: { email },
    update: {
      clerkId: userId,
      firstName: cu.firstName,
      lastName: cu.lastName,
      imageUrl: cu.imageUrl,
    },
    create: {
      clerkId: userId,
      email,
      firstName: cu.firstName,
      lastName: cu.lastName,
      imageUrl: cu.imageUrl,
    },
    include: { tutor: true, student: true, parent: true },
  });
});

export async function requireUser() {
  const user = await getDbUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Generate an invite code that is not already taken by another tutor. */
async function uniqueTutorInviteCode() {
  for (let i = 0; i < 8; i++) {
    const code = generateCode(6);
    const taken = await prisma.tutor.findUnique({ where: { inviteCode: code } });
    if (!taken) return code;
  }
  // Fall back to a longer code on the (astronomically unlikely) repeated clash.
  return generateCode(10);
}

/**
 * Require a tutor context. Auto-provisions a Tutor profile for TUTOR-role users
 * who don't have one yet, so a freshly signed-up tutor lands straight on their
 * dashboard. Non-tutor users are sent to onboarding.
 */
export async function requireTutor(): Promise<{ user: User; tutor: Tutor }> {
  const user = await requireUser();

  if (user.tutor) return { user, tutor: user.tutor };

  if (user.role === "TUTOR") {
    const tutor = await prisma.tutor.create({
      data: { userId: user.id, inviteCode: await uniqueTutorInviteCode() },
    });
    return { user, tutor };
  }

  redirect("/onboarding");
}

/** Require a student context (a Student profile linked to this login). */
export async function requireStudent(): Promise<{ user: User; student: Student }> {
  const user = await requireUser();
  if (user.student) return { user, student: user.student };
  redirect("/onboarding");
}
