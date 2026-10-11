// Unit tests for the Chapter 2 shared components (docs/chapter-2/DESIGN.md §3–§4): figures, `___` blanks,
// parts additions (anyOrder, compact, symbol), `chain` (all presets) and `vcalc` (digits, rows, blanks).
// Grading rules are the lesson specs' rules (2-5 §13, 2-6 §13, 2-7 §13, 2-8 §13, 2-10 §13 item 3, 2-11, 2-13, 2-14, 2-15).
// Run: npm test
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

require('../assets/js/place-value.js');
require('../assets/js/questions.js');
require('../assets/js/figures.js');
require('./fixtures/components-samples.js');
const MB = globalThis.Mathbook;
const { pv, Q, fig } = MB;
const FX = globalThis.FX;
const ROOT = path.join(__dirname, '..');

const base = { prompt: 'p', skill: 's', explanation: 'An explanation of the answer.' };
const ok = (q, r) => Q.grade(q, r);
const chk = (q, r) => Q.check(q, r);
const round = (r) => JSON.parse(JSON.stringify(r)); // saved state is plain JSON

test('every sample question: renders in every mode, correct answer grades right, blank never does, survives JSON', () => {
  for (const q of FX.questions) {
    for (const o of [{}, { mode: 'guided' }, { mode: 'test' }, { review: true, response: Q.correctResponse(q) }]) {
      assert.doesNotThrow(() => Q.render(q, 'k-' + q.id, o), `${q.id} renders ${JSON.stringify(o).slice(0, 30)}`);
    }
    const c = Q.correctResponse(q);
    assert.ok(Q.grade(q, c), `${q.id}: correct response grades right`);
    assert.ok(Q.grade(q, round(c)), `${q.id}: correct response grades right after a JSON round trip`);
    assert.ok(Q.isAnswered(q, c), `${q.id}: correct response is answered`);
    assert.ok(!Q.grade(q, Q.emptyResponse(q)), `${q.id}: a blank is never right`);
    assert.ok(!Q.isAnswered(q, Q.emptyResponse(q)), `${q.id}: a blank is not answered`);
    assert.ok(!Q.grade(q, undefined) && !Q.isAnswered(q, undefined), `${q.id}: no response at all`);
    assert.ok(Q.correctText(q).length > 2 && Q.describe(q, c).length > 2, `${q.id}: describe and correctText`);
    assert.equal(Q.describe(q, Q.emptyResponse(q)), 'No answer', `${q.id}: blank describes as No answer`);
  }
});

test('modes: guided shows helpers, test hides them (Decision 24), review has no inputs and marks every box', () => {
  const steps = FX.questions.find((q) => q.id === 'steps');
  const adj = FX.questions.find((q) => q.id === 'adjadd');
  const r = Q.correctResponse(adj);
  assert.match(Q.render(steps, 'a', { mode: 'guided' }), /ch-helper/);
  assert.doesNotMatch(Q.render(steps, 'a', { mode: 'test' }), /ch-helper/);
  assert.match(Q.render(adj, 'a', { mode: 'guided', response: r }), /class="ar-tag" data-tag="na">−5</);
  assert.doesNotMatch(Q.render(adj, 'a', { mode: 'test', response: r }), /ar-tag|changed by/);
  for (const q of FX.questions.filter((x) => x.type === 'chain' || x.type === 'vcalc')) {
    const html = Q.render(q, 'a', { review: true, response: Q.correctResponse(q) });
    assert.doesNotMatch(html, /<input/, `${q.id}: review is read-only`);
    assert.match(html, /mk-ok/, `${q.id}: review marks boxes`);
    assert.doesNotMatch(html, /mk-no/, `${q.id}: right answer has no ✗`);
    const empty = Q.render(q, 'a', { mode: 'test' });
    assert.doesNotMatch(empty, /mk-|fig-ans|ch-helper/, `${q.id}: test mode shows no marks, answers or helpers`);
  }
});

test('___ is drawn as a blank box in display and prompt, but select prompts keep their drop-down', () => {
  const h = Q.render({ type: 'number', prompt: 'Fill ___ in.', display: '245 + 132 = 132 + ___', answer: 245 }, 'k');
  assert.equal((h.match(/class="blank"/g) || []).length, 2);
  const s = Q.render({ type: 'select', prompt: 'The ___ of a digit.', choices: ['value', 'place'], answer: 'value' }, 'k');
  assert.doesNotMatch(s, /class="blank"/);
  assert.match(s, /<select/);
  assert.match(Q.visuals({ display: '3 + ___' }), /class="blank"/);
});

