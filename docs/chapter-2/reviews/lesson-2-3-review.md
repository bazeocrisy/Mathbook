# Lesson 2-3 Estimate Sums and Differences: independent build review

Reviewed build: worktree `Mathbook-23`, branch `claude/lesson-2-3`, commit `ecfce0d` (`curriculum/chapter-2/lesson-2-3/lesson.js`, `index.html`, the 2-3 entry in `assets/js/catalog.js`, `tests/lesson-2-3.test.js`). Checked against textbook pp. 43–46 (page scans), `docs/chapter-2/lessons/2-3.md`, `batch-A-plan-review.md` (A-01…A-18, N-02…N-04), `DESIGN.md` §1, F1 and §5.2, and PLAN Decisions 3, 5, 6, 7, 16, 24 and 27. I did not edit any app, lesson or test file.

Screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\7a0cb23c-28d2-48d1-8816-0e72e94d5362\scratchpad\r23\` (written below as `r23/...`).

**Result: 0 critical, 0 major, 7 minor.** Four minor items belong to 2-3 itself (L23-01 to L23-04). Three come from the shared engine and show up in 2-3 (L23-05 to L23-07).

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L23-01 | minor | Compatible-number choices: Learn step 4 Your Turn, Practice Together P5/P6, On My Own P5/P6, Test T5/T6 | At 200% zoom (683×384) the four `compact` choices sit in one row. Each pair breaks in the middle of its expression, with the operator at the end of one line and the second number on the next ("750 −" / "500", "825 −" / "375"). A child has to read the pair across two lines. DESIGN §5.2 calls for a 2×2 layout. At 768 px and wider, and at 390 px and narrower, the pairs show on one line. Screenshots: `r23/vp/683x384-learn4-try.png`, `r23/vp/683x384-test-q5.png`; for comparison `r23/vp/768x1024-guided-p5.png`. | Keep each pair on one line: use non-breaking spaces around the operator in `compatPairs` (and in the fixed `wrong` lists), or `white-space: nowrap` on the choice text. Or lay the 4 choices out 2×2 as DESIGN §5.2 says. |
| L23-02 | minor | Learn step 4, slide 4 ("Compatible numbers are not always the same as rounding") | The two side-by-side figures use 247 + 352: rounding gives 200 + 400 = **600** and compatible numbers give 250 + 350 = **600**. Both have the same result, so the slide does not show why the difference matters. A child can easily conclude that the two methods are the same. Screenshot: `r23/learn/s4-ex3.png`. | Use a pair where the two estimates differ and the compatible estimate is clearly closer, with numbers not used anywhere else. For example, 247 + 326: rounding 200 + 300 = 500, compatible 250 + 325 = 575, exact 573. Or keep 247 + 352 and add a sentence comparing the changed numbers (247 → 200 moves 47; 247 → 250 moves 3). |
| L23-03 | minor | Learn step 6 Your Turn ("Is Kim's answer reasonable?") | The child is never told what "close" means. Grading treats an answer within 100 of the nearest-hundred estimate as "Yes" (the builder's rule). Wrong answers are always more than 150 away, so the key is consistent. But the examples only show 594 vs 600 (6 away) and 794 vs 600 (194 away). In 5,000 sampled seeds, about 25% of the "Yes" items are 50–100 away from the estimate (for example "349 + 348 = 697", estimate 600). In about 21% of the "No" items the wrong answer is only 151–200 away. A careful child can reasonably call 98 away "far". | Add one sentence to the step 6 Explain or slide 2, such as "Close means less than 100 away from a nearest-hundred estimate." Or add a "Yes" example that is about 80 away. |
| L23-04 | minor | Test results → "Practice this skill (Set 1)" | I missed round100, word and check. Every "Practice this skill" button opened the whole 14-question mixed Set 1, starting with an unrelated item (P14 "Estimate 547 − 183 two ways"). The child gets no focused practice on the missed skill. Screenshots: `r23/test/t-results.png`; the output of `r23/test2.mjs` (PRAC line). | Open only the items for that skill. Either give the lesson skill-sized bank sets, or make the engine filter Set 1 by `skill` when it starts from a skill button. |
| L23-05 | minor (shared engine, visible in 2-3) | Parent Guide, section D | The heading reads "Checklist: the five Learn steps", but 2-3 has six Learn steps, and its checklist includes a test-score line. This is hard-coded in `lesson-app.js` `parentLearnView`. Screenshot: `r23/teach.png`. | Build the count from `L.seeIt.steps.length`, or change the heading to "Checklist". |
| L23-06 | minor (shared engine) | Parent Guide jump buttons (A · Goal, B · Math words, C · Demonstrate, D · Questions…) | These buttons are 44 px tall at every viewport tested (320 to 1920 wide, and at 200% zoom). That is below the 48 px target. All other buttons, inputs and choices I measured are 48 px or more. | Give `.hero` jump buttons `min-height: 48px`. |
| L23-07 | minor (shared engine) | Learn Your Turn after two misses, on a choice part | The reveal line prints a doubled period: "Is Kim's answer reasonable? Yes. It is close to the estimate.." The choice text already ends in a period and the engine adds another. Screenshot: `r23/learn6-two-misses.png`. | When the reveal text already ends in punctuation, don't add a second period. |

## Builder's stated deviations: judgement

- **No arrows figure on word problems.** Agreed. The F1 layout prints + or −, which would give away the "Add or subtract?" part. The other Learn Your Turns and the Practice Together items do show F1 with "?" boxes (Decision 27). On My Own and the Test show plain fields (verified on screen and in data).
- **Method named at the end of the prompt** (for example "… About how many stickers does Mia have? Round each number to the nearest hundred."). Acceptable. The story reads naturally first, and the method is always stated, so each item has exactly one expected estimate (Decision 3).
- **"Kim's answer is close" = within 100 of the estimate.** The rule is sound. The nearest-hundred estimate of two 3-digit numbers is always within 99 of the exact answer, and the generated wrong answers are always more than 150 away, so the key is never ambiguous. The child is not told the rule, though (L23-03).
- **First compatible-numbers Your Turn per page load avoids regrouping.** Verified over 400 fresh module loads: 0 first questions needed regrouping, while 147 of 400 second questions did. The question is saved with the step, so a refresh keeps it. The spec says "per visit", and per page load is an acceptable reading.
- **Generated questions redrawn if they would print their own answer.** Verified: 24,000 sampled questions (4,000 per Learn step), and no typed answer appeared in the prompt, labels, choices or figure label.

## Verified working

**Math and answer keys**
- Recomputed by hand: every Learn example (312 + 465 → 800 / 780, exact 777; 674 − 231 → 440 / 500, exact 443; 526 − 274 → 525 − 275 = 250, exact 252; 247 + 352 → 600, exact 599; 284 + 517 → 800; 640 − 390 = 250; 560 − 210 = 350, exact 347; 820 − 390 = 430; 460 − 30 − 30 = 400, exact 397; 750 − 325 = 425; 375 + 450 = 825; 389 + 205 → 600, exact 594).
- Also recomputed: G-E1 (400 / 320, exact 325), P1–P14 and T1–T14 (roundings, estimates, exact values in explanations, choice keys, and the fixed distractors, none of which contains a typed answer).
- I also checked the spec's book-answer table against pp. 44–46: 454; 900/930 and exact 931; items 1–12.
- Independent Node sampler, using my own `floor((n+5)/10)×10`, `floor((n+50)/100)×100` and nearest-multiple-of-25 formulas: 4,000 seeds × 6 Learn generators, 0 mismatches. Every key grades as correct when typed plainly, with a trailing space, or with commas (1,000).
  - Step 3: about half the questions use nearest ten and half nearest hundred, and about half use the "? = a − b" form.
  - Step 4: 4 distinct choices every time.
  - Step 5: all five templates appear, and every estimate is positive.
  - Step 6: + and − about equally, Yes and No about equally, every "No" more than 150 away, and the choices never contain a digit.
- No demo number and no used compatible pair (including the book's 575/125) is reused. `node --test tests/lesson-2-3.test.js tests/lessons.test.js`: 13/13 pass.

**Coverage and teaching vs pp. 43–46**
- Every Learn method is covered: round to the nearest hundred, round to the nearest ten, estimating differences, compatible numbers, word problems, and the Choosing Tools error-check.
- Book items are covered: Work Together (P13/T13), items 1–6 (round sums and differences, including the "? =" form), item 7 (P7/T7, number-free method choice), item 8 "still needs" (Learn 5 slide 3, P8/T8), item 9 (P6/T6), item 10 (P9/T9), item 11 (Learn 5 slide 4, P10/T10), item 12 two-step (Learn 5 slide 5, P11/T11), and Reflect (Learn finish screen and G-E2).
- All review fixes are present: A-01, A-02, A-11 to A-18 and N-02 to N-04.
- Wording is short and child-friendly. The examples model every item type that is tested on its own.

**Independent assessment**
- On My Own and the Test show no hints, no figures and no correctness while answering. No choice contains a number the child must type.
- The results page shows ✗/✓ for each part, the correct answer and the "Why". On My Own's "Practice My Misses (5)" opens only the 5 missed items. The Test results band and next step are clear.

**Functional (driven in the app)**
- **Learn, all 6 steps:** an empty Check shows "Type or choose an answer first". A wrong answer shows coaching and Try Again, which focuses the first box. A right answer shows "You got it", unlocks Next Step and shows the explanation. Two misses reveal the answer and offer "Try a new one". See the Example Again, then Now I'll Try, keeps the solved state. Reload during a Try Again state keeps the question and the state. Finish leads to the completion screen with the Reflect prompt.
- **Practice Together (16 items):** hint, wrong answer ("Not yet. Look again at: …"), then right answer with the explanation. Parent Help appears on P2/P5/P10/P11/P12. The two explain items reveal their explanations. Finish leads to "You finished Practice Together!".
- **On My Own:** answers 14 items. Previous/Next keeps the answers. Check my work gives 9/14 with per-item feedback. Practice My Misses works.
- **Test:** Save and finish later after 5 answers. The test menu shows "Unfinished: 5 of 14", and "Keep going" resumes at question 6 with earlier answers kept. Review my answers leads to Finish Test, then the results (11/14, 79%, "This test was paused and resumed 1 time").
- **Reset Lesson Progress:** Cancel keeps everything. Reset removes only the `lesson-2-3:*` keys; the `lesson-2-1:*` and `lesson-2-2:*` drafts and Learn data remain. The page returns to #menu.
- **Home:** Continue shows "Lesson 2-3 · Learn: step 2 of 6", then "Lesson 2-3 · Estimation Test: 1 of 14 answered" once a test answer exists, and opens `#test/estimate`.
- **Math Lessons list:** 2-3 is listed with the notes "Learn: 1 of 6 steps", then "Learn finished".
- No page JavaScript errors in any run.

