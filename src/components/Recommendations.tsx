import { Link, useHydrated, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ClipboardCheck, Layers, Sparkles, Target } from "lucide-react";
import type { ProgressState } from "@/lib/progress-logic";
import { questionIdsFor, startQuiz } from "@/lib/progress-logic";
import { recommendations, type Recommendation } from "@/lib/insights";
import { newId, updateProgress } from "@/lib/progress-store";
import { Panel } from "./kit";

const ICONS: Record<Recommendation["id"], typeof Sparkles> = {
  baseline: ClipboardCheck,
  flashcards: Layers,
  "weakest-topic": Target,
  "spread-topics": Target,
  "post-test": ClipboardCheck,
  "smart-practice": Sparkles,
};

const rowClass =
  "flex min-h-16 w-full items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/60";

function RowBody({ rec, note }: { rec: Recommendation; note?: string }) {
  const Icon = ICONS[rec.id];
  return (
    <>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-accent">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{rec.title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          <span className="font-semibold text-foreground/80">Why: </span>
          {rec.why}
        </span>
        {note ? <span className="mt-1 block text-xs text-accent">{note}</span> : null}
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </>
  );
}

export function Recommendations({ state, title = "Recommended for you" }: { state: ProgressState; title?: string }) {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const recs = recommendations(state, hydrated ? Date.now() : 0);

  const startTopic = (domain: Parameters<typeof questionIdsFor>[0]) => {
    updateProgress((s) =>
      s.currentQuiz
        ? s
        : startQuiz(s, {
            id: newId("quiz"),
            mode: "domain",
            domain,
            questionIds: questionIdsFor(domain),
            startedAt: Date.now(),
          }),
    );
    void navigate({ to: "/practice" });
  };

  return (
    <Panel>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Based only on your saved answers, flashcards and tests.</p>
      <ul className="mt-4 space-y-3">
        {recs.map((rec) => (
          <li key={rec.id}>
            {rec.action.kind === "link" ? (
              <Link to={rec.action.to} className={rowClass}>
                <RowBody rec={rec} />
              </Link>
            ) : (
              <button
                type="button"
                className={rowClass}
                onClick={() => startTopic(rec.action.kind === "topic" ? rec.action.domain : undefined)}
              >
                <RowBody rec={rec} note={state.currentQuiz ? "Finish your current quiz first" : undefined} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
