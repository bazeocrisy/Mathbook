// Unit tests for Lesson 2-11 (Fluently Subtract within 1,000): the hand-checked answer key from
// docs/chapter-2/lessons/2-11.md §6–§8 and §12, keep-the-difference pairs (shared adjust, op '−'), and the Learn
// generator rules (C-10). Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-11/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-11'];
const sortA = (x) => (Array.isArray(x) ? x.slice().sort() : x);
const keyOf = (q) => (q.type === 'chain' ? ['adjust', q.a, q.b, q.a - q.b, Q.correctResponse(q).v.na, Q.correctResponse(q).v.nb] : q.parts.map((p) => sortA(p.answer)));
const BOTH = 'Both work. They get the same answer.';
const BACK = (b, a) => `No. Decompose ${b} and take its parts away from ${a}.`;

const GUIDED = {
  p1: [475, 435, 432], p2: [463, 443, 440, 438], p3: ['adjust', 623, 198, 425, '625', '200'], p4: ['256 + ? = 731', 475],
  p5: [['655 − 120', '652 − 100 − 10 − 7', '117 + ? = 652'], 535], p6: [BOTH, 35], p7: [BACK(124, 358), 234], p8: [153], p9: [218],
  p10: ['125', 188], p11: [119, 'Yes'], p12: [252], p13: [85]
};
const PRACTICE = {
  o1: [444], o2: [356], o3: [59], o4: [74], o5: [257], o6: [BOTH, 33], o7: ['115', 123], o8: [143], o9: [442], o10: [268],
  o11: [BACK(152, 476), 324], o12: [85, 'No'], o13: [457, 437, 434], o14: ['adjust', 721, 396, 325, '725', '400'], o15: ['278 + ? = 634', 356], o16: ['No. You can also decompose 218 or adjust both numbers.', 316]
};
const TEST = {
  t1: [[484, 434, 433], 'decompose'], t2: [['adjust', 532, 297, 235, '535', '300'], 'adjust'], t3: [['365 + ? = 812', 447], 'related'],
  t4: [[79], 'subtract'], t5: [[274], 'subtract'], t6: [[157], 'apply'], t7: [[['745 − 130', '743 − 100 − 20 − 8', '128 + ? = 743'], 615], 'strategy'],
  t8: [[BACK(235, 569), 334], 'strategy'], t9: [[255], 'apply'], t10: [['98', 187], 'apply'], t11: [[117, 'Yes'], 'apply'],
  t12: [['No. You can also adjust both numbers or count up.', 317], 'strategy']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('p14'));
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id].map(sortA), q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id].map(sortA), q.id);
});

test('Fluently Subtract Test matches the key (T1–T12) and skills; choices shuffle; no hints', () => {
  const T = L.tests.subtract;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual([keyOf(q), q.skill], [TEST[q.id][0].map(sortA), TEST[q.id][1]], q.id); assert.ok(!q.hint && !q.parent); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[11].parts[0].choices.join('|'))).size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('keep-the-difference pairs: both the same way (up or down); opposite ways rejected; difference exact', () => {
  const q = L.guided.find((x) => x.id === 'p3'); // 623 − 198
  const A = (na, nb, r) => ({ v: { na: String(na), nb: String(nb), r: String(r) }, t: [] });
  assert.ok(Q.grade(q, A(625, 200, 425)));
  assert.ok(Q.grade(q, A(613, 188, 425)), 'taking the same amount from both is also right');
  assert.ok(!Q.grade(q, A(621, 200, 421)), 'opposite ways (the addition rule) is wrong');
  assert.match(Q.check(q, A(621, 200, 421)).msg, /opposite ways\. In subtracting, change both the same way/);
  assert.ok(!Q.grade(q, A(623, 198, 425)), 'no change');
});

test('explanations: every "x + y = s" and "x − y = s" is right', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type !== 'explain')) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) assert.equal(m[1].split(' + ').reduce((s, t) => s + Number(t.replace(/,/g, '')), 0), Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    for (const m of q.explanation.matchAll(/(?<![\d,] − )([\d,]+) − ([\d,]+) = ([\d,]+)/g)) assert.equal(Number(m[1].replace(/,/g, '')) - Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, '')), `${q.id}: ${m[0]}`);
  }
});

test('Learn generators follow the spec and never print an answer', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 2000; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
  let cross = 0;
  for (let seed = 1; seed <= 600; seed++) {
    const [s1, s2, s3, s4, s5] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    const [a, b] = s1.prompt.match(/([\d,]+) − ([\d,]+)/).slice(1).map(Number);
    assert.ok(a >= 400 && a <= 989 && b >= 111 && a - b >= 100 && b % 10 && Math.floor(b / 10) % 10, 'step 1');
    if (b % 10 > a % 10) cross++;
    assert.ok(s2.a >= 300 && s2.a <= 990 && s2.b % 10 >= 6 && s2.a - s2.b >= 40 && s2.a + (10 - (s2.b % 10)) <= 999, 'step 2 (C-10)');
    assert.equal(Q.correctResponse(s2).v.nb, String(s2.b + 10 - (s2.b % 10)), 'step 2 shows b as the next ten');
    assert.ok(s3.parts[1].answer >= 50);
    assert.equal(s4.parts[0].answer.length, 3);
    const left = s5.parts[1].answer; assert.ok(left >= 20 && left <= 200 && left !== 100 && s5.parts[2].answer === (left > 100 ? 'Yes' : 'No'));
  }
  assert.ok(cross > 200 && cross < 400, `about half cross a ten (${cross}/600)`);
});

test('review fixes L211-01, 02, 04', () => {
  const T = L.tests.subtract;
  const firsts = new Set(); for (let s = 1; s <= 40; s++) firsts.add(T.generate(s).find((q) => q.id === 't10').parts[0].choices[0]);
  assert.ok(firsts.size > 1, 'T10 choices are shuffled');
  const t12 = L._testItems.find((q) => q.id === 't12').parts[0].choices.map((c) => c.length);
  assert.ok(Math.max(...t12) - Math.min(...t12) <= 12, 'T12 choices are alike in length');
  const p4 = L.guided.find((q) => q.id === 'p4');
  assert.match(Q.tip(p4, [p4.parts[0].choices.find((c) => c !== p4.parts[0].answer), '475']), /related to 731 − 256 = ?./);
});
