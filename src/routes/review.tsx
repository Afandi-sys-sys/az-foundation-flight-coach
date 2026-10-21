import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Panel } from "@/components/kit";
import { DOMAIN_BY_ID } from "@/data/domains";
import { question } from "@/data/questions";
import { formatDue } from "@/lib/format";
import { dueCards, intervalForStep, REVIEW_INTERVAL_DAYS, reviewCard } from "@/lib/progress-logic";
import { updateProgress, useProgress } from "@/lib/progress-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review cards — CloudPrep Africa" },
      {
        name: "description",
        content: "Flashcards for the practice questions you missed, scheduled at 1, 2, 4, 8 and 16 day intervals.",
      },
      { property: "og:title", content: "Review cards — CloudPrep Africa" },
      { property: "og:description", content: "Spaced-review flashcards for missed AZ-900 practice questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

const LETTERS = ["A", "B", "C", "D"];

function ReviewPage() {
  const state = useProgress();
  const hydrated = useHydrated();
  const [revealed, setRevealed] = useState(false);
  const [reviewedNow, setReviewedNow] = useState(0);

  const now = hydrated ? Date.now() : 0;
  const all = Object.values(state.cards);
  const due = hydrated ? dueCards(state, now) : [];
  const card = due[0];
  const upcoming = all.filter((c) => !due.includes(c)).sort((a, b) => a.due - b.due);

  const grade = (g: "again" | "good") => {
    if (!card) return;
    updateProgress((s) => reviewCard(s, card.qid, g, Date.now()));
    setRevealed(false);
    setReviewedNow((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Missed-question flashcards" title="Review">
        Questions you answer incorrectly in practice land here. Press “Got it” and the next review waits{" "}
        {REVIEW_INTERVAL_DAYS.join(", ")} days as you improve. “Again” brings it back today.
      </PageHeading>

      {!hydrated ? (
        <Panel>
          <p className="text-muted-foreground">Loading your cards…</p>
        </Panel>
      ) : all.length === 0 ? (
        <Panel className="text-center">
          <h2 className="text-xl font-bold">No review cards yet</h2>
          <p className="mt-2 text-muted-foreground">
            When you miss a practice question, it will appear here so you can learn it properly.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-6">
            <Link to="/practice">Start Practice</Link>
          </Button>
        </Panel>
      ) : !card ? (
        <Panel className="text-center">
          <h2 className="text-xl font-bold">All caught up!</h2>
          <p className="mt-2 text-muted-foreground">
            {reviewedNow > 0 ? `You reviewed ${reviewedNow} ${reviewedNow === 1 ? "card" : "cards"}. ` : ""}
            {upcoming[0] ? `Next card: ${formatDue(upcoming[0].due, now).toLowerCase()}.` : ""}
          </p>
          <Button asChild variant="soft" size="xl" className="mt-6">
            <Link to="/practice">Keep practising</Link>
          </Button>
        </Panel>
      ) : (
        <ReviewCardView
          key={`${card.qid}-${card.reviews}`}
          qid={card.qid}
          step={card.step}
          remaining={due.length}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onGrade={grade}
        />
      )}

      {hydrated && all.length > 0 ? (
        <Panel>
          <h2 className="text-lg font-bold">All cards ({all.length})</h2>
          <ul className="mt-3 divide-y divide-border">
            {[...due, ...upcoming].map((c) => (
              <li key={c.qid} className="flex items-start justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="line-clamp-2">{question(c.qid).prompt}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Step {Math.min(c.step, REVIEW_INTERVAL_DAYS.length)} of {REVIEW_INTERVAL_DAYS.length}
                  </span>
                </span>
                <span className={c.due <= now ? "shrink-0 font-semibold text-accent" : "shrink-0 text-muted-foreground"}>
                  {formatDue(c.due, now)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function ReviewCardView({
  qid,
  step,
  remaining,
  revealed,
  onReveal,
  onGrade,
}: {
  qid: string;
  step: number;
  remaining: number;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (g: "again" | "good") => void;
}) {
  const q = question(qid);
  const nextDays = intervalForStep(step);
  return (
    <Panel className="animate-reveal">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{remaining} due</span>
        <span>
          Step {Math.min(step, REVIEW_INTERVAL_DAYS.length)} of {REVIEW_INTERVAL_DAYS.length}
        </span>
      </div>
      <p className="eyebrow mt-4">{DOMAIN_BY_ID[q.domain].name}</p>
      <h2 className="mt-2 text-xl font-bold leading-snug">{q.prompt}</h2>
      <ul className="mt-4 space-y-2">
        {q.options.map((opt, i) => (
          <li
            key={i}
            className={
              revealed && i === q.answer
                ? "flex gap-3 rounded-xl border-2 border-success bg-success-soft px-4 py-3"
                : "flex gap-3 rounded-xl border border-border px-4 py-3"
            }
          >
            <span className="font-bold text-muted-foreground">{LETTERS[i]}</span>
            <span>{opt}</span>
          </li>
        ))}
      </ul>

      {!revealed ? (
        <Button variant="hero" size="xl" className="mt-6 w-full" onClick={onReveal}>
          Show answer
        </Button>
      ) : (
        <div className="animate-reveal mt-6 space-y-4">
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-sm font-semibold">Answer: {q.options[q.answer]}</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{q.explanation}</p>
          </div>
          <div className="flex gap-3 rounded-2xl bg-surface p-4">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <p className="text-sm leading-relaxed text-foreground/90">{q.example}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="again" size="xl" onClick={() => onGrade("again")} className="flex-col gap-0 h-16">
              Again
              <span className="text-xs font-normal opacity-80">See it again today</span>
            </Button>
            <Button variant="good" size="xl" onClick={() => onGrade("good")} className="flex-col gap-0 h-16">
              Got it
              <span className="text-xs font-normal opacity-80">
                Next in {nextDays} {nextDays === 1 ? "day" : "days"}
              </span>
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
