// Unit tests for Lesson 2-5 (Addition Patterns): the hand-checked answer key from docs/chapter-2/lessons/2-5.md
// §6–§8 and §12, the written-equation grading (chain preset 'free'), and the Learn generator rules.
// Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-5/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-5'];

const keyOf = (q) => (q.type === 'chain' ? ['eq:' + q.addends.map((a) => a.parity).join('+')]
  : q.parts.map((p) => (Array.isArray(p.answer) ? p.answer.slice().sort() : p.answer)));
const NOT_PROVE = (c) => `No. ${c} is odd like it should be, but a matching even/odd doesn't prove the sum is right.`;

// Hand-written key (spec §6–§8, §12). Equation items are listed by the kinds of addends they need.
const GUIDED = {
  pt1: ['even', 'odd'], pt2: ['eq:odd+odd'], pt3: ['odd', 571], pt4: [NOT_PROVE(657), 667],
  pt5: ['Because 5 + 2 = 7 in the ones place, and 7 is odd.'],
  pt6: ['Tens and hundreds are always even, so only the ones can leave one left over.'],
  pt7: [['10 and 20', '12 and 14', '13 and 15', '9 and 13']], pt8: ['odd', 367], pt10: ['eq:even+even']
};
const PRACTICE = {
  o1: ['even', 'odd', 'odd'], o2: ['odd', 'odd', 'even'], o3: ['eq:even+even'], o4: ['eq:odd+odd'], o5: ['eq:even+odd'], o6: ['eq:even+odd'],
  o7: ['odd', 589], o8: ['even', 486], o9: ['Because 3 + 6 = 9 in the ones place, and 9 is odd.'], o10: ['The ones digits of the addends'],
  o11: [['11 and 13', '7 and 9', '8 and 6']], o12: ['even', 642], o13: ['No. Odd + even must be odd, and 676 is even.', 677],
  o14: [['426', '604', '958']], o15: ['Each odd number has one left over, and the two leftovers make a pair.']
};
const TEST = {
  t1: ['even', 'odd', 'odd'], t2: ['eq:even+odd'], t3: ['eq:odd+odd'], t4: ['odd', 771], t5: ['even', 778],
  t6: ['No. Odd + even must be odd, and 468 is even.', 467], t7: [NOT_PROVE(567), 577],
  t8: ['Because 1 + 8 = 9 in the ones place, and 9 is odd.'], t9: ['Each odd number has one left over. The two leftovers make a pair.'],
  t10: [['14 and 9', '20 and 13', '7 and 10']], t11: ['odd', 997], t12: [['216 + 322 = 539', '260 + 117 = 376']], t13: [['189', '507', '773']]
};

test('Practice Together and On My Own match the hand-checked key', () => {
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.guided.map((q) => q.id), ['pt1', 'pt2', 'pt3', 'pt4', 'pt5', 'pt6', 'pt7', 'pt8', 'pt9', 'pt10']);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Addition Patterns Test matches the key (T1–T13); choices shuffle per attempt; no hints', () => {
  const T = L.tests.patterns;
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual(keyOf(q), TEST[q.id], q.id);
      assert.ok(!q.hint, `${q.id}: no hint`);
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[11].parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('the agree/disagree keys never contain the real sum (review B-05)', () => {
  for (const q of [L.guided[3], L._testItems[6], L.bank[12], L._testItems[5]]) {
    const sum = q.parts[1].answer;
    q.parts[0].choices.forEach((c) => assert.ok(!c.includes(String(sum)), `${q.id}: "${c}"`));
  }
});

test('written equations: any fitting 3-digit numbers, either order when mixed, the sum must be right', () => {
  const r = (a, b, s) => ({ v: { a: String(a), b: String(b), s: String(s) }, t: [] });
  const oddOdd = L.bank.find((q) => q.id === 'o4'); // odd + ___ = even
  assert.ok(Q.grade(oddOdd, r(135, 241, 376)));
  assert.ok(Q.grade(oddOdd, r(999, 777, 1776)), 'a 4-digit sum is accepted (PLAN decision 8)');
  assert.ok(!Q.grade(oddOdd, r(135, 242, 377)), 'needs two odd numbers');
  assert.ok(!Q.grade(oddOdd, r(135, 241, 375)), 'the sum must be right');
  assert.ok(!Q.grade(oddOdd, r(35, 241, 276)), '3-digit numbers only');
  const mixed = L._testItems.find((q) => q.id === 't2'); // even + ___ = odd
  assert.ok(Q.grade(mixed, r(214, 125, 339)) && Q.grade(mixed, r(125, 214, 339)), 'either order (review B-03)');
  assert.ok(!Q.grade(mixed, r(214, 126, 340)), 'two even numbers do not fit');
  assert.ok(/is even, but|both even/.test(Q.check(mixed, r(214, 126, 340)).msg || ''), 'the miss names the rule');
  const ee = L.bank.find((q) => q.id === 'o3');
  assert.ok(Q.grade(ee, r(204, 316, 520)) && Q.grade(ee, r(204, 316, '520 ')), 'spaces are fine');
  assert.ok(!Q.grade(ee, r(203, 316, 519)));
  // Every equation item's own example in the explanation fits it.
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type === 'chain')) {
    const [, a, b, s] = q.explanation.match(/For example, (\d+) \+ (\d+) = ([\d,]+)/);
    assert.ok(Q.grade(q, r(a, b, s.replace(',', ''))), `${q.id}: example ${a} + ${b} fits`);
  }
});

