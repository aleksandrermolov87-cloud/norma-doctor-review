import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const responses = sqliteTable("responses", {
  id: text("id").primaryKey(),
  participantId: text("participant_id").notNull().unique(),
  answers: text("answers").notNull(),
  questionSet: text("question_set").notNull(),
  submittedAt: integer("submitted_at").notNull(),
});

export const questionSets = sqliteTable("question_sets", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
