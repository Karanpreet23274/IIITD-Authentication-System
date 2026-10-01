#!/usr/bin/env python3
"""Generate all workflow/architecture diagrams as PNG + SVG via Graphviz."""
import os, subprocess, textwrap
OUT = os.path.join(os.path.dirname(__file__), "..", "out", "05_Workflows")
os.makedirs(OUT, exist_ok=True)

STYLE = '''
  graph [fontname="Helvetica", fontsize=11, pad=0.3, nodesep=0.35, ranksep=0.45, bgcolor="white"];
  node  [fontname="Helvetica", fontsize=10, shape=box, style="rounded,filled", fillcolor="#F4F6F8", color="#334155", penwidth=1.1, margin="0.15,0.08"];
  edge  [fontname="Helvetica", fontsize=9, color="#334155", arrowsize=0.75];
'''
GREEN='fillcolor="#DCFCE7", color="#166534"'
RED='fillcolor="#FEE2E2", color="#991B1B"'
AMBER='fillcolor="#FEF3C7", color="#92400E"'
BLUE='fillcolor="#DBEAFE", color="#1E3A8A"'
GREY='fillcolor="#E5E7EB", color="#374151"'
DEC='shape=diamond, style="filled", fillcolor="#FFFFFF", color="#334155"'
STORE='shape=cylinder, style="filled", fillcolor="#EDE9FE", color="#4C1D95"'
EXT='shape=box, style="filled", fillcolor="#FFFFFF", color="#111827", penwidth=1.6'
PROC='shape=ellipse, style="filled", fillcolor="#F0F9FF", color="#0C4A6E"'

D = {}

D["Overall_System"] = f'''digraph G {{ {STYLE} rankdir=LR;
  label="Figure J-1. Overall system: user studies drove the requirements; every decision is authenticated, authorized and logged"; labelloc=t; fontsize=13;
  subgraph cluster_u {{ label="Users"; style=dashed; color="#64748B";
    Student [{EXT}]; Visitor [{EXT}]; Host [{EXT} label="Host\\n(faculty/staff)"]; Admin [{EXT} label="Administrator\\n(Issuer/Approver/\\nAuditor/Policy)"]; }}
  subgraph cluster_g {{ label="Gate (trust boundary B1/B2)"; style=dashed; color="#64748B";
    Cred [label="Credential\\nsmart card / phone NFC /\\ndynamic QR / visitor pass"]; Reader [label="Reader + user indicator\\n(no master keys)"]; Guard [label="Guard tablet\\nphoto + name + decision"]; }}
  subgraph cluster_s {{ label="Services (B3/B4)"; style=dashed; color="#64748B";
    Auth [label="Authentication\\nService" {BLUE}]; Val [label="Validity check\\n(status, expiry)" {BLUE}]; Authz [label="Authorization /\\nPolicy Engine" {BLUE}]; Dec [label="Signed access\\ndecision" {GREEN}];
    Store [label="Credential & Identity\\nStore" {STORE}]; Pol [label="Policy Store" {STORE}]; Log [label="Audit Log\\n(append-only, hash-chained)" {STORE}]; HSM [label="HSM / KMS\\n(keys)" {STORE}]; VStore [label="Visitor passes" {STORE}]; }}
  Student -> Cred [label="tap / show"]; Visitor -> Cred [label="show pass"];
  Cred -> Reader [label="challenge-response\\nor signed token"]; Reader -> Auth [label="mTLS 1.3"];
  Auth -> HSM [dir=both, label="verify"]; Auth -> Val -> Store [dir=both]; Val -> Authz; Authz -> Pol [dir=both]; Authz -> Dec;
  Dec -> Reader [label="ALLOW / DENY-class"]; Dec -> Guard; Dec -> Log;
  Reader -> Log [label="buffered events\\n(offline)", style=dashed];
  Admin -> Store [label="issue / revoke\\n(MFA, logged)"]; Admin -> Pol [label="edit policy"]; Admin -> Log [label="review\\n(pseudonymous)"];
  Host -> VStore [label="request pass"]; VStore -> Visitor [label="signed QR"];
  Student -> Store [label="self-service:\\nreport lost, view own", style=dashed];
  Auth -> Reader [label="signed revocation list\\n+ public keys (sync)", style=dotted, dir=back];
}}'''

