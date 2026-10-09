# Mathbook

A simple, bright math book for a young learner, led by a parent. Static site for GitHub Pages: no build step, no frameworks, no backend.

Live site: https://bazeocrisy.github.io/Mathbook/

## How it is organized

- **Home** (`index.html`): two big choices, **Math Lessons** and **Number Words**, and a small **For grown-ups** link. The Mathbook logo returns home from every page.
- **Math Lessons** (`math/`) → **Lesson 2-1** (`curriculum/chapter-2/lesson-2-1/`), with four choices:
  - **Learn**: the big ideas and worked examples (2,137 · 4,628 · 5,072), build a number, 10/100/1,000 more or less, groups of ten, biggest and smallest, one page at a time.
  - **Words to Know**: one word per card, then word practice.
  - **Practice**: Practice Together (with a grown-up), then five sets of 10 (the 50-question bank).
  - **Show What You Know**: the Vocabulary Test and the Math Test, 10 questions each.
- **Number Words** (`number-words/`) → **Numbers 0 to 10** (`number-words/phase-1/`): Learn the Words, Say Them, Cover and Write, Practice, Spelling Test. Phases 2–4 are an outline in `number-words/program.js` only.
- **For Grown-Ups** (`grown-ups/`): continue learning, test and practice scores (first try and after a retry), missed skills with suggested review, assessment history, the teaching guide, and Clear Progress.

### How a practice question works

One question per screen. **Check Answer** → right: encouragement and the explanation, then **Next**. Wrong: a clue and **Try Again** (the answer is not shown). Wrong again: the correct answer and explanation, then **Next**. Nothing advances by itself. First-try and after-retry results are saved separately. After a set, **Practice My Misses** retries the questions missed on the first try.

### How a test works

One question per screen with **Previous** and **Next**; no clues and no feedback. A review screen shows any unanswered questions and grading waits until every question is answered. Unfinished tests are saved and resume where they were left. Every new test uses new numbers (Math and Vocabulary) or rotates the words (Spelling).

Progress is stored in the browser's `localStorage` only (`mathbook:v2:*` keys, one prefix per lesson or program). It does not sync between devices, and no names or results are sent anywhere. Fonts (Andika, Baloo 2; SIL Open Font License) are served from this site, so no third-party requests are made.

## Files

```
index.html, math/, number-words/, grown-ups/   Pages
assets/css/mathbook.css            Shared styles
assets/fonts/                      Self-hosted fonts and their license
assets/js/place-value.js           Math helpers, answer parsing, base-ten blocks, ten-frames (no DOM)
assets/js/questions.js             Question types: render, read, grade
assets/js/app-shell.js             Page frame, routing, practice runner, test runner, storage
assets/js/lesson-app.js            Lesson (child view), reusable for every lesson
assets/js/number-words.js          Number Words logic: practice rounds, spelling tests, rotation (no DOM)
assets/js/number-words-app.js      Number Words (child view), reusable for every phase
assets/js/grownups-app.js          For Grown-Ups page
curriculum/chapter-2/lesson-2-1/   Lesson page and lesson.js (all Lesson 2-1 content)
number-words/program.js            Number Words curriculum data
tests/                             Unit and browser tests
docs/audit/                        Build 2.1 audits (they describe the Build 2.1 screens)
```

## Adding a lesson

1. Copy `curriculum/chapter-2/lesson-2-1/` to the new lesson folder.
2. Edit `lesson.js`: register `Mathbook.lessons['<id>']` with new content and a new `storageKey`. List the practice bank's sets in `bankSets` (each set: `id`, `title`, `blurb`, and 10 question `ids`; every bank question in exactly one set).
3. In the lesson's `index.html`, change the `startLesson('<id>', …)` call.
4. Add a button for it on `math/index.html`, and add it to the For Grown-Ups page.

## Tests

Requires Node 18+ (no packages to install) and Chrome or Edge for browser tests.

```
npm test               # unit tests: every number 0–9,999, all 50 bank questions, thousands of generated tests, Number Words
npm run test:browser   # end-to-end in headless Chrome/Edge, served under /Mathbook/ like GitHub Pages
```

Browser tests write screenshots to `tests/screenshots/` (ignored by git). Set `CHROME_PATH` if Chrome is not found. `tests/audit.mjs` is the Build 2.1 device-state audit and targets the Build 2.1 screens; it needs updating before it is used on this interface.
