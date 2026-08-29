import { describe, expect, it } from "vitest";
import { registerAttendee } from "./registration";

describe("registration validation and unique ticket issuance", () => {
  const valid = {
    name: "Riya Sen",
    role: "Frontend engineer",
    skills: ["Frontend", "UI/UX"],
    interests: ["Climate"],
  };

  it("issues a unique ticket UUID for a valid attendee", () => {
    const first = registerAttendee(valid);
    const second = registerAttendee(valid);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.ticketId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
      expect(first.ticketId).not.toBe(second.ticketId);
      expect(first.participant.name).toBe("Riya Sen");
      expect(first.participant.checkedIn).toBe(false);
    }
  });

  it("rejects XSS markup in names", () => {
    const result = registerAttendee({
      ...valid,
      name: `<img src=x onerror=alert(1)>`,
    });
    expect(result).toEqual({
      ok: false,
      error: "Enter a 2–80 character name without HTML or markup.",
    });
  });

  it("rejects empty, short, and oversized names", () => {
    expect(registerAttendee({ ...valid, name: " " }).ok).toBe(false);
    expect(registerAttendee({ ...valid, name: "A" }).ok).toBe(false);
  });

  it("rejects roles and skills outside the taxonomy", () => {
    expect(registerAttendee({ ...valid, role: "admin" }).ok).toBe(false);
    expect(
      registerAttendee({ ...valid, skills: ["eval", "Frontend"] }).ok,
    ).toBe(true);
    expect(registerAttendee({ ...valid, skills: ["eval"] }).ok).toBe(false);
    expect(registerAttendee({ ...valid, interests: [] }).ok).toBe(false);
  });

  it("issues initials for a single-token name", () => {
    const result = registerAttendee({ ...valid, name: "Neel" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.participant.initials).toBe("NE");
  });

  it("caps skill and interest cardinality", () => {
    expect(
      registerAttendee({
        ...valid,
        skills: ["AI/ML", "Backend", "Cloud", "Frontend", "Product"],
      }).ok,
    ).toBe(false);
  });
});
