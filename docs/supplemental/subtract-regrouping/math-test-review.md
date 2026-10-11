# Subtract with Regrouping: independent math/testing review (Phase 1, Node only)

- **Build:** `claude/subtract-regrouping` at `c696fa6`, worktree `../Mathbook-sr`.
- **Read:** `SPEC.md`, `DESIGN.md`, `INTEGRATION.md`; `assets/js/subtract/sub-math.js` and `sub-workspace.js` in full; `curriculum/supplemental/subtract-regrouping/content.js` and `app.js` in full; the three test files.
- **Reviewer:** the independent math/testing agent. I edited no app, content or test file; this report is the only file committed.
- **Scope:** Node only, as asked; I started no browser. Phase 2 (browser checks of persistence, reset, two instances, restore, destroy and test isolation) waits for the coordinator.

## Verdict

**The math is correct.** Every answer, exchange, difficulty label and answer key I checked matches my own independent routines. I checked:
- the spec examples, every Learn example and the 8 Practice Together problems;
- 858,783 operand pairs, including every pair up to 999;
- every practice-setup combination over 40 seeds each;
- 2,000 tests and every generator.

**Two areas need fixes before release:**
- **Saved-data recovery (SR-M01, SR-M02, both major).** One bad value can still erase good progress, or stop a screen from rendering. The spec forbids both.
- **Hints and feedback (minor).** Several rough edges, listed in the summary table.

**Totals:** 0 critical, 2 major, 8 minor, plus notes.

**Baseline:** `node --test tests/subtract-math.test.js tests/subtract-regrouping.test.js` gives 17/17.

**My tools** (scratchpad scripts, not committed):
- `oracle.js`: my own column subtraction with an explicit borrowing chain, a string-addition check, my own simulation of each mistake, and BFS enumeration of every regrouped form;
- `persist.js`: loads `app.js` in Node with a stubbed shell and in-memory storage, and calls the screens directly;
- `extra.js` and `lead.js`: targeted probes.

Expected results never come only from the functions under test.

## 1. Fixed examples: verified

| Problem | Answer (mine, and checked by addition) | Difficulty (mine) |
|---|---|---|
| 4,352 − 2,126 | 2,226 | easy |
| 4,532 − 1,768 | 2,764 | medium |
| 3,002 − 1,578 | 1,424 | hard, chain 2 |

**The four lines for 3,002** come out of `plan` + `describe` exactly as the spec gives them:
> 3 thousands, 0 hundreds, 0 tens, 2 ones | 2 thousands, 10 hundreds, 0 tens, 2 ones | 2 thousands, 9 hundreds, 10 tens, 2 ones | 2 thousands, 9 hundreds, 9 tens, 12 ones

These match my own stage list.

**Learn examples** (all answers verified):

| Step | Problems |
|---|---|
| One exchange | 52 − 27 = 25 (easy); 463 − 128 = 335 (easy) |
| More than one exchange | 532 − 168 = 364 (medium) |
| Four-digit numbers | 4,352 − 2,126; 4,532 − 1,768 |
| Across one zero | 4,305 − 1,268 = 3,037 (hard, chain 1) |
| Across zeros next to each other | 3,002 − 1,578 |
| Do I need to regroup? | 6,487 − 2,135 = 4,352 (no regrouping); 5,264 − 1,839 = 3,425 (medium) |
| Find and fix mistakes | Ivy's 4,635 is the smaller-from-larger result. Leo's 1,534 is the "zeros left as 10" result. Both notes' reasoning is right. |
| Check with addition | 3,002 − 1,578 |

The three "value" examples keep their value: 52 → 4 \| 12; 3,002 → 2 \| 10 \| 0 \| 2; 436 → 3 \| 13 \| 6.

**Practice Together:** all 8 answers and kinds are right:
- 83 − 47 = 36 (easy)
- 652 − 318 = 334 (easy)
- 724 − 386 = 338 (medium)
- 6,483 − 2,157 = 4,326 (easy)
- 5,316 − 2,758 = 2,558 (medium)
- 7,405 − 3,168 = 4,237 (hard, chain 1)
- 6,003 − 2,847 = 3,156 (hard, chain 2)
- 800 − 356 = 444 (hard, chain 1)

## 2. Exchanges: verified

I ran 20,000 random exchanges on 2–4 places with amounts 0–24, so amounts above 9 were covered. 7,440 of them were valid.
- Every valid exchange keeps the value. The giving place drops by 1, the receiving place rises by 10, and no other place changes.
- The input is never mutated.
- These are refused with nothing changed: giving from 0; place 0, a negative place or a place past the end; and a non-integer place (`1.5`, `'1'`, NaN, null).
- `canExchange` agrees in every case.
- In `plan`, every exchange is between neighbouring places (`from − to = 1`) and keeps the value.
- Chains go through each zero one place at a time, matching my stage list (e.g. 3,002: Th→H, H→T, T→O).

