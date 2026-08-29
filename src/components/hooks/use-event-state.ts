"use client";

import { useCallback, useReducer } from "react";
import {
  eventReducer,
  type EventAction,
  type EventState,
} from "@/lib/domain/event-state";
import {
  announcements,
  auditEvents,
  initialMetrics,
  teams,
} from "@/lib/domain/seed";

/** Action shape callers provide; identity and clock are filled in here. */
export type DispatchableAction = {
  [K in EventAction["type"]]: Omit<
    Extract<EventAction, { type: K }>,
    "id" | "at"
  >;
}[EventAction["type"]];

const initialState: EventState = {
  metrics: initialMetrics,
  announcements,
  audits: auditEvents,
  teams,
};

function clockLabel(now: Date): string {
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Live event state, driven by the pure reducer in the domain layer.
 *
 * The two non-deterministic inputs a transition needs — a unique id and a
 * timestamp — are generated here and handed to the reducer, which keeps the
 * reducer itself pure and directly testable.
 */
export function useEventState() {
  const [state, rawDispatch] = useReducer(eventReducer, initialState);

  const dispatch = useCallback((action: DispatchableAction) => {
    rawDispatch({
      ...action,
      id: crypto.randomUUID(),
      at: clockLabel(new Date()),
    } as EventAction);
  }, []);

  return [state, dispatch] as const;
}
