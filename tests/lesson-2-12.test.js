// Unit tests for Lesson 2-12 (Solve Two-Step Problems): the hand-checked answer key from docs/chapter-2/lessons/2-12.md
// §6–§8 and §12, the diagram choices (C-4: only the right picture fits the equation), named step fields (C-2), and the
// Learn generator rules (C-3, C-6). Structure checks live in tests/lessons.test.js. Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-12/lesson.js');

const { pv } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-12'];
const sortA = (x) => (Array.isArray(x) ? x.slice().sort() : x);
const keyOf = (q) => q.parts.map((p) => (p.kind === 'choice' && /diagram matches/.test(p.label) ? 'pic:' + q.figure.items.find((it) => it.label === p.answer).fig.kind : sortA(p.answer)));

const GUIDED = {
  p1: ['320 + 455 = a', 775], p2: [['742 − 518 = b', '518 + b = 742'], 224], p3: ['pic:cmp', 354], p4: ['pic:ppw', 450],
  p5: [694, 344], p6: [383, 117], p7: [48], p8: [395, 633], p9: [342], p10: [537], p11: [290], p12: [300], p13: [null, 677]
};
const PRACTICE = {
  o1: ['280 + 435 = a', 715], o2: [['836 − 609 = b', '609 + b = 836'], 227], o3: ['pic:cmp', 347], o4: ['pic:ppw', 520],
  o5: [814, 375], o6: [19], o7: [379, 593], o8: [322], o9: [438], o10: [295], o11: [200], o12: [null, 669]
};
const TEST = {
  t1: [['345 + 290 = a', 635], 'diagram'], t2: [[['914 − 658 = b', '658 + b = 914'], 256], 'diagram'], t3: [['pic:cmp', 365], 'diagram'], t4: [['pic:ppw', 750], 'diagram'],
  t5: [[475, 125], 'twostep'], t6: [[200], 'twostep'], t7: [[46], 'twostep'], t8: [[471, 813], 'twostep'], t9: [[343], 'letters'], t10: [[567], 'letters'],
  t11: [[320], 'backward'], t12: [[null, 494], 'sense']
};
function check(q, want) {
  const k = keyOf(q);
  assert.equal(k.length, want.length, q.id);
  want.forEach((w, i) => { if (w !== null) assert.deepEqual(k[i], sortA(w), `${q.id} part ${i}`); });
}

test('Practice Together and On My Own match the hand-checked key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED).concat('p14'));
  for (const q of L.guided) if (q.type !== 'explain') check(q, GUIDED[q.id]);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) check(q, PRACTICE[q.id]);
  for (const q of L.guided.concat(L.bank)) if (q.skill === 'sense') assert.match(q.parts[0].answer, /How many in all\?$/, q.id);
});

test('Two-Step Problems Test matches the key (T1–T12) and skills; choices shuffle; no hints', () => {
  const T = L.tests.twostep;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { check(q, TEST[q.id][0]); assert.equal(q.skill, TEST[q.id][1]); assert.ok(!q.hint && !q.parent); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[11].parts[0].choices.join('|'))).size > 1);
});

test('every test skill has On My Own practice', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
});

test('diagram choices (C-4): exactly the keyed picture fits the equation; the letter value is right', () => {
  const all = L.guided.concat(L.bank, L._testItems);
  for (let seed = 1; seed <= 300; seed++) all.push(L.seeIt.steps[3].check(pv.rng(seed)));
  const answers = {};
  for (const q of all.filter((x) => x.figure && x.figure.fig === 'pics')) {
    const m = q.prompt.match(/shows ([\d,]+) ([+−]) ([ab]) = ([\d,]+)/);
    const [x, op, y] = [Number(m[1].replace(/,/g, '')), m[2], Number(m[4].replace(/,/g, ''))];
    for (const it of q.figure.items) {
      const f = it.fig;
      // x − b = y: compare bar, x on top, y below, dashed b.  x + a = y: one bar x | a, bracket y.
      const fits = op === '−'
        ? f.kind === 'cmp' && f.long === x && f.short === y && !!(f.gap && f.gap.letter === 'b')
        : f.kind === 'ppw' && f.whole === y && f.parts[0] === x && !!(f.parts[1] && f.parts[1].letter === 'a');
      assert.equal(fits, it.label === q.parts[0].answer, `${q.id} ${it.label}`);
    }
    assert.equal(q.parts[1].answer, op === '−' ? x - y : y - x, q.id);
    answers[q.parts[0].answer] = (answers[q.parts[0].answer] || 0) + 1;
  }
  assert.ok(answers.A > 50 && answers.B > 50 && answers.C > 50, `answer positions spread: ${JSON.stringify(answers)}`);
});

test('explanations: every "x + y = s" and "x − y = s" is right', () => {
  for (const q of L.guided.concat(L.bank, L._testItems).filter((x) => x.type !== 'explain')) {
    for (const m of q.explanation.matchAll(/(?<![\d,] [+−] )((?:[\d,]+ \+ )+[\d,]+) = ([\d,]+)/g)) assert.equal(m[1].split(' + ').reduce((s, t) => s + Number(t.replace(/,/g, '')), 0), Number(m[2].replace(/,/g, '')), `${q.id}: ${m[0]}`);
    for (const m of q.explanation.matchAll(/(?<![\d,] − )([\d,]+) − ([\d,]+) = ([\d,]+)/g)) assert.equal(Number(m[1].replace(/,/g, '')) - Number(m[2].replace(/,/g, '')), Number(m[3].replace(/,/g, '')), `${q.id}: ${m[0]}`);
  }
});

test('Learn generators follow the spec and never print an answer', () => {
  for (const q of L.guided.concat(L.bank, L._testItems)) assert.ok(!L._leaks(q), q.id);
  for (const s of L.seeIt.steps) for (let seed = 1; seed <= 2000; seed++) assert.ok(!L._leaks(s.check(pv.rng(seed))), `${s.id} ${seed}`);
  for (let seed = 1; seed <= 600; seed++) {
    const [s1, s2, s3, , s5, s6] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    assert.ok(s1.parts[1].answer >= 300 && s1.parts[1].answer <= 900, 'step 1');
    assert.ok(s2.parts[1].answer >= 40, 'step 2');
    const [a3, b3] = s3.parts.map((p) => p.answer);
    assert.ok(a3 >= 250 && a3 <= 800 && b3 > 0, 'step 3');
    assert.ok(s5.parts.every((p) => p.answer > 0 && p.answer <= 999), 'step 5 (C-3)');
    assert.ok(s6.parts[1].answer <= 999, 'step 6 (C-6)');
  }
});
