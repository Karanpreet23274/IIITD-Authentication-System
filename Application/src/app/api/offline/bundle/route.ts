import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { api, requireGuard } from "@/lib/rbac";
import { serverPublicKeyHex, signString } from "@/lib/crypto";
import { CONFIG } from "@/lib/config";

export const dynamic = "force-dynamic";

// Signed verification list for the guard tablet so scanning keeps working if the
// network drops: active passes with their phone PUBLIC keys and the minimum details
// needed to fill the register (name, roll no.). No secrets, no phone numbers.
export const GET = api(async (req: Request) => {
  await requireGuard();
  const gateId = new URL(req.url).searchParams.get("gate") ?? "";
  const creds = await prisma.credential.findMany({
    where: { status: "ACTIVE" },
    select: {
      pseudonym: true,
      identity: { select: { fullName: true, rollNo: true, presence: true, residence: true } },
      devices: { where: { revokedAt: null }, select: { publicKeyJwk: true } },
    },
  });
  const payload = {
    issuedAt: Date.now(),
    maxAgeHours: CONFIG.OFFLINE_MAX_HOURS,
    gateId,
    serverPublicKey: serverPublicKeyHex(),
    credentials: creds
      .filter((c) => c.devices.length)
      .map((c) => ({ cp: c.pseudonym, name: c.identity.fullName, rollNo: c.identity.rollNo, presence: c.identity.presence, residence: c.identity.residence, keys: c.devices.map((d) => d.publicKeyJwk) })),
  };
  const body = JSON.stringify(payload);
  return NextResponse.json({ body, sig: signString(body) });
});
