import { randomBytes } from "crypto";

// Prints fresh secrets for .env / Vercel project settings.
const hex = (n: number) => randomBytes(n).toString("hex");
console.log(`NEXTAUTH_SECRET="${randomBytes(32).toString("base64url")}"`);
console.log(`PASS_SIGNING_KEY="${hex(32)}"`);
console.log(`PHOTO_HMAC_SECRET="${hex(32)}"`);
console.log(`PASS_COLOUR_SECRET="${hex(32)}"`);
console.log(`CRON_SECRET="${hex(24)}"`);
