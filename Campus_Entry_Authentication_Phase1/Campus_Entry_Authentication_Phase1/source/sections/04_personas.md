# 16. Personas

> **These personas are synthesised, not real participants.** They are constructed from the team's understanding of the campus, the hypotheses in Section 8, and the secondary research in Section 12. They are design tools, not findings. Every attribute marked **[ASSUMPTION]** must be checked against primary data; attributes marked **[DATA REQUIRED]** cannot be filled in until fieldwork is done. Once data is available, the personas will be revised to reflect actual distributions (e.g., real proportions of hostellers, phone ownership, forgotten-ID frequency).

## Persona 1 — "Aarav", regular student

| | |
|---|---|
| **Context** | Third-year B.Tech, hosteller. Enters and leaves campus 2–4 times daily (classes, gym, food outside). Carries a smartphone with NFC **[ASSUMPTION]**. Keeps ID card in wallet. **[ASSUMPTION]** |
| **Goals** | Get through the gate without breaking stride. Not be stopped or questioned. Not be late to an 8:30 class because of a queue. |
| **Frustrations** | Fishing the card out of a wallet while carrying a laptop bag and a coffee. Being questioned by a new guard when the regular one waves him through. Queues at 8:25. |
| **Security concerns** | Moderate. Has seen friends borrow each other's cards for the mess; assumes outsiders could do the same at the gate. Would like the gate to be harder to fool but not at his expense. |
| **Privacy concerns** | Does not want the college to know his daily movement pattern "for no reason". Would accept logging if it is only used for security and he can see his own records. **[ASSUMPTION; validate Q14a, Q14b, Q15b]** |
| **Usability needs** | Sub-two-second interaction. No app to open. Works when the phone is dead. Clear feedback that he's through so he doesn't hesitate. |
| **Accessibility needs** | None specific. |
| **Design implications** | Tap-and-go primary path (USE-01); phone credential as convenience (D1); pseudonymous log with self-service view (PRIV-08). |

## Persona 2 — "Meher", student who often forgets or has lost her ID

| | |
|---|---|
| **Context** | First-year M.Tech, day scholar, commutes by metro. Has lost her card once already; replacement took **[DATA REQUIRED]** days, during which she "explained herself" to guards daily. Frequently leaves the card in a different bag. Has an Android phone; unsure whether it has NFC. **[ASSUMPTION]** |
| **Goals** | Not be turned away or humiliated at the gate. Get a replacement quickly. Have a fallback that does not depend on a guard's mood. |
| **Frustrations** | Inconsistent handling: one guard lets her in after a question, another refuses. Feeling that she is a suspect. Having to wait for a friend to vouch for her. |
| **Security concerns** | Worried that whoever found her lost card could walk in as her. Nobody told her whether the old card was blocked. |
| **Privacy concerns** | Uncomfortable that explaining herself at the gate meant saying her name, roll number and department aloud in front of a queue. |
| **Usability needs** | A fallback path that is *defined*, *quick*, and *dignified*: e.g., a phone credential or a one-time code, not an interrogation. Immediate blocking of a lost card from her own phone. Clear status of her replacement. |
| **Accessibility needs** | None specific. |
| **Design implications** | Forgotten-ID workflow via enrolled phone credential (Section 32, screen 12); self-service lost-card report and instant revocation (FR-09, screen 18); guard sees "credential revoked" not "student suspicious" (USE-03). |

## Persona 3 — "Ramesh", security guard

| | |
|---|---|
| **Context** | Contract security staff, 8-hour shifts at the main pedestrian gate, sometimes covering the vehicle gate alone. Several years' experience **[DATA REQUIRED]**. Comfortable with a feature phone and WhatsApp; has used a fingerprint attendance machine; has not used a tablet-based system **[ASSUMPTION; validate B Q10]**. Primary language Hindi. |
| **Goals** | Keep the queue moving at 8:30 without letting in anyone he shouldn't. Not get blamed if something goes wrong. Know what to do when something unusual happens. |
| **Frustrations** | Students waving cards from three metres away. Not being able to read the small expiry date. Having no way to know whether a card was reported lost. Visitors who argue. Being told to check carefully and also told to clear the queue. |
| **Security concerns** | Knows regulars by face and worries that a stranger with a good card would get past him at peak. Has seen cards that "looked off" but had no way to confirm. |
| **Privacy concerns** | Does not want to be responsible for students' phone numbers or addresses; has been asked by outsiders for a student's details and would prefer not to have them. **[ASSUMPTION; validate B Q12]** |
| **Usability needs** | One glance, one decision. A big green/red result with the photo and a one-line reason in Hindi and English. A clear script for "what next" on every failure. No typing. Works in sunlight and at night. |
| **Accessibility needs** | Large text and high contrast (outdoor glare, reading glasses). Audio cue distinct for pass/fail so he can watch the person, not the screen. |
| **Design implications** | Guard screen shows photo, first name, role, decision, reason, next step only (PRIV-03, USE-02, USE-03, USE-04); bilingual; audio + colour + icon (USE-08); defined fallback scripts (FR-13, FR-14). |

