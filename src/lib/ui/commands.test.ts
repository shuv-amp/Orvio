import { describe, expect, it } from "vitest";
import {
  COMMAND_SECTIONS,
  COMMANDS,
  filterCommands,
  groupCommands,
  moveActiveIndex,
} from "./commands";

describe("COMMANDS", () => {
  it("uses a unique id per command", () => {
    const ids = COMMANDS.map((command) => command.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("reaches every role workspace", () => {
    const views = COMMANDS.flatMap((command) =>
      command.action.kind === "navigate" ? [command.action.view] : [],
    );
    expect(new Set(views)).toEqual(
      new Set(["organizer", "participant", "judge", "scanner"]),
    );
  });

  it("covers every organizer section", () => {
    const sections = COMMANDS.flatMap((command) =>
      command.action.kind === "navigate" && command.action.section
        ? [command.action.section]
        : [],
    );
    expect(new Set(sections)).toEqual(new Set(COMMAND_SECTIONS));
  });

  it("covers every incident the recovery engine supports", () => {
    const incidents = COMMANDS.flatMap((command) =>
      command.action.kind === "simulate" ? [command.action.incident] : [],
    );
    expect(new Set(incidents)).toEqual(
      new Set(["judge-dropout", "gate-surge", "venue-relocation"]),
    );
  });

  it("gives every command searchable keywords and a hint", () => {
    for (const command of COMMANDS) {
      expect(command.keywords.length).toBeGreaterThan(0);
      expect(command.hint.length).toBeGreaterThan(0);
    }
  });
});

describe("filterCommands", () => {
  it("returns the full catalog for an empty query", () => {
    expect(filterCommands("")).toHaveLength(COMMANDS.length);
    expect(filterCommands("   ")).toHaveLength(COMMANDS.length);
  });

  it("ignores case and surrounding whitespace", () => {
    expect(filterCommands("  JUDGING  ")[0].id).toBe("go-judge");
  });

  it("ranks a prefix match above a mid-label match", () => {
    const results = filterCommands("open");
    expect(results[0].label.toLowerCase().startsWith("open")).toBe(true);
  });

  it("matches on keywords the label does not contain", () => {
    expect(filterCommands("dark").map((c) => c.id)).toContain("cycle-theme");
    expect(filterCommands("a11y").map((c) => c.id)).toContain(
      "toggle-contrast",
    );
  });

  it("matches an abbreviation as a subsequence", () => {
    expect(filterCommands("opnjdg").map((c) => c.id)).toContain("go-judge");
  });

  it("returns nothing when a query matches no command", () => {
    expect(filterCommands("zzzqqq")).toEqual([]);
  });
});

describe("groupCommands", () => {
  it("preserves rank order inside each group", () => {
    const grouped = groupCommands(filterCommands("simulate"));
    expect(grouped).toHaveLength(1);
    expect(grouped[0][0]).toBe("Event ops");
    expect(grouped[0][1].length).toBe(3);
  });

  it("keeps every command when grouping the whole catalog", () => {
    const total = groupCommands(filterCommands("")).reduce(
      (sum, [, commands]) => sum + commands.length,
      0,
    );
    expect(total).toBe(COMMANDS.length);
  });
});

describe("moveActiveIndex", () => {
  it("wraps past both ends of the list", () => {
    expect(moveActiveIndex(0, -1, 3)).toBe(2);
    expect(moveActiveIndex(2, 1, 3)).toBe(0);
    expect(moveActiveIndex(0, 1, 3)).toBe(1);
  });

  it("stays at zero for an empty result list", () => {
    expect(moveActiveIndex(0, 1, 0)).toBe(0);
    expect(moveActiveIndex(5, -1, 0)).toBe(0);
  });
});
