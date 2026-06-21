"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeworkBadge } from "@/components/attendance-badge";
import { setHomeworkStatus, deleteHomework } from "@/server/actions/homework";
import type { HomeworkStatus } from "@prisma/client";

export type HomeworkItemData = {
  id: string;
  title: string;
  description: string | null;
  studentName: string;
  dueLabel: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: HomeworkStatus;
};

const priorityVariant = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
} as const;

export function HomeworkItem({ hw }: { hw: HomeworkItemData }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const done = hw.status === "COMPLETED";

  function toggle() {
    start(async () => {
      const res = await setHomeworkStatus(hw.id, done ? "PENDING" : "COMPLETED");
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }

  function remove() {
    start(async () => {
      const res = await deleteHomework(hw.id);
      if (res.ok) {
        toast.success("Homework deleted");
        router.refresh();
      } else toast.error(res.error);
    });
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <button
        onClick={toggle}
        disabled={pending}
        aria-label={done ? "Mark pending" : "Mark complete"}
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
          done
            ? "border-success bg-success text-success-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        }`}
      >
        {done && <Check className="size-3" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}
          >
            {hw.title}
          </p>
          <Badge variant={priorityVariant[hw.priority]}>{hw.priority}</Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {hw.studentName}
          {hw.dueLabel ? ` · due ${hw.dueLabel}` : ""}
        </p>
        {hw.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {hw.description}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <HomeworkBadge status={hw.status} />
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={toggle}
          disabled={pending}
          aria-label="Toggle status"
        >
          {done ? <RotateCcw className="size-3.5" /> : <Check className="size-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:bg-destructive/10"
          onClick={remove}
          disabled={pending}
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
