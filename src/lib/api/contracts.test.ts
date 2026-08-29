import { afterEach, describe, expect, it, vi } from "vitest";
import { isApiError, postJson } from "./contracts";

function respondWith(body: unknown, init?: ResponseInit) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify(body), init)),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isApiError", () => {
  it("recognises the error envelope", () => {
    expect(isApiError({ error: "nope" })).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isApiError({ token: "abc" })).toBe(false);
    expect(isApiError({ error: 500 })).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError("error")).toBe(false);
    expect(isApiError([])).toBe(false);
  });
});

describe("postJson", () => {
  it("returns the parsed payload on success", async () => {
    respondWith({ token: "ey.abc", expiresInSeconds: 100 });
    const result = await postJson<{ token: string }>("/api/x", { a: 1 });
    expect(result).toEqual({
      ok: true,
      data: { token: "ey.abc", expiresInSeconds: 100 },
    });
  });

  it("sends the body as JSON with the right method and header", async () => {
    respondWith({ ok: true });
    await postJson("/api/x", { a: 1 });
    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toBe("/api/x");
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.body).toBe(JSON.stringify({ a: 1 }));
    expect((call[1]?.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("surfaces the server's message on a rejected request", async () => {
    respondWith({ error: "Too many pass requests" }, { status: 429 });
    const result = await postJson("/api/x", {});
    expect(result).toEqual({ ok: false, error: "Too many pass requests" });
  });

  it("falls back to a generic message when the body has no error field", async () => {
    respondWith({ unexpected: true }, { status: 500 });
    const result = await postJson("/api/x", {});
    expect(result).toEqual({ ok: false, error: "Request failed" });
  });

  it("reports an unreachable service rather than throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network down");
      }),
    );
    const result = await postJson("/api/x", {});
    expect(result).toEqual({
      ok: false,
      error: "The service could not be reached.",
    });
  });

  it("marks an aborted request distinctly so unmounts stay silent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("aborted", "AbortError");
      }),
    );
    const result = await postJson("/api/x", {});
    expect(result).toEqual({ ok: false, error: "aborted" });
  });

  it("treats malformed JSON as an unreachable service", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not json", { status: 200 })),
    );
    const result = await postJson("/api/x", {});
    expect(result.ok).toBe(false);
  });
});
