# 19. Functional Requirements

Priority: **M** = Must (Phase 2 minimum), **S** = Should, **C** = Could. Evidence column: **[P]** primary (cite Q/interview once data exists), **[S]** secondary (cite ref), **[A]** labelled assumption. Until fieldwork completes, every [P] entry reads **[DATA REQUIRED]**.

| ID | Requirement | Rationale | Evidence | Priority | Screens |
|---|---|---|---|---|---|
| FR-01 | A student can present a credential at a gate reader by tapping a smart card or an enrolled phone (NFC), or by showing a dynamic QR code from the app. | Universal baseline (card) plus convenience/fallback (phone) per D1. | [S] 13; [P] Q16, Q17 [DATA REQUIRED] | M | 1, 2 |
| FR-02 | The system authenticates the credential by cryptographic challenge–response (card/NFC) or by verifying the signature and freshness of a dynamic QR token. | Prove possession of a key never transmitted; reject static identifiers. | [S] 1, 2, 4, 5 | M | 3 |
| FR-03 | The system checks credential validity: not expired, not revoked, not suspended, and (for visitor passes) within the issued time window. | Complete mediation; hotel-lock failures [8, 9] were failures of exactly this check. | [S] 2, 14 | M | 3, 7, 8, 15 |
| FR-04 | The system checks authorization: the authenticated principal's role and status permit entry at this gate at this time under the current policy. | Authorization is a distinct decision from authentication. | [S] 1, 14 | M | 3, 4, 5 |
| FR-05 | The system produces one of a fixed set of decisions: ALLOW; DENY–not recognised; DENY–expired; DENY–revoked; DENY–not authorized here/now; DENY–suspicious; and communicates it to guard and user. | Fixed vocabulary enables clear, consistent UI and logs. | [S] 12, 13 | M | 4–9 |
| FR-06 | The system records every access decision as an event containing: pseudonymous credential ID, gate ID, timestamp, method (card/NFC/QR/manual), decision code, and (for manual decisions) the guard's ID. | Auditability with minimisation. | [S] 22, 29 | M | 19 |
| FR-07 | An administrator can issue a credential to an identity in the roster, binding a card key or phone enrolment to that identity, and setting a validity period. | Credential lifecycle stage 1–2. | [S] 1 (800-63A), 2 | M | 17 |
| FR-08 | An administrator can revoke a credential with a recorded reason; revocation propagates to all gates within a defined time (target ≤30 s online; next sync offline). | Lifecycle stage 6; SEC-02. | [S] 2 | M | 17, 18 |
| FR-09 | A student can report their own card lost or stolen from the app or web portal, which immediately revokes that card while leaving any enrolled phone credential active. | Fast self-service revocation removes the window in which a lost card works; addresses H5. | [A]; [P] Q9, Q10 [DATA REQUIRED] | M | 18 |
| FR-10 | A host (faculty/staff) can request a visitor pass specifying visitor name, purpose, date, time window and permitted gate(s); an approver (or auto-approval per policy) issues a signed, time-bound QR pass delivered to the visitor. | Replaces paper register; pre-approval moves work off the gate. | [A]; [P] B Q9 [DATA REQUIRED] | M | 13, 14, 15 |
| FR-11 | Visitor passes expire automatically at the end of the window and cannot be extended without a new approval. | SEC-16. | [S] 2 | M | 15 |
| FR-12 | A guard can see the authentication and authorization result for the person at the gate, including the photo on file for the authenticated credential, display name, role, decision and reason, and can record a face-mismatch. | Human check defeats relay, borrowing and forgery of the printed card. | [S] 2, 13, 16 | M | 5, 16 |
| FR-13 | On any DENY, the system displays a defined next-step script to the guard and a minimal, non-accusatory message to the user; the guard cannot override a DENY into an ALLOW at the gate. | Fail-secure; consistent handling; no insecure bypass. | [S] 10, 13, 14 | M | 6–9, 12 |
| FR-14 | If the reader, network or database is unavailable, the reader continues to authenticate credentials locally using cached keys and a signed offline revocation list not older than a configured maximum age; if the list is older than that, or the reader itself fails, the system enters Manual Verification Mode with a defined procedure. | Availability without opening the gate. | [S] 2, 14 | M | 10, 11, 12 |
| FR-15 | An authorised auditor can review entry logs filtered by gate, time and decision; identities are pseudonymous by default and re-identification requires a recorded justification. | Auditability with privacy. | [S] 22, 26, 29 | M | 19 |
| FR-16 | A student can view their own entry events and the current status of each of their credentials. | Transparency; DPDP right of access [22]. | [S] 22; [P] Q14b [DATA REQUIRED] | S | 20 |
| FR-17 | The system detects repeated failed attempts (same credential ID, same gate, or same reader in a short window) and raises the decision to DENY–suspicious with an alert to the supervisor. | SEC-13. | [S] 29, 30 | S | 9, 16 |
| FR-18 | An administrator can define and update gate authorization policy (which roles may use which gates at which times) and the change is logged and versioned. | Authorization as data, not code; auditable policy. | [S] 14 | S | 20 |
| FR-19 | Manual Verification Mode records each manual decision with the guard's ID, the credential (if any) presented, and the verification steps taken, and flags all such events for later review. | Fallback remains auditable. | [S] 29 | M | 12 |
| FR-20 | Emergency egress is never blocked by the system; emergency *ingress* for first responders follows a supervisor-authorised procedure that is logged. | Life-safety supersedes access control; but ingress remains controlled. | [S] 31 | M | 12 |

