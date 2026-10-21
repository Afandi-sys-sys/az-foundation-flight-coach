import { describe, expect, it } from "vitest";
import { PRACTICE_QUESTIONS, question } from "@/data/questions";
import { PRE_TEST, POST_TEST } from "@/data/tests";
import {
  answerQuestion,
  answerTestQuestion,
  canTakePostTest,
  cardStatus,
  DAY_MS,
  emptyState,
  flashcardSummary,
  finishQuiz,
  finishTest,
  goToNextQuestion,
  POST_TEST_MIN_PRACTICE,
  reviewCard,
  sanitizeState,
  startQuiz,
  startTest,
  testComparison,
  testHistory,
  type ProgressState,
} from "@/lib/progress-logic";
import {
  pickAdaptive,
  practiceAccuracy,
  readinessEstimate,
  readinessStatus,
  REASONS,
  recommendations,
  topicPerformance,
} from "@/lib/insights";

const NOW = 1_800_000_000_000;
const wrongOption = (qid: string) => (question(qid).answer + 1) % 4;
const Q = (i: number) => {
  const q = PRACTICE_QUESTIONS[i];
  if (!q) throw new Error("missing question");
  return q;
};

function withQuiz(ids: string[], id = "quiz-1"): ProgressState {
  return startQuiz(emptyState(), { id, mode: "all", questionIds: ids, startedAt: NOW });
}

describe("answer recording", () => {
  it("records the same answer only once, even if submitted twice", () => {
    const qid = Q(0).id;
    let s = withQuiz([qid]);
    s = answerQuestion(s, "quiz-1", qid, 0, NOW);
    const again = answerQuestion(s, "quiz-1", qid, 1, NOW + 1);
    expect(again).toBe(s);
    expect(s.history).toHaveLength(1);
    expect(s.answers[qid]?.attempts).toBe(1);
  });

  it("finishing the same quiz twice saves one result", () => {
    const qid = Q(0).id;
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
    const qid = Q(0).id;
    const s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    const restored = sanitizeState(JSON.parse(JSON.stringify(s)));
    expect(restored.answers[qid]?.correct).toBe(false);
    expect(restored.cards[qid]).toBeDefined();
    expect(restored.currentQuiz?.responses[qid]).toBe(wrongOption(qid));
  });
});

describe("answer feedback content", () => {
  it("every practice question explains the right answer, gives an example, and explains each wrong option", () => {
    for (const q of PRACTICE_QUESTIONS) {
      expect(q.explanation.trim().length, q.id).toBeGreaterThan(0);
      expect(q.example.trim().length, q.id).toBeGreaterThan(0);
      q.options.forEach((_, i) => {
        if (i !== q.answer) expect(q.wrong?.[i]?.trim().length ?? 0, `${q.id} option ${i}`).toBeGreaterThan(0);
      });
      expect(q.wrong?.[q.answer], q.id).toBeUndefined();
    }
  });
});

