export const DEMO_EVENT_ID = "abhiyantrix-2026";
export const DEMO_SCANNER_IDS = new Set(["north-gate-01"]);

/** True only for the labeled PromptWars demo event `abhiyantrix-2026`. */
export function isSyntheticEvent(eventId: string): boolean {
  return eventId === DEMO_EVENT_ID;
}
