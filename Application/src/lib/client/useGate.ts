"use client";

import { useEffect, useState } from "react";

const KEY = "guard-gate";

/** The lane this tablet is mounted at (per-device convenience, kept in localStorage). */
export function useGate() {
  const [gateId, setGateId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      setGateId(localStorage.getItem(KEY));
    } catch {}
    setReady(true);
  }, []);
  const choose = (id: string | null) => {
    try {
      if (id) localStorage.setItem(KEY, id);
      else localStorage.removeItem(KEY);
    } catch {}
    setGateId(id);
  };
  return { gateId, ready, choose };
}
