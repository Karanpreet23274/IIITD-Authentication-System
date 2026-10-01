"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowLeft, Download, LogIn, LogOut, Smartphone, ShieldAlert, Mail, Phone, Home, GraduationCap, CalendarClock } from "lucide-react";
import { ConfirmDialog, ErrorNote, Photo, StatusChip, fetcher, fmt, postJSON } from "@/components/ui";
import DeleteStudent from "@/components/DeleteStudent";
import { useRouter } from "next/navigation";

type Data = {
  student: {
    id: string;
    fullName: string;
    email: string;
    rollNo: string | null;
    programme: string | null;
    batch: string | null;
    residence: "HOSTELLER" | "DAY_SCHOLAR" | null;
    hostelRoom: string | null;
    phone: string | null;
    profileAt: string | null;
    createdAt: string;
    lastSeenAt: string;
    presence: "IN" | "OUT" | null;
    presenceAt: string | null;
    photoUrl: string | null;
    appRole: string;
  };
  pass: {
    status: string;
    reason: string | null;
    createdAt: string;
    phone: { enrolledAt: string; device: string } | null;
    phonesReplaced: number;
    lostReports: number;
  } | null;
  stats: { entries: number; exits: number; total: number };
  movements: { id: string; ts: string; direction: "IN" | "OUT"; gate: string; guard: string; offline: boolean }[];
  rejected: { seq: number; ts: string; gate: string | null; decision: string; reason: string | null }[];
  alerts: { id: string; ts: string; kind: string; message: string; status: string }[];
};

const REASONS: Record<string, string> = {
  STALE_QR: "Old QR / screenshot",
  PHONE_SIGNATURE_INVALID: "QR not from their phone",
  NOT_FROM_ENROLLED_PHONE: "QR not from their phone",
  QR_REUSED: "QR used twice",
  PASS_ALREADY_USED: "Pass already used",
  PASS_EXPIRED: "Pass expired",
  REPEATED_FAILURES: "Repeated failures",
  OPEN_ALERT: "Held by open alert",
  FACE_MISMATCH: "Guard: not this person",
  CREDENTIAL_BLOCKED: "Pass blocked",
  CREDENTIAL_REVOKED: "Phone reported lost",
};

const dayKey = (d: string) => new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "short", day: "2-digit", month: "short", year: "numeric" });

