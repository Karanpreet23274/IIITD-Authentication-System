# 9. User Research Methodology

## 9.1 Approach

The research follows a mixed-methods design-research approach as required by the course brief: quantitative data to size problems (how often, how long, how many) and qualitative data to understand why they occur and how people work around them. Three primary methods are triangulated with secondary research so that no single source drives a requirement.

| Method | Population | Data type | Primary purpose |
|---|---|---|---|
| Online questionnaire (Appendix A) | Students | Quantitative (Likert, frequency, ranking) + short qualitative | Size the problem; measure attitudes to security, privacy, technology options, accessibility |
| Semi-structured interviews (Appendix B) | Security guards; security office/admin if accessible | Qualitative | Understand real verification workflow, exceptions, workarounds, information needs, constraints |
| Contextual inquiry / non-participant observation (Appendix D) | Gate environment | Quantitative timing + qualitative field notes | Ground truth for step counts, timing, queueing, environment, deviations from stated procedure |
| Secondary research (Section 12) | Literature, standards, existing systems | Evidence from publications | Threats, technology properties, usable-security and privacy principles |

## 9.2 Research questions

| RQ | Question | Answered by |
|---|---|---|
| RQ1 | How does campus entry currently work in practice, and where does it deviate from the intended procedure? | Interviews, observation |
| RQ2 | How frequently do students forget, lose, or have trouble with their ID, and what happens when they do? | Questionnaire, interviews |
| RQ3 | How long does entry take, and when do queues form? | Observation, questionnaire |
| RQ4 | What security weaknesses do guards and students perceive, and which have they witnessed? | Questionnaire, interviews |
| RQ5 | What information do guards need to make a confident decision, and what information should not be shown to them? | Interviews, observation |
| RQ6 | What are students' privacy concerns about an electronic entry system, and what would make them trust it? | Questionnaire |
| RQ7 | Which authentication methods (card tap, phone tap, phone QR, other) do students prefer and why? What proportion has a compatible phone? | Questionnaire |
| RQ8 | What accessibility needs exist at the gate? | Questionnaire, observation |
| RQ9 | How are visitors handled, and what data is collected about them? | Interviews, observation |
| RQ10 | What happens when the guard, the device, or the network is unavailable? | Interviews, observation |

## 9.3 Sampling plan

- **Students**: convenience sample recruited through class groups, hostel groups and notice boards. Target: at least 40 responses across programmes and years; minimum viable: 25. Actual: **[INSERT NUMBER OF PARTICIPANTS]**.
- **Security guards**: purposive sample. Target: 3–6 guards across shifts (morning peak, afternoon, night) and gates. Actual: **[INSERT NUMBER OF PARTICIPANTS]**. Permission from the security supervisor must be obtained before approaching guards on duty; interviews should be scheduled off-shift or during quiet periods.
- **Administration / security office**: 1–2 interviews if access is granted. Actual: **[INSERT NUMBER / "not accessible"]**.
- **Observation**: at least 3 sessions of 30–45 minutes each, covering one morning peak, one off-peak, and one evening/hostel-return period, ideally at two different gates. Actual: **[INSERT SESSIONS CONDUCTED]**.

## 9.4 Ethics

- Participation is voluntary and anonymous; no names, roll numbers, phone numbers or e-mail addresses are collected in the questionnaire.
- Interviews are recorded only in written notes unless the participant explicitly consents to audio; audio, if any, is deleted after transcription.
- Observation is non-participant and non-interfering: observers do not speak to people in the queue, do not record faces, names, or card details, and stop if asked by security staff.
- Guards are a vulnerable population in the employment sense (contract staff, may fear criticism). The consent statement makes clear that findings are reported in aggregate, that no individual guard's performance is assessed, and that participation cannot affect their employment.
- The consent statement (Appendix C) is read aloud before interviews and shown as the first page of the questionnaire.
- Data is stored on a password-protected team drive accessible only to team members and deleted at the end of the course.

## 9.5 Data collection procedure

