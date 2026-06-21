import { z } from "zod";

/** Turns empty/blank strings into undefined so optional fields stay clean. */
const optionalString = (max = 255) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().trim().max(max).optional(),
  );

export const studentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: optionalString(40),
  parentPhone: optionalString(40),
  gradeClass: optionalString(60),
  school: optionalString(120),
  subject: optionalString(120),
  monthlyFee: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number().min(0, "Fee can't be negative").max(1_000_000).optional(),
  ),
  address: optionalString(255),
  notes: optionalString(2000),
});

// Input type: callers pass raw form strings; the schema coerces (e.g. fee).
export type StudentInput = z.input<typeof studentSchema>;
export type StudentParsed = z.infer<typeof studentSchema>;