test('every sentence key is right, and the explanations agree with the arithmetic', () => {
  const par = (n) => (n % 2 ? 'odd' : 'even');
  for (const [k, s] of Object.entries(L._sentences)) {
    const [ta, tb] = s.types;
    const sumType = par((ta === 'odd') + (tb === 'odd'));
    const blank = s.text.startsWith('___') || s.text.endsWith('___') ? sumType : (s.text.indexOf('___') < s.text.indexOf('+') ? ta : tb);
    assert.equal(s.answer, blank, k);
  }
});

test('Learn generators follow the spec over many seeds', () => {
  const S = L.seeIt.steps, DEMO = L._demo;
  const kinds = { right: 0, one: 0, tens: 0 }, notice = new Set(), starts = new Set();
  for (let seed = 1; seed <= 4000; seed++) {
    // Step 1: six different 3-digit numbers, 3 even and 3 odd, no demo numbers.
    const q1 = S[0].check(pv.rng(seed));
    const nums = q1.parts[0].choices.map(Number);
    assert.equal(new Set(nums).size, 6);
    assert.equal(nums.filter((n) => n % 2 === 0).length, 3);
    assert.ok(nums.every((n) => n >= 100 && n <= 999 && !DEMO.includes(n)));
    // Step 2: both sums even.
    const q2 = S[1].check(pv.rng(seed));
    assert.deepEqual(q2.parts.map((p) => p.answer), ['even', 'even']);
    // Step 3: even + odd = odd; the cube train starts at 4–20 (not 7, 11, 15), adds 2, 4 or 6; "notice" matches the start.
    const q3 = S[2].check(pv.rng(seed));
    const [s, s2] = q3.parts[1].label.match(/\d+/g).map(Number);
    const k = s2 - s;
    starts.add(s);
    assert.ok(s >= 4 && s <= 20 && ![7, 11, 15].includes(s) && [2, 4, 6].includes(k), `step 3 seed ${seed}`);
    assert.equal(q3.parts[0].answer, 'odd');
    assert.equal(q3.parts[1].answer, s + 3 * k);
    assert.equal(q3.parts[2].answer, s % 2 ? 'They are all odd.' : 'They are all even.');
    notice.add(q3.parts[2].answer);
    assert.ok(!L._leaks(q3));
    // Step 4: an equation item whose blank is an addend.
    const q4 = S[3].check(pv.rng(seed));
    assert.equal(q4.type, 'chain');
    assert.ok(Q.grade(q4, Q.correctResponse(q4)));
    // Step 5: the claimed sum is right 25%, off by 1 35%, off by 10 or 100 40%; always 3-digit.
    const q5 = S[4].check(pv.rng(seed));
    const [a, b, C] = q5.prompt.match(/\d+/g).map(Number);
    const sum = a + b;
    assert.ok(C >= 100 && C <= 999 && sum <= 989 && sum >= 110);
    assert.equal(q5.parts[2].answer, sum);
    assert.equal(q5.parts[1].answer, C === sum ? 'Yes' : 'No');
    assert.equal(q5.parts[0].answer, sum % 2 ? 'odd' : 'even');
    kinds[C === sum ? 'right' : Math.abs(C - sum) === 1 ? 'one' : 'tens'] += 1;
  }
  assert.ok(Math.abs(kinds.right / 4000 - 0.25) < 0.03 && Math.abs(kinds.one / 4000 - 0.35) < 0.03 && Math.abs(kinds.tens / 4000 - 0.40) < 0.03, JSON.stringify(kinds));
  assert.equal(notice.size, 2, 'step 3: both answers occur');
  assert.ok(starts.has(4) && starts.has(20));
});
