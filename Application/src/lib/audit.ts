import { Prisma, type LogKind, type Direction, type Decision } from "@prisma/client";
import { prisma } from "./db";
import { sha256Hex, signString, verifyString } from "./crypto";

// Append-only, hash-chained log (SEC-10, SEC-15). Each entry stores the hash of
// the previous entry; daily checkpoints are signed with the server Ed25519 key.

export const GENESIS = "0".repeat(64);

export type LogInput = {
  kind: LogKind;
  gateId?: string | null;
  pseudonym?: string | null;
  direction?: Direction | null;
  decision?: Decision | null;
  reasonCode?: string | null;
  guardId?: string | null;
  flagged?: boolean;
  offline?: boolean;
  actorId?: string | null;
  action?: string | null;
  target?: string | null;
  detail?: Record<string, unknown> | null;
  ts?: Date;
};

type Hashable = LogInput & { seq: number; ts: Date; prevHash: string };

/** Canonical serialisation — field order fixed so hashes are reproducible. */
export function canonical(e: Hashable): string {
  return JSON.stringify([
    e.seq,
    e.ts.toISOString(),
    e.kind,
    e.gateId ?? null,
    e.pseudonym ?? null,
    e.direction ?? null,
    e.decision ?? null,
    e.reasonCode ?? null,
    e.guardId ?? null,
    !!e.flagged,
    !!e.offline,
    e.actorId ?? null,
    e.action ?? null,
    e.target ?? null,
    e.detail ? stableStringify(e.detail) : null,
    e.prevHash,
  ]);
}

/** JSON with sorted keys — Postgres jsonb does not preserve key order. */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

export function entryHash(e: Hashable): string {
  return sha256Hex(canonical(e));
}

/** Append one entry. A transaction-scoped advisory lock serialises the chain. */
export async function appendLog(input: LogInput) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(42001)`;
    const last = await tx.logEntry.findFirst({ orderBy: { seq: "desc" }, select: { seq: true, hash: true } });
    const seq = (last?.seq ?? 0) + 1;
    const prevHash = last?.hash ?? GENESIS;
    const ts = input.ts ?? new Date();
    const hash = entryHash({ ...input, seq, ts, prevHash });
    return tx.logEntry.create({
      data: {
        seq,
        ts,
        kind: input.kind,
        gateId: input.gateId ?? null,
        pseudonym: input.pseudonym ?? null,
        direction: input.direction ?? null,
        decision: input.decision ?? null,
        reasonCode: input.reasonCode ?? null,
        guardId: input.guardId ?? null,
        flagged: !!input.flagged,
        offline: !!input.offline,
        actorId: input.actorId ?? null,
        action: input.action ?? null,
        target: input.target ?? null,
        detail: input.detail ? (input.detail as Prisma.InputJsonValue) : Prisma.JsonNull,
        prevHash,
        hash,
      },
    });
  });
}

export function logAdmin(actorId: string, action: string, target: string, detail?: Record<string, unknown>) {
  return appendLog({ kind: "ADMIN", actorId, action, target, detail: detail ?? null });
}

export type ChainReport = {
  ok: boolean;
  checked: number;
  brokenAt?: number;
  lastCheckpoint?: { ts: Date; seq: number; valid: boolean };
};

/** Recompute every hash and link; verify the latest signed checkpoint. */
export async function verifyChain(): Promise<ChainReport> {
  const rows = await prisma.logEntry.findMany({ orderBy: { seq: "asc" } });
  // Gaps are legitimate only where a logged retention purge covered them.
  const purgedUpTo = rows
    .filter((r) => r.action === "RETENTION_PURGE")
    .reduce((m, r) => Math.max(m, Number((r.detail as { maxPurgedSeq?: number } | null)?.maxPurgedSeq ?? 0)), 0);
  let prev: string | null = null;
  let prevSeq = 0;
  for (const r of rows) {
    const gap = r.seq !== prevSeq + 1;
    if (gap && r.seq - 1 > purgedUpTo) return { ok: false, checked: rows.length, brokenAt: r.seq };
    if (!gap && prev !== null && r.prevHash !== prev) return { ok: false, checked: rows.length, brokenAt: r.seq };
    prevSeq = r.seq;
    const h = entryHash({ ...r, detail: (r.detail as Record<string, unknown> | null) ?? null });
    if (h !== r.hash) return { ok: false, checked: rows.length, brokenAt: r.seq };
    prev = r.hash;
  }
  const cp = await prisma.logCheckpoint.findFirst({ orderBy: { ts: "desc" } });
  let lastCheckpoint: ChainReport["lastCheckpoint"];
  if (cp) {
    const row = rows.find((r) => r.seq === cp.seq);
    const sigOk = verifyString(cp.signature, `${cp.seq}:${cp.hash}`);
    lastCheckpoint = { ts: cp.ts, seq: cp.seq, valid: sigOk && (!row || row.hash === cp.hash) };
    if (!lastCheckpoint.valid) return { ok: false, checked: rows.length, brokenAt: cp.seq, lastCheckpoint };
  }
  return { ok: true, checked: rows.length, lastCheckpoint };
}

export async function writeCheckpoint() {
  const last = await prisma.logEntry.findFirst({ orderBy: { seq: "desc" } });
  if (!last) return null;
  return prisma.logCheckpoint.create({
    data: { seq: last.seq, hash: last.hash, signature: signString(`${last.seq}:${last.hash}`) },
  });
}
