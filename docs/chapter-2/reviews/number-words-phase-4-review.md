# Number Words Phase 4 (100–9,999): independent review

- **Build:** `claude/number-words-phase-4` at `d092879` (worktree `../Mathbook-nw`); main `b67910c` (2-15 live) merged in, diffed against it.
- **Read first:** `docs/chapter-2/number-words-phase-4.md`; the full diff (15 files); `number-words/phase-4/lesson.js` in full; the engine changes (`brand`) in `assets/js/lesson-app.js`; `assets/js/catalog.js` (`activities`); Home `index.html`; `number-words/program.js` and `number-words/index.html`; the new tests.
- **Reviewer:** single independent reviewer. I edited no app, lesson, engine or test file. This report is the only file committed.

## Verdict

**Ready to publish once NW4-01 and NW4-02 are fixed. Both are small wording fixes.**
- 0 critical, 0 major, 3 minor.
- NW4-03 is a pre-existing engine behaviour, not a regression; the coordinator decides whether to fix it now or defer it.
- The math, the word forms and the grading are correct:
  - every number 100–9,999 matches an independent word generator;
  - all 36 authored keys are right;
  - 15,000 sampled Learn checks gave no wrong key, no leak and no out-of-range number.
- Phase 1, the math lessons and Home behave as before.

## Evidence I ran (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 192/192 |
| `tests/number-words-phase-4.browser.mjs` | 74/74 |
| `tests/number-words.browser.mjs` (Phase 1) | 64/64 |
| `tests/lessons.browser.mjs nw-4` | 109/109 |
| `tests/browser.test.mjs` (Home + 2-1) | 198/198 |
| Reviewer Node sampler: words, grading matrix, keys, generators, choices | See sections 2 and 3 |
| Reviewer browser scripts: typed test, Home, reset scope, damaged data, brand regression, 7-size sweep | See sections 4–6 |

## 1. Requirements and interpretation

**Interpretation is reasonable:**
- The range is 100–9,999. Nothing in Phase 4 goes outside it: authored items run 248…9,300, and Learn samples never left 100–9,999.
- Phase 4 is built on the lesson engine. It is not a separate app: `number-words/phase-4/index.html` starts the lesson engine with `nw-4`.
- Phase 1 is untouched: `git diff b67910c -- number-words/phase-1 assets/js/questions.js assets/js/place-value.js assets/js/app-shell.js assets/css` is empty.

| Owner requirement | Status | Where |
|---|---|---|
| Inspect existing activity and tests first | Done | Decision record; Phase 1 test updated only for the now-open Phase 4 row |
| Guided examples linking numeral, place value, words | Met | Learn 1–4: place-value chart → place words → full words (135, 462/715, 2,137, 5,072/4,060) |
| Words → numeral and numeral → words | Met | Skills `towords`/`tonumber` (and `zwords`/`znumber` for zeros) in Learn, Practice Together, On My Own and Test |
| Internal zeros within range | Met | 0 hundreds, 0 tens, 0 ones and pairs: p5–p9, o5–o9, t5–t9; Learn 4 samples cover all six zero patterns |
| Feedback, retries, navigation, saved progress, reset | Met | Engine features, exercised by the 74 + 109 browser checks and by my reset/Home runs |
| Simple entry point | Met | Phase 4 row on `number-words/` with an Open button; Home Continue names it |
| Book wording | Met | "two thousand, one hundred thirty-seven" (comma after thousand, hyphen for tens-ones, no "and") |
| Normalize capitals/spacing/hyphens, optional "and"; reject wrong value or missing part | Met | Section 2 |
| Migrate old saves safely; reset only this activity | Met | No earlier Phase 4 saves exist: the phase was an outline with no `storageKey`, so nothing needs migrating. Reset scope is in section 4. Damaged-data note: NW4-03 |
| No separate app; no range extension | Met | — |

## 2. Math, word forms and grading

**Word forms:** `pv.numberToWords(n)` matches my own independent generator for every n from 100 to 9,999 (0 mismatches).

**Typed word answers.** `pv.checkWords` lowercases the answer, treats hyphens and dashes as spaces, drops commas and periods, and drops every "and".

Accepted (all correct):
- `Two Thousand, One Hundred Thirty-Seven`
- `two thousand one hundred thirty seven` (no comma, no hyphen)
- `  two   thousand ,one hundred thirty-seven. ` (extra spaces, final period)
- `two thousand, one hundred and thirty-seven`
- capitals with an en dash
- `five thousand and seventy-two`
- `three thousand, eight`
- `ONE THOUSAND, NINE HUNDRED`

