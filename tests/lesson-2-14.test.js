// Unit tests for Lesson 2-14 (Fluently Add Multi-Digit Numbers): the hand-checked answer key from docs/chapter-2/lessons/2-14.md
// §6–§8 and §12, error-analysis Yes/No cases (D-2), partial-sum rows shown without the total (D-3), the running-total chain
// (D-4, Decision 9), and the Learn generator rules. Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-14/lesson.js');

const { pv } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-14'];
const sum = (q) => q.rows.reduce((x, y) => x + y, 0);
/** The key of a question: vcalc digits → the sum; vcalc rows → partials + total; parts → each answer ('Yes'/'No' for agree). */
function keyOf(q) {
  if (q.type === 'vcalc') return q.input === 'rows' ? L._partialsOf(q.rows[0], q.rows[1]).concat(sum(q)) : [sum(q)];
  return q.parts.map((p) => (p.kind === 'choice' && /^(Yes|No)\./.test(p.answer) ? p.answer.slice(0, p.answer.indexOf('.')) : p.answer));
}

const GUIDED = {
  p1: [924], p2: [3566], p3: [8254], p4: [17619], p5: ['Yes', 2903], p6: [722], p6b: ['Yes'], p7: ['3,640 + 1,285 = ?', 4925],
  p8: [800, 100, 12, 912], p9: [8612], p10: [3, 50], p11: [['1,465', '2,738'], 4203], p12: [369, 487], p13: ['Yes', 10912], p14: ['No', 4795]
};
const PRACTICE = {
  o1: [852], o2: [4756], o3: [8243], o4: [36777], o5: ['Yes', 3937], o6: [811], o6b: ['Yes'], o7: ['2,748 + 1,165 = ?', 3913],
  o8: [700, 100, 12, 812], o9: [6815], o10: [3, 100], o11: [['3,276', '1,858'], 5134], o12: [376, 492], o13: ['Yes', 11222], o14: ['No', 3096]
};
const TEST = {
  t1: [[946], 'alg3'], t2: [[4858], 'left'], t3: [[8242], 'alg4'], t4: [[27777], 'big'], t5: [['No', 3793], 'error'], t6: [[834], 'another'], t6b: [['Yes'], 'another'],
  t7: [['2,365 + 1,470 = ?', 3835], 'fewer'], t8: [[800, 100, 14, 914], 'partial'], t9: [[7842], 'across'], t10: [[3, 150], 'packs'],
  t11: [[['2,586', '1,947'], 4533], 'useful'], t12: [[366, 493], 'twostep'], t13: [['Yes', 10371], 'both']
};
const norm = (k) => k.map((x) => (Array.isArray(x) ? x.slice().sort() : x));

test('Practice Together and On My Own match the hand-checked key', () => {
  const g = L.guided.filter((q) => q.type !== 'explain');
  assert.deepEqual(g.map((q) => q.id), Object.keys(GUIDED));
  for (const q of g) assert.deepEqual(norm(keyOf(q)), norm(GUIDED[q.id]), q.id);
  assert.ok(L.guided.some((q) => q.type === 'explain' && q.parent), 'parent-marked explain item');
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(norm(keyOf(q)), norm(PRACTICE[q.id]), q.id);
});

test('Adding Test matches the key and skills; choices shuffle; no hints', () => {
  const T = L.tests.adding;
  assert.equal(T.questions, Object.keys(TEST).length);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual(norm(keyOf(q)), norm(TEST[q.id][0]), q.id); assert.equal(q.skill, TEST[q.id][1]); assert.ok(!q.hint && !q.parent); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => L.tests.adding.generate(s)[4].parts[0].choices.join('|'))).size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('D-2: both error cases are practised; parts are checked against the addend', () => {
  const all = L.guided.concat(L.bank, L._testItems).filter((q) => q.skill === 'error');
  for (const q of all) {
    const m = q.prompt.match(/adds ([\d,]+) \+ ([\d,]+)\. \w+ adds ([\d, then]+)\./);
    const b = Number(m[2].replace(/,/g, '')), split = m[3].split(', then ').map((t) => Number(t.replace(/,/g, '')));
    const good = split.reduce((x, y) => x + y, 0) === b;
    assert.equal(q.parts[0].answer.startsWith('Yes'), good, q.id);
    assert.equal(new Set(q.parts[0].choices).size, q.parts[0].choices.length, q.id);
  }
  for (const set of [L.guided, L.bank]) { const ans = set.filter((q) => q.skill === 'error').map((q) => q.parts[0].answer.slice(0, 2)); assert.ok(ans.includes('Ye') && ans.includes('No')); }
});

test('D-3: "another way" shows the partial rows but never the total', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.skill === 'another' && x.type === 'vcalc')) {
    assert.equal(q.figure.total, null, q.id);
    assert.deepEqual(q.figure.partials.map((p) => p.v), L._partialsOf(q.rows[0], q.rows[1]), q.id);
    assert.ok(!L._leaks(q), q.id);
  }
});

test('explanations: every "x + y = s" and "x − y = s" is right', () => {
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
    // Step 1: 4 rows, b has four non-zero digits, each row after the first echoes the child's own entry; final exact.
    assert.equal(s1.rows.length, 4); assert.ok(s1.rows.every((r, k) => r.true && (k === 0 || r.cells[0].echo === `r${k - 1}`)));
    const a1 = s1.rows[0].cells[0], b1 = s1.rows.reduce((x, r) => x + r.cells[2], 0);
    assert.ok(a1 >= 1000 && b1 >= 1111 && s1.final.answer === a1 + b1 && a1 + b1 <= 9999, 'step 1');
    // Step 2: 4-digit addends, a regrouping place, sum ≤ 9,999.
    assert.ok(s2.input === 'rows' && sum(s2) <= 9999 && L._partialsOf(s2.rows[0], s2.rows[1]).some((p, i, P) => String(p).length > String(10 ** (P.length - 1 - i)).length), 'step 2');
    // Step 3: 1–2 regroupings, sum ≤ 9,999.
    assert.ok(s3.input === 'digits' && s3.carries && sum(s3) <= 9999, 'step 3');
    // Step 4: one of the three size cases.
    const [a4, b4] = s4.rows, t4 = a4 + b4;
    const k = b4 < 1000 ? 0 : a4 >= 10000 ? 2 : 1;
    assert.ok(k === 0 ? t4 <= 9999 : k === 1 ? t4 >= 10000 && t4 <= 18000 : t4 <= 39999, `step 4 ${a4} + ${b4}`);
    kinds[k] = 1; kinds['s5' + s5.skill] = 1;
  }
  assert.deepEqual(Object.keys(kinds).sort(), ['0', '1', '2', 's5fewer', 's5useful']);
});

test('review fixes L214-02, L214-04', () => {
  // L214-02: "fewer than" never uses two equal numbers (the choices would repeat).
  for (let seed = 1; seed <= 3000; seed++) {
    const q = L.seeIt.steps[4].check(pv.rng(seed));
    for (const p of q.parts) if (p.choices) assert.equal(new Set(p.choices).size, p.choices.length, `seed ${seed}`);
  }
  // L214-04: Learn 5 teaches packs and "more than both together" before they are practised and tested.
  const slides = L.seeIt.steps[4].slides.join(' ');
  assert.match(slides, /Packs:.*Buy <b>3 packs<\/b>/);
  assert.match(slides, /Two steps:.*Step 1: together, 132 \+ 215 = <b>347<\/b>\. Step 2: use 347\. Wednesday: 347 \+ 104 = <b>451<\/b>/);
});
