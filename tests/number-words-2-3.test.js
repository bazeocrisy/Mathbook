// Unit tests for Number Words Phases 2 (11–20) and 3 (20–99): the number-word key (checked against a hand-written
// table), grading (capitals, surrounding spaces, a hyphen or a space are accepted; a misspelling, a missing part or a
// different number is not), spelling-aware feedback that never gives the answer, hints that never give the answer,
// coverage of every number / tens word in practice, distinct choices, fair tests (no spelling given away), the
// Learn generators, and the help-mode lesson flags.
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/figures.js');
require('../assets/js/questions.js');
require('../number-words/program.js');
require('../number-words/words99.js');
require('../number-words/phase-2/lesson.js');
require('../number-words/phase-3/lesson.js');

const { pv, Q, nw99: N } = globalThis.Mathbook;
const L2 = globalThis.Mathbook.lessons['nw-2'];
const L3 = globalThis.Mathbook.lessons['nw-3'];

// An independent answer key, written out by hand.
const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const TEEN = { 10: 'ten', 11: 'eleven', 12: 'twelve', 13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen', 18: 'eighteen', 19: 'nineteen' };
const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety' };
const key = (n) => (n < 10 ? ONES[n] : n < 20 ? TEEN[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));
const numOf = N.numOf;
const allQs = (L) => L.guided.concat(L.bank);
const seeds = (k) => Array.from({ length: k }, (_, i) => (i + 1) * 7919);

test('Every number word from 11 to 99 matches the hand-written key', () => {
  for (let n = 11; n <= 99; n++) assert.equal(N.W(n), key(n), String(n));
});

test('Spelling answers: capitals, spaces and a hyphen or space are accepted; everything else is wrong', () => {
  const q = (n) => ({ type: 'words', answer: n, prompt: 'x' });
  assert.ok(Q.grade(q(42), 'forty-two'));
  assert.ok(Q.grade(q(42), 'Forty-Two'));
  assert.ok(Q.grade(q(42), '  forty two  '));
  assert.ok(Q.grade(q(42), 'FORTY–TWO'));
  assert.ok(Q.grade(q(15), ' Fifteen '));
  for (const [n, bad] of [[42, 'fourty-two'], [42, 'forty'], [42, 'twenty-four'], [42, 'fortytwo'], [42, 'forty-too'], [15, 'fiveteen'], [18, 'eightteen'], [40, 'fourteen'], [40, 'forty-zero'], [13, 'thirty'], [19, 'ninteen'], [42, '']]) {
    assert.ok(!Q.grade(q(n), bad), `${bad} must not be accepted for ${n}`);
  }
});

test('Number answers: the whole number is checked and an empty answer is never 0', () => {
  const q = { type: 'number', answer: 40, prompt: 'x' };
  assert.ok(Q.grade(q, '40'));
  assert.ok(Q.grade(q, ' 40 '));
  assert.ok(!Q.grade(q, '04') || pv.parseWholeNumber('04') === 4);
  assert.ok(!Q.grade(q, '14'));
  assert.ok(!Q.isAnswered(q, ''));
  assert.ok(!Q.grade({ type: 'number', answer: 0, prompt: 'x' }, ''));
});

test('Feedback names a spelling slip as spelling, a different number as a value, and never prints the answer', () => {
  const tip = (n, r) => N.wordsTip({ answer: n }, r);
  assert.match(tip(40, 'fourty'), /^Check the spelling of "fourty"/);
  assert.match(tip(42, 'fourty-two'), /^Check the spelling of "fourty"/);
  assert.match(tip(15, 'fiveteen'), /^Check the spelling of "fiveteen"/);
  assert.match(tip(18, 'eightteen'), /^Check the spelling/);
  assert.match(tip(19, 'ninteen'), /^Check the spelling/);
  assert.match(tip(67, 'sixty-sevn'), /^Check the spelling of "sevn"/);
  assert.match(tip(40, 'fourteen'), /name 14, not 40\. A -ty word is tens/);
  assert.match(tip(14, 'forty'), /name 40, not 14\. A -teen word/);
  assert.match(tip(42, 'forty'), /only the tens/);
  assert.match(tip(42, 'twenty-four'), /swapped/);
  assert.match(tip(42, 'fortytwo'), /hyphen/);
  assert.match(tip(12, 'elevin'), /looks like the word for 11/);
  for (let n = 11; n <= 99; n++) {
    for (const r of [N.W(n === 99 ? 98 : n + 1), N.W(n).replace(/e/, 'a'), N.W(n).split('-')[0], 'xyz', N.W(n).replace('-', '')]) {
      if (pv.checkWords(r, n)) continue;
      const t = tip(n, r);
      assert.ok(t.length > 0, `${n} ${r}: no feedback`);
      assert.ok(!new RegExp(`(^|[^a-z-])${N.W(n)}([^a-z-]|$)`).test(t.toLowerCase()), `${n} ${r}: feedback prints the answer: ${t}`);
    }
  }
});

test('Hints never print the answer they ask for', () => {
  for (let n = 11; n <= 99; n++) {
    for (const q of [N.spellQ({ id: 'x', n }), N.trickyQ({ id: 'x', n }), N.fixQ({ id: 'x', n }), N.readQ({ id: 'x', n })]) {
      const h = q.hint.toLowerCase();
      if (q.type === 'words') assert.ok(!new RegExp(`(^|[^a-z-])${N.W(n)}([^a-z-]|$)`).test(h), `${q.skill} ${n}: ${q.hint}`);
      if (q.type === 'number') assert.ok(!(h.match(/\d+/g) || []).some((d) => Number(d) === n), `read ${n}: ${q.hint}`);
      if (q.type === 'letter') assert.ok(!h.includes(q.word), `tricky ${n}: ${q.hint}`);
    }
  }
});

test('Tricky spellings: the blank is in the part that changes, and only one letter fits', () => {
  const blanks = { 11: 'ele_en', 12: 'twel_e', 13: 'th_rteen', 14: 'fo_rteen', 15: 'fi_teen', 16: 'si_teen', 17: 'seven_een', 18: 'eigh_een', 19: 'nin_teen', 20: 'tw_nty',
    30: 'th_rty', 40: 'fo_ty', 50: 'fi_ty', 60: 'si_ty', 70: 'seve_ty', 80: 'eigh_y', 90: 'nin_ty' };
  for (const n of Object.keys(blanks).map(Number)) {
    const q = N.trickyQ({ id: 'x', n });
    assert.equal(q.word.split('').map((c, i) => (i === q.missing ? '_' : c)).join(''), blanks[n]);
    assert.equal(q.word[q.missing], q.answer);
    assert.ok(Q.grade(q, q.answer.toUpperCase()));
    // No other letter makes a real number word.
    for (const c of 'abcdefghijklmnopqrstuvwxyz') if (c !== q.answer) assert.equal(N.VALUE[pv.normalizeWords(q.word.slice(0, q.missing) + c + q.word.slice(q.missing + 1))], undefined, `${n} ${c}`);
  }
});

test('Misspellings are never real number words and are only shown labelled as a mistake', () => {
  for (const [w, note] of Object.entries(N.NOTES)) for (const bad of note.wrong || []) {
    assert.equal(N.VALUE[bad], undefined, `${w}: ${bad}`);
    assert.notEqual(bad, w);
  }
  for (const L of [L2, L3]) for (const q of allQs(L)) if (q.skill === 'fix') assert.match(q.prompt, /^Spelling mistake: someone wrote "[^"]+" for \d+\. Write \d+ the right way\.$/);
});

test('Match questions: three different, correctly spelled choices; the answer is among them; the prompt does not give it', () => {
  for (let n = 11; n <= 99; n++) for (const toNumber of [false, true]) {
    const q = N.matchQ({ id: 'x', n, toNumber, seed: n });
    assert.equal(q.choices.length, 3, String(n));
    assert.equal(new Set(q.choices).size, 3);
    assert.ok(q.choices.includes(q.answer));
    if (!toNumber) { for (const c of q.choices) assert.notEqual(N.VALUE[pv.normalizeWords(c)], undefined, c); assert.ok(!q.prompt.includes(q.answer)); }
    else assert.ok(!q.prompt.includes(q.answer));
  }
});

test('Practice covers every Phase 2 number and every Phase 3 tens word, in every format', () => {
  const p2 = allQs(L2);
  for (let n = 11; n <= 20; n++) assert.ok(p2.some((q) => numOf(q) === n), `Phase 2 practice misses ${n}`);
  for (const set of L2.bankSets) for (let n = 11; n <= 20; n++) assert.ok(set.ids.some((id) => numOf(L2.bank.find((q) => q.id === id)) === n), `${set.id} misses ${n}`);
  const p3 = allQs(L3);
  for (const t of [2, 3, 4, 5, 6, 7, 8, 9]) {
    assert.ok(p3.some((q) => numOf(q) >= 20 && Math.floor(numOf(q) / 10) === t), `Phase 3 practice misses ${t}0`);
    for (const set of L3.bankSets) assert.ok(set.ids.some((id) => { const v = numOf(L3.bank.find((q) => q.id === id)); return v >= 20 && Math.floor(v / 10) === t; }), `${set.id} misses ${t}0`);
  }
  assert.ok(p3.some((q) => numOf(q) % 10 === 0 && numOf(q) >= 20) && p3.filter((q) => numOf(q) >= 20 && numOf(q) % 10).length >= 10, 'exact tens and many two-word numbers');
  for (const L of [L2, L3]) {
    for (const s of ['match', 'read', 'spell', 'tricky', 'fix']) assert.ok(L.bank.filter((q) => q.skill === s).length >= 2, `${L.id} bank has too few ${s}`);
    for (const q of allQs(L)) { assert.ok(L.skills[q.skill], q.id); assert.ok(q.hint && q.explanation, q.id); assert.ok(!N.leaks(q), `${q.id} prints its answer`); }
    const ids = allQs(L).map((q) => q.id); assert.equal(new Set(ids).size, ids.length);
  }
});

test('Tests: balanced, new numbers each attempt, no hints, no spelling given away; Phase 3 uses every tens word', () => {
  for (const [L, size] of [[L2, 12], [L3, 14]]) {
    assert.equal(L.tests.words.questions, size);
    const seen = new Set();
    for (const seed of seeds(L === L2 ? 300 : 600)) {
      const qs = L.tests.words.generate(seed);
      assert.equal(qs.length, size);
      assert.ok(N.testOK(qs), `${L.id} seed ${seed} gives a spelling away`);
      for (const q of qs) { assert.ok(!q.hint && !q.parent, q.id); assert.ok(L.skills[q.skill]); assert.ok(Q.grade(q, q.type === 'number' ? String(q.answer) : q.type === 'words' ? N.W(q.answer) : q.answer), `${q.id} key`); }
      const count = (s) => qs.filter((q) => q.skill === s).length;
      assert.ok(count('match') >= 2 && count('read') >= 3 && count('spell') >= 3 && count('tricky') === 2 && count('fix') >= 1, `${L.id} ${seed} balance`);
      if (L === L2) for (let n = 11; n <= 20; n++) assert.ok(qs.some((q) => numOf(q) === n), `Phase 2 seed ${seed} misses ${n}`);
      if (L === L3) { const t = new Set(qs.map(numOf).filter((n) => n >= 20).map((n) => Math.floor(n / 10))); assert.equal(t.size, 8, `Phase 3 seed ${seed} tens`); }
      seen.add(JSON.stringify(qs.map(numOf)));
    }
    assert.ok(seen.size > 50, `${L.id}: tests should change between attempts`);
  }
});

test('Learn: every step has an Example and a Your Turn whose format is practised and tested later; checks are valid', () => {
  for (const L of [L2, L3]) {
    assert.equal(L.seeIt.steps.length, 6);
    const taught = new Set();
    for (const st of L.seeIt.steps) {
      assert.ok(st.slides.length >= 2 && typeof st.check === 'function', st.id);
      for (const seed of seeds(60)) {
        const q = st.check(pv.rng(seed));
        assert.ok(q.prompt && q.hint && q.explanation && L.skills[q.skill], `${st.id} ${seed}`);
        assert.ok(!N.leaks(q), `${st.id} ${seed} prints its answer`);
        const n = numOf(q);
        assert.ok(L === L2 ? n >= 11 && n <= 20 : (n >= 20 && n <= 99) || (n >= 13 && n <= 19), `${st.id} ${n}`);
        taught.add(q.skill);
      }
    }
    for (const s of ['match', 'read', 'spell', 'tricky', 'fix']) assert.ok(taught.has(s), `${L.id}: ${s} is tested but never taught in Learn`);
  }
});

test('Help mode, skill groups and separate saved progress', () => {
  for (const L of [L2, L3]) {
    assert.equal(L.help, true);
    assert.equal(typeof L.tip, 'function');
    assert.deepEqual(L.skillGroups.map((g) => g.title), ['Number recognition', 'Spelling']);
    assert.deepEqual(L.skillGroups.flatMap((g) => g.skills).sort(), Object.keys(L.skills).sort());
  }
  assert.equal(L2.storageKey, 'mathbook:v2:number-words:phase-2');
  assert.equal(L3.storageKey, 'mathbook:v2:number-words:phase-3');
  const P = globalThis.Mathbook.numberWords.program;
  assert.deepEqual(P.phases.map((p) => [p.id, p.title, p.status, p.href]), [['1', 'Numbers 0–10', 'ready', 'phase-1/'], ['2', 'Numbers 11–20', 'ready', 'phase-2/'], ['3', 'Numbers 20–99', 'ready', 'phase-3/'], ['4', 'Numbers 100–9,999', 'ready', 'phase-4/']]);
  for (const p of P.phases) assert.ok(p.card && p.card.length < 110, p.id);
});

test('Review fixes: listed misspellings are spelling slips; missing-letter hints never name the letter; Your Turns differ from the example', () => {
  // NW23-02: every listed misspelling (alone, or as the tens part of a two-word number) is called a spelling slip.
  for (const [w, note] of Object.entries(N.NOTES)) for (const bad of note.wrong || []) {
    const n = N.VALUE[w];
    assert.match(N.wordsTip({ answer: n }, bad), /^Check the spelling of/, `${w} ${bad}`);
    if (n >= 20) assert.match(N.wordsTip({ answer: n + 7 }, `${bad}-seven`), /^Check the spelling of/, `${bad}-seven`);
  }
  // NW23-01: the clue for "fill in the missing letter" never prints that letter on its own.
  for (let n = 11; n <= 99; n++) {
    const q = N.trickyQ({ id: 'x', n });
    assert.ok(!new RegExp(`(^|[^a-z])${q.answer}([^a-z]|$)`).test(q.hint.toLowerCase()), `${n}: ${q.hint}`);
    assert.ok(!q.hint.toLowerCase().includes(q.word), `${n}: ${q.hint}`);
  }
  // NW23-04: the Learn Your Turn never asks the item its Example just showed.
  const shownBy = { 'nw-2': { thirfif: 'fo_rteen', eighteen: 'eightteen' }, 'nw-3': { tricky: 'nin_ty' } };
  for (const L of [L2, L3]) for (const st of L.seeIt.steps) {
    const ex = shownBy[L.id][st.id];
    if (!ex) continue;
    for (const seed of seeds(200)) {
      const q = st.check(pv.rng(seed));
      const asked = q.type === 'letter' ? q.word.split('').map((c, i) => (i === q.missing ? '_' : c)).join('') : q.wrongForm;
      assert.notEqual(asked, ex, `${L.id} ${st.id}`);
    }
  }
});