describe("missed-question flashcards", () => {
  it("adds a card when a practice question is answered incorrectly", () => {
    const qid = Q(0).id;
    const s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    expect(s.cards[qid]?.due).toBe(NOW);
  });

  it("does not add a card for a correct answer", () => {
    const q = Q(0);
    const s = answerQuestion(withQuiz([q.id]), "quiz-1", q.id, q.answer, NOW);
    expect(s.cards[q.id]).toBeUndefined();
  });

  it("'Got it' schedules reviews 1, 2, 4, 8 and 16 days apart", () => {
    const qid = Q(0).id;
    let s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    const gaps: number[] = [];
    let t = NOW;
    for (let i = 0; i < 5; i++) {
      s = reviewCard(s, qid, "good", t);
      const due = s.cards[qid]?.due ?? 0;
      gaps.push((due - t) / DAY_MS);
      t = due;
    }
    expect(gaps).toEqual([1, 2, 4, 8, 16]);
  });

  it("'Again' sends the card back to the start and makes it due now", () => {
    const qid = Q(0).id;
    let s = answerQuestion(withQuiz([qid]), "quiz-1", qid, wrongOption(qid), NOW);
    s = reviewCard(s, qid, "good", NOW);
    s = reviewCard(s, qid, "again", NOW + DAY_MS);
    expect(s.cards[qid]?.step).toBe(0);
    expect(s.cards[qid]?.due).toBe(NOW + DAY_MS);
  });

  it("missing the same question in two quizzes keeps one card and marks it for revision again", () => {
    const qid = Q(0).id;
    let s = answerQuestion(withQuiz([qid], "quiz-1"), "quiz-1", qid, wrongOption(qid), NOW);
    s = reviewCard(s, qid, "good", NOW);
    expect(cardStatus(s.cards[qid]!)).toBe("understood");
    s = startQuiz(s, { id: "quiz-2", mode: "all", questionIds: [qid], startedAt: NOW + DAY_MS });
    s = answerQuestion(s, "quiz-2", qid, wrongOption(qid), NOW + DAY_MS);
    expect(Object.keys(s.cards)).toEqual([qid]);
    expect(s.cards[qid]?.lapses).toBe(1);
    expect(s.cards[qid]?.addedAt).toBe(NOW);
    expect(cardStatus(s.cards[qid]!)).toBe("needs-revision");
  });

  it("counts saved, needs-revision and understood cards", () => {
    const [a, b, c] = [Q(0).id, Q(1).id, Q(2).id];
    let s = withQuiz([a, b, c]);
    for (const id of [a, b, c]) s = answerQuestion(s, "quiz-1", id, wrongOption(id), NOW);
    expect(flashcardSummary(s)).toEqual({ total: 3, needsRevision: 3, understood: 0 });
    s = reviewCard(s, a, "good", NOW);
    s = reviewCard(s, b, "again", NOW);
    expect(flashcardSummary(s)).toEqual({ total: 3, needsRevision: 2, understood: 1 });
  });

  it("adding flashcards keeps existing quiz answers and results", () => {
    const [right, wrong] = [Q(0), Q(1)];
    let s = withQuiz([right.id, wrong.id]);
    s = answerQuestion(s, "quiz-1", right.id, right.answer, NOW);
    s = answerQuestion(s, "quiz-1", wrong.id, wrongOption(wrong.id), NOW);
    s = finishQuiz(s, NOW);
    s = reviewCard(s, wrong.id, "good", NOW);
    expect(s.answers[right.id]?.correct).toBe(true);
    expect(s.sessions).toHaveLength(1);
    expect(s.sessions[0]?.correct).toBe(1);
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
    const a = Q(0);
    const b = Q(1);
    let s = withQuiz([a.id, b.id]);
    s = answerQuestion(s, "quiz-1", a.id, wrongOption(a.id), NOW);
    s = answerQuestion(s, "quiz-1", b.id, b.answer, NOW);
    const pick = pickAdaptive(s, 10, () => 0);
    expect(pick.ids[0]).toBe(a.id);
    expect(pick.reasons[a.id]).toBe(REASONS.missed);
    expect(pick.reasons[pick.ids[1] ?? ""]).toBe(REASONS.fresh);
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

    const one = Q(POST_TEST_MIN_PRACTICE - 1).id;
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

// ---------------- Readiness dashboard, test history, recommendations ----------------

const byDomain = (d: string) => PRACTICE_QUESTIONS.filter((q) => q.domain === d);

/** Answers each [question, correct?] pair in one new quiz. */
function answerSet(state: ProgressState, quizId: string, items: [string, boolean][], at = NOW): ProgressState {
  let s = startQuiz(state, { id: quizId, mode: "all", questionIds: items.map(([id]) => id), startedAt: at });
  for (const [id, ok] of items) s = answerQuestion(s, quizId, id, ok ? question(id).answer : wrongOption(id), at);
  return finishQuiz(s, at);
}

function takeTest(state: ProgressState, kind: "pre" | "post", id: string, correctCount: number, at: number) {
  let s = startTest(state, kind, id, at);
  const qs = kind === "pre" ? PRE_TEST : POST_TEST;
  qs.forEach((q, i) => {
    s = answerTestQuestion(s, id, q.id, i < correctCount ? q.answer : (q.answer + 1) % 4);
  });
  return finishTest(s, at);
}

describe("readiness dashboard", () => {
  it("overall accuracy counts every recorded answer, including retries", () => {
    expect(practiceAccuracy(emptyState()).accuracy).toBeNull();
    const [a, b] = [Q(0).id, Q(1).id];
    let s = answerSet(emptyState(), "q1", [[a, false], [b, true]]);
    s = answerSet(s, "q2", [[a, true]]);
    expect(practiceAccuracy(s)).toEqual({ attempts: 3, correct: 2, accuracy: 2 / 3 });
  });

  it("shows no readiness score and no stronger/weaker topics until each topic has 3 answers", () => {
    const cloud = byDomain("cloud").slice(0, 3).map((q) => [q.id, true] as [string, boolean]);
    const arch = byDomain("architecture").slice(0, 2).map((q) => [q.id, false] as [string, boolean]);
    const s = answerSet(emptyState(), "q1", [...cloud, ...arch]);
    const status = readinessStatus(s);
    expect(status.ready).toBe(false);
    expect(status.score).toBeNull();
    expect(status.missing.map((m) => [m.id, m.needed])).toEqual([
      ["architecture", 1],
      ["governance", 3],
    ]);
    expect(topicPerformance(s).map((t) => t.strength)).toEqual(["not-enough-data", "not-enough-data", "not-enough-data"]);
  });

  it("labels the stronger and weaker topics from actual answers", () => {
    const items: [string, boolean][] = [
      ...byDomain("cloud").slice(0, 3).map((q) => [q.id, true] as [string, boolean]),
      ...byDomain("architecture").slice(0, 3).map((q) => [q.id, false] as [string, boolean]),
      ...byDomain("governance").slice(0, 3).map((q, i) => [q.id, i < 2] as [string, boolean]),
    ];
    const s = answerSet(emptyState(), "q1", items);
    const t = topicPerformance(s);
    expect(t.map((x) => x.strength)).toEqual(["stronger", "weaker", "middle"]);
    expect(t.map((x) => x.accuracy)).toEqual([1, 0, 2 / 3]);
    expect(readinessStatus(s).ready).toBe(true);
    expect(readinessStatus(s).score).toBe(readinessEstimate(s));
  });
});

describe("recommendations", () => {
  it("recommends the baseline test, missed flashcards and the weakest topic, each with a reason", () => {
    const items: [string, boolean][] = [
      ...byDomain("cloud").slice(0, 3).map((q) => [q.id, true] as [string, boolean]),
      ...byDomain("architecture").slice(0, 3).map((q) => [q.id, false] as [string, boolean]),
      ...byDomain("governance").slice(0, 3).map((q) => [q.id, true] as [string, boolean]),
    ];
    const recs = recommendations(answerSet(emptyState(), "q1", items), NOW);
    expect(recs.map((r) => r.id)).toEqual(["baseline", "flashcards", "weakest-topic"]);
    expect(recs[1]?.title).toBe("Review 3 missed-question flashcards");
    expect(recs[2]?.action).toEqual({ kind: "topic", domain: "architecture" });
    expect(recs.every((r) => r.why.length > 0)).toBe(true);
  });

  it("does not recommend flashcards when none are due", () => {
    const s = answerSet(emptyState(), "q1", [[Q(0).id, true]]);
    expect(recommendations(s, NOW).some((r) => r.id === "flashcards")).toBe(false);
  });
});

describe("test history", () => {
  it("each test form has no repeated questions", () => {
    for (const form of [PRE_TEST, POST_TEST]) {
      expect(new Set(form.map((q) => q.id)).size).toBe(form.length);
    }
  });

  it("keeps every result and compares the baseline with the latest post-test in percentage points", () => {
    let s = takeTest(emptyState(), "pre", "pre-1", 3, NOW);
    expect(testComparison(s)).toBeNull();
    s = answerSet(s, "q1", PRACTICE_QUESTIONS.slice(0, POST_TEST_MIN_PRACTICE).map((q) => [q.id, true]));
    s = takeTest(s, "post", "post-1", 6, NOW + DAY_MS);
    s = takeTest(s, "post", "post-2", 9, NOW + 2 * DAY_MS);
    expect(testHistory(s).map((r) => [r.kind, r.correct, r.total])).toEqual([
      ["pre", 3, 9],
      ["post", 6, 9],
      ["post", 9, 9],
    ]);
    expect(testComparison(s)).toMatchObject({ prePct: 33, postPct: 100, change: 67 });
    const restored = sanitizeState(JSON.parse(JSON.stringify(s)));
    expect(testHistory(restored)).toHaveLength(3);
  });

  it("finishing the same post-test twice records it once", () => {
    let s = takeTest(emptyState(), "pre", "pre-1", 3, NOW);
    s = answerSet(s, "q1", PRACTICE_QUESTIONS.slice(0, POST_TEST_MIN_PRACTICE).map((q) => [q.id, true]));
    s = startTest(s, "post", "post-1", NOW);
    for (const q of POST_TEST) s = answerTestQuestion(s, "post-1", q.id, q.answer);
    const running = s.currentTest;
    s = finishTest(s, NOW);
    s = finishTest({ ...s, currentTest: running }, NOW);
    expect(testHistory(s)).toHaveLength(2);
  });
});
