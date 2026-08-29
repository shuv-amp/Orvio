"use client";

import {
  ChartNoAxesColumn,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Radio,
  Scale,
  ScanLine,
  ShieldCheck,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "../ui/brand";
import type { OrganizerSection, View } from "../types";

const workspaces: { key: View; label: string; icon: LucideIcon }[] = [
  { key: "organizer", label: "Control tower", icon: LayoutDashboard },
  { key: "participant", label: "Participant", icon: UserRound },
  { key: "judge", label: "Judging portal", icon: Scale },
  { key: "scanner", label: "Scanner", icon: ScanLine },
];

const opsSections: {
  key: Exclude<OrganizerSection, "overview">;
  label: string;
  icon: LucideIcon;
  count?: number;
}[] = [
  { key: "signals", label: "Live signals", icon: Radio, count: 4 },
  { key: "broadcasts", label: "Broadcasts", icon: Megaphone },
  { key: "analytics", label: "Analytics", icon: ChartNoAxesColumn },
  { key: "audit", label: "Audit trail", icon: ListChecks },
];

export function Sidebar({
  view,
  organizerSection,
  selectView,
  selectOrganizerSection,
  open,
  close,
}: {
  view: View;
  organizerSection: OrganizerSection;
  selectView: (view: View) => void;
  selectOrganizerSection: (section: OrganizerSection) => void;
  open: boolean;
  close: () => void;
}) {
  return (
    <>
      {open && (
        <button
          type="button"
          className="nav-scrim"
          onClick={close}
          aria-label="Close navigation"
        />
      )}
      <aside id="role-navigation" className={`sidebar ${open ? "open" : ""}`}>
        <Brand />
        <p className="event-chip">
          <span className="live-dot" aria-hidden="true" />
          <span className="event-chip-label">Live event</span>
          <span className="event-chip-name">AbhiyantriX</span>
        </p>

        <nav aria-label="Role workspaces">
          <p className="nav-label" id="nav-workspaces">
            Workspaces
          </p>
          <ul aria-labelledby="nav-workspaces">
            {workspaces.map((item) => {
              const active =
                view === item.key &&
                (item.key !== "organizer" || organizerSection === "overview");
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={active ? "active" : ""}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      if (item.key === "organizer")
                        selectOrganizerSection("overview");
                      else selectView(item.key);
                      close();
                    }}
                  >
                    <item.icon size={17} aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="nav-label spaced" id="nav-ops">
            Event ops
          </p>
          <ul aria-labelledby="nav-ops">
            {opsSections.map((item) => {
              const active =
                view === "organizer" && organizerSection === item.key;
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    className={active ? "active" : ""}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      selectOrganizerSection(item.key);
                      close();
                    }}
                  >
                    <item.icon size={17} aria-hidden="true" />
                    {item.label}
                    {item.count !== undefined && (
                      <span className="nav-count">{item.count}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-foot">
          <p className="demo-badge">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>
              <strong>Safe demo mode</strong>
              <span>Synthetic data only</span>
            </span>
          </p>
          <div className="profile-mini">
            <span className="avatar" aria-hidden="true">
              SP
            </span>
            <span className="profile-identity">
              <strong>Shuvam Pandey</strong>
              <span>Lead organizer</span>
            </span>
            <LogOut size={15} aria-hidden="true" />
          </div>
        </div>
      </aside>
    </>
  );
}
