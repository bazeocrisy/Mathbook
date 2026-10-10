// Unit tests for Lesson 2-4 (Use Addition Properties to Add): the hand-checked answer key from
// docs/chapter-2/lessons/2-4.md §7, §8 and §12, and the lesson's own generator rules. Structure checks live in tests/lessons.test.js.
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-4/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-4'];

// Choices use non-breaking spaces so an expression stays on one line; compare them as ordinary text.
const sp = (v) => (Array.isArray(v) ? v.map(sp).sort() : typeof v === 'string' ? v.replace(/ /g, ' ') : v);
const keyOf = (q) => (q.type === 'number' ? [q.answer] : q.parts.map((p) => sp(p.answer)));
const SWITCH = 'Switch the order. The same two addends are on both sides.';

// Hand-written key (spec §7, §8, §12): typed numbers, choice keys, and select-all sets.
const PRACTICE = {
  p1: [436], p2: [64], p3: [278], p4: [709],
  p5: [['47 + 76 + 53', '53 + 47 + 76', '76 + 53 + 47'].sort(), 176],
  p6: ['263 + 137', 400, 818], p7: ['46 + 254', 300, 671], p8: ['296 + 304', 600, 814], p9: ['562 + 38', 600, 775],
  p10: ['145 + 205', 350, 581], p11: ['$276 + $124', 400, 815], p12: ['Add $435 and $165 first, then add $210.', 810],
  p13: [SWITCH, 143], p14: [['52 + 319 = 319 + 52', '140 + 60 + 25 = 25 + 140 + 60'].sort()]
};
const TEST = {
  t1: [527], t2: [91], t3: [186], t4: [842],
  t5: [['38 + 85 + 62', '62 + 38 + 85', '85 + 62 + 38'].sort(), 185],
  t6: ['345 + 155', 500, 771], t7: ['63 + 237', 300, 712], t8: ['397 + 203', 600, 786], t9: ['581 + 19', 600, 807],
  t10: ['126 + 304', 430, 862], t11: ['$238 + $162', 400, 819], t12: ['Add $255 and $145 first, then add $320.', 720],
  t13: [SWITCH, 218], t14: [['74 + 506 = 506 + 74', '230 + 70 + 18 = 18 + 230 + 70'].sort()]
};

test('On My Own and Practice Together match the hand-checked key (P1–P14)', () => {
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
  for (const q of L.guided.filter((x) => x.type !== 'explain')) assert.deepEqual(keyOf(q), PRACTICE[q.id], 'guided ' + q.id);
  assert.deepEqual(L.guided.filter((x) => x.type === 'explain').map((x) => x.id), ['g-e1', 'g-e2']);
});

test('Addition Properties Test matches the hand-checked key (T1–T14), with choices shuffled per attempt', () => {
  const T = L.tests.properties;
  assert.equal(T.title, 'Addition Properties Test');
  for (const seed of [1, 2, 99, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual(keyOf(q), TEST[q.id], q.id);
      (q.parts || []).forEach((p) => {
        if (p.kind === 'choice') assert.ok(p.choices.includes(p.answer), `${q.id}: key is a choice`);
        if (p.kind === 'multi') p.answer.forEach((a) => assert.ok(p.choices.includes(a), `${q.id}: ${a} is a choice`));
      });
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[13].parts[0].choices.join('|')));
  assert.ok(orders.size > 1, 'choice order changes between attempts');
});

test('book items 1–4: the blank is in all four places, in practice and test alike', () => {
  const forms = (qs) => qs.slice(0, 4).map((q) => q.display.indexOf('___'));
  const P = L.bank.slice(0, 4).map((q) => q.display), T = L._testItems.slice(0, 4).map((q) => q.display);
  assert.deepEqual(P, ['436 + 217 = 217 + ___', '382 + ___ = 64 + 382', '614 + 278 = ___ + 614', '___ + 85 = 85 + 709']);
  assert.deepEqual(T, ['527 + 164 = 164 + ___', '253 + ___ = 91 + 253', '738 + 186 = ___ + 738', '___ + 67 = 67 + 842']);
  assert.deepEqual(forms(L.bank), forms(L._testItems));
});

