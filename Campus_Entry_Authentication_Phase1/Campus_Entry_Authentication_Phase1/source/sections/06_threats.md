# 24. Threat Model

Method: STRIDE per element and per trust boundary of the data-flow diagram in Section 29, following Shostack [30]. Likelihood and impact are rated Low / Medium / High by team judgement informed by the secondary research; they are **[ASSUMPTION]**-grade ratings to be revisited after primary data (e.g., how often guards see suspicious cards, B Q5) and after Phase 2 testing.

## 24.1 Threat actors

| ID | Actor | Capability | Motivation | Access |
|---|---|---|---|---|
| TA-01 | Unauthorised visitor (opportunist) | Social engineering, tailgating, borrowed card | Curiosity, theft, meeting someone, sales | Approaches gate |
| TA-02 | Student using another student's credential | Legitimate-looking holder; knows campus | Convenience (forgot card), helping a friend, letting an outsider in | Has a valid card not their own |
| TA-03 | Attacker with a copied credential | Card reader/writer, Proxmark-class tool, phone with NFC; photo of QR | Persistent access, impersonation | Brief proximity to a victim's card or screen |
| TA-04 | Attacker attempting replay | Sniffing equipment near reader; screenshot of QR | Access without victim's card | Proximity to reader during a legitimate tap |
| TA-05 | Malicious visitor | Valid visitor pass; intent to overstay, roam, or share pass | Theft, harassment, unauthorised presence | Approved for limited window/gate |
| TA-06 | Compromised reader (physical or firmware) | Physical access to reader housing, debug ports; supply-chain tamper | Extract keys, log credentials, force ALLOW | Physical, possibly overnight |
| TA-07 | Compromised user device (phone malware, rooted device) | Malware with app or OS privileges | Steal phone credential, generate tokens remotely | Victim's phone |
| TA-08 | Network attacker | On campus Wi-Fi/LAN or ISP path; MITM, sniffing, DoS | Intercept, modify, replay, deny service | Network between reader and server |
| TA-09 | Database attacker | SQL injection, stolen backup, cloud misconfiguration, credential stuffing on admin | Mass identity data, key material, log manipulation | Remote or via compromised admin |
| TA-10 | Malicious insider (guard, admin, developer) | Legitimate role privileges; knowledge of procedures | Let someone in, look up a person, cover tracks, sell data | Authenticated role account |
| TA-11 | Attacker with physical access to a credential (theft, finding) | Holds the card/phone | Enter as victim before revocation | Until revoked |
| TA-12 | Denial-of-service attacker | Jam RF, flood readers with bad taps, cut power/network, DDoS server | Disrupt campus, force manual mode to exploit it | Near gate or remote |

## 24.2 Assets

| ID | Asset | Sensitivity | Where it lives |
|---|---|---|---|
| AS-1 | Student identity (name, roll no., programme, photo) | Personal data | Identity store; photo store |
| AS-2 | Credentials (cards, phone enrolments, visitor passes) | Access-enabling | Card chips; phone secure storage; credential table |
| AS-3 | Authentication keys and secrets (per-card AES keys, app signing keys, token signing key, TLS private keys, revocation-list signing key) | Critical secret | HSM/KMS; card chips; phone keystore; reader (own cert only) |
| AS-4 | Access permissions and credential status | Integrity-critical | Credential/status table; offline revocation list |
| AS-5 | Entry logs | Personal data (movement); integrity-critical | Log store |
| AS-6 | Personal information beyond identity (visitor contact) | Personal data | Visitor table (short-lived) |
| AS-7 | Authorization policies | Integrity-critical | Policy store |
| AS-8 | System availability (gate throughput) | Operational | Readers, network, servers |
| AS-9 | Security devices (readers, guard tablets, servers) | Physical + firmware integrity | Gates; server room/cloud |

## 24.3 Threat table

For every threat: scenario, asset, impact, likelihood/priority, mitigation (requirement IDs), residual risk, usability impact.

