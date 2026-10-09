// End-to-end browser test for Lesson 2-2 (Round Multi-Digit Numbers). Same harness as the other browser tests.
// Run: node tests/lesson-2-2.browser.mjs   (part of npm run test:browser)
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const LESSON = BASE + 'curriculum/chapter-2/lesson-2-2/';
const KEY = 'mathbook:v2:lesson-2-2';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 600) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const { js, wait, hash } = b;

const WIZ = `${FILL_HELPERS}
  const W = () => JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard') || 'null');
  const wbtn = (a) => document.querySelector('[data-wiz="' + a + '"]');
  const qel = () => document.querySelector('.wiz-check .q[data-qkey]');
  const curQ = () => W().checks[L.seeIt.steps[W().step].id].q;
  const fb = () => (document.querySelector('.wiz-check [aria-live] .feedback:not([hidden])') || {}).innerText || '';
  const phase = () => document.querySelector('.wiz-card').dataset.phase;`;
const PAGED = `${FILL_HELPERS}
  const qIndex = () => { const m = (document.querySelector('.q-count') || {}).textContent.match(/Question (\\d+) of/); return m ? Number(m[1]) - 1 : -1; };
  const testQ = () => document.querySelector('.test-one .q[data-qkey]');
  const answerTest = (k) => {
    const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-rounding')).questions;
    for (let g = 0; g < 30 && testQ(); g++) { const i = qIndex(); fill(testQ(), qs[i], i < k); document.querySelector('[data-nav="next"]').click(); }
    document.querySelector('[data-finish]').click();
  };`;

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const labels = Array.from(document.querySelectorAll('.nline-label, .nline-point')).filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect());
    let hits = 0; for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i], c = labels[j]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) hits++; }
    const outside = Array.from(document.querySelectorAll('.nline-label, .nline-point')).filter((e) => { const r = e.getBoundingClientRect(); const c = (e.closest('.card') || document.body).getBoundingClientRect(); return e.offsetParent && (r.left < c.left || r.right > c.right); }).length;
    const small = Array.from(document.querySelectorAll('.nline-label, .nline-point, .part-label')).filter((e) => e.offsetParent && parseFloat(getComputedStyle(e).fontSize) < 15).length;
    const short = Array.from(document.querySelectorAll('main .btn, main .part-input, main .choice')).filter((e) => e.offsetParent && e.getBoundingClientRect().height < 47.5).length;
    return { sw: d.scrollWidth, cw: d.clientWidth, hits, outside, small, short };`);
  check(`layout ${label}: no sideways scroll, number-line labels readable and not colliding, 48px targets`, r.sw <= r.cw && r.hits === 0 && r.outside === 0 && r.small === 0 && r.short === 0, r);
}

try {
  await b.viewport(1366, 768, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');
  // A saved 2-1 result, to prove 2-2 never touches it.
  await js(`localStorage.setItem('mathbook:v2:lesson-2-1:attempts', JSON.stringify([{ id: 1, testId: 'math', title: 'Math Test', score: 9, total: 10, pct: 90, questions: [], responses: {}, correct: [], date: '2026-10-01T00:00:00Z' }]));
    localStorage.setItem('mathbook:v2:lesson-2-1:see-wizard', JSON.stringify({ step: 2, done: { examples: true, build: true }, checks: {}, ex: 0, sub: 0 }));`);
  const before21 = await js(`return Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).sort().map((k) => k + '=' + localStorage.getItem(k)).join('|')`);

  // ----- Entry -----
  await b.load(O + BASE + 'math/');
  const math = await js(`return Array.from(document.querySelectorAll('.choice-card')).map((a) => a.querySelector('.choice-title').textContent + ' ' + a.getAttribute('href'))`);
  check('Math Lessons lists 2-1 and a working 2-2 entry', JSON.stringify(math) === JSON.stringify(['Represent 4-Digit Numbers ../curriculum/chapter-2/lesson-2-1/#menu', 'Round Multi-Digit Numbers ../curriculum/chapter-2/lesson-2-2/#menu']), math);
  await b.navigate(`document.querySelectorAll('.choice-card')[1].click();`);
  const menu = await js(`return { h1: document.querySelector('h1').textContent, eyebrow: document.querySelector('.hero .eyebrow').textContent, cards: Array.from(document.querySelectorAll('.choice-card .choice-title')).map((e) => e.textContent), rec: !!document.querySelector('.choice-card.is-recommended[href="#see"]'), parent: !!document.querySelector('.parent-link a[href="#teach"]'), title: document.title }`);
  check('Lesson 2-2 menu: same four choices, Learn recommended, Parent Guide link', menu.h1 === 'Round Multi-Digit Numbers' && menu.eyebrow === 'Lesson 2-2' && menu.cards.join() === 'Learn,Practice,Take a Test,My Results' && menu.rec && menu.parent, menu);

  // ----- Parent Learn -----
  await hash('#teach');
  const parent = await js(`return { h1: document.querySelector('h1').textContent, words: Array.from(document.querySelectorAll('.pl-words dt')).map((e) => e.textContent), lines: document.querySelectorAll('#demo .nline').length,
    checklist: document.querySelectorAll('#check ol.checks li').length, ask: /Which two tens\\/hundreds|Which two tens \\(or hundreds\\)/.test(document.body.innerText) && /What is halfway/.test(document.body.innerText) && /Which end is it closer to/.test(document.body.innerText),
    mistakes: document.querySelectorAll('#check .callout-warn li').length, text: document.querySelector('main').innerText }`);
  check('Parent Learn: goal, six math words, 127 demonstration (two number lines), teaching questions, mistakes, five-step checklist', parent.h1 === 'Parent Guide' &&
    parent.words.join('|') === 'Round|Nearest|Multiple of 10 / 100|Halfway point|Estimate|Exact' && parent.lines === 2 && parent.checklist === 5 && parent.ask && parent.mistakes >= 4 &&
    /127 rounds to 130/.test(parent.text) && /rounds to 100/.test(parent.text), parent);

  // ----- Learn: all five steps, both phases -----
  await hash('#see');
  const steps = [];
  for (let k = 0; k < 5; k++) {
    const r = await js(`${WIZ}
      const s = { count: document.querySelector('.wiz-count').textContent, phase: phase(), title: document.querySelector('.wiz-step-title').textContent };
      // Example: page through every part.
      const parts = []; for (let i = 0; i < 6; i++) { parts.push(document.querySelector('#slide-body').innerText); const n = document.querySelector('#slide-next'); if (!n || n.disabled) break; n.click(); }
      s.parts = parts.length; s.lines = document.querySelectorAll('#slide-body .nline').length; s.slideText = parts.join(' / ');
      s.slideCount = document.querySelector('#slide-count')?.textContent;
      wbtn('try').click();
      s.tryPhase = phase(); s.focus = document.activeElement === document.querySelector('.wiz-h');
      const q = curQ(); s.type = q.type; s.kinds = (q.parts || []).map((p) => p.kind).join(',');
      s.blankLine = q.line ? (() => { const t = document.querySelector('.wiz-check .nline-blank').innerText; return !/\\d/.test(t); })() : null;
      fill(qel(), q, false); wbtn('check').click(); s.wrong = fb(); s.done0 = !!W().done[L.seeIt.steps[W().step].id];
      wbtn('example').click(); s.backTo = phase() + ' ' + document.querySelector('#slide-count')?.textContent;
      wbtn('try').click(); s.retryKept = /Not quite/.test(fb()) && !!wbtn('again');
      wbtn('again').click(); fill(qel(), q, true); wbtn('check').click(); s.right = fb();
      s.unlocked = !!(wbtn('next') && !wbtn('next').disabled) || !!(wbtn('finish') && !wbtn('finish').classList.contains('is-disabled'));
      return s;`);
    steps.push(r);
    check(`Learn step ${k + 1} (${r.title}): Example parts one at a time → Your Turn (${r.kinds || r.type}); wrong → coaching; retry kept across phases; right → unlocks`,
      r.count === `Step ${k + 1} of 5` && r.phase === 'example' && r.parts >= 2 && r.tryPhase === 'try' && r.focus && /Not quite/.test(r.wrong) && !r.done0 &&
      r.backTo === `example Part ${r.parts} of ${r.parts}` && r.retryKept && /Correct|You got it/.test(r.right) && r.unlocked && r.blankLine !== false, r);
    if (k === 0) {
      await b.viewport(390, 844, true);
      await b.shot(path.join(SHOTS, 'l22-learn-step1-yourturn-phone.png'));
      await b.viewport(1366, 768, false);
      // Refresh keeps the step, the phase, and the result.
      await b.reload(); await wait(200);
      const kept = await js(`${WIZ} return { count: document.querySelector('.wiz-count').textContent, phase: phase(), fb: fb() }`);
      check('Refresh keeps Learn step 1, Your Turn, and the checked result', kept.count === 'Step 1 of 5' && kept.phase === 'try' && /You got it|Correct/.test(kept.fb), kept);
    }
    if (k < 4) await js(`document.querySelector('[data-wiz="next"]').click();`);
  }
  check('Step 1 and 2 checks assess the method: lower, halfway, upper, and the rounded number; the Your Turn line shows no numbers', steps[0].kinds === 'num,num,num,num' && steps[1].kinds === 'num,num,num,num' && steps[0].blankLine && steps[1].blankLine, steps.slice(0, 2));
  check('Step 3 checks both places; step 4: place + original number + halfway rule; step 5: select all + conclusion', steps[2].kinds === 'num,num' && steps[3].kinds === 'num,round,choice' && steps[4].kinds === 'multi,choice', steps.map((s) => s.kinds));
  check('Learn worked examples: 127 → 130 and → 100 on number lines; 896 → 900; 255; 235–244; 315; $49 exact with $1 left',
    /127 rounds to 130/.test(steps[0].slideText) && /127 rounds to 100/.test(steps[1].slideText) && /896 rounds to 900/.test(steps[2].slideText) &&
    /255 to the nearest ten is 260/.test(steps[3].slideText) && /235 through 244/.test(steps[3].slideText) && /315/.test(steps[3].slideText) && /\$49/.test(steps[4].slideText) && steps[0].lines === 1, steps.map((s) => s.slideText));
  await b.navigate(`document.querySelector('[data-wiz="finish"]').click();`);
  const done = await js(`return { h1: document.querySelector('h1').textContent, reflect: document.querySelector('.reflect')?.innerText || '', start: !!document.querySelector('.done-card a[href="#practice"]') }`);
  check('Finishing Learn shows the completion screen with the tens-vs-hundreds reflection (not graded)', done.h1 === 'You finished learning!' && /nearest ten more useful than rounding to the nearest hundred/.test(done.reflect) && done.start, done);

  // ----- Practice -----
  await hash('#practice');
  const choices = await js(`return Array.from(document.querySelectorAll('.choice-card .choice-title')).map((e) => e.textContent)`);
  check('Practice choices: Practice Together and On My Own (no Math Words activity in this lesson)', choices.join() === 'Practice Together,On My Own', choices);
  await hash('#practice/together');
  const g = await js(`${FILL_HELPERS}
    const box = document.querySelector('#guided-runner'); const el = () => box.querySelector('.q[data-qkey]');
    const q = L.guided[0];
    const r = { count: box.querySelector('.q-count').textContent, help: !!document.querySelector('details.parent-help'), blank: !/\\d/.test(box.querySelector('.nline-blank')?.innerText || '1') };
    fill(el(), q, false); box.querySelector('[data-act=check]').click(); r.wrong = box.querySelector('.result-box').innerText;
    fill(el(), q, true); box.querySelector('[data-act=check]').click(); r.right = box.querySelector('.result-box').innerText;
    return r;`);
  check('Practice Together: "Question 1 of 12"; coaching after a wrong try names the parts to fix; correct answer explained; Parent Help folded', g.count === 'Question 1 of 12' && /Not yet/.test(g.wrong) && /Look again at: Lower ten/.test(g.wrong) && /Correct/.test(g.right) && /364 is between 360 and 370/.test(g.right) && g.help && g.blank, g);
  await b.load(O + LESSON + '#practice/own'); await wait(200);
  await b.navigate(`document.querySelector('[data-open-set="s1"]').click();`);
  const own = await js(`${FILL_HELPERS}
    const B = () => JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets'));
    const one = () => document.querySelector('#indep .one-q .q[data-qkey]');
    const r = { count: document.querySelector('.q-count').textContent };
    for (let g = 0; g < 20 && one(); g++) { const id = one().dataset.qkey.replace('p-', ''); const q = L.bank.find((x) => x.id === id); const i = Number(document.querySelector('.q-count').textContent.match(/\\d+/)[0]) - 1;
      fill(one(), q, !['p8', 'p11'].includes(id)); const n = document.querySelector('[data-q="next"]'); if (n) n.click(); else document.querySelector('#check-set').click(); }
    r.score = document.querySelector('.set-score').innerText; r.misses = document.querySelector('#practice-misses')?.innerText;
    r.explained = Array.from(document.querySelectorAll('#indep .feedback-no')).map((f) => f.innerText);
    return r;`);
  check('On My Own: the 12 practice questions one at a time; 10 of 12 with the 2 misses explained; Practice My Misses (2)', own.count === 'Question 1 of 12' && /10 of 12 correct/.test(own.score) && own.misses === 'Practice My Misses (2)' &&
    own.explained.some((t) => /any whole number from 375 to 384/.test(t)) && own.explained.some((t) => /251 crayons, 300 crayons, 342 crayons/.test(t)), own);

  // ----- Test -----
  await hash('#test');
  const chooser = await js(`return { titles: Array.from(document.querySelectorAll('.test-card h2')).map((h) => h.textContent), meta: document.querySelector('.test-meta').textContent }`);
  check('Take a Test: the Rounding Test (12 questions)', chooser.titles.join() === 'Rounding Test' && /12 questions/.test(chooser.meta), chooser);
  await js(`document.querySelector('[data-start="rounding"]').click();`); await wait(200);
  const t1 = await js(`const q = document.querySelector('.test-one'); return { count: document.querySelector('.q-count').textContent, line: q.querySelector('.nline-blank')?.innerText || '', inputs: Array.from(q.querySelectorAll('.part-input')).map((i) => i.value),
    hints: document.querySelectorAll('main [data-act=hint], main .hint-box, main .nline-go, main .nline-dot, main .is-answer').length, text: q.innerText }`);
  check('Test question 1: blank number line — no endpoints, halfway, or direction shown; fields empty; no hints', t1.count === 'Question 1 of 12' && !/\d/.test(t1.line) && t1.inputs.every((v) => v === '') && t1.hints === 0 && !/580|585|590/.test(t1.text), t1);
  await b.viewport(390, 844, true); await b.shot(path.join(SHOTS, 'l22-test-q1-phone.png')); await b.viewport(1366, 768, false);
  const perfect = await js(`${PAGED} answerTest(12); await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts')); return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail').innerText };`);
  check('Rounding Test: all correct → 12/12 = 100% Mastered', perfect.hash === '#results' && perfect.last.score === 12 && perfect.last.pct === 100 && /Mastered/.test(perfect.text), { score: perfect.last.score });
  await hash('#test'); await js(`document.querySelector('[data-start="rounding"]').click();`); await wait(200);
  const nine = await js(`${PAGED} answerTest(9); await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts')); return { last: a[a.length - 1], text: document.querySelector('.result-detail').innerText };`);
  check('Rounding Test: 9 of 12 → 75% Review missed skills; missed skills named; mistakes explained with each part marked', nine.last.score === 9 && nine.last.pct === 75 && /Review missed skills/.test(nine.text) &&
    /Finding|Halfway numbers round up|Choosing all numbers|Estimate vs\. exact total|Explaining a nearest-100 result/.test(nine.text) && /Mistakes to review \(3\)/.test(nine.text) && /✗/.test(nine.text), nine.text.slice(0, 500));
  await b.navigate(`document.querySelector('[data-practice]').click();`);
  check('"Practice this skill" opens the 2-2 practice set', await js(`return location.hash === '#practice/s1' && /Question 1 of 12/.test(document.querySelector('.q-count').textContent)`));
  await b.reload();
  check('Results persist after refresh (2 attempts)', await js(`location.hash = '#results'; await new Promise((r) => setTimeout(r, 250)); return document.querySelectorAll('.history tbody tr').length === 2`));

  // ----- Separate storage -----
  const keys = await js(`return Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-')).sort()`);
  const after21 = await js(`return Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).sort().map((k) => k + '=' + localStorage.getItem(k)).join('|')`);
  check('2-2 progress and results are stored only under its own key; 2-1 data is untouched', keys.filter((k) => !k.startsWith('mathbook:v2:lesson-2-1')).every((k) => k.startsWith(KEY + ':')) && keys.some((k) => k === KEY + ':attempts') && after21 === before21, { keys });
  await hash('#test'); await js(`document.querySelector('[data-start="rounding"]').click();`); await wait(200);
  await js(`${PAGED} const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-rounding')).questions; fill(testQ(), qs[0], true); document.querySelector('[data-nav="next"]').click();`);
  await b.load(O + BASE);
  const cont = await js(`return { href: document.querySelector('#continue-link').getAttribute('href'), what: document.querySelector('#continue-what').textContent, shown: !document.getElementById('continue').hidden }`);
  check('Home: Continue points to the unfinished 2-2 test', cont.shown && /lesson-2-2\/#test\/rounding$/.test(cont.href) && /Lesson 2-2 · Rounding Test: 1 of 12 answered/.test(cont.what), cont);
  await b.load(O + LESSON + '#results');
  const cleared = await js(`document.querySelector('#privacy').open = true; document.querySelector('#clear').click(); document.querySelector('#clear-yes').click();
    return { left22: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length, same21: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).sort().map((k) => k + '=' + localStorage.getItem(k)).join('|') === ${JSON.stringify(before21)} }`);
  check('Clearing 2-2 progress removes only 2-2', cleared.left22 === 0 && cleared.same21, cleared);

  // ----- Layout: number lines and answer fields on phone, tablet, desktop -----
  const setLearn = (k, phase, slide) => js(`const L = Mathbook.lessons['2-2']; const st = L.seeIt.steps; const done = {}; st.slice(0, ${k}).forEach((x) => { done[x.id] = true; });
    const w = JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard') || '{"checks":{}}'); Object.assign(w, { step: ${k}, done, phase: { [st[${k}].id]: '${phase}' }, slide: { [st[${k}].id]: ${slide} } });
    localStorage.setItem(L.storageKey + ':see-wizard', JSON.stringify(w));`);
  for (const [name, w, h] of [['phone', 390, 844], ['small-phone', 320, 568], ['tablet-portrait', 768, 1024], ['tablet-landscape', 1024, 768], ['desktop', 1366, 768]]) {
    await b.viewport(w, h);
    for (const [k, ph, slide, label] of [[0, 'example', 2, 'step1-example'], [0, 'try', 0, 'step1-yourturn'], [1, 'example', 2, 'step2-example'], [3, 'example', 0, 'step4-two-lines'], [3, 'example', 1, 'step4-range'], [4, 'try', 0, 'step5-yourturn']]) {
      await b.load(O + LESSON + '#see'); await setLearn(k, ph, slide); await b.reload(); await wait(150);
      await noOverflow(`${label} @ ${name} ${w}×${h}`);
      if (['phone', 'tablet-portrait', 'desktop'].includes(name) && ['step1-example', 'step1-yourturn', 'step4-two-lines'].includes(label)) await b.shot(path.join(SHOTS, `l22-${label}-${name}.png`), name !== 'desktop');
    }
    for (const screen of ['menu', 'teach', 'practice/together', 'test']) { await b.load(O + LESSON + '#' + screen); await b.reload(); await wait(150); await noOverflow(`${screen} @ ${name}`); }
  }
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('Lesson 2-2 browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 400), pageErrors: b.errors.slice(0, 3) });
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (Lesson 2-2).`);
process.exit(failed.length ? 1 : 0);
