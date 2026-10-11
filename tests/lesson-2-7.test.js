// Unit tests for Lesson 2-7 (Decompose to Subtract): the hand-checked answer key from docs/chapter-2/lessons/2-7.md
// §6–§8 and §12, the B-01 rule (empty or 0 tree parts are left out) as this lesson uses it, "subtract two ways",
// the connected "decompose + why" pairs (B-02), and the Learn generator rules.
// Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-7/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-7'];
const R = (v, t) => ({ v, t: t || [] });

/** What the child must produce: trees → 'trees n'; subtract → the difference (with 'given' parts or 'x2' ways); parts → part answers. */
function keyOf(q) {
  if (q.type === 'chain' && q.preset === 'trees') return ['trees', q.n];
  if (q.type === 'chain') return ['steps', q.a - q.b, q.tree && q.tree.given ? q.tree.given.join('+') : q.ways === 2 ? 'x2' : 'own'];
  return q.parts.map((p) => p.answer);
}

const GUIDED = {
  pt1: ['trees', 258], pt2: ['steps', 227, '200+30+5'], pt3: ['steps', 278, 'own'], pt4: ['steps', 347, 'x2'],
  pt5: ['200 + 20 = 220, not 202. She should use 200 and 2.', 266],
  pt6: ['Yes. The parts still add to 314, so the order doesn\'t matter.', 213],
  pt7: [243, 124, 119], pt8: ['steps', 148, 'own']
};
const PRACTICE = {
  o1: ['trees', 438], o2: ['trees', 765], o3: ['steps', 345, 'own'],
  o3b: ['Each part is a hundreds, tens or ones part, and each one is easy to take away.'],
  o4: ['steps', 268, 'own'], o4b: ['Taking away 428 first lands on a hundred, a friendly number.'],
  o5: ['steps', 223, 'own'], o6: ['steps', 227, 'own'], o7: ['steps', 318, 'own'], o8: ['steps', 284, 'own'],
  o9: ['100 + 30 = 130, not 103. Use 100 and 3.', 473], o10: [209, 132, 77], o11: ['steps', 189, 'own'],
  o12: ['Yes. The parts still add to 425, so the order doesn\'t matter.', 224], o13: ['steps', 374, 'x2']
};
const TEST = {
  t1: [['trees', 592], 'decompose'], t2: [['steps', 322, 'own'], 'placevalue'],
  t2b: [['Each part is a hundreds, tens or ones part, and each one is easy to take away.'], 'friendly'],
  t3: [['steps', 343, 'own'], 'placevalue'], t4: [['steps', 278, 'own'], 'regroup'], t5: [['steps', 258, 'own'], 'regroup'],
  t6: [['steps', 346, 'own'], 'regroup'], t7: [['steps', 485, 'x2'], 'twoways'],
  t8: [['100 + 40 = 140, not 104. Use 100 and 4.', 585], 'error'], t9: [[302, 187, 115], 'table'], t10: [['steps', 188, 'own'], 'word'],
  t11: [['Yes. The parts still add to 532, so the order doesn\'t matter.', 335], 'order'], t12: [['124 + 72', 328], 'friendly']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('pt9'));
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Decompose to Subtract Test matches the key (T1–T12, with T2 as a connected pair); choices shuffle; no hints', () => {
  const T = L.tests.decompose;
  assert.equal(T.questions, 13);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) {
      assert.deepEqual([keyOf(q), q.skill], TEST[q.id], q.id);
      assert.ok(!q.hint && !q.parent, `${q.id}: no hint`);
    }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s).find((q) => q.id === 't12').parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('every skill on the test has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('spec §12 by hand: the worked steps in explanations are right', () => {
  const all = L.guided.concat(L.bank, L._testItems).filter((q) => q.type !== 'explain');
  for (const q of all) {
    for (const m of q.explanation.matchAll(/([\d,]+) − ([\d,]+) = ([\d,]+)/g)) {
      const [x, y, z] = [m[1], m[2], m[3]].map((t) => Number(t.replace(/,/g, '')));
      assert.equal(x - y, z, `${q.id}: ${m[0]}`);
    }
    for (const m of q.explanation.matchAll(/(?<![\d,] \+ )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) {
      const sum = m[1].split(' + ').reduce((x, y) => x + Number(y.replace(/,/g, '')), 0);
      assert.equal(sum, Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    }
  }
  // T12: only 124 + 72 lands on a hundred.
  assert.equal(524 - 124, 400); [100, 120, 96].forEach((p) => assert.notEqual((524 - p) % 100, 0));
  assert.equal(124 + 72, 196); assert.equal(120 + 76, 196); assert.equal(96 + 100, 196);
});

test('B-01: empty or 0 parts are left out (spec §13 unit tests)', () => {
  const t3 = L._testItems.find((q) => q.id === 't3'); // 953 − 610
  assert.ok(Q.grade(t3, R({ r0: '353', r1: '343', f: '343' }, [['600', '10', '0']])), '600 / 10 / 0 with steps 353, 343');
  const o4 = L.bank.find((q) => q.id === 'o4'); // 728 − 460
  assert.ok(Q.grade(o4, R({ r0: '328', r1: '268', f: '268' }, [['400', '60', '0']])), '400 / 60 / 0 with steps 328, 268');
  assert.ok(Q.isAnswered(o4, R({ r0: '328', r1: '268', f: '268' }, [['400', '60', '']])));
  assert.ok(!Q.grade(t3, R({ r0: '343', f: '343' }, [['610', '0', '']])), 'one non-zero part is not broken apart');
  assert.equal(Q.check(t3, R({ r0: '343', f: '343' }, [['610', '0', '']])).msg, 'Write at least 2 parts that add to 610.');
  // Parts that don't add back, and a step from the wrong start (each step starts from the last answer).
  assert.equal(Q.check(o4, R({ r0: '628', r1: '568', f: '268' }, [['100', '60']])).msg, 'Your parts add to 160, not 460.');
  const fromStart = Q.check(L._testItems.find((q) => q.id === 't4'), R({ r0: '316', r1: '486', r2: '508', f: '278' }, [['200', '30', '8']]));
  assert.ok(!fromStart.ok && /Check 316 − 30\./.test(fromStart.msg), fromStart.msg);
});

test('review fixes L27-01…04: rows wait for their parts; left-out boxes get no marks; "Way n" tips; keys not first', () => {
  const pt4 = L.guided.find((q) => q.id === 'pt4'); // 634 − 287, two ways
  const blank = Q.render(pt4, 'k', { mode: 'guided' });
  assert.ok(!/is-skip/.test(blank), 'L27-01: nothing is greyed before any part is typed');
  assert.equal((blank.match(/class="ch-c ch-num">634</g) || []).length, 2, 'L27-01: only the first row of each way starts from 634');
  const o4 = L.bank.find((q) => q.id === 'o4'); // 728 − 460
  const zero = R({ r0: '328', r1: '268', f: '268' }, [['400', '60', '0']]);
  const res = Q.check(o4, zero);
  assert.ok(res.ok);
  assert.deepEqual(res.none.sort(), ['t:0:2', 'v:r2'], 'L27-02: the 0 part and its row are left out');
  const rv = Q.reviewHTML(o4, zero);
  assert.ok(/data-k="t:0:2">0<\/span>/.test(rv) && /data-k="v:r2">—<\/span>/.test(rv), 'L27-02: no ✓ on left-out boxes');
  assert.ok(/not used/.test(rv));
  const mid = R({ r0: '328', f: '268' }, [['400', '', '60']]);
  assert.ok(/ch-row is-skip/.test(Q.render(o4, 'k', { mode: 'guided', response: mid })), 'an empty part before a typed one is greyed');
  const pt1 = L.guided.find((q) => q.id === 'pt1');
  assert.equal(Q.emptyTip(pt1, R({}, [['200', '50', '8'], ['', '', '']])), 'Way 2: Write at least 2 parts that add to 258.', 'L27-03');
  for (const id of ['o3b', 'o4b']) { const p = L.bank.find((q) => q.id === id).parts[0]; assert.notEqual(p.choices.indexOf(p.answer), 0, `L27-04 ${id}`); }
});

test('subtract two ways: both right with different trees; the same tree twice is not two ways', () => {
  const t7 = L._testItems.find((q) => q.id === 't7'); // 743 − 258
  assert.ok(Q.grade(t7, R({ r0: '543', r1: '493', r2: '485', f: '485', w1r0: '500', w1r1: '485', f1: '485' }, [['200', '50', '8'], ['243', '15']])));
  assert.ok(!Q.grade(t7, R({ r0: '543', r1: '493', r2: '485', f: '485', w1r0: '735', w1r1: '685', w1r2: '485', f1: '485' }, [['200', '50', '8'], ['8', '50', '200']])));
  assert.ok(Q.grade(t7, Q.correctResponse(t7)));
});

test('the "why" questions name one tree and are graded on their own (B-02)', () => {
  for (const id of ['o3b', 'o4b']) {
    const q = L.bank.find((x) => x.id === id);
    assert.equal(q.parts.length, 1); assert.equal(q.figure.fig, 'tree');
    const i = L.bank.indexOf(q);
    assert.equal(L.bank[i - 1].type, 'chain', `${id} follows its subtraction`);
  }
});

test('no question prints a number the child must type (outside figures and tables)', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) if (q.skill !== 'table') assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 300; seed++) { const q = s.check(pv.rng(seed)); if (q.skill !== 'table') assert.ok(!L._leaks(q), `${s.id} ${seed}`); }
});

