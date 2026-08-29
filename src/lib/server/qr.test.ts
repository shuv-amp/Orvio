import { describe, expect, it } from "vitest";
import { issueQrToken, verifyQrToken } from "./qr";

const ticketId = "5c327c3a-2d3f-49c6-b087-f8de29ae1042";

describe("signed check-in passes", () => {
  it("round-trips operation-scoped claims without PII", async () => {
    const token = await issueQrToken("event-2026", ticketId);
    const claims = await verifyQrToken(token, "event-2026");
    expect(claims.ticketId).toBe(ticketId);
    expect(claims.aud).toBe("orvio-check-in");
    expect(JSON.stringify(claims)).not.toMatch(/email|phone|name/i);
  });

  it("rejects a token at the wrong event boundary", async () => {
    const token = await issueQrToken("event-2026", ticketId);
    await expect(verifyQrToken(token, "other-event")).rejects.toThrow(
      "another event",
    );
  });

  it("rejects tampering", async () => {
    const token = await issueQrToken("event-2026", ticketId);
    // Flip a character in the middle of the signature to reliably corrupt it.
    const parts = token.split(".");
    const sig = parts[2];
    const mid = Math.floor(sig.length / 2);
    const flipped = sig[mid] === "A" ? "B" : "A";
    parts[2] = sig.slice(0, mid) + flipped + sig.slice(mid + 1);
    await expect(
      verifyQrToken(parts.join("."), "event-2026"),
    ).rejects.toThrow();
  });

  it("issues a unique replay nonce for every pass", async () => {
    const first = await verifyQrToken(
      await issueQrToken("event-2026", ticketId),
      "event-2026",
    );
    const second = await verifyQrToken(
      await issueQrToken("event-2026", ticketId),
      "event-2026",
    );
    expect(first.jti).not.toBe(second.jti);
  });

  it("rejects expired passes", async () => {
    const token = await issueQrToken("event-2026", ticketId, -1);
    await expect(verifyQrToken(token, "event-2026")).rejects.toThrow();
  });
});
