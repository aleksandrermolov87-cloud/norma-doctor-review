import { NextResponse } from "next/server";
import { getDb } from "../../../db/index";
import { responses } from "../../../db/schema";
import { getQuestions } from "../../data";

export const runtime = "edge";
const verdicts = new Set(["ready", "clarify", "reject", "unsure"]);

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
  const questions = await getQuestions();
  if (Object.keys(marked).length !== questions.length || questions.some(q => !verdicts.has(String(marked[q.id])))) {
    return NextResponse.json({ error: "All questions must have one valid answer" }, { status: 400 });
  }
  try {
    const inserted = await getDb().insert(responses).values({
      id: crypto.randomUUID(), participantId,
      answers: JSON.stringify(marked),
      questionSet: JSON.stringify(questions),
      submittedAt: Date.now(),
    }).onConflictDoNothing().returning({ id: responses.id });
    if (inserted.length === 0) return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
