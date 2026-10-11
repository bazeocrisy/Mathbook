// Unit tests for Lesson 2-8 (Adjust Numbers to Add or Subtract): the hand-checked answer key from
// docs/chapter-2/lessons/2-8.md §6–§8 and §12, adjust grading as this lesson uses it (adding: opposite moves;
// subtracting: same moves; any valid adjustment; swaps and no-change rejected), the number-line pictures (B-07),
// and the Learn generator rules. Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-8/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-8'];
const A = (na, nb, r) => ({ v: { na: String(na), nb: String(nb), r: String(r) }, t: [] });

/** adjust → ['adj', a op b, answer]; parts → part answers. */
function keyOf(q) {
  if (q.type === 'chain') { const plus = q.op === '+'; return ['adj', `${q.a} ${plus ? '+' : '−'} ${q.b}`, plus ? q.a + q.b : q.a - q.b]; }
  return q.parts.map((p) => (Array.isArray(p.answer) ? p.answer.slice().sort() : p.answer));
}
const fix = (t, n) => [t, n];

const GUIDED = {
  pt1: ['adj', '248 + 195', 443], pt2: ['adj', '364 − 198', 166], pt3: ['adj', '735 − 412', 323],
  pt4: ['She took 2 from 207 and gave 2 to 158, so 158 became 160, a friendly number.', 365],
  pt5: ['adj', '487 − 245', 242], pt5b: ['B'],
  pt6: ['No. He added 2 to both, so the sum is 4 too big.', 573],
  pt7: ['Sam. He added 2 to 148 and took 2 from 236.'],
  pt8: fix('Add 2, because he added 2 too few.', 865),
  pt9: ['adj', '712 − 634', 78],
  pt11: fix('Add 4, because he took away 4 too many.', 238)
};
const PRACTICE = {
  o1: ['adj', '381 − 99', 282], o2: ['adj', '147 + 228', 375], o3: ['adj', '958 − 423', 535], o4: ['adj', '297 + 356', 653],
  o5: ['adj', '583 − 317', 266], o6: ['adj', '138 + 149', 287],
  o7: ['He added 1 to 119 and took 1 from 208, so 119 became 120, a friendly number.', 327],
  o8: ['adj', '594 − 327', 267], o8b: ['A'],
  o9: [['337 − 120', '347 − 130', '350 − 133'], '347 − 130, because 130 ends in 0, so it is easy to take away.'],
  o10: ['Dev. He added 1 to 139 and took 1 from 268.'],
  o11: ['adj', '841 − 763', 78],
  o12: fix('Subtract 1, because she added 1 extra.', 823),
  o13: fix('Add 1, because he took away 1 too many.', 313),
  o14: ['No. She added 4 to both, so the sum is 8 too big.', 595]
};
const TEST = {
  t1: [['adj', '531 − 189', 342], 'sub'], t2: [['adj', '168 + 325', 493], 'add'], t3: [['adj', '876 − 541', 335], 'sub'],
  t4: [['adj', '499 + 237', 736], 'add'], t5: [['adj', '673 − 418', 255], 'sub'], t6: [['adj', '159 + 126', 285], 'add'],
  t7: [['She added 1 to 309 and took 1 from 147, so 309 became 310.', 456], 'describe'],
  t8: [['adj', '385 − 156', 229], 'numberline'], t8b: [['B'], 'numberline'],
  t9: [[['407 − 200', '427 − 220', '430 − 223'], '407 − 200, because 200 is a hundred, so it is easiest to take away.'], 'choose'],
  t10: [['Ben. He added 2 to 248 and took 2 from 127.'], 'compare'],
  t11: [['adj', '917 − 864', 53], 'story'],
  t12: [['Add 1, because she added 1 too few.', 939], 'fix'],
  t13: [['No. He added 4 to both, so the sum is 8 too big.', 790], 'error']
};

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), ['pt1', 'pt2', 'pt3', 'pt4', 'pt5', 'pt5b', 'pt6', 'pt7', 'pt8', 'pt9', 'pt10', 'pt11']);
  for (const q of L.guided) if (q.type !== 'explain') assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
});

