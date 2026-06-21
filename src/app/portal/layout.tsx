import { requireStudent } from "@/lib/auth";
import { AppShell } from "@/components/app-shell/app-shell";
import { DEV_AUTH } from "@/lib/dev-auth";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireStudent();
  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  return (
    <AppShell variant="student" showUserButton={!DEV_AUTH} userName={name}>
      {children}
    </AppShell>
  );
}
