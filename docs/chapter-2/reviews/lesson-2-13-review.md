# Lesson 2-13 Compare 4-Digit Numbers: independent build review

Reviewed build: worktree `Mathbook-213`, branch `claude/lesson-2-13`, commit `f644744` (diff against main `2b1c63c`, where 2-12 is live). The diff covers:
- `curriculum/chapter-2/lesson-2-13/lesson.js` and `index.html`;
- the 2-13 entry in `assets/js/catalog.js`;
- **shared CSS** in `assets/css/mathbook.css`: `.nline-label.is-wide-only` is hidden below 560 px, and `.sym-line`/`.sym-circle` are smaller below 380 px;
- `tests/lesson-2-13.test.js`, `tests/lesson-2-13-skills.browser.mjs`, `tests/browser.test.mjs` and `package.json`;
- spec §16 build notes.

I checked it against:
- textbook pp. 83–86 (page scans);
- `docs/chapter-2/lessons/2-13.md`, including the D-1, D-5, D-6 and D-7 fixes;
- `batch-D-plan-review.md`.

I did not edit any app, lesson, engine or test file.

Scripts and screenshots are under `C:\Users\BAZEOC~1\AppData\Local\Temp\claude\C--WINDOWS-system32\2886c9a2-523f-41ad-9a94-0dddef347f83\scratchpad\r213\` (written below as `r213/...`):
- `sample.cjs`: my own check of keys, generators, positions and symbols in Node;
- `flows.mjs` / `flows2.mjs`: Learn, On My Own, Test and Home in the app;
- `vp.mjs`: 7 sizes including 683×384 (200% zoom); 313 screenshots in `r213/shots/vp/`;
- `focus.mjs`: Tab order and above-the-fold checks.

**Result: 0 critical, 1 major, 1 minor.**

The math, symbols, keys, D-fixes and child flows are right. The findings are:
- a wording mismatch in Learn 5's generated question;
- explanations that compare bare digits rather than place values.

## Findings

| ID | Severity | Where | Evidence | Failure scenario | Suggested fix |
|---|---|---|---|---|---|
| L213-01 | major | Learn step 5 Your Turn (`orderCheck`) | The prompt is always "Three **trails** are 6,504 m, 7,189 m, 6,572 m long. Order them…". The last question is picked from `TRAILS = ['Which trail is longest?', 'Which river is longest?', 'Which road is longest?']` on its own. In 20,000 seeds the question names a **river or a road in 13,419 (67%)**, while the story is about trails (`r213/sample.out`, "mismatch"). | Two times in three, a child reads "Three trails…" and then "Which river is longest?". There is no river in the story, so a careful reader is stuck or thinks they misread. This is the lesson's only "which is more" turn in Learn. | Pick the context once and use it in both places: e.g. `const [q, thing] = pv.pick(r, TRAILS)` with the prompt `Three ${thing}s are …`. Or keep only "Which trail is longest?". Add a unit check that the noun in the question appears in the prompt. |
| L213-02 | minor | `why()` explanations (Learn 2–5 "Why", every practice and test explanation) | Explanations compare bare digits: "Thousands 6 = 6, hundreds 5 = 5. Tens: 0 < 7, so 6,504 < 6,572."; "Hundreds: 3 > 1, so 3,316 > 3,136.". The Learn 2 slides do link digits to values ("6 tens > 1 ten… 6 tens is 60. Even 9 ones can't make up 50 more"), but the explanations a child reads after each item never say what the digits are worth. | A child who reasons "3 > 1" without the place may still compare the first digits of 958 and 3,158, the lesson's main mistake. The owner asked that comparisons connect digit values. | Say the value in the deciding place: "Tens: 0 tens < 7 tens (0 < 70), so 6,504 < 6,572." and "Hundreds: 3 hundreds > 1 hundred (300 > 100)…". The matching places can stay short ("thousands 6 = 6"). Update the explanation regexes in `tests/lesson-2-13.test.js`. |

## Owner's rules: judgement

- **Every assessed skill is taught and practised:**
  - line: Learn 1, P1, P2, O1, O2, T1, T2;
  - pv: Learn 2, P5, P6, P8, P9, O5, O6, O8, O9, T5, T6, T8, T9;
  - equal: Learn 3, P3, P4, O3, O4, T3, T4;
  - digits: Learn 4, P7, P10, O7, O10, T7, T10;
  - real: Learn 5, P11, O11, T11;
  - order: Learn 5, P12, O12, T12.

  D-1 holds: On My Own has its own 12 items with new numbers.
- **Third-grade language:** "Numbers get bigger as you go right", "The first place that is different decides", "≠ is = with a slash. It means not equal", "Write a 0 in the thousands place". The one exception is L213-01.
- **Numbers in range and answers computed** (20,000 seeds per step):
  - Learn 1: windows start at a multiple of 500 from 1,000 to 8,500; the numbers are not multiples of 10 and are at least 40 apart; the asked dot is always correct.
  - Learn 2: the place that changes is spread evenly (Th/H/T/O 5,047/4,914/5,033/5,006), the key always equals the first differing place, and both numbers are 1,000–9,999.
  - Learn 3: 53% identical and 47% neighbour swaps (never identical; D-5 holds: the key is the first differing place).
  - Learn 4 (D-6): thousands 1–8, and the 3-digit number's first digit is always larger.
  - Learn 5: two numbers share thousands and hundreds and differ in the tens; the third has thousands ±1.
  - No demo numbers. Every symbol key is recomputed from the numbers (my check: no errors).
- **No duplicate choices, clues or position patterns:**
  - Learn keys are even (e.g. the Learn 1 dot A/B is about 50/50; Learn 4 error key positions 6,771/6,602/6,627).
  - The authored A/B dot answers vary (B, A, A, B, B, A).
  - Place choices and the Least/Middle/Greatest options keep their natural order (a scale, not a clue). Error-analysis and "which is more" choices shuffle in the test.
  - D-7 holds: the error keys never say "less" or "greater", and the reasons name a place only.
- **Valid alternatives accepted:** comparisons have one right symbol. = is always offered with < and >, so equal numbers are handled (P3/O3/T3 use = / ≠).
- **Hints don't give answers away:** "Find the two tick marks each number is between…", "Start at the left. Find the first place where the digits are different.", "How many thousands does each number have?".
- **Comparisons connect digit values:** the Learn slides do this well; the explanations don't (L213-02).

## Builder's known design choices: judgement

1. **Order items use the normal choice grid, not compact chips: sound.** At 1366 px the three options sit in one row per place (`r213/shots/vp/1366x768-pt12.png`). At 320 px they stack with no clipping.
2. **At 320 px Learn 5 is long** (four questions of three choices; Check Answer is about 560 px below the fold at 390×844). It is acceptable on a phone, with no clipping or sideways scroll. At 1024–1920 px every Learn Your Turn keeps the question, its answers and Check Answer on screen (Check bottom 634–755 of 768).
3. **Phone number lines show only the first, middle and last labels (shared CSS): sound.**
   - At 320 px PT1 shows 0 / 4,000 / 10,000 and PT2 shows 6,200 / 6,400 / 6,700, with no overlap (`r213/shots/vp/320x568-pt1.png`, `-pt2.png`). The skills suite checks overlap at 6 widths.
   - The "middle" label is the middle of the labelled ticks (4,000, 6,400), not the middle of the line. That is fine, because the ticks stay and the dots are lettered.
   - Only 2-13 uses `.is-wide-only`; the `.sym-line` change applies under 380 px and only to the symbol sentence. No other lesson uses these, so there is no regression risk (components suite 52/52 in the builder's run).

## Verified working

**Math and keys** (`r213/sample.out`): every item matches spec §6–§8 and §12.
- P: B/>, A/<, =/No place, ≠/Tens, >/Thousands, </Hundreds, >, <, >, </No (0 thousands), 3,475 L/>, 3,947 < 4,598 < 4,615.
- O: A/<, B/>, =, ≠/Tens, >/Thousands, </Hundreds, >, <, <, </No, 1,850 m/>, 4,999 < 5,230 < 5,302.
- T: B/<, A/>, =, ≠/Tens, >/Thousands, </Hundreds, >, <, <, </No, 6,319 library/<, 2,097 < 2,709 < 2,790.
- The correct response grades correct for every item, and there are no duplicate choices.

**Textbook coverage (pp. 83–86, map §9)**
- One Way (number line) is Learn 1. Another Way (place value, ≠ then >) is Learn 2–3. Work Together is Learn 2 and P9/T9.
- Items 1–2 (lines by 1,000s and by 50s) are P1, P2, O1, O2, T1 and T2. Items 3–4 (= and ≠) are P3, P4, O3, O4, T3 and T4. Items 5–6 (thousands and hundreds differ) are P5, P6, O5, O6, T5 and T6. Items 7 and 10 (4-digit against 3-digit) are Learn 4, P7, P10, O7, O10, T7 and T10. Item 9 (ones differ) is P9, O9 and T9. Item 11 (real world) is P11, O11 and T11. Item 12 (order three) is Learn 5, P12, O12 and T12.
- Reflect is the Learn finish screen.

**Navigation, practice, progress**
- **Learn:** a wrong answer stays locked with coaching ("Look again at: Which place decides. Start at the left…"); a right answer unlocks.
- **Review:** symbols show the child's own choice ("5,269 = 5,296 (equal to) ✗ · … Tens ✓", then "Correct answer: 5,269 ≠ 5,296 (not equal to)").
- **On My Own:** "10 of 12 correct" with Practice My Misses. Skill practice keeps separate progress (skills suite 70/70).
- **Test:** 12 questions, nothing shown.
- **Home "Continue":** "3 of 12", the same as the test menu.

**Devices** (320×568, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384)
- Screens: every Learn slide and Your Turn, all 12 Practice Together items, all 12 On My Own items, all 12 test items, the menu, the Parent Guide and Results.
- No sideways scroll and nothing clipped. Targets are at least 48 px tall and inputs at least 44 px wide. The smallest text is 14.4 px (number-line labels).
- "5,250 ◯ 3,000" stays on one line at 320 px, and the symbol chips are 48 px or taller.
- **Keyboard:** Tab never lands in the hidden wizard phase or on an invisible element.

**Runs** (one at a time, in the foreground)

| Run | Result |
|---|---|
| `npm test` | 164/164 |
| `lessons.browser.mjs 2-13` | 109/109 |
| `lesson-2-13-skills.browser.mjs` | 70/70 |

No JavaScript errors or missing files. No `mathbook-chrome` processes are left; I left other projects' Chrome alone.

## Environment
- Headless Chrome via `tests/lib/harness.mjs`. Viewports were simulated; 200% zoom was simulated as 683×384. No physical device.
- Windows 11, 2026-10-11.
- Only this report file was added and committed.

## Re-check at cb76827

I re-checked commit `cb76827` with light Node runs only:
- `r213/sample.cjs` (output `r213/sample2.out`);
- 20,000 Learn step-5 seeds;
- `npm test` 165/165.

I edited no app, lesson, engine or test file.

| Finding | Status | Evidence |
|---|---|---|
| L213-01 | fixed | Learn 5 now picks the context once. Over 20,000 seeds, the noun in the story and in the question agree every time (mismatch **0**, before 13,419): "Three rivers are … / Which river is longest?", "Three roads are … / Which road is longest?", "Three trails are … / Which trail is longest?". |
| L213-02 | fixed | The explanations now name the value in the deciding place, with correct singulars and no parenthesis for ones:<br>• P5 "Thousands: 4 thousands > 3 thousands (4,000 > 3,000)";<br>• P6 "Hundreds: 6 hundreds < 9 hundreds (600 < 900)";<br>• P4 "Tens: 1 ten < 4 tens (10 < 40)";<br>• P9 "Ones: 8 ones > 5 ones";<br>• T9 "Ones: 1 one < 8 ones";<br>• P7 "6 thousands > 0 thousands (6,000 > 0)".<br>The places that match stay short ("Thousands 8 = 8, hundreds 4 = 4"). |

**No regression:**
- My sampler still finds no errors (BAD 0).
- The keys, symbols and positions are unchanged: the deciding place is still spread 5,047/4,914/5,033/5,006, and the equal / not-equal mix is the same.
- Only explanation text and the Learn 5 story changed, so the layout results from the review still apply. No browser rerun was needed.
