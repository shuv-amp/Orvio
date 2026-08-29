import { describe, expect, it } from "vitest";
import {
  CONTRAST_STORAGE_KEY,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  nextThemeChoice,
  parseContrastChoice,
  parseThemeChoice,
  resolveTheme,
  themeColor,
  themeControlLabel,
} from "./theme";

describe("parseThemeChoice", () => {
  it("keeps every supported choice", () => {
    expect(parseThemeChoice("light")).toBe("light");
    expect(parseThemeChoice("dark")).toBe("dark");
    expect(parseThemeChoice("system")).toBe("system");
  });

  it("falls back to system for missing or tampered storage values", () => {
    expect(parseThemeChoice(null)).toBe("system");
    expect(parseThemeChoice(undefined)).toBe("system");
    expect(parseThemeChoice("")).toBe("system");
    expect(parseThemeChoice("<script>")).toBe("system");
  });
});

describe("parseContrastChoice", () => {
  it("only accepts the explicit high value", () => {
    expect(parseContrastChoice("high")).toBe("high");
    expect(parseContrastChoice("normal")).toBe("normal");
    expect(parseContrastChoice(null)).toBe("normal");
    expect(parseContrastChoice("HIGH")).toBe("normal");
  });
});

describe("resolveTheme", () => {
  it("follows the system signal only when the choice is system", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });

  it("lets an explicit choice win over the system signal", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });
});

describe("nextThemeChoice", () => {
  it("cycles system, light, dark and returns to system", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });
});

describe("themeControlLabel", () => {
  it("names the active choice and what is on screen", () => {
    expect(themeControlLabel("system", "dark")).toBe(
      "Theme: follow system, currently showing dark",
    );
    expect(themeControlLabel("light", "light")).toBe(
      "Theme: light, currently showing light",
    );
  });
});

describe("themeColor", () => {
  it("returns a distinct browser chrome colour per scheme", () => {
    expect(themeColor("dark")).toBe("#111310");
    expect(themeColor("light")).toBe("#f4f3ed");
    expect(themeColor("dark")).not.toBe(themeColor("light"));
  });
});

describe("THEME_BOOTSTRAP_SCRIPT", () => {
  it("reads both preference keys", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(THEME_STORAGE_KEY);
    expect(THEME_BOOTSTRAP_SCRIPT).toContain(CONTRAST_STORAGE_KEY);
  });

  it("cannot break out of the script element it is inlined into", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).not.toContain("</script");
    expect(THEME_BOOTSTRAP_SCRIPT).not.toContain("<!--");
  });

  it("degrades silently when storage is blocked", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain("catch(e){}");
  });
});
