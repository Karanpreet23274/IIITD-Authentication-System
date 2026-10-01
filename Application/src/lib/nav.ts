import type { AppRole } from "@prisma/client";

// Menu items per area. `icon` names a lucide icon resolved in AppShell.
export type NavItem = { href: string; label: string; icon: NavIcon };
export type NavIcon = "home" | "qr" | "history" | "profile" | "scan" | "register" | "help" | "admin" | "students" | "alerts";

export const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Home", icon: "home" },
  { href: "/student/pass", label: "My QR pass", icon: "qr" },
  { href: "/student/history", label: "My entries & exits", icon: "history" },
  { href: "/student/profile", label: "Profile & phone", icon: "profile" },
];

export function guardNav(role: AppRole): NavItem[] {
  const items: NavItem[] = [
    { href: "/guard", label: "Scan", icon: "scan" },
    { href: "/guard/register", label: "Entry / exit register", icon: "register" },
    { href: "/guard/legend", label: "Help", icon: "help" },
  ];
  if (role === "ADMIN") items.push({ href: "/admin", label: "Admin", icon: "admin" });
  return items;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Guards & admins", icon: "admin" },
  { href: "/admin/students", label: "Students", icon: "students" },
  { href: "/admin/alerts", label: "Alerts & log check", icon: "alerts" },
  { href: "/guard/register", label: "Register", icon: "register" },
  { href: "/guard", label: "Scan (guard mode)", icon: "scan" },
];

export function navFor(role: AppRole): NavItem[] {
  if (role === "ADMIN") return ADMIN_NAV;
  if (role === "GUARD") return guardNav(role);
  return STUDENT_NAV;
}