---

# 20. Security Requirements

Each requirement lists: rationale, the user need it serves, the threats it addresses (IDs from Section 24), priority, the prototype feature that embodies it, and how it will be evaluated in Phase 2.

| ID | Requirement | Rationale | User need | Threats | Pri | Prototype feature | Phase 2 evaluation |
|---|---|---|---|---|---|---|---|
| **SEC-01** | Only credentials that pass cryptographic authentication (challenge–response with a per-credential key, or valid signature on a fresh token) are accepted. Bare identifiers (UID, static QR) are never accepted. | Static identifiers are copyable; every documented breach [4–9] involved accepting data rather than proving key possession. | Students: confidence that a photo of their card cannot be used. Guards: fewer judgement calls. | TH-01 theft, TH-02 clone, TH-03 replay, TH-06 fake | M | Screen 3 "Verifying credential" → screen 6 "NOT RECOGNISED" for any unauthenticated read | Present cloned UID, static QR, replayed token → all DENY. Unit tests on verifier. |
| **SEC-02** | Revoked credentials must not grant access at any gate, online or offline, after the propagation deadline. | Complete mediation [14]; hotel breaches [8, 9] lacked this. | Meher: lost card must stop working. Guards: know a card is blocked. | TH-08 revoked reuse, TH-01 | M | Screen 8 "REVOKED"; screen 18 revoke flow; offline list in screen 11 | Revoke → tap within 30 s online and after sync offline → DENY. |
| **SEC-03** | Expired credentials must not grant access; expiry is enforced by the server/reader, not by a printed date. | H2: guards do not read dates. | Guards: no date reading. Admin: automatic enforcement. | TH-07 expired reuse | M | Screen 7 "EXPIRED" | Set expiry in past → DENY. Boundary tests at expiry instant. |
| **SEC-04** | Authentication must resist replay: card/NFC via server-generated nonce in challenge–response; QR via time-bound signed token with server-side replay cache; visitor pass via single/limited-use counter. | Replay is the cheapest attack on any transmitted credential. | Students: recording a tap must be useless. | TH-03 replay | M | Screen 3 (nonce exchange not visible to user; described in spec); screen 9 for detected replay | Capture and replay reader traffic and QR → DENY; second use of single-use pass → DENY. |
| **SEC-05** | All reader↔server and app↔server communication is protected with TLS 1.3 [39] with mutual authentication (reader client certificates); no plaintext or downgraded channels. | Network attacker and rogue reader. | — | TH-11 interception, TH-12 MITM, TH-16 device | M | Screen 11 shows "secure connection lost" state | TLS config scan; attempt plaintext/downgrade → connection refused. |
| **SEC-06** | Secrets (card keys, signing keys, tokens, nonces, session keys) must never appear in logs, UI, error messages, URLs, or analytics. Logs store only pseudonymous IDs and decision codes. | OWASP logging guidance [29]. | Privacy; insider misuse. | TH-13 privacy leak, TH-17 insider | M | Screen 19 shows only pseudonymous IDs and codes | Grep logs and UI for key material in test runs; code review. |
| **SEC-07** | Role-based access control with least privilege [14]: Guard (view decision, record manual event, request supervisor); Supervisor (approve manual entries, view gate status); Issuer (issue/revoke credentials); Approver (visitor passes); Auditor (read logs, re-identify with justification); Policy Admin (edit policies). No role has all permissions. Separation of duties: Issuer ≠ Auditor. | Insider abuse, privilege escalation. | Guards: not responsible for data they don't need. | TH-09 escalation, TH-17 insider | M | Screens 16, 17, 19, 20 each show role-limited views | Attempt cross-role actions via API → 403; review of role matrix. |
| **SEC-08** | The guard interface displays only: photo on file, display (first) name, role, decision, reason code, next step. Never roll number, phone, address, hostel, e-mail, or revocation reason. | Minimisation; guards should not be a data-exposure vector. | Ramesh: does not want to hold personal data. Meher: dignity on denial. | TH-13, TH-17 | M | Screens 5, 7, 8, 9, 16 | UI inspection; API response schema test. |
| **SEC-09** | Every failure (authentication, authorization, reader, network, database, power) results in DENY or in Manual Verification Mode; no failure state opens the gate or auto-allows. | Fail-safe defaults [14]. | — | TH-14 DoS, TH-15 outage, TH-16 device | M | Screens 6, 10, 11, 12 | Fault injection: kill network, DB, reader mid-transaction → DENY/manual, never ALLOW. |
| **SEC-10** | Every access decision and every administrative action is written to an append-only, integrity-protected log (hash-chained; periodic signed checkpoints) with synchronised timestamps. | Auditability; repudiation. | Admin: investigate incidents. Students: trust that logs cannot be silently edited. | TH-15 log tamper, TH-17 | M | Screen 19 log view with integrity status indicator | Modify a log record → verification fails; audit of chain. |
| **SEC-11** | Administrative operations (issue, revoke, policy change, re-identify, approve manual entry) require multi-factor authentication of the administrator and, for revoke/policy/re-identify, a two-step confirmation. | High-impact operations need stronger assurance [1]. | — | TH-09, TH-17, TH-10 DB | M | Screens 17, 18, 20 show MFA and confirm steps | Attempt admin action with single factor → refused; attempt without confirm → not applied. |
| **SEC-12** | All credential lifecycle operations are authenticated, authorised per SEC-07, and logged per SEC-10, including who, when, which credential, and reason. | Lifecycle integrity. | — | TH-17, TH-06 | M | Screens 17, 18 | Log inspection after each lifecycle test. |
| **SEC-13** | Repeated failed attempts (≥3 on one credential ID in 5 min, or ≥5 unknown credentials at one reader in 5 min; thresholds configurable) escalate to DENY–suspicious, alert the supervisor, and rate-limit the reader. | Detect brute force, cloning trials, probing. | Guards: told when something is off. | TH-02, TH-06, TH-14 | S | Screen 9 "SUSPICIOUS"; screen 16 alert | Scripted repeated attempts → escalation observed and logged. |
| **SEC-14** | The system stores only the personal data required: identity ID, display name, photo, role, programme/department, credential IDs/keys, validity, status. It does not store phone, address, emergency contact or any field not used by an implemented function. | Minimisation reduces breach impact. | Students: less to leak. | TH-10 DB compromise, TH-13 | M | Screen 17 shows only these fields | Schema review; DPIA checklist. |
| **SEC-15** | Log integrity per SEC-10; additionally, logs are write-only for all roles except Auditor (read); no role can delete or edit; retention deletion is a scheduled, logged process. | Prevent cover-up of insider actions. | — | TH-15, TH-17 | M | Screen 19: no edit/delete controls | Attempt delete via API → refused; verify scheduled purge logs itself. |
| **SEC-16** | Visitor passes are bound to a time window, gate set, and host; expire automatically; are single- or limited-use; and cannot be reissued without new approval. | Temporary credentials must not become permanent. | Visitors: clear validity. Guards: no judgement about "is this still OK". | TH-05 malicious visitor, TH-07 | M | Screens 14, 15 show window and gate binding | Use pass after window / at wrong gate / twice → DENY. |
| **SEC-17** | Lost or stolen credentials are revocable by the holder (self-service, immediate) and by an Issuer; revocation is irreversible for that credential (a new credential is issued instead). | Remove attacker's window; avoid "un-revoke" confusion. | Meher: block card from her phone at once. | TH-01, TH-08 | M | Screen 18 | Self-revoke → immediate DENY; attempt to reactivate → refused. |
| **SEC-18** | Readers are treated as potentially compromised: each holds only its own client certificate and the offline verification material (public keys, signed revocation list), never master keys or the identity database; reader firmware is signed; tamper events are logged; a reader's certificate can be revoked server-side. | Onity [36] and DESFire side-channel [7] show devices leak. | — | TH-16 device compromise, TH-11 | M | Screen 10 reader failure/tamper state | Extract reader storage in test → no master key present; revoke reader cert → server refuses it. |
| **SEC-19** | Defined secure behaviour during network/database failure: readers verify offline with cached public keys and a signed revocation list ≤ N hours old (N configurable, e.g., 4); beyond N, or without cached material, enter Manual Verification Mode (FR-14, FR-19). No unconditional ALLOW. | Availability with bounded staleness. | Students: not stranded. Guards: know what to do. | TH-14, TH-15 outage | M | Screens 11, 12 | Fault injection with clock advance → mode transitions as specified. |
| **SEC-20** | Security must not depend on secrecy of the design, protocol, or code (open design [14]). Only keys are secret. All cryptography uses standard primitives and vetted libraries (AES-128/256, Ed25519 [38], SHA-256, TLS 1.3 [39]); no custom algorithms. | Course brief; established principle. | — | All | M | N/A (design property) | Design review; dependency audit. |

