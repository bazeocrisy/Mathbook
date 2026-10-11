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
  const pv = MB.pv;
  const shell = MB.shell;
  const head = (...args) => shell.sectionHead(...args); // looked up when used, so the sanitizers load without the shell (Node tests)
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
    if (item.kind === 'exchange') return (r.t === undefined || typeof r.t === 'string') && (r.o === undefined || typeof r.o === 'string') && (r.q === undefined || isInt(r.q, 0, 2)) && (r.helped === undefined || typeof r.helped === 'boolean');
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
    if (item.kind === 'exchange') { const t = /^\d+$/.test(String(r.t || '').trim()) && Number(r.t) === item.tens - 1, o = /^\d+$/.test(String(r.o || '').trim()) && Number(r.o) === item.ones + 10; return { correct: t && o, parts: { tens: t, ones: o } }; }
    return { correct: false, parts: {} };
  }
  const problemText = (item) => `${fmt(item.top)} − ${fmt(item.bottom)}`;

  // ---------- Sanitizers for saved records (no storage access; exported for tests) ----------
  const SEED = (x) => isInt(x, 0, 4294967295);
  const STEP_IDS = C.learn.map((st) => st.id);
  /** The entries of o that pass ok(key, value); a bad entry is left out, never the whole object. */
  function pickKeys(o, ok) {
    const out = {};
    if (isObj(o)) Object.keys(o).forEach((k) => { try { if (ok(k, o[k])) out[k] = o[k]; } catch (e) { /* drop this entry */ } });
    return out;
  }
  const validSetup = (x) => isObj(x) && [2, 3, 4, 'mixed'].includes(x.size) && ['easy', 'medium', 'hard', 'mixed'].includes(x.difficulty) && C.SETUP.lengths.includes(x.length) && !M.unavailableReason(x.size, x.difficulty);
  const cleanResults = (r) => pickKeys(r, (k, v) => /^q\d+$/.test(k) && isObj(v) && typeof v.correct === 'boolean' && isInt(v.tries, 0, 9999) && isInt(v.hints, 0, 9999) && (v.firstTry === undefined || typeof v.firstTry === 'boolean') && (v.helped === undefined || typeof v.helped === 'boolean'));
  const validPracticeAttempt = (x) => isObj(x) && typeof x.at === 'string' && isInt(x.total, 1, 50) && isInt(x.correct, 0, 50) && isInt(x.firstTry, 0, 50) && isInt(x.hints, 0, 99999);
  /** The items of a run (rebuilt from its seed): a setup session or one skill. */
  function runItemsFor(kind, a) {
    if (kind === 'setup') return M.generateSession(Object.assign({ seed: a.seed }, a.setup)).items.map((q, k) => ({ kind: 'sub', top: q.top, bottom: q.bottom, id: 'q' + (k + 1) }));
    return C.skillSession(kind, a.seed);
  }
  /** An active run, or null if it can't be used. Responses and results are cleaned one by one. */
  function cleanRun(a, kind) {
    if (!isObj(a) || a.v !== V || !SEED(a.seed) || typeof a.checked !== 'boolean') return null;
    if (kind === 'setup' && !validSetup(a.setup)) return null;
    const items = runItemsFor(kind, a);
    if (!items.length) return null;
    const byId = Object.fromEntries(items.map((q) => [q.id, q]));
    const responses = pickKeys(a.responses, (k, v) => byId[k] && validResponse(byId[k], v));
    return Object.assign({}, a, { pos: isInt(a.pos, 0, items.length) ? a.pos : 0, order: items.map((q) => q.id), responses, results: cleanResults(a.results),
      answered: items.filter((q) => answered(q, responses[q.id])).map((q) => q.id), recorded: a.recorded === true });
  }
  const PART_KEYS = ['final', 'steps', 'decide', 'mistake'];
  function cleanAttempt(x) {
    if (!isObj(x) || x.v !== V || x.testId !== 'test' || !isInt(x.score, 0, 15) || x.total !== 15 || !isInt(x.pct, 0, 100) || typeof x.at !== 'string') return null;
    const parts = pickKeys(x.parts, (k, v) => PART_KEYS.includes(k) && Array.isArray(v) && v.length === 2 && isInt(v[0], 0, 15) && isInt(v[1], 0, 15) && v[0] <= v[1]);
    const items = (Array.isArray(x.items) ? x.items : []).filter((it) => isObj(it) && /^t\d+$/.test(it.id) && SKILL[it.skill] && CAT_LABEL[it.cat] && ITEM_KINDS.includes(it.kind) &&
      isInt(it.top, 0, 9999) && isInt(it.bottom, 0, 9999) && typeof it.correct === 'boolean' && typeof it.response === 'string');
    return Object.assign({}, x, { parts, items });
  }
  const SAN = {
    STEP_IDS,
    wizard: (w) => isObj(w) ? { v: V, step: isInt(w.step, 0, STEP_IDS.length - 1) ? w.step : 0,
      done: pickKeys(w.done, (k, v) => STEP_IDS.includes(k) && v === true),
      phase: pickKeys(w.phase, (k, v) => STEP_IDS.includes(k) && ['example', 'try'].includes(v)),
      ex: pickKeys(w.ex, (k, v) => STEP_IDS.includes(k) && isInt(v, 0, 9)),
      checks: pickKeys(w.checks, (k, v) => STEP_IDS.includes(k) && isObj(v) && SEED(v.seed)),
      helped: pickKeys(w.helped, (k, v) => STEP_IDS.includes(k) && v === true) } : null,
    together: (t) => isObj(t) ? { v: V, pos: isInt(t.pos, 0, C.together.length - 1) ? t.pos : 0, seed: SEED(t.seed) ? t.seed : 0,
      states: pickKeys(t.states, (k, v) => isInt(Number(k), 0, C.together.length - 1) && isObj(v)),
      done: pickKeys(t.done, (k, v) => isInt(Number(k), 0, C.together.length - 1) && v === true),
      helped: pickKeys(t.helped, (k, v) => isInt(Number(k), 0, C.together.length - 1) && v === true) } : null,
    sessions: (b) => {
      if (!isObj(b)) return null;
      const st = isObj(b.setup) ? b.setup : {};
      return { v: V, setup: { active: cleanRun(st.active, 'setup'), attempts: (Array.isArray(st.attempts) ? st.attempts : []).filter(validPracticeAttempt) } };
    },
    skills: (x) => {
      if (!isObj(x)) return null;
      const out = { v: V };
      Object.keys(x).forEach((k) => {
        if (!/^skill-/.test(k) || !SKILL[k.slice(6)] || !isObj(x[k])) return; // only this entry is dropped
        out[k] = { active: cleanRun(x[k].active, k.slice(6)), attempts: (Array.isArray(x[k].attempts) ? x[k].attempts : []).filter(validPracticeAttempt) };
      });
      return out;
    },
    draft: (d) => {
      if (!isObj(d) || d.v !== V || !SEED(d.seed)) return null;
      const items = C.testItems(d.seed), byId = Object.fromEntries(items.map((q) => [q.id, q]));
      const responses = pickKeys(d.responses, (k, v) => byId[k] && validResponse(byId[k], v));
      return { v: V, seed: d.seed, pos: isInt(d.pos, 0, items.length) ? d.pos : 0, questions: items.map((q) => q.id), responses,
        answered: items.filter((q) => answered(q, responses[q.id])).map((q) => q.id) };
    },
    attempts: (x) => Array.isArray(x) ? x.map((a) => { try { return cleanAttempt(a); } catch (e) { return null; } }).filter(Boolean) : null,
    setup: (x) => isObj(x) && x.v === V && validSetup(x) ? x : null
  };

  function start(opts) {
    opts = opts || {};
    const store = shell.makeStore(C.storagePrefix);
    let live = []; // mounted workspaces on screen (destroyed when the screen changes)
    const keep = (inst) => { live.push(inst); return inst; };
    const cleanup = () => { live.forEach((i) => i.destroy()); live = []; };

    // ---------- Saved records: each is cleaned entry by entry (SR-M01/M02); a bad entry is dropped, the rest kept ----------
    function read(key, clean, fallback) {
      const raw = store.get(key, null);
      if (raw === null) return fallback();
      try { const c = clean(raw); if (c) return c; } catch (e) { /* treated as malformed */ }
      return fallback(); // unusable as a whole: ignored here and replaced on the next save; other keys untouched
    }
    const save = (key, val) => store.set(key, val);
    const STEP_IDS = SAN.STEP_IDS;
    const wizard = () => read('see-wizard', SAN.wizard, () => ({ v: V, step: 0, done: {}, phase: {}, ex: {}, checks: {}, helped: {} }));
    const together = () => read('guided', SAN.together, () => ({ v: V, pos: 0, seed: 0, states: {}, done: {}, helped: {} }));
    const sessions = () => read('bank-sets', SAN.sessions, () => ({ v: V, setup: { active: null, attempts: [] } }));
    const skillStore = () => read('skill-practice', SAN.skills, () => ({ v: V }));
    const draft = () => read('draft-test', SAN.draft, () => null);
    const attempts = () => read('attempts', SAN.attempts, () => []);
    const lastSetup = () => read('setup', SAN.setup, () => Object.assign({ v: V }, C.SETUP.defaults));

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
    function bindParts() {
      main.querySelectorAll('[data-part]').forEach((b) => b.addEventListener('click', () => {
        exPart = Math.max(0, exPart + (b.dataset.part === 'next' ? 1 : -1));
        const W = wizard(), step = C.learn[W.step], ex = step.examples[Math.min(W.ex[step.id] || 0, step.examples.length - 1)];
        main.querySelector('.sr-example').innerHTML = exampleHTML(ex);
        bindParts();
        const nb = main.querySelector(`[data-part="${b.dataset.part}"]:not([disabled])`) || main.querySelector('[data-part]:not([disabled])'); if (nb) nb.focus({ preventScroll: true });
      }));
    }
    function drawStep(W) {
      cleanup();
      if (!W.helped) W.helped = {};
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
          `</div>${done ? '' : `<p class="wiz-locked-note">Answer correctly (or use Show me) to unlock ${last ? 'Finish' : 'the next step'}.</p>`}`;
      }
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Learn')}</p><div class="act-title"><h1 tabindex="-1">Learn</h1><p class="wiz-count">Step ${k + 1} of ${STEP_IDS.length}</p></div></section>` +
        `<section class="card wiz-card" data-phase="${phase === 'example' ? 'example' : 'try'}"><h2 tabindex="-1" class="wiz-h"><span class="phase-tag phase-${phase === 'example' ? 'example' : 'try'}">${phase === 'example' ? 'Example' : 'Your Turn'}</span><span class="wiz-step-title">${esc(step.title)}</span></h2>${body}</section>` +
        `<div class="wiz-menu"><a class="btn btn-ghost" href="#menu">Section Menu</a></div>`;
      if (phase === 'example') {
        mountExample(step.examples[Math.min(W.ex[step.id] || 0, step.examples.length - 1)]);
        main.querySelectorAll('[data-part]').forEach((b) => b.addEventListener('click', () => {
          exPart = Math.max(0, exPart + (b.dataset.part === 'next' ? 1 : -1));
          const ex = step.examples[Math.min(W.ex[step.id] || 0, step.examples.length - 1)];
          main.querySelector('.sr-example').innerHTML = exampleHTML(ex);
          bindParts();
          const nb = main.querySelector(`[data-part="${b.dataset.part}"]:not([disabled])`) || main.querySelector('[data-part]:not([disabled])'); if (nb) nb.focus({ preventScroll: true });
          const sayEl = main.querySelector('.sr-say'); if (sayEl) { sayEl.setAttribute('aria-live', 'polite'); }
        }));
      }
      else mountTry(W, step);
      main.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', (e) => {
        const a = b.dataset.w;
        // Completion is read live: a step finished after this screen was drawn must unlock Next and Finish at once.
        if (a === 'finish') { if (!W.done[step.id]) e.preventDefault(); return; }
        exPart = 0;
        if (a === 'prev-ex' || a === 'next-ex') W.ex[step.id] = Math.max(0, Math.min(step.examples.length - 1, (W.ex[step.id] || 0) + (a === 'next-ex' ? 1 : -1)));
        else if (a === 'try') W.phase[step.id] = 'try';
        else if (a === 'example') W.phase[step.id] = 'example';
        else if (a === 'next' && W.done[step.id] && k < STEP_IDS.length - 1) W.step = k + 1;
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
    /** Tens and ones as base-ten blocks (the existing Mathbook blocks), with the affected columns marked. */
    function blocks2(tens, ones, o) {
      o = o || {};
      const col = (pi, count, hi, chip) => { const P = pv.PLACES[pi];
        return `<div class="blocks-col place-${P.key}${hi ? ' is-hi' : ''}"><div class="blocks-label">${P.name}${chip ? ` <span class="sr-chip">${chip}</span>` : ''}</div><div class="blocks-art">${pv.placeSVG(pi, count)}</div>` +
          `<figcaption><b>${count}</b> ${count === 1 ? P.one : P.key} = ${fmt(count * P.value)}</figcaption></div>`; };
      return `<figure class="blocks sr-blocks2" aria-label="${tens} tens and ${ones} ones">${col(2, tens, o.hiT, o.chipT)}${col(3, ones, o.hiO, o.chipO)}</figure>`;
    }
    /** Step 1's example, one action at a time: 49 → exchange 1 ten for 10 ones → 3 tens and 19 ones → 30 + 19 = 49. */
    function blockParts(n) {
      const t = Math.floor(n / 10), o = n % 10;
      return [
        { html: blocks2(t, o), say: `${n} has ${t} tens and ${o} ones.` },
        { html: blocks2(t, o, { hiT: true, chipT: '−1' }) + `<p class="sr-swap"><span>1 ten</span> <span aria-hidden="true">➜</span> <span>10 ones</span></p>`, say: 'Exchange 1 ten for 10 ones. Take 1 ten from the tens.' },
        { html: blocks2(t - 1, o + 10, { hiT: true, chipT: '−1', hiO: true, chipO: '+10' }), say: `The tens go from ${t} to ${t - 1}. The ones go from ${o} to ${o + 10}. Now there are ${t - 1} tens and ${o + 10} ones.` },
        { html: blocks2(t - 1, o + 10), say: `${(t - 1) * 10} + ${o + 10} = ${n}. The value is the same: we only changed how it is shown.` }
      ];
    }
    let exPart = 0;
    function exampleHTML(ex) {
      if (ex.kind === 'blocks') {
        const parts = blockParts(ex.n), k = Math.min(exPart, parts.length - 1);
        return `<div class="sr-blockdemo">${parts[k].html}<p class="slide-say sr-say">${esc(parts[k].say)}</p></div>` +
          `<div class="demo-controls"><button type="button" class="btn btn-ghost" data-part="back"${k === 0 ? ' disabled' : ''}>◀ Back</button><span class="demo-count">Part ${k + 1} of ${parts.length}</span>` +
          `<button type="button" class="btn btn-primary" data-part="next"${k === parts.length - 1 ? ' disabled' : ''}>Next ▶</button></div>`;
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
      else if (ex.kind === 'mistake') { const w = M.buggyWork(ex.top, ex.bottom, ex.bug); keep(SK.mount(box, { top: ex.top, bottom: ex.bottom, mode: 'view', work: w, caption: `${ex.who}'s work`, answerLabel: `${ex.who}'s answer` })); }
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
      /** Completed: independently, or with help (Show me). Help never blocks moving on, and is recorded as help. */
      const solved = (helped) => {
        W.done[step.id] = true;
        if (helped) W.helped[step.id] = true; else delete W.helped[step.id];
        save('see-wizard', W);
        const nb = main.querySelector('[data-w="next"]'); if (nb) nb.disabled = false;
        const fb = main.querySelector('[data-w="finish"]'); if (fb) { fb.classList.remove('is-disabled'); fb.removeAttribute('aria-disabled'); fb.removeAttribute('tabindex'); fb.setAttribute('href', '#see/done'); }
        const note = main.querySelector('.wiz-locked-note'); if (note) note.remove();
        showAgain(helped);
      };
      const showAgain = (helped) => {
        let a = box.querySelector('.sr-again');
        if (!a) { box.insertAdjacentHTML('beforeend', '<div class="sr-again"></div>'); a = box.querySelector('.sr-again'); }
        a.innerHTML = (helped ? '<p class="sr-helped">Done with help. When you are ready, try a similar problem on your own (or go on).</p>' : '') +
          `<button type="button" class="btn btn-ghost" data-new>${helped ? 'Try a similar problem' : 'New problem'}</button>`;
        a.querySelector('[data-new]').addEventListener('click', () => { W.checks[step.id] = { seed: shell.newSeed() }; save('see-wizard', W); drawStep(W); focusH('.wiz-h'); });
      };
      if (item.kind === 'guided') {
        box.innerHTML = `<p class="q-prompt">Work through ${esc(problemText(item))}, one decision at a time. Use 💡 Hint or Show me if you get stuck.</p><div class="sr-ws" id="sr-yt"></div>`;
        const inst = keep(SK.mount(box.querySelector('#sr-yt'), { top: item.top, bottom: item.bottom, mode: 'guided', state: ck.state && SK.validState(ck.state, item.top, item.bottom) ? ck.state : null }));
        inst.on('change', (d) => { ck.state = d.state; save('see-wizard', W); });
        inst.on('complete', (d) => solved(!!d.helped));
        if (ck.state && ck.state.guided && ck.state.guided.stage === 'done') showAgain(!!W.helped[step.id]);
      } else if (item.kind === 'exchange') {
        const resp = validResponse(item, ck.resp) ? ck.resp : {};
        exchangeTry(box, item, resp, { onChange: (r) => { ck.resp = r; save('see-wizard', W); }, onDone: (helped) => solved(helped) });
        if (W.done[step.id] && resp.q === 2) showAgain(!!W.helped[step.id]);
      } else {
        const resp = validResponse(item, ck.resp) ? ck.resp : {};
        formItem(box, item, resp, { mode: 'learn', onChange: (r) => { ck.resp = r; save('see-wizard', W); }, onCorrect: (first, helped) => solved(!!helped) });
        if (W.done[step.id]) showAgain(!!W.helped[step.id]);
      }
    }

    /**
     * Step 1's Your Turn, one question at a time, with the starting blocks always on screen:
     * "How many tens are left?" then "How many ones are there now?" Each has Check Answer, Hint and Show me.
     */
    function exchangeTry(box, item, resp, o) {
      const R0 = Object.assign({ q: 0 }, resp), n = item.n, t = item.tens, on = item.ones;
      const QS = [
        { key: 't', label: 'How many tens are left?', want: t - 1,
          hint: `Start with the ${t} tens. 1 ten is exchanged, so take 1 away from the tens.`,
          wrong: (v) => `${n} has ${t} tens. When 1 ten is exchanged for 10 ones, there is 1 fewer ten${v === t + 1 ? ', not 1 more' : ''}.`,
          show: `${n} has ${t} tens. Exchange 1 ten for 10 ones: ${t} − 1 = ${t - 1} tens are left.` },
        { key: 'o', label: 'How many ones are there now?', want: on + 10,
          hint: `There were ${on} ones. The ten you exchanged becomes 10 ones. Add them.`,
          wrong: (v) => `There were ${on} ones, and the exchanged ten becomes 10 ones${v === on + 1 ? ' (10 ones, not 1)' : ''}.`,
          show: `There were ${on} ones. 1 ten = 10 ones, so now there are ${on} + 10 = ${on + 10} ones.` }
      ];
      const draw = (focusSel) => {
        const q = R0.q;
        let h = `<p class="q-prompt">Exchange 1 ten for 10 ones in <b>${n}</b>.</p>${blocks2(t, on)}`;
        QS.forEach((Q, k) => { if (k < q) h += `<p class="sr-done-line"><span aria-hidden="true">✓ </span>${esc(Q.label)} <b>${R0[Q.key]}</b>${R0['h' + k] ? ' <span class="sr-helped-tag">(shown)</span>' : ''}</p>${R0['h' + k] ? `<p class="sr-shown">${esc(Q.show)}</p>` : ''}`; });
        if (q < 2) {
          const Q = QS[q];
          h += `<div class="sr-q1"><label class="sr-q1-label" for="sr-q1in">${esc(Q.label)}</label> <input id="sr-q1in" class="ci sr-num" inputmode="numeric" maxlength="2" autocomplete="off" value="${esc(R0[Q.key] || '')}"></div>` +
            `<div class="check-row sr-helprow"><button type="button" class="btn btn-primary" data-x="check">Check Answer</button><button type="button" class="btn btn-ghost" data-x="hint">💡 Hint</button><button type="button" class="btn btn-ghost" data-x="show">Show me</button></div>` +
            `<div class="feedback-area" aria-live="polite"></div>`;
        } else {
          h += `<p class="sr-after-h">After the exchange:</p>${blocks2(t - 1, on + 10, { hiT: true, chipT: '−1', hiO: true, chipO: '+10' })}` +
            `<div class="feedback feedback-ok"><p><span aria-hidden="true">✓ </span>Now there are ${t - 1} tens and ${on + 10} ones. ${(t - 1) * 10} + ${on + 10} = ${n}. The value is the same.</p></div>`;
        }
        box.innerHTML = h;
        const inp = box.querySelector('#sr-q1in');
        if (inp) inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 2); R0[QS[R0.q].key] = inp.value; o.onChange(Object.assign({}, R0)); });
        box.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => act(b.dataset.x)));
        if (focusSel) { const f = box.querySelector(focusSel); if (f) f.focus({ preventScroll: true }); }
      };
      const fbArea = () => box.querySelector('.feedback-area');
      const retryRow = '<div class="check-row sr-helprow"><button type="button" class="btn btn-ghost" data-x="retry">Try again</button><button type="button" class="btn btn-ghost" data-x="hint">Get a hint</button><button type="button" class="btn btn-ghost" data-x="show">Show me how</button></div>';
      const next = (helpedNow) => {
        if (helpedNow) { R0['h' + R0.q] = true; R0.helped = true; }
        R0.q += 1; o.onChange(Object.assign({}, R0));
        draw(R0.q < 2 ? '#sr-q1in' : '.feedback-ok');
        if (R0.q === 2) o.onDone(!!R0.helped);
      };
      function act(x) {
        const Q = QS[R0.q], area = fbArea();
        if (x === 'retry') { area.innerHTML = ''; const i = box.querySelector('#sr-q1in'); if (i) { i.focus(); i.select(); } return; }
        if (x === 'hint') { area.innerHTML = `<div class="feedback feedback-info"><p><span aria-hidden="true">💡 </span>${esc(Q.hint)}</p></div>`; return; }
        if (x === 'show') { R0[Q.key] = String(Q.want); next(true); return; } // the worked line is drawn under its question (see draw)
        const v = String(R0[Q.key] || '').trim();
        if (!/^\d+$/.test(v)) { area.innerHTML = '<div class="feedback"><p>Type a number, then check.</p></div>'; return; }
        if (Number(v) === Q.want) { next(false); return; }
        area.innerHTML = `<div class="feedback feedback-no"><p><span aria-hidden="true">✗ </span>${esc(Q.wrong(Number(v)))}</p></div>` + retryRow;
        area.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => act(b.dataset.x)));
      }
      draw(null);
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
      if (item.kind === 'decide') {
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
      box.innerHTML = h + (showCheck ? `<div class="check-row sr-helprow"><button type="button" class="btn btn-primary" data-check>Check Answer</button><button type="button" class="btn btn-ghost" data-help="hint">💡 Hint</button><button type="button" class="btn btn-ghost" data-help="show">Show me</button></div><div class="feedback-area" aria-live="polite"></div><div class="sr-worked"></div>` : '');
      // Workspaces.
      const wsView = box.querySelector('[data-ws="view"]'), wsAns = box.querySelector('[data-ws="answer"]'), wsSteps = box.querySelector('[data-ws="steps"]');
      if (wsView) keep(SK.mount(wsView, item.kind === 'mistake'
        ? { top: item.top, bottom: item.bottom, mode: 'view', work: item.work, caption: `${item.who}'s work`, answerLabel: `${item.who}'s answer` }
        : { top: item.top, bottom: item.bottom, mode: 'view', answer: false, work: { ann: {}, d: [] } }));
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
        let misses = 0, helped = !!R.helped;
        const area = () => box.querySelector('.feedback-area');
        const bindRow = () => area().querySelectorAll('[data-help]').forEach((b) => b.addEventListener('click', () => help(b.dataset.help)));
        const retryRow = '<div class="check-row sr-helprow"><button type="button" class="btn btn-ghost" data-help="retry">Try again</button><button type="button" class="btn btn-ghost" data-help="hint">Get a hint</button><button type="button" class="btn btn-ghost" data-help="show">Show me how</button></div>';
        function help(kind) {
          if (kind === 'retry') { area().innerHTML = ''; const f = box.querySelector('input:not([disabled])'); if (f) f.focus(); return; }
          if (kind === 'hint') { area().innerHTML = `<div class="feedback feedback-info"><p><span aria-hidden="true">💡 </span>${esc(hintText(item, R))}</p></div>`; if (o.onHint) o.onHint(); return; }
          // Show me: the right answer, worked in the same vertical model, then the child may go on (recorded as help).
          helped = true; R.helped = true;
          if (item.kind === 'decide') { R.c1 = item.needs; R.c2 = item.first; }
          if (item.kind === 'mistake' || item.kind === 'check') R.c1 = item.answer;
          box.querySelectorAll('input[type=radio]').forEach((r) => { const key = r.name.slice(-2); r.checked = R[key] === r.value; });
          const p = M.plan(item.top, item.bottom), ann = {};
          p.exchanges.forEach((e) => { (ann[e.from] = ann[e.from] || []).push(e.after[e.from]); (ann[e.to] = ann[e.to] || []).push(e.after[e.to]); });
          if (ansInst) { const st = ansInst.getState(); st.d = M.digitsOf(item.top - item.bottom, M.lengthOf(item.top)).map(String); while (st.d.length > 1 && st.d[st.d.length - 1] === '0') st.d.pop(); ansInst.setState(st); R[ansKey] = ansInst.getState(); }
          fire();
          const worked = box.querySelector('.sr-worked');
          worked.innerHTML = `<p class="sr-shown"><b>Here is how:</b> ${esc(showText(item))}</p>` + (item.kind === 'decide' ? '' : `<div class="sr-ws" data-ws="worked"></div><ol class="sk-steps">${M.solutionLines(item.top, item.bottom).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`);
          const wv = worked.querySelector('[data-ws="worked"]');
          if (wv) keep(SK.mount(wv, { top: item.top, bottom: item.bottom, mode: 'view', work: { ann, d: p.columns.map((c) => String(c.digit)) }, caption: 'Worked answer' }));
          area().innerHTML = '<div class="feedback feedback-info"><p>Shown. Read it, then go on, or try a similar problem on your own.</p></div>';
          const h = worked.querySelector('.sr-shown'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); h.scrollIntoView({ block: 'nearest' }); }
          if (o.onCorrect) o.onCorrect(false, true);
        }
        box.querySelectorAll('.sr-helprow [data-help]').forEach((b) => b.addEventListener('click', () => help(b.dataset.help)));
        box.querySelector('[data-check]').addEventListener('click', () => {
          if (!answered(item, R)) { area().innerHTML = `<div class="feedback"><p>Answer every part, then check.</p></div>`; return; }
          const g = grade(item, R);
          if (g.correct) {
            area().innerHTML = `<div class="feedback feedback-ok"><p><span aria-hidden="true">✓ </span>${esc(rightText(item))}</p></div>`;
            if (o.onCorrect) o.onCorrect(misses === 0 && !helped, helped);
          } else {
            misses += 1;
            area().innerHTML = `<div class="feedback feedback-no"><p><span aria-hidden="true">✗ </span>${esc(wrongText(item, R, g, misses))}</p></div>` + retryRow;
            bindRow();
            if (o.onWrong) o.onWrong();
          }
        });
      }
      return { get response() { return compat(item, R); } };
    }
    function rightText(item) {
      if (item.kind === 'decide') return item.needs === 'Yes' ? `Right. The ${item.first.toLowerCase()} column needs an exchange first.` : 'Right. Every top digit is enough, so no regrouping is needed.';
      if (item.kind === 'mistake') return `Right. ${problemText(item)} = ${fmt(item.top - item.bottom)}.`;
      if (item.kind === 'check') return `Right. ${fmt(item.top - item.bottom)} + ${fmt(item.bottom)} = ${fmt(item.top)}.`;
      return 'Right.';
    }
    /** A next-step clue that never gives the whole answer. */
    function hintText(item, R) {
      const p = M.plan(item.top, item.bottom), o = M.digitsOf(item.top, M.lengthOf(item.top)), b = M.digitsOf(item.bottom, M.lengthOf(item.top));
      if (item.kind === 'decide') return `Start with the ones: the top has ${o[0]} and the bottom has ${b[0]}. Is ${o[0]} enough to take away ${b[0]}? If yes, move one column left and ask again.`;
      if (item.kind === 'mistake') {
        const c = p.columns.find((x) => String(x.digit) !== String(item.work.d[x.place])) || p.columns[0];
        return `Look at the ${M.PLACES[c.place].name} column. ${item.who} wrote ${item.work.d[c.place]} there. Work that column yourself and compare.`;
      }
      if (item.kind === 'check') return `First subtract, one column at a time from the ones. To check: answer + ${fmt(item.bottom)} should make the top number.`;
      return 'Start with the ones column.';
    }
    /** The worked explanation behind Show me (the vertical model is shown beside it). */
    function showText(item) {
      const p = M.plan(item.top, item.bottom);
      if (item.kind === 'decide') {
        const lines = p.columns.map((c) => `${M.PLACES[c.place].name}: ${c.before[c.place]} ${c.needs ? 'is less than' : 'is enough for'} ${c.bottomDigit}${c.needs ? ' → exchange' : ''}.`);
        return `${item.needs === 'Yes' ? `Yes. The ${item.first.toLowerCase()} column needs an exchange first.` : 'No regrouping is needed.'} ${lines.join(' ')}`;
      }
      if (item.kind === 'mistake') return `${item.who}'s mistake: ${item.answer} The right answer is ${fmt(item.top - item.bottom)}, worked below.`;
      if (item.kind === 'check') return `${problemText(item)} = ${fmt(item.top - item.bottom)}. Check: ${fmt(item.top - item.bottom)} + ${fmt(item.bottom)} = ${fmt(item.top)}, the top number.`;
      return '';
    }
    function wrongText(item, R, g, misses) {
      if (item.kind === 'decide') {
        if (R.c1 !== item.needs) { const o = M.digitsOf(item.top, M.lengthOf(item.top)), b = M.digitsOf(item.bottom, M.lengthOf(item.top)); const c = M.plan(item.top, item.bottom).columns.find((x) => x.needs);
          return c ? `Look at the ${M.PLACES[c.place].name}: ${c.before[c.place]} is less than ${c.bottomDigit}, so that column needs an exchange.` : `Every top digit is at least the digit under it (ones: ${o[0]} and ${b[0]}), so no exchange is needed.`; }
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
        `<details class="parent-help"><summary>Parent Help</summary><p>${esc(T.seed ? C.tipFor(q.top, q.bottom) : C.togetherTips[i % C.togetherTips.length])}</p></details>` +
        `<div class="stage-nav"><button type="button" class="btn btn-ghost" data-t="prev"${i === 0 ? ' disabled' : ''}>← Previous</button><span class="muted">${doneN} of ${set.length} done</span>` +
        `<button type="button" class="btn btn-primary" data-t="next"${i === set.length - 1 ? ' disabled' : ''}>Next problem →</button></div>` +
        `<p><button type="button" class="btn btn-ghost btn-small" data-t="new">New problems</button></p></section>` + menuNav('#practice', 'Practice choices');
      const st = T.states[i];
      const inst = keep(SK.mount(main.querySelector('#sr-tg'), { top: q.top, bottom: q.bottom, mode: 'guided', state: st && SK.validState(st, q.top, q.bottom) ? st : null }));
      inst.on('change', (d) => { T.states[i] = d.state; save('guided', T); });
      inst.on('complete', (d) => { T.done[i] = true; if (!T.helped) T.helped = {}; if (d.helped) T.helped[i] = true; else delete T.helped[i]; save('guided', T); });
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
      const record = (r) => { run.responses[item.id] = r; run.answered = items.filter((q) => answered(q, run.responses[q.id])).map((q) => q.id); save(G.key, G.all); };
      const result = (ok, helped) => {
        const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 };
        if (helped) rr.helped = true;
        rr.tries += 1; if (ok && !rr.correct) { rr.correct = true; rr.firstTry = rr.tries === 1 && !rr.helped; }
        save(G.key, G.all);
      };
      if (item.kind === 'sub') {
        box.innerHTML = `<p class="q-prompt">Subtract. Regroup marks above the columns are up to you.</p><div class="sr-ws" id="sr-ws"></div>`;
        const inst = keep(SK.mount(box.querySelector('#sr-ws'), { top: item.top, bottom: item.bottom, mode: 'independent', state: resp.ws || null }));
        inst.on('change', (d) => record(compat(item, { ws: d.state })));
        inst.on('answer', (d) => { if (d.status === 'correct' || d.status === 'wrong') result(d.correct, !!d.helped); });
        inst.on('hint', (d) => { if (d.shown) { const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 }; rr.helped = true; save(G.key, G.all); } });
        inst.on('hint', () => { const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 }; rr.hints += 1; save(G.key, G.all); });
      } else {
        formItem(box, item, resp, { mode: 'practice', onChange: record, onCorrect: (first, helped) => result(!helped, !!helped), onWrong: () => result(false), onHint: () => { const rr = run.results[item.id] = run.results[item.id] || { correct: false, tries: 0, hints: 0 }; rr.hints += 1; save(G.key, G.all); } });
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
      const ok = items.filter((q) => run.results[q.id] && run.results[q.id].correct && !run.results[q.id].helped).length;
      const withHelp = items.filter((q) => run.results[q.id] && run.results[q.id].helped).length;
      const first = items.filter((q) => run.results[q.id] && run.results[q.id].firstTry).length;
      const hints = items.reduce((s, q) => s + ((run.results[q.id] && run.results[q.id].hints) || 0), 0);
      if (!run.recorded) { G.rec.attempts.push({ v: V, at: new Date().toISOString(), total: items.length, correct: ok, firstTry: first, hints, helped: withHelp, setup: run.setup || null }); G.rec.attempts = G.rec.attempts.slice(-20); run.recorded = true; save(G.key, G.all); }
      main.innerHTML = `<section class="hero act-hero"><p class="eyebrow">${eyebrow('Practice')}</p><h1 tabindex="-1">${esc(title)}: done!</h1></section>` +
        `<section class="card done-card"><p class="done-title">${ok} of ${items.length} solved on your own · ${first} on the first try${withHelp ? ` · ${withHelp} with help` : ''} · ${hints} hint${hints === 1 ? '' : 's'} used</p>` +
        `<p class="muted">Practice is for learning; it is not a test score.</p>` +
        `<ul class="sr-list">${items.map((q, k) => `<li>${k + 1}. ${esc(itemLabel(q))} ${run.results[q.id] && run.results[q.id].helped ? '<span class="muted">done with help</span>' : run.results[q.id] && run.results[q.id].correct ? '<span class="badge-done">✓ on your own</span>' : '<span class="muted">not finished</span>'}</li>`).join('')}</ul>` +
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
    const answeredById = (D, id) => D.answered.includes(id); // the draft is already cleaned (responses validated)
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
      formItem(box, item, resp, { mode: 'test', onChange: (r) => { D.responses[item.id] = r; D.answered = items.filter((q) => answered(q, D.responses[q.id])).map((q) => q.id); save('draft-test', D); } });
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
      if (q.kind === 'mistake') return `${ans(r.ws2)}${r.c1 ? ' (reason chosen)' : ' (no reason chosen)'}`;
      return '—';
    }

    // ===== Results =====
    const helpN = (o) => Object.keys(o || {}).length;
    function resultsView() {
      activity(false);
      const all = attempts(), last = all[all.length - 1];
      const W = wizard(), T = together(), S = sessions(), SKS = skillStore();
      const guidedNote = `<section class="card">${head('', 'Learning and practice (not part of the test score)', 'student')}<ul class="rules">` +
        `<li>Learn: ${Object.keys(W.done).length} of ${STEP_IDS.length} steps done${helpN(W.helped) ? ` (${helpN(W.helped)} with help)` : ''}.</li><li>Practice Together: ${Object.keys(T.done).length} of ${C.together.length} problems done${helpN(T.helped) ? ` (${helpN(T.helped)} with help)` : ''}.</li>` +
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
        `<section class="card"><p class="score-big"><span class="sr-nowrap">${last.score} of ${last.total}</span> <span class="muted">(${last.pct}%)</span> <span class="badge-m m-${m.key}">${esc(m.label)}</span></p>` +
        `<p class="advice"><b>Next step:</b> ${esc(m.advice)}</p>` +
        `<table class="sr-table"><caption>Each kind of question, scored separately</caption><tbody>${part('final')}${part('steps')}${part('decide')}${part('mistake')}</tbody></table>` +
        `<p class="muted">Final answers are graded on their own. Regroup marks never count against a right answer.</p></section>` +
        (missed.length ? `<section class="card">${head('', 'Questions to look at again', 'student')}<ul class="sr-list">${missed.map((x) =>
          `<li><b>Question ${Number(x.id.slice(1))}</b> · ${esc(SKILL[x.skill].title)} · ${esc(fmt(x.top))} − ${esc(fmt(x.bottom))}${x.kind === 'sub' || x.kind === 'mistake' ? ` = ${fmt(x.top - x.bottom)}` : ''} <span class="muted">(your answer: ${esc(x.response)})</span> <a class="btn btn-small" href="#practice/skill-${esc(x.skill)}">Practice this skill</a>${x.kind === 'decide' ? '' : `<details class="sr-review" data-top="${x.top}" data-bottom="${x.bottom}"><summary>See the worked answer</summary><div class="sr-ws"></div></details>`}</li>`).join('')}</ul>` +
          `<p class="muted">These links come from the kind of question, not from a guess about the mistake.</p></section>` : '') +
        guidedNote +
        (all.length > 1 ? `<details class="card"><summary>Earlier attempts (${all.length - 1})</summary><ul class="sr-list">${all.slice(0, -1).reverse().map((a) => `<li>${esc(shell.formatDate(a.at))}: ${a.score} of ${a.total} (${a.pct}%)</li>`).join('')}</ul></details>` : '') +
        `<div class="actions"><a class="btn btn-primary btn-big" href="#test">Take a new test</a></div>` + menuNav();
      main.querySelectorAll('.sr-review').forEach((d) => d.addEventListener('toggle', () => {
        const box = d.querySelector('.sr-ws'); if (!d.open || box.dataset.done) return; box.dataset.done = '1';
        const top = Number(d.dataset.top), bottom = Number(d.dataset.bottom), p = M.plan(top, bottom), ann = {};
        p.exchanges.forEach((e) => { (ann[e.from] = ann[e.from] || []).push(e.after[e.from]); (ann[e.to] = ann[e.to] || []).push(e.after[e.to]); });
        keep(SK.mount(box, { top, bottom, mode: 'view', work: { ann, d: p.columns.map((c) => String(c.digit)) }, caption: 'Worked answer' }));
        box.insertAdjacentHTML('beforeend', `<ol class="sk-steps">${M.solutionLines(top, bottom).map((l) => `<li>${esc(l)}</li>`).join('')}</ol>`);
      }));
    }

    ctx.render();
    return { ctx, store };
  }

  MB.subtractRegrouping.start = start;
  MB.subtractRegrouping._grade = grade;
  MB.subtractRegrouping._answered = answered;
  MB.subtractRegrouping._validResponse = validResponse;
  MB.subtractRegrouping._sanitize = SAN;
})(window);
