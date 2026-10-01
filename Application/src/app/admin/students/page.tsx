"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronRight, Search } from "lucide-react";
import { ConfirmDialog, ErrorNote, Photo, StatusChip, fetcher, fmt, postJSON } from "@/components/ui";
import DeleteStudent from "@/components/DeleteStudent";
import ViewSwitcher, { useViewMode } from "@/components/ViewSwitcher";

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
  appRole: "STUDENT" | "GUARD" | "ADMIN";
  isMe: boolean;
};

type SortKey = "fullName" | "rollNo" | "programme" | "residence" | "presence" | "pass";

const residenceText = (p: P) => (p.residence === "HOSTELLER" ? `Hosteller · ${p.hostelRoom ?? ""}` : p.residence === "DAY_SCHOLAR" ? "Day scholar" : "");

function PresenceChip({ p }: { p: P }) {
  return (
    <span className={`chip ${p.presence === "IN" ? "border-green-300 bg-green-50 text-green-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
      {p.presence === "IN" ? "On campus" : p.presence === "OUT" ? "Outside" : "No record"}
    </span>
  );
}

function PassChips({ p }: { p: P }) {
  return (
    <>
      {p.pass ? <StatusChip status={p.pass.status} /> : <span className="chip border-slate-300">no pass</span>}
      {p.pass && !p.pass.phoneEnrolled && <span className="chip border-amber-300 bg-amber-50 text-amber-800">no phone</span>}
    </>
  );
}

function RoleTag({ p }: { p: P }) {
  if (p.appRole === "STUDENT") return null;
  return (
    <span className="chip shrink-0 border-violet-300 bg-violet-50 text-violet-800">
      {p.isMe ? "YOU · " : ""}
      {p.appRole}
    </span>
  );
}

/** Block / Unblock / Delete buttons, shared by every view (top-level so dialogs keep their state). */
function Actions({ p, compact = false, onBlock, onUnblock, onDeleted }: { p: P; compact?: boolean; onBlock: () => void; onUnblock: () => void; onDeleted: () => void }) {
  return (
    <div className={`flex gap-2 ${compact ? "" : "w-full"}`}>
      {p.pass?.status === "ACTIVE" && (
        <button className={`btn-outline text-xs text-deny ${compact ? "px-2.5 py-1.5" : "flex-1"}`} onClick={onBlock}>
          Block{compact ? "" : " pass"}
        </button>
      )}
      {p.pass?.status === "BLOCKED" && (
        <button className={`btn-outline min-w-0 truncate text-xs ${compact ? "px-2.5 py-1.5" : "flex-1"}`} onClick={onUnblock}>
          Unblock{compact ? "" : ` (${p.pass.reason})`}
        </button>
      )}
      {p.appRole === "STUDENT" && !p.isMe && (
        <DeleteStudent
          student={p}
          onDeleted={onDeleted}
          label={compact ? "" : "Delete"}
          className={`text-xs ${compact ? "px-2.5 py-1.5" : p.pass?.status === "ACTIVE" || p.pass?.status === "BLOCKED" ? "" : "flex-1"}`}
        />
      )}
    </div>
  );
}

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDq(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const { data, mutate } = useSWR<{ people: P[] }>(`/api/admin/students?q=${encodeURIComponent(dq)}`, fetcher);
  const [view, setView] = useViewMode("admin-students", "grid", ["grid", "list", "large", "table"]);
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "fullName", asc: true });
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

  const people = useMemo(() => data?.people ?? [], [data]);
  const sorted = useMemo(() => {
    const val = (p: P): string => {
      switch (sort.key) {
        case "presence":
          return p.presence ?? "~";
        case "pass":
          return p.pass?.status ?? "~";
        case "residence":
          return residenceText(p) || "~";
        default:
          return (p[sort.key] as string | null) ?? "~";
      }
    };
    return [...people].sort((a, b) => val(a).localeCompare(val(b), "en", { numeric: true }) * (sort.asc ? 1 : -1));
  }, [people, sort]);

  const SortTh = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <th>
      <button className="inline-flex items-center gap-1 uppercase" onClick={() => setSort((s) => ({ key: k, asc: s.key === k ? !s.asc : true }))}>
        {children}
        {sort.key === k && (sort.asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search name, roll no. or e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search students" />
        </div>
        <span className="hidden text-sm text-slate-500 sm:inline">{data ? `${people.length} shown` : ""}</span>
        <div className="ml-auto">
          <ViewSwitcher value={view} onChange={setView} views={["grid", "list", "large", "table"]} />
        </div>
      </div>

      {data && !people.length && <div className="card py-10 text-center text-slate-500">No one matches “{dq}”.</div>}

      {/* GRID — summary cards */}
      {view === "grid" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <div key={p.id} className="card flex flex-col gap-2 transition hover:border-brand hover:shadow-md">
              <Link href={`/admin/students/${p.id}`} className="block space-y-2" aria-label={`View ${p.fullName}'s profile`}>
                <div className="flex items-center gap-3">
                  <Photo src={p.photoUrl} alt="" className="h-14 w-14 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-bold">{p.fullName}</span>
                      <RoleTag p={p} />
                    </div>
                    <div className="truncate text-xs text-slate-500">{p.email}</div>
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  {p.rollNo ?? "—"} · {p.programme ?? "profile incomplete"} {p.batch}
                  <br />
                  {residenceText(p)} {p.phone ? `· ${p.phone}` : ""}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <PresenceChip p={p} />
                  <PassChips p={p} />
                  {p.presenceAt && <span className="text-slate-500">since {fmt(p.presenceAt)}</span>}
                </div>
                <div className="flex items-center justify-end gap-1 text-xs font-semibold text-brand">
                  View full profile <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
              <div className="mt-auto">
                <Actions p={p} onBlock={() => setTarget({ p, action: "block" })} onUnblock={() => setTarget({ p, action: "unblock" })} onDeleted={() => mutate()} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST — one compact row per person */}
      {view === "list" && people.length > 0 && (
        <ul className="card divide-y divide-slate-100 p-0 sm:p-0">
          {sorted.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
              <Link href={`/admin/students/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3" aria-label={`View ${p.fullName}'s profile`}>
                <Photo src={p.photoUrl} alt="" className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{p.fullName}</span>
                    <RoleTag p={p} />
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    {p.rollNo ?? "—"} · {p.programme ?? "profile incomplete"}
                    <span className="hidden sm:inline"> · {residenceText(p) || p.email}</span>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-1.5 text-xs sm:flex">
                  <PresenceChip p={p} />
                  <PassChips p={p} />
                </div>
              </Link>
              <Actions p={p} compact onBlock={() => setTarget({ p, action: "block" })} onUnblock={() => setTarget({ p, action: "unblock" })} onDeleted={() => mutate()} />
            </li>
          ))}
        </ul>
      )}

      {/* LARGE — big photo cards for checking faces */}
      {view === "large" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <div key={p.id} className="card flex flex-col gap-3 p-3 transition hover:border-brand hover:shadow-md sm:p-4">
              <Link href={`/admin/students/${p.id}`} className="block space-y-3" aria-label={`View ${p.fullName}'s profile`}>
                <Photo src={p.photoUrl} alt={`${p.fullName}'s photo`} className="aspect-square w-full" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-lg font-extrabold">{p.fullName}</span>
                    <RoleTag p={p} />
                  </div>
                  <div className="truncate text-sm text-slate-500">{p.email}</div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-slate-500">Roll no.</dt>
                  <dd className="font-semibold">{p.rollNo ?? "—"}</dd>
                  <dt className="text-slate-500">Programme</dt>
                  <dd className="truncate font-semibold">{p.programme ? `${p.programme} · ${p.batch ?? ""}` : "profile incomplete"}</dd>
                  <dt className="text-slate-500">Residence</dt>
                  <dd className="truncate font-semibold">{residenceText(p) || "—"}</dd>
                  <dt className="text-slate-500">Mobile</dt>
                  <dd className="font-semibold">{p.phone ?? "—"}</dd>
                </dl>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <PresenceChip p={p} />
                  <PassChips p={p} />
                </div>
              </Link>
              <div className="mt-auto">
                <Actions p={p} onBlock={() => setTarget({ p, action: "block" })} onUnblock={() => setTarget({ p, action: "unblock" })} onDeleted={() => mutate()} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE — sortable columns */}
      {view === "table" && people.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <SortTh k="fullName">Name</SortTh>
                  <SortTh k="rollNo">Roll no.</SortTh>
                  <SortTh k="programme">Programme</SortTh>
                  <SortTh k="residence">Residence</SortTh>
                  <th>Mobile</th>
                  <SortTh k="presence">Where</SortTh>
                  <SortTh k="pass">Pass</SortTh>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td>
                      <Link href={`/admin/students/${p.id}`} className="flex items-center gap-2 font-semibold hover:text-brand">
                        <Photo src={p.photoUrl} alt="" className="h-8 w-8 shrink-0" />
                        <span className="truncate">{p.fullName}</span>
                        <RoleTag p={p} />
                      </Link>
                    </td>
                    <td className="tabular-nums">{p.rollNo ?? "—"}</td>
                    <td>
                      {p.programme ?? <span className="text-slate-400">incomplete</span>} {p.batch}
                    </td>
                    <td>{residenceText(p) || "—"}</td>
                    <td className="tabular-nums">{p.phone ?? "—"}</td>
                    <td>
                      <PresenceChip p={p} />
                    </td>
                    <td>
                      <span className="flex flex-wrap gap-1">
                        <PassChips p={p} />
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <Actions p={p} compact onBlock={() => setTarget({ p, action: "block" })} onUnblock={() => setTarget({ p, action: "unblock" })} onDeleted={() => mutate()} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
            <label className="label" htmlFor="block-reason-list">
              Reason
            </label>
            <input id="block-reason-list" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Disciplinary hold" />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
