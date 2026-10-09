// End-to-end browser test: Number Words Phase 1 (child view) and its separation from Lesson 2-1.
// Run: npm run test:browser
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser } from './lib/harness.mjs';

const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const NW = BASE + 'number-words/phase-1/';
const KEY = 'mathbook:v2:number-words:phase-1';
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail).slice(0, 700) : ''}`);
}

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const { js, hash } = b;

// Works out the right answer from what is on screen (the practice round is not stored).
const NWQ = `
  const P = Mathbook.numberWords.program.phases[0];
  const btn = (act) => document.querySelector('main [data-act="' + act + '"]');
  const msg = () => (document.querySelector('main .msg:not([hidden])') || {}).innerText || '';
  const fire = (t) => t.dispatchEvent(new Event('input', { bubbles: true }));
  function currentWord() {
    const card = document.querySelector('main .qcard');
    const numeral = card.querySelector('.numeral-card');
    if (numeral) return P.words.find((w) => String(w.n) === numeral.textContent.trim());
    const frame = card.querySelector('.ten-frame');
    if (frame) return P.words.find((w) => w.n === frame.querySelectorAll('[data-dot]').length);
    const m = card.querySelector('.q-prompt').textContent.match(/(\\d+)/);
    return P.words.find((w) => String(w.n) === m[1]);
  }
  function answer(correct) {
    const el = document.querySelector('main .q'); const w = currentWord();
    if (el.classList.contains('q-type-mc')) {
      Array.from(el.querySelectorAll('input[type=radio]')).find((r) => (r.value === w.word) === correct).click();
    } else if (el.classList.contains('q-type-letter')) {
      const k = Array.from(el.querySelectorAll('.letter-word > *')).findIndex((x) => x.tagName === 'INPUT');
      const i = el.querySelector('.letter-input'); i.value = correct ? w.word[k] : (w.word[k] === 'z' ? 'q' : 'z'); fire(i);
    } else { const i = el.querySelector('.q-input'); i.value = correct ? w.word : w.word + 'x'; fire(i); }
    btn('check').click();
    return w.word;
  }`;

async function overflow(label) {
  const r = await js(`const doc = document.documentElement;
    const wide = Array.from(document.querySelectorAll('body *')).filter((e) => { if (e.closest('.table-wrap, .skip, .sr-only, .stars')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    const small = Array.from(document.querySelectorAll('main a[href], main button, main input:not([type=radio]), .bookbar a')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && !e.closest('[hidden], .sr-only, p') && (r.width < 44 || r.height < 44); }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: doc.scrollWidth, cw: doc.clientWidth, wide, small };`);
  check(`layout: no sideways scrolling, targets ≥ 44px — ${label}`, r.sw <= r.cw && r.wide.length === 0 && r.small.length === 0, r);
}

async function spellingTest(n, fmt = (w) => w) {
  await b.load(O + NW + '#test');
  return js(`
    const d = JSON.parse(localStorage.getItem('${KEY}:draft')); const f = ${fmt.toString()};
    while (document.querySelector('[data-act="prev"]')) document.querySelector('[data-act="prev"]').click();
    let leaked = 0;
    for (let i = 0; i < d.questions.length; i++) {
      const text = document.querySelector('main').innerText.toLowerCase();
      if (new RegExp('\\\\b' + d.questions[i].answer + '\\\\b').test(text)) leaked++;
      const inp = document.querySelector('main .q-input'); inp.value = i < ${n} ? f(d.questions[i].answer) : d.questions[i].answer + 'x'; inp.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('[data-act="next"]').click();
    }
    document.querySelector('[data-act="submit"]').click(); await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem('${KEY}:attempts')); return { leaked, hash: location.hash, last: a[a.length - 1], text: document.querySelector('main').innerText };`);
}

try {
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');

  // ----- Entry -----
  await b.navigate(`document.querySelector('.home-choice[href="number-words/"]').click();`);
  check('Number Words page: one big button for Numbers 0 to 10', await js(`return document.querySelector('h1').textContent === 'Number Words' && document.querySelectorAll('a.menu-btn').length === 1 && document.querySelector('a.menu-btn').getAttribute('href') === 'phase-1/'`));
  await b.navigate(`document.querySelector('a.menu-btn').click();`);
  const menu = await js(`return { items: Array.from(document.querySelectorAll('.menu-btn b')).map((x) => x.textContent), logo: document.querySelector('.logo').getAttribute('href'), tabs: document.querySelectorAll('.stagebar').length };`);
  check('Phase 1 menu: Learn the Words, Say Them, Cover and Write, Practice, Spelling Test', JSON.stringify(menu.items) === JSON.stringify(['Learn the Words', 'Say Them', 'Cover and Write', 'Practice', 'Spelling Test']) && menu.logo === '../../' && menu.tabs === 0, menu);

  // ----- Learn -----
  await hash('#learn');
  const learn = await js(`const p = () => ({ word: document.querySelector('.nw-big-word').textContent, dots: document.querySelectorAll('main [data-dot]').length, tiles: document.querySelectorAll('main .letter-tile').length, label: document.querySelector('.dots').getAttribute('aria-label') });
    const a = p(); for (let i = 0; i < 7; i++) document.querySelector('[data-act="next"]').click(); const b = p();
    for (let i = 0; i < 3; i++) document.querySelector('[data-act="next"]').click(); return { a, b, last: document.querySelector('a.btn-main').getAttribute('href') };`);
  check('Learn: one word at a time — zero (0 dots) … seven (7 dots, 5 tiles); ends at Say Them', learn.a.word === 'zero' && learn.a.dots === 0 && learn.a.label === 'Word 1 of 11' && learn.b.word === 'seven' && learn.b.dots === 7 && learn.b.tiles === 5 && learn.last === '#say', learn);

  // ----- Say -----
  await hash('#say');
  await js(`document.querySelector('[data-act="said"]').click(); document.querySelector('[data-act="next"]').click(); document.querySelector('[data-act="said"]').click();`);
  await b.reload(); await hash('#');
  check('Say: "I said it" is saved; menu shows 2 of 11 after a refresh', await js(`return /2 of 11 said/.test(document.querySelectorAll('.menu-btn')[1].innerText) && JSON.parse(localStorage.getItem('${KEY}:said')).zero === true`));

  // ----- Cover and Write -----
  await hash('#write');
  const w = await js(`${NWQ}
    const word = document.querySelector('.nw-big-word').textContent; btn('cover').click();
    const leak = new RegExp('\\\\b' + word + '\\\\b', 'i').test(document.querySelector('main').innerText);
    const attrs = ['autocomplete','autocorrect','autocapitalize','spellcheck'].map((a) => document.querySelector('#lcwc-input').getAttribute(a));
    btn('check').click(); const empty = msg();
    document.querySelector('#lcwc-input').value = word + 'x'; btn('check').click(); const wrong = { msg: msg(), again: !!btn('again'), marks: document.querySelectorAll('.compare-letters .is-wrong').length };
    btn('again').click(); const looking = !!btn('cover'); btn('cover').click();
    document.querySelector('#lcwc-input').value = '  ' + word.toUpperCase() + ' '; btn('check').click();
    return { word, leak, attrs, empty, wrong, looking, right: msg(), next: !!btn('next'), stored: JSON.parse(localStorage.getItem('${KEY}:written'))[word] };`);
  check('Cover: the word is removed from the page while writing', !w.leak, w);
  check('Cover: autocorrect, spellcheck, autocomplete are off', JSON.stringify(w.attrs) === '["off","off","none","false"]', w.attrs);
  check('Check Answer: empty asks for a word; wrong shows letter comparison + Try Again (back to Look)', /Type the word first/.test(w.empty) && /Not quite/.test(w.wrong.msg) && w.wrong.again && w.wrong.marks > 0 && w.looking, w);
  check('Retry with capitals and spaces is correct; progress saved', /^Yes!/.test(w.right) && w.next && w.stored.correct === true && w.stored.tries === 2, w);
  await b.reload(); await hash('#');
  check('Cover and Write progress survives a refresh', await js(`return /1 of 11 written/.test(document.querySelectorAll('.menu-btn')[2].innerText)`));

  // ----- Practice -----
  await hash('#practice');
  const pr = await js(`${NWQ}
    const label = document.querySelector('.dots').getAttribute('aria-label');
    const types = new Set();
    types.add(document.querySelector('main .q').className); answer(true); const right = msg(); btn('next').click();
    types.add(document.querySelector('main .q').className); answer(false); const once = { msg: msg(), again: !!btn('again'), reveal: /The answer is/.test(msg()) };
    btn('again').click(); answer(false); const twice = msg(); btn('next').click();
    for (let i = 2; i < 8; i++) { types.add(document.querySelector('main .q').className); answer(true); btn('next').click(); }
    await new Promise((r) => setTimeout(r, 200));
    return { label, types: [...types].map((t) => t.replace('q q-type-', '')), right, once, twice, summary: document.querySelector('main').innerText };`);
  check('Practice: 8 questions; typed word, multiple choice, and missing letter', pr.label === 'Question 1 of 8' && ['spell', 'mc', 'letter'].every((t) => pr.types.includes(t)), pr);
  check('Practice: right → praise; wrong → clue + Try Again (not the answer); wrong twice → the answer', /Great job|You got it|Super|Nice|Well done/.test(pr.right) && /Not quite/.test(pr.once.msg) && pr.once.again && !pr.once.reveal && /The answer is/.test(pr.twice), pr);
  check('Practice summary: 7 of 8 right on the first try', /7 of 8 right on the first try/.test(pr.summary), pr.summary.slice(0, 120));

  // ----- Spelling test -----
  await hash('#test');
  const t = await js(`const d = JSON.parse(localStorage.getItem('${KEY}:draft'));
    return { n: d.questions.length, types: [...new Set(d.questions.map((q) => q.type))], one: document.querySelectorAll('main .q').length, hints: document.querySelectorAll('main [data-act="hint"], main [data-act="check"], main .msg').length };`);
  check('Spelling test: 10 typed questions, one at a time, no clues or Check Answer', t.n === 10 && t.types.join() === 'spell' && t.one === 1 && t.hints === 0, t);
  const first = await spellingTest(10, (x) => '  ' + x.toUpperCase() + ' ');
  check('Spelling test: no tested word appears on any question screen', first.leaked === 0, first.leaked);
  check('Capitals and spaces don\'t matter: 10 out of 10 → mastered', first.hash === '#done' && first.last.score === 10 && /10 out of 10/.test(first.text) && /mastered/i.test(first.text), first.text.slice(0, 150));
  const second = await spellingTest(8);
  check('8 out of 10 → "Let\'s practice the words you missed" with the 2 words and their spellings', second.last.score === 8 && /practice the words you missed/.test(second.text) && /Words to practice/.test(second.text) && (second.text.match(/The word:/g) || []).length === 2, second.text.slice(0, 200));
  check('Rotation: the word left out of test 1 is in test 2', second.last.assessed.includes(first.last.omitted[0]) && second.last.omitted[0] !== first.last.omitted[0], { first: first.last.omitted, second: second.last.omitted });
  await b.shot(path.join(SHOTS, 'nw-done-desktop.png'));
  const focus = await js(`document.querySelector('#practice-missed').click(); await new Promise((r) => setTimeout(r, 300)); return { hash: location.hash, title: document.querySelector('h1').textContent };`);
  check('"Practice the words I missed" starts practice on just those words', focus.hash === '#practice' && second.last.missed.every((m) => focus.title.includes(m)), { focus, missed: second.last.missed });

  // Unfinished test survives a refresh; the review screen blocks grading.
  await b.load(O + NW + '#test');
  await js(`const i = document.querySelector('main .q-input'); i.value = 'one'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-act="next"]').click();`);
  await b.reload();
  const resume = await js(`const label = document.querySelector('.dots').getAttribute('aria-label'); for (let i = 0; i < 10; i++) { const n = document.querySelector('[data-act="next"]'); if (n) n.click(); }
    return { label, review: document.querySelector('main').innerText.slice(0, 160), disabled: document.querySelector('[data-act="submit"]').disabled };`);
  check('Unfinished spelling test resumes at question 2; review blocks grading until all answered', resume.label === 'Question 2 of 10' && /You answered 1 of 10/.test(resume.review) && resume.disabled, resume);

  // ----- Separation from Lesson 2-1 -----
  await b.load(O + BASE + 'curriculum/chapter-2/lesson-2-1/#test/math');
  await b.load(O + BASE + 'grown-ups/');
  const gu = await js(`return { cont: Array.from(document.querySelectorAll('#continue a')).map((a) => a.textContent), words: document.querySelector('#words').innerText };`);
  check('For Grown-Ups lists both unfinished tests and Number Words results separately', gu.cont.some((c) => /Math Test/.test(c)) && gu.cont.some((c) => /Spelling Test/.test(c)) && /Spelling tests/.test(gu.words) && /1 of 11/.test(gu.words), gu);
  const clear = await js(`document.querySelector('[data-clear="words"]').click(); document.querySelector('#clear-yes').click();
    return { nw: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length, lessonDraft: !!localStorage.getItem('mathbook:v2:lesson-2-1:draft-math') };`);
  check('Clear Number Words progress removes only Number Words data', clear.nw === 0 && clear.lessonDraft, clear);

  // ----- Layout -----
  for (const [name, w2, h2] of [['small phone', 320, 568], ['phone', 390, 844], ['tablet', 768, 1024], ['laptop', 1280, 720]]) {
    await b.viewport(w2, h2);
    for (const r of ['', '#learn', '#say', '#write', '#practice', '#test']) {
      await b.load(O + NW + r);
      await overflow(`Number Words ${r || 'menu'} @ ${name} ${w2}×${h2}`);
      if (name === 'phone' && ['#learn', '#practice'].includes(r)) await b.shot(path.join(SHOTS, `nw-phone-${r.slice(1)}.png`));
    }
  }
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('Number Words browser test ran to completion', false, { error: String(e && e.stack || e).slice(0, 400), pageErrors: b.errors.slice(0, 3) });
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (Number Words).`);
process.exit(failed.length ? 1 : 0);
