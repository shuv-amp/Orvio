import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { GET as health } from "./healthz/route";
import { GET as ready } from "./readyz/route";
import { POST as issue } from "./check-ins/issue/route";
import { POST as sync } from "./check-ins/sync/route";
import { POST as recover } from "./recovery/route";
import { POST as register } from "./registration/route";
import { DEMO_EVENT_ID } from "@/lib/domain/demo";
import { clearRateLimitsForTesting, limitFor } from "@/lib/server/rate-limit";

const jsonRequest = (url: string, body: unknown, origin = "http://local") =>
  new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });

beforeAll(() => {
  process.env.APP_MODE = "demo";
});
afterAll(() => {
  delete process.env.APP_MODE;
});
afterEach(() => {
  delete process.env.GOOGLE_CLOUD_PROJECT;
  delete process.env.GEMINI_API_KEY;
});
beforeEach(() => {
  clearRateLimitsForTesting();
});

describe("route contracts", () => {
  it("reports the configured mode on the readiness probe", async () => {
    const response = ready();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      status: "ready",
      mode: "demo",
    });
  });

  it("labels the readiness mode unconfigured when APP_MODE is absent", async () => {
    delete process.env.APP_MODE;
    const response = ready();
    await expect(response.json()).resolves.toMatchObject({
      mode: "unconfigured",
    });
    process.env.APP_MODE = "demo";
  });

  it("exposes a no-store health response", async () => {
    const response = health();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      service: "orvio-pulse",
    });
  });

  it("rejects malformed ticket issuance", async () => {
    const response = await issue(
      jsonRequest("http://local/api/check-ins/issue", {
        eventId: "x",
        ticketId: "guessable",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("issues and consumes a signed pass once", async () => {
    const ticketId = randomUUID();
    const issued = await issue(
      jsonRequest("http://local/api/check-ins/issue", {
        eventId: DEMO_EVENT_ID,
        ticketId,
      }),
    );
    const { token } = await issued.json();
    expect(issued.headers.get("cache-control")).toBe("no-store");
    const input = {
      eventId: DEMO_EVENT_ID,
      qrToken: token,
      scannerId: "north-gate-01",
      scannedAt: new Date().toISOString(),
      idempotencyKey: randomUUID(),
    };
    const accepted = await sync(
      jsonRequest("http://local/api/check-ins/sync", input),
    );
    expect(await accepted.json()).toMatchObject({ status: "accepted" });
    const duplicate = await sync(
      jsonRequest("http://local/api/check-ins/sync", {
        ...input,
        idempotencyKey: randomUUID(),
      }),
    );
    expect(await duplicate.json()).toMatchObject({ status: "duplicate" });
  });

  it("rejects an unverifiable scanner payload", async () => {
    const response = await sync(
      jsonRequest("http://local/api/check-ins/sync", {
        eventId: DEMO_EVENT_ID,
        qrToken: "not-a-token",
        scannerId: "north-gate-01",
        scannedAt: "yesterday",
        idempotencyKey: "x",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ status: "invalid" });
  });

  it("blocks demo calls outside the synthetic event boundary", async () => {
    const response = await issue(
      jsonRequest("http://local/api/check-ins/issue", {
        eventId: "real-event",
        ticketId: randomUUID(),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("rate-limits pass issuance before signing unbounded tokens", async () => {
    // The demo runs on one shared synthetic identity, so the allowance is the
    // widened one from limitFor rather than the strict production limit.
    const allowance = limitFor(true, 20);
    for (let index = 0; index < allowance; index += 1) {
      const response = await issue(
        jsonRequest("http://local/api/check-ins/issue", {
          eventId: DEMO_EVENT_ID,
          ticketId: randomUUID(),
        }),
      );
      expect(response.status).toBe(200);
    }
    const blocked = await issue(
      jsonRequest("http://local/api/check-ins/issue", {
        eventId: DEMO_EVENT_ID,
        ticketId: randomUUID(),
      }),
    );
    expect(blocked.status).toBe(429);
  });

  it.each(["judge-dropout", "gate-surge", "venue-relocation"])(
    "returns a declared fallback for %s when Vertex AI is unconfigured",
    async (incident) => {
      const response = await recover(
        jsonRequest("http://local/api/recovery", { incident }),
      );
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        status: "draft",
        source: "deterministic-fallback",
        comparison: { label: expect.any(String) },
      });
    },
  );

  it("rejects unsupported recovery incidents", async () => {
    const response = await recover(
      jsonRequest("http://local/api/recovery", { incident: "invented" }),
    );
    expect(response.status).toBe(400);
  });

  it("blocks cross-origin mutations before signing or scoring", async () => {
    const response = await issue(
      jsonRequest(
        "http://local/api/check-ins/issue",
        { eventId: DEMO_EVENT_ID, ticketId: randomUUID() },
        "https://evil.example",
      ),
    );
    expect(response.status).toBe(403);
  });

  it("registers an attendee and returns a unique signed QR pass", async () => {
    const response = await register(
      jsonRequest("http://local/api/registration", {
        eventId: DEMO_EVENT_ID,
        name: "Riya Sen",
        role: "Frontend engineer",
        skills: ["Frontend", "UI/UX"],
        interests: ["Climate"],
      }),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ticketId).toMatch(/^[0-9a-f-]{36}$/i);
    expect(body.token).toMatch(/^ey/);
    expect(body.participant.name).toBe("Riya Sen");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects XSS names at the registration boundary", async () => {
    const response = await register(
      jsonRequest("http://local/api/registration", {
        eventId: DEMO_EVENT_ID,
        name: "<script>alert(1)</script>",
        role: "Frontend engineer",
        skills: ["Frontend"],
        interests: ["Climate"],
      }),
    );
    expect(response.status).toBe(400);
  });
});
