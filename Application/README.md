# IIITD Gate Entry

Students no longer show an ID card or write in a register at the gate. They sign in with their **IIITD Google account**, generate a **live QR** on their phone and show it to the guard. The guard scans it, and an **entry or exit is recorded digitally** with the student's details and the time. The QR cannot be shared: screenshots, forwarded images and other phones are rejected.

**Stack:** Next.js 14 · TypeScript · Prisma + PostgreSQL · NextAuth (Google, `@iiitd.ac.in` only) · Tailwind. Deploys to Vercel.

## The two apps

Everyone signs in the same way, with **Continue with IIITD Google**. Google verifies the account and the app accepts only verified accounts from the `iiitd.ac.in` Workspace. Which app opens depends on the guard list:

| Who | Gets | What they do |
|---|---|---|
| Any IIITD account | **Student app** | First time: confirm details (name, e-mail and photo from IIITD; roll no. and batch from the e-mail; programme, hostel/day scholar and mobile entered once) and enrol their phone. Then **Generate gate QR**, show it to the guard and see their own entries and exits. Report a lost phone. |
| E-mails on the guard list | **Guard app** | Scan the QR (camera or USB/Bluetooth scanner). The screen shows **ENTRY RECORDED / EXIT RECORDED** with photo, name, roll no., programme, batch, hostel/room and mobile. **Not this person** cancels the record if the face doesn't match. Full **entry/exit register** with search, date filter and CSV download. |
| Admins (`ADMIN_EMAILS` + list) | **Admin page** | Add or remove guards, look up students, block or unblock a pass, review security alerts, run the tamper check on the scan log. |

Entry or exit is decided automatically: a student who is inside gets an **exit**, one who is outside gets an **entry**. On the very first scan, hostellers get an exit and day scholars an entry. The guard can force Entry or Exit with one tap.

## Why the QR can't be shared

| Protection | How |
|---|---|
| Live for 5 minutes | The student taps *Generate gate QR*. Only one live QR exists per student. |
| Changes every 15 s | Each QR is signed by the server (Ed25519) and expires about 20 s later, so a screenshot is stale within seconds. |
| Only from the student's phone | Each QR is also signed with a **non-extractable key created on the student's phone**. It cannot be copied, so a friend logged into the same account on another phone is rejected. Only one phone can be enrolled at a time. |
| Works once | Each QR and each pass is single-use. Reusing a captured QR is flagged as SUSPICIOUS and raises an alert. |
| Visibly live | Moving watermark with name and clock, animated background and a "colour of the minute" the guard also sees. The QR blurs if the app is in the background. |

## Run locally

```bash
npm install
cp .env.example .env        # set DATABASE_URL / DATABASE_URL_UNPOOLED, then add the output of: npm run keys
npm run db:push
npm run db:seed:demo        # gates + demo students, 2 guards, 1 admin (all @iiitd.ac.in)
npm run dev
```

Set `DEMO_LOGIN="true"` locally to use the demo accounts without Google. **Never set it in production.**

```bash
npm test       # unit tests
npm run e2e    # 36 end-to-end checks against the running dev server
```

The end-to-end checks cover login rules, entry/exit with details, the register, screenshots, friend's phone, replay, guard override, Not this person, block/unblock, lost phone, repeated failures, access control and tamper detection.

## Deploy to Vercel

1. **Database:** create a Neon Postgres database. Put the pooled URL in `DATABASE_URL` and the direct URL in `DATABASE_URL_UNPOOLED`.
2. **Google sign-in:** in Google Cloud Console (ideally a project inside the IIITD Workspace), create an OAuth client of type *Web*.
   - Authorised redirect URI: `https://<your-app>.vercel.app/api/auth/callback/google`
   - Setting the consent screen to **Internal** limits it to IIITD accounts at Google's end too.
3. **Vercel:** push the `Application/` folder to GitHub and import it with **Root Directory = `Application`**. Add every variable from `.env.example`:
   - `NEXTAUTH_URL` = your Vercel URL
   - the output of `npm run keys`
   - the Google client ID and secret
   - `ADMIN_EMAILS` = the security office's IIITD e-mail
   - `DEMO_LOGIN=false`
4. **Database setup:** with the production DB URLs in your local `.env`, run `npm run db:push` and `npm run db:seed` (gates only, no demo accounts).
5. **Guards:** sign in as the admin and add the guards' IIITD e-mails on the **Guards & admins** page. Then open `/guard` on each gate device and pick its gate.
6. **Scheduled jobs:** `vercel.json` runs the daily log checkpoint (23:30 IST) and the nightly clean-up. Records are kept for `RETENTION_DAYS` (default 365).

## Notes

* Guards need IIITD Google accounts. If some don't have one, the security office can create them in the IIITD Workspace.
* A web app cannot block the phone's screenshot button. The QR is designed so a screenshot is useless instead. Blocking at the OS level needs a native Android wrapper (`FLAG_SECURE`).
* If the gate device loses internet, it keeps verifying QRs for up to 4 h using a signed list. Those records upload automatically when it reconnects.
