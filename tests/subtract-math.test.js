// Unit tests for SubtractKit.math (assets/js/subtract/sub-math.js): exchanges keep the value, the standard method,
// difficulty rules, supported combinations, generation, reading/grading, mistakes, hints. Expected values are written
// out by hand or computed with plain arithmetic (top − bottom, Σ amount·10^i), not with the functions under test.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/js/subtract/sub-math.js');

const val = (a) => a.reduce((s, x, i) => s + x * Math.pow(10, i), 0);

test('the spec examples: answers, difficulty, and the four lines for 3,002 − 1,578', () => {
  assert.equal(M.plan(4352, 2126).answer, 2226); assert.equal(M.classify(4352, 2126).difficulty, 'easy');
  assert.equal(M.plan(4532, 1768).answer, 2764); assert.equal(M.classify(4532, 1768).difficulty, 'medium');
  assert.equal(M.plan(3002, 1578).answer, 1424); assert.equal(M.classify(3002, 1578).difficulty, 'hard');
  const p = M.plan(3002, 1578);
  assert.deepEqual([M.digitsOf(3002, 4)].concat(p.exchanges.map((e) => e.after)).map(M.describe), [
    '3 thousands, 0 hundreds, 0 tens, 2 ones',
    '2 thousands, 10 hundreds, 0 tens, 2 ones',
    '2 thousands, 9 hundreds, 10 tens, 2 ones',
    '2 thousands, 9 hundreds, 9 tens, 12 ones']);
  assert.deepEqual(p.columns.map((c) => c.digit), [4, 2, 4, 1]); // 12−8, 9−7, 9−5, 2−1
});

test('every exchange keeps the value; the giver loses 1, the receiver gains 10; invalid exchanges change nothing', () => {
  const a = [2, 0, 0, 3];
  const r = M.exchange(a, 3);
  assert.deepEqual(r.amounts, [2, 0, 10, 2]); assert.deepEqual(a, [2, 0, 0, 3], 'input untouched');
  assert.equal(val(r.amounts), 3002);
  assert.equal(M.exchange([2, 0, 0, 3], 1).ok, false); assert.equal(M.exchange([2, 0, 0, 3], 1).reason, 'nothing-to-give');
  assert.equal(M.exchange([2, 5], 0).reason, 'no-place'); assert.equal(M.exchange([2, 5], 2).reason, 'no-place');
  // Amounts above 9 are allowed and still exchange.
  assert.deepEqual(M.exchange([2, 0, 10, 2], 2).amounts, [2, 10, 9, 2]);
  const r2 = M.rng(1);
  for (let n = 0; n < 3000; n++) {
    const am = [0, 1, 2, 3].map(() => Math.floor(r2() * 20));
    const from = 1 + Math.floor(r2() * 3);
    const e = M.exchange(am, from);
    if (am[from] < 1) { assert.equal(e.ok, false); continue; }
    assert.equal(val(e.amounts), val(am)); assert.equal(e.amounts[from], am[from] - 1); assert.equal(e.amounts[from - 1], am[from - 1] + 10);
  }
});

test('the standard method on 20,000 random problems: right answers, valid adjacent exchanges, digits 0–9', () => {
  const r = M.rng(42);
  for (let n = 0; n < 20000; n++) {
    const top = 10 + Math.floor(r() * 9990), bottom = Math.floor(r() * (top + 1));
    const p = M.plan(top, bottom);
    assert.equal(p.answer, top - bottom);
    assert.equal(p.columns.reduce((s, c) => s + c.digit * Math.pow(10, c.place), 0), top - bottom, `${top} − ${bottom}`);
    for (const c of p.columns) assert.ok(c.digit >= 0 && c.digit <= 9);
    for (const e of p.exchanges) {
      assert.equal(e.to, e.from - 1); assert.equal(val(e.after), top);
      assert.equal(e.after[e.from], e.before[e.from] - 1); assert.equal(e.after[e.to], e.before[e.to] + 10);
    }
    // Zero chains pass through every zero, one place at a time.
    for (const c of p.columns.filter((x) => x.needs)) {
      assert.equal(c.exchanges.length, c.supplier - c.place);
      for (let k = c.place + 1; k < c.supplier; k++) assert.equal(c.before[k], 0, 'only zeros are passed through');
    }
  }
});

