# Mathbook

Parent-led Grade 3 math lessons. Static site for GitHub Pages: no build step, no frameworks, no backend.

Live site: https://bazeocrisy.github.io/Mathbook/

## What's here

- **Home** (`index.html`): galaxy-themed landing page with learning destinations and a Continue Learning card that only appears from progress saved in this browser.
- **Grade 3 · Chapter 2 · Lesson 2-1** (`curriculum/chapter-2/lesson-2-1/`): Represent 4-Digit Numbers.
- **Number Words** (`number-words/`): Read It, Say It, Spell It, Write It. Phase 1 (0–10) is complete; Phases 2–4 are outlines only.

## Lesson structure

Every lesson follows the same five stages. Each stage is split into labeled parts (A, B, C…) marked **For the student**, **Together**, or **For the parent**.

1. **Teach It**: mission brief (learning target and big ideas), vocabulary, parent guide (what / what it means / why it works / how to demonstrate / what to ask / how to know), and a Show–Say–Ask teaching script.
2. **See It**: a five-step guided wizard, one step on screen at a time — worked examples (base-ten blocks and a place-value chart), build your own number, change one place, groups of ten, biggest and smallest. Each step ends with a short check: a wrong answer gets a clue and Try Again; a second miss explains the answer and offers a new question. **Next Step** unlocks when the check is answered correctly. Completed steps can be revisited, and progress is saved in the browser. Each lesson defines its own steps in `lesson.js` (`seeIt.steps`: `id`, `kind`, `title`, `explain`, `check(rng)`).
3. **Practice It**: vocabulary practice, guided practice (hints, check, correct, explain), and independent practice: the 50-question bank in five labeled sets of 10 (any order), with per-set status and scores and **Practice My Misses** to retry only the missed questions.
4. **Test It**: Vocabulary Test and Math Test, 10 questions each. Focus mode hides the lesson tabs, no hints or feedback, every answer is required, every attempt uses new numbers, and unfinished tests survive a refresh.
5. **Results**: score, mastery band, explained mistakes, skills to review, and attempt history.

Mastery bands: **90–100%** Mastered · **70–89%** Review missed skills · **below 70%** Reteach and reassess.

Number Words phases follow Learn → Say → Look, Cover, Write, Check → Practice → Spelling Test → Results. The test has 10 typed words (no hints); one of the 11 words sits out each time and is always tested next time. Mastery is 9 or more out of 10.

Progress is stored in the browser's `localStorage` only (`mathbook:v2:*` keys, one prefix per lesson or phase). It does not sync between devices, and no names or results are sent anywhere.

## Files

```
index.html                         Home page (galaxy landing)
assets/css/mathbook.css            Shared styles (galaxy theme, panels, place colors)
assets/js/place-value.js           Math helpers, answer parsing, SVG base-ten blocks, ten-frames (no DOM)
assets/js/questions.js             Question types: render, read, grade
assets/js/app-shell.js             Shared shell: header, stage router, guided runner, test runner, storage
assets/js/lesson-app.js            Five-stage lesson engine (reusable for every lesson)
assets/js/number-words.js          Number Words logic: practice rounds, spelling tests, rotation (no DOM)
assets/js/number-words-app.js      Number Words phase engine (reusable for every phase)
curriculum/chapter-2/lesson-2-1/
  index.html                       Lesson page (loads the scripts above)
  lesson.js                        Lesson content only
number-words/
  index.html                       Program overview (phases)
  program.js                       Curriculum data: Phase 1 words and tips; Phases 2–4 outline
  phase-1/index.html               Phase 1 page
tests/                             Unit tests, browser tests, audit tooling
docs/audit/                        Baseline and post-implementation audits with screenshots
```

## Adding a lesson

1. Copy `curriculum/chapter-2/lesson-2-1/` to the new lesson folder.
2. Edit `lesson.js`: register `Mathbook.lessons['<id>']` with new content and a new `storageKey`. List the practice bank's sets in `bankSets` (each set: `id`, `title`, `blurb`, and 10 question `ids`; every bank question in exactly one set).
3. In `index.html`, change the `startLesson('<id>', { path })` call. Script paths stay the same at the same folder depth.
4. On the home page, replace part of the "coming later" row with a link to the new lesson.

Question types available to any lesson: `mc`, `select`, `number`, `expanded`, `words`, `chart`, `build`, `spell`, `letter` (see `assets/js/questions.js`).

## Adding a Number Words phase

1. In `number-words/program.js`, give the phase `status: 'ready'`, an `href`, a `storageKey`, and `words` (each with `n`, `word`, `tip`, and three `misspellings`), plus `testSize`, `masteryScore`, `practiceSize`.
2. Copy `number-words/phase-1/` to `phase-N/` and change `startPhase('N')`.

## Tests and audit

Requires Node 18+ (no packages to install) and Chrome or Edge for browser tests.

```
npm test               # unit tests: every number 0–9,999, all 50 bank questions, thousands of generated tests, Number Words
npm run test:browser   # end-to-end in headless Chrome/Edge, served under /Mathbook/ like GitHub Pages
npm run audit -- after # device-state audit at 9 viewports → tests/audit-output/after/
```

Browser tests write screenshots to `tests/screenshots/` (ignored by git). Set `CHROME_PATH` if Chrome is not found.
