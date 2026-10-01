# 36. Heuristic Evaluation

> **This is an initial heuristic evaluation by the design team, not user testing.** No students, guards or administrators have used the prototype. Findings are expert judgements against Nielsen's heuristics [15] and usable-security principles [13, 14, 27]. Each finding has a severity (0 none, 1 cosmetic, 2 minor, 3 major, 4 catastrophic) and a planned fix. User testing with real participants is a Phase 2 activity (Section 40).

**Method.** Two evaluators walked through tasks T1–T10 (Section 18) on the 20 wireframes independently, recorded violations, then merged and rated them.

## 36.1 Nielsen's heuristics

| Heuristic | Assessment | Findings (severity) | Planned fix |
|---|---|---|---|
| 1. Visibility of system status | Strong: status bar on every guard screen (online/offline, list age, reader health); user indicator shows ready/reading/verifying/result. | HE-1 (2): S03 gives no indication of *how long* is normal; a slow network could make users re-tap. | Add "usually under 2 s" and a 2-s "taking longer" message (already in spec; ensure in wireframe). |
| 2. Match between system and real world | Good: "Not accepted", "Expired", "Revoked", "Security Office", "ID cell" are terms guards and students use. Bilingual labels planned. | HE-2 (2): "Revocation list age" (S11) is technical vocabulary for guards. | Rename to "Last update from server: 1 h 20 m ago (limit 4 h)". |
| 3. User control and freedom | Admin actions have Cancel; Mismatch requires confirm; guard can [Done] out of any result. Deliberate limitation: no "Allow anyway" (security override of this heuristic, justified in Section 38). | HE-3 (1): S09 has no explicit way for the guard to dismiss a false alert other than [Done]; supervisor owns resolution. | Acceptable; add "Supervisor will clear this alert" text. |
| 4. Consistency and standards | Colour/word/icon triad consistent across S04–S09; red = deny, amber = authz-class deny with known identity, green = allow. | HE-4 (3): S06b "Not permitted at this gate/time" is amber, as are Expired (S07) — two different next steps share a colour. | Keep amber for both (both are "identity known, not authorized") but make the status word and next-step block the primary differentiator; add distinct icons (clock vs gate). |
| 5. Error prevention | Confirm dialogs on revoke/policy; Mismatch confirm; QR glare hints; no free-text personal data in manual mode. | HE-5 (2): S13 host form allows any time window; a host could create a week-long pass. | Policy-driven maximum window (e.g., 12 h) enforced in form with explanation. |
| 6. Recognition rather than recall | Next-step scripts on screen; roster search in S17; policy grid in S20. | HE-6 (2): S12 manual mode step list is long for a stressed guard in a queue. | Collapse to 3 large steps with progressive disclosure; provide printed card at gate. |
| 7. Flexibility and efficiency | Back-to-back taps; auto-clear; flagged-only filter in S19; two credential methods. | HE-7 (1): Supervisors may want batch approval in manual mode at peak; spec mentions it, wireframe does not show it. | Add [Approve next 10 min] control for supervisor role only, logged as such. |
| 8. Aesthetic and minimalist design | Guard result screens contain photo, one name, one status word, one line, one button. | HE-8 (1): S16 dashboard tiles risk clutter if alert list grows. | Cap visible alerts at 3 with count badge. |
| 9. Help users recognise, diagnose, recover from errors | Every DENY names the class and next step; user side gives a respectful, non-specific message. | HE-9 (3): S06 user message "Not accepted — visit the Security Office" is identical for fake credential and revoked credential (by design, for bystander privacy), which means a *legitimate* student with a revoked card gets no private explanation at the gate. | Send a private explanation to the student's app immediately ("Your card was revoked on … because a loss was reported. Visit …"). Keeps bystander message generic. |
| 10. Help and documentation | Scripts embedded; training target ≤15 min (USE-02). | HE-10 (2): No on-screen "What do these colours mean?" help for a relief guard. | Add a persistent "?" on S16 opening a one-page legend. |

## 36.2 Usable-security principles

