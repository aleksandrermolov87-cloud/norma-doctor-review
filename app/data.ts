import { eq } from "drizzle-orm";
import { getDb } from "../db/index";
import { questionSets } from "../db/schema";
import { questions as exampleQuestions } from "./questions";

export type Question = { id: string; text: string; group: string };

export async function getQuestions(): Promise<Question[]> {
  const rows = await getDb().select().from(questionSets).where(eq(questionSets.id, "active")).limit(1);
  return rows.length ? JSON.parse(rows[0].content) as Question[] : [...exampleQuestions];
}
