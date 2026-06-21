import type { Metadata } from "next";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeworkBadge } from "@/components/attendance-badge";

export const metadata: Metadata = { title: "Homework" };

const priorityVariant = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
} as const;

export default async function PortalHomeworkPage() {
  const { student } = await requireStudent();
  const now = new Date();
  const rows = await prisma.homework.findMany({
    where: { studentId: student.id },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return (
    <>
      <PageHeader title="Homework" description="Everything your tutor assigned." />
      {rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No homework"
          description="You don't have any homework right now."
        />
      ) : (
        <div className="space-y-2">
          {rows.map((h) => {
            const overdue =
              h.status !== "COMPLETED" && !!h.dueDate && h.dueDate < now;
            return (
              <Card key={h.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{h.title}</p>
                      <Badge variant={priorityVariant[h.priority]}>
                        {h.priority}
                      </Badge>
                    </div>
                    {h.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {h.description}
                      </p>
                    )}
                    {h.dueDate && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Due {format(h.dueDate, "EEE, MMM d")}
                      </p>
                    )}
                  </div>
                  <HomeworkBadge status={overdue ? "OVERDUE" : h.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
