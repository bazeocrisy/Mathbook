# Subtract with Regrouping — design and teaching outline

Spec: [SPEC.md](SPEC.md). This file is the coordinator's plan: the architecture, the math model, the teaching sequence, practice, the test, persistence and the UI. Review notes and decisions are added below as they are made.

## 1. Architecture (four separate parts)

| Part | File | Depends on | Must not depend on |
|---|---|---|---|
| Pure math | `assets/js/subtract/sub-math.js` → `SubtractKit.math` | nothing (plain JS) | DOM, Mathbook, storage |
| Vertical workspace | `assets/js/subtract/sub-workspace.js` → `SubtractKit.mount(el, options)`; styles `assets/css/subtract-workspace.css` (`.sk` scope, `--sk-*` variables) | `SubtractKit.math`, the DOM | Mathbook globals, routes, lesson ids, storage keys |
| Teaching content | `curriculum/supplemental/subtract-regrouping/content.js` → `MB.subtractRegrouping.content` | `SubtractKit.math` (for its examples) | the DOM |
| Mathbook adapter | `curriculum/supplemental/subtract-regrouping/app.js` (+ `index.html`) | `MB.shell` (header, router, store, reset), `MB.catalog`, the content, the workspace | — |

- **Module convention:** IIFEs, as in the rest of the repo. The component attaches `root.SubtractKit` and also exports via `module.exports` when that exists, so the Node unit tests can `require` it.
- **No framework and no build.**

## 2. Math model (`SubtractKit.math`)

- **Places.** Index 0 = ones, 1 = tens, 2 = hundreds, 3 = thousands.
  - **Amounts:** an array of current place amounts. Amounts may be above 9 (10, 12…) during regrouping.
  - **Value:** `value(amounts) = Σ amounts[i]·10^i`.
- **Exchange.** `exchange(amounts, from)` moves 1 from place `from` to place `from − 1` (+10).
  - It is valid only when `from ≥ 1` and `amounts[from] ≥ 1`, so the value is always preserved.
  - Invalid exchanges return an error object, never a changed array.
- **Standard right-to-left plan.** `plan(top, bottom)` works column by column, from the ones:
  - When the current top amount is less than the bottom digit, it finds the nearest place to the left with an amount ≥ 1, the **supplier**.
  - It then performs the exchanges one at a time, from the supplier down to the column. A zero chain passes through the zero places.
  - The plan records:
    - every exchange, as `{ from, to, before, after }`;
    - for every column: whether it needs an exchange, its supplier, the top amount at that time, the bottom digit, and the answer digit;
    - the final amounts.
- **Difficulty**, `classify(top, bottom)`, comes only from that plan:
  - `none`: no exchange.
  - `easy`: exactly 1 exchange and no zero chain.
  - `medium`: 2 or more exchanges and no zero chain.
  - `hard`: some supplier is farther than the next place, so the chain passes through zero-valued places.
  - Detail fields: `zeroChain`, the longest number of zeros passed through (1 = single zero, ≥ 2 = consecutive zeros), and the exchange count.
- **Sizes and support.** The size is the number of digits in the top number (2, 3 or 4). The bottom number has 1 … size digits and is never larger than the top.
  - **2-digit:** none and easy only. Medium needs a second exchange, which is impossible with only tens and ones. Hard needs a zero place between the supplier and the column, which is also impossible. The setup explains this in plain words.
  - **3- and 4-digit:** every difficulty.
- **Generation.** `generate({ size, difficulty, count, rng, avoid })`:
  - Rejection sampling: random digits, with extra zeros in the top number for hard.
  - Answers are never negative.
  - No duplicate (top, bottom) pairs in a session.
  - Mixed difficulty: an even share of the supported difficulties, plus about 15% `none`, which includes equal operands and zero answers.
  - Mixed size: at least half 4-digit; the rest 2- and 3-digit as the difficulty allows.
- **Input.** `readAnswer(digits)` takes the answer boxes from the ones up.
  - Empty boxes on the left are allowed. A gap between digits is incomplete.
  - All empty is unanswered (`null`), never 0.
  - Leading zeros are accepted. Any non-digit is invalid.
- **Grading.**
  - `gradeFinal(top, bottom, digits)`: correct, wrong or unanswered. It uses only the answer row, never the annotations.
  - `checkAmounts(top, bottom, amounts)` grades the explicit regrouping-step answers. Correct means the value is preserved, every amount is ≥ 0, and every column's amount is ≥ its bottom digit. So any valid alternative regrouping is right, not only the standard one.
  - `diagnose(top, bottom, work)` gives specific feedback for practice only, never for test results. It reads the child's own annotations and answer digits, never the screen:
    - **smaller-from-larger:** a column whose original top digit is less than the bottom digit, with no annotation, and an answer digit equal to bottom − top;
    - **no-reduce:** a column annotated +10, with the place to its left left as the original digit (value not preserved);
    - **skip-zero:** a supplier reduced by 1 and a column several places to the right +10, with the zeros between unchanged;
    - **original-digit:** a column with an annotation, but an answer digit equal to the original digit − bottom;
    - **misaligned:** the answer equals top − bottom·10^k.

    A value-preserving annotation set that differs from the standard plan is reported as "a different valid way", never as wrong.
