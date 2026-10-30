import { env } from "cloudflare:workers";
import { getDb } from "../../../db/index";
import { questionSets } from "../../../db/schema";
import { getQuestions } from "../../data";

export const runtime = "edge";

export async function GET() {
  return Response.json({ questions: await getQuestions() }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!env.EXPORT_KEY || request.headers.get("authorization") !== `Bearer ${env.EXPORT_KEY}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Number(request.headers.get("content-length") || 0) > 50_000) return Response.json({ error: "Too large" }, { status: 413 });
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const list = (body as { questions?: unknown })?.questions;
  if (!Array.isArray(list) || list.length < 1 || list.length > 100) return Response.json({ error: "1–100 questions required" }, { status: 400 });
  const texts = list.map(item => String(item).trim());
  if (new Set(texts).size !== texts.length) return Response.json({ error: "Duplicate questions" }, { status: 400 });
  const questions = await Promise.all(texts.map(async text => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const hash = [...new Uint8Array(digest)].slice(0, 12).map(byte => byte.toString(16).padStart(2, "0")).join("");
    return { id: `q_${hash}`, text, group: "Вопрос" };
  }));
  if (questions.some(q => q.text.length < 5 || q.text.length > 1000)) return Response.json({ error: "Question length must be 5–1000 characters" }, { status: 400 });
  await getDb().insert(questionSets).values({ id: "active", content: JSON.stringify(questions), updatedAt: Date.now() }).onConflictDoUpdate({ target: questionSets.id, set: { content: JSON.stringify(questions), updatedAt: Date.now() } });
  return Response.json({ ok: true, count: questions.length }, { headers: { "Cache-Control": "no-store" } });
}
