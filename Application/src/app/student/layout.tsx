import AppShell from "@/components/AppShell";
import { pageUser } from "@/lib/rbac";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const u = await pageUser();
  return (
    <AppShell
      title={u.name}
      subtitle={u.email}
      nav={[
        { href: "/student", label: "Home" },
        { href: "/student/pass", label: "My QR pass" },
        { href: "/student/history", label: "My entries & exits" },
        { href: "/student/profile", label: "Profile & phone" },
      ]}
    >
      {children}
    </AppShell>
  );
}
