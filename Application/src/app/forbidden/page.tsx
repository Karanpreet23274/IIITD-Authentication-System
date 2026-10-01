import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-deny" />
        <h1 className="mt-3 text-xl font-bold">Not available for your role</h1>
        <p className="mt-2 text-sm text-slate-600">
          Each role sees only what it needs (least privilege). If you think you should have access, ask the Security Admin.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href="/" className="btn-primary">
            Go to my home
          </Link>
          <Link href="/api/auth/signout" className="btn-outline">
            Switch account
          </Link>
        </div>
      </div>
    </main>
  );
}
