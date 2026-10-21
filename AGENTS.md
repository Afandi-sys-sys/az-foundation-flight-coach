<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- All learner state lives in one versioned localStorage key, written only through `updateProgress` in `src/lib/progress-store.ts` — keeps saving, cross-tab sync and restore in one place.
- State changes are pure functions in `src/lib/progress-logic.ts`; readiness and adaptive selection are pure in `src/lib/insights.ts` — so rules are unit-tested in `src/test/learning-rules.test.ts` without a browser.
- Answer recording is idempotent per quiz + question (history event id `${quizId}:${questionId}`) — prevents duplicate counts from double taps or refreshes.
- Questions live in `src/data/` as typed data with explanation, per-option wrong explanations and a real-world example; option order is shuffled deterministically via `rotateOptions` (never at module scope with randomness) — SSR-safe on Workers.
- Bump `STATE_VERSION` and extend `sanitizeState` when the stored shape changes — invalid or old data must load as a safe state, never crash.
- No backend, auth or new dependencies unless genuinely required — the app is intentionally local-first.
