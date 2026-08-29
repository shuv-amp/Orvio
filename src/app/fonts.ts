import localFont from "next/font/local";

/**
 * Self-hosted variable fonts.
 *
 * The files are committed to the repository and loaded through
 * `next/font/local`, so a production build never contacts a font CDN. That
 * keeps builds reproducible offline, removes a third-party origin from the
 * Content-Security-Policy, and lets Next emit `size-adjust` fallback metrics
 * that hold layout steady while the real face loads.
 */

/** Editorial display serif used for page and panel headings. */
export const displaySerif = localFont({
  src: "./fonts/Fraunces-latin.woff2",
  weight: "300 700",
  style: "normal",
  display: "swap",
  variable: "--font-display",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
  preload: true,
});

/** Interface sans used for body copy, labels, and controls. */
export const interfaceSans = localFont({
  src: "./fonts/Inter-latin.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-sans",
  fallback: [
    "ui-sans-serif",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "sans-serif",
  ],
  adjustFontFallback: "Arial",
  preload: true,
});

/** Monospace used for ticket identifiers, tokens, and audit timestamps. */
export const monoFont = localFont({
  src: "./fonts/JetBrainsMono-latin.woff2",
  weight: "400 700",
  style: "normal",
  display: "swap",
  variable: "--font-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  preload: false,
});

/** Class list that exposes every font custom property on `<html>`. */
export const fontVariables = [
  displaySerif.variable,
  interfaceSans.variable,
  monoFont.variable,
].join(" ");
