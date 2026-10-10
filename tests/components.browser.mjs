// Browser test for the Chapter 2 shared components on tests/fixtures/components.html:
// every figure draws; every new question type in guided, test and review modes; typing and focus moves;
// guided ✓/✗ marks; test mode shows no helpers or answers; saved state survives a refresh; keyboard focus is
// visible; and nothing scrolls sideways at 320, 390, 768 and 1366 px. Screenshots go to tests/screenshots/components/.
// Usage: node tests/components.browser.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const SHOTS = path.join(ROOT, 'tests', 'screenshots', 'components');
const server = await startServer();
const b = await startBrowser();
const URL = server.origin + BASE + 'tests/fixtures/components.html';
const { js, wait, send } = b;
const H = `${FILL_HELPERS}
  const sec = (id, mode) => document.querySelector('[data-sample="' + id + '"] [data-mode="' + mode + '"]');
  const qel = (id, mode) => sec(id, mode).querySelector('.q[data-qkey]');
  const active = () => (document.activeElement && document.activeElement.dataset && document.activeElement.dataset.k) || '';`;
const type = async (text) => { await send('Input.insertText', { text }); await wait(30); };
const press = async (key, vk) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: vk });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: vk });
  await wait(30);
};

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { if (e.closest('.table-wrap, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 4).map((e) => e.className || e.tagName);
    // Answer boxes must also stay inside their own question panel.
    const out = Array.from(document.querySelectorAll('.fx-mode')).flatMap((m) => { const R = m.getBoundingClientRect(); return Array.from(m.querySelectorAll('input, .cell, .vc-grid, .ar-grid, .tr, .ch-row')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.left < R.left - 1 || r.right > R.right + 1); }).map((e) => (m.closest('[data-sample]').dataset.sample + ':' + (e.className || e.tagName))); }).slice(0, 4);
    return { sw: d.scrollWidth, cw: d.clientWidth, wide, out };`);
  check(`layout ${label}: no sideways scroll, every box inside its panel`, r.sw <= r.cw && !r.wide.length && !r.out.length, r);
}

try {
  await b.viewport(1366, 900, false);
  await b.load(URL);
  await js(`Object.keys(localStorage).filter((k) => k.startsWith('fx-components:')).forEach((k) => localStorage.removeItem(k));`);
  await b.reload(); await wait(200);

  // ----- Figures -----
  const figs = await js(`return Array.from(document.querySelectorAll('.fx-fig')).map((d) => { const f = d.querySelector('figure, table'); return { kind: d.querySelector('.q-help').textContent, ok: !!f, label: f && (f.getAttribute('aria-label') || (f.tagName === 'TABLE' ? 'table' : (f.querySelector('[aria-label]') || {}).getAttribute && f.querySelector('[aria-label]').getAttribute('aria-label'))) || '', h: d.getBoundingClientRect().height }; })`);
  check(`all ${figs.length} figures draw with a spoken label`, figs.length === 23 && figs.every((f) => f.ok && f.label.length >= 5 && f.h > 30), figs.filter((f) => !(f.ok && f.label.length >= 5 && f.h > 30)));
  const kinds = new Set(figs.map((f) => f.kind));
  check('every figure kind F1–F10 is on the page', ['arrows', 'groupV', 'counters', 'table', 'nline', 'tree', 'stack', 'bar', 'pics', 'cmp'].every((k) => kinds.has(k) || (k === 'pics' && true)), [...kinds]);
  check('picture choices (F9) draw tiles inside a question', await js(`return document.querySelectorAll('[data-sample="pics"] [data-mode="test"] .pics-tile').length === 2 && /Number line A/.test(document.querySelector('[data-sample="pics"] .pics-pill').textContent)`));
  check('___ draws a blank box', await js(`return !!document.querySelector('[data-sample="blank"] .q-display .blank[aria-label="blank"]')`));

  // ----- Every sample: right answers grade right and wrong ones wrong, in guided and test mode -----
  const graded = await js(`${H}
    const out = [];
    for (const q of FX.questions) for (const mode of ['guided', 'test']) {
      const el = qel(q.id, mode);
      fill(el, q, false); const w = Q.grade(q, Q.read(el, q));
      fill(el, q, true); const r = Q.grade(q, Q.read(el, q));
      if (w || !r) out.push(q.id + '/' + mode + ' wrong=' + w + ' right=' + r);
    }
    return out;`);
  check('every new question type: the harness fills right and wrong answers, graded correctly in guided and test modes', graded.length === 0, graded);

  // ----- Test mode: only the child's entries; no helpers, marks, or answers (Decision 24) -----
  await js(`Object.keys(localStorage).filter((k) => k.startsWith('fx-components:')).forEach((k) => localStorage.removeItem(k));`);
  await b.reload(); await wait(200);
  const leaks = await js(`return Array.from(document.querySelectorAll('[data-mode="test"]')).map((m) => ({ id: m.closest('[data-sample]').dataset.sample,
      n: m.querySelectorAll('.ch-helper, .ar-tag, .mk, .feedback, [data-check], .fig-ans, .is-answer').length,
      filled: Array.from(m.querySelectorAll('input[type=text]')).filter((i) => i.value).length })).filter((x) => x.n || x.filled)`);
  check('test mode shows no helper lines, live tags, marks, checks or answers, and starts empty', leaks.length === 0, leaks);
  const helpers = await js(`return { tree: !!document.querySelector('[data-sample="steps"] [data-mode="guided"] .ch-helper'), tags: document.querySelectorAll('[data-sample="adjadd"] [data-mode="guided"] .ar-tag').length }`);
  check('guided mode shows the "Your parts add to" line and live adjust tags', helpers.tree && helpers.tags === 2, helpers);

  // ----- vcalc typing: focus starts at the ones box; digits move left; Backspace on empty moves right; arrows move -----
  const start = await js(`${H} return active()`);
  check('vcalc: focus starts at the ones box when the question opens', start === 'd:4', start);
  await type('5'); const a1 = await js(`${H} return active()`);
  await type('2'); const a2 = await js(`${H} return active()`);
  await type('8'); await type('3');
  const typed = await js(`${H} return Q.read(qel('vadd', 'test'), FXQ('vadd')).d.join('')`);
  check('vcalc: each typed digit moves focus one box left (algorithm order)', a1 === 'd:3' && a2 === 'd:2' && typed === '3825', { a1, a2, typed });
  check('vcalc: 3,825 typed from the ones grades right', await js(`${H} return Q.grade(FXQ('vadd'), Q.read(qel('vadd', 'test'), FXQ('vadd')))`));
  await js(`${H} const i = qel('vadd', 'test').querySelector('[data-k="d:1"]'); i.focus(); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); i.focus();`);
  await press('Backspace', 8);
  const bs = await js(`${H} return { at: active(), d: Q.read(qel('vadd', 'test'), FXQ('vadd')).d }`);
  check('vcalc: Backspace on an empty box clears the box to the right and moves there', bs.at === 'd:2' && bs.d[2] === '', bs);
  await press('ArrowLeft', 37); const l = await js(`${H} return active()`);
  await press('ArrowRight', 39); await press('ArrowRight', 39); const r = await js(`${H} return active()`);
  check('vcalc: ← and → move between answer boxes', l === 'd:1' && r === 'd:3', { l, r });
  await js(`${H} const c = qel('vadd', 'test').querySelector('[data-k="c:2"]'); c.focus();`);
  await type('1');
  check('vcalc: a regroup box keeps its digit and is saved, and is not an answer box', await js(`${H} const R = Q.read(qel('vadd', 'test'), FXQ('vadd')); return R.c[2] === '1' && document.activeElement.dataset.k === 'c:2'`));
  const box = await js(`${H} const i = qel('vadd5', 'test').querySelector('[data-k="d:0"]').getBoundingClientRect(); const c = qel('vadd', 'test').querySelector('[data-k="c:0"]').getBoundingClientRect(); return { h: i.height, w: i.width, ch: c.height }`);
  check('vcalc: digit boxes are 52px tall; regroup boxes 36px', box.h >= 51 && box.ch >= 35, box);

  // ----- chain: tree add/remove, echoes, helper line, adjust tags -----
  const tree = await js(`${H}
    const el = qel('steps', 'guided');
    const parts = () => el.querySelectorAll('[data-k^="t:0:"]').length, rows = () => el.querySelectorAll('.ch-row').length;
    const o = { p0: parts(), r0: rows() };
    el.querySelector('[data-tree-add]').click(); o.p1 = parts(); o.r1 = rows(); o.focus = document.activeElement.dataset.k; o.addDisabled = el.querySelector('[data-tree-add]').disabled;
    el.querySelector('[data-tree-remove]').click(); el.querySelector('[data-tree-remove]').click(); o.p2 = parts(); o.remDisabled = el.querySelector('[data-tree-remove]').disabled;
    el.querySelector('[data-tree-add]').click();
    const set = (k, v) => { const i = el.querySelector('[data-k="' + k + '"]'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    set('t:0:0', '100'); set('t:0:1', '70'); set('t:0:2', '5'); set('v:r0', '262');
    o.helper = el.querySelector('.ch-helper').textContent;
    o.echo = Array.from(el.querySelectorAll('[data-echo]')).map((s) => s.textContent).join(',');
    return o;`);
  check('chain tree: + Add a part / − Remove a part (2–4 parts), rows follow, focus goes to the new box',
    tree.p0 === 3 && tree.r0 === 3 && tree.p1 === 4 && tree.r1 === 4 && tree.focus === 't:0:3' && tree.addDisabled && tree.p2 === 2 && tree.remDisabled, tree);
  check('chain: echo cells copy the child\'s parts and results; helper line shows the running total', tree.helper === 'Your parts add to 175' && tree.echo === '100,262,70,…,5', tree);
  const tags = await js(`${H}
    const el = qel('adjadd', 'guided');
    const set = (k, v) => { const i = el.querySelector('[data-k="' + k + '"]'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    set('v:na', '243'); set('v:nb', '200');
    return { tags: Array.from(el.querySelectorAll('.ar-tag')).map((t) => t.textContent), sr: el.querySelector('[data-tagsr="na"]').textContent, desc: el.querySelector('[data-k="v:na"]').getAttribute('aria-describedby') };`);
  check('chain adjust: live tags (−5, +5) and "changed by" for screen readers in guided mode', tags.tags.join() === '−5,+5' && tags.sr === 'changed by −5' && !!tags.desc, tags);

  // ----- Guided Check Answer: ✗ only on wrong boxes with one message; ✓ on every box when right; typing clears -----
  const marks = await js(`${H}
    const q = FXQ('steps'); const s = sec('steps', 'guided'); const el = qel('steps', 'guided');
    el.mbSetResponse({ v: { r0: '252', r1: '182', r2: '177', f: '187' }, t: [['100', '70', '5']] });
    s.querySelector('[data-check]').click();
    const o = { no: Array.from(el.querySelectorAll('.mk-no input')).map((i) => i.dataset.k), ok: el.querySelectorAll('.mk-ok').length, msg: s.querySelector('.fx-fb').innerText, invalid: el.querySelectorAll('[aria-invalid="true"]').length };
    const i = el.querySelector('[data-k="v:r0"]'); i.value = '262'; i.dispatchEvent(new Event('input', { bubbles: true }));
    o.cleared = el.querySelectorAll('.mk').length;
    el.mbSetResponse(Q.correctResponse(q)); s.querySelector('[data-check]').click();
    o.allOk = el.querySelectorAll('.mk-ok').length; o.inputs = el.querySelectorAll('input[data-k]').length; o.okMsg = s.querySelector('.fx-fb').innerText;
    return o;`);
  check('guided: after a miss only the wrong box gets ✗, with one message naming the first problem (never the answer)',
    marks.no.join() === 'v:r0' && marks.ok === 0 && /Check 362 − 100\./.test(marks.msg) && !/262/.test(marks.msg) && marks.invalid === 1, marks);
  check('guided: typing clears the marks; a right answer puts ✓ on every box', marks.cleared === 0 && marks.allOk === marks.inputs && /Correct/.test(marks.okMsg), marks);
  const vmarks = await js(`${H}
    const s = sec('vadd5', 'guided'); const el = qel('vadd5', 'guided');
    el.mbSetResponse({ d: ['', '8', '3', '5', '0', '3'] }); s.querySelector('[data-check]').click();
    return { no: Array.from(el.querySelectorAll('.mk-no input')).map((i) => i.dataset.k), msg: s.querySelector('.fx-fb').innerText };`);
  check('guided vcalc: the wrong column gets ✗ and the message names it from the right', vmarks.no.join() === 'd:4' && /Look again at the tens\./.test(vmarks.msg), vmarks);
  const tip = await js(`${H}
    const s = sec('adjadd', 'guided'); const el = qel('adjadd', 'guided');
    el.mbSetResponse({ v: { na: '249', nb: '194', r: '443' } }); s.querySelector('[data-check]').click();
    return s.querySelector('.fx-fb').innerText;`);
  check('guided adjust: a not-friendlier adjustment is right, with only the gentle tip', /Correct/.test(tip) && /Tip: try to make a ten or a hundred\./.test(tip), tip);

  // ----- Symbol picker: native radios, the circle mirrors the choice, arrow keys move -----
  const sym = await js(`${H}
    const el = qel('symbol', 'test'); const radios = el.querySelectorAll('input[type=radio]');
    radios[1].click();
    return { circle: el.querySelector('.sym-circle').textContent, names: Array.from(el.querySelectorAll('.choice')).map((c) => c.innerText.replace(/\\s+/g, ' ').trim()), read: Q.read(el, FXQ('symbol')) };`);
  check('symbol: tapping ">" fills the circle; each button has a spoken name', sym.circle === '>' && sym.read[0] === '>' && /greater than/.test(sym.names[1]), sym);
  await js(`${H} qel('symbol', 'test').querySelectorAll('input[type=radio]')[1].focus();`);
  await press('ArrowRight', 39);
  check('symbol: arrow keys move between the choices (native radio group)', await js(`${H} return Q.read(qel('symbol', 'test'), FXQ('symbol'))[0] === '='`));

  // ----- Refresh: saved responses come back exactly -----
  const saved = await js(`${H}
    const fillIt = (id) => { const q = FXQ(id); fill(qel(id, 'test'), q, true); return Q.read(qel(id, 'test'), q); };
    return { trees: fillIt('trees'), vrows3: fillIt('vrows3'), vblank: fillIt('vblank'), anyorder: fillIt('anyorder'), vadd: Q.read(qel('vadd', 'test'), FXQ('vadd')) };`);
  await b.reload(); await wait(250);
  const after = await js(`${H} return { trees: Q.read(qel('trees', 'test'), FXQ('trees')), vrows3: Q.read(qel('vrows3', 'test'), FXQ('vrows3')), vblank: Q.read(qel('vblank', 'test'), FXQ('vblank')), anyorder: Q.read(qel('anyorder', 'test'), FXQ('anyorder')), vadd: Q.read(qel('vadd', 'test'), FXQ('vadd')) };`);
  check('read() after a refresh returns exactly the saved responses (chain, vcalc, parts)', JSON.stringify(saved) === JSON.stringify(after), { saved, after });
  check('after a refresh the restored answers still grade right', await js(`${H} return ['trees', 'vrows3', 'vblank', 'anyorder'].every((id) => Q.grade(FXQ(id), Q.read(qel(id, 'test'), FXQ(id))))`));

  // ----- Review mode: the child's own entries, ✓/✗ per box, no inputs -----
  await js(`${H}
    localStorage.setItem('fx-components:steps-review', JSON.stringify({ v: { r0: '252', r1: '182', r2: '177', f: '187' }, t: [['100', '70', '5']] }));
    localStorage.setItem('fx-components:vadd-review', JSON.stringify({ d: ['', '3', '8', '1', '5'], c: ['', '1', '', '1', ''] }));`);
  await b.reload(); await wait(200);
  const rev = await js(`${H}
    const s = sec('steps', 'review'), v = sec('vadd', 'review');
    return { inputs: document.querySelectorAll('[data-mode="review"] .q-type-chain input, [data-mode="review"] .q-type-vcalc input').length, sNo: Array.from(s.querySelectorAll('.mk-no')).map((c) => c.dataset.k), sOk: s.querySelectorAll('.mk-ok').length,
      vNo: Array.from(v.querySelectorAll('.mk-no')).map((c) => c.dataset.k), carries: Array.from(v.querySelectorAll('.vc-carry')).map((c) => c.textContent).join('|'), correct: v.querySelector('.fx-correct').textContent };`);
  check('review: read-only, the child\'s own entries with ✓/✗ per box, regroup marks as typed, the correct answer only in the line below',
    rev.inputs === 0 && rev.sNo.join() === 'v:r0' && rev.sOk >= 6 && rev.vNo.join() === 'd:3' && rev.carries === '|1||1' && /3,825/.test(rev.correct), rev);

  // ----- Keyboard: every control reachable with Tab and the focus is visible -----
  await js(`document.querySelector('[data-sample="steps"] [data-mode="test"] input').focus();`);
  const seen = [];
  for (let k = 0; k < 12; k++) {
    seen.push(await js(`const e = document.activeElement; const s = getComputedStyle(e); return { k: e.dataset.k || e.textContent.trim().slice(0, 14), outline: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2, label: e.getAttribute('aria-label') || e.textContent.trim() }`));
    await b.key('Tab');
  }
  check('keyboard: Tab walks the tree parts, Add/Remove, then each step box; focus is always visible and labelled',
    seen.slice(1).every((x) => x.outline && x.label) && seen.some((x) => /Add a part/.test(x.k)) && seen.some((x) => x.k === 'v:r1'), seen);
  const labels = await js(`return Array.from(document.querySelectorAll('[data-mode] input.ci, [data-mode] input.vc-carry')).filter((i) => !(i.getAttribute('aria-label') || '').trim()).length`);
  check('every answer box has a screen-reader label', labels === 0, labels);

  // ===== The same controls inside the real lesson engine (tests/fixtures/lesson-ch2) =====
  const LURL = server.origin + BASE + 'tests/fixtures/lesson-ch2/';
  const LH = `${H}
    const LL = Mathbook.lessons['fx-ch2'];
    const W = () => JSON.parse(localStorage.getItem(LL.storageKey + ':see-wizard') || 'null');
    const wbtn = (a) => document.querySelector('[data-wiz="' + a + '"]');
    const qe = () => document.querySelector('.wiz-check .q[data-qkey]');
    const filled = (el) => Array.from(el.querySelectorAll('input[data-k]:not([data-k^="c:"])')).filter((i) => i.value.trim()).length;`;
  await b.viewport(1366, 900, false);
  await b.load(LURL + '#menu');
  await js(`Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:fx-ch2')).forEach((k) => localStorage.removeItem(k));`);
  await b.load(LURL + '#see'); await b.reload(); await wait(200);
  const learn = await js(`${LH}
    const out = [];
    for (let k = 0; k < 2; k++) {
      wbtn('try').click();
      const q = W().checks[LL.seeIt.steps[k].id].q;
      fill(qe(), q, false); wbtn('check').click();
      const o = { type: q.type, no: qe().querySelectorAll('.mk-no').length, ok: qe().querySelectorAll('.mk-ok').length, msg: (document.querySelector('.wiz-check .feedback-no') || {}).innerText || '', editable: qe().querySelectorAll('input:not([disabled]), button:not([disabled])').length };
      wbtn('again').click();
      o.cleared = qe().querySelectorAll('.mk').length; o.kept = Q.isAnswered(q, Q.read(qe(), q)) && !Q.grade(q, Q.read(qe(), q));
      fill(qe(), q, true); wbtn('check').click();
      o.allOk = qe().querySelectorAll('.mk-ok').length; o.filled = filled(qe()); o.right = (document.querySelector('.wiz-check .feedback-ok') || {}).innerText || '';
      o.unlocked = !!(wbtn('next') && !wbtn('next').disabled);
      out.push(o);
      wbtn('next').click();
    }
    const fin = () => wbtn('finish');
    const o3 = { phase: document.querySelector('.wiz-card').dataset.phase, tryBtn: !!wbtn('try'), locked: fin().classList.contains('is-disabled'), note: !!document.querySelector('#wiz-locked') };
    document.querySelector('#slide-next').click();
    o3.unlocked = !fin().classList.contains('is-disabled'); o3.done = !!W().done.remind; o3.noteGone = !document.querySelector('#wiz-locked');
    out.push(o3);
    return out;`);
  learn.slice(0, 2).forEach((o, k) => check(`engine Learn step ${k + 1} (${o.type}): a miss marks only wrong boxes ✗ with "Not quite" + the first problem; Try Again keeps entries and clears marks; right puts ✓ on every filled box`,
    o.no >= 1 && o.ok === 0 && /Not quite/.test(o.msg) && o.editable === 0 && o.cleared === 0 && o.kept && o.allOk === o.filled && o.filled > 0 && /Correct|You got it/.test(o.right) && o.unlocked, o));
  const l3 = learn[2];
  check('engine Learn: a step without a check has only the Example phase; Finish unlocks at the last part', l3.phase === 'example' && !l3.tryBtn && l3.locked && l3.note && l3.unlocked && l3.done && l3.noteGone, l3);
  await js(`document.querySelector('[data-wiz="finish"]').click();`); await wait(250);
  check('engine Learn: finishing every step shows "You finished learning!"', await js(`return document.querySelector('h1').textContent === 'You finished learning!'`));

  await b.load(LURL + '#practice/together'); await b.reload(); await wait(200);
  const pt = await js(`${LH}
    const box = document.querySelector('#guided-runner');
    const out = { story: (box.querySelector('div.story') || {}).innerText || '', table: !!box.querySelector('.story table'), items: [] };
    for (let i = 0; i < LL.guided.length; i++) {
      const q = LL.guided[i]; const el = box.querySelector('.q[data-qkey]');
      fill(el, q, false); box.querySelector('[data-act=check]').click();
      const w = { id: q.id, no: el.querySelectorAll('.mk-no').length, text: box.querySelector('.result-box').innerText };
      fill(el, q, true); w.cleared = el.querySelectorAll('.mk').length;
      box.querySelector('[data-act=check]').click();
      w.ok = /Correct/.test(box.querySelector('.result-box').innerText); w.okMarks = el.querySelectorAll('.mk-ok').length;
      out.items.push(w);
      if (i < LL.guided.length - 1) box.querySelector('[data-act=next]').click();
    }
    out.later = !!box.querySelector('details.story[open] summary') && box.querySelector('details.story summary').textContent;
    return out;`);
  check('engine Practice Together: the shared story (text + table) sits above the question; later questions fold it in an open <details>',
    /A shop counts customers/.test(pt.story) && pt.table && pt.later === 'The story and table', pt);
  check('engine Practice Together: chain/vcalc misses mark ✗ with "Not yet." and a coaching line; right answers are Correct with ✓; parts keep their own coaching',
    pt.items.every((w) => w.ok && w.cleared === 0) && pt.items.slice(0, 2).every((w) => w.no >= 1 && /Not yet\./.test(w.text) && w.okMarks >= 1) && pt.items[2].no === 0, pt.items);

  await b.load(LURL + '#practice/s1'); await b.reload(); await wait(200);
  const own = await js(`${LH}
    const one = () => document.querySelector('#indep .one-q .q[data-qkey]');
    let first = true;
    for (let g = 0; g < 10 && one(); g++) {
      const id = one().dataset.qkey.replace('p-', ''); const q = LL.bank.find((x) => x.id === id);
      if (one().querySelector('.ch-helper, .ar-tag, .mk')) return { leak: id };
      fill(one(), q, !first); first = false;
      const nx = document.querySelector('[data-q="next"]'); if (nx) nx.click(); else document.querySelector('#check-set').click();
    }
    return { score: (document.querySelector('.set-score') || {}).innerText || '', reviewInputs: document.querySelectorAll('#indep .q-type-chain input, #indep .q-type-vcalc input').length,
      no: document.querySelectorAll('#indep .is-read.mk-no').length, okc: document.querySelectorAll('#indep .is-read.mk-ok').length, your: /Your answer:/.test(document.querySelector('#indep').innerText) };`);
  check('engine On My Own: no helpers before checking; after Check my work each question is drawn read-only with ✓/✗ per box',
    !own.leak && /2 of 3 correct/.test(own.score) && own.reviewInputs === 0 && own.no >= 1 && own.okc >= 3 && own.your, own);

  await b.load(LURL + '#test'); await b.reload(); await wait(200);
  await js(`document.querySelector('[data-start="math"]').click();`); await wait(200);
  const tr = await js(`${LH}
    const qs = JSON.parse(localStorage.getItem(LL.storageKey + ':draft-math')).questions;
    const testQ = () => document.querySelector('.test-one .q[data-qkey]');
    const out = { leaks: 0, focus: [] };
    for (let i = 0; i < qs.length; i++) {
      await new Promise((r) => setTimeout(r, 60));
      out.focus.push(document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k || document.activeElement.tagName : '');
      out.leaks += document.querySelectorAll('main .ch-helper, main .ar-tag, main .mk, main [data-check], main .feedback:not([hidden])').length;
      fill(testQ(), qs[i], i === 0);
      document.querySelector('[data-nav="next"]').click();
    }
    document.querySelector('[data-finish]').click(); await new Promise((r) => setTimeout(r, 300));
    const a = JSON.parse(localStorage.getItem(LL.storageKey + ':attempts') || '[]').pop() || {};
    const det = document.querySelector('.result-detail');
    return Object.assign(out, { score: a.score, links: Array.from(det.querySelectorAll('.skill-list a')).map((x) => x.textContent + ' ' + x.getAttribute('href')),
      skillRows: Array.from(det.querySelectorAll('.skill-list li')).map((li) => li.innerText.replace(/\\s+/g, ' ')),
      reviewNo: det.querySelectorAll('.rq .q-type-chain .mk-no, .rq .q-type-vcalc .mk-no').length, reviewInputs: det.querySelectorAll('.rq input').length });`);
  check('engine Test: no helpers, marks or checks; focus starts at the ones box of a vcalc question', tr.leaks === 0 && /^d:/.test(tr.focus[1]), tr);
  check('engine My Results: 1 of 4; mistakes show the child\'s own boxes with ✗; "Review this lesson (2-1)" links to that lesson; an empty link shows no button',
    tr.score === 1 && tr.reviewNo >= 2 && tr.reviewInputs === 0 && tr.links.length === 1 && /^Review this lesson \(2-1\) .*lesson-2-1\/#menu$/.test(tr.links[0]) &&
    tr.skillRows.some((s) => /Lesson 2-7 skill/.test(s) && !/Review|Practice/.test(s)), tr);
  await b.viewport(320, 640);
  for (const screen of ['see', 'practice/together', 'practice/s1', 'results']) {
    await b.load(LURL + '#' + screen); await b.reload(); await wait(150);
    await noOverflow(`engine fixture ${screen} @ small-phone`);
  }
  await b.viewport(1366, 900, false);
  await b.load(URL); await wait(200);

  // ----- Layout: no sideways scroll; 48px targets; screenshots -----
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const [name, w, h] of [['small-phone', 320, 640], ['phone', 390, 844], ['tablet', 768, 1024], ['desktop', 1366, 900]]) {
    await b.viewport(w, h);
    await b.reload(); await wait(250);
    await noOverflow(`fixture @ ${name}`);
    const small = await js(`return Array.from(document.querySelectorAll('main .btn, main .choice, main input.ci')).filter((e) => e.offsetParent && e.getBoundingClientRect().height < 47.5).map((e) => e.className + ':' + (e.dataset.k || e.innerText).slice(0, 20)).slice(0, 6)`);
    check(`targets @ ${name}: buttons, chips and answer boxes at least 48px tall`, small.length === 0, small);
    if (w === 320) {
      const narrow = await js(`return Array.from(document.querySelectorAll('[data-mode="test"] .vc-in')).map((i) => Math.round(i.getBoundingClientRect().width)).reduce((m, x) => Math.min(m, x), 99)`);
      check('320px: digit boxes stay at least 36px wide (Decision 25 allows narrow 5-digit layouts)', narrow >= 36, narrow);
    }
    await b.shot(path.join(SHOTS, `fixture-${name}.png`));
  }
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors.slice(0, 5));
} catch (e) {
  check('components browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 600), pageErrors: b.errors.slice(0, 3) });
} finally {
  b.close();
  server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed.`);
process.exit(failed.length ? 1 : 0);