test('select-all distractors: subtraction and switched digits (P5/T5), wrong equations (P14/T14)', () => {
  const p5 = sp(L.bank[4].parts[0].choices), t5 = sp(L._testItems[4].parts[0].choices);
  assert.deepEqual(p5.filter((c) => !PRACTICE.p5[0].includes(c)), ['47 + 67 + 53', '76 − 53 + 47']);
  assert.deepEqual(t5.filter((c) => !TEST.t5[0].includes(c)), ['38 + 58 + 62', '85 − 62 + 38']);
  assert.deepEqual(sp(L.bank[13].parts[0].choices).filter((c) => !PRACTICE.p14[0].includes(c)), ['407 + 26 = 26 + 470', '63 + 208 = 208 + 36']);
  assert.deepEqual(sp(L._testItems[13].parts[0].choices).filter((c) => !TEST.t14[0].includes(c)), ['318 + 45 = 45 + 381', '96 + 125 = 125 + 69']);
});

test('friendly items: exactly one qualifying pair, the last step needs no regrouping, and the other pairs (spec §12)', () => {
  const others = { p6: [681, 555], p7: [417, 625], p8: [510, 518], p9: [737, 213], p10: [376, 436],
    t6: [616, 426], t7: [475, 649], t8: [583, 389], t9: [788, 226], t10: [558, 736] };
  for (const q of L.bank.concat(L._testItems).filter((x) => x.skill === 'friendly')) {
    const ad = q.display.split(' + ').map(Number);
    const ends = /ending in 00/.test(q.parts[0].label) ? '00' : '0';
    assert.ok(L._onlyPair(ad, ends) >= 0, `${q.id}: one pair ends in ${ends}`);
    const H = q.parts[1].answer, rest = q.parts[2].answer - H;
    assert.equal((H % 10) + (rest % 10) < 10 && (Math.floor(H / 10) % 10) + (Math.floor(rest / 10) % 10) < 10, true, `${q.id}: no regrouping in ${H} + ${rest}`);
    for (const n of others[q.id]) assert.ok(q.explanation.includes(pv.fmt(n)), `${q.id}: explanation names ${n}`);
  }
});

test('no position shortcut: the friendly pair is not always the 1st and 3rd addend (review L24-01)', () => {
  const where = { 0: 0, 1: 0, 2: 0 };
  for (const q of L.bank.concat(L._testItems).filter((x) => x.skill === 'friendly' || (x.skill === 'money' && x.parts.length === 3))) {
    const ad = q.skill === 'money' ? q.figure.rows.slice(0, 3).map((r) => r[1]) : q.display.split(' + ').map(Number);
    where[L._onlyPair(ad, /ending in 0\?/.test(q.parts[0].label) ? '0' : '00')] += 1;
  }
  const total = where[0] + where[1] + where[2];
  assert.ok(Object.values(where).every((n) => n > 0 && n <= total / 2), JSON.stringify(where));
  const at = L.bank.filter((x) => x.skill === 'friendly').map((q) => q.parts[0].choices.indexOf(q.parts[0].answer));
  assert.ok(new Set(at).size > 1, `practice: the right choice moves (${at})`);
});

test('the efficient-way choices name no value and are about the same length (A-03, N-05)', () => {
  for (const q of [L.bank[12], L._testItems[12]]) {
    const c = q.parts[0].choices;
    c.forEach((x) => assert.ok(!/\d/.test(x), `${q.id}: "${x}" names no number`));
    const lens = c.map((x) => x.length);
    assert.ok(Math.max(...lens) - Math.min(...lens) <= 8, `${q.id}: lengths ${lens}`);
  }
  assert.ok(!/= 893|893/.test(L._testItems[12].prompt), 'T13 prints no sum');
  assert.ok(!/\$600|\$400/.test(L.bank[11].parts[0].choices.join(' ') + L._testItems[11].parts[0].choices.join(' ')), 'P12/T12 choices print no pair sum (A-21)');
});

test('place-value explanation of a pair', () => {
  assert.equal(L._pairWhy(263, 137), 'Ones: 3 + 7 = 10, so 0 ones and 1 more ten. Tens: 6 + 3 + 1 = 10, so 0 tens and 1 more hundred. Hundreds: 2 + 1 + 1 = 4. So 263 + 137 = 400.');
  assert.equal(L._pairWhy(145, 205), 'Ones: 5 + 5 = 10, so 0 ones and 1 more ten. Tens: 4 + 0 + 1 = 5. Hundreds: 1 + 2 = 3. So 145 + 205 = 350.');
  assert.equal(L._pairWhy(46, 254), 'Ones: 6 + 4 = 10, so 0 ones and 1 more ten. Tens: 4 + 5 + 1 = 10, so 0 tens and 1 more hundred. Hundreds: 2 + 1 = 3. So 46 + 254 = 300.');
});

