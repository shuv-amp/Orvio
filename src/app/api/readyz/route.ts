import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ready", mode: process.env.APP_MODE ?? "unconfigured" }, { headers: { "Cache-Control": "no-store" } });
}
