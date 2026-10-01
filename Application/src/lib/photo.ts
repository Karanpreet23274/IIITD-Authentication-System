import { CONFIG } from "./config";
import { hmacHex } from "./crypto";

// Photo URLs are short-lived and HMAC-signed (F6: "photo URL (signed, 60 s)").

export function photoUrl(identityId: string, ttl = CONFIG.PHOTO_URL_SECONDS): string {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = hmacHex("PHOTO_HMAC_SECRET", `${identityId}.${exp}`).slice(0, 32);
  return `/api/photo/${identityId}?e=${exp}&s=${sig}`;
}

export function verifyPhotoSig(identityId: string, exp: number, sig: string): boolean {
  if (!exp || exp < Date.now() / 1000) return false;
  const expected = hmacHex("PHOTO_HMAC_SECRET", `${identityId}.${exp}`).slice(0, 32);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

// "Colour of the minute": a live, unpredictable colour shown on both the student's
// pass and the guard's result, so a screenshot or recording is visibly stale.
export const LIVE_COLOURS = [
  { name: "Teal", hex: "#0d9488" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Orange", hex: "#ea580c" },
  { name: "Blue", hex: "#2563eb" },
  { name: "Pink", hex: "#db2777" },
  { name: "Lime", hex: "#65a30d" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Amber", hex: "#d97706" },
];

export function liveColour(at = Date.now()) {
  const minute = Math.floor(at / 60_000);
  const idx = parseInt(hmacHex("PASS_COLOUR_SECRET", String(minute)).slice(0, 8), 16) % LIVE_COLOURS.length;
  return LIVE_COLOURS[idx];
}
