#!/usr/bin/env python3
"""Assemble the complete Phase 1 package: report (PDF+DOCX), standalone PDFs, diagrams, screens, XLSX, README, zip."""
import os, re, shutil, subprocess, sys, glob, html
import markdown
from pypdf import PdfReader

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SEC, OUT, SCRIPTS = os.path.join(ROOT, "sections"), os.path.join(ROOT, "out"), os.path.join(ROOT, "scripts")
PKG = os.path.join(ROOT, "..", "Campus_Entry_Authentication_Phase1")
TMP = os.path.join(ROOT, "tmp"); os.makedirs(TMP, exist_ok=True)

CSS = """
@page { size: A4; margin: 20mm 18mm 20mm 18mm; }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10.5pt; line-height: 1.4; color: #111; }
h1 { font-size: 20pt; margin: 28pt 0 10pt; page-break-before: always; border-bottom: 2px solid #1F2937; padding-bottom: 4pt; }
h1.first, h1.nobreak { page-break-before: avoid; }
h2 { font-size: 14pt; margin: 18pt 0 6pt; color: #1F2937; }
h3 { font-size: 12pt; margin: 14pt 0 4pt; color: #374151; }
p { margin: 5pt 0; text-align: left; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 8.6pt; page-break-inside: auto; }
th, td { border: 1px solid #9CA3AF; padding: 3pt 4pt; vertical-align: top; text-align: left; }
th { background: #E5E7EB; font-weight: bold; }
tr { page-break-inside: avoid; }
code { font-family: Menlo, Consolas, monospace; font-size: 8.5pt; background: #F3F4F6; padding: 0 2pt; }
pre { font-family: Menlo, Consolas, monospace; font-size: 8.2pt; background: #F9FAFB; border: 1px solid #D1D5DB; padding: 6pt; white-space: pre-wrap; }
blockquote { border-left: 4px solid #F59E0B; background: #FFFBEB; margin: 8pt 0; padding: 6pt 10pt; }
img { max-width: 100%; height: auto; display: block; margin: 8pt auto; }
.fig { text-align: center; font-size: 9pt; color: #374151; margin-bottom: 14pt; }
.cover { text-align: center; padding-top: 120pt; page-break-after: always; }
.cover h1 { border: none; font-size: 28pt; page-break-before: avoid; }
.cover .sub { font-size: 14pt; color: #374151; margin: 8pt 0; }
.cover .meta { margin-top: 60pt; font-size: 11pt; line-height: 1.8; }
.toc { page-break-after: always; }
.toc ol { columns: 2; column-gap: 24pt; font-size: 9.5pt; }
.toc li { margin: 1pt 0; }
.ph { background: #FEF3C7; }
.appx h1 { page-break-before: always; }
"""

def md2html(text):
    h = markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    h = re.sub(r"(\[(?:DATA REQUIRED|INSERT[^\]]*|ASSUMPTION[^\]]*|PRIMARY|SECONDARY)\])", r'<span class="ph">\1</span>', h)
    return h

def read(name): return open(os.path.join(SEC, name), encoding="utf-8").read()

def doc(title, body_html, subtitle="", cover=True, toc_items=None):
    cov = f"""<div class="cover"><h1>{html.escape(title)}</h1><div class="sub">{html.escape(subtitle)}</div>
    <div class="meta">CSE 347/652 | DES 306/525 Usable Security and Privacy<br>IIIT-Delhi · Monsoon 2026 · Instructor: Dr. Arun Balaji Buduru<br><br>
    Phase 1: User Studies to evolve Requirements, Design and Workflows<br>Submission: 4 October 2026<br><br>
    Team: <span class="ph">[INSERT TEAM MEMBER NAMES AND ROLL NUMBERS]</span><br><br>
    <i>Primary research status: instruments complete; fieldwork data not yet collected. All placeholders are marked [DATA REQUIRED]. No primary data has been fabricated.</i></div></div>""" if cover else ""
    toc = ""
    if toc_items:
        toc = '<div class="toc"><h1 class="nobreak">Table of Contents</h1><ol>' + "".join(f"<li>{html.escape(t)}</li>" for t in toc_items) + "</ol></div>"
    return f"<html><head><meta charset='utf-8'><title>{html.escape(title)}</title><style>{CSS}</style></head><body>{cov}{toc}{body_html}</body></html>"

