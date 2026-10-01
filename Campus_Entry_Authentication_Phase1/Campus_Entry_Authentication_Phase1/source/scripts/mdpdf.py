#!/usr/bin/env python3
"""Minimal Markdown -> PDF renderer (ReportLab) tuned for this report: headings, paragraphs, bullet lists,
tables with borders and auto column widths, fenced code, blockquotes, images, cover, TOC."""
import re, os, html
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import NextPageTemplate
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
                                PageBreak, Image, KeepTogether, Preformatted, CondPageBreak)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"
if os.path.exists(FONT):
    pdfmetrics.registerFont(TTFont("AU", FONT)); BASE, BOLD = "AU", "AU"
else: BASE, BOLD = "Helvetica", "Helvetica-Bold"
MONO = "Courier"

W, H = A4; ML = MR = 16*mm; MT = 18*mm; MB = 18*mm; CW = W - ML - MR
S = dict(
    body=ParagraphStyle("body", fontName=BASE, fontSize=9.6, leading=13, spaceAfter=4),
    small=ParagraphStyle("small", fontName=BASE, fontSize=7.6, leading=9.4),
    cell=ParagraphStyle("cell", fontName=BASE, fontSize=7.4, leading=9.0),
    cellh=ParagraphStyle("cellh", fontName=BOLD, fontSize=7.4, leading=9.0),
    h1=ParagraphStyle("h1", fontName=BOLD, fontSize=17, leading=21, spaceBefore=6, spaceAfter=8, textColor=colors.HexColor("#111827")),
    h2=ParagraphStyle("h2", fontName=BOLD, fontSize=12.5, leading=16, spaceBefore=10, spaceAfter=4, textColor=colors.HexColor("#1F2937")),
    h3=ParagraphStyle("h3", fontName=BOLD, fontSize=10.5, leading=13, spaceBefore=8, spaceAfter=3, textColor=colors.HexColor("#374151")),
    quote=ParagraphStyle("quote", fontName=BASE, fontSize=9.2, leading=12.5, leftIndent=8, borderPadding=(4, 6, 4, 6), backColor=colors.HexColor("#FFFBEB"), borderColor=colors.HexColor("#F59E0B"), borderWidth=0.8, spaceBefore=4, spaceAfter=6),
    code=ParagraphStyle("code", fontName=MONO, fontSize=7.3, leading=8.8, backColor=colors.HexColor("#F9FAFB"), borderColor=colors.HexColor("#D1D5DB"), borderWidth=0.5, borderPadding=4, spaceBefore=4, spaceAfter=8),
    cap=ParagraphStyle("cap", fontName=BASE, fontSize=8.4, leading=10.5, alignment=TA_CENTER, textColor=colors.HexColor("#374151"), spaceAfter=10),
    cov1=ParagraphStyle("cov1", fontName=BOLD, fontSize=26, leading=32, alignment=TA_CENTER, spaceAfter=10),
    cov2=ParagraphStyle("cov2", fontName=BASE, fontSize=13, leading=17, alignment=TA_CENTER, textColor=colors.HexColor("#374151"), spaceAfter=6),
    cov3=ParagraphStyle("cov3", fontName=BASE, fontSize=10.5, leading=16, alignment=TA_CENTER),
    bullet=ParagraphStyle("bullet", fontName=BASE, fontSize=9.6, leading=13, leftIndent=12, bulletIndent=2, spaceAfter=2),
    toc1=ParagraphStyle("toc1", fontName=BASE, fontSize=9.4, leading=12.5),
)
PH = re.compile(r"(\[(?:DATA REQUIRED|INSERT[^\]]*|ASSUMPTION[^\]]*|PRIMARY|SECONDARY|CONFIRMED / REFUTED / MODIFIED|\.\.\.)\])")

def inline(s):
    s = html.escape(s, quote=False)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s); s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", s)
    s = re.sub(r"`([^`]+)`", r'<font face="%s" size="7.5" backColor="#F3F4F6">\1</font>' % MONO, s)
    s = PH.sub(r'<font backColor="#FEF3C7">\1</font>', s)
    s = s.replace("→", "&#8594;").replace("↔", "&#8596;")
    return s

