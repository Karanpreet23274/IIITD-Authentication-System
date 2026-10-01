# Submission Checklist — Phase 1

Legend: ✔ complete in this package · ◐ complete as instrument/template, **needs real data** · ☐ team action before submission

## Content

- [x] Problem statement (Section 2)
- [x] Project objectives (Section 4)
- [x] User groups (Section 6)
- [x] Current workflow (Sections 7–8)
- [x] Student questionnaire (Appendix A, 02_User_Studies/Student_Questionnaire.pdf)
- [x] Security staff interview protocol (Appendix B)
- [x] Contextual inquiry protocol (Appendix D)
- [x] Consent form (Appendix C)
- [ ] ◐ **Primary research evidence** — Section 11 is a template; run the studies and fill `[DATA REQUIRED]` slots
- [ ] ◐ **Quantitative analysis** — formulas ready in Data_Collection_Template.xlsx; needs responses
- [ ] ◐ **Qualitative analysis** — coding/affinity sheets ready; needs interview notes
- [x] Secondary research (Section 12)
- [x] Literature review (Section 12, 07_Research/Literature_Review.pdf)
- [x] Existing system comparison (Section 14)
- [x] QR / RFID / NFC comparison (Section 13)
- [x] Research gap (Section 15)
- [x] Personas — synthesised, labelled as such (Section 16); ☐ revise after data
- [x] User journeys (Section 17)
- [x] User tasks T1–T14 (Section 18)
- [x] Functional requirements FR-01..20 (Section 19)
- [x] Security requirements SEC-01..20 (Section 20)
- [x] Privacy requirements PRIV-01..12 + visibility table (Section 21)
- [x] Usability requirements USE-01..14 (Section 22)
- [x] Non-functional requirements NFR-01..14 (Section 23)
- [x] Threat model: actors, assets, 17 threats, boundaries (Section 24)
- [x] Attack scenarios 1–10 (Section 25)
- [x] Credential lifecycle (Section 26, Figure J-4)
- [x] Failure handling and edge cases, no insecure bypasses (Section 32)
- [x] Security architecture (Section 27)
- [x] System architecture (Section 28, Figure J-13)
- [x] Data flow diagram (Section 29, Figure J-10)
- [x] Privacy data flow (Section 30, Figure J-11)
- [x] Workflows (Section 31, Figures J-1..J-12)
- [x] Requirement traceability (Section 37 + Requirements_Traceability_Matrix.xlsx)
- [x] Design decision matrix D1–D10 (Section 34); ☐ fill "User evidence" after data
- [x] Lo-fi prototype, 20 screens (Section 35, 06_Prototype/)
- [x] Heuristic evaluation — labelled "initial heuristic evaluation", not user testing (Section 36)
- [x] Security–usability–privacy trade-offs TO-1..12 (Section 38)
- [x] Limitations (Section 39)
- [x] Phase 2 plan (Section 40)
- [x] References, 43 numbered (Section 42)

## Files

- [x] Final PDF report (01_Final_Report/Campus_Entry_Authentication_Phase1_Report.pdf)
- [x] Editable source files (01_Final_Report/*.docx; source/sections/*.md; source/scripts/)
- [x] Diagrams PNG + SVG (05_Workflows/)
- [x] Prototype screens PNG + PDF (06_Prototype/)
- [x] XLSX: data template, traceability matrix, risk register
- [x] README.md
- [x] Poster content (08_Presentation/)

## Integrity

- [x] **No fabricated research data** — grep the report for "We surveyed", "participants said", "% of students": all occurrences are inside placeholders or methodology text
- [x] No claim of "unhackable"; residual risks stated (Section 24.5)
- [x] No custom cryptographic algorithm (SEC-20)
- [x] No unsupported claims about specific universities (Section 12.5 states the limitation)
- [x] Authentication and authorization separated in architecture, requirements, workflows, threat model, prototype

## Team actions before 4 Oct 2026, 11:59 PM

- [ ] Insert team names / roll numbers / contact on cover, README, consent form, questionnaire intro
- [ ] Obtain permission from security supervisor; pilot the questionnaire; run studies
- [ ] Replace every `[DATA REQUIRED]` / `[INSERT …]` placeholder or delete the row if no data exists (never estimate)
- [ ] Re-run `python3 scripts/build.py` to regenerate PDFs/XLSX after edits
- [ ] Open every PDF once; check diagrams are legible at print size
- [ ] Zip and upload via the Classroom project link
- [ ] Prepare the 7 October poster from 08_Presentation/Phase1_Poster_Content.pdf
