"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Smartphone, UserRound } from "lucide-react";
import { useMe } from "@/lib/client/useMe";
import { useDeviceState } from "@/lib/client/useDeviceState";
import { createDeviceKey, saveDevice } from "@/lib/client/device";
import ProfileForm from "@/components/ProfileForm";
import { ErrorNote, postJSON } from "@/components/ui";

// First-time setup: 1) complete profile, 2) bind the QR pass to this phone.
export default function Setup() {
  const { data: me, mutate } = useMe();
  const device = useDeviceState(me);
  const { data: session } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const enrolling = useRef(false);

  if (!me) return <div className="card mx-auto h-60 max-w-lg animate-pulse" />;
  const step = me.identity.profileAt ? 2 : 1;
  const boundElsewhere = !device.loading && !device.deviceId && me.credentials.some((c) => c.status === "ACTIVE" && c.devices.length > 0);

  async function enrol() {
    if (!session?.user?.id || enrolling.current) return;
    enrolling.current = true;
    setBusy(true);
    setErr(null);
    try {
      if (!window.isSecureContext || !crypto?.subtle) throw new Error("This browser cannot create a secure key (HTTPS required).");
      const { keyPair, publicKeyJwk } = await createDeviceKey();
      const r = await postJSON<{ deviceId: string }>("/api/student/enrol", { publicKeyJwk, userAgent: navigator.userAgent });
      await saveDevice(session.user.id, keyPair, r.deviceId);
      await mutate();
      router.push("/student/pass");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      enrolling.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <ol className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <li className="text-brand">1 · Your details</li>
        <li>—</li>
        <li className={step === 2 ? "text-brand" : ""}>2 · Enrol phone</li>
      </ol>

      {step === 1 ? (
        <div className="card space-y-3">
          <UserRound className="h-9 w-9 text-brand" />
          <h1 className="text-xl font-bold">Complete your gate profile</h1>
          <ProfileForm me={me} onSaved={() => mutate()} submitLabel="Save and continue" />
        </div>
      ) : (
        <div className="card space-y-4">
          <Smartphone className="h-10 w-10 text-brand" />
          <h1 className="text-xl font-bold">Enrol this phone</h1>
          <p className="text-sm text-slate-700">
            Your phone creates a secret key that <b>never leaves this phone</b>. Every gate QR is signed with it, so a screenshot, a forwarded photo, or a friend
            logged into your account on their phone will be <b>rejected at the gate</b>.
          </p>
          <ErrorNote msg={err} />
          {boundElsewhere && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              Your pass is currently on another phone. Enrolling here will <b>switch it to this phone</b> and the old phone will stop working. This is recorded.
            </div>
          )}
          {device.deviceId ? (
            <button className="btn-primary btn-lg w-full" onClick={() => router.push("/student/pass")}>
              This phone is enrolled — open my QR
            </button>
          ) : (
            <button className="btn-primary btn-lg w-full" disabled={busy || device.loading} onClick={enrol}>
              {busy ? "Creating secure key…" : "Enrol this phone"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
