/**
 * Readiness estimate and adaptive question selection. Pure functions.
 * The readiness number is an unofficial learning indicator only.
 */
import { DOMAINS, type DomainId } from "@/data/domains";
import { PRACTICE_QUESTIONS, type Question } from "@/data/questions";
import { POST_TEST_MIN_PRACTICE, type ProgressState } from "./progress-logic";

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
    const correct = answered.filter((q) => state.answers[q.id]?.correct).length;
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
  const focus = answeredAny ? ([...stats].sort((a, b) => a.mastery - b.mastery)[0] ?? null) : null;
  return {
    ids: chosen.map((c) => c.q.id),
    reasons: Object.fromEntries(chosen.map((c) => [c.q.id, c.reason])),
    focus,
  };
}

// ---------------- Readiness dashboard ----------------

/** Different questions a topic needs before we judge it (or show a readiness estimate). */
export const MIN_TOPIC_QUESTIONS = 3;

/**
 * Accuracy across every recorded practice answer (retries included), so it
 * reflects real answer history. Null when nothing has been answered.
 */
export function practiceAccuracy(state: ProgressState): {
  attempts: number;
  correct: number;
  accuracy: number | null;
} {
  let attempts = 0;
  let correct = 0;
  for (const a of Object.values(state.answers)) {
    attempts += a.attempts;
    correct += a.correctCount;
  }
  return { attempts, correct, accuracy: attempts ? correct / attempts : null };
}

export type TopicStrength = "stronger" | "weaker" | "middle" | "even" | "not-enough-data";

export interface TopicPerformance {
  id: DomainId;
  name: string;
  /** Questions available in this topic. */
  total: number;
  /** Different questions answered at least once. */
  answered: number;
  attempts: number;
  correctAttempts: number;
  /** correctAttempts / attempts, 0..1, or null with no answers. */
  accuracy: number | null;
  enoughData: boolean;
  strength: TopicStrength;
}

/**
 * Per-topic accuracy from recorded answers. A topic is only called "stronger"
 * or "weaker" once it and at least one other topic have MIN_TOPIC_QUESTIONS
 * different questions answered, and their accuracy actually differs.
 */
export function topicPerformance(state: ProgressState, questions: Question[] = PRACTICE_QUESTIONS): TopicPerformance[] {
  const base = DOMAINS.map((d) => {
    const qs = questions.filter((q) => q.domain === d.id);
    let answered = 0;
    let attempts = 0;
    let correctAttempts = 0;
    for (const q of qs) {
      const a = state.answers[q.id];
      if (!a) continue;
      answered += 1;
      attempts += a.attempts;
      correctAttempts += a.correctCount;
    }
    return {
      id: d.id,
      name: d.name,
      total: qs.length,
      answered,
      attempts,
      correctAttempts,
      accuracy: attempts ? correctAttempts / attempts : null,
      enoughData: answered >= MIN_TOPIC_QUESTIONS,
    };
  });
  const judged = base.filter((t) => t.enoughData && t.accuracy !== null);
  const accs = judged.map((t) => t.accuracy as number);
  const max = Math.max(...accs);
  const min = Math.min(...accs);
  return base.map((t) => {
    let strength: TopicStrength = "not-enough-data";
    if (t.enoughData && judged.length >= 2) {
      const acc = t.accuracy as number;
      if (max === min) strength = "even";
      else if (acc === max) strength = "stronger";
      else if (acc === min) strength = "weaker";
      else strength = "middle";
    }
    return { ...t, strength };
  });
}

export interface ReadinessStatus {
  /** True once every topic has MIN_TOPIC_QUESTIONS different questions answered. */
  ready: boolean;
  /** Unofficial learning indicator 0–100, or null while there is not enough data. */
  score: number | null;
  /** Topics still short of data, with how many more questions each needs. */
  missing: { id: DomainId; name: string; needed: number }[];
}

export function readinessStatus(state: ProgressState, questions: Question[] = PRACTICE_QUESTIONS): ReadinessStatus {
  const missing = topicPerformance(state, questions)
    .filter((t) => !t.enoughData)
    .map((t) => ({ id: t.id, name: t.name, needed: MIN_TOPIC_QUESTIONS - t.answered }));
  const ready = missing.length === 0;
  return { ready, score: ready ? readinessEstimate(state, questions) : null, missing };
}

