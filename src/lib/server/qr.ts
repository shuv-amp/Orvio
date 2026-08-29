import { randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import type { QrClaims } from "@/lib/domain/types";

const claimsSchema = z.object({
  eventId: z.string().min(3).max(100),
  ticketId: z.string().uuid(),
  jti: z.string().uuid(),
  aud: z.literal("orvio-check-in"),
  iat: z.number().int(),
  exp: z.number().int(),
});

function signingKey() {
  const value = process.env.QR_SIGNING_SECRET;
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error("QR_SIGNING_SECRET is required in production");
  }
  return new TextEncoder().encode(value ?? "orvio-local-demo-secret-not-for-production");
}

export async function issueQrToken(eventId: string, ticketId: string, lifetimeSeconds = 8 * 60 * 60) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ eventId, ticketId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setJti(randomUUID())
    .setAudience("orvio-check-in")
    .setIssuedAt(now)
    .setExpirationTime(now + lifetimeSeconds)
    .sign(signingKey());
}

export async function verifyQrToken(token: string, expectedEventId: string): Promise<QrClaims> {
  const { payload, protectedHeader } = await jwtVerify(token, signingKey(), {
    algorithms: ["HS256"],
    audience: "orvio-check-in",
  });
  if (protectedHeader.typ !== "JWT") throw new Error("Unexpected token type");
  const claims = claimsSchema.parse(payload);
  if (claims.eventId !== expectedEventId) throw new Error("Token belongs to another event");
  return claims;
}