| Step | Activity | Output | Responsible |
|---|---|---|---|
| 1 | Obtain permission from security supervisor / relevant office for interviews and observation | Written or e-mail permission | Team lead |
| 2 | Pilot questionnaire with 3–5 students; fix ambiguous wording | Revised form | Team |
| 3 | Distribute questionnaire (Google Forms); leave open 7 days | Response CSV | Team |
| 4 | Conduct observation sessions using Appendix D checklist | Field notes + timing sheets in Data_Collection_Template.xlsx | Two observers per session |
| 5 | Conduct guard interviews using Appendix B protocol | Notes template per interview | Interviewer + note-taker |
| 6 | Conduct admin interview if available | Notes | Team lead |
| 7 | Transcribe / clean; enter into Data_Collection_Template.xlsx | Cleaned dataset | Team |
| 8 | Quantitative analysis: frequencies, Likert medians and distributions, ranking scores | Tables and charts | Team |
| 9 | Qualitative analysis: open coding of interview and open-text responses; affinity clustering into themes | Affinity map, theme table | Whole team, 1 session |
| 10 | Map findings to user needs and requirements; update traceability matrix | Updated Section 37 and Appendix F | Team |

## 9.6 Analysis framework

**Quantitative**

- Frequency distributions for every categorical item (bar charts).
- For Likert items (5-point): report median, mode, and full distribution; do not report means as the sole summary. Group "agree" and "strongly agree" only when the full distribution is also shown.
- For ranking items: Borda-count style scores (rank 1 = n points) plus first-choice frequency.
- Cross-tabulations of interest: authentication-method preference vs. smartphone ownership; privacy concern vs. trust; year of study vs. forgotten-ID frequency.
- Observation: mean, median and range of per-person processing time, split by "uncontested" vs "questioned"; queue length at fixed intervals.

**Qualitative**

- Open coding of all interview notes and open-text questionnaire answers by two team members independently; codes reconciled.
- Affinity diagramming: codes clustered into themes; each theme labelled with a user-voice statement.
- Themes classified into: pain point, security concern, privacy concern, usability concern, accessibility concern, design opportunity.
- Each theme linked to at least one requirement or explicitly marked as out of scope.

**Evidence labelling convention used in this report**

| Label | Meaning |
|---|---|
| **[PRIMARY]** | Finding from our own questionnaire, interviews or observation. Must cite the question/session. |
| **[SECONDARY]** | Finding from a cited published source. |
| **[ASSUMPTION]** | Team judgement not yet backed by evidence; must be validated. |
| **[DATA REQUIRED]** | Slot for primary evidence not yet collected. |

---

# 10. Primary Research

## 10.1 Student Questionnaire

Full instrument with question types, options, required flags and purposes is in **Appendix A**. Summary: 20 questions in six sections (Background; Current Entry Experience; Problems and Failures; Security Perceptions; Privacy and Trust; Preferences, Accessibility and Features). Estimated completion time 6–8 minutes. Designed for Google Forms. No personally identifying information collected.

## 10.2 Security Guard Interviews

Full protocol with introduction, consent statement, 14 core questions, follow-up probes and notes template is in **Appendix B**. Semi-structured, 20–30 minutes, conducted off-shift or during a quiet period with supervisor permission. The same protocol, with the administrative block (Q13–Q14) expanded, is used for the security office / ID cell interview if access is obtained.

## 10.3 Contextual Inquiry

Full protocol with observation checklist, timing method, what-to-record / what-not-to-record lists and ethical constraints is in **Appendix D**. Non-participant observation from a position agreed with security staff. Two observers per session: one timing, one taking field notes.

## 10.4 Participant Information

All participant information is reported in aggregate only.

| Population | Target | Actual | Notes |
|---|---|---|---|
| Students (questionnaire) | ≥40 | **[INSERT NUMBER OF PARTICIPANTS]** | Programme and year distribution: **[INSERT DISTRIBUTION]** |
| Security guards (interview) | 3–6 | **[INSERT NUMBER OF PARTICIPANTS]** | Shifts and gates covered: **[INSERT]** |
| Administration (interview) | 1–2 | **[INSERT NUMBER / "not accessible"]** | Office: **[INSERT]** |
| Observation sessions | ≥3 | **[INSERT NUMBER]** | Dates, times, gates: **[INSERT]** |

