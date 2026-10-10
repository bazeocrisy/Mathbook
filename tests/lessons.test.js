// Structural checks for every catalog lesson built on the data-driven template (2-3 onward).
// Lesson-specific answer keys live in each lesson's own test file (tests/lesson-<id>.test.js).
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../assets/js/catalog.js');
const MB = globalThis.Mathbook;
const { pv, Q } = MB;
const ROOT = path.join(__dirname, '..');

// 2-1 and 2-2 have their own suites (math.test.js, rounding.test.js).
const LESSONS = MB.catalog.lessons.filter((l) => !['2-1', '2-2'].includes(l.id));
for (const entry of LESSONS) {
  const file = path.join(ROOT, entry.path, 'lesson.js');
  if (fs.existsSync(file)) require(file);
}

/** Every question: renders, its correct response grades right, a blank never does, choices are sane. */
function checkQuestion(q, where) {
  assert.ok(q && q.type, `${where}: has a type`);
  assert.doesNotThrow(() => Q.render(q, 'k', {}), `${where}: renders`);
  assert.ok(Q.grade(q, Q.correctResponse(q)), `${where}: correct response grades right`);
  assert.ok(!Q.grade(q, Q.emptyResponse(q)), `${where}: a blank is not right`);
  assert.ok(!Q.isAnswered(q, Q.emptyResponse(q)), `${where}: a blank is not answered`);
  assert.ok(typeof q.explanation === 'string' && q.explanation.length > 10, `${where}: has an explanation`);
  const lists = [];
  if (q.choices) lists.push(q.choices);
  (q.parts || []).forEach((p) => p.choices && lists.push(p.choices));
  if (q.why) lists.push(q.why.choices);
  lists.forEach((c) => assert.equal(new Set(c).size, c.length, `${where}: choices are unique`));
  if (q.type === 'mc' || q.type === 'select') assert.ok(q.choices.includes(q.answer), `${where}: answer is a choice`);
}

for (const entry of LESSONS) {
  test(`Lesson ${entry.id}: structure, Learn checks, practice, and test`, (t) => {
    const L = MB.lessons && MB.lessons[entry.id];
    if (!L) { t.skip('not built yet'); return; }
    assert.equal(L.storageKey, `mathbook:v2:lesson-${entry.id}`, 'own storage prefix');
    assert.equal(L.number, entry.id);
    assert.equal(L.seeIt.steps.length, entry.steps, 'catalog step count matches the lesson');
    assert.deepEqual(Object.keys(L.tests).sort(), entry.tests.map((x) => x[0]).sort(), 'catalog test ids match');
    assert.ok(L.parentLearn && L.parentLearn.goal.length && L.parentLearn.words.length && L.parentLearn.demonstrate.length && L.parentLearn.ask.length && L.parentLearn.checklist.length, 'Parent Guide content');
    assert.ok(L.mistakes && L.mistakes.length, 'common mistakes');
    // Learn: every step has Example parts and a Your Turn check that works for many random numbers.
    L.seeIt.steps.forEach((s, k) => {
      assert.ok(s.id && s.title && s.explain, `step ${k + 1}: id, title, explain`);
      assert.ok(Array.isArray(s.slides) && s.slides.length >= 1, `step ${k + 1}: Example parts`);
      for (let seed = 1; seed <= 150; seed++) checkQuestion(s.check(pv.rng(seed)), `step ${k + 1} seed ${seed}`);
    });
    // Practice Together and On My Own.
    (L.guided || []).forEach((q) => { if (q.type !== 'explain') checkQuestion(q, `guided ${q.id}`); });
    if (L.bankSets) {
      L.bankSets.forEach((set) => set.ids.forEach((id) => assert.ok(L.bank.some((q) => q.id === id), `set ${set.id}: ${id} exists`)));
      L.bank.forEach((q) => checkQuestion(q, `bank ${q.id}`));
    }
    // Tests: reproducible for a saved seed, no hints or coaching, every skill named.
    for (const [id, test] of Object.entries(L.tests)) {
      const items = test.generate(12345);
      assert.deepEqual(test.generate(12345), items, `${id}: same seed → same test`);
      assert.equal(items.length, test.questions || items.length, `${id}: question count`);
      assert.equal(new Set(items.map((q) => q.id)).size, items.length, `${id}: unique question ids`);
      items.forEach((q) => {
        checkQuestion(q, `${id} ${q.id}`);
        assert.ok(!q.hint && !q.parent, `${id} ${q.id}: no hints or coaching on a test`);
        assert.notEqual(q.type, 'explain', `${id} ${q.id}: no unscored explain items on a test`);
        assert.ok(L.skills[q.skill], `${id} ${q.id}: skill "${q.skill}" is named`);
      });
    }
  });
}
