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
  await js(`document.querySelector('.hero-actions a').click();`);
  await wait(700);
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

  // ----- See It -----
  await hash('#teach'); await hash('#see');
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
  check('See It: 2,137 shows 2 thousands, 1 hundred, 3 tens, 7 ones', JSON.stringify(demo.first.counts) === '[2,1,3,7]', demo.first);
  check('See It: steps advance one at a time and stop at the end', demo.first.step === 'Step 1 of 7' && demo.first.prevDisabled && demo.last.step === 'Step 7 of 7' && demo.last.nextDisabled, demo);
  check('See It: final step shows expanded and word form', demo.last.text.includes('2,000 + 100 + 30 + 7 = 2,137') && demo.last.text.includes('two thousand, one hundred thirty-seven'), demo.last.text);
  check('See It: 5,072 example shows 0 hundred flats and explains the zero', JSON.stringify(demo.zero.counts) === '[5,0,7,2]' && /0 is in the hundreds place/.test(demo.zero.note), demo.zero);
  const builder = await js(`
    const st = document.querySelectorAll('#builder .stepper');
    st[1].querySelector('[data-step="1"]').click(); st[1].querySelector('[data-step="1"]').click();
    st[3].querySelector('[data-step="-1"]').click();
    const out = document.querySelector('#bld-out');
    const a = { text: out.innerText, input: document.querySelector('#bld-input').value,
      counts: ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length) };
    const inp = document.querySelector('#bld-input'); inp.value = '9,050'; inp.dispatchEvent(new Event('input', { bubbles: true }));
    a.typed = ['thousand','hundred','ten','one'].map((k) => out.querySelectorAll('[data-block="' + k + '"]').length);
    a.typedText = out.innerText;
    return a;`);
  check('Builder: + / − update number, blocks, and forms (2,137 → 2,336)', builder.input === '2,336' && JSON.stringify(builder.counts) === '[2,3,3,6]' && builder.text.includes('2,000 + 300 + 30 + 6') && builder.text.includes('two thousand, three hundred thirty-six'), builder);
  check('Builder: typing 9,050 rebuilds the model', JSON.stringify(builder.typed) === '[9,0,5,0]' && builder.typedText.includes('nine thousand, fifty'), builder);
  const change = await js(`
    const out = document.querySelector('#change-out');
    document.querySelector('[data-delta="100"]').click(); const a = out.innerText;
    document.querySelector('[data-delta="-10"]').click(); const b = out.innerText;
    document.querySelector('#change-reset').click();
    for (let i = 0; i < 8; i++) document.querySelector('[data-delta="1000"]').click();
    const capped = { text: out.querySelector('.change-eq').innerText, disabled: document.querySelector('[data-delta="1000"]').disabled };
    return { a, b, capped };`);
  check('Change one place: 4,125 + 100 = 4,225, then − 10 = 4,215; only one digit changes', /4,125 \+ 100 = 4,225/.test(change.a) && /hundreds digit changed: 1 became 2/.test(change.a) && /4,225 − 10 = 4,215/.test(change.b), change);
  check('Change one place: buttons that would need regrouping are disabled (stops at 9,125)', /= 9,125/.test(change.capped.text) && change.capped.disabled, change.capped);
  const challenge = await js(`return document.querySelector('#challenge').innerText;`);
  check('Challenge: greatest 8,641 and smallest 1,468 from 4, 1, 8, 6 (audit B-11)', /Greatest number: 8,641/.test(challenge) && /Smallest number: 1,468/.test(challenge), challenge.slice(0, 200));

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

  const indep = await js(`${FILL_HELPERS}
    document.querySelector('#new-set').click();
    const set = JSON.parse(localStorage.getItem(L.storageKey + ':practice'));
    document.querySelector('#check-set').click();
    const blocked = document.querySelector('#indep .error-box').innerText;
    const qs = set.ids.map((id) => L.bank.find((q) => q.id === id));
    const els = document.querySelectorAll('#indep .q[data-qkey]');
    qs.forEach((q, i) => fill(els[i], q, i !== 0));
    document.querySelector('#check-set').click();
    return { n: set.ids.length, blocked, score: document.querySelector('.set-score').innerText,
      wrong: document.querySelectorAll('#indep .feedback-no').length, ok: document.querySelectorAll('#indep .feedback-ok').length };`);
  check('Independent: set of 10 from the 50-question bank; must answer all; scored with explanations', indep.n === 10 && /Answer every question/.test(indep.blocked) && /9 of 10 correct/.test(indep.score) && indep.wrong === 1 && indep.ok === 9, indep);
  const skillSet = await js(`${FILL_HELPERS}
    const sel = document.querySelector('#skill-filter'); sel.value = 'expanded'; document.querySelector('#new-set').click();
    const s = JSON.parse(localStorage.getItem(L.storageKey + ':practice'));
    return { n: s.ids.length, all: s.ids.every((id) => L.bank.find((q) => q.id === id).skill === 'expanded'), bank: L.bank.length };`);
  check('Independent: skill filter builds a skill-only set; bank still has 50', skillSet.all && skillSet.n === 5 && skillSet.bank === 50, skillSet);

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
  await js('location.reload();');
  await wait(700);
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

  await js('location.reload();');
  await wait(700);
  const persisted = await js(`return { rows: document.querySelectorAll('.history tbody tr').length, local: /only in this browser/.test(document.body.innerText) };`);
  check('Results and history persist after refresh (6 attempts)', persisted.rows === 6 && persisted.local, persisted);
  const jumpPractice = await js(`${FILL_HELPERS}
    const b = document.querySelector('[data-practice]');
    if (!b) return { skipped: true };
    const skill = b.dataset.practice; b.click();
    await new Promise((r) => setTimeout(r, 400));
    const s = JSON.parse(localStorage.getItem(L.storageKey + ':practice'));
    const h = document.querySelector('#independent h2').getBoundingClientRect(); const bar = document.querySelector('.stagebar').getBoundingClientRect();
    return { hash: location.hash, skill, ok: s.skill === skill && s.ids.every((id) => L.bank.find((q) => q.id === id).skill === skill), filter: document.querySelector('#skill-filter').value, visible: h.top >= bar.bottom };`);
  check('"Practice this skill" opens a set for that skill, heading visible', jumpPractice.hash === '#practice' && jumpPractice.ok && jumpPractice.filter === jumpPractice.skill && jumpPractice.visible, jumpPractice);

  // ----- Home: Continue Learning from real progress -----
  await hash('#test');
  await js(`document.querySelector('[data-start="vocab"]').click();`); await wait(200);
  await js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); fill(document.querySelectorAll('#test-form .q[data-qkey]')[0], d.questions[0], true);`);
  await b.load(O + BASE);
  const cont = await js(`return { shown: !document.getElementById('continue').hidden, links: Array.from(document.querySelectorAll('#continue-list a')).map((a) => a.textContent + ' ' + a.getAttribute('href')), badge: document.querySelector('#status-2-1').textContent };`);
  check('Home: Continue Learning shows the real last activity and the unfinished test', cont.shown && cont.links.some((l) => /Continue: Lesson 2-1/.test(l)) && cont.links.some((l) => /Resume unfinished Lesson 2-1 Vocabulary Test \(1 of 10 answered\)/.test(l)), cont);
  check('Home shows latest Math Test status', /Math Test: 60%/.test(cont.badge), cont.badge);
  await js(`document.querySelector('#continue-list a').click();`); await wait(700);
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
      if (stage === 'practice') await js(`const s = document.querySelector('#skill-filter'); s.value = 'model'; document.querySelector('#new-set').click();`);
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
  check('browser test ran to completion', false, String(e && e.stack || e));
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (Lesson 2-1 + home). Screenshots: tests/screenshots/`);
process.exit(failed.length ? 1 : 0);
