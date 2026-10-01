import AppShell from "@/components/AppShell";
import { pageGuard } from "@/lib/rbac";

export default async function GuardLayout({ children }: { children: React.ReactNode }) {
  const u = await pageGuard();
  const nav = [
    { href: "/guard", label: "Scan" },
    { href: "/guard/register", label: "Entry / exit register" },
    { href: "/guard/legend", label: "Help" },
  ];
  if (u.role === "ADMIN") nav.push({ href: "/admin", label: "Admin" });
  return (
    <AppShell title={u.name} subtitle={`Guard · ${u.email}`} wide nav={nav}>
      {children}
    </AppShell>
  );
}
