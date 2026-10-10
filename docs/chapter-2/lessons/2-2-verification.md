# 2-2 Round Multi-Digit Numbers — verification against the textbook (pp. 37–40)

Checked: printed pages 37–40 (`docs/textbook-references/chapter-2/pages/page-037.jpg` … `page-040.jpg`) against the live content in `curriculum/chapter-2/lesson-2-2/lesson.js` (Learn steps 1–5, practice p1–p12, test t1–t12, Parent Guide, reflection). Every app answer was recomputed with "halfway rounds up" (the book's rule: "5 or greater, round up").

**Verdict:** the math is correct everywhere and both Learn methods are taught as the book teaches them. There are **four significant gaps or mismatches** (section 3). Everything else is covered.

## 1. What is on the pages

| Page | Content |
|---|---|
| 37 | Be Curious: photo of a big ball of toy blocks. "What do you notice? What do you wonder?" Mindset box. |
| 38 | Learn: "About how many blocks are there?" (127 blocks). Definition: rounding to the nearest 10 or 100 finds a ten or hundred close to the number. **One Way: number line.** 127 on a 120–130 line, halfway 125, to the right of halfway, so 130. 127 on a 100–200 line, halfway 150, to the left of halfway, so 100. **Another Way: place value.** Underline the ones digit (12**7**): 5 or greater, round up to 130. Underline the tens digit (1**2**7): less than 5, round down to 100. "You can round to make a number easier to work with when an exact number is not needed." Choosing Tools box: "Why is a number line helpful for rounding?" **Work Together:** Ellie rounds 255 to 260 and Carter rounds 255 to 300. Why are their answers different? |
| 39 | On My Own. Number line: (1) 27 to the nearest 10, (2) 896 to the nearest 10. Place value: (3) 48 to the nearest 10, (4) 273 to the nearest 10. Number line, show work: (5) 436 to the nearest 100, (6) 672 to the nearest 100. (7) How can 78 round to 80 and to 100? Explain. (8) A number rounded to the nearest 10 is 240. What could it be? |
| 40 | (9) Use a number line to show why 678 rounds to 700 (nearest 100). Explain. (10) Error Analysis: Tess says 315 rounds to 310 (nearest 10). Do you agree? (11) Fruit salad: 9 strawberries, 25 orange wedges, 19 kiwi slices, 27 blueberries, 16 grapes, 21 raspberries. Which fruits does he use about 20 of? (12) Extend Your Thinking: Sam has $50 and wants items that cost $15, $22 and $12. How can he make sure he has enough money? **Reflect:** When might you round to the nearest 10 instead of the nearest 100? |

Book answers (recomputed): 1) 30. 2) 900. 3) 50. 4) 270. 5) 400. 6) 700. 7) To the nearest ten, look at the ones digit: 8 rounds up to 80. To the nearest hundred, 78 is between 0 and 100 and past halfway (50), so 100. 8) Any whole number from 235 to 244. 9) 678 is between 600 and 700, halfway is 650, and 678 is past halfway, so 700. 10) Disagree: 315 is exactly halfway, so it rounds up to 320. 11) Kiwi (19), grapes (16), raspberries (21). Not 9 (10), 25 (30, halfway rounds up), or 27 (30). 12) Rounding gives $20 + $20 + $10 = $50, which equals his money, so the estimate cannot settle it. The exact total is $15 + $22 + $12 = $49, which is not more than $50, so he has enough.

## 2. Coverage map

