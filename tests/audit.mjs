// Forensic UX audit: measures every key screen/state at 8 viewports (+ 200% zoom), plus focus,
// text scaling, reduced motion, state transitions, and answer leakage. Measurements only; no judgments.
// Run: node tests/audit.mjs <label>     → tests/audit-output/<label>/ (report.md, metrics.json, screenshots)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, BASE, startServer, startBrowser, FILL_HELPERS } from './lib/harness.mjs';

const label = process.argv[2] || 'run';
const OUT = path.join(ROOT, 'tests', 'audit-output', label);
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  ['small-phone', 320, 568], ['phone', 375, 667], ['modern-phone', 390, 844], ['tablet-portrait', 768, 1024],
  ['tablet-landscape', 1024, 768], ['laptop', 1280, 720], ['desktop', 1440, 900], ['large', 1920, 1080],
  ['zoom-200%', 640, 360]
];
const LESSON = BASE + 'curriculum/chapter-2/lesson-2-1/';
const NW = BASE + 'number-words/phase-1/';

const server = await startServer();
const b = await startBrowser();
const O = server.origin;
const hasNW = fs.existsSync(path.join(ROOT, 'number-words', 'index.html'));

// ---------- Measurements (run in the page) ----------
const MEASURE = `
  const doc = document.documentElement;
  const vis = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !e.closest('[hidden], .sr-only, .skip'); };
  const desc = (e) => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : e.tagName.toLowerCase());
  const all = Array.from(document.querySelectorAll('body *')).filter(vis);
  const offscreen = all.filter((e) => { if (e.closest('.table-wrap')) return false; const r = e.getBoundingClientRect(); return r.right > doc.clientWidth + 1 || r.left < -1; }).slice(0, 5).map(desc);
  // Text that spills out of its own box (overlap/truncation risk).
  const spill = all.filter((e) => {
    if (e.closest('.table-wrap') || ['svg','INPUT','SELECT','TEXTAREA'].includes(e.tagName) || e.closest('svg')) return false;
    const hasText = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    return hasText && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).display !== 'inline';
  }).slice(0, 6).map((e) => desc(e) + ' "' + e.textContent.trim().slice(0, 24) + '"');
  const targets = Array.from(document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, label.choice')).filter(vis)
    // A checkbox/radio inside a clickable label: the label is the touch target, so measure the label instead.
    .filter((e) => { if (e.tagName !== 'INPUT' || !['checkbox', 'radio'].includes(e.type)) return true; const l = e.closest('label'); if (!l) return true; const r = l.getBoundingClientRect(); return r.width < 44 || r.height < 44; })
    .filter((e) => !(e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.closest('p, li')));
  const small = (min) => targets.filter((e) => { const r = e.getBoundingClientRect(); return r.width < min || r.height < min; });
  const s44 = small(44), s24 = small(24);
  // Contrast of visible text against its nearest solid background.
  const parse = (c) => { const m = c.match(/[\\d.]+/g); return m ? m.map(Number) : [0,0,0,1]; };
  const lum = ([r, g, bb]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb); };
  function bgOf(e) {
    for (let a = e; a; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.backgroundImage && s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('url')) return { unknown: true };
      const c = parse(s.backgroundColor);
      if ((c[3] === undefined ? 1 : c[3]) > 0.9) return { c };
    }
    return { c: [255,255,255,1] };
  }
  let fails = [], unknown = 0, minFont = 99, checked = 0;
  for (const e of all) {
    const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own || e.closest('svg')) continue;
    const s = getComputedStyle(e);
    const size = parseFloat(s.fontSize);
    minFont = Math.min(minFont, size);
    let op = 1; for (let a = e; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
    const bg = bgOf(e);
    if (bg.unknown) { unknown++; continue; }
    checked++;
    const fg = parse(s.color);
    const L1 = lum(fg), L2 = lum(bg.c);
    let ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    if (op < 1) ratio = 1 + (ratio - 1) * op; // approximate faded content
    const large = size >= 24 || (size >= 18.66 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) fails.push(desc(e) + ' ' + ratio.toFixed(2) + ' "' + e.textContent.trim().slice(0, 20) + '"');
  }
  const sticky = Array.from(document.querySelectorAll('body *')).filter((e) => ['sticky','fixed'].includes(getComputedStyle(e).position) && vis(e));
  const cover = sticky.reduce((h, e) => { const r = e.getBoundingClientRect(); return r.top <= 1 ? h + r.height : h; }, 0);
  return {
    overflowX: doc.scrollWidth > doc.clientWidth, scrollW: doc.scrollWidth, clientW: doc.clientWidth,
    offscreen, spill, small44: s44.length, small24: s24.length, small24List: s24.slice(0, 4).map(desc), small44List: s44.slice(0, 4).map(desc),
    minFont, contrastFails: fails.length, contrastList: fails.slice(0, 4), contrastUnknown: unknown, contrastChecked: checked,
    stickyPct: Math.round(cover / innerHeight * 100), screens: +(doc.scrollHeight / innerHeight).toFixed(1),
    words: document.body.innerText.split(/\\s+/).length
  };`;

