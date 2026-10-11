# Lesson 2-2 fixes and Rounding Check-Up: independent build review

Reviewed build: worktree `Mathbook-22`, branch `claude/lesson-2-2-fixes`, commit `a2b4d3c`. Files: `curriculum/chapter-2/lesson-2-2/lesson.js`, `assets/js/catalog.js`, `assets/js/lesson-app.js` (Practice menu wording), `assets/js/questions.js` (`partsTip`), `tests/rounding.test.js`, `tests/components.test.js`, `tests/lesson-2-2.browser.mjs`, and the new `tests/lesson-2-2-checkup.browser.mjs`.

I checked it against these sources:
- textbook pp. 37–42 (page scans);
- `docs/chapter-2/lessons/2-2-verification.md` §6;
- `docs/chapter-2/lessons/2-2-probe.md`, with its Review fixes;
- `batch-A-plan-review.md`: A-04 … A-10, plus the Re-verification section with N-01 and N-06;
- PLAN Decisions 1, 2, 5, 7 and 28, and `DESIGN.md`.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\477cc6fa-3229-4b55-9cf8-4292528d1e9f\scratchpad\r22\` (written below as `r22/...`).

**Result: 0 critical, 2 major, 3 minor.**
- The two major findings are PLAN Decision 1 number changes that the build did not make (L22F-01, L22F-02). The build followed `2-2-verification.md` §6. The coordinator's later Decision 1 text replaces that section, and Decision 28 makes those changes part of the build instructions.
- One minor finding is about originality (L22F-03).
- Two minor findings come from shared progress code, and the two-part Check-Up makes them easy to see (L22F-04 Home "Continue" count, L22F-05 Math Lessons list note).
- Everything else in the brief works as specified, including both shared fixes.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L22F-01 | major | `lesson.js` practice `p1`, test `t10` (PLAN Decision 1 bullets 3 and 5; re-verification N-06) | Decision 1 says "p1 = **36** → 40 … 46 is avoided because it is a Check-Up choice (N-06)" and "Test t10 … becomes **65** → 70 instead of 85, because 85 appears in the Check-Up practice". The build has `lineQ(46, 10, 'p1')` and t10 still reads "Leo says 85 rounded to the nearest ten is 80…" (key 90). My script (`r22/keys.cjs`, "overlap" lines) confirms: <br>• p1 46 → 50 is a choice in Check-Up test TR3 (46 → 50 ✓); <br>• Check-Up practice PR3 has 85 → 90 ✓, the answer to Rounding Test t10. <br>So a practised number comes back in a test with the same answer. A third case of the same kind, not listed in N-06, came with this build: Check-Up practice PR4 teaches "450 is halfway, so it rounds up to 500", and Rounding Test t11 has "450 pages" → 500 ✓. `tests/rounding.test.js` now asserts p1 = 46, so the wrong value is locked in. | Set p1 to `lineQ(36, 10, 'p1')` (between 30 and 40, halfway 35, 36 is past it, so 40). Change its parent tip to "36". <br>Change t10 to Leo saying 65 rounds to 60; the key is 70 (65 is halfway between 60 and 70 and rounds up). <br>Optionally change t11's 450 to a halfway number that is not in the probe lists, keeping the "halfway rounds up into the target" case, or change PR4's 450. <br>Update `want` in `tests/rounding.test.js` and the p1 checks in `tests/lesson-2-2.browser.mjs`. |
| L22F-02 | major | `lesson.js` test `t9` (PLAN Decision 1 bullet 4; re-verification N-01) | Decision 1 says "Test t9 (explain a nearest-hundred result) becomes **68 → 100**, so the test keeps a 2-digit number to the nearest hundred". The build still has `explain100Q('t9', 849, …)`: "Round 849 to the nearest hundred, then explain why." The remaining nearest-hundred test items are t5 314, t6 781 and t9 849. None is a 2-digit number with lower hundred 0, so book item 7's skill (78 → 100) is practised (p6 87) but never tested. | Set t9 to 68: it is between 0 and 100 and past halfway (50), so it rounds to 100, and the keyed reason becomes "past the halfway mark". Check that the explanation reads "68 is between 0 and 100. Halfway is 50." Update `want.t9` in `tests/rounding.test.js` (`[0, 50, 100, 100, 'It is past the halfway mark']`) and any 2-2 browser check that uses t9. |
| L22F-03 | minor | `lesson.js` `p12`, `t12` (money items) and `pr2`. Also the new "no book On My Own numbers" unit test. | Decision 7 asks for new numbers, and the brief asks that no rounded practice or test number be a book On My Own number. Three items break this. <br>• **t12** rounds **$27** and **$16**. 27 is book item 1 ("Round 27 to the nearest 10"). 27 and 16 are also book item 11's blueberries and grapes. <br>• **p12** rounds $14, $23, **$12** in the same "has $X, can he buy three things" setting as book item 12 ($15, $22, **$12**). §6 kept these numbers, so this part needs a coordinator ruling. <br>• Check-Up practice **PR2** includes **627**, one of the book's own Probe choices (p. 41, c. 627). <br>The new test in `tests/rounding.test.js` skips `skill === 'money'` items, so it does not catch t12 or p12. | t12: use e.g. $28, $17, $14. The estimate is 30 + 20 + 10 = 60 and the exact total is 59, which is not more than 60, so "Yes" still holds, with $1 left. <br>p12 (if the coordinator agrees): use $14, $23, $13. The estimate is 40 and the exact total is 50, which is more than 45, so "No" still holds. <br>PR2: replace 627 with e.g. 624, which still rounds to 600. <br>Remove the money exemption from the unit test, and add the book's item-11/12 amounts and the Probe numbers to its list. |
| L22F-04 | minor (shared Home page, made visible by the two-part Check-Up) | `index.html` "Continue where I left off": `answered()` for array responses | The Home comment says the label "counts fully answered questions (as the test does)". But a `parts` answer counts as answered once **any** part is filled. In the Check-Up test, I chose only the select-all numbers on Question 1 and left the reasoning blank. The results were: <br>• the test menu said "Unfinished: **0** of 4 answered so far"; <br>• Home said "Lesson 2-2 · Rounding Check-Up: **1** of 4 answered"; <br>• in Set 2, after doing the same, "Check my work" listed question 1 as "Still needed", but Home said "Practice on my own: 1 of 4 answered". <br>(`r22/refresh.mjs` output, `r22/review.out` "TEST menu" / "HOME test-partial".) Every Check-Up item has two parts, so this is easy to hit. | For the "answered" count, treat an array response as answered only when **every** part is non-blank. Any non-blank part still counts as "started", so Continue still appears. Better still, have Home use the lesson engine's `Q.isAnswered` rules. Add a Home check with a half-answered Check-Up item to `tests/lesson-2-2-checkup.browser.mjs`. |
| L22F-05 | minor (shared `catalog.js` `progress()`, made visible by the second 2-2 test) | Math Lessons list (`math/`), Lesson 2-2 card | `progress()` takes the best `pct` over **all** attempts in the lesson. After one 4-question Check-Up at 4/4, with the 12-question Rounding Test "Not taken yet", the 2-2 card reads "**Best test score: 100%**" with the green `is-done` style (`r22/review.out` "LESSONS list 2-2", `r22/shots/lessons-list-after-checkup.png`). The parent would read Lesson 2-2 as mastered when only the short diagnostic was done. (2-1's Math Words Test can do the same, but 2-2 is where a 4-item test now sits beside the main test.) | Base the note on the lesson's main test, the first entry in the catalog `tests` list, or show one line per test (e.g. "Rounding Test: 75% · Check-Up: 100%"). Mark the lesson done only when the main test is at or above 90%. Add a check to `tests/browser.test.mjs`. |

## Verified working

**Math and answer keys** (`r22/keys.cjs`, `r22/dump.cjs`; round-half-up = floor((n + p/2) / p) × p)
- p1 46: 40 and 50, halfway 45, rounds to 50 (the number itself is wrong per L22F-01; the math is right).
- t1 72: 70 and 80, halfway 75, rounds to 70.
- p5 418: 400 and 500, halfway 450, rounds to 400.
- p6 87: 0 and 100, halfway 50, rounds to 100. In the app the line is labelled 0 | 50 | 100 with the point "87" at 0.87 of the track. The parts read "What two hundreds is 87 between?", "What number is halfway between 0 and 100?" and "Which hundred is closer to 87?", with feedback "Yes! 87 is between 0 and 100." and "Yes! Halfway is 50."
- t6 781 is unchanged (rounds to 800).
- p12 now uses Dev; est. $40, exact $49, "No".
- Every Check-Up item's select-all key matches my own recomputation:
  - PR1: {483, 476, 475}
  - PR2: {681, 742, 715}
  - PR3: {86, 94, 85, 89}
  - PR4: {362, 418}
  - TR1: {263, 258, 255}
  - TR2: {438, 352, 449}
  - TR3: {46, 45, 54, 49}
  - TR4: {761, 829}
- Every explanation lists each choice with its rounded value and ✓. The rule sentences are correct: 485, 95, 55, 265, 450 and 850 are halfway and round up; 352 and 681 round up past the halfway point.
- The reasoning ✓ and distractors match `2-2-probe.md` §6–8 word for word, including the A-04, A-08 and A-09 fixes. Every distractor is false. The PR3 and TR3 questions ask about 75 and 35, which are not in their lists.
- The ✓ texts name only a range. In PR1 and TR1 the range starts at a listed number (475, 255), and the range rule tells the child which numbers are in. That is the wording the reviewed spec asks for (A-08), so I have not raised it as a finding. Note that the spec's own sentence "never name the item's own numbers" does not fully hold for those two items.
- Book numbers: no 2-2 number-line, place-value, reasoning or select item uses a book On My Own number (27, 896, 48, 273, 436, 672, 78, 240, 678, 315). L22F-03 covers the money items and PR2.

**Coverage vs pp. 37–42**
- Items 1–12 map to p1–p12 and t1–t12 as in §6: 2-digit on a line (p1, t1); 2-digit to the nearest hundred (p6, but see L22F-02 for the test); rounding down to the nearest hundred (p5 418, t5 314); 3-digit rounding up (t6 781).
- Probe 1 is covered by PR1, PR3, TR1 and TR3. Probe 2 is covered by PR2, PR4, TR2 and TR4. All are select-all plus a graded reasoning choice.
- Reflect On Your Learning appears in the Parent Guide as an ungraded question.
- The Parent Guide shows the Choosing Tools question, the Check-Up demonstration, the Check-Up ask lines and the checklist line (rendered in `#teach`).

