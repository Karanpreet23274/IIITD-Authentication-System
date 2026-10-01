#!/usr/bin/env python3
"""Generate the three XLSX deliverables. Traceability and risk register are parsed from the
report markdown so the spreadsheets cannot drift from the report."""
import os, re, xlsxwriter

ROOT = os.path.join(os.path.dirname(__file__), "..")
SEC = os.path.join(ROOT, "sections"); OUT = os.path.join(ROOT, "out")

def md_tables(path):
    """Return list of tables; each table = list of rows (list of cell strings). Header included."""
    rows, tables, cur = open(path, encoding="utf-8").read().splitlines(), [], []
    for ln in rows:
        if ln.strip().startswith("|"):
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if all(re.fullmatch(r":?-{3,}:?", c) for c in cells): continue
            cur.append(cells)
        elif cur: tables.append(cur); cur = []
    if cur: tables.append(cur)
    return tables

def clean(s): return re.sub(r"\*\*(.+?)\*\*", r"\1", s).replace("`", "")

def book(path):
    wb = xlsxwriter.Workbook(path)
    f = dict(
        h=wb.add_format({"bold": True, "bg_color": "#1F2937", "font_color": "white", "text_wrap": True, "valign": "top", "border": 1}),
        c=wb.add_format({"text_wrap": True, "valign": "top", "border": 1}),
        ph=wb.add_format({"text_wrap": True, "valign": "top", "border": 1, "bg_color": "#FEF3C7"}),
        t=wb.add_format({"bold": True, "font_size": 14}),
        n=wb.add_format({"italic": True, "text_wrap": True}),
        hi=wb.add_format({"text_wrap": True, "valign": "top", "border": 1, "bg_color": "#FECACA"}),
        me=wb.add_format({"text_wrap": True, "valign": "top", "border": 1, "bg_color": "#FEF3C7"}),
        lo=wb.add_format({"text_wrap": True, "valign": "top", "border": 1, "bg_color": "#DCFCE7"}),
    )
    return wb, f

def sheet(wb, f, name, header, rows, widths, title=None, note=None, fmt_row=None):
    ws = wb.add_worksheet(name[:31]); r = 0
    if title: ws.write(r, 0, title, f["t"]); r += 1
    if note: ws.merge_range(r, 0, r, max(1, len(header)-1), note, f["n"]); ws.set_row(r, 45); r += 1
    for i, h in enumerate(header): ws.write(r, i, h, f["h"])
    ws.set_row(r, 30); hdr_row = r; r += 1
    for row in rows:
        for i, v in enumerate(row):
            fm = (fmt_row(row, i) if fmt_row else None) or (f["ph"] if ("[" in str(v) and "REQUIRED" in str(v).upper() or "INSERT" in str(v).upper()) else f["c"])
            ws.write(r, i, clean(str(v)), fm)
        r += 1
    for i, w in enumerate(widths): ws.set_column(i, i, w)
    ws.freeze_panes(hdr_row+1, 0); ws.autofilter(hdr_row, 0, max(hdr_row+1, r-1), len(header)-1)
    return ws

