import type { Decision } from "@prisma/client";

// Fixed decision vocabulary. Guard text: one status word + one next step.
// Gate-screen text: short and polite, never the reason (shown to the queue).

export type Tone = "allow" | "warn" | "deny";

export type DecisionCopy = {
  tone: Tone;
  guardTitle: string;
  guardTitleHi: string;
  guardBody: string;
  nextStep: string[];
  userTitle: string;
  userTitleHi: string;
  showIdentity: boolean;
};

export const DECISION_COPY: Record<Decision, DecisionCopy> = {
  ALLOW: {
    tone: "allow",
    guardTitle: "VERIFIED",
    guardTitleHi: "सत्यापित",
    guardBody: "Live pass verified from the student's own phone. Entry recorded digitally.",
    nextStep: ["Check the face matches the photo, then let them pass.", "If the face does NOT match, press [Not this person]."],
    userTitle: "Verified — go ahead",
    userTitleHi: "सत्यापित — आगे बढ़ें",
    showIdentity: true,
  },
  DENY_NOT_RECOGNISED: {
    tone: "deny",
    guardTitle: "INVALID QR",
    guardTitleHi: "अमान्य QR",
    guardBody: "Not a live IIITD pass: screenshot, forwarded image, expired or already-used QR, or a fake.",
    nextStep: ["Do not allow.", "Ask the student to open the app and generate a fresh pass on their own phone."],
    userTitle: "QR not accepted — generate a fresh pass in the app",
    userTitleHi: "QR स्वीकार नहीं — ऐप में नया पास बनाएँ",
    showIdentity: false,
  },
  DENY_BLOCKED: {
    tone: "deny",
    guardTitle: "BLOCKED",
    guardTitleHi: "रोक दिया गया",
    guardBody: "This student's app pass has been blocked or the phone was reported lost.",
    nextStep: ["Do not allow.", "Direct the student to the Security Office."],
    userTitle: "Not accepted — please visit the Security Office",
    userTitleHi: "स्वीकार नहीं — कृपया सुरक्षा कार्यालय जाएँ",
    showIdentity: true,
  },
  DENY_SUSPICIOUS: {
    tone: "deny",
    guardTitle: "SUSPICIOUS — DO NOT ALLOW",
    guardTitleHi: "संदिग्ध — प्रवेश न दें",
    guardBody: "This QR was already used, or there were repeated failed attempts, or the face did not match.",
    nextStep: ["Do not allow.", "Keep the person at the gate if safe and inform the Security Office."],
    userTitle: "Not accepted — please wait for security staff",
    userTitleHi: "स्वीकार नहीं — कृपया सुरक्षा कर्मचारी की प्रतीक्षा करें",
    showIdentity: true,
  },
};

/** Why a scan was refused, for the guard's screen only (never the public gate display). */
export function reasonText(code: string, unlockAt?: string | null): string | null {
  const unlock = unlockAt ? new Date(unlockAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) : null;
  switch (code) {
    case "OK":
    case "OK_OFFLINE":
      return null;
    case "UNKNOWN_OR_BLOCKED":
      return "This student isn't in the offline list (new, blocked or changed phone). Reconnect to the internet and scan again.";
    case "OFFLINE_ERROR":
      return "The pass could not be checked offline. Reconnect and scan again.";
    case "STALE_QR":
      return "The QR was more than 20 s old: a screenshot or photo, or the student's app stopped refreshing (weak internet or the screen was locked). Ask them to reopen the app.";
    case "FUTURE_QR":
      return "The QR's time is wrong. Ask the student to reopen the app.";
    case "MALFORMED":
    case "BAD_SIGNATURE":
    case "NOT_A_STUDENT_PASS":
      return "Not an IIITD pass, or it was altered.";
    case "UNKNOWN_PASS":
      return "This pass doesn't exist (it may have been cancelled or replaced).";
    case "NOT_FROM_ENROLLED_PHONE":
    case "PHONE_SIGNATURE_INVALID":
      return "Not shown from the student's enrolled phone. If they changed phones, they must enrol the new one in the app first.";
    case "PASS_ALREADY_USED":
      return "This pass was already used for an entry/exit. One pass = one movement: the student should generate a new pass.";
    case "PASS_EXPIRED":
      return "The 5-minute pass expired or was cancelled. The student should generate a new pass.";
    case "QR_REUSED":
      return "This exact QR was already scanned once, so this is a copy. An admin must review the alert before this student can enter.";
    case "CONCURRENT_USE":
      return "The same pass was scanned at another lane at the same moment. An admin must review the alert.";
    case "LOCKED":
    case "REPEATED_FAILURES":
      return `Too many failed scans in a short time. Locked${unlock ? ` until ${unlock}` : " for a few minutes"}; it unlocks automatically, or an admin can close the alert now.`;
    case "OPEN_ALERT":
      return "There is an open security alert for this student. An admin must review and close it in Alerts.";
    case "SYSTEM_ERROR":
      return "The server could not check this pass. Scan again.";
    default:
      return code.startsWith("CREDENTIAL_") ? "This student's pass is blocked by an admin." : null;
  }
}
