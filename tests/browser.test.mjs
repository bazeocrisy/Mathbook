// End-to-end browser test: home page + Lesson 2-1 (no dependencies).
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

async function takeTest(id, correctCount) {
  await hash('#test');
  await js(`document.querySelector('[data-start="${id}"]').click();`);
  await wait(200);
  return js(`${FILL_HELPERS}
    const draft = JSON.parse(localStorage.getItem(L.storageKey + ':draft-${id}'));
    const els = document.querySelectorAll('#test-form .q[data-qkey]');
    draft.questions.forEach((q, i) => fill(els[i], q, i < ${correctCount}));
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts'));
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail')?.innerText || '' };`);
}

try {
  // ----- Home page -----
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');
  await b.load(O + BASE);
  const home = await js(`return {
    h1: document.querySelector('h1').textContent,
    start: document.querySelector('.hero-actions a').getAttribute('href'),
    lesson: !!document.querySelector('a.lesson-row[href="curriculum/chapter-2/lesson-2-1/"]'),
    nw: !!document.querySelector('a[href="number-words/"]') && !!document.querySelector('a.lesson-row[href="number-words/phase-1/"]'),
    locked: Array.from(document.querySelectorAll('.lesson-row.is-locked')).map((e) => e.tagName),
    continueHidden: document.getElementById('continue').hidden };`);
  check('Home: welcome, Start Learning → Lesson 2-1, Number Words entry', home.h1 === 'Welcome to Mathbook' && home.start === 'curriculum/chapter-2/lesson-2-1/' && home.lesson && home.nw, home);
  check('Home: unreleased lessons are not links (not playable)', home.locked.length === 3 && home.locked.every((t) => t === 'DIV'), home.locked);
  check('Home: no Continue Learning without saved progress (nothing fabricated)', home.continueHidden, home);
  await b.navigate(`document.querySelector('.hero-actions a').click();`);
  check('Start Learning opens Lesson 2-1 (relative path under /Mathbook/)', await js(`return location.pathname === '/Mathbook/curriculum/chapter-2/lesson-2-1/' && !!document.querySelector('.stagebar');`));

  // ----- Teach It -----
  const teach = await js(`return {
    h1: document.querySelector('h1').textContent,
    guide: document.querySelectorAll('.guide-card').length,
    vocab: document.querySelectorAll('.vocab-card').length,
    script: document.querySelectorAll('.script-step').length,
    current: document.querySelector('[aria-current=step]').dataset.stage,
    parts: Array.from(document.querySelectorAll('.part-tag')).map((e) => e.textContent).join(''),
    audiences: Array.from(document.querySelectorAll('.section-head .aud')).map((e) => e.textContent),
    bigIdea2: /Big idea 2: 10, 100, or 1,000 more or less/.test(document.body.innerText) && /4,125 \\+ 100 = 4,225/.test(document.body.innerText),
    name: /chris/i.test(document.body.innerText) };`);
  // Build 2.1: the teaching script gained step 6 (10/100/1,000 more or less), so 5 → 6 steps.
  check('Teach It: title, 6 parent-guide answers, 6 vocabulary terms, 6 script steps', teach.h1 === 'Represent 4-Digit Numbers' && teach.guide === 6 && teach.vocab === 6 && teach.script === 6 && teach.current === 'teach', teach);
  check('Teach It: parts A–D labeled for student / together / parent', teach.parts === 'ABCD' && teach.audiences.join('|') === 'For the student|Together|For the parent|For the parent', teach);
  check('Teach It: "10, 100, 1,000 more or less" is taught (audit B-02)', teach.bigIdea2, teach);
  check('no student name shown', !teach.name);
  const jump = await js(`document.querySelector('[data-jump="script"]').click(); await new Promise((r) => setTimeout(r, 200));
    const h = document.querySelector('#script h2').getBoundingClientRect(); const bar = document.querySelector('.stagebar').getBoundingClientRect();
    return { headingTop: Math.round(h.top), barBottom: Math.round(bar.bottom), hash: location.hash };`);
  check('Jump links land below the sticky stage bar and keep the stage (audit B-08)', jump.headingTop >= jump.barBottom && (jump.hash === '' || jump.hash === '#teach'), jump);
  const skip = await js(`location.hash = '#see'; await new Promise((r) => setTimeout(r, 250)); document.querySelector('[data-skip]').click(); await new Promise((r) => setTimeout(r, 250));
    return { hash: location.hash, focused: document.activeElement.id };`);
  check('Skip link focuses content without changing the stage (B-20)', skip.hash === '#see' && skip.focused === 'stage', skip);

  // ----- See It: five-step wizard -----
  const WIZ = `${FILL_HELPERS}
    const W = () => JSON.parse(localStorage.getItem(L.storageKey + ':see-wizard') || 'null');
    const wbtn = (a) => document.querySelector('[data-wiz="' + a + '"]');
    const qel = () => document.querySelector('.wiz-check .q[data-qkey]');
    const stepId = () => L.seeIt.steps[W().step].id;
    const curQ = () => { const w = W(); const c = w && w.checks[stepId()]; if (!c) throw new Error('no check for step ' + stepId() + ' in ' + JSON.stringify(w).slice(0, 300)); return c.q; };
    const feedback = () => (document.querySelector('.wiz-check [aria-live] .feedback:not([hidden])') || {}).innerText || '';
    const answer = (ok) => { fill(qel(), curQ(), ok); wbtn('check').click(); };
    const steps = () => Array.from(document.querySelectorAll('.wiz-step')).map((b) => (b.disabled ? 'locked' : b.classList.contains('is-done') ? 'done' : b.classList.contains('is-current') ? 'current' : 'open'));`;
  await hash('#teach'); await hash('#see');
  const wiz0 = await js(`${WIZ}
    document.querySelector('[data-go="2"]').click();
    return { steps: steps(), count: document.querySelector('.wiz-count').textContent, title: document.querySelector('.wiz-card h2').textContent, nextDisabled: wbtn('next').disabled,
      eyebrow: document.querySelector('.hero .eyebrow').textContent, cards: document.querySelectorAll('.wiz-card').length, ask: /Ask:/.test(document.querySelector('.wiz-card').innerText) };`);
  check('See It wizard: one step shown (Step 1 of 5: Worked examples); steps 2–5 locked; Next Step locked', wiz0.cards === 1 && wiz0.count === 'Step 1 of 5' && wiz0.title === 'Worked examples' && JSON.stringify(wiz0.steps) === JSON.stringify(['current', 'locked', 'locked', 'locked', 'locked']) && wiz0.nextDisabled, wiz0);
  check('See It: header does not show a competing "Step 2 of 5"; no parent "Ask:" lines on the child screen', !/Step \d of/.test(wiz0.eyebrow) && !wiz0.ask, wiz0);
  const demo = await js(`
    const body = document.querySelector('#demo-body');
    const counts = () => ['thousand','hundred','ten','one'].map((k) => body.querySelectorAll('[data-block="' + k + '"]').length);
    const first = { counts: counts(), step: document.querySelector('#demo-count').textContent, prevDisabled: document.querySelector('#demo-prev').disabled };
    for (let i = 0; i < 10; i++) document.querySelector('#demo-next').click();
    const last = { step: document.querySelector('#demo-count').textContent, nextDisabled: document.querySelector('#demo-next').disabled, text: body.innerText };
    document.querySelector('.seg-btn[data-ex="2"]').click();
    const zero = { counts: counts(), step: document.querySelector('#demo-count').textContent };
    for (let i = 0; i < 2; i++) document.querySelector('#demo-next').click();
    zero.note = body.querySelector('.demo-say').textContent;
    return { first, last, zero };`);
  check('See It step 1: 2,137 shows 2 thousands, 1 hundred, 3 tens, 7 ones', JSON.stringify(demo.first.counts) === '[2,1,3,7]', demo.first);
  check('See It step 1: parts advance one at a time and stop at the end', demo.first.step === 'Part 1 of 7' && demo.first.prevDisabled && demo.last.step === 'Part 7 of 7' && demo.last.nextDisabled, demo);
  check('See It step 1: final part shows expanded and word form', demo.last.text.includes('2,000 + 100 + 30 + 7 = 2,137') && demo.last.text.includes('two thousand, one hundred thirty-seven'), demo.last.text);
  check('See It step 1: 5,072 example shows 0 hundred flats and explains the zero', JSON.stringify(demo.zero.counts) === '[5,0,7,2]' && /0 is in the hundreds place/.test(demo.zero.note), demo.zero);

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
    return { q1: { prompt: q1.prompt, display: q1.display, type: q1.type, answer: q1.answer }, empty, once, twice, fresh, right: feedback(), next: !wbtn('next').disabled, steps: steps(), done: W().done };`);
  check('Check: the step-1 check uses a new number in word form with a zero (not 2,137, 4,628, or 5,072)', c1.q1.type === 'chart' && ![2137, 4628, 5072].includes(c1.q1.answer) && pv_hasZero(c1.q1.answer), c1.q1);
  check('Check: empty answer is caught; a wrong answer gets a clue and Try Again — the answer is not revealed; Next stays locked', c1.empty && /Not quite/.test(c1.once.fb) && c1.once.again && !c1.once.reveals && c1.once.next && c1.once.locked, c1.once);
  check('Check: second miss teaches the answer and offers a new question; the step is not complete yet', /The answer is/.test(c1.twice.fb) && c1.twice.newBtn && c1.twice.next && !c1.twice.done, c1.twice);
  check('Check: the new question is different and blank; a right answer completes the step and unlocks Next Step', c1.fresh.differs && c1.fresh.blank && c1.fresh.noFb && /Correct|You got it/.test(c1.right) && c1.next && c1.done.examples === true && c1.steps[0] === 'done' && c1.steps[1] === 'open', c1);

  await js(`document.querySelector('[data-wiz="next"]').click();`);
  const builder = await js(`
    const st = document.querySelectorAll('.builder-top .stepper');
    st[1].querySelector('[data-step="1"]').click(); st[1].querySelector('[data-step="1"]').click();
    st[3].querySelector('[data-step="-1"]').click();
    const out = document.querySelector('#bld-out');
    const a = { title: document.querySelector('.wiz-card h2').textContent, count: document.querySelector('.wiz-count').textContent, text: out.innerText, input: document.querySelector('#bld-input').value,
      counts: ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length) };
    const inp = document.querySelector('#bld-input'); inp.value = '9,050'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    a.typed = ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length);
    a.typedText = out.innerText;
    return a;`);
  check('Step 2 of 5: Build your own number — + / − update number, blocks, and forms (2,137 → 2,336)', builder.count === 'Step 2 of 5' && builder.title === 'Build your own number' && builder.input === '2,336' && JSON.stringify(builder.counts) === '[2,3,3,6]' && builder.text.includes('2,000 + 300 + 30 + 6') && builder.text.includes('two thousand, three hundred thirty-six'), builder);
  check('Step 2: typing 9,050 rebuilds the model', JSON.stringify(builder.typed) === '[9,0,5,0]' && builder.typedText.includes('nine thousand, fifty'), builder);
  const c2 = await js(`${WIZ} const q = curQ(); answer(true); return { type: q.type, fb: feedback(), next: !wbtn('next').disabled };`);
  check('Step 2 check: build a new number with blocks; right on the first try completes the step', c2.type === 'build' && /Correct/.test(c2.fb) && c2.next, c2);

  await b.reload(); await hash('#see');
  const after = await js(`${WIZ} return { count: document.querySelector('.wiz-count').textContent, steps: steps(), next: !wbtn('next').disabled, fb: feedback() };`);
  check('Refresh: stays on step 2, both completed steps kept, Next Step still unlocked', after.count === 'Step 2 of 5' && after.steps[0] === 'done' && after.steps[1] === 'done' && after.steps[2] === 'open' && after.steps[3] === 'locked' && after.next && /Correct/.test(after.fb), after);
  const backTo = await js(`${WIZ} wbtn('back').click();
    const s = { count: document.querySelector('.wiz-count').textContent, fb: feedback(), locked: Array.from(qel().querySelectorAll('input')).every((i) => i.disabled), another: !!wbtn('another'), next: !wbtn('next').disabled };
    const before = JSON.stringify(curQ()); wbtn('another').click();
    s.newQ = JSON.stringify(curQ()) !== before; s.stillDone = W().done.examples === true && !wbtn('next').disabled; s.stepsAfter = steps();
    return s;`);
  check('Back: completed step 1 shows its result (locked), "Try another one" gives new practice without losing completion', backTo.count === 'Step 1 of 5' && /You got it|Correct/.test(backTo.fb) && backTo.locked && backTo.another && backTo.next && backTo.newQ && backTo.stillDone && backTo.stepsAfter[1] === 'done', backTo);

  await js(`document.querySelector('[data-go="2"]').click();`);
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
  const ten = await js(`${WIZ} const blocks = document.querySelectorAll('.wiz-demo .chain-item').length; const q = curQ(); answer(true);
    return { count: document.querySelector('.wiz-count').textContent, blocks, prompt: q.prompt, answer: q.answer, fb: feedback(), next: !wbtn('next').disabled };`);
  check('Step 4 of 5: Groups of ten — unit, rod, flat, cube shown; its check (answer 10, 100, or 1,000) completes the step', ten.count === 'Step 4 of 5' && ten.blocks === 4 && [10, 100, 1000].includes(ten.answer) && /Correct/.test(ten.fb) && ten.next, ten);

  await js(`document.querySelector('[data-wiz="next"]').click();`);
  const c5 = await js(`${WIZ} const text = document.querySelector('.wiz-demo').innerText; const finishLocked = document.querySelector('[data-wiz="finish"]').classList.contains('is-disabled');
    const q = curQ(); answer(true);
    return { count: document.querySelector('.wiz-count').textContent, text: text.slice(0, 300), finishLocked, prompt: q.prompt, answer: q.answer, fb: feedback(), finish: document.querySelector('[data-wiz="finish"]').getAttribute('href'), finishOpen: !document.querySelector('[data-wiz="finish"]').classList.contains('is-disabled'), done: W().done };`);
  check('Step 5 of 5: greatest 8,641 and smallest 1,468 from 4, 1, 8, 6 (audit B-11)', c5.count === 'Step 5 of 5' && /Greatest number: 8,641/.test(c5.text) && /Smallest number: 1,468/.test(c5.text), c5.text);
  check('Step 5 check: new digits (not 4,1,8,6 / 2,8,4,1 / 3,9,5,7); finishing is locked until it is answered, then opens Practice It', c5.finishLocked && !/digits (4, 1, 8, and 6|2, 8, 4, and 1|3, 9, 5, and 7) /.test(c5.prompt) && /Correct/.test(c5.fb) && c5.finishOpen && c5.finish === '#practice' && Object.keys(c5.done).length === 5, c5);

  // ----- Practice It -----
  await hash('#practice');
  const vocabP = await js(`${FILL_HELPERS}
    const box = document.querySelector('#vocab-runner');
    const el = box.querySelector('.q[data-qkey]');
    const key = el.dataset.qkey.replace('vp-', '');
    const all = []; let q;
    // Read the first vocabulary item from the rendered prompt by asking the runner: answer wrong, then right.
    return { hasHint: !!box.querySelector('[data-act=hint]'), dots: box.querySelectorAll('.dot').length };`);
  check('Vocabulary practice: 10 items with hints before the test (audit B-03)', vocabP.hasHint && vocabP.dots === 10, vocabP);
  const guided = await js(`${FILL_HELPERS}
    const box = document.querySelector('#guided-runner');
    const q = L.guided[0];
    const el = box.querySelector('.q[data-qkey]');
    fill(el, q, false);
    box.querySelector('[data-act=check]').click();
    const wrongMsg = box.querySelector('.result-box').innerText;
    box.querySelector('[data-act=hint]').click();
    const afterHint = box.querySelector('.result-box').innerText;
    fill(el, q, true);
    box.querySelector('[data-act=check]').click();
    const rightMsg = box.querySelector('.result-box').innerText;
    box.querySelector('[data-act=next]').click();
    const second = box.querySelector('.q-prompt').innerText;
    return { wrongMsg, afterHint, rightMsg, hint: !box.querySelector('.hint-box').hidden, second, dots: box.querySelectorAll('.dot').length };`);
  check('Guided: wrong answer can be corrected; correct answer explained; 7 problems', /Not yet/.test(guided.wrongMsg) && /Correct/.test(guided.rightMsg) && /3,052/.test(guided.second) && guided.dots === 7, guided);
  check('Guided: hint is not repeated in the feedback once shown (audit B-14)', /Hint:/.test(guided.wrongMsg) && !/Hint:/.test(guided.afterHint), guided);

  // ----- Practice bank: five sets of 10 + Practice My Misses -----
  const BANK = `const B = () => JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets') || '{}');
    const qEls = () => Array.from(document.querySelectorAll('#indep .q[data-qkey]'));
    const shownIds = () => qEls().map((e) => e.dataset.qkey.replace('p-', ''));`;
  const grid = await js(`${FILL_HELPERS} ${BANK}
    return { cards: Array.from(document.querySelectorAll('.set-card h3')).map((h) => h.textContent), status: Array.from(document.querySelectorAll('.set-status')).map((s) => s.innerText.trim()),
      empty: /Choose a set/.test(document.querySelector('#indep').innerText), bank: L.bank.length };`);
  check('Practice bank: 5 labeled sets, all "Not started"; bank has 50', JSON.stringify(grid.cards) === JSON.stringify(['Place and Digit Value', 'Base-Ten Models', 'Standard Form', 'Expanded and Word Form', 'Mixed Review and Reasoning']) && grid.status.every((s) => s === 'Not started') && grid.empty && grid.bank === 50, grid);

  const set2 = await js(`${FILL_HELPERS} ${BANK}
    document.querySelector('[data-open-set="s2"]').click();
    const ids = shownIds(); const expected = L.bankSets[1].ids;
    document.querySelector('#check-set').click();
    const blocked = document.querySelector('#indep .error-box').innerText;
    // Answer: first 3 wrong, rest right.
    qEls().forEach((el, i) => fill(el, L.bank.find((q) => q.id === ids[i]), i >= 3));
    document.querySelector('#check-set').click();
    const st = B().s2;
    return { n: ids.length, unique: new Set(ids).size, sameSet: ids.slice().sort().join() === expected.slice().sort().join(), hints: document.querySelectorAll('#indep [data-act=hint], #indep .hint-box').length,
      blocked, score: document.querySelector('.set-score').innerText, wrong: document.querySelectorAll('#indep .feedback-no').length,
      explained: Array.from(document.querySelectorAll('#indep .feedback-no')).every((f) => /Correct answer:[\\s\\S]*Why:/.test(f.innerText)),
      missesBtn: document.querySelector('#practice-misses')?.innerText, card: document.querySelectorAll('.set-card')[1].innerText, attempts: st.attempts.length, firstOrder: ids, missed: ids.slice(0, 3) };`);
  check('Set 2: 10 different questions, exactly the Base-Ten Models set, no hints', set2.n === 10 && set2.unique === 10 && set2.sameSet && set2.hints === 0, set2);
  check('Set 2: must answer all 10; then 7 of 10 with explanations for each miss', /Answer every question/.test(set2.blocked) && /7 of 10 correct/.test(set2.score) && set2.wrong === 3 && set2.explained, set2);
  check('Set card shows Completed and the score', /Completed/.test(set2.card) && /Last score 7\/10/.test(set2.card) && /Best 7\/10/.test(set2.card) && set2.attempts === 1, set2.card);
  check('"Practice My Misses (3)" appears after checking', set2.missesBtn === 'Practice My Misses (3)', set2.missesBtn);

  const retry1 = await js(`${FILL_HELPERS} ${BANK}
    document.querySelector('#practice-misses').click();
    const ids = shownIds(); const text = document.querySelector('#indep').innerText;
    const qs = ids.map((id) => L.bank.find((q) => q.id === id));
    return { ids, title: document.querySelector('.set-title').innerText, onYourOwn: /On your own/.test(text),
      answered: qs.filter((q, i) => Q.isAnswered(q, Q.read(qEls()[i], q))).length, feedback: document.querySelectorAll('#indep .feedback').length,
      revealsAnswer: /Correct answer:/.test(text) || qs.some((q) => text.includes(q.explanation)), hints: document.querySelectorAll('#indep [data-act=hint]').length };`);
  check('Practice My Misses: only the 3 missed questions', retry1.ids.length === 3 && retry1.ids.slice().sort().join() === set2.missed.slice().sort().join() && /Practice My Misses \(3 questions\)/.test(retry1.title), retry1);
  check('Practice My Misses: starts unanswered; no correct answers, explanations, or hints shown before checking', retry1.answered === 0 && retry1.feedback === 0 && !retry1.revealsAnswer && retry1.hints === 0 && retry1.onYourOwn, retry1);

  await js(`${FILL_HELPERS} ${BANK} fill(qEls()[0], L.bank.find((q) => q.id === shownIds()[0]), true);`);
  await b.reload();
  const retryRefresh = await js(`${FILL_HELPERS} ${BANK}
    const ids = shownIds(); const qs = ids.map((id) => L.bank.find((q) => q.id === id));
    return { same: ids.join() === ${JSON.stringify(retry1.ids.join())}, title: document.querySelector('.set-title')?.innerText, answered: qs.filter((q, i) => Q.isAnswered(q, Q.read(qEls()[i], q))).length };`);
  check('Refresh mid-retry: same 3 questions, the 1 answer kept', retryRefresh.same && /Practice My Misses/.test(retryRefresh.title) && retryRefresh.answered === 1, retryRefresh);

  const retry1Done = await js(`${FILL_HELPERS} ${BANK}
    const ids = shownIds(); qEls().forEach((el, i) => fill(el, L.bank.find((q) => q.id === ids[i]), i < 2));
    document.querySelector('#check-set').click();
    const st = B().s2;
    return { score: document.querySelector('.set-score').innerText, explained: document.querySelectorAll('#indep .feedback').length, wrongIds: [ids[2]],
      original: st.attempts[0].score, originalCorrect: st.attempts[0].correct.filter(Boolean).length, retries: st.retries.length, parentOk: st.retries[0].parentId === st.attempts[0].id,
      card: document.querySelectorAll('.set-card')[1].innerText, again: document.querySelector('#practice-misses')?.innerText };`);
  check('Retry checked: "2 of 3 now correct", explanations for all 3', /Practice My Misses: 2 of 3 now correct/.test(retry1Done.score) && retry1Done.explained === 3, retry1Done);
  check('Original attempt preserved (7/10) and improvement tracked separately (fixed 2 of 3)', retry1Done.original === 7 && retry1Done.originalCorrect === 7 && retry1Done.retries === 1 && retry1Done.parentOk && /original attempt stays 7\/10/.test(retry1Done.score) && /Misses fixed so far: 2 of 3/.test(retry1Done.score) && /Misses fixed 2 of 3/.test(retry1Done.card), retry1Done);
  const retry2 = await js(`${FILL_HELPERS} ${BANK}
    document.querySelector('#practice-misses').click();
    const ids = shownIds(); qEls().forEach((el, i) => fill(el, L.bank.find((q) => q.id === ids[i]), true));
    document.querySelector('#check-set').click();
    return { ids, score: document.querySelector('.set-score').innerText, card: document.querySelectorAll('.set-card')[1].innerText, noMoreMisses: !document.querySelector('#practice-misses') };`);
  check('Practice My Misses again: only the 1 still-missed question; then all misses fixed (3 of 3)', retry1Done.again === 'Practice My Misses (1)' && JSON.stringify(retry2.ids) === JSON.stringify(retry1Done.wrongIds) && /1 of 1 now correct/.test(retry2.score) && /Misses fixed so far: 3 of 3/.test(retry2.score) && retry2.noMoreMisses && /Last score 7\/10/.test(retry2.card), retry2);

  await b.reload(); await hash('#teach'); await hash('#practice');
  const bankPersisted = await js(`${FILL_HELPERS} ${BANK} return { title: document.querySelector('.set-title')?.innerText, score: document.querySelector('.set-score')?.innerText, card: document.querySelectorAll('.set-card')[1].innerText, locked: Array.from(document.querySelectorAll('#indep input')).every((i) => i.disabled) };`);
  check('Refresh and navigation: checked retry, set status, and scores are kept; answers locked', /Practice My Misses/.test(bankPersisted.title) && /1 of 1 now correct/.test(bankPersisted.score) && /Completed/.test(bankPersisted.card) && /Misses fixed 3 of 3/.test(bankPersisted.card) && bankPersisted.locked, bankPersisted);

  const again = await js(`${FILL_HELPERS} ${BANK}
    const orders = [];
    for (let k = 0; k < 3; k++) { document.querySelector('#set-again') ? document.querySelector('#set-again').click() : document.querySelector('[data-open-set="s2"]').click(); orders.push(shownIds().join());
      if (k < 2) { const ids = shownIds(); qEls().forEach((el, i) => fill(el, L.bank.find((q) => q.id === ids[i]), true)); document.querySelector('#check-set').click(); } }
    const ids = shownIds(); const qs = ids.map((id) => L.bank.find((q) => q.id === id));
    return { differs: orders.some((o) => o !== ${JSON.stringify(set2.firstOrder.join())}), unique: new Set(ids).size, answered: qs.filter((q, i) => Q.isAnswered(q, Q.read(qEls()[i], q))).length,
      attempts: B().s2.attempts.map((a) => a.score), card: document.querySelectorAll('.set-card')[1].innerText };`);
  check('Practice this set again: new random order, 10 unique questions, unanswered; earlier attempts kept (7, 10, 10)', again.differs && again.unique === 10 && again.answered === 0 && JSON.stringify(again.attempts) === '[7,10,10]' && /In progress/.test(again.card) && /Best 10\/10/.test(again.card), again);

  const switching = await js(`${FILL_HELPERS} ${BANK}
    const ids2 = shownIds(); fill(qEls()[0], L.bank.find((q) => q.id === ids2[0]), true);
    document.querySelector('[data-open-set="s1"]').click(); const s1 = shownIds();
    document.querySelector('[data-open-set="s2"]').click(); const back = shownIds();
    const q0 = L.bank.find((q) => q.id === back[0]);
    return { s1ok: s1.slice().sort().join() === L.bankSets[0].ids.slice().sort().join(), sameOrder: back.join() === ids2.join(), kept: Q.isAnswered(q0, Q.read(qEls()[0], q0)), label: document.querySelector('[data-open-set="s2"]').innerText };`);
  check('Switching sets: Set 1 opens its own 10; returning to Set 2 continues with the answer kept', switching.s1ok && switching.sameOrder && switching.kept && switching.label === 'Continue', switching);

  const allSets = await js(`${FILL_HELPERS} ${BANK}
    const out = {};
    for (const s of L.bankSets) {
      document.querySelector('[data-open-set="' + s.id + '"]').click();
      if (!document.querySelector('#check-set')) document.querySelector('#set-again').click();
      const ids = shownIds(); qEls().forEach((el, i) => fill(el, L.bank.find((q) => q.id === ids[i]), true));
      document.querySelector('#check-set').click();
      out[s.id] = { score: document.querySelector('.set-score').innerText.match(/(\\d+) of (\\d+)/).slice(1).join('/'), same: ids.slice().sort().join() === s.ids.slice().sort().join() };
    }
    return { out, done: Array.from(document.querySelectorAll('.set-status')).map((s) => s.innerText.trim()) };`);
  check('All 5 sets through the UI: every one of the 50 questions graded correct (10/10 each)', Object.values(allSets.out).every((x) => x.score === '10/10' && x.same) && allSets.done.every((d) => d === 'Completed'), allSets);

  // ----- Test It: focus mode, required answers, switching tests -----
  await hash('#test');
  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const blocked = await js(`${FILL_HELPERS}
    const n = document.querySelectorAll('#test-form .q[data-qkey]').length;
    const hints = document.querySelectorAll('#test-form .hint-box, #test-form [data-act=hint]').length;
    const tabsHidden = getComputedStyle(document.querySelector('.stagebar')).display === 'none';
    const banner = getComputedStyle(document.querySelector('.test-banner')).display !== 'none';
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 200));
    return { n, hints, tabsHidden, banner, err: document.querySelector('#test-form .error-box').innerText, flagged: document.querySelectorAll('.needs-answer').length,
      saved: (JSON.parse(localStorage.getItem(L.storageKey + ':attempts')) || []).length, types: [...new Set(JSON.parse(localStorage.getItem(L.storageKey + ':draft-math')).questions.map((q) => q.type))] };`);
  check('Math Test: 10 questions, several types, no hints', blocked.n === 10 && blocked.hints === 0 && blocked.types.length >= 4, blocked);
  check('Test focus mode: lesson tabs hidden, test banner shown (audit B-04)', blocked.tabsHidden && blocked.banner, blocked);
  check('Math Test: cannot submit until every question is answered', /answer every question/i.test(blocked.err) && blocked.flagged === 10 && blocked.saved === 0, blocked);
  await b.viewport(390, 844, true);
  await b.shot(path.join(SHOTS, 'test-math-phone.png'));
  await b.viewport(1280, 900, false);

  const resumed = await js(`${FILL_HELPERS}
    const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-math')); const els = document.querySelectorAll('#test-form .q[data-qkey]');
    d.questions.slice(0, 3).forEach((q, i) => fill(els[i], q, true));
    return document.querySelector('#answered').textContent;`);
  await b.reload();
  const chooser = await js(`return { focusOff: !document.body.classList.contains('is-testing'), resumeLabel: document.querySelector('[data-start="math"]').innerText, vocabStart: !!document.querySelector('[data-start="vocab"]') };`);
  check('Refresh mid-test returns to the chooser with Resume; the other test can be started (audit T06)', chooser.focusOff && /Resume/.test(chooser.resumeLabel) && chooser.vocabStart, chooser);
  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const afterReload = await js(`return document.querySelector('#answered')?.textContent;`);
  check('Unfinished test answers survive a refresh', resumed === '3 of 10 answered' && afterReload === '3 of 10 answered', { resumed, afterReload });
  await js(`document.querySelector('.test-banner [data-exit]').click();`);
  await wait(200);
  const exited = await js(`return { tabs: getComputedStyle(document.querySelector('.stagebar')).display !== 'none', chooser: !!document.querySelector('[data-start="vocab"]') };`);
  check('"Save and finish later" leaves focus mode and returns to the chooser', exited.tabs && exited.chooser, exited);
  await js(`history.back();`); await wait(300); await hash('#test');
  check('Leaving Test It by any route never traps the other test (T06 regression)', await js(`return !!document.querySelector('[data-start="vocab"]') && !!document.querySelector('[data-start="math"]');`));

  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const perfect = await js(`${FILL_HELPERS}
    const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-math')); const els = document.querySelectorAll('#test-form .q[data-qkey]');
    d.questions.forEach((q, i) => fill(els[i], q, true));
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts'));
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail').innerText, tabs: getComputedStyle(document.querySelector('.stagebar')).display !== 'none' };`);
  const missedQs = perfect.last.questions.filter((q, i) => !perfect.last.correct[i]).map((q) => ({ q, r: perfect.last.responses[q.id] }));
  check('Math Test: all-correct answers score 10/10 = 100% Mastered', perfect.hash === '#results' && perfect.last.score === 10 && perfect.last.pct === 100 && /Mastered/.test(perfect.text), { score: perfect.last.score, missedQs });
  check('Paused-and-resumed count is recorded on the attempt', perfect.last.pauses >= 1 && /paused and resumed/.test(perfect.text), perfect.last.pauses);
  check('Focus mode ends after submitting', perfect.tabs);
  await b.shot(path.join(SHOTS, 'results-mastered-desktop.png'));

  const zero = await takeTest('math', 0);
  check('Math Test retake uses new numbers', JSON.stringify(zero.last.questions) !== JSON.stringify(perfect.last.questions));
  check('Math Test: all-wrong scores 0% Reteach with 10 explained mistakes', zero.last.score === 0 && /Reteach and reassess/.test(zero.text) && /Mistakes to review \(10\)/.test(zero.text), zero.text.slice(0, 300));
  const vocab = await takeTest('vocab', 8);
  check('Vocabulary Test: 8 of 10 → 80% Review missed skills', vocab.last.score === 8 && vocab.last.pct === 80 && /Review missed skills/.test(vocab.text) && /Mistakes to review \(2\)/.test(vocab.text), vocab.text.slice(0, 300));
  check('Results list skills to review with a next action', /Skills to review/.test(vocab.text) && /(Practice this skill|Vocabulary practice)/.test(vocab.text), vocab.text);
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
  const persisted = await js(`return { rows: document.querySelectorAll('.history tbody tr').length, local: /only in this browser/.test(document.body.innerText) };`);
  check('Results and history persist after refresh (6 attempts)', persisted.rows === 6 && persisted.local, persisted);
  const jumpPractice = await js(`${FILL_HELPERS}
    const b = document.querySelector('[data-practice]');
    if (!b) return { skipped: true };
    const skill = b.dataset.practice; const label = b.innerText; b.click();
    await new Promise((r) => setTimeout(r, 400));
    const open = localStorage.getItem(L.storageKey + ':bank-open') && JSON.parse(localStorage.getItem(L.storageKey + ':bank-open'));
    const set = L.bankSets.find((x) => x.id === open);
    const shown = Array.from(document.querySelectorAll('#indep .q[data-qkey]')).map((e) => e.dataset.qkey.replace('p-', ''));
    const counts = L.bankSets.map((x) => x.ids.filter((id) => L.bank.find((q) => q.id === id).skill === skill).length);
    const h = document.querySelector('#independent h2').getBoundingClientRect(); const bar = document.querySelector('.stagebar').getBoundingClientRect();
    return { hash: location.hash, skill, label, setIndex: L.bankSets.indexOf(set), counts, shownInSet: shown.length === 10 && shown.every((id) => set.ids.includes(id)), hasSkill: shown.some((id) => L.bank.find((q) => q.id === id).skill === skill), visible: h.top >= bar.bottom };`);
  check('"Practice this skill" opens the set with the most questions on that skill, heading visible', jumpPractice.hash === '#practice' && jumpPractice.shownInSet && jumpPractice.hasSkill && jumpPractice.counts[jumpPractice.setIndex] === Math.max(...jumpPractice.counts) && jumpPractice.label.includes(`Set ${jumpPractice.setIndex + 1}`) && jumpPractice.visible, jumpPractice);

  // ----- Home: Continue Learning from real progress -----
  await hash('#test');
  await js(`document.querySelector('[data-start="vocab"]').click();`); await wait(200);
  await js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); fill(document.querySelectorAll('#test-form .q[data-qkey]')[0], d.questions[0], true);`);
  await b.load(O + BASE);
  const cont = await js(`return { shown: !document.getElementById('continue').hidden, links: Array.from(document.querySelectorAll('#continue-list a')).map((a) => a.textContent + ' ' + a.getAttribute('href')), badge: document.querySelector('#status-2-1').textContent };`);
  check('Home: Continue Learning shows the real last activity and the unfinished test', cont.shown && cont.links.some((l) => /Continue: Lesson 2-1/.test(l)) && cont.links.some((l) => /Resume unfinished Lesson 2-1 Vocabulary Test \(1 of 10 answered\)/.test(l)), cont);
  check('Home shows latest Math Test status', /Math Test: 60%/.test(cont.badge), cont.badge);
  await b.navigate(`document.querySelector('#continue-list a').click();`);
  check('Continue Learning link opens the saved place', await js(`return location.pathname.endsWith('/lesson-2-1/') && location.hash === '#test'`));

  // ----- Clear progress -----
  await b.load(O + LESSON + '#results');
  await js(`localStorage.setItem('mathbook:v2:number-words:phase-1:attempts', '[{"score":9}]');`);
  const cleared = await js(`
    document.querySelector('#clear').click();
    const asked = !!document.querySelector('#clear-yes');
    document.querySelector('#clear-yes').click();
    return { asked, lessonKeys: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).length, nwKept: !!localStorage.getItem('mathbook:v2:number-words:phase-1:attempts'), text: document.querySelector('h2').innerText };`);
  check('Clear progress asks first, removes only this lesson (Number Words kept)', cleared.asked && cleared.lessonKeys === 0 && cleared.nwKept && /No test results yet/.test(cleared.text), cleared);

  // ----- Layout at phone, tablet, desktop -----
  for (const [name, w, h] of [['phone', 390, 844], ['tablet', 820, 1180], ['desktop', 1280, 900], ['small-phone', 320, 568], ['short', 640, 360]]) {
    await b.viewport(w, h);
    for (const stage of ['teach', 'see', 'practice', 'test', 'results']) {
      await hash('#' + stage);
      // Set 2 holds the widest controls (block steppers): use it for layout checks.
      if (stage === 'practice') await js(`document.querySelector('[data-open-set="s2"]').click(); if (!document.querySelector('#check-set')) document.querySelector('#set-again').click();`);
      await noHorizontalScroll(`${stage} @ ${name} ${w}×${h}`);
      if (name === 'phone' || name === 'desktop') await b.shot(path.join(SHOTS, `${stage}-${name}.png`));
    }
    const sticky = await js(`return getComputedStyle(document.querySelector('.stagebar')).position`);
    if (name === 'short') check('Short screens: stage bar is not sticky (audit B-09)', sticky === 'static', sticky);
  }
  await b.viewport(390, 844);
  await b.load(O + BASE);
  await noHorizontalScroll('home @ phone');
  await b.shot(path.join(SHOTS, 'home-phone.png'));
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await b.shot(path.join(SHOTS, 'home-desktop.png'));

  // ----- Stress: all-correct attempts must always score 100% -----
  await b.load(O + LESSON + '#test');
  const scores = [];
  for (let i = 0; i < 20; i++) {
    for (const id of ['math', 'vocab']) {
      const a = await takeTest(id, 10);
      if (a.last.score !== 10) scores.push({ id, missed: a.last.questions.filter((q, k) => !a.last.correct[k]).map((q) => ({ q, r: a.last.responses[q.id] })) });
    }
  }
  check('40 all-correct test attempts (20 Math, 20 Vocabulary) all score 100%', scores.length === 0, scores);

  // ----- Accessibility basics -----
  const kb = await js(`return { links: document.querySelectorAll('.stagebar a[href]').length,
    unlabeled: Array.from(document.querySelectorAll('button, input, select')).filter((e) => !(e.innerText || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label'))).length };`);
  check('Keyboard/screen reader: 5 stage links, every control labeled', kb.links === 5 && kb.unlabeled === 0, kb);
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