D["Student_Authentication_Workflow"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-2. Student authentication workflow (screens S01-S09, S16)"; labelloc=t; fontsize=13;
  S01 [label="S01 Reader idle\\n\\"Tap card or phone\\""]; S02 [label="S02 Credential detected\\nnonce challenge / token read"]; S03 [label="S03 Verifying (<=1 s)"];
  Online [label="Server reachable?" {DEC}]; Local [label="Verify locally:\\ncached public keys +\\nsigned revocation list" {AMBER}]; Srv [label="Auth Service verifies\\n(HSM)" {BLUE}];
  A [label="AUTHENTICATED?\\n(key possession proven)" {DEC}];
  V [label="Status & validity?" {DEC}]; Z [label="AUTHORIZED?\\nrole x gate x time x alerts" {DEC}];
  S06 [label="S06 DENY - NOT RECOGNISED\\nno identity known\\n-> Security Office" {RED}];
  S07 [label="S07 DENY - EXPIRED\\nidentity known\\n-> ID cell (renew)" {AMBER}];
  S08 [label="S08 DENY - REVOKED / SUSPENDED\\nreason not shown\\n-> Security Office (flagged)" {RED}];
  S09 [label="S09 DENY - SUSPICIOUS\\nsupervisor alerted (flagged)" {RED}];
  S06b [label="S06b DENY - NOT PERMITTED\\nat this gate/time" {AMBER}];
  S04 [label="S04 User: green + tone\\n\\"Welcome - go ahead\\"" {GREEN}]; S05 [label="S05 Guard: photo + first name\\n+ role + ALLOWED" {GREEN}];
  Face [label="Guard: face matches\\nserver photo?" {DEC}]; Pass [label="Enter. Auto-clear\\n(<=5 s)" {GREEN}];
  Log [label="Audit log event\\n(pseudonym, gate, time,\\nmethod, decision)" {STORE}];
  S01 -> S02 -> S03 -> Online; Online -> Srv [label="yes"]; Online -> Local [label="no (<= N h list age)"];
  Srv -> A; Local -> A; A -> S06 [label="no / timeout"]; A -> V [label="yes"];
  V -> S07 [label="expired"]; V -> S08 [label="revoked/\\nsuspended"]; V -> S09 [label="alert flag"]; V -> Z [label="active"];
  Z -> S06b [label="no"]; Z -> S04 [label="yes"]; S04 -> S05 [style=dashed, dir=none]; S05 -> Face; Face -> Pass [label="yes"]; Face -> S09 [label="[Mismatch]"];
  {{S06 S07 S08 S09 S06b Pass}} -> Log; S09 -> S01 [style=dotted]; Pass -> S01 [style=dotted];
}}'''

D["Authn_vs_Authz"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-3. Authentication (\\"Who are you?\\") is decided before and separately from Authorization (\\"Are you allowed here, now?\\")"; labelloc=t; fontsize=13;
  Present [label="Student presents credential"];
  subgraph cluster_a {{ label="AUTHENTICATION - Who is this credential bound to?"; style="rounded,dashed"; color="#1E3A8A"; bgcolor="#EFF6FF";
    A1 [label="Reader issues nonce"]; A2 [label="Credential proves key possession\\n(AES challenge-response / Ed25519 signature)"]; A3 [label="Verified against key material in HSM"]; AR [label="Identity reference resolved\\n(credential pseudonym -> identity)" {GREEN}];
    AF [label="FAIL: NOT RECOGNISED\\nNo identity is known. Guard cannot \\"help\\".\\nDirect to Security Office." {RED}]; }}
  subgraph cluster_z {{ label="AUTHORIZATION - Is this principal allowed at this gate, now?"; style="rounded,dashed"; color="#166534"; bgcolor="#F0FDF4";
    Z1 [label="Credential status ACTIVE?\\n(not expired / revoked / suspended)"]; Z2 [label="Role permitted at this gate?"]; Z3 [label="Within permitted time window?"]; Z4 [label="No active alert (SEC-13)?"]; ZR [label="ALLOW\\nGuard confirms face against server photo" {GREEN}];
    ZF [label="FAIL: identity IS known.\\nMessage names the class:\\nEXPIRED -> ID cell | REVOKED -> Security Office\\nNOT PERMITTED -> other gate | SUSPICIOUS -> supervisor" {AMBER}]; }}
  Log [label="Every decision logged\\n(pseudonymous)" {STORE}];
  Present -> A1 -> A2 -> A3 -> AR; A3 -> AF [label="invalid"]; AR -> Z1 -> Z2 -> Z3 -> Z4 -> ZR;
  Z1 -> ZF [label="no"]; Z2 -> ZF [label="no"]; Z3 -> ZF [label="no"]; Z4 -> ZF [label="no"];
  {{AF ZF ZR}} -> Log;
}}'''

