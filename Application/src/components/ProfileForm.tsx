"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import type { Me } from "@/lib/client/useMe";
import { ErrorNote, Photo, postJSON } from "./ui";

const PROGRAMMES = ["B.Tech CSE", "B.Tech ECE", "B.Tech CSAM", "B.Tech CSD", "B.Tech CSB", "B.Tech CSSS", "B.Tech CSAI", "B.Tech EVE", "M.Tech CSE", "M.Tech ECE", "M.Tech CB", "PhD", "Other"];

/** Name, e-mail and photo are from IIITD Google (read-only); the rest the student fills once. */
export default function ProfileForm({ me, onSaved, submitLabel }: { me: Me; onSaved: () => void; submitLabel: string }) {
  const i = me.identity;
  const rollLocked = !!i.rollNo && /\d{2}\d{3}@/.test(i.email);
  const [f, setF] = useState({
    rollNo: i.rollNo ?? "",
    programme: i.programme ?? "",
    batch: i.batch ?? "",
    residence: (i.residence ?? "HOSTELLER") as "HOSTELLER" | "DAY_SCHOLAR",
    hostelRoom: i.hostelRoom ?? "",
    phone: i.phone ?? "",
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await postJSON("/api/student/profile", { ...f, rollNo: rollLocked ? undefined : f.rollNo, hostelRoom: f.residence === "HOSTELLER" ? f.hostelRoom : undefined });
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={save}>
      <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
        <Photo src={i.photoUrl} alt="Photo from IIITD account" className="h-16 w-16 shrink-0" />
        <div className="min-w-0">
          <div className="truncate font-bold">{i.fullName}</div>
          <div className="truncate text-sm text-slate-500">{i.email}</div>
          <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <Lock className="h-3 w-3" /> From your IIITD account
          </div>
        </div>
      </div>
      <ErrorNote msg={err} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pf-roll">Roll number</label>
          <input id="pf-roll" className="input" value={f.rollNo} disabled={rollLocked} onChange={(e) => setF({ ...f, rollNo: e.target.value.replace(/\D/g, "") })} placeholder="2021001" required />
          {rollLocked && <p className="mt-1 text-xs text-slate-500">Taken from your IIITD e-mail.</p>}
        </div>
        <div>
          <label className="label" htmlFor="pf-batch">Batch (year of joining)</label>
          <input id="pf-batch" className="input" value={f.batch} disabled={rollLocked} onChange={(e) => setF({ ...f, batch: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="2021" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pf-prog">Programme / branch</label>
        <select id="pf-prog" className="input" value={f.programme} onChange={(e) => setF({ ...f, programme: e.target.value })} required>
          <option value="">Select…</option>
          {PROGRAMMES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Residence</label>
        <div className="grid grid-cols-2 gap-2">
          {(["HOSTELLER", "DAY_SCHOLAR"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setF({ ...f, residence: r })} className={f.residence === r ? "btn-dark" : "btn-outline"}>
              {r === "HOSTELLER" ? "Hosteller" : "Day scholar"}
            </button>
          ))}
        </div>
      </div>
      {f.residence === "HOSTELLER" && (
        <div>
          <label className="label" htmlFor="pf-room">Hostel &amp; room</label>
          <input id="pf-room" className="input" value={f.hostelRoom} onChange={(e) => setF({ ...f, hostelRoom: e.target.value })} placeholder="e.g. BH-1, 304" required />
        </div>
      )}
      <div>
        <label className="label" htmlFor="pf-phone">Mobile number</label>
        <input id="pf-phone" className="input" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="98XXXXXXXX" required />
      </div>
      <p className="text-xs text-slate-500">These details appear to the guard on your gate scan and in the digital entry/exit register.</p>
      <button className="btn-primary btn-lg w-full" disabled={busy}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