test('Learn generators follow the spec over many seeds', () => {
  const S = L.seeIt.steps;
  const DEMO = L._demo;
  const nums = (q) => (q.display || '').match(/\d+/g).map(Number);
  const forms = new Set(), totals = new Set(), positions = new Set(), kinds = { '00': 0, '0': 0 }, variants = new Set();
  for (let seed = 1; seed <= 3000; seed++) {
    // Step 1: switch the order, blank in any place, answer = the addend missing from that side.
    const q1 = S[0].check(pv.rng(seed));
    const n1 = nums(q1);
    forms.add(q1.display.split(/ [+=] /).indexOf('___'));
    // Three numbers are printed; the one printed only once is the addend missing from the other side.
    const once = n1.filter((n) => n1.indexOf(n) === n1.lastIndexOf(n));
    assert.deepEqual(once, [q1.answer], `step 1 seed ${seed}: ${q1.display}`);
    assert.ok(Q.grade(q1, String(q1.answer)) && !Q.grade(q1, String(n1.find((n) => n !== q1.answer))), `step 1 seed ${seed}: grading`);
    assert.ok(n1.every((n) => !DEMO.includes(n)), `step 1 seed ${seed}: no demo numbers`);

    // Step 2: the named pair total varies; the pair is in any two places; no regrouping in the last step.
    const q2 = S[1].check(pv.rng(seed));
    const ad2 = q2.figure.addends;
    const P = q2.parts[0].answer, T = q2.parts[1].answer;
    totals.add(P); positions.add(q2.figure.pair.join(''));
    assert.ok([60, 70, 80, 90, 100, 200, 300].includes(P), `step 2 seed ${seed}: pair total ${P}`);
    assert.equal(T, ad2.reduce((a, b) => a + b, 0));
    assert.ok(!L._leaks(q2), `step 2 seed ${seed}: prints no answer`);
    assert.ok(ad2.every((n) => !DEMO.includes(n)), `step 2 seed ${seed}: no demo numbers`);

    // Step 3: exactly one qualifying pair; about one in three ends in 0 (not 00); no regrouping in the last step.
    const q3 = S[2].check(pv.rng(seed));
    const ad3 = nums(q3);
    const ends = /ending in 00/.test(q3.parts[0].label) ? '00' : '0';
    kinds[ends] += 1;
    assert.ok(L._onlyPair(ad3, ends) >= 0, `step 3 seed ${seed}: one pair`);
    const H = q3.parts[1].answer, rest = q3.parts[2].answer - H;
    assert.ok(q3.parts[2].answer <= 999 && (H % 10) + (rest % 10) < 10 && (Math.floor(H / 10) % 10) + (Math.floor(rest / 10) % 10) < 10, `step 3 seed ${seed}: no regrouping`);
    assert.ok(!L._leaks(q3) && ad3.every((n) => !DEMO.includes(n)), `step 3 seed ${seed}`);

    // Step 4: six different choices, three right, the subtraction is bigger − smaller, total = 100 + middle value.
    const q4 = S[3].check(pv.rng(seed));
    const ch = sp(q4.parts[0].choices);
    assert.equal(new Set(ch).size, 6, `step 4 seed ${seed}: six choices`);
    assert.equal(q4.parts[0].answer.length, 3);
    const subC = ch.find((c) => c.includes('−'));
    const [a, b] = subC.match(/\d+/g).map(Number);
    assert.ok(a > b, `step 4 seed ${seed}: ${subC}`);
    const rows = q4.figure.rows.map((r) => r[1]);
    assert.equal(rows[0] + rows[2], 100);
    assert.equal(q4.parts[1].answer, 100 + rows[1]);
  }
  assert.equal(forms.size, 4, 'step 1: all four blank places');
  assert.equal(totals.size, 7, 'step 2: every pair total');
  assert.equal(positions.size, 3, 'step 2: every pair position');
  assert.ok(kinds['0'] > 800 && kinds['0'] < 1200, `step 3: about one in three ends in 0 (${kinds['0']})`);

  // Step 5 alternates: the fill-in (number-free choices), then a receipt (one pair ends in 00, total ≤ 999).
  for (let k = 0; k < 400; k++) {
    const q = S[4].check(pv.rng(k + 1));
    variants.add(q.parts[0].label);
    if (q.parts[0].answer === SWITCH) q.parts[0].choices.forEach((c) => assert.ok(!/\d/.test(c)));
    else {
      const ad = q.figure.rows.slice(0, 3).map((r) => r[1]);
      assert.ok(L._onlyPair(ad, '00') >= 0 && q.parts[1].answer <= 999 && !L._leaks(q));
    }
  }
  assert.equal(variants.size, 2, 'step 5: both kinds');
});
