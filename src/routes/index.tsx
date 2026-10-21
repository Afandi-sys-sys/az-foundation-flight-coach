import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, StatCard } from "@/components/kit";
import { ReadinessCard, TopicProgress } from "@/components/Readiness";
import { Recommendations } from "@/components/Recommendations";
import { PRACTICE_QUESTIONS } from "@/data/questions";
import { useProgress } from "@/lib/progress-store";
import { dueCards, flashcardSummary, percent } from "@/lib/progress-logic";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CloudPrep Africa — Unofficial AZ-900 study app" },
      {
        name: "description",
        content:
          "Karibu! Practise Azure Fundamentals with original questions, clear explanations, review cards and an unofficial readiness estimate.",
      },
      { property: "og:title", content: "CloudPrep Africa — Unofficial AZ-900 study app" },
      {
        property: "og:description",
        content: "Build your cloud skills one question at a time. Made for learners across Africa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const state = useProgress();
  const hydrated = useHydrated();
  const answered = Object.keys(state.answers).length;
  const total = PRACTICE_QUESTIONS.length;
  const last = state.sessions.at(-1);
  const due = hydrated ? dueCards(state, Date.now()).length : 0;
  const cards = flashcardSummary(state);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-hero p-6 shadow-glow sm:p-8">
        <p className="eyebrow">Azure Fundamentals · AZ-900</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
          Karibu! Build your cloud skills, one question at a time.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Beginner-friendly practice questions with clear explanations, made for learners across Africa.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="hero" size="xl">
            <Link to="/practice">{state.currentQuiz ? "Continue Practice" : "Start Practice"}</Link>
          </Button>
          {!state.tests.pre ? (
            <Button asChild variant="soft" size="xl">
              <Link to="/tests">Take the baseline test</Link>
            </Button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Questions completed" value={`${answered} / ${total}`} />
        <StatCard label="Latest score" value={last ? `${percent(last.correct, last.total)}%` : "—"} />
      </div>

      <ReadinessCard state={state} />

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Revision Flashcards</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Questions you miss in practice are saved here to revise.
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
            <Layers className="size-5" aria-hidden />
          </span>
        </div>
        {cards.total === 0 ? (
          <p className="mt-4 rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
            No missed questions yet. Any question you get wrong will appear here automatically.
          </p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-surface px-2 py-3">
                <p className="font-display text-2xl font-bold">{cards.total}</p>
                <p className="text-xs leading-tight text-muted-foreground">Saved</p>
              </div>
              <div className="rounded-2xl bg-surface px-2 py-3">
                <p className="font-display text-2xl font-bold text-warning">{cards.needsRevision}</p>
                <p className="text-xs leading-tight text-muted-foreground">Need revision</p>
              </div>
              <div className="rounded-2xl bg-surface px-2 py-3">
                <p className="font-display text-2xl font-bold text-success">{cards.understood}</p>
                <p className="text-xs leading-tight text-muted-foreground">Understood</p>
              </div>
            </div>
            <Button asChild variant={due > 0 ? "hero" : "soft"} size="xl" className="mt-4 w-full">
              <Link to="/review">
                {due > 0 ? `Review ${due} ${due === 1 ? "card" : "cards"} now` : "Open flashcards"}
              </Link>
            </Button>
          </>
        )}
      </Panel>

      <Recommendations state={state} />

      <TopicProgress state={state} />
    </div>
  );
}