| Principle | Assessment | Findings | Planned fix |
|---|---|---|---|
| Visible security state [13] | Online/offline, list age, tamper, alerts all visible; decision shows *both* authn and authz outcome. | HE-11 (2): The guard cannot tell from S05 which method (card/phone/QR) was used; this could matter if policy later restricts methods for certain gates. | Add small method icon to S05 (not to user side). |
| Safe defaults [14, 27] | Deny-by-default policy is shown in S20; new readers disabled; minimal guard view; retention on. | None. | — |
| Security effort proportional to risk [17] | Routine entry = one tap; additional steps only on anomalies, manual mode, admin ops. | HE-12 (2): Mismatch confirm-tap adds a step in the moment the guard most needs speed (a person trying to walk through). | Make first tap immediately turn the user indicator red (stop the person) and log a provisional flag; second tap confirms; single tap auto-confirms after 3 s. |
| Reversibility [13] | Admin actions confirm; suspension reversible; revocation deliberately irreversible with replacement path. | HE-13 (2): Student self-revoke (S18) is irreversible with no cooling-off; accidental taps are possible. | Keep irreversible (security), but require typing "DISABLE" or biometric confirm; show consequence text (already present). |
| Data minimisation [22, 27] | Guard sees photo + first name + role; logs pseudonymous; visitor contact hidden from guard; no phone/address stored. | HE-14 (1): S15 visitor pass shows host *full* name; first name + department may suffice. | Show host first name + department. |
| Clear security explanations [12] | Reasons are plain-language; technical codes hidden from guards, available to auditors. | HE-15 (3): S06 ("not a valid campus credential") could be read by a guard as "the student is lying"; risk of confrontation. | Reword: "The reader could not verify this card or code. This can happen with damaged, copied or non-campus credentials. Direct to Security Office." |

## 36.3 Summary

15 findings: 0 catastrophic, 3 major (HE-4, HE-9, HE-15), 9 minor, 3 cosmetic. All three major findings concern *communication of denial* and will be fixed in the next wireframe iteration before Phase 2 development. The evaluation confirms the prototype's structural decisions (authn/authz separation, minimal guard view, no override) but shows that wording and colour differentiation need refinement, which is exactly what user testing with guards in Phase 2 will validate.

---

# 37. Requirement Traceability

Full matrix in `03_Requirements/Requirements_Traceability_Matrix.xlsx` (Appendix F). The chain is: **Finding → User need → Requirement → Security risk (threat) → Design feature → Prototype screen → Future test**. Until fieldwork completes, the "Finding" column cites a hypothesis (H-x), a secondary source [n], or a labelled assumption; each such row must be updated with the primary evidence code (Q-x, G-x, S-x) when data arrives. Representative rows:

| Finding (status) | User need | Requirement(s) | Threat(s) | Design feature | Screen(s) | Future test (Phase 2) |
|---|---|---|---|---|---|---|
| H1 Card retrieval delays queue **[DATA REQUIRED: Q4, Q11a/b, observation]** | Enter without breaking stride | USE-01, FR-01, D1 | — (usability) | Tap-and-go card; optional phone credential | S01, S02, S04 | Timing at pilot gate, p95 ≤ 1.5 s; SUS with students |
| H2 Guards do not read expiry **[DATA REQUIRED: B Q4, observation]** | Automatic enforcement | SEC-03, FR-03 | TH-07 | Server-side validity check; EXPIRED screen | S07 | Expired card → DENY; guard comprehension test |
| H3 Face familiarity replaces card check **[DATA REQUIRED: B Q3]** | Reliable identity check under load | FR-12, USE-05, SEC-08 | TH-04, TH-06 | Server photo on guard tablet; Mismatch | S05, S16 | Lent-card test scenario with consenting participants; Mismatch usage rate |
| H4 Forgotten ID handled inconsistently **[DATA REQUIRED: Q6, Q7, B Q6]** | Defined, dignified fallback | FR-01 (phone), FR-13, D9 | TH-04 (social engineering) | Phone credential; temp pass via Security Office; no gate bypass | S02, S06, S12 | Task T1 with phone; T6 walkthrough with guards |
| H5 Lost card not blocked; slow replacement **[DATA REQUIRED: Q9, Q10, A2]** | Block lost card instantly; keep access | FR-09, SEC-17, SEC-02, FR-08 | TH-01, TH-08 | Self-service revoke; irreversible; phone credential continues | S18, S08 | Revoke → tap within 30 s → DENY; T4 task time |
| H6 Visitor register slow, leaks phone numbers **[DATA REQUIRED: B Q9, observation]** | Fast, private visitor entry | FR-10, FR-11, SEC-16, PRIV-09 | TH-05, TH-13 | Host pre-approval; signed QR pass; no register | S13–S15 | T7 timing; guard never sees contact (API test) |
| H7 Peak pressure → waving through **[DATA REQUIRED: B Q8, observation]** | Speed without weakening check | USE-01, USE-12, SEC-13 | TH-04, TH-06 | Back-to-back taps; auto-clear; anomaly alerts | S04, S05, S09 | Throughput test ≥30/min; alert precision |
| H8 No record for incidents **[DATA REQUIRED: A6]** | Auditable decisions | FR-06, SEC-10, FR-15 | TH-15 | Hash-chained pseudonymous log; auditor tool | S19 | Chain verification; tamper test |
| H9 Students uneasy about data use **[DATA REQUIRED: Q14, Q15]** | Transparency; purpose limitation; self-view | PRIV-02, PRIV-07, PRIV-08, USE-13 | TH-13 | Privacy screen; own-records view; retention | S20 | Post-pilot trust survey; DPIA |
| [SECONDARY] MIFARE Classic / hotel locks cloneable [4, 5, 8, 9] | Credential cannot be copied | SEC-01, SEC-04, D1 | TH-02, TH-03, TH-06 | AES challenge–response; signed dynamic QR; never UID | S03, S06 | Clone/replay tests → DENY |
| [SECONDARY] Relay attacks practical [18–20] | Compensating human check | FR-12, USE-05 | TH-04b | Photo + Mismatch | S05 | Documented residual; guard training |
| [SECONDARY] Reader compromise (Onity) [36] | Reader holds no secrets | SEC-18, SEC-09 | TH-16, TH-12 | Public keys only; signed decisions; tamper log | S10 | Reader storage extraction test |
| [SECONDARY] Fail-safe defaults [14] | No failure opens gate | SEC-09, SEC-19, FR-14, D7 | TH-14 | Offline-verified → manual supervised | S10–S12 | Fault injection |
| [SECONDARY] Insider abuse; least privilege [14, 30] | Roles limited; look-ups justified | SEC-07, SEC-11, PRIV-06 | TH-09, TH-17 | Six roles; MFA; justified re-identify | S17, S19 | Cross-role API tests |
| [SECONDARY] DPDP purpose/retention [22] | Lawful, minimal, time-bound data | PRIV-01..05, PRIV-12 | TH-10, TH-13 | Schema; retention job; pseudonyms | S19, S20 | Schema review; purge verification |
| [SECONDARY] Users bypass slow security [10, 11, 17] | Secure path is fastest | USE-01, D4 (no bypass) | TH-04 | Tap faster than glance; redundancy not bypass | S01–S05 | Timing; observation of guard behaviour at pilot |
| [SECONDARY] Colour-only signals inaccessible [28] | Multimodal feedback | USE-08, USE-09, USE-14 | — | Icon + word + tone; contrast; reader height | S04–S09 | Accessibility audit |
| [SECONDARY] Secrets in logs are a common breach vector; no-delete logs needed for insider accountability [29] | Logs useful but never dangerous | SEC-06, SEC-15, SEC-10 | TH-13, TH-15, TH-17 | Pseudonymous, secret-free, append-only log; no edit/delete controls | S19 | Grep for key material; attempt delete via API |
| [SECONDARY] Open design: only keys are secret [14] | Verifiable security | SEC-20, NFR-07 | All | Standard primitives/libraries only; design published in this report | — | Dependency and design review |
| H9 / Meher persona: public interrogation at the gate is undignified **[DATA REQUIRED: Q14c, Q20]** | Denial handled privately | PRIV-03, PRIV-10, USE-13, DP-13 | TH-13 | Split user/guard displays; generic bystander message; private app explanation | S04–S09, S20 | Field check of screen placement; post-pilot survey |
| [SECONDARY] DPDP erasure obligation [22] | Data not kept longer than needed | PRIV-05 | TH-10, TH-13 | Retention job (90 d / 30 d / 1 y), logged purge | S20 | Verify scheduled purge |
| Ramesh persona: relief guards need to understand every result without training **[DATA REQUIRED: B Q13]** | Learnable in ≤15 min; distinct messages; next step always shown | USE-02, USE-03, USE-04, USE-06, USE-11 | TH-04, TH-17 | Plain bilingual status word + next-step block + status bar on every guard screen | S05–S12, S16 | Guard comprehension test (sort screens; state next step) |
| [SECONDARY] Path of least resistance; reversibility [13] | Optional enrolment; safe admin actions | USE-07, USE-10 | TH-09 | Card needs no enrolment; phone enrolment ≤3 min; confirm dialogs show exact effect | S17, S18, S20 | Timed enrolment; task T9 error rate |
| [ASSUMPTION] A3 most students have smartphones | Universal access regardless of phone | D1 (card baseline) | — | Card for all; phone optional | S01 | Q17 data; enrolment rate at pilot |

