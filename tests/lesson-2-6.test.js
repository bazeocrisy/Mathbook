// Unit tests for Lesson 2-6 (Use Partial Sums to Add): the hand-checked answer key from docs/chapter-2/lessons/2-6.md
// §6–§8 and §12, the grading of the shared partial-sum controls as this lesson uses them (row = chain preset 'rows',
// stacked = vcalc input 'rows', reverse = anyOrder parts), the F11 equation-lines figure, and the Learn generator rules.
// Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-6/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-6'];

/** The numbers the child must produce: [partial sums…, sum] for a model; part answers for parts. */
function keyOf(q) {
  if (q.type === 'chain') { const v = Q.correctResponse(q).v; return [v.s2, v.s1, v.s0, v.S].map(pv.parseWholeNumber); }
  if (q.type === 'vcalc') { const r = Q.correctResponse(q); return r.p.concat(r.s).map(pv.parseWholeNumber); }
  return q.parts.map((p) => p.answer);
}
const mode = (q) => (q.type === 'chain' ? 'row' : q.type === 'vcalc' ? 'stack' : 'parts');

// Hand-written key (spec §6–§8, §12).
const GUIDED = {
  pt1: ['row', [500, 60, 14, 574]], pt2: ['stack', [500, 150, 12, 662]],
  pt3: ['parts', ['No. 700 is only the hundreds partial sum. She must add all three partial sums.', 745]],
  pt4: ['parts', [234, 451, 685]],
  pt5: ['parts', ['Take the first number from each line to build one addend, and the second number from each line to build the other.']],
  pt6: ['stack', [200, 140, 12, 352]], pt7: ['row', [600, 70, 9, 679]],
  pt9: ['parts', ['7 + 6 = 13, not 3. He must add the whole 13.', 383]]
};
const PRACTICE = {
  o1: ['row', [700, 70, 13, 783]], o2: ['stack', [800, 80, 13, 893]], o3: ['stack', [700, 70, 15, 785]], o4: ['row', [300, 110, 13, 423]],
  o5: ['parts', [413, 275, 688]],
  o6: ['parts', ['Build one addend from the first number in each line and the other addend from the second number in each line.']],
  o7: ['stack', [200, 160, 12, 372]], o8: ['stack', [500, 110, 7, 617]], o9: ['row', [500, 90, 9, 599]], o10: ['stack', [700, 120, 13, 833]],
  o11: ['parts', ['He added only the hundreds. He forgot the tens and ones partial sums.', 697]],
  o12: ['stack', [600, 70, 17, 687]],
  o13: ['parts', ['9 + 4 = 13, not 3. The ones partial sum is 13.', 483]]
};
const TEST = {
  t1: ['row', [800, 70, 14, 884], 'row'], t2: ['stack', [800, 80, 15, 895], 'stack'], t3: ['row', [500, 120, 9, 629], 'row'], t4: ['stack', [500, 120, 15, 635], 'stack'],
  t5: ['parts', [259, 630, 889], 'reverse'], t6: ['parts', ['174 + 528'], 'reverse'], t7: ['stack', [400, 120, 16, 536], 'word'],
  t8: ['row', [700, 100, 11, 811], 'convert'], t9: ['stack', [700, 130, 12, 842], 'word'],
  t10: ['parts', ['No. 800 is only the hundreds partial sum. She must add all three.', 824], 'error'],
  t11: ['parts', ['8 + 5 = 13, not 3. The ones partial sum is 13.', 703], 'error'],
  t12: ['stack', [700, 70, 17, 787], 'three'], t13: ['stack', [700, 130, 11, 841], 'convert']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), ['pt1', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'pt7', 'pt8', 'pt9']);
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual([mode(q), keyOf(q)], GUIDED[q.id], q.id);
  assert.equal(L.guided.find((q) => q.id === 'pt8').type, 'explain');
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual([mode(q), keyOf(q)], PRACTICE[q.id], q.id);
});

