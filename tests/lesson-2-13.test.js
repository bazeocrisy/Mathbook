// Unit tests for Lesson 2-13 (Compare 4-Digit Numbers): the hand-checked answer key from docs/chapter-2/lessons/2-13.md
// §6–§8, reason choices that name a place and never give the symbol away (D-7), number-line dots, and the Learn
// generator rules. Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-13/lesson.js');

const { pv } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-13'];
const NO = 'No place — every digit is the same';
const keyOf = (q) => q.parts.map((p) => p.answer);
const num = (s) => Number(String(s).replace(/,/g, ''));

const GUIDED = {
  p1: ['B', '>'], p2: ['A', '<'], p3: ['=', NO], p4: ['≠', 'Tens'], p5: ['>', 'Thousands'], p6: ['<', 'Hundreds'],
  p7: ['>'], p8: ['<'], p9: ['>'], p10: ['<', 'No. 863 has 0 thousands. Compare the thousands first.'],
  p11: ['the 3,475 L tank', '>'], p12: ['3,947', '4,598', '4,615']
};
const PRACTICE = {
  o1: ['A', '<'], o2: ['B', '>'], o3: ['=', NO], o4: ['≠', 'Tens'], o5: ['>', 'Thousands'], o6: ['<', 'Hundreds'],
  o7: ['>'], o8: ['<'], o9: ['<'], o10: ['<', 'No. 594 has 0 thousands. Compare the thousands first.'],
  o11: ['the 1,850 m bridge', '>'], o12: ['4,999', '5,230', '5,302']
};
const TEST = {
  t1: [['B', '<'], 'line'], t2: [['A', '>'], 'line'], t3: [['=', NO], 'equal'], t4: [['≠', 'Tens'], 'equal'],
  t5: [['>', 'Thousands'], 'pv'], t6: [['<', 'Hundreds'], 'pv'], t7: [['>'], 'digits'], t8: [['<'], 'pv'], t9: [['<'], 'pv'],
  t10: [['<', 'No. 748 has 0 thousands. Compare the thousands first.'], 'digits'],
  t11: [['the library with 6,319 books', '<'], 'real'], t12: [['2,097', '2,709', '2,790'], 'order']
};

/** Every part is right for its numbers: symbols, the place that decides, the dot, Least/Middle/Greatest. */
function selfCheck(q) {
  const sp = q.parts.find((p) => p.kind === 'symbol');
  if (sp) {
    const { left: a, right: b } = sp;
    const want = sp.choices.includes('≠') ? (a === b ? '=' : '≠') : a > b ? '>' : a < b ? '<' : '=';
    assert.equal(sp.answer, want, q.id + ' symbol');
    for (const p of q.parts.filter((x) => /^Which place/.test(x.label || ''))) {
      const k = L._firstDiff(a, b);
      assert.equal(p.answer, k < 0 ? NO : ['Thousands', 'Hundreds', 'Tens', 'Ones'][k], q.id + ' place');
      for (const c of p.choices) assert.ok(!/greater|less|[<>]/.test(c), q.id + ' place choices name no symbol');
    }
  }
  const dot = q.parts.find((p) => /^Which dot shows/.test(p.label || ''));
  if (dot) {
    const v = num(dot.label.match(/shows ([\d,]+)/)[1]);
    assert.equal(q.figure.points.find((pt) => pt.text === dot.answer).v, v, q.id + ' dot');
    const xs = q.figure.points.map((pt) => pt.v);
    assert.ok(xs.every((x) => x > q.figure.min && x < q.figure.max), q.id + ' dots on the line');
  }
  const ord = q.parts.filter((p) => /^(Least|Middle|Greatest):$/.test(p.label));
  if (ord.length) {
    const sorted = ord[0].choices.map(num).sort((x, y) => x - y);
    ord.forEach((p, i) => assert.equal(num(p.answer), sorted[i], q.id + ' ' + p.label));
  }
  for (const p of q.parts) if (p.choices) assert.equal(new Set(p.choices).size, p.choices.length, q.id + ' choices are distinct');
}

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED));
  for (const q of L.guided) { assert.deepEqual(keyOf(q), GUIDED[q.id], q.id); selfCheck(q); }
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) { assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id); selfCheck(q); }
});

