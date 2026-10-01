import AppShell from "@/components/AppShell";
import { pageUser } from "@/lib/rbac";
import { STUDENT_NAV } from "@/lib/nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const u = await pageUser();
  return (
    <AppShell title={u.name} subtitle={u.email} nav={STUDENT_NAV}>
      {children}
    </AppShell>
  );
}
