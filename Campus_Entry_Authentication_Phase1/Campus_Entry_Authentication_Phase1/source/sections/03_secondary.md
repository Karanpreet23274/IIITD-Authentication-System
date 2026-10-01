# 12. Secondary Research

All statements in this section are **[SECONDARY]** and cite the numbered references in Section 42. Where the team draws an inference from a source rather than repeating it, the inference is marked "(inference)".

## 12.1 Authentication and Authorization

**Definitions.** NIST SP 800-63-4 [1] defines *authentication* as the process of verifying that a claimant controls an authenticator bound to a subscriber's identity, and treats *authorization* (what the authenticated subscriber may do) as a separate function performed by the relying party after authentication. The same separation appears in classic protection-system design: Saltzer and Schroeder [14] describe authentication as establishing the principal and access control as deciding, per request, whether that principal may perform an action.

**Authenticator types and assurance.** SP 800-63B-4 [1] classifies authenticators by factor (something you know, have, are) and by whether they are *single-factor* or *multi-factor*, and defines Authentication Assurance Levels. Relevant to this project: a possession-based authenticator (a card or phone credential) provides single-factor authentication unless it is protected by a second factor (a PIN or biometric unlocking the phone). A "hardware cryptographic authenticator" that performs challenge–response is rated more highly than an authenticator that merely emits a static secret, because a static secret can be captured and replayed [1].

**Facility access specifically.** NIST SP 800-116 Rev 1 [2] applies these ideas to physical access control for the US federal PIV card. Its key contributions for our design: (a) it distinguishes reading a card identifier (weak, cloneable) from cryptographic challenge–response with the card (strong); (b) it recommends the authentication mechanism be chosen per area according to risk, with higher-risk areas requiring stronger mechanisms; and (c) it insists the physical access control system check the credential's current revocation status, not just its expiry date. Implication (inference): a campus perimeter is a moderate-risk area where a cryptographic possession factor plus a human photo check is proportionate; interior high-risk areas would need more.

**Comparative evaluation of schemes.** Bonneau et al. [33] evaluate authentication schemes on 25 usability, deployability and security properties and show that no scheme dominates; every choice trades some property for another. We adopt the same posture in Section 13: the technology comparison reports trade-offs, not a winner.

## 12.2 QR-code authentication

QR codes are a two-dimensional optical symbology standardised in ISO/IEC 18004 [25]. They encode data; they do not perform computation. Security therefore depends entirely on the data encoded and how the reader validates it.

Krombholz et al. [21] survey QR-code attacks and note that (a) a QR code is trivially copied by photographing it, (b) users cannot read the content and therefore cannot detect substitution, and (c) attackers can overlay malicious codes on legitimate ones. For an access credential this means a *static* QR code (one that never changes) is equivalent to a printed password: anyone who photographs it can replay it indefinitely.

The standard mitigation (inference from [1], [37], [40]) is to make the code *dynamic* and *signed*: the phone generates a fresh code every 30–60 seconds containing a credential identifier, a timestamp or counter, and a digital signature or MAC computed with a key held in the phone's secure storage. The reader verifies the signature, checks the timestamp window, and rejects any code it has already seen. This converts QR from "static secret" to "short-lived signed assertion", which resists replay after the window closes but still cannot resist a *real-time relay* (an attacker who screenshots and forwards the code within the window). RFC 6238 TOTP [37] is the standard model for time-based codes; RFC 7519 JWT [40] and RFC 8032 EdDSA [38] provide standard formats and signature schemes.

Usability properties (inference from [21], [12]): QR requires the user to unlock a phone, open an app, and orient the screen to a camera; this is slower and more failure-prone (glare, cracked screens, dead battery) than a tap, but it requires no special phone hardware and works on any smartphone with a screen.

## 12.3 RFID authentication

"RFID" covers several incompatible technologies. The distinction matters more than the label.

**Low-frequency (125 kHz) proximity cards** (e.g., HID Prox, EM4100 family) transmit a fixed identifier when powered by the reader field. They have no cryptography. Cloning requires only a low-cost reader/writer; the identifier is the credential. Anderson [31] and Verdult [32] treat this class as providing identification, not authentication.

