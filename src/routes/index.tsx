import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, StatCard } from "@/components/kit";
import { ReadinessCard, TopicProgress } from "@/components/Readiness";
import { PRACTICE_QUESTIONS } from "@/data/questions";
import { useProgress } from "@/lib/progress-store";
import { canTakePostTest, dueCards, percent, POST_TEST_MIN_PRACTICE } from "@/lib/progress-logic";

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

function NextStep({
  to,
  icon: Icon,
  title,
  body,
}: {
  to: "/practice" | "/review" | "/tests";
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <Link
      to={to}
      className="flex min-h-16 items-center gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-primary/60"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{body}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

function Home() {
  const state = useProgress();
  const hydrated = useHydrated();
  const answered = Object.keys(state.answers).length;
  const total = PRACTICE_QUESTIONS.length;
  const last = state.sessions.at(-1);
  const due = hydrated ? dueCards(state, Date.now()).length : 0;
  const cardCount = Object.keys(state.cards).length;

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
        <h2 className="text-xl font-bold">Your next steps</h2>
        <div className="mt-4 space-y-3">
          {!state.tests.pre ? (
            <NextStep
              to="/tests"
              icon={ClipboardCheck}
              title="Take the 9-question baseline test"
              body="See where you're starting from. Takes about 5 minutes."
            />
          ) : null}
          {due > 0 ? (
            <NextStep
              to="/review"
              icon={Layers}
              title={`${due} review ${due === 1 ? "card" : "cards"} due`}
              body="Revisit questions you missed, while they're fresh."
            />
          ) : null}
          <NextStep
            to="/practice"
            icon={Sparkles}
            title="Smart practice"
            body="10 questions picked from the areas where you need the most practice."
          />
          {state.tests.pre && !state.tests.post ? (
            <NextStep
              to="/tests"
              icon={ClipboardCheck}
              title={canTakePostTest(state) ? "Your post-test is ready" : "Post-test"}
              body={
                canTakePostTest(state)
                  ? "Compare your score with your baseline."
                  : `Unlocks after ${POST_TEST_MIN_PRACTICE} practice questions (${Math.min(answered, POST_TEST_MIN_PRACTICE)}/${POST_TEST_MIN_PRACTICE}).`
              }
            />
          ) : null}
          {cardCount > 0 && due === 0 ? (
            <p className="px-1 text-sm text-muted-foreground">
              All review cards are up to date. Nice work.
            </p>
          ) : null}
        </div>
      </Panel>

      <TopicProgress state={state} />
    </div>
  );
}
