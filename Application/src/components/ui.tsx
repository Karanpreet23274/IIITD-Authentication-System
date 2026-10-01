"use client";

import { useState } from "react";
import { AlertTriangle, Check, X, UserRound } from "lucide-react";

export type Tone = "allow" | "warn" | "deny" | "neutral";

const toneClasses: Record<Tone, string> = {
  allow: "bg-allow text-white",
  warn: "bg-warn text-white",
  deny: "bg-deny text-white",
  neutral: "bg-slate-600 text-white",
};

export function ToneIcon({ tone, className = "h-8 w-8" }: { tone: Tone; className?: string }) {
  if (tone === "allow") return <Check className={className} strokeWidth={3} aria-hidden />;
  if (tone === "warn") return <AlertTriangle className={className} strokeWidth={2.5} aria-hidden />;
  return <X className={className} strokeWidth={3} aria-hidden />;
}

/** Colour + icon + word — never colour alone (USE-08). Bilingual (USE-09). */
export function DecisionBand({ tone, title, titleHi, big = false }: { tone: Tone; title: string; titleHi?: string; big?: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 ${big ? "py-6" : "py-4"} ${toneClasses[tone]}`} role="status" aria-live="assertive">
      <ToneIcon tone={tone} className={big ? "h-12 w-12 shrink-0" : "h-8 w-8 shrink-0"} />
      <div>
        <div className={`font-extrabold tracking-tight ${big ? "text-3xl sm:text-4xl" : "text-2xl"}`}>{title}</div>
        {titleHi && <div className={`font-medium opacity-90 ${big ? "text-lg" : "text-sm"}`}>{titleHi}</div>}
      </div>
    </div>
  );
}

export function NextStep({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-2xl border-2 border-slate-300 bg-slate-50 p-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Next step · अगला कदम</div>
      <ol className="space-y-1.5 text-base font-medium text-slate-900 sm:text-lg">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

export function Photo({ src, alt, className = "" }: { src?: string | null; alt: string; className?: string }) {
  if (!src)
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-slate-200 text-slate-400 ${className}`}>
        <UserRound className="h-1/2 w-1/2" aria-hidden />
        <span className="sr-only">{alt}</span>
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`rounded-2xl object-cover ${className}`} draggable={false} />;
}

const statusTone: Record<string, string> = {
  ACTIVE: "border-green-300 bg-green-50 text-green-800",
  APPROVED: "border-green-300 bg-green-50 text-green-800",
  OK: "border-green-300 bg-green-50 text-green-800",
  ONLINE: "border-green-300 bg-green-50 text-green-800",
  ISSUED: "border-sky-300 bg-sky-50 text-sky-800",
  REQUESTED: "border-sky-300 bg-sky-50 text-sky-800",
  PENDING: "border-sky-300 bg-sky-50 text-sky-800",
  READY: "border-green-300 bg-green-50 text-green-800",
  SUSPENDED: "border-amber-300 bg-amber-50 text-amber-800",
  EXPIRED: "border-amber-300 bg-amber-50 text-amber-800",
  OFFLINE: "border-amber-300 bg-amber-50 text-amber-800",
  MANUAL: "border-amber-300 bg-amber-50 text-amber-800",
  OPEN: "border-red-300 bg-red-50 text-red-800",
  REVOKED: "border-red-300 bg-red-50 text-red-800",
  BLOCKED: "border-red-300 bg-red-50 text-red-800",
  DECLINED: "border-red-300 bg-red-50 text-red-800",
  EMERGENCY: "border-red-300 bg-red-50 text-red-800",
  FAULT: "border-red-300 bg-red-50 text-red-800",
  TAMPER: "border-red-300 bg-red-50 text-red-800",
  NO_POWER: "border-red-300 bg-red-50 text-red-800",
};

export function StatusChip({ status }: { status: string }) {
  return <span className={`chip ${statusTone[status] ?? "border-slate-300 bg-slate-50 text-slate-700"}`}>{status.replace("_", " ")}</span>;
}

export function RoleChip({ role }: { role: string }) {
  return <span className="chip border-slate-400 bg-white px-3 py-1 text-sm text-slate-800">{role}</span>;
}

export function ErrorNote({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {msg}
    </div>
  );
}

export function SuccessNote({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{msg}</div>;
}

/**
 * Confirm dialog stating the exact effect (USE-10). With `typed`, the user must type a
 * word (e.g. DISABLE / REVOKE) for irreversible actions.
 */
export function ConfirmDialog({
  open,
  title,
  effects,
  typed,
  confirmLabel,
  danger = false,
  children,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  effects: string[];
  typed?: string;
  confirmLabel: string;
  danger?: boolean;
  children?: React.ReactNode;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  if (!open) return null;
  const ok = !typed || text.trim().toUpperCase() === typed;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
        <h2 className="text-lg font-bold">{title}</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {effects.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
        {children && <div className="mt-4 space-y-3">{children}</div>}
        {typed && (
          <div className="mt-4">
            <label className="label" htmlFor="typed-confirm">
              Type {typed} to confirm
            </label>
            <input id="typed-confirm" className="input font-mono" value={text} onChange={(e) => setText(e.target.value)} placeholder={typed} autoComplete="off" />
          </div>
        )}
        <div className="mt-5 grid gap-2">
          <button
            className={danger ? "btn-danger btn-lg" : "btn-dark btn-lg"}
            disabled={!ok || busy}
            onClick={() => {
              onConfirm();
              setText("");
            }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
          <button
            className="btn-outline btn-lg"
            onClick={() => {
              setText("");
              onCancel();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export async function postJSON<T = unknown>(url: string, body?: unknown, method = "POST"): Promise<T> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data;
};

export function fmt(d: string | Date | null | undefined, opts: "datetime" | "time" | "date" = "datetime") {
  if (!d) return "—";
  const o: Intl.DateTimeFormatOptions =
    opts === "time"
      ? { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }
      : opts === "date"
        ? { day: "2-digit", month: "short", year: "numeric" }
        : { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false };
  return new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...o });
}
