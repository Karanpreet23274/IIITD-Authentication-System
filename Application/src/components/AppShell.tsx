"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  History,
  Home,
  LogOut,
  Menu,
  Moon,
  QrCode,
  ScanLine,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon, NavItem } from "@/lib/nav";
import { usePrefs } from "@/lib/client/prefs";
import { clearSavedPages } from "./Pwa";

const ICONS: Record<NavIcon, LucideIcon> = {
  home: Home,
  qr: QrCode,
  history: History,
  profile: UserRound,
  scan: ScanLine,
  register: ClipboardList,
  help: HelpCircle,
  admin: Users,
  students: GraduationCap,
  alerts: AlertTriangle,
};

/** The nav item whose href is the longest prefix of the current path. */
function activeHref(path: string, items: { href: string }[]) {
  return items
    .filter((n) => path === n.href || path.startsWith(n.href + "/"))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/**
 * App frame: top bar with a ☰ menu button, current page name and a light/dark toggle.
 * The menu slides in from the left with the user's sections, Settings and Sign out.
 */
export default function AppShell({
  title,
  subtitle,
  nav = [],
  badge,
  wide = false,
  children,
}: {
  title: string;
  subtitle?: string;
  nav?: NavItem[];
  badge?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { isDark, setTheme } = usePrefs();

  const items = [...nav, { href: "/settings", label: "Settings", icon: "settings" as const }];
  const current = activeHref(path, items);
  const pageLabel = items.find((n) => n.href === current)?.label ?? "IIITD Gate";

  // Close on navigation and on Escape; lock page scroll while open.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const initial = (title.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/90 backdrop-blur">
        <div className={`mx-auto flex items-center gap-2 px-3 py-2.5 sm:px-4 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
          <button onClick={() => setOpen(true)} className="rounded-xl p-2 text-slate-700 hover:bg-slate-100" aria-label="Open menu" aria-expanded={open}>
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="hidden items-center gap-1.5 font-bold text-brand sm:flex" aria-label="IIITD Gate home">
            <ShieldCheck className="h-5 w-5" aria-hidden />
            IIITD Gate
            <span className="mx-1 text-slate-300">/</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold text-slate-900">{pageLabel}</div>
            <div className="truncate text-xs text-slate-500">
              {title}
              {subtitle ? ` · ${subtitle}` : ""}
            </div>
          </div>
          {badge}
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-fade_in bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] animate-slide_in flex-col bg-surface shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">{initial}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-slate-900">{title}</div>
                {subtitle && <div className="truncate text-xs text-slate-500">{subtitle}</div>}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-2" aria-label="Main">
              {nav.map((n) => {
                const Icon = ICONS[n.icon];
                const active = n.href === current;
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium ${active ? "bg-teal-50 text-brand" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {n.label}
                  </Link>
                );
              })}
              <div className="my-2 border-t border-slate-200" />
              <Link
                href="/settings"
                aria-current={current === "/settings" ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium ${current === "/settings" ? "bg-teal-50 text-brand" : "text-slate-700 hover:bg-slate-100"}`}
              >
                <Settings className="h-5 w-5 shrink-0" />
                Settings
              </Link>
            </nav>

            <div className="border-t border-slate-200 p-2">
              <button
                onClick={() => {
                  clearSavedPages();
                  signOut({ callbackUrl: "/login" });
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium text-deny hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <main className={`mx-auto px-4 py-5 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</main>
    </div>
  );
}
