import { describe, expect, it } from "vitest";
import {
  RequestGuardError,
  assertSameOrigin,
  readJsonObject,
} from "./request-guard";

function post(url: string, body: string, headers: Record<string, string>) {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body,
  });
}

describe("Origin and CSRF request guards", () => {
  it("rejects missing Origin to block classic CSRF form posts", () => {
    expect(() =>
      assertSameOrigin(post("http://local/api/recovery", "{}", {})),
    ).toThrow(RequestGuardError);
  });

  it("rejects a cross-origin Origin header", () => {
    expect(() =>
      assertSameOrigin(
        post("http://local/api/recovery", "{}", {
          Origin: "https://evil.example",
        }),
      ),
    ).toThrow(/Cross-origin/);
  });

  it("accepts a same-origin JSON object under the byte cap", async () => {
    const payload = await readJsonObject(
      post("http://local/api/recovery", `{"incident":"gate-surge"}`, {
        Origin: "http://local",
      }),
    );
    expect(payload).toEqual({ incident: "gate-surge" });
  });

  it("rejects oversized payloads before parsing", async () => {
    await expect(
      readJsonObject(
        post("http://local/api/recovery", `{"pad":"${"x".repeat(200)}"}`, {
          Origin: "http://local",
          "Content-Length": "9000",
        }),
        64,
      ),
    ).rejects.toMatchObject({ status: 413 });
  });

  it("rejects javascript: origins and malformed Origin values", () => {
    expect(() =>
      assertSameOrigin(
        post("http://local/api/recovery", "{}", {
          Origin: "javascript:alert(1)",
        }),
      ),
    ).toThrow(/Unsupported origin protocol|Invalid origin/);
    expect(() =>
      assertSameOrigin(
        post("http://local/api/recovery", "{}", { Origin: "not a url" }),
      ),
    ).toThrow(/Invalid origin/);
  });

  it("rejects oversized bodies even when Content-Length is omitted", async () => {
    await expect(
      readJsonObject(
        post("http://local/api/recovery", `{"pad":"${"x".repeat(80)}"}`, {
          Origin: "http://local",
        }),
        32,
      ),
    ).rejects.toMatchObject({ status: 413 });
  });

  it("rejects JSON arrays and invalid documents", async () => {
    await expect(
      readJsonObject(
        post("http://local/api/recovery", "[1]", {
          Origin: "http://local",
        }),
      ),
    ).rejects.toMatchObject({ message: "JSON object required" });
    await expect(
      readJsonObject(
        post("http://local/api/recovery", "{", { Origin: "http://local" }),
      ),
    ).rejects.toMatchObject({ message: "Invalid JSON" });
  });
});
