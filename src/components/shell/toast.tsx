"use client";

import { CheckCircle2, TriangleAlert, X } from "lucide-react";
import type { Toast } from "../types";

/**
 * Action confirmation.
 *
 * A warning uses `alert`/assertive so it interrupts, while a success uses
 * `status`/polite so it does not talk over the user mid-task. The icon changes
 * with the kind, so success and failure are not separated by colour alone.
 */
export function ToastMessage({
  toast,
  dismiss,
}: {
  toast: Toast | null;
  dismiss: () => void;
}) {
  if (!toast) return null;
  const warning = toast.kind === "warning";
  return (
    <div
      className={`toast ${warning ? "warning" : "success"}`}
      role={warning ? "alert" : "status"}
      aria-live={warning ? "assertive" : "polite"}
    >
      <span className="toast-icon" aria-hidden="true">
        {warning ? <TriangleAlert size={19} /> : <CheckCircle2 size={19} />}
      </span>
      <div className="toast-copy">
        <strong>{toast.title}</strong>
        <span>{toast.detail}</span>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss message">
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
