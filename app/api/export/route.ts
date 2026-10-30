import { env } from "cloudflare:workers";
import { getDb } from "../../../db/index";
import { responses } from "../../../db/schema";

export const runtime = "edge";

function csvCell(value: unknown) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

export async function GET(request: Request) {
  const key = env.EXPORT_KEY;
  if (!key || request.headers.get("authorization") !== `Bearer ${key}`) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const rows = await getDb().select().from(responses);
  const header = ["response_id", "submitted_at", "question_id", "question", "answer"].map(csvCell).join(",");
  const lines = rows.flatMap(row => {
    const answers = JSON.parse(row.answers) as Record<string, string>;
    const questions = JSON.parse(row.questionSet) as { id: string; text: string }[];
    return questions.map(q => [row.id, new Date(row.submittedAt).toISOString(), q.id, q.text, answers[q.id] || ""].map(csvCell).join(","));
  });
  return new Response([header, ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=norma-doctor-review.csv", "Cache-Control": "no-store" },
  });
}
