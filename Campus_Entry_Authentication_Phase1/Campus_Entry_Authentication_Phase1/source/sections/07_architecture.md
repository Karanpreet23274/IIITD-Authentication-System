# 26. Credential Lifecycle

Diagram: `05_Workflows/Credential_Lifecycle.png` (Appendix J, Figure J-4). Every transition is an authenticated, authorised, logged administrative or self-service action (SEC-12).

| # | Stage | Trigger | Who | What happens | State after | Security controls | Usability notes |
|---|---|---|---|---|---|---|---|
| 1 | **Issuance** | Admission / joining; replacement request | Issuer (ID cell) | Identity confirmed against roster and documents (per institutional policy; SP 800-63A [1] as reference). A credential record is created and bound to the identity. For cards: a fresh per-card AES key is generated in the HSM, diversified from a master key with the card's serial, and written to the card in a secure personalisation step [3, 41]. For phones: an enrolment link/QR with a one-time code is issued. Validity period set (default: programme end + grace, configurable). | ISSUED (inactive) | Roster match required (FR-07); MFA for issuer (SEC-11); key never leaves HSM in clear (SEC-18); issuance logged (SEC-12) | Student does nothing for a card; phone enrolment ≤3 min (USE-07) |
| 2 | **Activation** | Card: first tap at any reader; or explicit activation by issuer. Phone: student completes enrolment (app generates key pair in hardware keystore, sends public key with one-time code). | Student / Issuer | Status becomes ACTIVE; for phone, public key stored; card first-tap activation prevents pre-issued cards in transit from being usable | ACTIVE | One-time code single-use, 24 h expiry; activation logged | First-tap activation is invisible to the student |
| 3 | **Normal use** | Every gate presentation | Student, Reader, Services | Authentication (challenge–response / token verify) → validity check → authorization → decision → log | ACTIVE | SEC-01..05, SEC-09, SEC-10 | ≤1.5 s (USE-01) |
| 4 | **Temporary suspension** | Disciplinary hold, unpaid dues, leave of absence, suspicious activity pending review | Issuer / Policy admin | Status → SUSPENDED; credential authenticates but authorization fails with DENY–REVOKED-class message (guard sees "Not permitted — Security Office"; reason not shown). Reversible: lifting suspension returns to ACTIVE. | SUSPENDED | Two-step confirm (SEC-11); logged with reason (SEC-12); pushed to gates (FR-08) | Student notified via app/e-mail with generic reason and contact |
| 5 | **Lost / stolen report** | Student reports via app/portal or in person | Student (self-service) / Issuer | Immediate revocation of *that* credential only (card or phone); other credentials of the same identity remain active; replacement request auto-created | REVOKED (that credential) | Self-service requires app login (phone unlock + account auth); irreversible (SEC-17); logged | Meher persona: seconds, from her phone, no queue (T4, screen 18) |
| 6 | **Revocation** | Lost/stolen; disciplinary; withdrawal; compromise of a card batch; key rotation | Student (own) / Issuer | Status → REVOKED permanently; credential ID added to revocation list; list re-signed and pushed to all readers; offline readers pick it up at next sync | REVOKED | Irreversible (SEC-17); ≤30 s online propagation (FR-08); signed list (SEC-19); logged | Guard sees "REVOKED — direct to Security Office" only (screen 8) |
| 7 | **Replacement** | After revocation, if the identity remains a member | Issuer | New credential issued (stage 1) with new key; old remains REVOKED; identity record unchanged | New: ISSUED → ACTIVE | Same as issuance | Replacement SLA is an institutional decision; app shows request status |
| 8 | **Expiration** | Validity end date reached | System (automatic) | Status → EXPIRED; authenticates but authorization fails with DENY–EXPIRED; distinct from revoked so the guard's next step is "renew at ID cell", not "Security Office" | EXPIRED | SEC-03; enforced server-side and in offline cache | App reminds 30/7/1 days before (USE-13) |
| 9 | **Renewal** | Programme extension, role change, continuing membership | Issuer | Validity extended on the *same* credential (no re-personalisation) if key and chip family are still approved; else replacement | ACTIVE | Roster check; logged | No student action for card |
| 10 | **Retirement / deletion** | Member leaves; credential revoked or expired beyond retention; chip family deprecated | System / Issuer | Credential record retained 1 year after revocation/expiry for fraud correlation (PRIV-05), then deleted; key material destroyed in HSM [3]; card physically collected or instructed to be destroyed; identity record retained per institutional records policy, not by this system | DELETED | Deletion logged; keys zeroised; chip-family deprecation triggers batch re-issuance (lesson from [8, 9]) | Exit process includes card return |