**Note on what SEC requirements do *not* claim.** They do not claim the system cannot be attacked. Residual risks (relay, coerced or fatigued guard, compromised phone, future chip break) are recorded in Section 24 with the compensating controls.

---

# 21. Privacy Requirements

Grounded in DPDP Act 2023 [22], ISO/IEC 29100 [26] and Privacy by Design [27].

| ID | Requirement | Principle | Rationale / user need | Pri | Prototype feature | Phase 2 evaluation |
|---|---|---|---|---|---|---|
| **PRIV-01** | Data minimisation: collect and store only the fields listed in SEC-14; visitors: name, host, purpose category, window, contact channel (for pass delivery only). | Collection limitation | Reduce breach impact; Ramesh does not want to hold personal data. | M | Screens 13, 17 | Schema review |
| **PRIV-02** | Purpose limitation: entry data is used only for access decisions, security incident investigation and system integrity. It is not used for attendance, academic monitoring, or behavioural analytics without a separate, documented policy decision and notice. | Purpose specification | Q15b concern **[DATA REQUIRED]**; trust. | M | Screen 20 privacy notice text | Policy document; API scopes |
| **PRIV-03** | Role-based visibility: Guard sees photo, first name, role, decision, next step. Supervisor adds gate status and alert queue. Issuer sees identity fields needed to issue. Auditor sees pseudonymous logs; re-identification per PRIV-06. Student sees own data only. | Use limitation | Q14c **[DATA REQUIRED]**. | M | Screens 5, 16, 17, 19, 20 | Role-based UI/API tests |
| **PRIV-04** | Pseudonymous logging: access events store a credential pseudonym, not name or roll number; the mapping is held in a separately access-controlled table. | Minimisation; unlinkability | Routine log review reveals no identities. | M | Screen 19 | Log inspection |
| **PRIV-05** | Retention limits: access events retained 90 days then deleted (configurable; justify any longer period); flagged/incident events retained until case closed + 1 year; visitor records deleted 30 days after visit; revoked credential records retained 1 year for fraud detection then deleted. Deletion is automatic and logged. | Retention limitation | DPDP erasure obligation [22]. | M | Screen 20 shows retention policy | Verify scheduled purge |
| **PRIV-06** | Re-identification of a pseudonymous log entry requires Auditor role, a recorded case reference and justification, and is itself logged and visible to a second administrator. | Accountability | Prevent casual look-ups of "where was student X". | M | Screen 19 re-identify dialog | Attempt without justification → refused; log check |
| **PRIV-07** | Transparency notice: students and visitors are told, at enrolment and on the app/pass, what is collected, why, who can see it, how long it is kept, and how to access or query it. | Openness | Trust (Q15c **[DATA REQUIRED]**). | M | Screen 20; enrolment text | Content review |
| **PRIV-08** | Individual access: a student can view their own entry events and credential status, and request correction of identity data. | Individual participation | Q14b **[DATA REQUIRED]**; DPDP right of access [22]. | S | Screen 20 | Functional test |
| **PRIV-09** | Visitor data: no public register; visitor's phone/e-mail is used only to deliver the pass and is not shown to the guard; deleted per PRIV-05. | Minimisation | Dr. Fernandes persona; H6. | M | Screens 13–15 | UI/API inspection |
| **PRIV-10** | Privacy-preserving UI: the guard screen is angled/hooded so bystanders cannot read it; the user-facing indicator shows only colour/icon and a short message, never the name; denial messages do not state the reason to bystanders. | Confidentiality in public space | Meher: dignity; public interrogation today. | M | Screens 4–9 user-facing vs guard-facing split | Field check of placement; UI review |
| **PRIV-11** | Secure storage: personal data and key material encrypted at rest (AES-256; keys in HSM/KMS or OS keystore); photo store separately access-controlled. | Security safeguards | DPDP reasonable safeguards [22]. | M | — | Config review |
| **PRIV-12** | No secondary sharing: entry data is not shared with third parties or other campus systems without a documented legal basis and notice. | Disclosure limitation | Q15b. | M | Screen 20 notice | Policy and API review |

