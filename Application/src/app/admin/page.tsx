"use client";

import { useState } from "react";
import useSWR from "swr";
import { ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { ErrorNote, SuccessNote, fetcher, fmt, postJSON } from "@/components/ui";

type Data = { grants: { email: string; role: "GUARD" | "ADMIN"; addedBy: string; createdAt: string }[]; bootstrapAdmins: string[] };

// Guard list: these IIITD accounts open the Guard app when they sign in. Everyone else gets the Student app.
export default function AccessPage() {
  const { data, mutate } = useSWR<Data>("/api/admin/access", fetcher);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"GUARD" | "ADMIN">("GUARD");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    try {
      await postJSON("/api/admin/access", { email, role });
      setOk(`${email} added as ${role.toLowerCase()}. They get the ${role === "GUARD" ? "Guard" : "Admin"} app at their next sign-in (within a minute if already signed in).`);
      setEmail("");
      mutate();
    } catch (e) {
      setErr((e as Error).message);
    }
  }
  async function remove(em: string) {
    if (!confirm(`Remove ${em}? They will get the Student app.`)) return;
    try {
      await postJSON(`/api/admin/access?email=${encodeURIComponent(em)}`, undefined, "DELETE");
      mutate();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="card">
        <h1 className="text-lg font-bold">Guards &amp; admins</h1>
        <p className="text-sm text-slate-500">Everyone signs in with their IIITD Google account. Only the accounts listed here get the Guard app.</p>
        {/* Phones: simple list, remove button always visible */}
        <ul className="mt-3 divide-y divide-slate-100 sm:hidden">
          {data?.bootstrapAdmins.map((e) => (
            <li key={"mb" + e} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{e}</div>
                <div className="text-xs text-slate-500">deployment setting (ADMIN_EMAILS)</div>
              </div>
              <span className="chip shrink-0 border-violet-300 bg-violet-50 text-violet-800">ADMIN</span>
            </li>
          ))}
          {data?.grants.map((g) => (
            <li key={"m" + g.email} className="flex items-center gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{g.email}</div>
                <div className="truncate text-xs text-slate-500">
                  {fmt(g.createdAt, "date")} by {g.addedBy}
                </div>
              </div>
              <span className={`chip shrink-0 ${g.role === "ADMIN" ? "border-violet-300 bg-violet-50 text-violet-800" : "border-teal-300 bg-teal-50 text-teal-800"}`}>{g.role}</span>
              <button className="btn-outline shrink-0 px-2.5 py-2 text-deny" onClick={() => remove(g.email)} aria-label={`Remove ${g.email}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {data && !data.grants.length && <li className="py-6 text-center text-sm text-slate-500">No guards yet. Add the guards&apos; IIITD e-mails.</li>}
        </ul>
        <div className="table-wrap mt-3 hidden sm:block">
          <table className="tbl">
            <thead>
              <tr>
                <th>IIITD e-mail</th>
                <th>Role</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.bootstrapAdmins.map((e) => (
                <tr key={"b" + e}>
                  <td className="font-medium">{e}</td>
                  <td>
                    <span className="chip border-violet-300 bg-violet-50 text-violet-800">ADMIN</span>
                  </td>
                  <td className="text-xs text-slate-500">deployment setting (ADMIN_EMAILS)</td>
                  <td />
                </tr>
              ))}
              {data?.grants.map((g) => (
                <tr key={g.email}>
                  <td className="font-medium">{g.email}</td>
                  <td>
                    <span className={`chip ${g.role === "ADMIN" ? "border-violet-300 bg-violet-50 text-violet-800" : "border-teal-300 bg-teal-50 text-teal-800"}`}>{g.role}</span>
                  </td>
                  <td className="text-xs text-slate-500">
                    {fmt(g.createdAt, "date")} by {g.addedBy}
                  </td>
                  <td className="text-right">
                    <button className="btn-outline px-2 py-1 text-xs text-deny" onClick={() => remove(g.email)} aria-label={`Remove ${g.email}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {data && !data.grants.length && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No guards yet. Add the guards&apos; IIITD e-mails.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <form className="card h-fit space-y-3" onSubmit={add}>
        <h2 className="flex items-center gap-2 font-bold">
          <UserPlus className="h-5 w-5" /> Add a guard
        </h2>
        <ErrorNote msg={err} />
        <SuccessNote msg={ok} />
        <div>
          <label className="label">IIITD e-mail</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guard.ramesh@iiitd.ac.in" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["GUARD", "ADMIN"] as const).map((r) => (
            <button type="button" key={r} onClick={() => setRole(r)} className={role === r ? "btn-dark" : "btn-outline"}>
              {r === "GUARD" ? "Guard" : "Admin"}
            </button>
          ))}
        </div>
        <button className="btn-primary w-full">
          <ShieldCheck className="h-4 w-4" /> Grant access
        </button>
        <p className="text-xs text-slate-500">Admins can also scan at the gate, manage this list, block passes and download the register.</p>
      </form>
    </div>
  );
}