**High-frequency (13.56 MHz, ISO/IEC 14443) cards** [23] range from memory cards to smart cards. The most-deployed memory card, MIFARE Classic, uses the proprietary CRYPTO1 cipher, which was reverse-engineered and broken in 2008 by two independent groups [4, 5]; keys can be recovered and cards cloned in seconds with commodity hardware. HID's iCLASS legacy product was similarly broken in 2012 [6]. Even a card with a sound cipher can leak keys through side channels if the hardware is not protected: Oswald and Paar recovered the 3DES key from MIFARE DESFire MF3ICD40 by power analysis [7]. Modern products (MIFARE DESFire EV2/EV3, MIFARE Plus EV2) implement AES-128 mutual authentication with standard primitives and are certified under Common Criteria [41]; we cite the data sheets only for the primitives used, not as proof of security.

**Lessons for design** (inference): the card must perform a cryptographic challenge–response with a per-card key; the reader must never accept a bare UID; and the design must assume some deployed cards will eventually be broken, so revocation and key rotation must be operationally cheap (Section 26).

**Relay attacks.** Any contactless protocol that does not measure distance is vulnerable to relay: the attacker holds one device near the victim's card and another near the reader and forwards messages. Hancke and Kuhn [18] proposed distance-bounding protocols as a countermeasure; Francillon et al. [19] demonstrated practical relays against car keyless-entry systems; Francis et al. [20] demonstrated relays using two NFC phones. Commercial access-control cards do not implement distance bounding. The practical mitigation in a staffed gate is the human: the guard sees whether the person tapped a card. Relay is therefore a *residual* risk, addressed by the photo check and by anomaly detection rather than by cryptography (Section 24).

## 12.4 NFC authentication

NFC (ISO/IEC 18092 [24]) is a superset of ISO/IEC 14443 [23] that lets a phone act as a reader, as a card (card emulation), or peer-to-peer. For access control the relevant mode is *card emulation*: the phone presents a credential to a reader exactly as a smart card would.

The security advantage of a phone over a card (inference from [1]) is that the phone can require a second factor before releasing the credential: the phone must be unlocked (PIN or biometric), so a stolen phone is not a usable credential until the thief also has the unlock secret. Keys can be stored in hardware-backed storage (Secure Element or Trusted Execution Environment). The disadvantages are dependence on battery, OS, and platform policy; not all phones expose card emulation to third-party apps; and a subset of students will not have a compatible phone (A3, **[DATA REQUIRED]**).

Existing deployments: Apple states that since 2018 students at several US universities can hold their student ID in Apple Wallet and use it for building access, with campus card systems provided by partners [35]. We cite this only as evidence that phone-based NFC campus credentials are a deployed pattern; Apple's press releases make no verifiable security claims and we make none on their behalf.

NFC shares the relay-attack exposure of any contactless protocol [20].

## 12.5 Existing campus systems

Reliable public documentation of *specific* Indian university gate systems is sparse; we do not claim any Indian institution uses any particular technology. What can be said from published sources:

- **Card-based campus systems** in North America and Europe typically combine a photo ID with a 13.56 MHz contactless chip used for doors, libraries, meals and printing; the same card serves many purposes (inference from the multi-application design of ISO/IEC 14443 products [41] and the Apple/Blackboard announcements [35]).
- **Mobile credentials** via Apple Wallet and Google Wallet are offered at named US universities [35].
- The **hotel-lock breaches** below are the best-documented evidence of what goes wrong in large contactless-credential deployments and are directly transferable to campus cards using the same chip families.

## 12.6 Hotel and physical access-control systems

Three widely reported cases:

| Case | Year | Technology | Root cause | Lesson |
|---|---|---|---|---|
| Onity HT locks [36] | 2012 | Battery-powered lock with DC port | Programming port exposed the lock's memory and key without authentication; a hand-built device opened the lock | Physical ports and debug interfaces on readers are attack surfaces; readers must be treated as potentially compromised (SEC-18) |
| Vision by VingCard (Assa Abloy) [8] | 2018 | RFID (MIFARE Classic-based) keycards | Predictable key-derivation let researchers compute a property-wide master key from any single discarded card, even an expired one | Expired credentials still leak secrets; the credential system must not derive site keys from data readable on cards; retirement must include key rotation (Section 26) |
| Unsaflok, dormakaba Saflok [9] | 2024 | MIFARE Classic keycards, System 6000 | Weak key derivation and card encryption; one read card allowed forging a pair of cards that open any door on the property | The same MIFARE Classic weakness known since 2008 [4, 5] remained in millions of doors 16 years later; migration is slow, so revocation and monitoring must compensate |

