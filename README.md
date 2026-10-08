# Mathbook

Parent-led Grade 3 math lessons. Static site for GitHub Pages: no build step, no frameworks, no backend.

Live site: https://bazeocrisy.github.io/Mathbook/

## Lesson structure

Every lesson follows the same five stages:

1. **Teach It**: learning target, vocabulary, parent guide (what / what it means / why it works / how to demonstrate / what to ask / how to know), and a Show–Say–Ask teaching script.
2. **See It**: step-by-step worked examples with base-ten blocks and a place-value chart, plus a "build your own number" tool.
3. **Practice It**: guided practice (hints, check, correct, explain) and independent practice from a question bank.
4. **Test It**: 10-question tests with no hints or feedback. All answers are required, and every attempt uses new numbers.
5. **Results**: score, mastery band, explained mistakes, skills to review, and attempt history.

Mastery bands: **90–100%** Mastered · **70–89%** Review missed skills · **below 70%** Reteach and reassess.

Progress is stored in the browser's `localStorage` only. It does not sync between devices, and no names or results are sent anywhere.

## Files

```
index.html                         Home page (lesson list)
assets/css/mathbook.css            Shared styles
assets/js/place-value.js           Math helpers, answer parsing, SVG base-ten blocks (no DOM)
assets/js/questions.js             Question types: render, read, grade
assets/js/lesson-app.js            Five-stage lesson engine (reusable)
curriculum/chapter-2/lesson-2-1/
  index.html                       Lesson page (loads the scripts above)
  lesson.js                        Lesson content: vocabulary, parent guide, guided practice,
                                   50-question practice bank, Vocabulary Test and Math Test generators
  *.png, README.md                 Reference pages for the lesson
tests/math.test.js                 Unit tests (math, grading, content)
tests/browser.test.mjs             End-to-end test in headless Chrome/Edge
docs/screenshots/                  Phone/tablet/desktop screenshots from the browser test
```

## Adding a lesson

1. Copy `curriculum/chapter-2/lesson-2-1/` to the new lesson folder.
2. Edit `lesson.js`: register `Mathbook.lessons['<id>']` with new content and a new `storageKey`.
3. In `index.html`, change the `startLesson('<id>')` call. Script paths stay the same if the folder depth is the same.
4. Add the lesson to the home page list.

Question types available to any lesson: `mc`, `select`, `number`, `expanded`, `words`, `chart`, `build` (see `assets/js/questions.js`).

## Tests

Requires Node 18+ (no packages to install).

```
npm test               # unit tests: every number 0–9,999, all 50 bank questions, 2,000 versions of each test
npm run test:browser   # end-to-end in headless Chrome/Edge, served under /Mathbook/ like GitHub Pages
```

The browser test writes screenshots to `tests/screenshots/` (ignored by git). Set `CHROME_PATH` if Chrome is not found.
