# Lesson 2-14 Fluently Add Multi-Digit Numbers: independent build review

Reviewed build: worktree `Mathbook-214`, branch `claude/lesson-2-14`, commit `b1f8416` (diff against main `a564c82`, where 2-13 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-14/lesson.js` and `index.html`;
- the 2-14 entry in `assets/js/catalog.js`;
- **shared** `assets/js/lesson-app.js`: the wizard scroll when a phase opens;
- `tests/lesson-2-14.test.js`, `tests/lesson-2-14-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`;
- spec §16.

I checked it against:
- textbook pp. 87–90 (page scans; p. 88 re-read for the three methods);
- `docs/chapter-2/lessons/2-14.md`, including D-1…D-4 and D-8…D-10;
- `batch-D-plan-review.md`;
- the owner's rules.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r214\` (written below as `r214/...`):
- `sample.cjs`: keys, generators, printed answers and positions in Node;
- `flows.mjs`: Learn, Practice Together, Test and Home in the app;
- `wizscroll.mjs`: the wizard scroll on **every Learn step of every lesson** at 4 sizes;
- `focus3.mjs`: focus after "Now I'll Try";
- `vp.mjs`: 7 sizes including 683×384; screenshots in `r214/shots/vp/`.

**Result: 0 critical, 0 major, 4 minor.**

The math, keys, generators, grading (including Decision 9 running totals) and child flows are right. The shared scroll change is safe for 2-1…2-13. The findings are:
- a focus detail in the wizard;
- a rare duplicate choice;
- narrow regroup boxes;
- two tested problem types that are not re-taught in this lesson's Learn.

## Findings

| ID | Severity | Where | Evidence | Failure scenario | Suggested fix |
|---|---|---|---|---|---|
| L214-01 | minor (shared engine, first seen in the wizard) | Learn 3 and 4 Your Turn (vcalc `input: 'digits'`), after "Now I'll Try" | The wizard puts focus on the Your Turn heading, but about 0 ms later the vcalc control's built-in autofocus moves it to the answer row: activeElement is "ones digit of the answer" (`r214/focus3.mjs`: step 2 stays on `.wiz-h`; steps 3–4 end in `ci vc-in k=d:4`). The page does not scroll (`preventScroll`), so sighted children see no change. 2-14 is the first lesson with a `digits` Your Turn in Learn; 2-6 and 2-10 use `rows`, which has no autofocus. | A screen-reader user pressing "Now I'll Try" hears "ones digit of the answer" instead of "Your Turn, The addition algorithm", and the prompt ("Use the algorithm: 4,392 + 1,715 = ?") is skipped. So the answer to "focus stays on .wiz-h" is: yes for every step, except the two algorithm steps here. | When the wizard renders a Your Turn, pass `autofocus: false` to the question (the vcalc option already exists, see `questions.js` around line 1270). Keep the autofocus in Practice and Test, where it helps. |
| L214-02 | minor | Learn 5 Your Turn, "fewer than" variant | `fewerQ` offers `small + diff`, `small − diff` and `diff − small`. When `small === diff`, the last two are the same text. My sampler found duplicate choices **4 times in 20,000 seeds** (`r214/sample.out`, "dup 5"). | Rarely, a child sees two identical "2,000 − 2,000 = ?" options. | In `storyCheck`, skip `small === diff` (e.g. `if (small === diff) continue;`). |
| L214-03 | minor (shared vcalc style) | Optional regroup boxes (`carries: true`): every algorithm item | The regroup boxes are **36 × 48 px** at every size (the viewport sweep flagged them on all algorithm screens; the answer-row boxes are fine). They are optional and never graded, and they are 48 px tall, but they are narrower than the 44 px minimum used elsewhere (`r214/shots/vp/320x568-pt4.png`). | A child who taps a small "1" box on a phone can miss it and hit the neighbouring box. | Give `.vc-carry` a minimum width of 44 px where there is room (they fit at 390 px and up), or make the tap area wider with padding while the box itself stays small. |
| L214-04 | minor | Skills `packs` (T10) and `twostep` (T12) | Both are tested and practised (P10/O10, P12/O12, with named step fields "Morning and afternoon together:" → "Evening:"), but 2-14's Learn does not teach them. Learn 5 covers useful information, "fewer than" and choosing a strategy. Both types were taught in 2-10 (packs; "two additions in a row") and 2-12 (two-step). | A child who starts at 2-14 meets the packs and "more than both together" items for the first time in Practice Together. It is covered there with hints, which is acceptable. | Optional: add one Learn 5 slide for book #12 ("First find together, then add the more": known → intermediate → step 2) and one for packs, with 4-digit numbers. |

## Shared wizard-scroll change: judgement (safe)

I ran `wizscroll.mjs`, which opens "Now I'll Try" from a scrolled position on **every Learn step of 2-1…2-14**, at 1366×768, 1024×768, 390×844 and 683×384 (308 step-openings).
- **Only tall Your Turns move.** At 1366×768 these are 2-4 step 4, 2-6 step 4, 2-7 steps 3–4, 2-8 step 4, 2-11 step 5 and 2-14 step 2; at 1024×768, also 2-4 step 5. Each scrolls the card to the top (scrollY 93). The heading stays visible (top 107 px), and the question starts at 177 px.
- **Check Answer:** for those steps it is now on screen (bottom 685–750 of 768), except 2-6 step 4 and 2-7 step 4. Those Your Turns are taller than the screen, so Check stays below the fold, as before, but now with the question at the top.
- **Everything else is unchanged:** every other step on desktop opens at scrollY 0.
- **Phones and 200% zoom are unchanged:** the rule needs ≥ 768 px wide and ≥ 560 px tall.
- **Focus:** stays on `.wiz-h` with `preventScroll` everywhere, except the 2-14 algorithm steps (L214-01, which is caused by the vcalc control, not by this change).
- **The Example phase is unaffected** (it has no Check button).
- The 2-1 rows in my sweep are not meaningful: 2-1 has its own Learn format, which my script's injected wizard state does not match, and the page errors were from that injected state. 2-1/Home 198/198 is in the builder's regression.

## Owner's rules: judgement

- **Skills taught and practised:**
  - decompose: Learn 1;
  - partial: Learn 2, P8, O8, T8;
  - algorithm: Learn 3–4, P1, P3, P4, O1, O3, O4, T1, T3, T4;
  - another way: P6/P6b, O6/O6b, T6/T6b;
  - error: Learn 1 slides 5–6, P5/P14, O5/O14, T5 (D-2: both Yes and No are practised);
  - fewer and useful: Learn 5, with practice and test items;
  - both: P13, O13, T13;
  - left and across: P2, P9, O2, O9, T2, T9 (D-10);
  - packs and two-step: practised, see L214-04.
- **Third-grade language:** "15 ones = 1 ten and 5 ones. Write 5. Regroup the 1 ten", "Who has more? If someone has fewer, the other has more", "Do the parts make the number?".
- **Numbers in range** (20,000 seeds per step):
  - Learn 1: b's digits non-zero, a + b ≤ 9,999.
  - Learn 2: at least one regroup, sum ≤ 9,999.
  - Learn 3: 1–2 regroups (1: 10,651, 2: 9,349).
  - Learn 4: 4+3 / 4+4 with sum 10,000–18,000 / 5+4 with sum ≤ 39,999, about a third each.
  - Learn 5: choice / multi 50/50.
  - No demo numbers appear.
- **Answers computed and never printed:** my check (no exemptions) finds no printed answer in any item. D-3 holds: the partial-sum rows are shown with "no total yet". D-9 holds: partial sums are typed rows. The Learn 1 labels show no running totals (D-4).
- **No duplicate choices** except L214-02. **No position patterns:** the authored keys vary (P5 2nd, P14 1st, O5 1st, O14 2nd, T5 3rd, …), and the test shuffles every choice on each attempt. The p6b/o6b/t6b "Is your sum the same?" key is always "Yes", which is right by design: the two methods must agree.
- **Alternatives accepted:** any order of regroup marks (ungraded). Learn 1 grades each step against the child's own previous line, so one slip is reported once ("Check 4,168 + 4,000.") and the final must be exact (D-4, Decision 9).
- **Hints don't expose answers:** "Start with the ones. If a place makes 10 or more…", "Add Leo's parts. Do they make 587?", "Add 250 again and again until you reach 700 or more."
- **Two steps** are known → intermediate → step 2 in P12/O12/T12, with named fields and the hint "First find 'together.' Then add the 'more.'" (see L214-04 for Learn).
- **Algorithm within the book's scope:** p. 88's three methods (decompose an addend, partial sums, algorithm with "Regroup 11 as 1 ten and 1 one") plus 5-digit items like the book's (P4 15,203 + 2,416; T4 23,105 + 4,672). Learn 4's 5-digit option goes up to 39,999, which matches Decision 22.

## Deviation (p6/o6/t6 split into two questions): judgement

**Sound.** The algorithm sum is graded on its own (vcalc digits). The "Is your sum the same as 600 + 110 + 12?" question follows right after and is answered against the shown rows. Counts: Practice Together 15 + explain (p8x), On My Own 15, test 14. Home and the test menu agree ("2 of 14").

## Verified working

**Math and keys** (`r214/sample.out`): every item matches spec §6–§8 and §12.
- P: 924, 3,566, 8,254, 17,619, Yes/2,903, 722/Yes, 3,640 + 1,285/4,925, 800/100/12/912, 8,612, 3/50, {1,465, 2,738}/4,203, 369/487, Yes/10,912, No/4,795.
- O: 852, 4,756, 8,243, 36,777, Yes/3,937, 811/Yes, 3,913, 700/100/12/812, 6,815, 3/100, 5,134, 376/492, 11,222, No/3,096.
- T: 946, 4,858, 8,242, 27,777, No/3,793, 834/Yes, 3,835, 800/100/14/914, 7,842, 3/150, 4,533, 366/493, 10,371.
- The correct response grades correct for every item.

**Grading and coaching** (in the app)
- Learn 1 with a slip in the first line: "Check 4,168 + 4,000." The later lines that follow from it are not marked.
- Learn 3 and 4 with a wrong ones digit: "Look again at the ones." P1 with a missed regroup: "Look again at the tens." No digit is ever given.
- Learn 5 wrong equation choice: "Look again at: Which equation helps. Who has more?…".
- P10 with "2 packs": "Add 250 again and again until you reach 700 or more."
- The test shows nothing on all 14 questions. Home "Continue" says "2 of 14", the same as the test menu.

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384)
- Screens: every Learn slide and Your Turn, all 16 Practice Together items, all 15 On My Own items, all 14 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Answer boxes are at least 44 × 48 px (regroup boxes: L214-03). The smallest text is 14.4 px (place headings).
- 5- and 6-column answer rows fit at 320 px (`320x568-pt4.png`). The "another way" item shows Mia's partial-sum stack and then the algorithm stack, both readable (`320x568-pt6.png`).
- **Keyboard:** Tab never lands in the hidden wizard phase. Focus after "Now I'll Try": see L214-01.
- **Desktop:** at 1024–1920 px every 2-14 Your Turn keeps the question, its boxes and Check Answer on screen (Learn 2 Check bottom 688 of 768 after the new scroll).

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 173/173 |
| `lessons.browser.mjs 2-14` | 109/109 |
| `lesson-2-14-skills.browser.mjs` | 87/87 |

My own scripts: `wizscroll.mjs` (all lessons), `vp.mjs`, `flows.mjs` and `focus3.mjs`. No JavaScript errors from the app (only the 2-1 errors caused by my injected state). No `mathbook-chrome` processes are left; I left other projects' Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs`. Viewports were simulated; 200% zoom was simulated as 683×384. No physical device.
- Windows 11, 2026-10-11.
- Only this report file was added and committed.

## Re-check at 611f677

I re-checked commit `611f677` with these runs, one at a time:
- `r214/sample.cjs` (output `sample2.out`);
- `r214/wizscroll2.mjs`, which opens "Now I'll Try" on every Learn step of **2-3…2-14** at 1366×768, 390×844 and 683×384 (201 step-openings);
- `r214/carry.mjs`.

I edited no app, lesson, engine or test file.

| Finding | Status | Evidence |
|---|---|---|
| L214-01 | fixed | Focus now stays on the heading on all 201 step-openings, including 2-14 steps 3–4. **Other lessons are not affected:**<br>• `Q.bind`'s new option is read only by the vcalc control, and only for `digits` answers, which no other lesson uses in a Learn Your Turn;<br>• in every other lesson, scrollY and focus are the same as in my first sweep. The only differences are Check Answer heights from the randomly generated questions;<br>• Practice and Test still autofocus the ones box as before. |
| L214-02 | fixed | In 20,000 seeds of every step: no duplicate choices (BAD 0, was 4) and no printed answers. |
| L214-03 | fixed | The regroup boxes are now 44 × 48 px at 320 px (P1, P6) and wider screens. On the widest item at 320 px (P4, 15,203 + 2,416, six columns) they are 40 × 48 px, limited by the column width. That is acceptable for optional, ungraded boxes. No sideways scroll (`r214/shots/rc-pt4-320.png`). |
| L214-04 | fixed | Learn 5 now has five slides. Two are new:<br>• "Packs: juice boxes come in packs of 150. A class needs 400. 150 (1 pack), 300 (2 packs): not enough. 450 (3 packs) covers 400. Buy 3 packs; 450 − 400 = 50 extra.";<br>• "Two steps: … We know Monday and Tuesday. Step 1: together, 132 + 215 = 347. Step 2: use 347. Wednesday: 347 + 104 = 451.".<br>Both are known → intermediate → step 2, in third-grade language, and correct. |

**No regression:** keys, generator ranges and positions are unchanged, the wizard scroll behaves the same for 2-3…2-13, and there were no JavaScript errors.
