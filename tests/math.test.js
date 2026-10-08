// Unit tests for Mathbook math helpers, question grading, and Lesson 2-1 content.
// Run: npm test   (Node 18+; no dependencies)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-1/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-1'];

// Independent word-form parser (does not reuse numberToWords) to cross-check every number.
const SMALL = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
function wordsToNumber(text) {
  let total = 0, cur = 0;
  for (const w of text.replace(/,/g, ' ').split(/[\s-]+/).filter(Boolean)) {
    if (w === 'thousand') { total += cur * 1000; cur = 0; } else if (w === 'hundred') cur *= 100;
    else if (w in SMALL) cur += SMALL[w];
    else throw new Error('Unknown word: ' + w);
  }
  return total + cur;
}

function digitAppearsOnce(prompt) {
  const m = prompt.match(/the (\d) in ([\d,]+)/);
  if (!m) return true;
  return m[2].replace(/,/g, '').split('').filter((c) => c === m[1]).length === 1;
}

/** Other correct ways a student might type the same answer. */
function alternateCorrect(q) {
  const alts = [];
  if (q.type === 'number') alts.push(String(q.answer), ` ${pv.fmt(q.answer)} `);
  if (q.type === 'expanded') {
    const t = pv.expandedTerms(q.answer);
    alts.push(t.join('+'), t.slice().reverse().map(pv.fmt).join(' + '));
    const withZeros = pv.digitsOf(q.answer).map((d, i) => d * [1000, 100, 10, 1][i]);
    alts.push(withZeros.map(pv.fmt).join(' + '));
  }
  if (q.type === 'words') {
    const w = pv.numberToWords(q.answer);
    alts.push(w.toUpperCase(), w.replace(/,/g, ''), w.replace(/-/g, ' '));
  }
  if (q.type === 'chart') alts.push(pv.digitsOf(q.answer).map((d) => ` ${d} `));
  return alts;
}

function checkQuestion(q, where) {
  const label = `${where} ${q.id}: ${q.prompt}`;
  assert.ok(q.explanation && q.explanation.length > 10, `${label} needs an explanation`);
  assert.ok(q.skill, `${label} needs a skill`);
  assert.equal(Q.grade(q, Q.correctResponse(q)), true, `${label} correct answer must be graded correct`);
  for (const alt of alternateCorrect(q)) assert.equal(Q.grade(q, alt), true, `${label} should accept ${JSON.stringify(alt)}`);
  assert.equal(Q.grade(q, Q.emptyResponse(q)), false, `${label} blank must not be correct`);
  if (q.type === 'mc' || q.type === 'select') {
    assert.equal(new Set(q.choices).size, q.choices.length, `${label} choices must be distinct`);
    assert.equal(q.choices.filter((c) => c === q.answer).length, 1, `${label} answer must appear once`);
    q.choices.filter((c) => c !== q.answer).forEach((c) => assert.equal(Q.grade(q, c), false));
  }
  if (q.type === 'number') {
    assert.equal(Q.grade(q, String(q.answer + 1)), false);
    if (q.answer !== 0) assert.equal(Q.grade(q, String(q.answer * 10)), false);
  }
  if (['build', 'chart', 'expanded', 'words'].includes(q.type)) {
    assert.ok(q.answer >= 1000 && q.answer <= 9999, `${label} answer should be a 4-digit number`);
  }
  assert.ok(digitAppearsOnce(q.prompt), `${label} digit must appear only once in the number`);
  // Saved attempts are JSON: grading must survive a round trip.
  const copy = JSON.parse(JSON.stringify(q));
  assert.equal(Q.grade(copy, Q.correctResponse(copy)), true);
}

test('word form matches known examples', () => {
  const cases = {
    2137: 'two thousand, one hundred thirty-seven',
    4628: 'four thousand, six hundred twenty-eight',
    5072: 'five thousand, seventy-two',
    2014: 'two thousand, fourteen',
    7035: 'seven thousand, thirty-five',
    2508: 'two thousand, five hundred eight',
    5000: 'five thousand',
    1010: 'one thousand, ten',
    9999: 'nine thousand, nine hundred ninety-nine',
    3300: 'three thousand, three hundred',
    40: 'forty', 0: 'zero', 115: 'one hundred fifteen'
  };
  for (const [n, w] of Object.entries(cases)) assert.equal(pv.numberToWords(Number(n)), w);
});

