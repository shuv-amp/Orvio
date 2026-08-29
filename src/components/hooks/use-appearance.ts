"use client";

import { useEffect, useSyncExternalStore } from "react";
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
} from "@/lib/ui/appearance-store";

/**
 * Colour scheme and contrast preferences.
 *
 * State lives on the `<html>` element, where the pre-paint bootstrap already
 * put it, and is read through `useSyncExternalStore`. That keeps the server
 * markup, the pre-paint state, and React's first client render in agreement —
 * no flash of the wrong theme and no hydration mismatch.
 */
export function useAppearance() {
  const themeChoice = useSyncExternalStore(
    subscribe,
    getThemeChoice,
    serverThemeChoice,
  );
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    getResolvedTheme,
    serverResolvedTheme,
  );
  const contrast = useSyncExternalStore(subscribe, getContrast, serverContrast);

  // Write the resolved scheme back to the DOM when the operating system flips
  // while the user is on the `system` setting.
  useEffect(syncResolvedTheme, [resolvedTheme]);

  return {
    themeChoice,
    resolvedTheme,
    contrast,
    cycleTheme,
    toggleContrast,
  } as const;
}