## Persona 4 — "Dr. Fernandes", visitor

| | |
|---|---|
| **Context** | External examiner visiting for a PhD defence. Arrives by taxi 20 minutes before the defence, has never visited before, host is a faculty member. Has a smartphone. |
| **Goals** | Get in quickly and reach the right building. Not be treated as a suspect. Not hand over more personal information than necessary. |
| **Frustrations** | Writing name, phone, address and purpose in a register that the previous ten visitors' details are visible in. Being asked to deposit a government ID. Waiting while the guard phones the host, who is in a meeting. |
| **Security concerns** | Low personal concern, but expects a reputable institution to have a process. |
| **Privacy concerns** | Does not want her phone number visible to the next visitor or retained indefinitely. |
| **Usability needs** | Pre-approval by the host so the gate step is a single scan. A pass that says where she may go and until when. |
| **Accessibility needs** | May be carrying luggage; may not read Hindi. |
| **Design implications** | Host-initiated visitor pre-approval (FR-10, screens 13–15); time- and gate-bound signed QR pass (SEC-16); visitor data retained only for the visit + short window (PRIV-09); no public register. |

---

# 17. User Journeys

## 17.1 Current state: student entry

| Stage | Student action | Student thought | Guard action / workload | Pain point | Security risk | Privacy issue |
|---|---|---|---|---|---|---|
| 1. Approach | Walks toward gate, possibly in a group | "Where's my card?" | Watches approaching flow | Card retrieval begins late; slows queue (H1) | — | — |
| 2. Retrieve | Opens bag / wallet / lifts lanyard | "Hurry" | — | Two hands needed; drop risk | — | — |
| 3. Present | Shows card, often at distance | "He knows me anyway" | Glances at card colour, maybe photo | Distance defeats photo check (H3) | Borrowed/forged card passes | Roll no. and programme visible to bystanders |
| 4. Verify | Waits (usually <2 s) | "Why is he looking longer?" | Decides genuine/not; expiry rarely read (H2) | Inconsistent rigour across guards | Expired/revoked cards pass | — |
| 5. Decide | — | — | Nod / stop / question | Questioning is public and feels accusatory | False accept under peak pressure (H7); false reject of legitimate student | Student answers identity questions aloud |
| 6. Enter | Walks in | "Done" | Next person | — | No record for incidents (H8) | — |
| Exception: no card | Explains; names hostel/dept; waits for friend | "I'm being treated as a suspect" | Judgement call; may call supervisor | No defined procedure (H4); delay for everyone behind | Social engineering path: a confident stranger can "explain" too | Personal details spoken publicly |

**Summary of current-state issues**: the process is fast only when it is not really checking anything; it becomes slow, public and inconsistent exactly when it matters. Guard workload is cognitive (judgement) and social (confrontation), not mechanical.

## 17.2 Future state: student entry with the proposed system

| Stage | User action | User thought | System / guard response | Friction | Residual security risk | Residual privacy risk | Opportunity |
|---|---|---|---|---|---|---|---|
| 1. Approach | Walks to reader; card in wallet or phone in hand | "Tap" | Reader idle screen: "Tap card or phone" (screen 1) | Learn where reader is (first time) | — | — | Reader placement from observation data |
| 2. Tap | Holds wallet/phone to reader (<1 s) | — | Reader performs challenge–response; "Checking…" (screen 3, <1 s) | Phone may need unlock (1–3 s) | Relay attack (Section 24) | Reader sees credential ID only | Audio/haptic confirmation |
| 3. Authenticate | — | — | Server verifies key → **authenticated** as credential C; fetches photo, display name, role | — | Cloned key if chip broken | Photo displayed to guard (minimised) | Photo from server, not card, defeats forgery |
| 4. Authorize | — | — | Policy: status active? gate allowed? time window? → **authorized** | — | Stale revocation list if offline (bounded) | — | Separate message for auth vs authz failure |
| 5. Result | Glances at screen/hears tone | "Green, go" | Guard screen: photo + "Aarav · Student · ENTRY ALLOWED" (screen 5); guard confirms face; student screen/LED green; tone | Guard must actually look at photo | Guard fatigue → skips photo check | Name visible to guard | Photo-first layout; periodic "confirm face" nudges |
| 6. Enter | Walks in | "Done" | Event logged: pseudonymous credential ID, gate, time, decision (no name) | — | Log tampering (mitigated: append-only, hashed) | Movement log exists; retention-limited, self-viewable | Transparency builds trust (PRIV-08) |
| Exception: forgot card | Opens app, taps phone or shows dynamic QR | "Good, I have a backup" | Same flow via phone credential; log records method | Requires enrolment beforehand | Phone compromise | — | No bypass, no interrogation |
| Exception: revoked | Taps; red | "What? Why?" | Guard screen: "Credential REVOKED — direct to Security Office" (screen 8); student screen: "Not accepted — see Security Office" | Student must go to office | — | Guard not told *why* revoked | Clear, dignified next step |