| ID | Threat (STRIDE) | Attack scenario | Asset | Security impact | Likelihood / Priority | Mitigation | Residual risk | Usability impact of mitigation |
|---|---|---|---|---|---|---|---|---|
| **TH-01** | Credential theft (S) | TA-11 finds or steals a card and taps it at the gate before the owner notices | AS-2, AS-4 | Unauthorised entry as victim; victim blamed via log | Likelihood M (cards are lost; H5); Priority **High** | Self-service instant revocation (SEC-17, FR-09); guard photo check against server photo (FR-12); phone credential requires unlock (D1); short propagation (FR-08) | Window between loss and report; guard fatigue skipping photo | Student must know how to report (USE-13); guard must glance at photo (USE-05) |
| **TH-02** | Credential cloning (S) | TA-03 reads a MIFARE-Classic-class card or photographs a static QR and writes a clone | AS-2, AS-3 | Persistent unauthorised entry; undetectable if UID-based | Likelihood H for weak tech [4, 5], L for AES challenge–response [41]; Priority **High** | Cryptographic challenge–response with per-card key, never bare UID (SEC-01); dynamic signed QR only (SEC-04); modern chip family (D1); anomaly detection on impossible sequences, e.g., same credential at two gates within minutes (SEC-13) | Future break of chosen chip family; side-channel key extraction [7] with physical possession | None for user; cost of secure cards |
| **TH-03** | Replay (S, T) | TA-04 records reader–card exchange or screenshots a QR and presents it later | AS-2 | Unauthorised entry | Likelihood M; Priority **High** | Server nonce in challenge–response (SEC-04); QR tokens time-bound (30–60 s) and single-use cache (SEC-04); visitor pass counters (SEC-16) | Real-time relay within window (see TH-04b); clock skew abuse bounded by NFR-14 | Slight: QR must be shown within a minute of generation |
| **TH-04** | Impersonation (S) | (a) TA-02 uses a friend's valid card; (b) TA-03 relays a live card/phone from a victim elsewhere [18–20] | AS-1, AS-2 | Wrong person admitted; log attributes entry to victim | (a) Likelihood H (social norm; Q12 **[DATA REQUIRED]**); (b) Likelihood L (skill/equipment); Priority **High** | Guard compares face to *server* photo for the authenticated credential (FR-12, USE-05); "Mismatch" button denies and flags (screen 16); phone credential requires unlock, so lending a phone is costlier; velocity/anomaly rules (SEC-13); Phase 2 option: distance-bounding not available commercially, so relay accepted as residual | Guard fatigue or coercion; relay defeats all crypto and is stopped only by the human check | Photo check adds ~0.5 s of guard attention per person; must be designed as a glance |
| **TH-05** | Credential sharing / malicious visitor (S, E) | TA-05 forwards visitor QR to a second person, or overstays, or goes to a different gate | AS-2, AS-4 | Unapproved person or area; overstay | Likelihood M; Priority Medium | Pass bound to window + gate set + host (SEC-16); single/limited use; guard sees host name and asks if unsure; overstay produces DENY at exit? (exit not controlled: residual); host notified on use (FR-10) | Forwarding within window before first use; overstay inside campus | Visitor must present pass from their own device; host gets a notification |
| **TH-06** | Fake credential (S) | TA-01 presents a home-made card or QR that looks right | AS-2 | Entry if visual check is the only control | Likelihood H today, L with crypto; Priority **High** | SEC-01: a fake cannot pass challenge–response → "NOT RECOGNISED" (screen 6); server-side photo means altering printed photo is useless; guard never asked to judge card authenticity | Fake that also carries a cloned key = TH-02 | Removes a cognitive load from guards |
| **TH-07** | Expired credential reuse (E) | Graduated student or old visitor pass presented | AS-4 | Ex-member enters | Likelihood H today (H2), L with enforcement; Priority Medium | Server/reader enforces expiry (SEC-03); visitor auto-expiry (SEC-16, FR-11); distinct "EXPIRED" message and renewal path (screen 7) | Clock manipulation on offline reader (bounded by NFR-14, signed time in list) | Students must renew before expiry; app reminds them |
| **TH-08** | Revoked credential reuse (E) | Suspended/withdrawn student, or holder of a reported-lost card, taps | AS-4 | Barred person enters | Likelihood M; Priority **High** | Revocation checked on every decision (SEC-02); propagation ≤30 s online; signed offline list ≤N h (SEC-19); irreversible revocation (SEC-17); "REVOKED" screen without reason (screen 8, SEC-08) | Offline staleness window up to N hours; mitigated by shortening N at cost of more manual mode | None for legitimate users |
| **TH-09** | Unauthorised privilege escalation (E) | Guard account used to revoke/issue; admin session hijacked; API called with wrong role | AS-4, AS-7, AS-2 | Arbitrary issue/revoke; policy change | Likelihood M; Priority **High** | RBAC with least privilege and separation of duties (SEC-07); MFA + two-step confirm for admin ops (SEC-11); all admin actions logged (SEC-12); session timeouts | Compromised MFA device; collusion of two insiders | Admin ops take longer (MFA, confirm) |
| **TH-10** | Database compromise (I, T) | TA-09 dumps identity, credential and log tables or edits status | AS-1, AS-3, AS-4, AS-5 | Mass privacy breach; forged status; key theft enabling cloning | Likelihood M; Priority **High** | Minimisation limits blast radius (SEC-14, PRIV-01); keys in HSM/KMS not DB (SEC-18, PRIV-11); encryption at rest (PRIV-11); pseudonymous logs with separate mapping table (PRIV-04); integrity-protected logs (SEC-10); parameterised queries, ASVS L2 (NFR-07) | Attacker with HSM access; insider DBA | None for users |
| **TH-11** | Network interception (I) | TA-08 sniffs reader–server or app–server traffic | AS-1, AS-3 | Learn identities, tokens, nonces | Likelihood M on shared Wi-Fi; Priority Medium | TLS 1.3 mutual auth (SEC-05); no identity in reader→server request beyond credential pseudonym; tokens short-lived | Traffic analysis (who tapped when) | None |
| **TH-12** | Man-in-the-middle / rogue server (T, S) | TA-08 impersonates the server to a reader, returning ALLOW | AS-4, AS-8 | Reader opens on attacker's command | Likelihood L–M; Priority **High** | Mutual TLS with pinned server cert on reader (SEC-05); decisions signed by server key and verified by reader; reader never trusts unauthenticated ALLOW (SEC-09) | Compromise of server signing key | None |
| **TH-13** | Privacy leakage (I) | Guard screen read by bystanders; roll number displayed; logs browsed casually; visitor register visible | AS-1, AS-5, AS-6 | Exposure of identity, movement, contacts | Likelihood H today (H6, public questioning); Priority **High** | SEC-08/PRIV-03 minimal guard view; PRIV-10 physical screen placement and split user/guard displays; PRIV-04/06 pseudonymous logs with justified re-identification; PRIV-09 no public register; PRIV-05 retention | Guard verbally reveals name; shoulder-surfing of guard tablet | Guard sees less, decides on photo + first name only |
| **TH-14** | Denial of service (D) | TA-12 jams RF, floods readers with invalid taps, cuts power/network, or DDoSes the server, to create chaos or force manual mode | AS-8 | Queues; pressure to bypass; manual mode exploited by TA-01 | Likelihood M; Priority Medium | Offline verification (SEC-19) so network DoS does not stop gate; rate-limiting and SEC-13 escalation for tap floods; battery backup for readers (NFR-03); Manual Verification Mode is defined, logged and *not* an open gate (FR-14, FR-19); supervisor alert | Sustained physical jamming forces manual mode for its duration | Manual mode is slower (accepted degradation) |
| **TH-15** | Log tampering / loss (T, R) | TA-10 deletes an entry to hide a let-in; outage loses events | AS-5 | Repudiation; failed investigation | Likelihood M (insider), M (outage); Priority **High** | Append-only hash-chained logs with signed checkpoints (SEC-10, SEC-15); reader buffers events locally during outage and syncs (FR-14); no delete/edit for any role; write-once storage | Attacker who controls the checkpoint signing key and all replicas | None |
| **TH-16** | Device compromise (reader, guard tablet, phone) (T, I, E) | TA-06 opens reader, dumps firmware/keys [36]; installs skimmer; TA-07 malware exports phone credential | AS-3, AS-2, AS-9 | Key theft → cloning; forced ALLOW; credential exfiltration | Likelihood M (readers are outdoors, unattended at night); Priority **High** | Reader holds no master keys (SEC-18); per-reader client cert revocable; signed firmware; tamper switch logged; reader cannot decide ALLOW without server or valid offline material; phone keys in hardware keystore, app refuses to run on rooted device (Phase 2), remote revoke of phone credential (SEC-17) | Sophisticated hardware attacks on secure elements; zero-day on phone OS | None for users |
| **TH-17** | Insider abuse (I, E, R) | Guard lets friend through in manual mode; admin looks up a student's movements; issuer creates a credential for a non-member | AS-1, AS-4, AS-5 | Unauthorised entry; stalking; ghost identities | Likelihood M; Priority **High** | Manual decisions logged with guard ID and flagged for review (FR-19); guard cannot override DENY to ALLOW (FR-13); re-identification requires justification, is logged, and is visible to a second admin (PRIV-06); issuance requires roster match and is logged (FR-07, SEC-12); separation of duties (SEC-07) | Collusion; supervisor approving bad manual entries | Manual entries require a supervisor step (slower, by design) |

