import type { Participant, RecoveryProposal } from "@/lib/domain/types";

/**
 * Response shapes shared by the route handlers and their callers.
 *
 * Declaring them once means a change to a handler's payload breaks the view
 * that reads it at compile time, instead of being discovered at runtime by a
 * property that silently reads `undefined`.
 */

/** Every handler returns this shape on a rejected request. */
export interface ApiError {
  error: string;
}

/** `POST /api/check-ins/issue` */
export interface IssuePassResponse {
  token: string;
  expiresInSeconds: number;
  synthetic: boolean;
}

/** `POST /api/check-ins/sync` */
export interface SyncCheckInResponse {
  status: "accepted" | "duplicate" | "rejected";
  ticketSuffix?: string;
}

/** `POST /api/registration` */
export interface RegistrationResponse {
  ticketId: string;
  token: string;
  participant: Participant;
  expiresInSeconds: number;
}

/** `POST /api/recovery` */
export type RecoveryResponse = RecoveryProposal;

/** True when a parsed JSON body is the error shape rather than a success. */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiError).error === "string"
  );
}

/**
 * POST JSON and narrow the result.
 *
 * Returns a discriminated result rather than throwing, so every caller has to
 * acknowledge the failure branch instead of relying on an ambient try/catch.
 */
export async function postJson<T>(
  path: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    const parsed: unknown = await response.json();
    if (!response.ok) {
      return {
        ok: false,
        error: isApiError(parsed) ? parsed.error : "Request failed",
      };
    }
    return { ok: true, data: parsed as T };
  } catch (error) {
    // An aborted request is a normal unmount, not a failure worth surfacing.
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, error: "aborted" };
    }
    return { ok: false, error: "The service could not be reached." };
  }
}