**Device and accessibility (simulated viewports, headless Chrome)**
- Viewports: 320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384 (200% zoom). Screens checked: menu, Learn step 4 slides 4–5 and Your Turn, Learn step 2 table and pair, Practice Together P5, Test Q5 and the Parent Guide.
- No sideways page scrolling and no element past the viewport edge on any of these screens. The arrows figures and tables are readable. Apart from L23-01 and L23-06, all targets are 48 px or more.
- **Keyboard:** on the Learn compatible-numbers Your Turn, Tab goes choice → Estimate → Check Answer → See the Example Again → Lesson Menu (the disabled Next Step is skipped). On Test Q12, Tab goes Estimate → choices → Previous → Next → Save and finish later. Every stop has a visible 3 px focus ring.
- After Now I'll Try, Next Step, See the Example Again and Previous Step, focus moves to the new `.wiz-h` heading.

**Regression**
- 2-1 and 2-2 open. Their menu, Learn step 1 Your Turn (answered correctly, Next Step unlocked) and test start (Math Test 1 of 10; Rounding Test 1 of 12) work with no errors.

## Environment
- Headless Chrome driven through `tests/lib/harness.mjs` (local static server at `/Mathbook/`).
- Viewports were simulated with Chrome device-metrics emulation (touch emulation below 1024 px). 200% zoom was simulated as a 683×384 CSS-pixel viewport. No physical device was used.
- Node v26.5.0 for the generator sampling and unit tests.
- Windows 11, 2026-10-10.

