import AppShell from "@/components/AppShell";
import { pageGuard } from "@/lib/rbac";
import { guardNav } from "@/lib/nav";

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  const u = await pageGuard();
  return (
    <AppShell title={u.name} subtitle={`Guard · ${u.email}`} wide nav={guardNav(u.role)}>
      {children}
    </AppShell>
  );
}