**Grading**
- Select-all needs the exact set: a subset or a superset is wrong.
- A wrong reasoning choice with a correct select-all is wrong. The practice coaching is "Look again at: How can you tell which numbers round to 260." (one period).
- Check-Up test: there is no `hint` on any item, and no hint, check or feedback element in the test DOM.
- Choice order: it is the same for a saved seed, and differs between seeds and between two real attempts on both parts (`r22/review.out` "TEST q1" vs "ATTEMPT2 order").

**Child navigation** (`tests/lesson-2-2-checkup.browser.mjs` passes 23/23, plus my own runs)
- Practice menu:
  - 2-2 says "Choose a set. Answer every question, then check your work."
  - 2-1 still says "Choose a set of 10. …".
  - 2-3 says "Answer all 14 questions", 2-4 "Answer all 14", and 2-5 "Answer all 19". All are unchanged.
- The set chooser lists "Set 1 Rounding Practice" and "Set 2 Rounding Check-Up".
- Set 2:
  - one question at a time, with no hints;
  - one miss gives "3 of 4 correct" with a full "Why";
  - Practice My Misses (1) gives "1 of 1 now correct".
- Check-Up test: Start; Save and finish later; Keep going resumes at Question 2 of 4; results 3/4 (75%).
- On the results page, the missed skill is "Choosing every number that rounds to an amount". "Practice this skill (Set 2)" opens `#practice/s2` at Question 1 of 4.
- The Rounding Test still starts and t1 is the 2-digit staged line (72). `tests/lesson-2-2.browser.mjs` passes 96/96.

