/*
 * Mathbook app shell — shared by every lesson and learning program.
 * Header, stage navigation (hash routing), local storage, guided-practice runner, test runner
 * (focus mode, drafts that survive refresh), and the "Continue Learning" activity record.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const Q = MB.Q;
  const esc = Q.esc;
  const ACTIVITY_KEY = 'mathbook:v2:activity';

  const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<circle cx="20" cy="20" r="11" fill="#ffc94d"/><circle cx="16" cy="16" r="4" fill="#ffe39a"/>' +
    '<ellipse cx="20" cy="21" rx="18" ry="6" fill="none" stroke="#b9a8ff" stroke-width="2.6" transform="rotate(-18 20 20)"/>' +
    '<circle cx="34" cy="7" r="1.8" fill="#fff"/><circle cx="6" cy="33" r="1.2" fill="#fff"/></svg>';

  // ---------- Storage (never throws; pages work without it) ----------
  function makeStore(prefix) {
    const key = (k) => `${prefix}:${k}`;
    return {
      prefix,
      get(k, fallback) {
        try { const v = root.localStorage.getItem(key(k)); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
      },
      set(k, v) {
        try { root.localStorage.setItem(key(k), JSON.stringify(v)); return true; } catch (e) { return false; }
      },
      remove(k) {
        try { root.localStorage.removeItem(key(k)); } catch (e) { /* ignore */ }
      },
      /** Removes only this program's keys (never other lessons or programs). */
      clearAll() {
        try {
          Object.keys(root.localStorage).filter((k) => k.indexOf(prefix + ':') === 0).forEach((k) => root.localStorage.removeItem(k));
        } catch (e) { /* ignore */ }
      },
      works() {
        try { root.localStorage.setItem(key('probe'), '1'); root.localStorage.removeItem(key('probe')); return true; } catch (e) { return false; }
      }
    };
  }

  /** Remembers where the learner was, for the home page's Continue Learning card. */
  function recordActivity(a) {
    try { root.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(Object.assign({ at: new Date().toISOString() }, a))); } catch (e) { /* ignore */ }
  }

  function readActivity() {
    try { return JSON.parse(root.localStorage.getItem(ACTIVITY_KEY) || 'null'); } catch (e) { return null; }
  }

  function formatDate(iso) {
    try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return iso; }
  }

  function newSeed() {
    return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  }

  const AUDIENCE = { student: 'For the student', parent: 'For the parent', together: 'Together', test: 'Test' };

  /** Section header: part tag + heading + who it is for. */
  function sectionHead(part, title, audience, extra) {
    return `<div class="section-head"><div class="section-title">${part ? `<span class="part-tag" aria-hidden="true">${esc(part)}</span>` : ''}<h2>${title}</h2></div>` +
      `${extra || ''}${audience ? `<span class="aud aud-${audience}">${AUDIENCE[audience]}</span>` : ''}</div>`;
  }

  // ---------- Shell and router ----------
  /**
   * o: { mount, homeHref, path (page path from the site root), crumbs, pill, navLabel, stages:[{id,label}],
   *      views:{id: fn(ctx, arg)}, activityTitle, beforeRender(stage),
   *      stagebar (default true; false = no stage tabs — the first stage is a menu instead),
   *      menuLink ({ href, label } shown in the header, e.g. the lesson menu) }
   * Routes may carry one sub-screen: '#practice/together' → stage 'practice', arg 'together'.
   */
  function startShell(o) {
    const mount = document.getElementById(o.mount || 'mathbook');
    const showBar = o.stagebar !== false;
    mount.innerHTML =
      `<a class="skip" href="#stage" data-skip>Skip to content</a>` +
      `<header class="topbar"><div class="topbar-in">` +
      `<a class="brand" href="${esc(o.homeHref)}">${LOGO}<span>Mathbook</span></a>` +
      `<span class="crumbs">${esc(o.crumbs || '')}</span>` +
      `<span class="topbar-right">${o.pill ? `<span class="lesson-pill">${esc(o.pill)}</span>` : ''}` +
      (o.menuLink ? `<a class="home-link" href="${esc(o.menuLink.href)}" data-menu-link>${esc(o.menuLink.label)}</a>` : '') +
      `<a class="home-link" href="${esc(o.homeHref)}">Home</a></span>` +
      `</div></header>` +
      (showBar ? `<nav class="stagebar" aria-label="${esc(o.navLabel || 'Lesson steps')}" style="--stage-count:${o.stages.length}"><ol>` +
        o.stages.map((s, i) => `<li><a class="stage-link" href="#${s.id}" data-stage="${s.id}"><span class="stage-n">${i + 1}</span><span class="stage-t">${esc(s.label)}</span></a></li>`).join('') +
        `</ol></nav>` : '') +
      `<div class="test-banner" role="region" aria-label="Test in progress"><div class="test-banner-in" id="test-banner"></div></div>` +
      `<main id="stage" class="stage" tabindex="-1"></main>` +
      `<footer class="footer"><p>Mathbook · Original learning content · Progress is saved in this browser only.</p></footer>`;
    const main = mount.querySelector('#stage');

    // The skip link must not change the hash (the hash picks the stage).
    mount.querySelector('[data-skip]').addEventListener('click', (e) => { e.preventDefault(); main.focus(); });

    const ctx = {
      main,
      stage: null,
      scrollTo: null,
      arg: null,
      stageFromHash() {
        const [h, arg] = location.hash.replace('#', '').split('/');
        ctx.arg = arg || null;
        return o.stages.some((s) => s.id === h) ? h : o.stages[0].id;
      },
      go(stage, scrollTo) {
        ctx.scrollTo = scrollTo || null;
        if (location.hash === '#' + stage) ctx.render();
        else location.hash = stage;
      },
      setTesting(on, html) {
        document.body.classList.toggle('is-testing', !!on);
        mount.querySelector('#test-banner').innerHTML = on ? html || '' : '';
      },
      hero(eyebrow, title, lead, jumps) {
        return `<section class="hero"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}` +
          (jumps && jumps.length ? `<ul class="jump-nav" aria-label="On this page">${jumps.map((j) => `<li><button type="button" data-jump="${j.id}">${esc(j.label)}</button></li>`).join('')}</ul>` : '') +
          `</section>`;
      },
      navButtons(stage) {
        const i = o.stages.findIndex((s) => s.id === stage);
        const prev = o.stages[i - 1];
        const next = o.stages[i + 1];
        return `<div class="stage-nav">` +
          (prev ? `<a class="btn btn-ghost" href="#${prev.id}">← ${esc(prev.label)}</a>` : '<span></span>') +
          (next ? `<a class="btn btn-primary" href="#${next.id}">Next: ${esc(next.label)} →</a>` : '') + `</div>`;
      },
      render() {
        ctx.stage = ctx.stageFromHash();
        ctx.setTesting(false);
        if (o.beforeRender) o.beforeRender(ctx.stage);
        mount.querySelectorAll('.stage-link').forEach((a) => {
          if (a.dataset.stage === ctx.stage) a.setAttribute('aria-current', 'step');
          else a.removeAttribute('aria-current');
        });
        const menuLink = mount.querySelector('[data-menu-link]');
        if (menuLink) menuLink.hidden = ctx.stage === o.stages[0].id;
        o.views[ctx.stage](ctx, ctx.arg);
        main.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
          const t = main.querySelector('#' + b.dataset.jump);
          if (t) { t.scrollIntoView({ block: 'start' }); const h = t.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
        }));
        const label = (o.stages.find((s) => s.id === ctx.stage) || {}).label;
        recordActivity({ path: o.path + '#' + ctx.stage + (ctx.arg ? '/' + ctx.arg : ''), title: o.activityTitle, step: label });
        if (ctx.scrollTo) {
          const t = main.querySelector('#' + ctx.scrollTo);
          if (t) t.scrollIntoView({ block: 'start' });
          ctx.scrollTo = null;
        } else {
          root.scrollTo(0, 0);
          const h1 = main.querySelector('h1');
          if (h1) h1.focus({ preventScroll: true });
        }
      }
    };
    root.addEventListener('hashchange', () => ctx.render());
    // The caller runs ctx.render() once its views can use ctx.
    return ctx;
  }

  // ---------- Guided practice (one item at a time: hint, check, retry, show why) ----------
  /**
   * cfg: { items, states (object kept by the caller), pos ({ i }), keyPrefix, lastLabel, onLast() }
   * Items may include type 'explain' (parent listens; no typing).
   */
  function guidedRunner(box, cfg) {
    box.innerHTML = `<p class="q-count" aria-live="polite"></p><div class="guided-card"></div>`;
    const card = box.querySelector('.guided-card');

    // "Question X of Y" instead of a row of numbered circles.
    function dots() {
      box.querySelector('.q-count').textContent = `Question ${cfg.pos.i + 1} of ${cfg.items.length}`;
    }

    function draw() {
      const i = cfg.pos.i;
      const q = cfg.items[i];
      const st = cfg.states[q.id] || (cfg.states[q.id] = { response: undefined, result: null, hint: false, reveal: false });
      dots();
      // Grown-up coaching stays available but folded away from the child's question.
      const help = q.parent || q.listenFor
        ? `<details class="parent-help"><summary>Parent Help</summary>${q.parent ? `<p>${esc(q.parent)}</p>` : ''}` +
          (q.listenFor ? `<p><b>Listen for:</b></p><ul>${q.listenFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '') + `</details>`
        : '';
      let inner;
      if (q.type === 'rline') {
        inner = Q.render(q, cfg.keyPrefix + '-' + q.id, { response: st.response, mode: 'guided' });
      } else if (q.type === 'explain') {
        inner = `<div class="q"><p class="q-prompt"><span>${esc(q.prompt)}</span></p></div>` +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="explained">They explained it</button>` +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show the explanation</button></div>`;
      } else {
        inner = Q.render(q, cfg.keyPrefix + '-' + q.id, { response: st.response }) +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="check">Check answer</button>` +
          (q.hint ? `<button type="button" class="btn btn-ghost" data-act="hint">Show a hint</button>` : '') +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show answer and why</button></div>`;
      }
      card.innerHTML = inner + help +
        `<div class="hint-box" ${st.hint && q.hint ? '' : 'hidden'}><b>Hint:</b> ${esc(q.hint || '')}</div>` +
        `<div class="result-box" aria-live="polite"></div>` +
        `<div class="stage-nav stage-nav-inner"><button type="button" class="btn btn-ghost" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Previous</button>` +
        `<button type="button" class="btn btn-primary" data-act="next">${i === cfg.items.length - 1 ? esc(cfg.lastLabel || 'Done') : 'Next problem →'}</button></div>`;

      const resultBox = card.querySelector('.result-box');
      const showResult = () => {
        if (q.type === 'rline') { resultBox.innerHTML = ''; return; }
        if (st.reveal) {
          const ans = q.type === 'explain' ? '' : `<p><b>Answer:</b> ${esc(Q.correctText(q))}</p>`;
          resultBox.innerHTML = `<div class="feedback feedback-info">${ans}<p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === true) {
          resultBox.innerHTML = `<div class="feedback feedback-ok"><p><b>✓ ${q.type === 'explain' ? 'Great explaining!' : 'Correct!'}</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === false) {
          const tip = q.type === 'expanded' ? Q.expandedTip(st.response, q.answer) + ' ' : q.type === 'parts' ? Q.partsTip(q, st.response) + ' ' : '';
          // Don't repeat the hint when it is already showing.
          const hint = q.hint && !st.hint ? 'Hint: ' + esc(q.hint) + ' ' : '';
          resultBox.innerHTML = `<div class="feedback feedback-no"><p><b>Not yet.</b> ${esc(tip)}${hint}Fix it and check again.</p></div>`;
        } else if (st.result === 'empty') {
          resultBox.innerHTML = `<div class="feedback feedback-info"><p>Write an answer first.</p></div>`;
        } else {
          resultBox.innerHTML = '';
        }
      };
      showResult();

      const qEl = card.querySelector('.q[data-qkey]');
      if (qEl && q.type === 'rline') {
        Q.bind(qEl, q, (r) => { st.response = r; st.result = r.complete ? true : null; changed(); });
      } else if (qEl) Q.bind(qEl, q, (r) => { st.response = r; changed(); });
      changed();

      card.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'check') {
          st.response = Q.read(qEl, q);
          st.result = Q.isAnswered(q, st.response) ? Q.grade(q, st.response) : 'empty';
          st.reveal = false;
          showResult();
          dots();
        } else if (act === 'hint') {
          st.hint = true;
          card.querySelector('.hint-box').hidden = false;
          if (st.result === false) showResult();
        } else if (act === 'reveal') {
          st.reveal = true;
          showResult();
        } else if (act === 'explained') {
          st.result = true;
          st.reveal = false;
          showResult();
          dots();
        } else if (act === 'prev') {
          cfg.pos.i = Math.max(0, i - 1);
          draw();
          toTop();
        } else if (act === 'next') {
          if (i < cfg.items.length - 1) { cfg.pos.i = i + 1; draw(); toTop(); } else if (cfg.onLast) cfg.onLast();
        }
        changed();
      }));
    }

    // Lets the lesson save the runner's place and answers (optional).
    function changed() { if (cfg.onChange) cfg.onChange(); }

    // A new question starts at the top of its content.
    function toTop() {
      box.scrollIntoView({ block: 'start' });
      const c = card.querySelector('.q input, .q select, .q button');
      if (c) c.focus({ preventScroll: true });
    }

    draw();
    return { draw };
  }

  // ---------- Test runner (focus mode) ----------
  /**
   * cfg: { store, draftKey, draft, title, eyebrow, attemptNumber, onSubmit(draft, correct[]), onExit() }
   * While a test runs, the stage tabs are hidden; the only ways out are Submit and "Save and finish later".
   */
  function testRunner(ctx, cfg) {
    const D = cfg.draft;
    D.sessions = (D.sessions || 0) + 1; // >1 means the test was paused and resumed
    cfg.store.set(cfg.draftKey, D);
    const main = ctx.main;
    ctx.setTesting(true,
      `<span>${esc(cfg.title)} · <span id="answered-banner"></span></span>` +
      `<span class="bar" aria-hidden="true"><span id="bar-fill"></span></span>` +
      `<button type="button" class="btn btn-ghost" data-exit>Save and finish later</button>`);
    // One question at a time; D.pos === n is the review screen with the Finish Test button.
    const n = D.questions.length;
    D.pos = Math.min(D.pos || 0, n);
    const save = () => cfg.store.set(cfg.draftKey, D);
    const answered = (q) => Q.isAnswered(q, D.responses[q.id]);
    const progress = () => {
      const done = D.questions.filter(answered).length;
      const text = `${done} of ${n} answered`;
      const banner = document.getElementById('answered-banner');
      if (banner) banner.textContent = text;
      const fill = document.getElementById('bar-fill');
      if (fill) fill.style.width = `${(done / n) * 100}%`;
      return done;
    };
    const exit = () => { save(); ctx.setTesting(false); cfg.onExit(); };
    document.querySelectorAll('.test-banner [data-exit]').forEach((b) => b.addEventListener('click', exit));

    function draw() {
      if (D.pos >= n) return review();
      const i = D.pos;
      const q = D.questions[i];
      main.innerHTML =
        ctx.hero(cfg.eyebrow, esc(cfg.title), `Attempt ${cfg.attemptNumber} · No hints during the test. You can go back and change answers.`) +
        `<section class="card test-run"><p class="q-count">Question ${i + 1} of ${n}</p>` +
        `<div class="test-one">${Q.render(q, 't-' + q.id, { response: D.responses[q.id] })}</div>` +
        `<div class="stage-nav stage-nav-inner">${i > 0 ? '<button type="button" class="btn btn-ghost" data-nav="prev">← Previous</button>' : '<span></span>'}` +
        `<button type="button" class="btn btn-primary" data-nav="next">${i === n - 1 ? 'Review my answers →' : 'Next →'}</button></div>` +
        `<p class="test-exit"><button type="button" class="btn btn-ghost" data-exit>Save and finish later</button></p></section>`;
      const el = main.querySelector('.q[data-qkey]');
      Q.bind(el, q, (r) => { D.responses[q.id] = r; save(); progress(); });
      main.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
        D.responses[q.id] = Q.read(el, q);
        D.pos = b.dataset.nav === 'prev' ? i - 1 : i + 1;
        save();
        draw();
        toTop();
      }));
      main.querySelector('[data-exit]').addEventListener('click', exit);
      progress();
    }

    function review() {
      const missing = D.questions.map((q, i) => (answered(q) ? null : i)).filter((x) => x !== null);
      main.innerHTML =
        ctx.hero(cfg.eyebrow, esc(cfg.title), 'Check that every question has an answer, then finish the test.') +
        `<section class="card test-run"><h2 tabindex="-1">Ready to finish?</h2><p class="q-count">You answered ${n - missing.length} of ${n} questions.</p>` +
        (missing.length
          ? `<div class="error-box" role="alert">${missing.length === 1 ? 'This question still needs an answer:' : 'These questions still need answers:'}</div>` +
            `<div class="actions">${missing.map((i) => `<button type="button" class="btn btn-ghost" data-go="${i}">Go to question ${i + 1}</button>`).join('')}</div>`
          : `<p>Every question has an answer. You can still go back and change an answer.</p>`) +
        `<div class="stage-nav stage-nav-inner"><button type="button" class="btn btn-ghost" data-nav="prev">← Previous</button>` +
        `<button type="button" class="btn btn-primary btn-big" data-finish ${missing.length ? 'aria-disabled="true"' : ''}>Finish Test</button></div>` +
        `<p class="test-exit"><button type="button" class="btn btn-ghost" data-exit>Save and finish later</button></p></section>`;
      main.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { D.pos = Number(b.dataset.go); save(); draw(); toTop(); }));
      main.querySelector('[data-nav="prev"]').addEventListener('click', () => { D.pos = n - 1; save(); draw(); toTop(); });
      main.querySelector('[data-exit]').addEventListener('click', exit);
      main.querySelector('[data-finish]').addEventListener('click', () => {
        if (D.questions.some((q) => !answered(q))) { const g = main.querySelector('[data-go]'); if (g) g.focus(); return; }
        const correct = D.questions.map((q) => Q.grade(q, D.responses[q.id]));
        cfg.store.remove(cfg.draftKey);
        ctx.setTesting(false);
        cfg.onSubmit(D, correct);
      });
      progress();
    }

    function toTop() {
      root.scrollTo(0, 0);
      const c = main.querySelector('.test-one input, .test-one select, .test-one button, h2');
      if (c) c.focus({ preventScroll: true });
    }
    draw();
  }

  /** Clear-progress control with an in-page confirmation (no browser dialogs). */
  function bindClear(main, store, what, onCleared, onCancel, yesLabel) {
    const btn = main.querySelector('#clear');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const area = main.querySelector('#clear-area');
      area.innerHTML = `<div class="confirm" role="alert"><p><b>Delete all saved ${esc(what)} on this device?</b> This cannot be undone. Other lessons and programs are not affected.</p>` +
        `<button type="button" class="btn btn-danger" id="clear-yes">${esc(yesLabel || 'Yes, delete')}</button> <button type="button" class="btn btn-ghost" id="clear-no">Cancel</button></div>`;
      area.querySelector('#clear-yes').focus();
      area.querySelector('#clear-yes').addEventListener('click', () => { store.clearAll(); onCleared(); });
      area.querySelector('#clear-no').addEventListener('click', () => (onCancel || onCleared)());
    });
  }

  MB.shell = { LOGO, makeStore, recordActivity, readActivity, formatDate, newSeed, sectionHead, startShell, guidedRunner, testRunner, bindClear };
})(window);
