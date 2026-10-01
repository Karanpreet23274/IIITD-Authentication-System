#!/usr/bin/env python3
"""Generate 20 lo-fi greyscale wireframes (S01-S20) as PNG using PIL."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), "..", "out", "06_Prototype", "screens")
os.makedirs(OUT, exist_ok=True)

def font(sz, bold=False):
    cands = ["/System/Library/Fonts/Supplemental/Arial Unicode.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf",
             "/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    for c in cands:
        if os.path.exists(c):
            try: return ImageFont.truetype(c, sz, index=1 if (bold and c.endswith("Helvetica.ttc")) else 0)
            except Exception: pass
    return ImageFont.load_default()

F = {k: font(v) for k, v in dict(h=34, t=24, b=18, s=14, xs=12).items()}
FB = {k: font(v, True) for k, v in dict(h=34, t=24, b=18, s=14, xs=12).items()}
INK, LINE, FILL, DARK, MID, LIGHT = "#111", "#444", "#F2F2F2", "#333", "#999", "#E6E6E6"

class W:
    def __init__(self, w, h, title, sid, surface):
        self.im = Image.new("RGB", (w, h), "white"); self.d = ImageDraw.Draw(self.im); self.w, self.h = w, h
        # frame + header
        self.d.rectangle([0, 0, w-1, h-1], outline=INK, width=3)
        self.d.rectangle([0, 0, w, 56], fill=DARK)
        self.d.text((18, 14), f"{sid}  {title}", font=FB["t"], fill="white")
        self.d.text((w-18, 20), surface, font=F["s"], fill="#DDD", anchor="ra")
    def rect(self, x, y, w, h, fill=FILL, outline=LINE, width=2, dash=False):
        if dash:
            for i in range(x, x+w, 12): self.d.line([i, y, min(i+6, x+w), y], fill=outline, width=width); self.d.line([i, y+h, min(i+6, x+w), y+h], fill=outline, width=width)
            for j in range(y, y+h, 12): self.d.line([x, j, x, min(j+6, y+h)], fill=outline, width=width); self.d.line([x+w, j, x+w, min(j+6, y+h)], fill=outline, width=width)
        else: self.d.rectangle([x, y, x+w, y+h], fill=fill, outline=outline, width=width)
    def text(self, x, y, s, f="b", fill=INK, anchor="la", bold=False):
        sw = 1 if (bold and f in ("h", "t")) else 0
        self.d.text((x, y), s, font=F[f], fill=fill, anchor=anchor, stroke_width=sw, stroke_fill=fill)
    def lines(self, x, y, items, f="s", gap=22, fill=INK):
        if isinstance(f, (int, float)): f, gap = "s", f
        if isinstance(gap, str): gap, fill = 22, gap
        for i, s in enumerate(items): self.text(x, y+i*gap, s, f, fill)
    def btn(self, x, y, w, h, label, primary=False, danger=False):
        fill = DARK if primary else ("#BBB" if danger else "white")
        self.rect(x, y, w, h, fill=fill, outline=INK, width=2)
        self.text(x+w//2, y+h//2, label, "b", "white" if primary else INK, "mm", bold=True)
    def photo(self, x, y, w, h, label="PHOTO\n(on file)"):
        self.rect(x, y, w, h, fill=LIGHT); self.d.line([x, y, x+w, y+h], fill=MID, width=2); self.d.line([x+w, y, x, y+h], fill=MID, width=2)
        self.d.ellipse([x+w*0.3, y+h*0.15, x+w*0.7, y+h*0.5], outline=DARK, width=3, fill=LIGHT)
        self.d.rectangle([x+w*0.2, y+h*0.55, x+w*0.8, y+h*0.95], outline=DARK, width=3, fill=LIGHT)
        self.text(x+w//2, y+h-6, label.replace("\n", " "), "xs", DARK, "md")
    def band(self, y, h, label, tone):
        fills = {"ok": "#BDBDBD", "warn": "#D9D9D9", "bad": "#8F8F8F", "info": "#E6E6E6"}
        icons = {"ok": "✓", "warn": "!", "bad": "✕", "info": "i"}
        self.rect(16, y, self.w-32, h, fill=fills[tone], outline=INK, width=3)
        self.text(40, y+h//2, icons[tone], "h", INK, "lm", bold=True); self.text(90, y+h//2, label, "h", INK, "lm", bold=True)
        self.text(self.w-28, y+h//2, {"ok": "GREEN", "warn": "AMBER", "bad": "RED", "info": "GREY"}[tone], "xs", DARK, "rm")
    def status_bar(self, mode="ONLINE", age="list 00:04 ago", extra=""):
        self.rect(0, 56, self.w, 30, fill=LIGHT, outline=LIGHT, width=1)
        self.text(18, 71, f"● {mode}   |   {age}   |   Reader OK   |   Alerts 0   {extra}", "s", DARK, "lm")
    def note(self, s):
        self.rect(16, self.h-80, self.w-32, 66, fill="#FAFAFA", outline=MID, width=1, dash=True)
        self.text(26, self.h-72, "Annotations:", "xs", DARK)
        maxc = int((self.w-60)/6.3); words, line, out = s.split(), "", []
        for wd in words:
            if len(line)+len(wd)+1 > maxc: out.append(line); line = wd
            else: line = (line+" "+wd).strip()
        out.append(line)
        for i, l in enumerate(out[:3]): self.text(26, self.h-57+i*15, l, "xs", DARK)
    def save(self, name):
        self.im.save(os.path.join(OUT, name + ".png"), optimize=True)

TAB = (1440, 900); PH = (480, 900); WEB = (1440, 900)

# ---------- user indicator screens (phone-portrait size) ----------
def s01():
    w = W(*PH, "Welcome / Gate", "S01", "User indicator"); 
    w.rect(60, 180, 360, 300, fill=LIGHT); w.d.ellipse([170, 250, 310, 390], outline=INK, width=4, fill="white"); w.rect(205, 290, 70, 50, fill=LIGHT)
    w.text(240, 420, "Tap card or phone", "t", INK, "mm", bold=True); w.text(240, 452, "[HI] कार्ड या फ़ोन टैप करें", "s", DARK, "mm")
    w.rect(140, 540, 200, 90, fill="white", dash=True); w.text(240, 585, "or show app QR here", "s", DARK, "mm")
    w.d.ellipse([200, 680, 230, 710], fill="#777"); w.text(245, 695, "Lane ready", "s", DARK, "lm")
    w.text(240, 760, "No personal data shown. Reader at 0.9-1.1 m height.", "xs", MID, "mm")
    w.note("Idle; nothing from previous person. Status dot: grey=closed, amber=offline.  USE-14, SEC-18, PRIV-10"); w.save("S01_Welcome_Gate")
def s02():
    w = W(*PH, "Scan / Tap ID", "S02", "User indicator")
    for r in (70, 95, 120): w.d.ellipse([240-r, 330-r, 240+r, 330+r], outline=MID, width=3)
    w.text(240, 330, "card / phone", "s", DARK, "mm"); w.text(240, 480, "Hold still…", "t", INK, "mm", bold=True)
    w.rect(120, 530, 240, 160, fill="white", dash=True); w.text(240, 600, "QR: align code,\ntilt to avoid glare", "s", DARK, "mm")
    w.rect(60, 720, 360, 50, fill=LIGHT); w.text(240, 745, "Not reading? Try your card or NFC.", "xs", DARK, "mm")
    w.note("Hint shown after 2 failed reads. Nonce challenge starts here; nothing accepted until complete.  SEC-01, USE-04, USE-12"); w.save("S02_Scan_Tap")
def s03():
    w = W(*PH, "Authenticating", "S03", "User indicator + guard strip")
    w.d.arc([170, 250, 310, 390], 30, 300, fill=INK, width=8); w.text(240, 440, "Verifying…", "t", INK, "mm", bold=True)
    w.text(240, 475, "usually under 2 seconds", "s", DARK, "mm"); w.rect(60, 560, 360, 36, fill=LIGHT); w.rect(60, 560, 180, 36, fill="#999")
    w.text(240, 640, "Please do not tap again", "s", DARK, "mm")
    w.text(240, 700, "> 2 s: \"Taking longer than usual\"", "xs", MID, "mm")
    w.note("Timeout -> DENY-NOT RECOGNISED, never ALLOW. Which step (authn/authz) is hidden.  SEC-09, USE-06 (HE-1 fix)"); w.save("S03_Authenticating")
def s04():
    w = W(*PH, "Authentication Success", "S04", "User indicator")
    w.rect(0, 86, 480, 814, fill="#BDBDBD"); w.text(240, 330, "✓", "h", INK, "mm", bold=True); w.d.ellipse([150, 240, 330, 420], outline=INK, width=6)
    w.text(240, 500, "Welcome — go ahead", "t", INK, "mm", bold=True); w.text(240, 540, "[HI] स्वागत है — आगे बढ़ें", "s", DARK, "mm")
    w.text(240, 620, "♪ short tone  •  auto-clears on pass / 5 s", "s", DARK, "mm"); w.text(240, 700, "(No name shown to bystanders)", "s", DARK, "mm")
    w.note("GREEN. Shown only after authn AND authz pass. Name withheld on user side.  FR-05, USE-08, PRIV-10"); w.save("S04_Auth_Success")

# ---------- guard tablet screens ----------
def guard_result(sid, fname, title, band_label, tone, name, role, body, steps, buttons, flagged=False, identity=True, note=""):
    w = W(*TAB, title, sid, "Guard tablet 10\""); w.status_bar()
    if identity: w.photo(40, 240, 440, 430)
    else:
        w.rect(40, 240, 440, 430, fill=LIGHT, dash=True); w.text(260, 455, "No identity known\n(authentication failed)", "b", DARK, "mm")
    w.band(110, 110, band_label, tone)
    if identity:
        w.text(520, 250, name, "h", INK, bold=True); w.rect(520, 300, 150, 36, fill=LIGHT); w.text(595, 318, role, "s", INK, "mm", bold=True)
    w.lines(520, 360 if identity else 250, body, "b", 30)
    y = 470 if identity else 360
    w.rect(520, y, 880, 190, fill="#FAFAFA"); w.text(540, y+14, "NEXT STEP", "s", DARK, bold=True); w.lines(540, y+44, steps, "b", 30)
    bx = 1400
    for lbl, prim, dang in reversed(buttons):
        bw = 260; bx -= bw+20; w.btn(bx, 690, bw, 70, lbl, prim, dang)
    if flagged: w.text(1400, 775, "► Event flagged for supervisor review", "s", DARK, "ra")
    w.text(40, 800, "Gate: Main  •  11:42:07  •  Hidden: full name, roll no., programme, hostel, phone, credential ID", "xs", MID)
    w.note(note); w.save(fname)

def s05():
    guard_result("S05", "S05_Authorization_Success", "Authorization Success", "ALLOWED", "ok", "Aarav", "STUDENT",
        ["Authenticated and authorized for this gate.", "Confirm the face matches the photo.", "Method: ▣ card"],
        ["Let the person pass.", "If the face does NOT match → press [Mismatch]."],
        [("Mismatch  ✕", False, True)], note="No [Allow] exists. Photo from server, not card. Mismatch needs confirm-tap (HE-12: first tap turns user indicator red).  FR-12, SEC-08, USE-05, PRIV-03")
def s06():
    guard_result("S06", "S06_Access_Denied_Not_Recognised", "Access Denied — Not Recognised", "NOT RECOGNISED", "bad", "", "",
        ["The reader could not verify this card or code.", "This can happen with damaged, copied or", "non-campus credentials."],
        ["Do not admit.", "Direct the person to the Security Office.", "If they insist → [Call supervisor]."],
        [("Call supervisor", False, False), ("Done", True, False)], identity=False,
        note="Authentication failure: no identity. Guard never judges card authenticity. User side: generic red message. S06b variant (NOT PERMITTED here/now) is AMBER with photo.  SEC-01, SEC-04, USE-03, HE-15 wording")
def s07():
    guard_result("S07", "S07_Credential_Expired", "Credential Expired", "EXPIRED", "warn", "Meher", "STUDENT",
        ["Credential validity has ended.", "Identity is known; entry not authorized."],
        ["Do not admit.", "Direct to the ID cell for renewal.", "Person says they are a current member → [Call supervisor]."],
        [("Call supervisor", False, False), ("Done", True, False)], note="Authorization failure, identity known. Student gets private explanation in app. User side: 'Credential expired — renew at ID cell'.  SEC-03, USE-03")
def s08():
    guard_result("S08", "S08_Credential_Revoked", "Credential Revoked", "REVOKED", "bad", "Meher", "STUDENT",
        ["This credential has been revoked.", "(Reason is not shown to gate staff.)"],
        ["Do not admit.", "Direct to the Security Office.", "Do not discuss the reason."],
        [("Call supervisor", False, False), ("Done", True, False)], flagged=True, note="Reason withheld (lost vs disciplinary). Flagged automatically. User side identical to S06 for bystanders.  SEC-02, SEC-08, DP-13")
def s09():
    guard_result("S09", "S09_Suspicious_Credential", "Suspicious Credential", "SUSPICIOUS — SUPERVISOR ALERTED", "bad", "Aarav", "STUDENT",
        ["Repeated failed attempts or face mismatch recorded.", "Supervisor has already been notified."],
        ["Do not admit.", "Keep the person at the gate if safe to do so.", "Wait for supervisor. Supervisor will clear this alert."],
        [("Call supervisor", True, False), ("Done", False, False)], flagged=True, note="SEC-13 threshold or [Mismatch]. Reader rate-limited. Photo shown only if identity known.  TH-02/04/06")
def s10():
    w = W(*TAB, "Reader Failure", "S10", "Guard tablet"); w.status_bar("ONLINE", "list 00:04 ago", "| Reader: FAULT")
    w.band(110, 110, "READER OFFLINE — LANE 1", "info"); w.lines(40, 250, ["Cause: self-test failed  /  tamper detected  /  no power", "This lane is disabled by the server until checked. The reader holds no secret keys."], "b", 30)
    w.rect(40, 340, 1360, 170, fill="#FAFAFA"); w.text(60, 354, "NEXT STEP", "s", DARK, bold=True)
    w.lines(60, 384, ["Direct people to Lane 2 (reader OK).", "If no other lane is available → start Manual Verification Mode (supervisor PIN)."], "b", 30)
    w.btn(40, 560, 420, 70, "Report reader problem", False); w.btn(500, 560, 520, 70, "Start Manual Verification Mode (PIN)", False, True); w.btn(1060, 560, 340, 70, "Call supervisor", True)
    w.text(40, 680, "Technical diagnostics are available to the auditor, not here.", "s", MID)
    w.note("Reader disabled server-side; tamper logged; cert revocable. Manual mode requires supervisor.  SEC-18, FR-14, FR-19, USE-06"); w.save("S10_Reader_Failure")
def s11():
    w = W(*TAB, "Network Failure (Offline-verified)", "S11", "Guard tablet"); w.status_bar("OFFLINE — verifying locally", "Last update from server: 1 h 20 m ago (limit 4 h)", "")
    w.rect(16, 86, 1408, 30, fill="#BBB", outline="#BBB", width=1)
    w.band(140, 100, "ALLOWED", "ok"); w.photo(40, 260, 400, 400); w.text(480, 270, "Aarav", "h", INK, bold=True); w.rect(480, 320, 150, 36, fill=LIGHT); w.text(555, 338, "STUDENT", "s", INK, "mm", bold=True)
    w.lines(480, 380, ["Normal checks continue using cached keys and the signed revocation list.", "Events are stored on the reader and sent when the connection returns."], "b", 30)
    w.rect(480, 480, 920, 140, fill="#FAFAFA", dash=True); w.text(500, 494, "IF LIMIT (4 h) IS REACHED", "s", DARK, bold=True)
    w.lines(500, 524, ["A dialog will require Manual Verification Mode (supervisor PIN).", "Until then, work normally."], "b", 30)
    w.btn(1120, 690, 280, 70, "Mismatch  ✕", False, True)
    w.note("Bounded staleness visible as plain language (HE-2 fix). Automatic transition at limit; no auto-ALLOW.  SEC-19, FR-14, USE-06"); w.save("S11_Network_Failure")
def s12():
    w = W(*TAB, "Manual Verification / Fallback", "S12", "Guard tablet (or paper form)"); w.status_bar("MANUAL VERIFICATION MODE", "supervisor: SUP-07 approved start", "")
    w.rect(16, 86, 1408, 30, fill="#8F8F8F", outline="#8F8F8F", width=1)
    w.text(40, 130, "All entries in this mode are recorded with your ID and reviewed.", "b", INK, bold=True)
    steps = [("1", "Ask for card or app screen"), ("2", "Compare face with the card photo"), ("3", "Credential shown:"), ("4", "Photo check:"), ("5", "Supervisor approval:"), ("6", "Result:")]
    y = 180
    for n, s in steps:
        w.d.ellipse([40, y, 80, y+40], outline=INK, width=2, fill=LIGHT); w.text(60, y+20, n, "b", INK, "mm", bold=True); w.text(100, y+8, s, "b", INK); y += 70
    for i, lbl in enumerate(["Card", "Phone", "None"]): w.btn(420+i*170, 318, 150, 46, lbl)
    for i, lbl in enumerate(["Matches", "Does not match"]): w.btn(420+i*230, 388, 210, 46, lbl)
    w.btn(420, 458, 400, 46, "Request supervisor approval (PIN)"); w.btn(840, 458, 300, 46, "Approve next 10 min (SUP)")
    w.rect(420, 528, 500, 46, fill=LIGHT); w.text(670, 551, "Admit  /  Do not admit  (set by supervisor)", "s", INK, "mm")
    w.rect(40, 620, 1360, 60, fill="#FAFAFA", dash=True); w.text(60, 650, "! No roster lookup. No personal data typed. Egress is never blocked.    [Emergency ingress — supervisor only, reason required]", "s", DARK, "lm")
    w.note("Weakest mode by design: every decision carries guard + supervisor IDs, flagged. HE-6: collapse to 3 big steps in next iteration.  FR-14, FR-19, FR-20, TH-17"); w.save("S12_Manual_Verification")

# ---------- visitor ----------
def s13():
    w = W(*WEB, "Visitor Registration (host request)", "S13", "Host web/app  •  guard-tablet variant inset")
    w.text(40, 100, "Request a visitor pass", "t", INK, bold=True)
    fields = [("Visitor name", "Dr. Fernandes"), ("Purpose (category)", "▾ Academic / Official / Personal / Vendor"), ("Date", "01 Oct 2026"), ("Time window", "14:00  —  17:00   (max 12 h, policy)"), ("Gate(s)", "☑ Main   ☐ East   ☐ Vehicle"), ("Send pass to", "e-mail or phone — used ONLY to deliver the pass; deleted at visit end")]
    y = 150
    for lbl, val in fields:
        w.text(40, y, lbl, "s", DARK, bold=True); w.rect(40, y+22, 700, 44, fill="white"); w.text(52, y+44, val, "b", INK, "lm"); y += 90
    w.btn(40, y+10, 260, 56, "Submit request", True); w.btn(320, y+10, 160, 56, "Cancel")
    w.rect(800, 150, 600, 560, fill="#FAFAFA"); w.text(820, 165, "GUARD VARIANT — Visitor without approval", "s", DARK, bold=True)
    w.text(820, 200, "Host (search by name / department)", "s", DARK); w.rect(820, 222, 560, 44, fill="white"); w.text(832, 244, "Prof. R… — CSE", "b", INK, "lm")
    w.text(820, 290, "Visitor first name", "s", DARK); w.rect(820, 312, 560, 44, fill="white")
    w.btn(820, 380, 560, 56, "Send approval request to host's phone", True)
    w.rect(820, 460, 560, 80, fill=LIGHT, dash=True); w.text(1100, 500, "Waiting for host…  (no entry until approved)", "s", DARK, "mm")
    w.text(820, 570, "Guard never enters or sees visitor contact details.", "s", MID)
    w.note("Purpose is a category, not free text. Max window enforced (HE-5). Guard variant: no typing beyond host name.  FR-10, PRIV-09, SEC-16"); w.save("S13_Visitor_Registration")
def s14():
    w = W(*PH, "Visitor Approval", "S14", "Approver / host phone")
    w.text(240, 100, "Approval request", "t", INK, "mm", bold=True)
    w.rect(30, 140, 420, 380, fill="white"); 
    w.lines(50, 160, ["Visitor:  Dr. Fernandes", "Purpose:  Academic", "Date:  01 Oct 2026", "Window:  14:00 — 17:00", "Gate:  Main", "Requested by:  Prof. R… (CSE)", "", "Source:  gate walk-in  •  waiting 0:42"], "b", 40)
    w.btn(30, 560, 420, 60, "Approve", True); w.btn(30, 640, 200, 60, "Decline", False, True); w.btn(250, 640, 200, 60, "Edit window")
    w.text(240, 740, "Approving creates a signed, single-entry pass.", "xs", DARK, "mm")
    w.note("MFA session; decision logged. Visitor contact not shown (not needed to decide).  SEC-12, PRIV-01"); w.save("S14_Visitor_Approval")
def s15():
    w = W(*PH, "Temporary Visitor Credential", "S15", "Visitor phone / printed slip")
    w.text(240, 100, "VISITOR PASS", "t", INK, "mm", bold=True)
    x0, y0, n, c = 110, 140, 13, 20
    import random; random.seed(7)
    for i in range(n):
        for j in range(n):
            if random.random() < 0.45 or (i < 4 and j < 4) or (i < 4 and j > 8) or (i > 8 and j < 4): w.d.rectangle([x0+j*c, y0+i*c, x0+j*c+c-1, y0+i*c+c-1], fill=INK)
    w.lines(60, 430, ["Dr. Fernandes", "Host: Prof. R… (CSE)", "Valid: 01 Oct 2026, 14:00 — 17:00", "Gate: Main   •   Single entry"], "b", 34)
    w.rect(40, 590, 400, 110, fill=LIGHT); w.text(240, 645, "Show this at the gate. Do not forward.\nData deleted 30 days after your visit.", "s", DARK, "mm")
    w.note("Server-signed token (window, gate set, use count). No personal data in QR beyond pass ID. HE-14: host first name + dept.  SEC-16, PRIV-07"); w.save("S15_Temporary_Visitor_Credential")

# ---------- dashboard / admin ----------
def s16():
    w = W(*TAB, "Security Guard Dashboard", "S16", "Guard tablet — home"); w.status_bar("ONLINE", "last update 00:04 ago", "| 11:42  | ?")
    w.rect(40, 110, 820, 400, fill=LIGHT); w.text(450, 290, "Waiting for tap…", "h", DARK, "mm"); w.text(450, 340, "Result appears here for 5 s, then clears", "s", MID, "mm")
    w.rect(900, 110, 500, 400, fill="#FAFAFA"); w.text(920, 124, "ALERTS (3 shown, 0 more)", "s", DARK, bold=True)
    for i, a in enumerate(["► 11:31  Suspicious — C-7f3a…  (supervisor ack.)", "► 10:58  Mismatch recorded — Lane 1  (open)", "i 09:12  Reader Lane 2 self-test OK after restart"]):
        w.rect(920, 160+i*80, 460, 64, fill="white"); w.text(932, 192+i*80, a, "s", INK, "lm")
    w.btn(40, 550, 400, 70, "Visitor without approval"); w.btn(470, 550, 330, 70, "Call supervisor", True); w.btn(830, 550, 330, 70, "Report reader problem"); w.btn(1190, 550, 210, 70, "? Legend")
    w.rect(40, 660, 1360, 60, fill="white"); w.text(60, 690, "Today at this gate:  entries 1,284   •   denied 17   •   manual 0        (aggregate only — no list of who entered)", "b", INK, "lm")
    w.note("No search; no identity list. Alerts show pseudonym until person is at gate. HE-8 cap, HE-10 legend added.  SEC-07, PRIV-03, USE-06"); w.save("S16_Guard_Dashboard")
def s17():
    w = W(*WEB, "Admin Credential Management", "S17", "Issuer console"); 
    w.rect(0, 56, 1440, 30, fill=LIGHT, outline=LIGHT); w.text(18, 71, "Role: ISSUER   •   MFA ✓ (TOTP)   •   session 14:59", "s", DARK, "lm")
    w.text(40, 100, "Roster search", "s", DARK, bold=True); w.rect(40, 122, 600, 44, fill="white"); w.text(52, 144, "Meher S…  /  MT2026…", "b", INK, "lm"); w.btn(660, 122, 120, 44, "Search")
    w.rect(40, 190, 480, 520, fill="#FAFAFA"); w.photo(60, 210, 180, 220, "PHOTO"); w.lines(260, 215, ["Meher S…", "Roll: MT2026…", "Programme: M.Tech CSE", "Role: STUDENT", "", "Fields stored: only these.", "No phone / address / hostel."], "s", INK, 26)
    w.btn(60, 460, 200, 50, "Issue new card", True); w.btn(280, 460, 220, 50, "Send phone enrolment"); w.text(60, 540, "Key material: present in HSM (never displayed)", "xs", MID)
    w.rect(560, 190, 840, 520, fill="white"); w.text(580, 204, "CREDENTIALS", "s", DARK, bold=True)
    rows = [("Card ····4821", "REVOKED", "lost — reported 28 Sep 2026", ""), ("Card ····9130", "ACTIVE", "valid to 31 Jul 2028", "Renew  Suspend  Revoke"), ("Phone (Android)", "ACTIVE", "enrolled 28 Sep 2026", "Suspend  Revoke")]
    for i, (c, st, v, acts) in enumerate(rows):
        y = 240+i*90; w.rect(580, y, 800, 74, fill="#FAFAFA"); w.text(600, y+37, c, "b", INK, "lm", bold=True); w.rect(800, y+20, 120, 34, fill=LIGHT); w.text(860, y+37, st, "s", INK, "mm", bold=True); w.text(940, y+37, v, "s", DARK, "lm")
        if acts: w.text(1370, y+37, acts, "s", INK, "rm")
    w.rect(760, 540, 560, 150, fill="white", outline=INK, width=3); w.text(780, 556, "CONFIRM: Revoke Card ····9130?", "b", INK, bold=True)
    w.lines(780, 590, ["Reason: ▾ Lost / Stolen / Disciplinary / Left", "Effect: denied at all 6 gates within 30 s. Cannot be undone."], "s", DARK, 24); w.btn(780, 640, 160, 40, "Cancel"); w.btn(960, 640, 220, 40, "Revoke permanently", False, True)
    w.note("Roster match required to issue; two-step confirm with exact effect; reason dropdown; all logged. Issuer ≠ Auditor.  FR-07, SEC-07, SEC-11, SEC-12, USE-10"); w.save("S17_Admin_Credential_Management")
def s18():
    w = W(*PH, "Lost ID / Revoke Credential", "S18", "Student app")
    w.text(240, 100, "My credentials", "t", INK, "mm", bold=True)
    w.rect(30, 140, 420, 80, fill="white"); w.text(45, 165, "Card ····9130", "b", INK, bold=True); w.rect(330, 160, 100, 30, fill=LIGHT); w.text(380, 175, "ACTIVE", "xs", INK, "mm", bold=True); w.text(45, 195, "Tap to manage", "xs", MID)
    w.rect(30, 235, 420, 80, fill="white"); w.text(45, 260, "Phone (this device)", "b", INK, bold=True); w.rect(330, 255, 100, 30, fill=LIGHT); w.text(380, 270, "ACTIVE", "xs", INK, "mm", bold=True)
    w.rect(20, 360, 440, 420, fill="white", outline=INK, width=3); w.text(240, 385, "Report card lost or stolen?", "b", INK, "mm", bold=True)
    w.lines(40, 420, ["• This will PERMANENTLY disable card ····9130.", "• Your phone credential keeps working.", "• A replacement request will be created.", "• This cannot be undone.", "", "Type DISABLE to confirm:"], "s", INK, 28)
    w.rect(40, 600, 400, 44, fill="white"); w.text(52, 622, "DISABLE", "b", MID, "lm")
    w.btn(40, 660, 400, 52, "Report and disable", True); w.btn(40, 722, 400, 44, "Cancel")
    w.note("Self-service, immediate, irreversible (HE-13: typed confirm). After: card REVOKED, 'Replacement requested — collect at ID cell with photo ID'.  FR-09, SEC-17, USE-10"); w.save("S18_Lost_ID_Revoke")
def s19():
    w = W(*WEB, "Entry Logs", "S19", "Auditor console")
    w.rect(0, 56, 1440, 30, fill=LIGHT, outline=LIGHT); w.text(18, 71, "Role: AUDITOR   •   MFA ✓   •   Chain verified ✓ (last checkpoint 12:00)", "s", DARK, "lm")
    w.text(40, 100, "Filters:", "s", DARK, bold=True)
    for i, f in enumerate(["Gate ▾ Main", "From ▾ 01 Oct 00:00", "To ▾ 01 Oct 12:00", "Decision ▾ All", "Method ▾ All", "☑ Flagged only"]): w.rect(120+i*210, 92, 195, 36, fill="white"); w.text(130+i*210, 110, f, "s", INK, "lm")
    hdr = ["Time", "Gate", "Method", "Decision", "Credential (pseudonym)", "Flags", "Guard ID", ""]
    xs = [40, 150, 240, 340, 520, 760, 900, 1040]
    w.rect(40, 150, 1360, 36, fill=DARK)
    for x, h in zip(xs, hdr): w.text(x+8, 168, h, "s", "white", "lm", bold=True)
    rows = [("11:31:02", "Main", "card", "DENY-SUSPICIOUS", "C-7f3a9c…", "► velocity", "—"), ("10:58:41", "Main", "card", "DENY-SUSPICIOUS", "C-21be0d…", "► mismatch", "G-14"), ("09:40:17", "Main", "manual", "ALLOW (manual)", "— (type: card)", "► manual", "G-14 / SUP-07"), ("08:52:09", "East", "QR", "DENY-REVOKED", "C-9a0f31…", "► revoked", "—"), ("08:51:55", "Main", "NFC", "ALLOW", "C-0cd7e2…", "", "—")]
    for i, r in enumerate(rows):
        y = 186+i*44; w.rect(40, y, 1360, 44, fill="#FAFAFA" if i % 2 else "white")
        for x, v in zip(xs, r): w.text(x+8, y+22, v, "s", INK, "lm")
        w.rect(1050, y+8, 130, 28, fill="white"); w.text(1115, y+22, "Re-identify", "xs", INK, "mm")
    w.rect(760, 430, 640, 260, fill="white", outline=INK, width=3); w.text(780, 446, "RE-IDENTIFY  C-7f3a9c…", "b", INK, bold=True)
    w.text(780, 482, "Case reference (required)", "s", DARK); w.rect(780, 502, 600, 40, fill="white"); w.text(792, 522, "SEC-2026-0142", "s", INK, "lm")
    w.text(780, 552, "Justification (required)", "s", DARK); w.rect(780, 572, 600, 40, fill="white")
    w.text(780, 625, "! This action is logged and visible to the second administrator.", "xs", DARK); w.btn(780, 645, 140, 36, "Cancel"); w.btn(940, 645, 200, 36, "Confirm", True)
    w.text(40, 420, "No edit or delete controls exist on this screen. Export is pseudonymous.", "s", MID)
    w.note("Pseudonymous by default; re-identification justified + logged + visible to second admin; chain integrity indicator.  SEC-10, SEC-15, PRIV-04, PRIV-06, FR-15"); w.save("S19_Entry_Logs")
def s20():
    w = W(*WEB, "Privacy / Access-Control", "S20", "Student app (left)  •  Policy admin (right)")
    w.rect(40, 100, 620, 700, fill="#FAFAFA"); w.text(60, 114, "STUDENT — Privacy & my data", "b", INK, bold=True)
    secs = [("What is collected", "name, roll no., programme, photo, role, credential status, entry events (pseudonymous)"), ("Why", "access decisions; security incidents; system integrity. NOT attendance or tracking."), ("Who can see it", "Guard: photo + first name + role, only when you tap. Auditor: pseudonymous; re-identify only with a case ref."), ("How long", "entry events 90 days; flagged events until case closed + 1 year"), ("My entry records (last 90 days)", "01 Oct 08:51 Main NFC ALLOW  •  30 Sep 21:14 Main card ALLOW  •  …"), ("My credentials", "Card ····9130 ACTIVE  •  Phone ACTIVE  •  [Request correction]  [Full notice]")]
    y = 150
    for t, b in secs:
        w.text(60, y, t, "s", DARK, bold=True); w.rect(60, y+20, 580, 60, fill="white"); 
        # wrap
        words, line, lines = b.split(), "", []
        for wd in words:
            if len(line)+len(wd) > 78: lines.append(line); line = wd
            else: line = (line+" "+wd).strip()
        lines.append(line); w.lines(70, y+30, lines[:2], "xs", 18); y += 105
    w.rect(700, 100, 700, 700, fill="#FAFAFA"); w.text(720, 114, "POLICY ADMIN — Gate access policy  (v12, edited by PA-02, 29 Sep)", "b", INK, bold=True)
    hdr = ["Gate", "Students", "Staff", "Visitors (pass)", "Contractors"]; xs = [720, 840, 960, 1080, 1240]
    w.rect(720, 150, 660, 36, fill=DARK)
    for x, h in zip(xs, hdr): w.text(x+8, 168, h, "s", "white", "lm", bold=True)
    rows = [("Main", "06:00–23:00", "24 h", "pass window", "08:00–18:00"), ("East", "06:00–22:00", "24 h", "pass window", "DENY"), ("Vehicle", "DENY", "24 h", "pass window", "08:00–18:00"), ("Any other role", "DENY", "DENY", "DENY", "DENY")]
    for i, r in enumerate(rows):
        y = 186+i*44; w.rect(720, y, 660, 44, fill=LIGHT if i == 3 else ("#FAFAFA" if i % 2 else "white"))
        for x, v in zip(xs, r): w.text(x+8, y+22, v, "s", INK, "lm", bold=(i == 3))
    w.text(720, 372, "Last row is the secure default and cannot be edited.", "xs", MID)
    w.rect(760, 420, 600, 230, fill="white", outline=INK, width=3); w.text(780, 436, "CONFIRM policy change", "b", INK, bold=True)
    w.lines(780, 470, ["Gate: East  •  Role: Students", "Before: 06:00–22:00     After: 06:00–23:00", "Applies to 2 readers. MFA step-up required.", "Change is versioned and logged (v13)."], "s", INK, 26)
    w.btn(780, 590, 140, 40, "Cancel"); w.btn(940, 590, 200, 40, "Apply (MFA)", True)
    w.note("Transparency + own-data access (DPDP). Deny-by-default made visible. Policy edits: MFA, before/after, versioned.  PRIV-07, PRIV-08, FR-18, SEC-11, DP-3"); w.save("S20_Privacy_Access_Control")

if __name__ == "__main__":
    for fn in [s01, s02, s03, s04, s05, s06, s07, s08, s09, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20]: fn()
    print(len(os.listdir(OUT)), "screens written to", OUT)
