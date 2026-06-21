"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { WEEKDAYS } from "@/lib/constants";
import { createSchedule } from "@/server/actions/schedules";

type StudentOption = { id: string; name: string };

export function AddClassButton({
  students,
  defaultStudentId,
}: {
  students: StudentOption[];
  defaultStudentId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [weekdays, setWeekdays] = React.useState<number[]>([]);

  function toggleDay(v: number) {
    setWeekdays((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    start(async () => {
      const res = await createSchedule({
        studentId: String(fd.get("studentId") ?? ""),
        subject: String(fd.get("subject") ?? ""),
        location: String(fd.get("location") ?? ""),
        notes: String(fd.get("notes") ?? ""),
        date: String(fd.get("date") ?? ""),
        startTime: String(fd.get("startTime") ?? ""),
        endTime: String(fd.get("endTime") ?? ""),
        weekdays,
        untilDate: String(fd.get("untilDate") ?? ""),
      });
      if (res.ok) {
        toast.success(
          res.data?.count && res.data.count > 1
            ? `${res.data.count} classes scheduled`
            : "Class scheduled",
        );
        setOpen(false);
        setWeekdays([]);
        router.refresh();
      } else {
        if (res.fieldErrors) setErrors(res.fieldErrors);
        toast.error(res.error);
      }
    });
  }

  const err = (k: string) =>
    errors[k]?.[0] ? (
      <p className="text-xs text-destructive">{errors[k][0]}</p>
    ) : null;

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={students.length === 0}>
        <CalendarPlus className="size-4" /> Add class
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule a class"
        description="Add a one-off session or a recurring weekly class."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student *</Label>
            <Select
              id="studentId"
              name="studentId"
              defaultValue={defaultStudentId ?? ""}
              required
            >
              <option value="" disabled>
                Select a student…
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {err("studentId")}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" placeholder="Maths" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="Online / Home" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" name="date" type="date" required />
              {err("date")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue="19:00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue="20:00"
                required
              />
              {err("endTime")}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Repeat weekly on</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                    weekdays.includes(d.value)
                      ? "border-primary bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {weekdays.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="untilDate">Repeat until</Label>
                <Input id="untilDate" name="untilDate" type="date" />
                <p className="text-xs text-muted-foreground">
                  Leave blank to repeat for 8 weeks.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" placeholder="Optional" />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
