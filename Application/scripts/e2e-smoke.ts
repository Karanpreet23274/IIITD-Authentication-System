/* End-to-end test against a running LOCAL server (DEMO_LOGIN=true, `npm run db:seed:demo` done).
 *   npm run dev    (one terminal)
 *   npm run e2e    (another)
 * Simulates a student phone (real P-256 device key) and a guard device and checks the whole flow. */
import { webcrypto } from "crypto";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.E2E_BASE ?? "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("e2e runs against localhost only");
const prisma = new PrismaClient();
const subtle = webcrypto.subtle;
const b64url = (b: ArrayBuffer) => Buffer.from(b).toString("base64url");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Client {
  jar = new Map<string, string>();
  async req(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    headers.set("cookie", Array.from(this.jar, ([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(BASE + path, { ...init, headers, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      this.jar.set(kv.slice(0, i), kv.slice(i + 1));
    }
    return res;
  }
  async json<T = any>(path: string, body?: unknown, method = body === undefined ? "GET" : "POST"): Promise<T> {
    const r = await this.req(path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`${path} → ${r.status} ${JSON.stringify(j)}`);
    return j as T;
  }
  async signIn(email: string) {
    const { csrfToken } = await (await this.req("/api/auth/csrf")).json();
    await this.req("/api/auth/callback/demo", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ csrfToken, json: "true", email }) });
    const s = await (await this.req("/api/auth/session")).json();
    if (!s?.user) throw new Error(`sign-in failed for ${email}`);
    return s.user as { role: string };
  }
}

class Phone extends Client {
  keys!: CryptoKeyPair;
  deviceId!: string;
  sid!: string;
  async enrol() {
    this.keys = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
    const jwk = await subtle.exportKey("jwk", this.keys.publicKey);
    this.deviceId = (await this.json("/api/student/enrol", { publicKeyJwk: { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y } })).deviceId;
  }
  async setup(email: string, residence: "HOSTELLER" | "DAY_SCHOLAR" = "HOSTELLER") {
    await this.signIn(email);
    await this.json("/api/student/profile", { programme: "B.Tech CSE", batch: "2024", residence, hostelRoom: residence === "HOSTELLER" ? "BH-2, 101" : undefined, phone: "9876543210" });
    await this.enrol();
    return this;
  }
  async newPass() {
    this.sid = (await this.json("/api/pass/session", { deviceId: this.deviceId })).sid;
  }
  async qr(sign = true, key = this.keys.privateKey) {
    const t = await this.json("/api/pass/token", { sid: this.sid });
    if (t.state !== "LIVE") throw new Error("pass not live: " + t.state);
    const base = `IIITD1.${t.body}.${t.sig}`;
    if (!sign) return base;
    return `${base}.${b64url(await subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(base)))}`;
  }
}

const results: [string, boolean, string][] = [];
const check = (name: string, got: unknown, want: unknown) => results.push([name, got === want, `${got}${got === want ? "" : ` (want ${want})`}`]);

async function main() {
  // Fresh @iiitd.ac.in students for this run (normally created by their first Google sign-in).
  const run = Date.now().toString(36).slice(-5);
  let n = 100;
  const student = async (tag: string) => {
    const email = `e2e${tag}${run}24${n++}@iiitd.ac.in`;
    await prisma.identity.create({ data: { email, fullName: `E2E ${tag} ${run}`, firstName: "E2E" } });
    return email;
  };

  // --- Login rules ---
  const guard = new Client();
  check("guard account gets the guard app", (await guard.signIn("guard.ramesh@iiitd.ac.in")).role, "GUARD");
  let gmail = "allowed";
  await new Client().signIn("someone@gmail.com").catch(() => (gmail = "rejected"));
  check("non-IIITD e-mail cannot sign in", gmail, "rejected");

  const scan = async (raw: string, direction: "IN" | "OUT" | null = null, gateId = "main") => {
    await sleep(600);
    return guard.json("/api/scan/verify", { raw, gateId, direction });
  };

  // --- 1. Entry/exit with details ---
  const a = await new Phone().setup(await student("a"));
  check("new account gets the student app", (await a.json("/api/auth/session")).user.role, "STUDENT");
  await a.newPass();
  const q1 = await a.qr();
  const r1 = await scan(q1);
  check("valid QR → recorded", r1.decision, "ALLOW");
  check("hosteller first scan = EXIT", r1.direction, "OUT");
  check("guard sees roll no. (7 digits)", r1.student?.rollNo?.length, 7);
  check("guard sees hostel room", r1.student?.hostelRoom, "BH-2, 101");
  check("student app shows EXIT recorded", (await a.json(`/api/pass/token?sid=${a.sid}`)).direction, "OUT");
  check("same QR re-read by camera", (await scan(q1)).decision, "DENY_NOT_RECOGNISED");
  await a.newPass();
  check("next pass → ENTRY", (await scan(await a.qr())).direction, "IN");
  const reg = await guard.json(`/api/guard/register?q=${encodeURIComponent(`E2E a ${run}`)}`);
  check("register has both records", reg.rows.length, 2);
  check("register newest = ENTRY", reg.rows[0].direction, "IN");
  check("register CSV download", (await guard.req("/api/guard/register?format=csv")).headers.get("content-type")?.startsWith("text/csv"), true);

  // --- 2. Sharing attempts ---
  await a.newPass();
  check("screenshot without phone signature", (await scan(await a.qr(false))).decision, "DENY_NOT_RECOGNISED");
  const friend = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]);
  check("QR re-signed on a friend's phone", (await scan(await a.qr(true, friend.privateKey))).decision, "DENY_NOT_RECOGNISED");
  check("fake / static QR", (await scan("2021001")).decision, "DENY_NOT_RECOGNISED");

  const b = await new Phone().setup(await student("b"), "DAY_SCHOLAR");
  await b.newPass();
  const shot = await b.qr();
  await sleep(26_000);
  check("perfect screenshot shown 26 s later", (await scan(shot)).decision, "DENY_NOT_RECOGNISED");
  const fresh = await b.qr();
  check("day scholar first scan = ENTRY", (await scan(fresh)).direction, "IN");
  await prisma.passSession.update({ where: { id: b.sid }, data: { usedAt: new Date(Date.now() - 120_000) } });
  check("captured QR replayed later", (await scan(fresh, null, "back")).decision, "DENY_SUSPICIOUS");
  await prisma.alert.deleteMany({});

  // --- 3. Guard override, wrong person, block/unblock, lost phone ---
  const c = await new Phone().setup(await student("c"));
  await c.newPass();
  const rc = await scan(await c.qr(), "IN");
  check("guard override → ENTRY", rc.direction, "IN");
  await guard.json("/api/scan/not-this-person", { movementId: rc.movementId });
  check("'Not this person' removes the record", await prisma.movement.count({ where: { id: rc.movementId } }), 0);
  await prisma.alert.deleteMany({});

  const admin = new Client();
  check("admin account gets admin", (await admin.signIn("security.admin@iiitd.ac.in")).role, "ADMIN");
  const dEmail = await student("d");
  const d = await new Phone().setup(dEmail);
  await d.newPass();
  const did = (await prisma.identity.findUnique({ where: { email: dEmail } }))!.id;
  const live = await d.qr();
  await admin.json("/api/admin/students", { identityId: did, action: "block", reason: "Test hold" });
  check("blocked while QR was showing", (await scan(live)).decision, "DENY_NOT_RECOGNISED");
  let blockedPass = "allowed";
  await d.newPass().catch(() => (blockedPass = "blocked"));
  check("blocked student cannot generate QR", blockedPass, "blocked");
  await admin.json("/api/admin/students", { identityId: did, action: "unblock", reason: "Cleared" });
  await d.newPass();
  check("unblocked → works again", (await scan(await d.qr())).decision, "ALLOW");

  const e = await new Phone().setup(await student("e"));
  await e.newPass();
  const before = await e.qr();
  await e.json("/api/student/lost-phone", { confirm: "DISABLE" });
  check("lost phone: its QR is rejected", (await scan(before)).decision, "DENY_NOT_RECOGNISED");
  await e.enrol(); // same account, new phone
  await e.newPass();
  check("new phone enrolled → works", (await scan(await e.qr())).decision, "ALLOW");

  // --- 4. Repeated failures ---
  const f = await new Phone().setup(await student("f"));
  await f.newPass();
  for (let i = 0; i < 3; i++) await scan(await f.qr(false));
  check("3 failed scans → SUSPICIOUS", (await scan(await f.qr())).decision, "DENY_SUSPICIOUS");
  await prisma.alert.deleteMany({});

  // --- 5. Access control ---
  check("student → scan API", (await a.req("/api/scan/verify", { method: "POST", body: "{}" })).status, 403);
  check("student → register API", (await a.req("/api/guard/register")).status, 403);
  check("guard → admin API", (await guard.req("/api/admin/access")).status, 403);
  const newGuard = `e2eguard${run}@iiitd.ac.in`;
  await admin.json("/api/admin/access", { email: newGuard, role: "GUARD" });
  await prisma.identity.create({ data: { email: newGuard, fullName: "E2E Guard", firstName: "E2E" } });
  check("admin adds a guard → guard app", (await new Client().signIn(newGuard)).role, "GUARD");
  let gmailGuard = "accepted";
  await admin.json("/api/admin/access", { email: "x@gmail.com", role: "GUARD" }).catch(() => (gmailGuard = "rejected"));
  check("cannot add a non-IIITD guard", gmailGuard, "rejected");

  // --- 6. Tamper-evident log ---
  check("log chain intact", (await admin.json("/api/admin/verify")).ok, true);
  const victim = await prisma.logEntry.findFirst({ where: { decision: "ALLOW" }, orderBy: { seq: "desc" } });
  await prisma.logEntry.update({ where: { seq: victim!.seq }, data: { direction: victim!.direction === "IN" ? "OUT" : "IN" } });
  check("edited record detected", (await admin.json("/api/admin/verify")).ok, false);
  await prisma.logEntry.update({ where: { seq: victim!.seq }, data: { direction: victim!.direction } });
  check("chain restored", (await admin.json("/api/admin/verify")).ok, true);

  console.log("");
  for (const [name, ok, detail] of results) console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(40)} ${detail}`);
  const failed = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
