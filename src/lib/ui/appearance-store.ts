import {
  CONTRAST_STORAGE_KEY,
  THEME_STORAGE_KEY,
  nextThemeChoice,
  parseContrastChoice,
  parseThemeChoice,
  resolveTheme,
  themeColor,
  type ContrastChoice,
  type ResolvedTheme,
  type ThemeChoice,
} from "./theme";

/**
 * Appearance store.
 *
 * `<html>` is the single source of truth for the active theme: the inline
 * bootstrap writes the data attributes before first paint, and this store
 * reads and updates the same attributes. Nothing has to be mirrored into React
 * state, so there is no window where the DOM and the component disagree, and
 * no light-to-dark flash on load.
 *
 * The store is exposed as a `useSyncExternalStore` triple.
 */

const DARK_QUERY = "(prefers-color-scheme: dark)";
const CHANGE_EVENT = "orvio:appearance";

function root(): HTMLElement {
  return document.documentElement;
}

function announce(): void {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function persist(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing can refuse storage. The preference still applies for
    // this session; only persistence across reloads is lost.
  }
}

/** Subscribe to both user-driven changes and operating system changes. */
export function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/**
 * Snapshots return primitives, never fresh objects, so React can compare them
 * by value and avoid re-rendering on every store read.
 */
export function getThemeChoice(): ThemeChoice {
  return parseThemeChoice(root().dataset.themeChoice);
}

export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getThemeChoice(), window.matchMedia(DARK_QUERY).matches);
}

export function getContrast(): ContrastChoice {
  return parseContrastChoice(root().dataset.contrast);
}

/** Server render and the very first client render agree on these defaults. */
export const serverThemeChoice = (): ThemeChoice => "system";
export const serverResolvedTheme = (): ResolvedTheme => "light";
export const serverContrast = (): ContrastChoice => "normal";

/** Advance the colour scheme: system → light → dark → system. */
export function cycleTheme(): void {
  const next = nextThemeChoice(getThemeChoice());
  const resolved = resolveTheme(next, window.matchMedia(DARK_QUERY).matches);
  root().dataset.themeChoice = next;
  root().dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor(resolved));
  persist(THEME_STORAGE_KEY, next);
  announce();
}

/** Turn the high-contrast palette on or off, independently of the scheme. */
export function toggleContrast(): void {
  const next: ContrastChoice = getContrast() === "high" ? "normal" : "high";
  root().dataset.contrast = next;
  persist(CONTRAST_STORAGE_KEY, next);
  announce();
}

/**
 * Keep `data-theme` correct when the operating system flips while the user is
 * on the `system` setting. Called from a layout effect in the shell.
 */
export function syncResolvedTheme(): void {
  const resolved = getResolvedTheme();
  if (root().dataset.theme === resolved) return;
  root().dataset.theme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor(resolved));
}