// ---------------- Personalised recommendations ----------------

export type RecommendationAction =
  | { kind: "link"; to: "/tests" | "/review" | "/practice" }
  | { kind: "topic"; domain: DomainId };

export interface Recommendation {
  id: "baseline" | "flashcards" | "weakest-topic" | "spread-topics" | "post-test" | "smart-practice";
  title: string;
  why: string;
  action: RecommendationAction;
}

const pct = (n: number) => Math.round(n * 100);

/**
 * Suggestions built only from the learner's own saved data. Each one carries a
 * short reason so the learner can see why it appears.
 */
export function recommendations(
  state: ProgressState,
  now: number,
  questions: Question[] = PRACTICE_QUESTIONS,
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (!state.tests.pre) {
    recs.push({
      id: "baseline",
      title: "Take the 9-question baseline test",
      why: "You haven't taken it yet. A starting score lets you measure your improvement later.",
      action: { kind: "link", to: "/tests" },
    });
  }

  const cards = Object.values(state.cards);
  const due = cards.filter((c) => c.due <= now).length;
  const needsRevision = cards.filter((c) => c.step === 0).length;
  if (due > 0) {
    recs.push({
      id: "flashcards",
      title: `Review ${due} missed-question ${due === 1 ? "flashcard" : "flashcards"}`,
      why:
        needsRevision > 0
          ? `${needsRevision} ${needsRevision === 1 ? "question you missed is" : "questions you missed are"} still marked “Needs revision”.`
          : `${due === 1 ? "A card you understood is" : "Cards you understood are"} due for a quick check.`,
      action: { kind: "link", to: "/review" },
    });
  }

  const topics = topicPerformance(state, questions);
  const weakest = topics.find((t) => t.strength === "weaker");
  const lacking = topics.filter((t) => !t.enoughData);
  if (weakest && weakest.accuracy !== null) {
    recs.push({
      id: "weakest-topic",
      title: `Practise ${weakest.name}`,
      why: `This is your weakest topic: ${pct(weakest.accuracy)}% accuracy (${weakest.correctAttempts} of ${weakest.attempts} answers correct).`,
      action: { kind: "topic", domain: weakest.id },
    });
  } else if (lacking.length > 0 && Object.keys(state.answers).length > 0) {
    const t = [...lacking].sort((a, b) => a.answered - b.answered)[0]!;
    const needed = MIN_TOPIC_QUESTIONS - t.answered;
    recs.push({
      id: "spread-topics",
      title: `Try ${t.name}`,
      why: `Answer ${needed} more ${needed === 1 ? "question" : "questions"} here so your topics can be compared fairly.`,
      action: { kind: "topic", domain: t.id },
    });
  }

  if (state.tests.pre && Object.keys(state.answers).length >= POST_TEST_MIN_PRACTICE) {
    const last = state.tests.post;
    const practisedSince = last ? state.history.some((h) => h.at > last.finishedAt) : true;
    if (!last || practisedSince) {
      recs.push({
        id: "post-test",
        title: last ? "Retake the post-test" : "Take the post-test",
        why: last
          ? "You've practised since your last post-test. See whether your score has changed."
          : `You've done the baseline test and ${POST_TEST_MIN_PRACTICE}+ practice questions, so a comparison is now meaningful.`,
        action: { kind: "link", to: "/tests" },
      });
    }
  }

  const practised = Object.keys(state.answers).length;
  if (state.tests.pre && practised < POST_TEST_MIN_PRACTICE) {
    const left = POST_TEST_MIN_PRACTICE - practised;
    recs.push({
      id: "post-test",
      title: "Work towards your post-test",
      why: `It unlocks after ${POST_TEST_MIN_PRACTICE} different practice questions. ${left} to go (${practised}/${POST_TEST_MIN_PRACTICE}).`,
      action: { kind: "link", to: "/practice" },
    });
  }

  if (!recs.some((r) => r.id === "weakest-topic" || r.id === "spread-topics")) {
    recs.push({
      id: "smart-practice",
      title: "Smart practice",
      why:
        Object.keys(state.answers).length === 0
          ? "A good first step: 10 questions from all three topics."
          : "10 questions picked from your answer history, with missed questions first.",
      action: { kind: "link", to: "/practice" },
    });
  }

  return recs;
}
