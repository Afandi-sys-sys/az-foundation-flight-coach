/**
 * Pure state logic for CloudPrep Africa. No browser APIs here, so every rule
 * can be unit-tested. The localStorage wrapper lives in progress-store.ts.
 */
import type { DomainId } from "@/data/domains";
import { DOMAINS } from "@/data/domains";
import { PRACTICE_QUESTIONS, question, QUESTION_BY_ID } from "@/data/questions";
import { POST_TEST, PRE_TEST, TEST_QUESTION_BY_ID, testQuestion } from "@/data/tests";

export const STORAGE_KEY = "cloudprep-africa-progress";
export const STATE_VERSION = 2;
export const DAY_MS = 24 * 60 * 60 * 1000;
/** Review intervals for flashcards, in days. */
export const REVIEW_INTERVAL_DAYS = [1, 2, 4, 8, 16] as const;
/** Distinct practice questions a learner must answer before the post-test unlocks. */
export const POST_TEST_MIN_PRACTICE = 20;
const MAX_HISTORY = 2000;
const MAX_SESSIONS = 100;

export type QuizMode = "all" | "domain" | "adaptive";
export type TestKind = "pre" | "post";

export interface AnswerRecord {
  selected: number;
  correct: boolean;
  at: number;
  attempts: number;
  correctCount: number;
}

export interface HistoryEvent {
  /** `${quizId}:${questionId}` — unique, so the same answer is never counted twice. */
  id: string;
  qid: string;
  correct: boolean;
  at: number;
}

export interface CurrentQuiz {
  id: string;
  mode: QuizMode;
  domain?: DomainId | undefined;
  questionIds: string[];
  index: number;
  responses: Record<string, number>;
  reasons?: Record<string, string> | undefined;
  startedAt: number;
}

export interface Session {
  id: string;
  mode: QuizMode;
  domain?: DomainId | undefined;
  questionIds: string[];
  responses: Record<string, number>;
  correct: number;
  total: number;
  startedAt: number;
  finishedAt: number;
}

export interface Card {
  qid: string;
  /** 0 = new/again. Each "Got it" moves the card up one step. */
  step: number;
  due: number;
  addedAt: number;
  lastReviewed?: number;
  reviews: number;
  lapses: number;
}

export interface TestResult {
  id: string;
  kind: TestKind;
  questionIds: string[];
  responses: Record<string, number>;
  correct: number;
  total: number;
  byDomain: Record<DomainId, { correct: number; total: number }>;
  finishedAt: number;
}

export interface CurrentTest {
  id: string;
  kind: TestKind;
  questionIds: string[];
  index: number;
  responses: Record<string, number>;
  startedAt: number;
}

export interface ProgressState {
  version: typeof STATE_VERSION;
  answers: Record<string, AnswerRecord>;
  history: HistoryEvent[];
  sessions: Session[];
  currentQuiz: CurrentQuiz | null;
  cards: Record<string, Card>;
  tests: { pre?: TestResult | undefined; post?: TestResult | undefined; postHistory: TestResult[] };
  currentTest: CurrentTest | null;
}

