/*
 * Subtract with Regrouping: the Mathbook adapter. Navigation, saved progress, results and theme for the section,
 * around the reusable SubtractKit workspace (assets/js/subtract/) and the content in content.js.
 * Saved records live under "mathbook:v2:subtract-regrouping:" and every record carries v: 1. Records are validated by
 * structure and values when read; a bad record is ignored on its own (and replaced on the next save), never the others.
 * Items are not stored: they are rebuilt from saved seeds and indexes, so only small, checkable values are saved.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const SK = root.SubtractKit;
  const M = SK.math;
  const C = MB.subtractRegrouping;
  const shell = MB.shell;
  const head = shell.sectionHead;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = M.fmt;
  const V = 1;
  const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const blank = (x) => x === undefined || x === null || String(x).trim() === '';

  const STAGES = [
    { id: 'menu', label: 'Section Menu' }, { id: 'teach', label: 'Parent Guide' }, { id: 'see', label: 'Learn' },
    { id: 'practice', label: 'Practice' }, { id: 'test', label: 'Take a Test' }, { id: 'results', label: 'My Results' }
  ];
  const SKILL = Object.fromEntries(C.skills.map((s) => [s.id, s]));
  const CAT_LABEL = { final: 'Final answers', steps: 'Regrouping steps', decide: 'Deciding whether to regroup', mistake: 'Finding mistakes' };
  const mastery = (pct) => (pct >= 90 ? { key: 'mastered', label: 'Mastered', advice: 'Ready to move on. Keep it fresh with Practice on My Own (Mixed).' }
    : pct >= 70 ? { key: 'review', label: 'Review missed skills', advice: 'Practice the skills listed below, then take the test again.' }
    : { key: 'reteach', label: 'Reteach and reassess', advice: 'Go back through Learn for the skills below, practice them, then take a new test. Every new test uses new numbers.' });

  // ---------- Item helpers ----------
  const ITEM_KINDS = ['sub', 'steps', 'decide', 'mistake', 'check', 'exchange', 'guided'];
  /** Is a saved response usable for this item? (structure and values) */
  function validResponse(item, r) {
    if (!isObj(r)) return false;
    if (r.ws !== undefined && r.ws !== null && !SK.validState(r.ws, item.top, item.bottom)) return false;
    if (r.ws2 !== undefined && r.ws2 !== null && !SK.validState(r.ws2, item.top, item.bottom)) return false;
    const okChoice = (v, list) => v === undefined || v === null || v === '' || (typeof v === 'string' && list.includes(v));
    if (item.kind === 'decide') return okChoice(r.c1, ['Yes', 'No']) && okChoice(r.c2, item.placeChoices);
    if (item.kind === 'mistake' || item.kind === 'check') return okChoice(r.c1, item.choices);
    if (item.kind === 'exchange') return (r.t === undefined || typeof r.t === 'string') && (r.o === undefined || typeof r.o === 'string') && okChoice(r.c1, ['Yes', 'No']);
    return true;
  }
  /** Answer digits / chosen values in a shape Home's "Continue" can count (p: [], d: [...]). */
  function compat(item, r) {
    const d = [];
    if (r.ws) (r.ws.d || []).forEach((x) => d.push(x));
    if (r.ws && item.kind === 'steps') Object.keys(r.ws.ann || {}).forEach(() => d.push('x'));
    if (r.ws2) (r.ws2.d || []).forEach((x) => d.push(x));
    ['c1', 'c2', 't', 'o'].forEach((k) => { if (!blank(r[k])) d.push(String(r[k])); });
    return Object.assign({}, r, { p: [], d });
  }
  /** Fully answered (for the test review and Finish). */
  function answered(item, r) {
    if (!r) return false;
    const done = (ws) => ws && M.readAnswer(ws.d || []).status === 'ok';
    if (item.kind === 'sub') return done(r.ws);
    if (item.kind === 'steps') return !!(r.ws && Object.keys(r.ws.ann || {}).length);
    if (item.kind === 'decide') return !blank(r.c1) && !blank(r.c2);
    if (item.kind === 'mistake') return !blank(r.c1) && done(r.ws2);
    if (item.kind === 'check') return !blank(r.c1) && done(r.ws);
    return false;
  }
  /** Grade one item. Returns { correct, parts: { final?, steps?, decide?, mistake? } } (each part true/false). */
  function grade(item, r) {
    r = r || {};
    const fin = (ws) => !!ws && M.gradeFinal(item.top, item.bottom, ws.d || []).correct;
    if (item.kind === 'sub') { const f = fin(r.ws); return { correct: f, parts: { final: f } }; }
    if (item.kind === 'steps') { const s = !!r.ws && M.checkAmounts(item.top, item.bottom, M.amountsFrom(item.top, r.ws.ann, M.lengthOf(item.top))).ok; return { correct: s, parts: { steps: s } }; }
    if (item.kind === 'decide') { const d = r.c1 === item.needs && r.c2 === item.first; return { correct: d, parts: { decide: d } }; }
    if (item.kind === 'mistake') { const m = r.c1 === item.answer, f = fin(r.ws2); return { correct: m && f, parts: { mistake: m, final: f } }; }
    if (item.kind === 'check') { const c = r.c1 === item.answer, f = fin(r.ws); return { correct: c && f, parts: { final: f, check: c } }; }
    if (item.kind === 'exchange') { const t = Number(r.t) === item.tens - 1 && /^\d+$/.test(String(r.t).trim()), o = Number(r.o) === item.ones + 10 && /^\d+$/.test(String(r.o).trim()); return { correct: t && o && r.c1 === 'Yes', parts: { tens: t, ones: o, value: r.c1 === 'Yes' } }; }
    return { correct: false, parts: {} };
  }
  const problemText = (item) => `${fmt(item.top)} − ${fmt(item.bottom)}`;

  function start(opts) {
    opts = opts || {};
    const store = shell.makeStore(C.storagePrefix);
    let live = []; // mounted workspaces on screen (destroyed when the screen changes)
    const keep = (inst) => { live.push(inst); return inst; };
    const cleanup = () => { live.forEach((i) => i.destroy()); live = []; };

    // ---------- Validated records ----------
    function read(key, valid, fallback) {
      const raw = store.get(key, null);
      if (raw === null) return fallback();
      try { if (valid(raw)) return raw; } catch (e) { /* treated as malformed */ }
      return fallback(); // malformed: ignored here, replaced on the next save; nothing else is touched
    }
    const save = (key, val) => store.set(key, val);

    const STEP_IDS = C.learn.map((s) => s.id);
    const validWizard = (w) => isObj(w) && w.v === V && isInt(w.step, 0, STEP_IDS.length - 1) && isObj(w.done) && Object.keys(w.done).every((k) => STEP_IDS.includes(k) && w.done[k] === true) &&
      isObj(w.phase) && Object.keys(w.phase).every((k) => STEP_IDS.includes(k) && ['example', 'try'].includes(w.phase[k])) &&
      isObj(w.ex) && Object.keys(w.ex).every((k) => STEP_IDS.includes(k) && isInt(w.ex[k], 0, 9)) &&
      isObj(w.checks) && Object.keys(w.checks).every((k) => STEP_IDS.includes(k) && isObj(w.checks[k]) && isInt(w.checks[k].seed, 0, 4294967295));
    const wizard = () => read('see-wizard', validWizard, () => ({ v: V, step: 0, done: {}, phase: {}, ex: {}, checks: {} }));

    const validTogether = (t) => isObj(t) && t.v === V && isInt(t.pos, 0, C.together.length - 1) && isInt(t.seed, 0, 4294967295) && isObj(t.states) && isObj(t.done) &&
      Object.keys(t.done).every((k) => isInt(Number(k), 0, C.together.length - 1) && t.done[k] === true);
    const together = () => read('guided', validTogether, () => ({ v: V, pos: 0, seed: 0, states: {}, done: {} }));

    const validSetup = (s) => isObj(s) && [2, 3, 4, 'mixed'].includes(s.size) && ['easy', 'medium', 'hard', 'mixed'].includes(s.difficulty) && C.SETUP.lengths.includes(s.length) && !M.unavailableReason(s.size, s.difficulty);
    const validRun = (a, n) => isObj(a) && a.v === V && isInt(a.seed, 0, 4294967295) && isInt(a.pos, 0, n) && isObj(a.responses) && isObj(a.results) && typeof a.checked === 'boolean' && Array.isArray(a.order);
    const validSessions = (b) => isObj(b) && b.v === V && (b.setup === undefined || (isObj(b.setup) && (b.setup.active === null || (validRun(b.setup.active, 50) && validSetup(b.setup.active.setup))) && Array.isArray(b.setup.attempts)));
    const sessions = () => read('bank-sets', validSessions, () => ({ v: V, setup: { active: null, attempts: [] } }));
    const validSkills = (s) => isObj(s) && s.v === V && Object.keys(s).filter((k) => k !== 'v').every((k) => /^skill-/.test(k) && SKILL[k.slice(6)] && isObj(s[k]) && (s[k].active === null || validRun(s[k].active, C.SKILL_LENGTH)) && Array.isArray(s[k].attempts));
    const skillStore = () => read('skill-practice', validSkills, () => ({ v: V }));
    const validDraft = (d) => isObj(d) && d.v === V && isInt(d.seed, 0, 4294967295) && isInt(d.pos, 0, 15) && isObj(d.responses) && Array.isArray(d.questions) && d.questions.length === 15;
    const draft = () => read('draft-test', validDraft, () => null);
    const validAttempt = (a) => isObj(a) && a.v === V && a.testId === 'test' && isInt(a.score, 0, 15) && a.total === 15 && isInt(a.pct, 0, 100) && isObj(a.parts) && Array.isArray(a.items) && typeof a.at === 'string';
    const attempts = () => read('attempts', (x) => Array.isArray(x) && x.every(validAttempt), () => []);
    const lastSetup = () => read('setup', (s) => isObj(s) && s.v === V && validSetup(s), () => Object.assign({ v: V }, C.SETUP.defaults));

    // ---------- Shell ----------
    const ctx = shell.startShell({
      mount: opts.mount, homeHref: opts.homeHref || '../../../', path: opts.path || 'curriculum/supplemental/subtract-regrouping/',
      crumbs: 'Grade 3 · Chapter 2 · Supplemental', pill: 'Subtract with Regrouping', stages: STAGES, stagebar: false,
      menuLink: { href: '#menu', label: 'Section Menu' }, activityTitle: 'Subtract with Regrouping',
      beforeRender() { cleanup(); },
      views: { menu: menuView, teach: teachView, see: seeView, practice: practiceView, test: testView, results: resultsView }
    });
    document.title = 'Subtract with Regrouping · Mathbook';
    const main = ctx.main;
    const activity = (on) => { main.classList.toggle('stage-activity', on); main.classList.toggle('stage-menu', !on); main.classList.toggle('stage-learn', !!on); };
    const eyebrow = (what) => `Subtract with Regrouping${what ? ' · ' + esc(what) : ''}`;
    const menuNav = (backHref, backLabel) => `<div class="stage-nav">${backHref ? `<a class="btn btn-ghost" href="${backHref}">← ${esc(backLabel)}</a>` : '<span></span>'}<a class="btn btn-ghost" href="#menu">Section Menu</a></div>`;
    const card = (href, title, desc, icon, extra, tag) => `<a class="choice-card${extra ? ' ' + extra : ''}" href="${href}"><span class="choice-icon" aria-hidden="true">${icon}</span><span class="choice-text"><span class="choice-title">${esc(title)}</span><span class="choice-desc">${esc(desc)}</span>${tag || ''}</span></a>`;
    const focusH = (sel) => { const h = main.querySelector(sel || 'h1, h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } };

    // ===== Menu =====
    function menuView() {
      activity(false);
      const w = wizard(), first = !Object.keys(w.done).length;
      main.innerHTML = `<section class="hero menu-hero"><p class="eyebrow">Supplemental · after Lesson 2-15</p><h1 tabindex="-1">Subtract with Regrouping</h1><p class="lead">What would you like to do?</p></section>` +
        `<nav class="choice-grid" aria-label="Section choices">` +
        card('#see', 'Learn', 'See an example and try it.', '💡', first ? 'is-recommended' : '', first ? '<span class="choice-tag">Start here</span>' : '') +
        card('#practice', 'Practice', 'Practice together, on your own, or one skill.', '✏️') +
        card('#test', 'Take a Test', 'Show what you know.', '✓') +
        card('#results', 'My Results', 'See how you did.', '★') +
        `</nav><p class="parent-link"><a href="#teach">Parent Guide</a> <span class="muted">· how to teach regrouping</span></p>`;
    }

    // ===== Parent Guide =====
    function teachView() {
      activity(false);
      const p = C.parent;
      main.innerHTML = ctx.hero(eyebrow('Parent Guide'), 'Parent Guide', 'How to teach subtraction with regrouping', [{ id: 'pg-goal', label: 'Goal' }, { id: 'pg-example', label: 'Worked example' }, { id: 'pg-zeros', label: 'Across zeros' }, { id: 'pg-mistakes', label: 'Mistakes' }, { id: 'pg-ask', label: 'What to ask' }, { id: 'reset', label: 'Reset' }]) +
        `<section class="card card-parent" id="pg-goal">${head('', 'The goal and what regrouping means', 'parent')}<p>${esc(p.goal)}</p><ul class="rules">${p.meaning.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` +
        `<h3>Learning progression</h3><ol class="rules">${p.progression.map((m) => `<li>${esc(m)}</li>`).join('')}</ol></section>` +
        `<section class="card card-parent" id="pg-example">${head('', `Worked example: ${fmt(p.workedTop)} − ${fmt(p.workedBottom)}`, 'parent')}<p>Step through it together. Say each exchange out loud.</p><div class="sr-ws" id="pg-ws1"></div></section>` +
        `<section class="card card-parent" id="pg-zeros">${head('', `Exchanges across zeros: ${fmt(p.zerosTop)} − ${fmt(p.zerosBottom)}`, 'parent')}<p>The ones need more, but the tens and hundreds have 0. Go through each zero, one exchange at a time: each zero gets 10, gives 1 away, and ends with 9.</p><div class="sr-ws" id="pg-ws2"></div></section>` +
        `<section class="card card-parent" id="pg-mistakes">${head('', 'Common mistakes', 'parent')}<ul class="rules">${p.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>` +
        `<section class="card card-parent" id="pg-ask">${head('', 'What to ask (helps without giving the answer)', 'parent')}<ul class="rules">${p.prompts.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` +
        `<h3>Skill checklist</h3><ul class="rules sr-check">${p.checklist.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` +
        `<h3>Using results and targeted practice</h3><ul class="rules">${p.results.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></section>` +
        `<section class="card card-parent" id="reset">${head('', 'Reset Progress', 'parent')}<p>Erase this section's saved Learn steps, practice and test results on this device. Lessons 2-1 to 2-15 and Number Words are not changed.</p>` +
        `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Reset Progress…</button></div></section>` + menuNav();
      keep(SK.mount(main.querySelector('#pg-ws1'), { top: p.workedTop, bottom: p.workedBottom, mode: 'demo' }));
      keep(SK.mount(main.querySelector('#pg-ws2'), { top: p.zerosTop, bottom: p.zerosBottom, mode: 'demo' }));
      const bindReset = () => shell.bindClear(main, store, 'Subtract with Regrouping progress (Learn, practice and test results)', () => {
        try { const act = shell.readActivity && shell.readActivity(); if (act && act.path && act.path.indexOf(opts.path || 'curriculum/supplemental/subtract-regrouping/') === 0) root.localStorage.removeItem('mathbook:v2:activity'); } catch (e) { /* ignore */ }
        location.hash = '#menu';
      }, () => { main.querySelector('#clear-area').innerHTML = '<button type="button" class="btn btn-ghost" id="clear">Reset Progress…</button>'; bindReset(); main.querySelector('#clear').focus(); }, 'Yes, reset');
      bindReset();
    }

    // ===== Learn =====
    function seeView(c, arg) {
      activity(true);
      const W = wizard();
      if (arg === 'done') {
        main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Learn')}</p><h1 tabindex="-1">You finished learning!</h1></section>` +
          `<section class="card done-card"><p class="done-title">Great work. You learned all ${STEP_IDS.length} steps.</p><div class="actions"><a class="btn btn-primary btn-big" href="#practice">Start Practice</a><a class="btn btn-ghost btn-big" href="#see">Review the steps</a></div></section>` + menuNav();
        return;
      }
      drawStep(W);
    }
    function drawStep(W) {
      cleanup();
      const k = W.step, step = C.learn[k], phase = W.phase[step.id] || 'example';
      const done = !!W.done[step.id];
      const last = k === C.learn.length - 1;
      let body = '';
      if (phase === 'example') {
        const ei = Math.min(W.ex[step.id] || 0, step.examples.length - 1), ex = step.examples[ei];
        body = `<p class="wiz-explain">${esc(step.explain)}</p><div class="sr-example">${exampleHTML(ex)}</div>` +
          (step.examples.length > 1 ? `<div class="demo-controls sr-exnav"><button type="button" class="btn btn-ghost" data-w="prev-ex"${ei === 0 ? ' disabled' : ''}>◀ Previous example</button><span class="demo-count">Example ${ei + 1} of ${step.examples.length}</span><button type="button" class="btn btn-ghost" data-w="next-ex"${ei === step.examples.length - 1 ? ' disabled' : ''}>Next example ▶</button></div>` : '') +
          `<div class="wiz-actions">${k > 0 ? '<button type="button" class="btn btn-ghost" data-w="prev-step">← Previous Step</button>' : '<span></span>'}<button type="button" class="btn btn-star btn-big" data-w="try">Now I'll Try →</button></div>`;
      } else {
        if (!W.checks[step.id]) { W.checks[step.id] = { seed: shell.newSeed() }; save('see-wizard', W); }
        body = `<div class="wiz-check sr-try" id="sr-try"></div>` +
          `<div class="wiz-actions"><button type="button" class="btn btn-ghost" data-w="example">← See the Example Again</button>` +
          (last ? `<a class="btn btn-primary btn-big${done ? '' : ' is-disabled'}" href="#see/done" ${done ? '' : 'aria-disabled="true" tabindex="-1"'} data-w="finish">Finish →</a>` : `<button type="button" class="btn btn-primary btn-big" data-w="next"${done ? '' : ' disabled'}>Next Step →</button>`) +
          `</div>${done ? '' : `<p class="wiz-locked-note">Answer correctly to unlock ${last ? 'Finish' : 'the next step'}.</p>`}`;
      }
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Learn')}</p><div class="act-title"><h1 tabindex="-1">Learn</h1><p class="wiz-count">Step ${k + 1} of ${STEP_IDS.length}</p></div></section>` +
        `<section class="card wiz-card" data-phase="${phase === 'example' ? 'example' : 'try'}"><h2 tabindex="-1" class="wiz-h"><span class="phase-tag phase-${phase === 'example' ? 'example' : 'try'}">${phase === 'example' ? 'Example' : 'Your Turn'}</span><span class="wiz-step-title">${esc(step.title)}</span></h2>${body}</section>` +
        `<div class="wiz-menu"><a class="btn btn-ghost" href="#menu">Section Menu</a></div>`;
      if (phase === 'example') mountExample(step.examples[Math.min(W.ex[step.id] || 0, step.examples.length - 1)]);
      else mountTry(W, step);
      main.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', (e) => {
        const a = b.dataset.w;
        if (a === 'finish') { if (!done) e.preventDefault(); return; }
        if (a === 'prev-ex' || a === 'next-ex') W.ex[step.id] = Math.max(0, Math.min(step.examples.length - 1, (W.ex[step.id] || 0) + (a === 'next-ex' ? 1 : -1)));
        else if (a === 'try') W.phase[step.id] = 'try';
        else if (a === 'example') W.phase[step.id] = 'example';
        else if (a === 'next' && done && k < STEP_IDS.length - 1) W.step = k + 1;
        else if (a === 'prev-step' && k > 0) W.step = k - 1;
        else return;
        save('see-wizard', W);
        drawStep(W);
        const card = main.querySelector('.wiz-card');
        if (card && root.innerHeight < 560) card.scrollIntoView({ block: 'start' }); else root.scrollTo(0, 0);
        if (a === 'prev-ex' || a === 'next-ex') { const nb = main.querySelector(`[data-w="${a}"]:not([disabled])`) || main.querySelector('.sr-exnav .btn:not([disabled])'); if (nb) nb.focus({ preventScroll: true }); }
        else { const h = main.querySelector('.wiz-h'); if (h) h.focus({ preventScroll: true }); }
      }));
    }
    function exampleHTML(ex) {
      if (ex.kind === 'value') {
        // One exchange from the largest place: tens → ones for 52, hundreds → tens for 436, thousands → hundreds for 3,002.
        const from = ex.from.length - 1;
        const aft = M.exchange(ex.from, from).amounts;
        const n = ex.from.length, names = M.PLACES.slice(0, n).map((p) => p.name).reverse();
        const row = (a, cls) => `<tr class="${cls || ''}">${a.slice().reverse().map((x) => `<td>${x}</td>`).join('')}<td class="sr-val">${fmt(M.value(a))}</td></tr>`;
        return `<table class="sr-chart"><caption class="sk-sr">Place values before and after one exchange</caption><thead><tr>${names.map((x) => `<th scope="col">${x.charAt(0).toUpperCase() + x.slice(1)}</th>`).join('')}<th scope="col">Value</th></tr></thead>` +
          `<tbody>${row(ex.from, 'is-before')}${row(aft, 'is-after')}</tbody></table><p class="slide-say">${esc(ex.note)}</p>`;
      }
      if (ex.kind === 'demo') return `<div class="sr-ws" id="sr-ex-ws"></div>`;
      if (ex.kind === 'mistake') { const w = M.buggyWork(ex.top, ex.bottom, ex.bug); return `<p class="slide-say"><b>${esc(ex.who)}'s work:</b> ${esc(problemText(ex))} = ${fmt(w.answer)}?</p><div class="sr-ws" id="sr-ex-ws"></div><p class="slide-say">${esc(ex.note)}</p>`; }
      if (ex.kind === 'check') {
        const add = MB.fig ? MB.fig.html({ fig: 'stack', rows: [ex.top - ex.bottom, ex.bottom], op: '+', result: 'all', places: true }) : '';
        return `<p class="slide-say">${esc(problemText(ex))} = ${fmt(ex.top - ex.bottom)}. Check it: add the answer to the number you took away.</p><div class="sr-two"><div class="sr-ws" id="sr-ex-ws"></div><div>${add}</div></div>` +
          `<p class="slide-say">${fmt(ex.top - ex.bottom)} + ${fmt(ex.bottom)} = ${fmt(ex.top)}. It matches the top number, so the subtraction is right. If it does not match, look for the column that went wrong.</p>`;
      }
      return '';
    }
    function mountExample(ex) {
      const box = main.querySelector('#sr-ex-ws');
      if (!box) return;
      if (ex.kind === 'demo') keep(SK.mount(box, { top: ex.top, bottom: ex.bottom, mode: 'demo' }));
      else if (ex.kind === 'mistake') { const w = M.buggyWork(ex.top, ex.bottom, ex.bug); keep(SK.mount(box, { top: ex.top, bottom: ex.bottom, mode: 'view', work: w })); }
      else if (ex.kind === 'check') {
        const p = M.plan(ex.top, ex.bottom), ann = {};
        p.exchanges.forEach((e) => { (ann[e.from] = ann[e.from] || []).push(e.after[e.from]); (ann[e.to] = ann[e.to] || []).push(e.after[e.to]); });
        keep(SK.mount(box, { top: ex.top, bottom: ex.bottom, mode: 'view', work: { ann, d: p.columns.map((c) => String(c.digit)) } }));
      }
    }
    function mountTry(W, step) {
      const ck = W.checks[step.id];
      const item = Object.assign({}, step.yourTurn(M.rng(ck.seed)));
      const box = main.querySelector('#sr-try');
      const solved = () => {
        if (!W.done[step.id]) { W.done[step.id] = true; save('see-wizard', W); }
        const nb = main.querySelector('[data-w="next"]'); if (nb) nb.disabled = false;
        const fb = main.querySelector('[data-w="finish"]'); if (fb) { fb.classList.remove('is-disabled'); fb.removeAttribute('aria-disabled'); fb.setAttribute('href', '#see/done'); }
        const note = main.querySelector('.wiz-locked-note'); if (note) note.remove();
      };
      const again = `<button type="button" class="btn btn-ghost" data-new>New problem</button>`;
      if (item.kind === 'guided') {
        box.innerHTML = `<p class="q-prompt">Work through ${esc(problemText(item))}, one decision at a time.</p><div class="sr-ws" id="sr-yt"></div>${W.done[step.id] ? `<p>${again}</p>` : ''}`;
        const inst = keep(SK.mount(box.querySelector('#sr-yt'), { top: item.top, bottom: item.bottom, mode: 'guided', state: ck.state && SK.validState(ck.state, item.top, item.bottom) ? ck.state : null }));
        inst.on('change', (d) => { ck.state = d.state; save('see-wizard', W); });
        inst.on('complete', () => { solved(); if (!box.querySelector('[data-new]')) box.insertAdjacentHTML('beforeend', `<p>${again}</p>`); bindNew(); });
        if (ck.state && ck.state.guided && ck.state.guided.stage === 'done') solved();
      } else {
        const resp = validResponse(item, ck.resp) ? ck.resp : {};
        formItem(box, item, resp, { mode: 'learn', onChange: (r) => { ck.resp = r; save('see-wizard', W); }, onCorrect: () => { solved(); bindNew(); } });
        if (W.done[step.id] && !box.querySelector('[data-new]')) box.insertAdjacentHTML('beforeend', `<p>${again}</p>`);
      }
      const bindNew = () => { const nb = box.querySelector('[data-new]'); if (nb && !nb.dataset.bound) { nb.dataset.bound = '1'; nb.addEventListener('click', () => { W.checks[step.id] = { seed: shell.newSeed() }; save('see-wizard', W); drawStep(W); focusH('.wiz-h'); }); } };
      bindNew();
    }

    /**
     * The non-workspace questions (and the parts around a workspace): exchange, decide, mistake, check, steps, sub.
     * mode 'learn' / 'practice': Check Answer with feedback and retries. mode 'test': no Check, no feedback.
     */
    function formItem(box, item, resp, o) {
      const testing = o.mode === 'test';
      const R = Object.assign({}, resp);
      const fire = () => o.onChange && o.onChange(compat(item, R));
      const radios = (name, label, list, val) => `<fieldset class="sr-fs"><legend>${esc(label)}</legend><div class="sr-radios">${list.map((v) =>
        `<label class="choice"><input type="radio" name="${name}" value="${esc(v)}"${val === v ? ' checked' : ''}> <span>${esc(v)}</span></label>`).join('')}</div></fieldset>`;
      const uid = 'f' + Math.floor(Math.random() * 1e9);
      let h = '';
      if (item.kind === 'exchange') {
        h = `<p class="q-prompt">Exchange 1 ten for 10 ones in <b>${item.n}</b>.</p>` +
          `<div class="sr-pair"><label>New tens <input class="ci sr-num" data-f="t" inputmode="numeric" maxlength="2" value="${esc(R.t || '')}" autocomplete="off"></label>` +
          `<label>New ones <input class="ci sr-num" data-f="o" inputmode="numeric" maxlength="2" value="${esc(R.o || '')}" autocomplete="off"></label></div>` +
          radios(uid + 'c1', `Is the value still ${item.n}?`, ['Yes', 'No'], R.c1);
      } else if (item.kind === 'decide') {
        h = `<p class="q-prompt">Look at ${esc(problemText(item))} before you subtract.</p><div class="sr-ws" data-ws="view"></div>` +
          radios(uid + 'c1', 'Does it need regrouping?', ['Yes', 'No'], R.c1) + radios(uid + 'c2', 'Which column needs an exchange first?', item.placeChoices, R.c2);
      } else if (item.kind === 'mistake') {
        h = `<p class="q-prompt">${esc(item.who)} worked ${esc(problemText(item))} and got ${fmt(item.wrong)}.</p><div class="sr-ws" data-ws="view"></div>` +
          radios(uid + 'c1', 'What went wrong?', item.choices, R.c1) + `<p class="q-prompt sr-sub">Now find the right answer:</p><div class="sr-ws" data-ws="answer"></div>`;
      } else if (item.kind === 'check') {
        h = `<p class="q-prompt">Subtract. Then choose how to check your answer with addition.</p><div class="sr-ws" data-ws="answer"></div>` + radios(uid + 'c1', 'How can you check your answer with addition?', item.choices, R.c1);
      } else if (item.kind === 'steps') {
        h = `<p class="q-prompt">Write the regrouped top number for ${esc(problemText(item))}: above each column, the amount you will subtract from. You do not need to find the answer.</p><div class="sr-ws" data-ws="steps"></div>`;
      } else if (item.kind === 'sub') {
        h = `<div class="sr-ws" data-ws="answer"></div>`;
      }
      const showCheck = !testing && item.kind !== 'sub';
      box.innerHTML = h + (showCheck ? `<div class="check-row"><button type="button" class="btn btn-primary" data-check>Check Answer</button></div><div class="feedback-area" aria-live="polite"></div>` : '');
      // Workspaces.
      const wsView = box.querySelector('[data-ws="view"]'), wsAns = box.querySelector('[data-ws="answer"]'), wsSteps = box.querySelector('[data-ws="steps"]');
      if (wsView) keep(SK.mount(wsView, { top: item.top, bottom: item.bottom, mode: 'view', answer: false, work: item.kind === 'mistake' ? item.work : { ann: {}, d: [] } }));
      const ansKey = item.kind === 'mistake' ? 'ws2' : 'ws';
      let ansInst = null;
      if (wsAns) {
        const wsMode = testing || item.kind !== 'sub' ? 'test' : 'independent';
        ansInst = keep(SK.mount(wsAns, { top: item.top, bottom: item.bottom, mode: wsMode, hints: !testing, feedback: !testing, state: R[ansKey] || null }));
        ansInst.on('change', (d) => { R[ansKey] = d.state; fire(); });
        if (o.onWorkspace) o.onWorkspace(ansInst);
      }
      if (wsSteps) {
        const inst = keep(SK.mount(wsSteps, { top: item.top, bottom: item.bottom, mode: 'test', answer: false, state: R.ws || null }));
        inst.on('change', (d) => { R.ws = d.state; fire(); });
      }
      box.querySelectorAll('input[type=radio]').forEach((r) => r.addEventListener('change', () => { R[r.name.slice(-2)] = r.value; fire(); }));
      box.querySelectorAll('[data-f]').forEach((i) => i.addEventListener('input', () => { i.value = i.value.replace(/\D/g, '').slice(0, 2); R[i.dataset.f] = i.value; fire(); }));
      if (showCheck) {
        let misses = 0;
        box.querySelector('[data-check]').addEventListener('click', () => {
          const area = box.querySelector('.feedback-area');
          if (!answered(item, R) && item.kind !== 'exchange') { area.innerHTML = `<div class="feedback"><p>Answer every part, then check.</p></div>`; return; }
          if (item.kind === 'exchange' && (blank(R.t) || blank(R.o) || blank(R.c1))) { area.innerHTML = `<div class="feedback"><p>Answer every part, then check.</p></div>`; return; }
          const g = grade(item, R);
          if (g.correct) {
            area.innerHTML = `<div class="feedback feedback-ok"><p><span aria-hidden="true">✓ </span>${esc(rightText(item))}</p></div>`;
            if (o.onCorrect) o.onCorrect(misses === 0);
          } else {
            misses += 1;
            area.innerHTML = `<div class="feedback feedback-no"><p><span aria-hidden="true">✗ </span>${esc(wrongText(item, R, g, misses))}</p></div>`;
            if (o.onWrong) o.onWrong();
          }
        });
      }
      return { get response() { return compat(item, R); } };
    }
    function rightText(item) {
      if (item.kind === 'exchange') return `Yes: ${item.tens - 1} tens and ${item.ones + 10} ones. ${(item.tens - 1) * 10} + ${item.ones + 10} = ${item.n}, so the value stays the same.`;
      if (item.kind === 'decide') return item.needs === 'Yes' ? `Right. The ${item.first.toLowerCase()} column needs an exchange first.` : 'Right. Every top digit is enough, so no regrouping is needed.';
      if (item.kind === 'mistake') return `Right. ${problemText(item)} = ${fmt(item.top - item.bottom)}.`;
      if (item.kind === 'check') return `Right. ${fmt(item.top - item.bottom)} + ${fmt(item.bottom)} = ${fmt(item.top)}.`;
      return 'Right.';
    }
    function wrongText(item, R, g, misses) {
      if (item.kind === 'exchange') {
        if (!g.parts.tens) return 'The tens gives 1 away, so it has 1 less than before.';
        if (!g.parts.ones) return 'The ones gets 10 more than it had.';
        return `An exchange changes how we write the number, not how much it is. The value is still ${item.n}.`;
      }
      if (item.kind === 'decide') {
        if (R.c1 !== item.needs) return item.needs === 'Yes' ? 'Look at each column from the ones: is any top digit less than the digit under it?' : 'Every top digit is at least the digit under it, so no exchange is needed.';
        return misses > 1 ? `Start at the ones and move left. The first column whose top amount is less than its bottom digit is the ${item.first.toLowerCase()}.` : 'Start at the ones and move left. Which column is the first one that is too small?';
      }
      if (item.kind === 'mistake') {
        if (!g.parts.mistake) return `Compare ${item.who}'s work with the right method, column by column, starting with the ones.`;
        return 'You found the mistake. Now check your own answer column by column (use your regroup marks).';
      }
      if (item.kind === 'check') {
        if (!g.parts.final) return 'First fix your subtraction answer: work column by column from the ones.';
        return 'To check, add your answer to the number you took away. You should get the top number.';
      }
      return 'Not yet.';
    }

    // ===== Practice =====
    function practiceView(c, arg) {
      if (!arg) return practiceMenu();
      if (arg === 'together') return togetherView();
      if (arg === 'setup') return setupView();
      if (arg === 'run') return runView({ kind: 'setup' });
      if (arg === 'skills') return skillsView();
      if (/^skill-/.test(arg) && SKILL[arg.slice(6)]) return runView({ kind: 'skill', id: arg.slice(6) });
      return practiceMenu();
    }
    function practiceMenu() {
      activity(false);
      const s = sessions().setup, t = together();
      const tNote = Object.keys(t.done).length ? `<span class="choice-progress is-started">${Object.keys(t.done).length} of ${C.together.length} done</span>` : '';
      const sNote = s.active && !s.active.checked ? `<span class="choice-progress is-started">In progress: question ${Math.min(s.active.pos + 1, s.active.order.length)} of ${s.active.order.length}</span>` : '';
      main.innerHTML = ctx.hero(eyebrow('Practice'), 'Practice', 'Choose how to practice.') +
        `<nav class="choice-grid" aria-label="Practice choices">` +
        card('#practice/together', 'Practice Together', 'Step by step with a grown-up: you decide each step.', '🤝', '', tNote) +
        card('#practice/setup', 'Practice on My Own', 'Choose the number size, difficulty and how many.', '✏️', '', sNote) +
        card('#practice/skills', 'Practice One Skill', 'Work on one kind of problem.', '🎯') + `</nav>` + menuNav();
    }

    // --- Practice Together (guided) ---
    function togetherSet(seed) {
      if (!seed) return C.together;
      const r = M.rng(seed), avoid = new Set();
      return C.together.map((q) => { const c = M.classify(q.top, q.bottom); return M.generateOne(r, { size: M.lengthOf(q.top), difficulty: c.difficulty, chain: c.chain >= 2 ? 2 : c.chain === 1 ? 1 : undefined, avoid }) || q; });
    }
    function togetherView() {
      activity(true);
      const T = together(), set = togetherSet(T.seed), i = T.pos, q = set[i];
      const doneN = Object.keys(T.done).length;
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Practice Together')}</p><div class="act-title"><h1 tabindex="-1">Practice Together</h1><p class="wiz-count">Problem ${i + 1} of ${set.length}</p></div></section>` +
        `<section class="card"><p class="q-prompt">${esc(problemText(q))}: decide each step.${T.done[i] ? ' <span class="badge-done">✓ Done</span>' : ''}</p><div class="sr-ws" id="sr-tg"></div>` +
        `<details class="parent-help"><summary>Parent Help</summary><p>${esc(C.togetherTips[i % C.togetherTips.length])}</p></details>` +
        `<div class="stage-nav"><button type="button" class="btn btn-ghost" data-t="prev"${i === 0 ? ' disabled' : ''}>← Previous</button><span class="muted">${doneN} of ${set.length} done</span>` +
        `<button type="button" class="btn btn-primary" data-t="next"${i === set.length - 1 ? ' disabled' : ''}>Next problem →</button></div>` +
        `<p><button type="button" class="btn btn-ghost btn-small" data-t="new">New problems</button></p></section>` + menuNav('#practice', 'Practice choices');
      const st = T.states[i];
      const inst = keep(SK.mount(main.querySelector('#sr-tg'), { top: q.top, bottom: q.bottom, mode: 'guided', state: st && SK.validState(st, q.top, q.bottom) ? st : null }));
      inst.on('change', (d) => { T.states[i] = d.state; save('guided', T); });
      inst.on('complete', () => { T.done[i] = true; save('guided', T); });
      main.querySelectorAll('[data-t]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.t;
        if (a === 'prev') T.pos = Math.max(0, i - 1); else if (a === 'next') T.pos = Math.min(set.length - 1, i + 1);
        else if (a === 'new') { T.seed = shell.newSeed(); T.pos = 0; T.states = {}; T.done = {}; }
        save('guided', T); cleanup(); togetherView(); focusH('h1');
      }));
    }

    // --- Practice on My Own: setup wizard ---
    function setupView() {
      activity(false);
      const S = sessions(), act = S.setup.active;
      const pick = lastSetup();
      let step = 0;
      const draw = () => {
        const reason = M.unavailableReason(pick.size, pick.difficulty);
        const sizeL = C.SETUP.sizes.find((x) => x.v === pick.size).label, diffL = C.SETUP.difficulties.find((x) => x.v === pick.difficulty).label;
        let q = '';
        if (step === 0) q = `<fieldset class="sr-fs"><legend>1. Number size</legend><p class="muted">The top number has this many digits. The bottom number may have fewer.</p><div class="sr-radios">` +
          C.SETUP.sizes.map((x) => `<label class="choice"><input type="radio" name="sz" value="${x.v}"${pick.size === x.v ? ' checked' : ''}> <span>${esc(x.label)}</span></label>`).join('') + `</div></fieldset>`;
        if (step === 1) q = `<fieldset class="sr-fs"><legend>2. Difficulty</legend><div class="sr-radios sr-radios-wide">` +
          C.SETUP.difficulties.map((x) => { const why = M.unavailableReason(pick.size, x.v); return `<label class="choice${why ? ' is-off' : ''}"><input type="radio" name="df" value="${x.v}"${pick.difficulty === x.v ? ' checked' : ''}${why ? ' disabled aria-describedby="sr-why"' : ''}> <span><b>${esc(x.label)}</b> · ${esc(x.desc)}${why ? ' <i>(not available)</i>' : ''}</span></label>`; }).join('') +
          `</div>${pick.size === 2 ? `<p class="sr-why" id="sr-why">${esc(M.unavailableReason(2, 'hard'))}</p>` : ''}</fieldset>`;
        if (step === 2) q = `<fieldset class="sr-fs"><legend>3. How many questions?</legend><div class="sr-radios">` +
          C.SETUP.lengths.map((x) => `<label class="choice"><input type="radio" name="ln" value="${x}"${pick.length === x ? ' checked' : ''}> <span>${x}</span></label>`).join('') + `</div></fieldset>`;
        if (step === 3) q = `<h2 class="sr-h2">4. Start</h2><p class="lead-sm">${esc(sizeL)} · ${esc(diffL)} · ${pick.length} questions</p>${reason ? `<p class="sr-why">${esc(reason)}</p>` : ''}`;
        main.innerHTML = ctx.hero(eyebrow('Practice on My Own'), 'Practice on My Own', 'Set up your practice.') +
          (act && !act.checked ? `<section class="card"><p><b>You have practice in progress:</b> ${esc(setupText(act.setup))}, question ${Math.min(act.pos + 1, act.order.length)} of ${act.order.length}.</p><div class="actions"><a class="btn btn-primary" href="#practice/run">Continue my practice</a></div></section>` : '') +
          `<section class="card sr-setup"><p class="wiz-count">Step ${step + 1} of 4</p>${q}<div class="stage-nav">` +
          `<button type="button" class="btn btn-ghost" data-s="back"${step === 0 ? ' disabled' : ''}>← Back</button>` +
          (step < 3 ? `<button type="button" class="btn btn-primary" data-s="next">Next →</button>` : `<button type="button" class="btn btn-primary btn-big" data-s="start"${reason ? ' disabled' : ''}>Start</button>`) +
          `</div></section>` + menuNav('#practice', 'Practice choices');
        main.querySelectorAll('input[name=sz]').forEach((r) => r.addEventListener('change', () => {
          pick.size = r.value === 'mixed' ? 'mixed' : Number(r.value);
          if (M.unavailableReason(pick.size, pick.difficulty)) pick.difficulty = 'easy'; // keep the size the child chose; reset only the difficulty
        }));
        main.querySelectorAll('input[name=df]').forEach((r) => r.addEventListener('change', () => { pick.difficulty = r.value; }));
        main.querySelectorAll('input[name=ln]').forEach((r) => r.addEventListener('change', () => { pick.length = Number(r.value); }));
        main.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
          const a = b.dataset.s;
          if (a === 'back') step = Math.max(0, step - 1);
          else if (a === 'next') step = Math.min(3, step + 1);
          else if (a === 'start') {
            if (M.unavailableReason(pick.size, pick.difficulty)) return;
            const setup = { size: pick.size, difficulty: pick.difficulty, length: pick.length };
            save('setup', Object.assign({ v: V }, setup));
            const seed = shell.newSeed();
            const items = M.generateSession(Object.assign({ seed }, setup)).items;
            const S2 = sessions();
            S2.setup.active = { v: V, setup, seed, pos: 0, order: items.map((_, k) => 'q' + (k + 1)), responses: {}, results: {}, checked: false };
            save('bank-sets', S2);
            location.hash = '#practice/run';
            return;
          }
          draw();
          const f = main.querySelector('input:checked') || main.querySelector('[data-s="start"]') || main.querySelector('input');
          if (f) f.focus();
        }));
      };
      draw();
    }
    const setupText = (s) => `${C.SETUP.sizes.find((x) => x.v === s.size).label} · ${C.SETUP.difficulties.find((x) => x.v === s.difficulty).label} · ${s.length} questions`;

    // --- A practice run (setup session or one skill) ---
    function runItems(spec, run) {
      if (spec.kind === 'setup') return M.generateSession(Object.assign({ seed: run.seed }, run.setup)).items.map((q, k) => ({ kind: 'sub', top: q.top, bottom: q.bottom, id: 'q' + (k + 1) }));
      return C.skillSession(spec.id, run.seed);
    }
    function getRun(spec) {
      if (spec.kind === 'setup') { const S = sessions(); return { all: S, rec: S.setup, key: 'bank-sets' }; }
      const S = skillStore(); const k = 'skill-' + spec.id;
      if (!S[k]) S[k] = { active: null, attempts: [] };
      return { all: S, rec: S[k], key: 'skill-practice' };
    }
    function runView(spec) {
      activity(true);
      const G = getRun(spec);
      let run = G.rec.active;
      if (!run && spec.kind === 'skill') {
        const seed = shell.newSeed();
        run = G.rec.active = { v: V, seed, pos: 0, order: C.skillSession(spec.id, seed).map((q) => q.id), responses: {}, results: {}, checked: false };
        save(G.key, G.all);
      }
      if (!run) { location.hash = '#practice/setup'; return; }
      const items = runItems(spec, run);
      if (!items.length || items.length !== run.order.length) { G.rec.active = null; save(G.key, G.all); location.hash = spec.kind === 'setup' ? '#practice/setup' : '#practice/skills'; return; }
      const title = spec.kind === 'setup' ? 'Practice on My Own' : SKILL[spec.id].title;
      if (run.checked || run.pos >= items.length) return runSummary(spec, G, run, items, title);
      const i = run.pos, item = items[i];
      const res = run.results[item.id] || { correct: false, tries: 0, hints: 0 };
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow(spec.kind === 'setup' ? 'Practice on My Own' : 'Practice One Skill')}</p><div class="act-title"><h1 tabindex="-1">${esc(title)}</h1><p class="wiz-count q-count">Question ${i + 1} of ${items.length}</p></div>` +
        `</section>` +
        `<section class="card"><p class="muted sr-runinfo">${esc(spec.kind === 'setup' ? setupText(run.setup) : SKILL[spec.id].desc)}</p><div id="sr-q"></div>${res.correct ? '<p class="badge-done">✓ Correct</p>' : ''}` +
        `<div class="stage-nav"><button type="button" class="btn btn-ghost" data-r="prev"${i === 0 ? ' disabled' : ''}>← Previous</button>` +
        (i === items.length - 1 ? `<button type="button" class="btn btn-primary" data-r="finish">Finish</button>` : `<button type="button" class="btn btn-primary" data-r="next">Next question →</button>`) + `</div></section>` +
        menuNav(spec.kind === 'setup' ? '#practice/setup' : '#practice/skills', spec.kind === 'setup' ? 'Practice setup' : 'Skills');
      const box = main.querySelector('#sr-q');
      const resp = validResponse(item, run.responses[item.id]) ? run.responses[item.id] : {};
      const record = (r) => { run.responses[item.id] = r; save(G.key, G.all); };
      const result = (ok) => {
        const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 };
        rr.tries += 1; if (ok && !rr.correct) { rr.correct = true; rr.firstTry = rr.tries === 1; }
        save(G.key, G.all);
      };
      if (item.kind === 'sub') {
        box.innerHTML = `<p class="q-prompt">Subtract. Regroup marks above the columns are up to you.</p><div class="sr-ws" id="sr-ws"></div>`;
        const inst = keep(SK.mount(box.querySelector('#sr-ws'), { top: item.top, bottom: item.bottom, mode: 'independent', state: resp.ws || null }));
        inst.on('change', (d) => record(compat(item, { ws: d.state })));
        inst.on('answer', (d) => { if (d.status === 'correct' || d.status === 'wrong') result(d.correct); });
        inst.on('hint', () => { const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 }; rr.hints += 1; save(G.key, G.all); });
      } else {
        formItem(box, item, resp, { mode: 'practice', onChange: record, onCorrect: () => result(true), onWrong: () => result(false) });
      }
      main.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.r;
        if (a === 'prev') run.pos = Math.max(0, i - 1);
        else if (a === 'next') run.pos = Math.min(items.length - 1, i + 1);
        else if (a === 'finish') { run.checked = true; run.pos = items.length; }
        save(G.key, G.all); cleanup(); runView(spec); focusH('h1');
      }));
    }
    function runSummary(spec, G, run, items, title) {
      const ok = items.filter((q) => run.results[q.id] && run.results[q.id].correct).length;
      const first = items.filter((q) => run.results[q.id] && run.results[q.id].firstTry).length;
      const hints = items.reduce((s, q) => s + ((run.results[q.id] && run.results[q.id].hints) || 0), 0);
      if (!run.recorded) { G.rec.attempts.push({ v: V, at: new Date().toISOString(), total: items.length, correct: ok, firstTry: first, hints, setup: run.setup || null }); G.rec.attempts = G.rec.attempts.slice(-20); run.recorded = true; save(G.key, G.all); }
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Practice')}</p><h1 tabindex="-1">${esc(title)}: done!</h1></section>` +
        `<section class="card done-card"><p class="done-title">${ok} of ${items.length} solved · ${first} on the first try · ${hints} hint${hints === 1 ? '' : 's'} used</p>` +
        `<p class="muted">Practice is for learning; it is not a test score.</p>` +
        `<ul class="sr-list">${items.map((q, k) => `<li>${k + 1}. ${esc(itemLabel(q))} ${run.results[q.id] && run.results[q.id].correct ? '<span class="badge-done">✓</span>' : '<span class="muted">not finished</span>'}</li>`).join('')}</ul>` +
        `<div class="actions"><button type="button" class="btn btn-primary btn-big" data-again>Practice again</button>` +
        (spec.kind === 'setup' ? `<a class="btn btn-ghost btn-big" href="#practice/setup">Change setup</a>` : `<a class="btn btn-ghost btn-big" href="#practice/skills">Other skills</a>`) + `</div></section>` + menuNav('#practice', 'Practice choices');
      main.querySelector('[data-again]').addEventListener('click', () => {
        const seed = shell.newSeed();
        if (spec.kind === 'setup') G.rec.active = { v: V, setup: run.setup, seed, pos: 0, order: M.generateSession(Object.assign({ seed }, run.setup)).items.map((_, k) => 'q' + (k + 1)), responses: {}, results: {}, checked: false };
        else G.rec.active = { v: V, seed, pos: 0, order: C.skillSession(spec.id, seed).map((q) => q.id), responses: {}, results: {}, checked: false };
        save(G.key, G.all); cleanup(); runView(spec); focusH('h1');
      });
    }
    const itemLabel = (q) => q.kind === 'decide' ? `Decide: ${problemText(q)}` : q.kind === 'mistake' ? `Find the mistake: ${problemText(q)}` : problemText(q);
    function skillsView() {
      activity(false);
      const S = skillStore();
      main.innerHTML = ctx.hero(eyebrow('Practice One Skill'), 'Practice One Skill', `${C.SKILL_LENGTH} questions on one kind of problem, with hints and feedback. Saved separately from Practice on My Own.`) +
        `<nav class="choice-grid" aria-label="Skills">${C.skills.map((s) => {
          const rec = S['skill-' + s.id], a = rec && rec.active, last = rec && rec.attempts && rec.attempts[rec.attempts.length - 1];
          const note = a && !a.checked ? `<span class="choice-progress is-started">In progress</span>` : last ? `<span class="choice-progress is-done">Last: ${last.correct} of ${last.total}</span>` : '';
          return card('#practice/skill-' + s.id, s.title, s.desc, '🎯', '', note);
        }).join('')}</nav>` + menuNav('#practice', 'Practice choices');
    }

    // ===== Test =====
    function testView(c, arg) {
      const D = draft();
      if (arg === 'run' && D) return runTest(D);
      activity(false);
      main.innerHTML = ctx.hero(eyebrow('Take a Test'), 'Regrouping Test', '15 questions. No hints and no checking until you finish. Regroup marks are up to you.') +
        `<section class="card"><ul class="rules"><li>One question at a time; use Previous and Next. Your work is saved.</li><li>At least eight questions use four-digit numbers, including exchanges across zeros.</li><li>Your final answers are graded; regroup marks never count against a right answer.</li><li>Every new test uses new numbers.</li></ul>` +
        `<div class="actions">${D ? `<a class="btn btn-primary btn-big" href="#test/run">Continue the test (${D.questions.filter((id) => D.responses[id] && answeredById(D, id)).length} of 15 answered)</a><button type="button" class="btn btn-ghost" data-new>Start a new test</button>`
          : `<button type="button" class="btn btn-primary btn-big" data-new>Start the test</button>`}</div></section>` + menuNav();
      main.querySelector('[data-new]').addEventListener('click', () => {
        const seed = shell.newSeed(), items = C.testItems(seed);
        save('draft-test', { v: V, seed, pos: 0, questions: items.map((q) => q.id), responses: {} });
        location.hash = '#test/run';
      });
    }
    const answeredById = (D, id) => { const it = C.testItems(D.seed).find((q) => q.id === id); return it ? answered(it, D.responses[id]) : false; };
    function runTest(D, review) {
      activity(true);
      const items = C.testItems(D.seed);
      ctx.setTesting(true, `<span>Test in progress</span><a class="btn btn-small btn-ghost" href="#test">Save and finish later</a>`);
      if (review || D.pos >= items.length) {
        const missing = items.filter((q) => !answered(q, D.responses[q.id]));
        main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Regrouping Test')}</p><h1 tabindex="-1">Review your test</h1></section>` +
          `<section class="card">${missing.length ? `<p>These questions still need an answer:</p><ul class="sr-list">${missing.map((q) => `<li><button type="button" class="btn btn-ghost btn-small" data-go="${items.indexOf(q)}">Question ${items.indexOf(q) + 1}</button></li>`).join('')}</ul>`
            : '<p>Every question has an answer.</p>'}<div class="actions"><button type="button" class="btn btn-ghost" data-go="${items.length - 1}">← Back to the questions</button><button type="button" class="btn btn-primary btn-big" data-finish${missing.length ? ' disabled' : ''}>Finish Test</button></div></section>`;
        main.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { D.pos = Number(b.dataset.go); save('draft-test', D); cleanup(); runTest(D); focusH('h1'); }));
        const fin = main.querySelector('[data-finish]');
        if (fin) fin.addEventListener('click', () => finishTest(D, items));
        return;
      }
      const i = D.pos, item = items[i];
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Regrouping Test')}</p><div class="act-title"><h1 tabindex="-1">Regrouping Test</h1><p class="wiz-count q-count">Question ${i + 1} of ${items.length}</p></div></section>` +
        `<section class="card test-one"><div id="sr-tq" data-qkey="${item.id}"></div><div class="stage-nav"><button type="button" class="btn btn-ghost" data-nav="prev"${i === 0 ? ' disabled' : ''}>← Previous</button>` +
        `<button type="button" class="btn btn-primary" data-nav="next">${i === items.length - 1 ? 'Review and finish →' : 'Next →'}</button></div></section>`;
      const resp = validResponse(item, D.responses[item.id]) ? D.responses[item.id] : {};
      const box = main.querySelector('#sr-tq');
      if (item.kind === 'sub') box.insertAdjacentHTML('beforebegin', `<p class="q-prompt">Subtract.</p>`);
      formItem(box, item, resp, { mode: 'test', onChange: (r) => { D.responses[item.id] = r; save('draft-test', D); } });
      main.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
        D.pos = b.dataset.nav === 'prev' ? Math.max(0, i - 1) : i + 1;
        save('draft-test', D); cleanup(); runTest(D); focusH('h1');
      }));
    }
    function finishTest(D, items) {
      const graded = items.map((q) => Object.assign({ id: q.id, cat: q.cat, skill: q.skill, kind: q.kind, top: q.top, bottom: q.bottom }, grade(q, D.responses[q.id]), { response: readable(q, D.responses[q.id]) }));
      const parts = { final: [0, 0], steps: [0, 0], decide: [0, 0], mistake: [0, 0] };
      graded.forEach((g) => Object.keys(g.parts).forEach((p) => { if (parts[p]) { parts[p][1] += 1; if (g.parts[p]) parts[p][0] += 1; } }));
      const score = graded.filter((g) => g.correct).length;
      const att = { v: V, id: Date.now(), testId: 'test', at: new Date().toISOString(), seed: D.seed, score, total: items.length, pct: Math.round((score / items.length) * 100), parts,
        items: graded.map((g) => ({ id: g.id, cat: g.cat, skill: g.skill, kind: g.kind, top: g.top, bottom: g.bottom, correct: g.correct, parts: g.parts, response: g.response })) };
      const all = attempts(); all.push(att); save('attempts', all.slice(-30));
      store.remove('draft-test');
      location.hash = '#results';
    }
    /** A short, factual record of what was entered (no diagnosis). */
    function readable(q, r) {
      r = r || {};
      const ans = (ws) => { const a = ws ? M.readAnswer(ws.d || []) : { status: 'empty' }; return a.status === 'ok' ? fmt(a.value) : '—'; };
      if (q.kind === 'sub') return ans(r.ws);
      if (q.kind === 'steps') return r.ws ? M.amountsFrom(q.top, r.ws.ann, M.lengthOf(q.top)).slice().reverse().join(' | ') : '—';
      if (q.kind === 'decide') return `${r.c1 || '—'}; ${r.c2 || '—'}`;
      if (q.kind === 'mistake') return `${r.c1 ? 'chose a reason' : '—'}; answer ${ans(r.ws2)}`;
      return '—';
    }

    // ===== Results =====
    function resultsView() {
      activity(false);
      const all = attempts(), last = all[all.length - 1];
      const W = wizard(), T = together(), S = sessions(), SKS = skillStore();
      const guidedNote = `<section class="card">${head('', 'Learning and practice (not part of the test score)', 'student')}<ul class="rules">` +
        `<li>Learn: ${Object.keys(W.done).length} of ${STEP_IDS.length} steps done.</li><li>Practice Together: ${Object.keys(T.done).length} of ${C.together.length} problems done.</li>` +
        `<li>Practice on My Own: ${S.setup.attempts.length} session${S.setup.attempts.length === 1 ? '' : 's'} finished.</li>` +
        `<li>Practice One Skill: ${C.skills.filter((s) => SKS['skill-' + s.id] && SKS['skill-' + s.id].attempts.length).length} of ${C.skills.length} skills practiced.</li></ul></section>`;
      if (!last) {
        main.innerHTML = ctx.hero(eyebrow('My Results'), 'My Results', 'No test results yet.') + `<section class="card"><p>Take the Regrouping Test to see your results here.</p><div class="actions"><a class="btn btn-primary btn-big" href="#test">Take a Test</a></div></section>` + guidedNote + menuNav();
        return;
      }
      const m = mastery(last.pct);
      const part = (k) => last.parts[k] && last.parts[k][1] ? `<tr><th scope="row">${esc(CAT_LABEL[k])}</th><td>${last.parts[k][0]} of ${last.parts[k][1]}</td></tr>` : '';
      const missed = last.items.filter((x) => !x.correct);
      main.innerHTML = ctx.hero(eyebrow('My Results'), 'My Results', `Regrouping Test · ${shell.formatDate(last.at)}`) +
        `<section class="card"><p class="score-big">${last.score} of ${last.total} <span class="muted">(${last.pct}%)</span> <span class="badge-m m-${m.key}">${esc(m.label)}</span></p>` +
        `<p class="advice"><b>Next step:</b> ${esc(m.advice)}</p>` +
        `<table class="sr-table"><caption>Each kind of question, scored separately</caption><tbody>${part('final')}${part('steps')}${part('decide')}${part('mistake')}</tbody></table>` +
        `<p class="muted">Final answers are graded on their own. Regroup marks never count against a right answer.</p></section>` +
        (missed.length ? `<section class="card">${head('', 'Questions to look at again', 'student')}<ul class="sr-list">${missed.map((x) =>
          `<li><b>Question ${Number(x.id.slice(1))}</b> · ${esc(SKILL[x.skill].title)} · ${esc(fmt(x.top))} − ${esc(fmt(x.bottom))}${x.kind === 'sub' || x.kind === 'mistake' ? ` = ${fmt(x.top - x.bottom)}` : ''} <span class="muted">(you wrote: ${esc(x.response)})</span> <a class="btn btn-small" href="#practice/skill-${esc(x.skill)}">Practice this skill</a></li>`).join('')}</ul>` +
          `<p class="muted">These links come from the kind of question, not from a guess about the mistake.</p></section>` : '') +
        guidedNote +
        (all.length > 1 ? `<details class="card"><summary>Earlier attempts (${all.length - 1})</summary><ul class="sr-list">${all.slice(0, -1).reverse().map((a) => `<li>${esc(shell.formatDate(a.at))}: ${a.score} of ${a.total} (${a.pct}%)</li>`).join('')}</ul></details>` : '') +
        `<div class="actions"><a class="btn btn-primary btn-big" href="#test">Take a new test</a></div>` + menuNav();
    }

    ctx.render();
    return { ctx, store };
  }

  MB.subtractRegrouping.start = start;
  MB.subtractRegrouping._grade = grade;
  MB.subtractRegrouping._answered = answered;
  MB.subtractRegrouping._validResponse = validResponse;
})(window);
