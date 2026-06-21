import { requireTutor } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { DEV_AUTH } from "@/lib/dev-auth";

export default async function TutorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tutor } = await requireTutor();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <AppShell
      variant="tutor"
      inviteCode={tutor.inviteCode}
      showUserButton={!DEV_AUTH}
      userName={name}
    >
      {children}
    </AppShell>
  );
}
