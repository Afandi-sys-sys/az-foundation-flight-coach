import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, ProgressBar } from "@/components/kit";
import { DOMAINS } from "@/data/domains";
import { QUESTION_BY_ID } from "@/data/questions";
import { percent } from "@/lib/progress-logic";
import { useProgress } from "@/lib/progress-store";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — CloudPrep Africa" },
      { name: "description", content: "See your latest practice score by learning area and what to revise next." },
      { property: "og:title", content: "Results — CloudPrep Africa" },
      { property: "og:description", content: "Your latest AZ-900 practice score and revision tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const state = useProgress();
  const session = state.sessions.at(-1);

  if (!session) {
    return (
      <Panel className="text-center">
        <h1 className="text-2xl font-bold">No results yet</h1>
        <p className="mt-2 text-muted-foreground">Finish a practice quiz to see your results here.</p>
        <Button asChild variant="hero" size="xl" className="mt-6">
          <Link to="/practice">Start Practice</Link>
        </Button>
      </Panel>
    );
  }

  const score = percent(session.correct, session.total);
  const byDomain = DOMAINS.map((d) => {
    const ids = session.questionIds.filter((id) => QUESTION_BY_ID[id].domain === d.id);
    const correct = ids.filter((id) => session.responses[id] === QUESTION_BY_ID[id].answer).length;
    return { ...d, total: ids.length, correct };
  }).filter((d) => d.total > 0);
  const toRevise = byDomain.filter((d) => percent(d.correct, d.total) < 80);
  const missedCount = session.total - session.correct;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-hero p-6 text-center shadow-glow sm:p-8">
        <p className="eyebrow">Practice performance</p>
        <p className="mt-2 font-display text-6xl font-bold">{score}%</p>
        <p className="mt-1 text-lg text-muted-foreground">
          {session.correct} of {session.total} correct
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          This reflects your practice performance only and is not a guarantee of passing the real exam.
        </p>
      </section>

      <Panel>
        <h2 className="text-xl font-bold">Performance by topic</h2>
        <ul className="mt-5 space-y-5">
          {byDomain.map((d) => (
            <li key={d.id}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {d.correct}/{d.total} · {percent(d.correct, d.total)}%
                </span>
              </div>
              <ProgressBar value={percent(d.correct, d.total)} label={d.name} />
            </li>
          ))}
        </ul>
      </Panel>

      {toRevise.length > 0 ? (
        <Panel>
          <h2 className="text-xl font-bold">What to revise next</h2>
          <div className="mt-4 space-y-3">
            {toRevise.map((d) => (
              <div key={d.id} className="rounded-2xl bg-surface p-4">
                <p className="font-semibold">{d.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.revise}</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <h2 className="text-xl font-bold">Your answers</h2>
        <ul className="mt-4 divide-y divide-border">
          {session.questionIds.map((id) => {
            const q = QUESTION_BY_ID[id];
            const ok = session.responses[id] === q.answer;
            return (
              <li key={id} className="flex gap-3 py-3">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
                ) : (
                  <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Incorrect" />
                )}
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{q.prompt}</p>
                  {!ok ? (
                    <p className="mt-1 text-muted-foreground">
                      Answer: <span className="text-foreground">{q.options[q.answer]}</span>
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="hero" size="xl">
          <Link to="/practice">Try Again</Link>
        </Button>
        {missedCount > 0 ? (
          <Button asChild variant="soft" size="xl">
            <Link to="/review">Review missed questions</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
