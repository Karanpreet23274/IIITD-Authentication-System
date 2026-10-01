"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, ShieldCheck } from "lucide-react";

export type NavItem = { href: string; label: string };

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
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className={`mx-auto flex items-center gap-3 px-4 py-3 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
          <Link href="/" className="flex items-center gap-2 font-bold text-brand">
            <ShieldCheck className="h-6 w-6" aria-hidden />
            <span className="hidden sm:inline">IIITD Gate</span>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
            {subtitle && <div className="truncate text-xs text-slate-500">{subtitle}</div>}
          </div>
          {badge}
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="btn-outline px-3 py-2" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
        {nav.length > 0 && (
          <nav className={`mx-auto flex gap-1 overflow-x-auto px-4 pb-2 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>
            {nav.map((n) => {
              const active = n.href === path || (n.href !== nav[0].href && path.startsWith(n.href));
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-brand text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>
      <main className={`mx-auto px-4 py-5 ${wide ? "max-w-7xl" : "max-w-5xl"}`}>{children}</main>
    </div>
  );
}
