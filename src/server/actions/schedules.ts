"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  scheduleSchema,
  attendanceSchema,
  type ScheduleInput,
} from "@/lib/validations/schedule";
import type { ActionResult } from "@/server/actions/students";

const MAX_OCCURRENCES = 120;

function combine(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export async function createSchedule(
  input: ScheduleInput,
): Promise<ActionResult<{ count: number }>> {
  const { tutor } = await requireTutor();
  const parsed = scheduleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  // Confirm the student belongs to this tutor.
  const owned = await prisma.student.findFirst({
    where: { id: data.studentId, tutorId: tutor.id },
    select: { id: true },
  });
  if (!owned) return { ok: false, error: "Student not found." };

  const base = {
    tutorId: tutor.id,
    studentId: data.studentId,
    subject: data.subject || null,
    location: data.location || null,
    notes: data.notes || null,
  };

  // Build the list of (start,end) occurrences.
  const occurrences: { startTime: Date; endTime: Date }[] = [];

  if (!data.weekdays.length) {
    occurrences.push({
      startTime: combine(data.date, data.startTime),
      endTime: combine(data.date, data.endTime),
    });
  } else {
    const start = combine(data.date, data.startTime);
    const until = data.untilDate
      ? combine(data.untilDate, "23:59")
      : addDays(start, 56); // default 8 weeks
    const wanted = new Set(data.weekdays);
    let cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= until && occurrences.length < MAX_OCCURRENCES) {
      if (wanted.has(cursor.getDay())) {
        const dStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
        occurrences.push({
          startTime: combine(dStr, data.startTime),
          endTime: combine(dStr, data.endTime),
        });
      }
      cursor = addDays(cursor, 1);
    }
  }

  if (!occurrences.length) {
    return { ok: false, error: "No class dates matched your selection." };
  }

  const seriesId = occurrences.length > 1 ? randomUUID() : null;
  await prisma.schedule.createMany({
    data: occurrences.map((o) => ({ ...base, ...o, seriesId })),
  });

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: true, data: { count: occurrences.length } };
}

export async function deleteSchedule(
  id: string,
  scope: "one" | "series" = "one",
): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const sched = await prisma.schedule.findFirst({
    where: { id, tutorId: tutor.id },
    select: { id: true, seriesId: true },
  });
  if (!sched) return { ok: false, error: "Class not found." };

  if (scope === "series" && sched.seriesId) {
    await prisma.schedule.deleteMany({
      where: { tutorId: tutor.id, seriesId: sched.seriesId },
    });
  } else {
    await prisma.schedule.delete({ where: { id } });
  }
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markAttendance(input: {
  scheduleId: string;
  status: "PRESENT" | "ABSENT" | "RESCHEDULED" | "CANCELLED";
  note?: string;
}): Promise<ActionResult> {
  const { tutor } = await requireTutor();
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid attendance data." };

  const schedule = await prisma.schedule.findFirst({
    where: { id: parsed.data.scheduleId, tutorId: tutor.id },
    select: { id: true, studentId: true },
  });
  if (!schedule) return { ok: false, error: "Class not found." };

  await prisma.attendance.upsert({
    where: { scheduleId: schedule.id },
    create: {
      scheduleId: schedule.id,
      studentId: schedule.studentId,
      status: parsed.data.status,
      note: parsed.data.note || null,
    },
    update: { status: parsed.data.status, note: parsed.data.note || null },
  });

  // Reflect the outcome on the session itself.
  const scheduleStatus =
    parsed.data.status === "CANCELLED"
      ? "CANCELLED"
      : parsed.data.status === "RESCHEDULED"
        ? "RESCHEDULED"
        : "COMPLETED";
  await prisma.schedule.update({
    where: { id: schedule.id },
    data: { status: scheduleStatus },
  });

  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  return { ok: true };
}