## 24.4 Trust boundaries and attack surfaces (summary; diagram in Section 29)

| Boundary | Between | Crossing data | Controls |
|---|---|---|---|
| B1 Physical | Person/credential ↔ Reader | RF challenge–response; QR image | SEC-01, SEC-04; reader tamper (SEC-18) |
| B2 Gate LAN | Reader/guard tablet ↔ Campus network | TLS 1.3 mutual (SEC-05) | Cert pinning; signed decisions |
| B3 Service | Auth service ↔ Policy engine ↔ Stores | Internal API | RBAC service accounts; least privilege |
| B4 Key custody | Services ↔ HSM/KMS | Key ops only | Keys never leave HSM; audit |
| B5 Admin | Admin browser ↔ Admin API | MFA sessions | SEC-11, SEC-07 |
| B6 Student | Phone app ↔ Enrolment/API | TLS; device attestation (Phase 2) | Hardware keystore |
| B7 Visitor | Host/approver ↔ Visitor pass delivery | Signed QR via e-mail/SMS | SEC-16 |

## 24.5 Prioritised summary

**High priority (design must address in Phase 2 minimum)**: TH-01, TH-02, TH-03, TH-04, TH-06, TH-08, TH-09, TH-10, TH-12, TH-13, TH-15, TH-16, TH-17.
**Medium**: TH-05, TH-07, TH-11, TH-14.

