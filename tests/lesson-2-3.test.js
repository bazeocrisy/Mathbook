// Unit tests for Lesson 2-3 (Estimate Sums and Differences): the hand-checked answer key from
// docs/chapter-2/lessons/2-3.md §12 and the lesson's own rules. Structure checks live in tests/lessons.test.js.
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-3/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-3'];

// Hand-written key (spec §7, §8, §12). Numbers are typed answers in order; strings are choice keys.
const ADD = 'Add', SUB = 'Subtract', NO = 'No. It is far from the estimate.', TEN = 'Nearest ten';
const HOW = 'Round each number to the nearest hundred. Then add the rounded numbers.';
const PRACTICE = {
  p1: [400, 300, 700], p2: [800, 300, 500], p3: [240, 450, 690], p4: [860, 530, 330],
  p5: ['650 − 425', 225], p6: ['225 + 350', 575], p7: [HOW, 700], p8: [SUB, 400], p9: [SUB, 220],
  p10: [320, 390], p11: [560, 50, 460], p12: [700, NO], p13: [ADD, 800], p14: [370, 300, TEN]
};
const TEST = {
  t1: [400, 400, 800], t2: [900, 300, 600], t3: [530, 260, 790], t4: [740, 320, 420],
  t5: ['825 − 375', 450], t6: ['475 + 250', 725], t7: [HOW, 900], t8: [SUB, 500], t9: [SUB, 240],
  t10: [280, 290], t11: [680, 40, 600], t12: [400, NO], t13: [ADD, 900], t14: [380, 300, TEN]
};
const keyOf = (q) => q.parts.map((p) => p.answer);

test('On My Own and Practice Together match the hand-checked key (P1–P14)', () => {
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
  for (const q of L.guided.filter((x) => x.type !== 'explain')) assert.deepEqual(keyOf(q), PRACTICE[q.id], 'guided ' + q.id);
});

test('Estimation Test matches the hand-checked key (T1–T14), with choices shuffled per attempt', () => {
  const T = L.tests.estimate;
  assert.equal(T.title, 'Estimation Test');
  for (const seed of [1, 2, 99, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual(keyOf(q), TEST[q.id], q.id);
      q.parts.forEach((p) => { if (p.kind === 'choice') assert.ok(p.choices.includes(p.answer), `${q.id}: key is a choice`); });
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[4].parts[0].choices.join('|')));
  assert.ok(orders.size > 1, 'choice order changes between attempts');
});

test('fixed distractors from the spec, and every compatible key is the nearest multiple of 25', () => {
  const want = {
    p5: ['700 − 400', '651 − 400', '675 − 450'], p6: ['200 + 300', '230 + 350', '250 + 325'],
    t5: ['800 − 400', '826 − 400', '850 − 350'], t6: ['500 + 300', '480 + 250', '450 + 275']
  };
  const all = L.bank.concat(L._testItems);
  for (const [id, wrong] of Object.entries(want)) {
    const q = all.find((x) => x.id === id);
    assert.deepEqual(q.parts[0].choices.filter((c) => c !== q.parts[0].answer).sort(), wrong.slice().sort(), id);
  }
  // Compatible = nearest of 00/25/50/75; whole numbers never tie.
  for (let n = 0; n <= 1000; n++) {
    const c = L._compat(n);
    assert.equal(c % 25, 0);
    assert.ok(Math.abs(n - c) <= 12, `${n} → ${c}`);
  }
  for (const [n, c] of [[651, 650], [424, 425], [226, 225], [348, 350], [826, 825], [374, 375], [476, 475], [251, 250], [526, 525], [274, 275], [247, 250], [352, 350]]) assert.equal(L._compat(n), c);
});

test('tests never reveal answers; check and explain choices are number-free', () => {
  for (const q of L.bank.concat(L.tests.estimate.generate(7))) assert.ok(!L._leaks(q), `${q.id}: a typed answer is printed in the question`);
  for (const q of L._testItems) {
    assert.ok(!q.figure && !q.hint && !q.parent, `${q.id}: plain test item`);
    if (['check', 'explain'].includes(q.skill)) q.parts.filter((p) => p.kind === 'choice').forEach((p) => p.choices.forEach((c) => assert.ok(!/\d/.test(c), `${q.id}: "${c}"`)));
  }
});

