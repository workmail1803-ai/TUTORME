import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ProfileForm } from "@/components/settings/profile-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, tutor } = await requireTutor();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your tutor profile and account."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Tutor profile</CardTitle>
              <CardDescription>
                This information appears to students you invite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                initial={{
                  headline: tutor.headline ?? "",
                  bio: tutor.bio ?? "",
                  subjects: tutor.subjects.join(", "),
                  timezone: tutor.timezone,
                  hourlyRate: tutor.hourlyRate ? String(tutor.hourlyRate) : "",
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">Tutor</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invite code</CardTitle>
              <CardDescription>Share with students to let them join.</CardDescription>
            </CardHeader>
            <CardContent>
              <code className="font-mono text-2xl font-bold tracking-widest text-primary">
                {tutor.inviteCode}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