test('Learn: DS pairs follow the spec rules; step generators work for many seeds', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const [a, b] = L._dsPair(pv.rng(seed));
    assert.ok(a >= 300 && a <= 999 && b >= 101 && a - b >= 100, `${a} − ${b}`);
    assert.ok(b % 10 && Math.floor(b / 10) % 10, `${b}: tens and ones not 0`);
    assert.ok(b % 10 > a % 10 || Math.floor(b / 10) % 10 > Math.floor(a / 10) % 10, `${a} − ${b} regroups`);
    assert.ok(!L._demo.some(([x, y]) => x === a && y === b));
  }
  const s5 = L.seeIt.steps[4];
  for (let seed = 1; seed <= 300; seed++) {
    const q = s5.check(pv.rng(seed));
    const [a, b] = q.prompt.match(/([\d,]+) − ([\d,]+)/).slice(1).map(Number);
    assert.ok(a >= 200 && a <= 999 && b >= 101 && b <= 109 && a - b >= 91, q.prompt);
  }
  const s6 = L.seeIt.steps[5];
  for (let seed = 1; seed <= 300; seed++) {
    const q = s6.check(pv.rng(seed));
    const nums = q.figure.rows.map((r) => r[1]);
    assert.equal(new Set(nums).size, 4);
    const d = Math.max(...nums) - Math.min(...nums);
    assert.ok(d >= 40 && d <= 300 && q.parts[2].answer === d);
  }
  assert.deepEqual(L.seeIt.steps.map((s) => { const q = s.check(pv.rng(4)); return q.preset || q.type; }), ['trees', 'steps', 'steps', 'parts', 'parts', 'parts']);
  assert.ok(L.seeIt.steps[1].check(pv.rng(4)).tree.given, 'step 2: the place-value tree is given');
});
