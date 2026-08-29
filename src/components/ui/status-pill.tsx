import type { Severity } from "@/lib/domain/types";

const severityLabel: Record<Severity, string> = {
  healthy: "Healthy",
  watch: "Watch",
  critical: "Action needed",
};

/**
 * Severity badge. The state is carried by the word as well as the colour, so
 * the status survives greyscale, colour blindness, and forced-colours mode.
 */
export function StatusPill({ severity }: { severity: Severity }) {
  return (
    <span className={`status-pill ${severity}`}>
      <span className="status-dot" aria-hidden="true" />
      {severityLabel[severity]}
    </span>
  );
}
