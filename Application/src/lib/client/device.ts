// Browser-only: the phone credential key pair.
// The private key is generated with extractable=false, so JavaScript (and therefore
// anyone copying data from this browser) can use it to sign but can never read it.
// It is stored as a CryptoKey object in IndexedDB on this device only.
import { get, set, del } from "idb-keyval";

const KEY = "iiitd-gate-device-v1";

type Stored = { keyPair: CryptoKeyPair; deviceId?: string; owner: string };

export async function getDevice(owner: string): Promise<Stored | null> {
  try {
    const s = (await get(KEY)) as Stored | undefined;
    if (!s || s.owner !== owner) return null;
    return s;
  } catch {
    return null;
  }
}

export async function createDeviceKey(): Promise<{ keyPair: CryptoKeyPair; publicKeyJwk: JsonWebKey }> {
  const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  return { keyPair, publicKeyJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } };
}

/** Persist the key pair together with the device id the server registered for it (atomic). */
export async function saveDevice(owner: string, keyPair: CryptoKeyPair, deviceId: string) {
  await set(KEY, { keyPair, owner, deviceId } satisfies Stored);
}

export async function forgetDevice() {
  await del(KEY);
}

function b64url(buf: ArrayBuffer) {
  let s = "";
  new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function deviceSign(privateKey: CryptoKey, data: string): Promise<string> {
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, new TextEncoder().encode(data));
  return b64url(sig);
}
