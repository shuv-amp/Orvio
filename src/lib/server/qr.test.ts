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
    await expect(verifyQrToken(token, "other-event")).rejects.toThrow("another event");
  });

  it("rejects tampering", async () => {
    const token = await issueQrToken("event-2026", ticketId);
    await expect(verifyQrToken(`${token.slice(0, -1)}x`, "event-2026")).rejects.toThrow();
  });
});
