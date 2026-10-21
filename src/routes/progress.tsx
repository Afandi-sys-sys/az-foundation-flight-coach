import { createFileRoute, Link } from "@tanstack/react-router";
import { useHydrated } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeading, Panel } from "@/components/kit";
import { PracticeOverview, ReadinessCard, TopicProgress } from "@/components/Readiness";
import { Recommendations } from "@/components/Recommendations";
import { ComparisonSummary, TestHistoryList } from "@/components/TestHistory";
import { DOMAIN_BY_ID } from "@/data/domains";
import { question } from "@/data/questions";
import { formatDate } from "@/lib/format";
import { dueCards, percent } from "@/lib/progress-logic";
import { resetProgress, useProgress } from "@/lib/progress-store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Readiness dashboard — CloudPrep Africa" },
      {
        name: "description",
        content: "Practice accuracy, topic strengths, test history and personalised recommendations for your AZ-900 study.",
      },
      { property: "og:title", content: "Readiness dashboard — CloudPrep Africa" },
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
  const missed = Object.entries(state.answers).filter(([, a]) => !a.correct);
  const due = hydrated ? dueCards(state, Date.now()).length : 0;

  const onReset = () => {
    if (window.confirm("Reset all progress? This deletes your answers, results, flashcards and test scores on this device.")) {
      resetProgress();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Readiness dashboard" title="Your progress">
        Saved on this browser and built only from your own answers. An unofficial learning indicator, not an exam score.
      </PageHeading>

      <PracticeOverview state={state} due={due} />
      <ReadinessCard state={state} />
      <TopicProgress state={state} />
      <Recommendations state={state} />

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold">Test results</h2>
          <Link to="/tests" className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            Open tests
          </Link>
        </div>
        <ComparisonSummary state={state} />
        <h3 className="mt-5 text-sm font-semibold text-muted-foreground">Test history</h3>
        <TestHistoryList state={state} />
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
              const q = question(qid);
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
