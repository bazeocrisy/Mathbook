// Number Words Phases 2 (11–20) and 3 (20–99), and the simpler Number Words landing page, end to end:
// the landing cards (two columns on desktop, one on phones, all four in the first screen at 1366×768) and the Parent
// Guide link; Learn (Example → Your Turn, one question at a time) with Check Answer · Hint · Show Me, retries that keep
// the child's answer, Show Me that unlocks Next and is recorded as completed with help; Practice Together and On My Own
// with the same help (Show Me never counts as correct on your own); the test (no help, no feedback, no answer cues);
// My Results (results by skill, missed answers explained, practice for missed skills, Learn/Practice help kept apart);
// saved progress across refresh; malformed saves; reset boundaries; and layouts from 320 px to 1920 px and 200% zoom.
// Usage: node tests/number-words-2-3.browser.mjs
import { BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const { js, wait } = b;
const ROOT = server.origin + BASE;
const P2 = ROOT + 'number-words/phase-2/', P3 = ROOT + 'number-words/phase-3/';
const K2 = 'mathbook:v2:number-words:phase-2', K3 = 'mathbook:v2:number-words:phase-3';
// Progress that must survive a Phase 2 or Phase 3 reset.
const OTHERS = { 'mathbook:v2:number-words:phase-1:attempts': '[{"score":9,"total":10}]', 'mathbook:v2:number-words:phase-4:attempts': '[]',
  'mathbook:v2:subtract-regrouping:see-wizard': '{"v":1,"step":0,"done":{},"phase":{},"ex":{},"checks":{},"helped":{}}', 'mathbook:v2:lesson-2-2:attempts': '[{"id":1,"pct":80}]' };

const H = (id, key) => `${FILL_HELPERS}
  const LL = window.Mathbook.lessons['${id}'], N = window.Mathbook.nw99;
  const get = (k) => JSON.parse(localStorage.getItem('${key}:' + k) || 'null');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fireIn = (t) => t.dispatchEvent(new Event('input', { bubbles: true }));
  /** Answer one question element right or wrong, the way a child would (typing, choosing, the missing letter). */
  function answer(el, q, right) {
    if (q.type === 'letter') { const i = el.querySelector('.letter-input'); i.value = right ? q.answer : (q.answer === 'z' ? 'q' : 'z'); fireIn(i); return; }
    if (q.type === 'words' && !right) { const i = el.querySelector('.q-input'); i.value = q.answer === 40 ? 'fourty' : 'zero'; fireIn(i); return; }
    fill(el, q, right);
  }
  const txt = (sel) => ((document.querySelector(sel) || {}).textContent || '').trim();
  const btns = (sel) => Array.from(document.querySelectorAll(sel)).filter((x) => !x.hidden).map((x) => x.textContent.trim()).join('|');`;

async function layout(label, minH = 44) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { if (e.closest('.table-wrap, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main .btn, main a.btn, main input[type=text], .topbar a')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < ${minH} - 0.5; }).slice(0, 3).map((e) => (e.textContent || e.className).trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().height));
    const tiny = Array.from(document.querySelectorAll('main p, main li, main label, main legend')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && parseFloat(getComputedStyle(e).fontSize) < 13; }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: d.scrollWidth, cw: d.clientWidth, wide, small, tiny };`);
  check(`layout ${label}: no sideways scroll, controls ≥ ${minH}px, text ≥ 13px`, r.sw <= r.cw && !r.wide.length && !r.small.length && !r.tiny.length, r);
}
const clearAll = () => js(`localStorage.clear(); ${Object.entries(OTHERS).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join(' ')}`);

try {
  // ===== Landing page =====
  await b.viewport(1366, 768, false);
  await b.load(ROOT + 'number-words/');
  const land = await js(`const cards = Array.from(document.querySelectorAll('.nw-phase'));
    return { titles: cards.map((c) => c.querySelector('h2').textContent), hrefs: cards.map((c) => c.querySelector('a.btn').getAttribute('href')),
      descs: cards.map((c) => c.querySelectorAll('p.nw-phase-desc').length), open: cards.map((c) => c.querySelector('a.btn').textContent.replace(/:.*/, '')),
      btnLeft: cards.map((c) => Math.round(c.querySelector('a.btn').getBoundingClientRect().left - c.getBoundingClientRect().left)),
      rowTops: Array.from(new Set(cards.map((c) => Math.round(c.getBoundingClientRect().top)))).length, lastBottom: Math.round(cards[3].getBoundingClientRect().bottom), vh: innerHeight,
      parent: (document.querySelector('a[href="parent/"]') || {}).textContent, howOnPage: /How each phase works/.test(document.querySelector('main').innerText),
      outlines: document.querySelectorAll('main ul, main ol, .lesson-row').length, home: !!document.querySelector('.topbar a[href="../"]') };`);
  check('Landing: four compact cards in order (0–10, 11–20, 20–99, 100–9,999), each one line and Open', JSON.stringify(land.titles) === JSON.stringify(['Numbers 0–10', 'Numbers 11–20', 'Numbers 20–99', 'Numbers 100–9,999']) &&
    JSON.stringify(land.hrefs) === JSON.stringify(['phase-1/', 'phase-2/', 'phase-3/', 'phase-4/']) && land.descs.every((n) => n === 1) && land.open.every((t) => t === 'Open'), land);
  check('Landing at 1366×768: two columns, all four cards in the first screen, Open in the same place on every card', land.rowTops === 2 && land.lastBottom <= land.vh && new Set(land.btnLeft).size === 1, land);
  check('Landing: no long outlines; "How each phase works" is behind the Parent Guide link; Home is kept', !land.outlines && !land.howOnPage && land.parent === 'Parent Guide' && land.home, land);
  await layout('landing 1366');
  await b.viewport(1920, 1080, false); await b.load(ROOT + 'number-words/'); await layout('landing 1920');
  await b.viewport(390, 844, true); await b.load(ROOT + 'number-words/');
  check('Landing at 390: one column', await js(`const c = Array.from(document.querySelectorAll('.nw-phase')).map((x) => Math.round(x.getBoundingClientRect().left)); return new Set(c).size === 1`));
  await layout('landing 390');
  await b.navigate(`document.querySelector('a[href="parent/"]').click();`);
  const pg = await js(`return { h1: document.querySelector('h1').textContent, how: /How each phase works/.test(document.querySelector('main').innerText), help: /completed with help/.test(document.querySelector('main').innerText), back: !!document.querySelector('a[href="../"]') }`);
  check('Parent Guide page: how each phase works, what each teaches, help and checking rules, a way back', pg.h1 === 'Parent Guide' && pg.how && pg.help && pg.back, pg);
  await layout('parent guide 390');
  await b.load(ROOT + 'number-words/');
  await b.navigate(`document.querySelector('a[href="phase-2/"]').click();`);
  check('Open (Phase 2) goes to the Phase 2 menu', await js(`return document.querySelector('h1').textContent === 'Numbers 11–20' && /Phase 2: 11–20/.test(document.querySelector('.topbar').textContent)`));

  // ===== Phase 2 Learn =====
  await b.viewport(1366, 900, false);
  await b.load(P2); await clearAll(); await b.load(P2 + '#see'); await b.reload();
  const ex1 = await js(`return { tag: document.querySelector('.phase-tag').textContent, count: document.querySelector('.wiz-count').textContent, model: document.querySelectorAll('.blocks-2 .blocks-col').length, parts: document.querySelector('#slide-count').textContent, check: !!document.querySelector('[data-wiz="check"]') }`);
  check('Phase 2 Learn opens at Step 1 of 6, Example, a tens-and-ones model, one part at a time, no question yet', ex1.tag === 'Example' && ex1.count === 'Step 1 of 6' && ex1.model === 2 && ex1.parts === 'Part 1 of 3' && !ex1.check, ex1);
  await js(`document.querySelector('[data-wiz="try"]').click()`); await wait(150);
  const yt = await js(`${H('nw-2', K2)} const q = get('see-wizard').checks.eleven.q, el = () => document.querySelector('.wiz-check .q');
    const out = { tag: txt('.phase-tag'), buttons: btns('.wiz-check-actions button'), qs: document.querySelectorAll('.wiz-check .q').length, answer: q.answer };
    answer(el(), q, false); document.querySelector('[data-wiz="check"]').click(); await sleep(60);
    out.wrong = txt('.feedback-no'); out.retry = btns('.wiz-check-actions button'); out.disabled = el().querySelector('input').disabled; out.locked = document.querySelector('[data-wiz="next"]').disabled;
    document.querySelector('[data-wiz="hint"]').click(); await sleep(60);
    out.hint = txt('.hint-note'); out.kept = el().querySelector('input').value; out.editable = !el().querySelector('input').disabled; out.focus = document.activeElement === el().querySelector('input');
    out.afterHint = btns('.wiz-check-actions button');
    answer(el(), q, true); document.querySelector('[data-wiz="check"]').click(); await sleep(60);
    out.ok = txt('.feedback-ok'); out.next = !document.querySelector('[data-wiz="next"]').disabled; out.helped = get('see-wizard').helped || {};
    return out;`);
  check('Your Turn: one question with Check Answer · 💡 Hint · Show Me beside it', yt.tag === 'Your Turn' && yt.qs === 1 && yt.buttons === 'Check Answer|💡 Hint|Show Me', yt);
  check('A wrong answer: "Not quite" + specific feedback, then Try Again · Get a Hint · Show Me How (Next stays locked)', /^Not quite\./.test(yt.wrong) && yt.retry === 'Try Again|Get a Hint|Show Me How' && yt.disabled && yt.locked, yt);
  check('Get a Hint: a clue that does not give the word; the typed answer is kept and can be changed (focus in the box)', yt.hint.length > 10 && !new RegExp('\\b' + (yt.answer === 11 ? 'eleven' : 'twelve') + '\\b').test(yt.hint) && yt.kept !== '' && yt.editable && yt.focus, yt);
  check('Then a right answer: ✓ with the explanation; Next unlocks; done on their own (not with help)', /Correct|You got it/.test(yt.ok) && yt.next && !yt.helped.eleven, yt);
  await js(`document.querySelector('[data-wiz="next"]').click()`); await wait(150);
  await js(`document.querySelector('[data-wiz="try"]').click()`); await wait(150);
  const sm = await js(`${H('nw-2', K2)} const q = get('see-wizard').checks.teen.q;
    const before = document.querySelector('[data-wiz="next"]').disabled;
    document.querySelector('[data-wiz="show"]').click(); await sleep(80);
    return { before, shown: txt('.help-shown'), value: document.querySelector('.wiz-check .q-input').value, want: N.W(q.answer), next: !document.querySelector('[data-wiz="next"]').disabled,
      focus: document.activeElement.classList.contains('help-shown'), helped: get('see-wizard').helped, again: btns('.wiz-check-actions button') };`);
  check('Show Me (no wrong answer needed): fills in and explains the word, says "Completed with help", unlocks Next, focus on the explanation', sm.before && /^Show Me: the answer is/.test(sm.shown) && /Completed with help/.test(sm.shown) && sm.value === sm.want && sm.next && sm.focus, sm);
  check('…recorded as completed with help (not on their own), with "Try a similar one" offered but not required', sm.helped && sm.helped.teen === true && sm.again === 'Try a similar one', sm);
  await b.reload();
  check('Refresh keeps Your Turn, the shown answer, and the unlocked Next', await js(`return document.querySelector('.phase-tag').textContent === 'Your Turn' && !!document.querySelector('.help-shown') && !document.querySelector('[data-wiz="next"]').disabled`));
  // Finish the rest of Learn with Show Me only: never stuck, all completed with help.
  const rest = await js(`${H('nw-2', K2)} const log = [];
    document.querySelector('[data-wiz="next"]').click(); await sleep(120);
    for (let k = 2; k < 6; k++) {
      document.querySelector('[data-wiz="try"]').click(); await sleep(120);
      document.querySelector('[data-wiz="show"]').click(); await sleep(80);
      const nx = document.querySelector('[data-wiz="next"]'), fin = document.querySelector('a[data-wiz="finish"]');
      log.push(nx ? !nx.disabled : !fin.classList.contains('is-disabled'));
      if (nx) { nx.click(); await sleep(120); }
    }
    const W = get('see-wizard'); return { log, done: Object.keys(W.done).length, helped: Object.keys(W.helped).length };`);
  check('Learn can be finished with Show Me alone (no dead ends): 6 of 6 done, 5 completed with help, 1 on their own', rest.log.every(Boolean) && rest.done === 6 && rest.helped === 5, rest);

  // ===== Phase 2 Practice Together =====
  await b.load(P2 + '#practice/together'); await b.reload();
  const pt = await js(`${H('nw-2', K2)} const q = LL.guided[0], el = () => document.querySelector('.guided-card .q');
    const out = { buttons: btns('.guided-card .help-row button') };
    answer(el(), q, false); document.querySelector('[data-act="check"]').click(); await sleep(60); out.wrong = txt('.result-box');
    out.kept = el().querySelector('input').value; out.editable = !el().querySelector('input').disabled;
    document.querySelector('[data-act="hint"]').click(); await sleep(60); out.hint = txt('.hint-box');
    document.querySelector('[data-act="reveal"]').click(); await sleep(60); out.shown = txt('.result-box'); out.filled = el().querySelector('input').value; out.locked = el().querySelector('input').disabled;
    out.state = get('guided').states.g1;
    // The rest: right on their own, to the end.
    document.querySelector('[data-act="next"]').click(); await sleep(60);
    for (let i = 1; i < LL.guided.length; i++) { const qq = LL.guided[i]; answer(el(), qq, true); document.querySelector('[data-act="check"]').click(); await sleep(30); document.querySelector('[data-act="next"]').click(); await sleep(60); }
    out.done = txt('.done-title');
    return out;`);
  check('Practice Together: Check Answer · 💡 Hint · Show Me; a miss keeps the answer editable with feedback', pt.buttons === 'Check Answer|💡 Hint|Show Me' && /^Not quite\./.test(pt.wrong) && pt.kept !== '' && pt.editable, pt);
  check('Practice Together Show Me fills in and explains the answer, completed with help, saved', /Completed with help/.test(pt.shown) && pt.filled === 'eleven' && pt.locked && pt.state.helped === true, pt);
  check('Practice Together finish card: on your own and with help counted apart', /9 on your own · 1 completed with help/.test(pt.done), pt.done);

  // ===== Phase 2 On My Own =====
  await b.load(P2 + '#practice/own'); await b.reload();
  await js(`document.querySelector('[data-open-set="s1"]').click()`); await wait(250);
  const om = await js(`${H('nw-2', K2)} const one = () => document.querySelector('#indep .one-q .q[data-qkey]'), cur = () => LL.bank.find((x) => x.id === one().dataset.qkey.replace('p-', ''));
    const out = { buttons: btns('#indep .help-row button') };
    const q0 = cur(); answer(one(), q0, false); document.querySelector('[data-help="check"]').click(); await sleep(60);
    out.wrong = txt('#indep .feedback-no'); out.kept = !!(get('bank-sets').s1.active.responses[q0.id]);
    document.querySelector('[data-help="show"]').click(); await sleep(60); out.shown = txt('#indep .help-shown');
    const ids = [q0.id];
    document.querySelector('[data-q="next"]').click(); await sleep(60);
    for (let g = 0; g < 12; g++) { const q = cur(); ids.push(q.id); answer(one(), q, true); const nx = document.querySelector('[data-q="next"]'); if (nx) { nx.click(); await sleep(50); } else { document.querySelector('#check-set').click(); break; } }
    await sleep(120);
    const rec = get('bank-sets').s1.attempts[0];
    out.score = txt('.set-score'); out.rec = { score: rec.score, total: rec.total, helped: rec.helped, first: rec.correct[0] };
    out.helpedNote = /Completed with help \\(Show Me\\)/.test(document.querySelector('#indep').innerText); out.misses = txt('#practice-misses');
    return out;`);
  check('On My Own: Check Answer · 💡 Hint · Show Me under each question; a miss gets feedback and the answer is kept', om.buttons === 'Check Answer|💡 Hint|Show Me' && /^Not quite\./.test(om.wrong) && om.kept, om);
  check('On My Own: the shown answer is not counted as correct on your own (9 of 10), recorded as helped, offered in Practice My Misses', /^9 of 10 correct/.test(om.score) && om.rec.score === 9 && om.rec.helped.length === 1 && om.rec.first === false && om.helpedNote && /\(1\)/.test(om.misses), om);

  // ===== Phase 2 Test and My Results =====
  await b.load(P2 + '#test'); await b.reload();
  await js(`document.querySelector('[data-start="words"]').click()`); await wait(250);
  const tst = await js(`${H('nw-2', K2)} const D = get('draft-words'); const out = { n: D.questions.length, help: [], feedback: [] };
    for (let i = 0; i < D.questions.length; i++) {
      const q = D.questions[i], el = document.querySelector('main .q[data-qkey]');
      out.help.push(document.querySelectorAll('main [data-help], main [data-wiz="hint"], main [data-wiz="show"], main [data-act="hint"], main [data-act="reveal"], main [data-act="check"], main .hint-box:not([hidden])').length);
      answer(el, q, i >= 2); await sleep(20);
      out.feedback.push(document.querySelectorAll('main .feedback, main .is-ok, main .is-no').length);
      const nx = document.querySelector('[data-nav="next"]'); if (nx) { nx.click(); await sleep(60); }
    }
    out.text = document.querySelector('main').innerText.slice(0, 200);
    return out;`);
  check('Test: 12 questions; no Hint, Show Me, Check or feedback on any question', tst.n === 12 && tst.help.every((x) => x === 0) && tst.feedback.every((x) => x === 0), tst);
  await js(`document.querySelector('[data-finish]').click();`); await wait(400);
  const res = await js(`${H('nw-2', K2)} return { score: txt('.score-big'), table: Array.from(document.querySelectorAll('.skill-table tr')).map((r) => r.innerText.replace(/\\s+/g, ' ').trim()),
    missed: document.querySelectorAll('.rq-no').length, why: Array.from(document.querySelectorAll('.rq-no')).every((li) => /Correct answer:/.test(li.innerText) && /Why:/.test(li.innerText)),
    practice: document.querySelectorAll('[data-practice]').length, learn: txt('.help-progress'), attempts: get('attempts').length };`);
  check('My Results: 10/12; results by skill under Number recognition and Spelling', res.score === '10/12' && res.table.some((t) => /^Number recognition \d+ of \d+$/.test(t)) && res.table.some((t) => /^Spelling \d+ of \d+$/.test(t)), res);
  check('My Results: each missed answer with the correct answer and why, and practice for missed skills', res.missed === 2 && res.why && res.practice >= 1, res);
  check('My Results keeps Learn and Practice Together help apart from the test score', /Learn: 6 of 6 steps done \(5 completed with help\)/.test(res.learn) && /Practice Together: 9 of 10 on your own · 1 completed with help/.test(res.learn), res.learn);
  await js(`document.querySelector('[data-practice]').click()`); await wait(300);
  check('"Practice this skill" opens only that skill, with the same help', await js(`return /Practicing one skill/.test(document.querySelector('main').innerText) && !!document.querySelector('#indep [data-help="show"]')`));

  // ===== Phase 3: Learn spot checks (space instead of hyphen; -teen/-ty; exact tens) =====
  await b.load(P3); await clearAll(); await b.load(P3 + '#see'); await b.reload();
  await js(`localStorage.setItem('${K3}:see-wizard', JSON.stringify({ step: 3, done: { tens: true, tricky: true, teenty: true }, checks: {}, phase: { compound: 'try' } }))`); await b.reload();
  const cp = await js(`${H('nw-3', K3)} const q = get('see-wizard').checks.compound.q; const i = document.querySelector('.wiz-check .q-input');
    i.value = '  ' + N.W(q.answer).replace('-', ' ').toUpperCase() + ' '; fireIn(i); document.querySelector('[data-wiz="check"]').click(); await sleep(60);
    return { n: q.answer, ok: txt('.feedback-ok'), next: !document.querySelector('[data-wiz="next"]').disabled };`);
  check('Phase 3: "FORTY TWO"-style answers (capitals, a space for the hyphen, extra spaces) are accepted', /Correct/.test(cp.ok) && cp.next, cp);
  await js(`document.querySelector('[data-wiz="another"]').click()`); await wait(120);
  const mis = await js(`${H('nw-3', K3)} const q = get('see-wizard').checks.compound.q; const i = document.querySelector('.wiz-check .q-input');
    const n = q.answer, t = Math.floor(n / 10); const bad = t === 4 ? 'fourty' : t === 8 ? 'eightty' : t === 5 ? 'fivety' : t === 3 ? 'threety' : t === 9 ? 'ninty' : t === 2 ? 'twinty' : t === 6 ? 'sixdy' : 'sevendy';
    i.value = bad + '-' + N.W(n % 10); fireIn(i); document.querySelector('[data-wiz="check"]').click(); await sleep(60);
    return { n, typed: i.value, right: N.W(n), wrong: txt('.feedback-no') };`);
  check('A misspelled tens word is called a spelling slip (not a different number), and the answer is not given', /Check the spelling of/.test(mis.wrong) && !/name \d+|word for \d+/.test(mis.wrong) && !mis.wrong.includes(mis.right), mis);
  await b.viewport(320, 640, true); await layout('Phase 3 Learn Your Turn 320');
  await b.viewport(1366, 900, false);

  // ===== Saved progress: refresh, malformed saves, reset boundaries =====
  await b.load(P3 + '#practice/own'); await b.reload();
  await js(`document.querySelector('[data-open-set="s2"]').click()`); await wait(200);
  await js(`${H('nw-3', K3)} const el = document.querySelector('#indep .one-q .q[data-qkey]'), q = LL.bank.find((x) => x.id === el.dataset.qkey.replace('p-', '')); answer(el, q, false); document.querySelector('[data-help="hint"]').click(); await sleep(60);`);
  await b.reload(); await wait(200);
  check('Refresh in On My Own keeps the question, the typed answer and the hint', await js(`return !!document.querySelector('#indep .hint-note') && Array.from(document.querySelectorAll('#indep input')).some((i) => i.value || i.checked)`));
  for (const [label, k, v] of [['see-wizard is a number', 'see-wizard', '5'], ['Learn check without a question', 'see-wizard', '{"step":1,"done":{"tens":true,"bogus":true},"checks":{"tricky":{"q":null}},"helped":{"tricky":true}}'],
    ['a broken On My Own set', 'bank-sets', '{"s1":{"attempts":"x"},"s2":{"attempts":[],"retries":[],"active":null}}'], ['junk test attempts', 'attempts', '[{"x":1},null,5]'], ['not JSON', 'guided', '{nope']]) {
    await js(`localStorage.setItem('${K3}:${k}', ${JSON.stringify(v)})`);
    await b.load(P3 + '#see'); await b.reload();
    const ok = await js(`return { learn: !!document.querySelector('.wiz-card'), others: ${JSON.stringify(Object.keys(OTHERS))}.every((k) => localStorage.getItem(k) !== null) }`);
    await b.load(P3 + '#results'); await b.reload();
    const ok2 = await js(`return !!document.querySelector('main h1') && document.querySelector('main').innerText.length > 50`);
    check(`Malformed save (${label}): Learn and My Results still draw; nothing else is touched`, ok.learn && ok.others && ok2, ok);
  }
  await js(`localStorage.setItem('${K3}:see-wizard', JSON.stringify({ step: 99, done: { tens: true }, checks: {}, phase: {} })); localStorage.setItem('${K3}:guided', JSON.stringify({ i: 'x', states: { g1: { result: true } } }))`);
  await b.load(P3 + '#see'); await b.reload();
  check('One bad field is reset, the rest is kept (NW23-05): Learn step 99 → step 1 with its done step kept; Practice Together answers kept', await js(`const w = JSON.parse(localStorage.getItem('${K3}:see-wizard')), g = JSON.parse(localStorage.getItem('${K3}:guided')); return w.step === 0 && w.done.tens === true && g.i === 0 && g.states.g1.result === true && document.querySelector('.wiz-count').textContent === 'Step 1 of 6'`));
  check('A damaged Learn record keeps its good parts only (unknown steps and help on undone steps are dropped)', await js(`const w = JSON.parse(localStorage.getItem('${K3}:see-wizard')); return !!w && !('bogus' in w.done) && !(w.helped || {}).tricky && !(w.checks.tricky && !w.checks.tricky.q)`));
  for (const [P, K, other] of [[P2, K2, K3], [P3, K3, K2]]) {
    await b.load(P); await js(`localStorage.setItem('${K}:see-wizard', '{"step":0,"done":{},"checks":{}}'); localStorage.setItem('${other}:see-wizard', '{"step":0,"done":{},"checks":{}}');`);
    await b.load(P + '#teach'); await b.reload();
    await js(`document.querySelector('#clear').click()`); await wait(80); await js(`document.querySelector('#clear-yes').click()`); await wait(250);
    const after = await js(`return { mine: Object.keys(localStorage).filter((k) => k.startsWith('${K}:')).length, other: localStorage.getItem('${other}:see-wizard') !== null, rest: ${JSON.stringify(Object.keys(OTHERS))}.filter((k) => localStorage.getItem(k) === null) }`);
    check(`Reset ${K.slice(-7)}: erases only that phase (Phases 1, 4, the other phase, Subtract with Regrouping and lessons kept)`, after.mine === 0 && after.other && !after.rest.length, after);
  }

  // ===== Keyboard =====
  await b.load(P2); await clearAll(); await b.load(P2 + '#see'); await b.reload();
  await js(`document.querySelector('[data-wiz="try"]').click()`); await wait(150);
  await js(`document.querySelector('.wiz-check .q-input').focus()`);
  await b.key('Tab'); await b.key('Tab'); await b.key('Tab');
  const kb = await js(`return { on: document.activeElement.textContent, ring: getComputedStyle(document.activeElement).outlineStyle !== 'none' || getComputedStyle(document.activeElement).boxShadow !== 'none' }`);
  for (const type of ['keyDown', 'keyUp']) await b.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: type === 'keyDown' ? '\r' : undefined });
  await wait(150);
  check('Keyboard: Tab from the answer reaches Check Answer, Hint and Show Me (visible focus); Enter on Show Me shows the answer', kb.on === 'Show Me' && kb.ring && await js(`return !!document.querySelector('.help-shown')`), kb);

  // ===== Layouts =====
  const screens = [
    ['Phase 2 menu', P2 + '#menu'], ['Phase 2 Learn Example', P2 + '#see'], ['Phase 3 Practice Together', P3 + '#practice/together'],
    ['Phase 3 On My Own', P3 + '#practice/s1'], ['Phase 2 My Results', P2 + '#results']
  ];
  for (const [w, h, label] of [[320, 640, '320'], [390, 844, '390'], [768, 1024, 'tablet portrait'], [1024, 768, 'tablet landscape'], [1366, 768, '1366'], [1920, 1080, '1920'], [683, 384, '200% zoom']]) {
    await b.viewport(w, h, w < 1024);
    for (const [name, url] of screens) { await b.load(url); await wait(100); await layout(`${name} at ${label}`); }
  }
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('suite ran to the end', false, String(e && e.stack || e));
} finally {
  b.close(); server.close();
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed (Number Words Phases 2–3 and landing).`);
  process.exitCode = failed ? 1 : 0;
}
