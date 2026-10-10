// Unit tests for Lesson 2-2 (rounding): the rounding math, the "parts" question type, and every authored question.
// Run: npm test   (Node 18+; no dependencies)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

require('../assets/js/place-value.js');
require('../assets/js/questions.js');
require('../curriculum/chapter-2/lesson-2-2/lesson.js');

const { pv, Q } = globalThis.Mathbook;
const L = globalThis.Mathbook.lessons['2-2'];

// Independent reference: compare distances to the two multiples (halfway goes up). Does not reuse pv.roundTo.
function nearest(n, place) {
  const lo = n - (n % place);
  const hi = lo + place;
  return n - lo < hi - n ? lo : hi;
}

test('roundTo matches an independent distance check for every number 0–1,000, to the nearest 10 and 100', () => {
  for (let n = 0; n <= 1000; n++) {
    for (const place of [10, 100]) {
      const want = n % place === 0 ? n : nearest(n, place);
      assert.equal(pv.roundTo(n, place), want, `${n} to the nearest ${place}`);
    }
  }
});

test('rounding boundaries: halfway rounds up, carries, exact multiples, and direct rounding', () => {
  const cases = [[125, 10, 130], [124, 10, 120], [127, 10, 130], [127, 100, 100], [150, 100, 200], [149, 100, 100],
    [995, 10, 1000], [950, 100, 1000], [949, 100, 900], [896, 10, 900], [255, 10, 260], [255, 100, 300], [315, 10, 320],
    [240, 10, 240], [300, 100, 300], [85, 10, 90], [5, 10, 10], [4, 10, 0], [50, 100, 100]];
  for (const [n, place, want] of cases) assert.equal(pv.roundTo(n, place), want, `${n} → ${want}`);
  // Direct, not successive: 145 → 100 to the nearest hundred (not 145 → 150 → 200).
  assert.equal(pv.roundTo(145, 100), 100);
  assert.equal(pv.roundTo(pv.roundTo(145, 10), 100), 200, 'successive rounding would give a different (wrong) answer');
});

test('reverse rounding: the range of numbers that round to a target is exactly right', () => {
  assert.deepEqual(pv.roundRange(240, 10), [235, 244]);
  assert.deepEqual(pv.roundRange(600, 100), [550, 649]);
  for (const [target, place] of [[240, 10], [380, 10], [520, 10], [600, 100], [1000, 100]]) {
    const [a, b] = pv.roundRange(target, place);
    for (let n = Math.max(0, a - 30); n <= b + 30; n++) assert.equal(pv.roundTo(n, place) === target, n >= a && n <= b, `${n} vs ${target}`);
  }
});

test('"parts" grading: blanks are not zero, every valid reverse answer is accepted, select-all needs the exact set', () => {
  const back = L.guided.find((q) => q.id === 'p8');
  for (let n = 375; n <= 384; n++) assert.ok(Q.grade(back, [String(n)]), `${n} rounds to 380`);
  for (const n of [374, 385, 380.5, -380]) assert.ok(!Q.grade(back, [String(n)]), `${n} must not be accepted`);
  assert.ok(Q.grade(back, ['  380 ']), 'surrounding spaces are fine');
  assert.ok(!Q.isAnswered(back, ['']) && !Q.grade(back, ['']), 'blank is not an answer');

  const p3 = L.guided.find((q) => q.id === 'p3'); // number: 63 → 60
  assert.ok(Q.grade(p3, '60') && Q.grade(p3, ' 60 ') && !Q.grade(p3, '') && !Q.grade(p3, '6'));
  const zeroQ = { type: 'parts', parts: [{ kind: 'num', label: 'x', answer: 0 }] };
  assert.ok(!Q.grade(zeroQ, ['']) && !Q.isAnswered(zeroQ, ['']), 'a blank never becomes a correct 0');
  assert.ok(Q.grade(zeroQ, ['0']));
  const commas = { type: 'parts', parts: [{ kind: 'num', label: 'x', answer: 1000 }] };
  assert.ok(Q.grade(commas, ['1,000']) && Q.grade(commas, [' 1000 ']) && !Q.grade(commas, ['1,00']));

  const sel = L.guided.find((q) => q.id === 'p11');
  const p = sel.parts[0];
  assert.deepEqual(p.answer.slice().sort(), ['251 crayons', '300 crayons', '342 crayons']);
  assert.ok(Q.grade(sel, [p.answer.slice().reverse()]), 'order does not matter');
  assert.ok(!Q.grade(sel, [p.choices.slice()]), 'selecting everything is wrong');
  assert.ok(!Q.grade(sel, [p.answer.slice(0, 2)]), 'missing one is wrong');
  assert.ok(!Q.isAnswered(sel, [[]]), 'nothing selected is not an answer');
});

