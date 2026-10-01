import type { Decision, Direction, Residence } from "@prisma/client";
import { prisma } from "./db";
import { appendLog } from "./audit";
import { CONFIG } from "./config";
import { verifyDeviceSignature } from "./crypto";
import { DECISION_COPY } from "./decisions";
import { liveColour, photoUrl } from "./photo";
import { deviceSigningInput, parseToken, type StudentTokenPayload } from "./token";

// Gate scan pipeline:
//   server signature → freshness (≈20 s) → phone signature → single-use → pass/credential status
//   → repeated-failure check → ALLOW → digital ENTRY/EXIT record
// Any error results in a denial, never an allow.

export type StudentDetails = {
  fullName: string;
  firstName: string;
  rollNo: string | null;
  programme: string | null;
  batch: string | null;
  residence: Residence | null;
  hostelRoom: string | null;
  phone: string | null;
  email: string;
  photoUrl: string | null;
};

export type GuardView = {
  decision: Decision;
  seq: number;
  movementId: string | null;
  direction: Direction | null;
  student: StudentDetails | null;
  gateId: string;
  gateName: string;
  at: string;
  liveColour: { name: string; hex: string };
};

type Ident = {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  rollNo: string | null;
  programme: string | null;
  batch: string | null;
  residence: Residence | null;
  hostelRoom: string | null;
  phone: string | null;
  presence: Direction | null;
  photo: { id: string } | null;
};

type Outcome = {
  decision: Decision;
  reasonCode: string;
  pseudonym: string | null;
  identity?: Ident;
};

const deny = (decision: Decision, reasonCode: string, extra: Partial<Outcome> = {}): Outcome => ({ decision, reasonCode, pseudonym: null, ...extra });

async function evaluate(p: StudentTokenPayload, body: string, sig: string, deviceSig: string | undefined): Promise<Outcome> {
  const now = Date.now();
  const nowS = Math.floor(now / 1000);
  if (p.exp + CONFIG.CLOCK_SKEW_SECONDS < nowS) return deny("DENY_NOT_RECOGNISED", "STALE_QR", { pseudonym: p.cp });
  if (p.iat - CONFIG.CLOCK_SKEW_SECONDS > nowS) return deny("DENY_NOT_RECOGNISED", "FUTURE_QR", { pseudonym: p.cp });

  const session = await prisma.passSession.findUnique({
    where: { id: p.sid },
    include: { credential: true, identity: { include: { photo: { select: { id: true } } } } },
  });
  if (!session || session.credential.pseudonym !== p.cp) return deny("DENY_NOT_RECOGNISED", "UNKNOWN_PASS", { pseudonym: p.cp });

  // The QR must be co-signed by the key that lives only on the student's enrolled phone.
  const device = await prisma.device.findUnique({ where: { id: session.deviceId } });
  if (!device || device.revokedAt || !deviceSig) return deny("DENY_NOT_RECOGNISED", "NOT_FROM_ENROLLED_PHONE", { pseudonym: p.cp });
  if (!(await verifyDeviceSignature(device.publicKeyJwk as JsonWebKey, deviceSig, deviceSigningInput(body, sig)))) {
    return deny("DENY_NOT_RECOGNISED", "PHONE_SIGNATURE_INVALID", { pseudonym: p.cp });
  }

  const base = { pseudonym: p.cp, identity: session.identity };

  // Camera re-reading a pass that was just accepted: harmless duplicate, not an attack.
  if (session.usedAt && now - session.usedAt.getTime() < 60_000) return { ...deny("DENY_NOT_RECOGNISED", "PASS_ALREADY_USED"), pseudonym: p.cp };

  // Every QR works once.
  const fresh = await prisma.usedNonce.createMany({ data: [{ nonce: p.n }], skipDuplicates: true });
  if (fresh.count === 0) return { ...base, decision: "DENY_SUSPICIOUS", reasonCode: "QR_REUSED" };

  if (session.revokedAt || session.expiresAt.getTime() < now) return { ...deny("DENY_NOT_RECOGNISED", "PASS_EXPIRED"), pseudonym: p.cp };
  if (session.usedAt) return { ...deny("DENY_NOT_RECOGNISED", "PASS_ALREADY_USED"), pseudonym: p.cp };
  if (session.credential.status !== "ACTIVE") return { ...base, decision: "DENY_BLOCKED", reasonCode: `CREDENTIAL_${session.credential.status}` };

  if ((await prisma.alert.count({ where: { pseudonym: p.cp, status: "OPEN" } })) > 0) return { ...base, decision: "DENY_SUSPICIOUS", reasonCode: "OPEN_ALERT" };
  if ((await recentFailures(p.cp)) >= CONFIG.SUSPICIOUS_PER_CREDENTIAL) return { ...base, decision: "DENY_SUSPICIOUS", reasonCode: "REPEATED_FAILURES" };

  // One movement per pass; atomic so two scans cannot both succeed.
  const consumed = await prisma.passSession.updateMany({ where: { id: session.id, usedAt: null }, data: { usedAt: new Date() } });
  if (consumed.count !== 1) return { ...base, decision: "DENY_SUSPICIOUS", reasonCode: "CONCURRENT_USE" };
  return { ...base, decision: "ALLOW", reasonCode: "OK" };
}

