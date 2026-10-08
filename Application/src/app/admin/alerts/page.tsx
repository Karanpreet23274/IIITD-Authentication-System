"use client";

import useSWR from "swr";
import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";
import { fetcher, fmt, postJSON } from "@/components/ui";
import ViewSwitcher, { useViewMode } from "@/components/ViewSwitcher";

type Alert = { id: string; ts: string; gateId: string | null; kind: string; message: string; status: string; ackBy: string | null; student: string | null };
type Alerts = { alerts: Alert[] };
type Verify = { ok: boolean; checked: number; brokenAt?: number; lastCheckpoint?: { ts: string; seq: number; valid: boolean } };

const kindLabel = (k: string) => {
  const t = k.replace(/_/g, " ").toLowerCase().replace(/\bqr\b/g, "QR");
  return t.charAt(0).toUpperCase() + t.slice(1);
};

function StatusChip({ a }: { a: Alert }) {
  return a.status === "OPEN" ? (
    <span className="chip shrink-0 border-red-300 bg-red-50 text-red-800">OPEN</span>
  ) : (
    <span className="chip shrink-0 border-slate-200 bg-slate-50 text-slate-600">CLOSED</span>
  );
}

function AlertAction({ a, onDone }: { a: Alert; onDone: () => void }) {
  if (a.status !== "OPEN") return <span className="text-xs text-slate-400">Closed by {a.ackBy}</span>;
  return (
    <button
      className="btn-outline shrink-0 px-2 py-1 text-xs"
      onClick={async () => {
        await postJSON("/api/admin/alerts", { id: a.id });
        onDone();
      }}
    >
      Close
    </button>
  );
}

export default function AlertsPage() {
  const { data, mutate } = useSWR<Alerts>("/api/admin/alerts", fetcher, { refreshInterval: 10000 });
  const { data: v, mutate: reverify, isValidating } = useSWR<Verify>("/api/admin/verify", fetcher);
  const [view, setView] = useViewMode("alerts", "list", ["list", "grid", "table"]);
  const alerts = data?.alerts ?? [];

  return (
    <div className={`grid gap-5 ${view === "table" ? "" : "lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"}`}>
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <h1 className="flex items-center gap-2 text-lg font-bold">
            <AlertTriangle className="h-5 w-5 text-deny" /> Security alerts
          </h1>
          <ViewSwitcher value={view} onChange={setView} views={["list", "grid", "table"]} />
        </div>
        <p className="text-sm text-slate-500">Repeated failed scans lock a student for 5 minutes, then unlock automatically. A copied or reused QR keeps them at SUSPICIOUS until you close the alert.</p>
        {data && !alerts.length && <p className="mt-3 text-sm text-slate-500">No alerts.</p>}

        {/* LIST */}
        {view === "list" && alerts.length > 0 && (
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${a.status === "OPEN" ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {fmt(a.ts)} · {kindLabel(a.kind)} {a.gateId ? `· ${a.gateId}` : ""}
                  </div>
                  <div className="text-slate-700">{a.message}</div>
                  {a.student && <div className="text-slate-600">Student: {a.student}</div>}
                  {a.status !== "OPEN" && <div className="truncate text-xs text-slate-400">Closed by {a.ackBy}</div>}
                </div>
                {a.status === "OPEN" && <AlertAction a={a} onDone={() => mutate()} />}
              </li>
            ))}
          </ul>
        )}

        {/* GRID */}
        {view === "grid" && alerts.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {alerts.map((a) => (
              <div key={a.id} className={`flex flex-col gap-2 rounded-xl border p-3 text-sm ${a.status === "OPEN" ? "border-red-200 bg-red-50" : "border-slate-200"}`}>
                <div className="flex items-center justify-between gap-2">
                  <StatusChip a={a} />
                  <span className="text-xs tabular-nums text-slate-500">{fmt(a.ts)}</span>
                </div>
                <div className="font-semibold">
                  {kindLabel(a.kind)}
                  {a.gateId && <span className="font-normal text-slate-500"> · {a.gateId}</span>}
                </div>
                <div className="flex-1 text-slate-700">{a.message}</div>
                {a.student && <div className="truncate text-slate-600">Student: {a.student}</div>}
                <div className="flex justify-end">
                  <AlertAction a={a} onDone={() => mutate()} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLE */}
        {view === "table" && alerts.length > 0 && (
          <div className="table-wrap mt-3">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Gate</th>
                  <th>Student</th>
                  <th>Details</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className={a.status === "OPEN" ? "bg-red-50" : ""}>
                    <td className="whitespace-nowrap tabular-nums">{fmt(a.ts)}</td>
                    <td>
                      <StatusChip a={a} />
                    </td>
                    <td className="whitespace-nowrap">{kindLabel(a.kind)}</td>
                    <td>{a.gateId ?? "—"}</td>
                    <td>{a.student ?? "—"}</td>
                    <td className="min-w-[14rem]">{a.message}</td>
                    <td className="whitespace-nowrap text-right">
                      <AlertAction a={a} onDone={() => mutate()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