test('figures: every figure draws with a spoken label; q.figure goes through the registry', () => {
  for (const f of FX.figures) {
    const h = fig.html(f);
    if (f.fig === 'table') assert.match(h, /<table/);
    else assert.match(h, /role="img" aria-label="[^"]{8,}"/, `${f.fig} has a full-sentence label`);
  }
  assert.match(fig.html({ fig: 'arrows', a: 312, b: 465, op: '+', to: [300, 500], result: 800 }), /312 plus 465\. 312 rounds to 300, 465 rounds to 500\. 300 plus 500 equals 800\./);
  assert.match(fig.html({ fig: 'groupV', addends: [34, 50, 66], pair: [0, 2] }), /34 plus 50 plus 66\. Add 34 and 66 first: 100\. 100 plus 50 equals 150\./);
  assert.match(fig.html({ fig: 'bar', kind: 'ppw', parts: [248, '?'], sizes: [248, 315], whole: 563 }), /Bar diagram\. Whole: 563\. Parts: 248 and unknown\./);
  assert.match(fig.html({ fig: 'stack', rows: [2322, 1569], op: '+', partials: true }), /2,322 plus 1,569 in columns\. Partial sums 3,000, 800, 80, 11\. Total 3,891\./);
  assert.match(fig.html({ fig: 'nline', open: true, marks: [37, 40, 85], hops: [{ from: 37, to: 40, text: '+3' }, { from: 40, to: 85, text: '+45' }] }), /Number line: from 37 jump \+3 to 40, then jump \+45 to 85\./);
  // Left hops always carry a minus sign, so direction is never colour-only.
  assert.match(fig.html({ fig: 'nline', open: true, marks: [300, 333], hops: [{ from: 333, to: 300, text: '33' }] }), /nline-hoplabel is-left[^>]*>−33</);
  // Figures never use the classes the lesson tests treat as revealed answers in a test.
  for (const f of FX.figures) assert.doesNotMatch(fig.html(f), /is-answer|nline-dot/);
  const q = { type: 'number', prompt: 'p', answer: 1, figure: { fig: 'tree', n: 184, parts: [100, 80, 4] } };
  assert.match(Q.render(q, 'k'), /fig-tree/);
  assert.match(Q.visuals(q), /100 \+ 80 \+ 4 = 184/);
  assert.match(fig.html({ fig: 'table', title: 'T', head: ['Week', 'Mon', 'Tue', 'Wed'], rows: [['1', 2, 3, 4]] }), /is-tall/, 'wide tables have a transposed copy for phones');
});

test('numberLineHTML: the output 2-2 uses today is unchanged (compared with the committed version)', () => {
  let old;
  try { old = execSync('git show b4387f9:assets/js/place-value.js', { cwd: ROOT, encoding: 'utf8' }); } catch (e) { old = null; }
  if (!old) return;
  const g = {};
  new Function('globalThis', 'window', old)(g, undefined);
  const before = g.Mathbook.pv;
  for (let n = 0; n <= 1000; n += 7) {
    for (const place of [10, 100]) {
      for (const show of ['ends', 'mid', 'point', 'all']) assert.equal(pv.roundLineHTML(n, place, show), before.roundLineHTML(n, place, show));
    }
  }
  const cfg = { min: 200, max: 300, minor: 10, major: [200, 250, 300], below: [{ v: 200, text: '200' }], point: { v: 236, text: '236' }, go: { from: 236, to: 240 }, band: { from: 235, to: 244 }, label: 'L', caption: 'c' };
  assert.equal(pv.numberLineHTML(cfg), before.numberLineHTML(cfg));
});

test('number line extensions: open line keeps marks at least 12% apart; points alternate when close', () => {
  const h = pv.numberLineHTML({ open: true, marks: [37, 40, 85] });
  const lefts = Array.from(h.matchAll(/nline-tick is-major" style="left:([\d.]+)%/g)).map((m) => Number(m[1]));
  assert.equal(lefts.length, 3);
  assert.ok(lefts[1] - lefts[0] >= 11.99 && lefts[2] - lefts[1] >= 11.99, JSON.stringify(lefts));
  const p = pv.numberLineHTML({ min: 0, max: 100, points: [{ v: 20, text: 'A' }, { v: 24, text: 'B' }] });
  assert.equal((p.match(/nline-ptlabel is-below/g) || []).length, 1);
  const b = pv.numberLineHTML({ min: 0, max: 100, bands: [{ from: 10, to: 30, text: '20 apart' }, { from: 50, to: 70, text: '20 apart' }] });
  assert.equal((b.match(/nline-bandtext/g) || []).length, 2);
});