class Doc(BaseDocTemplate):
    def __init__(self, path, title, **kw):
        super().__init__(path, pagesize=A4, leftMargin=ML, rightMargin=MR, topMargin=MT, bottomMargin=MB, title=title, author="Phase 1 team", **kw)
        self.title_txt = title
        fr = Frame(ML, MB, CW, H-MT-MB, id="f", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        frl = Frame(ML, MB, H-ML-MR, W-MT-MB, id="fl", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id="p", frames=[fr], onPage=self._deco), PageTemplate(id="land", frames=[frl], onPage=self._deco_l, pagesize=landscape(A4))])
    def _deco(self, c, d):
        c.saveState(); c.setFont(BASE, 7.5); c.setFillColor(colors.HexColor("#6B7280"))
        if d.page > 1:
            c.drawString(ML, H-11*mm, self.title_txt[:110]); c.drawRightString(W-MR, H-11*mm, "CSE 347/652 | DES 306/525 · IIIT-Delhi · Phase 1")
            c.drawCentredString(W/2, 10*mm, str(d.page)); c.setStrokeColor(colors.HexColor("#D1D5DB")); c.line(ML, H-12.5*mm, W-MR, H-12.5*mm)
        c.restoreState()
    def _deco_l(self, c, d):
        c.saveState(); c.setFont(BASE, 7.5); c.setFillColor(colors.HexColor("#6B7280"))
        c.drawString(ML, W-11*mm, self.title_txt[:110]); c.drawRightString(H-MR, W-11*mm, "CSE 347/652 | DES 306/525 · IIIT-Delhi · Phase 1")
        c.drawCentredString(H/2, 10*mm, str(d.page)); c.setStrokeColor(colors.HexColor("#D1D5DB")); c.line(ML, W-12.5*mm, H-MR, W-12.5*mm); c.restoreState()
    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph) and fl.style.name == "h1" and getattr(fl, "_toc", True):
            txt = re.sub(r"<[^>]+>", "", fl.getPlainText()); key = f"h{self.seq.nextf('toc')}"
            self.canv.bookmarkPage(key); self.notify("TOCEntry", (0, txt, self.page, key))

def md_blocks(md):
    """Yield (kind, payload) from markdown text."""
    lines = md.splitlines(); i = 0
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("```"):
            j = i+1; buf = []
            while j < len(lines) and not lines[j].startswith("```"): buf.append(lines[j]); j += 1
            yield ("code", "\n".join(buf)); i = j+1; continue
        if ln.strip().startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", c) for c in cells): rows.append(cells)
                i += 1
            yield ("table", rows); continue
        if ln.startswith("#"):
            m = re.match(r"(#+)\s+(.*)", ln); yield (f"h{len(m.group(1))}", m.group(2)); i += 1; continue
        if ln.startswith(">"):
            buf = []
            while i < len(lines) and lines[i].startswith(">"): buf.append(lines[i][1:].strip()); i += 1
            yield ("quote", " ".join(buf)); continue
        if re.match(r"\s*[-*]\s+", ln):
            buf = []
            while i < len(lines) and re.match(r"\s*[-*]\s+", lines[i]):
                buf.append(re.sub(r"\s*[-*]\s+", "", lines[i], 1)); i += 1
            yield ("ul", buf); continue
        if re.match(r"\s*\d+\.\s+", ln):
            buf = []
            while i < len(lines) and re.match(r"\s*\d+\.\s+", lines[i]):
                buf.append(lines[i].strip()); i += 1
            yield ("ol", buf); continue
        if ln.strip() in ("---", "***"): i += 1; continue
        if ln.startswith("![") or ln.startswith("<img"):
            m = re.search(r"\((.+?)\)", ln) or re.search(r'src="(.+?)"', ln); yield ("img", m.group(1)); i += 1; continue
        if ln.strip() == "": i += 1; continue
        buf = []
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "|", "```", ">", "![")) and not re.match(r"\s*([-*]|\d+\.)\s+", lines[i]):
            buf.append(lines[i].strip()); i += 1
        yield ("p", " ".join(buf))

