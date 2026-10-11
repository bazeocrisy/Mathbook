# Lesson 2-7 Decompose to Subtract: independent build review

Reviewed build: worktree `Mathbook-27`, branch `claude/lesson-2-7`, commit `b141914` (diff against main `15f7d82`, where 2-6 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-7/lesson.js` and `index.html`;
- the 2-7 entry in `assets/js/catalog.js`;
- the shared chain changes in `assets/js/questions.js` (`ways: 2`, the B-01 rule for empty and 0 tree parts, optional boxes in `isAnswered`, and step rows redrawn when a tree part changes);
- the F11 spoken label in `assets/js/figures.js` ("−" read as "minus");
- `.ch-way` and `.ch-row.is-skip` in `assets/css/mathbook.css`;
- `tests/components.test.js`, `tests/lesson-2-7.test.js`, `tests/lesson-2-7-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

I checked it against:
- textbook pp. 59–62 (page scans);
- `docs/chapter-2/lessons/2-7.md`, including §15 review fixes and §16 build notes;
- `batch-B-plan-review.md` (B-01, B-02, B-08, B-09, B-24);
- `DESIGN.md` §4.2 chain presets `steps`/`trees` and §6;
- PLAN decision 9 (each step is graded against the child's own previous result).

Lessons 2-3 to 2-6 were used for the established look and feel. I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r27\` (written below as `r27/...`):
- `sample.cjs`: keys, generators and grading in Node;
- `flows.mjs`: Learn, Practice Together, On My Own, Test and Home in the app, typing one key at a time;
- `vp.mjs`: viewport sweep, 186 screenshots in `r27/shots/vp/`;
- `four.mjs`: 4-part trees at 320 px.

**Result: 0 critical, 0 major, 4 minor.**

The math, answer keys, grading (including every B-01 case), the two-ways rule, the child flows, progress and the layout are all right. The four findings are about how the new tree-and-steps control looks and speaks in a few situations, and one choice-order pattern.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L27-01 | minor | Subtract control (`steps`) with the child's own tree, before the parts are typed: Learn 3, PT3, PT4, PT8, the On My Own and test subtract items | Empty tree parts are "left out" (B-01), so before the child types any part, **every** step row is greyed and **every** row starts from the first number. PT4 at 320 px shows "634 − … =", "634 − … =", "634 − … =" in both ways (`r27/shots/vp/320x568-pt4.png`). This is the picture of the spec's §10 mistake ("subtracting a part from the original number every time"), and the greyed rows look unavailable. It fixes itself as soon as parts are typed: rows then read "634 − 200 =", "… − 80 =", "… − 7 =" (`r27/shots/f-pt4-four-320.png`). So it is minor. But it is the first thing a child sees on every own-tree item. | Treat a row as "left out" only when its part is 0, or when it is blank **and** a later part has a value. Rows of parts not typed yet stay normal, and their start shows "…" (the previous row's result) instead of the first number. Alternatively, keep the B-01 grading but draw untyped rows normally, with "…" as the start of rows 2 and later. |
| L27-02 | minor (shared engine) | Review (On My Own results, My Results) of a subtract item with a 0 part | O4 answered with the tree 400 / 60 / 0 (correct, as B-01 allows): the review prints "0 ✓ (right)" for the 0 part, and the greyed left-out row "268 − 0 = — ✓ (right)". That is a tick on an **empty** box (`r27/flows.out`, OWN). The "Your answer" line correctly leaves the row out ("Parts 400, 60, 0 · 728 − 400 = 328 · 328 − 60 = 268 · Answer 268"). A tick on an empty box that was not graded is confusing next to the real ticks. | In review mode, give the boxes of a skipped row (and a 0 or empty tree part) no ✓/✗ mark. Show it greyed with a short "(not used)" note, matching the row's spoken label "(not used: its part is empty or 0)". |
| L27-03 | minor (shared engine, from the 2-6 `emptyTip`) | "Check" with a partly filled two-tree or two-way item (PT1, PT4, Learn 1; also O1/O2/O13 in Practice My Misses retries) | PT1 with Way 1 filled and Way 2 empty says only "**Fill in every box, then check.**" (`r27/flows.out`, `pt1one`). The chain check's message is "Way 2: Write at least 2 parts that add to 258." But `Q.emptyTip` only uses messages that start with "Write ", so the "Way 2:" prefix sends it to the generic text. Single-tree items name the box well ("Write a whole number in every box of step 1.", "Write the answer."). | In `emptyTip`, accept a "Way n: Write …" message too (e.g. test `/^(Way \d+: )?Write /`). Then two-way items say which way and what is missing. |
| L27-04 | minor | On My Own O3b and O4b ("Which is a good reason?"), and "Practice this skill" for `friendly` | The two "why" choice questions have their right answer as the **first** choice (seeded order 31 → index 0, 41 → index 0; `r27/sample.out`). On My Own and skill practice do not shuffle choices, so the friendly-skill practice (o3b, o4, o4b) shows the key first both times. The test item T2b is shuffled per attempt (index 2 in the sample). The other bank choices are at positions 3 (O9) and 2 (O12). | Pick seeds that put the O3b and O4b keys in different, non-first positions, or set the choice order by hand. Update any order-dependent tests. |

## The builder's deliberate choices: judgement

1. **Six Learn steps (spec 5): sound. I agree.** A Learn step has one question, so the spec's step-3 "why the same?" and step-4 "any order?" choices needed a home. The new step 4 "Same difference, any order" works well:
   - Two named trees for the same number (one by place value, one whose first part lands on a hundred: 645 − 45 = 600), both choices, and the difference to type.
   - The example slide shows both trees and 538 − 215 taken away in two orders.
   - Step 5 "Check your parts" (Eli 458 − 102) and step 6 tables follow the spec.
   - `catalog.js` has `steps: 6`.
2. **B-02 "decompose + why" as connected pairs (O3 + O3b, O4 + O4b, T2 + T2b; test = 13 questions): sound.** The "why" is about a **named** tree (Lena's 200/40/1, Omar's 428/32, Kim's 300/50/2), so it is never graded against the child's own tree. The keys are the spec's. The book's "Why did you choose that way?" is still discussed in Practice Together (PT3 parent prompt, PT9). The one issue is L27-04.
3. **`ways: 2` in the shared engine: sound.** One tree, its steps and its answer per way, in its own bordered "Way 1" / "Way 2" block. The two trees must differ as sets of non-zero parts:
   - 200/50/8 vs 8/50/200 is rejected;
   - 200/50/8 vs 200/50/0/8 is rejected;
   - 200/50/8 vs 243/15 is accepted.

   Each way is graded on its own ("Way 2: Your last step shows 485. Write it as the answer."). The engine's sample way 2 lands on a hundred first (634 − 34 = 600). The existing presets are unchanged: the components fixture (steps/trees/adjust) passes 52/52, and 2-5 (`free`) and 2-6 (`rows`) pass 242/242.
4. **O13 (652 − 278, two ways → 374) added: sound.** Without it, T7's `twoways` skill would have had no "Practice this skill" questions. The numbers are new. On My Own is 15.
5. **Story items use the subtract control's answer line with the unit ("Hearts: 286 − 138 =", "Blue: …", "Yellow: …"): sound.** The child still breaks the number apart and writes the steps, and the unit is on the answer line.

## Verified working

**Math and answer keys**
- Every Practice Together, On My Own and Test item was recomputed by my own script (`r27/sample.out`). All match spec §6–§8 and §12:
  - PT: 227, 278, 347 (both ways), 266, 213, 243 / 124 / 119, 148.
  - O: 345, 268, 223, 227, 318, 284, 473, 209 / 132 / 77, 189, 224, 374 (both ways).
  - T: 322, 343, 278, 258, 346, 485 (both ways), 585, 302 / 187 / 115, 188, 335, 124 + 72 / 328.
- Every choice key is among its choices, and no keyed choice contains a number the child must type (B-05/B-07; T12's key is just "124 + 72", B-08).
- The correct response grades correct for all items and the generated test. The lesson's own leak check finds nothing.
- Distractors match B-24.
- **Learn generators, 20,000 seeds per step:**
  - Steps 2–3 (DS pair): a is 300–999 and b is 101 to a − 100. b's tens and ones are never 0, at least one place needs regrouping, and the pair is never a demo pair.
  - Step 1: n has non-zero tens and ones and is never 175 or 184.
  - Step 4: Jada's tree adds to b, and its first part always lands a on a hundred.
  - Step 5 (B-09): a covers 200–999, b is 101–109, a − b ≥ 91, and no choice shows the difference.
  - Step 6: 4 different 3-digit numbers, with greatest − least covering exactly 40–300.

**Grading (Node and in the app)**
- **B-01, spec §13 cases:**
  - 953 − 610 with 600 / 10 / 0 and steps 353, 343 → right, and counted as answered.
  - 728 − 460 with 400 / 60 / 0 → right. 0 / 400 / 60 and 400 / blank / 60 → right.
  - 610 / 0 / blank → "Write at least 2 parts that add to 610." and not answered.
  - A 0 part shows "Tip: you can remove the 0 part." after a right answer and is not counted as a miss.
- **Wrong trees and steps:**
  - A wrong tree gives "Your parts add to 611, not 610."
  - Steps are graded against the child's own previous result. A slip is reported once ("Check 953 − 600."), and later steps that follow from it are not marked. Starting each step from the first number is caught ("Check 353 − 10.").
  - 4 parts (300, 300, 9, 1) are accepted.
  - A given place-value tree (PT2) with a wrong step gives "Check 262 − 30.".
- **Two trees (trees preset):** 400/38 and 400/30/8 are right. 400/38/0 vs 38/400 → "Both ways use the same parts." 438/0 → "Way 1: Write at least 2 parts that add to 438."
- **Guided messages never give the answer.** The one exception is "Your last step shows N. Write it as the answer.", which the spec asks for and which repeats the child's own number.
- **Test:** all 13 questions show no feedback, hint, check, tip or "Your parts add to" line.
- **Review:** shows the child's own parts, steps and answer with ✓/✗, plus "Your answer", "Correct answer" and "Why". For example, O7 with 200/70/15 and a slip at the last step is marked ✗ only at that step and the answer (apart from L27-02).

**Coverage vs pp. 59–62**
- Be Curious (hexagons) is Learn 1. One Way / Another Way (353 − 184 shapes) are Learn 2 and 3.
- Math is… Explaining is Learn 4 and PT4's parent prompt. Work Together (two ways) is PT4, O13 and T7.
- Items 1–2 are Learn 1, PT1, O1, O2 and T1. Items 3–4 are O3/O3b, O4/O4b, T2/T2b and T12.
- Items 5–8 are PT2, PT3, O5–O8 and T3–T6. Book item 6's blank on the left is O6 and T5 ("___ = 442 − 215", answer line "The blank is").
- Item 9 (Error Analysis) is Learn 5, PT5, O9 and T8. Item 10 (table) is Learn 6, PT7, O10 and T9. Item 11 ("the rest") is the Learn 6 example, PT8, O11 and T10. Item 12 (any order) is Learn 4, PT6, O12 and T11.
- Reflect is the Learn finish screen and PT9.
- Book numbers appear only in the Parent Guide (353 − 184, 101 → 100 + 10) and in the demo lists.

**Tree control usability (390 px, typing one key at a time)**
- Focus stays in the tree box on every key, even though the step rows are redrawn on each tree change.
- "Your parts add to …" updates live (100, then 185).
- A 0 part greys its row, and the next row starts from the last row that counts.
- "− Remove a part" removes the last row and moves focus to the new last box. "+ Add a part" adds a row, moves focus to the new box, and is disabled at 4 parts.
- At 320 px a 4-part tree fits: boxes are 49 × 48 px, with no sideways scroll. A 3-digit part fills the box but is not cut off (`r27/shots/f-pt4-four-320.png`).
- Spoken labels: each part reads "Part 1 of 3, way 2: a part of 287". Each left-out row reads "… (not used: its part is empty or 0)". F11 lines now read "362 minus 100 equals 262".

**Child navigation and progress**
- **Menu:** Learn, Practice, Take a Test, My Results and the Parent Guide.
- **Learn:** in all 6 steps, an empty Check gets a message ("Write a whole number in every box of step 1."). A wrong answer keeps Next Step locked, and a right answer unlocks it. Finish works and a refresh resumes (journey test 122/122).
- **Practice Together:** all 9 items. Hints and Parent Help work (PT1, PT3, PT4).
- **On My Own:** 15 items, one at a time, with no help shown. The score was "14 of 15 correct" with Practice My Misses.
- **Skill practice:** every test skill has bank questions (`twoways` via O13). `lesson-2-7-skills.browser.mjs`: 73/73.
- **Home "Continue":** a test with T3 (0 part) answered, T4 without its answer and T1 with one tree gives Home "Decompose to Subtract Test: 1 of 13 answered", the same as the test menu "Unfinished: 1 of 13". The draft's `answered` list is `["t3"]`.
- **Reset Lesson Progress:** clears only 2-7 (journey and skill suites).

**Phone, tablet and desktop**
- Viewports: 320×568, 390×844, 768×1024, 1024×768, 1366×768 and 1920×1080 (touch below 1024 px).
- Screens per viewport: menu, Parent Guide and Results; every Learn slide and Your Turn; all 9 Practice Together items; all 15 On My Own items; all 13 test items.
- No sideways scroll, every target is at least 48 px tall, and every input is at least 44 px wide (`r27/vp.out`).
- The smallest text in the controls and figures is 18.9 px on phones.

**Regression** (browser suites run one at a time)

| Suite | Result |
|---|---|
| `npm test` | 112/112 |
| `lessons.browser.mjs 2-7` | 122/122 |
| `lesson-2-7-skills.browser.mjs` | 73/73 |
| `components.browser.mjs` | 52/52 |
| `lessons.browser.mjs 2-5 2-6` | 242/242 |
| `browser.test.mjs` (2-1 + Home) | 198/198 |

No JavaScript errors or missing files in any run. No headless Chrome I started is left running (I did not touch the other project's "ww-chrome").

## Environment
- Headless Chrome driven through `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports were simulated with device metrics. No physical device.
- Windows 11, 2026-10-10.
- The working tree has only this report as a new file. Nothing was committed.

### Re-verification at 9edbac6

I re-checked commit `9edbac6` (fixes for L27-01…L27-04) in the app with the same harness and headless Chrome (390 px and 320 px). Scripts: `r27/rv.mjs` (output `r27/rv.out`) and `r27/trail.mjs`. Screenshots: `r27/shots/rv-*.png`. I edited no app, lesson, engine or test file. The coordinator is running the full browser regression.

| Finding | Status | Evidence |
|---|---|---|
| L27-01 | verified | **Before typing (PT4, 320 px):** each way reads "634 − … =", "… − … =", "… − … =". Only row 1 starts from 634, and no row is greyed (`rv-pt4-untouched-320.png`).<br>**After 200:** "634 − 200 =", "… − … =", "… − … =".<br>**Middle part left empty, last part typed:** row 2 is greyed and row 3 follows on from row 1 ("… − 7 ="). A middle **0** is greyed the same way.<br>**Trailing part cleared (200, 80, blank):** row 3 is normal ("… − … ="), not greyed.<br>The spoken label "(not used …)" is only on greyed rows. Focus stays in the tree box while typing. |
| L27-02 | verified | **Guided (PT3, tree 200 / 0 / 60 / 3, right):** ✓ on the three real parts, their steps and the answer. **No** mark on the 0 part or its greyed row "341 − 0 =". **Wrong** (291 after 341 − 60): only that step and the answer are ✗ ("Check 341 − 60.").<br>**Review (On My Own):**<br>• O4 as 400 / 60 / 0 shows "728 − 400 = 328 ✓", "328 − 60 = 268 ✓", and "268 − 0 = — **not used**" with no mark. The 0 part has no mark.<br>• O7 with an empty middle part shows "403 − … = — not used" and no mark.<br>The scores are unchanged (14 of 15 with one deliberate miss). |
| L27-03 | verified | PT1 with Way 2 empty (and with only one part in Way 2): "Way 2: Write at least 2 parts that add to 258." PT4 with Way 2 empty: "Way 2: Write at least 2 parts that add to 287." |
| L27-04 | verified | In the On My Own set, the key is choice 4 of 4 for O3b and choice 2 of 4 for O4b. |

**The shared mark changes, checked in other lessons:**
- **2-6 Practice Together PT1** with "2" for 200 gives "Look again at the hundreds line." Only that box is ✗.
- **2-6 On My Own** with a wrong row (O1) and a wrong stacked sum (O2): "12 of 14 correct", with 68 ✓ and 2 ✗ in the review and no "not used" notes.
- **2-5 Practice Together PT2** with a wrong sum gives "Check 290 + 524." Only the sum box is ✗.
- **2-5 On My Own** with one wrong equation: "18 of 19 correct", with 1 ✗ in the review.
- No JavaScript errors.

No new findings. No headless Chrome I started is left running (I left the other project's "ww-chrome" alone).