D["Credential_Lifecycle"] = f'''digraph G {{ {STYLE} rankdir=LR;
  label="Figure J-4. Credential lifecycle state machine (every transition is authenticated, authorized and logged - SEC-12)"; labelloc=t; fontsize=13;
  node [shape=box, style="rounded,filled"];
  Issued [label="ISSUED\\n(key personalised in HSM;\\nnot yet usable)" {GREY}];
  Active [label="ACTIVE\\nnormal use" {GREEN}];
  Susp [label="SUSPENDED\\n(reversible; authn OK,\\nauthz DENY)" {AMBER}];
  Exp [label="EXPIRED\\n(validity date passed)" {AMBER}];
  Rev [label="REVOKED\\n(irreversible; on signed\\nrevocation list)" {RED}];
  Del [label="DELETED\\n(record purged, keys\\nzeroised after retention)" {GREY}];
  New [label="Replacement:\\nnew credential ISSUED\\n(old stays REVOKED)" {BLUE}];
  Issued -> Active [label="1st tap / enrolment\\ncomplete (activation)"];
  Active -> Susp [label="hold / dues /\\nreview (Issuer)"]; Susp -> Active [label="lift (Issuer)"];
  Active -> Exp [label="validity end\\n(automatic)"]; Exp -> Active [label="renew (Issuer,\\nroster check)"];
  Active -> Rev [label="lost/stolen (self-service)\\nor Issuer"]; Susp -> Rev [label="Issuer"]; Exp -> Rev [label="Issuer / batch\\ndeprecation"];
  Rev -> New [label="if still a member"]; New -> Issued [style=dashed];
  Rev -> Del [label="+1 year retention"]; Exp -> Del [label="member left,\\n+1 year"];
}}'''

D["Visitor_Workflow"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-5. Visitor access: host pre-approval or gate-initiated approval; time- and gate-bound signed pass; no paper register"; labelloc=t; fontsize=13;
  H [label="Host submits request (S13)\\nname, purpose category, window,\\ngate(s), delivery channel" {EXT}];
  Ap [label="Approver / policy (S14)\\napprove | decline | edit window" {DEC}];
  Iss [label="Signed pass issued (S15)\\n{{pass ID, host, window, gates, uses}}\\nEd25519" {BLUE}];
  Del [label="Delivered to visitor\\n(e-mail/SMS; contact used\\nonly for delivery)"];
  Arr [label="Visitor arrives at gate"];
  Has [label="Has pass?" {DEC}];
  Scan [label="Scan QR (S02/S03)\\nverify signature, window,\\ngate set, use count"];
  Ok [label="Valid?" {DEC}];
  G [label="Guard sees: VISITOR - first name -\\nHost - valid until (S05 variant)\\nHost notified of arrival" {GREEN}];
  Deny [label="DENY (S06/S07)\\nexpired / wrong gate /\\nalready used / forged" {RED}];
  Walk [label="Guard: [Visitor without approval] (S13 guard variant)\\nhost search -> approval request\\nto host's phone" {AMBER}];
  HostOK [label="Host approves\\non phone (S14)?" {DEC}];
  NoEntry [label="No entry. Script: \\"Host has not approved.\\nPlease contact your host.\\"" {RED}];
  Kiosk [label="Pass issued to visitor phone\\nor printed at gate"];
  Purge [label="Pass consumed / expires;\\nvisitor record deleted +30 days" {STORE}];
  Log [label="Audit log" {STORE}];
  H -> Ap; Ap -> Iss [label="approve"]; Iss -> Del -> Arr; Arr -> Has; Has -> Scan [label="yes"]; Scan -> Ok; Ok -> G [label="yes"]; Ok -> Deny [label="no"];
  Has -> Walk [label="no"]; Walk -> HostOK; HostOK -> Kiosk [label="yes"]; HostOK -> NoEntry [label="no / timeout"]; Kiosk -> Scan;
  G -> Purge; {{G Deny NoEntry}} -> Log;
}}'''

D["Lost_ID_Workflow"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-6. Lost or stolen credential: self-service immediate, irreversible revocation; access continues via phone credential"; labelloc=t; fontsize=13;
  L [label="Student notices card lost / stolen" {EXT}];
  App [label="App / portal: My credentials (S18)\\n[Report lost or stolen]"];
  Conf [label="Confirm sheet:\\n\\"Permanently disables card.\\nPhone credential keeps working.\\nCannot be undone.\\""];
  Rev [label="Card -> REVOKED (seconds)\\nrevocation list re-signed\\npushed to all readers (<=30 s online;\\nnext sync offline)" {RED}];
  Req [label="Replacement request created\\nstatus visible in app"];
  Phone [label="Student enters with\\nphone credential (NFC/QR)" {GREEN}];
  Off [label="Issuer at ID cell: identity check\\nvs roster + photo -> new card ISSUED\\n(new key; old stays REVOKED) (S17)"];
  Act [label="New card ACTIVE on first tap" {GREEN}];
  subgraph cluster_att {{ label="Attacker path (Scenario 1)"; style=dashed; color="#991B1B";
    Att [label="Finder taps lost card" {EXT}];
    Before [label="Before report:\\nauthenticates; guard sees\\nstudent's photo != face\\n-> [Mismatch] -> DENY-SUSPICIOUS" {AMBER}];
    After [label="After report:\\nDENY - REVOKED (S08)\\nflagged, supervisor alerted" {RED}]; }}
  Log [label="Audit log: revocation (who/when),\\nevery tap of the revoked card (flagged)" {STORE}];
  L -> App -> Conf -> Rev -> Req; Rev -> Phone; Req -> Off -> Act;
  Att -> Before [label="t < report"]; Att -> After [label="t > report"];
  {{Rev Before After Off}} -> Log;
}}'''