**Accepted residual risks, stated plainly**: (1) real-time relay attacks are not prevented cryptographically and rely on the guard's photo check and anomaly detection; (2) a guard who is coerced, colluding or fatigued can fail the photo check; (3) revoked credentials may work at an offline reader for up to N hours; (4) a future cryptanalytic or side-channel break of the chosen card family would require re-issuance, which the lifecycle design makes possible but not free; (5) the system does not control exit and cannot detect overstay by visitors.

---

# 25. Attack Scenarios

Each scenario walks through **Attack → Impact → Detection → Prevention → Recovery** against the proposed design, and names the requirements involved. These are analytical scenarios, not observed incidents.

### Scenario 1 — Student loses ID
**Attack.** Meher leaves her card on the metro. A stranger finds it and, that evening, taps it at the gate.
**Impact (current system).** Card is visually valid; stranger enters; no record.
**Detection (proposed).** If Meher has already reported it (app → "Report lost", FR-09), the tap returns DENY–REVOKED (screen 8) and the event is flagged; supervisor alerted. If she has not yet reported it, the tap authenticates (the key is genuine); the guard sees Meher's photo (FR-12) and a stranger's face → "Mismatch" → DENY–SUSPICIOUS, flagged.
**Prevention.** SEC-17 self-service revocation closes the window to minutes; FR-12/USE-05 photo check covers the gap; phone credential means Meher keeps access (no pressure on her to delay reporting).
**Recovery.** Revocation is irreversible; Issuer issues a new card (FR-07); Meher's phone credential is unaffected; flagged event reviewed by Auditor.