## Re-verification

Re-checked commit `4142219` in the running app with the same harness, headless Chrome and simulated viewports. Unit tests: `npm test` set, 67/67 pass. Screenshots are in `r23/rv/`.

| Finding | Status | Evidence |
|---|---|---|
| L23-01 | **Line break fixed, but the fix caused a new overflow (see L23-09)** | The pairs now use non-breaking spaces. At 320, 390, 683 and 1366 px, no choice breaks inside "825 − 375" in Learn step 4, P5, T5 or T6 (`rv/320x568-learn4-try.png`, `rv/683x384-t5.png`). The keys still grade: 20,000 Learn step 4 seeds, and P5/P6/T5/T6 all grade correctly with the non-breaking key, and every key is one of the choices. However, a pair can no longer wrap, so between 560 and about 720 px wide the text overflows its chip (L23-09). |
| L23-02 | verified | Slide 4 now shows 247 + 326: rounding 200 + 300 = 500 and compatible numbers 250 + 325 = 575. It adds the sentence "The exact sum is 573, so here the compatible numbers are closer." All values recomputed. 326 is added to DEMO. (`rv/learn4-slide4.png`) |
| L23-03 | verified | Step 6 slide 2 now reads "In this lesson, close means within about 100 of the estimate. More than that is far." This matches the key: a "Yes" is always within 99, and a "No" is always more than 150 away. (`rv/learn6-slide2.png`) |
| L23-04 | not fixed (deferred by the coordinator) | It is an engine enhancement. "Practice this skill" still opens the full 14-item Set 1. |
| L23-05 | verified | The 2-2 and 2-3 Parent Guides now read "Checklist: the Learn steps". The 2-1 Parent Guide has no such heading (it uses its own layout) and is unchanged. (`rv/teach-2-2-390.png`, `rv/teach-2-3-390.png`, `rv/teach-2-1-390.png`) |
| L23-06 | verified | The A–D jump buttons measure 48 px in the 2-1, 2-2 and 2-3 Parent Guides at 390 and 1366 px, with no sideways scroll. |
| L23-07 | verified | The answer revealed after two misses has no doubled period. I checked it on 2-3 step 6 (num + choice), step 4 (choice + num) and step 1 (num), and on 2-1 step 1 (chart). "Try a new one", then a correct answer, solves each step. (`rv/reveal-step6.png`, `rv/2-1-learn-reveal.png`) |

