/**
 * Appearance preferences.
 *
 * Colour scheme and contrast are stored separately because they answer
 * different questions: colour scheme is taste, contrast is an accessibility
 * need. A user who wants a dark interface should not lose the high-contrast
 * palette, and vice versa.
 *
 * Every function here is pure so the resolution rules can be unit tested
 * without a DOM.
 */

/** What the user picked. `system` defers to the operating system. */
export type ThemeChoice = "system" | "light" | "dark";

/** The scheme actually painted after `system` has been resolved. */
export type ResolvedTheme = "light" | "dark";

/** Contrast preference, independent of the colour scheme. */
export type ContrastChoice = "normal" | "high";

export const THEME_STORAGE_KEY = "orvio-theme";
export const CONTRAST_STORAGE_KEY = "orvio-contrast";

const THEME_CHOICES: readonly ThemeChoice[] = ["system", "light", "dark"];

/** Narrow untrusted storage values to a known choice, defaulting to `system`. */
export function parseThemeChoice(raw: string | null | undefined): ThemeChoice {
  return THEME_CHOICES.includes(raw as ThemeChoice)
    ? (raw as ThemeChoice)
    : "system";
}

/** Narrow untrusted storage values to a known contrast, defaulting to `normal`. */
export function parseContrastChoice(
  raw: string | null | undefined,
): ContrastChoice {
  return raw === "high" ? "high" : "normal";
}

/** Collapse `system` into the scheme the operating system is asking for. */
export function resolveTheme(
  choice: ThemeChoice,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (choice === "system") return systemPrefersDark ? "dark" : "light";
  return choice;
}

/** Order used by the topbar control: system → light → dark → system. */
export function nextThemeChoice(current: ThemeChoice): ThemeChoice {
  const index = THEME_CHOICES.indexOf(current);
  return THEME_CHOICES[(index + 1) % THEME_CHOICES.length];
}

/** Accessible name for the theme control, stating what the next press does. */
export function themeControlLabel(
  current: ThemeChoice,
  resolved: ResolvedTheme,
): string {
  const showing = `currently showing ${resolved}`;
  if (current === "system") return `Theme: follow system, ${showing}`;
  return `Theme: ${current}, ${showing}`;
}

/** `<meta name="theme-color">` value so browser chrome matches the app. */
export function themeColor(resolved: ResolvedTheme): string {
  return resolved === "dark" ? "#111310" : "#f4f3ed";
}

/**
 * Inline bootstrap that applies stored preferences before first paint.
 *
 * This runs synchronously in `<head>` to avoid a light-to-dark flash. It is
 * injected with the per-request CSP nonce, reads only its own two storage
 * keys, and interpolates nothing from the request.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
if(t!=="light"&&t!=="dark"&&t!=="system")t="system";
var dark=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.dataset.theme=dark?"dark":"light";
d.dataset.themeChoice=t;
d.dataset.contrast=localStorage.getItem(${JSON.stringify(CONTRAST_STORAGE_KEY)})==="high"?"high":"normal";
}catch(e){}})();`;
