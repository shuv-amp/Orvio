export const DEMO_EVENT_ID = "abhiyantrix-2026";
export const DEMO_SCANNER_IDS = new Set(["north-gate-01"]);

/** The single seeded attendee ticket every demo pass is issued against. */
export const DEMO_TICKET_ID = "5c327c3a-2d3f-49c6-b087-f8de29ae1042";

/** Gate the seeded scanner reports as, shown in the audit trail. */
export const DEMO_GATE_LABEL = "North Gate 01";

/** True only for the labeled PromptWars demo event `abhiyantrix-2026`. */
export function isSyntheticEvent(eventId: string): boolean {
  return eventId === DEMO_EVENT_ID;
}
