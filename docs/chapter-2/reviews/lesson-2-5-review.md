# Lesson 2-5 Addition Patterns: independent build review

Reviewed build: worktree `Mathbook-25`, branch `claude/lesson-2-5`, commit `364eb0f` (`curriculum/chapter-2/lesson-2-5/lesson.js`, `index.html`, the 2-5 entry in `assets/js/catalog.js`, `tests/lesson-2-5.test.js`, `tests/lesson-2-5-skills.browser.mjs`). Checked against textbook pp. 51–54 (page scans), `docs/chapter-2/lessons/2-5.md` (with §15 Review fixes), `batch-B-plan-review.md` (B-03, B-05, B-10…B-15, B-24, the re-verification section and N-1), `DESIGN.md` F3 counters and §4.2 chain `free`, and PLAN Decisions 5, 6, 7, 8 and 28. Lessons 2-3 and 2-4 were used for the established look and feel. I did not edit any app, lesson, engine or test file.

Screenshots and scripts are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\477cc6fa-3229-4b55-9cf8-4292528d1e9f\scratchpad\r25\` (written below as `r25/...`).

**Result: 0 critical, 0 major, 4 minor.** (Re-verification at `86419dd`: L25-01 to L25-04 verified; new L25-05 major, L25-06 and L25-07 minor; see the end.) Two belong to 2-5 itself (L25-01, L25-03). Two come from shared code and show up because 2-5 is the first lesson with written equations in practice and tests (L25-02 engine part labels, L25-04 the Home page "Continue" count).

## Findings

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L25-01 | minor | Explanations ("Why" text) built by `wordFillQ`, `equationQ` and `wrongTypeQ` in `lesson.js`: Learn step 4, PT1, PT2, PT10, O1–O6, O13, T1–T3, T6 | (a) Sentences start in lower case, and the rule is said twice in a row: PT2 "✓ Correct! odd + odd = even. Odd + odd = even: the two leftovers make a new pair. …"; PT10/Learn 4 "even + even = even. Even + even = even: neither number has a leftover." (b) O2's "Why" says "even + odd = odd. even + odd = odd." because two of its three sentences fill to the same line. (c) After two misses on an equation item, the reveal shows two different examples: "The answer is any two even 3-digit numbers and their correct sum, e.g. 290 + 524 = 814. even + even = even. Even + even = even: … For example, 208 + 446 = 654." On the results page the test shows the same pair of examples. (d) O13 and T6 are odd + even sums (431 + 246, 325 + 142). The keyed choice says "Odd + even must be odd", but the "Why" says "Even + odd = odd: the one leftover has no partner." The math is right everywhere. It just reads clumsily for a third grader. Screenshot: `r25/shots/learn/s4-reveal.png`; text in `r25/flows.out` (PT1, PT2, PT10) and `r25/sample.out`. | (a) Capitalise the first word of each filled sentence, and say the rule once (e.g. "Odd + odd = even: the two leftovers make a new pair."). (b) In `wordFillQ`, list each distinct filled sentence once. (c) For equation items, drop the lesson's own "For example …" (the engine already prints an "e.g." equation in the answer line), or keep only one of the two. Adjust the explanation regex in `tests/lesson-2-5.test.js` to match. (d) Have `ruleWhy` name the types in the item's order ("Odd + even = odd: …"). |
| L25-02 | minor (shared engine, visible in 2-5) | Word-fill parts (PT1, O1, O2, T1): the pattern sentence used as each radio group's name | In the equation items, the blank in "even + ___ = odd" shows as the dashed blank box with `role="img" aria-label="blank"`. In the word-fill items, the same sentences are part labels, and the engine prints them as plain text: `<legend class="part-label">___ = even + even</legend>`. On screen it is a short underline (`r25/shots/vp/1366x768-test-q1.png`), unlike the box two questions later (`r25/shots/vp/320x568-test-q2.png`). A screen reader reads the group name as "underscore underscore underscore equals even plus even", or skips the underscores and reads "equals even plus even". | Render `___` in part labels the same way as in prompts and `display` (the engine's `withBlanks`, giving the box and the "blank" name). The lesson cannot do this itself, because labels are escaped text. Then re-check T1 at 320 px. |
| L25-03 | minor | Skill `check` ("Check a sum with patterns"): On My Own / "Practice this skill", and test items T7 and T12 | The test has three `check` items in three different forms: T6 (wrong kind of sum, like O13), T7 ("a matching even/odd doesn't prove it") and T12 ("Which sums can't be right? Choose all", a 5-option select-all). On My Own has just one `check` item (O13). My Results offers "Practice this skill (1 question)" (seen in the `r25/flows.out` results text). The T12 select-all form (`cantQ`) appears nowhere before the test: not in Learn, Practice Together or On My Own. The T7 form appears only in PT4. This is the same kind of gap as B-12: the test is the first time the child sees the format. It is inherited from the spec's On My Own table. | Add an On My Own `cantQ` item with new numbers (e.g. 4–5 claimed sums, two of the wrong kind), and ideally a `proveQ` item. That gives the skill 2–3 questions and practises each test format once. Update the set blurb and count ("Practice all 16/17 questions"), the spec §7 table, and the hand key and counts in `tests/lesson-2-5.test.js` and `tests/lesson-2-5-skills.browser.mjs`. |
| L25-04 | minor (shared Home page, first triggered by 2-5) | Home page "Continue where I left off" (`index.html`, `answered()` / `count()`) | (a) Written-equation answers are never counted. The Home code treats any object response as a staged number line (`lo`/`hi`/`mid`/`pick`), and a chain response is `{ v: { a, b, s }, t: [] }`. With Q1–Q5 of the test answered, the test menu says "Unfinished: 5 of 13 answered so far", but Home says "Addition Patterns Test: 3 of 13 answered". With only an equation answered (test Q2, or the first question of the `rules` skill practice), Home shows **no** Continue button at all (`r25/home.out`, cases A and B; `r25/shots/home/home-test-chain-only.png`). (b) Already in the code before 2-5: a select-all part that was opened but not answered is saved as `[[]]`, and Home counts it as answered. In On My Own, 3 equations answered gave "2 of 15 answered" or "1 of 15", depending on how many empty select-all items had been passed (`r25/home.out`, case C). In 2-4, pressing only Next through the set (nothing answered) gives "Practice on my own: 2 of 14 answered" (`r25/home24.mjs`). | In `index.html`, count a chain response (`v` object) as answered when every `v` value is non-blank, and as started when any is. Count an array response as unanswered when every element is blank, including empty inner arrays. Better still, reuse the lesson engine's `Q.isAnswered` rules so the two counts cannot drift apart. Add a Home check with a 2-5 equation answer to `tests/browser.test.mjs`. |

## The two deviations: judgement

1. **Split items (word-fill + separate equation items): sound. I agree.** The engine has no chain *part* kind inside `parts` (`questions.js` only builds `chain` as its own question type, and the components fixture `free` sample is a whole question), so a combined "choose + write" item would need an engine change, which this build was not allowed to make. The split keeps the teaching:
   - All seven sentence forms are still filled in: O1 + O2 cover the book's six plus `even + ___ = odd`, PT1 has form 5, and T1 has three.
   - The missing-addend equation items keep the blank in the sentence ("odd + ___ = even. Write one equation…"), so the child must still work out the word before writing.
   - Decision 8 is met: each pattern is written twice across items (even + even in PT10 and O3, odd + odd in PT2 and O4, mixed in O5 and O6; test T2 mixed, T3 odd + odd).
   - Grading matches §13 / B-03: either order for mixed sentences, wrong-kind numbers rejected, the sum must be right, 4-digit sums accepted, 2- and 4-digit addends rejected, commas and spaces fine.
   - Counts are kept: PT 10, test 13.
   - Two small side effects, both acceptable. (i) In guided practice the first miss names the kind of number needed ("418 is even, but the sentence needs two odd numbers"). That tells the child the missing word, but it is coaching after a miss, and the test shows nothing. (ii) The spec's T3 equation (`odd + even = ___`, mixed) became `___ = odd + odd`. Either-order grading is still assessed by T2, and the `odd + even = ___` word is in T1.
2. **O14 and O15 added (On My Own = 15): sound. I agree.** Without them, `parity` (T13) and `reason` (T9) would have no "Practice this skill" questions (the same capability as L23-04). They are new numbers and new wording, in the same format as the test items they support. This is the right call. The same reasoning applies to `check`, which is still thin (L25-03).

## Verified working

**Math and answer keys**
- Recomputed by hand: every Learn example (6 even, 7 odd; 348 even, 563 odd; 4 + 6 = 10; 3 + 5 = 8; 214 + 352 = 566; 135 + 221 = 356; 4 + 3 = 7; 412 + 235 = 647; 3, 7, 11, 15; 627 + 154 = 781 with 7 + 4 = 11; 125 + 302 = 427; 243 + 124 = 367, not 362; 316 + 151 = 467, not 457).
- PT3 571, PT4 667, PT7 {12+14, 13+15, 9+13, 10+20}, PT8 367 odd; O7 589, O8 486, O11 {8+6, 7+9, 11+13}, O12 642 even, O13 677, O14 {426, 958, 604}.
- T4 771, T5 778, T6 467, T7 577, T10 {14+9, 7+10, 20+13}, T11 997 odd, T12 {216 + 322 = 539, 260 + 117 = 376}, T13 {507, 189, 773}.
- Every equation item's example fits its sentence: 135+241=376, 432+216=648, 204+316=520, 173+359=532, 248+135=383, 426+251=677, 418+237=655, 319+457=776, and Learn 173+245, 208+446, 326+159.
- Every distractor is false. The B-05 keys contain no sum. Every choice key is among its choices, and every authored correct response grades as correct.
- Independent sampler (`r25/sample.cjs`), 20,000 seeds per Learn step, my own rules:
  - Step 1: always 6 different 3-digit numbers, 3 even and 3 odd, none from the spec's demo list. At least 3 different ones digits. The key is exactly the even ones. A subset or a superset is graded wrong.
  - Step 2: both answers "even" every time, all 3-digit, a + b ≤ 998. Part order is random (50.2% even + even first). The explanation gives both sums.
  - Step 3: e + o ≤ 999 with the order random (49.8% even first), key "odd". The start is 4–20 and never 3, 7, 11 or 15 (all 14 allowed starts occur, including 4 and 20). k ∈ {2, 4, 6} about equally. The blank = s + 3k. Exactly one "notice" choice is true and it is the key ("all odd" 51.9%, "all even" 48.1%). No typed answer is printed.
  - Step 4: one of the three missing-addend forms (≈⅓ each). The equation is always gradable, and the engine's sample answer grades correct.
  - Step 5: C = S 25.5%, ±1 34.6%, ±10 21.5%, ±100 18.4% (40% together). C is always 100–999, S is 110–989, and all three keys are right. The explanation states the predicted kind, C's kind and S.
- `npm test`: 84/84 pass.

**Grading of written equations** (Node, every chain item, and in the app on PT2/PT10, On My Own and the test)
- Fitting numbers are right, in either order for mixed sentences (B-03). Swapped same-kind numbers are also right.
- Wrong-kind numbers are wrong: "357 + 136 = 493: 136 is even, but the sentence needs two odd numbers.", "204 + 418 = 622: 204 and 418 are both even, but the sentence needs one even and one odd number."
- A wrong sum is wrong ("Check 289 + 523."). 2-digit and 4-digit addends are wrong ("57 is not a 3-digit number.", "1,035 is not a 3-digit number."). A leading zero ("035") is wrong.
- 999 + 997 = 1,996 is right, with or without the comma (decision 8). Trailing spaces are fine. An empty box gives "Write a whole number in every box of the equation."

**Coverage vs pp. 51–54**
- Be Curious is Learn 3. Learn's three patterns are Learn 2–3. "Math is… Generalizations" (why odd + odd is even) is Learn 2 slide 2, PT9 (explain aloud), O15 and T9. Work Together (Nisha) is Learn 5, PT4 and T7.
- Items 1–6 are O1/O2 words and O3–O6, PT1, PT2 and PT10 equations; T1–T3. Items 7–8 are PT3, O7, O8, T4 and T5. Item 9 is PT5, O9 and T8. Item 10 is Learn 4, PT6, O10 and T8. Item 11 is PT7, O11 and T10. Item 12 is PT8, O12 and T11. Reflect is on the Learn finish screen, plus O13, T6 and T12.
- Pairs and leftovers, and "only the ones digits decide", are both taught with pictures or slides. All the batch-B fixes are present (B-03, B-05, B-10…B-15, B-24, N-1 with start 4–20).

**Functional (driven in the app, 390×844)**
- **Menu:** Learn, Practice, Take a Test, My Results, and the Parent Guide link.
- **Learn, all 5 steps:**
  - Each step goes from the Example parts (Back a part, Next part, Start Over) to Your Turn. An empty Check shows "Type or choose an answer first."
  - A miss shows short coaching ("Not quite. Look only at the ones digit. 0, 2, 4, 6, 8 mean even.") and keeps Next Step locked. A refresh keeps the phase, the answers and the coaching.
  - A second miss reveals the answer and explanation and focuses "Try a new one". A right answer shows "✓ Correct!" and unlocks Next Step, which moves focus to the new heading.
  - Finish shows "You finished learning!" with "How can even and odd help you check your adding?"
- **Practice Together (10):**
  - Each item: hint, Parent Help (PT1, PT4, PT6, PT7, PT9), an empty check ("Write an answer first."), wrong, partly right ("Look again at: The correct sum.") and right.
  - PT9 "They explained it" shows the explanation.
  - A refresh keeps Question 5 of 10.
- **On My Own:**
  - No hints or checks while answering. A refresh keeps Question 5 of 15.
  - With three partly-right answers and a wrong equation sum: "12 of 15 correct", each miss marked ✗, and "Practice My Misses (3)". The equation review shows "173 ✓ (right) + 359 ✓ (right) = 1532 ✗".
- **Test:**
  - No hints, checks or feedback, even after a wrong-kind equation.
  - Save and finish later after 5 answers. The test menu shows "Unfinished: 5 of 13 answered so far", and Keep going resumes at Question 6.
  - The review step leads to Finish Test. Results: 11/13 (85%), "paused and resumed 1 time", mistakes shown with "Correct answer" and "Why".
  - Choice order differs between two attempts on all 11 choice and select-all items.
- **Skill practice:**
  - Results list each missed skill with "Practice this skill (n questions)" and "Practice all 15 questions".
  - `node tests/lesson-2-5-skills.browser.mjs` covers every skill link, a mid-skill refresh, Home Continue, damaged data and reset. It passed in the full run.
- **Math Lessons list:** 2-5 "Addition Patterns · Even and odd sums, and why they work." The note reads "Learn: 2 of 5 steps", then "Learn finished", then "Best test score: 85%". The link opens the 2-5 menu. Home Continue shows "Lesson 2-5 · Learn: step 3 of 5" and "Practice on my own: 4 of 15 answered" (apart from L25-04).
- **Reset Lesson Progress:** Cancel kept every key. Reset removed exactly the five `lesson-2-5:*` keys. The 2-1 and 2-4 attempts, the 2-3 Learn progress, `activity` and an unrelated key remained. The page returned to `#menu`, and Home Continue then pointed to 2-3.
- No page JavaScript errors and no missing files in any run.