Common to all three: the systems *authenticated the card* (does it hold the right bytes?) rather than *authenticating the holder*, and none had a revocation check that could stop a forged card. This is the failure pattern our authentication/authorization separation is meant to prevent.

## 12.7 Usable security and human factors

- **Users are not the enemy.** Adams and Sasse [10] showed that users bypass security mechanisms when those mechanisms conflict with their tasks and when they do not understand the rationale; blaming users is unproductive. For our gate this predicts that guards will wave people through when the check is slow, and students will share credentials when replacement is slow.
- **Rational rejection.** Herley [11] argues that users reject security advice when its cost to them exceeds the benefit they receive; the cost of security is borne by many users constantly while the benefit accrues to the institution rarely. Design consequence: the authenticated path must cost the student *less* effort than today, not more.
- **Compliance budget.** Beautement, Sasse and Wonham [17] show that people have a finite budget of effort for security compliance; spending it on low-value checks leaves none for high-value ones. Design consequence: add friction (a second factor, a manual check) only when risk indicators justify it.
- **Why Johnny can't encrypt.** Whitten and Tygar [12] demonstrated that security software fails when its interface does not match users' mental models and when errors are silent or cryptic. Design consequence: the guard's screen must show the *decision and the reason*, in plain language, not a status code.
- **Secure interaction design.** Yee [13] proposes principles including *path of least resistance* (the easiest path should be the secure one), *visibility* (the user should see the security-relevant state), *revocability*, *expected ability*, and *clarity*. These are adopted as design principles in Section 33.
- **Human in the loop.** Cranor [16] models the human as a component that receives a communication, attends to it, comprehends it, and acts; failures occur at each stage. For the gate, the guard is the human in the loop; the screen is the communication; comprehension must be near-instant.
- **Heuristic evaluation.** Nielsen's ten heuristics [15] remain the standard checklist for expert evaluation of interfaces and are used in Section 36 alongside the usable-security principles above.
- **Historical overview.** Garfinkel and Lipford [34] and Sasse et al. [42] synthesise these themes and argue that security and usability are complementary when designed together, not opposing goals to be traded.

## 12.8 Privacy and data minimisation

- **Legal frame.** India's Digital Personal Data Protection Act, 2023 [22] requires that personal data be processed only for a lawful purpose, with consent or under specified legitimate uses; obliges data fiduciaries to implement reasonable safeguards, to erase personal data when the purpose is served, and to give data principals the right to access a summary of their personal data being processed. An institution operating an entry-log system would be a data fiduciary; students and visitors would be data principals.
- **Privacy framework.** ISO/IEC 29100 [26] enumerates privacy principles including consent and choice, purpose legitimacy and specification, collection limitation, data minimisation, use/retention/disclosure limitation, accuracy, openness/transparency, individual participation and access, and accountability.
- **Privacy by Design.** Cavoukian [27] frames privacy as proactive, default, embedded in design, full-functionality (positive-sum), end-to-end secure, visible/transparent, and user-centric. The "positive-sum" claim is directly relevant: the guard's screen can show *less* personal data and still support a *better* decision than today's card.
- **Design consequences** (inference): the gate decision needs a photo, a display name, a role and a decision; it does not need roll number, phone, address or hostel. Logs need a pseudonymous credential identifier, gate, time and decision; re-identification should require a separate, audited administrative action. Retention should be fixed and short.

## 12.9 Security threats and engineering principles

- **Design principles.** Saltzer and Schroeder's principles [14] (economy of mechanism, fail-safe defaults, complete mediation, open design, separation of privilege, least privilege, least common mechanism, psychological acceptability) are adopted as security design principles in Section 33. "Open design" is the source of requirement SEC-20 (no security through obscurity). "Complete mediation" is the source of checking revocation on every access, not just at issuance.
- **Threat modelling method.** Shostack [30] describes STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) applied per data-flow-diagram element and per trust boundary. Section 24 applies STRIDE to the DFD in Section 29.
- **Application-layer controls.** OWASP ASVS [29] provides verifiable requirements for authentication, session management, access control, cryptography-at-rest, and logging that Phase 2 will use as an implementation checklist; the OWASP Logging Cheat Sheet [29] specifies what must and must not be logged (never secrets, tokens or full credentials).
- **Key management.** NIST SP 800-57 [3] covers key generation, storage, rotation, and destruction; applied to per-card keys, signing keys, and the offline revocation-list signing key in Section 27.
- **Transport security.** TLS 1.3 [39] with mutual authentication (client certificates on readers) is the standard for reader-to-server communication.

