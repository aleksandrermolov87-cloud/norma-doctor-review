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
  const ids = [...new Set(rows.flatMap(row => (JSON.parse(row.questionSet) as { id: string }[]).map(q => q.id)))];
  const header = ["response_id", "submitted_at", ...ids].map(csvCell).join(",");
  const lines = rows.map(row => {
    const answers = JSON.parse(row.answers) as Record<string, string>;
    return [row.id, new Date(row.submittedAt).toISOString(), ...ids.map(id => answers[id] || "")].map(csvCell).join(",");
  });
  return new Response([header, ...lines].join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=norma-doctor-review.csv", "Cache-Control": "no-store" },
  });
}
