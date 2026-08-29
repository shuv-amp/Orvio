import { NextResponse } from "next/server";
import { z } from "zod";
import { authorize } from "@/lib/server/firebase-admin";
import { issueQrToken } from "@/lib/server/qr";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventId: z.string().min(3).max(100),
  ticketId: z.string().uuid(),
});

export async function POST(request: Request) {
  const identity = await authorize(request, ["participant", "organizer"]);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = bodySchema.parse(await request.json());
    const token = await issueQrToken(body.eventId, body.ticketId);
    return NextResponse.json(
      { token, expiresInSeconds: 28_800, synthetic: identity.synthetic },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid event or ticket identifier" : "Unable to issue pass";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