export default function StudentProfile({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, error, mutate } = useSWR<Data>(`/api/admin/students/${params.id}`, fetcher);
  const [action, setAction] = useState<"block" | "unblock" | null>(null);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, Data["movements"]>();
    data?.movements.forEach((x) => m.set(dayKey(x.ts), [...(m.get(dayKey(x.ts)) ?? []), x]));
    return Array.from(m.entries());
  }, [data]);

  if (error) return <div className="card text-red-700">{error.message}</div>;
  if (!data) return <div className="card h-64 animate-pulse" />;
  const s = data.student;

  async function run() {
    if (!action) return;
    setErr(null);
    try {
      await postJSON("/api/admin/students", { identityId: s.id, action, reason: reason || (action === "unblock" ? "Reviewed and cleared" : "") });
      setAction(null);
      setReason("");
      mutate();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function exportCsv() {
    const rows = [["Date & time (IST)", "Entry/Exit", "Gate", "Recorded by", "Offline"], ...data!.movements.map((m) => [fmt(m.ts), m.direction === "IN" ? "ENTRY" : "EXIT", m.gate, m.guard, m.offline ? "yes" : ""])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${s.rollNo ?? s.email.split("@")[0]}-entries-exits.csv`;
    a.click();
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
        <ArrowLeft className="h-4 w-4" /> All students
      </Link>

      {/* Profile header */}
      <div className="card grid gap-5 md:grid-cols-[200px_minmax(0,1fr)_auto]">
        <Photo src={s.photoUrl} alt={`${s.fullName}'s photo`} className="aspect-square w-40 md:w-full" />
        <div className="min-w-0 space-y-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{s.fullName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={`chip ${s.presence === "IN" ? "border-green-300 bg-green-50 text-green-800" : "border-slate-300 bg-slate-50 text-slate-700"}`}>
                {s.presence === "IN" ? "On campus" : s.presence === "OUT" ? "Outside campus" : "No gate record yet"}
              </span>
              {s.presenceAt && <span className="text-slate-500">since {fmt(s.presenceAt)}</span>}
              {data.pass ? <StatusChip status={data.pass.status} /> : <span className="chip border-slate-300">No pass yet</span>}
              {s.appRole !== "STUDENT" && <span className="chip border-violet-300 bg-violet-50 text-violet-800">{s.appRole}</span>}
              {!s.profileAt && <span className="chip border-amber-300 bg-amber-50 text-amber-800">Profile incomplete</span>}
            </div>
          </div>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Item icon={<GraduationCap className="h-4 w-4" />} label="Roll no." value={s.rollNo} />
            <Item icon={<GraduationCap className="h-4 w-4" />} label="Programme · batch" value={[s.programme, s.batch].filter(Boolean).join(" · ") || null} />
            <Item icon={<Home className="h-4 w-4" />} label="Residence" value={s.residence === "HOSTELLER" ? `Hosteller · ${s.hostelRoom ?? ""}` : s.residence === "DAY_SCHOLAR" ? "Day scholar" : null} />
            <Item icon={<Phone className="h-4 w-4" />} label="Mobile" value={s.phone} href={s.phone ? `tel:${s.phone}` : undefined} />
            <Item icon={<Mail className="h-4 w-4" />} label="IIITD e-mail" value={s.email} href={`mailto:${s.email}`} />
            <Item icon={<CalendarClock className="h-4 w-4" />} label="Registered · last sign-in" value={`${fmt(s.createdAt, "date")} · ${fmt(s.lastSeenAt)}`} />
          </dl>
        </div>
        <div className="flex flex-col gap-2 md:w-44">
          {data.pass?.status === "ACTIVE" && (
            <button className="btn-outline text-deny" onClick={() => setAction("block")}>
              Block pass
            </button>
          )}
          {data.pass?.status === "BLOCKED" && (
            <button className="btn-outline" onClick={() => setAction("unblock")}>
              Unblock pass
            </button>
          )}
          <button className="btn-outline" onClick={exportCsv} disabled={!data.movements.length}>
            <Download className="h-4 w-4" /> History CSV
          </button>
          {s.appRole === "STUDENT" && <DeleteStudent student={s} label="Delete student" onDeleted={() => router.replace("/admin/students")} />}
        </div>
      </div>

      {/* Stats + pass/phone */}
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Total gate records" value={data.stats.total} />
        <Stat label="Entries" value={data.stats.entries} tone="text-allow" />
        <Stat label="Exits" value={data.stats.exits} tone="text-sky-700" />
        <div className="card">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Smartphone className="h-4 w-4" /> Enrolled phone
          </div>
          {data.pass?.phone ? (
            <div className="mt-1 text-sm">
              <div className="font-semibold">{data.pass.phone.device}</div>
              <div className="text-xs text-slate-500">since {fmt(data.pass.phone.enrolledAt, "date")}</div>
            </div>
          ) : (
            <div className="mt-1 text-sm text-slate-500">No phone enrolled</div>
          )}
          {data.pass && (data.pass.phonesReplaced > 0 || data.pass.lostReports > 0) && (
            <div className="mt-1 text-xs text-slate-500">
              {data.pass.phonesReplaced} phone change(s) · {data.pass.lostReports} lost report(s)
            </div>
          )}
          {data.pass?.status === "BLOCKED" && data.pass.reason && <div className="mt-1 text-xs text-deny">Blocked: {data.pass.reason}</div>}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Movement history */}
        <div className="card">
          <h2 className="font-bold">Entry / exit history</h2>
          {!data.movements.length && <p className="mt-3 text-sm text-slate-500">No entries or exits recorded yet.</p>}
          <div className="table-wrap mt-2">
            <table className="tbl">
              <tbody>
                {byDay.map(([day, rows]) => (
                  <Fragment key={day}>
                    <tr>
                      <td colSpan={4} className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
                        {day}
                      </td>
                    </tr>
                    {rows.map((m) => (
                      <tr key={m.id}>
                        <td className="w-24 tabular-nums">{fmt(m.ts, "time")}</td>
                        <td>
                          {m.direction === "IN" ? (
                            <span className="chip border-green-300 bg-green-50 text-green-800">
                              <LogIn className="h-3 w-3" /> ENTRY
                            </span>
                          ) : (
                            <span className="chip border-sky-300 bg-sky-50 text-sky-800">
                              <LogOut className="h-3 w-3" /> EXIT
                            </span>
                          )}
                        </td>
                        <td>
                          {m.gate}
                          {m.offline && <span className="ml-1 text-xs text-amber-700">(offline)</span>}
                        </td>
                        <td className="text-xs text-slate-500">{m.guard}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="flex items-center gap-2 font-bold">
              <ShieldAlert className="h-5 w-5 text-deny" /> Rejected scan attempts
            </h2>
            {!data.rejected.length ? (
              <p className="mt-2 text-sm text-slate-500">None. Every scan of this student&apos;s pass was valid.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                {data.rejected.map((r) => (
                  <li key={r.seq} className="flex justify-between gap-3">
                    <span>{REASONS[r.reason ?? ""] ?? r.reason ?? r.decision}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {fmt(r.ts)} · {r.gate}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {!!data.alerts.length && (
            <div className="card">
              <h2 className="font-bold">Alerts</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {data.alerts.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span>{a.message}</span>
                    <span className="shrink-0 text-xs">
                      <StatusChip status={a.status === "OPEN" ? "OPEN" : "ACK"} />
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/admin/alerts" className="mt-2 inline-block text-xs font-semibold text-brand">
                Review in Alerts →
              </Link>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!action}
        title={`${action === "block" ? "Block" : "Unblock"} ${s.fullName}'s pass?`}
        effects={action === "block" ? ["Their QR will be rejected at every gate immediately.", "They are told to visit the Security Office."] : ["Their QR will work again."]}
        danger={action === "block"}
        confirmLabel={action === "block" ? "Block" : "Unblock"}
        onConfirm={run}
        onCancel={() => setAction(null)}
      >
        <ErrorNote msg={err} />
        {action === "block" && (
          <div>
            <label className="label" htmlFor="block-reason">
              Reason
            </label>
            <input id="block-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Disciplinary hold" />
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}

function Item({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | null; href?: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate font-semibold">{value ? href ? <a href={href} className="hover:underline">{value}</a> : value : <span className="font-normal text-slate-400">Not provided</span>}</dd>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card text-center">
      <div className={`text-3xl font-bold ${tone}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
