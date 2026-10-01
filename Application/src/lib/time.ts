// Campus time is IST (UTC+05:30) regardless of server region (Vercel runs in UTC).
const IST_OFFSET_MIN = 330;

export function istMinuteOfDay(d = new Date()): number {
  const m = d.getUTCHours() * 60 + d.getUTCMinutes() + IST_OFFSET_MIN;
  return ((m % 1440) + 1440) % 1440;
}

/** End of the current IST day as a UTC Date (used for one-day temporary passes). */
export function endOfIstDay(d = new Date()): Date {
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  ist.setUTCHours(23, 59, 59, 999);
  return new Date(ist.getTime() - IST_OFFSET_MIN * 60_000);
}

export function startOfIstDay(d = new Date()): Date {
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MIN * 60_000);
}

export function minuteToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function hhmmToMinute(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

export function fmtIST(d: Date | string, withDate = true): string {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: withDate ? undefined : "2-digit",
    day: withDate ? "2-digit" : undefined,
    month: withDate ? "short" : undefined,
    year: withDate ? "numeric" : undefined,
    hour12: false,
  });
}
