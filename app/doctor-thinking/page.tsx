import ReasoningReview from "./reasoning-review";
import questions from "./questions.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "НОРМА · клиническое мышление врача",
  description: "50 ситуаций о том, как врач собирает данные, проверяет гипотезы и принимает решения.",
};

export default function DoctorThinkingPage() {
  return <ReasoningReview questions={questions} />;
}
