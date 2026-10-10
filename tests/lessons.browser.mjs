// End-to-end journey for every catalog lesson built on the data-driven template (2-3 onward).
// Usage: node tests/lessons.browser.mjs            (all built lessons)
//        node tests/lessons.browser.mjs 2-3 2-4    (only these)
// Each lesson: menu → Parent Guide → every Learn step (Example parts, a wrong answer, a right answer) → Practice Together →
// On My Own → Test (nothing revealed; all right = 100%; all wrong = mistakes listed) → results persist → storage isolated →
// Reset Lesson Progress (Cancel, then Reset) → layout at 320/390/768/1024/1366/1920 (no sideways scroll, 48px targets).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

// The catalog is a browser script; read it in Node by evaluating it against a fake window.
const win = {};
new Function('window', fs.readFileSync(path.join(ROOT, 'assets/js/catalog.js'), 'utf8'))(win);
const wanted = process.argv.slice(2);
const LESSONS = win.Mathbook.catalog.lessons.filter((l) => !['2-1', '2-2'].includes(l.id))
  .filter((l) => fs.existsSync(path.join(ROOT, l.path, 'lesson.js')))
  .filter((l) => !wanted.length || wanted.includes(l.id));

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const { js, wait } = b;

const H = `${FILL_HELPERS}
  const LL = window.Mathbook.lessons[Object.keys(window.Mathbook.lessons)[0]];
  const W = () => JSON.parse(localStorage.getItem(LL.storageKey + ':see-wizard') || 'null');
  const wbtn = (a) => document.querySelector('[data-wiz="' + a + '"]');
  const qel = () => document.querySelector('.wiz-check .q[data-qkey]');
  const curQ = () => W().checks[LL.seeIt.steps[W().step].id].q;
  const fb = () => (document.querySelector('.wiz-check [aria-live] .feedback:not([hidden])') || {}).innerText || '';
  const phase = () => document.querySelector('.wiz-card').dataset.phase;
  const qIndex = () => { const m = ((document.querySelector('.q-count') || {}).textContent || '').match(/Question (\\d+) of/); return m ? Number(m[1]) - 1 : -1; };`;

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { if (e.closest('.table-wrap, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: d.scrollWidth, cw: d.clientWidth, wide };`);
  check(`layout ${label}: no sideways scroll`, r.sw <= r.cw && !r.wide.length, r);
}

try {
  for (const entry of LESSONS) {
    const URL = O + BASE + entry.path;
    const KEY = entry.key;
    await b.viewport(1366, 768, false);
    await b.load(O + BASE);
    // Other saved data that must survive this lesson's reset.
    await js(`localStorage.setItem('mathbook:v2:lesson-2-1:attempts', '[{"id":1,"pct":90}]'); localStorage.setItem('unrelated-site-data', 'keep');
      Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).forEach((k) => localStorage.removeItem(k));`);
    await b.load(URL + '#menu'); await b.reload(); await wait(200);
    const menu = await js(`return { h1: document.querySelector('h1').textContent, cards: Array.from(document.querySelectorAll('.choice-card .choice-title')).map((e) => e.textContent).join(), parent: !!document.querySelector('.parent-link a[href="#teach"]') }`);
    check(`${entry.id} menu: "${entry.title}" with Learn, Practice, Take a Test, My Results and Parent Guide`, menu.h1 === entry.title && menu.cards === 'Learn,Practice,Take a Test,My Results' && menu.parent, menu);

    await b.load(URL + '#teach'); await wait(150);
    const parent = await js(`return { h1: document.querySelector('h1').textContent, sections: document.querySelectorAll('main .card-parent').length, reset: !!document.querySelector('#reset #clear') }`);
    check(`${entry.id} Parent Guide renders with Reset Lesson Progress`, parent.h1 === 'Parent Guide' && parent.sections >= 4 && parent.reset, parent);

    // ----- Learn: every step -----
    await b.load(URL + '#see'); await b.reload(); await wait(200);
    const learn = [];
    for (let k = 0; k < entry.steps; k++) {
      const s = await js(`${H}
        const o = { count: document.querySelector('.wiz-count').textContent, phase: phase() };
        let parts = 1; for (let i = 0; i < 12; i++) { const n = document.querySelector('#slide-next'); if (!n || n.disabled) break; n.click(); parts++; }
        o.parts = parts; o.slideText = (document.querySelector('#slide-body') || {}).innerText || '';
        wbtn('try').click(); o.tryPhase = phase();
        const q = curQ(); o.type = q.type;
        if (q.type === 'rline') { fill(qel(), q, true); }
        else {
          fill(qel(), q, false); wbtn('check').click(); o.wrong = fb(); o.doneAfterWrong = !!W().done[LL.seeIt.steps[W().step].id];
          wbtn('again') && wbtn('again').click(); fill(qel(), q, true); wbtn('check').click(); o.right = fb();
        }
        o.done = !!W().done[LL.seeIt.steps[W().step].id];
        o.unlocked = !!(wbtn('next') && !wbtn('next').disabled) || !!(wbtn('finish') && !wbtn('finish').classList.contains('is-disabled'));
        return o;`);
      learn.push(s);
      check(`${entry.id} Learn step ${k + 1}: Example (${s.parts} parts) → Your Turn (${s.type}); wrong stays locked; right completes and unlocks`,
        s.count === `Step ${k + 1} of ${entry.steps}` && s.phase === 'example' && s.tryPhase === 'try' && s.done && s.unlocked &&
        (s.type === 'rline' || (/Not quite/.test(s.wrong) && !s.doneAfterWrong && /Correct|You got it/.test(s.right))), s);
      if (k < entry.steps - 1) await js(`document.querySelector('[data-wiz="next"]').click();`);
    }
    await b.navigate(`document.querySelector('[data-wiz="finish"]').click();`);
    check(`${entry.id} Learn finishes on the completion screen`, await js(`return document.querySelector('h1').textContent === 'You finished learning!'`));
    await b.reload(); await b.load(URL + '#see'); await b.reload(); await wait(200);
    check(`${entry.id} Learn progress survives a refresh`, await js(`${H} return Object.keys(W().done).length === LL.seeIt.steps.length`));

    // ----- Practice Together: every item right -----
    await b.load(URL + '#practice/together'); await b.reload(); await wait(200);
    const pt = await js(`${H}
      const box = document.querySelector('#guided-runner'); const items = LL.guided; const out = { n: items.length, bad: [] };
      for (let i = 0; i < items.length; i++) {
        const q = items[i]; const el = box.querySelector('.q[data-qkey]');
        if (q.type === 'explain') { box.querySelector('[data-act=explained]').click(); }
        else if (q.type === 'rline') { fill(el, q, true); }
        else { fill(el, q, true); box.querySelector('[data-act=check]').click(); const t = box.querySelector('.result-box').innerText; if (!/Correct/.test(t)) out.bad.push(q.id + ': ' + t.slice(0, 80)); }
        if (i < items.length - 1) box.querySelector('[data-act=next]').click();
      }
      out.count = box.querySelector('.q-count').textContent; return out;`);
    check(`${entry.id} Practice Together: all ${pt.n} items accept their correct answers`, pt.bad.length === 0 && pt.count === `Question ${pt.n} of ${pt.n}`, pt);

    // ----- On My Own: every set all right -----
    if (await js(`return !!window.Mathbook.lessons[Object.keys(window.Mathbook.lessons)[0]].bankSets`)) {
      const sets = await js(`return window.Mathbook.lessons[Object.keys(window.Mathbook.lessons)[0]].bankSets.map((s) => s.id)`);
      for (const sid of sets) {
        await b.load(URL + '#practice/' + sid); await b.reload(); await wait(200);
        const own = await js(`${H}
          const one = () => document.querySelector('#indep .one-q .q[data-qkey]');
          const n0 = (document.querySelector('.q-count') || {}).textContent;
          for (let g = 0; g < 60 && one(); g++) { const id = one().dataset.qkey.replace('p-', ''); fill(one(), LL.bank.find((x) => x.id === id), true);
            const nx = document.querySelector('[data-q="next"]'); if (nx) nx.click(); else document.querySelector('#check-set').click(); }
          return { n0, score: (document.querySelector('.set-score') || {}).innerText || '' };`);
        const m = own.score.match(/(\d+) of (\d+) correct/);
        check(`${entry.id} On My Own ${sid}: one question at a time, all correct → full score`, /Question 1 of/.test(own.n0) && m && m[1] === m[2], own);
      }
    }

    // ----- Test: nothing revealed; all right → 100%; all wrong → mistakes listed -----
    for (const [tid] of entry.tests) {
      for (const k of ['all', 'none']) {
        await b.load(URL + '#test'); await b.reload(); await wait(200);
        await js(`document.querySelector('[data-start="${tid}"]').click();`); await wait(200);
        const r = await js(`${H}
          const leaks = document.querySelectorAll('main .feedback:not([hidden]), main [data-act=hint], main [data-act=check], main [data-rl-act=check], main .hint-box:not([hidden]), main .nline-dot, main .is-answer').length;
          const qs = JSON.parse(localStorage.getItem(LL.storageKey + ':draft-${tid}')).questions;
          const testQ = () => document.querySelector('.test-one .q[data-qkey]');
          let seen = 0;
          for (let g = 0; g < 60 && testQ(); g++) { const i = qIndex(); fill(testQ(), qs[i], ${k === 'all'}); seen++;
            if (document.querySelectorAll('.test-one .feedback:not([hidden])').length) return { leakAfterAnswer: true };
            document.querySelector('[data-nav="next"]').click(); }
          document.querySelector('[data-finish]').click(); await new Promise((res) => setTimeout(res, 300));
          const a = JSON.parse(localStorage.getItem(LL.storageKey + ':attempts') || '[]'); const last = a[a.length - 1] || {};
          return { leaks, seen, n: qs.length, pct: last.pct, score: last.score, hash: location.hash, text: (document.querySelector('.result-detail') || {}).innerText || '' };`);
        if (k === 'all') check(`${entry.id} ${tid}: no hints, checks, or answers shown; all right → 100%`, r.leaks === 0 && !r.leakAfterAnswer && r.seen === r.n && r.pct === 100 && r.hash === '#results', r);
        else check(`${entry.id} ${tid}: all wrong → 0% with every mistake listed for review`, r.score === 0 && new RegExp(`Mistakes to review \\(${r.n}\\)`).test(r.text) && /Skills to review/.test(r.text), { score: r.score, text: r.text.slice(0, 200) });
      }
    }
    await b.reload(); await wait(200);
    check(`${entry.id} results persist after refresh`, await js(`location.hash = '#results'; await new Promise((r) => setTimeout(r, 200)); return document.querySelectorAll('.history tbody tr').length >= 2`));

    // ----- Storage isolation and reset -----
    const keys = await js(`return Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-'))`);
    check(`${entry.id} saves only under its own prefix`, keys.filter((k) => !k.startsWith('mathbook:v2:lesson-2-1:')).every((k) => k.startsWith(KEY)), keys);
    await b.load(URL + '#teach'); await b.reload(); await wait(200);
    const reset = await js(`document.querySelector('#clear').click(); document.querySelector('#clear-no').click();
      const kept = Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length;
      document.querySelector('#clear').click(); document.querySelector('#clear-yes').click(); await new Promise((r) => setTimeout(r, 300));
      return { kept, left: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length, hash: location.hash, other: localStorage.getItem('unrelated-site-data') === 'keep' && !!localStorage.getItem('mathbook:v2:lesson-2-1:attempts') };`);
    check(`${entry.id} Reset Lesson Progress: Cancel keeps; Reset clears only this lesson and returns to the menu`, reset.kept > 0 && reset.left === 0 && reset.hash === '#menu' && reset.other, reset);

    // ----- Layout -----
    for (const [name, w, h] of [['small-phone', 320, 568], ['phone', 390, 844], ['tablet-portrait', 768, 1024], ['tablet-landscape', 1024, 768], ['desktop', 1366, 768], ['large', 1920, 1080]]) {
      await b.viewport(w, h);
      for (const screen of ['menu', 'teach', 'practice', 'practice/together', 'test']) {
        await b.load(URL + '#' + screen); await b.reload(); await wait(120);
        await noOverflow(`${entry.id} ${screen} @ ${name}`);
      }
      // Every Learn step, Example and Your Turn.
      for (let k = 0; k < entry.steps; k++) {
        for (const ph of ['example', 'try']) {
          await js(`const L = Mathbook.lessons[Object.keys(Mathbook.lessons)[0]]; const st = L.seeIt.steps; const done = {}; st.slice(0, ${k}).forEach((x) => { done[x.id] = true; });
            const w = JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard') || '{"checks":{}}'); Object.assign(w, { step: ${k}, done, phase: { [st[${k}].id]: '${ph}' } });
            localStorage.setItem(L.storageKey + ':see-wizard', JSON.stringify(w));`);
          await b.load(URL + '#see'); await b.reload(); await wait(120);
          await noOverflow(`${entry.id} Learn step ${k + 1} ${ph} @ ${name}`);
        }
      }
      if (name === 'phone') {
        const short = await js(`return Array.from(document.querySelectorAll('main .btn, main .choice, main .part-input, main .q-input')).filter((e) => e.offsetParent && e.getBoundingClientRect().height < 47.5).map((e) => (e.innerText || e.className).slice(0, 30))`);
        check(`${entry.id} phone: buttons and answer boxes are at least 48px tall`, short.length === 0, short);
      }
    }
    await js(`Object.keys(localStorage).filter((k) => k.startsWith('${KEY}') || k === 'unrelated-site-data').forEach((k) => localStorage.removeItem(k));`);
  }
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors.slice(0, 5));
} catch (e) {
  check('lessons browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 500), pageErrors: b.errors.slice(0, 3) });
} finally {
  b.close();
  server.close();
}
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (lessons: ${LESSONS.map((l) => l.id).join(', ') || 'none built yet'}).`);
process.exit(failed.length ? 1 : 0);
