"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Download, LogIn, LogOut, Search } from "lucide-react";
import { Photo, fetcher, fmt } from "@/components/ui";
import ViewSwitcher, { useViewMode } from "@/components/ViewSwitcher";

type Row = {
  id: string;
  ts: string;
  direction: "IN" | "OUT";
  gate: string;
  guard: string;
  offline: boolean;
  student: { fullName: string; rollNo: string | null; programme: string | null; batch: string | null; residence: string | null; hostelRoom: string | null; phone: string | null; photoUrl: string | null };
};
type Data = { counts: { in: number; out: number; onCampus: number }; rows: Row[] };

const todayIst = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
const residence = (s: Row["student"]) => (s.residence === "HOSTELLER" ? `Hosteller · ${s.hostelRoom ?? ""}` : s.residence === "DAY_SCHOLAR" ? "Day scholar" : "—");

function DirChip({ d, big = false }: { d: "IN" | "OUT"; big?: boolean }) {
  const cls = big ? "px-3 py-1 text-sm" : "";
  return d === "IN" ? (
    <span className={`chip shrink-0 border-green-300 bg-green-50 text-green-800 ${cls}`}>
      <LogIn className={big ? "h-4 w-4" : "h-3 w-3"} /> ENTRY
    </span>
  ) : (
    <span className={`chip shrink-0 border-sky-300 bg-sky-50 text-sky-800 ${cls}`}>
      <LogOut className={big ? "h-4 w-4" : "h-3 w-3"} /> EXIT
    </span>
  );
}

