// Unit tests for Lesson 2-9 (Use Addition to Subtract): the hand-checked answer key from docs/chapter-2/lessons/2-9.md
// §6–§8 and §12, the related-equation frame (fixed order, C-14), counting-up jumps, the bar-diagram boxes, and the
// Learn generator rules. Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-9/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-9'];

/** frame → ['frame', A, B, ?]; parts → part answers. */
function keyOf(q) {
  if (q.type === 'chain') { const v = Q.correctResponse(q).v; return ['frame', ...[v.A, v.B, v.f].map(pv.parseWholeNumber)]; }
  return q.parts.map((p) => (Array.isArray(p.answer) ? p.answer.slice().sort() : p.answer));
}
const HELP = (p, w) => `Find ${p} + ? = ${w}: what you add to ${p} to get ${w}.`;

const GUIDED = {
  p1: ['342 + ? = 584', 242], p2: ['frame', 315, 728, 413], p3: [237], p4: [252], p5: [HELP(214, 563), 349],
  p6: [712, 386, '386 + ? = 712', 326], p7: [242], p8: [283], p9: ['418 + ? = 652', 234]
};
const PRACTICE = {
  o1: ['frame', 413, 847, 434], o2: ['162 + ? = 300'], o3: ['frame', 255, 936, 681], o4: [HELP(205, 638), 433],
  o5: [735, 468, '468 + ? = 735', 267], o6: [244], o7: [415], o8: [346], o9: [67], o10: [400, 186, 214], o11: [262], o12: ['327 + ? = 563', 236], o13: [['683 − 265 = 418', '683 − 418 = 265']]
};
const TEST = {
  t1: [['frame', 425, 769, 344], 'related'], t2: [['173 + ? = 500'], 'related'], t3: [[HELP(312, 586), 274], 'error'],
  t4: [[524, 297, '297 + ? = 524', 227], 'compare'], t5: [[900, 438, 462], 'diagram'], t6: [[245], 'solve'], t7: [[436], 'solve'],
  t8: [[326], 'solve'], t9: [[165], 'solve'], t10: [[145], 'apply'], t11: [['485 + ? = 712', 227], 'unknown'],
  t12: [[['643 − 287 = 356', '643 − 356 = 287']], 'related']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('p10'));
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Use Addition to Subtract Test matches the key (T1–T12) and skills; choices shuffle; no hints', () => {
  const T = L.tests.related;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual([keyOf(q), q.skill], TEST[q.id], q.id); assert.ok(!q.hint && !q.parent); }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[1].parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('the related-equation frame: part first, whole after =, then ? (fixed order, C-14)', () => {
  const q = L.guided.find((x) => x.id === 'p2'); // 728 − 315
  const R = (A, B, f) => ({ v: { A: String(A), B: String(B), f: String(f) }, t: [] });
  assert.ok(Q.grade(q, R(315, 728, 413)));
  assert.ok(!Q.grade(q, R(728, 315, 413)), 'the whole is not an addend');
  assert.ok(!Q.grade(q, R(315, 728, 1043)), 'adding the two numbers is wrong');
  assert.match(Q.check(q, R(728, 315, 413)).msg, /Look again/);
  assert.ok(/\?/.test(Q.render(q, 'k', { mode: 'guided' })), 'the ? is printed in the frame');
});

test('counting-up jumps: to a ten, a hundred (if on the way), then the whole; jumps add to the difference', () => {
  assert.deepEqual(L._jumps(248, 563), [[248, 250], [250, 300], [300, 563]]);
  assert.deepEqual(L._jumps(153, 400), [[153, 160], [160, 200], [200, 400]]);
  assert.deepEqual(L._jumps(237, 452), [[237, 240], [240, 300], [300, 452]]);
  assert.deepEqual(L._jumps(164, 231), [[164, 170], [170, 200], [200, 231]]);
  for (let p = 101; p < 900; p += 7) for (const w of [p + 33, p + 150, 999]) {
    if (w > 999) continue;
    const J = L._jumps(p, w);
    assert.equal(J[0][0], p); assert.equal(J[J.length - 1][1], w);
    assert.equal(J.reduce((s, [x, y]) => s + (y - x), 0), w - p);
  }
});

test('spec §12 by hand: every "x + y = z" and "x − y = z" in explanations is right', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type !== 'explain')) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) {
      assert.equal(m[1].split(' + ').reduce((s, t) => s + Number(t.replace(/,/g, '')), 0), Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    }
    for (const m of q.explanation.matchAll(/([\d,]+) − ([\d,]+) = ([\d,]+)/g)) {
      assert.equal(Number(m[1].replace(/,/g, '')) - Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    }
  }
});

test('no question prints an answer the child must work out; Learn generators follow the spec', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 2000; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
  const demo = L._demo;
  for (let seed = 1; seed <= 400; seed++) {
    const [s1, s2, s3, s4, s5, s6] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    const [W, P] = [s1.parts[0].answer, s1.parts[1].answer];
    assert.ok(W >= 400 && W <= 900 && P >= 120 && P <= W - 100 && P % 100 !== 0);
    const [p3, w3] = s3.parts[0].label.match(/(\d+) \+ \? = (\d+)/).slice(1).map(Number);
    assert.ok(w3 <= 950 && p3 % 10 !== 0 && w3 - p3 >= 50);
    const [h4, p4] = s4.prompt.match(/([\d,]+) − ([\d,]+)/).slice(1).map(Number);
    assert.ok(h4 % 100 === 0 && h4 >= 300 && h4 <= 900 && p4 % 10 !== 0 && p4 <= h4 - 50);
    assert.ok(s5.parts[1].answer >= 80);
    const [A6, B6, d6] = s6.parts.map((p) => p.answer);
    assert.ok(B6 >= 150 && B6 <= 600 && A6 >= B6 + 80 && d6 === A6 - B6);
    for (const q of [s1, s2, s3, s4, s5, s6]) assert.ok(!(q.prompt.match(/\d+/g) || []).map(Number).some((n) => demo.includes(n) && n !== 400), `${q.id}: no demo numbers`);
  }
  let regroup = 0; for (let seed = 1; seed <= 400; seed++) { const q = L.seeIt.steps[2].check(pv.rng(seed)); const [p, w] = q.parts[0].label.match(/(\d+) \+ \? = (\d+)/).slice(1).map(Number); if (p % 10 > w % 10) regroup++; }
  assert.ok(regroup >= 200 * 0.8, `regrouping case often (${regroup}/400)`);
});

test('review fixes L29-01…04', () => {
  // L29-01: counting-up marks have room for 3-digit labels.
  const html = L.seeIt.steps[2].slides[1];
  const left = Array.from(html.matchAll(/nline-label" style="left:([\d.]+)%/g)).map((m) => Number(m[1]));
  for (let i = 1; i < left.length; i++) assert.ok(left[i] - left[i - 1] >= 20, html.slice(0, 80));
  // L29-02: the T12 format is practised.
  assert.ok(L.bank.some((q) => q.parts && q.parts[0].kind === 'multi' && /Which must also be true/.test(q.prompt)));
  // L29-03: guided counting hints say to add the jumps.
  for (const id of ['p3', 'p4', 'p7', 'p8']) assert.match(L.guided.find((q) => q.id === id).hint, /add your jumps/i, id);
  // L29-04: On My Own and the test don't print the addition equation for "find the difference".
  for (const q of L.bank.concat(L._testItems).filter((x) => x.skill === 'solve')) assert.ok(!/\+ \? =/.test(q.prompt), q.id);
  assert.ok(left.length >= 3, 'the counting-up line has its marks');
});
