import { Info, TrendingDown, TrendingUp } from "lucide-react";
import type { ProgressState } from "@/lib/progress-logic";
import { PRACTICE_QUESTIONS } from "@/data/questions";
import {
  MIN_TOPIC_QUESTIONS,
  practiceAccuracy,
  readinessBand,
  readinessStatus,
  topicPerformance,
  type TopicStrength,
} from "@/lib/insights";
import { cn } from "@/lib/utils";
import { Panel, ProgressBar } from "./kit";

const KEEP_PRACTISING = "Keep practising to build your readiness estimate";

function Disclaimer() {
  return (
    <div className="mt-5 flex gap-2.5 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      <p>
        This is an <strong className="text-foreground">unofficial learning indicator, not an official exam score</strong>{" "}
        and not a prediction of passing the real AZ-900 exam. It counts how many practice questions you most recently
        got right in each topic, weighted by that topic's approximate share of the public skills outline.
      </p>
    </div>
  );
}

export function ReadinessCard({ state }: { state: ProgressState }) {
  const status = readinessStatus(state);
  const answered = Object.keys(state.answers).length;

  if (status.score === null) {
    const minTotal = MIN_TOPIC_QUESTIONS * 3;
    const have = minTotal - status.missing.reduce((n, m) => n + m.needed, 0);
    return (
      <Panel>
        <p className="eyebrow">Unofficial readiness estimate</p>
        <h2 className="mt-1 text-xl font-bold">{KEEP_PRACTISING}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We only show an estimate once you've answered at least {MIN_TOPIC_QUESTIONS} different questions in each
          topic, so it's based on your real answers.
        </p>
        <ProgressBar className="mt-4" value={(have / minTotal) * 100} label="Progress towards a readiness estimate" />
        <ul className="mt-3 space-y-1.5 text-sm">
          {status.missing.map((m) => (
            <li key={m.id} className="flex justify-between gap-3">
              <span>{m.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {m.needed} more {m.needed === 1 ? "question" : "questions"}
              </span>
            </li>
          ))}
        </ul>
        <Disclaimer />
      </Panel>
    );
  }

  const score = status.score;
  const band = readinessBand(score);
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  return (
    <Panel>
      <p className="eyebrow">Unofficial readiness estimate</p>
      <h2 className="mt-1 text-xl font-bold">How your practice is going</h2>
      <div className="mt-5 flex items-center gap-5">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="9" className="stroke-track" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              className="stroke-primary transition-[stroke-dashoffset] duration-700"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - score / 100)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display text-3xl font-bold"
              aria-label={`Unofficial readiness estimate ${score} out of 100`}
            >
              {score}
            </span>
            <span className="text-[11px] text-muted-foreground">out of 100</span>
          </div>
        </div>
        <div className="min-w-0">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-xs font-semibold",
              band.tone === "low" && "bg-warning-soft text-warning",
              band.tone === "mid" && "bg-secondary text-primary",
              band.tone === "high" && "bg-success-soft text-success",
            )}
          >
            {band.label}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            Based on {answered} practice {answered === 1 ? "question" : "questions"} answered.
          </p>
        </div>
      </div>
      <Disclaimer />
    </Panel>
  );
}

/** Overall accuracy, questions answered and quizzes completed — all from saved answers. */
export function PracticeOverview({ state, due }: { state: ProgressState; due: number }) {
  const acc = practiceAccuracy(state);
  const answered = Object.keys(state.answers).length;
  const total = PRACTICE_QUESTIONS.length;
  const accPct = acc.accuracy === null ? null : Math.round(acc.accuracy * 100);
  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold">Practice accuracy</h2>
        <span className="font-display text-3xl font-bold" aria-label={accPct === null ? "No answers yet" : `${accPct}% accuracy`}>
          {accPct === null ? "—" : `${accPct}%`}
        </span>
      </div>
      <ProgressBar className="mt-3" value={accPct ?? 0} label="Overall practice accuracy" />
      <p className="mt-2 text-xs text-muted-foreground">
        {acc.attempts === 0
          ? "Answer some practice questions to see your accuracy."
          : `${acc.correct} of ${acc.attempts} recorded answers correct, including retries.`}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="rounded-2xl bg-surface px-2 py-3">
          <p className="font-display text-2xl font-bold">
            {answered}
            <span className="text-base text-muted-foreground">/{total}</span>
          </p>
          <p className="text-xs leading-tight text-muted-foreground">Questions answered</p>
        </div>
        <div className="rounded-2xl bg-surface px-2 py-3">
          <p className="font-display text-2xl font-bold">{state.sessions.length}</p>
          <p className="text-xs leading-tight text-muted-foreground">Quizzes completed</p>
        </div>
        <div className="rounded-2xl bg-surface px-2 py-3">
          <p className="font-display text-2xl font-bold">{due}</p>
          <p className="text-xs leading-tight text-muted-foreground">Flashcards due</p>
        </div>
      </div>
    </Panel>
  );
}

const STRENGTH_CHIP: Partial<Record<TopicStrength, { label: string; className: string; icon?: typeof TrendingUp }>> = {
  stronger: { label: "Stronger topic", className: "bg-success-soft text-success", icon: TrendingUp },
  weaker: { label: "Needs more practice", className: "bg-warning-soft text-warning", icon: TrendingDown },
  "not-enough-data": { label: "Not enough data yet", className: "bg-secondary text-muted-foreground" },
};

export function TopicProgress({ state, title = "Topic performance" }: { state: ProgressState; title?: string }) {
  const topics = topicPerformance(state);
  const stronger = topics.filter((t) => t.strength === "stronger");
  const weaker = topics.filter((t) => t.strength === "weaker");
  const even = topics.some((t) => t.strength === "even");
  return (
    <Panel>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {stronger.length && weaker.length
          ? `Stronger: ${stronger.map((t) => t.name).join(", ")}. Needs more practice: ${weaker.map((t) => t.name).join(", ")}.`
          : even
            ? "Your topics with enough answers are level. Keep practising to spot differences."
            : `Answer at least ${MIN_TOPIC_QUESTIONS} different questions in two or more topics to compare them.`}
      </p>
      <ul className="mt-5 space-y-5">
        {topics.map((t) => {
          const chip = STRENGTH_CHIP[t.strength];
          const accPct = t.accuracy === null ? null : Math.round(t.accuracy * 100);
          const Icon = chip?.icon;
          return (
            <li key={t.id}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="shrink-0 font-semibold">{accPct === null ? "—" : `${accPct}%`}</span>
              </div>
              <ProgressBar value={accPct ?? 0} label={`${t.name} accuracy`} />
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {chip ? (
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", chip.className)}>
                    {Icon ? <Icon className="size-3" aria-hidden /> : null}
                    {chip.label}
                  </span>
                ) : null}
                <span>
                  {t.attempts === 0
                    ? "Not started yet"
                    : `${t.correctAttempts} of ${t.attempts} answers correct · ${t.answered}/${t.total} questions tried`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
