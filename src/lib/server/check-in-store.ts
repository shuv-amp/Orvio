import { FieldValue } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";

export type CheckInResult = "accepted" | "duplicate";

const usedTokens = new Set<string>();

export async function recordCheckIn(input: {
  eventId: string;
  ticketId: string;
  jti: string;
  scannerId: string;
  scannedAt: string;
  idempotencyKey: string;
}): Promise<CheckInResult> {
  const db = firestore();
  const key = `${input.eventId}_${input.ticketId}`;

  if (!db) {
    if (usedTokens.has(key) || usedTokens.has(input.jti) || usedTokens.has(input.idempotencyKey)) return "duplicate";
    usedTokens.add(key);
    usedTokens.add(input.jti);
    usedTokens.add(input.idempotencyKey);
    return "accepted";
  }

  const checkInRef = db.collection("events").doc(input.eventId).collection("checkIns").doc(input.ticketId);
  const replayRef = db.collection("events").doc(input.eventId).collection("qrNonces").doc(input.jti);
  return db.runTransaction(async (transaction) => {
    const [existingCheckIn, replay] = await Promise.all([transaction.get(checkInRef), transaction.get(replayRef)]);
    if (existingCheckIn.exists || replay.exists) return "duplicate";
    transaction.create(checkInRef, {
      ticketId: input.ticketId,
      scannerId: input.scannerId,
      scannedAt: input.scannedAt,
      idempotencyKey: input.idempotencyKey,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.create(replayRef, { usedAt: FieldValue.serverTimestamp() });
    transaction.create(db.collection("events").doc(input.eventId).collection("auditLogs").doc(), {
      actor: input.scannerId,
      action: "check_in.accepted",
      targetId: input.ticketId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return "accepted" as const;
  });
}
