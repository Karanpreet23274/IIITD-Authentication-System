"use client";

import useSWR from "swr";
import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";
import { fetcher, fmt, postJSON } from "@/components/ui";

type Alerts = { alerts: { id: string; ts: string; gateId: string | null; kind: string; message: string; status: string; ackBy: string | null; student: string | null }[] };
type Verify = { ok: boolean; checked: number; brokenAt?: number; lastCheckpoint?: { ts: string; seq: number; valid: boolean } };

export default function AlertsPage() {
  const { data, mutate } = useSWR<Alerts>("/api/admin/alerts", fetcher, { refreshInterval: 10000 });
  const { data: v, mutate: reverify, isValidating } = useSWR<Verify>("/api/admin/verify", fetcher);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="card">
        <h1 className="flex items-center gap-2 text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-deny" /> Security alerts
        </h1>
        <p className="text-sm text-slate-500">A student with an open alert is held at SUSPICIOUS at the gate until you close it.</p>
        <ul className="mt-3 space-y-2">
          {!data?.alerts.length && <li className="text-sm text-slate-500">No alerts.</li>}
          {data?.alerts.map((a) => (
            <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${a.status === "OPEN" ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
              <div className="flex-1">
                <div className="font-semibold">
                  {fmt(a.ts)} · {a.kind.replace(/_/g, " ").toLowerCase()} {a.gateId ? `· ${a.gateId}` : ""}
                </div>
                <div className="text-slate-700">{a.message}</div>
                {a.student && <div className="text-slate-600">Student: {a.student}</div>}
              </div>
              {a.status === "OPEN" ? (
                <button
                  className="btn-outline px-2 py-1 text-xs"
                  onClick={async () => {
                    await postJSON("/api/admin/alerts", { id: a.id });
                    mutate();
                  }}
                >
                  Close
                </button>
              ) : (
                <span className="text-xs text-slate-400">closed by {a.ackBy}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="card h-fit space-y-3">
        <h2 className="font-bold">Scan-log tamper check</h2>
        <p className="text-sm text-slate-600">Every scan and admin action is chained with SHA-256 hashes and signed daily. Any edit or deletion breaks the chain.</p>
        {v && (
          <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${v.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {v.ok ? <ShieldCheck className="h-5 w-5" /> : <ShieldX className="h-5 w-5" />}
            {v.ok ? `Intact: ${v.checked} records verified` : `TAMPERING DETECTED at record #${v.brokenAt}`}
          </div>
        )}
        {v?.lastCheckpoint && <div className="text-xs text-slate-500">Last signed checkpoint: {fmt(v.lastCheckpoint.ts)}</div>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-outline" disabled={isValidating} onClick={() => reverify()}>
            Re-check
          </button>
          <button
            className="btn-outline"
            onClick={async () => {
              await postJSON("/api/admin/verify");
              reverify();
            }}
          >
            Sign checkpoint
          </button>
        </div>
      </div>
    </div>
  );
}
