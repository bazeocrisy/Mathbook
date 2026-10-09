// End-to-end browser test: home, Math Lessons, Lesson 2-1 (child view), and For Grown-Ups.
// Serves the repo under /Mathbook/ (like GitHub Pages) and drives headless Chrome/Edge.
// Run: npm run test:browser
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const LESSON = BASE + 'curriculum/chapter-2/lesson-2-1/';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const { js, wait, hash } = b;

// In-page helpers for the one-question-at-a-time runner.
const RUN = `${FILL_HELPERS}
  const cur = () => { const el = document.querySelector('main .q[data-qkey]'); if (!el) return null; const [pre, id] = el.dataset.qkey.split(/-(.+)/);
    const q = pre === 'p' ? L.bank.find((x) => x.id === id) : pre === 'g' ? L.guided.find((x) => x.id === id) : null; return { el, q, id }; };
  const btn = (act) => document.querySelector('main [data-act="' + act + '"]');
  const msg = () => (document.querySelector('main .msg:not([hidden])') || {}).innerText || '';
  const answer = (correct) => { const c = cur(); fill(c.el, c.q, correct); btn('check').click(); };
  const B = () => JSON.parse(localStorage.getItem(L.storageKey + ':bank-sets') || '{}');`;

async function overflow(label) {
  const r = await js(`const doc = document.documentElement;
    const wide = Array.from(document.querySelectorAll('body *')).filter((e) => { if (e.closest('.table-wrap, .skip, .sr-only, .stars')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main a[href], main button, main input:not([type=radio]):not([type=checkbox]), main select, .bookbar a')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('[hidden], .sr-only, .skip, .table-wrap, .gu, p, li') && (r.width < 44 || r.height < 44); }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: doc.scrollWidth, cw: doc.clientWidth, wide, small };`);
  check(`layout: no sideways scrolling, targets ≥ 44px — ${label}`, r.sw <= r.cw && r.wide.length === 0 && r.small.length === 0, r);
}

async function finishTest(id, correctCount) {
  await b.load(O + LESSON + '#test/' + id);
  return js(`${FILL_HELPERS}
    const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-${id}'));
    // A resumed test opens where it was left; go back to question 1 first.
    while (document.querySelector('[data-act="prev"]')) document.querySelector('[data-act="prev"]').click();
    for (let i = 0; i < d.questions.length; i++) {
      const el = document.querySelector('main .q[data-qkey]'); fill(el, d.questions[i], i < ${correctCount});
      document.querySelector('[data-act="next"]').click();
    }
    document.querySelector('[data-act="submit"]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts')); return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('main').innerText };`);
}

