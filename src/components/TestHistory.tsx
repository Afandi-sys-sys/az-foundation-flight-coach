import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, signed } from "@/lib/format";
import {
  canTakePostTest,
  distinctPracticeAnswered,
  percent,
  POST_TEST_MIN_PRACTICE,
  testComparison,
  testHistory,
  type ProgressState,
} from "@/lib/progress-logic";
import { cn } from "@/lib/utils";

/** Every completed test with type, date, score and percentage. */
export function TestHistoryList({ state }: { state: ProgressState }) {
  const history = testHistory(state);
  if (history.length === 0) return <p className="mt-2 text-sm text-muted-foreground">No tests completed yet.</p>;
  let postNo = 0;
  return (
    <ul className="mt-3 divide-y divide-border">
      {[...history]
        .map((r) => ({ r, label: r.kind === "pre" ? "Baseline test" : `Post-test ${++postNo}` }))
        .reverse()
        .map(({ r, label }) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="min-w-0">
              <span className="block font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{formatDate(r.finishedAt)}</span>
            </span>
            <span className="shrink-0 font-semibold">
              {r.correct}/{r.total} · {percent(r.correct, r.total)}%
            </span>
          </li>
        ))}
    </ul>
  );
}

/** Baseline vs latest post-test, or what the learner still needs to do to get a meaningful comparison. */
export function ComparisonSummary({ state }: { state: ProgressState }) {
  const cmp = testComparison(state);
  if (cmp) {
    return (
      <p className="mt-2 text-sm">
        Baseline <strong>{cmp.prePct}%</strong> → latest post-test <strong>{cmp.postPct}%</strong>:{" "}
        <strong className={cn(cmp.change > 0 && "text-success", cmp.change < 0 && "text-destructive")}>
          {signed(cmp.change)} percentage points
        </strong>
      </p>
    );
  }
  return <UnlockComparison state={state} />;
}

export function UnlockComparison({ state }: { state: ProgressState }) {
  const pre = !!state.tests.pre;
  const practiced = distinctPracticeAnswered(state);
  const ready = canTakePostTest(state);
  const steps = [
    { done: pre, text: "Take the baseline test" },
    {
      done: practiced >= POST_TEST_MIN_PRACTICE,
      text: `Answer ${POST_TEST_MIN_PRACTICE} different practice questions (${Math.min(practiced, POST_TEST_MIN_PRACTICE)}/${POST_TEST_MIN_PRACTICE})`,
    },
    { done: false, text: "Take the post-test" },
  ];
  return (
    <div className="mt-2 text-sm text-muted-foreground">
      <p className="flex items-center gap-2">
        <Lock className="size-4 shrink-0" aria-hidden />
        Complete both tests to see a meaningful before-and-after comparison:
      </p>
      <ol className="mt-2 space-y-1.5">
        {steps.map((s) => (
          <li key={s.text} className={cn("flex items-center gap-2", s.done && "text-foreground")}>
            {s.done ? (
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Done" />
            ) : (
              <Minus className="size-4 shrink-0" aria-label="Not done yet" />
            )}
            {s.text}
          </li>
        ))}
      </ol>
      {!pre || ready ? (
        <Button asChild variant="soft" size="xl" className="mt-4 w-full sm:w-auto">
          <Link to="/tests">{pre ? "Take the post-test" : "Take the baseline test"}</Link>
        </Button>
      ) : null}
    </div>
  );
}
