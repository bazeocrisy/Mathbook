# Batch B plan review: specs 2-5, 2-6, 2-7, 2-8

Independent math and teaching review. I checked each spec against the scanned pages (pp. 51–66), `PLAN.md` Decisions 5–12, and `lessons/_TEMPLATE.md`. I recomputed every number in every spec by hand. No arithmetic errors were found. Every answer key, worked example and distractor computes correctly. The findings below are about grading rules, answer reveals, teaching gaps and originality.

## Findings

| id | severity | spec / section / item | problem | required correction |
|---|---|---|---|---|
| B-01 | major | 2-7 §13 M-DTREE (parts ≥ 1, start with 3 boxes); T3 953 − 610, O4 728 − 460 | The tree starts with 3 part boxes, and the Step 2 coaching says "hundreds, then tens, then ones". A child who decomposes 610 as 600, 10, 0 (or 460 as 400, 60, 0) has a correct place-value decomposition. §13/§14 reject any 0 part, so this correct answer is marked wrong. | Ignore blank or 0 parts when a valid tree still has 2 or more non-zero parts (do not fail it). Or show a gentle "remove the 0 part" message that is not counted as a miss. Add a unit test for 953 − 610 entered as 600 / 10 / 0. |
| B-02 | major | 2-7 O3, O4, T2 ("Why did you choose that way?" keyed `choice`) | The child builds their own tree, but one reason is keyed for one particular decomposition. O4's keyed reason is "Taking away 428 first lands on 300", yet the spec's own sample answer for O4 is 400, 60. A child who used place value and answers honestly is marked wrong, and in T2 that miss counts in the test score. | Separate the choice from the child's tree. Ask "Which is a good reason to break 460 into 428 and 32?" (or into 400 and 60), naming the decomposition in the question. Or key the reason to the type of tree the child built (place-value parts vs. a part that lands on a hundred or ten). Do not grade a personal "why" against one fixed decomposition. |
| B-03 | major | 2-5 §13 M-EQMAKE (ordered `addends` parity config); O2, O4, T2, T3, Step 4 | The parity constraint is per position. For "odd + even = ___", a child who writes 214 + 125 = 339 (even + odd) is marked wrong. The book itself lists 647 + 244 (odd + even) under "even + odd = odd" (p. 52), so it accepts either order. | For mixed-parity sentences, accept the two addends in either order: the multiset of parities {odd, even} must match. Same-parity forms are unaffected. Say so in `partCorrectText`. |
| B-04 | major | 2-6 §13 M-STACK row mode; all row items (Step 2, PT1, O1, O4, O9, T1, T3) | Each box must equal one specific addend's place value, and the three lines are not stated to be labelled. A child who writes 100 + 300 = 400 (second addend first), or does ones first on the top line, is marked wrong even though the partial sums are correct. | Label the three row lines Hundreds / Tens / Ones (fixed order). Within a line, accept the two place values in either order. Or, if the lines are unlabelled, accept the three lines in any order as long as each line is a correct same-place pair. |
| B-05 | major | 2-5 T7 (and PT4) | The keyed choice reads "No. 567 is odd, but the real sum is 577…", and the next `num` part asks for the sum (577). The test gives away the answer the child must compute. PT4 does the same with 667, which matters less in guided practice. | Make the keyed choice "No. 567 is odd like it should be, but a matching even/odd doesn't prove the sum is right." Make the distractors "Yes, the pattern proves it" and similar. Keep the number out of the choice text. |
| B-06 | major | 2-6 T8 (and O8, O9) "Row work … Show it stacked" | (a) Originality: T8 is the book's item 8 with the tens digits swapped. Book: 475 + 325, lines 400 + 300 = 700, 70 + 20 = 90, 5 + 5 = 10, total 800. T8: 425 + 375, the same 700 / 90 / 10 / 800 with "20 + 70". (b) Answer reveal: the prompt shows every partial sum and the total, and stacked mode pre-shows the labels, so the child only copies four numbers. It tests nothing. O8 and O9 have the same copy-only problem. | Use new numbers whose partial sums differ from the book's, e.g. 263 + 548 (700, 100, 11 → 811). In the test, show the row work with the partial-sum results hidden (or show only the two addends and the place-value equations without results). The child then has to compute and stack them. In O8/O9, at least blank the total, or set `given` so that the labels in stacked mode are blank. |
| B-07 | major | 2-8 PT5, O8, T8 number-line choice | The Step 3 example labels the bands "255 apart". If the candidate pictures carry a gap label (or tick labels that make the gap obvious) on the correct pair, the picture shows the difference the child is asked to type in the same item (229 in T8). | The candidate pictures must not show the difference. Label only the endpoints, and make the wrong picture differ visibly in band length. State this in §13. Alternatively, put the picture question after the number answer has been submitted. |
| B-08 | minor | 2-7 T12 keyed choice text | The keyed option is written "196 = 124 + 72 (524 − 124 = 400)". If the parenthetical is shown, it is the only option with a worked check that lands on a hundred, which is a give-away. | Choice text "124 + 72" only. Put the check in the explanation. |
| B-09 | minor | 2-7 Step 4 Your Turn generator | "start a (3-digit)" has no lower bound, but b = 101–109, so a = 100–108 gives a negative or near-zero difference. | Require a in 200–999 (or a − b ≥ 50). |
| B-10 | minor | 2-5 Step 5 Your Turn | The rule is contradictory: "Is C correct?" → "always No", then "in about 1 in 4, C = S and the answer is Yes". Also C = S ± 1 (50%) / ± 10 or 100 (50%). The percentages don't add up once the C = S case is included. | Specify: 25% C = S (Yes), 35% C = S ± 1, 40% C = S ± 10 or 100, with C kept 3-digit. Remove "always". |
| B-11 | minor | 2-5 Step 3 Your Turn | s is "random odd 5–21 (not 3)", but the demo list forbids 7, 11 and 15. s = 7 with k = 4 reproduces the demo sequence exactly. Also, "Will every number be odd?" always has the answer Yes. | Exclude 7, 11 and 15 from s. Sometimes use an even s (answer "Yes, every number is even"), or ask "even or odd?" so the answer varies. |
| B-12 | minor | 2-5 T2 "even + ___ = odd" | This form is not one of the book's six and is never practised: Step 4 draws from the six book forms, and O1–O6 and PT1–PT2 don't include it. The test is the first time the child sees it. | Add it to the Step 4 random pool or to one O item (e.g. replace O5's duplicate rule with it, keeping O5 in Practice Together), or change T2 to a book form. |
| B-13 | minor | 2-5 O9 distractor "Because 6 is even." | This statement is true and is half of a correct reason (odd + even = odd). A child picking it is not clearly wrong. | Replace it with a false statement, e.g. "Because 6 is bigger than 3." |
| B-14 | minor | 2-5 test, skills map | Skill `parity` (Even or odd number) is listed, but no test item uses it. | Add a short "choose all the odd numbers" item, or drop `parity` from the test skills. |
| B-15 | minor | 2-5 §8 "Test numbers differ from practice numbers" | Not quite true: 431 is in O13 and T12, and 214 is in O7, T12 and the Learn demo. | Change T12's 431 + 125 to, e.g., 433 + 124 = 557, and 214 + 322 to, e.g., 216 + 322 (true sum 538, so a claimed 539 has the wrong type). Recheck the keyed set afterwards. |
| B-16 | minor | 2-6 T11 (dropped-ten error) | This error type ("8 + 5 = 13, not 3") appears first in the test. PT3 and O11 only practise the "stopped at the hundreds" error, although §10 lists dropping the ten as a common mistake. | Add one Practice Together or On My Own item with a dropped ten in a partial sum. |
| B-17 | minor | 2-6 test, book item 9 (stacked → row) | Covered only by O9. No test item turns stacked work into a row. (T8 covers row → stacked.) | Optional. If T8 is reworked (B-06), consider making it stacked → row instead, or keep both directions. |
| B-18 | minor | 2-6 PT7 item text | The Item cell contains a note to the builder ("132 + 305 + 214 → but Learn used this; use 241 + 306 + 132"). A builder could copy it into the app. | Item text should read only "241 + 306 + 132". |
| B-19 | minor | 2-8 Reflect / method 6 | The book's Reflect asks about adjusting one number in addition **or subtraction**. Every "fix it" item (Step 4, PT8, O12, T12) is addition. The subtraction case, where the answer moves the opposite way (subtract 2 more → add 2 back), is never practised. | Add one practice item, e.g. "Mo finds 534 − 298 by subtracting 300 and gets 234. Fix it." → add 2 → 236. |
| B-20 | minor | 2-8 book item 9 ("explain why the equation is easier") | O9 and T9 check only which adjustments keep the difference ("good ways"). They never ask why one is easier. "350 − 133" is keyed as "good" but makes nothing easier. | Reword O9/T9 to "Which keep the same difference? Choose all." Then add a `choice` "Which of these is easiest, and why?" (e.g. 347 − 130: "130 is a friendly number"). |
| B-21 | minor | 2-8 T1 452 − 198 | This is nearly the Learn demo 452 − 197 (same first number, same "+2/+3 to make 200" move). | Use a different minuend, e.g. 531 − 198 = 333. |
| B-22 | minor | 2-8 §13 adjust grading | Any equal-sum pair is accepted, including a plain swap (248 + 195 → 195 + 248) and 443 + 0. These are not adjustments, but they would pass with only a soft tip. | Also require each new number to differ from both original numbers, and require both to be ≥ 1, or treat a swap or zero as "not an adjustment" (soft retry, as Decision 10 intends for unfriendly ones). |
| B-23 | minor | 2-8 Learn | The book's Learn is a two-step story (224 + 109, then − 212). The spec teaches the two adjustments separately and never connects them in one problem. | Optional: let Step 5's example use the two-step context with new numbers (add, then subtract, adjusting each). |
| B-24 | minor | all four specs, several `choice` items | Distractors are not specified for many choice items: 2-5 T8; 2-6 O11, T10, T11; 2-7 PT5, PT6, O9, O12, T8, T11; 2-8 PT4, PT6–PT8, O7, O10, O12, T7, T10, T12, T13. Builders will invent them and may write a distractor that is also true. | List 2–3 distractors for each. For "fix the sum", include the wrong direction (e.g. "Subtract 1") and "Nothing". |

## Verified correct

- **All arithmetic in all four specs** (Learn demos, Your Turn constraints, PT, O, T and answer-key sections), recomputed by hand. A few spot checks: 2-5: 331 + 332 + 334 = 997 odd, 213 + 214 + 215 = 642 even, and T12's "can't be right" set {537, 376}. 2-6: 389 + 246 = 500 + 120 + 15 = 635; T6 has only 174 + 528 giving 600/90/12; 226 + 403 + 158 = 787. 2-7: 802 − 456 = 346; 743 − 258 = 485 both ways; T12 has only 124 + 72 landing on 400. 2-8: O9 {347 − 130, 337 − 120, 350 − 133} = 217; T9 {427 − 220, 407 − 200, 430 − 223} = 207; T13 790.
- **Source-page summaries:** match pp. 51–66 for all four lessons (Be Curious, Learn examples, Work Together, On My Own 1–12, Reflect).
- **Coverage:** every Learn method and every book problem type is mapped to at least one app item, apart from the gaps noted above (B-12, B-17, B-19, B-20, B-23).
- **Generators:** 2-5 Steps 1, 2 and 4, 2-6 "PS pair", 2-7 "DS pair" and table generator, and 2-8 Steps 1, 2, 3 and 5 always have a valid answer.
- **Grading rules with no problems found:**
  - 2-6 reverse items (`either` set match).
  - 2-7 step-against-own-previous-step plus exact final (Decision 9).
  - 2-7 two-trees-must-differ by multiset.
  - 2-8 equal-sum and equal-difference acceptance (Decision 10).
  - 2-5 sums above 999 accepted (Decision 8).
- **Teaching:** the progressions are sensible for Grade 3, and the explanations are correct and child-friendly. These are good choices: the pairs/leftover model and ones-digit reasoning (2-5), "a pattern can catch a wrong sum but cannot prove a right one" (2-5), the number-line gap for subtraction adjusting (2-8), and "parts must add back to the number" (2-7).
- **Originality:** apart from B-06, app items use new numbers. Book numbers appear only in the Parent Guide and in demo-avoid lists.

## Re-verification

I checked each spec's "§15 Review fixes" against the changed text, diffing against commit 4ec0c28 (2-5 to 2-7 are committed in b4387f9; 2-8 is in the working tree). I recomputed every number that was changed or added.

### Finding status

| id | status | notes |
|---|---|---|
| B-01 | verified | 2-7 §13 now ignores blank and 0 boxes and needs 2–4 non-zero parts. Unit tests: 953 − 610 entered as 600/10/0 gives steps 353, 343 ✓; 728 − 460 entered as 400/60/0 gives 328, 268 ✓. The two-trees-must-differ check now compares non-zero parts only, which is correct. |
| B-02 | verified | O3, O4 and T2 ask about a named decomposition (Lena 200/40/1, Omar 428/32, Kim 300/50/2) in a separate choice part. Keys checked: 728 − 428 = 300 ✓. T2's distractor "Taking away 300 first lands on a hundred" is false (674 − 300 = 374) ✓. |
| B-03 | verified | 2-5 §13 `eqmake` grades the multiset of parities; either order is noted in Step 4, O2/O4/O5, T2/T3. |
| B-04 | verified | 2-6 row and stacked lines are labelled Hundreds/Tens/Ones in a fixed order; place values are accepted in any order within a line. |
| B-05 | verified | The PT4 and T7 keys no longer contain the sum. The new wrong choices are all false. |
| B-06 | verified | T8 = 263 + 548 → 700, 100, 11 → 811 ✓ (stacked → row, no results shown). New T13 = 384 + 457 → 700, 130, 11 → 841 ✓. O8 = 346 + 271 → 500, 110, 7 → 617 ✓. O9 = 247 + 352 → 599 ✓ (labels only). `hideResults` stops copying. No book numbers remain. |
| B-07 | verified | The question pictures label only the original endpoints, with no gap label. The wrong band is about 60 shorter, and the gaps 242 / 267 / 229 make that ≥ 20% ✓. The question is now "which picture slides both ends the same amount", which does not depend on the child's own adjustment. |
| B-08 | verified | The T12 choice text is "124 + 72" only. |
| B-09 | verified | a is 200–999, so a − b ≥ 91 ✓. |
| B-10 | verified | The claimed-sum mix is 25 / 35 / 40. With a + b ≤ 989 and S ≥ 110, a 3-digit C is always possible (± chosen to fit) ✓. |
| B-11 | verified (see N-1) | s may be odd or even and excludes 3, 7, 11, 15. The answer now varies. |
| B-12 | verified | `even + __ = odd` is in the Step 4 pool and O5 (248 + 135 = 383 ✓). The book's form 5 moved to PT10 (432 + 216 = 648 ✓). |
| B-13 | verified | The distractor is now "Because 6 is bigger than 3." |
| B-14 | verified | T13 picks the odd numbers {507, 189, 773} ✓ (362, 940, 618 are even). |
| B-15 | verified | T4 245 + 526 = 771 (odd) ✓. T12: 216 + 322 = 538, so the claim 539 can't be right ✓; 145 + 233 = 378 ✓; 260 + 117 = 377, so 376 can't be right ✓; 433 + 124 = 557 ✓; 304 + 153 = 457 ✓. Keyed set {539 claim, 376 claim} ✓. No overlap with practice numbers. |
| B-16 | verified | PT9 247 + 136 = 300 + 70 + 13 = 383 ✓ (373 drops the ten). O13 159 + 324 = 400 + 70 + 13 = 483 ✓. |
| B-17 | verified | T8 stacked → row, T13 row → stacked, skill `convert` added. |
| B-18 | verified | The PT7 text is "241 + 306 + 132". |
| B-19 | verified | Step 4 slide 3: 625 − 197, where 625 − 200 = 425, add 3 → 428 ✓. PT11: 534 − 296, where 534 − 300 = 234, add 4 → 238 ✓. O13: 712 − 399, where 712 − 400 = 312, add 1 → 313 ✓. The Your Turn is now addition or subtraction, with the correct key direction for each. |
| B-20 | verified (see N-2) | O9/T9 now read "keep the same difference" and add an "easiest and why" choice. Keys 347 − 130 and 407 − 200 are both valid (217 / 207 ✓) and both are the only option that subtracts a multiple of ten. |
| B-21 | verified | T1 531 − 189 = 342 ✓ (542 − 200 ✓, 532 − 190 ✓). |
| B-22 | verified | Both numbers must change by a non-zero amount, both must be ≥ 1, and a plain swap is rejected. Soft retry in Learn/Practice, marked wrong in the Test. |
| B-23 | verified | Two-step story: 236 + 198 → 234 + 200 = 434 ✓, then 434 − 214 → 420 − 200 = 220 ✓. |
| B-24 | verified | Wrong choices are now listed for every choice item named in B-24, and all of them are false statements. One exception is the s = 21 case in N-1. |

### New findings

| id | severity | spec / item | problem | required correction |
|---|---|---|---|---|
| N-1 | minor | 2-5 Learn Step 3 Your Turn | s runs from 4 to 21. When s = 21 the pattern is 21, 21+k, …, so the distractor "They are all bigger than 20." is also true. A child choosing it would be marked wrong. | Limit s to 4–20 (still excluding 3, 7, 11, 15), or replace that distractor with one that is always false (e.g. "Each number is 1 more than the last."). |
| N-2 | minor | 2-8 O9 and T9 ("easiest and why" choice on the same screen as the choose-all) | The easiest-choice key ("407 − 200, because 200 is a hundred…") tells the child that 407 − 200 keeps the difference. That gives away one of the three choose-all answers in the same item (in the test, T9). | Make "easiest and why" a separate question that comes after the choose-all. Or present it as "Of 427 − 220, 407 − 200 and 430 − 223 (all equal to 426 − 219), which is easiest?", which gives away nothing because the choose-all is already answered. |
| N-3 | minor | 2-7 §14, last bullet | It still says the "Why did you choose that way?" choice has "one true reason; the child's real reason may differ". This no longer matches the B-02 design and could mislead a builder. | Update the bullet to describe the named-decomposition "Which is a good reason?" question. |

No new math errors, answer leaks (other than N-2), coverage gaps or originality problems were found. All new and changed numbers recompute correctly.
