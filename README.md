# Mathbook

Parent-led Grade 3 math lessons. Static site for GitHub Pages: no build step, no frameworks, no backend.

Live site: https://bazeocrisy.github.io/Mathbook/

## What's here

- **Home** (`index.html`): "What would you like to do?" with two choices (Math Lessons, Number Words) and one **Continue where I left off** button, shown only for unfinished work with real progress (a test or practice set with at least one answer, or Learn part-way done).
- **Math Lessons** (`math/`): the list of lessons. Each lesson opens its Lesson Menu.
- **Grade 3 · Chapter 2 · Lesson 2-1** (`curriculum/chapter-2/lesson-2-1/`): Represent 4-Digit Numbers.
- **Grade 3 · Chapter 2 · Lesson 2-2** (`curriculum/chapter-2/lesson-2-2/`): Round Multi-Digit Numbers — nearest 10 and 100 with number lines and place value, explaining, working backward, select-all, and estimate vs. exact money totals. 12 practice questions (Practice Together with hints, or On My Own) and a separate 12-question Rounding Test with matching coverage.

## Approved template

Section 2-1 is the approved lesson template: **commit `b826b91`** (merge of PR #6, deployed and owner-reviewed). New lessons reuse its menus, Learn (Example → Your Turn), Practice, Take a Test, My Results, and Parent Guide without changing 2-1.
- **Number Words** (`number-words/`): Read It, Say It, Spell It, Write It. Phase 1 (0–10) is complete; Phases 2–4 are outlines only.

## Lesson structure

Every lesson opens on a **Lesson Menu** ("What would you like to do?") with four big choices — **Learn**, **Practice**, **Take a Test**, **My Results** — and a smaller **Parent Guide** link. There is no stage bar: a child sees one activity, and inside it one step or one question, at a time ("Step X of Y", "Question X of Y"), with Back / Next and a way back to the Lesson Menu. Routes: `#menu`, `#teach`, `#see` (`#see/done`), `#practice` (`#practice/words`, `#practice/together`, `#practice/own`, `#practice/s1`…), `#test` (`#test/math`, `#test/vocab`), `#results`. Old bookmarks (`#teach`, `#see`, `#practice`, `#test`, `#results`) still work.

1. **Parent Guide** (`#teach`, was Teach It): mission brief (learning target and big ideas), vocabulary, parent guide (what / what it means / why it works / how to demonstrate / what to ask / how to know), and a Show–Say–Ask teaching script.
2. **Learn** (`#see`, was See It): a five-step guided wizard, one step on screen at a time — worked examples (base-ten blocks and a place-value chart), build your own number, change one place, groups of ten, biggest and smallest. Each step ends with a short check: a wrong answer gets a clue and Try Again; a second miss explains the answer and offers a new question. **Next Step** unlocks when the check is answered correctly. Each step has two phases, one on screen at a time: **Example** (the explanation and the model, then **Now I'll Try**) and **Your Turn** (the check, **Check Answer** under the answer, feedback beside it, **See the Example Again**, and **Next Step** once the check is right). The phase, the chosen example, the built number, and typed answers are saved per step (`see-wizard`: `phase`, `builder`, `change`; older saved progress opens at Example). Worked examples show one example at a time (Previous Example / Next Example). Completed steps can be revisited with Back, progress is saved in the browser, and finishing shows "You finished learning!" with Start Practice. Each lesson defines its own steps in `lesson.js` (`seeIt.steps`: `id`, `kind`, `title`, `explain`, `check(rng)`).
3. **Practice**: a choice first — **Math Words** (vocabulary with hints), **Practice Together** (guided: hints, check, correct, explain; grown-up coaching folded under **Parent Help**), or **On My Own** (the 50-question bank in five labeled sets of 10, one question at a time, then Check my work, with per-set status and scores and **Practice My Misses** to retry only the missed questions).
4. **Take a Test**: Math Test and Math Words Test, 10 questions each, one at a time. No hints or feedback; a review screen lists unanswered questions and **Finish Test** grades only when every question has an answer. Every attempt uses new numbers, and unfinished tests survive a refresh ("Save and finish later").
5. **My Results**: score, mastery band, explained mistakes, skills to review, and attempt history.

Mastery bands: **90–100%** Mastered · **70–89%** Review missed skills · **below 70%** Reteach and reassess.

Number Words phases follow Learn → Say → Look, Cover, Write, Check → Practice → Spelling Test → Results. The test has 10 typed words (no hints); one of the 11 words sits out each time and is always tested next time. Mastery is 9 or more out of 10.

Progress is stored in the browser's `localStorage` only (`mathbook:v2:*` keys, one prefix per lesson or phase). It does not sync between devices, and no names or results are sent anywhere.

## Files

```
index.html                         Home page
math/index.html                    Math Lessons (lesson list)
assets/css/mathbook.css            Shared styles (galaxy theme, panels, place colors)
assets/js/place-value.js           Math helpers, answer parsing, SVG base-ten blocks, ten-frames (no DOM)
assets/js/questions.js             Question types: render, read, grade
assets/js/app-shell.js             Shared shell: header, stage router, guided runner, test runner, storage
assets/js/lesson-app.js            Lesson engine: Lesson Menu, Learn, Practice, Take a Test, My Results, Parent Guide (reusable for every lesson)
assets/js/number-words.js          Number Words logic: practice rounds, spelling tests, rotation (no DOM)
assets/js/number-words-app.js      Number Words phase engine (reusable for every phase)
curriculum/chapter-2/lesson-2-1/
  index.html                       Lesson page (loads the scripts above)
  lesson.js                        Lesson content only
curriculum/chapter-2/lesson-2-2/   Same layout: Round Multi-Digit Numbers
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
4. In `math/index.html`, add a `choice-card` link to `../curriculum/.../lesson-x-y/#menu`. The Lesson Menu, Learn wizard, Practice choices, tests, and results come from the shared engine; nothing about navigation is lesson-specific.
5. On the home page, add the new lesson's storage keys to the Continue check if it should count as unfinished work.

Question types available to any lesson: `mc`, `select`, `number`, `expanded`, `words`, `chart`, `build`, `spell`, `letter`, and `parts` (several small answers graded together: numbers, "any number that rounds to…", one choice, or select-all; optional blank number line) — see `assets/js/questions.js`.

A lesson can also provide, as data instead of code:
- Learn steps of `kind: 'slides'` (an array of HTML parts shown one at a time in the Example phase) with a `check(rng)` for Your Turn;
- `parentLearn` (goal, words, demonstrate, ask, checklist) for a shared Parent Guide layout;
- `seeIt.reflection` (a talk-about-it question on the Learn completion screen, never graded).
Practice shows only the activities a lesson defines (`vocabPractice`, `guided`, `bankSets`). Number lines come from `Mathbook.pv.numberLineHTML` / `roundLineHTML`.

## Adding a Number Words phase

1. In `number-words/program.js`, give the phase `status: 'ready'`, an `href`, a `storageKey`, and `words` (each with `n`, `word`, `tip`, and three `misspellings`), plus `testSize`, `masteryScore`, `practiceSize`.
2. Copy `number-words/phase-1/` to `phase-N/` and change `startPhase('N')`.

## Tests and audit

Requires Node 18+ (no packages to install) and Chrome or Edge for browser tests.

```
npm test               # unit tests: every number 0–9,999, all 50 bank questions, thousands of generated tests, rounding (2-2), Number Words
npm run test:browser   # end-to-end in headless Chrome/Edge, served under /Mathbook/ like GitHub Pages
npm run audit -- after # Build 2.1 device-state audit (written for the old stage-bar layout; not yet updated)
```

Browser tests write screenshots to `tests/screenshots/` (ignored by git). Set `CHROME_PATH` if Chrome is not found.
