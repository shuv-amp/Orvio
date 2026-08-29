import { containsHtml, sanitizeUserText } from "./sanitize";
import type { Participant } from "./types";

export const ALLOWED_ROLES = [
  "Product designer",
  "Frontend engineer",
  "Backend engineer",
  "ML engineer",
  "Cloud engineer",
] as const;

export const ALLOWED_SKILLS = [
  "AI/ML",
  "Backend",
  "Cloud",
  "Frontend",
  "Product",
  "Pitching",
  "Research",
  "UI/UX",
] as const;

export const ALLOWED_INTERESTS = [
  "Climate",
  "Civic tech",
  "AI agents",
  "Health",
  "Education",
  "Fintech",
] as const;

export interface RegistrationInput {
  name: string;
  role: string;
  skills: string[];
  interests: string[];
}

export type RegistrationResult =
  | { ok: true; ticketId: string; participant: Participant }
  | { ok: false; error: string };

function initialsFrom(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function isAllowed<T extends string>(value: string, allowed: readonly T[]) {
  return (allowed as readonly string[]).includes(value);
}

/**
 * Validate a walk-up or virtual registration against the fixed taxonomy.
 * Returns a unique ticket UUID on success; never trusts free-text skills.
 */
export function registerAttendee(
  input: RegistrationInput,
  ticketId = crypto.randomUUID(),
): RegistrationResult {
  const name = sanitizeUserText(input.name, 80);
  if (containsHtml(input.name) || name.length < 2) {
    return {
      ok: false,
      error: "Enter a 2–80 character name without HTML or markup.",
    };
  }
  if (!isAllowed(input.role, ALLOWED_ROLES)) {
    return { ok: false, error: "Choose a role from the event taxonomy." };
  }
  const skills = [...new Set(input.skills)].filter((skill) =>
    isAllowed(skill, ALLOWED_SKILLS),
  );
  const interests = [...new Set(input.interests)].filter((interest) =>
    isAllowed(interest, ALLOWED_INTERESTS),
  );
  if (skills.length < 1 || skills.length > 4) {
    return { ok: false, error: "Select 1 to 4 skills from the allowlist." };
  }
  if (interests.length < 1 || interests.length > 4) {
    return { ok: false, error: "Select 1 to 4 project interests." };
  }

  return {
    ok: true,
    ticketId,
    participant: {
      id: `p-${ticketId.slice(0, 8)}`,
      name,
      initials: initialsFrom(name),
      role: input.role,
      skills,
      interests,
      availability: 1,
      checkedIn: false,
    },
  };
}
