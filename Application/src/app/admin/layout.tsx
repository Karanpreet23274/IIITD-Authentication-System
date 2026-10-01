import AppShell from "@/components/AppShell";
import { pageAdmin } from "@/lib/rbac";
import { ADMIN_NAV } from "@/lib/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await pageAdmin();
  return (
    <AppShell title={u.name} subtitle={`Admin · ${u.email}`} wide nav={ADMIN_NAV}>
      {children}
    </AppShell>
  );
}
