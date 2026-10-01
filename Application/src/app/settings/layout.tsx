import AppShell from "@/components/AppShell";
import { pageUser } from "@/lib/rbac";
import { navFor } from "@/lib/nav";

const ROLE_LABEL = { STUDENT: "Student", GUARD: "Guard", ADMIN: "Admin" } as const;

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const u = await pageUser();
  return (
    <AppShell title={u.name} subtitle={`${ROLE_LABEL[u.role]} · ${u.email}`} nav={navFor(u.role)}>
      {children}
    </AppShell>
  );
}