try {
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');

  // ----- Home -----
  await b.load(O + BASE);
  const home = await js(`return { h1: document.querySelector('h1').textContent, choices: Array.from(document.querySelectorAll('.home-choice')).map((a) => a.getAttribute('href') + ' ' + a.querySelector('b').textContent),
    grown: document.querySelector('.grownups-link').getAttribute('href'), logo: document.querySelector('.logo').getAttribute('href'),
    homeButton: Array.from(document.querySelectorAll('a, button')).some((e) => /^\\s*home\\s*$/i.test(e.textContent)), badges: document.querySelectorAll('.badge-m, .aud, .tag-m').length };`);
  check('Home: one question and exactly two big choices (Math Lessons, Number Words)', home.h1 === 'What do you want to learn today?' && JSON.stringify(home.choices) === JSON.stringify(['math/ Math Lessons', 'number-words/ Number Words']), home);
  check('Home: no Home button, no badges; logo links home; "For grown-ups" link', !home.homeButton && home.badges === 0 && home.logo === './' && home.grown === 'grown-ups/', home);
  await b.navigate(`document.querySelector('.home-choice[href="math/"]').click();`);
  check('Math Lessons page lists Lesson 2-1', await js(`return document.querySelector('h1').textContent === 'Math Lessons' && !!document.querySelector('a.menu-btn[href="../curriculum/chapter-2/lesson-2-1/"]') && document.querySelector('.logo').getAttribute('href') === '../'`));
  await b.navigate(`document.querySelector('a.menu-btn').click();`);

  // ----- Lesson menu -----
  const menu = await js(`return { h1: document.querySelector('h1').textContent, items: Array.from(document.querySelectorAll('.menu-btn b')).map((x) => x.textContent), back: document.querySelector('.backlink').textContent,
    logo: document.querySelector('.logo').getAttribute('href'), tabs: document.querySelectorAll('.stagebar, .stage-link').length, parentText: /For the parent|Parent:/i.test(document.body.innerText) };`);
  check('Lesson menu: Learn, Words to Know, Practice, Show What You Know', JSON.stringify(menu.items) === JSON.stringify(['Learn', 'Words to Know', 'Practice', 'Show What You Know']) && menu.h1 === 'Lesson 2-1: Represent 4-Digit Numbers', menu);
  check('Lesson menu: no tab bar, no parent text; logo goes home; back link to Math Lessons', menu.tabs === 0 && !menu.parentText && menu.logo === '../../../' && /Math Lessons/.test(menu.back), menu);

  // ----- Learn -----
  await hash('#learn');
  const learn = await js(`
    const page = () => ({ title: document.querySelector('#learn-card h2').textContent, counter: document.querySelector('.progress-line, .dots').getAttribute('aria-label'),
      blocks: ['thousand','hundred','ten','one'].map((k) => document.querySelectorAll('#learn-card [data-block="' + k + '"]').length).join(','), text: document.querySelector('#learn-card').innerText });
    const next = () => document.querySelector('[data-act="next"]').click();
    const p1 = page(); next(); const p2 = page();
    for (let i = 0; i < 6; i++) next(); const p8 = page();
    for (let i = 0; i < 10; i++) next(); const z = page();
    return { p1, p2, p8, z, parent: /Ask:/.test(document.body.innerText) };`);
  check('Learn: page 1 big idea; 2,137 drawn 2,1,3,7; last 2,137 step shows expanded and word form', learn.p1.title === "A digit's place tells its value" && /Page 1 of 26/.test(learn.p1.counter) && learn.p2.blocks === '2,1,3,7' && /two thousand, one hundred thirty-seven/.test(learn.p8.text) && /2,000 \+ 100 \+ 30 \+ 7 = 2,137/.test(learn.p8.text), learn);
  check('Learn: 5,072 step explains the zero; no parent "Ask" lines on the child screen', /Let's build 5,072/.test(learn.z.title) && /The 0 is in the hundreds place/.test(learn.z.text) && learn.z.blocks === '5,0,7,2' && !learn.parent, learn.z);
  await b.reload(); await hash('#learn');
  check('Learn: the page is remembered after a refresh (page 18)', await js(`return document.querySelector('.progress-line, .dots').getAttribute('aria-label') === 'Page 18 of 26'`));
  const learnEnd = await js(`
    const next = () => document.querySelector('[data-act="next"]').click();
    for (let i = 0; i < 5; i++) next();
    const st = document.querySelectorAll('.stepper'); st[1].querySelector('[data-step="1"]').click();
    const build = document.querySelector('#bld-out').innerText;
    next(); document.querySelector('[data-delta="100"]').click(); const change = document.querySelector('#change-out').innerText;
    next(); next(); const compose = document.querySelector('#learn-card').innerText; const last = document.querySelector('[data-act="next"]').textContent;
    document.querySelector('[data-act="next"]').click(); await new Promise((r) => setTimeout(r, 200));
    return { build, change, compose, last, hash: location.hash };`);
  check('Learn: build (2,237), change one place (4,125 + 100 = 4,225), biggest/smallest (8,641 / 1,468)', /2,237/.test(learnEnd.build) && /4,125 \+ 100 = 4,225/.test(learnEnd.change) && /8,641/.test(learnEnd.compose) && /1,468/.test(learnEnd.compose), learnEnd);
  check('Learn: last page returns to the lesson menu', /Back to the lesson/.test(learnEnd.last) && (learnEnd.hash === '' || learnEnd.hash === '#'), learnEnd);

  // ----- Words to Know -----
  await hash('#words');
  const words = await js(`const terms = []; for (let i = 0; i < 10; i++) { terms.push(document.querySelector('.term').textContent); const n = document.querySelector('[data-act="next"]'); if (n) n.click(); }
    return { terms, last: document.querySelector('a.btn-main').getAttribute('href') };`);
  check('Words to Know: 10 word cards, then "Practice the words"', words.terms.length === 10 && words.terms[0] === 'digit' && words.terms.includes('expanded form') && words.terms.includes('thousands') && words.last === '#word-practice', words);
  await hash('#word-practice');
  check('Word practice: 10 questions, one at a time, Check Answer', await js(`return document.querySelector('.dots').getAttribute('aria-label') === 'Question 1 of 10' && !!document.querySelector('[data-act="check"]') && document.querySelectorAll('main .q').length === 1`));

  // ----- Practice: one question at a time -----
  await hash('#practice');
  const pmenu = await js(`return Array.from(document.querySelectorAll('.menu-btn b')).map((x) => x.textContent);`);
  check('Practice menu: Practice Together + 5 sets', JSON.stringify(pmenu) === JSON.stringify(['Practice Together', 'Set 1: Place and Digit Value', 'Set 2: Base-Ten Models', 'Set 3: Standard Form', 'Set 4: Expanded and Word Form', 'Set 5: Mixed Review and Reasoning']), pmenu);
  await hash('#set/s1');
  const s1 = await js(`${RUN}
    const order = B().s1.active.order;
    btn('check').click(); const empty = msg();
    answer(true); const right = { msg: msg(), next: !!btn('next'), first: B().s1.active.run.items[order[0]] };
    await new Promise((r) => setTimeout(r, 1500)); const stillHere = document.querySelector('.dots').getAttribute('aria-label');
    btn('next').click();
    const q2 = cur().q; answer(false);
    const wrongState = { msg: msg(), again: !!btn('again'), next: !!btn('next'), reveals: /The answer is/.test(msg()) || msg().includes(q2.explanation), locked: Array.from(cur().el.querySelectorAll('input, select, button')).every((x) => x.disabled) };
    btn('again').click(); const unlocked = Array.from(cur().el.querySelectorAll('input, select, button')).some((x) => !x.disabled);
    answer(true); const retryRight = { msg: msg(), rec: B().s1.active.run.items[q2.id] };
    btn('next').click();
    const q3 = cur().q; answer(false); btn('again').click(); answer(false);
    const twice = { msg: msg(), rec: B().s1.active.run.items[q3.id], shows: msg().includes(Q.correctText(q3)) && msg().includes(q3.explanation) };
    btn('prev').click(); const backTo = { msg: msg(), locked: Array.from(cur().el.querySelectorAll('input, select, button')).every((x) => x.disabled) };
    btn('next').click(); btn('next').click();
    return { n: order.length, unique: new Set(order).size, sameSet: order.slice().sort().join() === L.bankSets[0].ids.slice().sort().join(), empty, right, stillHere, wrong: wrongState, unlocked, retryRight, twice, backTo };`);
  check('Set 1: 10 different questions from Set 1; Check Answer asks for an answer first', s1.n === 10 && s1.unique === 10 && s1.sameSet && /answer first/.test(s1.empty), s1);
  check('Right on the first try: encouragement + explanation, Next appears, recorded as first try', /Great job|You got it|Super|Nice work|Well done/.test(s1.right.msg) && s1.right.next && s1.right.first.first === true && s1.right.first.final === true, s1.right);
  check('Never advances by itself (still question 1 after 1.5 s)', s1.stillHere === 'Question 1 of 10', s1.stillHere);
  check('Wrong once: "Not quite" + clue + Try Again; answer NOT revealed; inputs locked until Try Again', /Not quite/.test(s1.wrong.msg) && s1.wrong.again && !s1.wrong.next && !s1.wrong.reveals && s1.wrong.locked && s1.unlocked, s1.wrong);
  check('Right on the retry: "You got it this time!"; first try false, final true', /You got it this time/.test(s1.retryRight.msg) && s1.retryRight.rec.first === false && s1.retryRight.rec.final === true, s1.retryRight);
  check('Wrong twice: shows the correct answer and explanation; first and final both false', /The answer is/.test(s1.twice.msg) && s1.twice.shows && s1.twice.rec.first === false && s1.twice.rec.final === false, s1.twice);
  check('Previous shows an answered question locked with its feedback', s1.backTo.locked && /You got it this time/.test(s1.backTo.msg), s1.backTo);

  // Refresh in the middle of a set, in the "Try Again" state (question 4).
  await js(`${RUN} answer(false);`);
  await b.reload();
  const mid = await js(`${RUN} return { counter: document.querySelector('.dots').getAttribute('aria-label'), again: !!btn('again'), msg: msg() };`);
  check('Refresh mid-set: same question, still waiting for Try Again', mid.counter === 'Question 4 of 10' && mid.again && /Not quite/.test(mid.msg), mid);
  await b.shot(path.join(SHOTS, 'set-try-again-desktop.png'), false);
  const s1done = await js(`${RUN}
    btn('again').click(); answer(true); btn('next').click();
    for (let i = 4; i < 10; i++) { answer(true); btn('next').click(); }
    await new Promise((r) => setTimeout(r, 200));
    const st = B().s1; const a = st.attempts[0];
    return { text: document.querySelector('main').innerText, misses: document.querySelector('#misses')?.textContent, score: a.score, finalScore: a.finalScore, first: a.first.filter(Boolean).length, final: a.final.filter(Boolean).length };`);
  // First try right: q1 and q5–q10 = 7. Right after Try Again: q2 and q4 = 2 more. q3 missed twice.
  check('Set summary: 7 of 10 right on the first try, 2 more on Try Again; attempt saved with both scores', /7 of 10 right on the first try, and 2 more when you tried again/.test(s1done.text) && s1done.score === 7 && s1done.finalScore === 9 && s1done.first === 7 && s1done.final === 9, s1done);
  check('"Practice My Misses (3)" offered after the set', s1done.misses === 'Practice My Misses (3)', s1done.misses);
  const pmm = await js(`${RUN}
    const missed = B().s1.attempts[0].order.filter((id, k) => !B().s1.attempts[0].first[k]);
    document.querySelector('#misses').click(); await new Promise((r) => setTimeout(r, 300));
    const ids = B().s1.active.order; const first = cur(); const blank = !Q.isAnswered(first.q, Q.read(first.el, first.q));
    const text = document.querySelector('main').innerText; const revealed = /The answer is|Not quite|Great job/.test(text);
    for (let i = 0; i < ids.length; i++) { answer(true); btn('next').click(); }
    await new Promise((r) => setTimeout(r, 200));
    const st = B().s1;
    return { hash: location.hash, sameIds: ids.slice().sort().join() === missed.slice().sort().join(), n: ids.length, blank, revealed, summary: document.querySelector('main').innerText,
      retries: st.retries.length, parentOk: st.retries[0].parentId === st.attempts[0].id, original: st.attempts[0].score + '/' + st.attempts[0].finalScore };`);
  check('Practice My Misses: only the 3 first-try misses, starts blank, nothing revealed', /misses\/s1/.test(pmm.hash) && pmm.sameIds && pmm.n === 3 && pmm.blank && !pmm.revealed, pmm);
  check('Practice My Misses saved separately; original attempt unchanged (7 first try / 9 final)', /You practiced your misses/.test(pmm.summary) && /3 of 3 right on the first try/.test(pmm.summary) && pmm.retries === 1 && pmm.parentOk && pmm.original === '7/9', pmm);
  await b.reload();
  check('Refresh after finishing: summary still shown', await js(`return /You practiced your misses/.test(document.querySelector('main').innerText)`));
  await hash('#practice');
  check('Practice menu marks Set 1 done', await js(`return /Done/.test(document.querySelectorAll('.menu-btn')[1].innerText) && !!document.querySelectorAll('.menu-btn')[1].querySelector('.done')`));

  // All five sets through the UI, right on the first try → every one of the 50 questions grades correctly.
  const all = await js(`${RUN}
    const out = {};
    for (const s of L.bankSets) {
      location.hash = 'set/' + s.id; await new Promise((r) => setTimeout(r, 250));
      if (document.querySelector('#again')) { document.querySelector('#again').click(); await new Promise((r) => setTimeout(r, 150)); }
      const ids = []; for (let i = 0; i < 10; i++) { ids.push(cur().id); answer(true); btn('next').click(); }
      await new Promise((r) => setTimeout(r, 150));
      const a = B()[s.id].attempts.slice(-1)[0];
      out[s.id] = { score: a.score, final: a.finalScore, same: ids.slice().sort().join() === s.ids.slice().sort().join() };
    }
    return out;`);
  check('All 5 sets answered right on the first try through the UI: 10/10 each (all 50 questions)', Object.values(all).every((x) => x.score === 10 && x.final === 10 && x.same), all);
  const again = await js(`${RUN} location.hash = 'set/s2'; await new Promise((r) => setTimeout(r, 250)); const before = B().s2.attempts.slice(-1)[0].order.join();
    document.querySelector('#again').click(); await new Promise((r) => setTimeout(r, 150)); return { differs: B().s2.active.order.join() !== before, n: B().s2.active.order.length };`);
  check('"Practice Set again": new attempt, new order', again.differs && again.n === 10, again);

  // Transition from Build 2.1 saved progress (whole-set checking) to question by question.
  await js(`${RUN}
    const s = B();
    s.s3 = { attempts: [], retries: [], active: { kind: 'set', order: L.bankSets[2].ids.slice(), responses: { [L.bankSets[2].ids[0]]: Q.correctResponse(L.bank.find((q) => q.id === L.bankSets[2].ids[0])) }, checked: false } };
    const o4 = L.bankSets[3].ids.slice(); const c4 = o4.map((id, k) => k !== 0 && k !== 5);
    s.s4 = { attempts: [{ id: 111, date: new Date().toISOString(), order: o4, responses: {}, correct: c4, score: 8, total: 10 }], retries: [], active: { kind: 'set', order: o4, responses: {}, checked: true, attemptId: 111 } };
    localStorage.setItem(L.storageKey + ':bank-sets', JSON.stringify(s));`);
  await b.reload();
  await hash('#set/s3');
  const mig3 = await js(`${RUN} const c = cur(); return { first: c.id, prefilled: Q.isAnswered(c.q, Q.read(c.el, c.q)), check: !!btn('check') };`);
  check('Transition: an unfinished Build 2.1 set keeps its earlier answer and continues one question at a time', mig3.prefilled && mig3.check, mig3);
  await hash('#set/s4');
  const mig4 = await js(`${RUN} const t = document.querySelector('main').innerText; const m = document.querySelector('#misses'); const label = m && m.textContent; if (m) m.click(); await new Promise((r) => setTimeout(r, 300));
    return { t, misses: label, retryIds: B().s4.active.order.slice().sort().join(), expected: [L.bankSets[3].ids[0], L.bankSets[3].ids[5]].sort().join() };`);
  check('Transition: a finished Build 2.1 set shows its result (8 of 10) and Practice My Misses works', /8 of 10 right on the first try/.test(mig4.t) && mig4.misses === 'Practice My Misses (2)' && mig4.retryIds === mig4.expected, mig4);

  // ----- Practice Together -----
  await hash('#together');
  const together = await js(`${RUN} const n = document.querySelector('.dots').getAttribute('aria-label'); for (let i = 0; i < 5; i++) { answer(true); btn('next').click(); }
    const explain = !!btn('explained'); const text = document.querySelector('main').innerText; return { n, explain, text: text.slice(0, 120), parent: /Parent:/.test(text) };`);
  check('Practice Together: 7 problems; the explain problem has "I told a grown-up"; no parent text on screen', together.n === 'Question 1 of 7' && together.explain && !together.parent, together);

  // ----- Tests -----
  await hash('#quiz');
  check('Show What You Know: Vocabulary Test and Math Test', await js(`return Array.from(document.querySelectorAll('.menu-btn b')).map((x) => x.textContent).join('|') === 'Vocabulary Test|Math Test'`));
  await hash('#test/math');
  const t = await js(`${FILL_HELPERS}
    const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-math'));
    const one = document.querySelectorAll('main .q').length; const first = document.querySelector('.dots').getAttribute('aria-label'); const noPrev = !document.querySelector('[data-act="prev"]');
    fill(document.querySelector('main .q[data-qkey]'), d.questions[0], false);
    const feedback = document.querySelectorAll('main .msg, main .feedback, main [data-act="check"], main [data-act="hint"]').length;
    document.querySelector('[data-act="next"]').click(); document.querySelector('[data-act="prev"]').click();
    const kept = Q.isAnswered(d.questions[0], Q.read(document.querySelector('main .q[data-qkey]'), d.questions[0]));
    for (let i = 0; i < 10; i++) document.querySelector('[data-act="next"]').click();
    const review = document.querySelector('main').innerText; const submitDisabled = document.querySelector('[data-act="submit"]').disabled;
    const missing = document.querySelectorAll('.review-grid .missing').length;
    document.querySelector('.review-grid [data-go="3"]').click(); const jumped = document.querySelector('.dots').getAttribute('aria-label');
    return { n: d.questions.length, one, first, noPrev, feedback, kept, review: review.slice(0, 200), submitDisabled, missing, jumped, attempts: (JSON.parse(localStorage.getItem(L.storageKey + ':attempts')) || []).length };`);
  check('Math Test: 10 questions, one at a time, Previous/Next, answers kept when moving', t.n === 10 && t.one === 1 && t.first === 'Question 1 of 10' && t.noPrev && t.kept, t);
  check('Math Test: no hints, no Check Answer, no feedback while testing', t.feedback === 0, t);
  check('Review screen: lists unanswered questions, grading blocked, tap a number to go back', /You answered 1 of 10/.test(t.review) && /still need answers/.test(t.review) && t.submitDisabled && t.missing === 9 && t.jumped === 'Question 4 of 10' && t.attempts === 0, t);
  await b.reload();
  check('Refresh mid-test: returns to the same question (4)', await js(`return document.querySelector('.dots').getAttribute('aria-label') === 'Question 4 of 10'`));
  await js(`document.querySelector('[data-act="later"]').click();`); await wait(200);
  check('"Save and finish later" → test list shows "Keep going"', await js(`return location.hash === '#quiz' && /Keep going/.test(document.querySelectorAll('.menu-btn')[1].innerText)`));
  const done = await finishTest('math', 8);
  check('Math Test finished: 8 out of 10, child-friendly message, attempt saved with pauses', done.hash === '#done/math' && /8 out of 10/.test(done.text) && /practice a little more/.test(done.text) && done.last.score === 8 && done.last.pct === 80 && done.last.pauses >= 1, { text: done.text.slice(0, 200), score: done.last.score, pauses: done.last.pauses });
  const mistakes = await js(`const b = document.querySelector('#show-mistakes'); b.click(); return { label: b.textContent, n: document.querySelectorAll('#mistakes .rq').length, text: document.querySelector('#mistakes').innerText.slice(0, 200) };`);
  check('"Look at my mistakes (2)" shows each miss with the answer and why', mistakes.n === 2 && /The answer:/.test(mistakes.text) && /Look at my mistakes \(2\)/.test(mistakes.label), mistakes);
  await b.shot(path.join(SHOTS, 'test-done-desktop.png'));
  const perfect = await finishTest('vocab', 10);
  check('Vocabulary Test: 10 out of 10 → "Amazing!"', /10 out of 10/.test(perfect.text) && /Amazing/.test(perfect.text) && perfect.last.pct === 100, perfect.text.slice(0, 150));
  const low = await finishTest('math', 6);
  check('Math Test 6 out of 10 → "Let\'s learn this together"', low.last.pct === 60 && /learn this together/.test(low.text), low.last.pct);
  const stress = [];
  for (let i = 0; i < 10; i++) for (const id of ['math', 'vocab']) { const r = await finishTest(id, 10); if (r.last.score !== 10) stress.push({ id, missed: r.last.questions.filter((q, k) => !r.last.correct[k]).map((q) => ({ q, r: r.last.responses[q.id] })) }); }
  check('20 all-correct tests through the paged UI (10 Math, 10 Vocabulary) all score 10/10', stress.length === 0, stress);

  // ----- For Grown-Ups -----
  await b.load(O + LESSON + '#set/s5');
  await b.load(O + BASE + 'grown-ups/');
  const gu = await js(`const tables = Array.from(document.querySelectorAll('#lesson table'));
    return { h1: document.querySelector('h1').textContent, sections: Array.from(document.querySelectorAll('.gu-section h2')).map((h) => h.textContent),
    cont: Array.from(document.querySelectorAll('#continue a')).map((a) => a.textContent + ' ' + a.getAttribute('href')),
    tests: tables[0].innerText, skills: tables.find((t) => /Suggested review/.test(t.innerText)), sets: tables.find((t) => /First try/.test(t.innerText)).innerText,
    history: document.querySelectorAll('#lesson details').length, guide: document.querySelectorAll('#guide .guide-card').length, script: document.querySelectorAll('#guide .script > li').length };`);
  check('For Grown-Ups: Continue, Lesson progress, Number Words, Teaching guide, Saved progress', gu.h1 === 'For Grown-Ups' && gu.sections.length === 5 && /Continue/.test(gu.sections[0]) && /Teaching guide/.test(gu.sections[3]), gu.sections);
  check('For Grown-Ups: Continue Learning link to the last activity', gu.cont.some((c) => /Continue: Lesson 2-1/.test(c) && /#set\/s5/.test(c)), gu.cont);
  check('For Grown-Ups: latest test scores with result bands', /Math Test/.test(gu.tests) && /Vocabulary Test/.test(gu.tests) && /(Mastered|Review|Reteach)/.test(gu.tests), gu.tests);
  check('For Grown-Ups: practice sets show first try and after retry separately', /Set 1: Place and Digit Value/.test(gu.sets) && /First try/.test(gu.sets) && /After retry/.test(gu.sets), gu.sets);
  // 3 tests above + 20 in the stress loop = 23.
  check('For Grown-Ups: assessment history (23 tests) and teaching guide (6 guide cards, 6 script steps)', gu.history === 23 && gu.guide === 6 && gu.script === 6, { history: gu.history, guide: gu.guide, script: gu.script });
  await b.shot(path.join(SHOTS, 'grownups-desktop.png'));
  await js(`localStorage.setItem('mathbook:v2:number-words:phase-1:said', '{"two":true}');`);
  const clear = await js(`document.querySelector('[data-clear="lesson"]').click(); const asked = !!document.querySelector('#clear-yes'); document.querySelector('#clear-yes').click();
    return { asked, lesson: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).length, nwKept: !!localStorage.getItem('mathbook:v2:number-words:phase-1:said') };`);
  check('Clear Lesson 2-1 progress: asks first; removes only Lesson 2-1 data', clear.asked && clear.lesson === 0 && clear.nwKept, clear);

  // ----- Layout across sizes -----
  for (const [name, w, h] of [['small phone', 320, 568], ['phone', 390, 844], ['tablet', 768, 1024], ['tablet landscape', 1024, 768], ['laptop', 1280, 720], ['large', 1920, 1080]]) {
    await b.viewport(w, h);
    for (const p of ['', 'math/', 'curriculum/chapter-2/lesson-2-1/', 'curriculum/chapter-2/lesson-2-1/#learn', 'curriculum/chapter-2/lesson-2-1/#set/s2', 'curriculum/chapter-2/lesson-2-1/#test/math', 'grown-ups/']) {
      await b.load(O + BASE + p);
      await overflow(`${p || 'home'} @ ${name} ${w}×${h}`);
      if (name === 'phone' && ['', 'curriculum/chapter-2/lesson-2-1/', 'curriculum/chapter-2/lesson-2-1/#set/s2'].includes(p)) await b.shot(path.join(SHOTS, `phone-${p.replace(/[/#]/g, '_') || 'home'}.png`));
    }
  }
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 400), pageErrors: b.errors.slice(0, 3) });
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (home + Lesson 2-1 + grown-ups).`);
process.exit(failed.length ? 1 : 0);
