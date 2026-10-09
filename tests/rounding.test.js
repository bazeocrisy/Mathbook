// Unit tests for Lesson 2-2 (rounding): the rounding math, the "parts" question type, and every authored question.
// Run: npm test   (Node 18+; no dependencies)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-2/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-2'];

// Independent reference: compare distances to the two multiples (halfway goes up). Does not reuse pv.roundTo.
function nearest(n, place) {
  const lo = n - (n % place);
  const hi = lo + place;
  return n - lo < hi - n ? lo : hi;
}

test('roundTo matches an independent distance check for every number 0–1,000, to the nearest 10 and 100', () => {
  for (let n = 0; n <= 1000; n++) {
    for (const place of [10, 100]) {
      const want = n % place === 0 ? n : nearest(n, place);
      assert.equal(pv.roundTo(n, place), want, `${n} to the nearest ${place}`);
    }
  }
});

test('rounding boundaries: halfway rounds up, carries, exact multiples, and direct rounding', () => {
  const cases = [[125, 10, 130], [124, 10, 120], [127, 10, 130], [127, 100, 100], [150, 100, 200], [149, 100, 100],
    [995, 10, 1000], [950, 100, 1000], [949, 100, 900], [896, 10, 900], [255, 10, 260], [255, 100, 300], [315, 10, 320],
    [240, 10, 240], [300, 100, 300], [85, 10, 90], [5, 10, 10], [4, 10, 0], [50, 100, 100]];
  for (const [n, place, want] of cases) assert.equal(pv.roundTo(n, place), want, `${n} → ${want}`);
  // Direct, not successive: 145 → 100 to the nearest hundred (not 145 → 150 → 200).
  assert.equal(pv.roundTo(145, 100), 100);
  assert.equal(pv.roundTo(pv.roundTo(145, 10), 100), 200, 'successive rounding would give a different (wrong) answer');
});

test('reverse rounding: the range of numbers that round to a target is exactly right', () => {
  assert.deepEqual(pv.roundRange(240, 10), [235, 244]);
  assert.deepEqual(pv.roundRange(600, 100), [550, 649]);
  for (const [target, place] of [[240, 10], [380, 10], [520, 10], [600, 100], [1000, 100]]) {
    const [a, b] = pv.roundRange(target, place);
    for (let n = Math.max(0, a - 30); n <= b + 30; n++) assert.equal(pv.roundTo(n, place) === target, n >= a && n <= b, `${n} vs ${target}`);
  }
});

test('"parts" grading: blanks are not zero, every valid reverse answer is accepted, select-all needs the exact set', () => {
  const back = L.guided.find((q) => q.id === 'p8');
  for (let n = 375; n <= 384; n++) assert.ok(Q.grade(back, [String(n)]), `${n} rounds to 380`);
  for (const n of [374, 385, 380.5, -380]) assert.ok(!Q.grade(back, [String(n)]), `${n} must not be accepted`);
  assert.ok(Q.grade(back, ['  380 ']), 'surrounding spaces are fine');
  assert.ok(!Q.isAnswered(back, ['']) && !Q.grade(back, ['']), 'blank is not an answer');

  const p3 = L.guided.find((q) => q.id === 'p3'); // number: 63 → 60
  assert.ok(Q.grade(p3, '60') && Q.grade(p3, ' 60 ') && !Q.grade(p3, '') && !Q.grade(p3, '6'));
  const zeroQ = { type: 'parts', parts: [{ kind: 'num', label: 'x', answer: 0 }] };
  assert.ok(!Q.grade(zeroQ, ['']) && !Q.isAnswered(zeroQ, ['']), 'a blank never becomes a correct 0');
  assert.ok(Q.grade(zeroQ, ['0']));
  const commas = { type: 'parts', parts: [{ kind: 'num', label: 'x', answer: 1000 }] };
  assert.ok(Q.grade(commas, ['1,000']) && Q.grade(commas, [' 1000 ']) && !Q.grade(commas, ['1,00']));

  const sel = L.guided.find((q) => q.id === 'p11');
  const p = sel.parts[0];
  assert.deepEqual(p.answer.slice().sort(), ['251 crayons', '300 crayons', '342 crayons']);
  assert.ok(Q.grade(sel, [p.answer.slice().reverse()]), 'order does not matter');
  assert.ok(!Q.grade(sel, [p.choices.slice()]), 'selecting everything is wrong');
  assert.ok(!Q.grade(sel, [p.answer.slice(0, 2)]), 'missing one is wrong');
  assert.ok(!Q.isAnswered(sel, [[]]), 'nothing selected is not an answer');
});

