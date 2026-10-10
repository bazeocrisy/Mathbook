// Unit tests for Lesson 2-5 (Addition Patterns): the hand-checked answer key from docs/chapter-2/lessons/2-5.md
// §6–§8 and §12, the connected word + equation pairs, the written-equation grading (chain preset 'free'), and the
// Learn generator rules. Structure checks live in tests/lessons.test.js. Run: npm test
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
  pt1: ['even'], pt2: ['eq:even+even'], pt3: ['odd'], pt4: ['eq:odd+odd'], pt5: ['odd'], pt6: ['eq:even+odd'],
  pt7: ['odd', 571], pt8: [NOT_PROVE(657), 667],
  pt9: ['Because 5 + 2 = 7 in the ones place, and 7 is odd.'],
  pt10: ['Tens and hundreds are always even, so only the ones can leave one left over.'],
  pt11: [['10 and 20', '12 and 14', '13 and 15', '9 and 13']], pt12: ['odd', 367]
};
const PRACTICE = {
  o1: ['even'], o2: ['eq:even+even'], o3: ['odd'], o4: ['eq:odd+even'], o5: ['odd'], o6: ['eq:even+odd'], o7: ['even'], o8: ['eq:odd+odd'],
  o9: ['odd', 589], o10: ['even', 486], o11: ['Because 3 + 6 = 9 in the ones place, and 9 is odd.'], o12: ['The ones digits of the addends'],
  o13: [['11 and 13', '7 and 9', '8 and 6']], o14: ['even', 642], o15: ['No. Odd + even must be odd, and 676 is even.', 677],
  o16: [['426', '604', '958']], o17: ['Each odd number has one left over, and the two leftovers make a pair.'],
  o18: [['234 + 152 = 387', '318 + 205 = 524']], o19: [NOT_PROVE(571), 581]
};
const TEST = {
  t1: ['odd'], t2: ['eq:even+odd'], t3: ['even'], t4: ['eq:odd+odd'], t5: ['odd', 771], t6: ['even', 778],
  t7: ['No. Odd + even must be odd, and 468 is even.', 467], t8: [NOT_PROVE(567), 577],
  t9: ['Because 1 + 8 = 9 in the ones place, and 9 is odd.'], t10: ['Each odd number has one left over. The two leftovers make a pair.'],
  t11: [['14 and 9', '20 and 13', '7 and 10']], t12: ['odd', 997], t13: [['216 + 322 = 539', '260 + 117 = 376']], t14: [['189', '507', '773']]
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('pt13'));
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Addition Patterns Test matches the key (T1–T14); choices shuffle per attempt; no hints', () => {
  const T = L.tests.patterns;
  assert.equal(T.questions, 14);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual(keyOf(q), TEST[q.id], q.id);
      assert.ok(!q.hint, `${q.id}: no hint`);
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[12].parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('word and equation questions come in connected pairs: same pattern, same example, separate skills', () => {
  const sentences = L._sentences;
  const all = { guided: L.guided, bank: L.bank, test: L._testItems };
  for (const [where, list] of Object.entries(all)) {
    const words = list.filter((q) => q.skill === 'rules');
    const eqs = list.filter((q) => q.skill === 'write');
    assert.equal(words.length, eqs.length, `${where}: every word question has an equation question`);
    words.forEach((w) => {
      const e = list[list.indexOf(w) + 1];
      // Practice Together and the Test keep the pair together; On My Own shuffles, so the pattern sentence links them.
      assert.ok(e && e.skill === 'write' && e.sentence === w.sentence, `${where} ${w.id}: followed by its equation question`);
      const text = sentences[w.sentence].text;
      assert.ok(w.prompt.includes(text) && e.prompt.includes(text), `${where} ${w.id}: both show "${text}"`);
      // The same example: the word question names its ones digits (nothing to copy, review L25-06); the equation
      // question's explanation gives the full equation, which is the one the answer reveal shows.
      const v = Q.correctResponse(e).v;
      const digits = `numbers ending in ${v.a.slice(-1)} and ${v.b.slice(-1)} make a sum ending in ${v.s.slice(-1)}`;
      assert.ok(w.explanation.endsWith(`For example, ${digits}.`) && !w.explanation.includes(v.a), `${where} ${w.id}: digits only`);
      assert.ok(e.explanation.includes(`For example, ${v.a} + ${v.b} = ${v.s}: ${digits}, as in the word question.`), `${where} ${w.id}: the same example`);
      assert.equal(w.type, 'parts');
      assert.equal(e.type, 'chain');
    });
  }
  assert.ok(L.skills.rules && L.skills.write && L.skills.rules !== L.skills.write, 'two separate skills');
  // Every book sentence form (1–6) and the variant "even + ___ = odd" is practised as a pair before the test.
  const practised = new Set(L.guided.concat(L.bank).filter((q) => q.skill === 'rules').map((q) => q.sentence));
  assert.deepEqual([...practised].sort(), Object.keys(sentences).sort());
  L._testItems.filter((q) => q.skill === 'rules').forEach((q) => assert.ok(L.bank.some((b) => b.skill === 'rules' && b.sentence === q.sentence), `${q.id}: practised On My Own`));
});

