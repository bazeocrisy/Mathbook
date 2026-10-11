/*
 * Mathbook catalog: the one list of lessons, used by the Math Lessons page and the home page's Continue button.
 * Adding a lesson = one entry here (plus its folder under curriculum/). Progress is read from each lesson's own
 * saved data (localStorage prefix "mathbook:v2:lesson-<id>:"); nothing here writes anything.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});

  // id: lesson id (storage prefix and folder name lesson-<id>); steps: number of Learn steps; tests: [id, label].
  const CHAPTER_2 = [
    { id: '2-1', title: 'Represent 4-Digit Numbers', desc: 'Thousands, hundreds, tens, and ones.', steps: 5, tests: [['math', 'Math Test'], ['vocab', 'Math Words Test']] },
    { id: '2-2', title: 'Round Multi-Digit Numbers', desc: 'Round to the nearest 10 and 100.', steps: 5, tests: [['rounding', 'Rounding Test'], ['checkup', 'Rounding Check-Up']] },
    { id: '2-3', title: 'Estimate Sums and Differences', desc: 'Find about how many by rounding or using friendly numbers.', steps: 6, tests: [['estimate', 'Estimation Test']] },
    { id: '2-4', title: 'Use Addition Properties to Add', desc: 'Change the order or grouping to add more easily.', steps: 5, tests: [['properties', 'Addition Properties Test']] },
    { id: '2-5', title: 'Addition Patterns', desc: 'Even and odd sums, and why they work.', steps: 6, tests: [['patterns', 'Addition Patterns Test']] },
    { id: '2-6', title: 'Use Partial Sums to Add', desc: 'Break apart by place value, then add the partial sums.', steps: 6, tests: [['partial', 'Partial Sums Test']] },
    { id: '2-7', title: 'Decompose to Subtract', desc: 'Break apart one number, then take away the parts.', steps: 6, tests: [['decompose', 'Decompose to Subtract Test']] },
    { id: '2-8', title: 'Adjust Numbers to Add or Subtract', desc: 'Make friendly numbers and keep the answer the same.', steps: 6, tests: [['adjust', 'Adjust Numbers Test']] },
    { id: '2-9', title: 'Use Addition to Subtract', desc: 'Find the missing addend with a bar diagram.', steps: 6, tests: [['related', 'Use Addition to Subtract Test']] },
    { id: '2-10', title: 'Fluently Add within 1,000', desc: 'Partial sums or adjusting: choose a strategy.', steps: 5, tests: [['add', 'Fluently Add Test']] },
    { id: '2-11', title: 'Fluently Subtract within 1,000', desc: 'Decompose, adjust, or count up: choose a strategy.', steps: 5, tests: [['subtract', 'Fluently Subtract Test']] },
    { id: '2-12', title: 'Solve Two-Step Problems', desc: 'Bar diagrams and letters for unknowns.', steps: 6, tests: [['twostep', 'Two-Step Problems Test']] },
    { id: '2-13', title: 'Compare 4-Digit Numbers', desc: 'Number lines, place value, and <, >, =, ≠.', steps: 5, tests: [['compare', 'Comparing Test']] },
    { id: '2-14', title: 'Fluently Add Multi-Digit Numbers', desc: 'Decompose, partial sums, or the addition algorithm.', steps: 5, tests: [['adding', 'Adding Test']] }
  ];

  const lessons = CHAPTER_2.map((l) => Object.assign({ chapter: 2, path: `curriculum/chapter-2/lesson-${l.id}/`, key: `mathbook:v2:lesson-${l.id}:` }, l));

  // Other activities built on the lesson engine. They are not in the Math Lessons list, but Home's Continue button and
  // the journey test (tests/lessons.browser.mjs) use them like lessons. label: how Home names it.
  const activities = [
    { id: 'nw-4', label: 'Number Words · Phase 4', title: 'Hundreds and Thousands', path: 'number-words/phase-4/', key: 'mathbook:v2:number-words:phase-4:', steps: 5, tests: [['words', 'Number Words Test']] }
  ];

  function get(key) { try { return JSON.parse(root.localStorage.getItem(key) || 'null'); } catch (e) { return null; } }

  /** A short, honest progress note for one lesson ('' when nothing has been saved). */
  function progress(l) {
    // The main (first) test decides the score and "done"; a short extra test (2-2's Check-Up) never marks a lesson done.
    const all = get(l.key + 'attempts') || [];
    const attempts = all.filter((a) => !a.testId || a.testId === l.tests[0][0]);
    if (attempts.length) {
      const best = attempts.reduce((m, a) => Math.max(m, a.pct || 0), 0);
      return { kind: best >= 90 ? 'done' : 'test', text: `Best test score: ${best}%` };
    }
    // Only another test taken so far: name it and show its best score, never as "done".
    const other = l.tests.find(([id]) => all.some((a) => a.testId === id));
    if (other) {
      const best = all.filter((a) => a.testId === other[0]).reduce((m, a) => Math.max(m, a.pct || 0), 0);
      return { kind: 'test', text: `${other[1]}: ${best}%` };
    }
    const w = get(l.key + 'see-wizard');
    const done = w && w.done ? Object.keys(w.done).length : 0;
    if (done >= l.steps) return { kind: 'learned', text: 'Learn finished' };
    if (done || (w && w.step)) return { kind: 'started', text: `Learn: ${done} of ${l.steps} steps` };
    const started = l.tests.some(([id]) => get(l.key + 'draft-' + id)) || get(l.key + 'bank-sets') || get(l.key + 'skill-practice') || get(l.key + 'guided');
    return started ? { kind: 'started', text: 'Started' } : null;
  }

  /** Fills a <nav> with one whole-card link per lesson. base: path from the page to the site root ('../' on math/). */
  function renderLessonList(nav, base) {
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    nav.innerHTML = lessons.map((l) => {
      const p = progress(l);
      return `<a class="choice-card" href="${base}${l.path}#menu">` +
        `<span class="choice-icon choice-num" aria-hidden="true">${esc(l.short || l.id)}</span>` +
        `<span class="choice-text"><span class="choice-title">${esc(l.title)}</span><span class="choice-desc">${esc(l.desc)}</span>` +
        (p ? `<span class="choice-progress is-${p.kind}">${esc(p.text)}</span>` : '') + `</span></a>`;
    }).join('');
  }

  MB.catalog = { lessons, activities, progress, renderLessonList };
})(typeof window !== 'undefined' ? window : globalThis);