test('Adjust Numbers Test matches the key (T1–T13, T8 as a pair); choices shuffle; no hints', () => {
  const T = L.tests.adjust;
  assert.equal(T.questions, 14);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual([keyOf(q), q.skill], TEST[q.id], q.id); assert.ok(!q.hint && !q.parent); }
  }
  const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => L.tests.adjust.generate(s).find((q) => q.id === 't13').parts[0].choices.join('|')));
  assert.ok(orders.size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('adding: opposite moves keep the sum; subtracting: same moves keep the difference (any valid adjustment)', () => {
  const add = L.guided.find((q) => q.id === 'pt1'); // 248 + 195
  assert.ok(Q.grade(add, A(243, 200, 443)));
  assert.ok(Q.grade(add, A(250, 193, 443)), 'any opposite move works');
  assert.ok(Q.grade(add, A(249, 194, 443)), 'even an unhelpful one (soft tip only)');
  assert.match(Q.note(add, A(249, 194, 443)), /ten or a hundred/);
  assert.match(Q.check(add, A(250, 197, 447)).msg, /same way\. In adding, one goes up and the other goes down/);
  assert.ok(!Q.grade(add, A(195, 248, 443)), 'a swap is not an adjustment');
  assert.ok(!Q.grade(add, A(248, 195, 443)), 'no change is not an adjustment');
  assert.ok(!Q.grade(add, A(443, 0, 443)), 'a 0 is not allowed');
  const sub = L.guided.find((q) => q.id === 'pt2'); // 364 − 198
  assert.ok(Q.grade(sub, A(366, 200, 166)));
  assert.ok(Q.grade(sub, A(356, 190, 166)), 'take the same from both');
  assert.match(Q.check(sub, A(362, 200, 162)).msg, /opposite ways\. In subtracting, change both the same way/);
  assert.ok(!Q.grade(sub, A(366, 200, 165)), 'the answer must be right');
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type === 'chain')) assert.ok(Q.grade(q, Q.correctResponse(q)), q.id);
});

test('number-line pictures (B-07): only the original ends are labelled; the right picture keeps the gap; the wrong one is 60 shorter', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.figure && x.figure.fig === 'pics')) {
    const [a, b] = q.prompt.match(/([\d,]+) − ([\d,]+)/).slice(1).map(Number);
    const right = q.parts[0].answer;
    q.figure.items.forEach((it) => {
      const [top, bottom] = it.fig.lines;
      assert.deepEqual(top.points.map((p) => p.v).sort((x, y) => x - y), [b, a].sort((x, y) => x - y));
      assert.ok(bottom.points.every((p) => p.text === ''), 'the ends of the moved gap are marked but not labelled');
      const len = bottom.bands[0].to - bottom.bands[0].from;
      assert.equal(len, it.label === right ? a - b : a - b - 60, `${q.id} ${it.label}`);
      [top, bottom].forEach((l) => l.bands.forEach((bd) => assert.equal(bd.text, '', 'no gap label')));
    });
    const html = Q.render(q, 'k', {});
    assert.ok(!html.includes(`>${pv.fmt(a - b)}<`), `${q.id}: the difference is never drawn`);
  }
});

test('one-number fixes: the direction depends on adding or subtracting', () => {
  assert.equal(L.guided.find((q) => q.id === 'pt8').parts[0].answer, 'Add 2, because he added 2 too few.');
  assert.equal(L.bank.find((q) => q.id === 'o12').parts[0].answer, 'Subtract 1, because she added 1 extra.');
  assert.equal(L.bank.find((q) => q.id === 'o13').parts[0].answer, 'Add 1, because he took away 1 too many.');
  for (let seed = 1; seed <= 300; seed++) {
    const q = L.seeIt.steps[4].check(pv.rng(seed));
    const m = q.prompt.match(/([\d,]+) ([+−]) ([\d,]+)\. \w+ changes only [\d,]+ to ([\d,]+) and gets ([\d,]+)/);
    const [a, op, b, nb, shown] = [Number(m[1]), m[2], Number(m[3]), Number(m[4]), Number(m[5])];
    const right = op === '+' ? a + b : a - b;
    assert.equal(shown, op === '+' ? a + nb : a - nb);
    assert.equal(q.parts[1].answer, right);
    const d = Math.abs(shown - right);
    assert.match(q.parts[0].answer, new RegExp(`^${shown > right ? 'Subtract' : 'Add'} ${d},`));
    assert.equal(new Set(q.parts[0].choices).size, 4);
  }
});

test('the spec §12 sums are right; explanations never contradict themselves', () => {
  const all = L.guided.concat(L.bank, L._testItems).filter((q) => q.type !== 'explain');
  for (const q of all) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )([\d,]+) ([+−]) ([\d,]+) = ([\d,]+)/g)) {
      const [x, y, z] = [m[1], m[3], m[4]].map((t) => Number(t.replace(/,/g, '')));
      assert.equal(m[2] === '+' ? x + y : x - y, z, `${q.id}: ${m[0]}`);
    }
  }
});

test('no question prints a number the child must type; Learn generators follow the spec', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 300; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
  for (let seed = 1; seed <= 300; seed++) {
    const q1 = L.seeIt.steps[0].check(pv.rng(seed));
    assert.equal(q1.parts[0].answer.length, 3); assert.equal(q1.parts[0].choices.length, 6);
    const q2 = L.seeIt.steps[1].check(pv.rng(seed));
    assert.ok(q2.op === '+' && q2.b % 10 >= 7 && q2.a % 10 >= 10 - (q2.b % 10) && q2.a + q2.b <= 999);
    const q3 = L.seeIt.steps[2].check(pv.rng(seed));
    assert.ok(q3.op === '−' && q3.a - q3.b >= 50 && [1, 2, 7, 8, 9].includes(q3.b % 10));
    const q6 = L.seeIt.steps[5].check(pv.rng(seed));
    assert.ok(q6.a - q6.b >= 20 && q6.a - q6.b <= 200 && q6.b % 10 >= 7);
  }
});
