"use client";

import { useCallback, useEffect, useState } from "react";
import { postJson, type IssuePassResponse } from "@/lib/api/contracts";
import { DEMO_EVENT_ID, DEMO_TICKET_ID } from "@/lib/domain/demo";

/** What the participant pass card and the gate scanner both need. */
export interface SignedPass {
  token: string;
  ticketSuffix: string;
  name: string;
}

export type PassState =
  | { status: "issuing" }
  | { status: "ready"; pass: SignedPass }
  | { status: "failed"; error: string };

/**
 * One issued pass per browser session, shared by every view that needs it.
 *
 * The participant view and the gate scanner display the same demo pass.
 * Issuing it once and caching it here means switching roles does not mint a
 * new signed token on every mount, which removes a round trip per navigation
 * and keeps the shared demo well inside the pass issuance rate limit.
 *
 * The cache lives at module scope because it has to outlive the components
 * that read it.
 */
let cachedPass: SignedPass | null = null;
let inFlight: Promise<PassState> | null = null;

/** Test seam: clears the session cache between cases. */
export function clearPassCacheForTesting(): void {
  cachedPass = null;
  inFlight = null;
}

async function issuePass(): Promise<PassState> {
  const result = await postJson<IssuePassResponse>("/api/check-ins/issue", {
    eventId: DEMO_EVENT_ID,
    ticketId: DEMO_TICKET_ID,
  });
  if (!result.ok) return { status: "failed", error: result.error };
  const pass: SignedPass = {
    token: result.data.token,
    ticketSuffix: DEMO_TICKET_ID.slice(-4),
    name: "Shuvam Pandey",
  };
  cachedPass = pass;
  return { status: "ready", pass };
}

export function useSignedPass(): {
  state: PassState;
  retry: () => void;
  adopt: (pass: SignedPass) => void;
} {
  // Seeded from the cache, so a warm session renders the pass on first paint
  // and the effect below has nothing to do.
  const [state, setState] = useState<PassState>(() =>
    cachedPass ? { status: "ready", pass: cachedPass } : { status: "issuing" },
  );

  useEffect(() => {
    if (state.status !== "issuing") return;
    let cancelled = false;
    // The request is deliberately not tied to this component's lifecycle. It
    // populates a session cache that other views read, and React's development
    // double-mount would otherwise abort the shared promise, leaving every
    // reader waiting on a request that can never resolve.
    // Two views mounting together still share one request rather than racing.
    inFlight ??= issuePass();
    void inFlight.then((next) => {
      inFlight = null;
      if (!cancelled) setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  const retry = useCallback(() => {
    cachedPass = null;
    inFlight = null;
    setState({ status: "issuing" });
  }, []);

  /** Adopt a pass issued elsewhere, such as a fresh walk-up registration. */
  const adopt = useCallback((pass: SignedPass) => {
    cachedPass = pass;
    inFlight = null;
    setState({ status: "ready", pass });
  }, []);

  return { state, retry, adopt };
}