D["Failure_Workflow"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-7. Authentication / authorization failure handling: no guard override exists; every DENY has a scripted next step"; labelloc=t; fontsize=13;
  Tap [label="Credential presented"];
  Class [label="Decision class" {DEC}];
  NR [label="NOT RECOGNISED\\n(authn failed: fake, clone,\\nreplay, damaged, non-campus)" {RED}];
  EX [label="EXPIRED\\n(identity known)" {AMBER}];
  RV [label="REVOKED / SUSPENDED\\n(identity known, reason hidden)" {RED}];
  NP [label="NOT PERMITTED\\nat this gate / time" {AMBER}];
  SU [label="SUSPICIOUS\\n(SEC-13 threshold or [Mismatch])" {RED}];
  U [label="User indicator: red/amber + generic message\\n\\"Not accepted - please visit the Security Office\\"\\n(no reason to bystanders - PRIV-10)"];
  G1 [label="Guard script: Do not admit.\\nDirect to Security Office.\\n[Call supervisor] [Done]"];
  G2 [label="Guard script: Do not admit.\\nDirect to ID cell for renewal.\\n[Call supervisor] [Done]"];
  G3 [label="Guard script: Do not admit.\\nDirect to permitted gate / Security Office. [Done]"];
  G4 [label="Guard script: Do not admit. Keep at gate if safe.\\nSupervisor already alerted. [Call supervisor]"];
  PA [label="Student receives private explanation\\nin app (HE-9 fix)" {BLUE}];
  Esc [label="Repeated failures on credential or reader?" {DEC}];
  Alert [label="Escalate -> SUSPICIOUS; supervisor alert;\\nreader rate-limit" {RED}];
  Log [label="Audit log (flagged where applicable)" {STORE}];
  NoOv [label="NO [Allow anyway] CONTROL.\\nOnly path to admit without valid credential =\\nsupervised Manual Verification Mode (Figure J-8)" shape=note fillcolor="#FFF7ED" color="#9A3412"];
  Tap -> Class; Class -> NR; Class -> EX; Class -> RV; Class -> NP; Class -> SU;
  {{NR EX RV NP SU}} -> U; NR -> G1; RV -> G1; EX -> G2; NP -> G3; SU -> G4;
  {{EX RV}} -> PA [style=dashed]; {{G1 G2 G3 G4}} -> Log; NR -> Esc; Esc -> Alert [label="yes"]; Alert -> Log;
  G1 -> NoOv [style=invis];
}}'''

D["Network_Device_Failure_Workflow"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-8. Network / device failure: ordered degradation - online -> offline-verified (bounded) -> supervised manual -> emergency egress-only. No state auto-allows."; labelloc=t; fontsize=13;
  On [label="ONLINE\\nserver-verified decisions\\nstatus bar green" {GREEN}];
  HB [label="Heartbeat to server lost\\nor auth service unavailable?" {DEC}];
  Off [label="OFFLINE-VERIFIED (S11)\\nlocal crypto verification with cached public keys\\n+ signed revocation list; events buffered\\nstatus bar amber: \\"Last update 1 h 20 m ago (limit 4 h)\\"" {AMBER}];
  Age [label="List age <= N h (default 4)?" {DEC}];
  RF [label="Reader self-test / tamper\\nor power failure? (S10)" {DEC}];
  Lane2 [label="Close lane; redirect to another lane" {AMBER}];
  Other [label="Another lane available?" {DEC}];
  Man [label="MANUAL VERIFICATION MODE (S12)\\nsupervisor PIN to start. Per person: credential type shown,\\nphoto check vs card, supervisor approval (or batch at peak).\\nNo roster lookup. Everything recorded + flagged." {RED}];
  Paper [label="Tablet dead: pre-printed serial-numbered\\npaper form mirrors S12 steps; transcribed later"];
  Em [label="EMERGENCY (supervisor declares, reason logged)\\nEgress barriers always free (life safety).\\nIngress held open only for responders;\\nevery entry logged as emergency-mode." {RED}];
  Restore [label="Connectivity / hardware restored" {DEC}];
  Sync [label="Buffered events sync;\\nmanual entries reviewed by supervisor/auditor" {STORE}];
  On -> HB; HB -> On [label="no"]; HB -> Off [label="yes"]; Off -> Age; Age -> Off [label="yes: keep verifying"]; Age -> Man [label="no: limit exceeded"];
  On -> RF; Off -> RF; RF -> Other [label="yes"]; Other -> Lane2 [label="yes"]; Other -> Man [label="no"]; Man -> Paper [label="tablet also down", style=dashed];
  {{On Off Man}} -> Em [label="emergency", style=dotted]; Man -> Restore; Off -> Restore; Restore -> Sync [label="yes"]; Sync -> On;
}}'''

