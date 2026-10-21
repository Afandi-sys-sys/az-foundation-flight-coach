import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Layers, Lightbulb, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Panel, ProgressBar } from "@/components/kit";
import { DOMAIN_BY_ID } from "@/data/domains";
import { question } from "@/data/questions";
import { formatDue } from "@/lib/format";
import {
  cardStatus,
  dueCards,
  flashcardSummary,
  intervalForStep,
  REVIEW_INTERVAL_DAYS,
  reviewCard,
  type Card,
} from "@/lib/progress-logic";
import { updateProgress, useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Revision Flashcards — CloudPrep Africa" },
      {
        name: "description",
        content:
          "Every practice question you miss becomes a flashcard. Reveal the answer, then mark it Again or Got it.",
      },
      { property: "og:title", content: "Revision Flashcards — CloudPrep Africa" },
      {
        property: "og:description",
        content: "Missed-question flashcards for unofficial AZ-900 practice, with spaced reviews.",
      },
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
  const [lastAction, setLastAction] = useState<"again" | "good" | null>(null);
  const [reviewedNow, setReviewedNow] = useState(0);

  const now = hydrated ? Date.now() : 0;
  const all = Object.values(state.cards);
  const summary = flashcardSummary(state);
  const due = hydrated ? dueCards(state, now) : [];
  const card = due[0];
  const upcoming = all.filter((c) => !due.includes(c)).sort((a, b) => a.due - b.due);

  const grade = (g: "again" | "good") => {
    if (!card) return;
    updateProgress((s) => reviewCard(s, card.qid, g, Date.now()));
    setRevealed(false);
    setLastAction(g);
    setReviewedNow((n) => n + 1);
  };

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Missed questions" title="Revision Flashcards">
        Every practice question you get wrong is saved here automatically. Reveal the answer, then choose
        “Again” to keep revising it or “Got it” when you understand it.
      </PageHeading>

      {!hydrated ? (
        <Panel>
          <p className="text-muted-foreground">Loading your flashcards…</p>
        </Panel>
      ) : all.length === 0 ? (
        <Panel className="text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-secondary text-accent">
            <Layers className="size-7" aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-bold">No missed questions yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Hongera — nothing to revise so far! When you miss a practice question, it becomes a flashcard here
            so you can learn it properly.
          </p>
          <Button asChild variant="hero" size="xl" className="mt-6 w-full sm:w-auto">
            <Link to="/practice">Start Practice</Link>
          </Button>
        </Panel>
      ) : (
        <>
          <FlashcardSummary {...summary} />

          {lastAction ? (
            <p role="status" aria-live="polite" className="px-1 text-sm text-muted-foreground">
              {lastAction === "good"
                ? "Marked as understood. It will come back later for a quick check."
                : "Kept for revision. You'll see it again in this session."}
            </p>
          ) : null}

          {!card ? (
            <Panel className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-success" aria-hidden />
              <h2 className="mt-3 text-xl font-bold">All caught up!</h2>
              <p className="mt-2 text-muted-foreground">
                {reviewedNow > 0 ? `You reviewed ${reviewedNow} ${reviewedNow === 1 ? "card" : "cards"}. ` : ""}
                {upcoming[0] ? `Next card: ${formatDue(upcoming[0].due, now).toLowerCase()}.` : ""}
              </p>
              <Button asChild variant="soft" size="xl" className="mt-6 w-full sm:w-auto">
                <Link to="/practice">Keep practising</Link>
              </Button>
            </Panel>
          ) : (
            <FlashcardView
              key={`${card.qid}-${card.reviews}`}
              card={card}
              remaining={due.length}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
              onGrade={grade}
            />
          )}

          <Panel>
            <h2 className="text-lg font-bold">Your flashcards ({all.length})</h2>
            <ul className="mt-3 divide-y divide-border">
              {[...due, ...upcoming].map((c) => (
                <FlashcardRow
                  key={c.qid}
                  card={c}
                  now={now}
                  misses={(state.answers[c.qid]?.attempts ?? 0) - (state.answers[c.qid]?.correctCount ?? 0)}
                />
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

function FlashcardSummary({ total, needsRevision, understood }: ReturnType<typeof flashcardSummary>) {
  return (
    <Panel>
      <div className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <SummaryTile value={total} label="Saved" />
        <SummaryTile value={needsRevision} label="Need revision" tone="again" />
        <SummaryTile value={understood} label="Understood" tone="good" />
      </div>
      <ProgressBar
        className="mt-4"
        value={total ? (understood / total) * 100 : 0}
        label="Flashcards understood"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        {understood} of {total} {total === 1 ? "card" : "cards"} understood for now
      </p>
    </Panel>
  );
}

function SummaryTile({ value, label, tone }: { value: number; label: string; tone?: "again" | "good" }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3">
      <p
        className={cn(
          "font-display text-2xl font-bold",
          tone === "again" && "text-warning",
          tone === "good" && "text-success",
        )}
      >
        {value}
      </p>
      <p className="text-xs leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusChip({ card }: { card: Card }) {
  const understood = cardStatus(card) === "understood";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        understood ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
      )}
    >
      {understood ? "Understood" : "Needs revision"}
    </span>
  );
}

function FlashcardRow({ card, now, misses }: { card: Card; now: number; misses: number }) {
  const q = question(card.qid);
  return (
    <li className="flex items-start justify-between gap-3 py-3 text-sm">
      <span className="min-w-0">
        <span className="line-clamp-2">{q.prompt}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <StatusChip card={card} />
          <span>{DOMAIN_BY_ID[q.domain].name}</span>
          {misses > 1 ? <span>Missed {misses} times in practice</span> : null}
        </span>
      </span>
      <span
        className={cn("shrink-0 text-right", card.due <= now ? "font-semibold text-accent" : "text-muted-foreground")}
      >
        {formatDue(card.due, now)}
      </span>
    </li>
  );
}

function FlashcardView({
  card,
  remaining,
  revealed,
  onReveal,
  onGrade,
}: {
  card: Card;
  remaining: number;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (g: "again" | "good") => void;
}) {
  const q = question(card.qid);
  const nextDays = intervalForStep(card.step);
  return (
    <Panel className="animate-reveal">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-accent">
          {DOMAIN_BY_ID[q.domain].name}
        </span>
        <span>
          {remaining} to review · Step {Math.min(card.step, REVIEW_INTERVAL_DAYS.length)} of{" "}
          {REVIEW_INTERVAL_DAYS.length}
        </span>
      </div>
      <p className="eyebrow mt-5">Question</p>
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
          Reveal Answer
        </Button>
      ) : (
        <div className="animate-reveal mt-6 space-y-4">
          <div className="rounded-2xl bg-surface p-4">
            <p className="eyebrow">Correct answer</p>
            <p className="mt-2 flex items-start gap-2 font-semibold">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-xs font-bold text-success-foreground"
                aria-hidden
              >
                {LETTERS[q.answer]}
              </span>
              <span>{q.options[q.answer]}</span>
            </p>
            <p className="eyebrow mt-4">Explanation</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/90">{q.explanation}</p>
          </div>
          {q.example ? (
            <div className="flex gap-3 rounded-2xl bg-surface p-4">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="eyebrow">Real-world example</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{q.example}</p>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="again" size="xl" onClick={() => onGrade("again")} className="h-auto min-h-16 flex-col gap-0 py-2">
              <span className="flex items-center gap-1.5">
                <RotateCcw className="size-4" aria-hidden />
                Again
              </span>
              <span className="text-xs font-normal opacity-80">Keep revising it</span>
            </Button>
            <Button variant="good" size="xl" onClick={() => onGrade("good")} className="h-auto min-h-16 flex-col gap-0 py-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4" aria-hidden />
                Got it
              </span>
              <span className="text-xs font-normal opacity-80">
                Check again in {nextDays} {nextDays === 1 ? "day" : "days"}
              </span>
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}