## 3. The standard method: verified

I compared `plan` and `classify` with my own routine on 858,783 pairs:
- every pair with top ≤ 999;
- 300,000 random 4-digit pairs;
- every bottom number for 14 zero-heavy tops (1,000, 3,002, 9,009, …).

There were 0 mismatches in:
- the answer, which also passed the addition check (answer + bottom = top, digit by digit);
- the exchange order;
- the final amounts;
- each column digit, always 0–9;
- the difficulty, chain length and exchange count.

## 4. Difficulty and sessions

- **Classification is correct, and the supported combinations follow from it.** Exhaustively:
  - 2-digit problems can only be no-regrouping or easy, so 2-digit Medium and Hard are correctly unavailable, each with a clear reason.
  - 3-digit problems reach every level, but their chain is never longer than 1.
- **Interpretation note:** a zero in the column that *needs* the exchange is not "passing through" a zero. For example, 3,050 − 1,204 is medium. This matches the spec's wording ("an exchange chain through … zero-valued places").
- **`generateSession`** I ran every size × difficulty × length (10/25/50) over 40 seeds each:
  - Unavailable pairs return no items and the reason.
  - Every other session has exactly the asked length, the asked size and the asked difficulty (by my classifier).
  - No duplicate pairs; top ≤ 9,999; bottom ≤ top.
  - Mixed size is always at least half 4-digit (about 5.7 of 10, 14.6 of 25, 28.3 of 50).
  - Mixed difficulty has the supported levels in a steady mix, plus a no-regrouping problem every sixth question.
- **Variety:**
  - **Exchange positions:** 4-digit Easy gives from the tens, hundreds and thousands about evenly (120/144/136 per 400 problems).
  - **Zero patterns:** Mixed sessions use 8–14 patterns. Hard 4-digit with chain 1 puts the zero in the tens (901), the hundreds (656), or both (443).
  - **Zero answers:** they appear only through Mixed difficulty (equal numbers). Only 6–10 of 40 ten-question Mixed sessions contain one, rising to 37–38 of 40 at 50 questions. That meets "belong in the mixed category"; see the notes.

## 5. Grading

- **`readAnswer`:**
  - empty, all-blank, null or whitespace → `empty`, never 0;
  - `['0']` → 0;
  - a gap (`4,'',2` or `'',2`) → `incomplete`;
  - leading zeros (`0,0,0,0`, `4,2,0,0`) → accepted;
  - `a`, `12`, `-1`, full-width digits, `x` → `invalid`.
- **`gradeFinal`** takes only the answer digits, so annotations can never affect it. In the app, a correct final answer with a deliberately wrong mark (`{0:[99]}`) is still graded correct.
- **`checkAmounts`:**
  - I enumerated every form reachable by forward exchanges for 300 problems (149,913 forms).
  - Each one is accepted exactly when it covers every column, and it always keeps the value.
  - 71,575 accepted forms are not the standard final form. Valid alternatives are accepted.
  - Value-changing forms (+10 with no −1) and malformed arrays are refused.
- **`evaluateWork`:**
  - 2,930 random valid exchange sequences were all `valid`, never `invalid`.
  - The `standard` flag matched my stage list in every case.
  - 2,546 were non-standard and labelled "a different valid way".
  - Named mistakes it recognises:
    - 4,532 − 1,768 with ones 12 only → `no-reduce`;
    - 3,002 marked 2/10/10/12 → `zero-ten`;
    - 3,002 marked 2/·/·/12 → `skip-zero`;
    - 4,305 marked hundreds 2, ones 15 → `skip-zero`.
  - One gap: SR-M05.
- **`diagnose`:**
  - Ivy's work (no marks) names `smaller-from-larger` in the hundreds. The ones digit happens to be right, since 9 − 4 = 14 − 9.
  - 4,352 − 21 answered 2,252 names `misaligned`.
  - Using the original thousands with marks (4,532 − 1,768 → 3,764) names `original-digit` at the thousands; 6,483 − 2,157 does the same at the tens.
  - Without marks, the same answer only gets "look again at the thousands". That is right: the work alone doesn't show the cause.
- **`buggyWork`:** checked against my own simulation of each mistake on 40,000 random problems (about 32,000 items each for smaller-from-larger, no-reduce and original-digit; about 3,000 each for zero-ten and misaligned). Each simulated mistake is that mistake, and its answer always differs from the right one. The one exception is the unreachable edge case in SR-M10.

