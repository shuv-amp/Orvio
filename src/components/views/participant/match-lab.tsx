"use client";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ListChecks,
  Network,
} from "lucide-react";
import { useState } from "react";
import type { Team, TeamRecommendation } from "@/lib/domain/types";
import { FitBar } from "../../ui/fit-bar";
import type { ShowToast } from "../../types";

/**
 * Explainable team formation.
 *
 * The recommendation is broken into its four measured components rather than
 * presented as one opaque percentage, and joining is always the participant's
 * action — Orvio ranks, it never assigns.
 */
export function MatchLab({
  recommendations,
  teams,
  toast,
}: {
  recommendations: TeamRecommendation[];
  teams: Team[];
  toast: ShowToast;
}) {
  const [selected, setSelected] = useState(recommendations[0]?.teamId);
  const [joined, setJoined] = useState<string | null>(null);

  const recommendation =
    recommendations.find((item) => item.teamId === selected) ??
    recommendations[0];
  const team = teams.find((item) => item.id === recommendation?.teamId);

  function moveTab(
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const last = recommendations.length - 1;
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? last
          : event.key === "ArrowRight"
            ? (index + 1) % recommendations.length
            : (index - 1 + recommendations.length) % recommendations.length;
    const nextId = recommendations[nextIndex].teamId;
    setSelected(nextId);
    document.getElementById(`team-tab-${nextId}`)?.focus();
  }

  return (
    <div className="panel match-panel" data-tour="match">
      <div className="panel-head">
        <div>
          <p className="eyebrow">
            <Network size={13} aria-hidden="true" />
            Explainable Match Lab
          </p>
          <h3>Not just a match. A reason to build together.</h3>
        </div>
        <span className="match-score">{recommendation?.totalScore}% fit</span>
      </div>

      <div
        className="team-selector"
        role="tablist"
        aria-label="Recommended teams"
      >
        {recommendations.map((item, index) => (
          <button
            type="button"
            id={`team-tab-${item.teamId}`}
            key={item.teamId}
            role="tab"
            aria-selected={selected === item.teamId}
            aria-controls={`team-panel-${item.teamId}`}
            tabIndex={selected === item.teamId ? 0 : -1}
            className={selected === item.teamId ? "active" : ""}
            onClick={() => setSelected(item.teamId)}
            onKeyDown={(event) => moveTab(index, event)}
          >
            <span className="team-rank">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="team-name">
              {teams.find((candidate) => candidate.id === item.teamId)?.name}
            </span>
            <strong>{item.totalScore}%</strong>
          </button>
        ))}
      </div>

      {team && recommendation && (
        <div
          id={`team-panel-${team.id}`}
          className="match-detail"
          role="tabpanel"
          aria-labelledby={`team-tab-${team.id}`}
          tabIndex={0}
        >
          <div className="match-team-head">
            <div className="avatar-stack" aria-hidden="true">
              {team.members.map((member) => (
                <span key={member.id}>{member.initials}</span>
              ))}
              <span className="you-avatar">YOU</span>
            </div>
            <div>
              <h4>{team.name}</h4>
              <p>{team.project}</p>
            </div>
          </div>

          <div className="fit-bars">
            <FitBar
              label="Skill coverage"
              value={recommendation.skillCoverage}
            />
            <FitBar
              label="Shared interests"
              value={recommendation.interestMatch}
            />
            <FitBar
              label="Role complement"
              value={recommendation.roleComplementarity}
            />
            <FitBar
              label="Availability"
              value={recommendation.availabilityMatch}
            />
          </div>

          <div className="why-card">
            <ListChecks size={18} aria-hidden="true" />
            <div>
              <strong>Why this match works</strong>
              <ul>
                {recommendation.reasons.map((reason) => (
                  <li key={reason}>
                    <Check size={13} aria-hidden="true" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ul className="member-list">
            {team.members.map((member) => (
              <li key={member.id}>
                <span className="avatar small" aria-hidden="true">
                  {member.initials}
                </span>
                <span>
                  <strong>{member.name}</strong>
                  <small>
                    {member.role} · {member.skills.slice(0, 2).join(", ")}
                  </small>
                </span>
              </li>
            ))}
          </ul>

          <div className="match-actions">
            {joined === team.id ? (
              <p className="joined-state">
                <CheckCircle2 size={16} aria-hidden="true" />
                Request sent to {team.name}
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    toast({
                      title: "Swap preferences opened",
                      detail: "You stay in control; Orvio never forces a team.",
                    })
                  }
                >
                  Request structured swap
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    setJoined(team.id);
                    toast({
                      title: "Team request sent",
                      detail: `${team.name} received your skills and match rationale.`,
                    });
                  }}
                >
                  Ask to join
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
