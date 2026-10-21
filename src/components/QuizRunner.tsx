import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { QUESTION_BY_ID } from "@/data/questions";
import { abandonQuiz, answerQuestion, finishQuiz, goToNextQuestion, type CurrentQuiz } from "@/lib/progress-logic";
import { updateProgress } from "@/lib/progress-store";
import { AnswerFeedback, QuestionCard } from "./QuestionCard";
import { Panel, ProgressBar } from "./kit";

export function QuizRunner({ quiz }: { quiz: CurrentQuiz }) {
  const navigate = useNavigate();
  const qid = quiz.questionIds[quiz.index];
  const question = QUESTION_BY_ID[qid];
  const submitted = qid in quiz.responses ? quiz.responses[qid] : null;
  const [chosen, setChosen] = useState<number | null>(null);
  const isLast = quiz.index === quiz.questionIds.length - 1;
  const answeredCount = Object.keys(quiz.responses).length;

  useEffect(() => {
    setChosen(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [qid]);

  const submit = () => {
    if (chosen === null || submitted !== null) return;
    updateProgress((s) => answerQuestion(s, quiz.id, qid, chosen, Date.now()));
  };

  const next = () => {
    if (isLast) {
      updateProgress((s) => finishQuiz(s, Date.now()));
      navigate({ to: "/results" });
    } else {
      updateProgress(goToNextQuestion);
    }
  };

  const restart = () => {
    if (answeredCount > 0 && !window.confirm("Leave this quiz? Answers you already submitted stay saved.")) return;
    updateProgress((s) => (answeredCount > 0 ? abandonQuiz(finishQuiz(s, Date.now())) : abandonQuiz(s)));
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Question {quiz.index + 1} of {quiz.questionIds.length}
          {quiz.mode === "adaptive" ? " · Smart practice" : ""}
        </span>
        <button type="button" onClick={restart} className="min-h-11 px-2 underline underline-offset-4 hover:text-foreground">
          Restart
        </button>
      </div>
      <ProgressBar
        value={((quiz.index + (submitted !== null ? 1 : 0)) / quiz.questionIds.length) * 100}
        label="Quiz progress"
        className="mb-6"
      />
      <Panel>
        <QuestionCard
          question={question}
          chosen={chosen}
          submitted={submitted}
          onChoose={setChosen}
          reason={quiz.reasons?.[qid]}
        />
        {submitted !== null ? <AnswerFeedback question={question} selected={submitted} /> : null}
        <div className="mt-6">
          {submitted === null ? (
            <Button variant="hero" size="xl" className="w-full sm:w-auto" disabled={chosen === null} onClick={submit}>
              Submit Answer
            </Button>
          ) : (
            <Button variant="hero" size="xl" className="w-full sm:w-auto" onClick={next}>
              {isLast ? "See Results" : "Next Question"}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
