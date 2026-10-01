"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { AlertTriangle, CircleDot, Loader2, LogIn, LogOut } from "lucide-react";
import QrScanner from "@/components/QrScanner";
import GuardResult, { type GuardView } from "@/components/GuardResult";
import GatePicker from "@/components/GatePicker";
import { ErrorNote, SuccessNote, fetcher, fmt, postJSON } from "@/components/ui";
import { useGate } from "@/lib/client/useGate";
import { bundleAgeMs, bundleUsable, cachedBundle, queueLength, refreshBundle, syncQueue, verifyOffline, type Bundle } from "@/lib/client/offline";

type Status = {
  gate: { id: string; name: string; enabled: boolean };
  counts: { in: number; out: number; denied: number };
  alerts: { id: string; ts: string; kind: string; message: string }[];
};
type Register = { rows: { id: string; ts: string; direction: "IN" | "OUT"; student: { fullName: string; rollNo: string | null } }[] };
type Mode = "AUTO" | "IN" | "OUT";

function age(ms: number) {
  if (!Number.isFinite(ms)) return "none";
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} m`;
}

export default function GuardScan() {
  const { gateId, ready, choose } = useGate();
  if (!ready) return null;
  if (!gateId) return <GatePicker onPick={choose} />;
  return <Scanner gateId={gateId} onChangeGate={() => choose(null)} />;
}

function Scanner({ gateId, onChangeGate }: { gateId: string; onChangeGate: () => void }) {
  const [netDown, setNetDown] = useState(false);
  const { data: st, mutate } = useSWR<Status>(`/api/gate/${gateId}/status`, fetcher, {
    refreshInterval: 5000,
    onError: () => setNetDown(true),
    onSuccess: () => setNetDown(false),
  });
  const { data: reg, mutate: mutateReg } = useSWR<Register>(`/api/guard/register?gate=${gateId}`, fetcher, { refreshInterval: 10000 });
  const [mode, setMode] = useState<Mode>("AUTO");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [queued, setQueued] = useState(0);
  const [result, setResult] = useState<GuardView | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());
  const offline = netDown || (typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    cachedBundle(gateId).then(setBundle);
    queueLength().then(setQueued);
  }, [gateId]);
  useEffect(() => {
    if (offline) return;
    const pull = () => refreshBundle(gateId).then(setBundle).catch(() => {});
    pull();
    syncQueue()
      .then((n) => {
        if (n) setNote(`${n} offline scan(s) uploaded to the register.`);
        setQueued(0);
      })
      .catch(() => {});
    const t = setInterval(pull, 10 * 60_000);
    return () => clearInterval(t);
  }, [offline, gateId]);

  const offlineExpired = offline && !bundleUsable(bundle);

  const handleScan = useCallback(
    async (raw: string) => {
      if (busy || result) return;
      setErr(null);
      setBusy(true);
      const direction = mode === "AUTO" ? null : mode;
      try {
        if (offline) {
          if (!bundle || !bundleUsable(bundle)) throw new Error("Offline too long — reconnect the tablet to the network.");
          const r = await verifyOffline(raw, bundle, direction);
          setQueued(await queueLength());
          setResult({
            decision: r.decision,
            seq: null,
            movementId: null,
            direction: r.direction,
            student: r.name ? { fullName: r.name, rollNo: r.rollNo ?? null, programme: null, batch: null, residence: null, hostelRoom: null, phone: null, photoUrl: null } : null,
            gateName: st?.gate.name ?? gateId,
            at: new Date().toISOString(),
            offline: true,
          });
        } else {
          const view = await postJSON<GuardView>("/api/scan/verify", { raw, gateId, direction });
          setResult(view);
          if ("vibrate" in navigator) navigator.vibrate?.(view.decision === "ALLOW" ? 60 : [120, 60, 120]);
          mutate();
          mutateReg();
        }
      } catch (e) {
        const m = (e as Error).message;
        if (m.includes("Failed to fetch") || m.includes("NetworkError")) setNetDown(true);
        setErr(m);
      } finally {
        setBusy(false);
      }
    },
    [busy, result, mode, offline, bundle, st, gateId, mutate, mutateReg],
  );

  async function notThisPerson(movementId: string) {
    try {
      await postJSON("/api/scan/not-this-person", { movementId });
      setResult((r) => (r ? { ...r, decision: "DENY_SUSPICIOUS", direction: null, movementId: null } : r));
      mutate();
      mutateReg();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl px-4 py-2 text-sm font-medium ${offline ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"}`}>
        <span className="flex items-center gap-1.5">
          <CircleDot className={`h-4 w-4 ${offline ? "text-warn" : "text-allow"}`} />
          {offline ? "OFFLINE — verifying on this device" : "ONLINE"}
        </span>
        {offline && <span>List age: {age(bundleAgeMs(bundle))}</span>}
        {queued > 0 && <span>Waiting to upload: {queued}</span>}
        <span className="font-bold">{st?.gate.name ?? gateId}</span>
        <button className="text-xs underline" onClick={onChangeGate}>
          change
        </button>
        <span className="ml-auto tabular-nums">{fmt(new Date(clock), "time")}</span>
      </div>

      <ErrorNote msg={err} />
      <SuccessNote msg={note} />
      {offlineExpired && <ErrorNote msg="Offline for too long: the verification list is out of date. Reconnect this device to the internet." />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="card min-h-[360px]">
          {result ? (
            <GuardResult view={result} onDone={() => setResult(null)} onNotThisPerson={notThisPerson} />
          ) : (
            <div className="flex h-full flex-col gap-5">
              <div>
                <div className="label">Record as</div>
                <div className="grid grid-cols-3 gap-2">
                  {(["AUTO", "IN", "OUT"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={mode === m ? "btn-dark btn-lg" : "btn-outline btn-lg"}>
                      {m === "AUTO" ? "Auto" : m === "IN" ? (
                        <>
                          <LogIn className="h-5 w-5" /> Entry
                        </>
                      ) : (
                        <>
                          <LogOut className="h-5 w-5" /> Exit
                        </>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Auto: if the student is inside, it records an exit; if outside, an entry.</p>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl bg-slate-100 py-8 text-center">
                {busy ? <Loader2 className="h-10 w-10 animate-spin text-brand" /> : <div className="text-2xl font-semibold text-slate-700">Scan the student&apos;s QR</div>}
                <div className="mt-1 text-sm text-slate-500">Only a live QR from the student&apos;s own phone is accepted</div>
              </div>
              <QrScanner onScan={handleScan} disabled={busy || !!result || offlineExpired} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Today at this gate</div>
            <div className="mt-2 grid grid-cols-3 text-center">
              <div>
                <div className="text-2xl font-bold text-allow">{st?.counts.in ?? "–"}</div>
                <div className="text-xs text-slate-500">entries</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700">{st?.counts.out ?? "–"}</div>
                <div className="text-xs text-slate-500">exits</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-deny">{st?.counts.denied ?? "–"}</div>
                <div className="text-xs text-slate-500">rejected</div>
              </div>
            </div>
          </div>

          {!!st?.alerts.length && (
            <div className="card">
              <div className="mb-2 text-xs font-bold uppercase tracking-wide text-deny">Alerts</div>
              <ul className="space-y-1.5 text-sm">
                {st.alerts.map((a) => (
                  <li key={a.id} className="flex gap-1.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-deny" />
                    <span>
                      {fmt(a.ts, "time")} · {a.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Latest at this gate</div>
              <Link href="/guard/register" className="text-xs font-semibold text-brand">
                Full register
              </Link>
            </div>
            <ul className="space-y-1.5 text-sm">
              {!reg?.rows.length && <li className="text-slate-500">No records yet today.</li>}
              {reg?.rows.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  {r.direction === "IN" ? <LogIn className="h-4 w-4 text-allow" /> : <LogOut className="h-4 w-4 text-sky-700" />}
                  <span className="truncate font-medium">{r.student.fullName}</span>
                  <span className="text-xs text-slate-500">{r.student.rollNo}</span>
                  <span className="ml-auto text-xs tabular-nums text-slate-500">{fmt(r.ts, "time")}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
