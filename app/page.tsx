import Review from "./review";
import { getQuestions } from "./data";

export const dynamic = "force-dynamic";
export default async function Home() {
  const questions = await getQuestions();
  return <Review questions={questions} />;
}
