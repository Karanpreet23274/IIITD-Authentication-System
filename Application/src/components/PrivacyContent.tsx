// Plain-language notice of what the gate system stores and who sees it.

const ROWS = [
  ["Name, IIITD e-mail, photo", "From your IIITD Google account", "Guards (when you scan), admins, you"],
  ["Roll no., programme, batch", "Roll no. from your e-mail; the rest you enter once", "Guards (when you scan), admins, you"],
  ["Hostel/room or day scholar, mobile number", "You enter once", "Guards (when you scan), admins, you"],
  ["Entry/exit records (gate, time, entry or exit)", "Each QR scan at a gate", "Guards and admins (register), you"],
  ["Your phone's public key", "Created when you enrol your phone", "Only the system (proves the QR came from your phone)"],
];

export default function PrivacyContent() {
  return (
    <div className="space-y-5">
      <section className="card">
        <h2 className="text-lg font-bold">Why this exists</h2>
        <p className="mt-2 text-sm text-slate-700">
          To replace ID-card checks and the paper register at IIITD gates. Records are used for campus security only. They are kept for one year and then deleted
          automatically.
        </p>
      </section>
      <section className="card">
        <h2 className="text-lg font-bold">What is stored and who can see it</h2>
        <div className="table-wrap mt-3">
          <table className="tbl">
            <thead>
              <tr>
                <th>Data</th>
                <th>Comes from</th>
                <th>Who can see it</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]}>
                  <td className="font-medium">{r[0]}</td>
                  <td className="text-slate-600">{r[1]}</td>
                  <td className="text-slate-600">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card">
        <h2 className="text-lg font-bold">Your QR</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>It is signed by a secret key that never leaves your phone, refreshes every 15 seconds and works once.</li>
          <li>Screenshots, forwarded images and other phones are rejected at the gate. Sharing it doesn&apos;t work.</li>
          <li>If your phone is lost, disable it from <b>Profile &amp; phone</b> and enrol your new phone.</li>
        </ul>
      </section>
    </div>
  );
}
