"use client";

import { useEffect, useState } from "react";
import type { Decision } from "@prisma/client";
import { LogIn, LogOut, X } from "lucide-react";
import { DECISION_COPY } from "@/lib/decisions";
import { DecisionBand, NextStep, Photo, fmt } from "./ui";

export type GuardView = {
  decision: Decision;
  seq: number | null;
  movementId: string | null;
  direction: "IN" | "OUT" | null;
  student: {
    fullName: string;
    rollNo: string | null;
    programme: string | null;
    batch: string | null;
    residence: "HOSTELLER" | "DAY_SCHOLAR" | null;
    hostelRoom: string | null;
    phone: string | null;
    email?: string;
    photoUrl: string | null;
  } | null;
  gateName: string;
  at: string;
  liveColour?: { name: string; hex: string };
  offline?: boolean;
  reason?: string | null;
};

const AUTO_CLEAR_MS = 6000;

/** What the guard sees after scanning: decision, ENTRY/EXIT, and the student's details. No "allow anyway" button. */
export default function GuardResult({ view, onDone, onNotThisPerson }: { view: GuardView; onDone: () => void; onNotThisPerson: (movementId: string) => Promise<void> }) {
  const copy = DECISION_COPY[view.decision];
  const allow = view.decision === "ALLOW";
  const [armed, setArmed] = useState(false);
  const [left, setLeft] = useState(AUTO_CLEAR_MS);

  useEffect(() => {
    if (!allow || armed) return;
    const start = Date.now();
    const t = setInterval(() => {
      const l = AUTO_CLEAR_MS - (Date.now() - start);
      setLeft(Math.max(0, l));
      if (l <= 0) onDone();
    }, 100);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allow, armed]);

  const s = view.student;
  return (
    <div className="space-y-4">
      {allow && view.direction ? (
        <div className={`flex items-center gap-4 rounded-2xl px-5 py-5 text-white ${view.direction === "IN" ? "bg-allow" : "bg-exit"}`} role="status" aria-live="assertive">
          {view.direction === "IN" ? <LogIn className="h-12 w-12 shrink-0" /> : <LogOut className="h-12 w-12 shrink-0" />}
          <div>
            <div className="text-3xl font-extrabold sm:text-4xl">{view.direction === "IN" ? "ENTRY RECORDED" : "EXIT RECORDED"}</div>
            <div className="text-base font-medium opacity-90">
              {view.direction === "IN" ? "प्रवेश दर्ज" : "निकास दर्ज"} · {fmt(view.at, "time")} · {view.gateName}
            </div>
          </div>
        </div>
      ) : (
        <DecisionBand tone={copy.tone} title={copy.guardTitle} titleHi={copy.guardTitleHi} big />
      )}
      {view.offline && <div className="rounded-xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-900">Verified OFFLINE: the record uploads when the network returns. No photo offline, so check the app photo.</div>}

      {s && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div>
            <Photo src={s.photoUrl} alt="Photo from IIITD account" className="aspect-square w-full border-4 border-slate-200" />
          </div>
          <div className="space-y-3">
            <div className="text-3xl font-extrabold tracking-tight">{s.fullName}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-base">
              <dt className="text-slate-500">Roll no.</dt>
              <dd className="font-semibold">{s.rollNo ?? "—"}</dd>
              <dt className="text-slate-500">Programme</dt>
              <dd className="font-semibold">
                {s.programme ?? "—"} {s.batch ? `· ${s.batch}` : ""}
              </dd>
              <dt className="text-slate-500">Residence</dt>
              <dd className="font-semibold">{s.residence === "HOSTELLER" ? `Hosteller · ${s.hostelRoom ?? ""}` : s.residence === "DAY_SCHOLAR" ? "Day scholar" : "—"}</dd>
              <dt className="text-slate-500">Mobile</dt>
              <dd className="font-semibold">{s.phone ?? "—"}</dd>
            </dl>
            {allow && view.liveColour && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="h-5 w-5 rounded-full border" style={{ background: view.liveColour.hex }} />
                Pass colour this minute: <b>{view.liveColour.name}</b> (should match the student&apos;s screen)
              </div>
            )}
          </div>
        </div>
      )}

      {!allow && view.reason && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Why</div>
          <div className="font-semibold text-slate-800">{view.reason}</div>
        </div>
      )}
      {!allow && !view.reason && <p className="text-base text-slate-700">{copy.guardBody}</p>}
      <NextStep steps={copy.nextStep} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {allow ? (
          <>
            <button className="btn-outline btn-lg" onClick={onDone}>
              Next {armed ? "" : `(${Math.ceil(left / 1000)} s)`}
            </button>
            {view.movementId && (
              <button
                className={`btn btn-lg ${armed ? "bg-deny text-white" : "border-2 border-deny bg-surface text-deny"} sm:min-w-56`}
                onClick={async () => {
                  if (!armed) return setArmed(true);
                  await onNotThisPerson(view.movementId!);
                }}
              >
                <X className="h-5 w-5" /> {armed ? "Tap again to confirm" : "Not this person"}
              </button>
            )}
          </>
        ) : (
          <button className="btn-dark btn-lg sm:min-w-40" onClick={onDone}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
