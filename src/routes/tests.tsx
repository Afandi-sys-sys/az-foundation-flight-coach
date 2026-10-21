import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Lock, Minus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading, Panel, ProgressBar } from "@/components/kit";
import { QuestionCard } from "@/components/QuestionCard";
import { DOMAINS } from "@/data/domains";
import { TEST_QUESTION_BY_ID } from "@/data/tests";
import { formatDate, signed } from "@/lib/format";
import {
  abandonTest,
  answerTestQuestion,
  canTakePostTest,
  distinctPracticeAnswered,
  finishTest,
  percent,
  POST_TEST_MIN_PRACTICE,
  startTest,
  type CurrentTest,
  type TestKind,
  type TestResult,
} from "@/lib/progress-logic";
import { newId, updateProgress, useProgress } from "@/lib/progress-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tests")({
  head: () => ({
    meta: [
      { title: "Pre-test and post-test — CloudPrep Africa" },
      {
        name: "description",
        content: "Take a short baseline test, practise, then take a post-test and see how much you improved.",
      },
      { property: "og:title", content: "Pre-test and post-test — CloudPrep Africa" },
      { property: "og:description", content: "Measure your AZ-900 learning progress with two short original tests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestsPage,
});

function TestsPage() {
  const state = useProgress();
  const [reviewing, setReviewing] = useState<TestKind | null>(null);

  if (state.currentTest) {
    return <TestRunner key={state.currentTest.id} test={state.currentTest} onDone={(k) => setReviewing(k)} />;
  }

  const { pre, post } = state.tests;
  const practiced = distinctPracticeAnswered(state);
  const postReady = canTakePostTest(state);

  const begin = (kind: TestKind) => {
    setReviewing(null);
    updateProgress((s) => startTest(s, kind, newId(kind), Date.now()));
  };

  return (
    <div className="space-y-5">
      <PageHeading eyebrow="Measure your learning" title="Pre-test and post-test">
        Two short tests with 9 original questions each (3 per learning area). Take the pre-test before you practise,
        then the post-test once you have practised, and compare.
      </PageHeading>

      {pre && post ? <Comparison pre={pre} post={post} /> : null}

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2 className="mt-1 text-xl font-bold">Pre-test (baseline)</h2>
          </div>
          {pre ? <ScorePill result={pre} /> : null}
        </div>
        {pre ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Completed {formatDate(pre.finishedAt)}. Taken once, so it stays a fair starting point.</p>
            <Button variant="soft" size="xl" className="mt-4 w-full sm:w-auto" onClick={() => setReviewing(reviewing === "pre" ? null : "pre")}>
              {reviewing === "pre" ? "Hide answers" : "Review answers"}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              No feedback until the end, so you get an honest starting point. About 5 minutes.
            </p>
            <Button variant="hero" size="xl" className="mt-4 w-full sm:w-auto" onClick={() => begin("pre")}>
              Start pre-test
            </Button>
          </>
        )}
        {reviewing === "pre" && pre ? <TestReview result={pre} /> : null}
      </Panel>

      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2 className="mt-1 text-xl font-bold">Post-test</h2>
          </div>
          {post ? <ScorePill result={post} /> : !postReady ? <Lock className="size-5 text-muted-foreground" aria-label="Locked" /> : null}
        </div>
        {!postReady ? (
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p>Unlocks after you:</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2">
                {pre ? <CheckCircle2 className="size-4 text-success" aria-hidden /> : <Minus className="size-4" aria-hidden />}
                complete the pre-test
              </li>
              <li className="flex items-center gap-2">
                {practiced >= POST_TEST_MIN_PRACTICE ? (
                  <CheckCircle2 className="size-4 text-success" aria-hidden />
                ) : (
                  <Minus className="size-4" aria-hidden />
                )}
                answer {POST_TEST_MIN_PRACTICE} different practice questions ({Math.min(practiced, POST_TEST_MIN_PRACTICE)}/
                {POST_TEST_MIN_PRACTICE})
              </li>
            </ul>
            <ProgressBar value={(Math.min(practiced, POST_TEST_MIN_PRACTICE) / POST_TEST_MIN_PRACTICE) * 100} label="Practice towards post-test" />
            <Button asChild variant="soft" size="xl" className="w-full sm:w-auto">
              <Link to={pre ? "/practice" : "/tests"}>{pre ? "Go to practice" : "Take the pre-test first"}</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {post
                ? `Last taken ${formatDate(post.finishedAt)}. You can retake it after more practice.`
                : "Different questions covering the same skills as the pre-test."}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="xl" onClick={() => begin("post")}>
                {post ? "Retake post-test" : "Start post-test"}
              </Button>
              {post ? (
                <Button variant="soft" size="xl" onClick={() => setReviewing(reviewing === "post" ? null : "post")}>
                  {reviewing === "post" ? "Hide answers" : "Review answers"}
                </Button>
              ) : null}
            </div>
          </>
        )}
        {reviewing === "post" && post ? <TestReview result={post} /> : null}
      </Panel>

      <p className="text-xs text-muted-foreground">
        Test scores show your learning progress in this app only. They do not predict your result in the real exam.
      </p>
    </div>
  );
}

function ScorePill({ result }: { result: TestResult }) {
  return (
    <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-sm font-semibold">
      {result.correct}/{result.total} · {percent(result.correct, result.total)}%
    </span>
  );
}

function Comparison({ pre, post }: { pre: TestResult; post: TestResult }) {
  const p1 = percent(pre.correct, pre.total);
  const p2 = percent(post.correct, post.total);
  const diff = p2 - p1;
  const Icon = diff > 0 ? ArrowUpRight : diff < 0 ? ArrowDownRight : Minus;
  return (
    <section className="rounded-3xl border border-border bg-hero p-6 shadow-glow">
      <p className="eyebrow">Your change</p>
      <div className="mt-3 grid grid-cols-3 items-end gap-3 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Pre-test</p>
          <p className="font-display text-3xl font-bold">{p1}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Post-test</p>
          <p className="font-display text-3xl font-bold">{p2}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Change</p>
          <p
            className={cn(
              "flex items-center justify-center gap-1 font-display text-3xl font-bold",
              diff > 0 && "text-success",
              diff < 0 && "text-destructive",
            )}
          >
            <Icon className="size-6" aria-hidden />
            {signed(diff)}
          </p>
          <p className="text-[11px] text-muted-foreground">points</p>
        </div>
      </div>
      <ul className="mt-6 space-y-4">
        {DOMAINS.map((d) => {
          const a = pre.byDomain[d.id];
          const b = post.byDomain[d.id];
          const pa = percent(a.correct, a.total);
          const pb = percent(b.correct, b.total);
          return (
            <li key={d.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {a.correct}/{a.total} → {b.correct}/{b.total}
                </span>
              </div>
              <div className="space-y-1">
                <ProgressBar value={pa} label={`${d.name} pre-test`} className="h-1.5 opacity-50" />
                <ProgressBar value={pb} label={`${d.name} post-test`} className="h-1.5" />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">Faded bar: pre-test. Bright bar: post-test.</p>
    </section>
  );
}

function TestReview({ result }: { result: TestResult }) {
  return (
    <ul className="mt-5 space-y-3">
      {result.questionIds.map((id, i) => {
        const q = TEST_QUESTION_BY_ID[id];
        const picked = result.responses[id];
        const ok = picked === q.answer;
        return (
          <li key={id} className="rounded-2xl bg-surface p-4 text-sm">
            <p className="flex gap-2 font-semibold">
              {ok ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-label="Correct" />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="Incorrect" />
              )}
              {i + 1}. {q.prompt}
            </p>
            {!ok ? <p className="mt-2 text-muted-foreground">Your answer: {q.options[picked]}</p> : null}
            <p className="mt-1">
              <span className="text-muted-foreground">Correct answer: </span>
              {q.options[q.answer]}
            </p>
            <p className="mt-2 leading-relaxed text-muted-foreground">{q.explanation}</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">Example: {q.example}</p>
          </li>
        );
      })}
    </ul>
  );
}

function TestRunner({ test, onDone }: { test: CurrentTest; onDone: (k: TestKind) => void }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = Object.keys(test.responses).length;
  const total = test.questionIds.length;
  const allAnswered = answered === total;
  const qid = test.questionIds[test.index];
  const q = TEST_QUESTION_BY_ID[qid];
  const isLast = answered === total - 1;

  const submit = () => {
    if (chosen === null) return;
    if (isLast) {
      updateProgress((s) => finishTest(answerTestQuestion(s, test.id, qid, chosen), Date.now()));
      onDone(test.kind);
    } else {
      updateProgress((s) => answerTestQuestion(s, test.id, qid, chosen));
      setChosen(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const quit = () => {
    if (!window.confirm("Leave this test? Your answers in this test will be discarded.")) return;
    updateProgress(abandonTest);
  };

  if (allAnswered) {
    // Safety net: all answered but not finished (e.g. closed tab at the last moment).
    return (
      <Panel className="text-center">
        <h1 className="text-xl font-bold">All questions answered</h1>
        <Button
          variant="hero"
          size="xl"
          className="mt-4"
          onClick={() => {
            updateProgress((s) => finishTest(s, Date.now()));
            onDone(test.kind);
          }}
        >
          See my score
        </Button>
      </Panel>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {test.kind === "pre" ? "Pre-test" : "Post-test"} · Question {answered + 1} of {total}
        </span>
        <button type="button" onClick={quit} className="min-h-11 px-2 underline underline-offset-4 hover:text-foreground">
          Quit
        </button>
      </div>
      <ProgressBar value={(answered / total) * 100} label="Test progress" className="mb-6" />
      <Panel>
        <QuestionCard key={qid} question={q} chosen={chosen} submitted={null} onChoose={setChosen} />
        <p className="mt-4 text-xs text-muted-foreground">Answers are revealed at the end of the test.</p>
        <Button variant="hero" size="xl" className="mt-4 w-full sm:w-auto" disabled={chosen === null} onClick={submit}>
          {isLast ? "Finish test" : "Next question"}
        </Button>
      </Panel>
    </div>
  );
}