### Scenario 2 — Student gives ID to another person
**Attack.** Aarav lends his card to a friend from another college for the day.
**Impact.** Outsider on campus under Aarav's identity; if anything happens, the log names Aarav's credential.
**Detection.** Guard sees Aarav's server photo next to a different face → Mismatch (screen 16) → DENY, flagged with guard ID. If Aarav also taps his phone elsewhere within minutes, SEC-13 velocity rule flags an impossible sequence.
**Prevention.** Cannot be prevented cryptographically; deterred by the visible photo check and by clear communication that entries are attributed to the credential holder (PRIV-07). Phone credentials raise the cost of lending (must hand over an unlocked phone).
**Recovery.** Flagged event reviewed; institutional policy applies to Aarav; friend denied.

### Scenario 3 — Attacker copies credential
**Attack.** TA-03 stands behind Aarav in the mess queue with a reader in a bag and reads his card.
**Impact (if MIFARE Classic / UID-based).** Full clone in seconds [4, 5]; persistent access as Aarav.
**Impact (proposed).** The card performs AES challenge–response with a key that never leaves the chip [41]; the sniffed exchange yields a nonce and a response, not the key. A clone with the same UID but no key → DENY–NOT RECOGNISED (screen 6).
**Detection.** Repeated unknown credentials at a reader → SEC-13 escalation → SUSPICIOUS + alert.
**Prevention.** SEC-01 (never accept UID), D1 (AES card family), SEC-18 (reader holds no key that would help).
**Recovery.** If a chip family is later broken, Issuer re-issues that batch; revocation list handles the old cards (Section 26, stage 10).

### Scenario 4 — Attacker attempts replay
**Attack.** TA-04 records the RF exchange during a legitimate tap and plays it back an hour later; or screenshots Meher's dynamic QR and shows it the next morning.
**Impact.** None if SEC-04 holds: the recorded response answers yesterday's nonce, not today's; the QR token's timestamp is outside the window and its ID is in the replay cache.
**Detection.** Reader logs a response to a stale nonce as a protocol error → DENY–SUSPICIOUS; QR with expired timestamp → DENY–NOT RECOGNISED with internal code "stale token" for the auditor.
**Prevention.** Server-generated nonces (SEC-04); 30–60 s token windows with server-side dedupe; NTP (NFR-14).
**Recovery.** Nothing to recover; flagged event for review. Real-time relay within the window is the residual (TH-04b).

### Scenario 5 — Visitor attempts unauthorised entry
**Attack.** A person claims to be visiting a professor, has no pass, and pressures the guard; or forwards a friend's visitor QR.
**Impact (current).** Guard writes a name in the register and lets them in, or refuses and faces an argument.
**Detection (proposed).** No pass → guard opens "Visitor without approval" (screen 13); host is looked up and asked to approve from their phone (screen 14); no approval → no entry, script on screen. Forwarded pass: single-use counter (SEC-16) means the second scan is DENY; host is notified on first use, so the real visitor's arrival exposes the misuse.
**Prevention.** FR-10/FR-11/SEC-16; guard has a defined procedure (FR-13) and never enters visitor data by hand.
**Recovery.** Denied; host informed; pass revoked if misused.

### Scenario 6 — Expired credential is presented
**Attack.** A graduate returns with last year's card.
**Impact (current).** Guard does not read the date (H2); graduate enters.
**Detection.** Authentication succeeds (genuine card), authorization fails on validity → DENY–EXPIRED (screen 7); guard sees "Expired — direct to ID cell for renewal if still a member".
**Prevention.** SEC-03; validity enforced by server, cached on reader in offline mode.
**Recovery.** If the person is still a member (delayed renewal), Issuer renews (lifecycle stage 9); otherwise nothing to recover.