**Key rotation.** The master diversification key is rotated on a schedule (e.g., annually) or on suspected compromise; new cards use the new master; old cards continue to work until replaced because the HSM retains prior masters for verification only (SP 800-57 [3]). The revocation-list signing key and the token signing key are rotated on a schedule with overlap so readers hold both old and new public keys during transition.

---

# 27. Security Architecture

Phase 1 defines the model; Phase 2 implements it with standard libraries only (SEC-20). Diagram: `System_Architecture.png` (Figure J-13) shows components; this section explains the controls.

## 27.1 Authentication

| Path | Mechanism | Standard | Phase 2 implementation note |
|---|---|---|---|
| Smart card | Reader ↔ card mutual authentication with per-card AES-128 key (three-pass challenge–response as in DESFire EV3 / Plus EV2 [41]); reader forwards proof to server or verifies locally with SAM/derived key | ISO/IEC 14443 [23]; AES | Use vendor SDK or libfreefare-class library; never read/accept UID alone (SEC-01). If a SAM is unavailable, the reader forwards the card's response to the server, which holds the diversification key in HSM. |
| Phone NFC (Android HCE) | Phone emulates a card; app holds an Ed25519 private key in hardware keystore; reader sends nonce; app signs (nonce ‖ readerID ‖ timestamp) | Ed25519 [38]; HCE | Android only in Phase 2; iOS card emulation not available to third-party apps without entitlements. |
| Dynamic QR | App displays a signed token {credential pseudonym, issued-at, expiry (30–60 s), nonce, gate hint} signed with the same Ed25519 key; reader camera decodes and verifies with the stored public key; server-side replay cache on token ID | JWT/CWT-style compact token [40]; TOTP concept [37] | Works offline at reader if public keys cached. |
| Visitor pass | Server-signed token {pass ID, host ID, window, gate set, use-count limit}; single/limited-use enforced server-side; offline readers accept once and reconcile | Ed25519 [38] | Delivered as QR image; printable at gate kiosk. |
| Administrator | Username + password (or SSO) + second factor (TOTP app or FIDO2 key); step-up confirm for high-impact ops | NIST 800-63B AAL2 [1] | Use institutional SSO if available. |
| Reader (as a client) | Mutual TLS with per-reader client certificate issued by the campus PKI; server certificate pinned on reader | TLS 1.3 [39] | Reader private key in secure element/TPM where hardware permits. |

## 27.2 Authorization

Policy engine evaluates, for each authenticated principal P at gate G at time t:

```
status(P.credential) == ACTIVE                                   -- else DENY-REVOKED / DENY-EXPIRED
AND role(P) in policy(G).allowed_roles
AND t within policy(G).allowed_windows[role(P)]
AND (P is visitor) => G in pass.gate_set AND t in pass.window AND pass.uses < limit
AND no active alert on P.credential (SEC-13)                     -- else DENY-SUSPICIOUS
=> ALLOW ; else DENY-NOT-AUTHORIZED
```

Policies are data (FR-18), versioned and logged. Default policy (secure default): a role with no explicit rule is denied. Authorization failure messages are distinct from authentication failure (USE-03).

