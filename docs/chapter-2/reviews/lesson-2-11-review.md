# Lesson 2-11 Fluently Subtract within 1,000: independent build review

Reviewed build: worktree `Mathbook-211`, branch `claude/lesson-2-11`, commit `a0b72d0` (diff against main `26ed6f4`, where 2-10 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-11/lesson.js` and `index.html`;
- the 2-11 entry in `assets/js/catalog.js`;
- `tests/lesson-2-11.test.js`, `tests/lesson-2-11-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

There is no shared engine change.

I checked it against:
- textbook pp. 75–78 (page scans);
- `docs/chapter-2/lessons/2-11.md`, including the batch-C fixes (C-5, C-10…C-13, C-15) and §15 build notes;
- `batch-C-plan-review.md`;
- PLAN decision 10.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r211\` (written below as `r211/...`):
- `sample.cjs`: keys, generators, answer positions, printed-answer check and grading in Node;
- `flows.mjs`: Learn, On My Own, Test and Home in the app;
- `vp.mjs`: 7 sizes including 683×384 (200% zoom); 323 screenshots in `r211/shots/vp/`;
- `focus.mjs`: Tab order and above-the-fold checks.

**Result: 0 critical, 0 major, 4 minor.**

The math, keys, generators and grading are right, and the subtraction adjust rule is clear everywhere. The findings are:
- two accidental clues in test choices;
- one test format that is never practised;
- a layout note on the combined step 5;
- one small feedback-wording slip.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L211-01 | minor | T10 (extra information: "Which number do you NOT need?") | The choice is marked `compact`, and `subtractTest` only shuffles non-compact choices. So T10's choices are always `98 · 276 · 463`, with the key first: 200 out of 200 generated attempts had it in position 1 (`r211/sample.out`). 98 is also the only 2-digit number among the choices. In Practice the order is seeded (p10 key first, o7 key second). 2-10's test shuffled these choices; 2-11's doesn't. | In `subtractTest`, also shuffle compact choices that are not Yes/No (or shuffle all choices except a fixed Yes/No pair). Optionally use an extra number with 3 digits in T10, as in P10 (125) and O7 (115). |
| L211-02 | minor | T12 ("Is decomposing the only way to find 456 − 139?") | (a) The right answer is the only long, specific option: "No. You can also adjust both numbers (457 − 140) or count up (139 + ? = 456)." The other two are "Yes. Decomposing is the only way." and "No. You can add 456 + 139." That is a length clue, and the key also shows the adjusted equation for the number the child types next.<br>(b) This question format is never asked in Practice Together or On My Own; it appears only as a Learn 4 slide. The `strategy` skill's practice has the two-names item (O6) and the "decompose the wrong number" item (O11). Every T12 idea is practised, but not this question. | Make the three choices similar in length and detail, e.g. "No. Adjusting both numbers or counting up also work." / "Yes. Decomposing is the only way." / "No. You can add the two numbers instead.". Keep 457 − 140 for the explanation. Add one guided or On My Own item in this format with new numbers, or accept that P5/O6 cover the idea. |
| L211-03 | minor | Learn step 5 Your Turn (table + two-step in one question) | **The builder's known issue:** at 1366×768 and 1024×768 Check Answer ends at y 778, 10 px below the fold. Its label is visible and the button can be clicked, so it is acceptable (`r211/shots/f-try5-1366x768.png`). At 683×384 (200% zoom) this step needs about 490 px of scrolling, and at 390×844 about 170 px; both are expected for two questions. Separately, the prompt numbers the questions "(1) … (2) …" but the answer boxes are not numbered ("Miles farther:", "Points left:", "More than 100 left?"). The two boxes sit side by side on wide screens, so it is not obvious which box goes with which question. | Number the labels to match the prompt: "(1) Miles farther:", "(2) Points left:", "(2) More than 100 left?". Optionally put the two questions on separate lines in the prompt. The 10 px at 1366×768 needs no change. |
| L211-04 | minor (shared engine wording) | Guided "Look again at:" messages for labels that end in "?" (Learn 3, P4, O15 in retries) | For the related-equation choice, the message reads "Look again at: Which addition equation is related to 300 − 174 = ." `partsTip` removes a trailing "?" from the part label, and here that "?" is the unknown, so the equation ends in "= .". | In `partsTip`, do not strip a "?" that follows "= " (e.g. `/(?<!= )[:?.]$/`). Or label these parts "Which addition equation is related?" and keep the equation in the prompt. |

## The adjust rule and the owner's emphasis: judgement

**Clear and consistent.**
- **Learn 2:** "+5 and +5 … Add the same amount to **both** numbers … like sliding both ends of a ruler." Then a separate slide: "Remember: in **adding**, one number goes up and the other goes down. In **subtracting**, both move the same way."
- **Hint:** "How much does 107 need to reach 110? Add that much to 976, too."
- **Feedback:** opposite moves get "You changed them opposite ways. In subtracting, change both the same way."; one number gets "You changed only one number. In subtracting, change both numbers by the same amount.".
- **Explanations:** every adjust explanation repeats "(In addition, one goes up and one goes down. In subtraction, both move the same way.)".
- **Other valid strategies are accepted** (Decision 10): taking the same amount from both (621 − 196 and 624 − 199 for 623 − 198; 973 − 104 in Learn; 720 − 395 in On My Own), with only the soft "Tip: try to make a ten or a hundred.". "Show answer" shows the asked-for pair (625 − 200, 725 − 400, 535 − 300).

**Other points of emphasis**
- **Every assessed skill is taught and practised:** decompose (Learn 1, P1, P2, O13, T1), adjust (Learn 2, P3, O14, T2), related (Learn 3, P4, O15, T3), subtract (P12, P13, O1–O4, O8, O9, T4, T5), strategy (Learn 4, P5–P7, O6, O11, T7, T8, T12; see L211-02) and apply (Learn 5, P8–P11, O5, O7, O10, O12, T6, T9–T11).
- **Language** is plain third-grade ("Fewer means subtract", "Farther means subtract the smaller distance", "That's backward!").
- **Numbers and text:** generated numbers are in range, answers and explanations are computed from the data, and there are no duplicate choices.
- **Answer positions** in Learn are even (step 3: 6,710 / 6,687 / 6,603; step 4: each of the 10 key-sets about 2,000). The only position problem is T10 (L211-01).
- **Hints never give the answer early:** "First take away the hundreds of 295…", "Start at 174 and count up to 300.", "Farther means subtract the smaller distance…". P3/P12's "198 is 2 from 200" and "Take 1 from both: 499 − 247" give the method, not the difference.

## The builder's choices: judgement

1. **The spec's 5 Learn steps: sound.** Decompose → adjust both → related addition → more than one way (with the "decompose the wrong number" mistake) → tables, extra information and two steps. This matches the book's p. 76 three-method example and its pp. 77–78 problems.
2. **O13–O15 added: sound.** They give the test's decompose, adjust and related skills (T1–T3) their own practice, with new numbers.
3. **Learn 5 combines the table and the two-step "more than 100?" in one Your Turn (numbered prompt), as the spec does: acceptable.** Both book ideas get a turn, and the explanation answers both. Number the answer labels (L211-03).

## Verified working

**Math and answer keys** (`r211/sample.out`): every item matches spec §6–§8 and §12.
- P: 475/435/432, 463/443/440/438, 425 (show 625 − 200), 475, 535, 35, 234, 153, 218, 125/188, 119/Yes, 252, 85.
- O: 444, 356, 59, 74, 257, 33, 115/123, 143, 442, 268, 324, 85/No, 457/437/434, 325 (show 725 − 400), 356.
- T: 484/434/433, 235 (show 535 − 300), 447, 79, 274, 157, the three ways/615, 334, 255, 98/187, 117/Yes, 317.
- My check (no exemptions) finds no answer printed in any item. Choices are never duplicated, and the correct response grades correct.

**Learn generators** (20,000 seeds per step)
- Step 1: a 400–989, b 111 to a − 100, with b's hundreds, tens and ones non-zero. Crossing a ten happens 49.6% of the time (spec: half).
- Step 2 (C-10): a 300–990, b 106 to a − 40 with ones 6–9, a + k ≤ 999. `show` is (a + k, b + k).
- Step 3: a 300–950, with a a multiple of 100 in 31%; b 100 to a − 50.
- Step 4: b's ones 7–9 and a − b ≥ 100.
- Step 5: distances increase (100–200, 201–330, 331–450); T a multiple of 50 from 500 to 900; left 20–200 and never 100. Yes 56% / No 44%.
- No demo number (564, 145, 419, …, 543, 134, 409) appears as a, b or the difference. The lesson's leak check finds nothing.

**Textbook coverage (pp. 75–78, map §9)**
- Be Curious "only way?" is Learn 4 and T12.
- Learn's three methods and the extra Sunday tickets are Learn 1–3 and 5, P1–P4 and T1–T3.
- Work Together is Learn 4, P5 and T7.
- Items 1–4 are O1–O4, P13 (C-11, 2-digit from 3-digit) and T4. Item 5 is P8, O5 and T6. Item 6 is Learn 4, P6 and O6. Item 7 is Learn 5, P10, O7 and T10. Items 8–9 are P12, O8, O9, T5 and P14. Item 10 (road sign table) is Learn 5, P9, O10 and T9. Item 11 (decomposed the wrong number) is Learn 4, P7, O11 and T8. Item 12 (two spends, more than 100?) is Learn 5, P11, O12 and T11.
- Reflect is the finish screen and P14.

**Navigation, practice, progress**
- **Learn wizard:** Example → Your Turn. A wrong answer stays locked with coaching ("Look again at: 602 − 200 =…"); a right answer unlocks.
- **On My Own:** 15 items, one at a time, no help shown. "14 of 15 correct", and the review shows the child's own steps with ✓/✗ ("then − 20 = 447 ✗").
- **Skill practice:** "Practice this skill" keeps its own progress (skills suite 64/64, including reset).
- **Test:** 12 questions; nothing shown on any question.
- **Home "Continue":** with T1 and T4 answered and T2 without its difference, Home says "2 of 12", the same as the test menu.

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384)
- Screens: every Learn slide and Your Turn, all 14 Practice Together items, all 15 On My Own items, all 12 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Targets are at least 48 px tall and inputs at least 44 px wide. The smallest text in the controls, tables and figures is 18 px.
- The road-sign tables, adjust arrows, decomposition tree and count-up line are readable at 320 px.
- **Keyboard:** Tab in the Example and Your Turn phases never lands in the hidden phase or on an invisible element.
- **Desktop (1366/1920):** steps 1–4 keep the question, its boxes and Check Answer on screen (Check bottom 486–668 of 768). For step 5 see L211-03.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 148/148 |
| `lessons.browser.mjs 2-11` | 109/109 |
| `lesson-2-11-skills.browser.mjs` | 64/64 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs`. Viewports were simulated; 200% zoom was simulated as 683×384. No physical device.
- Windows 11, 2026-10-11.
- The working tree has only this report as a new file. Nothing was committed.
