// Offline mode for the guard tablet: if the network drops, live passes are still verified
// locally (server signature + phone signature + freshness + single use) using a signed list
// no older than OFFLINE_MAX_HOURS. Decisions are queued and uploaded to the register later.
import { ed25519 } from "@noble/curves/ed25519";
import { get, set } from "idb-keyval";
import type { Decision, Direction, Residence } from "@prisma/client";

export type Bundle = {
  issuedAt: number;
  maxAgeHours: number;
  gateId: string;
  serverPublicKey: string;
  credentials: { cp: string; name: string; rollNo: string | null; presence: Direction | null; residence: Residence | null; keys: JsonWebKey[] }[];
};

type OfflineEvent = {
  ts: number;
  gateId: string;
  pseudonym: string | null;
  direction: Direction | null;
  decision: Decision;
  reasonCode: string;
  nonce?: string;
  sid?: string;
};

export type OfflineResult = { decision: Decision; direction: Direction | null; name?: string; rollNo?: string | null; reasonCode: string };

const BUNDLE_KEY = (g: string) => `offline-bundle:${g}`;
const PIN_KEY = "offline-server-pubkey";
const QUEUE_KEY = "offline-queue";
const SEEN_KEY = "offline-seen";
const PRESENCE_KEY = "offline-presence";

const enc = new TextEncoder();
function fromB64url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}
function hexToBytes(h: string) {
  return Uint8Array.from(h.match(/.{2}/g) ?? [], (x) => parseInt(x, 16));
}

/** Fetch and verify a fresh list. The server key is pinned on first use. */
export async function refreshBundle(gateId: string): Promise<Bundle> {
  const res = await fetch(`/api/offline/bundle?gate=${encodeURIComponent(gateId)}`, { cache: "no-store" });
  if (!res.ok) throw new Error("bundle fetch failed");
  const { body, sig } = (await res.json()) as { body: string; sig: string };
  const bundle = JSON.parse(body) as Bundle;
  const pinned = ((await get(PIN_KEY)) as string | undefined) ?? bundle.serverPublicKey;
  if (!ed25519.verify(fromB64url(sig), enc.encode(body), hexToBytes(pinned))) throw new Error("bundle signature invalid");
  await set(PIN_KEY, pinned);
  await set(BUNDLE_KEY(gateId), bundle);
  await set(PRESENCE_KEY, {});
  return bundle;
}

export async function cachedBundle(gateId: string): Promise<Bundle | null> {
  return ((await get(BUNDLE_KEY(gateId))) as Bundle | undefined) ?? null;
}
export const bundleAgeMs = (b: Bundle | null) => (b ? Date.now() - b.issuedAt : Infinity);
export const bundleUsable = (b: Bundle | null) => !!b && bundleAgeMs(b) <= b.maxAgeHours * 3600_000;

async function seen(): Promise<Set<string>> {
  return new Set(((await get(SEEN_KEY)) as string[] | undefined) ?? []);
}
async function markSeen(k: string) {
  const s = await seen();
  s.add(k);
  await set(SEEN_KEY, Array.from(s).slice(-5000));
}
async function enqueue(e: OfflineEvent) {
  const q = ((await get(QUEUE_KEY)) as OfflineEvent[] | undefined) ?? [];
  q.push(e);
  await set(QUEUE_KEY, q);
}
export async function queueLength() {
  return (((await get(QUEUE_KEY)) as OfflineEvent[] | undefined) ?? []).length;
}
export async function syncQueue(): Promise<number> {
  const q = ((await get(QUEUE_KEY)) as OfflineEvent[] | undefined) ?? [];
  if (!q.length) return 0;
  const res = await fetch("/api/offline/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events: q }) });
  if (!res.ok) throw new Error("sync failed");
  await set(QUEUE_KEY, []);
  return q.length;
}

export async function verifyOffline(raw: string, bundle: Bundle, override: Direction | null): Promise<OfflineResult> {
  const record = async (r: { decision: Decision; reason: string; cp?: string; direction?: Direction | null; nonce?: string; sid?: string; name?: string; rollNo?: string | null }) => {
    await enqueue({ ts: Date.now(), gateId: bundle.gateId, pseudonym: r.cp ?? null, direction: r.direction ?? null, decision: r.decision, reasonCode: r.reason, nonce: r.nonce, sid: r.sid });
    return { decision: r.decision, direction: r.direction ?? null, name: r.name, rollNo: r.rollNo, reasonCode: r.reason };
  };
  try {
    const parts = raw.trim().split(".");
    if (parts.length !== 4 || parts[0] !== "IIITD1") return record({ decision: "DENY_NOT_RECOGNISED", reason: "MALFORMED" });
    const [, body, sig, devSig] = parts;
    if (!ed25519.verify(fromB64url(sig), enc.encode(`IIITD1.${body}`), hexToBytes(bundle.serverPublicKey))) return record({ decision: "DENY_NOT_RECOGNISED", reason: "BAD_SIGNATURE" });
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    const base = { cp: p.cp as string, nonce: p.n as string, sid: p.sid as string };
    if (p.t !== "S") return record({ decision: "DENY_NOT_RECOGNISED", reason: "MALFORMED" });
    if (p.exp + 5 < Date.now() / 1000) return record({ ...base, decision: "DENY_NOT_RECOGNISED", reason: "STALE_QR" });
    const cred = bundle.credentials.find((c) => c.cp === p.cp);
    if (!cred) return record({ ...base, decision: "DENY_NOT_RECOGNISED", reason: "UNKNOWN_OR_BLOCKED" });
    let ok = false;
    for (const jwk of cred.keys) {
      const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
      if (await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, fromB64url(devSig), enc.encode(`IIITD1.${body}.${sig}`))) ok = true;
    }
    if (!ok) return record({ ...base, decision: "DENY_NOT_RECOGNISED", reason: "PHONE_SIGNATURE_INVALID" });
    const s = await seen();
    if (s.has(`n:${p.n}`)) return record({ ...base, decision: "DENY_SUSPICIOUS", reason: "QR_REUSED", name: cred.name, rollNo: cred.rollNo });
    await markSeen(`n:${p.n}`);
    if (s.has(`s:${p.sid}`)) return record({ ...base, decision: "DENY_NOT_RECOGNISED", reason: "PASS_ALREADY_USED" });
    await markSeen(`s:${p.sid}`);

    const presence = ((await get(PRESENCE_KEY)) as Record<string, Direction> | undefined) ?? {};
    const last = presence[cred.cp] ?? cred.presence;
    const direction: Direction = override ?? (last === "IN" ? "OUT" : last === "OUT" ? "IN" : cred.residence === "HOSTELLER" ? "OUT" : "IN");
    await set(PRESENCE_KEY, { ...presence, [cred.cp]: direction });
    return record({ ...base, decision: "ALLOW", reason: "OK_OFFLINE", direction, name: cred.name, rollNo: cred.rollNo });
  } catch {
    return record({ decision: "DENY_NOT_RECOGNISED", reason: "OFFLINE_ERROR" });
  }
}