## 21.1 Visibility comparison: what each role sees

| Data item | Student (own) | Security guard | Supervisor | Issuer / ID cell | Auditor | Policy admin |
|---|---|---|---|---|---|---|
| Photo on file | ✔ | ✔ (on tap only) | ✔ (on tap/alert only) | ✔ (when issuing) | On re-identify only | ✘ |
| First / display name | ✔ | ✔ | ✔ | ✔ | On re-identify only | ✘ |
| Full name | ✔ | ✘ | ✘ | ✔ | On re-identify only | ✘ |
| Roll number / employee ID | ✔ | ✘ | ✘ | ✔ | On re-identify only | ✘ |
| Programme / department | ✔ | ✘ | ✘ | ✔ | On re-identify only | ✘ (roles only) |
| Role (student/staff/visitor) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ (as policy subject) |
| Hostel | ✔ | ✘ | ✘ | ✘ (not stored) | ✘ | ✘ |
| Phone / e-mail | ✔ | ✘ | ✘ | ✘ (not stored for students; visitor contact only for pass delivery) | ✘ | ✘ |
| Home address / emergency contact | ✘ (not stored) | ✘ | ✘ | ✘ | ✘ | ✘ |
| Credential status (active/revoked/expired) | ✔ (own) | Decision only | Decision only | ✔ | ✔ (pseudonymous) | ✘ |
| Revocation reason | ✔ (own, generic) | ✘ | ✘ | ✔ | ✔ | ✘ |
| Own entry events | ✔ | ✘ | ✘ | ✘ | ✔ (pseudonymous; re-identify with justification) | ✘ |
| Other people's entry events | ✘ | ✘ | Gate counts only | ✘ | ✔ (pseudonymous) | Aggregates only |
| Decision + reason code + next step | ✔ (own) | ✔ | ✔ | ✘ | ✔ | ✘ |
| Visitor host name | — | ✔ | ✔ | — | ✔ | ✘ |
| Visitor contact | — | ✘ | ✘ | Approver only, for delivery | ✘ | ✘ |
| Policy rules | Own applicable summary | ✘ | Read | ✘ | Read | ✔ Edit |