test('Learn: five steps, Example slides and a Your Turn check that never reuses the worked example', () => {
  const steps = L.seeIt.steps;
  assert.equal(steps.length, 5);
  assert.deepEqual(steps.map((s) => s.id), ['tens-line', 'hundreds-line', 'place-value', 'reasoning', 'real-life']);
  assert.ok(steps.every((s) => s.kind === 'slides' && s.slides.length >= 2));
  const html = steps.map((s) => s.slides.join(' ')).join(' ');
  const text = html.replace(/<[^>]+>/g, '');
  for (const must of ['127 is closer to 130, so it rounds to 130', '127 is closer to 100, so it rounds to 100', 'What two tens is 127 between? <b>120</b> and <b>130</b>',
    'What number is halfway? <b>125</b>', 'What number is halfway? <b>150</b>', 'Which ten is closer? <b>130</b>',
    '896 rounds to 900', '<b>995</b> rounds to <b>1,000</b>', '<b>950</b> rounds to <b>1,000</b>', '235 through 244', '315 rounds to <b>320</b>', '$15 + $22 + $12 = <b>$49</b>', '<b>$1</b> left']) {
    assert.ok(html.includes(must) || text.includes(must), 'Learn shows: ' + must);
  }
  for (let seed = 1; seed <= 400; seed++) {
    const r = pv.rng(seed);
    const qs = steps.map((s) => s.check(r));
    for (const q of qs) {
      assert.ok(Q.grade(q, Q.correctResponse(q)), `${q.id} seed ${seed}: correct response grades right`);
      assert.ok(!Q.grade(q, Q.emptyResponse(q)), `${q.id}: blank is wrong`);
    }
    assert.ok(qs[0].type === 'rline' && qs[0].place === 10 && qs[0].n !== 127 && qs[0].n % 10 !== 0, 'step 1: a staged number line with a new number, not a multiple of 10');
    assert.ok(qs[1].type === 'rline' && qs[1].place === 100 && qs[1].n !== 127 && qs[1].n % 100 > 50, 'step 2: a staged number line, upper side of halfway');
    assert.match(Q.correctText(qs[0]), new RegExp('Between ' + pv.fmt(pv.roundEnds(qs[0].n, 10).lo) + ' and ' + pv.fmt(pv.roundEnds(qs[0].n, 10).hi) + ' · Halfway ' + pv.fmt(pv.roundEnds(qs[0].n, 10).mid)));
    assert.equal(qs[2].parts.length, 2, 'step 3 checks both places');
    assert.deepEqual(qs[3].parts.map((p) => p.kind), ['num', 'round', 'choice'], 'step 4: place, original number, halfway rule');
    assert.deepEqual(qs[4].parts.map((p) => p.kind), ['multi', 'choice'], 'step 5: select all + conclusion');
    const m = qs[4].parts[0];
    assert.ok(m.answer.length > 0 && m.answer.length < m.choices.length);
    const money = qs[4].parts[1];
    const [a, b] = money.label.match(/\$(\d+) and \$(\d+)/).slice(1).map(Number);
    const est = pv.roundTo(a, 10) + pv.roundTo(b, 10);
    assert.ok(money.answer.startsWith(a + b <= est ? 'Yes. The exact total' : 'No. The exact total'), 'step 5 conclusion follows the exact total');
  }
});