| Book item | Method / type | App coverage |
|---|---|---|
| Learn, One Way (number line, nearest 10) | Two tens, halfway, which is closer | Learn step 1 (127, staged `rline`); p1, p2; t1, t2 |
| Learn, One Way (number line, nearest 100) | Two hundreds, halfway, which is closer | Learn step 2 (127); p5, p6; t5, t6 |
| Learn, Another Way (place value, 10 and 100) | Ones digit for tens, tens digit for hundreds; 5 or more rounds up | Learn step 3 (342, 265, 896, 995, 950); p3, p4; t3, t4 |
| "Round when an exact number is not needed" | Purpose of rounding | Learn step 5, Parent Guide words (Estimate, Exact) |
| Choosing Tools: why a number line helps | Reasoning about the tool | **Not covered** (minor; see 4) |
| Work Together: 255 → 260 and 300 | Why tens and hundreds differ | Learn step 4 slide 1 (uses 255); p7 (249), t7 (347) `compareQ` with a reasoning choice |
| 1: 27, nearest 10, number line | 2-digit number on a number line | Partly. Every number-line item is 3-digit (p1 364, p2 396, t1 583, t2 297; Learn generator 101–989). 2-digit appears only with place value (p3 63, t10 85). See 4. |
| 2: 896, nearest 10 | Rounding up across a hundred | Learn step 3 (uses 896); p2 (396 → 400), t2 (297 → 300) |
| 3: 48, nearest 10, place value | 2-digit, place value | p3 (63 → 60) |
| 4: 273, nearest 10, place value | 3-digit, place value | p4 (485), t3 (621), t4 (735); Learn step 3 Your Turn |
| 5: 436, nearest 100, number line | Rounds down | p5 (438), t5 (314) |
| 6: 672, nearest 100, number line | Rounds up | p6 (672), t6 (781) |
| 7: 78 → 80 and 100 | Same number, two places; **2-digit to the nearest hundred** | Reasoning covered by p7/t7 (3-digit). The 2-digit-to-hundred case (lower hundred is 0) is **not covered**. See 3.2. |
| 8: rounds to 240, what could it be? | Work backward | Learn step 4 (240 range shown on a line), Learn step 4 Your Turn (`round` part); p8 (380), t8 (520) |
| 9: why 678 → 700 on a number line | Explain with halfway | p9 (561), t9 (849) `explain100Q` with a reasoning choice |
| 10: Error analysis, 315 → 310 | Halfway rounds up | Learn step 4 slide 3 (uses 315); Learn step 4 Your Turn; p10 (650), t10 (85) |
| 11: which amounts are about 20 | Select all that round to a ten, 2-digit, includes the halfway trap 25 | Learn step 5 slide 1 and Your Turn (lengths, nearest 10). Practice and test select-all items are **nearest hundred only** (p11, t11). See 3.3. |
| 12: $50; $15, $22, $12 | Estimate vs exact money | Learn step 5 slide 2 (uses the same numbers); p12 (Sam, $45), t12 (Ana, $60) |
| Reflect: when nearest 10 instead of 100 | Open reflection | `seeIt.reflection` (same question, ungraded) |

## 3. Significant gaps and mismatches

**3.1 Book problems are used verbatim in the app (originality rule).** The template requires original numbers. Several app items reuse the book's On My Own problems and give their answers, so a child who uses the app first has already seen the book's answers:
- Learn step 3 shows 896 → 900 (book item 2).
- Learn step 4 shows "which numbers round to 240" with the answer 235–244 (book item 8) and the 315 → 310 error with its fix (book item 10, Tess renamed Jo).
- Learn step 5 shows the $50 budget with $15, $22, $12, estimate $50 and exact $49 (book item 12, Sam renamed Rita).
- Practice p6 is book item 6 exactly (672 to the nearest hundred).
- Practice p12 uses the book's name "Sam" (numbers differ). Practice p5 (438) is close to book item 5 (436).
- 127 (Learn steps 1–3) and 255 (Learn step 4) are the book's own worked example and Work Together; using these as worked examples matches the book. They are acceptable if the owner agrees, but by the template's rule they should be cited in the Parent Guide as "Book example" rather than used as the app's own examples.

**3.2 Missing problem type: a 2-digit number rounded to the nearest hundred (book item 7, 78 → 100).** Every nearest-hundred item in the app is a 3-digit number (Learn step 2 generator 151–999; p5, p6, p9, p11; t5, t6, t9, t11). The case where the lower hundred is **0** (78 is between 0 and 100, halfway 50) is never practised or tested. This is the exact situation book item 7 asks about. The `rline` type and `roundEnds` already handle it (78 at 100 gives lo 0, mid 50, hi 100), so only content is missing.

**3.3 Select-all to the nearest ten is not in Practice or the Test (book item 11).** Book item 11 is "which of these round to 20" with 2-digit amounts and the halfway trap (25 → 30). In the app this type appears only in Learn step 5 (worked example and generated Your Turn, nearest ten). The fixed practice and test select-all items (p11, t11) are nearest **hundred**, so the test never checks nearest-ten select-all or 2-digit select-all. (The Math Probe on pp. 41–42 also uses nearest-ten select-all; see `2-2-probe.md`.)

**3.4 2-digit numbers are never rounded on a number line (book item 1, 27).** All `rline` items use 3-digit numbers. The only 2-digit items (p3 63, t10 85) use place value or a choice. A 2-digit line (20 to 30, halfway 25) is the simplest case in the book and is the first On My Own item.

## 4. Minor notes (not blocking)

- The Choosing Tools question ("Why is a number line helpful for rounding?") has no app item. It could be a Parent Guide "ask" question.
- Be Curious (notice/wonder) is not represented. That is fine for this app.
- The book does not state "halfway rounds up" as a separate rule. It says "5 or greater, round up." The app's wording ("halfway rounds up") agrees with the book and is correct.

## 5. Math check of the live app (all correct)