test('word form, expanded form, and digits agree for every number 0–9,999', () => {
  for (let n = 0; n <= 9999; n++) {
    assert.equal(wordsToNumber(pv.numberToWords(n)), n, `words for ${n}`);
    assert.equal(pv.fromDigits(pv.digitsOf(n)), n);
    const terms = pv.expandedTerms(n);
    assert.equal(terms.reduce((a, b) => a + b, 0), n, `expanded sum for ${n}`);
    terms.forEach((t) => assert.match(String(t), /^[1-9]0{0,3}$/));
    if (n > 0) assert.equal(pv.checkExpanded(pv.expandedForm(n), n).ok, true, `expanded check for ${n}`);
    assert.equal(pv.parseWholeNumber(pv.fmt(n)), n);
  }
  assert.equal(pv.expandedForm(2137), '2,000 + 100 + 30 + 7');
  assert.equal(pv.expandedForm(5072), '5,000 + 70 + 2');
  assert.equal(pv.fmt(4628), '4,628');
});

test('number parsing accepts common formats and rejects others', () => {
  assert.equal(pv.parseWholeNumber('2137'), 2137);
  assert.equal(pv.parseWholeNumber('2,137'), 2137);
  assert.equal(pv.parseWholeNumber(' 2 137 '), 2137);
  assert.equal(pv.parseWholeNumber('0'), 0);
  for (const bad of ['', '21,37', '2.137', 'abc', '2,1370', '-5', '12a']) assert.equal(pv.parseWholeNumber(bad), null, bad);
});

test('expanded-form checker', () => {
  const ok = ['5,000 + 70 + 2', '5000+70+2', '2 + 70 + 5,000', '5,000 + 0 + 70 + 2', ' 5000 +70+ 2 '];
  ok.forEach((s) => assert.equal(pv.checkExpanded(s, 5072).ok, true, s));
  const bad = ['5072', '5,000 + 72', '5,000 + 700 + 2', '5,000 + 70 + 1 + 1', '5,000 + 70 + 2 +', '500 + 70 + 2', '5 + 0 + 7 + 2', '5,000 + 60 + 10 + 2'];
  bad.forEach((s) => assert.equal(pv.checkExpanded(s, 5072).ok, false, s));
});

test('typed word form ignores capitals, hyphens, commas, and "and"', () => {
  ['Two thousand, five hundred eight', 'two thousand five hundred eight', 'TWO THOUSAND, FIVE HUNDRED AND EIGHT'].forEach((s) => assert.equal(pv.checkWords(s, 2508), true, s));
  assert.equal(pv.checkWords('seventy two', 72), true);
  ['two thousand, fifty-eight', 'two hundred fifty-eight', 'two thousand eight'].forEach((s) => assert.equal(pv.checkWords(s, 2508), false, s));
});

test('base-ten block pictures draw exactly the right blocks for every number', () => {
  const countOf = (html, kind) => (html.match(new RegExp(`data-block="${kind}"`, 'g')) || []).length;
  for (let n = 0; n <= 9999; n++) {
    const html = pv.blocksHTML(n);
    const [th, hu, te, on] = pv.digitsOf(n);
    assert.equal(countOf(html, 'thousand'), th, `thousands in ${n}`);
    assert.equal(countOf(html, 'hundred'), hu, `hundreds in ${n}`);
    assert.equal(countOf(html, 'ten'), te, `tens in ${n}`);
    assert.equal(countOf(html, 'one'), on, `ones in ${n}`);
  }
  const h = pv.blocksHTML(2137);
  assert.match(h, /2 thousands, 1 hundred, 3 tens, 7 ones/);
  assert.match(h, /<b>3<\/b> tens = 30/);
});

test('lesson structure is complete', () => {
  assert.equal(L.parentGuide.length, 6, 'six parent questions');
  assert.deepEqual(L.parentGuide.map((g) => g.q), ['What am I teaching?', 'What does it mean?', 'Why does it work?', 'How do I demonstrate it?', 'What questions should I ask?', 'How do I know they understand?']);
  assert.ok(L.vocabulary.length >= 6);
  assert.equal(L.guided.length, 5);
  assert.deepEqual(L.seeIt.examples, [2137, 4628, 5072]);
  assert.ok(!/chris/i.test(JSON.stringify(L)), 'no student names in content');
});

