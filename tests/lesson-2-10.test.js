// Unit tests for Lesson 2-10 (Fluently Add within 1,000): the hand-checked answer key from docs/chapter-2/lessons/2-10.md
// §6–§8 and §12, the keep-the-sum pairs (shared adjust control), and the Learn generator rules (C-7, C-8).
// Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-10/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-10'];
const keyOf = (q) => (q.type === 'chain' ? ['adjust', q.a, q.b, q.a + q.b] : q.type === 'vcalc' ? ['column'].concat(Q.correctResponse(q).p, Q.correctResponse(q).s).map((x) => (x === 'column' ? x : pv.parseWholeNumber(x))) : q.parts.map((p) => (Array.isArray(p.answer) ? p.answer.slice().sort() : p.answer)));
const YES = (p, k) => `Yes. ${p} added ${k} extra, so ${p.toLowerCase()} takes ${k} away.`;
const BOTH = 'Yes. Both strategies work and give the same sum.';

const GUIDED = {
  p1: [700, 80, 7, 787], p2: [783], p3: ['column', 700, 140, 12, 852], p4: ['adjust', 299, 456, 755], p5: [BOTH, 784], p6: [YES('He', 4), 913],
  p7: [['300 + 400 + 50 + 70 + 6 + 1', '355 + 472'], 827], p8: [496], p9: [3, 750], p10: ['500', 693], p11: [337, 483]
};
const PRACTICE = {
  o1: [888], o2: [675], o3: [793], o4: [899], o5: ['No. He added 2 extra, so he must take 2 away.', 903],
  o6: [['200 + 500 + 60 + 10 + 3 + 8', '261 + 520'], 781], o7: [684], o8: [625], o9: [823], o10: [4, 600], o11: ['600', 745], o12: [377, 495],
  o13: ['column', 700, 120, 14, 834], o14: ['adjust', 197, 548, 745]
};
const TEST = {
  t1: [[788], 'add'], t2: [[875], 'add'], t3: [[823], 'add'], t4: [['column', 700, 110, 12, 822], 'partial'], t5: [['adjust', 398, 267, 665], 'adjust'],
  t6: [[YES('She', 1), 726], 'strategy'], t7: [[['400 + 300 + 20 + 50 + 7 + 2', '430 + 349'], 779], 'strategy'], t8: [[BOTH, 613], 'strategy'],
  t9: [[574], 'apply'], t10: [[3, 900], 'apply'], t11: [['400', 812], 'apply'], t12: [[385, 512], 'apply']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('p12'));
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id].map((x) => (Array.isArray(x) ? x.slice().sort() : x)), q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id].map((x) => (Array.isArray(x) ? x.slice().sort() : x)), q.id);
});

test('Fluently Add Test matches the key (T1–T12) and skills; choices shuffle; no hints', () => {
  const T = L.tests.add;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual([keyOf(q), q.skill], [TEST[q.id][0].map((x) => (Array.isArray(x) ? x.slice().sort() : x)), TEST[q.id][1]], q.id); assert.ok(!q.hint && !q.parent); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[6].parts[0].choices.join('|'))).size > 1);
});

test('every test skill has On My Own practice; the book\'s example numbers are not reused in practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('keep-the-sum pairs: any adjustment that keeps the sum; swaps and no change rejected; the sum exact', () => {
  const q = L.guided.find((x) => x.id === 'p4'); // 299 + 456
  const A = (na, nb, r) => ({ v: { na: String(na), nb: String(nb), r: String(r) }, t: [] });
  assert.ok(Q.grade(q, A(300, 455, 755)));
  assert.ok(Q.grade(q, A(305, 450, 755)), 'any valid adjustment');
  assert.ok(!Q.grade(q, A(456, 299, 755)), 'a swap is not an adjustment');
  assert.ok(!Q.grade(q, A(299, 456, 755)), 'no change');
  assert.ok(!Q.grade(q, A(301, 457, 758)), 'both up changes the sum');
  assert.ok(!Q.grade(q, A(300, 455, 754)));
  assert.equal(Q.correctResponse(q).v.na, '300', 'the shown answer rounds 299');
});

test('explanations: every "x + y (+ z) = s" and "x − y = s" is right', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type !== 'explain')) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) {
      assert.equal(m[1].split(' + ').reduce((s, t) => s + Number(t.replace(/,/g, '')), 0), Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    }
    for (const m of q.explanation.matchAll(/([\d,]+) − ([\d,]+) = ([\d,]+)/g)) assert.equal(Number(m[1].replace(/,/g, '')) - Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, '')), `${q.id}: ${m[0]}`);
  }
});

test('Learn generators follow the spec and never print an answer', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 2000; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
  for (let seed = 1; seed <= 600; seed++) {
    const [s1, s2, s3, s4, s5] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    const [h1, t1, o1] = s1.parts.map((p) => p.answer);
    assert.ok(t1 < 100 && o1 >= 10 && s1.parts[3].answer <= 999, 'step 1: tens under 100, ones 10 or more (C-8)');
    { const p = Q.correctResponse(s2).p.map(pv.parseWholeNumber); assert.ok(s2.type === 'vcalc' && p[1] >= 100 && s2.rows[0] + s2.rows[1] <= 999, 'step 2: tens 100 or more, in the stacked control'); }
    assert.ok(s3.a + s3.b <= 999 && (s3.b % 10 >= 7 || s3.b % 100 >= 98));
    const m = s4.prompt.match(/adds ([\d,]+) \+ ([\d,]+)\. \w+ adds (\d) to/);
    const [a, b, k] = m.slice(1).map(Number);
    assert.ok(a + b + 2 * k <= 999 && k >= 1 && k <= 3, 'step 4 (C-7)');
    assert.ok(s5.parts[1].answer <= 999 && Number(s5.parts[0].answer) % 50 === 0);
  }
});

test('review fixes: packs items print no answer (L210-01); column items use the stacked control (L210-02)', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.parts && /should .* buy/.test(x.prompt))) {
    const text = q.prompt + ' ' + q.parts.map((p) => p.label).join(' ');
    for (const p of q.parts) assert.ok(!(text.match(/\d[\d,]*/g) || []).map((s) => Number(s.replace(/,/g, ''))).includes(p.answer), `${q.id}: ${p.answer} not printed`);
    assert.ok(!q.parts.some((p) => p.fromStory), `${q.id}: no exemption`);
  }
  for (const id of ['p3', 'o13', 't4']) assert.equal(L.guided.concat(L.bank, L._testItems).find((q) => q.id === id).type, 'vcalc', id);
});