test('parts anyOrder: the group is graded as a set (either order), all right or all wrong', () => {
  const q = Object.assign({ type: 'parts', parts: [{ kind: 'num', label: 'First addend:', answer: 315, anyOrder: 'g' }, { kind: 'num', label: 'Second addend:', answer: 413, anyOrder: 'g' }, { kind: 'num', label: 'Whole:', answer: 728 }] }, base);
  assert.ok(ok(q, ['315', '413', '728']));
  assert.ok(ok(q, ['413', '315', '728']));
  assert.ok(ok(q, [' 413 ', '3 15', '728']), 'spaces are accepted');
  assert.ok(!ok(q, ['315', '315', '728']), 'a repeated value is not the set');
  assert.ok(!ok(q, ['315', '414', '728']));
  assert.ok(!ok(q, ['413', '315', '']));
  assert.equal(Q.partsTip(q, ['315', '414', '728']), 'Look again at: First addend; Second addend.');
  assert.match(Q.describe(q, ['413', '315', '728']), /First addend: 413 ✓ · Second addend: 315 ✓/);
  // Parts without anyOrder are unchanged (Decision 26).
  const plain = Object.assign({ type: 'parts', parts: [{ kind: 'num', label: 'A:', answer: 1 }, { kind: 'num', label: 'B:', answer: 2 }] }, base);
  assert.ok(!ok(plain, ['2', '1']));
  assert.equal(Q.partsTip(plain, ['1', '3']), 'Look again at: B.');
  // A label that ends in a period gets one period, not two (review L24-05; 2-3 "Choose the best way.").
  const dotted = { type: 'parts', parts: [{ kind: 'choice', label: 'Choose the best way.', choices: ['x', 'y'], answer: 'x' }, { kind: 'num', label: 'Estimate', answer: 5 }] };
  assert.equal(Q.partsTip(dotted, ['y', '5']), 'Look again at: Choose the best way.');
});

