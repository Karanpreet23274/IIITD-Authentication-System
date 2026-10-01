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