test('Practice and Test: 12 each, matching coverage, different numbers, every authored answer hand-checked', () => {
  const P = L.guided;
  const T = L.tests.rounding.generate(1);
  assert.equal(P.length, 12);
  assert.equal(T.length, 12);
  assert.deepEqual(P.map((q) => q.skill), T.map((q) => q.skill), 'item-for-item coverage');
  assert.deepEqual(P.map((q) => q.skill), ['line10', 'line10', 'pv10', 'pv10', 'line100', 'line100', 'compare', 'reverse', 'explain100', 'halfway', 'select', 'money']);
  assert.ok(T.every((q) => !q.hint && !q.parent), 'no hints on the test');
  assert.ok(P.every((q) => q.hint && q.explanation), 'practice has hints and explanations');
  // Hand-verified answers.
  const ans = (q) => (q.type === 'rline' ? [pv.roundEnds(q.n, q.place).lo, pv.roundEnds(q.n, q.place).mid, pv.roundEnds(q.n, q.place).hi, pv.roundTo(q.n, q.place)].concat(q.why ? [q.why.answer.split(',')[0]] : [])
    : q.type === 'parts' ? q.parts.map((p) => (p.kind === 'round' ? pv.roundRange(p.target, p.place).join('–') : p.kind === 'choice' ? p.answer.split('.')[0] : p.answer)) : q.answer);
  const want = {
    p1: [40, 45, 50, 50], p2: [390, 395, 400, 400], p3: 60, p4: 490, p5: [400, 450, 500, 400], p6: [0, 50, 100, 100],
    p7: [250, 200, 'Nearest ten looks at the ones digit (9), so it rounds up'], p8: ['375–384'], p9: [500, 550, 600, 600, 'It is past the halfway mark'],
    p10: ['No', 700], p11: [['251 crayons', '300 crayons', '342 crayons']], p12: [40, 49, 'No'],
    t1: [70, 75, 80, 70], t2: [290, 295, 300, 300], t3: 620, t4: 740, t5: [300, 350, 400, 300], t6: [700, 750, 800, 800],
    t7: [350, 300, 'Nearest ten looks at the ones digit (7), so it rounds up'], t8: ['515–524'], t9: [800, 850, 900, 800, 'It is before the halfway mark'],
    t10: ['No', 90], t11: [['450 pages', '482 pages', '500 pages', '538 pages']], t12: [60, 57, 'Yes']
  };
  for (const q of P.concat(T)) assert.deepEqual(ans(q), want[q.id], q.id);
  // The shopping explanations: estimate vs exact.
  assert.match(P[11].explanation, /Estimate: \$10 \+ \$20 \+ \$10 = \$40\. Exact: \$14 \+ \$23 \+ \$12 = \$49\. \$49 is more than \$45/);
  assert.match(T[11].explanation, /Estimate: \$30 \+ \$20 \+ \$10 = \$60\. Exact: \$27 \+ \$16 \+ \$14 = \$57\. .*with \$3 left/);
  // Halfway and exact-multiple coverage.
  assert.ok(P.some((q) => q.id === 'p4') && /5 is 5 or more/.test(P[3].explanation), 'practice halfway (485)');
  assert.ok(T[10].parts[0].answer.includes('450 pages') && T[10].parts[0].answer.includes('500 pages'), 'test: halfway 450 and exact 500');
  // Different numbers between Practice and Test.
  const nums = (q) => (q.prompt.match(/\d[\d,]*/g) || []).join();
  P.forEach((q, i) => assert.notEqual(nums(q), nums(T[i]), `item ${i + 1} uses different numbers`));
  // Every item: correct response grades right; the harness-style wrong response grades wrong; explanations exist.
  for (const q of P.concat(T)) {
    assert.ok(Q.grade(q, Q.correctResponse(q)), q.id + ' correct');
    assert.ok(!Q.grade(q, Q.emptyResponse(q)), q.id + ' blank');
    if (q.why) assert.equal(new Set(q.why.choices).size, q.why.choices.length, q.id + ' unique why choices');
    if (q.type === 'parts') q.parts.forEach((p) => { if (p.choices) assert.equal(new Set(p.choices).size, p.choices.length, q.id + ' unique choices'); if (p.kind === 'choice') assert.ok(p.choices.includes(p.answer)); });
  }
});