**Coverage check**: every SEC-xx, PRIV-xx and USE-xx requirement appears in at least one traceability row in the XLSX; every prototype screen S01–S20 is reached by at least one row; every High-priority threat (Section 24.5) has at least one mitigating requirement with a screen and a test.

---

# 38. Security–Usability–Privacy Trade-offs

| # | Security wants | Usability wants | Privacy wants | Tension | Design response | What we give up |
|---|---|---|---|---|---|---|
| TO-1 | Second factor on every entry (PIN/biometric) | One tap, no attention | Fewer biometric templates | MFA per tap would double gate time and create a biometric database | Card is single-factor but cryptographic; phone path gets a second factor "for free" via unlock; MFA is required only for admin operations and could be policy-enabled for high-risk gates later | Perimeter entry remains single-factor for card users; accepted for a moderate-risk perimeter [2] |
| TO-2 | Guard verifies face carefully on every tap | Guard glances; queue moves | Guard sees as little as possible | Careful comparison slows queue; showing more data doesn't help the face check | Photo-first layout with one name; Mismatch button; periodic training; anomaly alerts carry the load for statistical patterns | Guard fatigue remains the main residual risk for borrowed credentials and relay |
| TO-3 | Show guard full identity to "verify" | Simpler decision with less on screen | Minimal disclosure | More data ≠ better decision; roll number and department do not help match a face | Show photo, first name, role, decision only (D3) | Guard cannot resolve "this looks like a different Aarav" without the office; acceptable |
| TO-4 | Additional verification on anomalies | No extra steps | — | Extra steps for everyone waste the compliance budget [17] | Escalate only on triggers (repeated failures, mismatch, velocity) | Some sophisticated single-attempt attacks are not escalated |
| TO-5 | Fail closed on any infrastructure failure | Gate keeps moving | — | Fully closed gate is a DoS target and strands students | Bounded offline verification (N h) then supervised manual mode; never unattended open | Revoked credential may work offline for up to N h; manual mode is weaker than electronic |
| TO-6 | Detailed denial reason to guard | Guard knows what to say | Student's reason (e.g., disciplinary) is private | Telling the guard why a card is revoked leaks sensitive status | Guard sees class + next step; student gets reason privately in app (HE-9 fix) | Guard may face a student who says "why?"; script directs to office |
| TO-7 | Complete identified audit trail | Fast auditor workflow | Pseudonymous logs; no casual look-ups | Justification step slows investigations | Pseudonymous by default; re-identify with case reference, logged, visible to second admin | Auditors spend ~30 s more per re-identification |
| TO-8 | Long log retention for investigations | — | Short retention | Longer logs = larger surveillance dataset and breach impact | 90 days routine; flagged events kept until case closed + 1 y | Incidents discovered after 90 days lose routine context |
| TO-9 | No self-service revocation (issuer verifies loss claim) | Instant, from phone | Student controls own data | Issuer-only leaves the lost card live for hours; self-service could be triggered maliciously by someone with the student's phone | Self-service immediate + irreversible; requires app login (phone unlock); consequence text | A malicious actor with an unlocked phone can revoke the card (nuisance, not intrusion) |
| TO-10 | Reject all visitors without pre-approval | Walk-in visitors admitted quickly | Minimal visitor data | Pre-approval only would refuse legitimate walk-ins | Gate-initiated host approval on host's phone; pass issued on the spot | Walk-in waits for host response; no host response = no entry |
| TO-11 | Strong chip family (higher cost) | — | — | Budget vs assurance | Specify AES challenge–response class; exact product is a procurement decision | Higher per-card cost than Classic-class cards |
| TO-12 | Card emulation on iOS (uniform phone experience) | Same experience on all phones | — | iOS restricts HCE to entitled partners | Android NFC + QR on iOS in Phase 2 (D10) | iPhone users get the slower QR path for the phone credential; card remains universal |

