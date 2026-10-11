# Lesson 2-15 Use an Algorithm to Subtract: independent build review

Reviewed build: worktree `Mathbook-215`, branch `claude/lesson-2-15`, commit `8b6e1f3` (diff against main `2768cd2`, where 2-14 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-15/lesson.js` and `index.html`;
- the 2-15 entry in `assets/js/catalog.js`;
- `tests/lesson-2-15.test.js`, `tests/lesson-2-15-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`;
- spec §16.

There is no shared engine change. The lesson uses:
- vcalc `digits` with op −;
- vcalc `blanks` for missing digits;
- F7 `misalign: 'left'` with a neutral caption;
- F4 tables;
- `parts`.

I checked it against:
- textbook pp. 91–94 (page scans; p. 93 re-read: every item is regroup-free);
- `docs/chapter-2/lessons/2-15.md`, including Decision 18, D-1 and D-11;
- `batch-D-plan-review.md`;
- the owner's rules.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r215\` (written below as `r215/...`):
- `sample.cjs`: keys, a regroup-free check of every subtraction, printed answers, positions and grading probes in Node;
- `blanks.mjs`: the missing-digit control (keyboard, feedback, review);
- `wiz.mjs`: Learn focus and above the fold at 5 sizes;
- `vp.mjs`: 7 sizes including 683×384; 343 screenshots in `r215/shots/vp/`.

**Result: 0 critical, 0 major, 4 minor.**

The math, keys, regroup-free scope, D-11, the missing-digit grading and the child flows are right. The findings are:
- one hint that gives an answer digit;
- a generic empty-box message on the missing-digit control;
- a fixed position for the missing answer digit in the authored items;
- slightly narrow answer boxes in one Learn case at 320 px.

## Findings

| ID | Severity | Where | Evidence | Failure scenario | Suggested fix |
|---|---|---|---|---|---|
| L215-01 | minor | P6 hint (8,647 − 3,205) | The hint reads "0 tens: **4 − 0 = 4**." It is the spec's wording, but it tells the child the tens digit of the answer (5,4**4**2). All other hints name the method or the place ("Ones first.", "Line up the ones.", "Write a 0 when a place has nothing left."). | A child presses Show a hint and copies "4" into the tens box without doing that place. This breaks the owner's rule that hints must not expose answers. | Say the idea without the result: "The bottom number has 0 tens. What is 4 tens take away 0 tens?" Or "Taking away 0 leaves the top digit." |
| L215-02 | minor | Missing-digit control (vcalc `blanks`): Learn 4, P11, O11 in guided retry | With one blank left empty, Check answer says only "**Fill in every box, then check.**" (`r215/blanks.mjs`). The control's check message for an empty blank is "Look again at the tens.", so the shared empty-box tip falls back to the generic text. The 2-6 stacked fix (N-1) named the missing box; `blanks` was not covered then. | A child who leaves one of four scattered boxes empty is not told which one. | In `vcCheck`, report an empty blank as "Write the missing {place} digit of the {top/bottom/answer} number." so `emptyTip` names it, as it does for the stacked partial sums. |
| L215-03 | minor | Authored missing-digit items P11, O11, T11 | All three hide the **answer's thousands digit** (`result: ['Th']`). Only the top and bottom blanks move between places: P11 top T, bottom H/O; O11 top H, bottom T/O; T11 top O, bottom H/T. Learn 4 is varied (answer blank in O/T/H/Th about 25% each over 20,000 seeds). | After P11 and O11, the child can expect the test's answer blank in the same spot, and it is always the easiest box (thousands: top − bottom). The answer-blank skill is only tested in that one place. | Move the answer blank in the authored items, e.g. O11 answer blank in the tens and T11 in the hundreds, with one unknown per column. Update the keys and tests. |
| L215-04 | minor | Learn 2 Your Turn, 5-digit option, at 320 px | When Learn 2 draws the 5-digit − 4-digit case, the answer boxes are **40 × 52 px** at 320 px (narrower than 44). The wizard card's padding leaves less room than Practice (P8 at 320 is fine). No sideways scroll. | The boxes are slightly small to tap on the smallest phones. | Reduce the wizard card's side padding below 360 px, or let `.vc-in` shrink the column gap before the box width. |

## Areas the coordinator asked about: judgement

- **Missing-digit vcalc:**
  - **Grading:** all four boxes must be right. A wrong digit gives "Look again at the tens." with ✗ on that box only; "12" in a box is wrong. The answer is unique, because there is one unknown per column and no regrouping, so `top = bottom + difference` has exactly one digit.
  - **Review:** On My Own marks each box ✓/✗ (O11 with a wrong top digit: 1 ✗, 3 ✓) and lists "Your answer: Hundreds of the top number: 0 · …".
  - **Keyboard:** Tab moves top row → bottom row → answer row, then Check answer. Each box has a spoken name ("missing tens digit of the top number"). Typing does not jump ahead.
  - **At 320 px:** the boxes are 54 × 52 px and line up with their columns (`r215/shots/vp/320x568-pt11.png`). See L215-02 and L215-03.
- **Learn 3 check-with-addition choices: sound.**
  - The four steps never show the difference (checked over 20,000 seeds).
  - The key "Add your answer to {b}. You should get {a}." is in each position about a quarter of the time.
  - The distractors are real misconceptions (add to the wrong number; add the two numbers; subtract again).
- **Increase items: sound.** The "Year 1 to Year 2" / "Year 2 to Year 3" choices stay in time order. The keys vary (P12 Year 2→3, O12 Year 1→2, T12 Year 1→2; the Learn example is Year 2→3). The two increases differ only in the tens or ones (2,212 vs 2,221; 2,253 vs 2,232), so the child really compares. Every year-to-year subtraction is regroup-free.
- **Line-up items:** the caption ("Max's work") and spoken label are neutral, as intended. The F7 misalign style still draws a red outline round the shifted row, which points at where the mistake is but not what it is. The child must still choose "lined up the left digits" and compute the right difference. Acceptable.

## Owner's rules: judgement

- **Algorithms follow the book's exact scope (no regrouping):** every subtraction is regroup-free. That covers every vcalc, every word-problem pair, every table step, all 14 Practice Together, 14 On My Own and 14 test items, and 20,000 seeds of every Learn step (`REGROUP` check: 0). This matches p. 93 (558 − 247 … 17,982 − 2,580).
  - D-11 holds: Learn 1, 2(b) and 4 always have top thousands > bottom thousands.
  - Learn 1 has at most one 0 in the difference.
  - Learn 2 picks 4−3 / 4−4 (with zeros) / 5−4 about a third each.
- **Skills taught and practised:**
  - every test skill (sub3, sub43, sub44, zeros, sub5, left, part, missing, increase, together, lineup) has On My Own practice (D-1);
  - Learn teaches the algorithm, line-up, zeros, 5 digits, checking, missing digits and the three word types.
- **Third-grade language:** "There is nothing to take from the 5, so bring it down", "Write the 0s: they hold the places", "What minus 4 is 1? Think 1 + 4 = 5".
- **No printed answers** (my check, no exemptions) and no duplicate choices. Answer positions in Learn 3 and 5 are even. The test shuffles every choice except the year pair.
- **Hints:** good except L215-01.

## Verified working

**Math and keys** (`r215/sample.out`): every item matches spec §6–§8 and §12.
- P: 444, 432, 6,342, 3,232, 3,335, 5,442, 5,040, 22,245, 2,222, 2,524, (5, 2, 3, 2), 2,212/2,221/Year 2→3, 3,635, 4,346.
- O: 643, 422, 4,423, 9,223, 3,243, 3,331, 3,050, 44,312, 3,223, 3,423, (9, 1, 2, 3), 2,222/2,211/Year 1→2, 3,335, 5,635.
- T: 433, 451, 5,423, 7,332, 3,427, 5,243, 5,030, 33,354, 1,122, 3,243, (6, 4, 5, 2), 2,253/2,232/Year 1→2, 3,334, 7,324.
- The correct response grades correct for every item.

**Navigation and progress**
- **Learn:** steps 1–5 lock and unlock correctly (journey 109/109).
- **Focus and above the fold:** after "Now I'll Try", focus stays on the heading at all 5 sizes (the 2-14 fix is in main). At 1024, 1366 and 1920 px every Your Turn keeps the question, its boxes and Check Answer on screen (Check bottom 522–668 of 768).
- **On My Own:** "13 of 14 correct" with per-box review marks.
- **Skill practice:** separate progress (skills suite 83/83).
- **Test:** shows nothing (journey).

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384)
- Screens: every Learn slide and Your Turn, all 15 Practice Together items, all 14 On My Own items, all 14 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Targets are at least 48 px tall; the only narrow boxes are L215-04. The smallest text is 14.4 px (place headings).
- The stacks, the missing-digit boxes, the year tables and the line-up picture are readable at 320 px.
- **Keyboard:** Tab never lands in the hidden wizard phase.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 183/183 |
| `lessons.browser.mjs 2-15` | 109/109 |
| `lesson-2-15-skills.browser.mjs` | 83/83 |

My scripts are listed above. No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs`. Viewports were simulated; 200% zoom was simulated as 683×384. No physical device.
- Windows 11, 2026-10-11.
- Only this report file was added and committed.

## Re-check at 9ef1253

I re-checked commit `9ef1253` with these runs, one at a time:
- `r215/sample.cjs` (output `sample2.out`);
- `r215/learn320.mjs`, which opens every Learn Example and Your Turn of **2-3, 2-5, 2-6, 2-9, 2-10, 2-12, 2-13, 2-14 and 2-15** at 320×568 and 360×640: 200 screens.

I edited no app, lesson, engine or test file.

| Finding | Status | Evidence |
|---|---|---|
| L215-01 | fixed | P6's hint is now "Taking away 0 leaves the top digit." It gives no answer digit. |
| L215-02 | fixed | On P11, an empty box now says "Write the missing tens digit of the top number."; a filled wrong box still says "Look again at the tens." with ✗ only on that box. The change is inside the `blanks` branch of `vcCheck`, so other vcalc modes are unchanged. Every authored item still grades correct (BAD 0). |
| L215-03 | fixed | The answer blank now moves: P11 thousands, O11 **ones** (6,947 − 3,512: top H 9; bottom Th 3, T 1; answer O 5), T11 **tens** (5,786 − 3,452: top Th 5; bottom H 4, O 2; answer T 3). I recomputed both. Each column still has exactly one unknown, so each answer is unique, and the numbers are unchanged. Learn 4 is still even (answer blank O/T/H/Th about 25% each). |
| L215-04 | fixed | The new `≤ 360 px` Learn padding gives the 5-digit Learn 2 answer row full-size boxes. **Other lessons:** across the 200 Learn screens of 9 lessons at 320 and 360 px, there is no sideways scroll, nothing past the edge and no target under 48 px tall or 44 px wide. Bar diagrams, number lines, stacks and the 2-6 row control all still fit (`r215/shots/l320-2-6-try2.png`, `-2-13-try2.png`, `-2-15-try2.png`). |

**No regression:** the keys, the regroup-free check (0 regroupings over every item and 20,000 seeds per Learn step), D-11 and answer positions are unchanged. There were no JavaScript errors.