test('arrows layout ("?" boxes) only in Learn and Practice Together; never on word problems (it would show + or −)', () => {
  assert.ok(L.bank.every((q) => !q.figure), 'On My Own has plain fields');
  for (const q of L.guided) {
    if (['word', 'missing', 'twostep'].includes(q.skill) || q.type === 'explain') assert.ok(!q.figure, q.id);
    if (q.figure) assert.equal(q.figure.unknown, true, q.id);
  }
  for (let s = 1; s <= 200; s++) assert.ok(!L.seeIt.steps[4].check(pv.rng(s)).figure, 'step 5 has no figure');
});

test('Practice Together: parent tips (N-02 friends), explain items G-E1 and G-E2', () => {
  const g = Object.fromEntries(L.guided.map((q) => [q.id, q]));
  assert.match(g.p11.parent, /friend/);
  assert.doesNotMatch(g.p11.parent, /stop/);
  assert.match(g.p11.hint, /first friend.*second friend/);
  assert.match(g.p12.parent, /493/);
  assert.doesNotMatch(g.p12.parent, /700/);
  assert.equal(g['g-e1'].type, 'explain');
  assert.match(g['g-e1'].listenFor.join(' '), /600 − 200 = 400.*570 − 250 = 320.*325/);
  assert.equal(g['g-e2'].type, 'explain');
  assert.ok(!L.bank.some((q) => q.type === 'explain'), 'explain items are Practice Together only');
});

test('explanations agree with the answers', () => {
  const ex = Object.fromEntries(L.bank.map((q) => [q.id, q.explanation]));
  assert.match(ex.p1, /437 rounds to 400 \(tens digit 3\)\. 251 rounds to 300 \(tens digit 5, round up\)\. 400 \+ 300 = 700\. The exact sum is 688/);
  assert.match(ex.p5, /650 − 425 = 225/);
  assert.match(ex.p10, /710 − 320 = 390/);
  assert.match(ex.p11, /560 − 50 = 510, then 510 − 50 = 460.*563 − 96 = 467/);
  assert.match(ex.p12, /400 \+ 300 = 700\. 493 is far from 700.*693/);
  assert.match(ex.p14, /370 is 6 away from 364 and 300 is 64 away/);
  const t = Object.fromEntries(L._testItems.map((q) => [q.id, q.explanation]));
  assert.match(t.t11, /680 − 40 = 640, then 640 − 40 = 600.*682 − 74 = 608/);
  assert.match(t.t12, /700 − 300 = 400\. 155 is far from 400.*355/);
  assert.match(t.t14, /380 is 6 away from 374 and 300 is 74 away/);
});

// ---------- Learn Your Turn rules (many seeds) ----------
const roundTo = pv.roundTo;
const SEEDS = 400;
const nums = (q) => (q.prompt.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));

test('Learn steps 1–3: named place, numbers in range, not demo numbers, answers computed', () => {
  const [s1, s2, s3] = L.seeIt.steps;
  for (let s = 1; s <= SEEDS; s++) {
    for (const [step, place] of [[s1, 100], [s2, 10]]) {
      const q = step.check(pv.rng(s));
      const [a, b] = nums(q);
      assert.match(q.prompt, new RegExp(`^Estimate ${pv.fmt(a)} \\+ ${pv.fmt(b)}\\. Round each number to the nearest ${place === 10 ? 'ten' : 'hundred'}\\.$`));
      assert.ok(a >= 101 && a <= 899 && b >= 101 && b <= 899 && a % place && b % place);
      assert.ok(!L._demo.includes(a) && !L._demo.includes(b));
      assert.ok(roundTo(a, place) + roundTo(b, place) <= 1000);
      assert.deepEqual(keyOf(q), [roundTo(a, place), roundTo(b, place), roundTo(a, place) + roundTo(b, place)]);
      assert.ok(!L._leaks(q));
    }
    const q = s3.check(pv.rng(s));
    const place = /nearest ten/.test(q.prompt) ? 10 : 100;
    const [a, b] = nums(q);
    assert.ok(a > b && roundTo(a, place) > roundTo(b, place) && !L._demo.includes(a) && !L._demo.includes(b));
    assert.deepEqual(keyOf(q), [roundTo(a, place), roundTo(b, place), roundTo(a, place) - roundTo(b, place)]);
  }
  const forms = new Set(Array.from({ length: 60 }, (_, s) => /^\? = /.test(s3.check(pv.rng(s + 1)).prompt)));
  assert.equal(forms.size, 2, 'step 3 sometimes shows "? = a − b"');
});

