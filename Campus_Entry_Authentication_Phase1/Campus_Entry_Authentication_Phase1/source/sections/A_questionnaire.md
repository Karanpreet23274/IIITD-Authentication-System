# Appendix A. Student Questionnaire

**Title for Google Forms:** Campus Entry Experience Survey (Usable Security & Privacy course project)

**Form description (shown on page 1):**

> This short survey (6–8 minutes) is part of a student course project in CSE 347/652 | DES 306/525 Usable Security and Privacy at IIIT-Delhi. We are studying how campus entry works today and how it could be made more secure, private and convenient. The survey is anonymous: we do not ask for your name, roll number, e-mail or phone number. Responses are stored on a password-protected team drive, reported only in aggregate, and deleted at the end of the course. Participation is voluntary and you may stop at any time. By clicking "Next" you confirm you are 18 or older and agree to take part. Questions: contact the team at **[TEAM CONTACT E-MAIL]**.

**Google Forms settings:** Do not collect e-mail addresses. Do not limit to one response (requires sign-in). Shuffle option order OFF (ranking and Likert need fixed order). Show progress bar ON.

---

## Section 1 — Background

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q1 | Which programme are you in? | Multiple choice | UG (B.Tech) / PG (M.Tech / MSc) / PhD / Other | Yes | Segment respondents; check sample balance |
| Q2 | Are you a hosteller or a day scholar? | Multiple choice | Hosteller / Day scholar / Other | Yes | Entry frequency and time-of-day patterns differ |
| Q3 | On a typical weekday, how many times do you pass through a campus entry gate? | Multiple choice | 0–1 / 2–3 / 4–5 / More than 5 | Yes | Size how often authentication happens per user; informs speed requirement |

## Section 2 — Current Entry Experience

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q4 | How do you usually carry your college ID card? | Multiple choice | On a lanyard, visible / In wallet or pocket / In bag / I often don't carry it / Other | Yes | Retrieval effort; informs H1 and form-factor decision |
| Q5 | When you enter, how closely does the guard usually look at your ID? | Multiple choice | Does not look; I walk through / Glances at the card from a distance / Looks at the card and my face / Asks me to stop and checks carefully / Varies a lot | Yes | Measures perceived rigour of current check (RQ1, H3, H7) |
| Q11a | At the busiest time you enter, how long do you typically wait in the queue at the gate? | Multiple choice | No wait / Under 30 seconds / 30 s – 1 min / 1–3 min / More than 3 min | Yes | Quantifies queueing (RQ3) |
| Q11b | "Retrieving my ID card at the gate is inconvenient." | Likert (5) | Strongly disagree / Disagree / Neutral / Agree / Strongly agree | Yes | Perceived friction of current mechanism |

## Section 3 — Problems and Failures

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q6 | In the last month, how many times did you arrive at the gate without your ID card? | Multiple choice | 0 / 1 / 2–3 / 4 or more | Yes | Frequency of forgotten-ID case (H4) |
| Q7 | The last time you arrived without your ID, what happened? | Checkboxes (multiple) | Guard let me in without asking / Guard recognised me and let me in / I showed another ID or proof / Guard asked questions then let me in / Someone vouched for me / I was refused entry / Never happened to me / Other (specify) | Yes | Documents actual fallback behaviour (RQ2) |
| Q8 | If you were refused entry without your ID, what did you do? | Short answer | — | No | Qualitative detail on the refusal path |
| Q9 | Have you ever lost your college ID card? | Multiple choice | Yes, once / Yes, more than once / No | Yes | Frequency of lost-credential case (H5) |
| Q10 | If yes, roughly how many days did it take to get a replacement, and could you enter campus in the meantime? | Short answer | — | No | Replacement latency and interim access (H5) |
| Q12 | Have you ever seen someone enter the campus using another person's ID, a fake ID, or without any check? | Multiple choice | Yes, more than once / Yes, once / Not sure / No | Yes | Witnessed security failures without asking respondent to self-incriminate (RQ4) |

## Section 4 — Security Perceptions

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q13a | "The current ID check reliably stops unauthorised people from entering." | Likert (5) | SD / D / N / A / SA | Yes | Perceived effectiveness (RQ4) |
| Q13b | "I am concerned that a lost or stolen ID card could be used by someone else to enter." | Likert (5) | SD / D / N / A / SA | Yes | Perceived risk of credential theft |
| Q13c | Which of the following would you consider a security problem with the current system? (select all) | Checkboxes | Cards can be borrowed / Cards can be faked / Lost cards keep working / Expiry is not checked / Visitors are not checked properly / Guards are too busy to check / None of these / Other | Yes | Maps perceived problems to threat model rows |

## Section 5 — Privacy and Trust

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q14a | "I would be comfortable with the college recording the time I enter campus." | Likert (5) | SD / D / N / A / SA | Yes | Acceptance of entry logging (PRIV requirements) |
| Q14b | "I would want to be able to see my own entry records." | Likert (5) | SD / D / N / A / SA | Yes | Transparency need (PRIV-08) |
| Q14c | Which of your details would you be comfortable with a gate guard seeing on a screen when you enter? (select all) | Checkboxes | Photo / First name / Full name / Roll number / Programme / Hostel / Phone number / None of these | Yes | Directly informs guard-screen data minimisation (PRIV-03, screen 5) |
| Q15a | "I would trust an electronic check (card tap / phone) more than the current visual check." | Likert (5) | SD / D / N / A / SA | Yes | Baseline trust in electronic authentication |
| Q15b | "I am worried that entry data could be used for purposes other than campus security (e.g., attendance, tracking)." | Likert (5) | SD / D / N / A / SA | Yes | Purpose-limitation concern (PRIV-02) |
| Q15c | What would make you trust an electronic entry system more? | Short answer | — | No | Qualitative trust factors |

## Section 6 — Preferences, Accessibility and Features

| # | Question | Type | Options | Required | Purpose |
|---|---|---|---|---|---|
| Q16 | Rank these ways of proving who you are at the gate, from most preferred (1) to least (5). | Ranking grid (Google Forms: multiple-choice grid, one column per rank) | Tap a physical smart card / Tap my phone (NFC) / Show a QR code on my phone / Keep the current visual ID check / Other | Yes | Method preference (RQ7); drives decision matrix D1 |
| Q17 | Which best describes your phone? | Multiple choice | Smartphone with NFC (tap-to-pay works) / Smartphone, but I don't know if it has NFC / Smartphone without NFC / I do not carry a smartphone regularly | Yes | Feasibility of phone-based credential (A3) |
| Q18 | Do you have any need that affects how you use the gate (e.g., difficulty reaching into a bag, low vision, hearing, using a wheelchair, carrying a child or heavy equipment)? Optional; do not include anything you'd rather not share. | Short answer | — | No | Accessibility requirements (RQ8). Framed to avoid disclosing a diagnosis |
| Q19 | If your ID stopped working at the gate, what would you expect to happen? | Checkboxes | Guard checks my photo and lets me in / I verify with a one-time code on my phone / I go to the security office / I am not allowed in until fixed / Other | Yes | Expectations for failure handling (FR-13, screen 12) |
| Q20 | Is there anything else about entering campus, security, or privacy at the gate that you want to tell us? | Paragraph | — | No | Open qualitative capture |

**Question numbering note:** Q11a/b appear in Section 2 for flow but are numbered to match the analysis tables in Section 11.

**Pilot instructions:** Run with 3–5 students. Check: completion time under 8 minutes; no question interpreted two ways; ranking grid works on mobile; option lists are exhaustive (watch "Other" frequency).
