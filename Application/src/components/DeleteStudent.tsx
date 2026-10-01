"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog, ErrorNote, postJSON } from "./ui";

/** "Delete student" button + typed confirmation. Calls DELETE /api/admin/students/[id]. */
export default function DeleteStudent({
  student,
  onDeleted,
  className = "",
  label = "Delete",
}: {
  student: { id: string; fullName: string };
  onDeleted: () => void;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setErr(null);
    if (reason.trim().length < 3) return setErr("Enter a reason (at least 3 characters).");
    setBusy(true);
    try {
      await postJSON(`/api/admin/students/${student.id}`, { confirm: "DELETE", reason: reason.trim() }, "DELETE");
      setOpen(false);
      setReason("");
      onDeleted();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={`btn-outline text-deny ${className}`} onClick={() => setOpen(true)} aria-label={`Delete ${student.fullName}`}>
        <Trash2 className="h-4 w-4" /> {label}
      </button>
      <ConfirmDialog
        open={open}
        title={`Delete ${student.fullName}?`}
        effects={[
          "Permanently deletes their profile, photo, enrolled phone and gate passes.",
          "Deletes all of their entry/exit records from the register.",
          "The anonymous scan log is kept (no names) so the tamper check stays valid.",
          "If they sign in again with IIITD Google, a new empty account is created. To stop gate access instead, use Block pass.",
          "This cannot be undone.",
        ]}
        typed="DELETE"
        danger
        busy={busy}
        confirmLabel="Delete student permanently"
        onConfirm={remove}
        onCancel={() => {
          setOpen(false);
          setErr(null);
        }}
      >
        <ErrorNote msg={err} />
        <div>
          <label className="label" htmlFor={`del-reason-${student.id}`}>
            Reason (recorded in the admin log)
          </label>
          <input
            id={`del-reason-${student.id}`}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Left the institute / duplicate account"
            maxLength={120}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
