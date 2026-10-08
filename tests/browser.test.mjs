// End-to-end browser test for Lesson 2-1 (no dependencies).
// Serves the repo under /Mathbook/ (like GitHub Pages), drives headless Chrome or Edge over the
// DevTools protocol, and saves screenshots to tests/screenshots/.
// Run: npm run test:browser   (set CHROME_PATH if Chrome is not found automatically)
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = path.join(ROOT, 'tests', 'screenshots');
const BASE = '/Mathbook/';
const results = [];
const missing = [];

function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? '✔' : '✖'} ${name}${!ok && detail !== undefined ? ' — ' + JSON.stringify(detail) : ''}`);
}

// ---------- Static server (GitHub Pages project path) ----------
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(BASE)) { missing.push(url); res.writeHead(404).end(); return; }
  let file = path.join(ROOT, url.slice(BASE.length));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { if (!url.endsWith('favicon.ico')) missing.push(url); res.writeHead(404).end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const ORIGIN = `http://127.0.0.1:${server.address().port}`;

// ---------- Browser ----------
const candidates = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
const exe = candidates.find((p) => fs.existsSync(p));
if (!exe) { console.error('No Chrome/Edge found. Set CHROME_PATH.'); process.exit(2); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mathbook-chrome-'));
const chrome = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

let port;
for (let i = 0; i < 100 && !port; i++) {
  await new Promise((r) => setTimeout(r, 100));
  try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; } catch { /* not ready */ }
}
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let nextId = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
});
function send(method, params = {}) {
  const id = ++nextId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((r) => pending.set(id, r));
}
async function js(expr) {
  const r = await send('Runtime.evaluate', { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'evaluate failed');
  return r.result.result.value;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function load(url) {
  await send('Page.navigate', { url: ORIGIN + url });
  await wait(700);
}
async function hash(h) { await js(`location.hash = '${h}';`); await wait(250); }
async function shot(name, full = true) {
  const m = await js('return { w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight };');
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full, clip: full ? { x: 0, y: 0, width: m.w, height: Math.min(m.h, 12000), scale: 1 } : undefined });
  fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64'));
}
async function viewport(width, height, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
}
async function noHorizontalScroll(label) {
  const r = await js(`
    const doc = document.documentElement;
    const wide = Array.from(document.querySelectorAll('body *')).filter((e) => {
      // Scrollable tables are allowed; the skip link and screen-reader text are hidden off-screen on purpose.
      if (e.closest('.table-wrap, .skip, .sr-only')) return false;
      const b = e.getBoundingClientRect();
      return b.width > 0 && (b.right > doc.clientWidth + 1 || b.left < -1);
    }).slice(0, 3).map((e) => {
      const b = e.getBoundingClientRect();
      const p = e.parentElement.getBoundingClientRect();
      const grid = e.closest('.q-build');
      return (e.className || e.tagName) + ' [' + Math.round(b.left) + '–' + Math.round(b.right) + '] parent [' + Math.round(p.left) + '–' + Math.round(p.right) + ']' +
        (grid ? ' grid=' + getComputedStyle(grid).gridTemplateColumns + ' in ' + (e.closest('.card') || {}).id : '') +
        (grid ? ' chain=' + (() => { const out = []; for (let a = grid; a && a !== document.body; a = a.parentElement) out.push(a.tagName + '.' + a.className + ':' + Math.round(a.getBoundingClientRect().width) + ':' + getComputedStyle(a).display); return out.join(' > '); })() : '');
    });
    return { sw: doc.scrollWidth, cw: doc.clientWidth, wide };`);
  check(`no horizontal overflow: ${label}`, r.sw <= r.cw && r.wide.length === 0, r);
}

// In-page helpers: fill a question with the correct or a wrong answer, the way a student would.
const HELPERS = `
  const MB = window.Mathbook, Q = MB.Q, pv = MB.pv, L = MB.lessons['2-1'];
  function wrong(q) {
    switch (q.type) {
      case 'mc': case 'select': return q.choices.find((c) => c !== q.answer);
      case 'number': return String(q.answer + 1);
      case 'expanded': return pv.fmt(q.answer);
      case 'words': return 'zero';
      case 'chart': return q.answer === 9999 ? ['1','1','1','1'] : ['9','9','9','9'];
      case 'build': return q.answer === 1000 ? [2,0,0,0] : [1,0,0,0];
    }
  }
  function fill(el, q, correct) {
    const r = correct ? Q.correctResponse(q) : wrong(q);
    const fire = (t, type) => t.dispatchEvent(new Event(type, { bubbles: true }));
    if (q.type === 'mc') { const i = Array.from(el.querySelectorAll('input[type=radio]')).find((x) => x.value === r); i.click(); }
    else if (q.type === 'select') { const s = el.querySelector('select'); s.value = r; fire(s, 'change'); }
    else if (q.type === 'chart') el.querySelectorAll('.q-chart input').forEach((i, k) => { i.value = r[k]; fire(i, 'input'); });
    else if (q.type === 'build') el.querySelectorAll('.stepper').forEach((s, k) => {
      for (let n = 0; n < 9; n++) s.querySelector('[data-step="-1"]').click();
      for (let n = 0; n < r[k]; n++) s.querySelector('[data-step="1"]').click();
    });
    else { const i = el.querySelector('.q-input'); i.value = r; fire(i, 'input'); }
  }
  const store = (k) => JSON.parse(localStorage.getItem(L.storageKey + ':' + k) || 'null');
`;