test('Learn: five steps, Example slides and a Your Turn check that never reuses the worked example', () => {
  const steps = L.seeIt.steps;
  assert.equal(steps.length, 5);
  assert.deepEqual(steps.map((s) => s.id), ['tens-line', 'hundreds-line', 'place-value', 'reasoning', 'real-life']);
  assert.ok(steps.every((s) => s.kind === 'slides' && s.slides.length >= 2));
  const html = steps.map((s) => s.slides.join(' ')).join(' ');
  for (const must of ['127 rounds to 130', '127 rounds to 100', 'Halfway between 120 and 130 is <b>125</b>', 'Halfway between 100 and 200 is <b>150</b>',
    '896 rounds to 900', '<b>995</b> rounds to <b>1,000</b>', '<b>950</b> rounds to <b>1,000</b>', '235 through 244', '315 rounds to <b>320</b>', '$15 + $22 + $12 = <b>$49</b>', '<b>$1</b> left']) {
    assert.ok(html.includes(must), 'Learn shows: ' + must);
  }
  for (let seed = 1; seed <= 400; seed++) {
    const r = pv.rng(seed);
    const qs = steps.map((s) => s.check(r));
    for (const q of qs) {
      assert.ok(Q.grade(q, Q.correctResponse(q)), `${q.id} seed ${seed}: correct response grades right`);
      assert.ok(!Q.grade(q, Q.emptyResponse(q)), `${q.id}: blank is wrong`);
    }
    const n1 = Number(qs[0].display.replace(/,/g, ''));
    assert.ok(n1 !== 127 && n1 % 10 !== 0, 'step 1 uses a new number that is not a multiple of 10');
    assert.deepEqual(qs[0].parts.map((p) => p.answer), [pv.roundEnds(n1, 10).lo, pv.roundEnds(n1, 10).mid, pv.roundEnds(n1, 10).hi, pv.roundTo(n1, 10)]);
    const n2 = Number(qs[1].display.replace(/,/g, ''));
    assert.ok(n2 !== 127 && n2 % 100 > 50 && pv.roundTo(n2, 100) === pv.roundEnds(n2, 100).hi, 'step 2: upper side of halfway');
    assert.equal(qs[2].parts.length, 2, 'step 3 checks both places');
    assert.deepEqual(qs[3].parts.map((p) => p.kind), ['num', 'round', 'choice'], 'step 4: place, original number, halfway rule');
    assert.deepEqual(qs[4].parts.map((p) => p.kind), ['multi', 'choice'], 'step 5: select all + conclusion');
    const m = qs[4].parts[0];
    assert.ok(m.answer.length > 0 && m.answer.length < m.choices.length);
    const money = qs[4].parts[1];
    const [a, b] = money.label.match(/\$(\d+) and \$(\d+)/).slice(1).map(Number);
    const est = pv.roundTo(a, 10) + pv.roundTo(b, 10);
    assert.ok(money.answer.startsWith(a + b <= est ? 'Yes. The exact total' : 'No. The exact total'), 'step 5 conclusion follows the exact total');
  }
});

