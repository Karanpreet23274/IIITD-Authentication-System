"use client";

import { useState } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { useDeviceState } from "@/lib/client/useDeviceState";
import ProfileForm from "@/components/ProfileForm";
import { ConfirmDialog, ErrorNote, StatusChip, SuccessNote, fmt, postJSON } from "@/components/ui";

export default function ProfilePage() {
  const { data: me, mutate } = useMe();
  const device = useDeviceState(me);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lost, setLost] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!me) return <div className="card h-60 animate-pulse" />;
  const active = me.credentials.find((c) => c.status === "ACTIVE");
  const blocked = me.credentials.find((c) => c.status === "BLOCKED");

  async function reportLost() {
    setBusy(true);
    setErr(null);
    try {
      await postJSON("/api/student/lost-phone", { confirm: "DISABLE" });
      setLost(false);
      setOk("Your old phone's pass is disabled. Sign in on your new phone and enrol it to get a new QR.");
      mutate();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="card">
        <h1 className="mb-3 text-lg font-bold">My details</h1>
        <ProfileForm me={me} submitLabel="Update details" onSaved={() => (setOk("Details updated."), mutate())} />
      </div>
      <div className="space-y-4">
        <SuccessNote msg={ok} />
        <ErrorNote msg={err} />
        <div className="card space-y-3">
          <h2 className="flex items-center gap-2 font-bold">
            <Smartphone className="h-5 w-5" /> Enrolled phone
          </h2>
          {blocked ? (
            <div className="text-sm">
              <StatusChip status="BLOCKED" /> <span className="ml-1">{blocked.statusReason}. Visit the Security Office.</span>
            </div>
          ) : active?.devices.length ? (
            <div className="text-sm text-slate-700">
              {active.devices.some((d) => d.id === device.deviceId) ? <b>This phone</b> : <b>Another phone</b>} · enrolled {fmt(active.devices[0].createdAt, "date")}
            </div>
          ) : (
            <div className="text-sm text-slate-600">No phone enrolled.</div>
          )}
          {!blocked && !device.deviceId && (
            <Link href="/student/setup?step=phone" className="btn-outline w-full">
              Enrol this phone
            </Link>
          )}
          {active && (
            <button className="btn-outline w-full text-deny" onClick={() => setLost(true)}>
              My phone is lost or stolen
            </button>
          )}
          <p className="text-xs text-slate-500">If your phone is lost, also sign out of your IIITD Google account on it from myaccount.google.com.</p>
        </div>
        <Link href="/privacy-notice" className="block text-sm font-semibold text-brand underline">
          What data is stored and who can see it
        </Link>
      </div>

      <ConfirmDialog
        open={lost}
        title="Disable the pass on your lost phone?"
        effects={["The QR pass on the lost phone stops working immediately.", "You can enrol your new phone right after.", "This cannot be undone."]}
        typed="DISABLE"
        danger
        busy={busy}
        confirmLabel="Disable lost phone"
        onConfirm={reportLost}
        onCancel={() => setLost(false)}
      />
    </div>
  );
}