**Device and accessibility** (simulated viewports, headless Chrome)
- Viewports: 320×568, 390×844, 568×320, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384 (200% zoom).
- Screens per viewport: menu, Parent Guide, every Learn slide and every Your Turn, all 10 PT items, all 13 test items, all 15 On My Own items, and Results. Script: `r25/vp.mjs`; 182 screenshots in `r25/shots/vp/`.
- No sideways scroll, nothing past the edge, and no clipped chip or button text on any screen. Every button, input and choice is at least 48 px tall.
- The pairs pictures (6, 7, 4 + 6, 3 + 5 join, 4 + 3) fit at 320 px. The join variant stacks the two groups and the new pair at 320 px.
- The three equation boxes stay on one row at 320 px.
- **Keyboard** (Learn 4 Your Turn): Tab goes First addend → Second addend → Sum → Check Answer → See the Example Again → Lesson Menu. The locked Next Step is skipped. Every stop has a 3 px focus outline.
- **Screen reader:** the counters figures read e.g. "7 cubes: 3 pairs and 1 left over." and "3 and 5: each has one left over. The two leftovers make a new pair."; the equation boxes read "First addend. Equation: this box plus box equals box", and so on. The blank in a prompt reads "blank". The only problem was L25-02.

**Regression**
- `npm run test:browser`, all suites: every suite passes: 198 (2-1 + home), 96 (2-2), 336 (lessons 2-3, 2-4 and 2-5), 71 (2-3 skills), 62 (2-4 skills), 65 (2-5 skills), 64 (Number Words), 52 (components). Lessons 2-1 to 2-4 open on their menus, and their journeys, skill practice and resets still pass. The Math Lessons list shows 2-1 to 2-5.