test('Comparing Test matches the key (T1–T12) and skills; choices shuffle; no hints', () => {
  const T = L.tests.compare;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual(keyOf(q), TEST[q.id][0], q.id); assert.equal(q.skill, TEST[q.id][1]); assert.ok(!q.hint && !q.parent); selfCheck(q); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[9].parts[1].choices.join('|'))).size > 1, 't10 choices shuffle');
});

test('every test skill has On My Own practice and a Learn step', () => {
  const learn = new Set(L.seeIt.steps.map((s) => s.check(pv.rng(1)).skill));
  for (const s of new Set(L._testItems.map((q) => q.skill))) {
    assert.ok(L.bank.some((q) => q.skill === s), s);
    assert.ok(learn.has(s) || s === 'real', 'taught: ' + s);
  }
});

test('D-7: the error-analysis key never says "less" or "greater"', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.skill === 'digits' && x.parts[1])) assert.ok(!/less|greater|[<>]/.test(q.parts[1].answer), q.id);
});

test('explanations: every "x ? y" comparison is true', () => {
  const ok = { '<': (a, b) => a < b, '>': (a, b) => a > b, '=': (a, b) => a === b, '≠': (a, b) => a !== b };
  for (const q of L.guided.concat(L.bank, L._testItems)) {
    for (const m of q.explanation.matchAll(/(\d[\d,]*) ([<>=≠]) (\d[\d,]*)/g)) assert.ok(ok[m[2]](num(m[1]), num(m[3])), `${q.id}: ${m[0]}`);
  }
});

test('Learn generators follow the spec, stay in range and never repeat the demo numbers', () => {
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 2000; seed++) {
    const q = s.check(pv.rng(seed));
    assert.ok(!L._leaks(q), `${s.id} ${seed}`);
    selfCheck(q);
    const sp = q.parts.find((p) => p.kind === 'symbol');
    const ns = sp ? [sp.left, sp.right] : q.parts[0].choices.map(num);
    for (const n of ns) { assert.ok(n >= 100 && n <= 9999, `${s.id} ${seed} range ${n}`); assert.ok(!L._demo.includes(n), `${s.id} ${seed} demo ${n}`); }
  }
  const syms = {}, places = {}, dots = {};
  for (let seed = 1; seed <= 600; seed++) {
    const [s1, s2, s3, s4] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    dots[s1.parts[0].answer] = 1; syms[s2.parts[1].answer] = 1; places[s2.parts[0].answer] = 1; syms[s3.parts[0].answer] = 1;
    assert.equal(s4.parts[0].answer, s4.parts[0].left < s4.parts[0].right ? '<' : '>');
  }
  assert.deepEqual(Object.keys(dots).sort(), ['A', 'B']);
  assert.deepEqual(Object.keys(syms).sort(), ['<', '=', '>', '≠']);
  assert.equal(Object.keys(places).length, 4, 'every place can decide');
});

test('review fixes L213-01…02', () => {
  // L213-01: the story and the last question name the same thing.
  for (let seed = 1; seed <= 600; seed++) {
    const q = L.seeIt.steps[4].check(pv.rng(seed));
    const thing = q.prompt.match(/^Three (\w+)s are/)[1];
    assert.equal(q.parts[3].label, `Which ${thing} is longest?`, `seed ${seed}`);
  }
  // L213-02: the deciding place is explained with its value, not bare digits.
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.skill === 'pv' || x.skill === 'line')) {
    const m = q.explanation.match(/(Thousands|Hundreds|Tens|Ones): (\d) (thousand|hundred|ten|one)s? [<>] (\d) \3s?/);
    if (/Thousands \d = \d, hundreds \d = \d, tens \d = \d/.test(q.explanation) || /farther right/.test(q.explanation)) continue;
    assert.ok(m, q.id + ': ' + q.explanation);
  }
  assert.match(L.guided[7].explanation, /6 tens < 9 tens \(60 < 90\)/);
});
