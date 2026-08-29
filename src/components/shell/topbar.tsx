"use client";

import {
  Contrast,
  Menu,
  MonitorSmartphone,
  Moon,
  PlayCircle,
  Search,
  Sun,
} from "lucide-react";
import {
  themeControlLabel,
  type ContrastChoice,
  type ResolvedTheme,
  type ThemeChoice,
} from "@/lib/ui/theme";
import type { Announcement } from "@/lib/domain/types";
import type { OrganizerSection, View } from "../types";
import { Notifications } from "./notifications";

const organizerTitles: Record<OrganizerSection, string> = {
  overview: "Control tower",
  signals: "Live signals",
  broadcasts: "Broadcast center",
  analytics: "Analytics",
  audit: "Audit trail",
};

const viewTitles: Record<View, string> = {
  organizer: "Control tower",
  participant: "Participant",
  judge: "Judging portal",
  scanner: "Scanner",
};

const themeIcon: Record<ThemeChoice, typeof Sun> = {
  system: MonitorSmartphone,
  light: Sun,
  dark: Moon,
};

export function Topbar({
  view,
  organizerSection,
  announcements,
  openMenu,
  navOpen,
  openPalette,
  startTour,
  goToBroadcasts,
  themeChoice,
  resolvedTheme,
  cycleTheme,
  contrast,
  toggleContrast,
}: {
  view: View;
  organizerSection: OrganizerSection;
  announcements: Announcement[];
  openMenu: () => void;
  navOpen: boolean;
  openPalette: () => void;
  startTour: () => void;
  goToBroadcasts: () => void;
  themeChoice: ThemeChoice;
  resolvedTheme: ResolvedTheme;
  cycleTheme: () => void;
  contrast: ContrastChoice;
  toggleContrast: () => void;
}) {
  const ThemeIcon = themeIcon[themeChoice];
  const title =
    view === "organizer" ? organizerTitles[organizerSection] : viewTitles[view];

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu"
        onClick={openMenu}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        aria-controls="role-navigation"
      >
        <Menu size={20} aria-hidden="true" />
      </button>
      <div className="topbar-title">
        <p>PromptWars × AbhiyantriX</p>
        <h1>{title}</h1>
      </div>
      <div className="topbar-actions">
        {/* The visible label and shortcut hint are hidden on narrow screens,
            so the accessible name comes from aria-label rather than from text
            that may not be rendered. */}
        <button
          type="button"
          className="command-search"
          onClick={openPalette}
          aria-label="Search event and run commands"
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={15} aria-hidden="true" />
          <span aria-hidden="true">Search event</span>
          <kbd aria-hidden="true">⌘K</kbd>
        </button>
        <button
          type="button"
          className="icon-button tour-trigger"
          onClick={startTour}
          aria-label="Start the guided demo"
        >
          <PlayCircle size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={cycleTheme}
          aria-label={themeControlLabel(themeChoice, resolvedTheme)}
        >
          <ThemeIcon size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-pressed={contrast === "high"}
          aria-label="High contrast"
          onClick={toggleContrast}
        >
          <Contrast size={18} aria-hidden="true" />
        </button>
        <Notifications
          announcements={announcements}
          onViewAll={goToBroadcasts}
        />
        <span className="top-avatar" aria-hidden="true">
          SP
        </span>
      </div>
    </header>
  );
}