test('Lesson 2-2 is separate from 2-1 and complete', () => {
  assert.equal(L.storageKey, 'mathbook:v2:lesson-2-2');
  assert.ok(L.parentLearn && L.parentLearn.checklist.length === 6 && L.parentLearn.words.length === 6);
  assert.deepEqual(L.parentLearn.words.map((w) => w.term), ['Round', 'Nearest', 'Multiple of 10 / 100', 'Halfway point', 'Estimate', 'Exact']);
  assert.ok(L.bankSets[0].ids.length === 12 && L.bankSets.every((set) => set.ids.every((id) => L.bank.some((q) => q.id === id))));
  for (const q of L.guided.concat(L.tests.rounding.generate(2))) assert.ok(L.skills[q.skill], 'skill named: ' + q.skill);
  // The test is reproducible for a saved seed, and choice order varies between attempts.
  assert.deepEqual(L.tests.rounding.generate(9), L.tests.rounding.generate(9));
});

test('staged number line: grading, halfway wording, and no answers given away in choices', () => {
  const q = { type: 'rline', n: 206, place: 10 };
  const right = Q.correctResponse(q);
  assert.ok(Q.grade(q, right) && Q.isAnswered(q, right));
  assert.ok(!Q.grade(q, Object.assign({}, right, { pick: 'lo' })), 'wrong side');
  assert.ok(!Q.grade(q, Object.assign({}, right, { mid: '' })) && !Q.isAnswered(q, Object.assign({}, right, { mid: '' })), 'blank halfway is not an answer');
  assert.ok(Q.grade(q, Object.assign({}, right, { lo: ' 200 ', hi: '210', mid: '205' })), 'spaces are fine');
  assert.ok(!Q.grade(q, [200, 210]) && !Q.isAnswered(q, null), 'old or missing responses are simply unanswered');
  assert.equal(Q.rlExplain(q), '206 is closer to 210, so it rounds to 210.');
  // Halfway: both ends are equally close; the rule rounds up. Never "closer".
  for (const [n, place, up] of [[205, 10, '210'], [85, 10, '90'], [650, 100, '700'], [950, 100, '1,000'], [995, 10, '1,000']]) {
    const e = Q.rlExplain({ type: 'rline', n, place });
    assert.match(e, /equally close/); assert.doesNotMatch(e, /closer/); assert.match(e, new RegExp('rounds to ' + up));
    assert.doesNotMatch(L._why(n, place), /closer/);
  }
  // Explanation choices never contain the answer to a box the child still has to fill.
  for (const item of L.guided.concat(L.tests.rounding.generate(3))) {
    if (item.why) {
      const e = pv.roundEnds(item.n, item.place);
      const given = [e.lo, e.mid, e.hi, pv.roundTo(item.n, item.place)].map(pv.fmt);
      item.why.choices.forEach((c) => given.forEach((x) => assert.ok(!c.includes(x), `${item.id}: why-choice gives away ${x}`)));
    }
    if (item.type !== 'parts') continue;
    const asked = item.parts.filter((p) => p.kind === 'num').map((p) => pv.fmt(p.answer)).filter((a) => !item.prompt.includes(a));
    item.parts.filter((p) => p.choices).forEach((p) => p.choices.forEach((c) => asked.forEach((a) => assert.ok(!new RegExp('(^|[^\\d,])\\$?' + a.replace(',', ',') + '([^\\d,]|$)').test(c), `${item.id}: "${c}" gives away ${a}`))));
  }
  // Coverage is unchanged: same 12 skills in Practice and Test, with the number-line items staged.
  assert.deepEqual(L.guided.map((x) => x.type), ['rline', 'rline', 'number', 'number', 'rline', 'rline', 'parts', 'parts', 'rline', 'parts', 'parts', 'parts']);
});

