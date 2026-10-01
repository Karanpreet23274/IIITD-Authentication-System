import { DECISION_COPY } from "@/lib/decisions";
import { DecisionBand, NextStep } from "@/components/ui";

// Quick guide for guards: what each scan result means and what to do.
export default function Legend() {
  const order = ["ALLOW", "DENY_NOT_RECOGNISED", "DENY_BLOCKED", "DENY_SUSPICIOUS"] as const;
  return (
    <div className="space-y-4">
      <div className="card space-y-2 text-sm text-slate-700">
        <h1 className="text-xl font-bold text-slate-900">How the gate works</h1>
        <ol className="list-decimal space-y-1 pl-5">
          <li>The student opens the IIITD Gate app and taps <b>Generate gate QR</b>.</li>
          <li>Scan the QR with this device (camera or hardware scanner).</li>
          <li>Check that the face matches the photo on screen. The entry or exit is recorded automatically, with name, roll no. and time.</li>
        </ol>
        <p>
          You do <b>not</b> need to see an ID card or write in a register. A photo, screenshot or forwarded QR will always show <b>INVALID QR</b>.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {order.map((d) => {
          const c = DECISION_COPY[d];
          return (
            <div key={d} className="card space-y-3">
              <DecisionBand tone={c.tone} title={d === "ALLOW" ? "ENTRY / EXIT RECORDED" : c.guardTitle} titleHi={c.guardTitleHi} />
              <p className="text-sm text-slate-700">{c.guardBody}</p>
              <NextStep steps={c.nextStep} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
