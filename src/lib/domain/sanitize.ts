const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_MARKUP = /<\/?[a-z][\s\S]*>/i;

/**
 * Escape untrusted text before any HTML interpolation.
 * React already encodes JSX children; this is the explicit XSS control
 * for tests, QR labels, and any future non-React renderer.
 */
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** True when the string still contains HTML/script markup after trimming. */
export function containsHtml(value: string): boolean {
  return HTML_MARKUP.test(value);
}

/**
 * Normalize attendee-authored text: strip control characters, collapse
 * whitespace, and cap length. Does not interpret HTML.
 */
export function sanitizeUserText(value: string, maxLength: number): string {
  return value
    .replace(CONTROL_CHARS, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
