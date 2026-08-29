"use client";

import {
  LayoutDashboard,
  Scale,
  ScanLine,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { View } from "../types";

const roles: { key: View; label: string; short: string; icon: LucideIcon }[] = [
  {
    key: "organizer",
    label: "Control tower",
    short: "Control",
    icon: LayoutDashboard,
  },
  {
    key: "participant",
    label: "Participant",
    short: "Attendee",
    icon: UserRound,
  },
  { key: "judge", label: "Judging portal", short: "Judge", icon: Scale },
  { key: "scanner", label: "Scanner", short: "Scan", icon: ScanLine },
];

/** Thumb-reachable role switcher shown instead of the sidebar on phones. */
export function MobileRoleDock({
  view,
  selectView,
}: {
  view: View;
  selectView: (view: View) => void;
}) {
  return (
    <nav className="mobile-role-dock" aria-label="Quick role switcher">
      {roles.map((role) => (
        <button
          type="button"
          key={role.key}
          className={view === role.key ? "active" : ""}
          onClick={() => selectView(role.key)}
          aria-label={role.label}
          aria-current={view === role.key ? "page" : undefined}
        >
          <role.icon size={18} aria-hidden="true" />
          <span>{role.short}</span>
        </button>
      ))}
    </nav>
  );
}
