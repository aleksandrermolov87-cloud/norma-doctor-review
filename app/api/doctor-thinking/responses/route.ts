import { NextResponse } from "next/server";
import { getDb } from "../../../../db/index";
import { reasoningResponses } from "../../../../db/schema";
import questions from "../../../doctor-thinking/questions.json";

export const runtime = "edge";
const choices = new Set(["a", "b", "c", "d", "na"]);

export async function POST(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return NextResponse.json({ error: "JSON required" }, { status: 415 });
  }
  if (Number(request.headers.get("content-length") || 0) > 30_000) {
    return NextResponse.json({ error: "Too large" }, { status: 413 });
  }
  let data: unknown;
  try { data = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!data || typeof data !== "object") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { participantId, answers } = data as Record<string, unknown>;
  if (typeof participantId !== "string" || !/^[0-9a-f-]{36}$/.test(participantId) || !answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const marked = answers as Record<string, unknown>;
  if (Object.keys(marked).length !== questions.length || questions.some(q => !choices.has(String(marked[q.id])))) {
    return NextResponse.json({ error: "All questions require one valid choice" }, { status: 400 });
  }
  try {
    const inserted = await getDb().insert(reasoningResponses).values({
      id: crypto.randomUUID(), participantId,
      answers: JSON.stringify(marked),
      questionSet: JSON.stringify(questions),
      submittedAt: Date.now(),
    }).onConflictDoNothing().returning({ id: reasoningResponses.id });
    if (inserted.length === 0) return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
