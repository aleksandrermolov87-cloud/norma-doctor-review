import { env } from "cloudflare:workers";
import { getDb } from "../../../../db/index";
import { reasoningResponses } from "../../../../db/schema";

export const runtime = "edge";

function csvCell(value: unknown) {
  return '"' + String(value ?? "").replaceAll('"', '""') + '"';
}

export async function GET(request: Request) {
  if (!env.EXPORT_KEY || request.headers.get("authorization") !== `Bearer ${env.EXPORT_KEY}`) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const rows = await getDb().select().from(reasoningResponses);
  const header = ["response_id", "submitted_at", "question_id", "group", "question", "choice_id", "choice"].map(csvCell).join(",");
  const lines = rows.flatMap(row => {
    const answers = JSON.parse(row.answers) as Record<string, string>;
    const questions = JSON.parse(row.questionSet) as { id: string; group: string; text: string; options: { id: string; label: string }[] }[];
    return questions.map(q => {
      const selected = answers[q.id];
      const label = selected === "na" ? "Не относится к моей практике" : q.options.find(option => option.id === selected)?.label ?? "";
      return [row.id, new Date(row.submittedAt).toISOString(), q.id, q.group, q.text, selected, label].map(csvCell).join(",");
    });
  });
  return new Response([header, ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=norma-doctor-thinking.csv", "Cache-Control": "no-store" },
  });
}
