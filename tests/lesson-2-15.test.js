// Unit tests for Lesson 2-15 (Use an Algorithm to Subtract): the hand-checked answer key from docs/chapter-2/lessons/2-15.md
// §6–§8 and §12, regroup-free numbers everywhere (Decision 18), missing digits with one unknown per column, the
// check-with-addition choices that never show the difference, and the Learn generator rules (D-11).
// Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-15/lesson.js');

const { pv } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-15'];
const LINE = /lined up the left digits/;
const dig = (n, p) => Math.floor(n / 10 ** p) % 10;
const KEYS = ['O', 'T', 'H', 'Th', 'TTh'];
/** vcalc → the difference, or the hidden digits (top/bottom/result, by place); parts → each answer. */
function keyOf(q) {
  if (q.type === 'vcalc') {
    const [a, b] = q.rows;
    if (!q.blanks) return [a - b];
    const out = {};
    for (const [row, n] of [['top', a], ['bottom', b], ['result', a - b]]) for (const k of q.blanks[row] || []) out[row + ':' + k] = dig(n, KEYS.indexOf(k));
    return [out];
  }
  return q.parts.map((p) => (p.kind === 'choice' && LINE.test(p.answer) ? 'left' : p.answer));
}

const GUIDED = {
  p1: [444], p2: [432], p3: [6342], p4: [3232], p5: [3335], p6: [5442], p7: [5040], p8: [22245],
  p9: ['2,496 − 274 = ?', 2222], p10: ['3,876 − 1,352 = ?', 2524], p11: [{ 'top:T': 5, 'bottom:H': 2, 'bottom:O': 3, 'result:Th': 2 }],
  p12: [2212, 2221, 'Year 2 to Year 3'], p13: [3635], p14: ['left', 4346]
};
const PRACTICE = {
  o1: [643], o2: [422], o3: [4423], o4: [9223], o5: [3243], o6: [3331], o7: [3050], o8: [44312],
  o9: ['3,785 − 562 = ?', 3223], o10: ['5,896 − 2,473 = ?', 3423], o11: [{ 'top:H': 9, 'bottom:Th': 3, 'bottom:T': 1, 'result:O': 5 }],
  o12: [2222, 2211, 'Year 1 to Year 2'], o13: [3335], o14: ['left', 5635]
};
const TEST = {
  t1: [[433], 'sub3'], t2: [[451], 'sub3'], t3: [[5423], 'sub43'], t4: [[7332], 'sub43'], t5: [[3427], 'sub44'], t6: [[5243], 'sub44'], t7: [[5030], 'zeros'],
  t8: [[33354], 'sub5'], t9: [['1,598 − 476 = ?', 1122], 'left'], t10: [['4,968 − 1,725 = ?', 3243], 'part'],
  t11: [[{ 'top:Th': 5, 'bottom:H': 4, 'bottom:O': 2, 'result:T': 3 }], 'missing'], t12: [[2253, 2232, 'Year 1 to Year 2'], 'increase'],
  t13: [[3334], 'together'], t14: [['left', 7324], 'lineup']
};
/** Every pair of numbers a lesson question subtracts. */
function pairsOf(q) {
  if (q.type === 'vcalc') return [q.rows];
  if (q.skill === 'increase') { const v = q.figure.rows.map((r) => r[1]); return [[v[1], v[0]], [v[2], v[1]]]; }
  if (q.skill === 'lineup') return [q.figure.rows];
  const m = String(q.parts[0].answer).match(/^([\d,]+) − ([\d,]+) = \?$/) || q.prompt.match(/^([\d,]+) − ([\d,]+) = \?$/);
  return m ? [[m[1], m[2]].map((t) => Number(t.replace(/,/g, '')))] : [];
}

