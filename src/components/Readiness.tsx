import { Info } from "lucide-react";
import type { ProgressState } from "@/lib/progress-logic";
import { domainStats, readinessBand, readinessEstimate } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { Panel, ProgressBar } from "./kit";

export function ReadinessCard({ state }: { state: ProgressState }) {
  const score = readinessEstimate(state);
  const band = readinessBand(score);
  const answered = Object.keys(state.answers).length;
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Unofficial readiness estimate</p>
          <h2 className="mt-1 text-xl font-bold">How your practice is going</h2>
        </div>
      </div>
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
            <span className="font-display text-3xl font-bold" aria-label={`Readiness estimate ${score} out of 100`}>
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
      <div className="mt-5 flex gap-2.5 rounded-2xl bg-surface p-4 text-sm leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        <p>
          This is a <strong className="text-foreground">learning indicator, not a prediction</strong> of passing
          the real AZ-900 exam. It counts how many practice questions you most recently got right in each
          learning area, weighted by that area's approximate share of the public skills outline.
        </p>
      </div>
    </Panel>
  );
}

export function TopicProgress({ state, title = "Topic progress" }: { state: ProgressState; title?: string }) {
  const stats = domainStats(state);
  return (
    <Panel>
      <h2 className="text-xl font-bold">{title}</h2>
      <ul className="mt-5 space-y-5">
        {stats.map((s) => (
          <li key={s.id}>
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {s.answered}/{s.total} answered
              </span>
            </div>
            <ProgressBar value={(s.answered / s.total) * 100} label={`${s.name} answered`} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {s.accuracy === null
                ? "Not started yet"
                : `${s.correct} correct on latest try · ${Math.round(s.accuracy * 100)}% accuracy`}
            </p>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
