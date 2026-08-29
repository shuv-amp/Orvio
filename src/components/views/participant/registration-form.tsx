"use client";

import { QrCode, UserPlus } from "lucide-react";
import { useId, useState } from "react";
import {
  ALLOWED_INTERESTS,
  ALLOWED_ROLES,
  ALLOWED_SKILLS,
} from "@/lib/domain/registration";

export interface RegistrationDraft {
  name: string;
  role: string;
  skills: string[];
  interests: string[];
}

function toggle(value: string, selected: string[]): string[] {
  return selected.includes(value)
    ? selected.filter((item) => item !== value)
    : [...selected, value];
}

/**
 * Walk-up registration.
 *
 * Skills, interests, and roles come from a fixed allowlist rather than free
 * text, which is what lets the server accept the submission without trusting
 * it. The same allowlist is enforced again in `registerAttendee`; this form is
 * a convenience, not the control.
 */
export function RegistrationForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (draft: RegistrationDraft) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(ALLOWED_ROLES[0]);
  const [skills, setSkills] = useState<string[]>(["UI/UX"]);
  const [interests, setInterests] = useState<string[]>(["Climate"]);
  const fieldId = useId();

  return (
    <section className="panel registration-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">
            <UserPlus size={13} aria-hidden="true" />
            Registration &amp; attendee check-in
          </p>
          <h3>Issue a unique QR pass</h3>
        </div>
        <span className="plain-meta">Allowlisted skills · no PII in QR</span>
      </div>

      <form
        className="registration-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({ name, role, skills, interests });
        }}
      >
        <div className="registration-row">
          <div className="field">
            <label htmlFor={`${fieldId}-name`}>Full name</label>
            <input
              id={`${fieldId}-name`}
              name="name"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Walk-up attendee name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor={`${fieldId}-role`}>Role</label>
            <select
              id={`${fieldId}-role`}
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {ALLOWED_ROLES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ChipGroup
          legend="Skills"
          name="skills"
          options={ALLOWED_SKILLS}
          selected={skills}
          onToggle={(value) => setSkills((current) => toggle(value, current))}
        />
        <ChipGroup
          legend="Project interests"
          name="interests"
          options={ALLOWED_INTERESTS}
          selected={interests}
          onToggle={(value) =>
            setInterests((current) => toggle(value, current))
          }
        />

        <button className="primary-button full" type="submit" disabled={busy}>
          <QrCode size={16} aria-hidden="true" />
          {busy ? "Issuing pass…" : "Register and issue QR pass"}
        </button>
      </form>
    </section>
  );
}

/**
 * Checkbox group rendered as chips. These stay native checkboxes so keyboard
 * behaviour, grouping, and the checked state come from the platform.
 */
function ChipGroup({
  legend,
  name,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  name: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="chip-fieldset">
      <legend>{legend}</legend>
      <div className="chip-options">
        {options.map((option) => (
          <label
            key={option}
            className={`chip ${selected.includes(option) ? "checked" : ""}`}
          >
            <input
              type="checkbox"
              name={name}
              value={option}
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