D["Threat_Model"] = f'''digraph G {{ {STYLE} rankdir=LR; ranksep=0.6; nodesep=0.2;
  label="Figure J-9. Threat model as an attack tree. Root: unauthorised entry. Leaves show the controlling requirement(s)."; labelloc=t; fontsize=13;
  Root [label="GOAL: Unauthorised person enters campus" {RED} penwidth=2];
  P [label="Possess a valid\\ncredential" {AMBER}]; F [label="Forge a\\ncredential" {AMBER}]; L [label="Exploit the\\nlifecycle" {AMBER}]; I [label="Exploit\\ninfrastructure" {AMBER}]; Hm [label="Exploit the\\nhuman" {AMBER}];
  P1 [label="Steal / find card\\nTH-01 -> SEC-17 self-revoke,\\nFR-12 photo check"]; P2 [label="Borrow friend's card\\nTH-04a -> FR-12, USE-05,\\nSEC-13 velocity"]; P3 [label="Real-time relay\\nTH-04b -> FR-12 (residual)\\n[18-20]"]; P4 [label="Steal phone\\nTH-16 -> unlock required,\\nremote revoke"];
  F1 [label="Clone weak tech (UID, static QR,\\nMIFARE Classic) TH-02 -> SEC-01\\nnever accept UID; AES cards"]; F2 [label="Replay captured exchange / QR\\nTH-03 -> SEC-04 nonce,\\n30-60 s tokens, replay cache"]; F3 [label="Home-made fake card\\nTH-06 -> SEC-01\\n-> NOT RECOGNISED"];
  L1 [label="Use expired card\\nTH-07 -> SEC-03\\nserver-side expiry"]; L2 [label="Use revoked card\\nTH-08 -> SEC-02,\\nSEC-19 signed list"]; L3 [label="Ghost issuance by insider\\nTH-17 -> FR-07 roster match,\\nSEC-07/11/12"];
  I1 [label="Rogue server returns ALLOW\\nTH-12 -> SEC-05 mTLS,\\nsigned decisions"]; I2 [label="Compromise reader\\nTH-16 -> SEC-18 no master keys,\\ntamper log, cert revoke"]; I3 [label="DoS -> force manual mode\\nTH-14 -> SEC-19 bounded offline,\\nFR-19 supervised manual"]; I4 [label="Dump database\\nTH-10 -> SEC-14 minimise,\\nHSM keys, PRIV-04"];
  H1 [label="Coerce / collude guard\\nTH-17 -> no override (FR-13),\\nmanual entries flagged"]; H2 [label="Social-engineer visitor path\\nTH-05 -> SEC-16 host approval,\\nbound pass"]; H3 [label="Pressure at peak\\nTH-04 -> USE-01 tap faster\\nthan glance; USE-12"];
  Root -> {{P F L I Hm}};
  P -> {{P1 P2 P3 P4}}; F -> {{F1 F2 F3}}; L -> {{L1 L2 L3}}; I -> {{I1 I2 I3 I4}}; Hm -> {{H1 H2 H3}};
}}'''