## 27.3 Secure communication

All channels TLS 1.3 with mutual authentication (SEC-05). Decisions returned to readers are signed by the decision service so a rogue server or MITM cannot inject ALLOW (TH-12). Reader→server messages carry credential pseudonym, gate ID, nonce, response/token, timestamp; never name or photo. Server→reader/guard-tablet responses carry decision code, display name, photo URL with short-lived signed access, next-step code.

## 27.4 Key and secret management (concept, per NIST SP 800-57 [3])

| Key | Purpose | Custody | Rotation | Never present on |
|---|---|---|---|---|
| Card master diversification key | Derive per-card AES keys | HSM only | Annual or on compromise; old masters retained for verify | Readers, DB, app |
| Per-card AES key | Card challenge–response | Card chip (write-once); derivable in HSM | Per card lifecycle | Readers (unless SAM), DB in clear |
| Phone credential key pair | Sign nonces/tokens | Private: phone hardware keystore; public: credential table | Per enrolment; revoke on device loss | Server (private) |
| Token / visitor pass signing key | Sign QR tokens and passes | HSM | Quarterly with overlap | Readers hold public only |
| Revocation-list signing key | Sign offline lists | HSM | Annual with overlap | Readers hold public only |
| Decision signing key | Sign ALLOW/DENY to readers | HSM/KMS | Quarterly | Readers hold public only |
| Reader client certs | Mutual TLS | Reader secure element | Annual; revoke on tamper | — |
| Log checkpoint signing key | Sign hash-chain checkpoints | HSM | Annual | — |
| DB encryption keys | At-rest encryption | KMS | Per KMS policy | App servers in clear |

## 27.5 Least privilege and role-based access (SEC-07)

Six roles (Guard, Supervisor, Issuer, Approver, Auditor, Policy Admin) with the permission matrix in Section 21.1. Enforced at the API layer (not only in the UI). Separation of duties: Issuer ∩ Auditor = ∅; Policy Admin ∩ Guard = ∅. Service accounts for internal components have the minimum DB grants (auth service: read credential status; log service: append only; retention job: delete by age only).

## 27.6 Data minimisation and secure defaults

Schema contains only SEC-14 fields. Defaults: new gate policy denies all; new reader is disabled until certificate issued and policy assigned; logging on; retention 90 days; re-identification requires justification; guard display shows minimal set; offline max age N = 4 h; SEC-13 thresholds on.

## 27.7 Failure handling (summary; detail in Section 32)

Ordered degradation: **Online** → **Offline-verified** (cached public keys + signed revocation list ≤ N h) → **Manual Verification Mode** (defined procedure, supervisor involvement, everything logged and flagged) → **Emergency** (egress always free; ingress by supervisor authorisation, logged). No state auto-allows.

## 27.8 Logging, monitoring, auditability

- Events: every decision (FR-06), every admin action (SEC-12), every mode change, tamper, certificate event, re-identification.
- Format: structured, pseudonymous, no secrets (SEC-06; OWASP [29]).
- Integrity: each record includes hash of previous; hourly checkpoint signed by HSM key; readers buffer locally and sync (SEC-10, SEC-15).
- Monitoring: SEC-13 anomaly rules; reader health; revocation-list age; clock drift (NFR-14); alerts to Supervisor (screen 16) and Auditor.
- Audit: Auditor tool verifies chain; re-identification workflow (PRIV-06).

---

# 28. System Architecture

Diagram: `05_Workflows/System_Architecture.png` (Figure J-13). Conceptual components and the flow of a decision:

```
Student ──presents──► Credential (card key / phone key / QR token)
                            │  B1 physical / RF / optical
                            ▼
                     Gate Reader + User Indicator      ← Guard Tablet (decision view)
                       (holds: own cert, public keys,
                        signed revocation list, event buffer)
                            │  B2 mutual TLS 1.3
                            ▼
                   Authentication Service ──► HSM/KMS (per-card key derivation, signing)
                            │
                            ▼
                Credential & Identity Store (status, validity, pseudonym map, photo ref)
                            │
                            ▼
                   Authorization / Policy Engine ◄── Policy Store (versioned rules)
                            │
                            ▼
                      Access Decision (signed) ──► Reader → Gate indicator / turnstile
                            │                                   Guard tablet (photo, name, decision, next step)
                            ▼
                Audit Log Service (append-only, hash-chained) ──► Log Store
                            ▲
   Admin Console (Issuer / Approver / Auditor / Policy) ── B5 MFA ── Admin API
   Student App / Portal ── B6 ── Enrolment & Self-service API (report lost, view own events)
   Visitor Pass Service ── B7 ── e-mail/SMS delivery of signed QR
```

**Sensitive data locations**: identity fields and photo (Identity Store, photo store); keys (HSM; card chips; phone keystores); logs (Log Store); visitor contact (Visitor table, 30-day life).

**Attack surfaces**: reader housing and RF interface (B1); gate LAN (B2); service APIs (B3); admin console (B5); student app (B6); pass delivery channel (B7); HSM interface (B4).

**Administrative access**: only through Admin API behind MFA; no direct DB access for humans in production; all actions logged.

**Security controls by component**

| Component | Controls |
|---|---|
| Reader | No master keys; signed firmware; tamper switch; mutual TLS; local verification only with signed material; event buffer encrypted; rate limiting |
| Guard tablet | Role-limited UI; no local storage of personal data beyond current decision; auto-clear; screen privacy hood |
| Auth service | Stateless verification; HSM for key ops; nonce store; replay cache |
| Identity/credential store | Encrypted at rest; least-privilege service accounts; pseudonym mapping in separate schema |
| Policy engine | Deny-by-default; versioned; changes logged |
| Log service | Append-only API; hash chain; signed checkpoints; retention job |
| Admin console | MFA; RBAC; step-up confirm; session timeout; CSRF/XSS protections per ASVS |
| Student app | Hardware keystore; root detection (Phase 2); TLS pinning; minimal local data |

**Privacy controls by component**: minimal fields (store), pseudonymous logs (log service), role-filtered responses (API), retention job (log/visitor stores), transparency screens (app), justified re-identification (auditor tool).

---

# 29. Data Flow Diagram

Diagram: `05_Workflows/Data_Flow_Diagram.png` (Figure J-10). Level-1 DFD with trust boundaries (dashed) and data stores.

**External entities**: Student, Guard, Visitor, Host, Administrator.
**Processes**: P1 Present & Read Credential; P2 Authenticate; P3 Check Validity; P4 Authorize; P5 Decide & Signal; P6 Log Event; P7 Manage Credentials; P8 Manage Visitors; P9 Review Logs.
**Data stores**: D1 Credential/Identity Store; D2 Policy Store; D3 Audit Log; D4 Visitor Passes; D5 Key Store (HSM); D6 Photo Store.