// The digital gate register: replaces the paper entry/exit book.
export default function RegisterPage() {
  const [date, setDate] = useState(todayIst());
  const [dir, setDir] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useViewMode("register", "table", ["table", "list", "grid", "large"], "list");
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const qs = useMemo(() => new URLSearchParams({ date, ...(dir ? { dir } : {}), ...(dq ? { q: dq } : {}) }).toString(), [date, dir, dq]);
  const { data } = useSWR<Data>(`/api/guard/register?${qs}`, fetcher, { refreshInterval: 15000 });
  const rows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Entry / exit register</h1>
          <p className="text-sm text-slate-500">Every scan at every gate, with student details and time.</p>
        </div>
        <a className="btn-outline" href={`/api/guard/register?${qs}&format=csv`}>
          <Download className="h-4 w-4" /> Download CSV
        </a>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card px-2 py-3 text-center">
          <div className="text-2xl font-bold text-allow">{data?.counts.in ?? "–"}</div>
          <div className="text-xs text-slate-500">entries</div>
        </div>
        <div className="card px-2 py-3 text-center">
          <div className="text-2xl font-bold text-exit">{data?.counts.out ?? "–"}</div>
          <div className="text-xs text-slate-500">exits</div>
        </div>
        <div className="card px-2 py-3 text-center">
          <div className="text-2xl font-bold">{data?.counts.onCampus ?? "–"}</div>
          <div className="text-xs text-slate-500">on campus now</div>
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, roll no. or e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search register" />
        </div>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        <select className="input" value={dir} onChange={(e) => setDir(e.target.value)} aria-label="Entries or exits">
          <option value="">Entries & exits</option>
          <option value="IN">Entries only</option>
          <option value="OUT">Exits only</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-slate-500">{data ? `${rows.length} record${rows.length === 1 ? "" : "s"}` : "Loading…"}</span>
        <ViewSwitcher value={view} onChange={setView} views={["table", "list", "grid", "large"]} />
      </div>

      {data && !rows.length && <div className="card py-10 text-center text-slate-500">No records for this day.</div>}

      {/* LIST — one tappable row per record */}
      {view === "list" && rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="card p-3">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                <DirChip d={r.direction} />
                <Photo src={r.student.photoUrl} alt="" className="hidden h-9 w-9 shrink-0 sm:flex" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{r.student.fullName}</div>
                  <div className="truncate text-xs text-slate-500">
                    {r.student.rollNo} · {r.student.programme} · {r.gate}
                    {r.offline && " · offline"}
                  </div>
                </div>
                <span className="shrink-0 text-sm tabular-nums text-slate-600">{fmt(r.ts, "time")}</span>
              </button>
              {open === r.id && (
                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 text-sm">
                  <Photo src={r.student.photoUrl} alt="" className="h-14 w-14 shrink-0" />
                  <div className="min-w-0">
                    <div>{residence(r.student)}</div>
                    <div>Mobile: {r.student.phone ?? "—"}</div>
                    <div className="truncate text-xs text-slate-500">Recorded by {r.guard}</div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* GRID — compact cards with photo */}
      {view === "grid" && rows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="card space-y-2">
              <div className="flex items-center gap-3">
                <Photo src={r.student.photoUrl} alt="" className="h-12 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{r.student.fullName}</div>
                  <div className="truncate text-xs text-slate-500">
                    {r.student.rollNo} · {r.student.programme} {r.student.batch}
                  </div>
                </div>
              </div>
              <div className="text-sm text-slate-700">
                {residence(r.student)} · {r.student.phone ?? "—"}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <DirChip d={r.direction} />
                <span className="font-semibold tabular-nums">{fmt(r.ts, "time")}</span>
                <span className="text-slate-500">
                  · {r.gate}
                  {r.offline && " · offline"}
                </span>
              </div>
              <div className="truncate text-xs text-slate-500">Recorded by {r.guard}</div>
            </div>
          ))}
        </div>
      )}

      {/* LARGE — big photo for checking faces */}
      {view === "large" && rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="card space-y-3 p-3 sm:p-4">
              <div className="relative">
                <Photo src={r.student.photoUrl} alt={`${r.student.fullName}'s photo`} className="aspect-square w-full" />
                <div className="absolute left-2 top-2">
                  <DirChip d={r.direction} big />
                </div>
              </div>
              <div>
                <div className="truncate text-lg font-extrabold">{r.student.fullName}</div>
                <div className="text-sm text-slate-500">
                  {fmt(r.ts, "time")} · {r.gate}
                  {r.offline && " · offline"}
                </div>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-slate-500">Roll no.</dt>
                <dd className="font-semibold">{r.student.rollNo ?? "—"}</dd>
                <dt className="text-slate-500">Programme</dt>
                <dd className="truncate font-semibold">
                  {r.student.programme ?? "—"} {r.student.batch}
                </dd>
                <dt className="text-slate-500">Residence</dt>
                <dd className="truncate font-semibold">{residence(r.student)}</dd>
                <dt className="text-slate-500">Mobile</dt>
                <dd className="font-semibold">{r.student.phone ?? "—"}</dd>
                <dt className="text-slate-500">Guard</dt>
                <dd className="truncate">{r.guard}</dd>
              </dl>
            </div>
          ))}
        </div>
      )}

      {/* TABLE — all columns; rows expand for photo and mobile */}
      {view === "table" && rows.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Time</th>
                  <th></th>
                  <th>Name</th>
                  <th>Roll no.</th>
                  <th>Programme</th>
                  <th>Residence</th>
                  <th>Gate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                      <td className="whitespace-nowrap tabular-nums">{fmt(r.ts, "time")}</td>
                      <td>
                        <DirChip d={r.direction} />
                      </td>
                      <td className="font-medium">{r.student.fullName}</td>
                      <td>{r.student.rollNo}</td>
                      <td>
                        {r.student.programme} {r.student.batch}
                      </td>
                      <td>{r.student.residence === "HOSTELLER" ? r.student.hostelRoom : "Day scholar"}</td>
                      <td>
                        {r.gate}
                        {r.offline && <span className="ml-1 text-xs text-amber-700">(offline)</span>}
                      </td>
                    </tr>
                    {open === r.id && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50">
                          <div className="flex items-center gap-4 py-2">
                            <Photo src={r.student.photoUrl} alt="" className="h-16 w-16" />
                            <div className="text-sm">
                              <div>Mobile: {r.student.phone ?? "—"}</div>
                              <div>Recorded by: {r.guard}</div>
                              <div>{fmt(r.ts)}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