test('Practice Together and On My Own match the hand-checked key', () => {
  const g = L.guided.filter((q) => q.type !== 'explain');
  assert.deepEqual(g.map((q) => q.id), Object.keys(GUIDED));
  for (const q of g) assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.ok(L.guided.some((q) => q.type === 'explain' && q.parent), 'parent-marked explain item');
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Subtracting Test matches the key and skills; choices shuffle (years stay in order); no hints', () => {
  const T = L.tests.subtract;
  assert.equal(T.questions, 14);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual(keyOf(q), TEST[q.id][0], q.id); assert.equal(q.skill, TEST[q.id][1]); assert.ok(!q.hint && !q.parent); }
    assert.deepEqual(items[11].parts[2].choices, ['Year 1 to Year 2', 'Year 2 to Year 3']);
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[13].parts[0].choices.join('|'))).size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('Decision 18: every subtraction is regroup-free; missing digits have one unknown per column', () => {
  const all = L.guided.concat(L.bank, L._testItems).filter((q) => q.type !== 'explain');
  for (let seed = 1; seed <= 500; seed++) for (const s of L.seeIt.steps) all.push(s.check(pv.rng(seed)));
  for (const q of all) {
    const ps = pairsOf(q);
    assert.ok(ps.length, q.id + ' has a subtraction');
    for (const [a, b] of ps) assert.ok(L._regroupFree(a, b), `${q.id}: ${a} − ${b}`);
    if (q.blanks) {
      const cols = ['top', 'bottom', 'result'].flatMap((r) => q.blanks[r] || []);
      assert.equal(cols.length, 4, q.id); assert.equal(new Set(cols).size, 4, q.id + ' one unknown per column');
      assert.equal(q.blanks.top.length, 1); assert.equal(q.blanks.bottom.length, 2); assert.equal(q.blanks.result.length, 1);
      assert.ok(dig(q.rows[0], 3) > dig(q.rows[1], 3), q.id + ' D-11 leading place never 0');
    }
  }
});

test('increase items: the increases differ; the choices compare increases, not totals', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.skill === 'increase')) assert.notEqual(q.parts[0].answer, q.parts[1].answer, q.id);
});

test('explanations: every "x − y = s" and "x + y = s" is right', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type !== 'explain')) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) assert.equal(m[1].split(' + ').reduce((s, t) => s + Number(t.replace(/,/g, '')), 0), Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    for (const m of q.explanation.matchAll(/(?<![\d,] − )([\d,]+) − ([\d,]+) = ([\d,]+)/g)) assert.equal(Number(m[1].replace(/,/g, '')) - Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, '')), `${q.id}: ${m[0]}`);
  }
});

test('Learn generators follow the spec and never print an answer', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  const kinds = {};
  for (let seed = 1; seed <= 2000; seed++) {
    const [s1, s2, s3, s4, s5] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    for (const q of [s1, s2, s3, s4, s5]) assert.ok(!L._leaks(q), `${q.id} ${seed}`);
    const zeros = (d) => String(d).slice(1).split('').filter((c) => c === '0').length;
    // Step 1: 4-digit − 4-digit, top thousands > bottom thousands, at most one 0 in the difference.
    const [a1, b1] = s1.rows; assert.ok(a1 >= 1000 && b1 >= 1000 && dig(a1, 3) > dig(b1, 3) && zeros(a1 - b1) <= 1, `step 1 ${a1} − ${b1}`);
    // Step 2: 4 − 3, 4 − 4 with one or two 0s (leading place never 0), or 5 − 4.
    const [a2, b2] = s2.rows, d2 = a2 - b2;
    if (s2.skill === 'sub43') assert.ok(a2 >= 1000 && a2 <= 9999 && b2 >= 100 && b2 <= 999);
    else if (s2.skill === 'zeros') assert.ok(b2 >= 1000 && d2 >= 1000 && zeros(d2) >= 1 && zeros(d2) <= 2, `zeros ${a2} − ${b2}`);
    else assert.ok(a2 >= 10000 && a2 <= 99999 && b2 >= 1000 && b2 <= 9999);
    kinds[s2.skill] = 1; kinds[s5.skill] = 1;
    // Step 3: the check choices never show the difference.
    assert.ok(s3.parts[1].choices.every((c) => !c.includes(pv.fmt(s3.parts[0].answer))), 'step 3');
    assert.equal(s4.skill, 'missing');
  }
  assert.deepEqual(Object.keys(kinds).sort(), ['left', 'part', 'sub43', 'sub5', 'zeros']);
});

test('line-up items: the picture does not say what went wrong', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.skill === 'lineup')) {
    const h = globalThis.Mathbook.fig.html(q.figure);
    assert.doesNotMatch(h, /line up|lined up|don.t line/i, q.id);
  }
});

test('review fixes L215-01…03', () => {
  // L215-01: the p6 hint does not give a digit of the answer.
  assert.ok(!/= 4/.test(L.guided.find((q) => q.id === 'p6').hint));
  // L215-02: an empty missing-digit box is named.
  const Q = globalThis.Mathbook.Q, q = L.guided.find((x) => x.id === 'p11');
  const r = { b: { 'b:top:T': '5', 'b:bottom:H': '2', 'b:bottom:O': '', 'b:result:Th': '2' } };
  assert.equal(Q.emptyTip(q, r), 'Write the missing ones digit of the bottom number.');
  // L215-03: the authored missing-digit items do not always hide the answer's thousands digit.
  const res = L.guided.concat(L.bank, L._testItems).filter((x) => x.blanks).map((x) => x.blanks.result[0]);
  assert.ok(new Set(res).size >= 3, res.join(','));
});