- **Hints.** `hints(top, bottom, work)` gives 5 levels for the next unfinished column:
  1. The column needing attention.
  2. Where an exchange can come from.
  3. The exchange explained.
  4. The next worked step.
  5. The full solution, shown only on request.

  Level 1 never contains the final answer.

## 3. Workspace (`SubtractKit.mount`)

- **Grid** (CSS grid, one column per place, plus one column for the minus sign). The rows, top to bottom:
  1. **Place tags:** Th, H, T, O. Columns the problem doesn't use stay blank.
  2. **Regroup row:** above each top digit, the child's optional value. Earlier values in the same column stay visible but crossed out (struck through, smaller). The current value sits in a box. Each cell has room for 2 digits.
  3. **Top number:** original digits, crossed out (struck through, with "was 3" for screen readers) once a column has a regrouped value.
  4. **Bottom number:** right-aligned, with the minus sign beside it.
  5. **Answer line.**
  6. **Answer boxes**, one per place.
- **Modes:**
  - `demo`: Learn examples. Back and Next step through the standard plan, one exchange or one answer digit at a time, with a sentence each, e.g. "Exchange 1 thousand for 10 hundreds. 3 thousands, 0 hundreds → 2 thousands, 10 hundreds."
  - `guided`: the child decides, column by column, from right to left:
    1. Does this column need regrouping? (Yes/No)
    2. Which place can give? (only places to the left)
    3. For each exchange, the new values of both columns.
    4. The answer digit.

    Wrong answers get specific feedback and a retry; correct work is kept. Valid but non-standard choices get "That works too, but…".
  - `independent`: optional regrouped values (type in a column's regroup box), Undo (the last regroup change), Clear Work (all regroup marks), the answer boxes, Check, and hints 1→5 (level 5 behind "Show the full solution").
  - `test`: the same entry as independent, but no Check, hints, feedback or marks. Nothing is regrouped automatically.
- **Options:** `{ top, bottom, mode, hints (bool), feedback (bool), size (fixed column count), labels, text, theme }`.
- **Events:** `answer`, `step`, `hint`, `complete`, `reset`, `change`.
- **API:** `getState()` / `setState()`, `check()`, `on/off`, `destroy()`.
- **Instances:**
  - Ids come from a per-instance prefix.
  - All listeners are registered with one `AbortController` per instance, so `destroy()` removes them all.
  - No document-level listeners and no globals besides `SubtractKit`.
- **State** (versioned, `v: 1`): `top`, `bottom`, `mode`, `ann` (regroup values per place: the history array, with the current value last), `log` (undo log), `d` (answer digits by place), `guided` (column, stage, entries), `hint` (level), `demo` (step), `result`. The adapter adds `p: []` so Home's "Continue" can count answered digits.
- **Accessibility:**
  - Every input names its row and place ("Regrouped tens", "Answer ones digit").
  - A polite live region announces step changes, exchanges and feedback.
  - Crossed-out values are marked by strikethrough plus "was" text, not by color alone; current values are boxed and bold.
  - Visible focus; Arrow keys move between answer boxes; tap targets ≥ 44 px.
- **Theming:** CSS variables `--sk-cell`, `--sk-font`, `--sk-ink`, `--sk-muted`, `--sk-accent`, `--sk-line`, `--sk-bg`, `--sk-box-bg`, `--sk-cross`, `--sk-focus`, `--sk-ok`, `--sk-no`. Mathbook sets them from its own palette.

## 4. Learn (9 wizard steps, Example → Your Turn)

| Step | Topics | Example (demo, verified) | Your Turn |
|---|---|---|---|
| 1 Regrouping keeps the value | 1 | 52 = 5 tens 2 ones → 4 tens 12 ones (52 both ways); then 3,002 → 2 thousands 10 hundreds → … | Exchange 1 ten for 10 ones in a 2-digit number: new tens, new ones, and "Is the value the same?" (generated) |
| 2 One exchange | 2, 3 | 52 − 27 = 25; 463 − 128 = 335 | guided: 2- or 3-digit easy |
| 3 More than one exchange | 4 | 532 − 168 = 364 | guided: 3-digit medium |
| 4 Four-digit numbers | 5, 6 | 4,352 − 2,126 = 2,226 (easy); 4,532 − 1,768 = 2,764 (medium) | guided: 4-digit easy or medium |
| 5 Across one zero | 7 | 4,305 − 1,268 = 3,037 | guided: 4-digit, single zero |
| 6 Across zeros next to each other | 8 | 3,002 − 1,578 = 1,424 (the spec's four lines) | guided: 4-digit, consecutive zeros |
| 7 Do I need to regroup? | 9 | 6,487 − 2,135 (no); 5,264 − 1,839 (ones yes; tens after lending: no; …) | decision: does it need regrouping, and which column first? |
| 8 Find and fix mistakes | 10 | smaller-from-larger (5,264 − 1,839 → 4,635) and a skipped zero (3,002 − 1,578; the wrong answer comes from the bug model in sub-math.js) | error analysis: what went wrong, then the correct answer, worked vertically |
| 9 Check with addition | 11 | 1,424 + 1,578 = 3,002 | solve vertically, then pick the addition that checks it |

## 5. Practice

- **Practice Together (guided):** 8 verified problems in guided mode, covering 2-digit easy through 4-digit with consecutive zeros, with Parent Help. "New problems" generates a fresh set of the same kinds.
- **On My Own:**
  - The setup wizard comes first: size → difficulty (unsupported choices are shown disabled, with the reason) → length → Start.
  - Each question is in independent mode, one at a time, with Check, feedback, retries and hints.
  - The session is saved, and a summary appears at the end.
- **Practice one skill (targeted):** 7 skills, each a fresh 6-question session, saved apart from the full set:
  - one exchange;
  - multiple exchanges;
  - across one zero;
  - across zeros next to each other;
  - four-digit regrouping;
  - deciding whether to regroup;
  - finding mistakes.

## 6. Test (15 questions, new numbers each attempt, seeded)

| # | Kind | Number |
|---|---|---|
| 1 | final | 2-digit easy |
| 2 | final | 3-digit easy |
| 3 | final | 3-digit medium |
| 4 | final | 4-digit easy |
| 5 | final | 4-digit medium |
| 6 | final | 4-digit medium (3 exchanges) |
| 7 | final | 4-digit, single zero |
| 8 | final | 4-digit, consecutive zeros |
| 9 | final | 3-digit, consecutive zeros |
| 10 | regrouping steps | 4-digit, single zero: write the regrouped top number |
| 11 | regrouping steps | 4-digit, consecutive zeros |
| 12 | decision | 4-digit: regroup? which column first? |
| 13 | error analysis | 4-digit: what went wrong + correct answer |
| 14 | error analysis | 4-digit with a zero: what went wrong + correct answer |
| 15 | final | 4-digit mixed |

- **Four-digit items:** 4, 5, 6, 7, 8, 10, 11, 12, 13, 14 and 15, so 11 of 15.
- **During the test:** no hints, no feedback, optional regroup marks.
- **Scoring:**
  - Each item is worth 1 point and must be fully right.
  - Results report **final answers** (items 1–9 and 15, plus the correct-answer parts of 13–14) separately from **regrouping steps** (10–11), the decision (12) and error analysis (the "what went wrong" parts of 13–14).
  - Overall % and mastery bands use the existing 90/70 convention.
- **Results:** they never name a misconception from a wrong final answer. They name only the item's category, from the blueprint, and link to that skill's targeted practice.

## 7. Persistence (adapter; prefix `mathbook:v2:subtract-regrouping:`, every record `v: 1`)

| Key | What |
|---|---|
| `see-wizard` | `{ v, step, done, phase, checks }`. Same shape as the lessons, so the Math Lessons card shows Learn progress. |
| `guided` | Practice Together position and per-problem workspace states. |
| `setup` | Last setup choices. |
| `bank-sets` | `{ v, setup: { active, attempts } }`: the On My Own session (`order`, `items`, `responses`, `checked`), so Home's Continue finds it. |
| `skill-practice` | `{ v, 'skill-<id>': { active, attempts } }`: targeted sessions, apart from the full set. |
| `draft-test` | `{ v, seed, questions, items, responses, pos }`: the unfinished test. |
| `attempts` | `[{ v, testId: 'test', at, score, total, pct, parts: { final, steps, decide, errors } }]`: the catalog progress uses `pct`. |

Every read is validated by structure and value: types, ranges, digits, and arrays of the right length. A bad record is dropped on its own and the screen shows a fresh start; other records and other sections are untouched. Reset (with confirmation) removes only this prefix.

## 8. Menu and integration

- **Catalog entry**, right after 2-15: `{ id: 'sr', short: '−', title: 'Subtract with Regrouping', supplemental: true, path, key, steps: 9, tests: [['test', 'Regrouping Test']], label: 'Subtract with Regrouping' }`. The structure tests skip `supplemental` entries.
- **Demo page:** `dev/subtract-demo/index.html`. It is not linked from any child page and loads only the component files: two instances, export/restore, destroy, a theme switch and a test-mode instance.
- **Integration README:** `docs/supplemental/subtract-regrouping/INTEGRATION.md`.
