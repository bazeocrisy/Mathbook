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
  check('Math Lessons lists 2-1 and a working 2-2 entry', JSON.stringify(math.slice(0, 2)) === JSON.stringify(['Represent 4-Digit Numbers ../curriculum/chapter-2/lesson-2-1/#menu', 'Round Multi-Digit Numbers ../curriculum/chapter-2/lesson-2-2/#menu']), math);
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

  // ----- Learn: all five steps, both phases. Steps 1–2 are staged number lines. -----
  const RL = `${WIZ}
    const rl = () => document.querySelector('.rl');
    const R = () => JSON.parse(rl().dataset.rl);
    const part = () => rl().querySelector('.rl-part').textContent;
    const task = () => rl().querySelector('.rl-task').innerText;
    const act = (a) => rl().querySelector('[data-rl-act="' + a + '"]');
    const type = (f, v) => { const i = rl().querySelector('[data-f="' + f + '"]'); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
    const rfb = () => (rl().querySelector('.rl-feedback .feedback:not([hidden])') || {}).innerText || '';
    const labels = () => Array.from(rl().querySelectorAll('.rl-label')).map((e) => e.textContent);
    const inputs = () => Array.from(rl().querySelectorAll('.rl-input')).map((e) => e.dataset.f);`;
  await hash('#see');
  const steps = [];
  for (let k = 0; k < 5; k++) {
    const r = await js(`${WIZ}
      const s = { count: document.querySelector('.wiz-count').textContent, phase: phase(), title: document.querySelector('.wiz-step-title').textContent };
      const parts = []; for (let i = 0; i < 6; i++) { parts.push(document.querySelector('#slide-body').innerText); const n = document.querySelector('#slide-next'); if (!n || n.disabled) break; n.click(); }
      s.parts = parts.length; s.lines = document.querySelectorAll('#slide-body .nline').length; s.slideText = parts.join(' / ');
      // Example Start Over: Cancel keeps the part; Start Over returns to part 1.
      document.querySelector('[data-over="ask"]').click(); s.overAsk = document.querySelector('#slide-over').innerText;
      document.querySelector('[data-over="no"]').click(); s.afterCancel = document.querySelector('#slide-count')?.textContent;
      document.querySelector('[data-over="ask"]').click(); document.querySelector('[data-over="yes"]').click(); s.afterOver = document.querySelector('#slide-count')?.textContent;
      wbtn('try').click();
      s.tryPhase = phase(); s.focus = document.activeElement === document.querySelector('.wiz-h');
      const q = curQ(); s.type = q.type; s.kinds = (q.parts || []).map((p) => p.kind).join(',');
      return s;`);
    if (r.type === 'rline') {
      const t = await js(`${RL}
        const q = curQ(); const e = Q.correctResponse(q); const I = { lo: e.lo, hi: e.hi, mid: e.mid };
        const w = q.place === 10 ? 'ten' : 'hundred';
        const o = { n: q.n, start: { part: part(), task: task(), inputs: inputs().join(), dot: !!rl().querySelector('.nline-dot'), pick: !!act('pick'), box: !!document.querySelector('.wiz-check .q-display'), over: !!act('over'), check: !!act('check') } };
        // Part 1: one right, one wrong → a specific hint; the right one stays.
        type('lo', I.lo); type('hi', String(Number(I.hi.replace(/,/g, '')) + q.place)); act('check').click();
        o.miss = { fb: rfb(), part: part(), lo: rl().querySelector('[data-f="lo"]').value, cont: !!act('next') };
        type('hi', I.hi); act('check').click();
        o.fix = { fb: rfb(), part: part(), cont: !!act('next') };
        act('next').click();
        o.mid = { part: part(), task: task(), inputs: inputs().join(), labels: labels().join('|') };
        // Back keeps the answers.
        act('back').click(); o.back = { part: part(), lo: rl().querySelector('[data-f="lo"]').value, hi: rl().querySelector('[data-f="hi"]').value, cont: !!act('next') };
        act('next').click(); type('mid', I.mid); act('check').click(); o.midFb = rfb(); act('next').click();
        const track = rl().querySelector('.rl-track').getBoundingClientRect(); const dot = rl().querySelector('.nline-dot').getBoundingClientRect();
        const lo = Number(I.lo.replace(/,/g, '')), hi = Number(I.hi.replace(/,/g, ''));
        o.pick = { part: part(), task: task(), buttons: Array.from(rl().querySelectorAll('[data-rl-act="pick"]')).map((b) => b.textContent).join('|'), labels: labels().join('|'),
          dotErr: Math.abs((dot.left + dot.width / 2 - track.left) / track.width - (q.n - lo) / (hi - lo)), point: rl().querySelector('.nline-point').textContent };
        return o;`);
      await b.reload(); await wait(250);
      const t2 = await js(`${RL}
        const q = curQ(); const e = Q.correctResponse(q);
        const o = { afterRefresh: { phase: phase(), part: part(), labels: labels().join('|') } };
        const wrongSide = e.pick === 'hi' ? 'lo' : 'hi';
        rl().querySelector('[data-side="' + wrongSide + '"]').click(); act('check').click(); o.wrongPick = rfb(); o.doneYet = !!W().done[L.seeIt.steps[W().step].id];
        rl().querySelector('[data-side="' + e.pick + '"]').click(); act('check').click(); o.rightPick = rfb(); o.autoJump = part();
        act('next').click();
        o.done = { task: task(), answer: rl().querySelector('.rl-label.is-answer')?.textContent, next: !!(wbtn('next') && !wbtn('next').disabled) || !!(wbtn('finish') && !wbtn('finish').classList.contains('is-disabled')), done: !!W().done[L.seeIt.steps[W().step].id] };
        // Start Over keeps the number and the earned completion, and clears the answers.
        act('over').click(); o.ask = rl().querySelector('.rl-confirm').innerText; rl().querySelector('[data-rl-act="over-no"]').click(); o.cancelKept = part();
        act('over').click(); rl().querySelector('[data-rl-act="over-yes"]').click();
        o.over = { part: part(), n: curQ().n === q.n, empty: inputs().join() === 'lo,hi' && Array.from(rl().querySelectorAll('.rl-input')).every((i) => i.value === ''), stillDone: !!W().done[L.seeIt.steps[W().step].id],
          next: !!(wbtn('next') && !wbtn('next').disabled) || !!(wbtn('finish') && !wbtn('finish').classList.contains('is-disabled')) };
        return o;`);
      const w = k === 0 ? 'ten' : 'hundred';
      steps.push(Object.assign(r, { staged: t, after: t2 }));
      check(`Learn step ${k + 1} Example: four parts (tens/hundreds, halfway, plot, round) with Start Over (Cancel keeps the part)`, r.parts === 4 && r.lines === 1 && /Start this problem over\?/.test(r.overAsk) && r.afterCancel === 'Part 4 of 4' && r.afterOver === 'Part 1 of 4', r);
      check(`Learn step ${k + 1} Your Turn part 1: "What two ${w}s is ${t.n} between?" — only two boxes under the ends; no dot, no other controls, no separate number box`,
        r.type === 'rline' && t.start.part === 'Part 1 of 3' && t.start.task === `What two ${w}s is ${t.n} between?` && t.start.inputs === 'lo,hi' && !t.start.dot && !t.start.pick && !t.start.box && t.start.check && t.start.over, t.start);
      check(`Learn step ${k + 1}: a wrong answer gets one specific hint and keeps the right part; a right answer waits for Continue`,
        /Not quite\. Count up one/.test(t.miss.fb) && t.miss.part === 'Part 1 of 3' && t.miss.lo !== '' && !t.miss.cont && /^Yes!/.test(t.fix.fb) && t.fix.part === 'Part 1 of 3' && t.fix.cont, t);
      check(`Learn step ${k + 1} part 2: "What number is halfway…?" — one box under the middle; the ends stay on the line; Back keeps answers`,
        t.mid.part === 'Part 2 of 3' && /^What number is halfway between/.test(t.mid.task) && t.mid.inputs === 'mid' && t.mid.labels.split('|').length === 2 && t.back.part === 'Part 1 of 3' && t.back.lo !== '' && t.back.hi !== '' && t.back.cont && /^Yes! Halfway is/.test(t.midFb), t);
      check(`Learn step ${k + 1} part 3: the number is plotted accurately and labeled; "Which ${w} is closer…?" with the two ${w}s as buttons; all three labels kept`,
        t.pick.part === 'Part 3 of 3' && [`Which ${w} is closer to ${t.n}?`, `${t.n} is exactly halfway. Which ${w} do we round to?`].includes(t.pick.task) && t.pick.dotErr < 0.02 && t.pick.point === String(t.n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') && t.pick.labels.split('|').length === 3 && t.pick.buttons.split('|').length === 2, t.pick);
      check(`Learn step ${k + 1}: refresh keeps the part and answers; wrong pick → hint, not done; right pick → explanation; Next Step unlocks`,
        t2.afterRefresh.phase === 'try' && t2.afterRefresh.part === 'Part 3 of 3' && t2.afterRefresh.labels.split('|').length === 3 && /Not quite/.test(t2.wrongPick) && !t2.doneYet &&
        /^Yes!/.test(t2.rightPick) && t2.autoJump === 'Part 3 of 3' && new RegExp(`${t.n} is (closer to .*, so it rounds to|exactly halfway\. .* are equally close)`).test(t2.done.task) && t2.done.answer && t2.done.next && t2.done.done, t2);
      check(`Learn step ${k + 1}: Start Over asks first (Cancel keeps work), then restarts the same number and keeps the earned completion`,
        /Start this problem over\?/.test(t2.ask) && t2.cancelKept === 'Done!' && t2.over.part === 'Part 1 of 3' && t2.over.n && t2.over.empty && t2.over.stillDone && t2.over.next, t2);
      if (k === 0) {
        await b.viewport(390, 844, true);
        await b.shot(path.join(SHOTS, 'l22-learn-step1-yourturn-phone.png'));
        await b.viewport(1366, 768, false);
      }
    } else {
      const t = await js(`${WIZ}
        const q = curQ(); const s = {};
        fill(qel(), q, false); wbtn('check').click(); s.wrong = fb(); s.done0 = !!W().done[L.seeIt.steps[W().step].id];
        wbtn('example').click(); s.backTo = phase() + ' ' + document.querySelector('#slide-count')?.textContent;
        wbtn('try').click(); s.retryKept = /Not quite/.test(fb()) && !!wbtn('again');
        wbtn('again').click(); fill(qel(), q, true); wbtn('check').click(); s.right = fb();
        s.unlocked = !!(wbtn('next') && !wbtn('next').disabled) || !!(wbtn('finish') && !wbtn('finish').classList.contains('is-disabled'));
        return s;`);
      steps.push(Object.assign(r, t));
      check(`Learn step ${k + 1} (${r.title}): Example parts → Your Turn (${r.kinds}); wrong → coaching; retry kept across phases; right → unlocks`,
        r.count === `Step ${k + 1} of 5` && r.phase === 'example' && r.parts >= 2 && r.afterOver === 'Part 1 of ' + r.parts && r.tryPhase === 'try' && r.focus && /Not quite/.test(t.wrong) && !t.done0 &&
        t.backTo === 'example Part 1 of ' + r.parts && t.retryKept && /Correct|You got it/.test(t.right) && t.unlocked, Object.assign({}, r, t));
    }
    if (k < 4) await js(`document.querySelector('[data-wiz="next"]').click();`);
  }
  check('Step 3 checks both places; step 4: place + original number + halfway rule; step 5: select all + conclusion', steps[2].kinds === 'num,num' && steps[3].kinds === 'num,round,choice' && steps[4].kinds === 'multi,choice', steps.map((s) => s.kinds));
  check('Learn worked examples: 127 → 130 and → 100 on number lines; 896 → 900; 255; 235–244; 315; $49 exact with $1 left',
    /127 is closer to 130, so it rounds to 130/.test(steps[0].slideText) && /127 is closer to 100, so it rounds to 100/.test(steps[1].slideText) && /896 rounds to 900/.test(steps[2].slideText) &&
    /255 to the nearest ten is 260/.test(steps[3].slideText) && /235 through 244/.test(steps[3].slideText) && /315/.test(steps[3].slideText) && /\$49/.test(steps[4].slideText), steps.map((s) => s.slideText));
  await b.navigate(`document.querySelector('[data-wiz="finish"]').click();`);
  const done = await js(`return { h1: document.querySelector('h1').textContent, reflect: document.querySelector('.reflect')?.innerText || '', start: !!document.querySelector('.done-card a[href="#practice"]') }`);
  check('Finishing Learn shows the completion screen with the tens-vs-hundreds reflection (not graded)', done.h1 === 'You finished learning!' && /nearest ten more useful than rounding to the nearest hundred/.test(done.reflect) && done.start, done);

  // Halfway: both ends are equally close; the rule is to round up. (A halfway number placed on step 1.)
  await js(`const L = Mathbook.lessons['2-2']; const w = JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard'));
    const q = Object.assign({}, w.checks['tens-line'].q, { n: 205, prompt: 'Round 205 to the nearest ten.' });
    w.step = 0; w.phase['tens-line'] = 'try'; w.checks['tens-line'] = { q, tries: 0, retry: false, solved: true, revealed: false, response: { lo: '200', hi: '210', mid: '205', pick: '', stage: 2, ok: { ends: true, mid: true }, tries: {} } };
    localStorage.setItem(L.storageKey + ':see-wizard', JSON.stringify(w));`);
  await b.load(O + LESSON + '#see'); await b.reload(); await wait(250);
  const half = await js(`${RL} const o = { task: task() };
    rl().querySelector('[data-side="lo"]').click(); act('check').click(); o.hint = rfb();
    rl().querySelector('[data-side="hi"]').click(); act('check').click(); act('next').click(); o.done = task(); return o;`);
  check('Halfway (205): asks which ten we round to (not "closer"); hint gives the round-up rule; explanation says both are equally close',
    half.task === '205 is exactly halfway. Which ten do we round to?' && /round up to the higher ten/.test(half.hint) && /200 and 210 are equally close/.test(half.done) && /rounds to 210/.test(half.done) && !/closer/.test(half.done), half);

  // ----- Practice -----
  await hash('#practice');
  const choices = await js(`return Array.from(document.querySelectorAll('.choice-card .choice-title')).map((e) => e.textContent)`);
  check('Practice choices: Practice Together and On My Own (no Math Words activity in this lesson)', choices.join() === 'Practice Together,On My Own', choices);
  await hash('#practice/together');
  const g = await js(`${RL}
    const box = document.querySelector('#guided-runner');
    const o = { count: box.querySelector('.q-count').textContent, part: part(), task: task(), extra: box.querySelectorAll('[data-act=check], [data-act=hint], [data-act=reveal]').length, help: !!document.querySelector('details.parent-help'), over: !!act('over') };
    type('lo', '350'); type('hi', '370'); act('check').click(); o.wrong = rfb();
    type('lo', '360'); act('check').click(); o.right = rfb(); act('next').click(); o.part2 = part();
    return o;`);
  check('Practice Together: number-line items run the same parts with Check Answer, one hint, Continue, and Start Over (no extra check buttons)',
    g.count === 'Question 1 of 12' && g.part === 'Part 1 of 3' && g.task === 'What two tens is 364 between?' && g.extra === 0 && /Not quite\. Which ten is just below 364/.test(g.wrong) && /^Yes! 364 is between 360 and 370/.test(g.right) && g.part2 === 'Part 2 of 3' && g.help && g.over, g);
  await b.reload(); await wait(250);
  check('Practice Together keeps the question, the part, and the answers after a refresh', await js(`${RL} return document.querySelector('.q-count').textContent === 'Question 1 of 12' && part() === 'Part 2 of 3' && labels().join() === '360,370'`));
  // Reviewer findings (regressions): an edited right answer must be checked again; misses never give the answer;
  // a finished problem shows one explanation after a refresh.
  const rev = await js(`${RL}
    const o = {};
    type('mid', '364'); act('check').click(); o.miss1 = rfb(); act('check').click(); o.miss2 = rfb();
    type('mid', '36'); o.hintWhileFixing = rfb();
    type('mid', '365'); act('check').click(); o.ok = rfb(); o.cont = !!act('next');
    type('mid', '366'); o.afterEdit = { fb: rfb(), check: !!act('check'), cont: !!act('next') };
    type('mid', '365'); act('check').click(); act('next').click();
    rl().querySelector('[data-side="lo"]').click(); act('check').click(); act('next').click(); o.done = task();
    return o;`);
  check('Editing a part already marked right clears "Yes!" and needs Check Answer again (no unchecked Continue)', /^Yes!/.test(rev.ok) && rev.cont && rev.afterEdit.fb === '' && rev.afterEdit.check && !rev.afterEdit.cont, rev);
  check('A second miss repeats the specific hint and never gives the answer; the hint stays while the child fixes the box', /Halfway is 5 more than 360/.test(rev.miss1) && rev.miss2 === rev.miss1 && !/365/.test(rev.miss2) && rev.hintWhileFixing === rev.miss1, rev);
  await b.reload(); await wait(250);
  const once = await js(`return { explanations: document.querySelectorAll('#guided-runner .rl-task.is-done').length, extra: document.querySelectorAll('#guided-runner .result-box .feedback').length }`);
  check('A finished Practice Together problem shows its explanation once after a refresh', rev.done.startsWith('364 is closer to 360') && once.explanations === 1 && once.extra === 0, { rev: rev.done, once });
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
  // Test: the same staged layout, but no checking, hints, plotted number, or filled-in answers.
  const t1 = await js(`${RL}
    const q = document.querySelector('.test-one');
    const o = { count: document.querySelector('.q-count').textContent, part: part(), task: task(), inputs: inputs().join(), shown: q.innerText,
      giveaways: q.querySelectorAll('[data-rl-act="check"], [data-rl-act="over"], .nline-dot, .nline-point, .nline-go, .is-answer, .feedback:not([hidden])').length };
    type('lo', '500'); type('hi', '590'); act('next').click();
    o.p2 = { part: part(), task: task(), labels: labels().join('|'), inputs: inputs().join(), fb: rfb() };
    type('mid', '585'); act('next').click();
    o.p3 = { part: part(), task: task(), buttons: Array.from(rl().querySelectorAll('[data-rl-act="pick"]')).map((b) => b.textContent).join('|'), next: !!act('next'), dot: !!rl().querySelector('.nline-dot') };
    rl().querySelector('[data-side="lo"]').click();
    act('back').click(); act('back').click(); o.back = { part: part(), lo: rl().querySelector('[data-f="lo"]').value };
    document.querySelector('[data-nav="next"]').click(); document.querySelector('[data-nav="prev"]').click();
    o.kept = { part: part(), lo: rl().querySelector('[data-f="lo"]').value, saved: JSON.parse(localStorage.getItem(L.storageKey + ':draft-rounding')).responses.t1 };
    return o;`);
  check('Test question 1: staged like Learn but with nothing given away — no Check, hint, Start Over, plotted number, or filled-in answers', t1.count === 'Question 1 of 12' && t1.part === 'Part 1 of 3' &&
    t1.task === 'What two tens is 583 between?' && t1.inputs === 'lo,hi' && t1.giveaways === 0, t1);
  check('Test: later parts show the child\'s own entries (500 stays 500), ask without hints ("Which ten does 583 round to?"), and keep answers on Back and between questions',
    t1.p2.labels === '500|590' && t1.p2.task === 'What number is halfway?' && t1.p2.fb === '' && t1.p3.task === 'Which ten does 583 round to?' && t1.p3.buttons === '500|590' && !t1.p3.next && !t1.p3.dot &&
    t1.back.part === 'Part 1 of 3' && t1.back.lo === '500' && t1.kept.lo === '500' && t1.kept.saved.lo === '500' && t1.kept.saved.pick === 'lo', t1);
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
  // A skipped (blank) number-line question is not progress.
  await js(`document.querySelector('[data-nav="next"]').click();`);
  await b.load(O + BASE);
  check('Home: skipping a blank number-line test question does not count as progress', await js(`return document.getElementById('continue').hidden || !/lesson-2-2/.test(document.querySelector('#continue-link').getAttribute('href'))`));
  await b.load(O + LESSON + '#test/rounding'); await b.reload(); await wait(250);
  await js(`${PAGED} if (!testQ() || qIndex() !== 0) document.querySelector('[data-nav="prev"]').click(); const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-rounding')).questions; fill(testQ(), qs[0], true); document.querySelector('[data-nav="next"]').click();`);
  await b.load(O + BASE);
  const cont = await js(`return { href: document.querySelector('#continue-link').getAttribute('href'), what: document.querySelector('#continue-what').textContent, shown: !document.getElementById('continue').hidden }`);
  check('Home: Continue points to the unfinished 2-2 test', cont.shown && /lesson-2-2\/#test\/rounding$/.test(cont.href) && /Lesson 2-2 · Rounding Test: 1 of 12 answered/.test(cont.what), cont);
  // Parent Guide: Reset Lesson Progress (Cancel first, then reset). Only Section 2-2 is erased.
  await js(`localStorage.setItem('mathbook:v2:number-words:phase-1:attempts', '[{"score":9,"total":10}]'); localStorage.setItem('unrelated-site-data', 'keep me');`);
  await b.load(O + LESSON + '#teach');
  const reset = await js(`const o = { button: document.querySelector('#reset #clear')?.textContent };
    document.querySelector('#clear').click(); o.ask = document.querySelector('#clear-area').innerText;
    document.querySelector('#clear-no').click(); o.cancel = { hash: location.hash, kept: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length, button: !!document.querySelector('#clear') };
    document.querySelector('#clear').click(); document.querySelector('#clear-yes').click();
    await new Promise((r) => setTimeout(r, 300));
    o.after = { hash: location.hash, h1: document.querySelector('h1').textContent, left22: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length,
      same21: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).sort().map((k) => k + '=' + localStorage.getItem(k)).join('|') === ${JSON.stringify(before21)},
      nw: !!localStorage.getItem('mathbook:v2:number-words:phase-1:attempts'), other: localStorage.getItem('unrelated-site-data') === 'keep me', start: !!document.querySelector('.choice-tag') };
    return o;`);
  check('Parent Guide: Reset Lesson Progress asks first; Cancel keeps everything', reset.button === 'Reset Lesson Progress…' && /answers, Learn completion, and scores for Section 2-2/.test(reset.ask) && reset.cancel.hash === '#teach' && reset.cancel.kept > 0 && reset.cancel.button, reset);
  check('Reset erases only Section 2-2 (2-1, Number Words, and other site data kept) and returns to the 2-2 Lesson Menu', reset.after.hash === '#menu' && reset.after.h1 === 'Round Multi-Digit Numbers' && reset.after.left22 === 0 &&
    reset.after.same21 && reset.after.nw && reset.after.other && reset.after.start, reset.after);
  await b.load(O + BASE);
  const contAfter = await js(`return { shown: !document.getElementById('continue').hidden, href: document.querySelector('#continue-link').getAttribute('href') }`);
  check('Home: after the reset, Continue never points into erased 2-2 progress', !/lesson-2-2/.test(contAfter.href) || !contAfter.shown, contAfter);
  await js(`localStorage.removeItem('unrelated-site-data'); localStorage.removeItem('mathbook:v2:number-words:phase-1:attempts');`);

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
