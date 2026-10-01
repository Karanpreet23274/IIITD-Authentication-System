# Campus Entry Authentication System — Phase 1 Package

**Course:** CSE 347/652 | DES 306/525 Usable Security and Privacy, IIIT-Delhi, Monsoon 2026 (Dr. Arun Balaji Buduru)
**Phase 1:** "User Studies to evolve Requirements, Design and Workflows" — due 4 October 2026, 11:59 PM
**Team:** [INSERT TEAM MEMBER NAMES AND ROLL NUMBERS]
**Contact:** [INSERT TEAM E-MAIL]

---

## Problem statement

Campus entry is controlled by a guard glancing at a printed photo ID. The card proves possession, not identity: lost, stolen, borrowed, forged, expired and revoked cards all look valid, there is no revocation check at the gate, no audit trail, and visitors are recorded in a paper register that exposes their phone numbers. Peak-hour queues pressure guards to wave people through.

## Objective

Design a campus entry authentication system that provides strong **authentication** ("who is this credential bound to?") and **authorization** ("is this person allowed at this gate, now?") while protecting privacy, resisting common attacks, failing securely, and remaining fast and easy for students and security staff.

## Users studied

| Group | Method | Status |
|---|---|---|
| Students | Online questionnaire (20 questions, Appendix A) | Instrument ready; **data not yet collected** |
| Security guards | Semi-structured interviews (14 questions, Appendix B) | Protocol ready; **data not yet collected** |
| Security office / ID cell | Interview (7 additional questions) | Protocol ready; access **[TBD]** |
| Gate environment | Contextual inquiry (Appendix D) | Protocol ready; **sessions not yet conducted** |
| Visitors | Synthesised persona from secondary research | — |

## Proposed system (provisional direction D1)

A **hybrid credential**: an ISO/IEC 14443 smart card with AES challenge–response for every member (universal, fast, accessible), an **optional phone credential** (Android NFC or dynamic signed QR) for convenience and as the forgotten-card fallback, and **time- and gate-bound signed QR passes** for visitors. On every tap the guard sees the **photo on file for the authenticated credential**, a first name, a role and a decision, and nothing else. Static QR and 125 kHz RFID are rejected as sole credentials because they are copyable.

## Authentication technology options compared

QR (static / dynamic signed), RFID (LF 125 kHz / HF ISO 14443 AES), NFC phone credential — 16 criteria, Section 13 of the report. No option is "best"; trade-offs are stated and the provisional direction is justified against the threat model and requirements, pending primary data (Q16, Q17).

## Security focus

Threat model: 12 actors, 9 assets, 17 threats (STRIDE), 10 attack scenarios, trust boundaries B1–B7. 20 security requirements covering credential cloning, replay, impersonation, theft, expiry, revocation, lifecycle, secure communication, device/reader compromise, database compromise, insider misuse, least privilege, fail-secure behaviour, auditability, and open design. **No custom cryptography; no "unhackable" claims; residual risks stated** (relay, guard fatigue, offline staleness, future chip break, no exit control).

## Privacy focus

12 privacy requirements (DPDP Act 2023, ISO/IEC 29100, Privacy by Design): data minimisation, purpose limitation, role-based visibility table (student / guard / supervisor / issuer / auditor / policy admin), pseudonymous hash-chained logs, justified and logged re-identification, retention limits (90 d / 30 d / 1 y), transparency and self-service access, no public visitor register.

## Usability focus

14 usability requirements: one-tap entry ≤1.5 s, guard decides in one glance, authentication failure visually and verbally distinct from authorization failure, every denial ends with a next step, multimodal feedback, bilingual, WCAG 2.2 contrast, reachable reader height, no insecure convenience bypasses.

## Phase 1 deliverables (this package)

```
Campus_Entry_Authentication_Phase1/
├── 01_Final_Report/      Full report (PDF + DOCX), 42 sections + Appendices A–J
├── 02_User_Studies/      Questionnaire, interview protocol, contextual inquiry, consent, data template (XLSX), evaluation report
├── 03_Requirements/      FR / SEC / PRIV / USE PDFs + traceability matrix (XLSX)
├── 04_Threat_Model/      Threat model, attack scenarios (PDF) + risk register (XLSX)
├── 05_Workflows/         13 diagrams (PNG + SVG)
├── 06_Prototype/         Prototype specification, 20 wireframe screens (PDF + PNG), Figma import instructions
├── 07_Research/          Literature review, technology comparison, existing-system comparison
├── 08_Presentation/      Poster content for 7 October 2026
├── source/               Editable Markdown sections and generator scripts
├── README.md
└── SUBMISSION_CHECKLIST.md
```

## Prototype

20 lo-fi greyscale wireframes across three surfaces (gate user indicator, guard tablet, admin/student web+app): welcome, scan, verifying, success (user), success (guard), not recognised, expired, revoked, suspicious, reader failure, network failure, manual verification, visitor registration, visitor approval, visitor pass, guard dashboard, admin credential management, lost-ID revoke, entry logs, privacy/policy. Each screen specifies purpose, elements, information shown and deliberately hidden, and security/privacy/usability considerations. Initial heuristic evaluation (not user testing) found 15 issues (3 major, all about denial wording) with planned fixes.

## Research methodology

Mixed methods: quantitative (Likert, frequencies, rankings, observation timings) + qualitative (open coding, affinity themes), triangulated with secondary research (43 references: NIST, ISO/IEC, IETF, ACM, IEEE, USENIX, Springer, DPDP Act, documented disclosures). Evidence labels used throughout: **[PRIMARY]**, **[SECONDARY]**, **[ASSUMPTION]**, **[DATA REQUIRED]**.

## What is complete

- All instruments, protocols, consent, data-collection template and analysis framework
- Secondary research, technology and existing-system comparison, research gap
- Personas (synthesised), journeys, 14 task scenarios
- Full requirements catalogue (20 FR, 20 SEC, 12 PRIV, 14 USE, 14 NFR)
- Threat model, attack scenarios, risk register
- Credential lifecycle, security and system architecture, DFD, privacy DFD, 12 workflows, failure/edge-case handling
- Design principles, decision matrix, 20-screen prototype, heuristic evaluation, traceability, trade-offs, limitations, Phase 2 plan

## What requires actual primary data

Section 11 (all findings), Section 10.4 (participant numbers), the "User evidence" columns of Sections 19–23 and 34, Section 11.4 hypothesis verdicts, persona revisions (Section 16). Every such slot is marked **[DATA REQUIRED]** / **[INSERT …]**. **No participant counts, percentages, averages, quotes or observations have been invented.** Run the instruments, enter results in `02_User_Studies/Data_Collection_Template.xlsx`, and replace the placeholders before the final submission.

## Phase 2 plan (summary)

Complete fieldwork → apply heuristic fixes → implement: simulated AES card (Android HCE Ed25519 challenge–response) + dynamic QR, reader on tablet/Pi with offline verification, auth/policy/decision services with signed decisions, hash-chained audit log, guard tablet, admin console with MFA/RBAC, student app, visitor passes → security tests from the attack scenarios → usability tests (guards and students, SUS, comprehension) → executable + user guide (17 Nov 2026) → peer testing → poster demo (26 Nov) → recorded presentation (29 Nov).

## Regenerating the package

```
cd source && python3 scripts/build.py      # requires python3 (markdown, PIL, xlsxwriter, pypdf), graphviz (dot), LibreOffice (soffice)
```