D["Data_Flow_Diagram"] = f'''digraph G {{ {STYLE} rankdir=LR; ranksep=0.55;
  label="Figure J-10. Level-1 data flow diagram with trust boundaries (dashed), stores and sensitive flows (F1-F12)"; labelloc=t; fontsize=13;
  Student [{EXT}]; Guard [{EXT}]; Visitor [{EXT}]; Host [{EXT}]; Admin [{EXT} label="Administrator"];
  subgraph cluster_b1 {{ label="B1/B2 Gate"; style=dashed; color="#64748B";
    P1 [label="P1 Present &\\nread credential" {PROC}]; Ind [label="User indicator" {GREY}]; Tab [label="Guard tablet" {GREY}]; Buf [label="Reader buffer\\n(encrypted)" {STORE}]; }}
  subgraph cluster_b3 {{ label="B3 Services"; style=dashed; color="#64748B";
    P2 [label="P2 Authenticate" {PROC}]; P3 [label="P3 Check validity" {PROC}]; P4 [label="P4 Authorize" {PROC}]; P5 [label="P5 Decide & signal" {PROC}]; P6 [label="P6 Log event" {PROC}];
    P7 [label="P7 Manage\\ncredentials" {PROC}]; P8 [label="P8 Manage\\nvisitors" {PROC}]; P9 [label="P9 Review logs" {PROC}];
    D1 [label="D1 Credential &\\nIdentity Store" {STORE}]; D2 [label="D2 Policy Store" {STORE}]; D3 [label="D3 Audit Log\\n(hash-chained)" {STORE}]; D4 [label="D4 Visitor passes" {STORE}]; D6 [label="D6 Photo store" {STORE}]; }}
  subgraph cluster_b4 {{ label="B4 Key custody"; style=dashed; color="#4C1D95"; D5 [label="D5 HSM / KMS" {STORE}]; }}
  Student -> P1 [label="F1 card response /\\nsigned token"]; Visitor -> P1 [label="F1 pass QR"];
  P1 -> P2 [label="F2 {{pseudonym, gate, nonce,\\nresponse, method, ts}} mTLS"]; P1 -> Buf [style=dashed, label="offline"];
  P2 -> D5 [dir=both, label="F3 verify"]; P2 -> P3 [label="F4 identity ref"]; P3 -> D1 [dir=both]; P3 -> P4; P4 -> D2 [dir=both, label="F5"]; P4 -> P5;
  P5 -> Tab [label="F6 decision, first name,\\nrole, photo URL (60 s)"]; P5 -> Ind [label="F7 colour/icon/msg"]; Tab -> Guard; Ind -> Student; D6 -> Tab [label="photo (signed URL)", style=dashed];
  P5 -> P6 [label="F8"]; P6 -> D3 [label="append"];
  Admin -> P7 [label="F9 issue/revoke\\n(MFA)"]; P7 -> D1; P7 -> D5 [label="key ops"]; P7 -> P6;
  Host -> P8 [label="F10 request"]; P8 -> D4; D4 -> Visitor [label="F10 signed QR"];
  Admin -> P9 [label="F11 query (MFA)"]; P9 -> D3 [dir=both]; P9 -> D1 [label="re-identify\\n(justified, logged)", style=dashed];
  Student -> D1 [label="F12 report lost;\\nview own (app)", style=dashed]; Student -> D3 [label="F12 own events", style=dashed];
}}'''