# ------------------------------------------------------------------ 1. Data collection template
def data_collection():
    wb, f = book(os.path.join(OUT, "02_User_Studies", "Data_Collection_Template.xlsx"))
    note = "NO DATA HAS BEEN ENTERED. Every row below is an empty template. Enter only real responses; never estimate. Participant codes (S01…, G01…, A01…) replace all names."
    qs = [("Q1","Programme","MC"),("Q2","Hosteller/Day scholar","MC"),("Q3","Entries per weekday","MC"),("Q4","How ID carried","MC"),("Q5","How closely guard looks","MC"),
          ("Q11a","Peak wait time","MC"),("Q11b","Retrieving ID inconvenient (Likert 1-5)","L"),("Q6","Times without ID last month","MC"),("Q7","What happened without ID (multi)","CB"),
          ("Q8","If refused, what did you do","TXT"),("Q9","Ever lost ID","MC"),("Q10","Days to replacement / interim access","TXT"),("Q12","Seen other's ID / fake / no check","MC"),
          ("Q13a","Current check reliable (L)","L"),("Q13b","Concerned lost card usable (L)","L"),("Q13c","Perceived security problems (multi)","CB"),
          ("Q14a","Comfortable with entry time recorded (L)","L"),("Q14b","Want to see own records (L)","L"),("Q14c","Details OK for guard to see (multi)","CB"),
          ("Q15a","Trust electronic more (L)","L"),("Q15b","Worried about other uses (L)","L"),("Q15c","What would increase trust","TXT"),
          ("Q16","Ranking: card / phone NFC / QR / visual / other (1-5 each)","RANK"),("Q17","Phone type","MC"),("Q18","Accessibility needs","TXT"),("Q19","Expectation if ID stops working (multi)","CB"),("Q20","Anything else","TXT")]
    hdr = ["Participant code", "Date", "Valid? (Y/N)"] + [f"{q} {t}" for q, t, _ in qs]
    ws = sheet(wb, f, "Questionnaire_Raw", hdr, [[f"S{i:02d}"] + [""]*(len(hdr)-1) for i in range(1, 61)], [14, 11, 9] + [22]*len(qs), "Student questionnaire — raw responses (export from Google Forms, one row per response)", note)
    # Likert summary sheet with formulas
    ws2 = wb.add_worksheet("Likert_Summary"); ws2.write(0, 0, "Likert summary — formulas count raw sheet; blank until data exists", f["t"]); ws2.merge_range(1, 0, 1, 8, note, f["n"])
    lik = [(q, t) for q, t, k in qs if k == "L"]
    for i, h in enumerate(["Item", "Statement", "SD (1)", "D (2)", "N (3)", "A (4)", "SA (5)", "n", "Median"]): ws2.write(3, i, h, f["h"])
    for r, (q, t) in enumerate(lik, start=4):
        col = xlsxwriter.utility.xl_col_to_name(hdr.index(f"{q} {t}"))
        rng = f"Questionnaire_Raw!${col}$3:${col}$62"
        ws2.write(r, 0, q, f["c"]); ws2.write(r, 1, t, f["c"])
        for k in range(1, 6): ws2.write_formula(r, 1+k, f'=COUNTIF({rng},{k})', f["c"])
        ws2.write_formula(r, 7, f'=COUNT({rng})', f["c"]); ws2.write_formula(r, 8, f'=IF(COUNT({rng})=0,"",MEDIAN({rng}))', f["c"])
    ws2.set_column(0, 0, 8); ws2.set_column(1, 1, 48); ws2.set_column(2, 8, 9)
    # Frequency sheet
    ws3 = wb.add_worksheet("Frequencies"); ws3.write(0, 0, "Frequency distributions for categorical items — fill 'Option' column with the exact option text, counts compute", f["t"]); ws3.merge_range(1, 0, 1, 4, note, f["n"])
    for i, h in enumerate(["Item", "Option (type exactly as in raw data)", "Count", "% of valid", ""]): ws3.write(3, i, h, f["h"])
    r = 4
    for q, t, k in qs:
        if k != "MC": continue
        col = xlsxwriter.utility.xl_col_to_name(hdr.index(f"{q} {t}")); rng = f"Questionnaire_Raw!${col}$3:${col}$62"
        for j in range(5):
            ws3.write(r, 0, f"{q} {t}" if j == 0 else "", f["c"]); ws3.write(r, 1, "", f["ph"])
            ws3.write_formula(r, 2, f'=IF(B{r+1}="","",COUNTIF({rng},B{r+1}))', f["c"]); ws3.write_formula(r, 3, f'=IF(OR(B{r+1}="",COUNTA({rng})=0),"",C{r+1}/COUNTA({rng}))', f["c"]); r += 1
    ws3.set_column(0, 0, 36); ws3.set_column(1, 1, 44); ws3.set_column(2, 3, 12)
    # Interview coding
    sheet(wb, f, "Interview_Notes", ["Interview code", "Date", "Role (Guard/Admin)", "Shift", "Gate type", "Years exp.", "Audio consent", "Question #", "Note / paraphrase", "Verbatim quote (if any)", "Initial code", "Theme", "Links to requirement"],
          [[f"G{(i//14)+1:02d}", "", "Guard", "", "", "", "", f"Q{(i%14)+1}", "", "", "", "", ""] for i in range(14*6)], [12, 11, 12, 10, 12, 9, 9, 10, 50, 40, 18, 18, 18],
          "Interview notes and open coding — one row per question per interview", note)
    sheet(wb, f, "Observation", ["Session", "Date", "Window", "Gate", "Observer A", "Observer B", "Person #", "Code (U/Q/N/V/R)", "Seconds T1−T0", "Queue length (2-min mark)", "Exception type", "Exception duration (s)", "Outcome", "Environment / process note"],
          [[f"S{(i//40)+1}", "", "", "", "", "", (i%40)+1, "", "", "", "", "", "", ""] for i in range(120)], [8, 11, 12, 8, 11, 11, 8, 12, 12, 14, 16, 12, 14, 50],
          "Contextual inquiry timing sheet — one row per timed person (Appendix D)", note)
    sheet(wb, f, "Affinity_Themes", ["Theme code", "Theme (user-voice label)", "Category (pain/security/privacy/usability/accessibility/opportunity)", "Supporting codes (count)", "Sources (participant codes)", "Representative quote", "Confirms / refutes hypothesis (H1-H9)", "Links to requirement(s)", "Links to screen(s)"],
          [[f"T{i}", "", "", "", "", "", "", "", ""] for i in range(1, 16)], [8, 36, 24, 14, 20, 44, 18, 18, 14], "Affinity analysis output", note)
    sheet(wb, f, "Hypothesis_Verdicts", ["Hypothesis", "Statement", "Verdict (CONFIRMED / REFUTED / MODIFIED / NO DATA)", "Evidence (question, session, quote codes)", "Effect on requirements"],
          [["H1", "Card retrieval delays queue", "NO DATA", "", ""], ["H2", "Guards do not read expiry", "NO DATA", "", ""], ["H3", "Face familiarity replaces card check", "NO DATA", "", ""], ["H4", "Forgotten ID common; inconsistent handling", "NO DATA", "", ""], ["H5", "Lost cards not blocked; slow replacement", "NO DATA", "", ""], ["H6", "Visitor register slow; leaks phone numbers", "NO DATA", "", ""], ["H7", "Peak pressure → waving through", "NO DATA", "", ""], ["H8", "No record for incidents", "NO DATA", "", ""], ["H9", "Students uneasy about data use", "NO DATA", "", ""]],
          [10, 40, 24, 44, 40], "Hypotheses from Section 8 — update after analysis")
    wb.close()