def table_flow(rows):
    ncol = max(len(r) for r in rows); rows = [r + [""]*(ncol-len(r)) for r in rows]
    land = ncol >= 8 and len(rows) > 3
    avail = (H-ML-MR) if land else CW
    # column widths: blend of average and max content length, bounded
    body = rows[1:] or rows
    lens = []
    for c in range(ncol):
        ls = [len(r[c]) for r in body]; avg = sum(ls)/len(ls); mx = max(ls + [len(rows[0][c])])
        lens.append(min(max(0.6*avg + 0.4*mx, 5), 140))
    tot = sum(lens); widths = [avail*l/tot for l in lens]
    minw = 13*mm
    for k in range(ncol):
        if widths[k] < minw: widths[k] = minw
    sc = avail/sum(widths); widths = [w*sc for w in widths]
    data = [[Paragraph(inline(c), S["cellh"] if ri == 0 else S["cell"]) for c in r] for ri, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1, splitByRow=1)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#9CA3AF")), ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E5E7EB")),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 3), ("RIGHTPADDING", (0, 0), (-1, -1), 3), ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                           ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")])]))
    if land: return [NextPageTemplate("land"), PageBreak(), t, NextPageTemplate("p"), PageBreak()]
    return [t, Spacer(1, 6)]

def image_flow(path, caption=None, maxh=None):
    from PIL import Image as PI
    w, h = PI.open(path).size; maxw = CW; maxh = maxh or (H-MT-MB-30*mm)
    sc = min(maxw/w, maxh/h, 1.0 if w > 1200 else 0.6)  # don't upscale small
    fl = [Image(path, width=w*sc, height=h*sc)]
    if caption: fl.append(Paragraph(inline(caption), S["cap"]))
    return [KeepTogether(fl)]

def flow(md, h1_pagebreak=True, first=True):
    out = []
    for kind, pl in md_blocks(md):
        if kind == "h1":
            if h1_pagebreak and not first: out.append(PageBreak())
            first = False; out.append(Paragraph(inline(pl), S["h1"]))
        elif kind == "h2": out += [CondPageBreak(40*mm), Paragraph(inline(pl), S["h2"])]
        elif kind == "h3": out += [CondPageBreak(30*mm), Paragraph(inline(pl), S["h3"])]
        elif kind == "p": out.append(Paragraph(inline(pl), S["body"]))
        elif kind == "quote": out.append(Paragraph(inline(pl), S["quote"]))
        elif kind == "code": out.append(Preformatted(pl, S["code"]))
        elif kind == "ul": out += [Paragraph(inline(x), S["bullet"], bulletText="•") for x in pl]
        elif kind == "ol": out += [Paragraph(inline(x), S["bullet"]) for x in pl]
        elif kind == "table": out += table_flow(pl)
        elif kind == "img": out += image_flow(pl)
    return out

def cover(title, subtitle, note):
    return [Spacer(1, 70*mm), Paragraph(title, S["cov1"]), Paragraph(subtitle, S["cov2"]), Spacer(1, 30*mm),
            Paragraph("CSE 347/652 | DES 306/525 Usable Security and Privacy<br/>IIIT-Delhi · Monsoon 2026 · Instructor: Dr. Arun Balaji Buduru<br/><br/>Phase 1: User Studies to evolve Requirements, Design and Workflows<br/>Submission: 4 October 2026<br/><br/>Team: " + inline("[INSERT TEAM MEMBER NAMES AND ROLL NUMBERS]"), S["cov3"]),
            Spacer(1, 20*mm), Paragraph(f"<i>{note}</i>", S["cov3"]), PageBreak()]

def toc():
    t = TableOfContents(); t.levelStyles = [S["toc1"]]; t.dotsMinLevel = 0
    h = Paragraph("Table of Contents", S["h1"]); h._toc = False
    return [h, t, PageBreak()]

def build(path, title, story, with_toc=False):
    d = Doc(path, title)
    if with_toc: d.multiBuild(story)
    else: d.build(story)
    return path