## 6. Hints

- In 20,000 sampled states (random problems, 0 to all columns already filled), level 1 never contained the final answer.
- Level 1 always targets the first unfinished column.
- Level 2 never contains the answer.
- Level 4 gives only that column's digit.
- Level 5 is the full solution and is only shown on request (`S.hint` 5 behind "Show the full solution").
- 3,002 − 1,578 reads well. Level 3 is "Exchange 1 thousand for 10 hundreds. Exchange 1 hundred for 10 tens. Exchange 1 ten for 10 ones. Now the top number is 2 thousands, 9 hundreds, 9 tens, 12 ones."
- One problem with the levels' order: SR-M04.

## 7. The test

- **Shape.** Over 2,000 attempts every test has:
  - 15 items, 11 of them 4-digit;
  - every required kind (final answers, regrouping steps, a decision and error analysis);
  - single-zero and consecutive-zero cases every time: t7, t9 and t10 have chain 1; t8 and t11 have chain 2; t14 has chain 1 in 355 and chain 2 in 145 of 500.
- **No repeats.** No duplicate pairs within an attempt, and all 2,000 attempts were different.
- **Every key is right (my oracle):**
  - decide: Yes/No and the first column;
  - mistake: the wrong answer is my simulation's result for that mistake;
  - in all 2,000 attempts, no other offered mistake produces identical work, so there is no ambiguous error-analysis item.
- **Adapter `grade()` and `answered()` are right for every kind:**
  - **sub:** right digits → correct; right digits with wrong marks → still correct; empty → not answered.
  - **steps:** the standard regrouped amounts → correct; +10 without −1 → wrong; no marks → not answered.
  - **decide:** both choices needed; a wrong Yes/No → wrong.
  - **mistake:** needs the right reason *and* the right answer, and the two are scored as separate parts (`parts.mistake` and `parts.final`).
  - **check:** right reason and answer → correct; a wrong reason → wrong.
  - **exchange:** `4/12/Yes` and `04/12/Yes` → correct.
- **Reporting meets the spec:**
  - `finishTest` totals final answers separately from regrouping steps, the decision and error analysis.
  - The test uses no hint or diagnosis code: test-mode workspaces turn hints and Check off whatever the options say.
  - Results list missed questions by their *kind* and the child's entry ("These links come from the kind of question, not from a guess about the mistake"), so no misconception is diagnosed from a final answer alone.

## 8. Learn and targeted generators: verified

- **Learn.** All 9 Your Turn generators return their step's kind every time (300 seeds each). Problems are of the right level:
  - One exchange: easy, 2–3 digits;
  - More than one exchange: medium;
  - Four-digit numbers: easy or medium, 4-digit;
  - Across one zero: chain 1, 4-digit;
  - Across zeros next to each other: chain ≥ 2.
  - Distinct problems per 300 seeds are 294–300, except the value step: 80 numbers, which is plenty for a one-exchange item.
- **Targeted skills.** All 7 skills always give 6 items with no duplicates and the right kind (200 seeds each, 1,171–1,200 distinct problems):
  - Across one zero: chain 1, mixing 3- and 4-digit;
  - Across zeros next to each other: chain ≥ 2;
  - Four-digit regrouping: easy, medium and hard;
  - Do I need to regroup?: half need regrouping, half don't, 3- and 4-digit;
  - Find and fix mistakes: every mistake kind, including misaligned.
- One variety gap: SR-M09.

## 9. Persistence (code reading and a Node probe)

**Verified:**
- Every key is under `mathbook:v2:subtract-regrouping:`, and every record carries `v: 1`. The keys are `see-wizard`, `guided`, `bank-sets`, `skill-practice`, `draft-test`, `attempts` and `setup`.
- Reset uses the shared `bindClear` (only the `prefix + ':'` keys). It also removes Home's activity pointer when it points here.
- Targeted progress (`skill-practice`) is stored apart from full sessions (`bank-sets`).
- Workspace states, choices and Learn/Practice responses are validated by structure and values where they are *displayed*. `SK.validState` checks top/bottom, place indexes, values 0–99, digit text and sizes.
- Each key is read on its own, so one bad key never affects another key.

### SR-M01 (major): one bad value discards a whole record, and the next save overwrites the good progress in it

