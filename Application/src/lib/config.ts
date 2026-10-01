// All tunables are configuration, not code.
const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

export const CONFIG = {
  /** Lifetime of a live entry pass (IRCTC-style live ticket). */
  PASS_SESSION_SECONDS: num(process.env.PASS_SESSION_SECONDS, 300),
  /** Lifetime of one rotating QR inside the pass. */
  QR_TOKEN_SECONDS: num(process.env.QR_TOKEN_SECONDS, 20),
  /** How often the student app fetches a fresh QR. */
  QR_ROTATE_SECONDS: num(process.env.QR_ROTATE_SECONDS, 15),
  /** Max age of the guard tablet's offline list. */
  OFFLINE_MAX_HOURS: num(process.env.OFFLINE_MAX_HOURS, 4),
  /** Repeated-failure detection. */
  SUSPICIOUS_WINDOW_MIN: 5,
  SUSPICIOUS_PER_CREDENTIAL: 3,
  /** How long entry/exit records are kept. */
  RETENTION_DAYS: num(process.env.RETENTION_DAYS, 365),
  PHOTO_URL_SECONDS: 60,
  ALLOWED_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || "iiitd.ac.in",
  /** Bootstrap admins (comma-separated). They can then add guards/admins in the app. */
  ADMIN_EMAILS: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  CLOCK_SKEW_SECONDS: 5,
};

export const DEMO_LOGIN = process.env.DEMO_LOGIN === "true";
