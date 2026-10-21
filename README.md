# CloudPrep Africa

**Practise smarter for AZ-900: see your knowledge gaps, learn from every mistake, and track how much you improve.**

> CloudPrep Africa is an independent, unofficial study tool. It is not affiliated with or endorsed by Microsoft.

---

## About the Project

Many people preparing for the Azure Fundamentals (AZ-900) certification study by reading notes or answering question banks. The usual result is a score with little guidance: which topics are weak, why an answer was wrong, and whether studying is actually helping.

CloudPrep Africa turns practice into a feedback loop:

1. **Practise** with original, beginner-friendly questions mapped to the three areas of the public AZ-900 skills outline.
2. **Understand** every answer with a plain-English explanation, a note on why the chosen wrong option doesn't fit, and a real-world example.
3. **Revise** missed questions as flashcards, scheduled to come back at increasing intervals.
4. **Measure** progress by topic, and with a baseline test and a later post-test.

The app speaks to learners across Africa in a warm tone ("Karibu!") and is designed for small Android screens first.

## Features

All features below are implemented in this repository.

### Practice quizzes with original questions
- 32 original practice questions across the three AZ-900 learning areas:
  - Cloud Concepts (10)
  - Azure Architecture and Services (12)
  - Azure Management and Governance (10)
- Practise all areas or focus on one area.
- **Smart practice:** 10 questions picked from your own answer history. Missed questions come first, then questions you haven't tried, then questions you recovered after a miss. Weaker areas are prioritised, and each question shows why it was picked.

### Immediate answer feedback
After you submit an answer, the feedback panel shows:
- **Result:** "Correct!" or "Not quite"
- **Correct answer**, with its option letter
- **Why it is correct:** a beginner-friendly explanation
- **Why your choice was incorrect:** a specific explanation for the option you selected
- **Real-world example:** a short practical scenario
- **Next Question** button

### Missed-question revision flashcards
- Every practice question you answer incorrectly is automatically saved as a flashcard. There is one card per question and no duplicates.
- Review flow: question → **Reveal Answer** → correct answer, explanation and example → **Again** or **Got it**.
- "Got it" schedules the next review in **1, 2, 4, 8, then 16 days**. "Again" keeps the card in revision.
- Counts for saved cards, cards that need revision and cards understood.

### Topic-level performance tracking
- Accuracy for each learning area, based on recorded answers.
- **Stronger topic** and **Needs more practice** labels appear only when there is enough data (at least 3 different questions answered per topic). Otherwise the topic shows "Not enough data yet".
- Overall practice accuracy, questions answered and quizzes completed.

### Readiness indicator
- An **unofficial readiness estimate (0–100)**. It is based on the questions you most recently got right in each area, weighted by the approximate share of each area in the public skills outline.
- No estimate is shown until every topic has enough answers. Until then the app shows *"Keep practising to build your readiness estimate"* and lists what's missing.
- Always labelled as a learning indicator, not an exam score or a prediction.

### Pre-test and post-test comparison
- Two separate 9-question tests (3 per learning area) with different original questions and no repeats within a test.
- The baseline (pre-test) is taken once, so it stays a fair starting point. The post-test unlocks after the pre-test and 20 different practice questions, and can be retaken.
- The comparison shows the baseline against the latest post-test, in percentage points, broken down by area.
- A full test history keeps the type, date, score and percentage of every test. New results never overwrite old ones.

### Personalised recommendations
- Suggestions built only from your saved data: take the baseline test, review flashcards that are due, practise your weakest topic, or work towards and take the post-test.
- Each recommendation shows a short "Why".

### Progress and score persistence
- All answers, quiz results, flashcards and test results are saved in the browser's `localStorage`, and are restored after a refresh or a return visit.
- Answers are recorded once per quiz and question, so double taps, refreshes or navigation can't count an answer twice.
- Saved data is checked when it loads. Invalid or outdated data loads as a safe empty state instead of crashing the app.
- Progress stays in sync across open browser tabs.

### Mobile-friendly design
- Bottom tab bar on small screens and a top navigation bar on larger ones.
- Large tap targets, progress bars with accessible labels, and a dark navy theme with an Azure-blue primary colour.

## Target Users

- Beginners preparing for the **Microsoft Azure Fundamentals (AZ-900)** certification.
- Students, career changers and early-career IT learners, especially across Africa, who want **free, self-paced, accessible practice** on a phone.
- Learners who benefit from plain-English explanations and clear feedback on what to study next.

## Technology Stack