test('difficulty rules (hand-checked) and supported combinations', () => {
  const cases = [[6487, 2135, 'none'], [75, 75, 'none'], [52, 27, 'easy'], [463, 128, 'easy'], [532, 168, 'medium'], [5264, 1839, 'medium'],
    [4305, 1268, 'hard', 1], [3002, 1578, 'hard', 2], [500, 237, 'hard', 1], [7000, 1, 'hard', 2], [1000, 999, 'hard', 2], [901, 9, 'hard', 1], [910, 9, 'easy']];
  for (const [a, b, d, ch] of cases) { const c = M.classify(a, b); assert.equal(c.difficulty, d, `${a} − ${b}`); if (ch) assert.equal(c.chain, ch, `${a} − ${b} chain`); }
  assert.deepEqual(M.supported(2), ['easy']);
  assert.deepEqual(M.supported(3), ['easy', 'medium', 'hard']); assert.deepEqual(M.supported(4), ['easy', 'medium', 'hard']);
  assert.match(M.unavailableReason(2, 'hard'), /at least three digits/);
  assert.match(M.unavailableReason(2, 'medium'), /only need one exchange/);
  for (const ok of [[2, 'easy'], [2, 'mixed'], [3, 'hard'], ['mixed', 'hard'], [4, 'medium']]) assert.equal(M.unavailableReason(...ok), '');
  // Exhaustive: no 2-digit problem is medium or hard.
  for (let t = 10; t <= 99; t++) for (let b = 0; b <= t; b++) assert.ok(['none', 'easy'].includes(M.classify(t, b).difficulty));
  assert.throws(() => M.plan(5, 7)); assert.throws(() => M.plan(10000, 1)); assert.throws(() => M.plan(3.5, 1));
});

test('sessions: the asked size and difficulty, no duplicates, mixed size ≥ half 4-digit, mixed difficulty includes no-regrouping', () => {
  for (const size of [2, 3, 4]) for (const difficulty of ['easy', 'medium', 'hard']) for (const length of [10, 25, 50]) {
    const s = M.generateSession({ size, difficulty, length, seed: size * 100 + length });
    if (M.unavailableReason(size, difficulty)) { assert.equal(s.items.length, 0); assert.ok(s.error); continue; }
    assert.equal(s.items.length, length, `${size} ${difficulty} ${length}`);
    assert.equal(new Set(s.items.map((q) => q.top + '-' + q.bottom)).size, length, 'no duplicate pairs');
    for (const q of s.items) {
      assert.equal(String(q.top).length, size, 'top has the asked number of digits');
      assert.ok(q.bottom <= q.top && q.bottom >= 1 && q.top <= 9999);
      assert.equal(M.classify(q.top, q.bottom).difficulty, difficulty);
    }
  }
  for (let seed = 1; seed <= 20; seed++) {
    const s = M.generateSession({ size: 'mixed', difficulty: 'mixed', length: 50, seed });
    assert.equal(s.items.length, 50);
    assert.ok(s.items.filter((q) => String(q.top).length === 4).length >= 25, 'at least half 4-digit');
    const kinds = new Set(s.items.map((q) => M.classify(q.top, q.bottom).difficulty));
    for (const k of ['none', 'easy', 'medium', 'hard']) assert.ok(kinds.has(k), `mixed has ${k}`);
  }
  const hard4 = M.generateSession({ size: 4, difficulty: 'hard', length: 50, seed: 9 }).items;
  assert.ok(hard4.some((q) => q.chain === 1) && hard4.some((q) => q.chain >= 2), 'hard 4-digit has one zero and zeros next to each other');
  const easy4 = M.generateSession({ size: 4, difficulty: 'easy', length: 50, seed: 9 }).items;
  assert.ok(new Set(easy4.map((q) => M.classify(q.top, q.bottom).regroupColumns[0])).size >= 3, 'exchange positions vary');
});

test('reading answers: empty is not 0, gaps are incomplete, leading zeros are fine, letters are invalid', () => {
  assert.deepEqual(M.readAnswer(['', '', '', '']), { status: 'empty', value: null });
  assert.deepEqual(M.readAnswer([]), { status: 'empty', value: null });
  assert.equal(M.readAnswer(['4', '', '4', '1']).status, 'incomplete');
  assert.deepEqual(M.readAnswer(['4', '2', '4', '1']), { status: 'ok', value: 1424 });
  assert.deepEqual(M.readAnswer(['5', '2', '0', '0']), { status: 'ok', value: 25 }, 'leading zeros accepted');
  assert.deepEqual(M.readAnswer(['5', '2', '', '']), { status: 'ok', value: 25 }, 'leading zeros not required');
  assert.deepEqual(M.readAnswer(['0', '', '', '']), { status: 'ok', value: 0 });
  assert.equal(M.readAnswer(['x', '1']).status, 'invalid'); assert.equal(M.readAnswer(['12']).status, 'invalid');
  assert.equal(M.gradeFinal(3002, 1578, ['4', '2', '4', '1']).correct, true);
  assert.equal(M.gradeFinal(3002, 1578, ['4', '2', '4', '0']).status, 'wrong');
  assert.equal(M.gradeFinal(3002, 1578, []).status, 'empty');
  assert.equal(M.readAmount('12'), 12); assert.equal(M.readAmount(' 9 '), 9); assert.equal(M.readAmount(''), null); assert.ok(Number.isNaN(M.readAmount('1a'))); assert.ok(Number.isNaN(M.readAmount('100')));
});

