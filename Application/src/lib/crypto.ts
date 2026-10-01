import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from "@noble/hashes/utils";

// Standard primitives only (SEC-20): Ed25519 signatures, SHA-256, HMAC-SHA256.

export function b64url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}
export function fromB64url(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, "base64url"));
}

export function sha256Hex(data: string): string {
  return bytesToHex(sha256(utf8ToBytes(data)));
}

export function randomId(bytes = 16): string {
  return b64url(randomBytes(bytes));
}

function secret(name: string): string {
  const v = process.env[name];
  if (v) return v;
  if (process.env.NODE_ENV === "production") throw new Error(`Missing required secret ${name}`);
  // Development fallback only — never used in production.
  return `dev-only-${name}-${process.env.NEXTAUTH_SECRET ?? "insecure"}`;
}

export function hmacHex(key: string, data: string): string {
  return bytesToHex(hmac(sha256, utf8ToBytes(secret(key)), utf8ToBytes(data)));
}

let cachedPriv: Uint8Array | null = null;
/** Server signing key for QR tokens, gate passes, revocation lists and log checkpoints. */
function signingKey(): Uint8Array {
  if (cachedPriv) return cachedPriv;
  const hex = process.env.PASS_SIGNING_KEY;
  if (hex && /^[0-9a-f]{64}$/i.test(hex)) cachedPriv = hexToBytes(hex);
  else if (process.env.NODE_ENV === "production") throw new Error("PASS_SIGNING_KEY must be 32 bytes hex");
  else cachedPriv = sha256(utf8ToBytes(secret("PASS_SIGNING_KEY")));
  return cachedPriv;
}

export function serverPublicKeyHex(): string {
  return bytesToHex(ed25519.getPublicKey(signingKey()));
}

export function signBytes(data: Uint8Array): Uint8Array {
  return ed25519.sign(data, signingKey());
}

export function verifyBytes(sig: Uint8Array, data: Uint8Array, pubHex = serverPublicKeyHex()): boolean {
  try {
    return ed25519.verify(sig, data, hexToBytes(pubHex));
  } catch {
    return false;
  }
}

export function signString(s: string): string {
  return b64url(signBytes(utf8ToBytes(s)));
}

export function verifyString(sigB64: string, s: string): boolean {
  try {
    return verifyBytes(fromB64url(sigB64), utf8ToBytes(s));
  } catch {
    return false;
  }
}

/** Verify an ECDSA P-256 (WebCrypto, raw r||s) signature made by a student's device key. */
export async function verifyDeviceSignature(jwk: JsonWebKey, sigB64: string, data: string): Promise<boolean> {
  try {
    const subtle = globalThis.crypto.subtle;
    const key = await subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
    return await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, fromB64url(sigB64), new TextEncoder().encode(data));
  } catch {
    return false;
  }
}

/** Short pseudonym for logs, e.g. "C-7f3a91c2". */
export function newPseudonym(): string {
  return "C-" + bytesToHex(randomBytes(4));
}