# ------------------------------------------------------------------ 2. Traceability matrix
def traceability():
    req_tables = md_tables(os.path.join(SEC, "05_requirements.md"))
    fr, secr, priv, use, nfr = req_tables[0], req_tables[1], req_tables[2], req_tables[4], req_tables[5]
    trace_rows = [t for t in md_tables(os.path.join(SEC, "09_eval_trace_close.md")) if t[0][0].startswith("Finding")][0]
    scen = [t for t in md_tables(os.path.join(SEC, "06_threats.md")) if t[0][0] == "Scenario"][0]
    wb, f = book(os.path.join(OUT, "03_Requirements", "Requirements_Traceability_Matrix.xlsx"))
    note = "Evidence column: [P] primary (cite Q/G/S code once data exists — currently [DATA REQUIRED]), [S] secondary (reference number), [A] labelled assumption."
    sheet(wb, f, "Finding→Screen→Test", trace_rows[0], trace_rows[1:], [40, 28, 24, 16, 36, 14, 36], "Requirement traceability: Finding → User need → Requirement → Threat → Design feature → Prototype screen → Future test", note)
    sheet(wb, f, "FR", fr[0], fr[1:], [8, 60, 40, 28, 8, 12], "Functional requirements (Section 19)", note)
    sheet(wb, f, "SEC", secr[0], secr[1:], [8, 56, 40, 30, 20, 6, 36, 40], "Security requirements (Section 20)", note)
    sheet(wb, f, "PRIV", priv[0], priv[1:], [9, 56, 20, 36, 6, 28, 24], "Privacy requirements (Section 21)", note)
    sheet(wb, f, "USE", use[0], use[1:], [8, 56, 40, 28, 6, 28, 28], "Usability requirements (Section 22)", note)
    sheet(wb, f, "NFR", nfr[0], nfr[1:], [8, 16, 56, 36, 20], "Non-functional requirements (Section 23)", note)
    sheet(wb, f, "Scenario_Coverage", scen[0], scen[1:], [16, 24, 40, 16], "Attack scenario → threats → requirements → screens (Section 25.1)")
    # Coverage check: every requirement ID appears in traceability / screens
    ids = [clean(r[0]) for t in (fr, secr, priv, use) for r in t[1:]]
    # Requirement -> screen -> Phase 2 test, derived directly from the requirement tables (full coverage by construction)
    r2s = []
    for r in fr[1:]: r2s.append([clean(r[0]), clean(r[1])[:120], "-", r[5], "Functional test per Section 40.3"])
    for r in secr[1:]: r2s.append([clean(r[0]), clean(r[1])[:120], r[4], r[6], r[7]])
    for r in priv[1:]: r2s.append([clean(r[0]), clean(r[1])[:120], "-", r[5], r[6]])
    for r in use[1:]: r2s.append([clean(r[0]), clean(r[1])[:120], "-", r[5], r[6]])
    sheet(wb, f, "Req→Screen→Test", ["Requirement", "Summary", "Threat(s)", "Prototype feature / screen(s)", "Phase 2 evaluation"], r2s, [10, 60, 22, 36, 40], "Every requirement mapped to a prototype feature and a future test (from Sections 19-22)")
    alltext = " ".join(" ".join(r) for r in trace_rows + scen)
    cov = [[i, "yes" if re.search(re.escape(clean(i)) + r"\b", clean(alltext)) else "no (covered via Req→Screen→Test sheet)", ""] for i in ids]
    sheet(wb, f, "Coverage_Check", ["Requirement ID", "Appears in Finding→Screen→Test or Scenario table?", "Note"], cov, [16, 44, 30], "Coverage check against the narrative traceability table (Section 37) and scenario matrix (Section 25.1)")
    wb.close()
    return cov