Rejected (all correct):

| Kind | Examples |
|---|---|
| Wrong value | `…thirty-eight`; `seven thousand, nine` and `seven thousand, nine hundred` for 7,090 |
| Missing part | `two thousand, one hundred thirty`; `one hundred thirty-seven` for 2,137; `five thousand, seventy` |
| Misspelling | `fourty`, `eightteen` |
| Run-together words | `thirtyseven`, `twothousand`, `onehundred` |
| Zero places said | `five thousand, zero hundred seventy-two`; `nine thousand, zero hundred, zero, five` |
| Other | plurals `six hundreds` / `two thousands`; `nineteen hundred`; `a thousand, nine hundred`; digits `2137`; empty |

**Lenient but harmless.** These keep the value right, so they are not findings:
- Extra or misplaced "and"s are accepted, e.g. `…thirty-seven, and`.
- Hyphens between any words are accepted, e.g. `two-thousand-one-hundred-thirty-seven`.
- Periods between words are accepted.

**Typed number answers.** `pv.parseWholeNumber` accepts `3008`, `3,008`, `3 008` and padded spaces. It rejects `308`, `38`, `3,08`, `30,08`, `3.008`, `3008.` and words. Because spaces are removed anywhere, `30 08`, `3 0 0 8` and `03008` also read as 3,008. That is harmless.

**In the app:** a full test typed with mixed variants scored **12/12** and was saved as 12/12. The variants were:
- capitals with a final period;
- no comma and no hyphen;
- "and";
- all capitals;
- `3 471`, `8,006` and ` 409 `.

**Keys:** all 36 authored items (p1–p12, o1–o12, t1–t12) are correct:
- for `words` items, the stored answer is the numeral in the prompt;
- for `number` items, the words in the prompt are exactly the answer's words;
- for `mc` items, exactly one choice is the correct word form and all choices are different;
- for `place` items, the digit and the Yes/No answer are right.

**Learn generators.** I sampled 3,000 checks for each of the 5 steps, 15,000 in all:
- no leak, no wrong key, no demo number reused, nothing outside 100–9,999;
- step 2 has teens 34% of the time;
- step 4 covers 0 ones / 0 tens / 0 hundreds (about 30% each) and the pairs (about 3% each);
- step 5 always has 3 choices, with the answer in positions 938 / 984 / 1,078 of 3,000.

## 3. Teaching

- **Language is third-grade and follows the book.** Examples: "135 has 1 hundred, 3 tens and 5 ones."; "We don't say "zero hundred"."; "Without the 0s you would write 46, a different number. The 0s hold the places." The spelling tips (forty, eighteen) match Phase 1/3 notes.
- **Examples link numeral, chart and words:**
  - Each example shows the F4 place-value chart, then each place's words, then the whole word form.
  - Explanations repeat the link, e.g. "4,027 = 4 thousands, 0 hundreds, 2 tens, 7 ones. … 0 hundreds: not said."
  - At 320 px the chart turns into a vertical table and stays readable.
- **Zeros are taught before they are tested.** Learn 4 covers zeros in both directions (5,072; 3,405; 6,008; "four thousand, sixty → 4,060"). Learn 5 shows a moved place and a missing thousands. Practice and Test come after Learn.
  - Small gap, not a finding: words → number for a 4-digit number is first modelled in Learn 4 (4,060), not in Learn 2, which uses 3-digit numbers only. Practice p4 (8,246) follows that model, so this is acceptable.
- **Hints don't give answers away.** No hint contains an answer's words or digits. The Test has no hints.
- **Distractors are sound.** Each pick question has a place shift (a 0 dropped or two digits swapped) and a missing-part form. All of them are real misreadings, e.g. 2,805 → "two hundred eighty-five" / "eight thousand, two hundred five".
- **Answer positions are spread:**
  - authored Practice Together / On My Own picks: positions 3, 2, 1, 3;
  - test t10/t11 are reshuffled each attempt (400 attempts: 133/131/136 and 147/134/119);
  - Learn 5 is balanced (see above).

### NW4-01 (minor): the Yes/No question's wording gives away the answer

`placeQ` builds the second part with two different wordings:
- non-zero digit (answer Yes): `Do you say the tens in the words?`
- zero digit (answer No): `Do you say "tens" in the words?`

