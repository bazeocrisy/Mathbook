// End-to-end browser test: Number Words Phase 1 (and its separation from Lesson 2-1).
// Run: npm run test:browser
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const NW = BASE + 'number-words/phase-1/';
const KEY = 'mathbook:v2:number-words:phase-1';
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
  const r = await js(`const doc = document.documentElement;
    const wide = Array.from(document.querySelectorAll('body *')).filter((e) => { if (e.closest('.table-wrap, .skip, .sr-only')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1); }).slice(0, 3).map((e) => e.className || e.tagName);
    return { sw: doc.scrollWidth, cw: doc.clientWidth, wide };`);
  check(`no horizontal overflow: ${label}`, r.sw <= r.cw && r.wide.length === 0, r);
}

// Fill the running spelling test: correct for the first `n` questions, with given formatting.
async function takeSpellingTest(n, format = (w) => w) {
  await hash('#test');
  await js(`document.querySelector('[data-start]').click();`);
  await wait(200);
  return js(`
    const d = JSON.parse(localStorage.getItem('${KEY}:draft'));
    const els = document.querySelectorAll('#test-form .q[data-qkey]');
    const fmt = ${format.toString()};
    d.questions.forEach((q, i) => { const inp = els[i].querySelector('.q-input'); inp.value = i < ${n} ? fmt(q.answer) : q.answer + 'x'; inp.dispatchEvent(new Event('input', { bubbles: true })); });
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = JSON.parse(localStorage.getItem('${KEY}:attempts'));
    return { hash: location.hash, last: a[a.length - 1], all: a, text: document.querySelector('.result-detail')?.innerText || '' };`);
}