function windowStart() {
  return new Date(Date.now() - CONFIG.SUSPICIOUS_WINDOW_MIN * 60_000);
}

async function recentFailures(pseudonym: string) {
  return prisma.logEntry.count({ where: { kind: "ACCESS", pseudonym, ts: { gte: windowStart() }, decision: { not: "ALLOW" } } });
}

export async function raiseAlert(gateId: string | null, pseudonym: string | null, kind: string, message: string) {
  const existing = await prisma.alert.findFirst({ where: { gateId, pseudonym, kind, status: "OPEN", ts: { gte: windowStart() } } });
  if (existing) return existing;
  return prisma.alert.create({ data: { gateId, pseudonym, kind, message } });
}

export async function setGateDisplay(gateId: string, decision: Decision, direction: Direction | null = null) {
  const c = DECISION_COPY[decision];
  const display =
    decision === "ALLOW"
      ? {
          state: "RESULT",
          tone: "allow",
          title: direction === "OUT" ? "Exit recorded — goodbye" : "Entry recorded — welcome",
          titleHi: direction === "OUT" ? "निकास दर्ज — शुभ यात्रा" : "प्रवेश दर्ज — स्वागत है",
        }
      : { state: "RESULT", tone: c.tone, title: c.userTitle, titleHi: c.userTitleHi };
  await prisma.gate.update({ where: { id: gateId }, data: { display, displayAt: new Date() } });
}

/** Direction: the guard's choice if given, else the opposite of the student's last movement. */
export function nextDirection(presence: Direction | null, residence: Residence | null, override?: Direction | null): Direction {
  if (override) return override;
  if (presence === "IN") return "OUT";
  if (presence === "OUT") return "IN";
  return residence === "HOSTELLER" ? "OUT" : "IN"; // first ever scan
}

export function details(i: Ident, photoTtl?: number): StudentDetails {
  return {
    fullName: i.fullName,
    firstName: i.firstName,
    rollNo: i.rollNo,
    programme: i.programme,
    batch: i.batch,
    residence: i.residence,
    hostelRoom: i.hostelRoom,
    phone: i.phone,
    email: i.email,
    photoUrl: i.photo ? photoUrl(i.id, photoTtl) : null,
  };
}

/** Full decision for one QR shown at a gate, plus the digital register entry on success. */
export async function decideScan(raw: string, gateId: string, guard: { id: string; email: string }, override?: Direction | null): Promise<GuardView> {
  const gate = await prisma.gate.findUnique({ where: { id: gateId } });
  if (!gate) throw new Error("Unknown gate");

  let o: Outcome;
  try {
    const parsed = parseToken(raw);
    if (!parsed.ok) o = deny("DENY_NOT_RECOGNISED", parsed.reason);
    else if (parsed.payload.t === "S") o = await evaluate(parsed.payload, parsed.body, parsed.sig, parsed.deviceSig);
    else o = deny("DENY_NOT_RECOGNISED", "NOT_A_STUDENT_PASS");
  } catch (e) {
    console.error("decideScan failed", (e as Error).message);
    o = deny("DENY_NOT_RECOGNISED", "SYSTEM_ERROR");
  }

  const direction = o.decision === "ALLOW" && o.identity ? nextDirection(o.identity.presence, o.identity.residence, override) : null;
  const entry = await appendLog({
    kind: "ACCESS",
    gateId,
    pseudonym: o.pseudonym,
    direction,
    decision: o.decision,
    reasonCode: o.reasonCode,
    guardId: guard.id,
    flagged: o.decision === "DENY_SUSPICIOUS" || o.decision === "DENY_BLOCKED",
  });

  let movementId: string | null = null;
  if (o.decision === "ALLOW" && o.identity && direction) {
    const now = new Date();
    const m = await prisma.movement.create({ data: { identityId: o.identity.id, direction, gateId, guardEmail: guard.email, ts: now, logSeq: entry.seq } });
    await prisma.identity.update({ where: { id: o.identity.id }, data: { presence: direction, presenceAt: now } });
    movementId = m.id;
  } else if (o.decision === "DENY_SUSPICIOUS") {
    await raiseAlert(gateId, o.pseudonym, "SUSPICIOUS", `Suspicious scan (${o.reasonCode})`);
  } else if (o.pseudonym && (await recentFailures(o.pseudonym)) >= CONFIG.SUSPICIOUS_PER_CREDENTIAL) {
    await raiseAlert(gateId, o.pseudonym, "REPEATED_FAILURES", `${CONFIG.SUSPICIOUS_PER_CREDENTIAL}+ failed scans in ${CONFIG.SUSPICIOUS_WINDOW_MIN} min`);
  }
  await setGateDisplay(gateId, o.decision, direction);

  const showId = DECISION_COPY[o.decision].showIdentity && !!o.identity;
  return {
    decision: o.decision,
    seq: entry.seq,
    movementId,
    direction,
    student: showId && o.identity ? details(o.identity) : null,
    gateId,
    gateName: gate.name,
    at: new Date().toISOString(),
    liveColour: liveColour(),
  };
}
