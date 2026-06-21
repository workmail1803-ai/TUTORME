import { z } from "zod";

const time = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");

export const scheduleSchema = z
  .object({
    studentId: z.string().min(1, "Pick a student"),
    subject: z.string().trim().max(120).optional().or(z.literal("")),
    location: z.string().trim().max(160).optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
    startTime: time,
    endTime: time,
    // Recurrence: selected weekdays (0=Sun..6=Sat). Empty => single session.
    weekdays: z.array(z.number().int().min(0).max(6)).default([]),
    untilDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type ScheduleInput = z.infer<typeof scheduleSchema>;

export const attendanceSchema = z.object({
  scheduleId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "RESCHEDULED", "CANCELLED"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
