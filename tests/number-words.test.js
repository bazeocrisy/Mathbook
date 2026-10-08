// Unit tests for Number Words: spellings, practice rounds, spelling tests, and coverage rotation.
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/questions.js');
require('../number-words/program.js');
require('../assets/js/number-words.js');

const { pv, Q, numberWords: NW } = globalThis.Mathbook;
const P1 = NW.program.phases.find((p) => p.id === '1');

test('Phase 1 has all eleven words 0–10, spelled exactly as Lesson 2-1 word form spells them', () => {
  assert.deepEqual(P1.words.map((w) => w.n), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(P1.words.map((w) => w.word), ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);
  P1.words.forEach((w) => assert.equal(w.word, pv.numberToWords(w.n), `${w.n}`));
  P1.words.forEach((w) => {
    assert.ok(w.tip.length > 10, `${w.word} has a tip`);
    assert.equal(w.misspellings.length, 3);
    assert.equal(new Set(w.misspellings).size, 3, `${w.word} misspellings distinct`);
    w.misspellings.forEach((m) => assert.notEqual(m, w.word, `${w.word}: "${m}" must be wrong`));
  });
  assert.equal(P1.testSize, 10);
  assert.equal(P1.masteryScore, 9);
});

test('Tips spell the word correctly wherever they spell it out letter by letter', () => {
  P1.words.forEach((w) => {
    const spelled = w.tip.match(/\b([a-z](?:-[a-z])+)\b/);
    if (spelled) assert.equal(spelled[1].replace(/-/g, ''), w.word, `${w.word} tip`);
  });
});

test('Phases 2–4 are outlines only (no playable content)', () => {
  NW.program.phases.filter((p) => p.id !== '1').forEach((p) => {
    assert.equal(p.status, 'planned');
    assert.equal(p.storageKey, undefined);
    assert.equal(p.href, undefined);
    assert.ok(p.focus.length > 0);
  });
  const p2 = NW.program.phases.find((p) => p.id === '2');
  p2.words.forEach((w, i) => assert.equal(w, pv.numberToWords(11 + i)));
  const p3 = NW.program.phases.find((p) => p.id === '3');
  p3.words.forEach((w, i) => assert.equal(w, pv.numberToWords(20 + i * 10)));
  assert.equal(pv.numberToWords(135), 'one hundred thirty-five');
  assert.equal(pv.numberToWords(5072), 'five thousand, seventy-two');
});

test('Spelling grading: capitals and surrounding spaces ignored; every letter counts', () => {
  const q = NW.item.fromNumeral(P1.words[7]);
  ['seven', 'SEVEN', ' Seven ', '\tseven\n'].forEach((s) => assert.equal(Q.grade(q, s), true, JSON.stringify(s)));
  ['sevin', 'sevn', 'se ven', 'seven.', 'sevenn', '7', ''].forEach((s) => assert.equal(Q.grade(q, s), false, JSON.stringify(s)));
  assert.equal(Q.grade(NW.item.fromNumeral(P1.words[2]), 'to'), false);
  assert.equal(Q.grade(NW.item.fromNumeral(P1.words[4]), 'for'), false);
  assert.equal(Q.grade(NW.item.fromNumeral(P1.words[8]), 'ate'), false);
});

test('Practice rounds: varied, valid items with hints', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const round = NW.practiceRound(P1, seed);
    assert.equal(round.length, P1.practiceSize);
    assert.deepEqual(new Set(round.map((q) => q.type)), new Set(['spell', 'mc', 'letter']));
    round.forEach((q) => {
      assert.ok(q.hint && q.explanation, 'hint and explanation');
      assert.equal(Q.grade(q, Q.correctResponse(q)), true, `${seed} ${q.prompt}`);
      if (q.type === 'mc') {
        assert.equal(new Set(q.choices).size, 4);
        assert.equal(q.choices.filter((c) => c === q.answer).length, 1);
        q.choices.filter((c) => c !== q.answer).forEach((c) => assert.equal(Q.grade(q, c), false));
      }
      if (q.type === 'letter') {
        assert.equal(q.word[q.missing], q.answer);
        assert.equal(Q.grade(q, q.answer.toUpperCase()), true);
      }
      if (q.tenFrame !== undefined) assert.equal((pv.tenFrameSVG(q.tenFrame).match(/data-dot/g) || []).length, q.tenFrame);
    });
  }
  const focus = NW.practiceRound(P1, 7, ['eight', 'two']);
  assert.ok(focus.every((q) => ['eight', 'two'].includes(q.skill)), 'focused rounds use only the missed words');
});

test('Ten-frames draw exactly n dots for 0–10', () => {
  for (let n = 0; n <= 10; n++) assert.equal((pv.tenFrameSVG(n).match(/data-dot/g) || []).length, n);
});

test('Spelling test: 10 typed words, no hints, random order, answers correct', () => {
  const orders = new Set();
  for (let seed = 1; seed <= 1000; seed++) {
    const t = NW.spellingTest(P1, seed, []);
    assert.equal(t.questions.length, 10);
    assert.equal(t.omitted.length, 1);
    assert.equal(new Set(t.assessed).size, 10);
    assert.ok(!t.assessed.includes(t.omitted[0]));
    t.questions.forEach((q) => {
      assert.equal(q.type, 'spell', 'production, not recognition');
      assert.equal(q.hint, undefined, 'no hints on tests');
      assert.ok(q.numeral !== undefined || q.tenFrame !== undefined);
      assert.ok(!q.prompt.toLowerCase().includes(q.answer), 'prompt must not contain the word');
      assert.equal(Q.grade(q, q.answer), true);
    });
    orders.add(t.assessed.join(','));
  }
  assert.ok(orders.size > 900, 'order is randomized');
});

test('Coverage rotation: the left-out word is never left out twice in a row, so all 11 are tested in any 2 attempts', () => {
  for (let run = 1; run <= 200; run++) {
    const history = [];
    for (let k = 0; k < 15; k++) {
      const t = NW.spellingTest(P1, run * 100 + k, history);
      if (history.length) {
        const prev = history[history.length - 1];
        assert.notEqual(t.omitted[0], prev.omitted[0], 'not omitted twice in a row');
        assert.equal(new Set(prev.assessed.concat(t.assessed)).size, 11, 'two attempts cover every word');
      }
      history.push({ assessed: t.assessed, omitted: t.omitted });
    }
    // Over 11+ attempts the counts stay balanced (each word tested at least 12 times in 15 attempts).
    const counts = {};
    history.forEach((a) => a.assessed.forEach((w) => { counts[w] = (counts[w] || 0) + 1; }));
    Object.values(counts).forEach((c) => assert.ok(c >= 12, `balanced coverage ${JSON.stringify(counts)}`));
  }
});

test('Letter comparison for feedback', () => {
  assert.deepEqual(NW.compareLetters('sevin', 'seven').map((c) => c.ok), [true, true, true, false, true]);
  assert.deepEqual(NW.compareLetters('SEV', 'seven').map((c) => c.ch), ['s', 'e', 'v', '_', '_']);
  assert.deepEqual(NW.compareLetters('sevenn', 'seven').map((c) => c.ok), [true, true, true, true, true, false]);
});
