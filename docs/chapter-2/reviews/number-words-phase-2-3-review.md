# Number Words Phases 2 (11–20) and 3 (20–99) and the landing page: independent review

**Build:** `claude/number-words-2-3` at `6caf07c` (worktree `../Mathbook-nw23`). The diff against `55b51bd` is 19 files.

**What I read:**
- the decision record `docs/chapter-2/number-words-phase-2-3.md`;
- `number-words/words99.js`, both `lesson.js` files, `program.js`, the landing page and `parent/index.html`;
- the help-mode changes in `assets/js/lesson-app.js` and `assets/js/app-shell.js`;
- the new tests.

**Reviewer:** single independent reviewer. I edited no app, lesson, engine or test file; this report is the only file committed.

## Verdict

**Ready once NW23-01 and NW23-02 are fixed.** Both are small content fixes in `words99.js` that break two of the owner's stated rules. Everything else meets the requirements; the remaining findings are minor.

| Severity | Count |
|---|---|
| Critical | 0 |
| Major | 2 |
| Minor | 4 |

## Evidence

| Run | Result |
|---|---|
| `npm test` | 224/224 |
| `tests/number-words-2-3.browser.mjs` (builder's suite) | 78/78 |
| `tests/number-words-phase-4.browser.mjs` (regression) | 75/75 |
| `tests/number-words.browser.mjs` (Phase 1, regression) | 64/64 |
| `tests/lessons.browser.mjs 2-13` (lesson defaults, regression) | 109/109 |
| Reviewer Node checks (`node.js`) | 0 failures (details below) |
| Reviewer browser script, real CDP clicks and typing (`b1.mjs`) | 17/17, no page errors |
| Reviewer layout sweep and screenshots (`b2.mjs`) | 7 sizes × 8 screens; findings below |

**How the browser runs were done:**
- One headless browser at a time, in the foreground, closed after each run.
- When I checked, four `mathbook-chrome` processes were already running with a profile created at 12:54. That is before my first run, so they are not mine and I left them alone. No `gml-*`, `gm-*` or `ww-*` process was touched.

## 1. Number words and spellings: verified

- `pv.numberToWords` for 0–99 matches my own independent table, with 0 mismatches.
- The `VALUE` reverse map is right for all 100 numbers.
- **Every authored item is right:** 30 in Phase 2 and 36 in Phase 3, across Practice Together, On My Own and Learn.
  - Every answer key is correct.
  - Every word-choice option is the correct spelling of a real number.
  - Every "read" prompt prints the right word.
  - Every tricky-letter item blanks a letter of the right word.
  - Every fix item's misspelling really is a misspelling and not another number's word.
  - Every explanation names the right number and word.
- The Learn content matches the owner's list:
  - eleven and twelve as whole words;
  - thir-/fif- for thirteen and fifteen;
  - one t in eighteen;
  - the ones word + teen;
  - twenty as 2 tens;
  - the tens words, with thirty, forty, fifty and eighty as the tricky ones;
  - forty-two with a hyphen;
  - exact tens with no ones word ("forty-zero" shown as a mistake);
  - the 13/30, 14/40, 15/50 and 18/80 contrasts.

## 2. Teaching and practice coverage: verified

- **Every format is taught in Learn before it is practised.**
  - Phase 2 Your Turns: spell, spell, tricky, fix, read, match.
  - Phase 3 Your Turns: spell, tricky, match, spell, read, fix.
- **Practice covers every Phase 2 number:** Practice Together, Set A and Set B each contain all of 11–20.
- **Practice covers every Phase 3 tens word:** Practice Together, Set A and Set B each contain all eight tens words.
- **Phase 3 test:** in all 1,500 generated tests, every tens word appears, with at least 2 exact tens and at least 4 two-word numbers.

## 3. Grading: verified

- **Typed number words** (`pv.checkWords`):
  - Accepted: `forty-two`, `Forty-Two`, ` forty two `, `FORTY–TWO`, `Fourteen`.
  - Rejected: `fortytwo`, `fourty-two`, `forty` (for 42), `two`, `forty-three`, `forty-zero`, `forteen`, `eightteen`, `forty` (for 14), the digits `12`, and an empty answer.
  - Harmless extra leniency: `forty and two` and `forty. two` are also accepted.
- **Numbers** (`pv.parseWholeNumber`): empty or blank is unanswered, never 0. `014` and `1 4` read as 14, which is harmless; `14.` and `1,4` are refused.
- **Missing letter:** an uppercase or space-padded letter is accepted; two letters are refused; empty is unanswered.
- **Misspellings described as the wrong number:** I tested the authored misspellings plus every one-letter deletion, doubling or vowel/consonant swap of the key word for 11–99 (5,505 misspellings that are not real words). 5,504 got spelling feedback ("Check the spelling of …"). One authored misspelling is described as a different number: NW23-02.

## 4. Hints, Show Me, retries and continuing after help (real input): verified, except NW23-01

- **Learn** (Phase 2, step 1):
  - Typing "elevin" for 11 gives "Not quite. Check the spelling of "elevin"…" and **Try Again · Get a Hint · Show Me How**.
  - The typed answer stays, and Next stays locked.
  - Try Again focuses the answer box.
  - The hint doesn't contain the word.
  - "ELEVEN " (capitals, trailing space) is accepted, Next unlocks, and the step is done but **not** helped.
- **Learn Show Me** (step 2):
  - The answer is filled in and locked, explained, and marked "Completed with help".
  - Next unlocks, and the step is done + helped, with focus on the shown answer.
  - A refresh keeps all of this.
- **Learn tricky letter:**
  - A wrong letter gets "Not that letter…" plus the clue.
  - The right letter typed in uppercase is accepted.
- **Practice Together** (Phase 3):
  - "thirdy" for 30 gets spelling feedback, the answer stays, and Check · Hint · Show Me remain; the corrected word is accepted.
  - Show Me on 47 fills in "forty-seven", explains it, and says "Completed with help". It is saved as `reveal: true, helped: true`.
- **On My Own** (Phase 2, Set A):
  - A wrong answer gets "Not quite" with the answer kept, then a correction gets ✓.
  - One question was done with Show Me and one left wrong, giving **8 of 10**: the Show Me answer is not counted.
  - The record lists `helped: ["o6"]`, and the checked list says "Completed with help (Show Me). It does not count as correct on your own."
- **Practice One Skill** (fix): Check Answer · Hint · Show Me appear under each question.
- **Hint content:** across all 89 spelling hints (11–99), none contains the whole word.

## 5. Help kept apart from independent results: verified

- On My Own and Practice My Misses scores use `ownRight`, so answers seen with Show Me never count.
- Mastery and test scores come only from tests.
- My Results shows a separate "Learn and practice — Not part of any test score" card, e.g. "Practice Together: 0 of 12 on your own · 1 completed with help".
- Learn's helped count only includes steps that are also done.

## 6. Test integrity: verified

- **No help in the test.** The test has no Hint, Show Me or help controls. A wrong typed answer gets no feedback and no marks. Test items have no `hint` or `parent` text.
- **No duplicate tasks.** 1,500 tests per phase were all different, with no task repeated.
- **No spelling cues** under the rule the decision record sets: no question shows another spelling question's teen or tens word. One gap is NW23-03.
- **Results** (12 of 14, with two deliberate misses):
  - **Results by skill** is grouped as Number recognition (match, read) and Spelling (spell, tricky, fix).
  - "Mistakes to review (2)" shows each answer, the correct answer and why.
  - "Skills to review" has "Practice this skill" for the missed skill.

## 7. Navigation, saved progress, damaged data and reset: verified, except NW23-05

- Refresh keeps Learn (including a shown answer), Practice Together and On My Own work.
- **Damaged Phase 2 saves:** I wrote bad values into every key: see-wizard `step: 99`, guided `"junk"`, bank-sets `{ s1: 5 }`, attempts `[5, {…}]`, a bad draft, and `[]` for skill practice. All 10 Phase 2 screens rendered with no errors.
- **Reset Phase 2:** it removed only the `phase-2:` keys. Phase 1, Phase 3, Phase 4, Subtract with Regrouping and Lesson 2-13 records were kept byte-for-byte.

## 8. Help mode is opt-in: verified

- Phase 4 and Lesson 2-13 Your Turns show only their usual Check Answer, with no Hint or Show Me.
- The Phase 4 (75/75), Phase 1 (64/64) and 2-13 (109/109) browser suites pass unchanged.
- `HELP` gates every new engine branch I read.

## 9. Layout and screenshots

**Sizes:** 320×640, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, and 200% zoom (683×384 at 2×).

**Screens:**
- the landing page;
- the Parent Guide;
- Phase 2 Learn Example;
- Phase 2 Your Turn after a miss;
- Phase 3 Practice Together after a miss;
- Phase 3 On My Own after Show Me;
- Phase 3 Test;
- Phase 3 My Results.

**Checks:**
- No sideways scroll, no control under 44 px and no text under 13 px anywhere, except NW23-06.
- **Landing page:**
  - four cards, with Open always 20 px from the bottom of each card;
  - two columns at 768 px and wider, one column at 320, 390 and 200% zoom;
  - all four cards visible without scrolling at 1366×768, 1024×768, 768×1024 and 1920×1080;
  - "How each phase works" moved behind the Parent Guide link.
- **Screenshots I inspected:**
  - 1366 and 320 landing;
  - 768 Learn Example (blocks, "11 → eleven", the e-l-e-v-e-n line);
  - 320 Your Turn after a miss (retry row under the answer, feedback, locked Next with "Answer correctly, or use Show Me, to unlock the next step.");
  - 390 Practice Together after "thirdy";
  - 200% On My Own after Show Me;
  - 320 Test;
  - 1366 Results (results by skill, mistakes explained, help card);
  - 1366 Parent Guide.

  All were clear and readable, with nothing clipped.

## Findings

### NW23-01 (major): some missing-letter hints tell the child the missing letter

**Evidence.** The "complete the tricky spelling" hint is "Say the word slowly. " + the word's clue, and for five words the clue gives away the blanked letter:

| Item | Answer | Hint | Problem |
|---|---|---|---|
| `twel_e` | v | "…It starts with "tw", like two, and ends with "ve"." | Names the letter |
| `eigh_een` | t | "Eight already ends in t, so -teen does not add another t." | Names the letter |
| `eigh_y` | t | "Eight already ends in t, so just add y." | Names the letter |
| `th_rty` | i | "It starts like thirteen…" | Spells the letter |
| `fi_ty` | f | "It starts like fifteen…" | Spells the letter |

These items appear in Practice:
- Phase 2: On My Own o7 (18) and o18 (12).
- Phase 3: o10 (88), o21 (30), o22 (52, fifty-two).
- Phase 3 Learn step 2's Your Turn picks from 30, 40, 50 and 80, so 3 of its 4 problems are affected.

Tests are not affected, because test items have no hints.

**Failure scenario.** A child presses 💡 Hint and is told the answer. This breaks the owner's rule "hints never give the answer", and the item can then be checked as solved on their own.

**Fix.** Give tricky items their own hint (`trickyHint`) that points at the part without naming or spelling the letter. Examples:
- twelve: "Say twelve slowly: which sound comes just before the last e?"
- eighteen / eighty: "Think about how eight ends. Does the next part need another letter?"
- thirty / fifty: "Say it slowly and listen to the start: it is not three/five."

Add a unit test that the hint never contains the answer letter as a separate token and never spells a word sharing the blank's prefix.

### NW23-02 (major): "threety" is answered as if it were the number 3

**Evidence.**
- `wordsTip` for 30 with "threety" returns "That looks like the word for 3, not 30." I saw this in the browser in Practice Together: "Not quite. That looks like the word for 3, not 30…".
- "threety" is one of the two authored misspellings of thirty (`NOTES.thirty.wrong[0]`). It appears in the fix question for 30, and the Mistakes list names it.
- The closest-word match ties at "three" (distance 2) before reaching "thirty".
- It was the only one of the 5,505 misspellings I tested that was described as a different number.

**Failure scenario.** The most common thirty mistake, the one the lesson itself teaches, is told it is the wrong value. That breaks the rule "a misspelling must not be described as a wrong value".

**Fix.**
- Before the closest-word step, check each word's authored `wrong` list and answer "Check the spelling of …" with that word's clue.
- Or give the closest-word search a tie-break that prefers words with the same ending (-ty / -teen).
- Add the authored misspellings to the unit tests (each must get "Check the spelling").

### NW23-03 (minor): Phase 3 tests can show the ones word of a two-word spelling answer

**Evidence.**
- `testOK` keeps every spelling question's *teen or tens* word off the rest of the test.
- But the ones word of a two-word answer can still appear elsewhere. Example: "Write 47 in words" alongside a read question for "twenty-seven", which prints "seven".
- In 1,500 generated Phase 3 tests this happened 3,926 times, about 2.6 per test.
- Phase 2 isn't affected, since its answers are single words.

**Failure scenario.** A child copies "seven" from another question. This only affects the Phase 1-level ones word, not the tens word Phase 3 teaches, so the risk is small. But the owner's rule is stated generally: "no question may print another question's spelling".

**Fix.** Either extend `testOK` to cover the ones word of two-word spelling answers (choose read/match numbers whose ones differ), or record in the decision record that only the tens/teen word is protected.

### NW23-04 (minor): some Learn Your Turns are the worked example just shown

**Evidence.**

| Step | Example | Your Turn | Chance of the same item |
|---|---|---|---|
| Phase 2 step 3 | "th _ rteen" with the answer i | `trickyQ` for 13 or 15 | 1 in 2 |
| Phase 3 step 2 | "fo _ ty" with the answer r | 30 / 40 / 50 / 80 | 1 in 4 |
| Phase 2 step 4 | the "eightteen" fix | 18 is one of 5 numbers, with "eightteen" as one of its 2 misspellings | 1 in 10 |

Phase 3's fix step already avoids its own example numbers (46, 83).

**Fix.** Exclude the example's item from these three Your Turn generators, as Phase 3's fix step already does.

### NW23-05 (minor): one bad field in the Learn record erases all Learn progress

**Evidence.**
- `sanitizeSaved` removes the whole `see-wizard` record whenever `step` is out of range (or `done`/`checks` aren't objects).
- With `step: 99` and two good completed steps, the record after loading had `done: {}`, so both completed steps were lost.
- `seeView` already resets a bad `step` to 0, and the other fields are repaired entry by entry, so the record could have been kept.
- Practice Together (`guided`) behaves the same way for a bad `i`.

**Fix.** Repair instead of removing:
- set `step` to 0 when it is out of range;
- replace a non-object `done`/`checks` with `{}`;
- set `guided.i` to 0.

Remove the whole record only when it isn't an object at all.

### NW23-06 (minor): the Parent Guide's "Number Words" link is a small target

**Evidence.**
- On `number-words/parent/`, the header link back to Number Words ("Number Words · Parent Guide") is 21 px tall at every size from 768 px up.
- On phones the header hides it, and the page's own "← Number Words" button (48 px) is the main way back.

**Fix.** Give the header link the same padding and height as `.home-link`, or rely on the bottom button and make the header text plain.

## Notes (no action required)

- Number parsing accepts `1 4` as 14, and spelling accepts an extra "and" ("forty and two"). Both leave the value unchanged.
- The landing page's Parent Guide link sits just below the fold at 1366×768. All four cards are visible, which is what the requirement asks.
- After a test that was saved and reopened, My Results says "This test was paused and resumed 2 times." This is existing engine wording and is correct; it could move into the Parent Help area now that these results are aimed at children.
