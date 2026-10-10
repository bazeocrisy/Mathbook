// Lesson 2-5 "Practice this skill" (the same capability as 2-3, L23-04): every skill link on My Results opens only that skill's questions,
// is saved apart from the full set, resumes after a refresh, retries misses, is erased by Reset, and fits every screen.
// Usage: node tests/lesson-2-5-skills.browser.mjs
import { BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const { js, wait } = b;
const URL = server.origin + BASE + 'curriculum/chapter-2/lesson-2-5/index.html';
const KEY = 'mathbook:v2:lesson-2-5';

const H = `${FILL_HELPERS}
  const LL = window.Mathbook.lessons['2-5'];
  const get = (k) => JSON.parse(localStorage.getItem('${KEY}:' + k) || 'null');
  const one = () => document.querySelector('#indep .one-q .q[data-qkey]');
  const curId = () => one().dataset.qkey.replace('p-', '');
  const bq = (id) => LL.bank.find((x) => x.id === id);
  const count = () => (document.querySelector('.q-count') || {}).textContent || '';
  const text = () => document.querySelector('main').innerText;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  /** Answer the open set (right unless the id is in wrongIds), then Check my work. Returns the ids seen in order. */
  async function answerAll(wrongIds) {
    const seen = [];
    for (let g = 0; g < 30 && one(); g++) {
      const id = curId(); seen.push(id); fill(one(), bq(id), !(wrongIds || []).includes(id));
      const nx = document.querySelector('[data-q="next"]'); if (nx) nx.click(); else { document.querySelector('#check-set').click(); break; }
    }
    await sleep(100);
    return seen;
  }`;

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { if (e.closest('.table-wrap, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main .btn, main a.btn')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 47.5; }).slice(0, 3).map((e) => e.textContent.trim().slice(0, 40) + ' ' + Math.round(e.getBoundingClientRect().height));
    return { sw: d.scrollWidth, cw: d.clientWidth, wide, small };`);
  check(`layout ${label}: no sideways scroll, buttons at least 48px`, r.sw <= r.cw && !r.wide.length && !r.small.length, r);
}

try {
  await b.viewport(1366, 768, false);
  await b.load(server.origin + BASE);
  await js(`Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('mathbook:v2:lesson-2-2:attempts', '[{"id":1,"pct":80}]');`);

  // ----- A full-set attempt in progress (3 answered) must not be touched by skill practice -----
  await b.load(URL + '#practice/own'); await b.reload(); await wait(150);
  await js(`document.querySelector('[data-open-set="s1"]').click();`); await wait(250);
  const full0 = await js(`${H}
    for (let k = 0; k < 3; k++) { fill(one(), bq(curId()), true); document.querySelector('[data-q="next"]').click(); }
    return { count: count(), active: get('bank-sets').s1.active };`);
  check('full set s1: 3 answered, now on Question 4 of 17', full0.count === 'Question 4 of 17' && Object.keys(full0.active.responses).length === 3, full0.count);

  // ----- Test, all wrong → every skill listed with its own "Practice this skill" button -----
  await b.load(URL + '#test'); await b.reload(); await wait(150);
  await js(`document.querySelector('[data-start="patterns"]').click();`); await wait(200);
  await js(`${H}
    const qs = get('draft-patterns').questions; const tq = () => document.querySelector('.test-one .q[data-qkey]');
    for (let g = 0; g < 30 && tq(); g++) { const m = count().match(/Question (\\d+)/); fill(tq(), qs[g], false); document.querySelector('[data-nav="next"]').click(); }
    document.querySelector('[data-finish]').click(); await sleep(300);`);
  const res = await js(`${H}
    const testSkills = Array.from(new Set(LL._testItems.map((q) => q.skill)));
    const items = Array.from(document.querySelectorAll('.skill-list li')).map((li) => { const b = li.querySelector('[data-practice]'); return { name: li.querySelector('span').textContent, skill: b && b.dataset.practice, label: b && b.textContent }; });
    const full = document.querySelector('[data-fullset]');
    return { hash: location.hash, testSkills, items, full: full && full.textContent, bankCounts: Object.fromEntries(testSkills.map((s) => [s, LL.bank.filter((q) => q.skill === s).length])) };`);
  check('results: one "Practice this skill" button for every missed skill', res.hash === '#results' && res.items.length === res.testSkills.length && res.items.every((x) => x.skill && res.testSkills.includes(x.skill)), res.items);
  check('results: each button names its question count (no "Set 1")', res.items.every((x) => x.label.startsWith(`Practice this skill (${res.bankCounts[x.skill]} question${res.bankCounts[x.skill] === 1 ? '' : 's'})`) && !/Set \d/.test(x.label)), res.items.map((x) => x.label));
  check('results: the normal full set is still offered ("Practice all 17 questions")', /^Practice all 17 questions$/.test(res.full), res.full);
  await noOverflow('results @1366');

  // ----- Every skill link: only that skill, the skill shown, grading, and completion -----
  for (const item of res.items) {
    await b.load(URL + '#results'); await b.reload(); await wait(200);
    await js(`document.querySelector('[data-practice="${item.skill}"]').click();`); await wait(250);
    const r = await js(`${H}
      const banner = document.querySelector('.hero').innerText;
      const h1 = document.querySelector('h1').textContent; const c0 = count(); const hash = location.hash;
      const ids = await answerAll([]);
      return { hash, h1, banner, c0, ids, skills: ids.map((id) => bq(id).skill), score: (document.querySelector('.set-score') || {}).innerText || '', title: (document.querySelector('.set-title') || {}).textContent,
        again: (document.querySelector('#set-again') || {}).textContent, full: (document.querySelector('#choose-set') || {}).textContent };`);
    const n = res.bankCounts[item.skill];
    check(`skill ${item.skill}: opens #practice/skill-${item.skill}, shows "${item.name}", Question 1 of ${n}`,
      r.hash === `#practice/skill-${item.skill}` && r.h1 === item.name && r.banner.includes(item.name) && new RegExp(n === 1 ? 'Just 1 question on this skill' : n + ' questions on this skill').test(r.banner) && /Practicing one skill/i.test(r.banner) && r.c0 === `Question 1 of ${n}`, r);
    check(`skill ${item.skill}: only its ${n} question(s), each once`, r.ids.length === n && new Set(r.ids).size === n && r.skills.every((s) => s === item.skill), r.ids);
    check(`skill ${item.skill}: all right → ${n} of ${n} correct; titled with the skill; full set offered`,
      new RegExp(`^${n} of ${n} correct`).test(r.score) && /^Skill practice — attempt 1/.test(r.title) && r.banner.includes(item.name) && r.again === 'Practice this skill again' && r.full === 'Practice all 17 questions', r);
  }
  const after = await js(`${H} return { sp: get('skill-practice'), s1: get('bank-sets').s1 };`);
  check('skill practice is saved apart: one record per skill, none in the full-set progress',
    Object.keys(after.sp).length === res.items.length && Object.values(after.sp).every((s) => s.attempts.length === 1) && after.s1.attempts.length === 0 && Object.keys(after.s1.active.responses).length === 3 && !after.s1.active.checked,
    { sp: Object.keys(after.sp), s1: after.s1.attempts.length });

  // ----- Grading a miss, Practice My Misses, and a new attempt -----
  await b.load(URL + '#results'); await b.reload(); await wait(200);
  await js(`document.querySelector('[data-practice="rules"]').click();`); await wait(250);
  const miss = await js(`${H}
    const t0 = document.querySelector('.set-title') ? 'checked' : count();
    const ids = []; for (let g = 0; g < 5 && one(); g++) ids.push(curId());
    const order = get('skill-practice')['skill-rules'].active.order; const wrongId = order[1];
    await answerAll([wrongId]);
    const score = document.querySelector('.set-score').innerText; const title = document.querySelector('.set-title').textContent;
    const wrongShown = document.querySelectorAll('.q-item .feedback-no').length;
    const pm = document.querySelector('#practice-misses'); const pmText = pm && pm.textContent; pm.click(); await sleep(150);
    const rc = count(); const retryIds = []; retryIds.push(curId());
    await answerAll([]);
    return { t0, wrongId, score, title, wrongShown, pmText, rc, retryIds, rscore: document.querySelector('.set-score').innerText, st: get('skill-practice')['skill-rules'], s1: get('bank-sets').s1.attempts.length };`);
  check('rules skill: a fresh attempt 2 starts after a checked one', /attempt 2/.test(miss.title) && miss.t0 === 'Question 1 of 6', { t0: miss.t0, title: miss.title });
  check('rules skill: one wrong → 5 of 6 correct, the miss explained', /^5 of 6 correct/.test(miss.score) && miss.wrongShown === 1, miss.score);
  check('rules skill: Practice My Misses (1) asks only the missed question', miss.pmText === 'Practice My Misses (1)' && miss.rc === 'Question 1 of 1' && miss.retryIds[0] === miss.wrongId, miss);
  check('rules skill: the retry is graded and recorded as misses fixed; the attempt score is kept',
    /Practice My Misses: 1 of 1 now correct/.test(miss.rscore) && /stays 5\/6/.test(miss.rscore) && /Misses fixed so far: 1 of 1/.test(miss.rscore) && miss.st.attempts.length === 2 && miss.st.retries.length === 1 && miss.s1 === 0, miss.rscore);

  // ----- Refresh and resume in the middle of a skill -----
  await b.load(URL + '#results'); await b.reload(); await wait(200);
  await js(`document.querySelector('[data-practice="sum"]').click();`); await wait(250);
  const mid = await js(`${H} const id = curId(); fill(one(), bq(id), true); const v = JSON.stringify(Q.read(one(), bq(id))); document.querySelector('[data-q="next"]').click(); return { id, v, c: count() };`);
  await b.reload(); await wait(250);
  const resumed = await js(`${H} const c = count(); const hash = location.hash; const banner = document.querySelector('.hero').innerText;
    document.querySelector('[data-q="prev"]').click(); await sleep(50);
    return { c, hash, banner, back: curId(), v: JSON.stringify(Q.read(one(), bq(curId()))) };`);
  check('refresh: stays in the sum skill on Question 2 of 2, banner still shown', resumed.c === 'Question 2 of 2' && resumed.hash === '#practice/skill-sum' && /Predict and find a sum/.test(resumed.banner), resumed);
  check('refresh: the first answer is kept', resumed.back === mid.id && resumed.v === mid.v, { mid, resumed });
  await b.load(server.origin + BASE); await wait(250);
  const home = await js(`const l = document.getElementById('continue-link'); return { text: document.getElementById('continue-what').textContent, href: l.getAttribute('href'), shown: !document.getElementById('continue').hidden };`);
  check('Home Continue points back to the unfinished skill practice', home.shown && home.href.endsWith('#practice/skill-sum') && /1 of 2 answered/.test(home.text), home);

  // ----- The normal full set is unchanged and continues where it was -----
  await b.load(URL + '#results'); await b.reload(); await wait(200);
  await js(`document.querySelector('[data-fullset]').click();`); await wait(250);
  const full = await js(`${H} return { hash: location.hash, c: count(), banner: !!document.querySelector('.skill-banner-tag'), h1: document.querySelector('h1').textContent, answered: Object.keys(get('bank-sets').s1.active.responses).length };`);
  check('"Practice all 17 questions" continues the full set at Question 4 of 17 with its 3 answers', full.hash === '#practice/s1' && full.c === 'Question 4 of 17' && !full.banner && /Set 1: Addition Patterns Practice/.test(full.h1) && full.answered === 3, full);
  const fullDone = await js(`${H} await answerAll([]); return document.querySelector('.set-score').innerText;`);
  check('the full set grades all 17 on its own', /^17 of 17 correct/.test(fullDone), fullDone);
  await b.load(URL + '#practice/own'); await b.reload(); await wait(200);
  const own = await js(`return Array.from(document.querySelectorAll('.set-card')).map((c) => c.innerText.replace(/\\s+/g, ' '))`);
  check('On My Own still shows one set of 17, Completed, Last 17/17 (skill practice not counted)', own.length === 1 && /Completed/.test(own[0]) && /Last score 17\/17/.test(own[0]) && /Best 17\/17/.test(own[0]), own);

  // ----- A bad skill link falls back to the Practice choices -----
  await b.load(URL + '#practice/skill-nope'); await b.reload(); await wait(200);
  check('an unknown skill link shows the Practice choices', await js(`return document.querySelector('h1').textContent === 'Practice' && !!document.querySelector('.choice-grid')`));

  // ----- Layout on phone, tablet and desktop -----
  for (const [w, h] of [[320, 568], [390, 844], [568, 320], [768, 1024], [1024, 768], [1920, 1080]]) {
    await b.viewport(w, h);
    await b.load(URL + '#practice/skill-check'); await b.reload(); await wait(250);
    await noOverflow(`skill practice question @${w}`);
    if (w === 390) await b.shot('tests/screenshots/2-5-skill-question-390.png');
    await js(`${H} await answerAll(['o13']);`);
    await noOverflow(`skill practice checked @${w}`);
    if (w === 390) await b.shot('tests/screenshots/2-5-skill-checked-390.png');
    await b.load(URL + '#results'); await b.reload(); await wait(250);
    await noOverflow(`results with skill buttons @${w}`);
    if (w === 1920 || w === 390) await b.shot(`tests/screenshots/2-5-results-skills-${w}.png`);
  }
  await b.viewport(1366, 768, false);

  // ----- Damaged saved skill practice never breaks the full set or the skill screens (L23-10) -----
  const bad = { null: 'null', array: '[]', string: '"x"', number: '5', badOrder: JSON.stringify({ 'skill-sum': { attempts: [], retries: [], active: { kind: 'set', order: ['zz'], responses: {}, checked: false } } }),
    badRecord: JSON.stringify({ 'skill-sum': 7, 'skill-round10': { attempts: 'x', retries: [] } }) };
  for (const [name, val] of Object.entries(bad)) {
    await b.load(server.origin + BASE); await js(`localStorage.setItem('${KEY}:skill-practice', ${JSON.stringify(val)});`); await b.reload(); await wait(150);
    await b.load(URL + '#practice/s1'); await b.reload(); await wait(200);
    const fullOk = await js(`return /Set 1: Addition Patterns Practice/.test(document.querySelector('h1').textContent) && (/Question \d+ of 17/.test((document.querySelector('.q-count') || {}).textContent || '') || /of 17 correct/.test((document.querySelector('.set-score') || {}).textContent || ''))`);
    await b.load(URL + '#practice/skill-sum'); await b.reload(); await wait(200);
    const r = await js(`${H} if (!one()) return { text: text().slice(0, 300), store: localStorage.getItem('${KEY}:skill-practice') }; const c0 = count(); fill(one(), bq(curId()), true); document.querySelector('[data-q="next"]').click(); return { c0, c1: count() };`);
    await b.reload(); await wait(200);
    const kept = await js(`return (document.querySelector('.q-count') || {}).textContent`);
    check(`damaged skill-practice (${name}): full set works; skill starts fresh, saves and resumes`, fullOk && r.c0 === 'Question 1 of 2' && r.c1 === 'Question 2 of 2' && kept === 'Question 2 of 2', { fullOk, r, kept });
  }

  // ----- Reset Lesson Progress erases skill practice too, and nothing else -----
  await b.load(URL + '#teach'); await b.reload(); await wait(200);
  await js(`document.querySelector('#clear').click(); await new Promise((r) => setTimeout(r, 50)); document.querySelector('#clear-yes').click();`); await wait(250);
  const reset = await js(`return { keys: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')), other: localStorage.getItem('mathbook:v2:lesson-2-2:attempts'), hash: location.hash }`);
  check('reset: no 2-5 data left (skill practice included); 2-2 kept; back at the menu', reset.keys.length === 0 && reset.other && reset.hash === '#menu', reset);
  await b.load(URL + '#practice/skill-sum'); await b.reload(); await wait(200);
  check('after reset a skill link starts fresh at attempt 1, Question 1', await js(`return /Question 1 of 2/.test(document.querySelector('.q-count').textContent) && !document.querySelector('.set-title')`) &&
    await js(`const s = JSON.parse(localStorage.getItem('${KEY}:skill-practice')); return s['skill-sum'].attempts.length === 0`));

  check('No JavaScript errors', b.errors.length === 0, b.errors);
} finally {
  b.close();
  server.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed (Lesson 2-5 skill practice).`);
process.exit(failed ? 1 : 0);