| Flow | From → To | Data | Sensitivity | In transit protection | At rest |
|---|---|---|---|---|---|
| F1 | Student → P1 | Card response / signed token / QR image | Credential proof (not the key) | RF proximity; optical | — |
| F2 | P1 → P2 | {pseudonym, gate, nonce, response, method, ts} | Pseudonymous | mTLS 1.3 | Reader buffer (encrypted) if offline |
| F3 | P2 ↔ D5 | Key derivation / signature verify request | Critical | Internal mTLS; HSM API | HSM |
| F4 | P2 → P3 → P4 | {identity ref, credential status, validity, role} | Personal (internal) | Internal | D1 encrypted |
| F5 | P4 ↔ D2 | Policy lookup | Integrity-critical | Internal | D2 versioned |
| F6 | P5 → Reader / Guard tablet | {decision code, next-step code, display name, photo URL (signed, 60 s), role} | Personal (minimised) | mTLS 1.3 | Not stored on tablet |
| F7 | P5 → Student indicator | Colour/icon/short message | Non-personal | Local | — |
| F8 | P5 → P6 → D3 | {pseudonym, gate, ts, method, decision, guard ID if manual} | Personal (movement, pseudonymous) | Internal | Hash-chained, 90 d |
| F9 | Admin → P7 → D1, D5 | Issue/revoke/renew with reason | Personal + critical | mTLS + MFA session | D1, D5 |
| F10 | Host → P8 → D4 → Visitor | Pass request; signed QR | Personal (visitor) | mTLS; e-mail/SMS (channel risk noted) | D4, 30 d |
| F11 | Auditor → P9 → D3 (+ D1 map on justified re-identify) | Query; results | Personal | mTLS + MFA | — |
| F12 | Student → self-service → D1, D3 (own only) | Report lost; view own events | Personal (own) | TLS + app auth | — |

**Trust boundaries**: B1 physical (Student/credential ↔ reader); B2 gate LAN (reader/tablet ↔ services); B3 service mesh; B4 HSM; B5 admin; B6 student app; B7 visitor delivery.
**Attack surfaces**: every flow crossing a boundary (F1, F2, F6, F9, F10, F11, F12) plus the physical reader.
**Administrative flows**: F9, F11; both MFA, both logged.

---

# 30. Privacy Data Flow

Diagram: `05_Workflows/Privacy_Data_Flow.png` (Figure J-11). For each data item: why collected, who can access, where stored, retention, deletion.

| Data item | Collected from | Why (purpose) | Who can access | Where stored | Retained | Deleted when / how |
|---|---|---|---|---|---|---|
| Full name, roll/employee no., programme/department | Roster at issuance | Bind credential to a member; issuer verification | Issuer; Auditor on justified re-identify; student (own) | D1 (encrypted) | While member + credential retention | Member leaves → after 1-year revoked-credential retention; automated, logged |
| Display (first) name | Derived from roster | Guard's confirmation of identity in a human-readable way | Guard (on tap), Supervisor, Issuer, student | D1 | As above | As above |
| Photo | Roster / issuance capture | Human face check (the control against borrowing and relay) | Guard (on tap only, 60 s signed URL), Issuer, student | D6 (separate store) | As above | As above |
| Role | Roster | Authorization | All roles (as decision input) | D1 | As above | As above |
| Credential ID / pseudonym | Generated at issuance | Authenticate; pseudonymous logging | System; Issuer; Auditor | D1 (mapping in separate schema) | Credential lifecycle + 1 y | Automated |
| Per-card key / phone public key | Generated at issuance/enrolment | Authentication | HSM only / system | D5 / D1 | Credential lifecycle | Zeroised on deletion |
| Validity, status, revocation reason | Issuer actions | Validity/authorization; audit of lifecycle | Issuer; Auditor; student (own, generic reason); **not** guard | D1 | Credential lifecycle + 1 y | Automated |
| Access events (pseudonym, gate, time, method, decision) | Each presentation | Access decision audit; incident investigation; anomaly detection | Auditor (pseudonymous); Supervisor (gate counts); student (own) | D3 (hash-chained) | 90 days; flagged events until case closed + 1 y | Scheduled purge, itself logged |
| Manual-mode decision records (+ guard ID) | Manual Verification Mode | Accountability for fallback decisions | Supervisor, Auditor | D3 | As flagged events | As above |
| Re-identification records (who, when, why, which entry) | Auditor action | Accountability for look-ups | Second administrator; Auditor | D3 | 1 y | Automated |
| Visitor name, host, purpose category, window, gate set | Host request | Issue and check pass; guard confirmation | Approver; Guard (name + host only); Auditor | D4 | Visit + 30 days | Automated |
| Visitor contact (e-mail/phone) | Host request | Deliver pass only | Approver/system for delivery only; **not** guard | D4 | Until pass delivered + visit window | Automated at visit end |
| Guard/admin identity | Institutional accounts | Attribution of actions | Supervisor, Auditor | Institutional IdP + D3 | Employment + audit retention | Per institutional policy |