**Saved progress and reset**
- Refresh mid-set keeps "Question 2 of 4" and the chosen sticker chips.
- Refresh mid-test returns to the test chooser with "Keep going". The Rounding Test and 2-1's Math Test behave the same way, so this is not a regression.
- Home "Continue":
  - with Set 2 started: "Lesson 2-2 · Practice on my own: 2 of 4 answered" → `#practice/s2`;
  - with the Check-Up started: "Lesson 2-2 · Rounding Check-Up: 1 of 4 answered" → `#test/checkup` (count issue: L22F-04).
- Reset Lesson Progress removed exactly these 2-2 keys: `attempts`, `bank-open`, `bank-sets`, `draft-checkup` and `guided`. It kept the 2-1 attempts, the 2-3 Learn data, `activity`, an unrelated key and a decoy `lesson-2-22:` key.

**Shared fixes**
- `partsTip`: I scanned every `parts` label in all five lessons (plus the guided, bank and 30 test seeds each). Labels ending in "." are 2-3 `p7`/`t7` "Choose the best way." and nine 2-5 labels. The 2-5 items are single-part, where `partsTip` returns '' by design, so their coaching cannot change. Only 2-3's coaching changes, and it now reads "Look again at: Choose the best way." with one period, as the builder said.
- The Practice-menu change affects 2-2 only (above).
- Regression suites, run one at a time, all pass:

| Suite | Result |
|---|---|
| `npm test` | 89/89 |
| `browser.test.mjs` (2-1 and Home) | 198/198 |
| `lessons.browser.mjs` (2-3, 2-4, 2-5) | 349/349 |
| `lesson-2-3-skills` | 71/71 |
| `lesson-2-4-skills` | 62/62 |
| `lesson-2-5-skills` | 68/68 |
| `number-words` | 64/64 |
| `components` | 52/52 |

**Phone, tablet, desktop** (`r22/review2.mjs`, `r22/lines.mjs`)
- Viewports: 320×568, 390×844, 568×320, 768×1024, 1024×768, 1366×768, 1920×1080, and 683×384 (200% zoom).
- Screens checked:
  - the Practice menu, the set chooser, Set 2 questions 1–4 and the checked Set 2;
  - the Check-Up test question and its results;
  - the p1 (46) and p6 (87, 0 to 100) lines in Practice Together, and t1 (72) in the test.
- On every screen at every size: no sideways scroll, nothing past the edge, no overlapping number-line labels, and every button, chip, radio card and input at least 48 px tall.
- Screenshots: `r22/shots/320x568-test-q1.png`, `320x568-s2-checked.png`, `320x568-p6-line.png`, `568x320-t1-line.png`, `683x384-s2-q*.png`.
- Keyboard: Tab goes through the sticker checkboxes in order, then the reasoning radio group, then Next, ← Choose a set and Lesson Menu. Each focused control has a visible 3 px outline on its label card.
- Screen-reader names:
  - each group has a legend ("Choose all that do:", then the reasoning question);
  - each checkbox and radio is named by its label text;
  - the line inputs are "Lower ten / Upper ten" and "Lower hundred / Upper hundred";
  - the test's Start buttons carry ": Rounding Check-Up" in hidden text.
- No JavaScript errors and no missing files in any run.

## Environment

- Windows 11 Pro 10.0.26200; Node v26.5.0; headless Google Chrome 155.0.8059.39 driven over CDP through `tests/lib/harness.mjs`, served under `/Mathbook/` as on GitHub Pages.
- Textbook pages extracted with `node tools/extract-textbook-pages.mjs` (pp. 37–42 read from `docs/textbook-references/chapter-2/pages/`).
- Browser suites run one at a time. Every browser and server was closed in `finally`. No `mathbook-chrome-*` process was left running (checked after each run).

### Re-verification (commit c0cd053)

Re-checked `git show c0cd053 -- curriculum assets index.html tests` with my own key script (`r22/keys.cjs`, `r22/dump.cjs`) and a new browser script (`r22/rv.mjs`). I re-ran every suite one at a time:

| Suite | Result |
|---|---|
| `npm test` | 89/89 |
| Check-Up | 25/25 |
| 2-2 | 96/96 |
| 2-1 + Home | 198/198 |
| lessons (2-3, 2-4, 2-5) | 349/349 |
| 2-3 skills | 71/71 |
| 2-4 skills | 62/62 |
| 2-5 skills | 68/68 |
| Number Words | 64/64 |
| components | 52/52 |

