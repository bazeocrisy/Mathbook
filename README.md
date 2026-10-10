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
assets/js/place-value.js           Math helpers, answer parsing, SVG base-ten blocks, ten-frames, number lines (no DOM)
assets/js/figures.js               Chapter 2 display figures (Mathbook.fig): arrows, grouping V, counters, tables, number lines, trees, stacks, bar diagrams, picture choices, compare charts
assets/js/questions.js             Question types: render, read, grade (including chain and vcalc)
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

Lesson page template (script order): `place-value.js`, `figures.js`, `questions.js`, `app-shell.js`, the lesson's `lesson.js`, `lesson-app.js`. `figures.js` must come before `lesson.js` when Learn slides call `Mathbook.fig.html(...)`; pages without it still work (a `q.figure` is then simply not drawn). Node tests that load a lesson using figures should also `require('../assets/js/figures.js')`.

### Question types

Question types available to any lesson: `mc`, `select`, `number`, `expanded`, `words`, `chart`, `build`, `spell`, `letter`, `rline`, `parts` (several small answers graded together: numbers, "any number that rounds to…", one choice, or select-all; optional blank number line), `chain` and `vcalc` — see `assets/js/questions.js`. Every question is plain JSON (saved attempts re-render exactly). Chapter 2 additions follow [docs/chapter-2/DESIGN.md](docs/chapter-2/DESIGN.md) §3–§4:

