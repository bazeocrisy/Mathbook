// End-to-end browser test: home page, Math Lessons, and Lesson 2-1 (no dependencies).
// Serves the repo under /Mathbook/ (like GitHub Pages) and drives headless Chrome/Edge.
// Run: npm run test:browser   (set CHROME_PATH if Chrome is not found automatically)
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const LESSON = BASE + 'curriculum/chapter-2/lesson-2-1/';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 600) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const { js, wait, hash } = b;
const pv_hasZero = (n) => String(n).includes('0');

async function noHorizontalScroll(label) {
  const r = await js(`
    const doc = document.documentElement;
    const wide = Array.from(document.querySelectorAll('body *')).filter((e) => {
      if (e.closest('.table-wrap, .skip, .sr-only')) return false;
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
    }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: doc.scrollWidth, cw: doc.clientWidth, wide };`);
  check(`no horizontal overflow: ${label}`, r.sw <= r.cw && r.wide.length === 0, r);
}

/** Every visible button and big link is at least 48px tall. */
async function bigTargets(label) {
  const r = await js(`return Array.from(document.querySelectorAll('.btn, .home-link, .choice-card')).filter((e) => e.offsetParent && !e.closest('[hidden]'))
    .map((e) => ({ t: (e.innerText || '').trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height) })).filter((x) => x.h < 47.5);`);
  check(`buttons are at least 48px tall: ${label}`, r.length === 0, r);
}

// In-page helpers for the one-question-at-a-time screens.
const PAGED = `${FILL_HELPERS}
  const qCount = () => (document.querySelector('.q-count') || {}).textContent || '';
  const qIndex = () => { const m = qCount().match(/Question (\\d+) of (\\d+)/); return m ? Number(m[1]) - 1 : -1; };
  const B = () => JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets') || '{}');
  const bankQ = (id) => L.bank.find((q) => q.id === id);
  const oneQ = () => document.querySelector('#indep .one-q .q[data-qkey]');
  const oneId = () => oneQ().dataset.qkey.replace('p-', '');
  /** Answer the open set screen by screen; ok(i) says whether question i is answered correctly. Then Check my work. */
  const answerSet = (ok) => {
    for (let guard = 0; guard < 60 && oneQ(); guard++) {
      const i = qIndex(); fill(oneQ(), bankQ(oneId()), ok(i));
      const next = document.querySelector('#indep [data-q="next"]');
      if (next) next.click(); else { document.querySelector('#check-set').click(); break; }
    }
  };
  const testQ = () => document.querySelector('.test-one .q[data-qkey]');
  /** Answer the running test screen by screen (k correct, the rest wrong), then Finish Test. */
  const answerTest = (id, k) => {
    const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-' + id)).questions;
    for (let guard = 0; guard < 40 && testQ(); guard++) {
      const i = qIndex(); fill(testQ(), qs[i], i < k);
      document.querySelector('[data-nav="next"]').click();
    }
    document.querySelector('[data-finish]').click();
  };`;

async function takeTest(id, correctCount) {
  await hash('#test');
  await js(`document.querySelector('[data-start="${id}"]').click();`);
  await wait(200);
  return js(`${PAGED}
    answerTest('${id}', ${correctCount});
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts'));
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail')?.innerText || '' };`);
}

