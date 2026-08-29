import { NextResponse } from "next/server";
import { z } from "zod";
import { registerAttendee } from "@/lib/domain/registration";
import { authorize } from "@/lib/server/firebase-admin";
import { issueQrToken } from "@/lib/server/qr";
import { allowRequest, limitFor } from "@/lib/server/rate-limit";
import { RequestGuardError, readJsonObject } from "@/lib/server/request-guard";
import { isSyntheticEvent } from "@/lib/domain/demo";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventId: z.string().min(3).max(100),
  name: z.string().min(1).max(120),
  role: z.string().min(2).max(40),
  skills: z.array(z.string().min(1).max(40)).max(8),
  interests: z.array(z.string().min(1).max(40)).max(8),
});

export async function POST(request: Request) {
  const identity = await authorize(request, ["participant", "organizer"]);
  if (!identity)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rateKey = `register:${identity.uid}:${request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local"}`;
  if (!allowRequest(rateKey, limitFor(identity.synthetic, 10)))
    return NextResponse.json(
      { error: "Too many registration attempts" },
      { status: 429 },
    );
  try {
    const body = bodySchema.parse(await readJsonObject(request));
    if (identity.synthetic && !isSyntheticEvent(body.eventId)) {
      return NextResponse.json(
        { error: "Demo mode is restricted to synthetic event data" },
        { status: 403 },
      );
    }
    const registered = registerAttendee({
      name: body.name,
      role: body.role,
      skills: body.skills,
      interests: body.interests,
    });
    if (!registered.ok) {
      return NextResponse.json({ error: registered.error }, { status: 400 });
    }
    const token = await issueQrToken(body.eventId, registered.ticketId);
    return NextResponse.json(
      {
        ticketId: registered.ticketId,
        token,
        participant: registered.participant,
        expiresInSeconds: 28_800,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    if (error instanceof RequestGuardError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const message =
      error instanceof z.ZodError
        ? "Invalid registration payload"
        : "Unable to complete registration";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