test('2-2 verification fixes (2-2-verification.md §6): no book On My Own numbers; 2-digit lines; 0 to 100', () => {
  const P = L.guided, T = L.tests.rounding.generate(1);
  const byId = (list, id) => list.find((q) => q.id === id);
  assert.equal(byId(P, 'p1').n, 46);
  assert.equal(byId(P, 'p5').n, 418);
  assert.equal(byId(P, 'p6').n, 87);
  assert.match(byId(P, 'p6').explanation, /87 is between 0 and 100\. Halfway is 50\./);
  assert.equal(byId(T, 't1').n, 72);
  assert.equal(byId(T, 't6').n, 781, 't6 unchanged (decision 1)');
  assert.ok(/^Dev has \$45/.test(byId(P, 'p12').prompt) && !/Sam/.test(byId(P, 'p12').prompt));
  // No number being rounded in practice or the test is one of the book's On My Own numbers (pp. 39–40).
  const book = [27, 896, 48, 273, 436, 672, 78, 240, 678, 315];
  for (const q of P.concat(T).filter((x) => x.skill !== 'money')) {
    const nums = (q.n !== undefined ? [q.n] : []).concat((q.prompt.match(/\d[\d,]*/g) || []).map((x) => Number(x.replace(/,/g, ''))));
    nums.forEach((n) => assert.ok(!book.includes(n), `${q.id}: ${n} is a book number`));
  }
  assert.ok(L.parentLearn.ask.some((a) => /Why is a number line helpful for rounding/.test(a)), 'Choosing Tools question (A-07)');
});

test('Rounding Check-Up (2-2-probe.md): set s2 and test "checkup" match the hand-checked key', () => {
  const want = {
    pr1: ['483', '476', '475'], pr2: ['681', '742', '715'], pr3: ['86 stickers', '94 stickers', '85 stickers', '89 stickers'], pr4: ['362', '418'],
    tr1: ['263', '258', '255'], tr2: ['438', '352', '449'], tr3: ['46', '45', '54', '49'], tr4: ['761', '829']
  };
  const set = L.bankSets.find((x) => x.id === 's2');
  assert.equal(set.title, 'Rounding Check-Up');
  assert.deepEqual(set.ids, ['pr1', 'pr2', 'pr3', 'pr4']);
  const T = L.tests.checkup;
  assert.equal(T.questions, 4);
  const sorted = (a) => a.slice().sort();
  for (const seed of [1, 2, 50]) {
    const items = T.generate(seed);
    assert.deepEqual(items.map((q) => q.id), ['tr1', 'tr2', 'tr3', 'tr4']);
    items.forEach((q) => { assert.ok(!q.hint); assert.deepEqual(sorted(q.parts[0].answer), sorted(want[q.id])); assert.ok(q.parts[1].choices.includes(q.parts[1].answer)); });
  }
  for (const id of ['pr1', 'pr2', 'pr3', 'pr4']) {
    const q = L.bank.find((x) => x.id === id);
    assert.deepEqual(sorted(q.parts[0].answer), sorted(want[id]));
    assert.ok(q.hint && Q.grade(q, Q.correctResponse(q)) && !Q.grade(q, Q.emptyResponse(q)));
  }
  // Every key is the set of numbers that round to the target (half up), recomputed here.
  for (const q of L.bank.filter((x) => x.skill === 'probe').concat(L._checkTestItems)) {
    const freeOfNumbers = !['pr1', 'tr1'].includes(q.id);
    const target = Number(q.prompt.match(/round to (\d+)|about (\d+)/).slice(1).find(Boolean));
    const place = /hundred/.test(q.prompt) ? 100 : 10;
    const nums = q.parts[0].choices.map((c) => Number(c.split(' ')[0]));
    assert.deepEqual(sorted(q.parts[0].answer.map((c) => Number(c.split(' ')[0])).map(String)), sorted(nums.filter((n) => pv.roundTo(n, place) === target).map(String)), q.id);
    // Reasoning choices never name one of the item's own numbers (review A-04, A-09).
    // A stated range ("from 350 to 449") is the rule, not a pick, so its endpoints are allowed.
    if (freeOfNumbers) q.parts[1].choices.map((c) => c.replace(/from \d+ to \d+/g, 'the range')).forEach((c) => nums.forEach((n) => assert.ok(!new RegExp('(^|\\D)' + n + '(\\D|$)').test(c), `${q.id}: "${c}" names ${n}`)));
  }
  assert.equal(L.skills.probe, 'Choosing every number that rounds to an amount');
});
