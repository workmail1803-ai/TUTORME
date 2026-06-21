import type { Metadata } from "next";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { AssignHomeworkButton } from "@/components/homework/assign-homework-button";
import {
  HomeworkItem,
  type HomeworkItemData,
} from "@/components/homework/homework-item";

export const metadata: Metadata = { title: "Homework" };

export default async function HomeworkPage() {
  const { tutor } = await requireTutor();
  const now = new Date();

  const [students, rows] = await Promise.all([
    prisma.student.findMany({
      where: { tutorId: tutor.id, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.homework.findMany({
      where: { tutorId: tutor.id },
      include: { student: { select: { name: true } } },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const items: (HomeworkItemData & { _overdue: boolean })[] = rows.map((h) => {
    const overdue =
      h.status !== "COMPLETED" && !!h.dueDate && h.dueDate < now;
    return {
      id: h.id,
      title: h.title,
      description: h.description,
      studentName: h.student.name,
      dueLabel: h.dueDate ? format(h.dueDate, "MMM d") : null,
      priority: h.priority,
      status: overdue ? "OVERDUE" : h.status,
      _overdue: overdue,
    };
  });

  const overdue = items.filter((i) => i._overdue);
  const pending = items.filter((i) => !i._overdue && i.status !== "COMPLETED");
  const completed = items.filter((i) => i.status === "COMPLETED");

  const Section = ({
    title,
    list,
  }: {
    title: string;
    list: HomeworkItemData[];
  }) =>
    list.length === 0 ? null : (
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          {title} ({list.length})
        </h2>
        <div className="space-y-2">
          {list.map((hw) => (
            <HomeworkItem key={hw.id} hw={hw} />
          ))}
        </div>
      </section>
    );

  return (
    <>
      <PageHeader
        title="Homework"
        description="Assign and track work across all your students."
      >
        <AssignHomeworkButton students={students} />
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No homework yet"
          description="Assign your first task and track completion here."
        >
          <AssignHomeworkButton students={students} />
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <Section title="Overdue" list={overdue} />
          <Section title="Pending" list={pending} />
          <Section title="Completed" list={completed} />
        </div>
      )}
    </>
  );
}
