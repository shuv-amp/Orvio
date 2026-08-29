import { NextResponse } from "next/server";
import { z } from "zod";
import { recordCheckIn } from "@/lib/server/check-in-store";
import { authorize } from "@/lib/server/firebase-admin";
import { allowRequest } from "@/lib/server/rate-limit";
import { verifyQrToken } from "@/lib/server/qr";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventId: z.string().min(3).max(100),
  qrToken: z.string().min(40).max(4_096),
  scannerId: z.string().min(3).max(100),
  scannedAt: z.iso.datetime(),
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  const identity = await authorize(request, ["organizer"]);
  if (!identity) return NextResponse.json({ status: "invalid", error: "Unauthorized scanner" }, { status: 401 });
  const rateKey = `${identity.uid}:${request.headers.get("user-agent") ?? "unknown"}`;
  if (!allowRequest(rateKey)) return NextResponse.json({ status: "invalid", error: "Too many scan attempts" }, { status: 429 });

  try {
    const body = bodySchema.parse(await request.json());
    const claims = await verifyQrToken(body.qrToken, body.eventId);
    const status = await recordCheckIn({
      eventId: body.eventId,
      ticketId: claims.ticketId,
      jti: claims.jti,
      scannerId: body.scannerId,
      scannedAt: body.scannedAt,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json({ status, ticketSuffix: claims.ticketId.slice(-4) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const text = error instanceof Error ? error.message.toLowerCase() : "";
    const status = text.includes("expired") ? "expired" : "invalid";
    return NextResponse.json({ status, error: status === "expired" ? "Pass expired" : "Pass could not be verified" }, { status: 400 });
  }
}
