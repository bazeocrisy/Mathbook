# Lesson 2-10 Fluently Add within 1,000: independent build review

Reviewed build: worktree `Mathbook-210`, branch `claude/lesson-2-10`, commit `1cb2a94` (diff against main `b61600c`). The diff covers:
- `curriculum/chapter-2/lesson-2-10/lesson.js` and `index.html`;
- the 2-10 entry in `assets/js/catalog.js`;
- **shared** `assets/js/questions.js` (the `adjust` preset accepts an optional `q.show` for the shown answer only);
- `tests/lesson-2-10.test.js`, `tests/lesson-2-10-skills.browser.mjs`, `tests/components.test.js` (+1), `tests/browser.test.mjs` and `package.json`.

I checked it against:
- textbook pp. 71–74 (page scans);
- `docs/chapter-2/lessons/2-10.md`, including the batch-C review fixes (C-5, C-7, C-8, C-13, C-15) and §15 build notes;
- `batch-C-plan-review.md`;
- DESIGN;
- PLAN decision 10.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r210\` (written below as `r210/...`):
- `sample.cjs`: keys, generators, answer positions and grading in Node;
- `flows.mjs`: Learn, Practice Together, On My Own, Test and Home in the app;
- `vp.mjs`: viewport sweep at 7 sizes, including 683×384 for 200% zoom; 298 screenshots in `r210/shots/vp/`;
- `focus.mjs`, `focus2.mjs`, `tryscroll.mjs`: keyboard Tab order and above-the-fold checks.

**Result: 0 critical, 1 major, 2 minor.**

The math, keys, generators, grading and child flows are right. The shared `show` change does not affect 2-8. The findings are:
- the packs items print their own answer;
- the column items do not collect the partial sums in a column;
- at 200% zoom the Your Turn question is not brought into view.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L210-01 | major | Packs items P9, O10 and **T10** (`packsQ`, book #10) | The two helper boxes are labelled with the two candidate pack counts, and the larger one is always the answer:<br>• "2 rolls = ___", "3 rolls = ___", "Rolls to buy: ___" (key 3);<br>• O10 "3 packs =", "4 packs =" (key 4);<br>• T10 "2 bags =", "3 bags =" (key 3).<br>So the final answer is printed in the question and is always the second label. My leak check (no exemptions) flags all three. `packsQ` marks the part `fromStory: true`, so the lesson's own check skips it. A child can answer "how many to buy?" by copying the bigger label number without deciding "is that enough?", and that decision is the skill book #10 teaches. The test item cannot tell whether the child understood it. The spec writes these labels, and the builder followed it, but they break the lesson rule that an answer the child must type is never printed. | Do not show the answer's own count as a label. Options:<br>• ask "How many in 1 roll, 2 rolls, 3 rolls, 4 rolls?" with one more row than needed, so the answer is not the last label;<br>• or ask "Is 2 rolls enough?" (yes/no) and then "Rolls to buy";<br>• or keep a single "Rolls to buy" box with the hint "Keep adding 250 until you have at least 700".<br>Then drop the `fromStory` exemption and update the spec §6–§8, the keys and the tests. |
| L210-02 | minor | Column items: Learn 2 Your Turn, P3, O13 and T4 | The problem is shown as a stack (634 / + 259 / line), but the child types the partial sums in labelled boxes in a 2 × 2 grid beside or under it: "Hundreds | Tens / Ones | Sum" at 768 px and wider (`r210/shots/f-try2-1366x768.png`). The book's column method (p. 72) and Learn 2's own example write 800, 80, 13 **under the line**, one per row, then the total under a second line. The shared control that does exactly this already exists: vcalc `input: 'rows'` (2-6 stacked partial sums, with the Hundreds/Tens/Ones line tags). It grades each partial and the sum the same way. | Use vcalc `input: 'rows'` for the column items, so the child writes the partial sums in the column under the problem. Or at least lay the four boxes out in one column, in order (Hundreds, Tens, Ones, then Sum). Keep the row items (Learn 1, P1) as they are. |
| L210-03 | minor (shared wizard) | Learn "Now I'll Try" at 200% zoom (1366×768 window at 200%, ≈ 683×384 CSS) | After "Now I'll Try", focus moves to the "Your Turn" heading, but the page stays scrolled to the top. The top bar (122 px, two rows at this width) and the "Learn / Step n of 5" header use the first 300 px, so the question prompt starts at y ≈ 302 of 384. Only the prompt's first line is visible, and Check Answer needs 169–374 px of scrolling (steps 1–5; `r210/tryscroll.mjs`, `r210/shots/f-try3-683x384.png`). At 1024×768, 1366×768 and 1920×1080 the prompt, every input and Check Answer are visible with no scrolling (Check Answer bottom 486–601 px). Phones at 390×844 are also fine. | When "Now I'll Try" (and Next Step) moves focus to the Your Turn heading, scroll that card's top into view (`scrollIntoView({ block: 'start' })`, which focus alone does not do when the element is already partly visible). At 200% zoom this brings the question and, for most steps, Check Answer onto the first screen. This is shared wizard behaviour, so check 2-3…2-9 once after the change. |

## Builder's choices: judgement

1. **The spec's 5 Learn steps: sound.** Row partial sums → column partial sums → adjust addends → "does this strategy work?" → useful information and two-step. This covers the book's p. 72 methods and the Work Together/Error Analysis ideas in a sensible order. C-8 holds: step 1 keeps the tens partial under 100, and step 2 always makes it 100 or more.
2. **Keep-the-sum pairs through the shared `adjust` control plus `show`: sound.** Any adjustment that keeps the sum is accepted (Decision 10):
   - 300 + 455, 305 + 450, and 298 + 457 (with the soft tip) for 299 + 456 are accepted. In Learn, 271 + 243 for 266 + 248 is accepted. In On My Own, 190 + 555 for 197 + 548 is accepted.
   - Rejected: same direction ("You changed both numbers the same way. In adding, one goes up and the other goes down."), a swap ("Switching the order is not adjusting."), and a wrong sum ("Check 300 + 455.").
   - "Show answer" now shows the adjustment the item asked for (299 + 456 → 300 + 455; 398 + 267 → 400 + 265; 197 + 548 → 200 + 545).
   - **Regression:** without `show`, the preset uses `adjustSuggest` exactly as before. The 2-8 journey passes 122/122 and components 52/52.
3. **O13 and O14 added: sound.** They give the test's `partial` (T4) and `adjust` (T5) skills their own practice, with new numbers.
4. **Packs labels "2 rolls =" / "3 rolls =" as in the spec: not sound for grading.** See L210-01.

## Verified working

**Math and answer keys** (`r210/sample.out`): every item matches spec §6–§8 and §12.
- P: 700/80/7/787, 783, 700/140/12/852, 755 (show 300 + 455), 784, 913, {expanded, 355 + 472}/827, 496, 500/750/3, 500/693, 337/483.
- O: 888, 675, 793, 899, 903, {expanded, 261 + 520}/781, 684, 625, 823, 450/600/4, 600/745, 377/495, 700/120/14/834, 745 (show 200 + 545).
- T: 788, 875, 823, 700/110/12/822, 665 (show 400 + 265), 726, {expanded, 430 + 349}/779, 613, 574, 600/900/3, 400/812, 385/512.
- No duplicate choices anywhere. The correct response grades correct for every item. The only printed answers are the packs labels (L210-01).
- T6 uses "289 + 437 … adds 1 to 289" (the spec writes 437 + 289). The math and key are the same.

**Learn generators** (20,000 seeds per step)
- Step 1 (C-8): hundreds digits 1–7 with sum ≤ 8; tens 1–8 with sum ≤ 9; ones 1–9 with sum ≥ 10.
- Step 2: tens sum ≥ 10, and a + b ≤ 999.
- Step 3: b ends in 7–9 or 98/99; a, b 101–899; a's ones ≥ k; a + b ≤ 999.
- Step 4 (C-7): a ends in 7–9, k = 10 − ones, a + b + 2k ≤ 999. The valid and invalid variants are 50/50 (9,918 / 10,082).
- Step 5: a, b 120–600, a ≠ b, c a multiple of 50 from 100 to 450, and c differs from a and b.
- No demo number appears in any Your Turn (a, b or sum), and no answer is printed.
- Answer positions are even: step 4 key at index 0/1/2 6,737/6,605/6,658; step 5 6,663/6,631/6,706.

**Textbook coverage and teaching clarity (pp. 71–74)**
- **Partial sums:** in a row (Learn 1, P1) and in a column (Learn 2 example with the partials under the line; P3, O13, T4; see L210-02).
- **Adjust addends:** Learn 3 with −1/+1 and −2/+2 arrows; P4, O14, T5.
- **Both strategies work (Work Together):** Learn 4, P5, T8.
- **Add 3 then subtract 3 (book #5):** Learn 4 (valid and invalid), P6, O5 (invalid), T6.
- **Another way to show (book #6):** P7, O6, T7.
- **Same number twice (book #7):** P8, O7, T9.
- **Packs (book #10):** P9, O10, T10.
- **Useful information (Exploring box, book #11):** Learn 5, P10, O11, T11.
- **Two additions (book #12):** Learn 5, P11, O12, T12.
- **Reflect:** P12 and the finish screen.
- Hints help without giving the answer early ("Add the hundreds first…", "The tens can make more than 100", "How much does 248 need to reach 250? Take that much from 266.", "Keep adding 250 until you have at least 700.").

**Navigation, practice, progress**
- **Learn wizard:** Example → Your Turn. A wrong answer stays locked with coaching ("Look again at: Hundreds…"); a right answer unlocks the next step.
- **Practice Together (12):** P9 with "2 rolls to buy" gets "Look again at: Rolls to buy.", and P3 with "14" for the tens gets "Look again at: Tens; Sum.".
- **On My Own:** 14 items, one at a time, no help shown. "13 of 14 correct", and the review shows the child's own entries with ✓/✗.
- **Skill practice:** "Practice this skill" has its own saved progress (skills suite 61/61, including reset and a full set that is unaffected).
- **Test:** 12 questions, nothing shown.
- **Home "Continue":** with T1 answered, T4 complete and T5 without its sum, it says "2 of 12", the same as the test menu.

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, and 683×384 for 200% zoom)
- Screens: every Learn slide and Your Turn, all 12 Practice Together items, all 14 On My Own items, all 12 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Every target is at least 48 px tall and every input at least 44 px wide. The smallest text in the controls and figures is 15.3 px on phones (`r210/vp.out`).
- The stack, the arrows and the equation lines are readable at 320 px (`r210/shots/vp/320x568-learn2-slide3.png`, `320x568-pt9.png`).
- **Keyboard:**
  - In the Example phase, Tab goes Start Over → Next part → (Previous Step) → Now I'll Try → Lesson Menu. In Your Turn it goes inputs → Check Answer → See the Example Again → Lesson Menu.
  - No Tab stop lands in the hidden phase or on an invisible element (at 1366×768 and 683×384).
  - The top bar is not sticky.
- **Desktop:** at 1024, 1366 and 1920 px the Your Turn question, its boxes and Check Answer are all visible on arrival. At 200% zoom, see L210-03.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 140/140 |
| `lessons.browser.mjs 2-10` | 109/109 |
| `lesson-2-10-skills.browser.mjs` | 61/61 |
| `lessons.browser.mjs 2-8` (adjust regression) | 122/122 |
| `components.browser.mjs` | 52/52 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports were simulated; 200% zoom was simulated as a 683×384 desktop viewport. No physical device.
- Windows 11, 2026-10-11.
- The working tree has only this report as a new file. Nothing was committed.

### Re-verification at fa0f1f6

I re-checked commit `fa0f1f6` with light runs only, one at a time in the foreground:
- `r210/sample2.cjs` (output `r210/sample2.out`), the Node sampler with no leak exemptions;
- `r210/rv.mjs` (output `r210/rv.out`) in headless Chrome, with screenshots `r210/shots/rv-*.png`.

I edited no app, lesson, engine or test file.

| Finding | Status | Evidence |
|---|---|---|
| L210-01 | verified | P9, O10 and T10 now ask "Rolls/Packs/Bags to buy:" (3, 4, 3) and "That many … hold:" (750, 600, 900). The prompt adds "Keep adding 250 until there are enough." No label or prompt prints a count or a sum the child types: my check, with no exemptions, finds **0** printed answers in all items and in 20,000 seeds per Learn step. The `fromStory` exemption is gone. The child now has to decide how many is enough. |
| L210-02 | verified | Learn 2 Your Turn, P3, O13 and T4 now use the shared stacked control (vcalc `input: 'rows'`). The partial-sum boxes sit under the line, tagged Hundreds / Tens / Ones with "400 + 300" etc. beside them, then the sum under a second line, as in the book and Learn 2's example (`rv-pt3-320.png`, `rv-2-10-try2-683x384.png`). The keys are unchanged (700/140/12/852, 700/120/14/834, 700/110/12/822), and the correct responses grade correct. No sideways scroll at 320 or 1366 px. |
| L210-03 | verified | **683×384 (200% zoom):** after "Now I'll Try" the wizard card is scrolled to the top (card top 12 px) and the question starts at y 89, where before it started at 302. Focus is on the Your Turn heading. Next Step at 683×384 also brings the new step's card to the top. Check Answer is now on the first screen for step 3 (bottom 340 of 384). Steps 1, 2, 4 and 5 still need 15–133 px of scrolling (bottoms 399–517). These items are simply taller than 384 px minus the card heading, so I judge the remaining scroll unavoidable and acceptable.<br>**No regressions:** 390×844 and 1366×768 behave as before (scrollY 0, focus on the heading). At 1366×768 every 2-10 Your Turn, including the taller column item, keeps Check Answer above the fold (bottom 486–698 of 768). Spot checks of 2-6 step 3 and 2-8 step 2 at 683×384 show the same improvement (question at y 89); at 390×844 and 1366×768 they are unchanged. |

No JavaScript errors and no new findings. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.