The report's position: none of these tensions is resolved by declaring one value the winner. Each response is chosen so that the *routine* case is fast and private and the *exceptional* case bears the added security cost, following the compliance-budget argument [17] and Yee's path-of-least-resistance principle [13].

---

# 39. Limitations

1. **No primary data yet.** The most significant limitation of this version: every finding slot in Section 11 is a placeholder. The requirements are grounded in secondary research and labelled assumptions. Several decisions (D1, D3, D4, D9) explicitly depend on Q16/Q17/Q14c/B Q9–Q12 and may change.
2. **Personas are synthesised.** They are design tools, not evidence, and will be revised after fieldwork.
3. **Heuristic evaluation only.** No user has used the prototype; the three major findings suggest denial wording needs testing with guards.
4. **Access to administration uncertain.** If the security office/ID cell cannot be interviewed, lifecycle stages 1, 6 and 7 rest on assumptions about institutional process.
5. **Secondary research breadth.** Sources were selected for credibility and relevance, not by systematic review; the research gap (Section 15) is defensible against the sources reviewed but is not a claim of global novelty.
6. **No Indian-university-specific sources.** We found no reliable public documentation of specific Indian campus gate technologies and make no claims about them.
7. **Relay attacks not prevented cryptographically.** Documented as residual (TH-04b).
8. **Exit not controlled.** Overstay and occupancy cannot be detected; a future design could add exit readers with the same privacy analysis.
9. **Biometrics excluded.** A face-matching assistant for guards could reduce fatigue errors but requires a separate ethical, legal and accuracy analysis; deliberately out of scope.
10. **Vehicle gates** treated conceptually only.
11. **Platform constraints** for phone credentials (iOS) limit uniformity in Phase 2.
12. **Cost and procurement** not analysed beyond relative terms.

---

# 40. Phase 2 Plan

Phase 2 deadline: 17 November 2026 (executable + user guide). Second poster with live demo: 26 November 2026. Peer testing: 18–25 November. Final recorded presentation: 29 November [43].

## 40.1 Immediate (before Phase 2 development starts)
- Complete fieldwork (questionnaire, ≥3 guard interviews, ≥3 observation sessions); replace all placeholders in Section 11; update Sections 16, 34, 37.
- Apply heuristic-evaluation fixes (Section 36) to wireframes; re-evaluate.
- Confirm D1 with Q16/Q17 data; confirm D3 with Q14c and B Q11/Q12.

