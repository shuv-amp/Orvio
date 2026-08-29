import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { initialMetrics } from "@/lib/domain/seed";
import { simulateJudgeDropout } from "@/lib/domain/pulse";
import { authorize } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

const inputSchema = z.object({ incident: z.literal("judge-dropout") });
const outputSchema = z.object({ summary: z.string().max(300), announcement: z.string().max(500) });

export async function POST(request: Request) {
  const identity = await authorize(request, ["organizer"]);
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    inputSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Unsupported incident" }, { status: 400 });
  }

  const fallback = simulateJudgeDropout(initialMetrics);
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store" } });

  try {
    const ai = new GoogleGenAI({ vertexai: true, project, location: process.env.GOOGLE_CLOUD_LOCATION ?? "us-central1" });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents: JSON.stringify({
        incident: fallback.incident,
        metrics: initialMetrics,
        approvedDeterministicActions: fallback.actions,
      }),
      config: {
        systemInstruction: "You are an event operations copywriter. Explain only the supplied metrics and actions. Never invent numbers, people, or actions. Return concise JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            announcement: { type: Type.STRING },
          },
          required: ["summary", "announcement"],
        },
        temperature: 0.2,
      },
    });
    const generated = outputSchema.parse(JSON.parse(response.text ?? "{}"));
    return NextResponse.json({ ...fallback, announcement: generated.announcement, summary: generated.summary, source: "gemini" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(fallback, { headers: { "Cache-Control": "no-store", "X-Orvio-AI-Fallback": "true" } });
  }
}