- **Any question** may carry `figure` (one figure spec or an array), drawn after `display`. `___` in `display` or `prompt` is drawn as an empty box (in `select` prompts it stays the drop-down). A `\n` in an `mc`/`choice` text is a line break.
- **`parts`** keeps its behaviour and "Look again at: …" coaching, plus: `anyOrder: 'g'` on two or more `num` parts (graded as a set: the typed values must be the answers in any order); `compact: true` on `choice`/`multi` (chip grid); and `{ kind: 'symbol', left, right, choices: ['<', '>', '='] | ['=', '≠'], answer, label? }` (native radio buttons named "less than", …).
- **`chain`**: rows of equation cells with `=` aligned. Presets:
  - `{ preset: 'free', addends: [{ digits: 3, parity: 'even' }, { digits: 3, parity: 'odd' }], anyOrder?: true }`: a child-written `[ ] + [ ] = [ ]` (2-5). Parities are graded as a set unless `anyOrder: false`; the sum must be right (it may have 4 digits).
  - `{ preset: 'rows', addends: [367, 145(, c)], given?: 'places' }`: partial sums in a row (2-6). One line per place (place values in any order, 300 not 3); each partial and the sum exact.
  - `{ preset: 'steps', a: 362, b: 175, tree?: { start: 3, min: 2, max: 4, given?: [100, 70, 5] }, final?: { label } }`: a tree input for `b`, one subtraction row per part, each checked against the child's own previous result (decision 9), final `a − b` exact (2-7; decompose items in 2-10/2-11).
  - `{ preset: 'trees', n: 175, count?: 2, tree?: {...} }`: break n apart in different ways. Each tree has 2–4 whole parts ≥ 1 adding to n, and the sets differ.
  - `{ preset: 'adjust', a, b, op: '+' | '−', labels?: ['a becomes', 'b becomes', 'Sum'], tip? }`: adjust arrows (2-8; the 2-10 keep-the-sum and 2-11 keep-the-difference pair). Any pair of whole numbers ≥ 1 that keeps the sum or difference with both numbers changed (not the original pair or its swap) is right; the answer is exact. An adjustment with no number ending in 0 gets only the gentle `tip` (default "Tip: try to make a ten or a hundred."). `oneNumber: true` (with an optional `final`) is the "change one number, then fix the answer" form.
  - No preset (frame): `rows: [{ cells: [Cell, '+', Cell, '=', Cell], true?, commute?, tag?, label? }]`, `final?: { label, answer }`. A cell is a number (printed), `'?'`, `{ in: 'id', answer?, digits?, parity?, label }` or `{ echo: 'id' }` (the child's entry of another box, shown read-only). `commute` grades the boxes before `=` as a set; `true` requires a true equation with the typed values.
  - Response: `{ v: { id: '…' }, t: [[tree parts]] }`.
- **`vcalc`**: `{ op: '+' | '−', top, bottom, third? (or rows: [..]), answer?, places?, carries?: true, input?: 'digits' | 'rows', notes?: 'input', blanks?: { top: ['T'], bottom: ['H'], result: ['Th'] } }`. `digits`: one box per column (+1 for addition); typing a digit moves left, Backspace on an empty box moves right; optional regroup boxes are saved but never graded; the answer row is read as a number. `rows`: partial sums and the sum in a stack, each exact; `notes: 'input'` asks for the place values too. `blanks`: missing digits, all-or-nothing. Response: `{ d: [..], c: [..], b: {..}, p: [..], s, n: [..] }`.
- **Modes** (render option `mode`): `guided` (Learn Your Turn and Practice Together: helper lines such as "Your parts add to …" and live adjust tags; after Check Answer every box gets ✓, or only the wrong boxes get ✗, with one message naming the first problem), `test` (Take a Test, On My Own: only the child's entries, no helpers), and `review` (`review: true`: read-only with ✓/✗ per box).

### Figures (`Mathbook.fig`)

`Mathbook.fig.html(spec)` returns HTML for Learn slides; the same spec goes in a question's `figure`. Every figure is a `<figure role="img">` with a full-sentence `aria-label` (generated, or `label`), plus an optional `caption`.

| `fig` | Spec |
|---|---|
| `arrows` | `{ a, b, op, to: [ra, rb], result?, tags?: ['−1', '+1'], reveal?: 'top' \| 'arrows' \| 'all', unknown?: true }` |
| `groupV` | `{ addends: [a, b, c], pair: [i, j], pairSum?, total?, reveal?: 'top' \| 'v' \| 'all', look?: true }` |
| `counters` | `{ groups: [{ n, kind: 'a' \| 'b', label }], pairs?: true, join?: true }` |
| `table` | `{ title, head: [..], rows: [[..]], money?: true }` (a real table; more than 3 columns turns sideways on phones) |
| `nline` | `pv.numberLineHTML` options, plus `points: [{ v, text }]`, `hops: [{ from, to, text? }]`, `open: true` with `marks: [..]`, `bands: [{ from, to, text }]`; or `{ lines: [cfg, cfg] }` stacked |
| `tree` | `{ n, parts: [..], alt?: true, check?: false }` |
| `stack` | `{ rows: [a, b], op, places?, partials?: true \| [{ v, note }], total?, result?: 'none' \| 'all' \| k, carries?: { T: 1 }, focus?: 'T', blanks?, misalign?: 'left', reveal?: k, hideResults? }` |
| `bar` | `{ kind: 'ppw', parts, sizes, whole, bracket?: 'above' \| 'below', caption?, small? }` or `{ kind: 'cmp', long, short, gap, sizes: [long, short], order?: 'longTop' \| 'shortTop', caption? }`. Labels are numbers, `'?'`, `{ letter: 'a' }` or `{ slot: 'A' }` |
| `pics` | `{ items: [{ label: 'A', fig: {...} }], noun?: 'Diagram' }` (follow it with a `compact` choice "A", "B", …) |
| `cmp` | `{ a, b, focus?: 'Th' \| 'H' \| 'T' \| 'O' }` |

### Small engine options (Chapter 2)

- A `slides` Learn step without `check` has only the Example phase; its button reads **Next Step →** or **Finish →** and unlocks at the last part.
- `skillLinks: { '2-7': '../lesson-2-7/#menu' }` on a lesson: My Results shows **Review this lesson (2-7)** for that skill (an empty link shows no button).
- `guidedContext: { title, text, figure }` (or `guided.context`): a shared story box above every Practice Together question.
- No timers anywhere.

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