**Evidence.** `read(key, valid, fallback)` validates the *whole* record. If anything inside fails, it returns a fresh default, and the next `save` writes that default over everything that was there. My Node probe (`persist.js`) showed:
- **attempts:** three attempts, one with `pct: "eighty"`. My Results shows "Take the Regrouping Test to see your results", so all three are hidden. After the next finished test, `finishTest` saves `[]` + the new attempt, so the two good attempts are gone.
- **skill-practice:** skill-one and skill-multi histories were good, but `skill-zero1.active` was `"broken"`. Opening "Across zeros next to each other" left only `skill-zeros2`; the other skills' histories were erased.
- **see-wizard:** 5 steps done, but one `phase` value was `"oops"`. Results showed "Learn: 0 of 9". The next Learn click saves the default, and the completion is lost.
- **bank-sets:** a bad active run plus 2 finished sessions. Results reported 0 sessions, and starting a new session overwrites the history.

**Failure scenario.** One field is damaged: a partial write, an older or future record format, or a browser extension. The child then loses all earlier test results or skill history the next time they use the section. This is what the spec forbids: "Malformed records are recovered safely, without … erasing unrelated progress."

**Fix.** Validate the entries inside a record one by one and keep the good ones:
- filter `attempts` with `validAttempt` instead of `every`;
- validate each `skill-*` entry separately;
- validate `see-wizard`'s `done`, `phase`, `ex` and `checks` per key, dropping only the bad keys;
- keep `bank-sets.setup.attempts` when only `active` is bad (set `active: null`).

Add a unit test that mixes good and bad entries and checks that the good ones survive a save.

### SR-M02 (major): values the record check does not look at can stop a screen from rendering