---

# 13. Technology Comparison: QR vs RFID vs NFC

All entries are **[SECONDARY]** or **(inference)**. "RFID" is split into the two classes that matter, because lumping them together produces misleading conclusions. Ratings: ● strong / favourable, ◐ moderate / conditional, ○ weak / unfavourable.

| Criterion | Static QR (printed or fixed image) | Dynamic signed QR (app-generated) | LF RFID 125 kHz (fixed UID) | HF RFID / smart card, ISO 14443 with AES challenge–response | NFC phone credential (card emulation) |
|---|---|---|---|---|---|
| Authentication strength | ○ Static secret; equivalent to a printed password [21] | ◐ Signed, time-bound assertion; single-factor unless app requires unlock [37, 40] | ○ Identification only; UID is the credential [31, 32] | ● Cryptographic possession proof with per-card key [2, 41] | ● Cryptographic possession proof; phone unlock adds second factor [1] |
| Credential cloning | ○ Photograph it | ◐ Key is in phone; clone requires extracting key from device | ○ Seconds with cheap writer [32] | ◐ Depends on chip: Classic/iCLASS broken [4–6]; DESFire EV3/Plus EV2 no public break [41]; side channels possible [7] | ◐ Hardware-backed keys resist extraction; malware on rooted device is a risk |
| Replay risk | ○ Indefinite replay | ◐ Replay limited to validity window (30–60 s); real-time relay still possible | ○ Indefinite replay | ◐ Challenge–response defeats replay; relay possible [18–20] | ◐ Same as smart card; relay possible [20] |
| Physical security of credential | ○ Visible to bystanders on card/screen | ◐ On screen briefly; shoulder-surf within window | ○ Card readable at distance up to ~10 cm, sometimes more with large antennas | ◐ Card readable at ~4–10 cm; skimming yields nothing useful without key | ● Credential inactive until phone unlocked |
| Cost (per credential) | ● Near zero (print) | ● Near zero if student owns phone | ● Low | ◐ Moderate (secure smart card blank + personalisation) | ● Near zero if phone owned; ○ excludes students without compatible phone |
| Cost (reader) | ● Camera on tablet/phone | ● Camera | ● Low | ◐ Moderate; SAM or secure key storage in reader raises cost | ◐ Same reader as smart card |
| Speed at gate | ◐ Unlock, open app, aim; glare-sensitive | ◐ Same as static | ● Tap, <1 s | ● Tap, <1 s including crypto | ● Tap; may need unlock first (~1–3 s) |
| Usability | ◐ Familiar; requires two hands and attention | ◐ Familiar; requires attention | ● No attention required | ● No attention required; card must be retrieved (H1) | ● Phone usually already in hand; ○ battery dependence |
| Accessibility | ○ Requires vision to aim; fine motor control | ○ Same | ● Works through wallet/bag; no vision needed | ● Same; tactile/audio reader feedback possible | ◐ Phone accessibility features apply; still requires holding device |
| Privacy | ○ Static code is a persistent identifier readable by anyone | ◐ Content rotates; identifier can be pseudonymous | ○ Fixed UID is trackable by any reader in range | ◐ Random UID mode available on modern chips [41]; protocol can avoid leaking identity before authentication | ◐ Platform-dependent UID randomisation; app can enforce pseudonymity |
| Offline capability | ● Reader can verify locally if it has a list | ● Signature verification is fully offline; revocation list needed | ● Local list | ● Local key + signed revocation list | ● Same |
| Reliability | ◐ Camera, lighting, screen condition | ◐ Same plus app and battery | ● Very reliable | ● Very reliable | ◐ Phone OS updates, battery, app state |
| Scalability | ● | ● | ● | ● | ● |
| Ease of implementation (Phase 2) | ● Trivial | ● Standard libraries (Ed25519, TOTP) | ● Trivial | ◐ Needs card SDK, key personalisation, SAM handling | ○ Platform card-emulation constraints; Android HCE feasible, iOS restricted |
| Security limitations | Copy = compromise | Relay; phone malware; time sync | Copy = compromise | Relay; chip-family break; key management | Relay; device compromise; platform lock-in |
| User acceptance | **[DATA REQUIRED]** Q16 | **[DATA REQUIRED]** Q16 | **[DATA REQUIRED]** Q16 | **[DATA REQUIRED]** Q16 | **[DATA REQUIRED]** Q16, Q17 |