test('the agree/disagree keys never contain the real sum (review B-05)', () => {
  const byId = (list, id) => list.find((q) => q.id === id);
  for (const q of [byId(L.guided, 'pt8'), byId(L._testItems, 't8'), byId(L.bank, 'o15'), byId(L._testItems, 't7'), byId(L.bank, 'o19')]) {
    const sum = q.parts[1].answer;
    q.parts[0].choices.forEach((c) => assert.ok(!c.includes(String(sum)), `${q.id}: "${c}"`));
  }
});

test('written equations: any fitting 3-digit numbers, either order when mixed, the sum must be right', () => {
  const r = (a, b, s) => ({ v: { a: String(a), b: String(b), s: String(s) }, t: [] });
  const oddOdd = L.guided.find((q) => q.id === 'pt4'); // odd + ___ = even
  assert.ok(Q.grade(oddOdd, r(135, 241, 376)));
  assert.ok(Q.grade(oddOdd, r(999, 777, 1776)), 'a 4-digit sum is accepted (PLAN decision 8)');
  assert.ok(!Q.grade(oddOdd, r(135, 242, 377)), 'needs two odd numbers');
  assert.ok(!Q.grade(oddOdd, r(135, 241, 375)), 'the sum must be right');
  assert.ok(!Q.grade(oddOdd, r(35, 241, 276)), '3-digit numbers only');
  const mixed = L._testItems.find((q) => q.id === 't2'); // even + ___ = odd
  assert.ok(Q.grade(mixed, r(214, 125, 339)) && Q.grade(mixed, r(125, 214, 339)), 'either order (review B-03)');
  assert.ok(!Q.grade(mixed, r(214, 126, 340)), 'two even numbers do not fit');
  assert.ok(/is even, but|both even/.test(Q.check(mixed, r(214, 126, 340)).msg || ''), 'the miss names the rule');
  const ee = L.bank.find((q) => q.id === 'o2');
  assert.ok(Q.grade(ee, r(204, 316, 520)) && Q.grade(ee, r(204, 316, '520 ')), 'spaces are fine');
  assert.ok(!Q.grade(ee, r(203, 316, 519)));
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type === 'chain')) {
    assert.ok(q.explanation.startsWith(`The blank is ${L._sentences[q.sentence].answer}, so you need `), q.id);
  }
});

test('every sentence key is right', () => {
  const par = (n) => (n % 2 ? 'odd' : 'even');
  for (const [k, s] of Object.entries(L._sentences)) {
    const [ta, tb] = s.types;
    const sumType = par((ta === 'odd') + (tb === 'odd'));
    const blank = s.text.startsWith('___') || s.text.endsWith('___') ? sumType : (s.text.indexOf('___') < s.text.indexOf('+') ? ta : tb);
    assert.equal(s.answer, blank, k);
  }
});