Regression: the 2-1 and 2-2 Learn example and Your Turn screens look the same as before (`rv/2-1-learn-ex.png`, `rv/2-2-learn-ex.png`). No page JavaScript errors.

### New findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L23-09 | major | All compatible-number choices (Learn step 4 Your Turn, P5/P6 in Practice Together and On My Own, Test T5/T6), at viewport widths from 560 to about 720 px | The `compact` grid switches to 4 columns at 560 px (`mathbook.css` line 753). Now that a pair cannot wrap, "825 − 375" is wider than its chip. I measured how far the text runs past the chip's inner edge: 40 px at 568, 32 px at 600, 22 px at 640, 11–12 px at 683 (right at the border), 3 px at 720, and none from 768 up. At 568×320 (a phone in landscape) each choice's last digits are hidden under the next chip, and the 4th choice is cut off at the card edge: "850 − 3▯", "826 − 4▯", "825 − 3▯", "800 − 40▯". This makes a test item unreadable. The range also covers phones in landscape (568–740 px wide) and 200% zoom on 1280–1440 px screens. Screenshots: `rv/ov-568.png`, `rv/ov-683.png`, `rv/683x384-t5.png`. | Keep these 4 expression choices at 2 columns up to about 760 px. For example, give the compatible-number choice part a class that uses the existing `.is-wordy` auto-fit rule (`minmax(min(100%, 9.5rem), 1fr)`), or raise the 4-column breakpoint for it. Then re-check 568, 640, 683 and 720 px. |
| L23-08 | minor | Learn step 4 Your Turn generator | The new slide pair 250 + 325 is not in `USED_PAIRS`. About 39 of 20,000 sampled questions ask for exactly that pair (for example "249 + 327", "323 + 252"), even though the spec says Your Turn never repeats a slide pair. | Add `[250, 325]` to `USED_PAIRS`. |

### Re-verification 2 (commit `0a881a0`)

