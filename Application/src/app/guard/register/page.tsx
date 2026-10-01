"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Download, LogIn, LogOut, Search } from "lucide-react";
import { Photo, fetcher, fmt } from "@/components/ui";

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

// The digital gate register: replaces the paper entry/exit book.
export default function RegisterPage() {
  const [date, setDate] = useState(todayIst());
  const [dir, setDir] = useState("");
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const qs = useMemo(() => new URLSearchParams({ date, ...(dir ? { dir } : {}), ...(dq ? { q: dq } : {}) }).toString(), [date, dir, dq]);
  const { data } = useSWR<Data>(`/api/guard/register?${qs}`, fetcher, { refreshInterval: 15000 });

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
          <div className="text-2xl font-bold text-sky-700">{data?.counts.out ?? "–"}</div>
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
          <input className="input pl-9" placeholder="Search name, roll no. or e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        <select className="input" value={dir} onChange={(e) => setDir(e.target.value)}>
          <option value="">Entries & exits</option>
          <option value="IN">Entries only</option>
          <option value="OUT">Exits only</option>
        </select>
      </div>

      {/* Phones: one card per record */}
      <ul className="space-y-2 sm:hidden">
        {data?.rows.map((r) => (
          <li key={r.id} className="card p-3">
            <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
              {r.direction === "IN" ? (
                <span className="chip shrink-0 border-green-300 bg-green-50 text-green-800">
                  <LogIn className="h-3 w-3" /> ENTRY
                </span>
              ) : (
                <span className="chip shrink-0 border-sky-300 bg-sky-50 text-sky-800">
                  <LogOut className="h-3 w-3" /> EXIT
                </span>
              )}
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
                  <div>{r.student.residence === "HOSTELLER" ? `Hosteller · ${r.student.hostelRoom ?? ""}` : "Day scholar"}</div>
                  <div>Mobile: {r.student.phone ?? "—"}</div>
                  <div className="truncate text-xs text-slate-500">Recorded by {r.guard}</div>
                </div>
              </div>
            )}
          </li>
        ))}
        {data && !data.rows.length && <li className="card py-8 text-center text-slate-500">No records for this day.</li>}
      </ul>

      <div className="card hidden sm:block">
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
              {data?.rows.map((r) => (
                <Fragment key={r.id}>
                  <tr className="cursor-pointer hover:bg-slate-50" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    <td className="whitespace-nowrap tabular-nums">{fmt(r.ts, "time")}</td>
                    <td>
                      {r.direction === "IN" ? (
                        <span className="chip border-green-300 bg-green-50 text-green-800">
                          <LogIn className="h-3 w-3" /> ENTRY
                        </span>
                      ) : (
                        <span className="chip border-sky-300 bg-sky-50 text-sky-800">
                          <LogOut className="h-3 w-3" /> EXIT
                        </span>
                      )}
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
              {data && !data.rows.length && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No records for this day.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