**Not collected at all**: phone numbers of students, home addresses, emergency contacts, hostel, vehicle numbers (unless a separate vehicle-gate design is added later with its own analysis), biometric templates, exit events (exit is not controlled in this design).

**Data minimisation applied**: the guard decision needs a face and a status; everything else has been removed from the guard path. The log needs to answer "which credential passed which gate when, and what was decided"; it does not need a name, so it does not hold one.

---

# 31. Workflows

Full diagrams are in Appendix J (`05_Workflows/*.png`). Textual specifications follow; each is the source for the corresponding diagram and prototype screens.

## 31.1 Overall system (Figure J-1)
Student/Visitor → Present credential → Reader → Authenticate → Validity → Authorize → Decision → {Gate indicator, Guard tablet} → Log. Side flows: Admin lifecycle → Store; Host → Visitor pass; Student self-service → Store/Log; Offline sync of signed lists to readers.

## 31.2 Student authentication (Figure J-2)
1. Reader idle (screen 1). 2. Tap/scan (screen 2). 3. Reader: card → nonce challenge, get response; phone/QR → obtain signed token. 4. "Verifying" (screen 3, ≤1 s). 5. Online: send F2 to Auth Service; offline: verify locally. 6. Authenticated? No → DENY–NOT RECOGNISED (screen 6) → log. Yes → 7. Validity: expired → screen 7; revoked/suspended → screen 8; alert flag → screen 9. 8. Authorize: role/gate/time → not allowed → DENY–NOT AUTHORIZED (screen 6 variant "Not permitted at this gate/time") ; allowed → 9. ALLOW: user indicator green + tone (screen 4); guard tablet photo + name + ALLOW (screen 5). 10. Guard glances; Mismatch → DENY–SUSPICIOUS, flagged. 11. Log event. 12. Auto-clear after pass/5 s (USE-12).

## 31.3 Authentication vs authorization (Figure J-3)
Two-lane diagram: Lane A "Who is this credential bound to?" (crypto → identity ref) and Lane B "Is this principal allowed here now?" (status, role, gate, time, alerts). Failure in A → "NOT RECOGNISED" (no identity known; guard cannot help; direct to Security Office). Failure in B → identity is known; message names the *authorization* reason (expired / revoked / not this gate / suspicious) and the *specific* next step.

## 31.4 Credential lifecycle (Figure J-4)
State machine per Section 26: ISSUED → ACTIVE ↔ SUSPENDED; ACTIVE → EXPIRED → (renew) ACTIVE; ACTIVE/SUSPENDED/EXPIRED → REVOKED (irreversible) → REPLACED (new credential) ; REVOKED/EXPIRED → DELETED after retention.

## 31.5 Visitor access (Figure J-5)
Host request → Approver (or auto-policy) → Signed pass issued → Delivered → Gate: scan → verify signature, window, gate set, use count → guard sees "VISITOR · name · Host" → ALLOW → host notified → pass consumed/expired → record purged at +30 d. Branch: no pass at gate → guard "Visitor without approval" → host lookup → host approves on phone (or declines) → pass issued at kiosk / to visitor phone → scan. No approval → no entry; script shown.

## 31.6 Lost ID (Figure J-6)
Student notices loss → App "Report lost/stolen" → confirm → card REVOKED immediately → list pushed → replacement request opened → student continues with phone credential → Issuer issues new card → student collects (identity check) → new card ACTIVE on first tap. Branch: attacker taps lost card before/after report (Scenario 1).

