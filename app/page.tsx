import Review from "./review";
import { questions } from "./questions";

export default function Home() {
  return <Review questions={questions} />;
}