async function takeTest(id, correctCount) {
  await hash('#test');
  await js(`document.querySelector('[data-start="${id}"]').click();`);
  await wait(200);
  return js(`${HELPERS}
    const draft = store('draft-${id}');
    const els = document.querySelectorAll('#test-form .q[data-qkey]');
    draft.questions.forEach((q, i) => fill(els[i], q, i < ${correctCount}));
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = store('attempts');
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail')?.innerText || '' };`);
}

try {
  fs.mkdirSync(SHOTS, { recursive: true });
  await send('Page.enable');
  await send('Runtime.enable');

  // ----- Home page and paths -----
  await viewport(1280, 900, false);
  await load(BASE);
  check('home page loads with lesson link', await js(`return !!document.querySelector('a[href="curriculum/chapter-2/lesson-2-1/"]');`));
  await shot('home-desktop', false);
  await js(`document.querySelector('.lesson-row').click();`);
  await wait(700);
  check('lesson opens from home (relative path under /Mathbook/)', await js(`return location.pathname === '/Mathbook/curriculum/chapter-2/lesson-2-1/' && !!document.querySelector('.stagebar');`));
  await js('localStorage.clear(); location.hash = "#teach"; location.reload();');
  await wait(700);

  // ----- Teach It -----
  const teach = await js(`return {
    h1: document.querySelector('h1').textContent,
    guide: document.querySelectorAll('.guide-card').length,
    vocab: document.querySelectorAll('.vocab-card').length,
    script: document.querySelectorAll('.script-step').length,
    current: document.querySelector('[aria-current=step]').dataset.stage,
    name: /chris/i.test(document.body.innerText) };`);
  check('Teach It: title, 6 parent-guide answers, vocabulary, script', teach.h1 === 'Represent 4-Digit Numbers' && teach.guide === 6 && teach.vocab === 6 && teach.script === 5 && teach.current === 'teach', teach);
  check('no student name shown', !teach.name);

  // ----- See It: step-through and block counts -----
  await hash('#see');
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

  // ----- Practice It -----
  await hash('#practice');
  const guided = await js(`${HELPERS}
    const box = document.querySelector('#guided-card');
    const q = L.guided[0];
    const el = box.querySelector('.q[data-qkey]');
    fill(el, q, false);
    box.querySelector('[data-act=check]').click();
    const wrongMsg = box.querySelector('.result-box').innerText;
    fill(el, q, true);
    box.querySelector('[data-act=check]').click();
    const rightMsg = box.querySelector('.result-box').innerText;
    box.querySelector('[data-act=hint]').click();
    const hint = !box.querySelector('.hint-box').hidden;
    box.querySelector('[data-act=next]').click();
    const second = document.querySelector('#guided-card .q-prompt').innerText;
    return { wrongMsg, rightMsg, hint, second };`);
  check('Guided: wrong answer can be corrected; correct answer explained; hint shows', /Not yet/.test(guided.wrongMsg) && /Correct/.test(guided.rightMsg) && guided.hint && /5,072/.test(guided.second), guided);

  const indep = await js(`${HELPERS}
    document.querySelector('#new-set').click();
    const set = store('practice');
    document.querySelector('#check-set').click();
    const blocked = document.querySelector('#indep .error-box').innerText;
    const qs = set.ids.map((id) => L.bank.find((q) => q.id === id));
    const els = document.querySelectorAll('#indep .q[data-qkey]');
    qs.forEach((q, i) => fill(els[i], q, i !== 0));
    document.querySelector('#check-set').click();
    return { n: set.ids.length, blocked, score: document.querySelector('.set-score').innerText,
      wrong: document.querySelectorAll('#indep .feedback-no').length, ok: document.querySelectorAll('#indep .feedback-ok').length };`);
  check('Independent: set of 10; must answer all; scored with explanations', indep.n === 10 && /Answer every question/.test(indep.blocked) && /9 of 10 correct/.test(indep.score) && indep.wrong === 1 && indep.ok === 9, indep);

  const skillSet = await js(`${HELPERS}
    const sel = document.querySelector('#skill-filter'); sel.value = 'expanded'; document.querySelector('#new-set').click();
    const s = store('practice');
    return { n: s.ids.length, all: s.ids.every((id) => L.bank.find((q) => q.id === id).skill === 'expanded') };`);
  check('Independent: skill filter builds a skill-only set', skillSet.all && skillSet.n === 5, skillSet);

  // ----- Test It -----
  await hash('#test');
  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const blocked = await js(`${HELPERS}
    const n = document.querySelectorAll('#test-form .q[data-qkey]').length;
    const hints = document.querySelectorAll('#test-form .hint-box, #test-form [data-act=hint]').length;
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 200));
    return { n, hints, err: document.querySelector('#test-form .error-box').innerText, flagged: document.querySelectorAll('.needs-answer').length,
      saved: (store('attempts') || []).length, types: [...new Set(store('draft-math').questions.map((q) => q.type))] };`);
  check('Math Test: 10 questions, several types, no hints', blocked.n === 10 && blocked.hints === 0 && blocked.types.length >= 4, blocked);
  check('Math Test: cannot submit until every question is answered', /answer every question/i.test(blocked.err) && blocked.flagged === 10 && blocked.saved === 0, blocked);
  await viewport(390, 844, true);
  await shot('test-math-phone');
  await viewport(1280, 900, false);

  // Resume: answer 3, reload, the answers are still there.
  const resumed = await js(`${HELPERS}
    const d = store('draft-math'); const els = document.querySelectorAll('#test-form .q[data-qkey]');
    d.questions.slice(0, 3).forEach((q, i) => fill(els[i], q, true));
    return document.querySelector('#answered').textContent;`);
  await js('location.reload();');
  await wait(700);
  await hash('#test');
  await js(`document.querySelector('[data-start="math"]').click();`);
  await wait(200);
  const afterReload = await js(`return { label: document.querySelector('[data-start]') ? 'chooser' : 'runner', answered: document.querySelector('#answered')?.textContent };`);
  check('Unfinished test survives a page refresh', resumed === '3 of 10 answered' && afterReload.answered === '3 of 10 answered', { resumed, afterReload });

  const perfect = await js(`${HELPERS}
    const d = store('draft-math'); const els = document.querySelectorAll('#test-form .q[data-qkey]');
    d.questions.forEach((q, i) => fill(els[i], q, true));
    document.querySelector('#test-form button[type=submit]').click();
    await new Promise((r) => setTimeout(r, 400));
    const a = store('attempts');
    return { hash: location.hash, last: a[a.length - 1], text: document.querySelector('.result-detail').innerText };`);
  const missedQs = perfect.last.questions.filter((q, i) => !perfect.last.correct[i]).map((q) => ({ q, r: perfect.last.responses[q.id] }));
  check('Math Test: all-correct answers score 10/10 = 100% Mastered', perfect.hash === '#results' && perfect.last.score === 10 && perfect.last.pct === 100 && /Mastered/.test(perfect.text), { score: perfect.last.score, missedQs });
  await shot('results-mastered-desktop');

  const zero = await takeTest('math', 0);
  check('Math Test retake uses new numbers', JSON.stringify(zero.last.questions) !== JSON.stringify(perfect.last.questions));
  check('Math Test: all-wrong scores 0% Reteach with 10 explained mistakes', zero.last.score === 0 && /Reteach and reassess/.test(zero.text) && /Mistakes to review \(10\)/.test(zero.text), zero.text.slice(0, 300));

  const vocab = await takeTest('vocab', 8);
  check('Vocabulary Test: 8 of 10 → 80% Review missed skills', vocab.last.score === 8 && vocab.last.pct === 80 && /Review missed skills/.test(vocab.text) && /Mistakes to review \(2\)/.test(vocab.text), vocab.text.slice(0, 300));
  check('Results list skills to review with a next action', /Skills to review/.test(vocab.text) && /(Practice this skill|Review vocabulary)/.test(vocab.text), vocab.text);
  await viewport(390, 844, true);
  await shot('results-review-phone');
  await viewport(1280, 900, false);

  const math7 = await takeTest('math', 7);
  check('Math Test: 7 of 10 → 70% Review missed skills (threshold)', math7.last.pct === 70 && /Review missed skills/.test(math7.text), math7.last.pct);
  const math9 = await takeTest('math', 9);
  check('Math Test: 9 of 10 → 90% Mastered (threshold)', math9.last.pct === 90 && /Mastered/.test(math9.text), math9.last.pct);
  const math6 = await takeTest('math', 6);
  check('Math Test: 6 of 10 → 60% Reteach (threshold)', math6.last.pct === 60 && /Reteach and reassess/.test(math6.text), math6.last.pct);

  // Results survive a refresh; history lists every attempt.
  await js('location.reload();');
  await wait(700);
  const persisted = await js(`return { rows: document.querySelectorAll('.history tbody tr').length, local: /only in this browser/.test(document.body.innerText),
    detail: document.querySelector('.result-detail h2').innerText };`);
  check('Results and history persist after refresh (6 attempts)', persisted.rows === 6 && persisted.local, persisted);

  // "Practice this skill" jumps to a filtered practice set.
  const jump = await js(`${HELPERS}
    const b = document.querySelector('[data-practice]');
    if (!b) return { skipped: true };
    const skill = b.dataset.practice; b.click();
    await new Promise((r) => setTimeout(r, 400));
    const s = store('practice');
    return { hash: location.hash, skill, ok: s.skill === skill && s.ids.every((id) => L.bank.find((q) => q.id === id).skill === skill), filter: document.querySelector('#skill-filter').value };`);
  check('"Practice this skill" opens a set for that skill', jump.hash === '#practice' && jump.ok && jump.filter === jump.skill, jump);

  // Home page shows the latest Math Test result.
  await load(BASE);
  check('Home shows latest Math Test status', /Math Test: 60%/.test(await js(`return document.querySelector('#status-2-1').textContent;`)));

  // Clear progress (in-page confirmation, no browser dialogs).
  await load(BASE + 'curriculum/chapter-2/lesson-2-1/#results');
  const cleared = await js(`
    document.querySelector('#clear').click();
    const asked = !!document.querySelector('#clear-yes');
    document.querySelector('#clear-yes').click();
    return { asked, keys: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).length, text: document.querySelector('h2').innerText };`);
  check('Clear progress asks first, then removes all saved data', cleared.asked && cleared.keys === 0 && /No test results yet/.test(cleared.text), cleared);

  // ----- Layout at phone, tablet, desktop -----
  const sizes = [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['desktop', 1280, 900, false]];
  for (const [name, w, h, mobile] of sizes) {
    await viewport(w, h, mobile);
    for (const stage of ['teach', 'see', 'practice', 'test', 'results']) {
      await hash('#' + stage);
      if (stage === 'practice') await js(`document.querySelector('#new-set').click();`);
      await noHorizontalScroll(`${stage} @ ${name} ${w}px`);
      if (name !== 'tablet' || stage === 'see') await shot(`${stage}-${name}`);
    }
  }
  await viewport(320, 640, true);
  for (const stage of ['teach', 'see', 'practice', 'test']) { await hash('#' + stage); await noHorizontalScroll(`${stage} @ small phone 320px`); }

  // Block-building questions are the widest controls: force them onto narrow phones.
  for (const w of [320, 390]) {
    await viewport(w, 800, true);
    await hash('#practice');
    await js(`const s = document.querySelector('#skill-filter'); s.value = 'model'; document.querySelector('#new-set').click();`);
    await noHorizontalScroll(`block-building practice set @ ${w}px`);
    if (w === 390) await shot('practice-build-phone');
  }

  // Stress: many all-correct attempts through the real UI must all score 100%.
  await viewport(1280, 900, false);
  const scores = [];
  for (let i = 0; i < 20; i++) {
    for (const id of ['math', 'vocab']) {
      const a = await takeTest(id, 10);
      if (a.last.score !== 10) scores.push({ id, missed: a.last.questions.filter((q, k) => !a.last.correct[k]).map((q) => ({ q, r: a.last.responses[q.id] })) });
    }
  }
  check('40 all-correct test attempts (20 Math, 20 Vocabulary) all score 100%', scores.length === 0, scores);

  // Keyboard: stage links and controls are real links/buttons, reachable by Tab.
  const kb = await js(`return { links: document.querySelectorAll('.stagebar a[href]').length,
    unlabeled: Array.from(document.querySelectorAll('button, input, select')).filter((e) => !(e.innerText || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label'))).length };`);
  check('Keyboard/screen reader: 5 stage links, every control labeled', kb.links === 5 && kb.unlabeled === 0, kb);

  check('No missing files (404s)', missing.length === 0, missing);
  check('No JavaScript errors', errors.length === 0, errors);
} catch (e) {
  check('browser test ran to completion', false, String(e && e.stack || e));
} finally {
  ws.close();
  chrome.kill();
  server.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed. Screenshots: tests/screenshots/`);
process.exit(failed.length ? 1 : 0);