## 13.1 Analysis

Two of the five options fail the security requirements outright and are excluded as a *sole* credential: **static QR** and **LF 125 kHz RFID** both expose a static secret that is the credential, so a single capture equals permanent compromise. This is not a matter of degree; it is the same failure that the hotel-lock cases [8, 9] and MIFARE Classic [4, 5] exhibit.

The remaining three are all viable and have complementary weaknesses:

- **AES smart card**: strongest against cloning and replay, most reliable, most accessible, fastest, and works for every student regardless of phone. Weaknesses: card must be carried and retrieved (the very friction H1 hypothesises), it is single-factor, and a lost card is a usable credential until revoked.
- **NFC phone credential**: adds a second factor (phone unlock), students already carry phones, and lost-device risk is lower. Weaknesses: excludes students without a compatible phone (A3), depends on battery and OS, and iOS card emulation is not generally available to third-party apps, which constrains Phase 2.
- **Dynamic signed QR**: works on any smartphone including those without NFC, is cheap to implement, and is fully verifiable offline. Weaknesses: slower and more error-prone at the gate, replayable within its window, and least accessible.

## 13.2 Provisional direction

**Hybrid, with the smart card as the universal baseline.**

1. **Primary credential**: an ISO/IEC 14443 smart card with AES challenge–response (DESFire EV3 / Plus EV2 class [41]) issued to every student. This guarantees universality (no phone required), speed and accessibility, and meets SEC-01/04/14 by design.
2. **Optional phone credential**: students who opt in may enrol a phone credential that is *either* NFC card emulation (where the platform allows) *or* a dynamic signed QR generated by the app. Both are bound to the same identity and subject to the same authorization and revocation. The phone path exists to reduce H1 friction and to give a fallback when the card is forgotten (Section 32: forgotten-ID workflow uses the phone credential, not a bypass).
3. **Visitor credential**: a time-bound, single-purpose signed QR code issued on host approval, displayed on the visitor's phone or printed at the gate. Visitors do not receive smart cards.
4. **Human check retained**: on every authenticated tap the guard's screen shows the photo on file for the *authenticated* credential; the guard confirms the face. This is the mitigation for relay and for borrowed credentials, which cryptography cannot address (Section 24).

**Why not phone-only?** Because A3 is unverified and because excluding students without a compatible phone violates the accessibility objective. **Why not card-only?** Because it does not address the forgotten-card case without an insecure bypass, and because it is single-factor. **Why not QR as primary?** Because it is the slowest and least accessible at the gate and is replayable within its window.

**This direction is provisional.** It will be revisited when Q16 (preference), Q17 (phone capability), Q18 (accessibility) and observation timings are available. The decision is recorded as D1 in Section 34 with the evidence column marked **[DATA REQUIRED]**.

---

# 14. Existing System Comparison

For each system class, the questions required by the project brief are answered from cited sources. Where a property is not publicly documented, the cell says "not documented" rather than guessing.

