# Lesson 2-6 Use Partial Sums to Add: independent build review

Reviewed build: worktree `Mathbook-26`, branch `claude/lesson-2-6`, commit `86ccc61` (diff against main `62a2d78`): `curriculum/chapter-2/lesson-2-6/lesson.js` and `index.html`, the 2-6 entry in `assets/js/catalog.js`, the new shared figure F11 `eqs` (`assets/js/figures.js`, `assets/css/mathbook.css`), the Home page count change (`index.html`), `tests/lesson-2-6.test.js`, `tests/lesson-2-6-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`.

I checked it against:
- textbook pp. 55–58 (page scans `page-055.jpg` … `page-058.jpg`);
- `docs/chapter-2/lessons/2-6.md`, including §15 Review fixes;
- `batch-B-plan-review.md` (B-04, B-06, B-16, B-17, B-18, B-24);
- `DESIGN.md` §2 component map, §4.2 chain preset `rows`, §4.3 vcalc `input: 'rows'`, and §6 layout rules;
- PLAN decisions.

Lessons 2-3 to 2-5 were used for the established look and feel. I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r26\` (written below as `r26/...`):
- `sample.cjs`: Node key, generator and grading check;
- `vp.mjs`: viewport sweep, 177 screenshots in `r26/shots/`;
- `flows.mjs`: Learn, Practice Together, On My Own review and test flows;
- `home.mjs`: Home "Continue" count.

**Result: 0 critical, 0 major, 5 minor.**

The math, answer keys, grading and child flows are right everywhere. The findings are:
- one shared Home count gap (L26-01);
- two places where a format is met without guidance or a visible cue (L26-02, L26-03);
- two polish items in feedback text (L26-04, L26-05).

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L26-01 | minor (shared Home page) | Home "Continue where I left off", `answered()` in `index.html` (the new chain-row and vcalc branches) | The change says a row answer counts only when "every box" is filled. But the check works out how many boxes there should be from the place-value keys the child has *typed*. Home has no access to the question. So some unfinished answers are still counted. I wrote each case into a real test draft and compared the test menu ("Unfinished: n of 13") with Home (`r26/home.out`):<br>(A) T1 with only the partial sums and the sum typed (no place values): menu **0**, Home **1**.<br>(B) T1 with only the first addend's place values, plus the sums: menu 0, Home 1.<br>(G) T3 with only the Sum box typed: menu 0, Home 1.<br>(C) T13 (labels to write) with the partial sums and the sum typed but all three label boxes empty: menu 0, Home 1. The stacked branch treats "all labels blank" as a question with no labels.<br>Complete answers (E stacked with 3 addends, F full row) and a partly labelled T13 (D) agree. Case A is a likely child path: write the partial sums first and leave the place values. The Continue button itself shows correctly. Only the "n of 13 answered" label is too high. | Count a row answer as answered only when it has at least 3 × addends + 4 non-blank boxes. Home cannot get the number of addends from typed keys alone, so do one of these:<br>• read the question from the draft (`d.questions[i]` is stored for tests);<br>• have the engine save a box count in the response;<br>• better, reuse `Q.isAnswered` (as suggested in L25-04).<br>For vcalc, look up `notes: 'input'` the same way, instead of guessing from the label values. Add cases A and C to `tests/browser.test.mjs`. |
| L26-02 | minor | Stacked control (vcalc `input: 'rows'`), all stacked items. It matters most in O8 and T13 (`notes: 'input'`). | (a) The spec (§13, B-04 fix) labels the stacked lines Hundreds / Tens / Ones. The row control shows these tags (`r26/shots/320x568-pt7.png`). The stacked control shows none (`r26/shots/320x568-own-o12.png`). The place names are only in the inputs' `aria-label`s.<br>(b) In O8/T13 the boxes where the child writes "300 + 200" are pale dashed boxes with no visible caption or placeholder. At 1366 px they sit to the left of the partial sums; at 320 px each sits above its partial-sum box (`r26/shots/1366x768-own-o8.png`, `320x568-own-o8.png`). The F11 figure above them draws its "= ___" blanks as dashed boxes of nearly the same look. Those look tappable but are not inputs.<br>(c) This "write the labels" format is never seen with guidance: not in Learn and not in Practice Together. The child meets it first in On My Own (no feedback until Check my work) and then in T13. The grading wants the hundreds on the top line, and nothing on screen says so. In practice the figure's line order guides the child, so the risk is small. That is why this is minor and not major. | Show a small visible place tag ("Hundreds", "Tens", "Ones") on each partial line of the stacked control, as the row control does. This also meets B-04. For `notes: 'input'`, add a visible caption over the label column ("What you add"). Do not use a placeholder with real numbers. Give the F11 blanks a look that is clearly not an input, e.g. a solid underline instead of a dashed box. Optionally add one guided item with typed labels (a Practice Together twin of O8). |
| L26-03 | minor | Skill `three`: Learn step 6, PT7, O12, T12 | Three addends **stacked** (T12) are practised only by O12, on your own, with no hints. Learn step 6 shows three addends only as an example, in a row. Its Your Turn is a two-addend story (the same as the spec's step 5). PT7, the only guided three-addend item, is in a row. My Results' "Practice this skill" for `three` has 1 question. The stacked control with three addend rows (`r26/shots/320x568-own-o12.png`) therefore first appears without guidance. The test's T6 format ("Which equation has these partial sums?", choose from 4) is also not practised (O5/PT4 type the addends; O6/PT5 choose a method), but it is close enough to O5. | Add one guided three-addend stacked item (e.g. a Practice Together item with new numbers). Or let Learn step 6's Your Turn sometimes, or always, ask a three-addend stack, with the story as a second part. Update the spec §6 table, counts and tests to match. |
| L26-04 | minor (shared engine, visible in 2-6) | Row control: Practice Together and Learn Check with one box left empty | PT7 (241 + 306 + 132) with every box filled except the "0" for 306's tens shows only "**Write an answer first.**" (`r26/flows.out`, `pt7blank`). It does not say which box is empty, or that 0 must be written. A child who thinks "there are no tens, so nothing to write" is told to write an answer they believe they wrote. The engine's chain check already has the better message ("Write a whole number in every box of the tens line."). It does not show, because the "not answered" gate fires first. Rows with a 0 digit are common here: 306, 403, 204, and Learn pairs such as 430. | When a chain is partly filled, show the chain's own message for the first empty line, and add "0 counts" for the `rows` preset, e.g. "Write a number in every box of the tens line. If there are no tens, write 0." Keep "Write an answer first." for a completely empty control. |
| L26-05 | minor | Reveal after two misses (Learn steps 2, 3, 6; Practice Together) | The reveal prints the full worked model twice in a row: "The answer is 300 + 400 = 700 · 70 + 30 = 100 · 5 + 0 = 5 · 700 + 100 + 5 = 805. Hundreds: 300 + 400 = 700. Tens: 70 + 30 = 100. Ones: 5 + 0 = 5. 700 + 100 + 5 = 805." (`r26/flows.out`, S2 second miss; screenshot `r26/shots/f-learn2-reveal.png`). The math is right; it just reads long for a third grader. The results page has the same pair ("Correct answer" + "Why"), which is acceptable there. | For `rowQ`/`stackQ`, keep the explanation to what the answer line does not say, e.g. only the `lead` for stories, or "Add each place, then add the partial sums." Or shorten the engine's `correctText` for these controls to just the sum. Adjust the explanation checks in `tests/lesson-2-6.test.js`. |

## The builder's deliberate choices: judgement

1. **Six Learn steps (the "same sum either way" step split out): sound. I agree.**
   - The engine has one question per Learn step, and the spec's step 3 Your Turn needed both a stacked answer and a "why" choice.
   - The new step 4 is a good addition. It shows the Be Curious icons (11 in rows of 5 and in rows of 3) and the row and stacked work side by side for 368 + 154. Its Your Turn asks "will the stacked sum be the same/bigger/smaller" and "why". It shows the child's own new pair as row work with the sum, next to the stacked labels.
   - Nothing the child must type is printed, and the "why" key is the spec's sentence, with the spec's two wrong choices plus one more false one.
   - `catalog.js` has `steps: 6`, so Home and the list say "of 6".
2. **M-STACK as chain preset `rows` and vcalc `input: 'rows'`: sound. It matches DESIGN §2/§4.2/§4.3.**
   - Grading meets §13 and B-04 in both modes:
     - place values in either order within a line (any order for 3 addends);
     - values, not digits ("2" for 200 is wrong);
     - every partial sum and the sum exact;
     - typed labels accepted in either order ("200 + 300" right for 346 + 271), with digit labels ("3 + 2") wrong.
   - Feedback names the line and gives no answer: "Look again at the hundreds line.", "Look again at the tens partial sum.", "Add the partial sums again."
   - Using the stacked control's own Sum box for stories instead of a separate "with unit" number part is fine: the prompt asks the question, and the explanation leads with "Add 358 + 475."
   - The one gap is the missing visible place tags on the stacked lines (L26-02).
3. **Someone else's work as F7 stacks or the new F11 `eqs`; reverse items as `num` with `anyOrder`: sound.**
   - F11 lines up the "=" signs as the book does (p. 56 One Way, p. 57 #5, p. 58 #8). It has a spoken label ("200 plus 100 equals 300. …") and drops the place tags to their own line below 380 px.
   - `anyOrder` accepts 451/234 for 234 + 451 and rejects 234/234.
   - The look of the F11 `___` blank is the only issue (L26-02b).
4. **Three addends: PT7 in a row, O12/T12 stacked: acceptable.** Both modes appear, and the row control fits three addends at 320 px (the "=" wraps to its own line, as DESIGN §6.3 allows). But stacked three-addend work is never guided (L26-03).

## Verified working

**Math and answer keys**
- Every Practice Together, On My Own and Test item recomputed by my own script, by place (`r26/sample.cjs`, `r26/sample.out`). All match spec §6–§8 and §12:
  - PT: 574, 662, 745, 234/451 → 685, 352, 679, 383.
  - O: 783, 893, 785, 423, 413/275 → 688, 372, 617, 599, 833, 697, 687, 483.
  - T: 884, 895, 629, 635, 259/630 → 889, 174 + 528, 536, 811, 842, 824, 703, 787, 841.
  - The partial sums are as listed in the spec.
- The T6 distractors are false: 154 + 728 gives 800/70/12; 174 + 582 gives 600/150/6; 167 + 528 gives 600/80/15.
- Every choice key is in its choices. No keyed choice prints a sum the child must type (B-05/B-07). The engine's correct response grades correct for all 35 authored items and the generated test.
- Distractors match B-24 for PT3, PT9, O6, O11, O13, T10 and T11.
- Learn examples are right: 368 + 154 = 400 + 110 + 12 = 522; 406 + 237 → 600, 30, 13 → 643; 345 + 123 work-backward; 132 + 305 + 214 = 600 + 40 + 11 = 651; 163 + 163 = 326. The Parent Guide uses 367 + 145 = 512 and 309 + 225 = 534.
- **Learn generators, 20,000 seeds per step:**
  - Steps 2–6 always give 3-digit a ≠ b, 101–899, with a + b ≤ 999.
  - At most one 0 digit in each number, and ones or tens make 10 or more.
  - Never a demo pair. I checked against my own list, which includes 132/305/214 and 241/306/132.
  - Step 1's number has non-zero tens and ones and is never 368, 154, 367 or 145.
  - The lesson's own `leaks` check found nothing. No figure prints the sum the child must type; in step 4 the sum is shown, but the child answers a choice there.
  - The "why" key is in the first position about 25% of the time.
- `npm test`: 100/100 pass.

**Coverage vs pp. 55–58**
- Be Curious (icons) is Learn 4.
- One Way / Another Way are Learn 2 and 3 (and the PT/O/T row and stacked items).
- Math is… Explaining is Learn 4's Your Turn.
- Work Together (Jun, "500 is the sum") is Learn 5 (Rami 406 + 237, with a 0 tens digit as in the book), PT3 and T10.
- Items 1–4 are O1–O4 and T1–T4. Item 5 (Whitney) is Learn 5's Your Turn, PT4, O5, T5 and T6. Item 6 is PT5 and O6. Item 7 (same number twice) is Learn 6, PT6, O7 and T7.
- Item 8 (row → stacked) is O8 and T13, with results hidden (B-06). Item 9 (stacked → row) is O9 and T8, labels only.
- Item 10 (watch steps) is O10 and T9. Item 11 (Amal, Error Analysis) is O11, with the dropped-ten variant in PT9, O13 and T11 (B-16).
- Item 12 (Extend) is Learn 6, PT7, O12 and T12. Reflect is the Learn finish screen and PT8.
- PT7's text is just "241 + 306 + 132" (B-18). No book numbers are in practice or test items.

**Functional (in the app, 390×844 and 1366×768)**
- **Menu:** Learn, Practice, Take a Test, My Results and the Parent Guide (with Reset Lesson Progress).
- **Learn:**
  - Each of the 6 steps goes Example (all parts) → Your Turn.
  - A wrong answer keeps Next Step locked, with coaching that names the place ("Look again at: Hundreds; Tens. What is each digit worth?").
  - A second miss reveals the answer, and Try a new one works. A right answer unlocks Next Step.
  - A refresh on step 6 keeps the phase, the typed values and the coaching.
  - The swapped place values in the row ("700 + 100" for 100 + 700) and swapped reverse addends were marked ✓.
  - Finish shows the reflection (journey test).
- **Practice Together (9):** each item has its hint (PT2 "70 + 80 is more than 100. That's OK!"). Wrong, partly right and right answers all work. PT7 with three addends in any order inside a line is ✓. PT4 with swapped addends is ✓; duplicated addends are ✗.
- **On My Own:**
  - One question at a time, with no hint, check or feedback while answering.
  - With O1 written as digits (3 + 4 = 7) and O8 with a digit label and a wrong sum: "11 of 13 correct", and Practice My Misses is offered.
  - The review shows the child's own entries with ✓/✗ in the control's layout. For example, O8 shows "200 + 300 ✓ … 4 + 7 ✗ … 600 ✗", with "Your answer: Places 200 + 300 | 4 + 7 | 6 + 1 · Partial sums 500, 110, 7 · Sum 600", the correct answer and "Why".
- **Test:** no hints, checks or answers (journey test). Choice order is shuffled per attempt; the "same/bigger/smaller" compact choice is not used in the test. All right gives 100%; all wrong lists every mistake.
- **Saved progress:** a saved draft resumes, and results persist after a refresh.
- **Skill practice:** every test skill (row, stack, reverse, word, convert, error, three) has On My Own questions. Each "Practice this skill" opens only that skill and resumes after a refresh. `node tests/lesson-2-6-skills.browser.mjs`: 65/65 pass.
- **Reset Lesson Progress:** clears every `lesson-2-6:*` key, including skill practice. Other lessons and unrelated keys stay (journey and skill suites).
- **Home:**
  - The Math Lessons list shows 2-1 to 2-6, and Continue points to 2-6 with "Learn: step n of 6".
  - Fully answered row and stacked questions are counted the same as on the test menu (apart from L26-01).
  - A partly answered question still shows Continue.

**Device and accessibility** (headless Chrome, simulated viewports 320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, with touch below 1024 px)
- Screens per viewport: menu, Parent Guide and My Results; every Learn slide of all 6 steps and every Your Turn; all 9 Practice Together items; all 13 On My Own items; all 13 test items (`r26/vp.mjs`, `r26/vp.out`; 177 screenshots in `r26/shots/`).
- No sideways scroll and nothing past the edge.
- Every button, label and text input is at least 48 px tall, and every input is at least 44 px wide.
- The stacked control (2 and 3 addends) and the 3-addend row fit at 320 px.
- The smallest text in the controls and figures is the stacked place-label notes at 14.4 px (muted grey). It can be read but is small next to the book; consider bolder or larger text if L26-02 is reworked.
- Inputs have spoken names: "Hundreds of the first addend. Hundreds: this box plus box equals box", "Tens partial sum", and for the label boxes "Hundreds: the place values you add, like 300 + 100".

**Regression** (suites run one at a time)
- `lessons.browser.mjs 2-6`: 122/122.
- `lesson-2-6-skills.browser.mjs`: 65/65.
- `browser.test.mjs` (2-1 + home): 198/198.
- `lessons.browser.mjs 2-3 2-4 2-5`: 349/349.
- `components.browser.mjs`: 52/52.
- The shared changes add things and do not change existing behaviour:
  - F11 is a new registry entry.
  - The CSS adds only new `.eq-*` rules.
  - The Home branches only apply to responses with `p<place>_<addend>` keys or vcalc `p`/`d` arrays. Earlier lessons' chain answers (2-5 `a`/`b`/`s`) take the old path, and 2-5's Home cases still pass in `browser.test.mjs`.
  - The catalog adds one entry.
- No JavaScript errors and no missing files in any run.

## Environment
- Headless Chrome driven through `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports were simulated with device-metrics emulation. No physical device.
- Textbook pages read from `C:\Users\bazeocrisy\Projects\Mathbook\docs\textbook-references\chapter-2\pages\`.
- Windows 11, 2026-10-10. No headless Chrome processes were left over (tasklist count 0). The owner's normal Chrome was not touched.
- The working tree has only this report as a new file. Nothing was committed.

### Re-verification at 5645088

I re-checked commit `5645088` (review fixes for L26-01…L26-05) with the same harness, headless Chrome and simulated viewports. I edited no app, lesson, engine or test file. New scripts: `r26/tip.cjs`, `r26/rv.mjs` (output `r26/rv.out`) and `r26/vp2.mjs` (output `r26/vp2.out`). Screenshots are in `r26/shots/rv/`. `npm test`: 101/101 pass.

| Finding | Status | Evidence |
|---|---|---|
| L26-01 | verified | I typed answers in the real app and went Home **without** pressing Next, so the save on input is what counts (`r26/rv.out`):<br>• Test T1 with only the partial sums and the sum typed: Home "0 of 13", test menu "0 of 13". The draft's `answered` is `[]`.<br>• Typing the six place values (still on Question 1): Home "1 of 13", `answered` `["t1"]`.<br>• T13 with its sums typed but the labels blank is not counted (still 1).<br>• On My Own (a parts item done, a 3-addend row missing its Sum, a stack missing its sum): Home "Practice on my own: 1 of 14 answered", `answered` `["o11"]`.<br>Older saves without `answered` fall back to the old count, and the 2-5 Home cases still pass (`browser.test.mjs`). |
| L26-02 | verified | The stacked control now tags each line Hundreds / Tens / Ones: Learn 3, PT2, PT10, PT11, O8, O12 and the test, at all six widths. The tags are beside the printed labels, or beside the label boxes in O8/T13/PT10 (`r26/shots/rv/320x568-pt10.png`, `320x568-pt11.png`, `1366x768-own-o8.png`). The F11 blanks are now dotted and transparent. They are still box-shaped, but clearly lighter than the dashed answer boxes.<br>The new guided **PT10** (Gia 257 + 318 → 500, 60, 15 → 575 ✓) gives the typed-label format a Practice Together item with a hint and a Parent Help tip. Grading:<br>• labels in place order with the two values swapped ("300 + 200", "10 + 50") → "✓ Correct!";<br>• ones written on the hundreds line → "Not yet. Look again at the hundreds: …" (see N-2). |
| L26-03 | verified | New PT11 (156 + 302 + 227 stacked → 600, 70, 15 → 685 ✓, guided, with the hint "302 has 0 tens") and O14 (125 + 340 + 218 in a row → 600, 70, 13 → 683 ✓). I recomputed both. Neither repeats a demo or book pair. Practice Together is now 11 and On My Own 14, and "Practice this skill" for `three` has 2 questions (skill suite 67/67). The spec §16 records the additions. |
| L26-04 | verified for the row control; stacked is only partly fixed (N-1) | PT7 with only the "0" box empty: "Write a whole number in every box of the tens line. If a place has nothing in it, write 0." In Learn step 2 with the tens and ones lines empty: "Write a whole number in every box of the tens line." This replaces the old message, and Learn 'tries' stays 0, so a partly filled answer does not use up a try. A completely empty control still says "Write an answer first." |
| L26-05 | verified | Row and stacked explanations now say the idea once: "Add the hundreds, the tens and the ones, then add the partial sums: 500 + 60 + 14 = 574." Stories keep their lead ("The same number twice: 176 + 176. Add …"). The answer line still lists each place line. |

**New findings (both minor)**

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| N-1 | minor | `Q.emptyTip` for vcalc `input: 'rows'` (stacked) in Learn 3/6 and Practice Together | A partly filled **stacked** answer says only "Fill in every box, then check." It does not name the line, unlike the row control: in PT2 with the tens partial sum empty, in PT2 and Learn 3 with the sum empty, and in PT10 with the tens label empty (`r26/tip.cjs`, `r26/rv.out`). `vcCheck` gives "Look again at …" for an empty box, so `emptyTip` falls through to the generic text. Better than before, but not "the first missing line" as described. | In `vcCheck`, report an empty partial, label or sum box as "Write the tens partial sum." / "Write what you add on the tens line." / "Write the sum.", for example. Or have `emptyTip` name the first blank `n:`/`p:`/`s` key for vcalc. |
| N-2 | minor (shared engine text, now seen in guided PT10) | vcalc label feedback | A wrong typed label gives "Look again at the hundreds: write the value of each **hundred digit**." On the tens line it says "each ten digit", and on the ones line "each one digit". This comes from the place name with the final "s" removed. Before PT10, the text was never shown to a child (O8/T13 have no feedback). | Use "the hundreds digits" / "the tens digits" / "the ones digits", e.g. "Look again at the hundreds line: write what each hundreds digit is worth, like 300 + 200." |

**Regression** (browser suites run one at a time):
- `lessons.browser.mjs 2-6`: 122/122.
- `lesson-2-6-skills.browser.mjs`: 67/67, including the new Home checks.
- `browser.test.mjs` (2-1 + home): 198/198.
- `lessons.browser.mjs 2-3 2-4 2-5`: 349/349.
- `lesson-2-2`: 96/96.
- `lesson-2-2-checkup`: 27/27.
- 2-3, 2-4 and 2-5 skills: 71/71, 62/62 and 68/68.
- Number Words: 64/64.
- Components: 52/52.

In the first chained run, `browser.test.mjs` printed no result and left a headless Chrome behind. That run overlapped with my own viewport sweep. Run alone it passed 198/198, and I closed the leftover headless Chrome.

The shared changes are limited:
- The empty tip only applies to the chain and vcalc models.
- The `.vc-ptag` tags only appear with `input: 'rows'`, which only 2-6 uses.
- The `answered` lists are additions to the saved data.

**Layout:** a viewport sweep at 320/390/768/1024/1366/1920 of every Learn slide and Your Turn, all 11 Practice Together items, all 14 On My Own items, all 13 test items, the menu, the Parent Guide and Results found no sideways scroll, no target under 48 px and no input under 44 px (`r26/vp2.out`, 193 screenshots). No JavaScript errors and no missing files.

No headless `mathbook-chrome-*` Chrome processes are left (count 0). The owner's normal Chrome was not touched. Node, Windows 11, 2026-10-10.
