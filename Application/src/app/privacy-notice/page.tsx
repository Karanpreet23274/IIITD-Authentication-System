import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import PrivacyContent from "@/components/PrivacyContent";

export default function PrivacyNoticePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="flex items-center gap-2 font-bold text-brand">
        <ShieldCheck className="h-6 w-6" /> IIITD Gate Entry
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold">Privacy notice</h1>
      <p className="mb-5 mt-1 text-sm text-slate-600">Aligned with the Digital Personal Data Protection Act 2023 and Privacy by Design.</p>
      <PrivacyContent />
    </main>
  );
}
