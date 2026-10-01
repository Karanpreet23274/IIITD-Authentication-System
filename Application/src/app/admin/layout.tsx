import AppShell from "@/components/AppShell";
import { pageAdmin } from "@/lib/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await pageAdmin();
  return (
    <AppShell
      title={u.name}
      subtitle={`Admin · ${u.email}`}
      wide
      nav={[
        { href: "/admin", label: "Guards & admins" },
        { href: "/admin/students", label: "Students" },
        { href: "/admin/alerts", label: "Alerts & log check" },
        { href: "/guard/register", label: "Register" },
        { href: "/guard", label: "Scan (guard mode)" },
      ]}
    >
      {children}
    </AppShell>
  );
}
