import type React from "react";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import type { Question } from "@/data/questions";
import { DOMAIN_BY_ID } from "@/data/domains";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D", "E"];

interface Props {
  question: Question;
  /** Option currently chosen (not yet submitted). */
  chosen: number | null;
  /** Submitted answer; when set, feedback colours are shown. */
  submitted: number | null;
  onChoose: (i: number) => void;
  /** When false, correct/incorrect colours are hidden after submission (used in tests). */
  revealCorrect?: boolean;
  reason?: string | undefined;
}

export function QuestionCard({ question, chosen, submitted, onChoose, revealCorrect = true, reason }: Props) {
  const locked = submitted !== null;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="eyebrow">{DOMAIN_BY_ID[question.domain].name}</p>
      </div>
      {reason ? (
        <p className="mt-2 inline-flex rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
          Why this question: {reason}
        </p>
      ) : null}
      <h2 className="mt-3 text-xl font-bold leading-snug sm:text-2xl">{question.prompt}</h2>
      <ul className="mt-5 space-y-3" role="radiogroup" aria-label="Answer options">
        {question.options.map((opt, i) => {
          const isChosen = (locked ? submitted : chosen) === i;
          const isCorrect = i === question.answer;
          const showRight = locked && revealCorrect && isCorrect;
          const showWrong = locked && revealCorrect && isChosen && !isCorrect;
          return (
            <li key={i}>
              <button
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={locked}
                onClick={() => onChoose(i)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base transition-colors",
                  "border-border bg-transparent enabled:hover:border-primary/60 enabled:active:scale-[0.99]",
                  isChosen && !locked && "border-primary bg-secondary",
                  isChosen && locked && !revealCorrect && "border-primary bg-secondary",
                  showRight && "border-success bg-success-soft",
                  showWrong && "border-destructive bg-destructive-soft",
                  locked && !isChosen && !showRight && "opacity-70",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold",
                    showRight && "bg-success text-success-foreground",
                    showWrong && "bg-destructive text-destructive-foreground",
                  )}
                  aria-hidden
                >
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
                {showRight ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Correct answer" /> : null}
                {showWrong ? <XCircle className="size-5 shrink-0 text-destructive" aria-label="Your answer" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeedbackSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-foreground/90">{children}</div>
    </div>
  );
}

export function AnswerFeedback({ question, selected }: { question: Question; selected: number }) {
  const correct = selected === question.answer;
  const wrongText = !correct ? question.wrong?.[selected] : undefined;
  const correctLetter = LETTERS[question.answer];
  const selectedLetter = LETTERS[selected];
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-reveal mt-6 space-y-4 rounded-2xl border p-5",
        correct ? "border-success/40 bg-success-soft" : "border-destructive/40 bg-destructive-soft",
      )}
    >
      <p className={cn("flex items-center gap-2 font-display text-lg font-bold", correct ? "text-success" : "text-destructive")}>
        {correct ? <CheckCircle2 className="size-6" aria-hidden /> : <XCircle className="size-6" aria-hidden />}
        {correct ? "Correct!" : "Not quite"}
      </p>

      <FeedbackSection title="Correct answer">
        <p className="flex items-start gap-2 font-semibold text-foreground">
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-success-foreground"
            aria-hidden
          >
            {correctLetter}
          </span>
          <span>{question.options[question.answer]}</span>
        </p>
      </FeedbackSection>

      <FeedbackSection title="Why it is correct">
        <p>{question.explanation}</p>
      </FeedbackSection>

      {!correct ? (
        <FeedbackSection title="Why your choice was incorrect">
          <p>
            <span className="font-semibold text-foreground">
              You chose {selectedLetter}: “{question.options[selected]}”.
            </span>{" "}
            {wrongText ?? "This option doesn't match what the question describes. Compare it with the explanation above."}
          </p>
        </FeedbackSection>
      ) : null}

      <div className="flex gap-3 rounded-xl bg-background/40 p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <FeedbackSection title="Real-world example">
          <p>{question.example}</p>
        </FeedbackSection>
      </div>

      {!correct ? (
        <p className="text-xs text-muted-foreground">Added to your Review cards so you can practise it again.</p>
      ) : null}
    </div>
  );
}