So the quotation marks appear exactly when the answer is No:
- p12 (3,705, tens) and **t12 (7,046, hundreds), a test item**, are quoted → No;
- o12 (5,038, tens) is not quoted → Yes.

A child who notices the quotes can answer without reading the digit.

**Fix:** use one wording for both cases, e.g. `Do you say the tens in the words?`.

Optional, same item: `How many tens?` for 3,705 could be read as "370 tens". `What digit is in the tens place?` (or `How many tens are in the tens place?`) would make it unambiguous. The Learn wording ("3 tens and 7 ones") supports the current reading, so this part is a suggestion only.

## 4. Saves and reset

- **Storage keys are separate:**
  - Phase 4 uses `mathbook:v2:number-words:phase-4:*`; Phase 1 still uses `mathbook:v2:number-words:phase-1:*`.
  - `clearAll` removes only keys starting with `prefix + ':'`. A decoy key `mathbook:v2:number-words:phase-4x:keep` survived the Phase 4 reset.
- **Phase 4 Reset (Parent Guide):**
  - It removed every Phase 4 key.
  - Every earlier key stayed byte-for-byte: the Phase 1 attempts and draft, Lesson 2-13 attempts, and the decoy.
  - The text reads: "Erase Number Words Phase 4's saved answers, Learn completion, and test scores on this device. Number Words Phase 1 and the math lessons are not changed."
- **The other direction:** clearing Phase 1's store left the Phase 4 attempts untouched.
- **Home Continue:** with an unfinished test it reads "Continue where I left off → **Number Words · Phase 4** · Number Words Test: 2 of 12 answered" and links to `number-words/phase-4/#test/words`. Phase 1's own Continue line ("Number Words · Spelling test") is unchanged.
- **Damaged data:**
  - Unreadable JSON (`{bad`) in any Phase 4 key is safe: no error on any screen or on Home.
  - Bad Phase 4 data does not affect Phase 1 or the Number Words page.
  - Valid JSON of the wrong shape is a different story; see NW4-03.

### NW4-02 (minor): Phase 4 results say "next lesson"

My Results for a mastered Phase 4 test says **"Next step: Ready to move on to the next lesson."** That text is `mastery()` advice in `lesson-app.js` line 30, which the `brand` option does not cover. Every other engine string on the Phase 4 screens I checked uses the brand words: Phase Menu, Reset Progress, "this phase", and no "Lesson".

**Fix:** use `THING` for the mastered advice when a brand is set ("…the next phase" or "…move on"). Lessons should keep their current text.

### NW4-03 (minor; pre-existing engine behaviour, not a regression)

Well-formed JSON of the wrong shape in a Phase 4 key throws on the screen that reads it, and that screen's content does not render. Examples: `"str"`, `5` or `[]` in `see-wizard`, `bank-sets`, `attempts` or `draft-words` (Learn, On My Own, Test, Results).

Lesson 2-13 behaves the same for `attempts`, `bank-sets` and `see-wizard` (6 / 6 / 6 failures), so this is how the engine already works, not something Phase 4 added.

Real old saves cannot trigger it, because Phase 4 never stored anything before this build. I list it because the request asks about damaged data.

**Fix if wanted:** shape guards in `store.get` callers, e.g. `Array.isArray(attempts)` and plain-object checks for `see-wizard` and `bank-sets`, falling back to empty. Deferring it is reasonable.

## 5. Regression from `brand` and catalog `activities`

- **Lessons keep every default.** Checked on Lesson 2-13:
  - title "Lesson 2-13: Compare 4-Digit Numbers · Mathbook";
  - crumbs "Grade 3 · Chapter 2: Place Value";
  - "Lesson Menu", "Parent Guide · how to teach this lesson";
  - Reset text "Reset Lesson Progress … Erase Section 2-13's … Other lessons and Number Words are not changed."
  - The 2-1 suite (198/198) and the nw-4 generic journey (109/109) pass.
- **Math Lessons list** (`math/`): 15 rows, 2-1 … 2-15, with no Number Words or nw-4 row. `renderLessonList` uses `lessons` only.
- **Home** iterates `lessons.concat(activities)`. Lessons still show as "Lesson 2-x" (`label` is absent on lessons). Phase 1's separate draft check is unchanged.

## 6. Devices (7 sizes)

**Sizes:** 320×640, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, 683×384.

**Screens:**
- the Number Words page;
- Phase 4 Menu and Parent Guide;
- Learn Example and Your Turn (step 1), and the Learn 4 zeros example;
- Practice, Practice Together, On My Own set;
- Test Q1 (typed words), Q10 (pick) and Q12 (Yes/No);
- My Results.