try {
  // ----- Home -----
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');
  await b.load(O + BASE);
  const home = await js(`return {
    h1: document.querySelector('h1').textContent, lead: document.querySelector('.home-hero .lead').textContent,
    cards: Array.from(document.querySelectorAll('.choice-card')).map((a) => [a.querySelector('.choice-title').textContent, a.querySelector('.choice-desc').textContent, a.getAttribute('href')]),
    continueHidden: document.getElementById('continue').hidden,
    oldButtons: document.querySelectorAll('.hero-actions, .dest-card, .lesson-row, #continue-list').length,
    privacy: /About saved progress|does not collect names/.test(document.querySelector('main').innerText),
    planet: !!document.querySelector('.hero-art') };`);
  check('Home: smaller welcome + planet, "What would you like to do?", two whole-card choices', home.h1 === 'Welcome to Mathbook' && home.lead === 'What would you like to do?' && home.planet &&
    JSON.stringify(home.cards) === JSON.stringify([['Math Lessons', 'Learn and practice math.', 'math/'], ['Number Words', 'Read and spell number words.', 'number-words/']]), home);
  check('Home: no duplicate Start/destination/resume buttons; parent storage notice moved out of the child menu', home.oldButtons === 0 && !home.privacy, home);
  check('Home: no Continue button without saved progress (nothing fabricated)', home.continueHidden, home);
  const kbCard = await js(`const a = document.querySelector('.choice-card'); a.focus(); return document.activeElement === a && a.tagName === 'A';`);
  check('Home: choice cards are single keyboard-focusable links', kbCard);
  await b.navigate(`document.querySelector('.choice-card[href="math/"]').click();`);

  // ----- Math Lessons -----
  const math = await js(`return { path: location.pathname, h1: document.querySelector('h1').textContent,
    lessons: Array.from(document.querySelectorAll('.choice-card')).map((a) => a.innerText.replace(/\\s+/g, ' ').trim() + ' → ' + a.getAttribute('href')),
    back: Array.from(document.querySelectorAll('a')).filter((a) => /Back to Home/.test(a.textContent)).map((a) => a.getAttribute('href')),
    later: document.querySelector('.coming-later')?.tagName, laterLinks: document.querySelectorAll('.coming-later a, .coming-later button').length };`);
  check('Math Lessons: its own screen with Lesson 2-1 and Back to Home', math.path === '/Mathbook/math/' && math.h1 === 'Math Lessons' && math.lessons.length === 1 && /2-1/.test(math.lessons[0]) && /#menu$/.test(math.lessons[0]) && math.back[0] === '../', math);
  check('Math Lessons: unavailable lessons are an unobtrusive note, not interactive', math.later === 'P' && math.laterLinks === 0, math);
  await b.navigate(`document.querySelector('.choice-card').click();`);

  // ----- Lesson menu -----
  const menu = await js(`return { path: location.pathname, hash: location.hash,
    eyebrow: document.querySelector('.hero .eyebrow').textContent, h1: document.querySelector('h1').textContent, lead: document.querySelector('.hero .lead').textContent,
    cards: Array.from(document.querySelectorAll('.choice-card')).map((a) => [a.querySelector('.choice-title').textContent, a.querySelector('.choice-desc').textContent, a.getAttribute('href')]),
    rec: Array.from(document.querySelectorAll('.choice-card.is-recommended .choice-title')).map((e) => e.textContent), tag: document.querySelector('.choice-tag')?.textContent,
    parent: document.querySelector('.parent-link a')?.getAttribute('href'), stagebar: document.querySelectorAll('.stagebar, .stage-link').length,
    menuLinkHidden: document.querySelector('[data-menu-link]').hidden, home: document.querySelector('.topbar .home-link:not([data-menu-link])').textContent };`);
  check('Lesson 2-1 opens the Lesson Menu (not the parent page)', menu.path.endsWith('/lesson-2-1/') && menu.hash === '#menu' && menu.eyebrow === 'Lesson 2-1' && menu.h1 === 'Represent 4-Digit Numbers' && menu.lead === 'What would you like to do?', menu);
  check('Lesson Menu: Learn, Practice, Take a Test, My Results with short descriptions', JSON.stringify(menu.cards) === JSON.stringify([
    ['Learn', 'See an example and try it.', '#see'], ['Practice', 'Work on one problem at a time.', '#practice'],
    ['Take a Test', 'Show what you know.', '#test'], ['My Results', 'See how you did.', '#results']]), menu.cards);
  check('Lesson Menu: Learn is recommended on the first visit; Parent Guide is a separate small link', JSON.stringify(menu.rec) === '["Learn"]' && menu.tag === 'Start here' && menu.parent === '#teach', menu);
  check('No 1–5 stage bar; compact header has Home (Lesson Menu link hidden on the menu itself)', menu.stagebar === 0 && menu.menuLinkHidden && menu.home === 'Home', menu);

  const opens = {};
  for (const [href, expect] of [['#see', 'Learn'], ['#practice', 'Practice'], ['#test', 'Take a Test'], ['#results', 'My Results'], ['#teach', 'Parent Guide']]) {
    await hash('#menu');
    await js(`document.querySelector('a[href="${href}"]').click();`); await wait(250);
    opens[href] = await js(`return { h1: document.querySelector('h1').textContent, menuLink: !document.querySelector('[data-menu-link]').hidden, top: Math.round(scrollY), hash: location.hash };`);
    opens[href].ok = opens[href].h1 === expect && opens[href].menuLink && opens[href].top === 0;
  }
  check('Each menu choice opens its screen at the top, with Lesson Menu in the header', Object.values(opens).every((o) => o.ok), opens);
  await b.navigate(`document.querySelector('[data-menu-link]').click();`);
  check('Header Lesson Menu link returns to the menu', await js(`const L = window.Mathbook.lessons['2-1']; return location.hash === '#menu' && document.querySelector('h1').textContent === L.title;`));

  // ----- Old routes and bookmarks -----
  const routes = {};
  for (const [h, expect] of [['', 'Represent 4-Digit Numbers'], ['#teach', 'Parent Guide'], ['#see', 'Learn'], ['#practice', 'Practice'], ['#test', 'Take a Test'], ['#results', 'My Results'], ['#nonsense', 'Represent 4-Digit Numbers']]) {
    await b.load(O + LESSON + h);
    routes[h || '(none)'] = await js(`return document.querySelector('h1').textContent;`);
    routes[h || '(none)'] = routes[h || '(none)'] === expect ? 'ok' : routes[h || '(none)'];
  }
  check('Old bookmarks (#teach, #see, #practice, #test, #results) still open the matching screen; unknown → menu', Object.values(routes).every((v) => v === 'ok'), routes);

  // ----- Parent Guide (was Teach It) -----
  await b.load(O + LESSON + '#teach');
  const teach = await js(`return {
    guide: document.querySelectorAll('.guide-card').length, vocab: document.querySelectorAll('.vocab-card').length, script: document.querySelectorAll('.script-step').length,
    parts: Array.from(document.querySelectorAll('.part-tag')).map((e) => e.textContent).join(''),
    bigIdea2: /Big idea 2: 10, 100, or 1,000 more or less/.test(document.body.innerText) && /4,125 \\+ 100 = 4,225/.test(document.body.innerText),
    menuBtn: !!document.querySelector('.stage-nav a[href="#menu"]'), name: /chris/i.test(document.body.innerText) };`);
  check('Parent Guide: all content kept (6 guide answers, 6 vocabulary terms, 6 script steps, parts A–D, big idea 2)', teach.guide === 6 && teach.vocab === 6 && teach.script === 6 && teach.parts === 'ABCD' && teach.bigIdea2, teach);
  check('Parent Guide: Lesson Menu button; no student name shown', teach.menuBtn && !teach.name, teach);
  const jump = await js(`document.querySelector('[data-jump="script"]').click(); await new Promise((r) => setTimeout(r, 200));
    return { top: Math.round(document.querySelector('#script h2').getBoundingClientRect().top), hash: location.hash };`);
  check('Jump links land on their section and keep the screen', jump.top >= 0 && jump.top < 200 && jump.hash === '#teach', jump);
  const skip = await js(`location.hash = '#see'; await new Promise((r) => setTimeout(r, 250)); document.querySelector('[data-skip]').click(); await new Promise((r) => setTimeout(r, 250));
    return { hash: location.hash, focused: document.activeElement.id };`);
  check('Skip link focuses content without changing the screen (B-20)', skip.hash === '#see' && skip.focused === 'stage', skip);

  // ----- Learn: the See It wizard, one step at a time -----
  const WIZ = `${FILL_HELPERS}
    const W = () => JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard') || 'null');
    const wbtn = (a) => document.querySelector('[data-wiz="' + a + '"]');
    const qel = () => document.querySelector('.wiz-check .q[data-qkey]');
    const stepId = () => L.seeIt.steps[W().step].id;
    const curQ = () => { const w = W(); const c = w && w.checks[stepId()]; if (!c) throw new Error('no check for step ' + stepId()); return c.q; };
    const feedback = () => (document.querySelector('.wiz-check [aria-live] .feedback:not([hidden])') || {}).innerText || '';
    const answer = (ok) => { fill(qel(), curQ(), ok); wbtn('check').click(); };
    const doneIds = () => Object.keys(W().done).sort().join();`;
  await hash('#teach'); await hash('#see');
  const wiz0 = await js(`${WIZ}
    return { count: document.querySelector('.wiz-count').textContent, title: document.querySelector('.wiz-card h2').textContent, nextDisabled: wbtn('next').disabled,
      eyebrow: document.querySelector('.hero .eyebrow').textContent, cards: document.querySelectorAll('.wiz-card').length, numberRow: document.querySelectorAll('.wiz-steps, .wiz-step, .seg-btn, .dot').length,
      ask: /Ask:/.test(document.querySelector('.wiz-card').innerText), menu: !!document.querySelector('.wiz-menu a[href="#menu"]'), back: !!wbtn('back'),
      other: L.seeIt.steps.slice(1).some((s) => document.body.innerText.includes(s.title)) };`);
  check('Learn: only the current step is on screen ("Step 1 of 5: Worked examples"); Next Step locked', wiz0.cards === 1 && wiz0.count === 'Step 1 of 5' && wiz0.title === 'Worked examples' && wiz0.nextDisabled && !wiz0.other, wiz0);
  check('Learn: no 1–5 step-button row and no number tabs; Lesson Menu control; no parent "Ask:" lines', wiz0.numberRow === 0 && wiz0.menu && !wiz0.back && !/Step \d of/.test(wiz0.eyebrow) && !wiz0.ask, wiz0);
  const demo = await js(`
    const body = document.querySelector('#demo-body');
    const counts = () => ['thousand','hundred','ten','one'].map((k) => body.querySelectorAll('[data-block="' + k + '"]').length);
    const ex = () => ({ text: document.querySelector('#ex-count').textContent, prev: document.querySelector('#ex-prev').disabled, next: document.querySelector('#ex-next').disabled });
    const first = { counts: counts(), step: document.querySelector('#demo-count').textContent, prevDisabled: document.querySelector('#demo-prev').disabled, ex: ex() };
    for (let i = 0; i < 10; i++) document.querySelector('#demo-next').click();
    const last = { step: document.querySelector('#demo-count').textContent, nextDisabled: document.querySelector('#demo-next').disabled, text: body.innerText };
    document.querySelector('#ex-next').click(); const second = ex();
    document.querySelector('#ex-next').click();
    const zero = { counts: counts(), step: document.querySelector('#demo-count').textContent, ex: ex() };
    for (let i = 0; i < 2; i++) document.querySelector('#demo-next').click();
    zero.note = body.querySelector('.demo-say').textContent;
    document.querySelector('#ex-prev').click(); document.querySelector('#ex-prev').click(); const back = ex();
    return { first, last, second, zero, back };`);
  check('Learn step 1: one example at a time with Previous Example / Next Example', demo.first.ex.text === 'Example 1 of 3: 2,137' && demo.first.ex.prev && !demo.first.ex.next && demo.second.text === 'Example 2 of 3: 4,628' &&
    demo.zero.ex.text === 'Example 3 of 3: 5,072' && demo.zero.ex.next && demo.back.text === 'Example 1 of 3: 2,137', demo);
  check('Learn step 1: 2,137 shows 2 thousands, 1 hundred, 3 tens, 7 ones', JSON.stringify(demo.first.counts) === '[2,1,3,7]', demo.first);
  check('Learn step 1: parts advance one at a time and stop at the end', demo.first.step === 'Part 1 of 7' && demo.first.prevDisabled && demo.last.step === 'Part 7 of 7' && demo.last.nextDisabled, demo);
  check('Learn step 1: final part shows expanded and word form', demo.last.text.includes('2,000 + 100 + 30 + 7 = 2,137') && demo.last.text.includes('two thousand, one hundred thirty-seven'), demo.last.text);
  check('Learn step 1: 5,072 shows 0 hundred flats and explains the zero', JSON.stringify(demo.zero.counts) === '[5,0,7,2]' && demo.zero.step === 'Part 1 of 7' && /0 is in the hundreds place/.test(demo.zero.note), demo.zero);

  const c1 = await js(`${WIZ}
    const q1 = curQ();
    wbtn('check').click(); const empty = !document.querySelector('[data-empty]').hidden;
    answer(false);
    const once = { fb: feedback(), again: !!wbtn('again'), reveals: /The answer is/.test(feedback()), next: wbtn('next').disabled, locked: Array.from(qel().querySelectorAll('input')).every((i) => i.disabled) };
    wbtn('again').click(); answer(false);
    const twice = { fb: feedback(), newBtn: !!wbtn('new'), next: wbtn('next').disabled, done: !!W().done.examples };
    wbtn('new').click();
    const q2 = curQ(); const fresh = { differs: q2.answer !== q1.answer || q2.display !== q1.display, blank: !Q.isAnswered(q2, Q.read(qel(), q2)), noFb: feedback() === '' };
    answer(true);
    return { q1: { prompt: q1.prompt, display: q1.display, type: q1.type, answer: q1.answer }, empty, once, twice, fresh, right: feedback(), next: !wbtn('next').disabled, done: doneIds() };`);
  check('Check: the step-1 check uses a new number in word form with a zero (not 2,137, 4,628, or 5,072)', c1.q1.type === 'chart' && ![2137, 4628, 5072].includes(c1.q1.answer) && pv_hasZero(c1.q1.answer), c1.q1);
  check('Check: empty answer is caught; a wrong answer gets a clue and Try Again — the answer is not revealed; Next stays locked', c1.empty && /Not quite/.test(c1.once.fb) && c1.once.again && !c1.once.reveals && c1.once.next && c1.once.locked, c1.once);
  check('Check: second miss teaches the answer and offers a new question; the step is not complete yet', /The answer is/.test(c1.twice.fb) && c1.twice.newBtn && c1.twice.next && !c1.twice.done, c1.twice);
  check('Check: the new question is different and blank; a right answer completes the step and unlocks Next Step', c1.fresh.differs && c1.fresh.blank && c1.fresh.noFb && /Correct|You got it/.test(c1.right) && c1.next && c1.done === 'examples', c1);

  await js(`document.querySelector('[data-wiz="next"]').click();`);
  const builder = await js(`
    const st = document.querySelectorAll('.builder-top .stepper');
    st[1].querySelector('[data-step="1"]').click(); st[1].querySelector('[data-step="1"]').click();
    st[3].querySelector('[data-step="-1"]').click();
    const out = document.querySelector('#bld-out');
    const a = { title: document.querySelector('.wiz-card h2').textContent, count: document.querySelector('.wiz-count').textContent, text: out.innerText, input: document.querySelector('#bld-input').value,
      counts: ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length), top: Math.round(scrollY), back: !!document.querySelector('[data-wiz="back"]') };
    const inp = document.querySelector('#bld-input'); inp.value = '9,050'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    a.typed = ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length);
    a.typedText = out.innerText;
    return a;`);
  check('Next Step → "Step 2 of 5": Build your own number, starting at the top with Back available', builder.count === 'Step 2 of 5' && builder.title === 'Build your own number' && builder.top === 0 && builder.back, builder);
  check('Step 2: + / − update number, blocks, and forms (2,137 → 2,336)', builder.input === '2,336' && JSON.stringify(builder.counts) === '[2,3,3,6]' && builder.text.includes('2,000 + 300 + 30 + 6') && builder.text.includes('two thousand, three hundred thirty-six'), builder);
  check('Step 2: typing 9,050 rebuilds the model', JSON.stringify(builder.typed) === '[9,0,5,0]' && builder.typedText.includes('nine thousand, fifty'), builder);
  const c2 = await js(`${WIZ} const q = curQ(); answer(true); return { type: q.type, fb: feedback(), next: !wbtn('next').disabled };`);
  check('Step 2 check: build a new number with blocks; right on the first try completes the step', c2.type === 'build' && /Correct/.test(c2.fb) && c2.next, c2);

  await b.reload(); await hash('#see');
  const after = await js(`${WIZ} return { count: document.querySelector('.wiz-count').textContent, done: doneIds(), next: !wbtn('next').disabled, fb: feedback() };`);
  check('Refresh: stays on step 2, both completed steps kept, Next Step still unlocked', after.count === 'Step 2 of 5' && after.done === 'build,examples' && after.next && /Correct/.test(after.fb), after);
  const backTo = await js(`${WIZ} wbtn('back').click();
    const s = { count: document.querySelector('.wiz-count').textContent, fb: feedback(), locked: Array.from(qel().querySelectorAll('input')).every((i) => i.disabled), another: !!wbtn('another'), next: !wbtn('next').disabled };
    const before = JSON.stringify(curQ()); wbtn('another').click();
    s.newQ = JSON.stringify(curQ()) !== before; s.stillDone = W().done.examples === true && !wbtn('next').disabled; s.doneAfter = doneIds();
    return s;`);
  check('Back: completed step 1 shows its result (locked); "Try another one" gives new practice without losing completion', backTo.count === 'Step 1 of 5' && /You got it|Correct/.test(backTo.fb) && backTo.locked && backTo.another && backTo.next && backTo.newQ && backTo.stillDone && backTo.doneAfter === 'build,examples', backTo);

  await js(`document.querySelector('[data-wiz="next"]').click(); document.querySelector('[data-wiz="next"]').click();`);
  const change = await js(`
    const out = document.querySelector('#change-out');
    document.querySelector('[data-delta="100"]').click(); const a = out.innerText;
    document.querySelector('[data-delta="-10"]').click(); const b = out.innerText;
    document.querySelector('#change-reset').click();
    for (let i = 0; i < 8; i++) document.querySelector('[data-delta="1000"]').click();
    const capped = { text: out.querySelector('.change-eq').innerText, disabled: document.querySelector('[data-delta="1000"]').disabled };
    return { a, b, capped, count: document.querySelector('.wiz-count').textContent };`);
  check('Step 3 of 5: 4,125 + 100 = 4,225, then − 10 = 4,215; only one digit changes', change.count === 'Step 3 of 5' && /4,125 \+ 100 = 4,225/.test(change.a) && /hundreds digit changed: 1 became 2/.test(change.a) && /4,225 − 10 = 4,215/.test(change.b), change);
  check('Step 3: buttons that would need regrouping are disabled (stops at 9,125)', /= 9,125/.test(change.capped.text) && change.capped.disabled, change.capped);
  const c3 = await js(`${WIZ} const q = curQ(); answer(false); const once = feedback(); wbtn('again').click(); answer(true); return { prompt: q.prompt, answer: q.answer, once, fb: feedback(), next: !wbtn('next').disabled, rec: W().checks.change };`);
  check('Step 3 check: a new "more or less" question (4-digit answer); right on the second try completes the step', /more|less/.test(c3.prompt) && c3.answer >= 1000 && c3.answer <= 9999 && /Not quite/.test(c3.once) && /You got it/.test(c3.fb) && c3.next && c3.rec.tries === 2, c3);

  await js(`document.querySelector('[data-wiz="next"]').click();`);
  const tenBefore = await js(`${WIZ} return JSON.stringify(curQ());`);
  await b.reload(); await hash('#see');
  check('Refresh on a new step before answering keeps the same check question', await js(`${WIZ} return JSON.stringify(curQ()) === ${JSON.stringify(tenBefore)} && document.querySelector('.wiz-count').textContent === 'Step 4 of 5'`));
  const kept = await js(`${WIZ} fill(qel(), curQ(), true); wbtn('back').click(); wbtn('next').click();
    return { count: document.querySelector('.wiz-count').textContent, kept: Q.isAnswered(curQ(), Q.read(qel(), curQ())), noFb: feedback() === '' };`);
  check('Back then Next keeps an unchecked answer (nothing graded or revealed)', kept.count === 'Step 4 of 5' && kept.kept && kept.noFb, kept);
  const ten = await js(`${WIZ} const blocks = document.querySelectorAll('.wiz-demo .chain-item').length; const q = curQ(); wbtn('check').click();
    return { count: document.querySelector('.wiz-count').textContent, blocks, answer: q.answer, fb: feedback(), next: !wbtn('next').disabled };`);
  check('Step 4 of 5: Groups of ten — unit, rod, flat, cube shown; its check (answer 10, 100, or 1,000) completes the step', ten.count === 'Step 4 of 5' && ten.blocks === 4 && [10, 100, 1000].includes(ten.answer) && /Correct/.test(ten.fb) && ten.next, ten);

  await js(`document.querySelector('[data-wiz="next"]').click();`);
  const c5 = await js(`${WIZ} const text = document.querySelector('.wiz-demo').innerText; const finishLocked = wbtn('finish').classList.contains('is-disabled');
    const q = curQ(); answer(true);
    return { count: document.querySelector('.wiz-count').textContent, text: text.slice(0, 300), finishLocked, prompt: q.prompt, fb: feedback(), finish: wbtn('finish').getAttribute('href'), finishOpen: !wbtn('finish').classList.contains('is-disabled'), done: Object.keys(W().done).length };`);
  check('Step 5 of 5: greatest 8,641 and smallest 1,468 from 4, 1, 8, 6 (audit B-11)', c5.count === 'Step 5 of 5' && /Greatest number: 8,641/.test(c5.text) && /Smallest number: 1,468/.test(c5.text), c5.text);
  check('Step 5 check: new digits; Finish is locked until it is answered', c5.finishLocked && !/digits (4, 1, 8, and 6|2, 8, 4, and 1|3, 9, 5, and 7) /.test(c5.prompt) && /Correct/.test(c5.fb) && c5.finishOpen && c5.finish === '#see/done' && c5.done === 5, c5);
  await b.navigate(`document.querySelector('[data-wiz="finish"]').click();`);
  const fin = await js(`return { h1: document.querySelector('h1').textContent, links: Array.from(document.querySelectorAll('.done-card a')).map((a) => a.textContent + ' ' + a.getAttribute('href')) };`);
  check('Learn completion: "You finished learning!" with Start Practice and Lesson Menu', fin.h1 === 'You finished learning!' && fin.links.includes('Start Practice #practice') && fin.links.includes('Lesson Menu #menu'), fin);
  await b.load(O + LESSON + '#see/done');
  check('Refresh on the completion screen keeps it', await js(`return document.querySelector('h1').textContent === 'You finished learning!'`));
  await hash('#menu');
  check('Lesson Menu: "Start here" is shown only on the first visit', await js(`return !document.querySelector('.choice-tag') && !document.querySelector('.is-recommended')`));

  // ----- Practice: a choice first, then one activity -----
  await hash('#practice');
  const chooser = await js(`return { cards: Array.from(document.querySelectorAll('.choice-card')).map((a) => [a.querySelector('.choice-title').textContent, a.getAttribute('href'), !!a.querySelector('.choice-desc').textContent]),
    runners: document.querySelectorAll('#vocab-runner, #guided-runner, #indep, .q').length };`);
  check('Practice: choice screen first — Math Words, Practice Together, On My Own (each described); no questions yet', JSON.stringify(chooser.cards) === JSON.stringify([['Math Words', '#practice/words', true], ['Practice Together', '#practice/together', true], ['On My Own', '#practice/own', true]]) && chooser.runners === 0, chooser);

  await b.navigate(`document.querySelector('a[href="#practice/words"]').click();`);
  const vocabP = await js(`return { h1: document.querySelector('h1').textContent, count: document.querySelector('.q-count').textContent, qs: document.querySelectorAll('.q[data-qkey]').length,
    hint: !!document.querySelector('[data-act=hint]'), dots: document.querySelectorAll('.dot').length, others: document.querySelectorAll('#guided-runner, #indep').length };`);
  check('Math Words: only this activity, one question ("Question 1 of 10") with hints; no numbered circles', vocabP.h1 === 'Math Words' && vocabP.count === 'Question 1 of 10' && vocabP.qs === 1 && vocabP.hint && vocabP.dots === 0 && vocabP.others === 0, vocabP);

  await b.navigate(`location.hash = '#practice/together';`);
  const guided = await js(`${FILL_HELPERS}
    const box = document.querySelector('#guided-runner');
    const q = L.guided[0];
    const el = () => box.querySelector('.q[data-qkey]');
    const count0 = box.querySelector('.q-count').textContent;
    fill(el(), q, false);
    box.querySelector('[data-act=check]').click();
    const wrongMsg = box.querySelector('.result-box').innerText;
    box.querySelector('[data-act=hint]').click();
    const afterHint = box.querySelector('.result-box').innerText;
    fill(el(), q, true);
    box.querySelector('[data-act=check]').click();
    const rightMsg = box.querySelector('.result-box').innerText;
    box.querySelector('[data-act=next]').click();
    const second = box.querySelector('.q-prompt').innerText; const count1 = box.querySelector('.q-count').textContent;
    fill(el(), L.guided[1], true);
    box.querySelector('[data-act=prev]').click(); box.querySelector('[data-act=next]').click();
    const kept = Q.isAnswered(L.guided[1], Q.read(el(), L.guided[1]));
    const help = Array.from(document.querySelectorAll('.parent-help')).map((d) => d.tagName + (d.open ? ':open' : ':closed'));
    return { count0, count1, wrongMsg, afterHint, rightMsg, second, kept, help, dots: box.querySelectorAll('.dot').length };`);
  check('Practice Together: "Question 1 of 7"; wrong answer can be corrected; correct answer explained', guided.count0 === 'Question 1 of 7' && guided.count1 === 'Question 2 of 7' && /Not yet/.test(guided.wrongMsg) && /Correct/.test(guided.rightMsg) && /3,052/.test(guided.second) && guided.dots === 0, guided);
  check('Practice Together: hint is not repeated in the feedback once shown (audit B-14)', /Hint:/.test(guided.wrongMsg) && !/Hint:/.test(guided.afterHint), guided);
  check('Practice Together: Previous / Next keep the answer; parent coaching is folded under Parent Help', guided.kept && guided.help.every((h) => h === 'DETAILS:closed'), guided);
  const helpAny = await js(`const box = document.querySelector('#guided-runner'); let found = 0;
    for (let i = 0; i < 7; i++) { found += box.querySelectorAll('details.parent-help').length; if (i < 6) box.querySelector('[data-act=next]').click(); }
    box.querySelector('[data-act=next]').click(); await new Promise((r) => setTimeout(r, 100));
    return { found, h1: document.querySelector('h1').textContent, links: Array.from(document.querySelectorAll('.done-card a, .done-card button')).map((a) => a.textContent) };`);
  check('Practice Together: Parent Help appears on items with coaching; finishing shows a review action and Lesson Menu', helpAny.found > 0 && /finished Practice Together/.test(helpAny.h1) && helpAny.links.includes('Lesson Menu') && helpAny.links.includes('Practice together again'), helpAny);

  // ----- On My Own: five sets of 10, one question at a time, + Practice My Misses -----
  await hash('#practice/own');
  const grid = await js(`const L = window.Mathbook.lessons['2-1']; return { cards: Array.from(document.querySelectorAll('.set-card h3')).map((h) => h.textContent), status: Array.from(document.querySelectorAll('.set-status')).map((s) => s.innerText.trim()), bank: L.bank.length, qs: document.querySelectorAll('.q').length };`);
  check('On My Own: 5 labeled sets, all "Not started"; bank has 50; no questions until a set is chosen', JSON.stringify(grid.cards) === JSON.stringify(['Place and Digit Value', 'Base-Ten Models', 'Standard Form', 'Expanded and Word Form', 'Mixed Review and Reasoning']) && grid.status.every((s) => s === 'Not started') && grid.bank === 50 && grid.qs === 0, grid);

  await b.navigate(`document.querySelector('[data-open-set="s2"]').click();`);
  const set2 = await js(`${PAGED}
    const first = { hash: location.hash, count: qCount(), shown: document.querySelectorAll('#indep .q[data-qkey]').length, hints: document.querySelectorAll('#indep [data-act=hint], #indep .hint-box').length, prev: !!document.querySelector('[data-q="prev"]') };
    const order = B().s2.active.order;
    // Answer question 1, go forward and back: the answer is kept.
    fill(oneQ(), bankQ(oneId()), true); document.querySelector('[data-q="next"]').click();
    const second = qCount(); document.querySelector('[data-q="prev"]').click();
    const kept = Q.isAnswered(bankQ(oneId()), Q.read(oneQ(), bankQ(oneId())));
    // Skip to the end without answering and press Check my work.
    for (let i = 0; i < 9; i++) document.querySelector('[data-q="next"]').click();
    const last = qCount(); document.querySelector('#check-set').click();
    const blocked = document.querySelector('#indep .error-box').innerText; const gotos = document.querySelectorAll('#indep [data-goto]').length;
    document.querySelector('#indep [data-goto]').click(); const jumped = qCount();
    // Answer from the start: first 3 wrong, the rest right.
    while (qIndex() > 0) document.querySelector('[data-q="prev"]').click();
    answerSet((i) => i >= 3);
    const st = B().s2;
    return { first, second, kept, last, blocked, gotos, jumped, order, sameSet: order.slice().sort().join() === L.bankSets[1].ids.slice().sort().join(), unique: new Set(order).size,
      score: document.querySelector('.set-score').innerText, wrong: document.querySelectorAll('#indep .feedback-no').length,
      explained: Array.from(document.querySelectorAll('#indep .feedback-no')).every((f) => /Correct answer:[\\s\\S]*Why:/.test(f.innerText)),
      missesBtn: document.querySelector('#practice-misses')?.innerText, menu: !!document.querySelector('#indep a[href="#menu"]'), attempts: st.attempts.length, missed: order.slice(0, 3) };`);
  check('Set 2: its own screen (#practice/s2), one question at a time ("Question 1 of 10"), no hints', set2.first.hash === '#practice/s2' && set2.first.count === 'Question 1 of 10' && set2.first.shown === 1 && set2.first.hints === 0 && !set2.first.prev, set2.first);
  check('Set 2: 10 different questions, exactly the Base-Ten Models set', set2.unique === 10 && set2.sameSet, set2);
  check('Set 2: Next / Previous keep answers', set2.second === 'Question 2 of 10' && set2.kept && set2.last === 'Question 10 of 10', set2);
  check('Set 2: Check my work needs every answer and links to the missing ones', /Answer every question/.test(set2.blocked) && set2.gotos === 9 && set2.jumped === 'Question 2 of 10', set2);
  check('Set 2: 7 of 10 with explanations for each miss, Practice My Misses (3), and Lesson Menu', /7 of 10 correct/.test(set2.score) && set2.wrong === 3 && set2.explained && set2.missesBtn === 'Practice My Misses (3)' && set2.menu && set2.attempts === 1, set2);
  await hash('#practice/own');
  const card2 = await js(`return document.querySelectorAll('.set-card')[1].innerText`);
  check('Set card shows Completed and the score', /Completed/.test(card2) && /Last score 7\/10/.test(card2) && /Best 7\/10/.test(card2), card2);

  await hash('#practice/s2');
  const retry1 = await js(`${PAGED}
    document.querySelector('#practice-misses').click();
    const text = document.querySelector('#indep').innerText; const q = bankQ(oneId());
    return { ids: B().s2.active.order, count: qCount(), onYourOwn: /On your own/.test(text), answered: Q.isAnswered(q, Q.read(oneQ(), q)) ? 1 : 0, feedback: document.querySelectorAll('#indep .feedback').length,
      revealsAnswer: /Correct answer:/.test(text) || text.includes(q.explanation), hints: document.querySelectorAll('#indep [data-act=hint]').length };`);
  check('Practice My Misses: only the 3 missed questions ("Question 1 of 3")', retry1.ids.length === 3 && retry1.ids.slice().sort().join() === set2.missed.slice().sort().join() && retry1.count === 'Question 1 of 3', retry1);
  check('Practice My Misses: starts unanswered; no correct answers, explanations, or hints shown before checking', retry1.answered === 0 && retry1.feedback === 0 && !retry1.revealsAnswer && retry1.hints === 0 && retry1.onYourOwn, retry1);

  await js(`${PAGED} fill(oneQ(), bankQ(oneId()), true);`);
  await b.reload();
  const retryRefresh = await js(`${PAGED} const q = bankQ(oneId()); return { hash: location.hash, same: B().s2.active.order.join() === ${JSON.stringify(retry1.ids.join())}, count: qCount(), answered: Q.isAnswered(q, Q.read(oneQ(), q)) };`);
  check('Refresh mid-retry: same screen, same 3 questions, the answer kept', retryRefresh.hash === '#practice/s2' && retryRefresh.same && retryRefresh.count === 'Question 1 of 3' && retryRefresh.answered, retryRefresh);

  const retry1Done = await js(`${PAGED}
    const ids = B().s2.active.order; answerSet((i) => i < 2);
    const st = B().s2;
    return { score: document.querySelector('.set-score').innerText, explained: document.querySelectorAll('#indep .feedback').length, wrongIds: [ids[2]],
      original: st.attempts[0].score, originalCorrect: st.attempts[0].correct.filter(Boolean).length, retries: st.retries.length, parentOk: st.retries[0].parentId === st.attempts[0].id,
      again: document.querySelector('#practice-misses')?.innerText };`);
  check('Retry checked: "2 of 3 now correct", explanations for all 3', /Practice My Misses: 2 of 3 now correct/.test(retry1Done.score) && retry1Done.explained === 3, retry1Done);
  check('Original attempt preserved (7/10) and improvement tracked separately (fixed 2 of 3)', retry1Done.original === 7 && retry1Done.originalCorrect === 7 && retry1Done.retries === 1 && retry1Done.parentOk && /original attempt stays 7\/10/.test(retry1Done.score) && /Misses fixed so far: 2 of 3/.test(retry1Done.score), retry1Done);
  const retry2 = await js(`${PAGED}
    document.querySelector('#practice-misses').click();
    const ids = B().s2.active.order; answerSet(() => true);
    return { ids, score: document.querySelector('.set-score').innerText, noMoreMisses: !document.querySelector('#practice-misses') };`);
  check('Practice My Misses again: only the 1 still-missed question; then all misses fixed (3 of 3)', retry1Done.again === 'Practice My Misses (1)' && JSON.stringify(retry2.ids) === JSON.stringify(retry1Done.wrongIds) && /1 of 1 now correct/.test(retry2.score) && /Misses fixed so far: 3 of 3/.test(retry2.score) && retry2.noMoreMisses, retry2);

  await b.reload(); await hash('#menu'); await hash('#practice/s2');
  const bankPersisted = await js(`return { title: document.querySelector('.set-title')?.innerText, score: document.querySelector('.set-score')?.innerText, locked: Array.from(document.querySelectorAll('#indep input')).every((i) => i.disabled) };`);
  await hash('#practice/own');
  const card2b = await js(`return document.querySelectorAll('.set-card')[1].innerText`);
  check('Refresh and navigation: checked retry, set status, and scores are kept; answers locked', /Practice My Misses/.test(bankPersisted.title) && /1 of 1 now correct/.test(bankPersisted.score) && bankPersisted.locked && /Completed/.test(card2b) && /Misses fixed 3 of 3/.test(card2b) && /Last score 7\/10/.test(card2b), { bankPersisted, card2b });

  await hash('#practice/s2');
  const again = await js(`${PAGED}
    const orders = [];
    for (let k = 0; k < 3; k++) { document.querySelector('#set-again').click(); orders.push(B().s2.active.order.join()); if (k < 2) answerSet(() => true); }
    const q = bankQ(oneId());
    return { differs: orders.some((o) => o !== ${JSON.stringify(set2.order.join())}), unique: new Set(B().s2.active.order).size, count: qCount(), answered: Q.isAnswered(q, Q.read(oneQ(), q)), attempts: B().s2.attempts.map((a) => a.score) };`);
  await hash('#practice/own');
  const card2c = await js(`return document.querySelectorAll('.set-card')[1].innerText`);
  check('Practice this set again: new random order, 10 unique questions, unanswered; earlier attempts kept (7, 10, 10)', again.differs && again.unique === 10 && again.count === 'Question 1 of 10' && !again.answered && JSON.stringify(again.attempts) === '[7,10,10]' && /In progress/.test(card2c) && /Best 10\/10/.test(card2c), { again, card2c });

  await hash('#practice/s2');
  const ids2 = await js(`${PAGED} fill(oneQ(), bankQ(oneId()), true); return B().s2.active.order;`);
  await hash('#practice/own');
  await b.navigate(`document.querySelector('[data-open-set="s1"]').click();`);
  const s1 = await js(`const L = window.Mathbook.lessons['2-1']; return JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets')).s1.active.order;`);
  await hash('#practice/own');
  const label2 = await js(`return document.querySelector('[data-open-set="s2"]').innerText`);
  await b.navigate(`document.querySelector('[data-open-set="s2"]').click();`);
  const switching = await js(`${PAGED} const q = bankQ(oneId()); return { sameOrder: B().s2.active.order.join() === ${JSON.stringify(ids2.join())}, kept: Q.isAnswered(q, Q.read(oneQ(), q)) };`);
  check('Switching sets: Set 1 opens its own 10; returning to Set 2 continues with the answer kept', s1.slice().sort().join() === (await js(`const L = window.Mathbook.lessons['2-1']; return L.bankSets[0].ids.slice().sort().join()`)) && switching.sameOrder && switching.kept && label2 === 'Continue', { switching, label2 });

  const allSets = {};
  for (const id of ['s1', 's2', 's3', 's4', 's5']) {
    await hash('#practice/' + id);
    allSets[id] = await js(`${PAGED}
      if (!oneQ()) document.querySelector('#set-again').click();
      while (qIndex() > 0) document.querySelector('[data-q="prev"]').click();
      const ids = B()['${id}'].active.order; answerSet(() => true);
      const s = L.bankSets.find((x) => x.id === '${id}');
      return { score: document.querySelector('.set-score').innerText.match(/(\\d+) of (\\d+)/).slice(1).join('/'), same: ids.slice().sort().join() === s.ids.slice().sort().join() };`);
  }
  await hash('#practice/own');
  const doneStatus = await js(`return Array.from(document.querySelectorAll('.set-status')).map((s) => s.innerText.trim())`);
  check('All 5 sets through the UI: every one of the 50 questions graded correct (10/10 each)', Object.values(allSets).every((x) => x.score === '10/10' && x.same) && doneStatus.every((d) => d === 'Completed'), { allSets, doneStatus });

  // ----- Take a Test: one question at a time, Finish Test -----
  await hash('#test');
  const tchoose = await js(`return { h1: document.querySelector('h1').textContent, lead: document.querySelector('.hero .lead').textContent,
    tests: Array.from(document.querySelectorAll('.test-card h2')).map((h) => h.textContent), help: document.querySelector('details.parent-help') ? !document.querySelector('details.parent-help').open : false,
    menu: !!document.querySelector('.stage-nav a[href="#menu"]') };`);
  check('Take a Test: "Which test would you like to take?" — Math Test, then Math Words Test; rules under Parent Help', tchoose.h1 === 'Take a Test' && tchoose.lead === 'Which test would you like to take?' && JSON.stringify(tchoose.tests) === '["Math Test","Math Words Test"]' && tchoose.help && tchoose.menu, tchoose);
  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const blocked = await js(`${PAGED}
    const first = { count: qCount(), shown: document.querySelectorAll('.test-one .q[data-qkey]').length, all: document.querySelectorAll('main .q[data-qkey]').length };
    const hints = document.querySelectorAll('main .hint-box, main [data-act=hint], main [data-act=check], main [data-act=reveal]').length;
    const banner = getComputedStyle(document.querySelector('.test-banner')).display !== 'none';
    const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-math')).questions;
    fill(testQ(), qs[0], true); document.querySelector('[data-nav="next"]').click(); document.querySelector('[data-nav="prev"]').click();
    const kept = Q.isAnswered(qs[0], Q.read(testQ(), qs[0]));
    const feedbackShown = document.querySelectorAll('main .feedback, main .result-box:not(:empty)').length + (/Correct!|Correct answer|Not yet.|Why:/.test(document.querySelector('main').innerText) ? 1 : 0);
    for (let i = 0; i < 10; i++) document.querySelector('[data-nav="next"]').click();
    const review = { h2: document.querySelector('main h2')?.textContent, text: document.querySelector('main').innerText, gotos: document.querySelectorAll('[data-go]').length };
    document.querySelector('[data-finish]').click();
    await new Promise((r) => setTimeout(r, 200));
    return { first, hints, banner, kept, feedbackShown, review, still: !!document.querySelector('[data-finish]'),
      saved: (JSON.parse(localStorage.getItem(L.storageKey + ':attempts')) || []).length, types: [...new Set(qs.map((q) => q.type))] };`);
  check('Math Test: one question at a time ("Question 1 of 10"), several types, no hints or checking', blocked.first.count === 'Question 1 of 10' && blocked.first.shown === 1 && blocked.first.all === 1 && blocked.hints === 0 && blocked.types.length >= 4, blocked);
  check('Math Test: Previous / Next keep answers; nothing about right or wrong is shown before finishing', blocked.kept && blocked.feedbackShown === 0, blocked);
  check('Math Test: review screen lists unanswered questions; Finish Test refuses until all are answered', blocked.review.h2 === 'Ready to finish?' && /You answered 1 of 10/i.test(blocked.review.text) && blocked.review.gotos === 9 && blocked.still && blocked.saved === 0, blocked.review);
  check('Test focus mode: test banner shown (audit B-04)', blocked.banner, blocked);
  await b.viewport(390, 844, true);
  await b.shot(path.join(SHOTS, 'test-math-phone.png'));
  await b.viewport(1280, 900, false);

  await js(`${PAGED} document.querySelector('[data-go]').click(); const qs = JSON.parse(localStorage.getItem(L.storageKey + ':draft-math')).questions;
    fill(testQ(), qs[1], true); document.querySelector('[data-nav="next"]').click(); fill(testQ(), qs[2], true); document.querySelector('[data-nav="next"]').click();`);
  const resumed = await js(`return document.querySelector('#answered-banner').textContent;`);
  await b.reload();
  const tchooser = await js(`return { focusOff: !document.body.classList.contains('is-testing'), resumeText: document.querySelector('.test-card').innerText, resumeLabel: document.querySelector('[data-start="math"]').innerText, vocabStart: !!document.querySelector('[data-start="vocab"]') };`);
  check('Refresh mid-test returns to the chooser with Keep going; the other test can be started (audit T06)', tchooser.focusOff && /Keep going/.test(tchooser.resumeLabel) && /3 of 10 answered/.test(tchooser.resumeText) && tchooser.vocabStart, tchooser);
  await b.load(O + LESSON + '#test/math');
  await wait(200);
  const afterReload = await js(`return { banner: document.querySelector('#answered-banner')?.textContent, count: document.querySelector('.q-count')?.textContent };`);
  check('Unfinished test answers survive a refresh; #test/math resumes it', resumed === '3 of 10 answered' && afterReload.banner === '3 of 10 answered' && /Question \d+ of 10/.test(afterReload.count), { resumed, afterReload });
  await js(`document.querySelector('.test-banner [data-exit]').click();`);
  await wait(300);
  const exited = await js(`return { testing: document.body.classList.contains('is-testing'), chooser: !!document.querySelector('[data-start="vocab"]'), hash: location.hash };`);
  check('"Save and finish later" leaves focus mode and returns to the chooser', !exited.testing && exited.chooser && exited.hash === '#test', exited);
  await js(`history.back();`); await wait(300); await hash('#test');
  check('Leaving Take a Test by any route never traps the other test (T06 regression)', await js(`return !!document.querySelector('[data-start="vocab"]') && !!document.querySelector('[data-start="math"]');`));

  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const perfect = await js(`${PAGED}
    while (qIndex() > 0) document.querySelector('[data-nav="prev"]').click();
    answerTest('math', 10);
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts'));
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail').innerText, testing: document.body.classList.contains('is-testing') };`);
  const missedQs = perfect.last.questions.filter((q, i) => !perfect.last.correct[i]).map((q) => ({ q, r: perfect.last.responses[q.id] }));
  check('Math Test: all-correct answers score 10/10 = 100% Mastered', perfect.hash === '#results' && perfect.last.score === 10 && perfect.last.pct === 100 && /Mastered/.test(perfect.text), { score: perfect.last.score, missedQs });
  check('Paused-and-resumed count is recorded on the attempt', perfect.last.pauses >= 1 && /paused and resumed/.test(perfect.text), perfect.last.pauses);
  check('Focus mode ends after Finish Test', !perfect.testing);
  await b.shot(path.join(SHOTS, 'results-mastered-desktop.png'));

  const zero = await takeTest('math', 0);
  check('Math Test retake uses new numbers', JSON.stringify(zero.last.questions) !== JSON.stringify(perfect.last.questions));
  check('Math Test: all-wrong scores 0% Reteach with 10 explained mistakes', zero.last.score === 0 && /Reteach and reassess/.test(zero.text) && /Mistakes to review \(10\)/.test(zero.text), zero.text.slice(0, 300));
  const vocab = await takeTest('vocab', 8);
  check('Math Words Test: 8 of 10 → 80% Review missed skills', vocab.last.score === 8 && vocab.last.pct === 80 && /Math Words Test/.test(vocab.text) && /Review missed skills/.test(vocab.text) && /Mistakes to review \(2\)/.test(vocab.text), vocab.text.slice(0, 300));
  check('Results list skills to review with a next action', /Skills to review/.test(vocab.text) && /(Practice this skill|Math Words practice)/.test(vocab.text), vocab.text);
  await b.viewport(390, 844, true);
  await noHorizontalScroll('results with attempts @ 390px (audit B-01)');
  await b.viewport(320, 568, true);
  await noHorizontalScroll('results with attempts @ 320px (audit B-01)');
  await b.viewport(1280, 900, false);
  const math7 = await takeTest('math', 7);
  check('Math Test: 7 of 10 → 70% Review missed skills (threshold)', math7.last.pct === 70 && /Review missed skills/.test(math7.text), math7.last.pct);
  const math9 = await takeTest('math', 9);
  check('Math Test: 9 of 10 → 90% Mastered (threshold)', math9.last.pct === 90 && /Mastered/.test(math9.text), math9.last.pct);
  const math6 = await takeTest('math', 6);
  check('Math Test: 6 of 10 → 60% Reteach (threshold)', math6.last.pct === 60 && /Reteach and reassess/.test(math6.text), math6.last.pct);

  await b.reload();
  const persisted = await js(`return { h1: document.querySelector('h1').textContent, rows: document.querySelectorAll('.history tbody tr').length, local: /only in this browser/.test(document.body.textContent), menu: !!document.querySelector('.stage-nav a[href="#menu"]') };`);
  check('My Results: a separate screen with Lesson Menu; results and history persist after refresh (6 attempts)', persisted.h1 === 'My Results' && persisted.rows === 6 && persisted.local && persisted.menu, persisted);
  const jumpPractice = await js(`const L = window.Mathbook.lessons['2-1']; 
    const b = document.querySelector('[data-practice]');
    if (!b) return { skipped: true };
    const skill = b.dataset.practice; const label = b.innerText; b.click();
    await new Promise((r) => setTimeout(r, 400));
    const id = location.hash.split('/')[1]; const set = L.bankSets.find((x) => x.id === id);
    const counts = L.bankSets.map((x) => x.ids.filter((qid) => L.bank.find((q) => q.id === qid).skill === skill).length);
    const order = JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets'))[id].active.order;
    return { hash: location.hash, skill, label, setIndex: L.bankSets.indexOf(set), counts, count: document.querySelector('.q-count')?.textContent, hasSkill: order.some((qid) => L.bank.find((q) => q.id === qid).skill === skill), top: Math.round(scrollY) };`);
  check('"Practice this skill" opens the set with the most questions on that skill, at the top', /^#practice\/s\d$/.test(jumpPractice.hash) && jumpPractice.count === 'Question 1 of 10' && jumpPractice.hasSkill && jumpPractice.counts[jumpPractice.setIndex] === Math.max(...jumpPractice.counts) && jumpPractice.label.includes(`Set ${jumpPractice.setIndex + 1}`) && jumpPractice.top === 0, jumpPractice);

  // ----- Home: one Continue button, only for real unfinished progress -----
  // Leave the practice set from "Practice this skill" unanswered, start the Math Words Test, answer nothing.
  await hash('#test');
  await js(`document.querySelector('[data-start="vocab"]').click();`); await wait(200);
  await b.load(O + BASE);
  check('Home: an untouched test (0 answered) and an unanswered set do not count as progress', await js(`return document.getElementById('continue').hidden`));
  await b.load(O + LESSON + '#test/vocab'); await wait(200);
  await js(`${PAGED} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); fill(testQ(), d.questions[qIndex()], true); document.querySelector('[data-nav="next"]').click();`);
  await b.load(O + BASE);
  const cont = await js(`return { shown: !document.getElementById('continue').hidden, buttons: document.querySelectorAll('#continue a').length, label: document.querySelector('#continue-link').textContent,
    href: document.querySelector('#continue-link').getAttribute('href'), what: document.querySelector('#continue-what').textContent };`);
  check('Home: exactly one "Continue where I left off" button, pointing at the unfinished test', cont.shown && cont.buttons === 1 && /Continue where I left off/.test(cont.label) && cont.href === 'curriculum/chapter-2/lesson-2-1/#test/vocab' && /Math Words Test: 1 of 10 answered/.test(cont.what), cont);
  await b.navigate(`document.querySelector('#continue-link').click();`);
  check('Continue opens the saved place (the Math Words Test, resumed)', await js(`return location.pathname.endsWith('/lesson-2-1/') && document.body.classList.contains('is-testing') && /Math Words Test/.test(document.querySelector('h1').textContent)`));

  // ----- Clear progress -----
  await b.load(O + LESSON + '#results');
  await js(`localStorage.setItem('mathbook:v2:number-words:phase-1:attempts', '[{"score":9}]');`);
  const cleared = await js(`
    document.querySelector('#privacy').open = true;
    document.querySelector('#clear').click();
    const asked = !!document.querySelector('#clear-yes');
    document.querySelector('#clear-yes').click();
    return { asked, lessonKeys: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).length, nwKept: !!localStorage.getItem('mathbook:v2:number-words:phase-1:attempts'),
      text: document.querySelector('main').innerText, links: Array.from(document.querySelectorAll('.done-card a')).map((a) => a.textContent + ' ' + a.getAttribute('href')) };`);
  check('Clear progress asks first, removes only this lesson (Number Words kept)', cleared.asked && cleared.lessonKeys === 0 && cleared.nwKept, cleared);
  check('My Results with no tests: "You haven\'t taken a test yet." with Take a Test and Lesson Menu', /You haven't taken a test yet\./.test(cleared.text) && cleared.links.includes('Take a Test #test') && cleared.links.includes('Lesson Menu #menu'), cleared);

  // ----- Layout at phone, tablet, desktop -----
  const SCREENS = ['menu', 'teach', 'see', 'practice', 'practice/own', 'practice/s2', 'test', 'test/math', 'results'];
  for (const [name, w, h] of [['phone', 390, 844], ['tablet', 820, 1180], ['desktop', 1280, 900], ['small-phone', 320, 568], ['short', 640, 360]]) {
    await b.viewport(w, h);
    for (const screen of SCREENS) {
      await hash('#' + screen); await wait(100);
      await noHorizontalScroll(`${screen} @ ${name} ${w}×${h}`);
      if (name === 'phone' || name === 'desktop') {
        await b.shot(path.join(SHOTS, `${screen.replace('/', '-')}-${name}.png`));
        if (name === 'phone') await bigTargets(`${screen} @ phone`);
      }
    }
    for (const [label, url] of [['home', O + BASE], ['math', O + BASE + 'math/']]) {
      await b.load(url);
      await noHorizontalScroll(`${label} @ ${name} ${w}×${h}`);
      if (name === 'phone' || name === 'desktop') await b.shot(path.join(SHOTS, `${label}-${name}.png`));
    }
    await b.load(O + LESSON + '#menu');
  }
  await b.viewport(390, 844);
  await b.load(O + BASE); await bigTargets('home @ phone');
  const cols = {};
  for (const [w, h] of [[390, 844], [1280, 900]]) {
    await b.viewport(w, h, false);
    await b.load(O + LESSON + '#menu');
    cols[w] = await js(`const r = Array.from(document.querySelectorAll('.choice-card')).map((c) => Math.round(c.getBoundingClientRect().left)); return new Set(r).size;`);
  }
  const widths = await js(`location.hash = '#menu'; await new Promise((r) => setTimeout(r, 150)); const m = parseFloat(getComputedStyle(document.querySelector('#stage')).maxWidth);
    location.hash = '#see'; await new Promise((r) => setTimeout(r, 150)); const a = parseFloat(getComputedStyle(document.querySelector('#stage')).maxWidth);
    return { menu: m, activity: a, body: parseFloat(getComputedStyle(document.documentElement).fontSize) };`);
  check('Menus are two columns on desktop and one on phones; menus ~960px, activities ~800px, 18px text', cols[1280] === 2 && cols[390] === 1 && widths.menu === 960 && widths.activity === 800 && widths.body === 18, { cols, widths });
  await b.viewport(1280, 900, false);

  // ----- Stress: all-correct attempts must always score 100% -----
  await b.load(O + LESSON + '#test');
  const scores = [];
  for (let i = 0; i < 20; i++) {
    for (const id of ['math', 'vocab']) {
      const a = await takeTest(id, 10);
      if (a.last.score !== 10) scores.push({ id, missed: a.last.questions.filter((q, k) => !a.last.correct[k]).map((q) => ({ q, r: a.last.responses[q.id] })) });
    }
  }
  check('40 all-correct test attempts (20 Math, 20 Math Words) all score 100%', scores.length === 0, scores);

  // ----- Accessibility basics -----
  const kb = await js(`return { stageLinks: document.querySelectorAll('.stagebar a[href]').length,
    unlabeled: Array.from(document.querySelectorAll('button, input, select')).filter((e) => !(e.textContent.trim() || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label'))).length };`);
  check('Keyboard/screen reader: no stage bar, every control labeled', kb.stageLinks === 0 && kb.unlabeled === 0, kb);
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 300), pageErrors: b.errors.slice(0, 3), at: await js('return location.href + " | " + (document.querySelector("h1") || {}).textContent').catch(() => '?') });
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (Lesson 2-1 + home). Screenshots: tests/screenshots/`);
process.exit(failed.length ? 1 : 0);
