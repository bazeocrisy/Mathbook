# Lesson 2-8 Adjust Numbers to Add or Subtract: independent build review

Reviewed build: worktree `Mathbook-28`, branch `claude/lesson-2-8`, commit `ad35679` (diff against main `86d9607`, where 2-7 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-8/lesson.js` and `index.html`;
- the 2-8 entry in `assets/js/catalog.js`;
- `tests/lesson-2-8.test.js`, `tests/lesson-2-8-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

There is no shared engine change. The lesson uses the chain preset `adjust` and the figures `arrows`, `nline` and `pics`.

I checked it against:
- textbook pp. 63–66 (page scans);
- `docs/chapter-2/lessons/2-8.md`, including §15 review fixes and §16 build notes;
- `batch-B-plan-review.md` (B-07, B-19…B-24);
- `DESIGN.md` §4.2 `adjust` and §6.

Lessons 2-3 to 2-7 were used for the established look and feel. I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r28\` (written below as `r28/...`):
- `sample.cjs`: keys, generators and grading in Node;
- `flows.mjs`: Learn, Practice Together, On My Own, Test and Home in the app, typing one key at a time;
- `vp.mjs`: viewport sweep, screenshots in `r28/shots/vp/`;
- `tags.mjs`: live +/− tags at 320 px.

**Result: 0 critical, 0 major, 5 minor.**

The math, keys and grading are right. The owner's main concern, keeping **adding** and **subtracting** apart, is handled well throughout (see "Adding vs subtracting" below). The findings are rare leaks in two Learn generators, a typography slip, the known soft-retry gap, the size of the "slide" in the number-line pictures, and a missing unit on story answers.

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L28-01 | minor | Learn generators: step 5 (`fixCheck`, subtraction) and step 6 (`storyCheck`) | Sometimes the number the child must type is printed in the prompt. The lesson's own `leaks()` check flags it. Over 20,000 seeds per step: step 5 31 times (0.16%), step 6 18 times (0.09%). Every case is a = 2b (so a − b = b), or the answer equals the changed number. Examples (`r28/sample.out`):<br>• "Hana finds 538 − 269. She changes only 269 to 270 and gets 268." The answer is 269, which is printed.<br>• "Nia finds 539 − 269 … to 270 …": the answer is 270, which is printed.<br>• "Lu walked 334 steps on Monday and 167 steps on Tuesday. How many more …?": the answer is 167.<br>Step 3 (`subCheck`) already excludes `a − b === b`. Steps 5 and 6 do not. | In `fixCheck` and `storyCheck`, retry when the answer equals any number in the prompt (`L._leaks(q)` is already there: loop until it is false). Add a sampled-seed check to `tests/lesson-2-8.test.js`, as 2-6/2-7 do. |
| L28-02 | minor | Every subtraction `adjustQ` item: Learn 3 and 6, PT2, PT3, PT5, PT9, O1, O3, O5, O8, O11, T1, T3, T5, T8, T11 | The prompt and the "Why" use an ASCII hyphen instead of the minus sign: "Adjust the numbers to make 364 **-** 198 easier", and "778 **-** 360 = 418, so 779 **-** 361 = 418" (`r28/shots/vp/320x568-pt2.png`, `r28/flows.out`). The figure just below uses "−", as do the engine messages ("Check 778 − 360."). This happens because `adjustQ` passes the caller's `'-'` to `opText` for the text and only converts it for `q.op`. A screen reader may read "dash", and the two signs look different on the same screen. | In `adjustQ`, convert `op` once (`const o2 = op === '+' ? '+' : MINUS`) and use it for the prompt, `how` and the explanation. |
| L28-03 | minor (builder's known limitation) | Adjust items in Learn and Practice Together | A swap or no-change answer counts as a miss, but spec §13/B-22 asked for a soft retry. In Learn 2, a wrong-direction answer followed by a swap (765 + 137 → 137 + 765) used up both tries. Next Step stayed locked and the full answer was revealed ("The answer is 765 + 137 → 762 + 140 = 902 …"), so the "Switching the order is not adjusting." message was never seen (`r28/flows.out`, "Learn 2 typed"). The messages themselves are right ("Switching the order is not adjusting. Change the numbers.", "Change the numbers to make them easier to work with."). | Acceptable for now. When the engine gets a "soft" result, use it for swap / no change / 0: show the message and do not count a try. Record it in DESIGN as a follow-up for the `adjust` preset (2-10/2-11 reuse it). |
| L28-04 | minor | Number-line pictures, PT5b, O8b, T8b (B-07) | The pictures meet B-07: only the original ends are labelled, the moved ends are unlabelled, there is no gap label, and the wrong gap is 60 shorter, so the choice is easy to judge by eye. But the slide is 3–5 on a line 400–500 wide (300–700 for O8b), so it is under 1% of the width. In the right picture the bottom band looks exactly like the top one (`r28/shots/vp/320x568-own-o8b.png`). The prompt says "The bottom line slides both numbers right by 3", but nothing visibly slides, so the picture shows "same length" and not "both ends moved the same way". The major labels (300 400 500 600 700) are tight at 320 px but readable. | Show the slide. Options:<br>• use a larger shift in the picture item (e.g. the adjustment to a hundred, +6 / +13 / +44);<br>• or zoom the line, e.g. major ticks every 50;<br>• or add small arrows from the old ends to the new ends.<br>The wrong picture can keep "60 shorter". |
| L28-05 | minor | "How many more" stories: Learn 6, PT9, O11, T11 | The answer box is labelled "Difference" (the `adjust` preset default), not with the unit. Spec §5 step 5 and PT9 ask for "answer with unit", and 2-7's stories label it ("Hearts: 286 − 138 ="). The prompt has the unit, so the child is not blocked. | Pass `label` (e.g. "More rolls in June:") to `adjustQ` for the story items. `adjustQ` already supports `o.label` → `labels[2]`. |

## Adding vs subtracting (the owner's emphasis): judgement

**Clearly distinguished everywhere I looked. I found no place where the two rules are mixed up.**
- **Learn:**
  - Step 2 is "Adjust to add": "Take 2 from one addend. Give 2 to the other."
  - Step 3 is "Adjust to subtract": "In subtraction, do the same thing to both". It shows number lines labelled "255 apart" and "slid 3 to the right. The gap did not change", plus a −3 / −3 example.
  - The new step 4 "Adding or subtracting?" puts the book's 224 + 109 (−1, +1) and 333 − 212 (−2, −2) side by side. It explains why: "both numbers are parts of the total … the answer is the gap". Its Your Turn makes the child pick the right adjustment for a sum (distractors: both up, both down) and for a difference (distractors: opposite ways, one only). Then it asks the Math is… Structure question.
  - Step 5 says "In subtraction, the fix goes the other way!"
  - Step 6 ends with "Adding: opposite moves. Subtracting: same moves."
- **Hints:**
  - Adding: "What can you add to 137 to make a ten or a hundred? **Take that much from** 765."
  - Subtracting: "Change 211 to a ten or a hundred, and change 354 **the same way**."
  - PT2 "Add 2 to both.", PT3 "Take 2 from both."
- **Feedback** (in the app, with live tags):
  - Adding with +5 / +5: "You changed both numbers the same way. In adding, one goes up and the other goes down."
  - Subtracting with −2 / +2: "You changed them opposite ways. In subtracting, change both the same way."
  - One number only: "Take from one addend and give the same amount to the other." / "In subtracting, change both numbers by the same amount."
- **Explanations:** each one states the rule: "one goes down, the other goes up the same amount … In adding, take from one number and give the same amount to the other." / "both change the same way … In subtracting, add the same amount to both numbers, or take the same amount from both."
- **Fix items:** adding the extra gives "Subtract 2, because he added 2 extra"; subtracting too much gives "Add 4, because he took away 4 too many … the fix goes the other way". The wrong choices include the opposite direction.
- **Practice and test:** both rules are practised and tested on equal footing (add: O2/O4/O6, T2/T4/T6; subtract: O1/O3/O5, T1/T3/T5). The "same way in addition" error is in PT6, PT7, O10, O14, T10 and T13. The number line is used only for subtraction.

## The builder's deliberate choices: judgement

1. **Six Learn steps (new step 4 "Adding or subtracting?"): sound. I agree.** It is the clearest place in the lesson for the owner's emphasis (above). It also puts the Math is… Structure choice after the child has used both rules.
2. **Picture items as connected pairs (PT5 + PT5b, O8 + O8b, T8 + T8b): sound.** The adjust question is graded on its own, and the picture choice is A/B with B-07 pictures. Only the size of the slide needs work (L28-04).
3. **O14 (Zara 286 + 309 → 290 + 313 = 603; 595) added: sound.** Without it, T13's `error` skill would have no practice. The numbers are new. On My Own is 15.
4. **Known limitation (swap / no change counts as a miss): acceptable** as a minor deviation (L28-03). The messages are right, and the test marks it wrong, as the spec says.

## Verified working

**Math and answer keys**
- Every item was recomputed by my own script (`r28/sample.out`). All match spec §6–§8 and §12:
  - PT: 443, 166, 323, 365, 242, B, 573, Sam, 865, 78, 238.
  - O: 282, 375, 535, 653, 266, 287, 327, 267, A, {347 − 130, 337 − 120, 350 − 133} + "347 − 130 …", Dev, 78, 823, 313, 595.
  - T: 342 (B-21), 493, 335, 736, 255, 285, 456, 229, B, {427 − 220, 407 − 200, 430 − 223} + "407 − 200 …", Ben, 53, 939, 790.
- The engine's suggested adjustments are all valid: 382 − 100, 145 + 230, 955 − 420, 532 − 190, 163 + 330, 913 − 860 and so on.
- Every key is among its choices, no choice contains a number the child must type (B-05), and all B-24 distractors are present. The correct response grades correct for every item and the generated test.
- **Learn generators, 20,000 seeds per step** (apart from L28-01):
  - Step 1 always has exactly 3 right sums among 6.
  - Step 2: a is 120–799, b ends in 7–9, and a's ones are big enough.
  - Step 3: a is 300–999, a − b ≥ 50, and b ends in 7–9 (59%) or 1–2 (41%). The spec said 50/50, which is close enough.
  - Step 4: exactly one right choice in each row, and it makes a ten.
  - Step 5: about half addition and half subtraction. The fix direction is always right: subtract for addition, add for subtraction.
  - Step 6: difference 20–200, and b ends in 7–9.
  - Never a demo pair.

**Grading (Node and in the app)**
- Any valid adjustment is accepted: 243 + 200, 250 + 193, 366 − 200, 362 − 196.
- An unhelpful but valid one (249 + 194) is accepted with only "Tip: try to make a ten or a hundred."
- These are rejected:
  - same direction in adding, and opposite directions in subtracting;
  - one number only;
  - a swap;
  - no change;
  - 0 ("Use whole numbers, 1 or more.");
  - a wrong result ("Check 366 − 200.").
- The guided messages never give the answer, and the test shows nothing (14 questions: no feedback, hints, checks or tags).
- The live tags appear in Practice Together and Learn ("+5 / +5", 47 × 27 px, 18 px text, spoken as "changed by +5"). They do not appear in On My Own or the test, as DESIGN says.
- The review shows the child's own numbers with ✓/✗ ("150 ✗ + 231 ✗ = 381 ✗", "Your answer: 147 + 228 → 150 + 231 = 381").

**Coverage vs pp. 63–66**
- Be Curious (four equal sums, new numbers 46 + 29 …) is Learn 1. Learn add/subtract (224 + 109, 333 − 212) is Learn 2–4. Math is… Structure is Learn 4. Work Together (Marco +3 both) is the Learn 5 slide, PT6, O14 and T13.
- Items 1–6 are O1–O6 and T1–T6. Item 7 is PT4, O7 and T7. Item 8 (number line) is Learn 3, PT5, O8 and T8. Item 9 is O9 and T9 (B-20). Item 10 is PT7, O10 and T10. Item 11 is Learn 6, PT9, O11 and T11. Item 12 (Yazmin) is Learn 5, PT8, O12 and T12, with the subtraction case (B-19) in PT11 and O13.
- Reflect is the Learn finish screen and PT10. The two-step story (B-23) is Learn 6 slides 2–3.

**Navigation, progress and reset**
- Menu, Learn (6 steps; wrong stays locked; right unlocks; finish), Practice Together (12), On My Own (15, one at a time, no help shown, "13 of 15 correct" with misses), Test (14), My Results and "Practice this skill" all work. Every test skill has bank questions: add, sub, describe, numberline, choose, compare, story, fix and error (O14).
- Home "Continue": with T1 done, T2 without its answer and T3 swapped (answered, wrong), Home says "Adjust Numbers Test: 2 of 14 answered", the same as the test menu.
- Reset clears only 2-8 (journey and skill suites).

**Phone, tablet and desktop**
- Viewports: 320×568, 390×844, 768×1024, 1024×768, 1366×768 and 1920×1080.
- Screens per viewport: menu, Parent Guide and Results; every Learn slide and Your Turn; all 12 Practice Together items; all 15 On My Own items; all 14 test items.
- No sideways scroll, every target is at least 48 px tall, and every input is at least 44 px wide (`r28/vp.out`).
- The arrows control fits at 320 px (three 58 px boxes on one row).
- The number-line pictures fit at 320 px. Their labels are readable but tight (L28-04).

**Runs** (browser suites run one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 122/122 |
| `lessons.browser.mjs 2-8` | 122/122 |
| `lesson-2-8-skills.browser.mjs` | 73/73 |
| `browser.test.mjs` (2-1 + Home) | 198/198 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left (count 0). I left the other projects' headless Chrome (ww-chrome, gml-chrome) alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports were simulated. No physical device.
- Windows 11, 2026-10-11.
- The working tree has only this report as a new file. Nothing was committed.

### Re-verification at 643be47

I re-checked commit `643be47` with light runs only, one at a time in the foreground:
- `r28/sample.cjs` (output `r28/sample2.out`), a Node check over 20,000 seeds per Learn step;
- `r28/rv.mjs` (output `r28/rv.out`) in headless Chrome at 320 px, with screenshots `r28/shots/rv-*.png`.

I edited no app, lesson, engine or test file.

| Finding | Status | Evidence |
|---|---|---|
| L28-01 | verified | Every Learn step's question goes through `noLeak`. Over 20,000 seeds per step (120,000 questions), the lesson's leak check finds **0** printed answers (before the fix: 31 in step 5 and 18 in step 6). All the other generator rules still hold, my sampler finds nothing wrong, and the fix direction is still always right (+ items ask to subtract, − items ask to add). |
| L28-02 | verified | No "digit - digit" (ASCII hyphen) appears anywhere: 0 in every authored item and 0 over all sampled Learn questions. Prompts now read "487 − 245", the same sign as the figure and the engine messages. |
| L28-04 | verified | The slides are 25 left (PT5b), 30 right (O8b) and 40 right (T8b). Each bottom line has two hop arrows from the old ends to the new ends, and at 320 px the slide is clearly visible (`rv-pt5b-320.png`, `rv-o8b-320.png`, `rv-t8b-320.png`).<br>• Right picture: the same amount twice (−25/−25, +30/+30, +40/+40).<br>• Wrong picture: a different amount at the right end (−85, −30, −20).<br>• Only the original ends are labelled. The moved ends have no labels, there is no gap label, and the difference is never drawn.<br>• The hop labels (25, 30, 40, 85, 20) are not answers. The child types 242, 267 and 229 in the adjust questions and picks A/B in the pictures. The prompt already says the slide amount.<br>• No sideways scroll at 320 px. The "−85" bubble sits close to its arrow but is readable. |
| L28-05 | verified | The story answer boxes are labelled with the unit: PT9 "More rolls in June", O11 "More pies this year", T11 "More tickets on Saturday" (seen in the test at 320 px). Learn step 6 uses the label for its story ("More orders in June", "More points for Ray", "More steps on Monday", "More tickets for the play"). |
| L28-03 | not re-checked (accepted) | Accepted by the coordinator as a known limitation and recorded in STATUS.md. Nothing changed. |

**Test mode:** T8b still shows no feedback. No JavaScript errors. No new findings. No `mathbook-chrome` processes are left; I left other projects' headless Chrome alone.