test('parts compact chips and the symbol picker', () => {
  const c = Object.assign({ type: 'parts', parts: [{ kind: 'multi', label: 'Pick:', compact: true, choices: ['1', '2', '3', '4'], answer: ['2'] }, { kind: 'choice', label: 'Which?', compact: true, choices: ['A', 'B', 'C'], answer: 'B' }] }, base);
  const h = Q.render(c, 'k');
  assert.match(h, /q-choices is-compact"/);
  assert.match(h, /q-choices is-compact is-three"/);
  assert.match(h, /type="checkbox"/);
  assert.match(h, /Choose every one that is correct/);
  const s = Object.assign({ type: 'parts', parts: [{ kind: 'symbol', left: 4127, right: 3986, choices: ['<', '>', '='], answer: '>' }] }, base);
  const sh = Q.render(s, 'k');
  assert.equal((sh.match(/type="radio"/g) || []).length, 3);
  assert.match(sh, /<span class="sr-only">greater than<\/span>/);
  assert.ok(ok(s, ['>']) && !ok(s, ['<']) && !ok(s, ['']));
  assert.equal(Q.describe(s, ['>']), '4,127 > 3,986 (greater than) ✓');
  assert.equal(Q.correctText(s), '4,127 > 3,986 (greater than)');
  const ne = Object.assign({ type: 'parts', parts: [{ kind: 'symbol', left: 15, right: 15, choices: ['=', '≠'], answer: '=' }] }, base);
  assert.ok(ok(ne, ['=']) && !ok(ne, ['≠']));
});

const chain = (o) => Object.assign({ type: 'chain' }, base, o);
const R = (v, t) => ({ v, t: t || [] });

test('chain free (2-5 eqmake): digits, parity as a set for mixed sentences, true sum (may be 4 digits)', () => {
  const ee = chain({ preset: 'free', addends: [{ digits: 3, parity: 'even' }, { digits: 3, parity: 'even' }] });
  assert.ok(ok(ee, R({ a: '204', b: '316', s: '520' })));
  assert.ok(ok(ee, R({ a: '998', b: '996', s: '1,994' })), 'sum above 999 accepted (decision 8)');
  assert.equal(chk(ee, R({ a: '314', b: '215', s: '529' })).msg, '314 + 215 = 529: 215 is odd, but the sentence needs two even numbers.');
  assert.deepEqual(chk(ee, R({ a: '314', b: '215', s: '529' })).bad, ['v:b']);
  assert.equal(chk(ee, R({ a: '24', b: '316', s: '340' })).msg, '24 is not a 3-digit number.');
  assert.ok(!ok(ee, R({ a: '204', b: '316', s: '521' })));
  assert.deepEqual(chk(ee, R({ a: '204', b: '316', s: '521' })).bad, ['v:s']);
  const mixed = chain({ preset: 'free', addends: [{ digits: 3, parity: 'even' }, { digits: 3, parity: 'odd' }] });
  assert.ok(ok(mixed, R({ a: '248', b: '135', s: '383' })));
  assert.ok(ok(mixed, R({ a: '135', b: '248', s: '383' })), 'either order (B-03)');
  assert.match(chk(mixed, R({ a: '135', b: '247', s: '382' })).msg, /both odd, but the sentence needs one even and one odd number/);
  const fixedOrder = chain({ preset: 'free', anyOrder: false, addends: [{ digits: 3, parity: 'even' }, { digits: 3, parity: 'odd' }] });
  assert.ok(!ok(fixedOrder, R({ a: '135', b: '248', s: '383' })));
});

test('chain rows (2-6 partial sums in a row): place values (300, not 3) in either order, partials and sum exact', () => {
  const q = chain({ preset: 'rows', addends: [367, 145] });
  const good = { p2_0: '300', p2_1: '100', s2: '400', p1_0: '60', p1_1: '40', s1: '100', p0_0: '7', p0_1: '5', s0: '12', S: '512' };
  assert.ok(ok(q, R(good)));
  assert.ok(ok(q, R(Object.assign({}, good, { p2_0: '100', p2_1: '300' }))), 'either order within a line');
  const bad = chk(q, R(Object.assign({}, good, { p2_0: '3' })));
  assert.equal(bad.msg, 'Look again at the hundreds line.');
  assert.deepEqual(bad.bad, ['v:p2_0']);
  assert.equal(chk(q, R(Object.assign({}, good, { S: '502' }))).msg, 'Look again at the sum line.');
  const three = chain({ preset: 'rows', addends: [241, 306, 132] });
  const c = Q.correctResponse(three);
  assert.ok(ok(three, c));
  c.v.p1_0 = '0'; c.v.p1_1 = '40'; // any order of the three tens values
  assert.ok(ok(three, c));
  const given = chain({ preset: 'rows', addends: [367, 145], given: 'places' });
  assert.ok(ok(given, R({ s2: '400', s1: '100', s0: '12', S: '512' })));
});

test('chain steps (2-7): any valid decomposition, each step against the child\'s own previous result, final exact', () => {
  const q = chain({ preset: 'steps', a: 362, b: 175 });
  assert.ok(ok(q, R({ r0: '262', r1: '192', r2: '187', f: '187' }, [['100', '70', '5']])));
  assert.ok(ok(q, R({ r0: '200', r1: '187', f: '187' }, [['162', '13']])), 'two parts');
  assert.ok(ok(q, R({ r0: '262', r1: '212', r2: '192', r3: '187', f: '187' }, [['100', '50', '20', '5']])), 'four parts');
  assert.ok(ok(q, R({ r0: '262', r1: '192', r2: '187', f: '187' }, [['100', '5', '70']].map((t) => t)) ) === false, 'rows follow the tree order');
  assert.ok(ok(q, R({ r0: '262', r1: '257', r2: '187', f: '187' }, [['100', '5', '70']])), 'any order of parts, steps follow the tree');
  const sumWrong = chk(q, R({ r0: '262', r1: '192', r2: '188', f: '188' }, [['100', '70', '4']]));
  assert.equal(sumWrong.msg, 'Your parts add to 174, not 175.');
  assert.deepEqual(sumWrong.bad.filter((k) => k.startsWith('t:')), ['t:0:0', 't:0:1', 't:0:2']);
  // One slip is reported once (decision 9): later steps that follow from it are not marked.
  const slip = chk(q, R({ r0: '252', r1: '182', r2: '177', f: '187' }, [['100', '70', '5']]));
  assert.deepEqual(slip.bad, ['v:r0']);
  assert.equal(slip.msg, 'Check 362 − 100.');
  const last = chk(q, R({ r0: '262', r1: '192', r2: '187', f: '178' }, [['100', '70', '5']]));
  assert.equal(last.msg, 'Your last step shows 187. Write it as the answer.');
  assert.ok(!ok(q, R({ r0: '362', r1: '292', r2: '187', f: '187' }, [['0', '70', '105']])), 'a part of 0 is not allowed');
  assert.equal(chk(q, R({ r0: '362', r1: '292', r2: '187', f: '187' }, [['0', '70', '105']])).msg, 'Write each part as a whole number, 1 or more.');
  const one = chain({ preset: 'steps', a: 362, b: 175, tree: { start: 2 } });
  assert.equal(Q.emptyResponse(one).t[0].length, 2);
  assert.equal(chain({ preset: 'steps', a: 1, b: 1, tree: { start: 9 } }) && Q.emptyResponse(chain({ preset: 'steps', a: 362, b: 175, tree: { start: 9 } })).t[0].length, 4, 'never more than 4 parts');
  const given = chain({ preset: 'steps', a: 674, b: 352, tree: { given: [300, 50, 2] } });
  assert.ok(ok(given, R({ r0: '374', r1: '324', r2: '322', f: '322' })));
  assert.ok(ok(given, R({ r0: '374', r1: '324', r2: '322', f: '322' }, [['352', '0', '0']])), 'given parts cannot be changed by the response');
  assert.match(Q.correctText(q), /\(any parts that add to 175 work\)$/);
});

test('chain trees (2-7 two ways): each tree valid (2–4 parts ≥ 1 adding to n), and the two sets differ (order ignored)', () => {
  const q = chain({ preset: 'trees', n: 175 });
  assert.ok(ok(q, R({}, [['100', '70', '5'], ['165', '10']])));
  assert.ok(!ok(q, R({}, [['100', '70', '5'], ['5', '100', '70']])), 'same parts in another order are the same way');
  assert.match(chk(q, R({}, [['100', '70', '5'], ['5', '100', '70']])).msg, /Both ways use the same parts/);
  assert.equal(chk(q, R({}, [['100', '70', '5'], ['100', '70']])).msg, 'Way 2: Your parts add to 170, not 175.');
  assert.ok(!ok(q, R({}, [['175'], ['165', '10']])), 'one part is not a decomposition');
});

test('chain frame and custom rows: exact boxes, commute where allowed (decision 15), true rows', () => {
  const q = chain({ rows: [{ cells: [{ in: 'a', answer: 315 }, '+', '?', '=', { in: 'b', answer: 728 }] }], final: { label: '? =', answer: 413 } });
  assert.ok(ok(q, R({ a: '315', b: '728', f: '413' })));
  assert.ok(!ok(q, R({ a: '728', b: '315', f: '413' })), 'the fixed frame decides the order');
  const free = chain({ rows: [{ cells: [{ in: 'a', answer: 315 }, '+', { in: 'b', answer: 413 }, '=', { in: 'c', answer: 728 }], commute: true }] });
  assert.ok(ok(free, R({ a: '413', b: '315', c: '728' })));
  assert.ok(!ok(free, R({ a: '413', b: '413', c: '728' })));
  const tr = chain({ rows: [{ cells: [{ in: 'a' }, '+', { in: 'b' }, '=', 100], true: true }] });
  assert.ok(ok(tr, R({ a: '37', b: '63' })) && !ok(tr, R({ a: '37', b: '62' })));
  assert.equal(chk(tr, R({ a: '37', b: '62' })).msg, 'Check your adding.');
});

test('chain adjust (2-8, 2-10 keep-the-sum, 2-11 keep-the-difference): any adjustment that keeps the answer, both changed', () => {
  const add = chain({ preset: 'adjust', a: 248, b: 195, op: '+' });
  const A = (na, nb, r) => R({ na, nb, r });
  assert.ok(ok(add, A('243', '200', '443')));
  assert.ok(ok(add, A('250', '193', '443')));
  assert.ok(ok(add, A('249', '194', '443')), 'a useless adjustment is still accepted (decision 10) …');
  assert.equal(Q.note(add, A('249', '194', '443')), 'Tip: try to make a ten or a hundred.', '… with only a gentle tip');
  assert.equal(Q.note(add, A('243', '200', '443')), '');
  assert.equal(chk(add, A('250', '197', '447')).msg, 'You changed both numbers the same way. In adding, one goes up and the other goes down.');
  assert.match(chk(add, A('248', '200', '448')).msg, /You changed only one number/);
  assert.equal(chk(add, A('195', '248', '443')).msg, 'Switching the order is not adjusting. Change the numbers.');
  assert.equal(chk(add, A('248', '195', '443')).msg, 'Change the numbers to make them easier to work with.');
  assert.equal(chk(add, A('443', '0', '443')).msg, 'Use whole numbers, 1 or more.');
  const wrongSum = chk(add, A('243', '200', '433'));
  assert.deepEqual(wrongSum.bad, ['v:r']);
  assert.equal(wrongSum.msg, 'Check 243 + 200.');
  assert.ok(ok(add, A('1,243', '-800', '443')) === false, 'only whole numbers');
  const sub = chain({ preset: 'adjust', a: 364, b: 198, op: '−' });
  assert.ok(ok(sub, A('366', '200', '166')));
  assert.ok(ok(sub, A('354', '188', '166')), 'taking the same amount from both also works');
  assert.equal(chk(sub, A('362', '200', '162')).msg, 'You changed them opposite ways. In subtracting, change both the same way.');
  assert.equal(chk(sub, A('370', '200', '170')).msg, 'Change both numbers by the same amount.');
  assert.match(chk(sub, A('364', '200', '164')).msg, /You changed only one number/);
  // 2-10 / 2-11 wording: a custom tip and labels; the pair can be any that keeps the answer.
  const keep = chain({ preset: 'adjust', a: 299, b: 456, op: '+', labels: ['299 becomes', '456 becomes', 'Sum'], tip: 'Try making one number end in 0 — it is easier.' });
  assert.ok(ok(keep, A('300', '455', '755')) && ok(keep, A('289', '466', '755')));
  assert.equal(Q.note(keep, A('298', '457', '755')), 'Try making one number end in 0 — it is easier.');
  assert.match(Q.render(keep, 'k', { mode: 'test' }), /aria-label="299 becomes"/);
  const one = chain({ preset: 'adjust', a: 336, b: 457, op: '+', oneNumber: true });
  assert.ok(ok(one, R({ na: '340', nb: '457', r: '797', f: '793' })));
  assert.ok(ok(one, R({ na: '336', nb: '460', r: '796', f: '793' })));
  assert.equal(chk(one, R({ na: '340', nb: '460', r: '800', f: '793' })).msg, 'Change just one of the numbers.');
  assert.equal(chk(one, R({ na: '340', nb: '457', r: '797', f: '797' })).msg, 'You changed one number by 4. Fix the answer so it matches 336 + 457.');
  assert.equal(Q.correctText(add), '248 + 195 → 243 + 200 = 443 (any change that keeps the sum the same works)');
  assert.equal(Q.correctText(sub), '364 − 198 → 366 − 200 = 166 (any change that keeps the difference the same works)');
});

const vq = (o) => Object.assign({ type: 'vcalc' }, base, o);
test('vcalc digits (2-14, 2-15): the answer row read as a number; regroup boxes never graded; first wrong column named', () => {
  const q = vq({ op: '+', top: 2457, bottom: 1368, carries: true });
  const d = (s) => { const a = ['', '', '', '', '']; s.split('').forEach((x, i) => { a[5 - s.length + i] = x; }); return a; };
  assert.ok(ok(q, { d: d('3825') }));
  assert.ok(ok(q, { d: ['0', '3', '8', '2', '5'] }), 'a leading 0 counts as empty');
  assert.ok(ok(q, { d: d('3825'), c: ['9', '9', 'x', '', ''] }), 'regroup marks are never graded');
  assert.ok(!ok(q, { d: d('3815') }));
  assert.equal(chk(q, { d: d('3815') }).msg, 'Look again at the tens.');
  assert.deepEqual(chk(q, { d: d('3815') }).bad, ['d:3']);
  assert.equal(chk(q, { d: d('4815') }).msg, 'Look again at the tens.', 'the first wrong column from the right');
  assert.ok(!Q.isAnswered(q, { d: ['', '3', '', '2', '5'] }), 'a gap is not an answer');
  assert.ok(!Q.isAnswered(q, { d: ['', '3', '8', '2', ''] }), 'the ones box is needed');
  assert.equal(Q.describe(q, { d: d('3825'), c: ['', '1', '', '1', ''] }), '3,825 (regroup marks: · 1 · 1 ·)');
  const five = vq({ op: '+', top: 47586, bottom: 35927 });
  assert.equal(Q.emptyResponse(five).d.length, 6);
  assert.ok(ok(five, Q.correctResponse(five)) && Q.correctText(five) === '83,513');
  const sub = vq({ op: '−', top: 58367, bottom: 23145 });
  assert.equal(Q.emptyResponse(sub).d.length, 5);
  assert.ok(ok(sub, { d: ['3', '5', '2', '2', '2'] }));
  const zero = vq({ op: '−', top: 45, bottom: 45 });
  assert.ok(ok(zero, { d: ['', '0'] }) && !ok(zero, { d: ['', ''] }));
  const h = Q.render(q, 'k', { mode: 'test' });
  assert.equal((h.match(/data-k="d:/g) || []).length, 5);
  assert.equal((h.match(/data-k="c:/g) || []).length, 4, 'a regroup box over every column except the ones');
  assert.match(h, /aria-label="regroup mark over the tens, optional"/);
  assert.match(h, /aria-label="ones digit of the answer"/);
  assert.match(h, /2,457 plus 1,368 written in columns\. Type the answer one digit at a time, starting with the ones\./);
  assert.doesNotMatch(Q.render(sub, 'k', { mode: 'test' }), /data-k="c:/, 'subtraction has no regroup boxes unless asked');
});

test('vcalc blanks (2-15 missing digits): all-or-nothing with per-cell marks', () => {
  const q = vq({ op: '−', top: 4867, bottom: 2345, blanks: { top: ['T'], bottom: ['H'], result: ['Th'] } });
  const right = { b: { 'b:top:T': '6', 'b:bottom:H': '3', 'b:result:Th': '2' } };
  assert.ok(ok(q, right));
  const one = { b: Object.assign({}, right.b, { 'b:bottom:H': '4' }) };
  assert.ok(!ok(q, one));
  assert.deepEqual(chk(q, one).bad, ['b:bottom:H']);
  assert.equal(chk(q, one).msg, 'Look again at the hundreds.');
  assert.ok(!Q.isAnswered(q, { b: { 'b:top:T': '6' } }));
  const h = Q.render(q, 'k', { mode: 'test' });
  assert.equal((h.match(/<input/g) || []).length, 3);
  assert.doesNotMatch(h, /data-k="d:/);
});

test('vcalc rows (2-6 stacked partial sums): each partial exact, total exact, typed notes in any order', () => {
  const q = vq({ op: '+', top: 367, bottom: 145, input: 'rows' });
  assert.ok(ok(q, { p: ['400', '100', '12'], s: '512' }));
  assert.equal(chk(q, { p: ['400', '10', '12'], s: '512' }).msg, 'Look again at the tens partial sum.');
  assert.equal(chk(q, { p: ['400', '100', '12'], s: '502' }).msg, 'Add the partial sums again.');
  const big = vq({ op: '+', top: 645, bottom: 482, input: 'rows' });
  assert.ok(ok(big, { p: ['1,000', '120', '7'], s: '1,127' }), 'commas accepted');
  const notes = vq({ op: '+', rows: [318, 204, 165], input: 'rows', notes: 'input' });
  assert.ok(ok(notes, { n: ['300 + 200 + 100', '10+0+60', '8 + 5 + 4'], p: ['600', '70', '17'], s: '687' }));
  assert.ok(!ok(notes, { n: ['3 + 2 + 1', '10+0+60', '8 + 5 + 4'], p: ['600', '70', '17'], s: '687' }));
});

test('tip, note and check for existing types keep their approved wording', () => {
  const e = Object.assign({ type: 'expanded', answer: 345 }, base);
  assert.equal(Q.tip(e, '345'), Q.expandedTip('345', 345));
  const p = Object.assign({ type: 'parts', parts: [{ kind: 'num', label: 'A:', answer: 1 }, { kind: 'num', label: 'B:', answer: 2 }] }, base);
  assert.equal(Q.tip(p, ['1', '3']), 'Look again at: B.');
  assert.equal(Q.tip(Object.assign({ type: 'number', answer: 3 }, base), '4'), '');
  assert.equal(Q.note(p, ['1', '2']), '');
});

test('README lists figures.js in the lesson page template', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /figures\.js/);
});
