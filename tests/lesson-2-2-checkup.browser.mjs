// Lesson 2-2 Rounding Check-Up (Math Probe pp. 41–42, PLAN decision 2) and the shared fixes that came with it:
// the On My Own set chooser with sets of different sizes, and one period in "Look again at: …" (review L24-05, 2-3).
// Usage: node tests/lesson-2-2-checkup.browser.mjs
import { BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const { js, wait } = b;
const URL = server.origin + BASE + 'curriculum/chapter-2/lesson-2-2/index.html';
const KEY = 'mathbook:v2:lesson-2-2';
const H = `${FILL_HELPERS}
  const LL = window.Mathbook.lessons['2-2'];
  const one = () => document.querySelector('#indep .one-q .q[data-qkey]');
  const bq = (id) => LL.bank.find((x) => x.id === id);
  const count = () => (document.querySelector('.q-count') || {}).textContent || '';
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function answerAll(wrongIds) {
    const seen = [];
    for (let g = 0; g < 20 && one(); g++) {
      const id = one().dataset.qkey.replace('p-', ''); seen.push(id); fill(one(), bq(id), !(wrongIds || []).includes(id));
      const nx = document.querySelector('[data-q="next"]'); if (nx) nx.click(); else { document.querySelector('#check-set').click(); break; }
    }
    await sleep(100);
    return seen;
  }`;

async function noOverflow(label) {
  const r = await js(`const d = document.documentElement;
    const wide = Array.from(document.querySelectorAll('main *')).filter((e) => { if (e.closest('.table-wrap, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > d.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main .btn, main .choice')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < 47.5; }).slice(0, 3).map((e) => e.textContent.trim().slice(0, 40) + ' ' + Math.round(e.getBoundingClientRect().height));
    return { sw: d.scrollWidth, cw: d.clientWidth, wide, small };`);
  check(`layout ${label}: no sideways scroll, targets at least 48px`, r.sw <= r.cw && !r.wide.length && !r.small.length, r);
}

try {
  await b.viewport(1366, 768, false);
  await b.load(server.origin + BASE);
  await js(`Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).forEach((k) => localStorage.removeItem(k));`);

  // ----- Practice menu and the set chooser -----
  await b.load(URL + '#practice'); await b.reload(); await wait(200);
  const menu = await js(`return Array.from(document.querySelectorAll('.choice-card')).map((c) => c.innerText.replace(/\\s+/g, ' '))`);
  check('Practice menu: On My Own says "Choose a set." (sets of 12 and 4, so no single count)', menu.some((t) => /On My Own Choose a set\. Answer every question, then check your work\./.test(t)) && !menu.some((t) => /set of 12/.test(t)), menu);
  await b.load(URL + '#practice/own'); await wait(200);
  const sets = await js(`return Array.from(document.querySelectorAll('.set-card')).map((c) => c.querySelector('h3').textContent)`);
  check('On My Own lists Set 1 Rounding Practice and Set 2 Rounding Check-Up', sets.join('|') === 'Rounding Practice|Rounding Check-Up', sets);

  // ----- The Check-Up set: one question at a time, select-all plus "how did you decide", misses, retry -----
  await js(`document.querySelector('[data-open-set="s2"]').click();`); await wait(250);
  const s2 = await js(`${H}
    const o = { hash: location.hash, h1: document.querySelector('h1').textContent, c0: count(), hint: !!document.querySelector('#indep [data-act=hint]') };
    o.ids = await answerAll(['pr2']);
    o.score = document.querySelector('.set-score').innerText;
    o.why = Array.from(document.querySelectorAll('#indep .feedback-no')).map((f) => f.innerText).join(' ');
    const pm = document.querySelector('#practice-misses'); o.pm = pm && pm.textContent; pm.click(); await sleep(150);
    o.retry = count(); o.retryId = one().dataset.qkey.replace('p-', '');
    await answerAll([]); o.retryScore = document.querySelector('.set-score').innerText;
    return o;`);
  check('Set 2: Rounding Check-Up, 4 questions one at a time, no hints before checking', s2.hash === '#practice/s2' && s2.h1 === 'Set 2: Rounding Check-Up' && s2.c0 === 'Question 1 of 4' && !s2.hint && s2.ids.length === 4, s2);
  check('Set 2: one miss → 3 of 4, explained with every number and its rounded value', /^3 of 4 correct/.test(s2.score) && /756 rounds to 800/.test(s2.why) && /681 rounds to 700 ✓/.test(s2.why), s2.score);
  check('Set 2: Practice My Misses (1) retries only the missed question, then 1 of 1 now correct', s2.pm === 'Practice My Misses (1)' && s2.retry === 'Question 1 of 1' && s2.retryId === 'pr2' && /1 of 1 now correct/.test(s2.retryScore), s2);
  const bank = await js(`return JSON.parse(localStorage.getItem('${KEY}:bank-sets'))`);
  check('Set 2 progress is saved apart from Set 1', bank.s2.attempts.length === 1 && bank.s2.retries.length === 1 && (!bank.s1 || !bank.s1.attempts.length), Object.keys(bank));

  // ----- Practice Together: a wrong 2-3 explain item shows one period (shared fix, review L24-05) -----
  await b.load(server.origin + BASE + 'curriculum/chapter-2/lesson-2-3/index.html#practice/together'); await b.reload(); await wait(250);
  const tip = await js(`${FILL_HELPERS}
    const L3 = window.Mathbook.lessons['2-3']; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let g = 0; g < 20; g++) { const el = document.querySelector('#guided-runner .q[data-qkey]'); if (!el) break;
      if (el.dataset.qkey.endsWith('p7')) {
        const q = L3.guided.find((x) => x.id === 'p7');
        const r = Q.correctResponse(q); r[0] = q.parts[0].choices.find((c) => c !== q.parts[0].answer);
        q.parts.forEach((p, i) => { if (p.kind === 'num') { const inp = el.querySelector('.part-input[data-part="' + i + '"]'); inp.value = r[i]; inp.dispatchEvent(new Event('input', { bubbles: true })); }
          else el.querySelectorAll('fieldset[data-part="' + i + '"] input').forEach((x) => { if (x.value === r[i]) x.click(); }); });
        document.querySelector('#guided-runner [data-act=check]').click(); await sleep(100);
        return document.querySelector('#guided-runner .result-box').innerText; }
      document.querySelector('#guided-runner [data-act=next]').click(); await sleep(60); }
    return 'p7 not reached';`);
  check('2-3 Practice Together P7: "Look again at: Choose the best way." with one period', /Look again at: Choose the best way\.(?!\.)/.test(tip) && !/way\.\./.test(tip), tip);

  // ----- The Check-Up test -----
  await b.load(URL + '#test'); await b.reload(); await wait(200);
  const cards = await js(`return Array.from(document.querySelectorAll('.test-card')).map((c) => c.innerText.replace(/\\s+/g, ' '))`);
  check('Take a Test lists the Rounding Check-Up (4 questions)', cards.length === 2 && /Rounding Check-Up .* 4 questions/.test(cards[1]), cards);
  await js(`document.querySelector('[data-start="checkup"]').click();`); await wait(250);
  const t = await js(`${H}
    const qs = JSON.parse(localStorage.getItem('${KEY}:draft-checkup')).questions; const tq = () => document.querySelector('.test-one .q[data-qkey]');
    const o = { c0: count(), leaks: document.querySelectorAll('main .feedback:not([hidden]), main [data-act=hint], main [data-act=check]').length };
    fill(tq(), qs[0], true); document.querySelector('[data-nav="next"]').click();
    return o;`);
  check('Check-Up test: Question 1 of 4, no hints or feedback', t.c0 === 'Question 1 of 4' && t.leaks === 0, t);
  // Save and finish later → Home Continue points at the unfinished Check-Up.
  await b.load(server.origin + BASE); await wait(250);
  const home = await js(`return { shown: !document.getElementById('continue').hidden, href: document.getElementById('continue-link').getAttribute('href'), text: document.getElementById('continue-what').textContent }`);
  check('Home Continue points to the unfinished Rounding Check-Up', home.shown && /lesson-2-2\/#test\/checkup$/.test(home.href) && /Rounding Check-Up: 1 of 4 answered/.test(home.text), home);
  await b.load(URL + '#test/checkup'); await b.reload(); await wait(250);
  const done = await js(`${H}
    const qs = JSON.parse(localStorage.getItem('${KEY}:draft-checkup')).questions; const tq = () => document.querySelector('.test-one .q[data-qkey]');
    const o = { resumed: count() };
    for (let g = 0; g < 10 && tq(); g++) { const i = Number(count().match(/\\d+/)[0]) - 1; if (i > 0) fill(tq(), qs[i], i !== 3); const nx = document.querySelector('[data-nav="next"]'); if (nx) nx.click(); else break; }
    document.querySelector('[data-finish]').click(); await sleep(300);
    const a = JSON.parse(localStorage.getItem('${KEY}:attempts')); o.last = a[a.length - 1];
    o.text = document.querySelector('.result-detail').innerText;
    o.skill = Array.from(document.querySelectorAll('[data-practice]')).map((x) => x.textContent);
    return o;`);
  check('Check-Up test resumes at the saved question, then scores 3 of 4 (75%)', done.resumed === 'Question 2 of 4' && done.last.testId === 'checkup' && done.last.score === 3 && done.last.pct === 75, { resumed: done.resumed, score: done.last && done.last.score });
  check('Results: the missed skill is "Choosing every number that rounds to an amount" → Practice this skill (Set 2)', /Choosing every number that rounds to an amount/.test(done.text) && done.skill.includes('Practice this skill (Set 2)'), done.skill);
  await js(`document.querySelector('[data-practice]').click();`); await wait(250);
  check('"Practice this skill" opens Set 2 at Question 1 of 4', await js(`return location.hash === '#practice/s2' && /Question 1 of 4/.test(document.querySelector('.q-count').textContent)`));

  // ----- The Math Lessons list: only the main Rounding Test decides the score (review L22F-05) -----
  await b.load(server.origin + BASE + 'math/'); await wait(250);
  const note = await js(`const c = Array.from(document.querySelectorAll('.choice-card')).find((a) => /Round Multi-Digit/.test(a.textContent)); const p = c.querySelector('.choice-progress'); return p ? { text: p.textContent, cls: p.className } : null;`);
  check('Lesson list: a Check-Up score alone does not show "Best test score" or "done" for 2-2', note && !/Best test score/.test(note.text) && !/is-done/.test(note.cls), note);

  // ----- Home counts a two-part question only when both parts are answered (review L22F-04) -----
  await b.load(URL + '#test'); await b.reload(); await wait(200);
  await js(`localStorage.removeItem('${KEY}:draft-checkup');`);
  await b.reload(); await wait(200);
  await js(`document.querySelector('[data-start="checkup"]').click();`); await wait(250);
  await js(`${H} const qs = JSON.parse(localStorage.getItem('${KEY}:draft-checkup')).questions; const el = document.querySelector('.test-one .q[data-qkey]');
    el.querySelectorAll('fieldset[data-part="0"] input').forEach((x) => { if (qs[0].parts[0].answer.includes(x.value)) x.click(); });
    document.querySelector('[data-nav="next"]').click();`);
  await b.load(server.origin + BASE); await wait(250);
  const half = await js(`return { shown: !document.getElementById('continue').hidden, text: document.getElementById('continue-what').textContent }`);
  check('Home: only the select-all part answered → Continue is shown, "0 of 4 answered" (as the test menu says)', half.shown && /Rounding Check-Up: 0 of 4 answered/.test(half.text), half);

  // ----- Layout -----
  for (const [w, h] of [[320, 568], [390, 844], [768, 1024], [1366, 768]]) {
    await b.viewport(w, h);
    await b.load(URL + '#practice/s2'); await b.reload(); await wait(250);
    await noOverflow(`Check-Up question @${w}`);
    if (w === 390) await b.shot('tests/screenshots/l22-checkup-q-390.png');
    await b.load(URL + '#practice/own'); await b.reload(); await wait(200);
    await noOverflow(`set chooser @${w}`);
  }
  await b.viewport(1366, 768, false);

  // ----- Reset removes the Check-Up too -----
  await b.load(URL + '#teach'); await b.reload(); await wait(200);
  await js(`document.querySelector('#clear').click(); await new Promise((r) => setTimeout(r, 50)); document.querySelector('#clear-yes').click();`); await wait(250);
  check('Reset Lesson Progress erases the Check-Up set and test', await js(`return Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length === 0`));

  check('No JavaScript errors', b.errors.length === 0, b.errors);
} finally {
  b.close();
  server.close();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed (Lesson 2-2 Rounding Check-Up).`);
process.exit(failed ? 1 : 0);
