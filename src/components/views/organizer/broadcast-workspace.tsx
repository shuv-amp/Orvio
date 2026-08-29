"use client";

import { Megaphone, Send, ShieldCheck } from "lucide-react";
import { useId, useState } from "react";
import { containsHtml, sanitizeUserText } from "@/lib/domain/sanitize";
import type { Announcement } from "@/lib/domain/types";
import type { ShowToast } from "../../types";

const AUDIENCES = [
  "Unchecked attendees",
  "Assigned judges",
  "Unmatched participants",
  "All participants",
] as const;

const MIN_BODY_LENGTH = 20;
const MAX_BODY_LENGTH = 300;

/**
 * Broadcast composer and delivery ledger.
 *
 * Organizer-authored copy is sanitized and rejected if it carries markup
 * before it is ever stored, so the announcement feed cannot become an
 * injection surface for the participant views that render it.
 */
export function BroadcastWorkspace({
  announcements,
  onSend,
  toast,
}: {
  announcements: Announcement[];
  onSend: (audience: string, body: string) => void;
  toast: ShowToast;
}) {
  const [audience, setAudience] = useState<string>(AUDIENCES[0]);
  const [message, setMessage] = useState(
    "North Gate is busy. Pre-verified attendees can use the express lane at Gate B.",
  );
  const fieldId = useId();
  const remaining = MAX_BODY_LENGTH - message.length;

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const body = sanitizeUserText(message, MAX_BODY_LENGTH);
    if (containsHtml(message) || body.length < MIN_BODY_LENGTH) {
      toast({
        title: "Message needs more context",
        detail:
          "Add a clear action and location. HTML and markup are rejected.",
        kind: "warning",
      });
      return;
    }
    onSend(audience, body);
  }

  return (
    <div className="view-stack">
      <section className="hero-row compact-hero">
        <div>
          <p className="eyebrow">
            <Megaphone size={13} aria-hidden="true" />
            Broadcast center
          </p>
          <h2>Send one useful message to the right people.</h2>
          <p className="hero-sub">
            Targeted delivery keeps urgent updates out of the general noise.
          </p>
        </div>
      </section>

      <section className="broadcast-grid">
        <form className="panel composer-card" onSubmit={submit}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">New operational update</p>
              <h3>Compose broadcast</h3>
            </div>
            <span className="draft-state">Draft</span>
          </div>

          <div className="field">
            <label htmlFor={`${fieldId}-audience`}>Audience</label>
            <select
              id={`${fieldId}-audience`}
              value={audience}
              onChange={(event) => setAudience(event.target.value)}
            >
              {AUDIENCES.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={`${fieldId}-message`}>Message</label>
            <textarea
              id={`${fieldId}-message`}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MAX_BODY_LENGTH}
              rows={4}
              aria-describedby={`${fieldId}-help`}
            />
            <p className="field-help" id={`${fieldId}-help`}>
              <span aria-live="polite">{remaining} characters left</span> ·
              include the action, place, and timing
            </p>
          </div>

          <p className="delivery-contract">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              <strong>Approval boundary</strong>
              Gemini may draft copy, but only an organizer can send it.
            </span>
          </p>

          <button className="primary-button full" type="submit">
            <Send size={16} aria-hidden="true" />
            Send targeted update
          </button>
        </form>

        <div className="panel broadcast-history">
          <div className="panel-head">
            <h3>Delivery ledger</h3>
            <span className="plain-meta">Live acknowledgements</span>
          </div>
          <ul aria-live="polite">
            {announcements.map((item) => (
              <li key={item.id}>
                <div className="ledger-head">
                  <strong>{item.title}</strong>
                  <span>{item.audience}</span>
                </div>
                <p>{item.body}</p>
                <p className="ledger-foot">
                  <span>{item.time}</span>
                  <strong>{item.reach}% reached</strong>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