| Finding | Status | Evidence |
|---|---|---|
| L23-09 | verified | I checked at 568×320, 640×360, 683×384, 720×400, 768×1024, 800×600 and 1366×768. The screens were Learn step 4 Your Turn, On My Own P5/P6, Test T5/T6, and the other compact-chip questions: Learn step 5 Add/Subtract, P8, T9, and P14/T14 Nearest ten/hundred. The four compatible pairs show in 2 columns at 568, in 3 columns (3 + 1) from 640 to 768, and in 4 columns from 800 up. Every pair stays on one line inside its chip, at least 7 px clear of the padding. None runs outside its group, the page never scrolls sideways, and every chip is at least 53 px tall. Add/Subtract shows as 2 chips with plenty of room. At 800 and 1366, "Nearest ten" and "Nearest hundred" wrap to two lines inside their chips (83 px tall). They stay readable, and they looked the same before this commit. Screenshots: `rv2/568x320-learn4.png`, `rv2/640x360-T5-full.png`, `rv2/800x600-T6-full.png`, `rv2/1366x768-T5-full.png`, `rv2/800x600-own-p14.png`; the other viewports are in `rv2/`. |
| L23-08 | verified | `[250, 325]` is now in `USED_PAIRS`. In 20,000 Learn step 4 seeds, 0 asked for the 250 + 325 pair (before this commit, 39 did). Every key is still one of its choices and grades as correct. |

The CSS change only affects compact chips, and only lesson 2-3 uses them (2-1 and 2-2 have no `compact` parts). The symbol chips (`is-sym`) are excluded from the rule.

**Harness note (not a lesson finding):** on this Windows machine, `b.close()` in `tests/lib/harness.mjs` (`proc.kill()`) does not always end headless Chrome. After my earlier runs I found 6 orphaned `mathbook-chrome-*` process trees whose parent node processes had already exited. I killed them with `taskkill /T` (0 headless Chrome processes remain). My last script also sent the DevTools command `Browser.close` before `b.close()`, and that left no processes behind. I suggest `close()` send `Browser.close` first, then fall back to `taskkill /PID <pid> /T /F` on Windows.

## L23-04 fix review (commit b4bcd12)

Independent review of the "Practice this skill" fix on branch `claude/lesson-2-3-skill-practice`. I checked it in the running app with the same harness, headless Chrome and simulated viewports. I edited no app, lesson or test file. I ran `npm test` (67/67 pass) and `node tests/lesson-2-3-skills.browser.mjs` (65/65 pass). I did not run the full `npm run test:browser`. My scripts and screenshots are in my scratchpad (`…/scratchpad/l2304/`, screenshots in `l2304/shots/`), not in the repo.

**Result: 0 critical, 0 major, 2 minor.** L23-04 is fixed.

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L23-10 | minor | `lesson-app.js` loading of `skill-practice` (`S.skillBank = store.get('skill-practice', {})`, `setState`, `saveBank`) | The saved skill-practice value is not checked before use. With a hand-edited or corrupted value: (a) `null` leaves **the full 14-question set** blank too, not just skill practice. `saveBank` calls `Object.keys(null)` and throws "Cannot convert undefined or null to object" on `#practice/s1`. So a bad skill record now breaks the normal practice. (b) `5` or `"x"`: the skill screen throws in `setState` ("Cannot create property … on number '5'"). After an in-app hash change the old Set 1 screen stays visible. (c) `[]`: there is no error, but every answer is lost silently. `JSON.stringify` of the array writes `[]` back, so after a refresh the child is on Question 1 again. (d) An `order` with an unknown id, or an `active` without `order`, gives a blank card (errors in `drawOneQuestion`/`drawIndep`). Parent Guide → Reset recovers each case. `bank-sets` already has the same weakness (b and d reproduced there too). (a) and (c) are new. Screenshots: `l2304/shots/corrupt-null-skill-390.png`, `l2304/shots/corrupt-5-skill-390.png`. | When loading, keep `skill-practice` only if it is a plain object (not null, not an array). Drop any entry whose `active.order` is not an array of known bank ids for that skill. In `saveBank`, guard `Object.keys` (e.g. `S.skillBank && typeof S.skillBank === 'object'`). The same guard on `bank-sets` would be good but is optional. |
| L23-11 | minor | Skill practice screen hero (`setView`, `skillSet` blurb) | The page title is the generic "Practice One Skill". The skill's name appears only in the banner inside the card. At 568×320 (phone landscape) the banner is below the fold, so the first screen does not say which skill. Focus lands on the h1, so a screen reader hears "Practice One Skill" without the skill name. For the 5 one-question skills, the blurb reads "Only the 1 question for this skill", which is awkward for a child. Screenshots: `l2304/shots/568x320-skill-question.png`, `l2304/shots/320x568-skill-question.png`. | Put the skill name in the hero, e.g. h1 "Practice: Comparing estimates" (or the name as the hero blurb). Reword the blurb so a single question reads naturally, e.g. "Just 1 question on this skill." / "3 questions on this skill." Keep the in-card banner. |

