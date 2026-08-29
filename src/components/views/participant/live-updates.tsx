import { Megaphone, TriangleAlert } from "lucide-react";
import type { Announcement } from "@/lib/domain/types";

/** Participant-facing announcement feed, newest first. */
export function LiveUpdates({
  announcements,
}: {
  announcements: Announcement[];
}) {
  return (
    <div className="panel feed-card">
      <div className="panel-head">
        <h3>Live updates</h3>
        <span className="live-label">
          <span aria-hidden="true" />
          Live
        </span>
      </div>
      <ul aria-live="polite" aria-relevant="additions">
        {announcements.slice(0, 3).map((item) => (
          <li key={item.id} className={item.urgent ? "urgent" : ""}>
            <span className="feed-icon" aria-hidden="true">
              {item.urgent ? (
                <TriangleAlert size={15} />
              ) : (
                <Megaphone size={15} />
              )}
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
              <small>{item.time}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
