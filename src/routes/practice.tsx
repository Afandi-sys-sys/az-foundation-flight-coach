import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles } from "lucide-react";
import { PageHeading } from "@/components/kit";
import { QuizRunner } from "@/components/QuizRunner";
import { DOMAINS, type DomainId } from "@/data/domains";
import { PRACTICE_QUESTIONS } from "@/data/questions";
import { pickAdaptive } from "@/lib/insights";
import { questionIdsFor, startQuiz } from "@/lib/progress-logic";
import { newId, updateProgress, useProgress } from "@/lib/progress-store";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Practice — CloudPrep Africa" },
      {
        name: "description",
        content: "Practise original AZ-900-style questions by learning area, or let smart practice pick what you need.",
      },
      { property: "og:title", content: "Practice — CloudPrep Africa" },
      { property: "og:description", content: "Original AZ-900-style practice with clear explanations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PracticePage,
});

function SetButton({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/60 active:scale-[0.99]"
    >
      <span className="flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
    </button>
  );
}

function PracticePage() {
  const state = useProgress();

  if (state.currentQuiz) return <QuizRunner key={state.currentQuiz.id} quiz={state.currentQuiz} />;

  const plan = pickAdaptive(state, 10, () => 0.5);

  const startSet = (domain?: DomainId) => {
    const ids = questionIdsFor(domain);
    updateProgress((s) =>
      startQuiz(s, {
        id: newId("quiz"),
        mode: domain ? "domain" : "all",
        domain,
        questionIds: ids,
        startedAt: Date.now(),
      }),
    );
  };

  const startAdaptive = () => {
    updateProgress((s) => {
      const pick = pickAdaptive(s, 10);
      return startQuiz(s, {
        id: newId("quiz"),
        mode: "adaptive",
        questionIds: pick.ids,
        reasons: pick.reasons,
        startedAt: Date.now(),
      });
    });
  };

  const missed = Object.values(state.answers).filter((a) => !a.correct).length;
  const fresh = PRACTICE_QUESTIONS.length - Object.keys(state.answers).length;

  return (
    <div>
      <PageHeading title="Choose a practice set">Practise everything, or focus on one learning area.</PageHeading>

      {!state.tests.pre ? (
        <Link
          to="/tests"
          className="mb-4 block rounded-2xl border border-warning/40 bg-warning-soft p-4 text-sm transition-colors hover:border-warning"
        >
          <span className="font-semibold text-warning">New here?</span> Take the short baseline test first so you can
          measure your improvement later.
        </Link>
      ) : null}

      <button
        type="button"
        onClick={startAdaptive}
        className="mb-6 w-full rounded-3xl border border-primary/50 bg-hero p-5 text-left shadow-glow transition-transform active:scale-[0.99]"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="size-5 text-accent" aria-hidden />
          <span className="font-display text-lg font-bold">Smart practice</span>
          <span className="ml-auto rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
            Recommended
          </span>
        </span>
        <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
          10 questions chosen from your answer history: questions you missed come first ({missed}), then ones you
          haven't tried ({fresh}), with your weakest learning area prioritised.
        </span>
        {plan.focus ? (
          <span className="mt-3 block text-sm">
            <span className="text-muted-foreground">Current focus: </span>
            <span className="font-semibold">{plan.focus.name}</span>
            <span className="text-muted-foreground">
              {" "}
              ({plan.focus.correct}/{plan.focus.total} mastered)
            </span>
          </span>
        ) : null}
        <span className="mt-3 block text-xs text-muted-foreground">
          Each question shows why it was picked. This helps you practise — it doesn't guarantee an exam result.
        </span>
      </button>

      <div className="space-y-3">
        <SetButton
          title="All learning areas"
          subtitle={`${PRACTICE_QUESTIONS.length} questions`}
          onClick={() => startSet()}
        />
        {DOMAINS.map((d) => (
          <SetButton
            key={d.id}
            title={d.name}
            subtitle={`${PRACTICE_QUESTIONS.filter((q) => q.domain === d.id).length} questions`}
            onClick={() => startSet(d.id)}
          />
        ))}
      </div>
    </div>
  );
}
