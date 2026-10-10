# Lesson spec template (curriculum agent fills one file per lesson: `lessons/2-N.md`)

Write for the builder: concrete, complete, and checked. Original wording only — do not copy textbook sentences or problems verbatim into app content (use the book's *methods, skills and problem types* with new numbers and contexts; a book example may be cited in the parent guide as "Book example: …").

## What the app can already do (reuse first)

Lesson engine (see `curriculum/chapter-2/lesson-2-2/lesson.js` — the data-driven template — and `README.md`):
- **Lesson Menu** → Learn · Practice · Take a Test · My Results, plus **Parent Guide** (`parentLearn`: goal, words, demonstrate, ask, mistakes, checklist).
- **Learn**: a series of steps. Each step = **Example** (a short series of "slides": HTML parts shown one at a time) then **Your Turn** (one generated check question; correct answer unlocks Next Step; two misses explain and give a new question). The number of steps is up to the lesson (2-1 and 2-2 have 5; use what the content needs).
- **Practice Together** (`guided`): items with hint, check, show answer and why; optional parent coaching (`parent`) and `explain` items (child explains aloud; parent marks it — not auto-graded).
- **On My Own** (`bankSets`): sets of questions answered one at a time, checked at the end, with explanations and "Practice My Misses".
- **Take a Test** (`tests`): one question at a time, no hints/feedback until Finish Test; results by skill with "Practice this skill".
- Question types (`assets/js/questions.js`): `mc` (one choice), `select` (drop-down in a sentence), `number` (whole number; commas/spaces OK), `expanded`, `words`, `chart` (digit per place), `build` (base-ten blocks), `parts` (several answers graded together: `num`, `round` = any number that rounds to a target, `choice`, `multi` = select all), `rline` (staged rounding number line).
- Visuals: place-value chart, base-ten blocks, number lines (`pv.numberLineHTML`, any min/max/ticks/labels/point/arrow/band).

If a lesson genuinely needs a new model or interaction (e.g. bar diagram, vertical "stacked" addition/subtraction, decomposition tree, adjust-arrows, <,>,= picker, missing-digit algorithm), say so under **New interaction or model needed**, describe it precisely, and keep it as small as possible.

## Sections (use these headings)

1. **Source pages** — printed page numbers and what is on each (Be Curious, Learn, Work Together, On My Own items, Reflect).
2. **Goals and prerequisites**
3. **Vocabulary** — child-friendly definitions (one line each).
4. **Methods taught in Learn** — every method/strategy on the Learn page, with the book's worked example summarised and the reasoning.
5. **Guided sequence (Learn steps)** — for each step: title; Example parts (what the child sees, one idea per part, with the model); Your Turn (question type, how numbers are generated/constraints, what is checked, hint).
6. **Practice Together** — items (original), each with answer, hint, explanation, and optional parent coaching; include the book's reasoning / error-analysis / real-world kinds.
7. **On My Own practice set** — items (original), every distinct book problem type covered, answers.
8. **Test (independent assessment)** — items (original, different numbers from practice), every assessed skill covered, answers; mark any item that needs parent review (written explanation) — prefer structured choices so it can be auto-graded.
9. **Book problem coverage map** — every numbered book problem (Work Together, On My Own 1–12, Reflect) → which app item(s) cover its skill/type.
10. **Common mistakes and coaching**
11. **Parent Guide content** — goal, words, how to demonstrate each method, questions to ask, mistakes, skills checklist (concise).
12. **Answer key check** — every answer above independently recomputed (show the arithmetic for anything non-trivial).
13. **New interaction or model needed** — or "None".
14. **Open questions / assumptions**
