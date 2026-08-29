"use client";

import { Bell, Megaphone, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Announcement } from "@/lib/domain/types";

/**
 * Notification bell.
 *
 * Previously an icon with a red dot and no behaviour. It now opens a real
 * popover over the live announcement feed: `aria-expanded` reflects its state,
 * Escape and outside clicks close it, and focus returns to the trigger.
 */
export function Notifications({
  announcements,
  onViewAll,
}: {
  announcements: Announcement[];
  onViewAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const urgentCount = announcements.filter((item) => item.urgent).length;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="notifications" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={
          urgentCount > 0
            ? `Notifications, ${urgentCount} urgent`
            : "Notifications"
        }
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={18} aria-hidden="true" />
        {urgentCount > 0 && <span className="notification-dot" />}
      </button>
      {open && (
        <div className="notification-panel" id={panelId}>
          <div className="notification-head">
            <h2>Live updates</h2>
            <span>
              {urgentCount} urgent of {announcements.length}
            </span>
          </div>
          <ul>
            {announcements.slice(0, 4).map((item) => (
              <li key={item.id} className={item.urgent ? "urgent" : ""}>
                <span className="notification-icon" aria-hidden="true">
                  {item.urgent ? (
                    <TriangleAlert size={15} />
                  ) : (
                    <Megaphone size={15} />
                  )}
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                  <small>
                    {item.audience} · {item.time}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="notification-all"
            onClick={() => {
              setOpen(false);
              onViewAll();
            }}
          >
            Open broadcast center
          </button>
        </div>
      )}
    </div>
  );
}
