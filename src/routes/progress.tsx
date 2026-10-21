import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeading, Panel, ProgressBar } from "@/components/kit";
import { ReadinessCard, TopicProgress } from "@/components/Readiness";
import { DOMAIN_BY_ID } from "@/data/domains";
import { PRACTICE_QUESTIONS, QUESTION_BY_ID } from "@/data/questions";
import { formatDate, signed } from "@/lib/format";
import { dueCards, percent, REVIEW_INTERVAL_DAYS } from "@/lib/progress-logic";
import { resetProgress, useProgress } from "@/lib/progress-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Your progress — CloudPrep Africa" },
      {
        name: "description",
        content: "Track answered questions, topic progress, test results, review cards and practice history.",
      },
      { property: "og:title", content: "Your progress — CloudPrep Africa" },
      { property: "og:description", content: "Your AZ-900 practice progress, saved on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgressPage,
});

const MODE_LABEL = { all: "All learning areas", domain: "", adaptive: "Smart practice" } as const;

function ProgressPage() {
  const state = useProgress();
  const hydrated = useHydrated();
  const answered = Object.keys(state.answers).length;
  const total = PRACTICE_QUESTIONS.length;
  const missed = Object.entries(state.answers).filter(([, a]) => !a.correct);
  const cards = Object.values(state.cards);
  const due = hydrated ? dueCards(state, Date.now()).length : 0;
  const mastered = cards.filter((c) => c.step >= REVIEW_INTERVAL_DAYS.length).length;
  const { pre, post } = state.tests;

  const onReset = () => {
    if (window.confirm("Reset all progress? This deletes your answers, results, review cards and test scores on this device.")) {
      resetProgress();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeading title="Your progress">
        Saved on this browser. Based on your most recent answer to each question.
      </PageHeading>

      <Panel>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-semibold">Overall</span>
          <span className="text-muted-foreground">
            {answered}/{total} answered
          </span>
        </div>
        <ProgressBar value={(answered / total) * 100} label="Overall answered" />
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-surface p-3">
            <p className="font-display text-2xl font-bold">{state.sessions.length}</p>
            <p className="text-xs text-muted-foreground">Quizzes done</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="font-display text-2xl font-bold">{cards.length}</p>
            <p className="text-xs text-muted-foreground">Review cards</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="font-display text-2xl font-bold">{due}</p>
            <p className="text-xs text-muted-foreground">Due now</p>
          </div>
        </div>
        {mastered > 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {mastered} {mastered === 1 ? "card has" : "cards have"} passed every review step.
          </p>
        ) : null}
      </Panel>

      <ReadinessCard state={state} />
      <TopicProgress state={state} title="By learning area" />

      <Panel>
        <h2 className="text-xl font-bold">Test results</h2>
        {!pre ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No tests yet.{" "}
            <Link to="/tests" className="font-semibold text-primary underline-offset-4 hover:underline">
              Take the pre-test
            </Link>
          </p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              Pre-test: <strong>{percent(pre.correct, pre.total)}%</strong>{" "}
              <span className="text-muted-foreground">({pre.correct}/{pre.total})</span>
            </p>
            {post ? (
              <p>
                Post-test: <strong>{percent(post.correct, post.total)}%</strong>{" "}
                <span className="text-muted-foreground">({post.correct}/{post.total})</span> · Change{" "}
                <strong>
                  {signed(percent(post.correct, post.total) - percent(pre.correct, pre.total))} points
                </strong>
              </p>
            ) : (
              <p className="text-muted-foreground">Post-test not taken yet.</p>
            )}
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="text-xl font-bold">Missed questions ({missed.length})</h2>
        {answered === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">You haven't answered any questions yet.</p>
        ) : missed.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No missed questions on your latest answers. Great work!</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {missed.map(([qid]) => {
              const q = QUESTION_BY_ID[qid];
              return (
                <li key={qid} className="py-3 text-sm">
                  <p className="text-xs text-muted-foreground">{DOMAIN_BY_ID[q.domain].name}</p>
                  <p className="mt-0.5 font-medium">{q.prompt}</p>
                  <p className="mt-1 text-muted-foreground">
                    Answer: <span className="text-foreground">{q.options[q.answer]}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {state.sessions.length > 0 ? (
        <Panel>
          <h2 className="text-xl font-bold">Practice history</h2>
          <ul className="mt-3 divide-y divide-border">
            {[...state.sessions].reverse().slice(0, 15).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">
                    {s.mode === "domain" && s.domain ? DOMAIN_BY_ID[s.domain].name : MODE_LABEL[s.mode]}
                  </span>
                  <span className="text-xs text-muted-foreground">{hydrated ? formatDate(s.finishedAt) : ""}</span>
                </span>
                <span className="shrink-0 font-semibold">
                  {s.correct}/{s.total} · {percent(s.correct, s.total)}%
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="hero" size="xl">
          <Link to="/practice">Practice again</Link>
        </Button>
        <Button variant="danger" size="xl" onClick={onReset}>
          Reset progress
        </Button>
      </div>
    </div>
  );
}
