import { b64url, fromB64url, randomId, signString, verifyString } from "./crypto";

// Compact signed token carried in the QR code (JWT/CWT-style, RFC 7519 concept).
//   IIITD1.<payload b64url>.<server Ed25519 sig>[.<device ECDSA sig>]
// The device signature covers "<payload>.<serverSig>" and binds the live pass to
// the enrolled phone. Tokens contain only pseudonymous IDs — never a name or roll no.

export const TOKEN_PREFIX = "IIITD1";

export type StudentTokenPayload = {
  t: "S";
  sid: string; // pass session id
  cp: string; // credential pseudonym
  iat: number;
  exp: number;
  n: string; // nonce (single use)
};

export type TokenPayload = StudentTokenPayload;

export function signPayload(payload: TokenPayload): { body: string; sig: string } {
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  return { body, sig: signString(`${TOKEN_PREFIX}.${body}`) };
}

export function makeStudentToken(sid: string, cp: string, ttlSeconds: number, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const payload: StudentTokenPayload = { t: "S", sid, cp, iat, exp: iat + ttlSeconds, n: randomId(12) };
  return { payload, ...signPayload(payload) };
}

export type ParsedToken =
  | { ok: true; payload: TokenPayload; body: string; sig: string; deviceSig?: string }
  | { ok: false; reason: "MALFORMED" | "BAD_SIGNATURE" };

/** Parse and verify the server signature. Freshness/replay are checked by the engine. */
export function parseToken(raw: string): ParsedToken {
  const parts = raw.trim().split(".");
  if (parts.length < 3 || parts.length > 4 || parts[0] !== TOKEN_PREFIX) return { ok: false, reason: "MALFORMED" };
  const [, body, sig, deviceSig] = parts;
  if (!verifyString(sig, `${TOKEN_PREFIX}.${body}`)) return { ok: false, reason: "BAD_SIGNATURE" };
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as TokenPayload;
    if (!payload || typeof payload !== "object" || !("t" in payload)) return { ok: false, reason: "MALFORMED" };
    return { ok: true, payload, body, sig, deviceSig };
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
}

/** The exact string the student's device key signs. */
export function deviceSigningInput(body: string, sig: string) {
  return `${TOKEN_PREFIX}.${body}.${sig}`;
}
