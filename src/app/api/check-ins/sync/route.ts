import { NextResponse } from "next/server";
import { z } from "zod";
import { recordCheckIn } from "@/lib/server/check-in-store";
import { authorize } from "@/lib/server/firebase-admin";
import { allowRequest, limitFor } from "@/lib/server/rate-limit";
import { RequestGuardError, readJsonObject } from "@/lib/server/request-guard";
import { verifyQrToken } from "@/lib/server/qr";
import { DEMO_SCANNER_IDS, isSyntheticEvent } from "@/lib/domain/demo";

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
  if (!identity)
    return NextResponse.json(
      { status: "invalid", error: "Unauthorized scanner" },
      { status: 401 },
    );
  const rateKey = `sync:${identity.uid}:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`;
  if (!allowRequest(rateKey, limitFor(identity.synthetic, 30)))
    return NextResponse.json(
      { status: "invalid", error: "Too many scan attempts" },
      { status: 429 },
    );

  try {
    const body = bodySchema.parse(await readJsonObject(request));
    if (
      identity.synthetic &&
      (!isSyntheticEvent(body.eventId) || !DEMO_SCANNER_IDS.has(body.scannerId))
    ) {
      return NextResponse.json(
        {
          status: "invalid",
          error: "Demo operation outside the synthetic event boundary",
        },
        { status: 403 },
      );
    }
    const claims = await verifyQrToken(body.qrToken, body.eventId);
    const status = await recordCheckIn({
      eventId: body.eventId,
      ticketId: claims.ticketId,
      jti: claims.jti,
      scannerId: body.scannerId,
      scannedAt: body.scannedAt,
      idempotencyKey: body.idempotencyKey,
    });
    return NextResponse.json(
      { status, ticketSuffix: claims.ticketId.slice(-4) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    if (error instanceof RequestGuardError) {
      return NextResponse.json(
        { status: "invalid", error: error.message },
        { status: error.status },
      );
    }
    const text = error instanceof Error ? error.message.toLowerCase() : "";
    const status = text.includes("expired") ? "expired" : "invalid";
    return NextResponse.json(
      {
        status,
        error:
          status === "expired" ? "Pass expired" : "Pass could not be verified",
      },
      { status: 400 },
    );
  }
}
