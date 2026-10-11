# Lesson 2-12 Solve Two-Step Problems: independent build review

Reviewed build: worktree `Mathbook-212`, branch `claude/lesson-2-12`, commit `64eab8a` (diff against main `97142ca`, where 2-11 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-12/lesson.js` and `index.html`;
- the 2-12 entry in `assets/js/catalog.js`;
- `tests/lesson-2-12.test.js`, `tests/lesson-2-12-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

There is no shared engine change. The lesson uses F8 `bar` diagrams (ppw/cmp, letters, `shortTop`) and F9 Diagram A/B/C choices.

I checked it against:
- textbook pp. 79–82 (page scans);
- `docs/chapter-2/lessons/2-12.md`, including the batch-C fixes (C-2, C-3, C-4, C-6, C-13, C-15) and §15 build notes;
- `batch-C-plan-review.md`.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r212\` (written below as `r212/...`):
- `sample.cjs`: keys, generators, answer positions, pictures and printed answers in Node;
- `flows.mjs`: Learn, Practice Together, On My Own, Test and Home in the app;
- `vp.mjs`: 7 sizes including 683×384 (200% zoom); 313 screenshots in `r212/shots/vp/`;
- `focus.mjs`: Tab order and above-the-fold checks.

**Result: 0 critical, 0 major, 3 minor.**

The math, keys, generators and grading are right. The lesson teaches the owner's emphasis (know → first unknown → use it in step 2) clearly. The findings are:
- a position pattern in the authored Diagram A/B/C answers;
- one context that goes against C-15;
- one wording slip in a feedback message.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L212-01 | minor | "Which bar diagram shows …?" items P3, P4, O3, O4, T3, T4 | The right diagram is **never A** in any authored item: P3 B, P4 B, O3 C, O4 C, **T3 B, T4 B** (`r212/sample.out`). Each pair shares the same letter, and because A/B/C stay tied to the pictures, the test's two diagram items are B every attempt. A child who notices "it's B" after Practice Together (P3, P4 = B) gets both test items by position. Learn 4 is fine: over 20,000 seeds the key is A/B/C 6,713/6,728/6,559. The C-4 rule holds everywhere: no distractor is a valid picture of its equation. | Set the picture orders by hand (or pick seeds) so the authored keys vary, including A, and differ within each pair. For example P3 A, P4 C, O3 B, O4 A, T3 C, T4 A. Update the hand key in `tests/lesson-2-12.test.js`. |
| L212-02 | minor | Learn 5 Your Turn, "work backward" variant | The generated story is "A **bakery** makes {m} rolls in the morning and more in the afternoon. It sells {s} rolls…". C-15 moved every work-backward context away from bakeries because the book's #10 is a bakery: Learn 5 example (school garden), P11 (juice stand), O10 (farm stand) and T11 (popcorn stand) all follow it. Only this generator does not. | Use a non-bakery context in `kindsCheck` (e.g. "A lemonade stand makes … cups" or "A farm stand picks … apples"), or rotate a few contexts like the other generators. |
| L212-03 | minor (wording) | P6 feedback (and any two-field item whose label ends in "$") | The guided "Look again at" names the field with its money sign: "Look again at: **b = money he still needs: $.**". The label is "b = money he still needs: $", and `partsTip` only strips a closing ":", "?" or ".". | Put the dollar sign in front of the box as a prefix and keep the label "b = money he still needs:", or drop "$" from the label. Or make `partsTip` also strip a trailing ": $". |

## Two-step reasoning (the owner's emphasis): judgement

**Taught clearly, step by step.**
- **Learn 1 – a letter for the first unknown:** the story ("Max has 246… gets 131 more… wants 500") → the part-part-whole bar with the bracket *a* "stickers he has" → `246 + 131 = a`, a = 377. The Your Turn makes the child choose the matching equation, then find *a*.
- **Learn 2 – the missing part:** "He has 377. He needs 500. How many more?" → the compare bar (book's short-on-top layout) with the dashed *b* "stickers needed" → `500 − 377 = b` or `377 + b = 500`. The Your Turn asks for **both** valid equations (select-all).
- **Learn 3 – put the steps together:** both diagrams, then "Step 1: 246 + 131 = a, a = 377. Step 2: 500 − a = b … **Use the answer from Step 1 in Step 2.** Answer the question that was asked: 123 more stickers, not 377."
  - The Your Turn asks for named fields ("a = steps walked so far:", "b = steps still to walk:").
  - A child who stops after step 1 (types *a* in the *b* box) gets "Look again at: b = steps still to walk. What do you need to find first?".
  - One gap in Learn 3: its first slide shows the two diagrams without repeating the story numbers (246, 131, 500). The story is on the step 1 slides, so this is fine when going through in order.
- **Hints** point to the first step without giving numbers: "What do you need to find first?", "What does he have now?", "Find Ben's first.", "Cups sold + cups left = all cups made.".
- **Explanations** name both steps: "Step 1: 357 + 428 = a, a = 785. Step 2: 900 − 785 = b, b = 115.".
- **Alternative orders (C-2):** spend-twice and work-backward items grade only the final answer, and their explanations show both orders ("Or add the costs first … Both orders work."). Add-then and more-than items grade both named fields, because each asks for a named quantity.

## The builder's choices: judgement

- **Six Learn steps as specified: sound.** Letter → missing part → both steps → diagrams and equations (letter on either side) → kinds of stories → make sense. This follows the book's p. 80 two-step model and covers pp. 81–82.
- **A/B/C kept with their pictures in the test (not shuffled): sound**, but the authored positions need to vary (L212-01).
- **Practice Together 14, On My Own 12, test 12, and every test skill has On My Own practice: confirmed.** diagram: O1–O4; twostep: O5, O6, O7, O11; letters: O8, O9; backward: O10; sense: O12.

## Verified working

**Math and keys** (`r212/sample.out`): every item matches spec §6–§8 and §12.
- P: 775, 224, B/354, B/450, 694/344, 383/117, 48, 395/633, 342, 537, 290, 300, 677.
- O: 715, 227, C/347, C/520, 814/375, 19, 379/593, 322, 438, 295, 200, 669.
- T: 635, 256, B/365, B/750, 475/125, 200, 46, 471/813, 343, 567, 320, 494.
- No printed answers (my check has no exemptions), no duplicate choices, and the correct response grades correct for every item.

**C-4 distractors:**
- For `W − b = R`: the right picture is the compare bar W / R / dashed *b*; the wrong ones are W | R with bracket *b* (which means W + R = b) and W | *b* with bracket R (which means W + b = R).
- For `P + a = W`: the right picture is P | *a* with bracket W; the wrong ones are P | W with bracket *a* and the compare bar *a* / P / dashed W.
- Neither distractor is ever a valid picture.

**Learn generators** (20,000 seeds per step)
- Step 1: p, q 100–600, sum 300–900.
- Step 2: W 400–950, P 150 to W − 40.
- Step 3: a 250–800; "needed" T a multiple of 50 from a + 30 to 950; "left" T from 100 to a − 50.
- Step 4: W 300–950, letter value ≥ 60; sub/add 9,906/10,094.
- Step 5 (C-3): spend twice M 150–600, c1 50 to M − 70, c2 10–99, c1 + c2 ≤ M − 10; more-than x 100–400, d 50–250, 2x + d ≤ 999; work backward m 150–350, s 300–600, l 20–90, s + l ≤ 999, (s + l) − m ≥ 50. The three kinds are about a third each.
- Step 6 (C-6): x + y + z ≤ 999, three different parts.
- No demo number appears and nothing is printed.
- Answer positions are even: step 1 6,578/6,804/6,618; step 4 6,713/6,728/6,559; step 6 6,634/6,777/6,589; step 2 multi key pairs 3,241–3,379 each.

**Textbook coverage (pp. 79–82, map §9)**
- Learn Steps 1–2 (letters, part-part-whole and compare bars) are Learn 1–3.
- Work Together (collect, donate) is Learn 3, P5, O5 and T5.
- Items 1–2 (equation for a diagram) are P1, P2, O1, O2, T1 and T2. Items 3–4 (diagram for an equation) are Learn 4, P3, P4, O3, O4, T3 and T4.
- Items 5–7 (add then subtract, spend twice, more than then together) are P5–P8, O5–O7 and T5, T7, T8.
- Items 8–9 (letter on either side) are Learn 4, P9, P10, O8, O9, T9 and T10. Item 10 (work backward) is Learn 5, P11, O10 and T11. Item 11 (groups of 100) is Learn 5, P12, O11 and T6. Item 12 (story for a diagram) is Learn 6, P13, O12 and T12.
- Reflect is the finish screen and P14.
- Third-grade language throughout ("The bracket covers all the parts", "The dashed piece is what's missing").

**Navigation, practice, progress**
- **Learn:** a wrong answer stays locked with a coaching line; a right answer unlocks.
- **Practice Together:** coaching on the common mistakes, e.g. P8 with "157" for Ben gets "Find Ben's first"; P12 with "3" (boxes) gets "How many boxes are left? Each box has 100".
- **On My Own:** 12 items, one at a time, no help shown. "11 of 12 correct", and the review shows the child's own named fields with ✓/✗ ("b = miles Leo biked: 814 ✗").
- **Skill practice:** separate progress (skills suite 61/61).
- **Test:** 12 questions, nothing shown.
- **Home "Continue":** with T1 and T3 answered and T5 half answered, Home says "2 of 12", the same as the test menu.

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384)
- Screens: every Learn slide and Your Turn, all 14 Practice Together items, all 12 On My Own items, all 12 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Targets are at least 48 px tall and inputs at least 44 px wide. The smallest text in the bars and controls is 17.1 px.
- The bar diagrams, italic letters and dashed brackets are readable at 320 px. The three Diagram A/B/C pictures stack one above the other on phones, each with its own heading (`r212/shots/vp/320x568-pt3.png`).
- **Keyboard:** Tab never lands in the hidden wizard phase or on an invisible element.
- **Desktop:** at 1024×768, 1366×768 and 1920×1080 every Your Turn keeps the question, its answers and Check Answer on screen (Check bottom 423–732 of 768). At 683×384 (200% zoom) the taller steps need scrolling, as in 2-10 and 2-11.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 156/156 |
| `lessons.browser.mjs 2-12` | 122/122 |
| `lesson-2-12-skills.browser.mjs` | 61/61 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs`. Viewports were simulated; 200% zoom was simulated as 683×384. No physical device.
- Windows 11, 2026-10-11.
- The working tree has only this report as a new file. Nothing was committed.
