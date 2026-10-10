# Chapter 2 plan

Coordinator's plan for completing Chapter 2 (Unit 2: Use Place Value to Fluently Add and Subtract within 1,000). Per-lesson detail lives in [lessons/](lessons/) (one spec per lesson, written by the curriculum agents from the actual scanned pages). Progress: [STATUS.md](STATUS.md). Shared screens and components: [DESIGN.md](DESIGN.md).

## Source map (printed pages)

| Pages | Content | Spec |
|---|---|---|
| 33–36 | 2-1 Represent 4-Digit Numbers | (built; locked design reference) |
| 37–40 | 2-2 Round Multi-Digit Numbers | [2-2-verification.md](lessons/2-2-verification.md) |
| 41–42 | Math Probe: Rounding Numbers (rounding extension) | [2-2-probe.md](lessons/2-2-probe.md) |
| 43–46 | 2-3 Estimate Sums and Differences | [2-3.md](lessons/2-3.md) |
| 47–50 | 2-4 Use Addition Properties to Add | [2-4.md](lessons/2-4.md) |
| 51–54 | 2-5 Addition Patterns | [2-5.md](lessons/2-5.md) |
| 55–58 | 2-6 Use Partial Sums to Add | [2-6.md](lessons/2-6.md) |
| 59–62 | 2-7 Decompose to Subtract | [2-7.md](lessons/2-7.md) |
| 63–66 | 2-8 Adjust Numbers to Add or Subtract | [2-8.md](lessons/2-8.md) |
| 67–70 | 2-9 Use Addition to Subtract | [2-9.md](lessons/2-9.md) |
| 71–74 | 2-10 Fluently Add within 1,000 | [2-10.md](lessons/2-10.md) |
| 75–78 | 2-11 Fluently Subtract within 1,000 | [2-11.md](lessons/2-11.md) |
| 79–82 | 2-12 Solve Two-Step Problems Involving Addition and Subtraction | [2-12.md](lessons/2-12.md) |
| 83–86 | 2-13 Compare 4-Digit Numbers | [2-13.md](lessons/2-13.md) |
| 87–90 | 2-14 Fluently Add Multi-Digit Numbers | [2-14.md](lessons/2-14.md) |
| 91–94 | 2-15 Use an Algorithm to Subtract | [2-15.md](lessons/2-15.md) |
| 95–97 | Unit Review (vocabulary + mixed review 6–20) | [unit-review.md](lessons/unit-review.md) |
| 98 | Performance Task | [performance-task.md](lessons/performance-task.md) |
| 99–100 | Fluency Practice / Fluency Check | [fluency.md](lessons/fluency.md) |

## How every lesson is built

- Same template as 2-1/2-2: Lesson Menu → Learn (Example → Your Turn per step) · Practice (Practice Together, On My Own) · Take a Test · My Results · Parent Guide (with Reset Lesson Progress).
- One folder per lesson: `curriculum/chapter-2/lesson-2-N/` with `index.html` and `lesson.js` (data only). One catalog entry in `assets/js/catalog.js`.
- Shared engine (`assets/js/*.js`, `assets/css/mathbook.css`) changes only through the coordinator, once per batch, before lesson builders start.
- Tests: `tests/lessons.test.js` (structure and answer validity for every lesson), `tests/lessons.browser.mjs` (full student journey + layout for every lesson), plus `tests/lesson-2-N.test.js` per lesson (hand-checked answer key and lesson-specific rules).

## Batches

1. **Batch A:** 2-2 fixes + rounding probe, 2-3, 2-4
2. **Batch B:** 2-5, 2-6, 2-7, 2-8
3. **Batch C:** 2-9, 2-10, 2-11, 2-12
4. **Batch D:** 2-13, 2-14, 2-15
5. **Batch E:** Unit Review, Performance Task, Fluency Practice/Check; final chapter-wide review

Each batch: shared components → builders (one per lesson, parallel, separate folders) → independent math review + device/accessibility test + functional/regression test → fixes → reviewer re-verification → merge → deploy → live verification → STATUS update.

## Decisions (routine, made by the coordinator)

1. **2-2 gaps (from the verification against pp. 37–40):**
   - Practice p6 duplicates book item 6 (672). Replace it with a 2-digit number to the nearest hundred: 87 → 100, where the lower hundred is 0. This covers the skill of book item 7, but 78 itself is the book's number and is not used (review A-05).
   - Test t6 stays 781 → 800, so the test keeps a 3-digit number that rounds up to the nearest hundred (review A-06).
   - Practice p1 and test t1 become 2-digit numbers on a number line (book item 1): p1 = 36 → 40 and t1 = 72 → 70. 46 is avoided because it is a Check-Up choice (re-verification N-06).
   - Test t9 (explain a nearest-hundred result) becomes 68 → 100, so the test keeps a 2-digit number to the nearest hundred (N-01).
   - Test t10 (halfway claim) becomes 65 → 70 instead of 85, because 85 appears in the Check-Up practice (N-06).
   - Practice p5 becomes 418 → 400.
   - Practice p12 gets a new name.
   - The "choose all that round to a ten" gap is covered by the rounding probe set (2 below).
   - The Learn examples taken from the book (127, 255, 896, 235–244, 315, $15 + $22 + $12) stay. The owner's 2-2 instructions named them explicitly.