**Evidence** (Node probe, each a thrown error during the screen's render):

| Damaged value | Where it fails | Error |
|---|---|---|
| An attempt item with an unknown `skill`, no `id`, or `null` (`validAttempt` checks `Array.isArray(items)` only) | My Results (`SKILL[x.skill].title`, `x.id.slice`, `x.correct`) | throws |
| A draft response `{ ws: { d: '12' } }` (`validDraft` doesn't check responses) | The **Take a Test menu** (`answeredById` → `answered` → `readAnswer`) and the test review screen | `(digits \|\| []).map is not a function` |
| A run's `results` entry that is a number | The next answer (`rr.tries += 1`) | `Cannot create property 'tries' on number` |

**Failure scenario.** Because the Test menu itself throws, the "Start a new test" button on that same screen never appears. The child is stuck until a parent finds Reset in the Parent Guide, which erases everything. The spec says malformed data must be recovered "without blanking the page".

**Fix:**
- run `validResponse` (or a shape check) before `answered`/`grade` in `answeredById`, the review list and `finishTest`;
- check each attempt item (`id` matches `/^t\d+$/`, `SKILL[skill]` exists, `top`/`bottom` are integers, `correct` is a boolean) and drop bad ones;
- check `results` entries (`correct`/`firstTry` booleans, `tries`/`hints` non-negative integers) and drop bad ones.

### SR-M03 (minor): Home's Continue count disagrees with the section's own count

**Evidence.**
- Home's `nAnswered` falls back to its generic `count()` when a save has no `answered` list.
- For the adapter's response shape (`{ p: [], d: [...] }`), Home counts a question as answered as soon as one box has something.
- The section's own Test menu uses `answered()`, which needs a complete answer.

**Failure scenario.** The child types one digit of a 4-digit answer, or answers only "Does it need regrouping?". Home says "Regrouping Test: 3 of 15 answered", while the Test menu says "Continue the test (2 of 15 answered)". This is the same kind of mismatch fixed for the lessons in L26-01.

**Fix:** save `answered: [ids]` in `draft-test` (and in practice runs) whenever a response changes, using the adapter's `answered()`. Home already prefers that list.

## 10. Portability (code reading)

**Verified:**
- `sub-math.js` has no DOM, storage or host references.
- `sub-workspace.js` uses only `window.SubtractKit`. It has no Mathbook globals, routes, lesson ids or storage, and no document- or window-level listeners.
- Its five listeners (click, change, input, keydown and focusin) sit on the host element with an `AbortController` signal.
- `destroy()` aborts them, clears handlers and markup, removes its classes and `data-sk`, and destroys its mini solution view.
- Ids are `sk<n>` from a module counter (`sk<n>-q`, `sk<n>-live`), so two instances can't collide.
- Event handler errors are caught.
- **Test mode:** `allowHints`/`allowCheck`/`allowSolution` are true only in `independent` mode. `check()` returns silently in test mode, and the live region is muted in test mode. Test mode can't expose hints whatever the options say.

I'll confirm all of this in rendered pages in Phase 2. A small point: `destroy()` leaves any `theme` CSS variables on the host element.

## Other findings (minor)

### SR-M04: hint levels are counted for the whole problem, not per column

**Evidence.** `S.hint` is one counter (1–4, then 5 = solution), and `M.hints` re-targets the first unfinished column on every press. For 4,532 − 1,768:
1. Hints 1 and 2 are about the ones.
2. The child fills in the ones.
3. The next press shows level 3 *for the tens* ("Exchange 1 hundred for 10 tens …").
4. The press after that shows level 4: "Tens: 12 − 6 = 6. Write 6 in the tens."

The tens never get levels 1–2. "Earlier hints" is recomputed for the new column, so it no longer shows what was actually said. After 4 presses in total only the full solution is left.

**Failure scenario.** A child who used two hints on the ones gets the tens digit handed over after two more presses, skipping "which column / where can it come from". That works against the spec's progressive 1 → 5 order.

**Fix:** store the hinted column with the level. When the first unfinished column changes, restart at level 1 for that column (or keep the earlier column's texts in the history). Keep level 5 for the whole problem.

### SR-M05: "added 10 without reducing" isn't named when the place on the left is 0

**Evidence.** For 3,002 − 1,578 with only `ones: 12` marked, `evaluateWork` returns `changed-value`, which `diagnose` drops. The child gets no feedback about the marks; only "look again" at the digits appears, plus a `smaller-from-larger` guess for the hundreds. The `no-reduce` rule requires `orig[r+1] > 0`, and `skip-zero` requires a −1 somewhere.

**Failure scenario.** The most common zero mistake (adding 10 to the ones in 3,002 without taking from anything) gets no specific feedback, although the spec lists "Adding 10 without reducing the supplying column".

**Fix:** if some place rose by 10 and no place went down, return `no-reduce` for that place, whatever is on its left.

### SR-M06: in guided mode, valid alternatives get a ✗

**Evidence.** In `guidedAct`, choosing a farther place that has something to give, or saying Yes to an exchange that isn't needed, calls `guidedFeedback(false, …)`. That shows ✗, while the text says "That could work too…" / "You could exchange, and the value would stay the same…". The `step` event carries `valid: true`.

**Failure scenario.** The child sees a ✗ for a mathematically valid choice, against "A different valid exchange sequence is not a mathematical error". The design agent may want to weigh in on the marker.

**Fix:** use a neutral marker (e.g. ↺ or "Try the nearest place") when `valid` is true, and keep ✗ for real errors.

### SR-M07: guided mode makes the child type leading zeros

**Evidence.** Guided mode runs every column up to the top number's length, and the digit step needs `/^\d$/`. Over 1,000 seeds each, these share of guided Your Turns have an answer shorter than the top number, so the child must type a leading 0:
- One exchange: 177 (e.g. 23 − 19 → "04");
- More than one exchange: 158 (210 − 186);
- Four-digit numbers: 106 (5,407 − 5,035 → "0372");
- Across one zero: 124;
- Across zeros next to each other: 147 (1,000 − 857 → "0143").

Practice and the test accept a blank instead.

**Failure scenario.** The spec says "Optional leading zeros are accepted but not required". Guided mode requires them, and on 1,000 − 857 the child is asked "Thousands: 0 − ? = ?".

**Fix:** when the remaining columns have top amount 0 and no bottom digit, finish the guided problem, or accept a blank there, and say "No thousands are left, so the answer starts in the hundreds."

### SR-M08: Practice Together "New problems" keeps tips written for the fixed set

**Evidence.** `togetherSet(seed)` regenerates each problem with the same size and difficulty, but Parent Help still shows `togetherTips[i]`. Over 500 new sets:

| Tip | Doesn't fit | Example |
|---|---|---|
| 2: "which place is just to the left of the ones?" | 283 | 515 − 174: only the tens need an exchange |
| 5: "the tens gave 1 away…" | 138 | 4,845 − 863 |
| 6: "the tens has 0…" | 167 | 7,020 − 4,781: the zero is in the hundreds |

**Failure scenario.** The parent reads a prompt that is wrong for the problem on screen.

**Fix:** either constrain regeneration to keep each tip's feature (the ones need an exchange; the tens give; a zero in the tens), or make tips generic or build them from `plan`.

### SR-M09: error-analysis items for three mistakes always use one-exchange problems

**Evidence.**
- `mistakeFor` tries `difficulty: k % 2 ? 'medium' : 'easy'` with its own loop counter starting at 0, so the first try is always easy, and easy almost always succeeds.
- Test item t13 was easy in 500 of 500 attempts.
- The Find and fix mistakes skill gave easy 800 of 800 times for those three mistakes (no medium).
- The Learn Your Turn behaves the same.

**Failure scenario.** "Original digit after regrouping" and "added 10 without reducing" are never practised or tested on problems with two or more exchanges, which is where they usually happen.

**Fix:** pick easy or medium with `r()`, or with the caller's index, and keep the fallback.

### SR-M10: `buggyWork('misaligned')` can return the right answer

**Evidence.** When the bottom number is 0, `shift = size − 1` and `top − 0·10^shift = top`, which is the correct answer. The `answer === top − bottom → null` guard is missing on this branch (16 cases in my sample, e.g. 3,726 − 0).

**Failure scenario.** None today: generated bottoms are never 0, except for equal numbers, which `mistakeFor` doesn't use. A host calling the component API with bottom 0 would get a "mistake" item whose wrong answer is right.

**Fix:** add the same guard (`if (wrong === top − bottom) return null`).

## Notes (no action required)

- **Zero answers and equal numbers.** Only Mixed difficulty has them, and only about 1 in 4 of its no-regrouping questions. A 10-question Mixed session has one zero answer in only 6–10 of 40 sessions. Consider guaranteeing one equal pair per Mixed session.
- **Lenient grading that never changes the value.** `readAnswer` accepts extra blank-left boxes and leading zeros, and the exchange item accepts `04`.
- **Final-answer accuracy.** A mistake item's answer counts in the "Final answers" row as well as in "Finding mistakes", which seems intended. The item is only correct when both parts are right.

## Summary table

| ID | Severity | Area | Summary |
|---|---|---|---|
| SR-M01 | Major | Persistence | One bad value hides a whole record; the next save erases the good entries in it (attempts, skills, Learn, sessions) |
| SR-M02 | Major | Persistence | Unchecked attempt items, draft responses and run results stop My Results, the Test menu, the review or answering from working |
| SR-M03 | Minor | Persistence/Home | Home's Continue counts partly answered questions; save an `answered` list |
| SR-M04 | Minor | Hints | One hint counter per problem: a new column starts at level 3–4, and "Earlier hints" are rewritten |
| SR-M05 | Minor | Feedback | +10 with nothing reduced isn't named when the left place is 0 |
| SR-M06 | Minor | Guided | Valid alternative choices are shown with ✗ |
| SR-M07 | Minor | Guided | Leading zeros are required in guided mode (11–18% of guided Your Turns) |
| SR-M08 | Minor | Practice Together | Tips don't fit regenerated problems (17–57% of new sets, by tip) |
| SR-M09 | Minor | Variety | Error-analysis items for three mistakes always use one-exchange problems |
| SR-M10 | Minor | Component API | `buggyWork('misaligned')` with bottom 0 returns the right answer (unreachable in the app) |

Phase 2 (browser checks: persistence, reset, two instances, restore, destroy, test isolation) is pending the coordinator's go-ahead.

## Phase 2 (browser) and re-check (build 7bd015f)

**Scope:** fixes in `1df0bc5` (SR-M01…M10), plus the design rewrite of `sub-workspace.js` (98748ae, f41cdc2).

**How I tested:**
- One headless browser at a time, in the foreground; no Chrome left running afterwards.
- Real CDP mouse clicks (`Input.dispatchMouseEvent`) and typing (`Input.insertText` plus Tab) wherever input behaviour matters: guided decisions and exchanges, regroup marks, answer digits, hints, Check, setup, test navigation and Reset.
- Bulk test answers were filled by script, with values from my own oracle.
- No app, content or test file was edited.

**Scripts** (scratchpad, not committed):
- `oracle.js`, `extra.js`, `tips2.js`, `persist.js` (Node);
- `p2a.mjs` and `p2b.mjs` (the section);
- `p2c.mjs` (`dev/subtract-demo/`).

**Results:**
- The builder's unit tests: 19/19.
- My Node oracle again shows no math mismatches on 858,783 pairs. The one remaining flag was my own test's fault: an error-analysis item whose right answer is 9, so typing 9 as a deliberately wrong answer was actually right.
- All three browser scripts ran with no page errors.

### Re-check of SR-M01 … SR-M10

| ID | Result | Evidence |
|---|---|---|
| SR-M01 | **Pass** | See below |
| SR-M02 | **Pass** | See below |
| SR-M03 | **Pass** | See below |
| SR-M04 | **Pass** | See below |
| SR-M05 | **Pass** | See below |
| SR-M06 | **Pass** | See below |
| SR-M07 | **Pass** | See below |
| SR-M08 | **Pass** | See below |
| SR-M09 | **Pass** | See below |
| SR-M10 | **Pass** | See below |

**SR-M01: one bad value no longer wipes a record.** The new sanitizers clean records entry by entry. I injected good and bad entries into every key, then triggered real saves:
- **attempts:** 4 attempts, one with `pct: "eighty"` and one with bad items. My Results shows "Earlier attempts (2)" plus the latest. After a real finished test, the saved history is 1, 2, 4 (the bad items removed) + the new 15/15. Only attempt 3 was dropped.
- **skill-practice:** skill-one and skill-multi histories survive; only the `'broken'` active run, the bad attempt and the unknown `skill-nope` are dropped.
- **see-wizard:** the 4 good completed steps and `checks.four` (seed 12) are kept; `bogus`, `phase: 'oops'`, `ex: 99` and `seed: −4` are dropped.
- **bank-sets:** after an unusable active run (2-digit Hard, pos 99) and a `"junk"` entry, starting a new session keeps the 1 good finished-session record.
- **guided:** `done[0]` is kept; `pos: 42`, `seed: 'x'`, `done[1]: 'yes'` and `states[9]` are dropped.
- **draft-test:** the good response is kept and counted in `answered`; the string response `t2` is dropped.

**SR-M02: damaged values no longer stop screens from working.** With those saves plus `ws.d` as a string and attempt items that are `null` or `{ id: 'zz', skill: 'nope' }`, every screen rendered with no page error: all 13 section routes (menu, Parent Guide, Learn, Practice choices, Together, setup, run, skills, skill-one, skill-zero1, Test, test run, Results), Home and the Math Lessons list. In Node, `cleanResults` keeps out non-object result entries, so the old `rr.tries += 1` crash can no longer happen.

**SR-M03: Home's count now matches the section's.** The draft and runs carry an `answered` list.
- Home reads "Subtract with Regrouping · Regrouping Test: 1 of 15 answered", linking to the test.
- The section's own button says "Continue the test (1 of 15 answered)".
- After a half-typed second answer (a tens digit only), Home still says 1 of 15.

**SR-M04: hints now restart for each column.** With real clicks:
- **In the section** (4-digit Medium practice): Hint 1 and Hint 2 on the ones; then the ones digit is typed; the next hint is "Hint 1 of 4: Look at the tens column…".
- **In the component on its own** (4,532 − 1,768): the same restart, and then "Hint 4 of 4: Tens: 12 − 6 = 6", which is only that column's digit.
- The full solution is still a separate button, and no hint text contained 2,764.
- The hint state survives a refresh.

**SR-M05: "added 10 without reducing" is now named across a 0.** For 3,002 − 1,578 with ones 12 only, `evaluateWork` and `diagnose` now return `no-reduce` at the ones. The normal case (4,532) is unchanged.

**SR-M06: valid alternatives get a neutral marker.** In Practice Together (724 − 386), choosing the hundreds as the supplier gives `sk-info-note` "↺ That could work too…". A real mistake (ones 13 instead of 14) still gets "✗".

**SR-M07: guided mode no longer asks for leading zeros.** With real input:
- **In the section:** a Learn step 6 Your Turn whose answer is shorter than the top number (1,000 − 958) finishes after the tens; nothing is typed in the hundreds or thousands; Next Step unlocks; the step is saved and survives a refresh.
- **In the component:** 1,000 − 857 finishes after the hundreds (thousands box empty).

**SR-M08: Practice Together tips now fit the problem.** After "New problems", tips come from `C.tipFor`. On 8,000 regenerated problems (1,000 sets), every tip matched my own reading of the problem: which column, the zeros named, whether there is more than one exchange. Examples:
- 515 − 174 → "is the top digit in the tens enough…"
- 7,020 − 4,781 → "the hundreds has 0…"

**SR-M09: error-analysis items now vary in difficulty.** Over 500 attempts, t13 is easy 247 times and medium 253 times, across smaller-from-larger, no-reduce and original-digit.

**SR-M10: the misaligned guard is in place.** My simulation and `buggyWork` now agree on all 40,000 problems for every mistake; bottom 0 gives `null`.

**Also re-confirmed in Node:** the spec examples, exchanges, plan and classify on 858,783 pairs, sessions, grading, hints (level 1 never contains the answer), the test blueprint (15 items, 11 four-digit, every required kind and zero case, no ambiguous error-analysis items), and generators.

**The Mixed-session note is resolved.** A ten-question Mixed session now always contains an equal pair (zero answer): 40 of 40 sessions for every size.

### Browser checks

**Guided work, end to end, with real input:**
- 7,405 − 3,168 = 4,237, 6,003 − 2,847 = 3,156 and 800 − 356 = 444 each finish correctly and are saved as done.
- On 6,003 − 2,847, every exchange through each zero is confirmed. The saved history is thousands 6→5, hundreds 0→10→9, tens 0→10→9, ones 3→13, matching my stage list.
- Leaving the hundreds at 10 when passing on to the tens is refused with the "gives 1 away" clue. Only the correct value is recorded (the design change "check-ex records only correct values" works).
- 1,000 − 857 in the component confirms each of the three exchanges ("…The value is still the same.").

**Refresh and navigation keep the work:**
- **Learn:** a finished Your Turn and Next Step survive a refresh.
- **Practice Together:** a refresh mid-chain restores the stage (exchange 2 of 3) and the first exchange's marks, and the problem can be finished from there.
- **Practice on My Own:** the typed digit, a typed mark (99) and the hint level survive both a refresh and Menu → back.
- **Practice One Skill:** saved under `skill-practice` only. A right answer there leaves the full-set run's responses and results empty.
- **Test:** marks and digits survive Next → Previous.

**Test integrity:**
- On a test question I typed a nonsense mark (77) and the right answer. The test shows:
  - no Hint, Check or Show-solution controls;
  - no feedback text;
  - no `is-ok`/`is-no` classes and no ✓/✗/↺ notes;
  - nothing about correctness in the live regions.
  - Undo is available, so marks are allowed.
- **Grading:** answering 13 right and 2 wrong gives 13 of 15. The question with the nonsense mark is graded correct; marks don't count against a right final answer. The final-answer score (`parts.final`) is 2 below its total, and My Results shows "Final answers" and "Regrouping steps" on separate rows.
- **Results:**
  - the missed-question list names no mistake type;
  - it says "These links come from the kind of question, not from a guess about the mistake";
  - the error-analysis entry shows the child's answer and "(reason chosen)", without judging the reason.

**Reset:**
- The Parent Guide asks to confirm ("Yes, reset").
- Every `mathbook:v2:subtract-regrouping:` key is removed.
- These are kept byte-for-byte: `lesson-2-15:attempts`, Number Words Phase 1 and Phase 4 attempts, and a decoy key `mathbook:v2:subtract-regroupingx:keep`.

**Portability (`dev/subtract-demo/`, no Mathbook):**
- The page loads only `sub-math.js` and `sub-workspace.js`; `window.Mathbook` is undefined.
- Every instance has its own `data-sk` id, and there are no duplicate element ids.
- **Two instances of the same problem:** typing a digit and a mark in one changes only that one's state and events. Every event carries that instance's id; the other receives none.
- **Listeners:** checked with CDP `DOMDebugger.getEventListeners`. Mounting adds no listener to `document` or `window`. `destroy()` takes the host element from its listeners to 0, clears the markup and the `sk` classes, and emits nothing afterwards.
- **Export/restore:** a new instance mounted with `getState()` shows the same marks and digits. A state for another problem is ignored (fresh start), and `setState(bad)` returns false.
- **Test-mode isolation:** an instance in `test` mode with `hints: true, feedback: true, solution: true` shows none of those controls. `hint()` and `showSolution()` do nothing (hint level stays 0, no `hint` event); `check()` returns its result silently, with no marks or announcements.
- The component never writes to localStorage or sessionStorage.

### New finding

#### SR-M11 (minor): public methods throw after `destroy()`

**Evidence.** After `X2.destroy()`, calling these throws "Cannot read properties of null (reading 'classList')" from `renderCoach`:
- `check()`
- `hint()`
- `reset()`
- `setState(validState)`

`getState`, `result`, `undo`, `clearWork`, `focus` and `showSolution` don't throw.

**Failure scenario.** A host that keeps a reference and calls `reset()` or `check()` after a screen change (a late timer or event handler) gets an uncaught TypeError. Mathbook's adapter destroys instances on every screen change, so this only matters for other hosts, and for Mathbook if a callback outlives its screen.

**Fix.** Return early (`null`/`false`) from every public method when `destroyed` is true, and add a unit or browser check.

### Phase 2 result

- All ten Phase 1 findings are fixed and pass, in Node and in the browser.
- Persistence, malformed saves, reset scope, Home Continue, test integrity and portability all behave as the spec requires.
- One new minor finding (SR-M11), which affects only host code that keeps using a destroyed instance.

### SR-M11 re-check (a27f1fa): **Pass**

I tested an instance in each mode (independent, guided, test, demo, view) on `dev/subtract-demo/`. After `destroy()`, I called every public method:

- `check()` and `result()` return null.
- `setState(validState)` returns false.
- `hint()`, `showSolution()`, `reset()`, `undo()`, `clearWork()` and `focus()` return undefined.
- `getState()` still returns the state object, and a second `destroy()` is fine.

Nothing threw. A MutationObserver on the host element recorded 0 DOM changes, the host markup and classes stayed empty, no events were fired, and there were no page errors.