- Learn: 127 → 130 / 100; 342 → 340 / 300; 265 → 270; 896 → 900; 995 → 1,000 (ten); 950 → 1,000 (hundred); 255 → 260 / 300; 235–244 → 240, 234 → 230, 245 → 250; 315 → 320; lengths 54 → 50, 55 → 60, 60 → 60, 63 → 60, 65 → 70; $20 + $20 + $10 = $50, $15 + $22 + $12 = $49, $1 left.
- Practice: p1 364 → 360; p2 396 → 400; p3 63 → 60; p4 485 → 490; p5 438 → 400; p6 672 → 700; p7 249 → 250 / 200; p8 375–384; p9 561 → 600 (past 550); p10 650 → 700; p11 249 → 200, 251 → 300 ✓, 300 ✓, 342 ✓, 350 → 400, 399 → 400; p12 estimate $10 + $20 + $10 = $40, exact $14 + $23 + $12 = $49 > $45, not enough.
- Test: t1 583 → 580; t2 297 → 300; t3 621 → 620; t4 735 → 740; t5 314 → 300; t6 781 → 800; t7 347 → 350 / 300; t8 515–524; t9 849 → 800 (before 850); t10 85 → 90; t11 449 → 400, 450 ✓, 482 ✓, 500 ✓, 538 ✓, 551 → 600; t12 estimate $30 + $20 + $10 = $60, exact $27 + $16 + $14 = $57 ≤ $60, $3 left.
- Generated Learn checks: step 5 length pool T−6 (no), T−5, T−2, T, T+4 (yes), T+5 (no) is correct for every T; the money check's "enough" test (exact ≤ estimate = budget) is correct.

## 6. Recommended 2-2 changes (follows PLAN.md Decision 1)

| Item | Now | Change to | Check |
|---|---|---|---|
| p6 (number line, nearest 100) | 672 → 700 (book item 6 verbatim) | **87 → 100** (2-digit, lower hundred is 0). `lineQ(87, 100, 'p6')`. Do **not** use 78 (book item 7's number). | 87 is between 0 and 100; halfway 50; 87 is past halfway, so 100. floor((87 + 50) / 100) × 100 = 100. |
| t6 | 781 → 800 | **No change.** Keeps a 3-digit number that rounds up to the nearest hundred (book items 6 and 9). | floor(831 / 100) × 100 = 800. |
| p1 (number line, nearest 10) | 364 → 360 | A 2-digit number on a number line (book item 1), e.g. **46 → 50** (not 27 or 48, the book's numbers). | 40 and 50; halfway 45; 46 is past halfway, so 50. floor(51 / 10) × 10 = 50. |
| t1 | 583 → 580 | A 2-digit number on a number line, e.g. **72 → 70**. | 70 and 80; halfway 75; 72 is before halfway, so 70. floor(77 / 10) × 10 = 70. |
| p12 (money) | name "Sam" (book's name) | A new name, e.g. "Dev". Numbers unchanged ($45; $14, $23, $12; estimate $40; exact $49; not enough). | 10 + 20 + 10 = 40; 14 + 23 + 12 = 49 > 45. |
| p5 (number line, nearest 100, rounds down) | 438 (very close to book item 5's 436) | **418 → 400** (review A-07). | 400 and 500; halfway 450; 418 is before halfway, so 400. |
| Parent Guide `ask` | — | Add the book's Choosing Tools question: "Why is a number line helpful for rounding?" (review A-07). | — |
| Select-all to the nearest ten (gap 3.3) | Learn only | Covered by the Rounding Check-Up set and test (`2-2-probe.md`: PR1, PR3, TR1, TR3). | — |
| Learn examples taken from the book (127, 255, 896, 235–244, 315, $15 + $22 + $12) | — | **Stay** (Decision 1: the owner's 2-2 instructions named them). Gap 3.1 is therefore closed for Learn. It is fixed for practice by p6 and p12 above. | — |

Coverage after these changes: 2-digit on a number line (p1, t1); 2-digit to the nearest hundred (p6); 3-digit rounding up to the nearest hundred on a number line (t6 781, and the Learn step 2 generator); rounding down to the nearest hundred (p5 418, t5 314). No practice item and no test item uses a book On My Own number.

## Review fixes

| Finding | Change |
|---|---|
| A-05 (PLAN Decision 1, p6 → 78) | Section 6 recommends p6 = 87 → 100, and says not to use 78. |
| A-06 (t6 coverage) | Section 6 keeps t6 = 781 → 800, as Decision 1 now states. |
| A-07 (Choosing Tools; p5 close to book) | Section 6 adds the Choosing Tools question to the Parent Guide `ask` list and changes p5 to 418 → 400. |
