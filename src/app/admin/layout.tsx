import { AppShell } from "@/components/layout/AppShell";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <AppShell role={user.role} userName={user.username}>
      {children}
    </AppShell>
  );
}
