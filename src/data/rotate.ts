import type { Question } from "./questions";

/**
 * Deterministically moves the options of a question by `k` places so the
 * correct answer is not always in the same position. Option-specific
 * explanations move with their options.
 */
export function rotateOptions(q: Question, k: number): Question {
  const n = q.options.length;
  const shift = ((k % n) + n) % n;
  if (shift === 0) return q;
  const to = (i: number) => (i + shift) % n;
  const options = new Array<string>(n);
  q.options.forEach((opt, i) => {
    options[to(i)] = opt;
  });
  const wrong: Partial<Record<number, string>> | undefined = q.wrong
    ? Object.fromEntries(Object.entries(q.wrong).map(([i, text]) => [to(Number(i)), text]))
    : undefined;
  return { ...q, options, answer: to(q.answer), wrong };
}
