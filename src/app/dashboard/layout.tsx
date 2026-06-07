import { AppShell } from "@/components/layout/AppShell";
import { requireActiveUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireActiveUser();

  return (
    <AppShell role={user.role} userName={user.username}>
      {children}
    </AppShell>
  );
}