test('Partial Sums Test matches the key (T1–T13) and skills; choices shuffle per attempt; no hints', () => {
  const T = L.tests.partial;
  assert.equal(T.questions, 13);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual([mode(q), keyOf(q), q.skill], TEST[q.id], q.id);
      assert.ok(!q.hint && !q.parent, `${q.id}: no hint`);
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[5].parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('every on-screen sum in the spec is right (§12 by script)', () => {
  const all = L.guided.concat(L.bank, L._testItems).filter((q) => q.type !== 'explain');
  for (const q of all) {
    const adds = q.addends || q.rows;
    if (!adds) continue;
    const [h, t, o, s] = keyOf(q);
    assert.equal(h + t + o, s, `${q.id}: partial sums add to the sum`);
    assert.equal(s, adds.reduce((x, y) => x + y, 0), `${q.id}: the sum is right`);
  }
  // Error items: the wrong total shown really is the dropped-ten / hundreds-only mistake.
  assert.equal(300 + 70 + 3, 373); assert.equal(247 + 136, 383);
  assert.equal(400 + 70 + 3, 473); assert.equal(159 + 324, 483);
  assert.equal(600 + 90 + 3, 693); assert.equal(468 + 235, 703);
  // T6 distractors do not have these partial sums.
  const ps = (a, b) => [0, 1, 2].map((k) => [a, b].map((n) => Math.floor(n / [100, 10, 1][k]) % 10 * [100, 10, 1][k]).reduce((x, y) => x + y)).join(',');
  assert.equal(ps(174, 528), '600,90,12');
  ['154 + 728', '174 + 582', '167 + 528'].forEach((e) => { const [a, b] = e.split(' + ').map(Number); assert.notEqual(ps(a, b), '600,90,12', e); });
});

test('row mode: place values in either order within a line, values not digits, every partial and the sum', () => {
  const q = L.bank.find((x) => x.id === 'o1'); // 356 + 427
  const ok = Q.correctResponse(q);
  assert.ok(Q.grade(q, ok));
  const swapped = JSON.parse(JSON.stringify(ok)); [swapped.v.p2_0, swapped.v.p2_1] = [swapped.v.p2_1, swapped.v.p2_0];
  assert.ok(Q.grade(q, swapped), '400 + 300 is as right as 300 + 400');
  const digits = JSON.parse(JSON.stringify(ok)); digits.v.p2_0 = '3';
  assert.ok(!Q.grade(q, digits), 'a digit (3) is not the value (300)');
  const dropped = JSON.parse(JSON.stringify(ok)); dropped.v.s0 = '3';
  const c = Q.check(q, dropped);
  assert.ok(!c.ok && c.bad.includes('v:s0') && /ones line/.test(c.msg), 'a dropped ten is named by its line, never the answer');
  assert.ok(!/13/.test(c.msg));
});

test('stacked mode: each partial and the sum; typed labels (convert) accept either order', () => {
  const q = L.bank.find((x) => x.id === 'o8'); // 346 + 271, notes typed
  const ok = Q.correctResponse(q);
  assert.ok(Q.grade(q, ok));
  const rev = JSON.parse(JSON.stringify(ok)); rev.n[1] = '70 + 40';
  assert.ok(Q.grade(q, rev), '70 + 40 is as right as 40 + 70');
  const bad = JSON.parse(JSON.stringify(ok)); bad.n[0] = '3 + 2';
  assert.ok(!Q.grade(q, bad), 'digits are not place values');
  const noNotes = JSON.parse(JSON.stringify(ok)); noNotes.n = ['', '', ''];
  assert.ok(!Q.isAnswered(q, noNotes), 'the labels are required when the child writes them');
  const st = L.bank.find((x) => x.id === 'o2');
  const miss = JSON.parse(JSON.stringify(Q.correctResponse(st))); miss.s = '800';
  assert.ok(!Q.grade(st, miss), 'stopping at the hundreds is wrong');
});

test('reverse items accept the two addends in either order, but not a wrong sum', () => {
  const q = L.bank.find((x) => x.id === 'o5');
  assert.ok(Q.grade(q, ['413', '275', '688']));
  assert.ok(Q.grade(q, ['275', '413', '688']));
  assert.ok(!Q.grade(q, ['413', '413', '688']));
  assert.ok(!Q.grade(q, ['413', '275', '600']));
});

test('no question prints a number the child must type (outside the work shown)', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 200; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
});

test('conversion items show the other way without results (B-06)', () => {
  for (const id of ['o8', 'o9', 't8', 't13']) {
    const q = L.bank.concat(L._testItems).find((x) => x.id === id);
    const html = Q.render(q, 'k', {});
    const figure = html.slice(html.indexOf('<figure'), html.indexOf('</figure>'));
    assert.ok(figure.length > 50, `${id}: shows the other way`);
    assert.ok(!/vc-part|vc-total/.test(figure), `${id}: no partial sums or total drawn in a stack`);
    assert.ok(!/class="eq-r[^"]*">\d/.test(figure) && !/equals \d/.test(figure), `${id}: no result after = in the row work`);
  }
});

test('Learn: PS pairs follow the spec rules; every step works for many seeds', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const [a, b] = L._psPair(pv.rng(seed));
    assert.ok(a >= 101 && a <= 899 && b >= 101 && b <= 899 && a + b <= 999, `${a} + ${b}`);
    assert.ok((a % 10) + (b % 10) >= 10 || (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) >= 10, `${a} + ${b} regroups somewhere`);
    for (const n of [a, b]) assert.ok(String(n).split('').filter((d) => d === '0').length <= 1, `${n}: one 0 at most`);
    assert.ok(!L._demo.some(([x, y]) => (x === a && y === b) || (x === b && y === a)), 'not a demo pair');
  }
  const kinds = L.seeIt.steps.map((s) => s.check(pv.rng(3)).type);
  assert.deepEqual(kinds, ['parts', 'chain', 'vcalc', 'parts', 'parts', 'vcalc']);
  const d = L.seeIt.steps[0].check(pv.rng(9));
  const n = pv.parseWholeNumber(d.prompt.match(/[\d,]+/)[0]);
  assert.deepEqual(d.parts.map((p) => p.answer), [Math.floor(n / 100) * 100, Math.floor(n / 10) % 10 * 10, n % 10]);
});

test('F11 equation lines: one row per line, = lined up, blanks drawn as boxes, spoken label', () => {
  const html = globalThis.Mathbook.fig.html({ fig: 'eqs', lines: ['300 + 200 = ___', { text: '500 + 90 + 8 = 598', hi: true, tag: 'Sum' }] });
  assert.equal((html.match(/class="eq-eq"/g) || []).length, 2);
  assert.ok(html.includes('<span class="blank"></span>'));
  assert.ok(/aria-label="300 plus 200 equals blank\. 500 plus 90 plus 8 equals 598\."/.test(html), html);
  assert.ok(html.includes('has-tags') && html.includes('is-hi'));
});