### Verified working
- **Skill filtering:** I took 4 tests (all 14 wrong; 3 wrong; 1 wrong; 5 wrong). Each Results page listed exactly the missed skills, all 9 for the all-wrong test, with the right counts (round100/round10/compat 2, word 3, the other 5 skills 1). Every button opened `#practice/skill-<skill>` with only that skill's ids, each once.
- **Grading:** right, wrong and mixed answers grade correctly. After checking, the correct answer and the "Why" explanation show. Check my work with a blank answer is blocked ("Still needed: 1").
- **Retries:** Practice My Misses inside a skill asks only the missed items, and the original score is kept ("stays 1/2"). "Practice this skill again" starts a new attempt and focuses the first input. Reopening an unfinished skill from Results continues at the same question with its answers kept, including mid-retry. Reopening a checked skill starts attempt N+1.
- **Completion:** after 16 skill attempts across 9 skills, the On My Own card still read "Not started". `bank-sets` held no attempts. The author's test confirms that a full set 14/14 then shows Completed, Last 14/14, Best 14/14. "Practice all 14 questions" (from Results and from a checked skill) opens `#practice/s1`. It continues an unfinished full set or starts one.
- **Saved progress:** refresh mid-skill keeps the position and answers. Browser back returns to Results; forward returns to the skill at Question 2 with focus on the h1. Home Continue picks the most recent screen: the full set when it was last, otherwise "Practice one skill: 1 of 2 answered" with the right link. With only `skill-practice` saved, Home Continue still shows.
- **Reset:** Parent Guide Reset → Cancel keeps everything. Reset removes all `lesson-2-3:*` keys and nothing else (2-1, 2-2, other programs and the activity record kept). In-app navigation afterwards starts fresh. The results-page "Clear saved progress" behaves the same (Cancel keeps; Yes clears).
- **Edge cases:** `#practice/skill-nope`, `skill-diff` (no bank items), `skill-`, `skill-constructor`, `skill-__proto__` and `skill-ROUND100` all show the Practice choices, with no errors. One-question skills show "Question 1 of 1" with only Check my work.
- **Usability:** at 320×568, 390×844, 568×320, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384 there is no sideways scroll and nothing past the edge on Results, the skill question or the checked skill. Every skill button and action is at least 48 px. Tab order on Results runs through the 9 skill buttons, then "Practice all 14 questions", then Take a new test, with a visible 3 px focus outline. Enter on a skill button opens it and moves focus to the h1. Accessible names include the skill, e.g. "Practice this skill (2 questions): Estimate by rounding to the nearest 10".
- **Regression:** in 2-2, every "Practice this skill (Set 1)" opens `#practice/s1`, Question 1 of 12, with no banner. In 2-1, the buttons still name Sets 1–5 and open the best set (e.g. `#practice/s2`, 1 of 10). Neither lesson shows "Practice all…", and `#practice/skill-*` shows Practice choices there. No page JavaScript errors in normal use.

### Environment
- Worktree `C:\Users\bazeocrisy\Projects\Mathbook-23`, commit `b4bcd12`. Headless Chrome through `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports simulated with device-metrics emulation (touch below 1024 px). 200% zoom simulated as 683×384. No physical device.
- Node v26.5.0, Windows 11, 2026-10-10. No headless Chrome processes were left over after the runs (`tasklist | grep -ic chrome` = 0).
