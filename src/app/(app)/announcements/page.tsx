import type { Metadata } from "next";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";
import { requireTutor } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import {
  AnnouncementButton,
  DeleteAnnouncementButton,
} from "@/components/announcements/announcement-ui";

export const metadata: Metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const { tutor } = await requireTutor();
  const announcements = await prisma.announcement.findMany({
    where: { tutorId: tutor.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Broadcast updates to all your students."
      >
        <AnnouncementButton />
      </PageHeader>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Post holidays, schedule changes or reminders — students get notified instantly."
        >
          <AnnouncementButton />
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {format(a.createdAt, "MMM d, yyyy · h:mm a")}
                    </p>
                  </div>
                  <DeleteAnnouncementButton id={a.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
