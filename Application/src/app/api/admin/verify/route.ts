import { NextResponse } from "next/server";
import { api, requireAdmin } from "@/lib/rbac";
import { verifyChain, writeCheckpoint } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Tamper check of the scan log: recompute the hash chain and check the signed checkpoint.
export const GET = api(async () => {
  await requireAdmin();
  return NextResponse.json(await verifyChain());
});

export const POST = api(async () => {
  await requireAdmin();
  const cp = await writeCheckpoint();
  return NextResponse.json({ ok: true, seq: cp?.seq ?? null });
});