test('Practice and Test: 12 each, matching coverage, different numbers, every authored answer hand-checked', () => {
  const P = L.guided;
  const T = L.tests.rounding.generate(1);
  assert.equal(P.length, 12);
  assert.equal(T.length, 12);
  assert.deepEqual(P.map((q) => q.skill), T.map((q) => q.skill), 'item-for-item coverage');
  assert.deepEqual(P.map((q) => q.skill), ['line10', 'line10', 'pv10', 'pv10', 'line100', 'line100', 'compare', 'reverse', 'explain100', 'halfway', 'select', 'money']);
  assert.ok(T.every((q) => !q.hint && !q.parent), 'no hints on the test');
  assert.ok(P.every((q) => q.hint && q.explanation), 'practice has hints and explanations');
  // Hand-verified answers.
  const ans = (q) => (q.type === 'parts' ? q.parts.map((p) => (p.kind === 'round' ? pv.roundRange(p.target, p.place).join('–') : p.kind === 'choice' ? p.answer.split('.')[0] : p.answer)) : q.answer);
  const want = {
    p1: [360, 365, 370, 360], p2: [390, 395, 400, 400], p3: 60, p4: 490, p5: [400, 450, 500, 400], p6: [600, 650, 700, 700],
    p7: [250, 200, 'Nearest ten looks at the ones digit (9), so it rounds up'], p8: ['375–384'], p9: [500, 550, 600, '561 is more than the halfway point, 550, so it is closer to 600'],
    p10: ['No', 700], p11: [['251 crayons', '300 crayons', '342 crayons']], p12: [40, 49, 'No'],
    t1: [580, 585, 590, 580], t2: [290, 295, 300, 300], t3: 620, t4: 740, t5: [300, 350, 400, 300], t6: [700, 750, 800, 800],
    t7: [350, 300, 'Nearest ten looks at the ones digit (7), so it rounds up'], t8: ['515–524'], t9: [800, 850, 900, '849 is less than the halfway point, 850, so it is closer to 800'],
    t10: ['No', 90], t11: [['450 pages', '482 pages', '500 pages', '538 pages']], t12: [60, 57, 'Yes']
  };
  for (const q of P.concat(T)) assert.deepEqual(ans(q), want[q.id], q.id);
  // The shopping explanations: estimate vs exact.
  assert.match(P[11].explanation, /Estimate: \$10 \+ \$20 \+ \$10 = \$40\. Exact: \$14 \+ \$23 \+ \$12 = \$49\. \$49 is more than \$45/);
  assert.match(T[11].explanation, /Estimate: \$30 \+ \$20 \+ \$10 = \$60\. Exact: \$27 \+ \$16 \+ \$14 = \$57\. .*with \$3 left/);
  // Halfway and exact-multiple coverage.
  assert.ok(P.some((q) => q.id === 'p4') && /5 is 5 or more/.test(P[3].explanation), 'practice halfway (485)');
  assert.ok(T[10].parts[0].answer.includes('450 pages') && T[10].parts[0].answer.includes('500 pages'), 'test: halfway 450 and exact 500');
  // Different numbers between Practice and Test.
  const nums = (q) => (q.prompt.match(/\d[\d,]*/g) || []).join();
  P.forEach((q, i) => assert.notEqual(nums(q), nums(T[i]), `item ${i + 1} uses different numbers`));
  // Every item: correct response grades right; the harness-style wrong response grades wrong; explanations exist.
  for (const q of P.concat(T)) {
    assert.ok(Q.grade(q, Q.correctResponse(q)), q.id + ' correct');
    assert.ok(!Q.grade(q, Q.emptyResponse(q)), q.id + ' blank');
    if (q.type === 'parts') q.parts.forEach((p) => { if (p.choices) assert.equal(new Set(p.choices).size, p.choices.length, q.id + ' unique choices'); if (p.kind === 'choice') assert.ok(p.choices.includes(p.answer)); });
  }
});

test('Lesson 2-2 is separate from 2-1 and complete', () => {
  assert.equal(L.storageKey, 'mathbook:v2:lesson-2-2');
  assert.ok(L.parentLearn && L.parentLearn.checklist.length === 5 && L.parentLearn.words.length === 6);
  assert.deepEqual(L.parentLearn.words.map((w) => w.term), ['Round', 'Nearest', 'Multiple of 10 / 100', 'Halfway point', 'Estimate', 'Exact']);
  assert.ok(L.bankSets[0].ids.length === 12 && L.bankSets[0].ids.every((id) => L.bank.some((q) => q.id === id)));
  for (const q of L.guided.concat(L.tests.rounding.generate(2))) assert.ok(L.skills[q.skill], 'skill named: ' + q.skill);
  // The test is reproducible for a saved seed, and choice order varies between attempts.
  assert.deepEqual(L.tests.rounding.generate(9), L.tests.rounding.generate(9));
});