## 31.7 Authentication failure (Figure J-7 in Appendix; file `Failure_Workflow.png`)
Any DENY → user indicator red + short message; guard tablet: decision + reason class + next step; guard options: [Direct to Security Office] (default), [Call supervisor], [Mismatch] (on ALLOW only). No [Allow anyway]. Event logged; repeated failures → SEC-13 escalation.

## 31.8 Network / device failure (Figure J-8)
Reader heartbeat lost → Offline-verified mode (status bar amber, list age shown) → continue while list age ≤ N → if list age > N or reader hardware fault → Manual Verification Mode (screen 12): guard tablet (if online) or paper form records: credential type presented, visual photo check result, supervisor approval ID; all flagged; when connectivity returns, buffered events sync and supervisor reviews manual entries.

## 31.9 Threat model (Figure J-9)
Attack tree: root "Unauthorised entry" → branches: possess valid credential (steal, borrow, relay), forge credential (clone weak tech, fake), exploit lifecycle (expired, revoked, ghost issuance), exploit infrastructure (rogue server, reader compromise, DoS→manual), exploit human (coerce/collude guard, social-engineer visitor path). Leaves annotated with controlling requirement IDs.

## 31.10 Data flow (Figure J-10) and 31.11 Privacy data flow (Figure J-11)
As specified in Sections 29 and 30.

## 31.12 Admin credential management (Figure J-12)
Admin login (MFA) → role check → Issue: roster search → identity verification → key personalisation → validity → confirm → log. Revoke: search → select → reason → two-step confirm → propagate → log. Renew/Suspend/Lift: similar with confirm. Every path ends in the audit log.

---

# 32. Failure Handling and Edge Cases

Principle: **no failure path opens the gate**. Fallbacks preserve authentication (a human check against server data, not the card) and preserve auditability (every manual decision is attributed and flagged). Convenience is provided by *redundant credentials* (card + phone), not by bypasses.