2. **Rounding probe (pp. 41–42):** add it inside 2-2 as a second On My Own set ("Rounding Check-Up") and a short second test, not as a separate lesson.
3. **Compatible numbers (2-3):** auto-graded as "the nearest number ending in 00, 25, 50 or 75" (the book's own example uses 575 and 125). The question names the method, so there is exactly one expected estimate. The explanation says other friendly numbers can also work.
4. **Property names (2-4):** the child sees "order" and "grouping". "Commutative" and "associative" appear in the Parent Guide only.
5. **Length:** tests may run 10–14 questions when coverage requires it. Every distinct assessed skill and problem type comes first; trim only duplicates. Exception: the Unit Review test (15) and the Fluency Check (16) mirror the book's own item counts.
6. **Written explanations:** structured, auto-graded choices in practice and tests. Free explanations appear only as Practice Together "explain aloud" items that the parent marks. Free explanations are never auto-graded or counted in test scores.
7. **Original content:** app questions use new numbers and contexts. Book examples may be cited in the Parent Guide.
8. **2-5 child-written equations:** one equation per item; the book's "two equations" is covered by giving the same pattern twice across items. Sums above 999 are accepted (the pattern still holds).
9. **2-7 decomposition steps:** each step is checked against the child's own previous step, so one slip is reported once. The final difference must be exactly right.
10. **2-8 adjusting:** any adjustment that keeps the sum (addition) or difference (subtraction) is accepted, as long as at least one number changes. An adjustment that doesn't make the numbers friendlier gets a gentle tip, not a wrong mark. The book asks for "easier", not one fixed way.
11. **Picture choices:** when the choices are pictures (e.g. number lines), the pictures are shown above the question labelled A/B/C, and the choices are "A", "B", "C".
12. **Keyed "why" choices:** one best reason is keyed. Practice Together explanations let the parent talk through other valid reasons.
13. **Practice lists:** Practice Together (`guided`) and On My Own (`bankSets`) may hold different items. The specs list them separately and builders keep them separate.
14. **Drawing and writing tasks:** "draw a diagram" becomes choosing the matching diagram, and "write a story" becomes choosing the matching story. Each also gets a Practice Together explain-aloud item so the child still tells their own.
15. **Equivalent equations:** a related equation is accepted in any correct order (`? + part = whole` and `part + ? = whole`; letter on either side of =).
16. **Grading steps vs answers:** in Learn and Practice, the steps of the method being taught are graded (they are the skill). In tests, steps are graded only when the item asks for that method; otherwise only the final answer is graded, and any valid strategy is accepted.
18. **2-15 has no regrouping.** Every subtraction on pp. 91–94 (and Unit Review item 9) works without regrouping, so 2-15 follows the book. Regrouping in subtraction is practised with the strategies of 2-7, 2-8 and 2-11.
19. **Unit Review item 20** is labelled "(Lesson 2-3)" in the book but is a comparison item, so it maps to 2-13.
20. **Catalog entries:** Unit Review, Performance Task and Fluency Practice are three separate entries after 2-15 (simple for the child; each has its own progress).
21. **Fluency:** no countdown and no timer. Fluency is accuracy with a quick strategy, and the pages show no time limit.
22. **5-digit items** that appear on the pages (e.g. 17,016 + 1,111) are kept, even though the unit title says "within 1,000".
23. **Shared design (DESIGN.md):** adopted as the single spec for screens and components:
    - Figures go in a `q.figure` slot drawn by `assets/js/figures.js`.
    - `___` is drawn as a blank box, and `parts` gains `compact` and `anyOrder`.
    - The proposed `eqmake`, `pstack` (row mode), `dsub` and `adjust` types are all presets of one `chain` control. Stacked partial sums and the algorithm are one `vcalc` control.
    - The grading rules in the lesson specs stay as written. Builders read each spec through DESIGN.md §2.
24. **Support in tests:** running totals, live adjust tags and similar helpers are hidden in Test mode.
25. **Digit boxes:** at least 48px tall everywhere. On a 320px phone they may be as narrow as 40px when a 5-digit layout needs it.
26. **Wrong-box marks:** the new controls mark each wrong box after a miss in Learn and Practice Together. The existing `parts` type keeps its approved "Look again at: …" coaching, unchanged.
27. **2-3 arrows layout** (with "?" boxes) is used in Learn and Practice Together only. On My Own and Test use plain answer fields.
17. **One shared component per model:** the bar diagram, vertical stack, adjust arrows and equation chains are each built once in the shared engine and reused by every lesson (DESIGN.md is the single specification).
28. **Re-verification leftovers** (`reviews/batch-*-plan-review.md`, "Re-verification" sections) are part of each lesson's build instructions. Builders apply every "new finding" listed there. Coordinator rulings:
    - 2-8 O9/T9 (B N-2): the "which is easiest" choices list only valid adjustments (every option keeps the difference), so it cannot reveal the choose-all answer.
    - 2-5 Learn Step 3 (B N-1): the start number is 4–20.
    - 2-3 (A N-03): the missing-part and two-step Your Turn templates round to the nearest ten.
    - 2-3 (A N-04): the book's 575 − 125 pair is excluded.
    - 2-4 (A N-05): choice lengths are balanced.
