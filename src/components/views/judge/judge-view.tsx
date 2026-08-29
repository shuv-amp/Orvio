"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  Eye,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useId, useState } from "react";
import { rubric, weightedScore } from "@/lib/domain/judging";
import { containsHtml, sanitizeUserText } from "@/lib/domain/sanitize";
import type { ShowToast } from "../../types";

const SCORE_CHOICES = [6, 7, 8, 9, 10] as const;
const MIN_FEEDBACK = 20;
const MAX_FEEDBACK = 500;
const RUBRIC_VERSION = "rubric v3";
const SUBMISSION = {
  teamId: "t-1",
  teamName: "Project Aster",
  tagline:
    "A queue-risk controller that compares arrival pressure with live scanning capacity.",
  tags: ["Event operations", "Cloud Run", "Firebase", "Accessibility"],
};

/**
 * Judging portal.
 *
 * Scores are entered against a locked rubric version, feedback must cite
 * evidence, and finalizing is one-way: the controls disable and the aggregate
 * is published to the live leaderboard. The fairness lens is advisory text —
 * it never silently adjusts what the judge entered.
 */
export function JudgeView({
  onFinalize,
  toast,
}: {
  onFinalize: (input: {
    teamId: string;
    teamName: string;
    score: number;
    rubricVersion: string;
  }) => void;
  toast: ShowToast;
}) {
  const [scores, setScores] = useState<Record<string, number>>({
    functionality: 8,
    innovation: 9,
    impact: 8,
    google: 9,
    presentation: 8,
  });
  const [feedback, setFeedback] = useState(
    "Strong operational insight and unusually coherent real-time recovery flow.",
  );
  const [finalized, setFinalized] = useState(false);
  const fieldId = useId();
  const total = weightedScore(scores);

  function finalize() {
    const evidence = sanitizeUserText(feedback, MAX_FEEDBACK);
    if (containsHtml(feedback) || evidence.length < MIN_FEEDBACK) {
      toast({
        title: "Add actionable feedback",
        detail: `Final feedback must be at least ${MIN_FEEDBACK} characters and cannot include HTML.`,
        kind: "warning",
      });
      return;
    }
    setFinalized(true);
    onFinalize({
      teamId: SUBMISSION.teamId,
      teamName: SUBMISSION.teamName,
      score: total,
      rubricVersion: RUBRIC_VERSION,
    });
    toast({
      title: "Score finalized",
      detail:
        "The immutable rubric v3 result is now included in the live aggregate.",
    });
  }

  return (
    <div className="view-stack">
      <section className="hero-row">
        <div>
          <p className="eyebrow">
            <Scale size={13} aria-hidden="true" />
            Secure judging portal
          </p>
          <h2>Review {SUBMISSION.teamName}</h2>
          <p className="hero-sub">
            Required judging flow · private draft · conflict check passed ·
            rubric version 3 locked
          </p>
        </div>
        <p className="score-orb">
          <strong>{total}</strong>
          <span>/ 100</span>
          <span className="visually-hidden">
            Current weighted total, {total} out of 100
          </span>
        </p>
      </section>

      <section className="judge-grid">
        <div className="panel submission-card">
          <p className="eyebrow">Submission 04</p>
          <h3>{SUBMISSION.teamName}</h3>
          <p className="submission-tagline">{SUBMISSION.tagline}</p>
          <ul className="submission-meta">
            {SUBMISSION.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>

          <div className="demo-frame">
            <div className="demo-top" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
            <div className="demo-visual">
              <Activity size={40} aria-hidden="true" />
              <strong>Evidence bundle ready</strong>
              <span>Prototype, repository, and problem mapping</span>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  toast({
                    title: "Evidence bundle opened",
                    detail:
                      "Demo mode represents a judge-safe, read-only submission preview.",
                  })
                }
              >
                <Eye size={15} aria-hidden="true" />
                Review submitted evidence
              </button>
            </div>
          </div>

          <p className="evidence-callout">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>
              <strong>Evidence integrity</strong>
              Synthetic demo artifact · read-only for assigned judges · no
              fabricated deployment claim
            </span>
          </p>
        </div>

        <div className="panel rubric-card" data-tour="rubric">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Structured rubric · v3</p>
              <h3>Score against evidence</h3>
            </div>
            <span className="autosave">
              <Check size={13} aria-hidden="true" />
              Saved
            </span>
          </div>

          <div className="rubric-list">
            {rubric.map((item) => (
              <div className="rubric-row" key={item.id}>
                <div className="rubric-copy">
                  <strong id={`${fieldId}-${item.id}`}>{item.label}</strong>
                  <span>{item.weight}% of final score</span>
                </div>
                <div
                  className="score-picker"
                  role="radiogroup"
                  aria-labelledby={`${fieldId}-${item.id}`}
                >
                  {SCORE_CHOICES.map((value) => (
                    <button
                      type="button"
                      key={value}
                      role="radio"
                      aria-checked={scores[item.id] === value}
                      disabled={finalized}
                      className={scores[item.id] === value ? "active" : ""}
                      onClick={() =>
                        setScores((current) => ({
                          ...current,
                          [item.id]: value,
                        }))
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="field">
            <label htmlFor={`${fieldId}-feedback`}>
              Evidence-linked feedback
            </label>
            <textarea
              id={`${fieldId}-feedback`}
              disabled={finalized}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              maxLength={MAX_FEEDBACK}
              rows={4}
              aria-describedby={`${fieldId}-feedback-help`}
            />
            <p className="field-help" id={`${fieldId}-feedback-help`}>
              <span aria-live="polite">
                {feedback.length}/{MAX_FEEDBACK}
              </span>{" "}
              · visible after results publish
            </p>
          </div>

          <p className="fairness-note">
            <Scale size={17} aria-hidden="true" />
            <span>
              <strong>FairScore lens</strong>
              Your scoring is within 0.4 points of the panel mean. Advisory only
              — Orvio never changes your score.
            </span>
          </p>

          {finalized ? (
            <p className="approved-state full">
              <CheckCircle2 size={16} aria-hidden="true" />
              Score finalized
            </p>
          ) : (
            <button
              type="button"
              className="primary-button full"
              onClick={finalize}
            >
              <ShieldCheck size={16} aria-hidden="true" />
              Finalize {total}/100
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
