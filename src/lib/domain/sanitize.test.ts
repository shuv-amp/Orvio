import { describe, expect, it } from "vitest";
import { containsHtml, escapeHtml, sanitizeUserText } from "./sanitize";

describe("Input Sanitization & XSS", () => {
  it("escapes script injection before any HTML interpolation", () => {
    expect(escapeHtml(`<script>alert("xss")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
  });

  it("escapes image onerror payloads", () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)>`)).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    );
  });

  it("escapes ampersands so encoded attacks cannot be rehydrated", () => {
    expect(escapeHtml("&lt;script&gt;")).toBe("&amp;lt;script&amp;gt;");
  });

  it("detects HTML and javascript-style markup in names", () => {
    expect(containsHtml(`Aanya <svg onload=alert(1)>`)).toBe(true);
    expect(containsHtml("Aanya Sharma")).toBe(false);
  });

  it("strips control characters and caps length", () => {
    expect(sanitizeUserText("  Aanya\u0000 Sharma  ", 80)).toBe("Aanya Sharma");
    expect(sanitizeUserText("x".repeat(400), 20)).toHaveLength(20);
  });

  it("rejects empty or whitespace-only input after normalization", () => {
    expect(sanitizeUserText(" \n\t ", 80)).toBe("");
  });
});