---

# 22. Usability Requirements

Grounded in Nielsen [15], Yee [13], Cranor [16], Adams & Sasse [10], Herley [11], WCAG 2.2 [28].

| ID | Requirement | Rationale / user need | Evidence | Pri | Prototype feature | Phase 2 evaluation |
|---|---|---|---|---|---|---|
| **USE-01** | The normal authenticated entry requires one physical action from the student (a tap) and no action from the guard beyond a glance; time from tap to result ≤ 1.5 s (95th percentile) online, ≤ 2 s offline. | Herley [11]: the secure path must cost less than today's glance. H1, H7. | [S] 11, 17; [P] Q11a, observation **[DATA REQUIRED]** | M | Screens 1–5 | Timing measurement at pilot gate |
| **USE-02** | A first-time guard, after ≤15 minutes of training, can correctly state the meaning and next step for every result screen without technical vocabulary. | Cranor [16]: comprehension stage. Ramesh persona. | [S] 12, 16; [P] B Q13 **[DATA REQUIRED]** | M | Screens 4–12 use plain bilingual text | Comprehension test with guards |
| **USE-03** | Authentication failure ("we don't recognise this credential") and authorization failure ("recognised, but not allowed here/now" — expired, revoked, wrong gate) are visually and verbally distinct on both guard and user displays, with distinct next steps. | Core project distinction; different responses required. | [S] 1, 14 | M | Screens 6 vs 7, 8, 9 | Guards sort screens into correct categories |
| **USE-04** | Every error/deny message states what happened (in role-appropriate detail) and exactly what to do next; no dead ends. | Nielsen #9; Whitten & Tygar [12]. | [S] 12, 15 | M | All DENY screens have "Next step" block | Heuristic + task test T2, T3, T6 |
| **USE-05** | The guard interface never requires the guard to read more than the photo, one name, one status word and one line of instruction to make the routine decision. | Ramesh: one glance. SEC-08. | [S] 13, 16; [P] B Q11 **[DATA REQUIRED]** | M | Screen 5 layout | Eye-tracking optional; timed decision test |
| **USE-06** | System status is always visible on the guard screen: online/offline mode, revocation list age, reader health, pending alerts. | Nielsen #1; Yee visibility [13]. | [S] 13, 15 | M | Screen 16 status bar; screens 10, 11 | Heuristic |
| **USE-07** | Learnability for students: no enrolment step is needed to use the card; phone enrolment takes ≤3 minutes and is optional. | Path of least resistance [13]. | [S] 13 | M | Enrolment described in spec | Timed enrolment |
| **USE-08** | Multimodal feedback for the result: colour (green/amber/red), icon (✓ / ! / ✕), distinct audio tone, and (on phone) haptic; never colour alone. | Accessibility (WCAG 1.4.1 [28]); outdoor glare; guard watches person not screen. | [S] 28 | M | Screens 4–9 | Accessibility audit |
| **USE-09** | Text contrast ≥ 4.5:1, minimum 18 pt for status words on the guard display, readable in direct sunlight and at night; bilingual (Hindi/English) labels. | WCAG 1.4.3 [28]; observation of light conditions **[DATA REQUIRED]**. | [S] 28; [P] D | M | All screens | Contrast tool; field test |
| **USE-10** | Error prevention: destructive admin actions (revoke, policy change) require confirmation showing the exact effect; guard "Mismatch" and "Call supervisor" are large, separated, and reversible until confirmed. | Nielsen #5; reversibility [13]. | [S] 13, 15 | M | Screens 16, 17, 18, 20 | Heuristic; task T9 |
| **USE-11** | Recognition over recall: guard next-step scripts are on screen, not memorised; admin forms show roster data rather than requiring typed IDs. | Nielsen #6. | [S] 15 | S | Screens 6–12, 17 | Heuristic |
| **USE-12** | Queue management: reader supports back-to-back taps with no reset step; result clears automatically after the person passes or after 5 s; a second reader lane can be added without software change. | H1, H7; peak load. | [P] observation **[DATA REQUIRED]** | S | Screen 5 auto-clear | Throughput test |
| **USE-13** | Trust and transparency: students can see why the system exists, what it records, and their own records (PRIV-07, PRIV-08); the user-facing display shows a short, respectful message on denial. | Q15c **[DATA REQUIRED]**; Meher dignity. | [P] Q15 | S | Screens 4–9 user side; 20 | Survey after pilot |
| **USE-14** | Accessibility of the physical interaction: reader mounted at a height reachable from a wheelchair (approx. 0.9–1.1 m), tap works through wallets/bags, phone path supports OS screen readers; a non-visual confirmation exists. | Q18 **[DATA REQUIRED]**; WCAG [28]. | [S] 28; [P] Q18 | M | Spec notes on screen 1, 2 | Accessibility review |

