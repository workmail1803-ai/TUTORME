"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BookPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createHomework } from "@/server/actions/homework";

export function AssignHomeworkButton({
  students,
}: {
  students: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrors({});
    start(async () => {
      const res = await createHomework({
        studentId: String(fd.get("studentId") ?? ""),
        title: String(fd.get("title") ?? ""),
        description: String(fd.get("description") ?? ""),
        dueDate: String(fd.get("dueDate") ?? ""),
        priority: String(fd.get("priority") ?? "MEDIUM") as
          | "LOW"
          | "MEDIUM"
          | "HIGH",
        notes: "",
      });
      if (res.ok) {
        toast.success("Homework assigned");
        setOpen(false);
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
        <BookPlus className="size-4" /> Assign homework
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Assign homework">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="studentId">Student *</Label>
            <Select id="studentId" name="studentId" defaultValue="" required>
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

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Chapter 5 — exercises 1–10"
              required
            />
            {err("title")}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Instructions, page numbers, links…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select id="priority" name="priority" defaultValue="MEDIUM">
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
