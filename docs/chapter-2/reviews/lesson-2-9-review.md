# Lesson 2-9 Use Addition to Subtract: independent build review

Reviewed build: worktree `Mathbook-29`, branch `claude/lesson-2-9`, commit `da1e0a7` (diff against main `a62a33a`, where 2-8 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-9/lesson.js` and `index.html`;
- the 2-9 entry in `assets/js/catalog.js`;
- `tests/lesson-2-9.test.js`, `tests/lesson-2-9-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

There is no shared engine change. The lesson uses:
- the F8 `bar` compare layout with lettered boxes;
- the chain control with a custom row for the frame "[A] + ? = [B]";
- the F5 open number line with hops.

I checked it against:
- textbook pp. 67–70 (page scans);
- `docs/chapter-2/lessons/2-9.md`, including "Review fixes (batch-C plan review)" C-1, C-9, C-13…C-15 and §16 build notes;
- `batch-C-plan-review.md`;
- DESIGN (F8, F5 hops, §4.2 frame, §6);
- PLAN decision 15.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r29\` (written below as `r29/...`):
- `sample.cjs`: keys, generators and grading in Node;
- `flows.mjs` / `flows2.mjs`: Learn, Practice Together, On My Own, Test and Home in the app;
- `vp.mjs`: viewport sweep, screenshots in `r29/shots/vp/`.

**Result: 0 critical, 0 major, 4 minor.**

The math, keys and grading are right everywhere. The lesson teaches the owner's emphasis (finding a missing addend to subtract, with the book's bar diagram and related equations) clearly; see the judgement below. The findings are:
- one readability issue in the counting-up pictures on phones;
- one test format with no practice;
- one common mistake that is not coached;
- one optional scaffold in the test.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L29-01 | minor | Counting-up number lines (F5 hops), Learn 3 slide 2 (248 → 250 → 300 → 563) and Learn 6 slide 3 (268 → 270 → 300 → 541) | The open line is drawn to scale, so a jump of +2 is only a few pixels wide. At 320 px the marks run together: "248250300" and "268270300" (`r29/shots/vp/320x568-learn3-slide2.png`, `320x568-learn6-slide3.png`). The "+2" and "+50" bubbles crowd the left end. At 390 px Learn 4 (153 → 160 → 200 → 400) is fine. This is the lesson's core method picture. The jump equations under the line repeat the numbers, so the child is not blocked. | Give the open number line a minimum spacing between marks (an open line does not need to be to scale; the book's open lines are not). Alternatively, stagger the labels above and below the line, or hide the middle tick labels below about 400 px. Re-check both slides at 320 px. |
| L29-02 | minor | T12 ("356 + 287 = 643. Which must also be true? Choose all.") | The select-all "must also be true" format appears only in the test. No Learn, Practice Together or On My Own item uses it. The `related` skill's practice has frames (O1, O3) and one choice (O2). Reflect and P10 (spoken) cover the idea, but the child first sees this select-all format in the test. This is the same pattern as L25-03. | Add one On My Own item in the T12 format with new numbers (e.g. "248 + 315 = 563 → choose all": 563 − 248 = 315 and 563 − 315 = 248, plus two wrong ones). Update the set count and blurb, the spec §7 and the tests. |
| L29-03 | minor | Counting-up answers in Practice Together and Learn (P3, P4, P7, P8, Learn 3–4) | The spec §10 names the "last jump" mistake: "Counting-up jumps not added together (child says 263) → Add all your jumps." P3 with the last jump typed (200 for 500 − 263) gets only "Not yet. Hint: Count up from 263 to 270, to 300, to 500." P3's own hint replaced the default one, which ends "Add your jumps.", so nothing on the screen says to add the jumps. Learn 3/4 and the default hints do say it. | Add "Then add your jumps." to the P3, P4, P7 and P8 hints. Better: when a counting-up answer equals the last jump (`w − nextHundred`), show a tip such as "That's your last jump. Add all your jumps." in guided modes. |
| L29-04 | minor (optional) | "Find the difference" items O6–O9 and **test** T6–T9 (`solveQ` default prompt) | Every one of these prompts prints the related addition equation for the child: "680 − 435 = ___. Use addition: 435 + ? = 680." The book's items 6–9 only say to use the relationship. In the test this gives away the "turn it into an addition equation" step in 4 of 12 questions. That step is still tested on its own in T1, T2, T4, T11 and T12, so this is a choice to make, not an error. | Optional: in the test (and perhaps On My Own), use "680 − 435 = ___. Use addition to find it." and keep the full equation in Learn and Practice Together. |

## Missing addend with the book's models (the owner's emphasis): judgement

**Taught clearly and in the book's order. I agree with how it is built.**
- **Bar diagram (book p. 68, p. 69 #5):** the F8 compare layout matches the book's picture: long whole bar on top, short part bar below, dashed "?" to the end.
  - Learn 1 introduces it with a story ("the long bar is the whole … the dashed part is the pages that are left").
  - The child fills the lettered boxes A (whole) and B (part) and says what "?" stands for.
  - The same diagram is in Learn 2, 5 and 6, P6, O5, O10, T4 and T5 (book #5a "fill in the bar diagram").
- **Two equations, one diagram (book p. 68):** Learn 2 shows "563 − 248 = ?" (subtraction with an unknown difference) and then "248 + ? = 563" (addition with an unknown addend) on the same diagram: "the part you know, plus the missing part, makes the whole … both ask the same question". The Your Turn makes the child pick `P + ? = W` against `W + P = ?`, `W + ? = P` and `? − P = W`.
- **Writing the related equation (book #1–3):** the frame "[A] + ? = [B]" (P2, O1, O3, T1) makes the child write the part and the whole in the right places. The fixed order follows C-14. A swap gives "Look again at the equation." and "The whole goes after the = sign." P1, O2, T2 and T12 practise and test the relationship in other ways.
- **Finding the missing addend:** counting up in friendly jumps (Learn 3, across zeros in Learn 4) with the open number line and jump equations. Every explanation shows the jumps, their sum, and the check ("Check: 294 + 398 = 692, so 692 − 294 = 398").
- **Unknown in another place (book #12):** Learn 5 (452 − ? = 237 → 237 + ? = 452, with the diagram), P9, O12 and T11.
- **The common error (book #4):** Learn 5 slide 3, P5, O4 and T3: "a difference can't be bigger than the whole".
- **Hints and messages** always point back to the model: "The whole is the biggest number. It goes in the long bar.", "Start with the part you know. What do you add to get the whole?", "{whole} is the whole. Start at the other number and count up to it."

## The builder's choices: judgement

1. **Learn follows the spec's six steps exactly: sound.** The order goes diagram → two equations → count up → zeros → unknown elsewhere and the error → compare stories. It builds the idea in the book's order.
2. **Every Your Turn retries until no worked-out answer is printed: sound.** Over 20,000 seeds per step, my sampler found 0 leaks.
3. **O10 also asks for the diagram boxes: sound.** It gives the test's `diagram` skill (T5) its own practice in the same format.
4. **Box A/B answers are numbers from the story (by design): sound.** Placing the given numbers in the right bars is the skill being checked. The leak check rightly skips "Box …" parts, and the unknown "?" is never printed.

## Verified working

**Math and answer keys**
- Every item was recomputed by my own script (`r29/sample.out`). All match spec §6–§8 and §12:
  - P: 242, 315/728/413, 237, 252, 349, 712/386/326, 242, 283, 234.
  - O: 413/847/434, 162 + ? = 300, 255/936/681, 433, 735/468/267, 244, 415, 346, 67, 400/186/214, 262, 236.
  - T: 425/769/344, 173 + ? = 500, 274, 524/297/227, 900/438/462, 245, 436, 326, 165, 145, 227, and {643 − 356 = 287, 643 − 287 = 356}.
- C-1 holds: no other test item uses 356, 287 or 643.
- Every key is in its choices. The correct response grades correct for every item and the generated test.
- **Learn generators, 20,000 seeds per step:**
  - Step 1: W 400–900, P 120 to W − 100, P never a multiple of 100.
  - Step 3: W 300–950, P 100 to W − 60, P not a multiple of 10, W − P ≥ 50. The regrouping case is 65% (spec: at least half). The hint has "if you can" (C-9).
  - Step 4: H a multiple of 100 from 300 to 900, P 101 to H − 50, not a multiple of 10.
  - Step 5: W 300–900, R 100 to W − 80.
  - Step 6: S 150–600, L from S + 80 to 950.
  - The step 5 and 6 hints never mention hundreds (C-9). No demo number appears in any prompt or answer, and nothing is printed that the child must type.

**Grading**
- Frame: "315 + ? = 728, ? = 413" is right. A swap gives "Look again at the equation." "? = 1043" (added) gives "Look again at the answer." Only the "?" box filled counts as not answered ("Write a whole number in every box of the equation.").
- "?" choices are keyed to `part + ? = whole`.
- The error items: the sum (777) is ✗ with the hint "Can a difference be bigger than 563?".
- Compare items: bars swapped (386 / 712) gives "Look again at: Box A (the long bar); Box B (the short bar)."
- T12 is select-all: one of the two right facts is marked wrong.
- Guided messages never give the answer, and the test shows nothing (12 questions: no feedback, hints, checks or tips).
- The review shows the child's own entries with ✓/✗ ("847 ✗ + ? = 413 ✗ · ? = 434 ✓"; "Box A 400 ✓ · Box B 186 ✓ · Bulbs left to plant: 586 ✗").

**Coverage vs pp. 67–70 (map §9)**
- Learn 575 − 246 is Learn 1–3 (new numbers 563 − 248; the book's numbers are in the Parent Guide). Work Together is Learn 2–3 and P1 (with the parent prompt).
- Items 1–3 are the frames P2, O1, O3, T1 and the choices O2, T2. Item 4 is Learn 5, P5, O4 and T3. Item 5a/5b is Learn 6, P6, O5, T4 and T5.
- Items 6, 8 and 9 are P3, O6, O8, O9, T6, T8 and T9. Item 7 (`___ = 300 − 179`) is Learn 4, P4, O7 and T7.
- Item 10 is P7, O10 and T5. Item 11 (STEM money) is P8, O11 and T10. Item 12 (unknown subtrahend) is Learn 5, P9, O12 and T11.
- Reflect is the Learn finish screen, P10 and T12. C-15 contexts are changed as listed.

**Navigation, progress and reset**
- Menu; Learn (6 steps: a wrong answer stays locked with coaching, e.g. "Look again at: Box A (the whole). The whole is the biggest number…"; a right answer unlocks); Practice Together (10, with parent tips on P1, P3, P5, P9); On My Own (12, one at a time, no help shown, "10 of 12 correct" with Practice My Misses); Test (12); My Results and "Practice this skill" all work.
- Every test skill has practice: related, error, compare, diagram (O10), solve, apply and unknown. Only the T12 format is missing (L29-02).
- Home "Continue": with T2 and T6 answered, T1 frame without "?" and T4 boxes without the answer, Home says "Use Addition to Subtract Test: 2 of 12 answered", the same as the test menu.
- Reset clears only 2-9 (journey and skill suites).

**Phone, tablet and desktop**
- Viewports: 320×568, 390×844, 768×1024, 1024×768, 1366×768 and 1920×1080.
- Screens per viewport: menu, Parent Guide and Results; every Learn slide and Your Turn; all 10 Practice Together items; all 12 On My Own items; all 12 test items.
- No sideways scroll, every target is at least 48 px tall, and every input is at least 44 px wide (`r29/vp.out`).
- The bar diagram with boxes A/B and the dashed "?" fits at 320 px (`320x568-own-o5.png`).
- The frame "[A] + ? = [B]" and "? =" fit on two lines at 320 px (`320x568-pt2.png`). Its boxes are read aloud as "The part you know. Related addition equation: this box plus question mark equals box".
- The hops at 320 px: see L29-01.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 131/131 |
| `lessons.browser.mjs 2-9` | 122/122 |
| `lesson-2-9-skills.browser.mjs` | 67/67 |
| `browser.test.mjs` (2-1 + Home) | 198/198 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports were simulated. No physical device.
- Windows 11, 2026-10-11.
- The working tree has only this report as a new file. Nothing was committed.