---

# 23. Non-Functional Requirements

| ID | Category | Requirement | Measure / target | Evidence |
|---|---|---|---|---|
| **NFR-01** | Performance | End-to-end decision latency at gate | ≤1.5 s p95 online; ≤2 s p95 offline (USE-01) | [S] 11 |
| **NFR-02** | Performance | Throughput per reader lane | ≥30 people/minute sustained with back-to-back taps | Observation **[DATA REQUIRED]** |
| **NFR-03** | Reliability | Reader operates correctly across expected outdoor conditions (temperature, humidity, dust, rain shelter) and after power interruption without manual reconfiguration | Vendor spec + field pilot | [A] |
| **NFR-04** | Availability | Gate authentication function available ≥99.5% of operating hours, counting offline mode as available and Manual Verification Mode as degraded | Uptime log | [A] |
| **NFR-05** | Availability | Offline operation with cached verification material for ≤ N hours (N default 4) before degrading to manual | Fault injection (SEC-19) | [S] 2 |
| **NFR-06** | Scalability | Supports the full campus population plus visitors and ≥10 gates/readers without architectural change; policy evaluation O(1) per decision | Load test | [A] |
| **NFR-07** | Security | All SEC-xx requirements; standard primitives only; dependency vulnerability scan clean at release | OWASP ASVS L2 checklist [29] | [S] 29 |
| **NFR-08** | Privacy | All PRIV-xx requirements; DPIA completed before any pilot with real student data | DPIA document | [S] 22, 26 |
| **NFR-09** | Accessibility | Guard and student interfaces meet WCAG 2.2 AA where applicable; physical mounting per USE-14 | Audit | [S] 28 |
| **NFR-10** | Maintainability | Policy, thresholds, retention periods, and N are configuration, not code; components (reader firmware, auth service, policy engine, log service) are separately deployable; ≥50% original code (course rule [43]) | Code review | [S] 43 |
| **NFR-11** | Auditability | 100% of access decisions and admin actions logged with integrity protection; log verification tool provided | Verification run | [S] 29 |
| **NFR-12** | Usability | All USE-xx; SUS score ≥70 from guards in Phase 2 pilot; task success ≥95% for T1, T5, T6 | Phase 2 study | [S] 15 |
| **NFR-13** | Interoperability | Card credential based on ISO/IEC 14443 [23]; QR per ISO/IEC 18004 [25]; tokens per RFC 7519 [40] with Ed25519 [38] | Standards conformance | [S] 23, 25, 38, 40 |
| **NFR-14** | Time synchronisation | All readers and servers synchronised to ≤1 s (NTP); clock drift triggers a status warning; TOTP/token windows tolerate ±1 step | Monitoring | [S] 37 |
