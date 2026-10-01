"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { ConfirmDialog, ErrorNote, Photo, StatusChip, fetcher, fmt, postJSON } from "@/components/ui";

type P = {
  id: string;
  fullName: string;
  email: string;
  rollNo: string | null;
  programme: string | null;
  batch: string | null;
  residence: string | null;
  hostelRoom: string | null;
  phone: string | null;
  presence: "IN" | "OUT" | null;
  presenceAt: string | null;
  profileComplete: boolean;
  photoUrl: string | null;
  pass: { status: string; reason: string | null; phoneEnrolled: boolean } | null;
};

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, mutate } = useSWR<{ people: P[] }>(`/api/admin/students?q=${encodeURIComponent(dq)}`, fetcher);
  const [target, setTarget] = useState<{ p: P; action: "block" | "unblock" } | null>(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!target) return;
    setErr(null);
    try {
      await postJSON("/api/admin/students", { identityId: target.p.id, action: target.action, reason: reason || (target.action === "unblock" ? "Reviewed and cleared" : "") });
      setTarget(null);
      setReason("");
      mutate();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Search name, roll no. or e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data?.people.map((p) => (
          <div key={p.id} className="card space-y-2 transition hover:border-brand hover:shadow-md">
            <Link href={`/admin/students/${p.id}`} className="block space-y-2" aria-label={`View ${p.fullName}'s profile`}>
            <div className="flex items-center gap-3">
              <Photo src={p.photoUrl} alt="" className="h-14 w-14 shrink-0" />
              <div className="min-w-0">
                <div className="truncate font-bold">{p.fullName}</div>
                <div className="truncate text-xs text-slate-500">{p.email}</div>
              </div>
            </div>
            <div className="text-sm text-slate-700">
              {p.rollNo ?? "—"} · {p.programme ?? "profile incomplete"} {p.batch}
              <br />
              {p.residence === "HOSTELLER" ? `Hosteller · ${p.hostelRoom}` : p.residence === "DAY_SCHOLAR" ? "Day scholar" : ""} {p.phone ? `· ${p.phone}` : ""}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`chip ${p.presence === "IN" ? "border-green-300 bg-green-50 text-green-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
                {p.presence === "IN" ? "On campus" : p.presence === "OUT" ? "Outside" : "No record"}
              </span>
              {p.pass ? <StatusChip status={p.pass.status} /> : <span className="chip border-slate-300">no pass</span>}
              {p.pass && !p.pass.phoneEnrolled && <span className="chip border-amber-300 bg-amber-50 text-amber-800">no phone</span>}
              {p.presenceAt && <span className="text-slate-500">since {fmt(p.presenceAt)}</span>}
            </div>
            <div className="flex items-center justify-end gap-1 text-xs font-semibold text-brand">
              View full profile <ChevronRight className="h-3.5 w-3.5" />
            </div>
            </Link>
            {p.pass?.status === "ACTIVE" && (
              <button className="btn-outline w-full text-xs text-deny" onClick={() => setTarget({ p, action: "block" })}>
                Block pass
              </button>
            )}
            {p.pass?.status === "BLOCKED" && (
              <button className="btn-outline w-full text-xs" onClick={() => setTarget({ p, action: "unblock" })}>
                Unblock ({p.pass.reason})
              </button>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!target}
        title={`${target?.action === "block" ? "Block" : "Unblock"} ${target?.p.fullName}'s pass?`}
        effects={target?.action === "block" ? ["Their QR will be rejected at every gate immediately.", "They are told to visit the Security Office."] : ["Their QR will work again."]}
        danger={target?.action === "block"}
        confirmLabel={target?.action === "block" ? "Block" : "Unblock"}
        onConfirm={run}
        onCancel={() => setTarget(null)}
      >
        <ErrorNote msg={err} />
        {target?.action === "block" && (
          <div>
            <label className="label">Reason</label>
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Disciplinary hold" />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
