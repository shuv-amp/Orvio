import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { recordCheckIn } from "./check-in-store";

describe("check-in replay protection", () => {
  it("accepts a ticket once and rejects a second operation", async () => {
    const ticketId = randomUUID();
    const first = await recordCheckIn({
      eventId: "test-event",
      ticketId,
      jti: randomUUID(),
      scannerId: "scanner-1",
      scannedAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
    });
    const second = await recordCheckIn({
      eventId: "test-event",
      ticketId,
      jti: randomUUID(),
      scannerId: "scanner-2",
      scannedAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
    });
    expect(first).toBe("accepted");
    expect(second).toBe("duplicate");
  });

  it("treats an idempotency key as operation-scoped replay protection", async () => {
    const idempotencyKey = randomUUID();
    const first = await recordCheckIn({
      eventId: "test-idempotency",
      ticketId: randomUUID(),
      jti: randomUUID(),
      scannerId: "scanner-1",
      scannedAt: new Date().toISOString(),
      idempotencyKey,
    });
    const second = await recordCheckIn({
      eventId: "test-idempotency",
      ticketId: randomUUID(),
      jti: randomUUID(),
      scannerId: "scanner-1",
      scannedAt: new Date().toISOString(),
      idempotencyKey,
    });
    expect([first, second]).toEqual(["accepted", "duplicate"]);
  });
});
