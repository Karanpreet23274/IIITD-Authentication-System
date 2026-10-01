# Phase 1 Poster Content — 7 October 2026

**Poster session focus (course brief):** "compilation of usability studies and design themes for your project".
Suggested layout: A1 portrait, 3 columns × 3 rows. Each block below is one panel. Keep text ≤ 60 words per panel; use the figures listed.

---

## Panel 1 — Title
**Campus Entry Authentication: from a glance at a card to authenticated, authorized, private entry**
CSE 347/652 | DES 306/525 Usable Security and Privacy · IIIT-Delhi · Monsoon 2026
Team: [INSERT NAMES]

## Panel 2 — The problem (with current-workflow sketch, Section 8)
A guard glances at a printed ID. The card proves *possession*, not *identity*. Lost, borrowed, forged, expired and revoked cards look the same. No revocation check. No audit trail. Visitors' phone numbers in a public register. At 8:55 a.m., the check becomes a wave.

## Panel 3 — How we studied it (Section 9)
Three primary methods + secondary research:
- Student questionnaire — 20 items: frequency, forgotten/lost ID, wait, security & privacy perceptions, method preference, accessibility
- Guard interviews — 14 questions: real workflow, suspicious/fake/lost IDs, visitors, peak load, what they need to see and what they should not
- Contextual inquiry — timed observation, U/Q/N/V/R coding, no identifying data
**Status:** [INSERT n students, n guards, n sessions — or "fieldwork in progress; no data fabricated"]

## Panel 4 — What we learned
**[DATA REQUIRED]** Replace this panel with 3–5 real findings and one anonymised quote each. Until then, show the hypotheses H1–H9 and label them "to be validated".
Secondary evidence we can already state: MIFARE Classic and hotel-lock systems covering millions of doors were broken by cloning data from a single card [4, 5, 8, 9]; users and operators bypass slow security rationally [10, 11, 17].

## Panel 5 — Design themes (Section 33)
1. **Authenticate the key, not the card** — challenge–response; never accept a bare UID or static QR
2. **Two questions, two answers** — "Who are you?" and "Are you allowed here, now?" fail differently and say different things
3. **Fail secure, degrade gracefully** — offline-verified ≤4 h → supervised manual mode; never an open gate, never "allow anyway"
4. **Show the guard a face and a status, nothing more** — photo from the server, first name, role, decision
5. **Dignity on denial** — generic message to bystanders, private explanation to the student
6. **Accountability without surveillance** — pseudonymous logs, justified re-identification, 90-day retention

## Panel 6 — QR vs RFID vs NFC (Section 13 table, condensed)
| | Static QR | LF RFID | AES smart card | NFC phone | Dynamic QR |
|---|---|---|---|---|---|
| Cloning | ✕ | ✕ | ✔ | ✔ | ◐ |
| Replay | ✕ | ✕ | ✔ | ✔ | ◐ |
| Speed | ◐ | ✔ | ✔ | ✔ | ◐ |
| Works for everyone | ✔ | ✔ | ✔ | ✕ | ✕ |
**Provisional direction:** AES smart card for all + optional phone credential + signed visitor passes. *Pending Q16/Q17 data.*

## Panel 7 — Threat model (Figure J-9 attack tree)
12 actors · 17 threats · 10 scenarios. Highest priority: theft, cloning, replay, impersonation, revoked reuse, privilege escalation, DB compromise, rogue server, privacy leakage, log tampering, reader compromise, insider abuse.
**Residual, stated plainly:** relay attacks (mitigated only by the human face check), guard fatigue, offline staleness window.

## Panel 8 — Prototype (show S05, S06, S08, S12 wireframes)
20 lo-fi screens · 3 surfaces (gate indicator, guard tablet, admin/student). Every DENY screen ends with a next step. No guard screen has an "Allow" button. Guard sees photo + first name + role only.
**Initial heuristic evaluation (not user testing):** 15 findings, 3 major, all about denial wording → fixed in next iteration.

## Panel 9 — Traceability & next steps (Section 37, Figure J-2)
Finding → need → requirement → threat → feature → screen → test. 20 FR · 20 SEC · 12 PRIV · 14 USE · 14 NFR, each mapped to a screen and a Phase 2 test.
**Phase 2:** complete fieldwork → implement with standard crypto only (Ed25519, AES, TLS 1.3) → attack-scenario tests → guard & student usability tests → executable + user guide 17 Nov.

---

# Figma Prototype Instructions

1. Create a new Figma file "Campus Entry Auth — Lo-fi Phase 1".
2. Import `06_Prototype/screens/S01_…S20_….png` (drag all 20 onto the canvas). Figma creates one frame per image.
3. Resize frames: phone/user-indicator screens (S01–S04, S14, S15, S18) to 480×900; tablet/web screens (S05–S13, S16, S17, S19, S20) to 1440×900.
4. Arrange in rows by surface: Row 1 user indicator (S01–S04), Row 2 guard tablet results (S05–S09), Row 3 guard tablet states (S10–S12, S16), Row 4 visitor (S13–S15), Row 5 admin/student (S17–S20).
5. Switch to **Prototype** tab. Add hotspots per the flow map (report Section 35.3):
   - S01 → S02 → S03 (on tap / after delay 800 ms) → S04 and S05 (open S05 as overlay on a second "guard" flow, or link S04 → S05 for a single walkthrough)
   - S05 [Mismatch] → S09; S06/S07/S08/S09 [Done] → S16
   - S16 [Visitor without approval] → S13 (guard variant) → S14 → S15 → S02
   - S16 "reader fault" hotspot → S10; "offline" hotspot → S11; S11 "limit reached" → S12
   - S17 [Revoke] → confirm overlay (same frame) → S17; S18 [Report and disable] → S18 result state (duplicate frame)
   - S19 [Re-identify] → overlay; S20 policy [Apply] → confirm overlay
6. Set S01 as the flow starting point; add a second flow starting at S16 ("Guard") and a third at S17 ("Admin").
7. Use "Smart animate / instant" transitions; dialogs as "Open overlay, centered, close on click outside".
8. Share with "Anyone with link can view" for the poster QR code; keep editing restricted to the team.

---

# User Study Evaluation Report (Phase 1)

**Status: instruments complete; fieldwork results [DATA REQUIRED].**

This document is the standalone deliverable required by the course brief ("User Study Evaluation reports"). It consists of report Sections 9–11 (methodology, primary research, findings template) and Appendices A–E. It intentionally contains **no fabricated participants, counts, percentages, averages, quotes or observations**. When the studies have been run, replace every placeholder using the analysis framework in Section 9.6 and the sheets in `Data_Collection_Template.xlsx`, then regenerate this PDF.

Contents:
1. Research methodology, questions, sampling, ethics, procedure, analysis framework (Section 9)
2. Primary research instruments summary and participant information table (Section 10)
3. Findings template: quantitative, Likert, ranking, observation timings, qualitative themes, affinity, pain points vs hypotheses H1–H9, security/privacy/usability/accessibility concerns, design opportunities (Section 11)
4. Appendix A — Student questionnaire
5. Appendix B — Security guard interview protocol
6. Appendix C — Consent statement
7. Appendix D — Contextual inquiry protocol
8. Appendix E — Data collection template (XLSX, separate file)