## 10.5 Data Collection Procedure

As described in Section 9.5. Actual dates: questionnaire open **[INSERT DATES]**; interviews conducted **[INSERT DATES]**; observation sessions **[INSERT DATES]**. Deviations from plan: **[INSERT or "none"]**.

---

# 11. Primary Research Findings

> **Status: [DATA REQUIRED].** This section is a structured template. No primary data has been collected at the time of writing. Every value below is a placeholder. Nothing in this section may be cited as a finding until the placeholders are replaced with actual results from Appendix E (Data_Collection_Template.xlsx). The team must also delete any placeholder row for which no data exists rather than estimate.

## 11.1 Quantitative Findings

### 11.1.1 Participant profile

- Total valid responses: **[INSERT ACTUAL NUMBER]**
- Programme: UG **[n]** / PG **[n]** / PhD **[n]**
- Year of study distribution: **[INSERT DISTRIBUTION]**
- Hosteller / day scholar: **[n] / [n]**
- Smartphone ownership (Q17): **[INSERT ACTUAL PERCENTAGE]** own a smartphone; **[INSERT ACTUAL PERCENTAGE]** report NFC capability; **[INSERT ACTUAL PERCENTAGE]** don't know

### 11.1.2 Frequency distributions

| Item | Question | Result |
|---|---|---|
| Entries per day | Q3 | **[INSERT DISTRIBUTION]** |
| How ID is carried | Q4 | **[INSERT DISTRIBUTION]** |
| Guard actually looks at card | Q5 | **[INSERT DISTRIBUTION]** |
| Forgotten ID in last month | Q6 | **[INSERT ACTUAL PERCENTAGE]** at least once |
| What happened when ID forgotten | Q7 | **[INSERT DISTRIBUTION]** |
| Ever lost ID | Q9 | **[INSERT ACTUAL PERCENTAGE]** |
| Days to replacement | Q10 | median **[INSERT ACTUAL VALUE]** |
| Typical wait at peak | Q11 | **[INSERT DISTRIBUTION]** |
| Witnessed someone enter with another's ID / no check | Q12 | **[INSERT ACTUAL PERCENTAGE]** |
| Preferred method (first choice) | Q16 | **[INSERT DISTRIBUTION]** |

### 11.1.3 Likert-scale summaries

Report median, mode and full 5-point distribution for each.

| Statement | Q | SD | D | N | A | SA | Median |
|---|---|---|---|---|---|---|---|
| "The current ID check reliably stops unauthorised people" | Q13a | [n] | [n] | [n] | [n] | [n] | [x] |
| "I am concerned that a lost card could be used by someone else" | Q13b | [n] | [n] | [n] | [n] | [n] | [x] |
| "I would be comfortable with the college recording the time I enter campus" | Q14a | [n] | [n] | [n] | [n] | [n] | [x] |
| "I would want to see my own entry records" | Q14b | [n] | [n] | [n] | [n] | [n] | [x] |
| "I would trust an electronic system more than a visual check" | Q15a | [n] | [n] | [n] | [n] | [n] | [x] |
| "I am worried that entry data could be used for purposes other than security" | Q15b | [n] | [n] | [n] | [n] | [n] | [x] |
| "Retrieving my ID card at the gate is inconvenient" | Q11b | [n] | [n] | [n] | [n] | [n] | [x] |

### 11.1.4 Ranking results (Q16: preferred authentication method)

| Option | Rank-1 count | Borda score |
|---|---|---|
| Tap physical smart card | [n] | [x] |
| Tap phone (NFC) | [n] | [x] |
| Show QR code on phone | [n] | [x] |
| Keep current visual check | [n] | [x] |
| Other (specify) | [n] | [x] |

### 11.1.5 Observation timings (Appendix D)

