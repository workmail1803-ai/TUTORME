import type { Metadata } from "next";
import Link from "next/link";
import { Users, Phone, GraduationCap } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AddStudentButton } from "@/components/students/add-student-button";
import { StudentSearch } from "@/components/students/student-search";

export const metadata: Metadata = { title: "Students" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { tutor } = await requireTutor();
  const { q } = await searchParams;

  const students = await prisma.student.findMany({
    where: {
      tutorId: tutor.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subject: { contains: q, mode: "insensitive" } },
              { school: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { _count: { select: { schedules: true } } },
  });

  return (
    <>
      <PageHeader
        title="Students"
        description="Everyone you tutor, in one roster."
      >
        <AddStudentButton />
      </PageHeader>

      <div className="mb-4">
        <StudentSearch />
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No matches" : "No students yet"}
          description={
            q
              ? "Try a different search term."
              : "Add your first student to start scheduling classes and tracking progress."
          }
        >
          {!q && <AddStudentButton />}
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <Link key={s.id} href={`/students/${s.id}`}>
              <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-medium">{s.name}</p>
                      {s.status === "ARCHIVED" && (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      {[s.subject, s.gradeClass].filter(Boolean).join(" · ") ||
                        "No subject set"}
                    </p>
                    {s.phone && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Phone className="size-3.5" />
                        {s.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>{s._count.schedules} classes</span>
                  <span className="font-medium text-foreground">
                    {s.monthlyFee
                      ? `${formatCurrency(Number(s.monthlyFee))}/mo`
                      : "No fee set"}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