| Area | Technology |
| --- | --- |
| Framework | [TanStack Start](https://tanstack.com/start) v1 (React 19, file-based routing with TanStack Router) |
| Language | TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS v4, with shadcn/ui-style components built on Radix UI |
| Icons | lucide-react |
| Storage | Browser `localStorage`, behind a small store built on React's `useSyncExternalStore` (no backend or database) |
| Testing | Vitest, Testing Library, jsdom |
| Code quality | ESLint, Prettier |

There is no backend, no user accounts, and no external or paid APIs. The app needs no environment variables.

### Project structure (key files)

```text
src/
  data/
    domains.ts          # The three learning areas and their weights
    questions.ts        # 32 original practice questions with explanations and examples
    tests.ts            # Original pre-test and post-test questions
    rotate.ts           # Deterministic answer-option rotation
  lib/
    progress-logic.ts   # Pure state rules: answers, quizzes, flashcards, tests
    insights.ts         # Readiness, topic performance, smart practice, recommendations
    progress-store.ts   # localStorage persistence and cross-tab sync
  components/           # App shell, question card, feedback, readiness, recommendations
  routes/               # Pages: / practice, review, tests, results, progress
  test/                 # Vitest tests for the learning rules
```

## Getting Started

### Prerequisites

- **Node.js** `20.19+` or `22.12+` (required by Vite)
- **npm** (comes with Node.js), or **[Bun](https://bun.sh)**. The repository includes a `bun.lock` lockfile.

### Install and run

```bash
git clone <your-repository-url>
cd <repository-folder>

# install dependencies (choose one)
npm install
# or
bun install

# start the development server
npm run dev
```

Open the local address printed in the terminal.

### Other scripts

```bash
npm run build     # production build
npm run preview   # preview the production build
npm test          # run the Vitest test suite
npm run lint      # run ESLint
npm run format    # format code with Prettier
```

No `.env` file or API keys are needed.

## How It Works

1. **Start with a baseline.** The home page suggests a 9-question pre-test. There is no feedback until the end, so the starting score is honest.
2. **Practise.** Choose Smart practice, all areas, or a single area. Answer a question and press **Submit Answer** to see the full feedback panel, then press **Next Question**.
3. **Mistakes become flashcards.** Any question you get wrong is saved to **Revision Flashcards**. Reveal the answer, then press **Again** or **Got it**. Cards you understand come back after 1, 2, 4, 8 and 16 days.
4. **See where you stand.** The **Progress** page (readiness dashboard) shows:
   - overall accuracy
   - accuracy for each topic, with stronger and weaker topics
   - the unofficial readiness estimate, once there is enough data
   - recommendations, each with its reason
5. **Measure improvement.** After 20 different practice questions, take the post-test. The **Tests** page compares it with your baseline in percentage points and keeps your full test history.

All of this is saved on the learner's own device. Nothing is sent to a server.

## Responsible Use

- CloudPrep Africa is an **independent, unofficial learning project**. It is **not affiliated with, endorsed by or sponsored by Microsoft**. "Azure" and "AZ-900" are used only to describe the subject of study.
- **All questions are original practice material** written from the public AZ-900 skills outline. They are **not official or real exam questions**.
- **Practice scores, the readiness estimate and test comparisons are learning indicators only.** They do not predict or guarantee success in the official certification exam.
- For official exam information, see the [AZ-900 study guide on Microsoft Learn](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900).

## Limitations and Future Improvements

### Current limitations
- **Small question bank:** 32 practice questions and 18 test questions cover the main skills, not every detail of the outline.
- **Progress is stored per browser and device.** It doesn't sync between devices, and clearing browser data deletes it. There is no export or backup.
- **No accounts.** Progress can't be shared with a teacher or study group.
- **The readiness estimate is a simple weighted formula** based on this app's questions. It hasn't been validated against real exam outcomes.
- **The pre-test can be taken only once**, and the two test forms are fixed rather than drawn from a larger pool.
- **English only.**
- **No offline mode:** the app needs a connection to load.

### Realistic future improvements
- Expand the original question bank and add more test forms.
- Export and import progress, so learners can back it up or move devices.
- Offline support (installable web app) for learners with limited connectivity.
- Translations, for example Kiswahili and French.
- A timed mock-exam mode.
- Optional accounts with cloud sync, for classroom or bootcamp use.
- A formal accessibility audit (screen readers, contrast, keyboard navigation).

## Hackathon Context

CloudPrep Africa was built for the **Vibe Coding Hackathon: AZ-900 Exam Prep Edition**. The goal is learning-focused: to help beginners understand Azure fundamentals rather than memorise answers. It does this through clear explanations, practical examples, spaced revision of mistakes, and honest, data-based feedback on progress.
