// Subtract with Regrouping (supplemental section) and the reusable SubtractKit component, end to end:
// the menu card after 2-15; Learn (Example → Your Turn, guided decisions, saved progress); Practice Together; the
// practice setup (defaults, unavailable combinations explained, never silently changed); independent practice (marks,
// Undo/Clear, hints 1–4 + full solution, Check, retries); targeted practice saved apart; the test (no hints or checking,
// marks optional, work kept, graded on final answers, parts reported separately); malformed saves; reset scope; Home
// Continue; and portability on the developer demo page (two instances, export/restore, destroy, theme, test isolation).
// Usage: node tests/subtract-regrouping.browser.mjs
import { BASE, startServer, startBrowser } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}
const server = await startServer();
const b = await startBrowser();
const { js, wait } = b;
const URL = server.origin + BASE + 'curriculum/supplemental/subtract-regrouping/';
const KEY = 'mathbook:v2:subtract-regrouping';
const go = async (hash) => { await js(`location.hash = '${hash}'`); await wait(300); };
// In-page helpers: fill a workspace by place (0 = ones).
const H = `
  const M = SubtractKit.math, C = Mathbook.subtractRegrouping;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const fire = (el, ev) => el.dispatchEvent(new Event(ev, { bubbles: true }));
  const digits = (box, n) => { String(n).split('').reverse().forEach((d, i) => { const x = box.querySelector('[data-k="a' + i + '"]'); x.value = d; fire(x, 'input'); }); };
  const regroup = (box, place, v) => { const x = box.querySelector('[data-k="r' + place + '"]'); x.value = String(v); fire(x, 'change'); };
  const get = (k) => JSON.parse(localStorage.getItem('${KEY}:' + k) || 'null');
  const fb = (box) => ((box || document).querySelector('.sk-fb, .feedback-area') || {}).textContent || '';`;

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main .btn, main .sk-btn, main input.sk-in')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 43.5 || r.width < 40); }).slice(0, 3).map((e) => (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
    return { sw: d.scrollWidth, cw: d.clientWidth, wide, small };`);
  check(`layout ${label}: no sideways scroll, targets ≥ 44 px`, r.sw <= r.cw && !r.wide.length && !r.small.length, r);
}

try {
  await b.viewport(1366, 768, false);
  await b.load(server.origin + BASE);
  await js(`localStorage.clear(); localStorage.setItem('mathbook:v2:lesson-2-2:attempts', '[{"id":1,"pct":80}]'); localStorage.setItem('mathbook:v2:number-words:phase-1:attempts', '[{"score":9}]');`);

  // ----- Menu card -----
  await b.load(server.origin + BASE + 'math/'); await wait(200);
  const list = await js(`return Array.from(document.querySelectorAll('.choice-card')).map((a) => ({ t: a.querySelector('.choice-title').textContent, h: a.getAttribute('href') }))`);
  const i15 = list.findIndex((x) => /Use an Algorithm to Subtract/.test(x.t));
  check('Math Lessons: "Subtract with Regrouping" is the card right after 2-15', i15 >= 0 && list[i15 + 1] && list[i15 + 1].t === 'Subtract with Regrouping' && /subtract-regrouping\/#menu$/.test(list[i15 + 1].h), list.slice(-3));

  // ----- Section menu and Parent Guide -----
  await b.load(URL + '#menu'); await wait(250);
  const menu = await js(`return { h1: document.querySelector('h1').textContent, cards: Array.from(document.querySelectorAll('.choice-card .choice-title')).map((x) => x.textContent), guide: !!document.querySelector('a[href="#teach"]') }`);
  check('Section menu: Learn, Practice, Take a Test, My Results, Parent Guide', menu.h1 === 'Subtract with Regrouping' && menu.cards.join() === 'Learn,Practice,Take a Test,My Results' && menu.guide, menu);
  await go('#teach');
  const pg = await js(`return { text: document.querySelector('main').innerText, demos: document.querySelectorAll('.sk-mode-demo').length }`);
  check('Parent Guide: goal, progression, a worked 4-digit example, zeros, mistakes, prompts, checklist, results, reset', /Learning progression/.test(pg.text) && /4,532 − 1,768/.test(pg.text) && /3,002 − 1,578/.test(pg.text) && /Common mistakes/.test(pg.text) && /What to ask/.test(pg.text) && /Skill checklist/.test(pg.text) && /results and targeted practice/i.test(pg.text) && /Reset Progress/.test(pg.text) && pg.demos === 2, pg.demos);

  // ----- Learn -----
  await go('#see');
  const l1 = await js(`const parts = []; const say = () => document.querySelector('.sr-say').textContent;
    parts.push(say()); for (let k = 0; k < 3; k++) { document.querySelector('[data-part="next"]').click(); await new Promise((r) => setTimeout(r, 40)); parts.push(say()); }
    return { count: document.querySelector('.wiz-count').textContent, tag: document.querySelector('.phase-tag').textContent, blocks: document.querySelectorAll('.sr-blocks2 .blocks-col').length, parts, hi: document.querySelectorAll('.sr-blocks2 .is-hi').length };`);
  check('Learn step 1 starts small: 49 as blocks, one action per part (4 tens 9 ones → exchange → 3 tens 19 ones → 30 + 19 = 49)', l1.count === 'Step 1 of 9' && l1.tag === 'Example' && l1.blocks === 2 &&
    l1.parts[0] === '49 has 4 tens and 9 ones.' && /Exchange 1 ten for 10 ones/.test(l1.parts[1]) && /Now there are 3 tens and 19 ones/.test(l1.parts[2]) && /30 \+ 19 = 49/.test(l1.parts[3]), l1);
  await js(`document.querySelector('[data-w="try"]').click()`); await wait(200);
  const yt1 = await js(`${H} const box = document.querySelector('#sr-try'); const W = get('see-wizard'); const it = C.learn[0].yourTurn(M.rng(W.checks.value.seed));
    const q = () => (box.querySelector('.sr-q1-label') || {}).textContent; const inp = () => box.querySelector('#sr-q1in'); const click = (x) => box.querySelector('[data-x="' + x + '"]').click();
    const out = { q0: q(), blocksKept: box.querySelectorAll('.sr-blocks2').length, numericOnly: box.querySelectorAll('input[type=radio]').length === 0 };
    inp().value = String(it.tens); fire(inp(), 'input'); click('check'); await sleep(30);
    out.mainHidden = Array.from(box.querySelectorAll('.sr-helprow:not(.sr-retry) [data-x]')).filter((x) => x.dataset.x !== 'check').every((x) => x.hidden); out.wrong = fb(box); out.retryRow = Array.from(box.querySelectorAll('.feedback-area [data-x]')).map((x) => x.textContent).join('|');
    click('hint'); await sleep(20); out.hint = fb(box); out.keptValue = inp().value;
    inp().value = String(it.tens - 1); fire(inp(), 'input'); click('check'); await sleep(30);
    out.q1 = q(); out.firstKept = (box.querySelector('.sr-done-line') || {}).textContent;
    click('show'); await sleep(40);
    out.demo0 = { part: (box.querySelector('.demo-count') || {}).textContent, noInput: !box.querySelector('#sr-q1in'), notDone: !box.querySelector('.sr-complete') && document.querySelector('[data-w="next"]').disabled && !(get('see-wizard').done || {}).value, ones: (get('see-wizard').checks.value.resp || {}).o || '', focus: document.activeElement.className };
    out.says = [box.querySelector('.sr-say').textContent]; out.mid = [];
    for (let k = 0; k < 3; k++) { out.mid.push(!box.querySelector('.sr-complete') && document.querySelector('[data-w="next"]').disabled); click('d-next'); await sleep(30); out.says.push((box.querySelector('.sr-say') || {}).textContent); }
    out.kept = { demo: !!box.querySelector('.sr-showdemo .sr-blocks2'), say: (box.querySelector('.sr-showdemo .sr-say') || {}).textContent, start: !!box.querySelector('.sr-xt > .sr-blocks2') };
    out.shown = (box.querySelector('.sr-shown') || {}).textContent; out.focusDone = document.activeElement.classList.contains('sr-complete'); out.done = (box.querySelector('.feedback-ok') || {}).textContent;
    out.next = !document.querySelector('[data-w="next"]').disabled; out.helped = get('see-wizard').helped; out.n = it.n; out.t = it.tens; out.o = it.ones;
    return out;`);
  check('Learn 1 Your Turn asks one thing at a time ("How many tens are left?"), numbers only, starting blocks kept on screen', yt1.q0 === 'How many tens are left?' && yt1.numericOnly && yt1.blocksKept >= 1, yt1);
  check('A wrong answer swaps Hint/Show me for one row: Try again · Get a hint · Show me how (never both rows)', yt1.mainHidden, yt1);
  check('A wrong answer gets concrete feedback naming the amounts, plus Try again · Get a hint · Show me how', new RegExp(yt1.n + ' has ' + yt1.t + ' tens').test(yt1.wrong) && yt1.retryRow === 'Try again|Get a hint|Show me how', yt1);
  check('Get a hint gives a next step without the answer; the typed entry is kept', /Start with the/.test(yt1.hint) && !new RegExp('\\b' + (yt1.t - 1) + ' tens are left').test(yt1.hint) && yt1.keptValue === String(yt1.t), yt1);
  check('Right answer → the next single question ("How many ones are there now?"), the first answer kept', yt1.q1 === 'How many ones are there now?' && new RegExp(String(yt1.t - 1)).test(yt1.firstKept), yt1);
  check('Step 1 Show me plays the exchange with the blocks, one part at a time (Part 1 of 4); the answer is not filled in and the step is not done while it plays',
    yt1.demo0.part === 'Part 1 of 4' && yt1.demo0.noInput && yt1.demo0.notDone && yt1.demo0.ones === '' && /sr-showdemo-h/.test(yt1.demo0.focus) && yt1.mid.every(Boolean), yt1);
  check('Its parts show each action: has → exchange 1 ten for 10 ones → tens and ones now → value the same', new RegExp(yt1.n + ' has').test(yt1.says[0]) && /Exchange 1 ten for 10 ones/.test(yt1.says[1]) && /Now there are/.test(yt1.says[2]) && /The value is the same/.test(yt1.says[3]), yt1.says);
  check('After it ends: the model and explanation stay on screen (with the starting blocks); focus moves to the completion message', yt1.kept.demo && yt1.kept.start && /The value is the same/.test(yt1.kept.say) && yt1.focusDone, yt1.kept);
  check('Then the answer is filled in with its explanation, the step says "Completed with help", Next unlocks, and it is recorded WITH help', /\+ 10 =/.test(yt1.shown) && /Completed with help/.test(yt1.done) && /The value is the same/.test(yt1.done) && yt1.next && yt1.helped && yt1.helped.value === true, yt1);
  await b.reload(); await wait(250);
  const kept = await js(`return { phase: document.querySelector('.phase-tag').textContent, next: !document.querySelector('[data-w="next"]').disabled }`);
  check('Learn: phase and completion survive a refresh', kept.phase === 'Your Turn' && kept.next, kept);
  await js(`document.querySelector('[data-w="next"]').click()`); await wait(200);
  check('Next Step opens step 2 on its Example with focus on the heading', await js(`return document.querySelector('.wiz-count').textContent === 'Step 2 of 9' && document.querySelector('.phase-tag').textContent === 'Example' && document.activeElement.classList.contains('wiz-h') && document.querySelectorAll('.sk-mode-demo').length === 1`));
  await js(`document.querySelector('[data-w="try"]').click()`); await wait(250);
  // Guided Your Turn: answer every decision with the standard method.
  const guided = await js(`${H} const box = document.querySelector('#sr-yt'); const W = get('see-wizard'); const it = C.learn[1].yourTurn(M.rng(W.checks.one.seed));
    const p = M.plan(it.top, it.bottom); const btn = (a, v) => box.querySelector('[data-act="' + a + '"]' + (v !== undefined ? '[data-v="' + v + '"]' : '')).click(); const setv = (k, v) => { const x = box.querySelector('[data-k="' + k + '"]'); x.value = String(v); fire(x, 'input'); };
    const log = [];
    for (const c of p.columns) {
      btn('needs', c.needs ? 'yes' : 'no');
      if (c.needs) { btn('supplier', c.supplier); for (const e of c.exchanges) { setv('r' + e.from, e.after[e.from]); setv('r' + e.to, e.after[e.to]); btn('check-ex'); } }
      setv('a' + c.place, c.digit); btn('check-digit'); log.push(fb(box).slice(0, 40));
    }
    await sleep(50);
    return { done: (box.querySelector('.sk-ok-note') || {}).textContent || '', next: !document.querySelector('[data-w="next"]').disabled, log };`);
  check('Learn 2 Your Turn: the child decides each step (regroup? which place? new values? digit) and finishes', /You did it!/.test(guided.done) && guided.next, guided);

  // ----- Recovery: finish all of Learn using only Show me; credited as "with help", never as independent -----
  await b.load(URL + '#menu'); await js(`localStorage.removeItem('${KEY}:see-wizard')`);
  await b.load(URL + '#see'); await b.reload(); await wait(250);
  const journey = await js(`${H} const log = [], played = [];
    for (let k = 0; k < 9; k++) {
      document.querySelector('[data-w="try"]').click(); await sleep(150);
      const box = document.querySelector('#sr-try');
      if (box.querySelector('#sr-q1in')) { box.querySelector('[data-x="show"]').click(); await sleep(40); for (let p = 0; p < 3; p++) { box.querySelector('[data-x="d-next"]').click(); await sleep(30); } }
      else if (box.querySelector('#sr-yt')) { for (let g = 0; g < 40 && box.querySelector('[data-act="g-show"]'); g++) { box.querySelector('[data-act="g-show"]').click(); await sleep(20); } }
      else { const sh = box.querySelector('[data-help="show"]'); if (sh) sh.click(); await sleep(60);
        const nb = () => box.querySelector('.sr-worked [data-act="next"]'); const lockedBefore = document.querySelector('[data-w="next"]') ? document.querySelector('[data-w="next"]').disabled : document.querySelector('[data-w="finish"]').classList.contains('is-disabled');
        const filledBefore = Array.from(box.querySelectorAll('input[type=radio]')).some((r) => r.checked) || Array.from(box.querySelectorAll('[data-ws="answer"] input.sk-ans')).some((x) => x.value);
        let parts = 0, ex = 0; while (nb() && !nb().disabled && parts < 60) { nb().click(); parts++; await sleep(10); if (/^Exchange 1/.test((box.querySelector('.sr-worked .sk-note') || {}).textContent)) ex++; }
        const it = C.learn[k].yourTurn(M.rng(get('see-wizard').checks[C.learn[k].id].seed));
        played.push({ id: C.learn[k].id, lockedBefore, filledBefore, parts, ex, wantEx: M.plan(it.top, it.bottom).exchanges.length, kept: !!box.querySelector('.sr-worked .sk-grid') && !!box.querySelector('.sr-shown-end .sk-steps'), done: (box.querySelector('.sr-shown-done') || {}).textContent || '' }); }
      const nx = document.querySelector('[data-w="next"]'), fin = document.querySelector('[data-w="finish"]');
      log.push(C.learn[k].id + ':' + (nx ? !nx.disabled : !fin.classList.contains('is-disabled')));
      if (nx) { nx.click(); await sleep(150); }
    }
    const W = get('see-wizard'); return { log, played, done: Object.keys(W.done).length, helped: Object.keys(W.helped || {}).length };`);
  check('A learner can finish every Learn step with Show me (no dead ends)', journey.log.length === 9 && journey.log.every((x) => /:true$/.test(x)) && journey.done === 9, journey);
  check('Learn finished with Show me is recorded as 9 of 9 WITH help (not independent)', journey.helped === 9, journey);
  check('Learn questions (decide, mistakes, check, 4-digit): Show me plays every exchange first; answers stay empty and Next stays locked until it ends',
    journey.played.length === 3 && journey.played.every((x) => x.lockedBefore && !x.filledBefore && x.parts > 0 && x.ex === x.wantEx), journey.played);
  check('…then the worked model, explanation and steps stay on screen and it says "Completed with help"', journey.played.every((x) => x.kept && /Completed with help/.test(x.done)), journey.played);
  await b.load(URL + '#results'); await b.reload(); await wait(250);
  check('My Results says "9 of 9 steps done (9 completed with help)" and shows no test score from it', await js(`return /Learn: 9 of 9 steps done \\(9 completed with help\\)/.test(document.querySelector('main').innerText) && /No test results yet/.test(document.querySelector('main').innerText)`));
  // SR-M18: "with help" counts only steps that are also done (damaged data cannot inflate it).
  await b.load(URL + '#menu'); await js(`const W = JSON.parse(localStorage.getItem('${KEY}:see-wizard')); delete W.done.four; localStorage.setItem('${KEY}:see-wizard', JSON.stringify(W))`);
  await b.load(URL + '#results'); await b.reload(); await wait(250);
  { const t = await js(`return document.querySelector("main").innerText`); check('My Results counts "completed with help" only for steps that are done (8 of 9 → 8)', /Learn: 8 of 9 steps done \(8 completed with help\)/.test(t), t.slice(0, 400)); }
  // SR-M17: Try again returns focus to the part that was wrong (Learn decide: the column group, not "Yes").
  await b.load(URL + '#menu'); await js(`localStorage.setItem('${KEY}:see-wizard', JSON.stringify({ v: 1, step: 6, done: {}, phase: {}, ex: {}, checks: {}, helped: {} }))`);
  await b.load(URL + '#see'); await b.reload(); await wait(250);
  await js(`document.querySelector('[data-w="try"]').click()`); await wait(200);
  const dfx = await js(`${H} const box = document.querySelector('#sr-try'); const W = get('see-wizard'); const it = C.learn[6].yourTurn(M.rng(W.checks.decide.seed));
    const pick = (grp, val) => { const r = Array.from(box.querySelectorAll('input[type=radio][name$="' + grp + '"]')).find((x) => val(x.value)); r.click(); return r.value; };
    pick('c1', (v) => v === it.needs); const wrongCol = pick('c2', (v) => v !== it.first);
    box.querySelector('[data-check]').click(); await sleep(30);
    box.querySelector('.feedback-area [data-help="retry"]').click(); await sleep(30);
    const a = document.activeElement; return { name: a.name, value: a.value, wrongCol, first: it.first };`);
  check('Learn decide: Try again focuses the wrong column choice, not the right "Yes/No"', /c2$/.test(dfx.name) && dfx.value === dfx.wrongCol, dfx);
  // SR-M17: guided wrong getter (7,405 − 3,168: tens written 1) → Try again focuses the tens box, not the right hundreds box.
  await b.load(URL + '#menu'); await js(`localStorage.setItem('${KEY}:guided', JSON.stringify({ v: 1, pos: 5, seed: 0, states: {}, done: {} }))`);
  await b.load(URL + '#practice/together'); await b.reload(); await wait(300);
  const gfx = await js(`${H} const box = document.querySelector('#sr-tg');
    for (let k = 0; k < 2; k++) { box.querySelector('[data-act="g-show"]').click(); await sleep(30); } // needs, supplier
    const set = (j, v) => { const x = box.querySelector('[data-k="r' + j + '"]'); x.value = String(v); fire(x, 'input'); };
    set(2, 3); set(1, 1); box.querySelector('[data-act="check-ex"]').click(); await sleep(30);
    box.querySelector('[data-act="g-retry"]').click(); await sleep(30);
    return { k: document.activeElement.dataset.k, r2: box.querySelector('[data-k="r2"]').value };`);
  check('Guided: Try again after a wrong getter focuses that box (tens), and the right hundreds stays', gfx.k === 'r1' && gfx.r2 === '3', gfx);
  // Guided Show me shows the worked step with amounts, and wrong answers offer the retry row.
  await b.load(URL + '#menu'); await js(`localStorage.setItem('${KEY}:guided', JSON.stringify({ v: 1, pos: 6, seed: 0, states: {}, done: {} }))`);
  await b.load(URL + '#practice/together'); await b.reload(); await wait(300);
  const gs = await js(`${H} const box = document.querySelector('#sr-tg'); const out = {};
    box.querySelector('[data-act="needs"][data-v="no"]').click(); await sleep(30);
    out.retry = Array.from(box.querySelectorAll('.sk-help .sk-btn')).map((x) => x.textContent).join('|');
    box.querySelector('[data-act="g-hint"]').click(); await sleep(30); out.hint = (box.querySelector('.sk-coach .sk-hint') || {}).textContent;
    box.querySelector('[data-act="g-show"]').click(); await sleep(30); out.prev1 = (box.querySelector('.sk-prev') || {}).textContent;
    for (let k = 0; k < 3; k++) { box.querySelector('[data-act="g-show"]').click(); await sleep(30); } // supplier, exchange 1, exchange 2
    out.prev3 = (box.querySelector('.sk-prev') || {}).textContent; out.hist = (box.querySelector('[data-hist="2"]') || {}).textContent;
    return out;`);
  check('Guided: after a mistake → Try again · Get a hint · Show me how; the hint names the digits', gs.retry === 'Try again|Get a hint|Show me how' && /the top has 3 and the bottom has 7/.test(gs.hint), gs);
  check('Guided Show me shows each exchange with the amounts and keeps the vertical marks (struck 10 above the 9)', /Shown:/.test(gs.prev1) && /go from 10 to 9/.test(gs.prev3) && gs.hist === '10', gs);

  // ----- Practice Together -----
  await b.load(URL + '#menu'); await js(`localStorage.removeItem('${KEY}:guided')`); await wait(100);
  await go('#practice/together');
  const tg = await js(`return { count: document.querySelector('.wiz-count').textContent, q: document.querySelector('.sk-q').textContent, help: !!document.querySelector('.parent-help') }`);
  check('Practice Together: guided problem 1 of 8 with Parent Help', tg.count === 'Problem 1 of 8' && /ones column need regrouping/.test(tg.q) && tg.help, tg);

  // ----- Practice setup -----
  await go('#practice/setup');
  const def = await js(`return { step: document.querySelector('.sr-setup .wiz-count').textContent, size: (document.querySelector('input[name=sz]:checked') || {}).value }`);
  check('Setup step 1 of 4: number size, default 4-digit', def.step === 'Step 1 of 4' && def.size === '4', def);
  await js(`document.querySelector('input[name=sz][value="2"]').click(); document.querySelector('[data-s="next"]').click();`); await wait(150);
  const two = await js(`return { off: Array.from(document.querySelectorAll('input[name=df]:disabled')).map((x) => x.value), why: (document.querySelector('.sr-why') || {}).textContent || '', checked: (document.querySelector('input[name=df]:checked') || {}).value }`);
  check('2-digit: Medium and Hard are unavailable, with a plain reason; Easy stays chosen', two.off.join() === 'medium,hard' && /at least three digits/.test(two.why) && two.checked === 'easy', two);
  await js(`document.querySelector('[data-s="back"]').click()`); await wait(100);
  check('the chosen size is not silently changed (still 2-digit)', await js(`return document.querySelector('input[name=sz]:checked').value === '2'`));
  await js(`document.querySelector('input[name=sz][value="4"]').click(); for (let i = 0; i < 3; i++) document.querySelector('[data-s="next"]').click();`); await wait(150);
  check('Step 4: Start shows 4-digit · Easy · 10 questions', await js(`return /4-digit · Easy · 10 questions/.test(document.querySelector('.sr-setup').innerText)`));
  await js(`document.querySelector('[data-s="start"]').click()`); await wait(400);
  // Pin the session to seed 1 (first problem 7,289 − 6,417) so the scripted "smaller-from-larger" answer really is wrong.
  await js(`${H} const B = get('bank-sets'); B.setup.active.seed = 1; localStorage.setItem('${KEY}:bank-sets', JSON.stringify(B));`); await b.reload(); await wait(350);
  const run = await js(`${H} const s = get('bank-sets').setup.active; const items = M.generateSession(Object.assign({ seed: s.seed }, s.setup)).items;
    return { hash: location.hash, count: document.querySelector('.q-count').textContent, n: items.length, four: items.every((q) => String(q.top).length === 4), easy: items.every((q) => M.classify(q.top, q.bottom).difficulty === 'easy'), first: items[0] };`);
  check('Practice on My Own starts: 10 four-digit Easy questions, one at a time', run.hash === '#practice/run' && run.count === 'Question 1 of 10' && run.n === 10 && run.four && run.easy, run);
  const ind = await js(`${H} const box = document.querySelector('#sr-ws'); const q = ${JSON.stringify(run.first)}; const log = {};
    box.querySelector('[data-act="check"]').click(); await sleep(30); log.empty = fb(box);
    const p = M.plan(q.top, q.bottom); const wrong = p.columns.map((c) => c.needs ? (c.bottomDigit - c.before[c.place]) : c.digit);
    wrong.forEach((d, i) => { const x = box.querySelector('[data-k="a' + i + '"]'); x.value = String(d); fire(x, 'input'); });
    box.querySelector('[data-act="check"]').click(); await sleep(30); log.wrong = fb(box); log.marked = box.querySelectorAll('.sk-ans.is-no').length;
    const ex = p.exchanges[0]; regroup(box, ex.from, ex.after[ex.from]); regroup(box, ex.to, ex.after[ex.to]); log.marks = JSON.stringify(get('bank-sets').setup.active.responses.q1.ws.ann);
    box.querySelector('[data-act="undo"]').click(); log.undo = JSON.stringify(get('bank-sets').setup.active.responses.q1.ws.ann);
    box.querySelector('[data-act="clear"]').click(); log.clear = JSON.stringify(get('bank-sets').setup.active.responses.q1.ws.ann);
    box.querySelector('[data-act="hint"]').click(); log.h1 = box.querySelector('.sk-hint').textContent;
    log.showNow = !!box.querySelector('[data-act="solution"]'); // Show me is there from the start (no hint gate)
    for (let k = 0; k < 3; k++) box.querySelector('[data-act="hint"]').click();
    log.h4 = !!box.querySelector('[data-act="solution"]'); log.noSolYet = !box.querySelector('.sk-solution');
    const own = () => Array.from(box.querySelectorAll('input.sk-ans')).filter((x) => !x.closest('[data-sk-mini]')).map((x) => x.value).join('');
    box.querySelector('[data-act="solution"]').click(); await sleep(20); log.sol = !!box.querySelector('.sk-solution .sk-mode-demo .sk-grid');
    log.before = { own: own(), done: !!box.querySelector('.sk-shown-done'), steps: !!box.querySelector('.sk-solution .sk-steps'), correct: !!(get('bank-sets').setup.active.results.q1 || {}).correct };
    const mini = box.querySelector('[data-sk-mini]'); const notes = []; let n = 0;
    while (mini.querySelector('[data-act="next"]:not([disabled])') && n < 60) { mini.querySelector('[data-act="next"]').click(); n++; notes.push(mini.querySelector('.sk-note').textContent); }
    log.play = { n, ex: notes.filter((t) => /^Exchange 1/.test(t)).length, wantEx: p.exchanges.length };
    log.after = { own: own(), want: String(q.top - q.bottom), done: (box.querySelector('.sk-shown-done') || {}).textContent, steps: !!box.querySelector('.sk-solution-end .sk-steps'), kept: !!mini.querySelector('.sk-grid'), marks: Object.keys(get('bank-sets').setup.active.responses.q1.ws.ann).length, focus: document.activeElement.className, res: get('bank-sets').setup.active.results.q1 };
    digits(box, q.top - q.bottom); box.querySelector('[data-act="check"]').click(); await sleep(30); log.right = fb(box);
    log.result = get('bank-sets').setup.active.results.q1; return log;`);
  check('Check with nothing typed asks for an answer (empty is not 0)', /Write your answer/.test(ind.empty), ind.empty);
  check('A smaller-from-larger answer gets that specific feedback; wrong digits are marked; work is kept', /can't take .* and you can't turn it around/.test(ind.wrong) && ind.marked >= 1, ind);
  check('Regroup marks are saved; Undo removes the last one; Clear work removes all marks', ind.marks.length > 2 && ind.undo !== ind.marks && ind.clear === '{}', ind);
  check('Hints step up; Show me is available at once (no hint gate) and shows a separate vertical worked answer', /^Hint 1 of 4: Look at the \w+ column/.test(ind.h1) && ind.showNow && ind.h4 && ind.noSolYet && ind.sol, ind);
  check('Practice Show me plays each exchange first; the child\'s answer is not filled in and nothing is recorded correct until it ends', ind.sol && ind.before.own !== String(ind.after.want) && !ind.before.done && !ind.before.steps && !ind.before.correct && ind.play.n > 0 && ind.play.ex === ind.play.wantEx, ind);
  check('When it ends: the answer and regroup marks are filled in, the model and steps stay on screen, "Completed with help", recorded WITH help (not first try)', ind.after.own === ind.after.want && ind.after.marks > 0 && ind.after.kept && ind.after.steps && /Completed with help/.test(ind.after.done) && /sk-shown-done/.test(ind.after.focus) && ind.after.res.correct === true && ind.after.res.helped === true && ind.after.res.firstTry === false, ind.after);
  check('After Show me, a right answer is recorded as done WITH help (not on your own, not first try)', /Correct!/.test(ind.right) && ind.result.helped === true && ind.result.firstTry === false, ind.result);
  await b.reload(); await wait(300);
  check('Refresh keeps the question and the typed answer', await js(`${H} const box = document.querySelector('#sr-ws'); return document.querySelector('.q-count').textContent === 'Question 1 of 10' && Array.from(box.querySelectorAll('.sk-ans')).map((x) => x.value).join('') !== ''`));
  await js(`document.querySelector('[data-r="next"]').click()`); await wait(250);
  const home = await js(`location.href = '${server.origin + BASE}'; await new Promise((r) => setTimeout(r, 400)); return document.getElementById('continue').hidden ? '' : document.getElementById('continue-what').textContent`).catch(() => null);
  await wait(400);
  const homeText = await js(`return document.getElementById('continue').hidden ? '' : document.getElementById('continue-what').textContent`);
  check('Home Continue names the section and the unfinished practice', /^Subtract with Regrouping · /.test(homeText), { homeText, home });

  // ----- Targeted practice is saved apart -----
  await b.load(URL + '#practice/skill-zeros2'); await wait(300);
  const sk = await js(`${H} return { count: document.querySelector('.q-count').textContent, skill: !!get('skill-practice')['skill-zeros2'].active, setupPos: get('bank-sets').setup.active.pos }`);
  check('Practice One Skill (zeros next to each other): 6 questions, saved apart from Practice on My Own', sk.count === 'Question 1 of 6' && sk.skill && sk.setupPos === 1, sk);
  const zz = await js(`${H} const box = document.querySelector('#sr-ws'); const it = C.skillSession('zeros2', get('skill-practice')['skill-zeros2'].active.seed)[0]; const p = M.plan(it.top, it.bottom);
    box.querySelector('[data-act="solution"]').click(); await sleep(20); const mini = box.querySelector('[data-sk-mini]'); const seen = []; let n = 0;
    const own = () => Array.from(box.querySelectorAll('input.sk-ans')).filter((x) => !x.closest('[data-sk-mini]')).map((x) => x.value).join('');
    const before = own();
    while (mini.querySelector('[data-act="next"]:not([disabled])') && n < 60) { mini.querySelector('[data-act="next"]').click(); n++; const t = mini.querySelector('.sk-note').textContent; if (/^Exchange 1/.test(t)) seen.push(t.slice(0, 40)); if (n === 1) var mid = own(); }
    return { top: it.top, bottom: it.bottom, four: M.lengthOf(it.top) === 4, chain: p.columns.some((c) => c.chain >= 2), wantEx: p.exchanges.length, seen, before, mid, after: own(), want: String(it.top - it.bottom), done: (box.querySelector('.sk-shown-done') || {}).textContent, res: get('skill-practice')['skill-zeros2'].active.results[it.id] };`);
  check('Four-digit across two zeros: Show me shows every exchange (one per part) before the answer is filled; then completed with help', zz.four && zz.chain && zz.seen.length === zz.wantEx && zz.wantEx >= 3 && zz.before === '' && zz.mid === '' && zz.after === zz.want && /Completed with help/.test(zz.done) && zz.res && zz.res.helped === true, zz);
  await b.load(URL + '#practice/skill-mistakes'); await wait(300);
  const mk = await js(`${H} const it = C.skillSession('mistakes', get('skill-practice')['skill-mistakes'].active.seed)[0]; const box = document.querySelector('#sr-q');
    box.querySelector('[data-check]').click(); await sleep(30); const f0 = fb(box);
    box.querySelector('input[value="' + it.answer.replace(/"/g, '\\\\"') + '"]').click(); digits(box.querySelector('[data-ws="answer"]'), it.top - it.bottom);
    box.querySelector('[data-check]').click(); await sleep(30);
    return { f0, f1: fb(box), view: !!box.querySelector('.sk-mode-view'), noHintInAnswer: !box.querySelector('[data-ws="answer"] [data-act="hint"]') };`);
  check('Find the mistake: someone\'s work shown vertically; both parts needed; right → praised', /Answer every part/.test(mk.f0) && /Right\./.test(mk.f1) && mk.view, mk);

  // ----- Test -----
  await b.load(URL + '#test'); await wait(250);
  await js(`document.querySelector('[data-new]').click()`); await wait(350);
  const t1 = await js(`return { count: document.querySelector('.q-count').textContent, hint: !!document.querySelector('main [data-act="hint"], main [data-act="check"], main [data-check], main [data-act="solution"], main [data-help], main [data-act^="g-"]'), undo: !!document.querySelector('main [data-act="undo"]'), banner: document.body.classList.contains('is-testing') }`);
  check('Test: Question 1 of 15; no Hint, Show me or Check; marks (Undo/Clear) allowed', t1.count === 'Question 1 of 15' && !t1.hint && t1.undo && t1.banner, t1);
  const answerAll = (skipMarks) => js(`${H} const D = get('draft-test'); const items = C.testItems(D.seed); const log = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i], box = document.querySelector('#sr-tq');
      if (it.kind === 'sub') digits(box.querySelector('[data-ws="answer"]'), it.top - it.bottom);
      if (it.kind === 'steps') { const p = M.plan(it.top, it.bottom); const orig = M.digitsOf(it.top, M.lengthOf(it.top)); p.final.forEach((v, k) => { if (v !== orig[k]) regroup(box.querySelector('[data-ws="steps"]'), k, v); }); }
      if (it.kind === 'decide') { box.querySelector('input[value="' + it.needs + '"]').click(); box.querySelector('input[value="' + it.first + '"]').click(); }
      if (it.kind === 'mistake') { box.querySelector('input[value="' + it.answer.replace(/"/g, '\\\\"') + '"]').click(); digits(box.querySelector('[data-ws="answer"]'), it.top - it.bottom); }
      log.push(it.kind + ':' + ((box.querySelector('.sk-fb') || {}).textContent || ''));
      document.querySelector('[data-nav="next"]').click(); await sleep(120);
    }
    return { review: document.querySelector('h1').textContent, finish: !document.querySelector('[data-finish]').disabled, feedbackSeen: log.filter((x) => !/:$/.test(x)) };`);
  // Leave mid-test, refresh, come back: work kept.
  await js(`${H} const D = get('draft-test'); const items = C.testItems(D.seed); digits(document.querySelector('#sr-tq [data-ws="answer"]'), items[0].top - items[0].bottom);`).catch(() => {});
  await b.reload(); await wait(300);
  const resumed = await js(`return { hash: location.hash, count: (document.querySelector('.q-count') || {}).textContent, typed: Array.from(document.querySelectorAll('#sr-tq .sk-ans')).map((x) => x.value).join('') }`);
  check('An unfinished test survives a refresh with its typed work', resumed.hash === '#test/run' && resumed.count === 'Question 1 of 15' && resumed.typed.length > 0, resumed);
  const done = await answerAll();
  check('Answering all 15 (no hints or feedback shown) reaches the review with Finish enabled', done.review === 'Review your test' && done.finish && done.feedbackSeen.length === 0, done);
  await js(`document.querySelector('[data-finish]').click()`); await wait(400);
  const res = await js(`${H} const a = get('attempts'); return { hash: location.hash, text: document.querySelector('main').innerText, a: a && a[a.length - 1] }`);
  check('Results: 15 of 15 (100%) Mastered; final answers, steps, decision and mistakes reported separately', res.hash === '#results' && /15 of 15/.test(res.text) && /Mastered/.test(res.text) &&
    /Final answers\s+\d+ of \d+/.test(res.text) && /Regrouping steps\s+2 of 2/.test(res.text) && /Deciding whether to regroup\s+1 of 1/.test(res.text) && /Finding mistakes\s+2 of 2/.test(res.text) && res.a.pct === 100, res.a && res.a.parts);
  check('Results keep guided work separate from the test score', /not part of the test score/.test(res.text) && /Learn: \d of 9 steps done/.test(res.text), res.text.slice(0, 300));
  // A second test: right final answers with no marks at all still count; wrong ones are not diagnosed.
  await b.load(URL + '#test'); await wait(250); await js(`document.querySelector('[data-new]').click()`); await wait(350);
  const r2 = await js(`${H} const D = get('draft-test'); const items = C.testItems(D.seed);
    for (let i = 0; i < items.length; i++) {
      const it = items[i], box = document.querySelector('#sr-tq');
      if (it.kind === 'sub') digits(box.querySelector('[data-ws="answer"]'), i === 0 ? it.top - it.bottom + 1 : it.top - it.bottom);
      if (it.kind === 'steps') regroup(box.querySelector('[data-ws="steps"]'), 0, 1);
      if (it.kind === 'decide') { box.querySelector('input[value="' + it.needs + '"]').click(); box.querySelector('input[value="' + it.first + '"]').click(); }
      if (it.kind === 'mistake') { box.querySelector('input[value="' + it.answer.replace(/"/g, '\\\\"') + '"]').click(); digits(box.querySelector('[data-ws="answer"]'), it.top - it.bottom); }
      document.querySelector('[data-nav="next"]').click(); await sleep(120);
    }
    document.querySelector('[data-finish]').click(); await sleep(400);
    const a = get('attempts'); return { last: a[a.length - 1], text: document.querySelector('main').innerText };`);
  check('No marks needed: right final answers score; a wrong final answer is named by question kind only', r2.last.score === 12 && r2.last.parts.final[0] === r2.last.parts.final[1] - 1 && /Questions to look at again/.test(r2.text) && /from the kind of question, not from a guess/.test(r2.text) && !/smaller|did not take 1/.test(r2.text), r2.last);

  // ----- Malformed saved records -----
  await js(`localStorage.setItem('${KEY}:see-wizard', '{"v":1,"step":"x"}'); localStorage.setItem('${KEY}:bank-sets', '5'); localStorage.setItem('${KEY}:attempts', '[{"bad":1}]');
    localStorage.setItem('${KEY}:draft-test', '"str"'); localStorage.setItem('${KEY}:skill-practice', '{"v":1,"skill-nope":{}}'); localStorage.setItem('${KEY}:guided', '{"v":1,"pos":99}');`);
  const bad = [];
  for (const h of ['#menu', '#see', '#practice', '#practice/together', '#practice/setup', '#practice/skills', '#test', '#results']) {
    await b.load(URL + h); await b.reload(); await wait(250);
    bad.push(await js(`return (document.querySelector('h1') || {}).textContent || 'BLANK'`));
  }
  check('Malformed records: every screen still renders (fresh start), no errors, other programs untouched', !bad.includes('BLANK') && b.errors.length === 0 &&
    await js(`return localStorage.getItem('mathbook:v2:lesson-2-2:attempts') !== null && localStorage.getItem('mathbook:v2:number-words:phase-1:attempts') !== null`), { bad, errors: b.errors });
  await b.load(URL + '#see'); await wait(250); await js(`document.querySelector('[data-w="try"]').click()`); await wait(200);
  check('After a malformed record, new progress saves again with v: 1', await js(`return JSON.parse(localStorage.getItem('${KEY}:see-wizard')).v === 1`));

  // ----- Reset only this section -----
  await b.load(URL + '#teach'); await wait(250);
  await js(`document.querySelector('#clear').click(); await new Promise((r) => setTimeout(r, 50)); document.querySelector('#clear-yes').click();`); await wait(300);
  const rs = await js(`return { mine: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}:')), other: localStorage.getItem('mathbook:v2:lesson-2-2:attempts') && localStorage.getItem('mathbook:v2:number-words:phase-1:attempts'), hash: location.hash }`);
  check('Reset (with confirmation) erases only this section', rs.mine.length === 0 && rs.other && rs.hash === '#menu', rs);

  // ----- Layout on every device size -----
  for (const [w, h] of [[320, 640], [390, 844], [768, 1024], [1024, 768], [1366, 768], [1920, 1080], [683, 384]]) {
    await b.viewport(w, h);
    for (const route of ['#see', '#practice/skill-zeros2', '#test']) {
      await b.load(URL + route); await b.reload(); await wait(250);
      if (route === '#see') { await js(`const t = document.querySelector('[data-w="try"]'); if (t) t.click();`); await wait(200); }
      if (route === '#test') { await js(`const n = document.querySelector('[data-new]'); if (n) n.click();`); await wait(300); }
      await noOverflow(`${route} @${w}x${h}`);
    }
    if (w === 1366 || w === 1024) {
      await b.load(URL + '#practice/skill-zeros2'); await b.reload(); await wait(250);
      const fit = await js(`const c = document.querySelector('[data-act="check"]').getBoundingClientRect(), g = document.querySelector('.sk-grid').getBoundingClientRect(); return { cb: Math.round(c.bottom), top: Math.round(g.top), vh: innerHeight }`);
      check(`desktop ${w}x${h}: the problem and Check are on screen without scrolling`, fit.top >= 0 && fit.cb <= fit.vh, fit);
    }
  }
  await b.viewport(1366, 768, false);

  // ----- Portability: the developer demo page (no Mathbook) -----
  await b.load(server.origin + BASE + 'dev/subtract-demo/'); await wait(300);
  const port = await js(`const SK = window.SubtractKit; const out = {};
    out.noMathbook = typeof window.Mathbook === 'undefined' && !document.querySelector('link[href*="mathbook.css"]');
    const ids = Array.from(document.querySelectorAll('[id]')).map((e) => e.id); out.uniqueIds = ids.length === new Set(ids).size;
    const host = document.createElement('div'); document.body.appendChild(host); const host2 = document.createElement('div'); document.body.appendChild(host2);
    const a = SK.mount(host, { top: 3002, bottom: 1578, mode: 'independent' }), b2 = SK.mount(host2, { top: 3002, bottom: 1578, mode: 'independent' });
    let aEvents = 0, bEvents = 0; a.on('*', () => aEvents++); b2.on('*', () => bEvents++);
    const typ = (el, k, v, ev) => { const x = el.querySelector('[data-k="' + k + '"]'); x.value = v; x.dispatchEvent(new Event(ev, { bubbles: true })); };
    typ(host, 'r3', '2', 'change'); typ(host, 'a0', '4', 'input');
    out.independent = aEvents > 0 && bEvents === 0 && JSON.stringify(b2.getState().ann) === '{}';
    const saved = a.getState(); a.destroy(); out.destroyedEmpty = host.innerHTML === '' && a.destroyed;
    const before = aEvents; host.dispatchEvent(new Event('click', { bubbles: true })); out.noListeners = aEvents === before;
    const a2 = SK.mount(host, { top: 3002, bottom: 1578, mode: 'independent', state: saved });
    out.restored = JSON.stringify(a2.getState().ann) === JSON.stringify(saved.ann) && a2.getState().d[0] === '4' && host.querySelector('[data-k="r3"]').value === '2';
    out.rejectBad = a2.setState({ v: 1, top: 9, bottom: 1 }) === false && a2.setState({ v: 1, top: 3002, bottom: 1578, ann: { 7: [1] }, log: [], d: [], hint: 0, demo: 0, guided: null }) === false;
    const t = SK.mount(host2, { top: 3002, bottom: 1578, mode: 'test', hints: true, feedback: true }); t.hint(); t.showSolution();
    out.testIsolated = !host2.querySelector('[data-act="hint"], [data-act="check"], [data-act="solution"], .sk-hint, .sk-solution') && t.getState().hint === 0 && t.check().correct === false;
    a2.destroy(); t.destroy(); b2.destroy();
    try { out.afterDestroy = a2.check() === null && a2.setState(saved) === false && a2.hint() === undefined && a2.reset() === undefined && a2.result() === null && host.innerHTML === ''; } catch (e) { out.afterDestroy = 'threw: ' + e.message; }
    return out;`);
  check('Component works without Mathbook (no Mathbook scripts or styles on the page)', port.noMathbook, port);
  check('Two instances: no shared ids, state or events', port.uniqueIds && port.independent, port);
  check('destroy() empties the element and removes its listeners', port.destroyedEmpty && port.noListeners, port);
  check('After destroy(), every method is a safe no-op (SR-M11)', port.afterDestroy === true, port.afterDestroy);
  check('State exports and restores; malformed state is rejected', port.restored && port.rejectBad, port);
  check('Test mode never shows hints, Check or the solution, even if asked', port.testIsolated, port);
  const theme = await js(`document.getElementById('theme').value = 'theme-sea'; document.getElementById('theme').dispatchEvent(new Event('change')); await new Promise((r) => setTimeout(r, 100));
    const el = document.getElementById('a'); const x = (sel) => Array.from(el.querySelectorAll(sel)).map((e) => Math.round(e.getBoundingClientRect().left + e.getBoundingClientRect().width / 2));
    const top = x('.sk-topcell'), ans = x('.sk-anscell'), reg = x('.sk-curcell');
    return { top, ans, reg, col: getComputedStyle(el).getPropertyValue('--sk-col').trim() };`);
  check('Host theme changes the look without breaking column alignment', theme.top.length === 4 && theme.top.every((v, i) => Math.abs(v - theme.ans[i]) <= 1 && Math.abs(v - theme.reg[i]) <= 1) && /3\.8rem/.test(theme.col), theme);
  // ----- Real input (CDP mouse, touch, keys): clicks and focus are never lost (review SR-D01, D02, D05) -----
  const pos = (sel) => js(`const e = document.querySelector('${sel}'); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };`);
  const click = async (sel) => { const p = await pos(sel); for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await b.send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 }); await wait(60); };
  const tap = async (sel) => { const p = await pos(sel); await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p.x, y: p.y }] }); await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await wait(80); };
  const type = async (text) => { await b.send('Input.insertText', { text }); await wait(40); };
  const focused = () => js(`const a = document.activeElement; return a ? (a.dataset.k || a.dataset.act || a.className || a.tagName) : null`);
  await b.viewport(1366, 900, false);
  await b.load(server.origin + BASE + 'dev/subtract-demo/'); await wait(300);
  await click('#a [data-k="r1"]'); await type('9'); await click('#a [data-act="check"]');
  const c1 = await js(`return { fb: (document.querySelector('#a .sk-fb') || {}).textContent || '', ann: JSON.stringify(window.__demo.a.getState().ann) }`);
  check('Real click: typing a mark then clicking Check commits the mark AND checks (no lost click)', c1.fb.length > 0 && c1.ann === '{"1":[9]}' && (await focused()) === 'check', c1);
  await click('#a [data-k="r2"]'); await type('2'); await click('#a [data-k="r1"]'); await type('1');
  const c2 = await js(`return { r1: document.querySelector('#a [data-k="r1"]').value, ann: JSON.stringify(window.__demo.a.getState().ann) }`);
  check('Real click from one regroup box to the next keeps focus; the next digit is typed there', c2.r1 === '1' && /"2":\[2\]/.test(c2.ann), c2);
  await b.key('Tab');
  const tabTo = await focused();
  check('Tab out of a regroup box moves to the next box (never to the page)', /^r0$/.test(tabTo), tabTo);
  await click('#a [data-k="r0"]'); await type('15'); await b.key('Enter');
  check('Enter commits the mark and keeps focus in the box', (await focused()) === 'r0' && await js(`return JSON.stringify(window.__demo.a.getState().ann).includes('"0":[15]')`));
  await click('#a [data-act="clear"]');
  check('Clear work moves focus to Undo (not the page)', (await focused()) === 'undo');
  await b.viewport(390, 844, true); await b.load(server.origin + BASE + 'dev/subtract-demo/'); await wait(300);
  await tap('#b [data-k="r1"]'); await type('11'); await tap('#b [data-act="check"]');
  const touch1 = await js(`return { fb: (document.querySelector('#b .sk-fb') || {}).textContent || '', ann: JSON.stringify(window.__demo.b.getState().ann) }`);
  check('Touch at 390: tap a box, type, tap Check: the mark is kept and Check runs', touch1.fb.length > 0 && touch1.ann === '{"1":[11]}', touch1);
  // Guided zero chain with real input: 6,003 − 2,847 (Practice Together problem 7). History must keep 10 then 9.
  await b.viewport(1366, 900, false);
  await b.load(URL + '#menu'); await js(`localStorage.setItem('${KEY}:guided', JSON.stringify({ v: 1, pos: 6, seed: 0, states: {}, done: {} }))`);
  await b.load(URL + '#practice/together'); await b.reload(); await wait(300);
  await click('#sr-tg [data-act="needs"][data-v="no"]');
  check('A wrong guided choice keeps focus on the pressed button', (await focused()) === 'needs');
  await click('#sr-tg [data-act="needs"][data-v="yes"]'); await click('#sr-tg [data-act="supplier"][data-v="3"]');
  await click('#sr-tg [data-k="r3"]'); await type('5'); await click('#sr-tg [data-k="r2"]'); await type('10'); await click('#sr-tg [data-act="check-ex"]');
  await click('#sr-tg [data-k="r2"]'); await type('9'); await click('#sr-tg [data-k="r1"]'); await type('10'); await click('#sr-tg [data-act="check-ex"]');
  const z = await js(`const s = JSON.parse(localStorage.getItem('${KEY}:guided')).states['6']; return { ann: JSON.stringify(s.ann), stage: s.guided.stage, hist: (document.querySelector('#sr-tg [data-hist="2"]') || {}).textContent }`);
  check('Guided zero chain with real clicks: a filled "10" box can be retyped as 9; history keeps 10 then 9 (struck 10 shown)', /"2":\[10,9\]/.test(z.ann) && z.stage === 'exchange' && z.hist === '10', z);
  await click('#sr-tg [data-k="r1"]'); await type('99'); await click('#sr-tg [data-act="check-ex"]');
  const z2 = await js(`const s = JSON.parse(localStorage.getItem('${KEY}:guided')).states['6']; return { ann: JSON.stringify(s.ann) }`);
  check('A wrong exchange keeps every earlier correct value (nothing earlier is removed)', /"2":\[10,9\]/.test(z2.ann) && /"1":\[10\]/.test(z2.ann), z2);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} finally {
  b.close();
  server.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed (Subtract with Regrouping).`);
process.exit(failed ? 1 : 0);
