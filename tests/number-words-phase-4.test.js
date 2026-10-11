// Unit tests for Number Words Phase 4 (Hundreds and thousands, 100–9,999): the answer key, word-form grading
// (capitals, spaces, hyphens, the comma after "thousand" and an optional "and" are accepted; a wrong value, a missing
// part or a misspelling is not), numbers with zeros inside, distinct choices, the test, and the Learn generators.
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../number-words/program.js');
require('../number-words/phase-4/lesson.js');

const { pv } = globalThis.Mathbook;
const Q = globalThis.Mathbook.Q;
const L = globalThis.Mathbook.lessons['nw-4'];
const keyOf = (q) => (q.type === 'parts' ? q.parts.map((p) => p.answer) : [q.answer]);
const all = () => L.guided.concat(L.bank, L._testItems);

const GUIDED = { p1: [248], p2: [6193], p3: [513], p4: [8246], p5: [4027], p6: [9300], p7: [3008], p8: [7090], p9: [604],
  p10: ['two thousand, eight hundred five'], p11: ['one thousand, four hundred sixty'], p12: [0, 'No'] };
const PRACTICE = { o1: [376], o2: [4581], o3: [917], o4: [5362], o5: [8034], o6: [2600], o7: [9005], o8: [4070], o9: [802],
  o10: ['six thousand, four hundred three'], o11: ['three thousand, nine hundred fifty'], o12: [3, 'Yes'] };
const TEST = { t1: [[589], 'towords'], t2: [[7254], 'towords'], t3: [[816], 'tonumber'], t4: [[3471], 'tonumber'], t5: [[6052], 'zwords'], t6: [[1900], 'zwords'],
  t7: [[8006], 'znumber'], t8: [[2030], 'znumber'], t9: [[409], 'znumber'], t10: [['four thousand, three hundred eight'], 'check'],
  t11: [['nine thousand, one hundred sixty'], 'check'], t12: [[0, 'No'], 'place'] };

test('Practice Together, On My Own and the test match the key', () => {
  assert.deepEqual(L.guided.map((q) => q.id), Object.keys(GUIDED));
  for (const q of L.guided) assert.deepEqual(keyOf(q), GUIDED[q.id], q.id);
  assert.deepEqual(L.bank.map((q) => q.id), Object.keys(PRACTICE));
  for (const q of L.bank) assert.deepEqual(keyOf(q), PRACTICE[q.id], q.id);
  const T = L.tests.words;
  assert.equal(T.questions, 12);
  for (const seed of [1, 2, 77, 12345]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), Object.keys(TEST));
    for (const q of items) { assert.deepEqual(keyOf(q), TEST[q.id][0], q.id); assert.equal(q.skill, TEST[q.id][1]); assert.ok(!q.hint && !q.parent, q.id); }
  }
  assert.ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => T.generate(s)[9].choices.join('|'))).size > 1, 'word-form choices shuffle');
});

test('every test skill is taught in Learn or practised On My Own; both directions are practised', () => {
  for (const s of new Set(L._testItems.map((q) => q.skill))) assert.ok(L.bank.some((q) => q.skill === s), s);
  const kinds = new Set(L.bank.map((q) => q.type));
  assert.ok(kinds.has('words') && kinds.has('number'), 'numbers → words and words → numbers');
});

test('numbers stay in 100–9,999 and include zeros inside the number', () => {
  const nums = all().map((q) => (q.type === 'words' || q.type === 'number' ? q.answer : Number(q.prompt.match(/[\d,]+/)[0].replace(/,/g, ''))));
  for (const n of nums) assert.ok(n >= 100 && n <= 9999, n);
  const inner = nums.filter((n) => /\d0+\d/.test(String(n)) || /^\d0/.test(String(n)));
  assert.ok(inner.length >= 10, 'many numbers with zeros: ' + inner.length);
});

