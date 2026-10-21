/**
 * Readiness estimate and adaptive question selection. Pure functions.
 * The readiness number is an unofficial learning indicator only.
 */
import { DOMAINS, type DomainId } from "@/data/domains";
import { PRACTICE_QUESTIONS, type Question } from "@/data/questions";
import type { ProgressState } from "./progress-logic";

export interface DomainStats {
  id: DomainId;
  name: string;
  total: number;
  answered: number;
  /** Questions whose most recent answer was correct. */
  correct: number;
  /** correct / total, 0..1 — rewards both coverage and accuracy. */
  mastery: number;
  /** correct / answered, 0..1, or null when nothing answered yet. */
  accuracy: number | null;
}

export function domainStats(state: ProgressState, questions: Question[] = PRACTICE_QUESTIONS): DomainStats[] {
  return DOMAINS.map((d) => {
    const qs = questions.filter((q) => q.domain === d.id);
    const answered = qs.filter((q) => state.answers[q.id]);
    const correct = answered.filter((q) => state.answers[q.id].correct).length;
    return {
      id: d.id,
      name: d.name,
      total: qs.length,
      answered: answered.length,
      correct,
      mastery: qs.length ? correct / qs.length : 0,
      accuracy: answered.length ? correct / answered.length : null,
    };
  });
}

/**
 * Readiness = each learning area's mastery (latest answers correct ÷ questions in
 * that area), weighted by the area's approximate share of the public skills outline.
 * Returns 0–100.
 */
export function readinessEstimate(state: ProgressState, questions: Question[] = PRACTICE_QUESTIONS): number {
  const stats = domainStats(state, questions);
  const totalWeight = DOMAINS.reduce((s, d) => s + d.weight, 0);
  const score = stats.reduce((sum, s) => {
    const w = DOMAINS.find((d) => d.id === s.id)!.weight / totalWeight;
    return sum + w * s.mastery;
  }, 0);
  return Math.round(score * 100);
}

export function readinessBand(score: number): { label: string; tone: "low" | "mid" | "high" } {
  if (score < 40) return { label: "Getting started", tone: "low" };
  if (score < 70) return { label: "Building confidence", tone: "mid" };
  return { label: "Strong practice record", tone: "high" };
}

export interface AdaptivePick {
  ids: string[];
  reasons: Record<string, string>;
  focus: DomainStats | null;
}

export const REASONS = {
  missed: "You missed this last time",
  fresh: "New to you",
  recovering: "You got it right after missing it — checking it stuck",
  refresher: "Quick refresher",
} as const;

/**
 * Picks questions where the learner most needs practice:
 *  1. questions answered wrong most recently,
 *  2. questions not tried yet,
 *  3. questions recovered after a miss,
 *  4. everything else as a refresher.
 * Within a group, questions from weaker learning areas come first.
 */
export function pickAdaptive(
  state: ProgressState,
  count = 10,
  random: () => number = Math.random,
  questions: Question[] = PRACTICE_QUESTIONS,
): AdaptivePick {
  const stats = domainStats(state, questions);
  const weakness = Object.fromEntries(stats.map((s) => [s.id, 1 - s.mastery])) as Record<DomainId, number>;
  const scored = questions.map((q) => {
    const a = state.answers[q.id];
    let base: number;
    let reason: string;
    if (a && !a.correct) {
      base = 300;
      reason = REASONS.missed;
    } else if (!a) {
      base = 200;
      reason = REASONS.fresh;
    } else if (a.attempts > a.correctCount) {
      base = 100;
      reason = REASONS.recovering;
    } else {
      base = 0;
      reason = REASONS.refresher;
    }
    return { q, reason, score: base + weakness[q.domain] * 50 + random() * 10 };
  });
  scored.sort((x, y) => y.score - x.score);
  const chosen = scored.slice(0, Math.min(count, scored.length));
  const answeredAny = stats.some((s) => s.answered > 0);
  const focus = answeredAny ? [...stats].sort((a, b) => a.mastery - b.mastery)[0] : null;
  return {
    ids: chosen.map((c) => c.q.id),
    reasons: Object.fromEntries(chosen.map((c) => [c.q.id, c.reason])),
    focus,
  };
}