export function emptyState(): ProgressState {
  return {
    version: STATE_VERSION,
    answers: {},
    history: [],
    sessions: [],
    currentQuiz: null,
    cards: {},
    tests: { postHistory: [] },
    currentTest: null,
  };
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

type RawState = {
  version?: unknown;
  answers?: unknown;
  history?: unknown;
  sessions?: unknown;
  currentQuiz?: unknown;
  cards?: unknown;
  tests?: unknown;
  currentTest?: unknown;
};

/** Accepts anything read from storage and returns a safe, valid state. */
export function sanitizeState(input: unknown): ProgressState {
  const base = emptyState();
  if (!isObj(input)) return base;
  const raw = input as RawState;
  if (raw.version !== STATE_VERSION) return base;
  const answers: Record<string, AnswerRecord> = {};
  if (isObj(raw.answers)) {
    for (const [qid, a] of Object.entries(raw.answers)) {
      if (QUESTION_BY_ID[qid] && isObj(a) && typeof a["selected"] === "number") {
        answers[qid] = a as unknown as AnswerRecord;
      }
    }
  }
  const cards: Record<string, Card> = {};
  if (isObj(raw.cards)) {
    for (const [qid, c] of Object.entries(raw.cards)) {
      if (QUESTION_BY_ID[qid] && isObj(c) && typeof c["due"] === "number") {
        cards[qid] = c as unknown as Card;
      }
    }
  }
  const validRun = (v: unknown, known: Record<string, unknown>): boolean => {
    if (!isObj(v)) return false;
    const ids = v["questionIds"];
    return (
      Array.isArray(ids) &&
      ids.length > 0 &&
      ids.every((id) => typeof id === "string" && !!known[id]) &&
      typeof v["index"] === "number" &&
      isObj(v["responses"])
    );
  };
  const tests = (isObj(raw.tests) ? raw.tests : {}) as { pre?: unknown; post?: unknown; postHistory?: unknown };
  return {
    version: STATE_VERSION,
    answers,
    history: Array.isArray(raw.history) ? (raw.history as HistoryEvent[]) : [],
    sessions: Array.isArray(raw.sessions) ? (raw.sessions as Session[]) : [],
    currentQuiz: validRun(raw.currentQuiz, QUESTION_BY_ID) ? (raw.currentQuiz as CurrentQuiz) : null,
    cards,
    tests: {
      pre: isObj(tests.pre) ? (tests.pre as unknown as TestResult) : undefined,
      post: isObj(tests.post) ? (tests.post as unknown as TestResult) : undefined,
      postHistory: Array.isArray(tests.postHistory) ? (tests.postHistory as TestResult[]) : [],
    },
    currentTest: validRun(raw.currentTest, TEST_QUESTION_BY_ID) ? (raw.currentTest as CurrentTest) : null,
  };
}

// ---------------- Practice quizzes ----------------

/** Question ids for a practice set: one learning area, or all of them. */
export function questionIdsFor(domain?: DomainId): string[] {
  return PRACTICE_QUESTIONS.filter((q) => !domain || q.domain === domain).map((q) => q.id);
}

export function startQuiz(
  state: ProgressState,
  quiz: Omit<CurrentQuiz, "index" | "responses">,
): ProgressState {
  return { ...state, currentQuiz: { ...quiz, index: 0, responses: {} } };
}

/**
 * Records one answer. Ignored (state returned unchanged) when the quiz is not
 * the active one or this question was already answered in this quiz, so
 * double taps and page refreshes can never record the same answer twice.
 */
export function answerQuestion(
  state: ProgressState,
  quizId: string,
  qid: string,
  selected: number,
  now: number,
): ProgressState {
  const quiz = state.currentQuiz;
  const q = QUESTION_BY_ID[qid];
  if (!quiz || quiz.id !== quizId || !q || !quiz.questionIds.includes(qid)) return state;
  if (qid in quiz.responses) return state;
  const eventId = `${quizId}:${qid}`;
  if (state.history.some((h) => h.id === eventId)) return state;

  const correct = selected === q.answer;
  const prev = state.answers[qid];
  const answers = {
    ...state.answers,
    [qid]: {
      selected,
      correct,
      at: now,
      attempts: (prev?.attempts ?? 0) + 1,
      correctCount: (prev?.correctCount ?? 0) + (correct ? 1 : 0),
    },
  };

  let cards = state.cards;
  if (!correct) {
    const existing = state.cards[qid];
    cards = {
      ...state.cards,
      [qid]: existing
        ? { ...existing, step: 0, due: now, lapses: existing.lapses + 1 }
        : { qid, step: 0, due: now, addedAt: now, reviews: 0, lapses: 0 },
    };
  }

  const history = [...state.history, { id: eventId, qid, correct, at: now }].slice(-MAX_HISTORY);

  return {
    ...state,
    answers,
    history,
    cards,
    currentQuiz: { ...quiz, responses: { ...quiz.responses, [qid]: selected } },
  };
}

export function goToNextQuestion(state: ProgressState): ProgressState {
  const quiz = state.currentQuiz;
  if (!quiz) return state;
  const current = quiz.questionIds[quiz.index];
  if (current === undefined || !(current in quiz.responses)) return state;
  if (quiz.index >= quiz.questionIds.length - 1) return state;
  return { ...state, currentQuiz: { ...quiz, index: quiz.index + 1 } };
}

export function finishQuiz(state: ProgressState, now: number): ProgressState {
  const quiz = state.currentQuiz;
  if (!quiz) return state;
  if (state.sessions.some((s) => s.id === quiz.id)) return { ...state, currentQuiz: null };
  const answeredIds = quiz.questionIds.filter((id) => id in quiz.responses);
  if (answeredIds.length === 0) return { ...state, currentQuiz: null };
  const correct = answeredIds.filter((id) => quiz.responses[id] === question(id).answer).length;
  const session: Session = {
    id: quiz.id,
    mode: quiz.mode,
    domain: quiz.domain,
    questionIds: answeredIds,
    responses: quiz.responses,
    correct,
    total: answeredIds.length,
    startedAt: quiz.startedAt,
    finishedAt: now,
  };
  return {
    ...state,
    currentQuiz: null,
    sessions: [...state.sessions, session].slice(-MAX_SESSIONS),
  };
}

export function abandonQuiz(state: ProgressState): ProgressState {
  return { ...state, currentQuiz: null };
}

// ---------------- Flashcards ----------------

export type ReviewGrade = "again" | "good";

/** Days until the next review after pressing "Got it" on a card at `step`. */
export function intervalForStep(step: number): number {
  const i = Math.min(Math.max(step, 0), REVIEW_INTERVAL_DAYS.length - 1);
  return REVIEW_INTERVAL_DAYS[i] ?? 16;
}

export function reviewCard(
  state: ProgressState,
  qid: string,
  grade: ReviewGrade,
  now: number,
): ProgressState {
  const card = state.cards[qid];
  if (!card) return state;
  const next: Card =
    grade === "good"
      ? {
          ...card,
          step: Math.min(card.step + 1, REVIEW_INTERVAL_DAYS.length),
          due: now + intervalForStep(card.step) * DAY_MS,
          lastReviewed: now,
          reviews: card.reviews + 1,
        }
      : { ...card, step: 0, due: now, lastReviewed: now, reviews: card.reviews + 1, lapses: card.lapses + 1 };
  return { ...state, cards: { ...state.cards, [qid]: next } };
}

export function dueCards(state: ProgressState, now: number): Card[] {
  return Object.values(state.cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due);
}

export type CardStatus = "needs-revision" | "understood";

/**
 * A card needs revision when it is new, was marked "Again", or the question
 * was missed again in practice (all of these reset step to 0). Each "Got it"
 * moves it up a step, so any step above 0 means "understood for now".
 */
export function cardStatus(card: Card): CardStatus {
  return card.step > 0 ? "understood" : "needs-revision";
}

export function flashcardSummary(state: ProgressState): {
  total: number;
  needsRevision: number;
  understood: number;
} {
  const cards = Object.values(state.cards);
  const understood = cards.filter((c) => cardStatus(c) === "understood").length;
  return { total: cards.length, needsRevision: cards.length - understood, understood };
}

// ---------------- Pre-test / post-test ----------------

export function testQuestions(kind: TestKind) {
  return kind === "pre" ? PRE_TEST : POST_TEST;
}

export function distinctPracticeAnswered(state: ProgressState): number {
  return Object.keys(state.answers).length;
}

export function canTakePostTest(state: ProgressState): boolean {
  return !!state.tests.pre && distinctPracticeAnswered(state) >= POST_TEST_MIN_PRACTICE;
}

export function startTest(state: ProgressState, kind: TestKind, id: string, now: number): ProgressState {
  if (kind === "pre" && state.tests.pre) return state;
  if (kind === "post" && !canTakePostTest(state)) return state;
  return {
    ...state,
    currentTest: {
      id,
      kind,
      questionIds: testQuestions(kind).map((q) => q.id),
      index: 0,
      responses: {},
      startedAt: now,
    },
  };
}

export function answerTestQuestion(
  state: ProgressState,
  testId: string,
  qid: string,
  selected: number,
): ProgressState {
  const t = state.currentTest;
  if (!t || t.id !== testId || !t.questionIds.includes(qid) || qid in t.responses) return state;
  const index = Math.min(t.index + 1, t.questionIds.length - 1);
  return { ...state, currentTest: { ...t, responses: { ...t.responses, [qid]: selected }, index } };
}

export function finishTest(state: ProgressState, now: number): ProgressState {
  const t = state.currentTest;
  if (!t) return state;
  if (t.questionIds.some((id) => !(id in t.responses))) return state;
  const byDomain = Object.fromEntries(DOMAINS.map((d) => [d.id, { correct: 0, total: 0 }])) as TestResult["byDomain"];
  let correct = 0;
  for (const id of t.questionIds) {
    const q = testQuestion(id);
    const ok = t.responses[id] === q.answer;
    byDomain[q.domain].total += 1;
    if (ok) {
      byDomain[q.domain].correct += 1;
      correct += 1;
    }
  }
  const result: TestResult = {
    id: t.id,
    kind: t.kind,
    questionIds: t.questionIds,
    responses: t.responses,
    correct,
    total: t.questionIds.length,
    byDomain,
    finishedAt: now,
  };
  const tests =
    t.kind === "pre"
      ? { ...state.tests, pre: state.tests.pre ?? result }
      : {
          ...state.tests,
          post: result,
          postHistory: state.tests.postHistory.some((r) => r.id === result.id)
            ? state.tests.postHistory
            : [...state.tests.postHistory, result],
        };
  return { ...state, tests, currentTest: null };
}

export function abandonTest(state: ProgressState): ProgressState {
  return { ...state, currentTest: null };
}

/** Every completed test, oldest first: the baseline plus all post-test attempts. Nothing is ever dropped. */
export function testHistory(state: ProgressState): TestResult[] {
  const all = [...(state.tests.pre ? [state.tests.pre] : []), ...state.tests.postHistory];
  if (state.tests.post && !all.some((r) => r.id === state.tests.post?.id)) all.push(state.tests.post);
  return all.sort((a, b) => a.finishedAt - b.finishedAt);
}

/** Baseline vs latest post-test, in percentage points. Null until both exist. */
export function testComparison(
  state: ProgressState,
): { pre: TestResult; post: TestResult; prePct: number; postPct: number; change: number } | null {
  const { pre, post } = state.tests;
  if (!pre || !post) return null;
  const prePct = percent(pre.correct, pre.total);
  const postPct = percent(post.correct, post.total);
  return { pre, post, prePct, postPct, change: postPct - prePct };
}

export function percent(correct: number, total: number): number {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

export { PRACTICE_QUESTIONS };
