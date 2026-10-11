// Unit tests for the Subtract with Regrouping content (curriculum/supplemental/subtract-regrouping/content.js):
// verified examples, the Practice Together set, Learn generators, targeted skills and the test blueprint.
// Expected values come from an independent column-by-column routine written here (not from sub-math.js).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.window = globalThis;
require('../assets/js/subtract/sub-math.js');
require('../curriculum/supplemental/subtract-regrouping/content.js');
const C = globalThis.Mathbook.subtractRegrouping;
const M = globalThis.SubtractKit.math;

/** Independent schoolbook subtraction: returns { answer, exchanges, chain, firstNeed }. */
function schoolbook(top, bottom) {
  const t = String(top).split('').reverse().map(Number), b = String(bottom).split('').reverse().map(Number);
  while (b.length < t.length) b.push(0);
  let exchanges = 0, chain = 0, firstNeed = -1;
  const out = [];
  for (let i = 0; i < t.length; i++) {
    if (t[i] < b[i]) {
      if (firstNeed < 0) firstNeed = i;
      let j = i + 1;
      while (t[j] === 0) j++;
      chain = Math.max(chain, j - i - 1);
      for (let k = j; k > i; k--) { t[k] -= 1; t[k - 1] += 10; exchanges++; }
    }
    out.push(t[i] - b[i]);
  }
  return { answer: Number(out.reverse().join('')), exchanges, chain, firstNeed };
}
const level = (s) => (s.chain > 0 ? 'hard' : s.exchanges === 0 ? 'none' : s.exchanges === 1 ? 'easy' : 'medium');

test('the spec\'s verified examples and every Learn example', () => {
  assert.equal(4352 - 2126, 2226); assert.equal(level(schoolbook(4352, 2126)), 'easy');
  assert.equal(4532 - 1768, 2764); assert.equal(level(schoolbook(4532, 1768)), 'medium');
  assert.equal(3002 - 1578, 1424); assert.equal(level(schoolbook(3002, 1578)), 'hard');
  for (const step of C.learn) for (const ex of step.examples) {
    if (ex.kind === 'value') { const v = ex.from.reduce((s, d, i) => s + d * 10 ** i, 0); assert.ok(ex.note.includes(M.fmt(v)), step.id); continue; }
    const s = schoolbook(ex.top, ex.bottom);
    assert.equal(s.answer, ex.top - ex.bottom, `${step.id} ${ex.top} − ${ex.bottom}`);
    assert.equal(M.plan(ex.top, ex.bottom).answer, s.answer);
  }
  const want = { one: ['easy', 'easy'], multi: ['medium'], four: ['easy', 'medium'], zero1: ['hard'], zeros2: ['hard'], decide: ['none', 'medium'] };
  for (const [id, levels] of Object.entries(want)) C.learn.find((s) => s.id === id).examples.forEach((ex, i) => assert.equal(level(schoolbook(ex.top, ex.bottom)), levels[i], `${id} example ${i + 1}`));
  assert.equal(schoolbook(4305, 1268).chain, 1); assert.equal(schoolbook(3002, 1578).chain, 2);
  const mi = C.learn.find((s) => s.id === 'mistakes').examples;
  assert.equal(M.buggyWork(mi[0].top, mi[0].bottom, mi[0].bug).answer, 4635); assert.ok(mi[0].note.includes('4,635') && mi[0].note.includes('3,425'));
  assert.equal(M.buggyWork(mi[1].top, mi[1].bottom, mi[1].bug).answer, 1534); assert.ok(mi[1].note.includes('1,534') && mi[1].note.includes('1,424'));
});

test('Practice Together: 8 problems from 2-digit easy to 4-digit zeros, answers checked independently', () => {
  const want = ['easy', 'easy', 'medium', 'easy', 'medium', 'hard', 'hard', 'hard'];
  assert.equal(C.together.length, 8); assert.equal(C.togetherTips.length, 8);
  C.together.forEach((q, i) => { const s = schoolbook(q.top, q.bottom); assert.equal(level(s), want[i], `${q.top} − ${q.bottom}`); assert.equal(s.answer, q.top - q.bottom); });
  assert.deepEqual(C.together.map((q) => q.top - q.bottom), [36, 334, 338, 4326, 2558, 4237, 3156, 444]);
  assert.equal(schoolbook(6003, 2847).chain, 2, 'one problem passes through zeros next to each other');
});