| Case | Detection | System behaviour | Guard behaviour (script on screen) | Student/visitor experience | What is logged | Requirement |
|---|---|---|---|---|---|---|
| **Lost ID** | Student report; or tap after revocation | Immediate revocation of that card; phone credential unaffected | If lost card tapped: "REVOKED — direct to Security Office"; do not admit | Reports from phone in seconds; enters with phone credential; collects replacement later | Revocation (who/when); any tap of revoked card (flagged) | FR-09, SEC-17 |
| **Forgotten ID** | Student has no card | Student uses enrolled phone credential (NFC or dynamic QR): same authentication strength | Nothing different; result screen identical | ~3 s (unlock + open app) instead of 1 s | Method = phone | FR-01, D1 |
| **Forgotten ID and no phone credential** | Student has neither | System offers no bypass. Options: (a) student goes to Security Office where an Issuer-role staff member verifies identity against roster + photo and issues a **one-day temporary credential** (a signed QR pass bound to the student's identity, valid until midnight, logged); (b) student waits for a friend to bring the card (not a system function) | "NOT RECOGNISED / no credential — direct to Security Office for a temporary pass. Do not admit." | Detour to office; dignified, defined, same for everyone | Temporary pass issuance (Issuer ID, student ID, expiry) | FR-13, SEC-16 (reused for temp pass) |
| **Expired ID** | Validity check | DENY–EXPIRED; authentication succeeded so identity is known | "EXPIRED — renew at ID cell. Do not admit." Option: [Call supervisor] if student claims active status | Told exactly what to do; app shows renewal status | Event, decision code | SEC-03, screen 7 |
| **Revoked ID** | Status check | DENY–REVOKED | "REVOKED — direct to Security Office. Do not admit." Reason not shown | Generic message; office explains privately | Flagged event | SEC-02, SEC-08, screen 8 |
| **Fake ID** | Fails cryptographic authentication | DENY–NOT RECOGNISED | "NOT RECOGNISED — this is not a valid campus credential. Do not admit. If person insists, [Call supervisor]." | Cannot argue with a visual judgement because none was made | Event; SEC-13 counter incremented | SEC-01, screen 6 |
| **Another person's ID** | Genuine credential; face ≠ photo | ALLOW returned; guard presses [Mismatch] → DENY–SUSPICIOUS | Compare face to photo *every time*; Mismatch button | Denied; told to visit Security Office | Flagged event with guard ID | FR-12, USE-05, screen 16 |
| **Reader failure** (hardware, tamper) | Heartbeat/self-test fails; tamper switch | Reader disabled; lane closed; if second lane exists, redirect; else Manual Verification Mode | Screen 10: "Reader offline — use lane 2" or "Manual mode — follow procedure" | Redirected or manual check | Reader fault event; manual decisions flagged | SEC-18, FR-14, screen 10 |
| **QR failure** (glare, cracked screen, expired token) | Camera cannot decode / token stale | Prompt to regenerate token / tilt screen; after 2 failures suggest card or NFC | Screen 2 hint | Regenerate; or tap card | Attempts logged | USE-04 |
| **RFID/NFC failure** (card damaged, phone NFC off) | No response / protocol error | Prompt to retry / use QR fallback | Screen 2 hint | Retry or switch method | Attempts logged | USE-04 |
| **Network outage** | Heartbeat lost | Offline-verified mode: local crypto verification with cached public keys; revocation list age displayed; continue while ≤ N h | Screen 11 status amber: "Offline — list 1 h 20 m old. Normal checks continue." | No visible change | Events buffered, synced later with offline flag | SEC-19, FR-14, screen 11 |
| **Database outage (network up)** | Auth service returns unavailable | Same as offline-verified mode at the reader | Same | Same | Same | SEC-19 |
| **Prolonged outage (> N h) or no cached material** | List age exceeds N | Manual Verification Mode: guard tablet (or paper form) records credential shown, photo check outcome (against printed card photo, weakest control, acknowledged), supervisor approval for each admission or per-batch for peak; entries flagged | Screen 12: step list; [Request supervisor approval] | Slower; supervisor present | Every manual decision: guard ID, supervisor ID, time, credential type | FR-14, FR-19, screen 12 |
| **Device / power failure at gate** | Tablet/reader dead | Battery backup (NFR-03) for a defined period; then Manual Verification Mode with paper form (pre-printed, serial-numbered) transcribed later | Paper procedure card at every gate | Manual | Transcribed and flagged | FR-14, FR-19 |
| **Visitor without approval** | No pass | Guard initiates host lookup; host approves/declines on phone; pass issued to visitor phone or printed | Screen 13 → 14 → 15 | Waits for host; if declined, not admitted | Request, approval, pass | FR-10, SEC-16 |
| **Emergency entry** (ambulance, fire, police) | Supervisor declaration | Egress barriers always free (life safety). Ingress: supervisor authorises via tablet [Emergency ingress] with reason; gate held open for the duration; every entry during emergency logged as "emergency mode"; mode ends by supervisor action and is reviewed | Screen 12 emergency variant | — | Emergency start/end, supervisor ID, reason | FR-20 |
| **Suspicious repeated attempts** | SEC-13 thresholds | DENY–SUSPICIOUS for the credential/reader; supervisor alert; reader rate-limit | Screen 9: "Suspicious activity — do not admit; supervisor alerted" | Denied; told to contact Security Office | Flagged events; alert | SEC-13, screen 9 |
| **Guard tries to override DENY** | UI has no such control | Not possible at the gate; supervisor-approved manual entry is the only path and is flagged | — | — | Attempt would appear only as a manual entry with supervisor ID | FR-13, TH-17 |

**Explicitly rejected "convenient" fallbacks**: "Allow anyway" button for guards; accepting a photo of a QR code; accepting bare card UID when the server is unreachable; auto-open on power failure; guard entering a student's roll number to look them up (would recreate the interrogation and leak data). Each of these would undo one of SEC-01, SEC-09, SEC-08 or FR-13.
