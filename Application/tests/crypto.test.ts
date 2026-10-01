import { describe, expect, it } from "vitest";
import { webcrypto } from "crypto";
import { makeStudentToken, parseToken, deviceSigningInput } from "@/lib/token";
import { verifyDeviceSignature } from "@/lib/crypto";
import { canonical, entryHash, GENESIS } from "@/lib/audit";
import { nextDirection } from "@/lib/engine";
import { rollFromEmail, isIiitdEmail } from "@/lib/auth";

const b64url = (buf: ArrayBuffer) => Buffer.from(buf).toString("base64url");

describe("IIITD-only identity", () => {
  it("accepts only @iiitd.ac.in", () => {
    expect(isIiitdEmail("aarav21001@iiitd.ac.in")).toBe(true);
    expect(isIiitdEmail("AARAV21001@IIITD.AC.IN")).toBe(true);
    expect(isIiitdEmail("someone@gmail.com")).toBe(false);
    expect(isIiitdEmail("x@iiitd.ac.in.evil.com")).toBe(false);
  });
  it("derives roll no. and batch from the IIITD e-mail", () => {
    expect(rollFromEmail("aarav21001@iiitd.ac.in")).toEqual({ rollNo: "2021001", batch: "2021" });
    expect(rollFromEmail("guard.ramesh@iiitd.ac.in")).toBeNull();
  });
});

describe("live QR token", () => {
  it("round-trips a server-signed token", () => {
    const t = makeStudentToken("sess1", "C-abcd1234", 20);
    const p = parseToken(`IIITD1.${t.body}.${t.sig}`);
    expect(p.ok && p.payload.sid === "sess1" && p.payload.exp - p.payload.iat === 20).toBe(true);
  });
  it("rejects a tampered payload", () => {
    const t = makeStudentToken("sess1", "C-abcd1234", 20);
    const forged = Buffer.from(JSON.stringify({ ...t.payload, cp: "C-ffffffff" })).toString("base64url");
    expect(parseToken(`IIITD1.${forged}.${t.sig}`)).toEqual({ ok: false, reason: "BAD_SIGNATURE" });
  });
  it("rejects static / arbitrary QR content", () => {
    expect(parseToken("2021001").ok).toBe(false);
    expect(parseToken("https://example.com").ok).toBe(false);
  });
  it("accepts only the enrolled phone's signature", async () => {
    const kp = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
    const other = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
    const jwk = await webcrypto.subtle.exportKey("jwk", kp.publicKey);
    const t = makeStudentToken("s", "C-1", 20);
    const input = deviceSigningInput(t.body, t.sig);
    const sign = async (k: CryptoKey) => b64url(await webcrypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, new TextEncoder().encode(input)));
    expect(await verifyDeviceSignature(jwk as JsonWebKey, await sign(kp.privateKey), input)).toBe(true);
    expect(await verifyDeviceSignature(jwk as JsonWebKey, await sign(other.privateKey), input)).toBe(false);
  });
});

describe("entry / exit direction", () => {
  it("alternates based on the last movement", () => {
    expect(nextDirection("IN", "HOSTELLER")).toBe("OUT");
    expect(nextDirection("OUT", "DAY_SCHOLAR")).toBe("IN");
  });
  it("first scan: hosteller is leaving, day scholar is arriving", () => {
    expect(nextDirection(null, "HOSTELLER")).toBe("OUT");
    expect(nextDirection(null, "DAY_SCHOLAR")).toBe("IN");
  });
  it("guard override wins", () => {
    expect(nextDirection("IN", "HOSTELLER", "IN")).toBe("IN");
  });
});

describe("tamper-evident log", () => {
  it("changes the hash if any field is altered", () => {
    const e = { seq: 1, ts: new Date("2026-10-01T10:00:00Z"), kind: "ACCESS" as const, decision: "ALLOW" as const, direction: "IN" as const, prevHash: GENESIS };
    const h = entryHash(e);
    expect(entryHash({ ...e, direction: "OUT" })).not.toBe(h);
    expect(entryHash({ ...e, decision: "DENY_BLOCKED" })).not.toBe(h);
    expect(entryHash({ ...e })).toBe(h);
  });
  it("is independent of JSON key order in detail", () => {
    const base = { seq: 2, ts: new Date(0), kind: "ADMIN" as const, prevHash: GENESIS };
    expect(canonical({ ...base, detail: { a: 1, b: { c: 2, d: 3 } } })).toBe(canonical({ ...base, detail: { b: { d: 3, c: 2 }, a: 1 } }));
  });
});
