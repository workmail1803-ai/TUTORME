import type { Metadata } from "next";
import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Notes" };

export default async function PortalNotesPage() {
  const { student } = await requireStudent();
  // Only notes the tutor chose to share are visible to the student.
  const notes = await prisma.note.findMany({
    where: { studentId: student.id, visibility: "SHARED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Notes" description="Feedback from your tutor." />
      {notes.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No notes yet"
          description="Your tutor's feedback will show up here."
        />
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <Card key={n.id}>
              <CardContent className="pt-5">
                <p className="whitespace-pre-wrap text-sm">{n.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {format(n.createdAt, "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