### Scenario 7 — Revoked credential is presented
**Attack.** A student under disciplinary suspension taps their card.
**Impact (current).** Nothing on the card indicates suspension; enters.
**Detection.** DENY–REVOKED (screen 8); guard sees only "Revoked — direct to Security Office"; the reason is not shown (SEC-08). Event flagged.
**Prevention.** SEC-02; revocation pushed within 30 s; offline list.
**Recovery.** If revocation was in error, a *new* credential is issued (SEC-17); the old one stays revoked to keep the audit trail unambiguous.

### Scenario 8 — Reader/device is compromised
**Attack.** Overnight, TA-06 opens the reader housing, connects to a debug port, and dumps storage, hoping for master keys [36]; or replaces firmware to log every credential and return ALLOW.
**Impact (proposed).** Storage yields the reader's own client certificate, public verification keys and the signed revocation list; no card keys, no identity data (SEC-18). Tamper switch logs an event; server revokes that reader's certificate; reader cannot obtain decisions. A firmware that returns ALLOW locally cannot open a gate that requires a server-signed or offline-verifiable decision (SEC-09, TH-12 control); the guard screen would show "Reader offline / tamper" (screen 10).
**Detection.** Tamper event; certificate anomalies; reader failing attestation at boot (Phase 2).
**Prevention.** SEC-18 (no secrets on reader), signed firmware, mutual TLS, tamper logging.
**Recovery.** Replace reader; rotate its certificate; review logs for the period.

### Scenario 9 — Database is compromised
**Attack.** TA-09 exploits an injection flaw in an admin page and dumps all tables.
**Impact (proposed).** Identity table: name, roll number, programme, photo reference: a real breach but bounded by SEC-14 (no phone, address, contacts). Credential table: credential IDs, status, key *references*: keys themselves are in the HSM (SEC-18, PRIV-11). Logs: pseudonymous IDs (PRIV-04); the mapping table is separately controlled. Attacker cannot mint valid cards without HSM keys; cannot silently edit logs (SEC-10).
**Detection.** Integrity checkpoints fail if logs were altered; DB access anomalies; ASVS controls.
**Prevention.** NFR-07 (ASVS L2), parameterised queries, least-privilege DB accounts, encryption at rest.
**Recovery.** Breach notification per DPDP [22]; rotate service credentials; because per-card keys were not exposed, cards need not be re-issued; if the mapping table was included, treat logs as identified and notify accordingly.

### Scenario 10 — Security operator has excessive privileges
**Attack.** A guard account has been granted Issuer rights "for convenience". The guard issues a card to a friend, or looks up a student's entry history.
**Impact.** Ghost credential; stalking.
**Detection.** Issuance without roster match is refused (FR-07); if roster match exists, issuance is logged with the guard's ID and reviewable (SEC-12); re-identification of logs requires Auditor role and justification, visible to a second admin (PRIV-06).
**Prevention.** SEC-07 role matrix with separation of duties makes "guard + issuer" a policy violation flagged at role assignment; MFA for admin ops (SEC-11).
**Recovery.** Revoke the ghost credential; remove excess role; audit that account's actions.

## 25.1 Scenario coverage matrix

| Scenario | Threats exercised | Requirements exercised | Screens |
|---|---|---|---|
| 1 Lost ID | TH-01, TH-08 | SEC-02, SEC-17, FR-09, FR-12 | 8, 9, 16, 18 |
| 2 Lent ID | TH-04a | FR-12, USE-05, SEC-13 | 5, 9, 16 |
| 3 Clone | TH-02, TH-06 | SEC-01, SEC-13, SEC-18 | 6, 9 |
| 4 Replay | TH-03 | SEC-04, NFR-14 | 6, 9 |
| 5 Visitor | TH-05 | FR-10, FR-11, SEC-16, FR-13 | 13, 14, 15 |
| 6 Expired | TH-07 | SEC-03 | 7 |
| 7 Revoked | TH-08 | SEC-02, SEC-08, SEC-17 | 8 |
| 8 Reader | TH-16, TH-12 | SEC-18, SEC-09, SEC-05 | 10 |
| 9 Database | TH-10, TH-15 | SEC-14, PRIV-04, PRIV-11, SEC-10 | 19 |
| 10 Privilege | TH-09, TH-17 | SEC-07, SEC-11, SEC-12, PRIV-06 | 17, 19 |
