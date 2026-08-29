import { Gauge, Scale } from "lucide-react";
import { useMemo } from "react";
import { rankPublishedScores } from "@/lib/domain/leaderboard";
import type { Team } from "@/lib/domain/types";

/**
 * Live leaderboard.
 *
 * A real `table` with a caption and scoped headers, not a grid of divs, so the
 * ranking can be navigated by table semantics. The body is a polite live
 * region: a finalized score re-ranks it and the change is announced.
 */
export function Leaderboard({ teams }: { teams: Team[] }) {
  const ranked = useMemo(() => rankPublishedScores(teams), [teams]);
  return (
    <section className="panel leaderboard" data-tour="leaderboard">
      <div className="panel-head">
        <div>
          <p className="eyebrow">
            <Gauge size={13} aria-hidden="true" />
            Live leaderboard
          </p>
          <h3>Published aggregate scores</h3>
        </div>
        <span className="fair-badge">
          <Scale size={13} aria-hidden="true" />
          Raw scores · FairScore monitored
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <caption className="visually-hidden">
            Live published rankings by aggregate rubric score. Updates when a
            judge finalizes a score.
          </caption>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Team</th>
              <th scope="col">Reviews</th>
              <th scope="col">Score</th>
            </tr>
          </thead>
          <tbody aria-live="polite">
            {ranked.map((team, index) => (
              <tr className="leader-row" key={team.id}>
                <th scope="row">
                  <span className="rank-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </th>
                <td>
                  <span className="team-cell">
                    <span
                      className={`rank-mark rank-${index + 1}`}
                      aria-hidden="true"
                    >
                      {team.name.slice(0, 1)}
                    </span>
                    <span className="team-identity">
                      <b>{team.name}</b>
                      <small>{team.project}</small>
                    </span>
                  </span>
                </td>
                <td className="numeric">{team.judged}/3</td>
                <td className="numeric">
                  <strong>{team.score.toFixed(1)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