test('Learn: step 5 writes an equation for the same pattern as step 4', () => {
  const S = L.seeIt.steps;
  assert.deepEqual(S.map((s) => s.id), ['parity', 'same-type', 'even-odd', 'ones-decide', 'write-equation', 'check-sum']);
  for (let seed = 1; seed <= 200; seed++) {
    const w = S[3].check(pv.rng(seed));
    // The engine saves step 4's question in this lesson's Learn progress; step 5 reads its sentence from there.
    const saved = JSON.stringify({ step: 4, done: { 'ones-decide': true }, checks: { 'ones-decide': { q: w } } });
    globalThis.localStorage = { getItem: (k) => (k === 'mathbook:v2:lesson-2-5:see-wizard' ? saved : null) };
    const e = S[4].check(pv.rng(seed + 1000));
    delete globalThis.localStorage;
    assert.equal(e.sentence, w.sentence, `seed ${seed}`);
    assert.ok(e.prompt.startsWith(`Same pattern as step 4: ${L._sentences[w.sentence].text}.`));
    // Back on step 4 after step 5 exists: a new question keeps step 5's sentence (review L25-07).
    const saved5 = JSON.stringify({ step: 3, done: {}, checks: { 'write-equation': { q: e } } });
    globalThis.localStorage = { getItem: (k) => (k === 'mathbook:v2:lesson-2-5:see-wizard' ? saved5 : null) };
    assert.equal(S[3].check(pv.rng(seed + 2000)).sentence, e.sentence, `seed ${seed}: step 4 keeps step 5's sentence`);
    delete globalThis.localStorage;
    assert.equal(w.skill, 'rules');
    assert.equal(e.skill, 'write');
  }
  // Without saved progress (e.g. a fresh browser) step 5 still makes a valid question.
  const fresh = S[4].check(pv.rng(5));
  assert.ok(Q.grade(fresh, Q.correctResponse(fresh)));
});

test('Learn generators follow the spec over many seeds', () => {
  const S = L.seeIt.steps, DEMO = L._demo;
  const kinds = { right: 0, one: 0, tens: 0 }, notice = new Set(), starts = new Set(), forms = new Set();
  for (let seed = 1; seed <= 4000; seed++) {
    // Step 1: six different 3-digit numbers, 3 even and 3 odd, no demo numbers.
    const q1 = S[0].check(pv.rng(seed));
    const nums = q1.parts[0].choices.map(Number);
    assert.equal(new Set(nums).size, 6);
    assert.equal(nums.filter((n) => n % 2 === 0).length, 3);
    assert.ok(nums.every((n) => n >= 100 && n <= 999 && !DEMO.includes(n)));
    // Step 2: both sums even.
    assert.deepEqual(S[1].check(pv.rng(seed)).parts.map((p) => p.answer), ['even', 'even']);
    // Step 3 (PLAN decision 28, review N-1): start 4–20, never 7, 11 or 15; add 2, 4 or 6; "notice" matches the start.
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
    // Step 4: a word question from all seven sentences. Step 5: a gradable equation question.
    forms.add(S[3].check(pv.rng(seed)).sentence);
    const q5 = S[4].check(pv.rng(seed));
    assert.ok(Q.grade(q5, Q.correctResponse(q5)));
    // Step 6: the claimed sum is right 25%, off by 1 35%, off by 10 or 100 40%; always 3-digit.
    const q6 = S[5].check(pv.rng(seed));
    const [a, b, C] = q6.prompt.match(/\d+/g).map(Number);
    const sum = a + b;
    assert.ok(C >= 100 && C <= 999 && sum <= 989 && sum >= 110);
    assert.equal(q6.parts[2].answer, sum);
    assert.equal(q6.parts[1].answer, C === sum ? 'Yes' : 'No');
    assert.equal(q6.parts[0].answer, sum % 2 ? 'odd' : 'even');
    kinds[C === sum ? 'right' : Math.abs(C - sum) === 1 ? 'one' : 'tens'] += 1;
  }
  assert.ok(Math.abs(kinds.right / 4000 - 0.25) < 0.03 && Math.abs(kinds.one / 4000 - 0.35) < 0.03 && Math.abs(kinds.tens / 4000 - 0.40) < 0.03, JSON.stringify(kinds));
  assert.equal(notice.size, 2, 'step 3: both answers occur');
  assert.ok(starts.has(4) && starts.has(20));
  assert.equal(forms.size, 7, 'step 4: all seven sentences');
});

test('O18: every right-kind sum is a correct sum, so the key matches "can\'t be right" (review L25-05)', () => {
  const q = L.bank.find((x) => x.id === 'o18');
  const par = (n) => n % 2;
  q.parts[0].choices.forEach((c) => {
    const [a, b, s] = c.match(/\d+/g).map(Number);
    if (par(a + b) === par(s)) assert.equal(a + b, s, c);
  });
});