try {
  await b.viewport(1280, 900, false);
  await b.load(O + BASE);
  await js('localStorage.clear()');

  // ----- Entry points -----
  await b.load(O + BASE + 'number-words/');
  const overview = await js(`return { h1: document.querySelector('h1').textContent, open: !!document.querySelector('a.lesson-row[href="phase-1/"]'),
    locked: document.querySelectorAll('.lesson-row.is-locked').length, lockedLinks: document.querySelectorAll('a.lesson-row.is-locked').length,
    p4: /2,137 — two thousand, one hundred thirty-seven/.test(document.body.innerText) };`);
  check('Program page: Phase 1 open; Phases 2–4 shown as locked outlines (not links)', overview.open && overview.locked === 3 && overview.lockedLinks === 0 && overview.p4, overview);
  await js(`document.querySelector('a.lesson-row[href="phase-1/"]').click();`); await wait(700);
  check('Phase 1 opens at Learn under /Mathbook/', await js(`return location.pathname === '/Mathbook/number-words/phase-1/' && document.querySelector('[aria-current=step]').dataset.stage === 'learn'`));

  // ----- Learn -----
  const learn = await js(`
    const panel = () => ({ word: document.querySelector('.nw-big-word').textContent, numeral: document.querySelector('#learn-panel .numeral-card').textContent,
      dots: document.querySelectorAll('#learn-panel [data-dot]').length, tiles: document.querySelectorAll('#learn-panel .letter-tile').length, count: document.querySelector('#learn-count').textContent });
    const a = panel();
    document.querySelector('[data-learn="7"]').click(); const b = panel();
    document.querySelector('#learn-next').click(); const c = panel();
    for (let i = 0; i < 5; i++) document.querySelector('#learn-next').click();
    return { a, b, c, lastDisabled: document.querySelector('#learn-next').disabled, prevOk: !document.querySelector('#learn-prev').disabled };`);
  check('Learn: 0 → zero (0 dots), 7 → seven (7 dots, 5 tiles), next → eight', learn.a.word === 'zero' && learn.a.dots === 0 && learn.b.word === 'seven' && learn.b.dots === 7 && learn.b.tiles === 5 && learn.c.word === 'eight' && learn.c.count === 'Word 9 of 11', learn);
  check('Learn: Next stops at ten', learn.lastDisabled, learn);
  await b.shot(path.join(SHOTS, 'nw-learn-desktop.png'));

  // ----- Say -----
  await hash('#say');
  await js(`document.querySelector('[data-said="two"]').click(); document.querySelector('[data-said="eight"]').click();`);
  await js('location.reload()'); await wait(700);
  const say = await js(`return { count: document.querySelector('#say-count').textContent, two: document.querySelector('[data-said="two"]').checked, rows: document.querySelectorAll('.say-row').length };`);
  check('Say: 11 words; ticks are saved across refresh', say.rows === 11 && say.two && say.count === '2 of 11 done', say);

  // ----- Look, Cover, Write, Check -----
  await hash('#write');
  const lcwc = await js(`
    const panel = document.querySelector('#lcwc-panel');
    document.querySelector('[data-wi="8"]').click();
    const look = document.querySelector('#lcwc-panel').innerText;
    document.querySelector('[data-act=cover]').click();
    const coveredHTML = document.querySelector('#stage').innerHTML;
    const coveredText = document.querySelector('#lcwc-panel').innerText;
    const inp = document.querySelector('#lcwc-input');
    const attrs = ['autocomplete','autocorrect','autocapitalize','spellcheck'].map((a) => inp.getAttribute(a));
    document.querySelector('[data-act=check]').click();
    const empty = document.querySelector('#lcwc-panel .error-box').innerText;
    inp.value = 'eigt'; document.querySelector('[data-act=check]').click();
    const wrong = document.querySelector('#lcwc-panel').innerText;
    const wrongMarks = Array.from(document.querySelectorAll('.compare-row:first-child .compare-letters span')).map((s) => s.className);
    document.querySelector('[data-act=again]').click();
    document.querySelector('[data-act=cover]').click();
    document.querySelector('#lcwc-input').value = '  EIGHT '; document.querySelector('[data-act=check]').click();
    const right = document.querySelector('#lcwc-panel').innerText;
    const stored = JSON.parse(localStorage.getItem('${KEY}:written'));
    return { look, coveredLeak: /\\beight\\b/i.test(coveredText) || /\\beight\\b/.test(coveredHTML.replace(/data-[a-z]+="[^"]*"/g, '')), attrs, empty, wrong, wrongMarks, right, stored, done: document.querySelector('[data-wi="8"]').classList.contains('is-done') };`);
  check('Cover: the word is removed from the page while writing (no answer disclosure)', /eight/.test(lcwc.look) && !lcwc.coveredLeak, lcwc);
  check('Cover: autocorrect/spellcheck/autocomplete are off on the spelling input', JSON.stringify(lcwc.attrs) === '["off","off","none","false"]', lcwc.attrs);
  check('Check: empty answer asks for a word; wrong spelling shows letter comparison', /Type the word first/.test(lcwc.empty) && /Not quite yet/.test(lcwc.wrong) && lcwc.wrongMarks.includes('is-wrong'), lcwc);
  check('Check: retry accepts "  EIGHT " (capitals and spaces ignored) and records success', /Correct/.test(lcwc.right) && lcwc.stored.eight.tries === 2 && lcwc.stored.eight.correct && lcwc.done, lcwc);
  await b.shot(path.join(SHOTS, 'nw-write-desktop.png'));

  await js('location.reload()'); await wait(700);
  const writtenSaved = await js(`return { done: document.querySelector('[data-wi="8"]').classList.contains('is-done'), stored: JSON.parse(localStorage.getItem('${KEY}:written')).eight };`);
  check('Look-Cover-Write: "written from memory" progress survives a refresh', writtenSaved.done && writtenSaved.stored.correct, writtenSaved);

  // ----- Guided practice: wrong, then retry the same item correctly -----
  await hash('#practice');
  const retry = await js(`${FILL_HELPERS}
    const box = document.querySelector('#practice-runner');
    const el = box.querySelector('.q[data-qkey]');
    const id = el.dataset.qkey.replace('nwp-', '');
    // Recreate the item's answer from what is on screen: type spell/letter by reading the stored round is not exposed, so use the DOM.
    const type = el.className.match(/q-type-(\\w+)/)[1];
    const fire = (t) => t.dispatchEvent(new Event('input', { bubbles: true }));
    let wrongOk, rightOk;
    if (type === 'mc') {
      const radios = Array.from(el.querySelectorAll('input[type=radio]'));
      for (const r of radios) { r.click(); box.querySelector('[data-act=check]').click(); const t = box.querySelector('.result-box').innerText; if (/Not yet/.test(t)) wrongOk = true; if (/Correct/.test(t)) { rightOk = true; break; } }
    } else {
      const inp = el.querySelector('.q-input, .letter-input'); inp.value = 'q'; fire(inp);
      box.querySelector('[data-act=check]').click(); wrongOk = /Not yet/.test(box.querySelector('.result-box').innerText);
      box.querySelector('[data-act=reveal]').click(); const ans = box.querySelector('.result-box').innerText.match(/Answer:\\s*(\\S+)/)[1];
      inp.value = ans; fire(inp); box.querySelector('[data-act=check]').click(); rightOk = /Correct/.test(box.querySelector('.result-box').innerText);
    }
    return { type, wrongOk: !!wrongOk, rightOk: !!rightOk, dotDone: box.querySelector('.dot.is-done') !== null };`);
  check('Practice: a wrong answer gets "Not yet" feedback, a retry on the same item is marked correct', retry.wrongOk && retry.rightOk && retry.dotDone, retry);
  await js('location.reload()'); await wait(700); await hash('#practice');
  const practice = await js(`${FILL_HELPERS}
    const box = document.querySelector('#practice-runner');
    const types = new Set(); let ok = 0;
    for (let i = 0; i < 8; i++) {
      const el = box.querySelector('.q[data-qkey]');
      const id = el.dataset.qkey.replace('nwp-', '');
      const q = window.Mathbook.numberWords.current && null;
      types.add(el.className.match(/q-type-(\\w+)/)[1]);
      box.querySelector('[data-act=next]') && null;
      if (i === 0) {
        const inp = el.querySelector('input:not([type=radio])'); if (inp) { inp.value = 'zzz'; inp.dispatchEvent(new Event('input', { bubbles: true })); } else el.querySelector('input[type=radio]').click();
        box.querySelector('[data-act=check]').click();
        if (/Not yet/.test(box.querySelector('.result-box').innerText)) ok++;
        box.querySelector('[data-act=hint]').click();
        if (!box.querySelector('.hint-box').hidden) ok++;
        box.querySelector('[data-act=reveal]').click();
        if (/Answer:/.test(box.querySelector('.result-box').innerText)) ok++;
      }
      if (i < 7) box.querySelector('[data-act=next]').click();
    }
    return { types: [...types], ok, dots: box.querySelectorAll('.dot').length };`);
  check('Practice: 8 items mixing typed word, multiple choice, and missing letter', practice.dots === 8 && ['spell', 'mc', 'letter'].every((t) => practice.types.includes(t)), practice);
  check('Practice: wrong → feedback, hint, show answer all work', practice.ok === 3, practice);
  await b.shot(path.join(SHOTS, 'nw-practice-desktop.png'));

  // ----- Spelling test -----
  await hash('#test');
  await js(`document.querySelector('[data-start]').click();`); await wait(200);
  const running = await js(`
    const d = JSON.parse(localStorage.getItem('${KEY}:draft'));
    const text = document.querySelector('#stage').innerText.toLowerCase();
    const html = document.querySelector('#stage').innerHTML.toLowerCase().replace(/data-[a-z]+="[^"]*"/g, '');
    const leaked = d.questions.filter((q) => new RegExp('\\\\b' + q.answer + '\\\\b').test(text));
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 200));
    return { n: d.questions.length, types: [...new Set(d.questions.map((q) => q.type))], hints: document.querySelectorAll('#stage [data-act=hint], #stage .hint-box').length,
      leaked: leaked.map((q) => q.answer), tabsHidden: getComputedStyle(document.querySelector('.stagebar')).display === 'none',
      err: document.querySelector('#test-form .error-box').innerText, saved: (JSON.parse(localStorage.getItem('${KEY}:attempts')) || []).length, omitted: d.omitted, assessed: d.assessed };`);
  check('Spelling test: 10 typed-word questions, no hints, focus mode', running.n === 10 && running.types.join() === 'spell' && running.hints === 0 && running.tabsHidden, running);
  check('Spelling test: no tested word appears anywhere on the page', running.leaked.length === 0, running.leaked);
  check('Spelling test: cannot submit until all 10 are answered', /answer every question/i.test(running.err) && running.saved === 0, running);
  check('Spelling test: 10 different words assessed; 1 left out', new Set(running.assessed).size === 10 && running.omitted.length === 1 && !running.assessed.includes(running.omitted[0]), running);
  await b.viewport(390, 844, true);
  await b.shot(path.join(SHOTS, 'nw-test-phone.png'));
  await noHorizontalScroll('spelling test @ 390px');
  await b.viewport(1280, 900, false);
  await js(`document.querySelector('.test-banner [data-exit]').click();`); await wait(200);

  const caps = await takeSpellingTest(10, (w) => '  ' + w.toUpperCase() + ' ');
  check('Spelling test: "  SEVEN "-style answers graded correct (case/whitespace-insensitive) → 10/10 Mastered', caps.last.score === 10 && /Mastered/.test(caps.text), { score: caps.last.score, text: caps.text.slice(0, 200) });
  check('Results list the words tested and the word left out', /Words tested this time \(10\)/.test(caps.text) && /Not tested this time/.test(caps.text), caps.text.slice(0, 400));
  const eight = await takeSpellingTest(8);
  check('Spelling test: 8/10 → Keep practicing, with 2 missed words explained', eight.last.score === 8 && /Keep practicing/.test(eight.text) && /Words to practice \(2\)/.test(eight.text) && /is spelled/.test(eight.text), eight.text.slice(0, 400));
  check('Rotation: the word left out last time is tested this time', eight.last.assessed.includes(caps.last.omitted[0]) && eight.last.omitted[0] !== caps.last.omitted[0], { first: caps.last.omitted, second: eight.last.omitted });
  const nine = await takeSpellingTest(9);
  check('Mastery rule: 9/10 → Mastered', nine.last.score === 9 && /Mastered/.test(nine.text), nine.last.score);
  await b.shot(path.join(SHOTS, 'nw-results-desktop.png'));
  await b.viewport(390, 844, true);
  await noHorizontalScroll('spelling results @ 390px');
  await b.shot(path.join(SHOTS, 'nw-results-phone.png'));
  await b.viewport(1280, 900, false);

  // Practice missed words from results
  await js(`document.querySelector('[data-view="${eight.last.id}"]').click();`); await wait(200);
  const focus = await js(`document.querySelector('[data-practice-missed]').click(); await new Promise((r) => setTimeout(r, 400));
    return { hash: location.hash, banner: document.querySelector('#nw-practice .parent-tip')?.innerText || '' };`);
  check('"Practice missed words" opens a practice round of just those words', focus.hash === '#practice' && eight.last.missed.every((w) => focus.banner.includes(w)), { focus, missed: eight.last.missed });

  // Persistence and coverage over attempts
  await js('location.reload()'); await wait(700); await hash('#results');
  const hist = await js(`return document.querySelectorAll('.history tbody tr').length;`);
  check('Results persist after refresh (3 attempts)', hist === 3, hist);
  const all = await js(`return JSON.parse(localStorage.getItem('${KEY}:attempts'));`);
  const covered = new Set(all.flatMap((a) => a.assessed));
  check('All 11 words were assessed across the attempts', covered.size === 11, [...covered]);

  // ----- Separation from Lesson 2-1 -----
  await b.load(O + BASE + 'curriculum/chapter-2/lesson-2-1/#test');
  await js(`document.querySelector('[data-start="math"]').click();`); await wait(200);
  await b.load(O + NW + '#test');
  await js(`document.querySelector('[data-start]').click();`); await wait(200);
  await js(`const i = document.querySelector('#test-form .q-input'); i.value = 'one'; i.dispatchEvent(new Event('input', { bubbles: true }));`);
  await b.load(O + BASE + 'curriculum/chapter-2/lesson-2-1/#test');
  const sep = await js(`return { lessonResume: document.querySelector('[data-start="math"]').innerText, lessonAttempts: localStorage.getItem('mathbook:v2:lesson-2-1:attempts'),
    nwDraft: !!localStorage.getItem('${KEY}:draft'), lessonKeys: Object.keys(localStorage).filter((k) => k.includes('lesson-2-1')), nwKeys: Object.keys(localStorage).filter((k) => k.includes('number-words')) };`);
  check('Unfinished Lesson 2-1 and Number Words tests coexist without interfering', /Resume/.test(sep.lessonResume) && sep.nwDraft && sep.lessonAttempts === null && sep.nwKeys.every((k) => k.startsWith(KEY)), sep);
  await b.load(O + BASE);
  const home = await js(`return { items: Array.from(document.querySelectorAll('#continue-list a')).map((a) => a.textContent), badge: document.querySelector('#status-nw-1').textContent };`);
  check('Home: lists both unfinished tests; Number Words badge shows its own result', home.items.some((t) => /Lesson 2-1 Math Test/.test(t)) && home.items.some((t) => /Number Words spelling test \(1 of 10 answered\)/.test(t)) && /Spelling: 9\/10 · Mastered/.test(home.badge), home);

  // Clear only Number Words
  await b.load(O + NW + '#results');
  const cleared = await js(`document.querySelector('#clear').click(); const asked = !!document.querySelector('#clear-yes'); document.querySelector('#clear-yes').click();
    return { asked, nw: Object.keys(localStorage).filter((k) => k.startsWith('${KEY}')).length, lessonDraftKept: !!localStorage.getItem('mathbook:v2:lesson-2-1:draft-math') };`);
  check('Clear Number Words progress asks first and keeps Lesson 2-1 data', cleared.asked && cleared.nw === 0 && cleared.lessonDraftKept, cleared);

  // ----- Layout -----
  for (const [name, w, h] of [['small-phone', 320, 568], ['phone', 390, 844], ['tablet', 768, 1024], ['desktop', 1280, 720], ['short', 640, 360]]) {
    await b.viewport(w, h);
    for (const stage of ['learn', 'say', 'write', 'practice', 'test', 'results']) {
      await b.load(O + NW + '#' + stage);
      await noHorizontalScroll(`Number Words ${stage} @ ${name} ${w}×${h}`);
      if (name === 'phone' && ['learn', 'write', 'practice'].includes(stage)) await b.shot(path.join(SHOTS, `nw-${stage}-phone.png`));
    }
  }
  await b.load(O + BASE + 'number-words/');
  await noHorizontalScroll('Number Words program page @ short 640×360');

  const kb = await js(`return { unlabeled: Array.from(document.querySelectorAll('button, input, select')).filter((e) => !(e.innerText || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label') || e.id && document.querySelector('label[for="' + e.id + '"]'))).length };`);
  check('Every control on the program page is labeled', kb.unlabeled === 0, kb);
  check('No missing files (404s)', server.missing.length === 0, server.missing);
  check('No JavaScript errors', b.errors.length === 0, b.errors);
} catch (e) {
  check('Number Words browser test ran to completion', false, String(e && e.stack || e));
} finally {
  b.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed (Number Words).`);
process.exit(failed.length ? 1 : 0);