## Environment
- Headless Chrome driven through `tests/lib/harness.mjs` (local static server at `/Mathbook/`). Viewports simulated with device-metrics emulation (touch below 1024 px). 200% zoom simulated as 683×384. No physical device.
- Textbook pages extracted with `node tools/extract-textbook-pages.mjs` (git-ignored output).
- I ran `npm test` (84/84) and `npm run test:browser` (full run, in the background).
- Node v26.5.0, Windows 11, 2026-10-10. No headless `mathbook-chrome-*` Chrome processes were left over (count 0). The owner's normal Chrome was not touched. The working tree has only this report as a new file.

### Re-verification (commit 86419dd)

I re-checked commit `86419dd` (with the review fixes from `ae56b7f`) using the same harness, headless Chrome and simulated viewports. I edited no app, lesson, engine or test file. `npm test`: 86/86 pass. I ran the browser suites one at a time (results below). Scripts are in `r25/` (`sample2.cjs`, `labels.cjs`, `learn2.mjs`, `back.mjs`, `another2.mjs`, `home.mjs`, `home24.mjs`, `vp2.mjs`); screenshots are in `r25/shots/rv/`.

| Finding | Status | Evidence |
|---|---|---|
| L25-01 | verified | Every "Why" now starts with a capital and says the rule once ("The blank is even. Odd + odd = even: the two leftovers make a new pair. For example, 289 + 523 = 812."). There are no repeated sentences (the old O2 case is gone with the pairs). The odd + even items now say "Odd + even = odd: …" (O15, T7). Each pattern has one example everywhere. It is the engine's sample equation, so the equation reveal's "e.g." and the "For example" are the same equation (shown twice in one reveal message, which is harmless). `r25/sample2.out`, `r25/learn2.out`. |
| L25-02 | verified | `withBlanks` now draws `___` as the blank box with the name "blank" in choice/multi legends and `num` labels, and it still escapes the rest of the label (`a < ___ & b` renders `a &lt; [blank] &amp; b`). No other lesson changes: over every guided, practice and test item and 500 seeds of every Learn generator, 2-2, 2-3 and 2-4 have no part label containing `___`, and 2-1 has no `parts` questions (`r25/labels.cjs`). After the pairing, 2-5 has no `___` in any label either: the blank is in the prompt, drawn as the box (`r25/shots/rv/vp/1366x768-test-q1.png`). |
| L25-03 | verified, but see L25-05 | O18 (choose all that can't be right) and O19 (Zoe, "a matching type doesn't prove it", 428 + 153 = 581) were added. The `check` skill now has 3 questions, and My Results shows "Practice this skill (3 questions)". |
| L25-04 | verified | Home now shows "Addition Patterns Test: 1 of 14 answered" when only an equation is answered, the same as the test menu. Skill practice with one equation shows "Practice one skill: 1 of 4 answered". On My Own with 3 equations shows "3 of 19", and adding 1 more answer gives "4 of 19". In 2-4, pressing only Next through the set no longer shows Continue (`r25/home.mjs`, `r25/home24.mjs`). |

**Owner's pairing (word question + equation question): checked, and sound.**
- **Pairing and order:** Practice Together pt1/pt2 (e+B=e), pt3/pt4 (o+B=e), pt5/pt6 (e+o=S); On My Own o1/o2 (S=e+e), o3/o4 (o+e=S), o5/o6 (e+B=o), o7/o8 (S=o+o); Test t1/t2 (e+B=o), t3/t4 (S=o+o). Each pair shares its sentence and its example (the engine's reveal equation), and the two questions sit next to each other in Practice Together and the Test (fixed order, checked in the running app).
- **Counts:** Practice Together 13, On My Own 19, Test 14.
- **Skills:** `rules` and `write` are separate skills. Each has its own "Practice this skill (4 questions)" button on My Results, and each opens only its own four questions (`#practice/skill-rules`: o1, o3, o5, o7; `#practice/skill-write`: o2, o4, o6, o8).
- **Textbook items 1–6 (fill the word, then write a supporting equation):** all seven sentence forms are asked as words, and each form in practice and the test is followed by its equation.
- **PLAN decision 28:** still holds. Over 20,000 seeds the cube train starts at 4–20 and never at 7, 11 or 15.
- **Learn (6 steps):**
  - Step 4 picks among the 7 sentences evenly. Step 5 reads step 4's saved sentence: in 20,000 sampled seeds and in the app, step 5's "Same pattern as step 4: …" always matched what step 4 had just asked.
  - Step 5's "Try a new one" keeps the sentence, and a refresh keeps it. The one exception is L25-07.
  - Next Step stays locked until step 4 is right.
  - Completion needs all 6 steps. With 5 done, Home says "Learn: step 6 of 6" and the list says "Learn: 5 of 6 steps". With 6 done, Continue is gone and the list says "Learn finished".
  - Reset Lesson Progress clears all 2-5 keys (2-4 kept), and Learn restarts at "Step 1 of 6".
  - A fresh browser profile (each run) starts at Step 1 of 6. A step 5 with no saved step-4 question (reachable only by editing storage) picks a sentence of its own.
- **Grading and coaching:** unchanged and correct. A wrong-kind number gives "357 + 136 = 493: 136 is even, but the sentence needs two odd numbers."; a wrong sum gives "Check 289 + 523."; either order is accepted for mixed sentences.
- **Test:** shows no feedback, and the word answer is not printed in its equation question.
- **Layout:** 8 viewports × every screen, including the new steps 4–5, Practice Together 1–13, Test 1–14, On My Own 1–19 and Results with 8 skill rows. No sideways scroll, no clipped text, and every target is at least 48 px (`r25/vp2.out`, `r25/shots/rv/vp/`).
- **Keyboard and screen reader:** Learn step 5 Tab order goes First addend → Second addend → Sum → Check Answer → See the Example Again, all with a 3 px outline. The prompt's blank reads "blank".

**New findings**

| ID | Severity | Where | What I saw | Required fix |
|---|---|---|---|---|
| L25-05 | major | O18 (`cantQ`, On My Own, and "Practice this skill" for `check`) | "Use patterns. Which sums can't be right? Choose all." lists 452 + 136 = 598. That claim is wrong (452 + 136 = 588), but it is **not** in the key, because the pattern can't catch it (598 is even, as it should be). A child who adds to check (which the lesson teaches: "Always add to be sure") ticks it and is marked wrong. The item's own "Why" agrees that the sum is wrong: "452 + 136 = 598 is the right kind (even), so the pattern can't catch it. But adding shows 588, so it is still wrong." The test version (T13) has no such case: its three right-kind claims are all correct. Key in `r25/sample2.out`. | Make every right-kind claim in O18 a correct sum (e.g. 452 + 136 = 588), as T13 does. Or reword the question so it asks only what the pattern shows ("Which sums does the even/odd pattern show are wrong?"), and apply the same wording to T13. Update the hand key in `tests/lesson-2-5.test.js`. |
| L25-06 | minor | Learn steps 4 → 5, and Practice Together pairs (pt1→pt2, pt3→pt4, pt5→pt6) | The word question's "Correct!" message prints the full example equation ("For example, 289 + 523 = 812"). The very next question asks the child to write their own equation for that pattern, and that exact example is graded correct. In the app I copied step 4's example into step 5: "✓ Correct!" (`r25/learn2.out`, "S5 copy"). The examples are also the same for every pattern of the same kind (290 + 524 for every even + even, 289 + 523 for odd + odd, 290 + 523 or 289 + 524 for mixed), so after the first pair the answer is always on screen. The test and On My Own are not affected (no explanation is shown before answering). Learn step 5 and the Practice Together `write` items therefore cannot show that the child can write an equation alone, which is what the owner wanted verified. | Keep the shared example out of the word question's message. Show the sentence filled in and the kinds of numbers needed ("The blank is odd: odd + odd = even. In the next question you'll write an equation for it."), and show the example only in the equation question's reveal and "Why". The pair stays linked by the same sentence and by that example after the equation is done. Or, if the owner prefers to keep the example in the word question, write a different example there from the one the equation question reveals. |
| L25-07 | minor | Learn step 4 "Try another one" → step 5 | After step 5 has been opened, a child can go back to step 4 (See the Example Again → ← Previous Step) and press "Try another one". That gives step 4 a new sentence (e.g. "___ = even + even"). Step 5 keeps its saved question, so it still says "Same pattern as step 4: even + odd = ___" for a pattern step 4 no longer shows. A refresh does not fix it (saved state: step 4 = S=e+e, step 5 = e+o=S). `r25/another2.out`, `r25/shots/rv/mismatch-step5-390.png`. It does not affect grading or completion. | When step 5 shows its question, compare its sentence with step 4's saved one and build a new question if they differ. The engine reuses the saved check, so this needs a small hook, or a lesson-side check when the step is shown. Or soften the lead to "Pattern from step 4" only while they match, otherwise "Pattern". |

**Regression (browser suites run one at a time):** every suite passes: 198 (2-1 + home), 96 (2-2), 349 (lessons 2-3, 2-4 and 2-5), 71 (2-3 skills), 62 (2-4 skills), 68 (2-5 skills), 64 (Number Words), 52 (components). Lessons 2-1 to 2-4 keep working, and the shared `withBlanks` and Home changes do not change them (see L25-02 and L25-04).

No headless `mathbook-chrome-*` Chrome processes were left over. The owner's normal Chrome was not touched. Node v26.5.0, Windows 11, 2026-10-10.

### Re-verification 2 (commit 87e3cfd)

I re-checked commit `87e3cfd` with the same harness and headless Chrome. I edited no app, lesson, engine or test file. `npm test`: 87/87 pass. Scripts are `r25/sample2.cjs` (output `r25/sample3.out`), `r25/wordscan.cjs` and `r25/rv2.mjs` (output `r25/rv2.out`); screenshots are in `r25/shots/rv2/`. Browser suites were run one at a time (below).

| Finding | Status | Evidence |
|---|---|---|
| L25-05 | verified | O18 now lists 452 + 136 = 588. I recomputed all five claims: 234 + 152 = 386 (claim 387, wrong kind), 127 + 341 = 468 ✓, 205 + 318 = 523 (claim 524, wrong kind), 452 + 136 = 588 ✓, 263 + 114 = 377 ✓. So "can't be right" is exactly {387, 524}, matching the key. Every right-kind claim is a correct sum, as in T13. The "Why" now says each of the three "is the right kind …, and it is correct." `r25/sample3.out`. |
| L25-06 | verified | Nothing copyable is shown before the child writes an equation:<br>• Scan of all 209 word questions (Practice Together, On My Own, the Test, and 200 seeds of Learn step 4): no 3-digit number in any prompt, hint, explanation or answer line. The word "Why" now reads e.g. "For example, numbers ending in 9 and 3 make a sum ending in 2."<br>• Learn step 4 in the app (miss, Try Again, miss and reveal, Try a new one, right): no equation appears anywhere on the page. Step 5's Example slide still shows 248 + 133 = 381 for `even + ___ = odd`, a worked teaching example as before.<br>• Practice Together pt1→pt2, pt3→pt4, pt5→pt6 in the app, including the hint, a miss, "Show answer and why" and the right answer: no equation on screen before the equation question.<br>• The full example appears only after the equation question ("For example, 290 + 524 = 814: numbers ending in 0 and 4 make a sum ending in 4, as in the word question."), and in that question's own reveal after two misses (expected). The pair is still visibly linked by the same ones digits. |
| L25-07 | verified | The scenario I found, now: open step 5, go back to step 4 (See the Example Again → ← Previous Step), press "Try another one" five times. Step 4 keeps `even + odd = ___` every time. Two misses and "Try a new one" keep it too. Back on step 5: "Same pattern as step 4: even + odd = ___" (saved: step 4 = step 5 = e+o=S).<br>• A refresh keeps both. Step 5's own "Try a new one" keeps the sentence.<br>• Reset Lesson Progress leaves no 2-5 keys.<br>• Six fresh starts (cleared storage, as in a new browser) each drew a random step 4 sentence, and step 5 matched it every time (o+e=S, o+e=S, e+o=S, S=e+e, o+B=e, o+B=e). |

Note (not a finding): once step 5 has a question, step 4's "Try a new one" gives back the same sentence, even right after it was revealed. This happens only if the child goes back after already solving step 4, and it is the intended trade-off of keeping one shared sentence. "Go through Learn again" also keeps the old saved questions (it returns to step 1 but leaves the saved checks in place; this is how the shared wizard works).

**Regression (browser suites run one at a time):** `lessons.browser.mjs 2-5` 122/122, `lesson-2-5-skills.browser.mjs` 68/68, `browser.test.mjs` (2-1 + home) 198/198, `lessons.browser.mjs 2-3 2-4` 229/229. Nothing was changed outside 2-5 in this commit.

No new findings. No headless `mathbook-chrome-*` Chrome processes were left over. Node v26.5.0, Windows 11, 2026-10-10.