| Measure | Peak session | Off-peak session | Evening session |
|---|---|---|---|
| People observed | [n] | [n] | [n] |
| Median time from reaching guard to passing (uncontested) | [x s] | [x s] | [x s] |
| Median time when questioned | [x s] | [x s] | [x s] |
| Proportion questioned | [x %] | [x %] | [x %] |
| Proportion waved through without visible card | [x %] | [x %] | [x %] |
| Max queue length observed | [n] | [n] | [n] |
| Visitor register entries observed and median time | [n], [x s] | [n], [x s] | [n], [x s] |

## 11.2 Qualitative Findings

Interview and open-text responses coded and clustered. Each theme must be supported by at least one real, anonymised quote with participant code (e.g., G2 = guard 2; S14 = student response 14).

| Theme code | Theme (user-voice label) | Sources | Representative quote |
|---|---|---|---|
| T1 | **[INSERT THEME]** | [G1, G3, S7...] | "**[INSERT REAL PARTICIPANT QUOTE]**" |
| T2 | **[INSERT THEME]** | | "**[INSERT REAL PARTICIPANT QUOTE]**" |
| T3 | **[INSERT THEME]** | | "**[INSERT REAL PARTICIPANT QUOTE]**" |
| ... | | | |

## 11.3 Affinity Themes

Photograph or export of the affinity map: **[INSERT IMAGE / "see Appendix E"]**. Top-level clusters and the number of codes in each: **[INSERT]**.

## 11.4 Pain Points

Each hypothesis from Section 8 is confirmed, refuted, or modified here.

| Hypothesis | Verdict | Evidence |
|---|---|---|
| H1 Card retrieval delays queue | **[CONFIRMED / REFUTED / MODIFIED]** | **[INSERT OBSERVED FINDING, e.g., median retrieval time; Q11]** |
| H2 Expiry date not read | **[...]** | **[INSERT]** |
| H3 Facial familiarity replaces card check | **[...]** | **[INSERT]** |
| H4 Forgotten ID common, inconsistent handling | **[...]** | **[INSERT]** |
| H5 Lost cards not blocked; slow replacement | **[...]** | **[INSERT]** |
| H6 Visitor register slow and leaks phone numbers | **[...]** | **[INSERT]** |
| H7 Peak pressure leads to waving through | **[...]** | **[INSERT]** |
| H8 No record for incident investigation | **[...]** | **[INSERT]** |
| H9 Students uneasy about data use | **[...]** | **[INSERT]** |
| New pain points not hypothesised | | **[INSERT]** |

## 11.5 Security Concerns

Concerns raised by participants (not by the team). **[DATA REQUIRED]**

| Concern | Raised by | Frequency / strength | Links to requirement |
|---|---|---|---|
| **[INSERT]** | Students / Guards / Admin | **[INSERT]** | SEC-xx |

## 11.6 Privacy Concerns

**[DATA REQUIRED]**

| Concern | Raised by | Frequency / strength | Links to requirement |
|---|---|---|---|
| **[INSERT]** | | | PRIV-xx |

## 11.7 Usability Concerns

**[DATA REQUIRED]**

| Concern | Raised by | Frequency / strength | Links to requirement |
|---|---|---|---|
| **[INSERT]** | | | USE-xx |

## 11.8 Accessibility Concerns

**[DATA REQUIRED]** (Q18, observation)

| Need | Raised by | Links to requirement |
|---|---|---|
| **[INSERT]** | | USE-xx / NFR-xx |

## 11.9 Design Opportunities

Derived from confirmed pain points and themes. **[DATA REQUIRED]**

| Opportunity | Supporting finding | Addressed in |
|---|---|---|
| **[INSERT]** | T-x / H-x | Section / Screen |

## 11.10 How findings will be used

Once fieldwork data replaces the placeholders above, the team will (1) update the "User evidence" column of every requirement in Sections 19–23, (2) update the Design Decision Matrix (Section 34), (3) revise the personas (Section 16) to reflect actual distributions, and (4) re-run the traceability check in Section 37 so that every requirement cites either a primary finding, a secondary source, or a labelled assumption. Until then, all requirements are grounded in secondary research and labelled assumptions.