# ------------------------------------------------------------------ 3. Risk register
def risk_register():
    th = [t for t in md_tables(os.path.join(SEC, "06_threats.md")) if t[0][0] == "ID" and "Threat (STRIDE)" in t[0][1]][0]
    actors = [t for t in md_tables(os.path.join(SEC, "06_threats.md")) if t[0][1] == "Actor"][0]
    assets = [t for t in md_tables(os.path.join(SEC, "06_threats.md")) if t[0][1] == "Asset"][0]
    wb, f = book(os.path.join(OUT, "04_Threat_Model", "Risk_Register.xlsx"))
    def lik_imp(s):
        m = re.search(r"Likelihood\s+([HML])", s); l = {"H": 3, "M": 2, "L": 1}.get(m.group(1) if m else "M", 2)
        p = "High" if "High" in s else ("Medium" if "Medium" in s else "Low")
        return l, p
    rows = []
    for r in th[1:]:
        l, p = lik_imp(r[5]); imp = 3 if p == "High" else (2 if p == "Medium" else 1)
        rows.append([clean(r[0]), clean(r[1]), clean(r[2]), r[3], r[4], l, imp, l*imp, p, clean(r[6]), r[7], r[8], "Open — design mitigation specified; verify in Phase 2", "[ASSUMPTION] ratings are team judgement; revisit after primary data and Phase 2 tests"])
    def fmt(row, i):
        if i in (7, 8): return f["hi"] if row[8] == "High" else (f["me"] if row[8] == "Medium" else f["lo"])
        return None
    sheet(wb, f, "Risk_Register", ["ID", "Threat (STRIDE)", "Attack scenario", "Asset(s)", "Security impact", "Likelihood (1-3)", "Impact (1-3)", "Score", "Priority", "Mitigation (requirement IDs)", "Residual risk", "Usability impact of mitigation", "Status", "Note"],
          rows, [8, 26, 46, 14, 34, 10, 9, 7, 9, 50, 36, 30, 26, 32], "Risk register — generated from Section 24.3 threat table", "Score = Likelihood × Impact. H=3, M=2, L=1. Priority as stated in the report.", fmt_row=fmt)
    sheet(wb, f, "Threat_Actors", actors[0], actors[1:], [8, 30, 44, 36, 28], "Threat actors (Section 24.1)")
    sheet(wb, f, "Assets", assets[0], assets[1:], [8, 40, 24, 40], "Assets (Section 24.2)")
    sheet(wb, f, "Residual_Risks", ["#", "Accepted residual risk", "Compensating control", "Owner (Phase 2)", "Review trigger"],
          [[1, "Real-time relay not prevented cryptographically", "Guard photo check (FR-12); anomaly rules (SEC-13)", "Team", "Any relay demonstrated in peer testing"],
           [2, "Coerced / colluding / fatigued guard fails photo check", "Mismatch flagging; manual entries supervised and flagged; training", "Team / Security office", "Mismatch rate in pilot"],
           [3, "Revoked credential may work offline up to N h", "N configurable (default 4 h); shorten at cost of more manual mode", "Team", "Outage frequency data"],
           [4, "Future break of chosen card family", "Lifecycle supports batch re-issuance; key rotation; revocation list", "Security office", "Published attack on chip family"],
           [5, "Exit not controlled; visitor overstay undetected", "Pass window; host notification; future exit readers", "Out of scope Phase 1", "Phase 2 scope review"]],
          [4, 44, 50, 20, 30], "Accepted residual risks (Section 24.5)")
    wb.close()

if __name__ == "__main__":
    for d in ("02_User_Studies", "03_Requirements", "04_Threat_Model"): os.makedirs(os.path.join(OUT, d), exist_ok=True)
    data_collection(); cov = traceability(); risk_register()
    missing = [c[0] for c in cov if c[1].startswith("no")]
    print("xlsx written. IDs not in narrative trace/scenario tables (all are in Req→Screen→Test):", missing or "none")