test('Learn Your Turns: every generator gives a valid problem of its step\'s kind', () => {
  const kinds = { value: 'exchange', one: 'guided', multi: 'guided', four: 'guided', zero1: 'guided', zeros2: 'guided', decide: 'decide', mistakes: 'mistake', check: 'check' };
  for (const step of C.learn) for (let seed = 1; seed <= 400; seed++) {
    const it = step.yourTurn(M.rng(seed));
    assert.equal(it.kind, kinds[step.id], step.id);
    if (it.kind === 'exchange') { assert.ok(it.tens >= 2 && it.tens <= 9 && it.ones >= 0 && it.ones <= 9 && it.n === it.tens * 10 + it.ones); continue; }
    const s = schoolbook(it.top, it.bottom);
    if (step.id === 'one') assert.ok(level(s) === 'easy' && [2, 3].includes(String(it.top).length));
    if (step.id === 'multi') assert.ok(level(s) === 'medium' && String(it.top).length === 3);
    if (step.id === 'four') assert.ok(['easy', 'medium'].includes(level(s)) && String(it.top).length === 4);
    if (step.id === 'zero1') assert.ok(level(s) === 'hard' && s.chain === 1 && String(it.top).length === 4, `${it.top} − ${it.bottom}`);
    if (step.id === 'zeros2') assert.ok(level(s) === 'hard' && s.chain >= 2 && String(it.top).length === 4, `${it.top} − ${it.bottom}`);
    if (it.kind === 'decide') { assert.equal(it.needs, s.exchanges ? 'Yes' : 'No'); assert.equal(it.first, s.firstNeed < 0 ? 'No column' : M.PLACES[s.firstNeed].name.replace(/^./, (c) => c.toUpperCase())); }
    if (it.kind === 'mistake') { assert.notEqual(it.wrong, it.top - it.bottom); assert.ok(it.choices.includes(it.answer)); assert.equal(new Set(it.choices).size, it.choices.length); assert.equal(it.choices.length, 4); }
    if (it.kind === 'check') { assert.equal(it.answer, `Add your answer to ${M.fmt(it.bottom)}. You should get ${M.fmt(it.top)}.`); assert.ok(it.choices.every((c) => !c.includes(M.fmt(it.top - it.bottom))), 'the choices never show the answer'); }
  }
});

test('targeted skills: 6 questions each, of the right kind, enough variety for repeated practice', () => {
  for (const sk of C.skills) {
    const seen = new Set();
    for (let seed = 1; seed <= 60; seed++) {
      const items = C.skillSession(sk.id, seed);
      assert.equal(items.length, C.SKILL_LENGTH, sk.id);
      assert.equal(new Set(items.map((q) => q.top + '-' + q.bottom)).size, items.length, `${sk.id}: no repeats in a session`);
      for (const q of items) {
        seen.add(q.top + '-' + q.bottom);
        const s = schoolbook(q.top, q.bottom);
        if (sk.id === 'one') assert.equal(level(s), 'easy');
        if (sk.id === 'multi') assert.equal(level(s), 'medium');
        if (sk.id === 'zero1') assert.ok(level(s) === 'hard' && s.chain === 1);
        if (sk.id === 'zeros2') assert.ok(level(s) === 'hard' && s.chain >= 2);
        if (sk.id === 'four') assert.ok(String(q.top).length === 4 && s.exchanges > 0);
        if (sk.id === 'decide') assert.equal(q.kind, 'decide');
        if (sk.id === 'mistakes') { assert.equal(q.kind, 'mistake'); assert.notEqual(q.wrong, q.top - q.bottom); }
      }
    }
    assert.ok(seen.size >= 200, `${sk.id}: ${seen.size} different problems over 60 sessions`);
  }
});

test('the test: 15 questions, at least eight 4-digit, every required kind, new numbers each attempt', () => {
  const firsts = new Set();
  for (let seed = 1; seed <= 400; seed++) {
    const items = C.testItems(seed);
    assert.equal(items.length, 15);
    assert.ok(items.filter((q) => String(q.top).length === 4).length >= 8);
    const kinds = items.map((q) => q.kind);
    for (const k of ['sub', 'steps', 'decide', 'mistake']) assert.ok(kinds.includes(k), k);
    const chains = items.filter((q) => q.kind !== 'decide').map((q) => schoolbook(q.top, q.bottom).chain);
    assert.ok(chains.includes(1) && chains.some((c) => c >= 2), 'single-zero and consecutive-zero cases');
    assert.equal(new Set(items.map((q) => q.top + '-' + q.bottom)).size, 15, 'no repeated problem');
    for (const q of items) {
      assert.ok(q.top <= 9999 && q.bottom <= q.top && q.bottom >= 1);
      if (q.kind === 'mistake') assert.ok(q.choices.includes(q.answer) && q.wrong !== q.top - q.bottom);
    }
    firsts.add(items[7].top + '-' + items[7].bottom);
  }
  assert.ok(firsts.size > 300, 'attempts get new numbers');
});

test('setup choices and unavailable combinations', () => {
  assert.deepEqual(C.SETUP.defaults, { size: 4, difficulty: 'easy', length: 10 });
  assert.deepEqual(C.SETUP.sizes.map((s) => s.v), [2, 3, 4, 'mixed']);
  assert.deepEqual(C.SETUP.difficulties.map((s) => s.v), ['easy', 'medium', 'hard', 'mixed']);
  assert.deepEqual(C.SETUP.lengths, [10, 25, 50]);
  assert.ok(M.unavailableReason(2, 'hard') && M.unavailableReason(2, 'medium'));
});