## 17.3 Visitor journey (future)

Host submits visitor request (name, purpose, date/time window, gates) → Admin/host approval → Visitor receives signed QR pass by e-mail/SMS → At gate: scans QR → authenticated as visitor pass V; authorized for gate G, window T → Guard sees "VISITOR · Dr. Fernandes · Host: [name] · Valid until 17:00" → Entry logged → Pass expires automatically → Visitor record deleted after retention window.

---

# 18. User Tasks

Task scenarios used for the prototype walkthrough (Section 35), the heuristic evaluation (Section 36) and, in Phase 2, for task-based usability testing. Each task lists the actor, the precondition, the steps in the future-state system, the success criterion, and the screens involved.

| ID | Task | Actor | Precondition | Steps (future system) | Success criterion | Screens |
|---|---|---|---|---|---|---|
| **T1** | Student enters campus | Student | Active card or enrolled phone | Approach → tap → wait for green → enter | Authenticated, authorized, logged; ≤2 s from tap to result; no guard intervention | 1, 2, 3, 4, 5 |
| **T2** | Student presents expired credential | Student, Guard | Credential past validity | Tap → red "EXPIRED" → guard reads next-step → student directed to ID cell / offered phone credential renewal | Entry denied; guard and student both understand reason and next step; no bypass | 1, 2, 3, 7 |
| **T3** | Student presents revoked credential | Student, Guard | Credential revoked (lost, disciplinary, withdrawn) | Tap → red "REVOKED" → guard directs to Security Office; event flagged | Entry denied; guard not shown reason for revocation; event logged as flagged | 1, 2, 3, 8 |
| **T4** | Student loses credential | Student | Enrolled in app or has portal access | Open app → "Report lost card" → confirm → card revoked immediately → replacement request created; phone credential continues to work | Card unusable within seconds; student retains access via phone; replacement tracked | 18 (student view) |
| **T5** | Guard verifies a student | Guard | Student tapped; result shown | Look at photo → compare face → confirm (implicit: let pass) or tap "Mismatch" | Guard can decide in one glance; mismatch path available | 5, 16 |
| **T6** | Guard handles failed authentication | Guard | Unknown / invalid / suspicious credential | Screen shows "NOT RECOGNISED" or "SUSPICIOUS" with next step → guard follows script: no entry; direct to Security Office; option "Call supervisor" | No bypass; guard knows exactly what to do; event logged | 6, 9, 12 |
| **T7** | Guard handles visitor | Guard, Visitor | Visitor has pass or not | With pass: scan → "VISITOR · valid" → confirm. Without: guard opens "Visitor without approval" → host lookup → host approves from phone → pass issued → scan | Pre-approved visitor: ≤10 s. Unapproved: no entry until host approves; no paper register; visitor's phone number never shown to guard | 13, 14, 15, 16 |
| **T8** | Administrator issues credential | Admin | Student record exists in roster; admin authenticated with MFA | Search roster → verify identity documents per policy → personalise card / send phone enrolment link → set validity → confirm; action logged | Credential bound to correct identity; expiry set; issuance logged with admin ID | 17 |
| **T9** | Administrator revokes credential | Admin | Credential active | Search → select credential → choose reason (lost/stolen/disciplinary/left) → confirm (two-step) → revoked; pushed to gates within seconds; offline list updated | Revoked credential denied at all gates within defined propagation time; action logged | 17, 18 |
| **T10** | Administrator reviews entry logs | Admin (auditor role) | Authorised auditor with logged reason | Open logs → filter by gate/time/decision → view pseudonymous events → to re-identify, enter case reference → identity shown; re-identification itself logged | Routine review sees no names; re-identification requires justification and is auditable | 19, 20 |

Additional tasks used in the prototype but not numbered in the brief: **T11** Guard handles reader failure (screen 10); **T12** Guard handles network outage (screen 11); **T13** Student views own entry records and privacy settings (screen 20); **T14** Admin configures gate authorization policy (screen 20).