## 40.2 Implementation scope (minimum viable, ≥50% original code [43])
| Component | Phase 2 implementation | Standards / libraries (no custom crypto) |
|---|---|---|
| Credential simulation | Since procuring AES smart cards and a SAM may be infeasible, simulate the card with (a) an Android HCE app performing Ed25519 challenge–response and (b) a dynamic signed QR; if a DESFire EV3 dev kit is available, integrate real card authentication for demo | Ed25519 [38]; Android HCE; ZXing for QR |
| Reader | Android tablet or Raspberry Pi with NFC reader + camera; verifies locally with cached public keys and signed revocation list; mutual TLS to server | TLS 1.3 [39]; standard NFC libraries |
| Auth + policy service | Web service: nonce issuance, signature verification, status/validity check, policy evaluation, signed decisions | Vetted crypto library (libsodium / platform); JWT [40] |
| Stores | Relational DB with encrypted-at-rest volume; pseudonym mapping in separate schema; HSM simulated with an isolated key service (documented as simulation) | AES-256; parameterised queries |
| Audit log | Append-only table with hash chain and periodic signed checkpoints; verifier CLI | SHA-256; Ed25519 |
| Guard tablet UI | Screens S05–S12, S16 | Accessibility: contrast, icons, tones |
| Admin console | S17, S19, S20 with RBAC, MFA (TOTP [37]), confirm dialogs | OWASP ASVS L2 [29] |
| Student app | Enrolment, dynamic QR, HCE, report lost (S18), privacy view (S20) | Hardware keystore |
| Visitor flow | S13–S15 with signed passes | Ed25519 |

## 40.3 Security testing
- Unit and integration tests for every SEC requirement's "Phase 2 evaluation" column (Section 20).
- Attack scenario replays (Section 25) as test cases: clone (UID copy), replay (captured token), expired, revoked, offline staleness, rogue-server ALLOW injection, cross-role API calls, log tampering.
- Dependency vulnerability scan; ASVS L2 self-assessment; threat model review against implemented DFD.
- Prepare for peer testing (Nov 18–25): expect testers to probe exactly the residuals we documented; the user guide will state them.

## 40.4 Usability testing
- Task-based study with ≥5 guards (T5, T6, T7, T11, T12) and ≥10 students (T1, T2, T4, T13): success rate, time, errors, SUS [15].
- Comprehension test for USE-02 (guards classify result screens after 15-minute training).
- Accessibility audit (WCAG 2.2 AA, contrast, screen reader on app).
- Trust/privacy survey post-use (Q14/Q15 repeated).

## 40.5 Deliverables
Executable (server + reader/guard app + student app + admin console) with seeded demo data; user guide covering all roles and stating residual risks; updated report Sections 11, 16, 34, 36, 37; poster; recorded presentation answering Part A (study design, how studies shaped the tool, design themes) and Part B (security requirements, how addressed, classes of vulnerabilities reported by peers, causes and lessons) [43].

---

# 41. Conclusion

Phase 1 set out to replace an assumption ("a card is an identity") with an evidence chain. The chain is in place: a mixed-methods research plan with ready-to-run instruments; a literature and existing-system review that shows why authenticating card data rather than key possession has failed repeatedly in deployed systems; a threat model of twelve actors and seventeen threats with mitigations and honestly stated residuals; a requirements catalogue of 20 functional, 20 security, 12 privacy, 14 usability and 14 non-functional requirements; a credential lifecycle, security and system architecture, data-flow and privacy data-flow designs; workflows for every failure and edge case with no insecure bypass; a twenty-screen prototype in which every screen traces to a requirement; and an initial heuristic evaluation that already points to the wording problems Phase 2 testing must resolve.

The central design commitments are: authenticate the key, not the artefact; keep authentication and authorization as separate decisions with separate messages; show the guard a face and a status and nothing more; fail to a defined, audited manual mode rather than to an open gate; log everything pseudonymously and re-identify only with justification; and make the secure path the fastest one.

What Phase 1 has not done is collect primary data. Every placeholder in this report is a commitment to do so before Phase 2 development begins, and the traceability matrix is built so that each requirement's evidence column can be updated without restructuring the design. The provisional technology direction, a cryptographic smart card for everyone with an optional phone credential and signed visitor passes, is the direction the threat model and secondary research support; the user studies will confirm, adjust, or overturn it.