D["Privacy_Data_Flow"] = f'''digraph G {{ {STYLE} rankdir=LR; ranksep=0.5;
  label="Figure J-11. Privacy data flow: what is collected -> why -> who can access -> where stored -> how long -> deletion. Guard path holds only photo + first name + role."; labelloc=t; fontsize=13;
  node [shape=box, style="rounded,filled"];
  subgraph cluster_c {{ label="Collected (source)"; style=dashed; color="#64748B";
    C1 [label="Identity: full name, roll no.,\\nprogramme, photo, role\\n(from roster at issuance)"]; C2 [label="Credential: pseudonym,\\nkey material, validity, status"]; C3 [label="Access event: pseudonym,\\ngate, time, method, decision"]; C4 [label="Visitor: name, host, purpose\\ncategory, window, contact"]; C5 [label="NOT collected: phone, address,\\nemergency contact, hostel,\\nbiometric templates, exit events" {GREY}]; }}
  subgraph cluster_w {{ label="Why (purpose)"; style=dashed; color="#64748B";
    W1 [label="Bind credential to member;\\nhuman face check"]; W2 [label="Authenticate; authorize;\\nrevoke"]; W3 [label="Access audit; incident\\ninvestigation; anomaly detection"]; W4 [label="Issue & check pass;\\ndeliver pass"]; }}
  subgraph cluster_a {{ label="Who can access"; style=dashed; color="#64748B";
    A1 [label="Issuer; student (own);\\nGuard: PHOTO + FIRST NAME + ROLE ONLY (on tap);\\nAuditor: on justified re-identify" {BLUE}]; A2 [label="System / HSM; Issuer;\\nstudent (own status)"]; A3 [label="Auditor (pseudonymous);\\nSupervisor (counts);\\nstudent (own)"]; A4 [label="Approver; Guard: name + host only;\\ncontact: delivery system only"]; }}
  subgraph cluster_s {{ label="Where stored"; style=dashed; color="#64748B";
    S1 [label="D1 encrypted; D6 photo store\\n(separate access control)" {STORE}]; S2 [label="D1 + D5 HSM\\n(keys never in DB)" {STORE}]; S3 [label="D3 hash-chained;\\npseudonym map in separate schema" {STORE}]; S4 [label="D4" {STORE}]; }}
  subgraph cluster_r {{ label="Retention -> deletion (automatic, logged)"; style=dashed; color="#64748B";
    R1 [label="While member;\\n+1 y after last credential revoked/expired"]; R2 [label="Credential lifecycle + 1 y;\\nkeys zeroised"]; R3 [label="90 days routine;\\nflagged: case closed + 1 y"]; R4 [label="Visit + 30 days;\\ncontact deleted at visit end"]; }}
  C1 -> W1 -> A1 -> S1 -> R1; C2 -> W2 -> A2 -> S2 -> R2; C3 -> W3 -> A3 -> S3 -> R3; C4 -> W4 -> A4 -> S4 -> R4;
}}'''

D["Admin_Credential_Management"] = f'''digraph G {{ {STYLE} rankdir=TB;
  label="Figure J-12. Administrative credential management (S17/S18): MFA, role check, roster match, two-step confirm, audit log"; labelloc=t; fontsize=13;
  Login [label="Admin login: SSO + second factor\\n(TOTP / FIDO2) - SEC-11"];
  Role [label="Role = Issuer?\\n(Issuer != Auditor; separation of duties)" {DEC}];
  Deny [label="403 - action refused, logged" {RED}];
  Search [label="Roster search (recognition,\\nnot typed IDs) - S17"];
  Act [label="Action" {DEC}];
  I1 [label="ISSUE: roster match required (FR-07)\\nidentity documents per policy\\nHSM derives per-card key /\\nsends phone enrolment link\\nset validity"];
  R1 [label="REVOKE: select credential\\nreason (dropdown)\\n-> irreversible (SEC-17)"];
  S1 [label="SUSPEND / LIFT: reason"];
  N1 [label="RENEW: roster check;\\nextend validity on same credential"];
  Conf [label="Two-step confirm dialog:\\nexact effect stated\\n(\\"applies to N gates in <=30 s\\")" {AMBER}];
  Apply [label="Apply; propagate to readers\\n(revocation list re-signed)" {BLUE}];
  Log [label="Audit log: admin ID, time, credential,\\naction, reason (SEC-12; hash-chained)" {STORE}];
  Notify [label="Student notified in app\\n(generic reason + contact)"];
  Login -> Role; Role -> Deny [label="no"]; Role -> Search [label="yes"]; Search -> Act; Act -> I1; Act -> R1; Act -> S1; Act -> N1;
  {{I1 R1 S1 N1}} -> Conf; Conf -> Apply [label="confirm"]; Conf -> Search [label="cancel", style=dashed]; Apply -> Log; Apply -> Notify; Deny -> Log;
}}'''

