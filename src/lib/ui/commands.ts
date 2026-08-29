import type { IncidentType } from "@/lib/domain/types";

/** Role workspaces the command palette can jump to. */
export type CommandView = "organizer" | "participant" | "judge" | "scanner";

/** Sub-sections of the organizer workspace. */
export type CommandSection = "overview" | "signals" | "broadcasts" | "audit";

/**
 * What running a command does. Keeping this a serialisable union — rather than
 * a callback on each entry — is what lets the whole catalog be unit tested
 * without mounting React.
 */
export type CommandAction =
  | { kind: "navigate"; view: CommandView; section?: CommandSection }
  | { kind: "simulate"; incident: IncidentType }
  | { kind: "cycle-theme" }
  | { kind: "toggle-contrast" }
  | { kind: "start-tour" };

export interface Command {
  id: string;
  label: string;
  /** Heading the command is listed under. */
  group: "Workspaces" | "Event ops" | "Appearance" | "Demo";
  /** Short trailing description shown in the palette row. */
  hint: string;
  /** Extra search terms that should match this command. */
  keywords: string[];
  action: CommandAction;
}

/**
 * Every command the palette can run.
 *
 * The catalog is a constant rather than a hook so that tests, the palette, and
 * the keyboard shortcut layer all agree on exactly one list.
 */
export const COMMANDS: readonly Command[] = [
  {
    id: "go-organizer",
    label: "Open control tower",
    group: "Workspaces",
    hint: "Organizer overview",
    keywords: ["organizer", "dashboard", "home", "metrics"],
    action: { kind: "navigate", view: "organizer", section: "overview" },
  },
  {
    id: "go-participant",
    label: "Open participant home",
    group: "Workspaces",
    hint: "Match Lab and event pass",
    keywords: ["attendee", "match", "team", "qr", "pass", "register"],
    action: { kind: "navigate", view: "participant" },
  },
  {
    id: "go-judge",
    label: "Open judging portal",
    group: "Workspaces",
    hint: "Rubric v3 scoring",
    keywords: ["judge", "score", "rubric", "review", "evaluate"],
    action: { kind: "navigate", view: "judge" },
  },
  {
    id: "go-scanner",
    label: "Open gate scanner",
    group: "Workspaces",
    hint: "Check-in and offline queue",
    keywords: ["scan", "checkin", "check in", "gate", "offline", "qr"],
    action: { kind: "navigate", view: "scanner" },
  },
  {
    id: "go-signals",
    label: "Review live signals",
    group: "Event ops",
    hint: "Threshold ledger",
    keywords: ["risk", "alert", "threshold", "pulse", "signal"],
    action: { kind: "navigate", view: "organizer", section: "signals" },
  },
  {
    id: "go-broadcasts",
    label: "Compose a broadcast",
    group: "Event ops",
    hint: "Targeted announcement",
    keywords: ["announce", "message", "notify", "push", "broadcast"],
    action: { kind: "navigate", view: "organizer", section: "broadcasts" },
  },
  {
    id: "go-audit",
    label: "Open audit trail",
    group: "Event ops",
    hint: "Append-only decision log",
    keywords: ["audit", "log", "history", "trail", "who"],
    action: { kind: "navigate", view: "organizer", section: "audit" },
  },
  {
    id: "sim-judge-dropout",
    label: "Simulate judge dropout",
    group: "Event ops",
    hint: "Recovery proposal",
    keywords: ["incident", "chaos", "recovery", "judge", "dropout"],
    action: { kind: "simulate", incident: "judge-dropout" },
  },
  {
    id: "sim-gate-surge",
    label: "Simulate gate surge",
    group: "Event ops",
    hint: "Recovery proposal",
    keywords: ["incident", "chaos", "recovery", "queue", "surge", "gate"],
    action: { kind: "simulate", incident: "gate-surge" },
  },
  {
    id: "sim-venue-relocation",
    label: "Simulate venue relocation",
    group: "Event ops",
    hint: "Recovery proposal",
    keywords: ["incident", "chaos", "recovery", "venue", "room", "move"],
    action: { kind: "simulate", incident: "venue-relocation" },
  },
  {
    id: "cycle-theme",
    label: "Change colour theme",
    group: "Appearance",
    hint: "System, light, dark",
    keywords: ["dark", "light", "theme", "mode", "appearance", "colour"],
    action: { kind: "cycle-theme" },
  },
  {
    id: "toggle-contrast",
    label: "Toggle high contrast",
    group: "Appearance",
    hint: "Accessibility",
    keywords: ["contrast", "accessible", "a11y", "vision", "legible"],
    action: { kind: "toggle-contrast" },
  },
  {
    id: "start-tour",
    label: "Start the guided demo",
    group: "Demo",
    hint: "Four-step walkthrough",
    keywords: ["tour", "guide", "walkthrough", "demo", "help", "onboarding"],
    action: { kind: "start-tour" },
  },
];

/**
 * Case-insensitive subsequence test: "gsr" matches "gate surge recovery".
 * Returns the index the match ended at so earlier matches can rank higher.
 */
function subsequenceEnd(haystack: string, needle: string): number | null {
  let index = 0;
  for (const character of needle) {
    index = haystack.indexOf(character, index);
    if (index === -1) return null;
    index += 1;
  }
  return index;
}

function score(command: Command, query: string): number | null {
  const label = command.label.toLowerCase();
  // Exact prefix beats a word match, which beats a loose subsequence.
  if (label.startsWith(query)) return 0;
  const wordIndex = label.indexOf(query);
  if (wordIndex !== -1) return 1 + wordIndex / 100;
  if (command.keywords.some((keyword) => keyword.includes(query))) return 50;
  const end = subsequenceEnd(label, query);
  return end === null ? null : 100 + end;
}

/**
 * Rank commands against a query. An empty query keeps catalog order so the
 * palette opens on a stable, predictable list.
 */
export function filterCommands(
  query: string,
  commands: readonly Command[] = COMMANDS,
): Command[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [...commands];
  return commands
    .map((command) => ({ command, rank: score(command, trimmed) }))
    .filter(
      (entry): entry is { command: Command; rank: number } =>
        entry.rank !== null,
    )
    .sort((a, b) => a.rank - b.rank)
    .map((entry) => entry.command);
}

/** Group ranked results while preserving rank order within each heading. */
export function groupCommands(commands: Command[]): [string, Command[]][] {
  const groups = new Map<string, Command[]>();
  for (const command of commands) {
    const existing = groups.get(command.group);
    if (existing) existing.push(command);
    else groups.set(command.group, [command]);
  }
  return [...groups.entries()];
}

/** Move the highlighted row, wrapping at both ends. */
export function moveActiveIndex(
  current: number,
  delta: number,
  length: number,
): number {
  if (length === 0) return 0;
  return (current + delta + length) % length;
}
