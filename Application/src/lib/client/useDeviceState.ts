"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getDevice } from "./device";
import type { Me } from "./useMe";

/** Is THIS browser the enrolled device for the signed-in student? */
export function useDeviceState(me: Me | undefined) {
  const { data: session } = useSession();
  const owner = session?.user?.id;
  const [state, setState] = useState<{ loading: boolean; deviceId: string | null; keyPair: CryptoKeyPair | null }>({ loading: true, deviceId: null, keyPair: null });

  useEffect(() => {
    if (!owner || !me) return;
    let alive = true;
    getDevice(owner).then((d) => {
      if (!alive) return;
      const activeIds = new Set(me.credentials.flatMap((c) => c.devices.map((x) => x.id)));
      const valid = !!d?.deviceId && activeIds.has(d.deviceId);
      setState({ loading: false, deviceId: valid ? d!.deviceId! : null, keyPair: valid ? d!.keyPair : null });
    });
    return () => {
      alive = false;
    };
  }, [owner, me]);

  return { ...state, owner };
}