D["System_Architecture"] = f'''digraph G {{ {STYLE} rankdir=TB; newrank=true; ranksep=0.7; nodesep=0.4;
  label="Figure J-13. Conceptual system architecture: trust boundaries B1-B7, sensitive data [brackets], attack surfaces and controls"; labelloc=t; fontsize=13;
  subgraph cluster_b1 {{ label="B1 Physical / RF / optical   -   attack surface: skimming, relay, fake credential"; style="dashed"; color="#991B1B";
    Stu [label="Student / Visitor" {EXT}]; Cred [label="Credential: AES smart card | phone NFC (Ed25519) | dynamic signed QR | visitor pass\\n[secret: per-card key / phone private key - never transmitted]"]; }}
  subgraph cluster_b2 {{ label="B2 Gate LAN   -   attack surface: reader housing, debug ports, rogue server"; style="dashed"; color="#9A3412";
    Reader [label="Gate Reader + user indicator\\nholds: own client cert, public keys, signed revocation list, encrypted event buffer\\nNO master keys | signed firmware | tamper switch | rate limit" {AMBER}];
    Tablet [label="Guard tablet\\nrole-limited UI (photo + first name + role + decision)\\nno local personal data | auto-clear | privacy hood" {AMBER}]; }}
  subgraph cluster_b3 {{ label="B3 Services   -   attack surface: APIs, injection, misconfiguration (OWASP ASVS L2)"; style="dashed"; color="#1E3A8A";
    Auth [label="Authentication Service\\nnonce issue | verify | replay cache" {BLUE}];
    Pol [label="Authorization / Policy Engine\\ndeny-by-default | versioned rules" {BLUE}];
    Decs [label="Decision Service\\nsigns ALLOW / DENY-class" {BLUE}];
    LogS [label="Audit Log Service\\nappend-only | hash chain | signed checkpoints" {BLUE}];
    VisS [label="Visitor Pass Service\\nsigned, time/gate-bound passes" {BLUE}];
    Store [label="Credential & Identity Store\\n[identity fields, status] encrypted at rest\\npseudonym map in separate schema" {STORE}];
    Photo [label="Photo store\\nseparate ACL | signed 60 s URLs" {STORE}];
    PStore [label="Policy Store\\nversioned" {STORE}];
    LogD [label="Log Store\\n[movement, pseudonymous]\\n90-day retention job" {STORE}];
    VisD [label="Visitor table\\n[name, host, contact] 30 d" {STORE}];
    {{rank=same; Auth; Pol; Decs; LogS; VisS;}}
    {{rank=same; Store; Photo; PStore; LogD; VisD;}} }}
  subgraph cluster_b4 {{ label="B4 Key custody"; style="dashed"; color="#4C1D95";
    HSM [label="HSM / KMS\\nmaster diversification key | token & list signing keys | decision signing key | checkpoint key\\n[keys never leave]" {STORE}]; }}
  subgraph cluster_side {{ style=invis;
    App [label="B6 Student app / portal   -   attack surface: malware, rooted device\\nhardware keystore | TLS pinning | enrol, dynamic QR, HCE, report lost, view own" {BLUE} color="#0C4A6E" style="rounded,filled,dashed"];
    Admin [label="B5 Admin console   -   attack surface: session hijack, insider\\nMFA | RBAC (Issuer / Approver / Auditor / Policy) | step-up confirm | session timeout" {GREEN} style="rounded,filled,dashed"];
    Host [label="B7 Host / Approver  ->  Visitor phone or printout   -   attack surface: forwarded pass" {EXT} style="filled,dashed"];
    {{rank=same; App; Admin; Host;}} }}
  {{rank=same; Stu; Cred;}}
  {{rank=same; Reader; Tablet;}}
  Stu -> Cred [label=" present"]; Cred -> Reader [label=" challenge-response / signed token"];
  Reader -> Auth [label=" mTLS 1.3, pinned server cert"]; Auth -> HSM [dir=both, label=" verify"]; Auth -> Store [dir=both];
  Auth -> Pol; Pol -> PStore [dir=both]; Pol -> Decs; Decs -> HSM [style=dotted, label=" sign"];
  Decs -> Reader [label=" signed decision", constraint=false]; Decs -> Tablet [label=" decision + first name + role", constraint=false]; Photo -> Tablet [style=dashed, label=" photo (60 s URL)", constraint=false];
  Decs -> LogS; LogS -> LogD; Reader -> LogS [style=dashed, label=" buffered events (offline)", constraint=false];
  Auth -> Reader [style=dotted, dir=back, label=" signed revocation list + public keys", constraint=false];
  VisS -> VisD; VisS -> HSM [style=dotted];
  App -> Auth [label=" enrol / self-service", constraint=false]; Admin -> Store [label=" issue / revoke (logged)", constraint=false]; Admin -> PStore [label=" edit policy", constraint=false]; Admin -> LogD [label=" read pseudonymous", constraint=false]; Host -> VisS [label=" request pass", constraint=false];
  LogD -> App [style=invis];
}}'''

def main():
    for name, src in D.items():
        dot = os.path.join(OUT, name + ".dot")
        with open(dot, "w") as f: f.write(src)
        for fmt in ("png", "svg"):
            outp = os.path.join(OUT, f"{name}.{fmt}")
            args = ["dot", f"-T{fmt}", dot, "-o", outp]
            if fmt == "png": args.insert(2, "-Gdpi=150")
            r = subprocess.run(args, capture_output=True, text=True)
            if r.returncode != 0:
                print("FAIL", name, fmt, r.stderr); raise SystemExit(1)
        print("ok", name)
    print(len(D), "diagrams")

if __name__ == "__main__": main()