test('word form grading: format does not matter, the words do', () => {
  const q = L.guided.find((x) => x.id === 'p2'); // 6,193
  const yes = ['six thousand, one hundred ninety-three', 'Six Thousand, One Hundred Ninety-Three', '  six   thousand one hundred ninety three ',
    'six thousand, one hundred and ninety-three', 'SIX THOUSAND ONE HUNDRED NINETY–THREE', 'six thousand one hundred ninety-three.'];
  const no = ['six thousand, one hundred ninety', 'six thousand, ninety-three', 'one hundred ninety-three', 'six thousand, one hundred ninety-four',
    'six thousand, one hundred ninty-three', 'six thousand, one hundred ninetythree', '6,193', ''];
  for (const t of yes) assert.ok(Q.grade(q, t), 'accept: ' + t);
  for (const t of no) assert.ok(!Q.grade(q, t), 'reject: ' + t);
  const z = L.guided.find((x) => x.id === 'p5'); // 4,027
  assert.ok(Q.grade(z, 'four thousand twenty-seven'));
  assert.ok(Q.grade(z, 'four thousand and twenty-seven'));
  assert.ok(!Q.grade(z, 'four thousand, zero hundred twenty-seven'), 'saying the zero is not the book form');
  assert.ok(!Q.grade(z, 'fourty thousand, twenty-seven') && !Q.grade(z, 'four hundred twenty-seven'));
  const n = L.guided.find((x) => x.id === 'p7'); // 3,008
  for (const t of ['3008', '3,008', ' 3 008 ']) assert.ok(Q.grade(n, t), 'accept number: ' + t);
  for (const t of ['38', '308', '3,080', 'three thousand eight']) assert.ok(!Q.grade(n, t), 'reject number: ' + t);
});

test('choices are distinct and wrong choices are other real numbers; nothing to type is printed', () => {
  for (const q of all()) {
    if (q.choices) {
      assert.equal(new Set(q.choices).size, q.choices.length, q.id);
      assert.equal(q.choices.filter((c) => c === q.answer).length, 1, q.id);
    }
    assert.ok(!L._leaks(q), q.id);
  }
  const pos = {};
  for (const q of L.guided.concat(L.bank).filter((x) => x.choices)) pos[q.choices.indexOf(q.answer)] = (pos[q.choices.indexOf(q.answer)] || 0) + 1;
  assert.ok(Object.keys(pos).length >= 2, 'answer positions vary: ' + JSON.stringify(pos));
});

test('explanations name the places and the book word form', () => {
  for (const q of all()) {
    const n = q.type === 'words' || q.type === 'number' ? q.answer : Number(q.prompt.match(/[\d,]+/)[0].replace(/,/g, ''));
    assert.ok(q.explanation.includes(pv.numberToWords(n)), q.id);
    assert.match(q.explanation, /\d (thousand|hundred|ten|one)s?/, q.id);
  }
});

test('Learn generators stay in range, avoid the demo numbers, teach zeros, and never print the answer', () => {
  const seen = { s4words: 0, s4number: 0 };
  for (let seed = 1; seed <= 2000; seed++) {
    const [s1, s2, s3, s4, s5] = L.seeIt.steps.map((s) => s.check(pv.rng(seed)));
    for (const q of [s1, s2, s3, s4, s5]) assert.ok(!L._leaks(q), `${q.id} ${seed}`);
    assert.ok(s1.type === 'words' && s1.answer >= 100 && s1.answer <= 999 && !String(s1.answer).includes('0'), 'step 1 ' + s1.answer);
    assert.ok(s2.type === 'number' && s2.answer >= 100 && s2.answer <= 999 && String(s2.answer)[1] !== '0', 'step 2 ' + s2.answer);
    assert.ok(s3.type === 'words' && s3.answer >= 1000 && !String(s3.answer).includes('0'), 'step 3 ' + s3.answer);
    const z = String(s4.answer).slice(1).split('').filter((c) => c === '0').length;
    assert.ok(s4.answer >= 1000 && z >= 1 && z <= 2, 'step 4 ' + s4.answer);
    seen[s4.type === 'words' ? 's4words' : 's4number']++;
    assert.equal(s5.choices.length, 3); assert.equal(new Set(s5.choices).size, 3);
    for (const q of [s1, s2, s3, s4]) assert.ok(!L._demo.includes(q.answer), q.id + ' demo ' + q.answer);
  }
  assert.ok(seen.s4words > 500 && seen.s4number > 500, JSON.stringify(seen));
});

test('Phase 4 keeps its own storage; Phase 1 is unchanged', () => {
  const P = globalThis.Mathbook.numberWords.program.phases;
  const p1 = P.find((p) => p.id === '1'), p4 = P.find((p) => p.id === '4');
  assert.equal(L.storageKey, p4.storageKey);
  assert.equal(p1.storageKey, 'mathbook:v2:number-words:phase-1');
  assert.ok(!p1.storageKey.startsWith(L.storageKey) && !L.storageKey.startsWith(p1.storageKey), 'neither prefix contains the other');
  assert.equal(p1.words.length, 11);
});