test('Learn step 4: compatible pairs, no reused pairs (incl. 575/125, N-04), sensible distractors', () => {
  const step = L.seeIt.steps[3];
  for (let s = 1; s <= SEEDS; s++) {
    const q = step.check(pv.rng(s));
    const m = q.prompt.match(/estimate ([\d,]+) ([+−]) ([\d,]+)\.$/);
    const a = Number(m[1].replace(/,/g, '')), op = m[2], b = Number(m[3].replace(/,/g, ''));
    const ca = L._compat(a), cb = L._compat(b);
    assert.ok([1, 2].includes(Math.abs(a - ca)) && [1, 2].includes(Math.abs(b - cb)), `${a}, ${b} are 1 or 2 from a multiple of 25`);
    assert.ok(ca % 100 || cb % 100, 'at least one is not a multiple of 100');
    assert.ok(!L._usedPairs.some(([x, y]) => (x === ca && y === cb) || (x === cb && y === ca)), `${ca}/${cb} is a used pair`);
    assert.ok(op === '−' ? ca > cb : ca + cb <= 1000);
    assert.equal(q.parts[0].answer, `${pv.fmt(ca)} ${op} ${pv.fmt(cb)}`);
    assert.equal(q.parts[0].choices.length, 4);
    assert.equal(q.parts[1].answer, op === '+' ? ca + cb : ca - cb);
    assert.ok(!L._leaks(q));
  }
});

test('Learn step 5: the add/subtract key matches the story; missing-part and two-step use the nearest ten (N-03)', () => {
  const step = L.seeIt.steps[4];
  const kinds = new Set();
  for (let s = 1; s <= SEEDS; s++) {
    const q = step.check(pv.rng(s));
    const op = q.parts[0].answer;
    if (/in all|altogether/.test(q.prompt)) { kinds.add('add'); assert.equal(op, ADD); } else assert.equal(op, SUB);
    if (/estimates about/.test(q.prompt)) {
      kinds.add('missing');
      const [x, y] = nums(q);
      assert.match(q.prompt, new RegExp(`Round ${pv.fmt(y)} to the nearest ten\\.$`));
      assert.equal(x % 10, 0);
      assert.equal(q.parts[1].answer, x - roundTo(y, 10));
    } else if (/each of 2/.test(q.prompt)) {
      kinds.add('twostep');
      assert.match(q.prompt, /Round each number to the nearest ten\.$/);
      const [x, y] = nums(q);
      assert.equal(q.parts[1].answer, roundTo(x, 10) - 2 * roundTo(y, 10));
    } else if (/still needs/.test(q.prompt)) kinds.add('needs');
    else if (op === SUB) kinds.add('sub');
    assert.ok(!L._leaks(q));
  }
  assert.deepEqual([...kinds].sort(), ['add', 'missing', 'needs', 'sub', 'twostep']);
});

test('Learn step 6: sums and differences, wrong answers far from the estimate, choices never print the estimate', () => {
  const step = L.seeIt.steps[5];
  const ops = new Set(), keys = new Set();
  for (let s = 1; s <= SEEDS; s++) {
    const q = step.check(pv.rng(s));
    const m = q.prompt.match(/^Kim says ([\d,]+) ([+−]) ([\d,]+) = ([\d,]+)\./);
    const [a, b, c] = [m[1], m[3], m[4]].map((t) => Number(t.replace(/,/g, '')));
    const op = m[2];
    ops.add(op);
    const est = op === '+' ? roundTo(a, 100) + roundTo(b, 100) : roundTo(a, 100) - roundTo(b, 100);
    const exact = op === '+' ? a + b : a - b;
    if (op === '−') assert.ok(a > b && roundTo(a, 100) > roundTo(b, 100));
    assert.equal(q.parts[0].answer, est);
    assert.ok(c > 0);
    if (c === exact) assert.equal(q.parts[1].answer, 'Yes. It is close to the estimate.');
    else { assert.ok(Math.abs(c - est) > 150, `${c} vs ${est}`); assert.equal(q.parts[1].answer, NO); }
    keys.add(q.parts[1].answer);
    q.parts[1].choices.forEach((ch) => assert.ok(!/\d/.test(ch)));
  }
  assert.equal(ops.size, 2);
  assert.equal(keys.size, 2);
});

test('the full key grades right and a typical mistake grades wrong', () => {
  for (const q of L.bank) {
    assert.ok(Q.grade(q, Q.correctResponse(q)), q.id);
    const r = Q.correctResponse(q);
    const i = q.parts.findIndex((p) => p.kind === 'num');
    r[i] = String(Number(String(r[i]).replace(/,/g, '')) + 10);
    assert.ok(!Q.grade(q, r), q.id + ' off by 10');
  }
});
