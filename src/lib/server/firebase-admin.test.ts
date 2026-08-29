import { afterEach, describe, expect, it } from "vitest";
import { authorize } from "./firebase-admin";

afterEach(() => {
  delete process.env.APP_MODE;
  delete process.env.FIREBASE_PROJECT_ID;
  delete process.env.GOOGLE_CLOUD_PROJECT;
});

describe("authorization boundary", () => {
  it("fails closed when cloud auth is unconfigured", async () => {
    process.env.APP_MODE = "cloud";
    await expect(
      authorize(new Request("http://local"), ["organizer"]),
    ).resolves.toBeNull();
  });

  it("labels demo identity as synthetic and scoped", async () => {
    process.env.APP_MODE = "demo";
    await expect(
      authorize(new Request("http://local"), ["judge"]),
    ).resolves.toEqual({ uid: "demo-user", role: "judge", synthetic: true });
  });

  it("defaults to synthetic demo when APP_MODE is unset", async () => {
    await expect(
      authorize(new Request("http://local"), ["participant"]),
    ).resolves.toMatchObject({ synthetic: true, role: "participant" });
  });
});
