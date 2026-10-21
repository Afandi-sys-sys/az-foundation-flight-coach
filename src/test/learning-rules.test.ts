import { describe, expect, it } from "vitest";
import { PRACTICE_QUESTIONS, QUESTION_BY_ID } from "@/data/questions";
import { PRE_TEST, POST_TEST } from "@/data/tests";
import {
  answerQuestion,
  answerTestQuestion,
  canTakePostTest,
  DAY_MS,
  emptyState,
  finishQuiz,
  finishTest,
  goToNextQuestion,
  POST_TEST_MIN_PRACTICE,
  reviewCard,
  sanitizeState,
  startQuiz,
  startTest,
  type ProgressState,
} from "@/lib/progress-logic";
import { pickAdaptive, readinessEstimate, REASONS } from "@/lib/insights";

const NOW = 1_800_000_000_000;
const wrongOption = (qid: string) => (QUESTION_BY_ID[qid].answer + 1) % 4;

function withQuiz(ids: string[], id = "quiz-1"): ProgressState {
  return startQuiz(emptyState(), { id, mode: "all", questionIds: ids, startedAt: NOW });
}

describe("answer recording", () => {
  it("records the same answer only once, even if submitted twice", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    let s = withQuiz([qid]);
    s = answerQuestion(s, "quiz-1", qid, 0, NOW);
    const again = answerQuestion(s, "quiz-1", qid, 1, NOW + 1);
    expect(again).toBe(s);
    expect(s.history).toHaveLength(1);
    expect(s.answers[qid].attempts).toBe(1);
  });

  it("finishing the same quiz twice saves one result", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    let s = answerQuestion(withQuiz([qid]), "quiz-1", qid, 0, NOW);
    s = finishQuiz(s, NOW);
    s = finishQuiz({ ...s, currentQuiz: withQuiz([qid]).currentQuiz }, NOW);
    expect(s.sessions).toHaveLength(1);
  });

  it("cannot skip ahead without answering", () => {
    const ids = PRACTICE_QUESTIONS.slice(0, 2).map((q) => q.id);
    const s = withQuiz(ids);
    expect(goToNextQuestion(s)).toBe(s);
  });

  it("survives a save and reload through JSON", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    const s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    const restored = sanitizeState(JSON.parse(JSON.stringify(s)));
    expect(restored.answers[qid].correct).toBe(false);
    expect(restored.cards[qid]).toBeDefined();
    expect(restored.currentQuiz?.responses[qid]).toBe(wrongOption(qid));
  });
});

describe("missed-question flashcards", () => {
  it("adds a card when a practice question is answered incorrectly", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    const s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    expect(s.cards[qid].due).toBe(NOW);
  });

  it("does not add a card for a correct answer", () => {
    const q = PRACTICE_QUESTIONS[0];
    const s = answerQuestion(withQuiz([q.id]), "quiz-1", q.id, q.answer, NOW);
    expect(s.cards[q.id]).toBeUndefined();
  });

  it("'Got it' schedules reviews 1, 2, 4, 8 and 16 days apart", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    let s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    const gaps: number[] = [];
    let t = NOW;
    for (let i = 0; i < 5; i++) {
      s = reviewCard(s, qid, "good", t);
      gaps.push((s.cards[qid].due - t) / DAY_MS);
      t = s.cards[qid].due;
    }
    expect(gaps).toEqual([1, 2, 4, 8, 16]);
  });

  it("'Again' sends the card back to the start and makes it due now", () => {
    const qid = PRACTICE_QUESTIONS[0].id;
    let s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    s = reviewCard(s, qid, "good", NOW);
    s = reviewCard(s, qid, "again", NOW + DAY_MS);
    expect(s.cards[qid].step).toBe(0);
    expect(s.cards[qid].due).toBe(NOW + DAY_MS);
  });
});

describe("readiness estimate", () => {
  it("is 0 with no answers and 100 when every practice question is correct", () => {
    expect(readinessEstimate(emptyState())).toBe(0);
    const ids = PRACTICE_QUESTIONS.map((q) => q.id);
    let s = withQuiz(ids);
    for (const q of PRACTICE_QUESTIONS) s = answerQuestion(s, "quiz-1", q.id, q.answer, NOW);
    expect(readinessEstimate(s)).toBe(100);
  });
});

describe("adaptive practice", () => {
  it("puts missed questions first, then questions not tried yet", () => {
    const [a, b] = PRACTICE_QUESTIONS;
    let s = withQuiz([a.id, b.id]);
    s = answerQuestion(s, "quiz-1", a.id, wrongOption(a.id), NOW);
    s = answerQuestion(s, "quiz-1", b.id, b.answer, NOW);
    const pick = pickAdaptive(s, 10, () => 0);
    expect(pick.ids[0]).toBe(a.id);
    expect(pick.reasons[a.id]).toBe(REASONS.missed);
    expect(pick.reasons[pick.ids[1]]).toBe(REASONS.fresh);
    expect(pick.ids).not.toContain(b.id);
  });
});

describe("pre-test and post-test", () => {
  it("uses different questions for the two tests, 9 each", () => {
    expect(PRE_TEST).toHaveLength(9);
    expect(POST_TEST).toHaveLength(9);
    const pre = new Set(PRE_TEST.map((q) => q.id));
    expect(POST_TEST.some((q) => pre.has(q.id))).toBe(false);
  });

  it(`post-test unlocks only after the pre-test and ${POST_TEST_MIN_PRACTICE} practice questions`, () => {
    let s = startTest(emptyState(), "pre", "pre-1", NOW);
    for (const q of PRE_TEST) s = answerTestQuestion(s, "pre-1", q.id, q.answer);
    s = finishTest(s, NOW);
    expect(s.tests.pre?.correct).toBe(9);
    expect(canTakePostTest(s)).toBe(false);

    const ids = PRACTICE_QUESTIONS.slice(0, POST_TEST_MIN_PRACTICE - 1).map((q) => q.id);
    let p = startQuiz(s, { id: "q", mode: "all", questionIds: ids, startedAt: NOW });
    for (const id of ids) p = answerQuestion(p, "q", id, 0, NOW);
    expect(canTakePostTest(p)).toBe(false);

    const one = PRACTICE_QUESTIONS[POST_TEST_MIN_PRACTICE - 1].id;
    p = startQuiz(p, { id: "q2", mode: "all", questionIds: [one], startedAt: NOW });
    p = answerQuestion(p, "q2", one, 0, NOW);
    expect(canTakePostTest(p)).toBe(true);
  });

  it("the pre-test can only be taken once", () => {
    let s = startTest(emptyState(), "pre", "pre-1", NOW);
    for (const q of PRE_TEST) s = answerTestQuestion(s, "pre-1", q.id, q.answer);
    s = finishTest(s, NOW);
    expect(startTest(s, "pre", "pre-2", NOW)).toBe(s);
  });
});
