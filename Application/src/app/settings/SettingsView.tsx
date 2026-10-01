"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { signOut } from "next-auth/react";
import { CheckCircle2, ChevronRight, DoorOpen, LogOut, Monitor, Moon, RotateCcw, Shield, Smartphone, Sun, Type } from "lucide-react";
import { usePrefs, type TextSize, type Theme } from "@/lib/client/prefs";
import { InstallAppCard, clearSavedPages, usePwa } from "@/components/Pwa";
import { fetcher } from "@/components/ui";

const ROLE_LABEL = { STUDENT: "Student", GUARD: "Guard", ADMIN: "Admin" } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; icon?: React.ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-1 rounded-xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition ${on ? "bg-surface text-slate-900 shadow" : "text-slate-500 hover:text-slate-800"}`}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SettingsView({ name, email, role, build }: { name: string; email: string; role: "STUDENT" | "GUARD" | "ADMIN"; build: string }) {
  const { theme, text, setTheme, setText } = usePrefs();
  const { installed } = usePwa();
  const isStaff = role !== "STUDENT";
  const [gateId, setGateId] = useState<string | null>(null);
  const [reset, setReset] = useState(false);
  const { data: gates } = useSWR<{ gates: { id: string; name: string; enabled: boolean }[] }>(isStaff ? "/api/gates" : null, fetcher);

  useEffect(() => {
    try {
      setGateId(localStorage.getItem("guard-gate"));
    } catch {}
  }, []);

  const chooseGate = (id: string) => {
    try {
      if (id) localStorage.setItem("guard-gate", id);
      else localStorage.removeItem("guard-gate");
    } catch {}
    setGateId(id || null);
  };

  async function resetDevice() {
    try {
      for (const k of ["theme", "textSize", "install-dismissed", "guard-gate"]) localStorage.removeItem(k);
      sessionStorage.clear();
      if ("caches" in window) for (const k of await caches.keys()) await caches.delete(k);
    } catch {}
    setTheme("system");
    setText("normal");
    setGateId(null);
    setReset(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Section title="Appearance">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-800">Theme</div>
          <Segmented<Theme>
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: "system", label: "System", icon: <Monitor className="h-4 w-4" /> },
              { value: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
              { value: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
            ]}
          />
          <p className="text-xs text-slate-500">System follows your phone&apos;s light or dark setting.</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Type className="h-4 w-4" /> Text size
          </div>
          <Segmented<TextSize>
            label="Text size"
            value={text}
            onChange={setText}
            options={[
              { value: "normal", label: "Normal" },
              { value: "large", label: "Large" },
              { value: "xl", label: "Extra large" },
            ]}
          />
          <p className="text-xs text-slate-500">Makes all text and buttons bigger on this device.</p>
        </div>
      </Section>

      <Section title="This device">
        {isStaff && (
          <div className="flex items-center gap-3">
            <DoorOpen className="h-5 w-5 shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <label htmlFor="gate-select" className="text-sm font-semibold text-slate-800">
                Gate for scanning
              </label>
              <div className="text-xs text-slate-500">Every scan on this device is recorded at this gate.</div>
            </div>
            <select id="gate-select" className="input w-auto" value={gateId ?? ""} onChange={(e) => chooseGate(e.target.value)}>
              <option value="">Not set</option>
              {gates?.gates.map((g) => (
                <option key={g.id} value={g.id} disabled={!g.enabled}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {role === "STUDENT" && (
          <Link href="/student/profile" className="flex items-center gap-3 rounded-xl py-1 hover:opacity-80">
            <Smartphone className="h-5 w-5 shrink-0 text-slate-500" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-800">Enrolled phone</div>
              <div className="text-xs text-slate-500">Change phone or report it lost</div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>
        )}
        {installed ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-allow" />
            <div className="text-sm font-semibold text-slate-800">Installed as an app on this device</div>
          </div>
        ) : (
          <InstallAppCard compact />
        )}
        <div className="flex items-center gap-3">
          <RotateCcw className="h-5 w-5 shrink-0 text-slate-500" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-800">Reset this device</div>
            <div className="text-xs text-slate-500">Clears display settings{isStaff ? ", the chosen gate" : ""} and saved files. Your account and enrolled phone are kept.</div>
          </div>
          <button className="btn-outline shrink-0 px-3 py-2 text-xs" onClick={resetDevice}>
            {reset ? "Done" : "Reset"}
          </button>
        </div>
      </Section>

      <Section title="Account">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Name</dt>
          <dd className="truncate font-semibold text-slate-900">{name}</dd>
          <dt className="text-slate-500">E-mail</dt>
          <dd className="truncate font-semibold text-slate-900">{email}</dd>
          <dt className="text-slate-500">Role</dt>
          <dd>
            <span className="chip border-teal-300 bg-teal-50 text-teal-800">{ROLE_LABEL[role]}</span>
          </dd>
        </dl>
        <p className="text-xs text-slate-500">Your name, e-mail and photo come from your IIITD Google account.</p>
        <button
          className="btn-outline w-full text-deny"
          onClick={() => {
            clearSavedPages();
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </Section>

      <Section title="About">
        <Link href="/privacy-notice" className="flex items-center gap-3 hover:opacity-80">
          <Shield className="h-5 w-5 shrink-0 text-slate-500" />
          <div className="flex-1 text-sm font-semibold text-slate-800">Privacy notice: what is stored and who can see it</div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
        <div className="text-xs text-slate-500">IIITD Gate Entry · version {build}</div>
      </Section>
    </div>
  );
}