def convert(html_path, outdir, fmt):
    r = subprocess.run(["soffice", "--headless", "--convert-to", fmt, "--outdir", outdir, html_path], capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(os.path.join(outdir, os.path.splitext(os.path.basename(html_path))[0] + "." + fmt.split(":")[0])):
        print("CONVERT FAIL", html_path, r.stderr[-400:]); sys.exit(1)

def build_pdf(name, html_str, outdir, docx=False):
    os.makedirs(outdir, exist_ok=True)
    hp = os.path.join(TMP, name + ".html"); open(hp, "w", encoding="utf-8").write(html_str)
    convert(hp, outdir, "pdf")
    if docx: convert(hp, outdir, "docx:MS Word 2007 XML")
    return os.path.join(outdir, name + ".pdf")

def fig(name, caption):
    p = os.path.abspath(os.path.join(OUT, "05_Workflows", name + ".png"))
    return f'<img src="file://{p}"><div class="fig">{html.escape(caption)}</div>'

def screen_imgs():
    out = []
    for f in sorted(glob.glob(os.path.join(OUT, "06_Prototype", "screens", "*.png"))):
        sid = os.path.basename(f)[:3]; cap = os.path.basename(f)[4:-4].replace("_", " ")
        out.append(f'<h3>{sid} — {cap}</h3><img src="file://{os.path.abspath(f)}">')
    return "".join(out)

FIGS = [("Overall_System", "Figure J-1. Overall system"), ("Student_Authentication_Workflow", "Figure J-2. Student authentication workflow"), ("Authn_vs_Authz", "Figure J-3. Authentication vs authorization"),
        ("Credential_Lifecycle", "Figure J-4. Credential lifecycle"), ("Visitor_Workflow", "Figure J-5. Visitor access"), ("Lost_ID_Workflow", "Figure J-6. Lost ID"), ("Failure_Workflow", "Figure J-7. Authentication failure handling"),
        ("Network_Device_Failure_Workflow", "Figure J-8. Network / device failure"), ("Threat_Model", "Figure J-9. Threat model attack tree"), ("Data_Flow_Diagram", "Figure J-10. Data flow diagram"),
        ("Privacy_Data_Flow", "Figure J-11. Privacy data flow"), ("Admin_Credential_Management", "Figure J-12. Admin credential management"), ("System_Architecture", "Figure J-13. System architecture")]


sys.path.insert(0, SCRIPTS)
import mdpdf
NOTE = "Primary research status: instruments complete; fieldwork data not yet collected. All placeholders are marked [DATA REQUIRED]. No primary data has been fabricated."
SUB = "Standalone extract of the Phase 1 report"

def pdf(name, title, subtitle, md_parts, outdir, extra=None, with_toc=False, cover=True, docx=False):
    os.makedirs(outdir, exist_ok=True)
    story = mdpdf.cover(title, subtitle, NOTE) if cover else []
    if with_toc: story += mdpdf.toc()
    first = True
    for part in md_parts:
        story += mdpdf.flow(part, first=first); first = False
    if extra: story += extra
    path = os.path.join(outdir, name + ".pdf"); mdpdf.build(path, title, story, with_toc=with_toc)
    if docx:
        body = "".join(md2html(p) for p in md_parts)
        hp = os.path.join(TMP, name + ".html"); open(hp, "w", encoding="utf-8").write(doc(title, body, subtitle))
        convert(hp, outdir, "docx:MS Word 2007 XML")
    return path

def figs_story():
    out = []
    for n, c in FIGS: out += mdpdf.image_flow(os.path.join(OUT, "05_Workflows", n + ".png"), c)
    return out

def screens_story():
    out = []
    for f in sorted(glob.glob(os.path.join(OUT, "06_Prototype", "screens", "*.png"))):
        sid = os.path.basename(f)[:3]; cap = os.path.basename(f)[4:-4].replace("_", " ")
        out += mdpdf.image_flow(f, f"{sid} — {cap}", maxh=120*mm)
    return out
mm = 72/25.4

def part(md, h1s):
    chunks = re.split(r"(?m)^(?=# )", md); return "\n".join(c for c in chunks if any(c.startswith("# " + h) for h in h1s))

def main():
    for s in ("gen_diagrams.py", "gen_wireframes.py", "gen_xlsx.py"):
        r = subprocess.run([sys.executable, os.path.join(SCRIPTS, s)], capture_output=True, text=True)
        if r.returncode: print(r.stdout, r.stderr); sys.exit(1)
    print("assets ok")
    main_secs = ["01_front.md", "02_research.md", "03_secondary.md", "04_personas.md", "05_requirements.md", "06_threats.md", "07_architecture.md", "08_design_prototype.md", "09_eval_trace_close.md", "99_references.md"]
    parts = [read(f) for f in main_secs]
    # inline the architecture figures right after the sections that reference them
    arch = parts[6]
    appx_md = read("A_questionnaire.md") + "\n\n" + read("B_C_D_protocols.md") + "\n\n" + (
        "# Appendix E. Data Collection Template\n\nSee `02_User_Studies/Data_Collection_Template.xlsx` (sheets: Questionnaire_Raw, Likert_Summary, Frequencies, Interview_Notes, Observation, Affinity_Themes, Hypothesis_Verdicts). All sheets are empty templates; formulas compute once real data is entered.\n\n"
        "# Appendix F. Requirements Matrix\n\nSee `03_Requirements/Requirements_Traceability_Matrix.xlsx` (sheets: Finding→Screen→Test, FR, SEC, PRIV, USE, NFR, Scenario_Coverage, Req→Screen→Test, Coverage_Check). Narrative version in Section 37.\n\n"
        "# Appendix G. Threat Model\n\nFull table in Section 24.3; attack tree in Appendix J, Figure J-9.\n\n"
        "# Appendix H. Risk Register\n\nSee `04_Threat_Model/Risk_Register.xlsx` (sheets: Risk_Register with Likelihood × Impact scores, Threat_Actors, Assets, Residual_Risks). Ratings are labelled team judgements, to be revisited after primary data and Phase 2 testing.\n\n"
        "# Appendix I. Prototype Screens\n\nTwenty lo-fi wireframes; per-screen specifications in Section 35.2. Also provided as PNG in `06_Prototype/screens/`.\n")
    appx_j = "# Appendix J. Workflow Diagrams\n\nThirteen diagrams; also provided as PNG and SVG in `05_Workflows/`.\n"
    story_extra = screens_story() + mdpdf.flow(appx_j, first=False) + figs_story()
    rep = pdf("Campus_Entry_Authentication_Phase1_Report", "Campus Entry Authentication System", "Phase 1 Report: User Studies, Requirements, Design and Prototype",
              parts + [appx_md], os.path.join(OUT, "01_Final_Report"), extra=story_extra, with_toc=True, docx=True)
    print("report pages:", len(PdfReader(rep).pages))

    US = os.path.join(OUT, "02_User_Studies"); bcd = read("B_C_D_protocols.md"); misc = read("misc_docs.md")
    pdf("Student_Questionnaire", "Student Questionnaire", SUB, [read("A_questionnaire.md")], US)
    pdf("Security_Guard_Interview_Protocol", "Security Guard Interview Protocol", SUB, [part(bcd, ["Appendix B"])], US)
    pdf("Consent_Form", "Participant Information and Consent Statement", SUB, [part(bcd, ["Appendix C"])], US)
    pdf("Contextual_Inquiry_Protocol", "Contextual Inquiry (Observation) Protocol", SUB, [part(bcd, ["Appendix D"])], US)
    pdf("User_Study_Evaluation_Report", "User Study Evaluation Report", "Methodology, instruments, and findings template — [DATA REQUIRED]", [part(misc, ["User Study Evaluation Report"]), read("02_research.md"), read("A_questionnaire.md"), bcd], US)
    RQ = os.path.join(OUT, "03_Requirements"); req = read("05_requirements.md")
    pdf("Functional_Requirements", "Functional Requirements", SUB, [part(req, ["19."])], RQ)
    pdf("Security_Requirements", "Security Requirements", SUB, [part(req, ["20."])], RQ)
    pdf("Privacy_Requirements", "Privacy Requirements", SUB, [part(req, ["21."])], RQ)
    pdf("Usability_Requirements", "Usability and Non-Functional Requirements", SUB, [part(req, ["22.", "23."])], RQ)
    TM = os.path.join(OUT, "04_Threat_Model"); th = read("06_threats.md")
    pdf("Threat_Model", "Threat Model", SUB, [part(th, ["24."])], TM, extra=mdpdf.image_flow(os.path.join(OUT, "05_Workflows", "Threat_Model.png"), "Figure J-9. Attack tree"))
    pdf("Attack_Scenarios", "Attack Scenarios", SUB, [part(th, ["25."])], TM)
    PR = os.path.join(OUT, "06_Prototype"); dp = read("08_design_prototype.md")
    pdf("Prototype_Specification", "Prototype Specification", SUB, [part(dp, ["33.", "34.", "35."]), part(read("09_eval_trace_close.md"), ["36."])], PR)
    pdf("Prototype_Screens", "Prototype Screens (Lo-fi Wireframes)", "20 screens — per-screen specifications in Prototype_Specification.pdf", [], PR, extra=screens_story())
    pdf("Figma_Prototype_Instructions", "Figma Prototype Instructions", SUB, [part(misc, ["Figma"])], PR, cover=False)
    RS = os.path.join(OUT, "07_Research"); sr = read("03_secondary.md"); refs = read("99_references.md")
    pdf("Literature_Review", "Literature Review", SUB, [part(sr, ["12.", "15."]), refs], RS)
    pdf("Technology_Comparison", "Technology Comparison: QR vs RFID vs NFC", SUB, [part(sr, ["13."]), refs], RS)
    pdf("Existing_System_Comparison", "Existing System Comparison", SUB, [part(sr, ["14."]), refs], RS)
    pdf("Phase1_Poster_Content", "Phase 1 Poster Content", "Poster session 7 October 2026", [part(misc, ["Phase 1 Poster"])], os.path.join(OUT, "08_Presentation"), cover=False)
    print("standalone PDFs ok")

    if os.path.exists(PKG): shutil.rmtree(PKG)
    for d in ["01_Final_Report", "02_User_Studies", "03_Requirements", "04_Threat_Model", "06_Prototype", "07_Research", "08_Presentation"]:
        shutil.copytree(os.path.join(OUT, d), os.path.join(PKG, d), ignore=shutil.ignore_patterns("*.html"))
    wf = os.path.join(PKG, "05_Workflows"); os.makedirs(wf)
    for f in glob.glob(os.path.join(OUT, "05_Workflows", "*.png")) + glob.glob(os.path.join(OUT, "05_Workflows", "*.svg")): shutil.copy(f, wf)
    shutil.copy(os.path.join(SEC, "README.md"), PKG); shutil.copy(os.path.join(SEC, "SUBMISSION_CHECKLIST.md"), PKG)
    src = os.path.join(PKG, "source"); os.makedirs(src)
    shutil.copytree(SEC, os.path.join(src, "sections")); shutil.copytree(SCRIPTS, os.path.join(src, "scripts"), ignore=shutil.ignore_patterns("__pycache__"))
    for f in glob.glob(os.path.join(OUT, "05_Workflows", "*.dot")): shutil.copy(f, os.path.join(src, "sections"))

    bad = []
    for p in glob.glob(os.path.join(PKG, "**", "*.pdf"), recursive=True):
        try: assert len(PdfReader(p).pages) > 0
        except Exception as e: bad.append((p, str(e)))
    zipname = os.path.join(ROOT, "..", "Campus_Entry_Authentication_Phase1.zip")
    if os.path.exists(zipname): os.remove(zipname)
    subprocess.run(["zip", "-qr", zipname, "Campus_Entry_Authentication_Phase1"], cwd=os.path.join(ROOT, ".."), check=True)
    print("pdf errors:", bad or "none"); print("zip:", os.path.abspath(zipname), os.path.getsize(zipname)//1024, "KB")

if __name__ == "__main__": main()