**Results:**
- No sideways scroll and nothing past the right edge on any screen.
- Every visible button and input is at least 44 px tall.
- No page errors.
- No focusable element inside hidden content. The only element flagged was the menu link on the Menu screen, which is `hidden` with `[hidden]{display:none !important}`, so it is not focusable.
- No "Lesson" in any Phase 4 screen text.
- Typed-answer input width at 320 px: 251 px. Long answers scroll inside the box, which is acceptable.
- **Number Words page:**
  - Phase 1 and Phase 4 are links (tabIndex 0).
  - Phases 2–3 are non-link `div`s (tabIndex −1, "Coming later · Outline only").
  - The how-it-works note explains Phase 4 and the accepted forms.
- **Screenshots reviewed:**
  - 320: Test Q1, Q10, Learn zeros;
  - 683×384: Learn Your Turn (Check Answer visible);
  - 768: Number Words page.

## Notes (no action required for this item)

- The Test's Parent Help says "Every new attempt uses new numbers". That is not true here: the Number Words Test is the same 12 questions with the choices reshuffled. This is shared engine text, also shown on Lessons 2-8 … 2-15, which use fixed tests. Consider a per-test override later.
- The landing page's "How each phase works" items 1–5 describe Phase 1 (e.g. "Test: 10 typed spellings"), and item 6 describes Phase 4. That is clear enough.

## Findings summary

| ID | Severity | Summary | Action |
|---|---|---|---|
| NW4-01 | Minor | Yes/No label quotes the place only when the answer is No (p12, o12, t12) | One wording for both cases |
| NW4-02 | Minor | Results say "Ready to move on to the next lesson." on Phase 4 | Brand the mastered advice |
| NW4-03 | Minor (pre-existing) | Wrong-shaped saved JSON blanks the screen that reads it (engine-wide) | Optional shape guards, or defer |

## Re-check (fix commit 37e17a7)

I compared commit `37e17a7` against my review commit `f4ef847`. Five files changed:
- `lesson-app.js`: 1 line;
- `phase-4/lesson.js`: the `placeQ` labels;
- the decision record;
- one unit test and one browser check.

| ID | Result | Evidence |
|---|---|---|
| NW4-01 | **Verified** | See below |
| NW4-02 | **Verified** | See below |
| NW4-03 | **Deferral accepted** | See below |

**NW4-01.** `placeQ` now uses a single wording, with no quotes: "What digit is in the {place} place?" / "Do you say the {place} in the words?"
- My sampler printed the labels: p12 (3,705, tens) → No; o12 (5,038, tens) → Yes; t12 (7,046, hundreds) → No. All read the same apart from the place name.
- On screen, test t12 reads "Look at 7,046. What digit is in the hundreds place? Do you say the hundreds in the words? Yes No".
- At 320×640 and 683×384, t12 has no sideways scroll and no control under 44 px.
- Answer keys are unchanged: 0/No, 3/Yes, 0/No.
- The new wording also settles the optional "How many tens?" point.

**NW4-02.** The advice line now runs `m.advice.replace('the next lesson', 'the next ' + THING)`. I finished real tests in the browser:
- Phase 4 at 100%: "Ready to move on to the next phase."
- Lesson 2-13 at 100%: still "Ready to move on to the next lesson."
- Phase 4 at 0%: the reteach advice is unchanged.
- No page errors.

**NW4-03.** I agree with leaving it for now:
- It is shared engine behaviour; Lesson 2-13 behaves the same.
- Phase 4 has no older saves that could trigger it.
- In my damaged-data runs, the Parent Guide (where Reset lives) still rendered.
- It is now recorded in the decision record as a remaining issue.

**No regressions:**
- `npm test`: 193/193.
- Phase 4 browser: 75/75, including the new NW4-02 check.
- `lessons.browser.mjs nw-4`: 109/109.
- `lessons.browser.mjs 2-15`: 109/109 (lesson defaults).
- Phase 1 browser: 64/64.
- The sampler still finds 0 word mismatches for 100–9,999, no bad keys, and no leaks in Learn.

**Note (pre-existing, shared, same family as the "new numbers" note above):** the reteach advice ends "Every new test uses different numbers." That is also not true for the fixed tests in Phase 4 and Lessons 2-8 … 2-15. No action is needed for this item.

**Result:** all findings are closed (NW4-03 deferred by agreement). Ready to publish.