// ---------- Screen/state setup (fresh storage each time) ----------
async function fresh(url) {
  await b.load(O + BASE);
  await b.js('localStorage.clear(); sessionStorage.clear();');
  await b.load(O + url);
}
const STATES = [
  ['home', async () => fresh(BASE)],
  ['teach', async () => fresh(LESSON + '#teach')],
  ['see-step-1', async () => fresh(LESSON + '#see')],
  ['see-final-step', async () => { await fresh(LESSON + '#see'); await b.js(`for (let i = 0; i < 10; i++) document.querySelector('#demo-next').click();`); }],
  ['guided-wrong+hint', async () => {
    await fresh(LESSON + '#practice');
    await b.js(`${FILL_HELPERS} const box = document.querySelector('#guided-runner') || document.querySelector('#guided-card'); fill(box.querySelector('.q[data-qkey]'), L.guided[0], false);
      box.querySelector('[data-act=check]').click(); box.querySelector('[data-act=hint]').click(); document.querySelector('#guided').scrollIntoView();`);
  }],
  // Practice bank (Build 2.1 final): Set 2 has the widest controls (block steppers).
  ['independent-set', async () => {
    await fresh(LESSON + '#practice');
    await b.js(`document.querySelector('[data-open-set="s2"]').click(); document.querySelector('#independent').scrollIntoView();`);
  }],
  ['independent-checked', async () => {
    await fresh(LESSON + '#practice');
    await b.js(`${FILL_HELPERS} document.querySelector('[data-open-set="s2"]').click();
      const els = Array.from(document.querySelectorAll('#indep .q[data-qkey]'));
      els.forEach((el, i) => fill(el, L.bank.find((q) => q.id === el.dataset.qkey.replace('p-', '')), i % 3 !== 0));
      document.querySelector('#check-set').click();`);
  }],
  ['practice-my-misses', async () => {
    await fresh(LESSON + '#practice');
    await b.js(`${FILL_HELPERS} document.querySelector('[data-open-set="s2"]').click();
      const els = Array.from(document.querySelectorAll('#indep .q[data-qkey]'));
      els.forEach((el, i) => fill(el, L.bank.find((q) => q.id === el.dataset.qkey.replace('p-', '')), i % 3 !== 0));
      document.querySelector('#check-set').click(); document.querySelector('#practice-misses').click();`);
  }],
  ['test-chooser', async () => fresh(LESSON + '#test')],
  ['vocab-test-running', async () => { await fresh(LESSON + '#test'); await b.js(`document.querySelector('[data-start="vocab"]').click();`); await b.wait(200); }],
  ['math-test-submit-blocked', async () => {
    await fresh(LESSON + '#test'); await b.js(`document.querySelector('[data-start="math"]').click();`); await b.wait(200);
    await b.js(`document.querySelector('#test-form button[type=submit]').click();`); await b.wait(150); await b.js('scrollTo(0,0)');
  }],
  ['results', async () => {
    await fresh(LESSON + '#test');
    for (const [id, n] of [['vocab', 8], ['math', 6]]) {
      await b.hash('#test');
      await b.js(`document.querySelector('[data-start="${id}"]').click();`); await b.wait(150);
      await b.js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-${id}')); const els = document.querySelectorAll('#test-form .q[data-qkey]');
        d.questions.forEach((q, i) => fill(els[i], q, i < ${n})); document.querySelector('#test-form button[type=submit]').click();`);
      await b.wait(400);
    }
    await b.js('scrollTo(0,0)');
  }]
];
if (hasNW) {
  STATES.push(
    ['nw-learn', async () => fresh(NW + '#learn')],
    ['nw-cover-write', async () => { await fresh(NW + '#write'); await b.js(`document.querySelector('[data-act=cover]')?.click();`); }],
    ['nw-practice-feedback', async () => {
      await fresh(NW + '#practice');
      await b.js(`const el = document.querySelector('#nw-practice .q[data-qkey]'); const i = el.querySelector('input:not([type=radio])'); if (i) { i.value = 'xx'; i.dispatchEvent(new Event('input', {bubbles:true})); } else el.querySelector('input[type=radio]').click(); document.querySelector('#nw-practice [data-act=check]').click();`);
    }],
    ['nw-test-running', async () => { await fresh(NW + '#test'); await b.js(`document.querySelector('[data-start]').click();`); await b.wait(200); }],
    ['nw-results', async () => {
      await fresh(NW + '#test'); await b.js(`document.querySelector('[data-start]').click();`); await b.wait(200);
      await b.js(`${FILL_HELPERS} const P = MB.numberWords.current; const d = JSON.parse(localStorage.getItem(P.storageKey + ':draft'));
        const els = document.querySelectorAll('#test-form .q[data-qkey]'); d.questions.forEach((q, i) => fill(els[i], q, i < 8)); document.querySelector('#test-form button[type=submit]').click();`);
      await b.wait(400); await b.js('scrollTo(0,0)');
    }]
  );
}

// ---------- 1. Device-state matrix ----------
const matrix = [];
for (const [vname, w, h] of VIEWPORTS) {
  await b.viewport(w, h);
  for (const [sname, setup] of STATES) {
    try {
      await setup();
      await b.wait(150);
      const m = await b.js(MEASURE);
      matrix.push({ viewport: `${vname} ${w}×${h}`, state: sname, ...m });
      if (['small-phone', 'modern-phone', 'tablet-landscape', 'laptop', 'large'].includes(vname)) await b.shot(path.join(OUT, 'shots', `${sname}__${vname}-${w}x${h}.png`), sname !== 'home' || true);
    } catch (e) {
      matrix.push({ viewport: `${vname} ${w}×${h}`, state: sname, error: String(e.message || e) });
    }
  }
}

// ---------- 2. Focus order and visibility (keyboard only, laptop) ----------
await b.viewport(1280, 720, false);
const focus = [];
for (const [sname, url] of [['home', BASE], ['teach', LESSON + '#teach'], ['see', LESSON + '#see'], ['practice', LESSON + '#practice'], ['test-chooser', LESSON + '#test']].concat(hasNW ? [['nw-learn', NW + '#learn'], ['nw-test', NW + '#test']] : [])) {
  await fresh(url);
  await b.js('document.activeElement && document.activeElement.blur(); window.scrollTo(0,0);');
  const stops = [];
  for (let i = 0; i < 45; i++) {
    await b.key('Tab');
    stops.push(await b.js(`const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e); const r = e.getBoundingClientRect();
      const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
      const lab = e.closest('label'); const ringLabel = lab ? (getComputedStyle(lab).outlineStyle !== 'none' && parseFloat(getComputedStyle(lab).outlineWidth) > 0) : false;
      return { el: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(' ')[0] : ''), name: (e.getAttribute('aria-label') || e.innerText || e.value || '').trim().slice(0, 30), visible: ring || ringLabel, onScreen: r.bottom > 0 && r.top < innerHeight, y: Math.round(r.top + scrollY) };`));
  }
  const real = stops.filter(Boolean);
  focus.push({ state: sname, stops: real.length, noRing: real.filter((s) => !s.visible).map((s) => s.el + ' "' + s.name + '"').slice(0, 6), offScreen: real.filter((s) => !s.onScreen).length, first: real.slice(0, 6).map((s) => s.name) });
}

// ---------- 3. Text scaling (browser text size 200%) ----------
const scaling = [];
for (const [vname, w, h] of [['laptop', 1280, 720], ['modern-phone', 390, 844]]) {
  await b.viewport(w, h);
  for (const [sname, setup] of STATES.filter(([n]) => ['home', 'teach', 'see-step-1', 'independent-set', 'vocab-test-running', 'results', 'nw-learn', 'nw-test-running'].includes(n))) {
    await setup();
    await b.js(`document.documentElement.style.fontSize = (parseFloat(getComputedStyle(document.documentElement).fontSize) * 2) + 'px';`);
    await b.wait(150);
    const m = await b.js(MEASURE);
    scaling.push({ viewport: `${vname} ${w}×${h}`, state: sname, overflowX: m.overflowX, offscreen: m.offscreen, spill: m.spill });
    if (vname === 'modern-phone' && ['teach', 'vocab-test-running', 'nw-learn'].includes(sname)) await b.shot(path.join(OUT, 'shots', `textscale-200__${sname}__${vname}.png`), false);
  }
}

// ---------- 4. Reduced motion ----------
await b.viewport(1280, 720, false);
const motion = {};
for (const pref of ['no-preference', 'reduce']) {
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: pref }] });
  await fresh(BASE);
  await b.wait(500);
  motion[pref] = await b.js(`return { running: document.getAnimations().filter((a) => a.playState === 'running').length, infinite: document.getAnimations().filter((a) => a.effect && a.effect.getTiming().iterations === Infinity).length };`);
}
await b.send('Emulation.setEmulatedMedia', { features: [] });

// ---------- 5. State transitions and leakage ----------
const T = [];
const t = (id, name, ok, observed) => T.push({ id, name, ok: ok === null ? 'observe' : ok ? 'pass' : 'FAIL', observed });
await fresh(LESSON);
t('T01', 'Start lesson → lands on Teach It', await b.js(`return location.hash === '' || location.hash === '#teach'`) && await b.js(`return document.querySelector('[aria-current=step]').dataset.stage === 'teach'`), await b.js('return document.title'));
await b.js(`document.querySelector('.stage-nav a.btn-primary').click()`); await b.wait(250);
const fwd = await b.js('return location.hash');
await b.js('history.back()'); await b.wait(300);
const back = await b.js('return location.hash');
t('T02', 'Forward with Next, browser Back returns', fwd === '#see' && (back === '' || back === '#teach'), { fwd, back });
await b.hash('#results'); await b.hash('#see');
t('T03', 'Switch stages directly via tabs', await b.js(`return document.querySelector('[aria-current=step]').dataset.stage === 'see' && !!document.querySelector('#demo-body')`), null);
await b.hash('#practice');
const guided = await b.js(`${FILL_HELPERS} const box = document.querySelector('#guided-runner') || document.querySelector('#guided-card'); const el = box.querySelector('.q[data-qkey]'); const q = L.guided[0];
  fill(el, q, false); box.querySelector('[data-act=check]').click(); const w = box.querySelector('.result-box').innerText;
  box.querySelector('[data-act=hint]').click(); const hint = !box.querySelector('.hint-box').hidden;
  fill(el, q, true); box.querySelector('[data-act=check]').click(); return { w, hint, r: box.querySelector('.result-box').innerText };`);
t('T04', 'Guided: wrong → hint → retry → correct', /Not yet/.test(guided.w) && guided.hint && /Correct/.test(guided.r), guided);
await b.hash('#test');
await b.js(`document.querySelector('[data-start="vocab"]').click();`); await b.wait(200);
const leak = await b.js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); const html = document.querySelector('#stage').innerHTML; const text = document.querySelector('#stage').innerText;
  return { hintEls: document.querySelectorAll('#stage .hint-box, #stage [data-act=hint]').length, feedback: document.querySelectorAll('#stage .feedback').length,
    explanationsInDom: d.questions.filter((q) => text.includes(q.explanation)).length, prefilled: d.questions.filter((q) => Q.isAnswered(q, Q.read(document.querySelector('[data-qkey="t-' + q.id + '"]'), q))).length,
    answerKeyInStorage: d.questions.every((q) => q.answer !== undefined) };`);
t('L01', 'Test shows no hints, feedback, or explanations', leak.hintEls === 0 && leak.feedback === 0 && leak.explanationsInDom === 0, leak);
t('L02', 'Practice/guided answers do not prefill the test', leak.prefilled === 0, leak.prefilled);
t('L03', 'Answer key is stored in plain localStorage during a test (readable in DevTools)', null, leak.answerKeyInStorage);
// Leave the vocab test incomplete via a stage tab, come back, try to start the other test.
await b.js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); const els = document.querySelectorAll('#test-form .q[data-qkey]'); d.questions.slice(0, 2).forEach((q, i) => fill(els[i], q, true));`);
const navDuringTest = await b.js(`return { stagebarVisible: !!document.querySelector('.stagebar') && getComputedStyle(document.querySelector('.stagebar')).display !== 'none' && !document.querySelector('.stagebar').closest('[hidden]') }`);
t('T05', 'During a test the stage tabs are hidden (lesson content not one click away mid-test)', !navDuringTest.stagebarVisible, navDuringTest);
await b.hash('#see'); await b.hash('#test');
const back2 = await b.js(`return { showsRunner: !!document.querySelector('#test-form'), title: document.querySelector('h1').innerText, canStartMath: !!document.querySelector('[data-start="math"]') }`);
t('T06', 'Return to Test It after leaving mid-test: can choose either test', back2.canStartMath, back2);
await b.reload();
const afterReload = await b.js(`const b = document.querySelector('[data-start="vocab"]'); return { label: b && b.innerText, answered: JSON.parse(localStorage.getItem(Mathbook.lessons['2-1'].storageKey + ':draft-vocab')).responses };`);
t('T07', 'Refresh with unfinished test → Resume offered, answers kept', /Resume/.test(afterReload.label || '') && Object.keys(afterReload.answered).length >= 2, { label: afterReload.label, saved: Object.keys(afterReload.answered).length });
await b.js(`document.querySelector('[data-start="vocab"]').click()`); await b.wait(200);
const done = await b.js(`${FILL_HELPERS} const d = JSON.parse(localStorage.getItem(L.storageKey + ':draft-vocab')); const els = document.querySelectorAll('#test-form .q[data-qkey]'); d.questions.forEach((q, i) => fill(els[i], q, true));
  document.querySelector('#test-form button[type=submit]').click(); await new Promise((r) => setTimeout(r, 400)); const a = JSON.parse(localStorage.getItem(L.storageKey + ':attempts')); return { hash: location.hash, score: a[a.length - 1].score, q: a[a.length - 1].questions.map((x) => x.prompt + (x.display || '')).join('|') };`);
t('T08', 'Complete test → Results with score', done.hash === '#results' && done.score === 10, { hash: done.hash, score: done.score });
await b.hash('#test'); await b.js(`document.querySelector('[data-start="vocab"]').click()`); await b.wait(200);
const retake = await b.js(`const d = JSON.parse(localStorage.getItem(Mathbook.lessons['2-1'].storageKey + ':draft-vocab')); return d.questions.map((x) => x.prompt + (x.display || '')).join('|');`);
t('T09', 'Retake generates a different version', retake !== done.q, null);
await b.hash('#results');
const clear = await b.js(`document.querySelector('#clear').click(); const asked = !!document.querySelector('#clear-yes'); document.querySelector('#clear-yes').click();
  return { asked, left: Object.keys(localStorage).filter((k) => k.startsWith('mathbook:v2:lesson-2-1')).length, otherKeysKept: Object.keys(localStorage).filter((k) => !k.startsWith('mathbook:v2:lesson-2-1')) };`);
t('T10', 'Clear progress confirms, then clears only this lesson', clear.asked && clear.left === 0, clear);
await b.load(O + BASE); await b.js('localStorage.clear()'); await b.load(O + LESSON + '#results');
t('T11', 'Fresh session shows no results and no fabricated progress', await b.js(`return /No test results yet/.test(document.body.innerText)`), null);
await b.load(O + BASE);
t('T12', 'Home page shows a Continue Learning action when progress exists', await b.js(`return !!document.getElementById('continue') && !document.getElementById('continue').hidden && /Continue: Lesson 2-1/.test(document.body.innerText)`), null);
if (hasNW) {
  // Number Words: covered word and test never disclose answers; programs don't interfere.
  await b.load(O + NW + '#write');
  const cover = await b.js(`document.querySelector('[data-wi="3"]').click(); document.querySelector('[data-act=cover]').click(); return /\\bthree\\b/i.test(document.querySelector('#stage').innerText);`);
  t('N01', 'Look-Cover-Write: covered word is not on the page', !cover, cover);
  await b.load(O + NW + '#test');
  const nwLeak = await b.js(`document.querySelector('[data-start]').click(); await new Promise((r) => setTimeout(r, 200));
    const d = JSON.parse(localStorage.getItem(Mathbook.numberWords.current.storageKey + ':draft')); const text = document.querySelector('#stage').innerText.toLowerCase();
    return { leaked: d.questions.filter((q) => new RegExp('\\\\b' + q.answer + '\\\\b').test(text)).map((q) => q.answer), hints: document.querySelectorAll('#stage [data-act=hint]').length };`);
  t('N02', 'Spelling test shows no hints and none of the tested words', nwLeak.leaked.length === 0 && nwLeak.hints === 0, nwLeak);
  await b.load(O + LESSON + '#test');
  await b.js(`document.querySelector('[data-start="math"]').click();`); await b.wait(200);
  await b.reload();
  const x = await b.js(`return { lesson: /Resume/.test(document.querySelector('[data-start="math"]').innerText), nw: !!localStorage.getItem('mathbook:v2:number-words:phase-1:draft') };`);
  t('X01', 'Unfinished Lesson 2-1 and Number Words tests coexist', x.lesson && x.nw, x);
}

// ---------- Report ----------
const errors = b.errors.slice();
const missing = server.missing.slice();
b.close(); server.close();
fs.writeFileSync(path.join(OUT, 'metrics.json'), JSON.stringify({ matrix, focus, scaling, motion, transitions: T, errors, missing }, null, 2));

const md = [];
md.push(`# Audit measurements — ${label}`, '', `Generated ${new Date().toISOString()} · headless Chrome (emulated viewports) · ${matrix.length} screen-states`, '');
md.push('## Device-state matrix', '', 'Columns: horizontal overflow · elements off-screen · text spilling out of its box · touch targets <44px / <24px · smallest font (px) · text contrast failures / checked (unknown = text on gradient) · % of viewport covered by sticky bars · page length in screens', '');
md.push('| State | Viewport | Overflow-X | Off-screen | Text spill | <44 / <24 px | Min font | Contrast fail/checked (unk) | Sticky % | Screens |', '|---|---|---|---|---|---|---|---|---|---|');
for (const r of matrix) {
  if (r.error) { md.push(`| ${r.state} | ${r.viewport} | ERROR: ${r.error} |||||||||`); continue; }
  md.push(`| ${r.state} | ${r.viewport} | ${r.overflowX ? '**YES** ' + r.scrollW : 'no'} | ${r.offscreen.length ? '**' + r.offscreen.join(', ') + '**' : '0'} | ${r.spill.length ? r.spill.length + ': ' + r.spill.join('; ') : '0'} | ${r.small44} / ${r.small24}${r.small24 ? ' (' + r.small24List.join(', ') + ')' : ''} | ${r.minFont} | ${r.contrastFails}/${r.contrastChecked} (${r.contrastUnknown})${r.contrastFails ? ' ' + r.contrastList.join('; ') : ''} | ${r.stickyPct} | ${r.screens} |`);
}
md.push('', '## Keyboard focus (1280×720, 45 Tab presses per screen)', '', '| Screen | Focus stops | Stops without visible focus ring | First stops |', '|---|---|---|---|');
for (const f of focus) md.push(`| ${f.state} | ${f.stops} | ${f.noRing.length ? f.noRing.join(', ') : '0'} | ${f.first.join(' → ')} |`);
md.push('', '## Text scaling to 200% (root font size doubled)', '', '| State | Viewport | Overflow-X | Off-screen | Text spill |', '|---|---|---|---|---|');
for (const s of scaling) md.push(`| ${s.state} | ${s.viewport} | ${s.overflowX ? '**YES**' : 'no'} | ${s.offscreen.join(', ') || '0'} | ${s.spill.join('; ') || '0'} |`);
md.push('', '## Reduced motion (home page)', '', `- No preference: ${JSON.stringify(motion['no-preference'])}`, `- prefers-reduced-motion: reduce: ${JSON.stringify(motion.reduce)}`);
md.push('', '## State transitions and leakage', '', '| ID | Check | Result | Observed |', '|---|---|---|---|');
for (const x of T) md.push(`| ${x.id} | ${x.name} | ${x.ok} | ${x.observed === null ? '' : '`' + JSON.stringify(x.observed).slice(0, 220) + '`'} |`);
md.push('', `## Errors`, '', `- JavaScript errors: ${errors.length ? errors.join(' / ') : 'none'}`, `- Missing files (404): ${missing.length ? missing.join(', ') : 'none'}`);
fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n'));
console.log(`Audit written to ${path.relative(ROOT, OUT)} (${matrix.length} screen-states, ${T.length} transition checks)`);