test('regrouping-step answers: any value-keeping set that covers every column is right', () => {
  assert.equal(M.checkAmounts(3002, 1578, [12, 9, 9, 2]).ok, true, 'standard');
  assert.equal(M.checkAmounts(3002, 1578, [12, 19, 8, 2]).ok, true, 'a different valid way');
  assert.equal(M.checkAmounts(3002, 1578, [12, 10, 9, 2]).ok, false, 'value changed');
  assert.equal(M.checkAmounts(3002, 1578, [2, 0, 0, 3]).covers, false, 'still needs an exchange');
  assert.equal(M.checkAmounts(3002, 1578, [12, 9, 9]).complete, false);
});

test('evaluating marks: valid, a different valid way, and the three named mistakes', () => {
  assert.deepEqual(M.evaluateWork(3002, 1578, {}), { status: 'none' });
  assert.deepEqual(M.evaluateWork(3002, 1578, { 3: [2], 2: [10] }), { status: 'valid', standard: true });
  assert.deepEqual(M.evaluateWork(3002, 1578, { 3: [2], 2: [10, 9], 1: [10, 9], 0: [12] }), { status: 'valid', standard: true });
  assert.deepEqual(M.evaluateWork(532, 168, { 2: [4], 1: [13] }), { status: 'valid', standard: false }, 'valid but not the standard order');
  assert.equal(M.evaluateWork(5264, 1839, { 0: [14] }).issue, 'no-reduce');
  assert.equal(M.evaluateWork(3002, 1578, { 3: [2], 0: [12] }).issue, 'skip-zero');
  assert.equal(M.evaluateWork(3002, 1578, { 3: [2], 2: [10], 1: [10], 0: [12] }).issue, 'zero-ten');
});

test('practice diagnosis from the child\'s own work', () => {
  const kinds = (t, b, w) => M.diagnose(t, b, w).map((x) => x.kind);
  assert.ok(kinds(5264, 1839, { ann: {}, d: ['5', '3', '6', '4'] }).includes('smaller-from-larger'));
  assert.ok(kinds(5264, 1839, { ann: { 1: [5], 0: [14] }, d: ['5', '3', '4', '3'] }).includes('original-digit'));
  assert.ok(kinds(6487, 235, { ann: {}, d: ['7', '3', '1', '4'] }).includes('misaligned'));
  assert.deepEqual(kinds(3002, 1578, { ann: {}, d: ['4', '2', '4', '1'] }), [], 'correct work has no issues');
  assert.deepEqual(kinds(3002, 1578, { ann: {}, d: ['', '', '', ''] }), [], 'empty work has no issues');
});

test('someone else\'s work: each mistake gives a different wrong answer (independent arithmetic)', () => {
  assert.equal(M.buggyWork(5264, 1839, 'smaller-from-larger').answer, 4635); // |4−9| 5, 6−3 3, |2−8| 6, 5−1 4
  assert.equal(M.buggyWork(5264, 1839, 'no-reduce').answer, 4435); // 14−9 5, 6−3 3, 12−8 4, 5−1 4
  assert.equal(M.buggyWork(3002, 1578, 'zero-ten').answer, 1534); // 12−8 4, 10−7 3, 10−5 5, 2−1 1
  assert.equal(M.buggyWork(6487, 235, 'misaligned').answer, 6487 - 2350);
  assert.equal(M.buggyWork(6487, 2135, 'no-reduce'), null, 'no exchange → this mistake cannot happen');
  const r = M.rng(5);
  for (let n = 0; n < 3000; n++) {
    const top = 1000 + Math.floor(r() * 9000), bottom = 1 + Math.floor(r() * top);
    for (const bug of ['smaller-from-larger', 'no-reduce', 'original-digit', 'zero-ten', 'misaligned']) {
      const w = M.buggyWork(top, bottom, bug);
      if (!w) continue;
      assert.notEqual(w.answer, top - bottom); assert.ok(w.answer >= 0);
      assert.equal(w.d.reduce((s, x, i) => s + Number(x) * Math.pow(10, i), 0), w.answer);
    }
  }
});

test('hints: five levels, level 1 never shows the answer, level 5 is the full solution', () => {
  const h = M.hints(3002, 1578, { d: [] });
  assert.equal(h.place, 0); assert.equal(h.levels.length, 5);
  assert.ok(!/1,424|1424/.test(h.levels[0]) && !/\b4\b.*ones/.test(h.levels[0]));
  assert.match(h.levels[1], /tens and hundreds places have 0/);
  assert.match(h.levels[2], /Exchange 1 thousand for 10 hundreds\. Exchange 1 hundred for 10 tens\. Exchange 1 ten for 10 ones\./);
  assert.match(h.levels[4], /So 3,002 − 1,578 = 1,424\./);
  assert.equal(M.hints(3002, 1578, { d: ['4'] }).place, 1, 'moves on to the next unfinished column');
  const r = M.rng(8);
  for (let n = 0; n < 3000; n++) {
    const top = 100 + Math.floor(r() * 9900), bottom = Math.floor(r() * top);
    const l1 = M.hints(top, bottom, { d: [] }).levels[0];
    // Level 1 only names the column and two numbers taken from the problem itself, never a result.
    assert.match(l1, /^Look at the (ones|tens|hundreds|thousands) column\. Is \d+ enough to take away \d\?$/, `${top} − ${bottom}`);
  }
});
