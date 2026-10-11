# Number Words update · Phase 4: Hundreds and thousands

Owner request (Batch 3, 2026-10-11): update the existing Number Words activity. The requirements:

- add guided examples that link the numeral, place value and words;
- practise words → numeral and numeral → words;
- include internal zeros within the documented range;
- give feedback and retries, navigation, saved progress and a reset;
- provide a simple entry point and follow the book's wording;
- normalize capitals, spacing and hyphens, and accept an optional "and";
- reject wrong values and missing parts;
- migrate old saves safely and reset only this activity;
- no separate app and no range extension.

## Decisions

| Question | Decision | Why |
|---|---|---|
| What is "the documented range"? | **100–9,999**, the planned Phase 4 "Hundreds and thousands" in `number-words/program.js` (examples 135, 2,137 and 5,072). | Phase 1 (0–10) has no internal zeros. Phase 4 is the documented phase that does ("A zero place is not said: 5,072"). It matches Lesson 2-1 (numbers to 9,999) and `pv.numberToWords` (0–9,999). Nothing goes beyond 9,999. |
| No separate app | Phase 4 is a page inside `number-words/` (`number-words/phase-4/`). It runs on the shared lesson engine with an optional `brand` setting. | The engine already provides the owner's template, so nothing is duplicated: Parent Guide, Learn wizard (Example → Your Turn), one question at a time, feedback and retries, Practice Together, On My Own with skill practice, a test, results, saved progress, reset with confirmation, and Home Continue. |
| Book wording | Lesson 2-1's word form, e.g. "two thousand, one hundred thirty-seven": a comma after "thousand", hyphens join tens and ones, and zero places are not said. | It matches the book and the existing Number Words convention line. |
| Grading | `words` items use `pv.checkWords`. Capitals, extra spaces, hyphens (or spaces), the comma, a final period and "and" do not matter. A wrong value, a missing part, a misspelling ("ninty"), a run-together word ("ninetythree") and a spoken zero ("zero hundred") are wrong. `number` items accept 3008, 3,008 and "3 008". | Generous with format, strict with the math. Tested in `tests/number-words-phase-4.test.js`. |
| Old saves | No save format changes. Phase 1 keeps `mathbook:v2:number-words:phase-1:*`, which is untouched. Phase 4 uses its own prefix, `mathbook:v2:number-words:phase-4:`, and neither prefix contains the other. Damaged Phase 4 skill-practice data is handled by the engine (browser test). | "Migrate safely" therefore means leaving every existing key alone, and that is verified. Phase 1 data seeded before a Phase 4 reset is still there afterwards (browser test). |
| Reset | Phase 4's "Reset Progress" erases only the Phase 4 prefix. Its text says "Number Words Phase 1 and the math lessons are not changed." | Owner: reset only that activity. |
| Phases 2–3 | Still outlines. | Out of scope; no range extension. |

## Content

- **Learn (5 steps):**
  1. Hundreds in words (135, chart → words).
  2. Words to numbers (462, 715).
  3. Thousands (2,137).
  4. Zeros are not said (5,072, 3,405, 6,008; words → 4,060 with 0s).
  5. Check the word form (7,056 vs 7,506 vs 756; spelling to watch: forty, fifteen, eighteen, ninety).
- **Your Turns:** generated, with demo numbers excluded. Step 4 alternates words → number and number → words. Step 5 shows three distinct word-form choices, where the wrong ones are real numbers with a moved or missing place.
- **Practice Together 12, On My Own 12, Number Words Test 12.** Skills: towords, tonumber, zwords, znumber, check, place. Every test skill has On My Own practice, and both directions are practised and tested. 24 of the 36 set items contain a 0, 21 of them inside the number (e.g. 4,027, 3,008, 7,090).
- **Answer positions:** the authored word-form choices vary their key position, the test shuffles them, and the Yes/No choices stay in order.

## Shared changes

- `lesson-app.js`: optional `L.brand = { noun, pill, crumbs, menu, thing, resetNote }`. Without it, every lesson string is unchanged ("Lesson 2-13", "Lesson Menu", "Reset Lesson Progress", "Section 2-13", "this lesson").
- `catalog.js`: `activities` (Phase 4) sits next to `lessons`. Home's Continue uses both and names an activity by its `label` ("Number Words · Phase 4 · …"). The Math Lessons list still shows only lessons. `tests/lessons.browser.mjs` runs the generic journey for activities too.
- `number-words/program.js` and `number-words/index.html`: Phase 4 is `ready` with its own row ("Open →"). The landing page lists its examples and how it works.
- Tests:
  - `tests/number-words.test.js` and `tests/number-words.browser.mjs` now expect Phases 2–3 locked and Phase 4 open.
  - New: `tests/number-words-phase-4.test.js` and `tests/number-words-phase-4.browser.mjs`.

## Review fixes (docs/chapter-2/reviews/number-words-phase-4-review.md)

- **NW4-01:** the place question reads the same for Yes and No ("What digit is in the tens place?" / "Do you say the tens in the words?"). Unit test added.
- **NW4-02:** the mastery advice says "Ready to move on to the next phase." Lessons still say "next lesson", since `brand.thing` defaults to "lesson". Browser test added.
- **NW4-03:** not changed in this batch. It already existed in the shared engine and also affects the lessons: a saved value that is valid JSON but the wrong shape (e.g. `5` in `see-wizard`) stops that screen rendering until progress is reset. Phase 4 has no older saves. Recorded as a remaining issue.