No `mathbook-chrome-*` process was left running.

**Result: L22F-01 to L22F-05 verified. One new minor finding (L22F-06).**

| ID | Status | Evidence |
|---|---|---|
| L22F-01 | verified | **p1:** 36 is between 30 and 40, halfway 35, so it rounds to 40. The parent tip now says 36. <br>**t10:** "Leo says 65 rounded to the nearest ten is 60…"; the key is "No" and 70 (65 is halfway and rounds up). <br>**t11:** "Which round to 600 pages (nearest hundred)?" with 549 → 500, 550 → 600 ✓ (halfway), 582 ✓, 600 ✓, 637 ✓, 651 → 700. <br>**Overlap:** no number taught in the Check-Up practice is in the Rounding Test, and no practice number is in the Check-Up test. The only overlaps left are within practice (p4/PR1 485, p5/PR4 418) and the p12 budget $45, which is not rounded. <br>The new unit test enforces both directions. |
| L22F-02 | verified | **t9:** "Round 68 to the nearest hundred, then explain why." The key is 0, 50, 100, 100 with "It is past the halfway mark". <br>In the app at 320×568, the parts read "What two hundreds is 68 between?" and then "Which hundred does 68 round to?", with the line labelled 0 \| 100 \| 50 (Question 9 of 12). There is no sideways scroll (scroll width 320 = client width 320). <br>Screenshot: `r22/shots/rv-320-t9.png`. |
| L22F-03 | verified | **t12:** $26, $18, $13. The estimate is 30 + 20 + 10 = 60 and the exact total is 57, so "Yes" with $3 left. <br>**p12:** $14, $23, $11. The estimate is 40 and the exact total is 48, which is more than 45, so "No". <br>**PR2:** 628 rounds to 600 and is still a distractor. The key is still {681, 742, 715}. <br>**t11:** 637 is not a book number. <br>My scan against book items 1–12 (including the item-11 and item-12 amounts) and every Probe choice finds no book number in any practice, test or Check-Up item. The only match left is TR3's target 50, which is not a rounded number. <br>The unit test now covers prices, Check-Up items and select-all choices. |
| L22F-04 | verified | **Check-Up, select-all part only on Q1:** Home says "Rounding Check-Up: **0** of 4 answered". Continue is still shown, because the work counts as started. <br>**Check-Up, both parts of Q1:** Home says "1 of 4", and the test menu says "Unfinished: 1 of 4 answered so far". The two now agree. <br>**Set 2, select-all part only:** Home says "Practice on my own: 0 of 4 answered". <br>**2-1 regression check:** the Math Test with 6 answered includes chart and build types, and Home and the menu both say "6 of 10". |
| L22F-05 | verified, see L22F-06 | **2-2:** <br>• Check-Up 100% alone: the card shows no score and no "done". <br>• Then the Rounding Test at 75%: "Best test score: 75%" (`is-test`). <br>• A further Check-Up at 100%: still 75%. <br>**2-1:** <br>• Math Test at 50%: "Best test score: 50%". <br>• Math Test at 100%: "Best test score: 100%" (`is-done`). <br>• A saved attempt with no `testId` (older data) still counts: "Best test score: 70%". |

#### New finding

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L22F-06 | minor (shared `catalog.js` `progress()`) | Math Lessons list note, when only a lesson's second test has been taken | The new filter drops every attempt that is not from the main test, and the code then falls through to the Learn and "Started" checks. A finished test leaves no draft, set or guided data behind, so the card shows **no note at all**. <br>**Seen:** with fresh storage, Check-Up at 100% gave a blank 2-2 card. With fresh storage, 2-1's Math Words Test at 100% gave a blank 2-1 card. Before c0cd053, the 2-1 case showed "Best test score: 100%", so this is a regression for 2-1. The parent can no longer see from the list that the child has done any work in that lesson. | When there are attempts but none from the main test, still show a note without the "done" style. For example, show "Started" (`is-started`), or name the test: "Rounding Check-Up: 100%" / "Math Words Test: 100%" (`is-test`). Extend the browser check that covers L22F-05 to assert this note, for 2-2 (Check-Up only) and for 2-1 (vocab only). |