test('practice bank: 50 valid questions covering every skill', () => {
  assert.equal(L.bank.length, 50);
  assert.equal(new Set(L.bank.map((q) => q.id)).size, 50, 'ids are unique');
  assert.equal(new Set(L.bank.map((q) => [q.prompt, q.display, q.model].join('|'))).size, 50, 'no duplicate questions');
  const skills = new Set(L.bank.map((q) => q.skill));
  ['value', 'place', 'standard', 'expanded', 'word', 'model', 'change', 'compose'].forEach((s) => assert.ok(skills.has(s), s));
  const types = new Set(L.bank.map((q) => q.type));
  ['mc', 'number', 'expanded', 'words', 'chart', 'build'].forEach((t) => assert.ok(types.has(t), t));
  L.bank.forEach((q) => { checkQuestion(q, 'bank'); assert.ok(q.hint, `bank ${q.id} has a hint`); });
});

test('practice bank answers spot-check (hand-verified)', () => {
  const byPrompt = (p) => L.bank.find((q) => q.prompt === p);
  assert.equal(byPrompt('What is the value of the 8 in 8,341?').answer, 8000);
  assert.equal(byPrompt('What is the value of the 6 in 2,659?').answer, 600);
  assert.equal(byPrompt('What is the value of the 1 in 7,315?').answer, 10);
  assert.equal(byPrompt('Which digit is in the tens place of 9,418?').answer, 1);
  assert.equal(byPrompt('Which digit is in the ones place of 5,610?').answer, 0);
  assert.equal(byPrompt('What is 100 more than 2,349?').answer, 2449);
  assert.equal(byPrompt('What is 100 less than 6,458?').answer, 6358);
  assert.equal(byPrompt('What is 1,000 more than 3,782?').answer, 4782);
  assert.equal(byPrompt('Use the digits 2, 8, 4, and 1 once each. What is the smallest number you can make?').answer, 1248);
  assert.equal(byPrompt('Use the digits 3, 9, 5, and 7 once each. What is the greatest number you can make?').answer, 9753);
  assert.equal(byPrompt('In 6,247, which place is the 2 in?').answer, 'hundreds');
  const scrambled = L.bank.find((q) => q.display === '30 + 5,000 + 200 + 1');
  assert.equal(scrambled.answer, 5231);
  const model = L.bank.find((q) => q.model === 3051);
  assert.equal(model.answer, 3051);
});

test('word-form distractors are always 3 different, wrong numbers', () => {
  for (let n = 1000; n <= 9999; n++) {
    const d = L._wordDistractors(n, pv.rng(n));
    assert.equal(d.length, 3, `distractors for ${n}`);
    assert.equal(new Set(d).size, 3);
    d.forEach((m) => { assert.notEqual(m, n); assert.ok(m >= 100 && m <= 9999); });
  }
});

test('guided practice items grade correctly', () => {
  L.guided.filter((q) => q.type !== 'explain').forEach((q) => checkQuestion(q, 'guided'));
  assert.equal(L.guided[1].answer, 5072);
  assert.equal(Q.grade(L.guided[1], '5,000 + 70 + 2'), true);
});

test('Math Test: 10 valid questions, all objectives, new numbers each attempt, no hints', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 2000; seed++) {
    const qs = L.tests.math.generate(seed);
    assert.equal(qs.length, 10);
    assert.equal(new Set(qs.map((q) => q.id)).size, 10);
    const skills = new Set(qs.map((q) => q.skill));
    ['value', 'place', 'model', 'expanded', 'standard', 'word', 'change'].forEach((s) => assert.ok(skills.has(s), `seed ${seed} covers ${s}`));
    assert.ok(new Set(qs.map((q) => q.type)).size >= 4, 'several question types');
    qs.forEach((q) => {
      assert.equal(q.hint, undefined, 'no hints on tests');
      checkQuestion(q, `math seed ${seed}`);
      if (q.skill === 'change') assert.ok(q.answer >= 1000 && q.answer <= 9999);
    });
    seen.add(qs.map((q) => q.prompt + (q.display || '')).sort().join('|'));
  }
  assert.ok(seen.size > 1990, 'retakes get different questions');
  // Same seed → same test (saved drafts and attempts are reproducible).
  assert.deepEqual(JSON.stringify(L.tests.math.generate(42)), JSON.stringify(L.tests.math.generate(42)));
});

test('Vocabulary Test: 10 valid questions with randomized versions', () => {
  const seen = new Set();
  for (let seed = 1; seed <= 2000; seed++) {
    const qs = L.tests.vocab.generate(seed);
    assert.equal(qs.length, 10);
    assert.equal(new Set(qs.map((q) => q.id)).size, 10);
    qs.forEach((q) => checkQuestion(q, `vocab seed ${seed}`));
    seen.add(qs.map((q) => q.prompt + (q.display || '')).join('|'));
  }
  assert.ok(seen.size > 1900);
});