| Property | Printed photo ID (current campus) | MIFARE Classic campus/transit card [4, 5] | Hotel keycard (VingCard Vision / Saflok) [8, 9] | US university mobile ID in Apple Wallet [35] | PIV card in federal facility access [2] |
|---|---|---|---|---|---|
| Technology | Print + laminate | 13.56 MHz, CRYPTO1 | 13.56 MHz MIFARE Classic | NFC card emulation, Secure Element | ISO 14443 smart card, PKI certificates |
| What is authenticated | Card appearance vs guard's expectation; face vs printed photo | Card sector keys (broken) | Card data / derived key (broken) | Device-held credential; phone unlock | Card private key via challenge–response; optional PIN, biometric |
| What is authorized | Implicit: any current-looking card | Whatever the reader is configured for; typically UID/sector data mapped to permissions | Room + validity window encoded on card | Doors/services configured by the campus card system | Area-specific rules per SP 800-116; revocation checked |
| Information stored | On card face: photo, name, roll no., programme, validity | UID + sector data; often a student number | Room number, dates, sometimes guest data on card | Identity token; personal data on campus server; not documented in detail | Certificates, CHUID, photo, fingerprints (on card, PIN-protected) |
| What the user does | Show card | Tap | Tap / insert | Hold phone near reader (Express Mode: no unlock) | Insert or tap; enter PIN for higher assurance |
| What security staff sees | Card and face | Usually nothing; door opens or not | Nothing; lock opens | Not documented; typically door opens | Depends on PACS; may show photo |
| Issuance | ID cell at admission | Card office encodes | Front desk encodes at check-in | Student enrols via campus app after login | Identity proofing per SP 800-63A; card personalisation |
| Revocation | Replacement issued; old card not blocked | Depends on backend; Classic UID can be blocklisted but forged cards may spoof | New card overrides old at lock (sequence number); forged cards bypass | Remote revoke via wallet and campus system | Certificate revocation lists / status checks |
| Security limitations | Forgery, borrowing, no revocation, no audit | Full key recovery and cloning [4, 5] | Master key derivation from one card [8]; forged card pair opens property [9] | Relay; device compromise; not independently documented | Relay; PIN shoulder-surfing; complexity |
| Privacy considerations | Roll number and programme visible to anyone | Fixed UID trackable | Guest data on card in some deployments | Platform (Apple) sees usage metadata? not documented | Card contains biometrics; PIN-protected |
| Usability considerations | Fast glance; must retrieve card | Fast tap | Fast tap | No unlock needed with Express Mode; requires compatible device | PIN entry slows; card must be carried |

**Take-aways for our design**

1. Every documented failure involved authenticating *data on the card* rather than proving *possession of a key* the card never reveals. → SEC-01, SEC-04, D1.
2. None of the broken systems checked revocation status at the point of entry in a way a forged card could not bypass. → SEC-02, FR-03, offline signed revocation list (Section 27).
3. Successful modern deployments (PIV, mobile ID) pair a cryptographic credential with a policy engine and revocation, and, where risk warrants, a human or second factor. → Architecture in Section 28.
4. Showing the guard the photo *from the server for the authenticated credential*, rather than the photo *printed on the card*, breaks the forgery path: an attacker cannot change the server's photo by altering the card. → PRIV-03, screen 5.

---

# 15. Research Gap

The published literature and deployed systems reviewed above cover each concern in isolation:

- Cryptographic strength of contactless credentials is well studied [4–7, 41].
- Relay attacks are well characterised, with countermeasures that are not commercially deployed [18–20].
- Facility-access guidance exists for high-assurance government settings with dedicated budgets and mandatory PIV cards [2].
- Usable-security principles are well established but are mostly studied for *end-user* software such as e-mail, passwords and browsers [10–13, 17, 33].
- Privacy frameworks and law define principles but not how to apply them to a movement log at a gate [22, 26, 27].

What the review did **not** find is published design work that treats the following *together*, as one problem:

1. **Two humans in the loop with different needs.** The credential holder (student) and the operator (guard) both have usability constraints; the guard's interface is a security control in its own right, not just a display. Most usable-security work studies one user.
2. **Authorization as a first-class, separately-communicated decision.** Deployed systems collapse "card valid" and "entry allowed" into one signal (door opens). Our review found no design guidance on how to *communicate* the distinction to a non-technical operator so that a revoked student and a forged card produce different, actionable responses.
3. **Fail-secure degradation under infrastructure failure in a low-resource setting.** SP 800-116 assumes government-grade infrastructure. The question of how a campus gate should behave during a network or power outage without either opening the gate or stranding hundreds of students is not addressed in the sources reviewed.
4. **Privacy-preserving audit of a movement log.** The trade-off between an audit trail useful for incident response and a dataset that reveals every student's daily pattern is noted in the privacy literature in general terms but not resolved for access control specifically.
5. **Campus-specific constraints**: mixed device ownership, contract security staff with varying training, high peak loads at predictable times, and a population that is technically sophisticated and privacy-aware.

**Gap statement.** Existing access-control research and practice secure the credential but treat the operator, the authorization decision, failure behaviour and privacy as afterthoughts. This project studies the *combined* design problem of authentication, authorization, guard usability, fail-secure degradation, and privacy-preserving audit in a campus setting, and derives requirements for it from primary research with both students and security staff. The contribution of Phase 1 is a traceable requirements and design baseline for that combined problem; the contribution of Phase 2 will be an implementation that can be tested against it.

This gap statement is supported by the absence of matching results in the sources reviewed; it is not a claim that no such work exists anywhere. A broader systematic search is listed as a limitation in Section 39.
