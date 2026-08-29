// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cycleTheme,
  getContrast,
  getResolvedTheme,
  getThemeChoice,
  serverContrast,
  serverResolvedTheme,
  serverThemeChoice,
  subscribe,
  syncResolvedTheme,
  toggleContrast,
} from "./appearance-store";
import {
  CONTRAST_STORAGE_KEY,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
} from "./theme";

/** Minimal in-memory Storage, so the disabled-storage path can be forced. */
function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  } satisfies Storage;
}

let storage = createStorage();

/** Stand in for `matchMedia`, which happy-dom does not implement. */
function stubSystemDark(prefersDark: boolean) {
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: prefersDark,
      addEventListener: (_: string, fn: () => void) => listeners.add(fn),
      removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
    })),
  );
  return listeners;
}

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-theme-choice");
  document.documentElement.removeAttribute("data-contrast");
  document.head.innerHTML = '<meta name="theme-color" content="#f4f3ed" />';
  storage = createStorage();
  vi.stubGlobal("localStorage", storage);
  stubSystemDark(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("snapshots", () => {
  it("defaults to system and normal contrast when nothing is set", () => {
    expect(getThemeChoice()).toBe("system");
    expect(getContrast()).toBe("normal");
  });

  it("reads what the pre-paint bootstrap wrote onto the root element", () => {
    document.documentElement.dataset.themeChoice = "dark";
    document.documentElement.dataset.contrast = "high";
    expect(getThemeChoice()).toBe("dark");
    expect(getContrast()).toBe("high");
  });

  it("ignores a tampered storage value", () => {
    document.documentElement.dataset.themeChoice = "'; drop table";
    expect(getThemeChoice()).toBe("system");
  });

  it("resolves system against the operating system preference", () => {
    stubSystemDark(true);
    expect(getResolvedTheme()).toBe("dark");
    stubSystemDark(false);
    expect(getResolvedTheme()).toBe("light");
  });

  it("lets an explicit choice override the operating system", () => {
    stubSystemDark(true);
    document.documentElement.dataset.themeChoice = "light";
    expect(getResolvedTheme()).toBe("light");
  });

  it("uses stable server snapshots so hydration cannot mismatch", () => {
    expect(serverThemeChoice()).toBe("system");
    expect(serverResolvedTheme()).toBe("light");
    expect(serverContrast()).toBe("normal");
  });
});

describe("cycleTheme", () => {
  it("advances system to light to dark and back", () => {
    cycleTheme();
    expect(getThemeChoice()).toBe("light");
    cycleTheme();
    expect(getThemeChoice()).toBe("dark");
    cycleTheme();
    expect(getThemeChoice()).toBe("system");
  });

  it("writes the resolved scheme onto the root element", () => {
    cycleTheme();
    cycleTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themeChoice).toBe("dark");
  });

  it("persists the choice so a reload keeps it", () => {
    cycleTheme();
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });

  it("updates the browser chrome colour to match", () => {
    cycleTheme();
    cycleTheme();
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe("#111310");
  });

  it("still switches when storage is unavailable", () => {
    vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    expect(() => cycleTheme()).not.toThrow();
    expect(document.documentElement.dataset.themeChoice).toBe("light");
  });
});

describe("toggleContrast", () => {
  it("flips between normal and high", () => {
    toggleContrast();
    expect(getContrast()).toBe("high");
    toggleContrast();
    expect(getContrast()).toBe("normal");
  });

  it("persists the preference", () => {
    toggleContrast();
    expect(storage.getItem(CONTRAST_STORAGE_KEY)).toBe("high");
  });

  it("does not disturb the colour scheme", () => {
    cycleTheme();
    cycleTheme();
    toggleContrast();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(getContrast()).toBe("high");
  });
});

describe("subscribe", () => {
  it("notifies on an in-app change and stops after unsubscribing", () => {
    const onChange = vi.fn();
    const unsubscribe = subscribe(onChange);
    cycleTheme();
    expect(onChange).toHaveBeenCalledTimes(1);
    toggleContrast();
    expect(onChange).toHaveBeenCalledTimes(2);
    unsubscribe();
    cycleTheme();
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});

describe("syncResolvedTheme", () => {
  it("writes the resolved scheme when the operating system flips", () => {
    document.documentElement.dataset.theme = "light";
    stubSystemDark(true);
    syncResolvedTheme();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("leaves the attribute alone when it already matches", () => {
    document.documentElement.dataset.theme = "light";
    const spy = vi.spyOn(document, "querySelector");
    syncResolvedTheme();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("THEME_BOOTSTRAP_SCRIPT", () => {
  it("applies stored preferences to the root element before paint", () => {
    storage.setItem(THEME_STORAGE_KEY, "dark");
    storage.setItem(CONTRAST_STORAGE_KEY, "high");
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themeChoice).toBe("dark");
    expect(document.documentElement.dataset.contrast).toBe("high");
  });

  it("follows the operating system when the choice is system", () => {
    stubSystemDark(true);
    new Function(THEME_BOOTSTRAP_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.themeChoice).toBe("system");
  });

  it("falls back to light rather than throwing when storage is blocked", () => {
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("storage disabled");
    });
    expect(() => new Function(THEME_BOOTSTRAP_SCRIPT)()).not.toThrow();
  });
});
