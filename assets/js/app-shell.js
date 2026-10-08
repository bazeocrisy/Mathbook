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
   *      views:{id: fn}, activityTitle, beforeRender(stage) }
   */
  function startShell(o) {
    const mount = document.getElementById(o.mount || 'mathbook');
    mount.innerHTML =
      `<a class="skip" href="#stage" data-skip>Skip to content</a>` +
      `<header class="topbar"><div class="topbar-in">` +
      `<a class="brand" href="${esc(o.homeHref)}">${LOGO}<span>Mathbook</span></a>` +
      `<span class="crumbs">${esc(o.crumbs || '')}</span>` +
      `<span class="topbar-right">${o.pill ? `<span class="lesson-pill">${esc(o.pill)}</span>` : ''}<a class="home-link" href="${esc(o.homeHref)}">Home</a></span>` +
      `</div></header>` +
      `<nav class="stagebar" aria-label="${esc(o.navLabel || 'Lesson steps')}" style="--stage-count:${o.stages.length}"><ol>` +
      o.stages.map((s, i) => `<li><a class="stage-link" href="#${s.id}" data-stage="${s.id}"><span class="stage-n">${i + 1}</span><span class="stage-t">${esc(s.label)}</span></a></li>`).join('') +
      `</ol></nav>` +
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
      stageFromHash() {
        const h = location.hash.replace('#', '');
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
        o.views[ctx.stage](ctx);
        main.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
          const t = main.querySelector('#' + b.dataset.jump);
          if (t) { t.scrollIntoView({ block: 'start' }); const h = t.querySelector('h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
        }));
        const label = (o.stages.find((s) => s.id === ctx.stage) || {}).label;
        recordActivity({ path: o.path + '#' + ctx.stage, title: o.activityTitle, step: label });
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
    const dotsId = cfg.keyPrefix + '-dots';
    box.innerHTML = `<div class="dots" id="${dotsId}" role="group" aria-label="Problems">` +
      cfg.items.map((g, i) => `<button type="button" class="dot" data-g="${i}" aria-label="Problem ${i + 1}">${i + 1}</button>`).join('') +
      `</div><div class="guided-card"></div>`;
    const card = box.querySelector('.guided-card');

    function dots() {
      box.querySelectorAll('.dot').forEach((d) => {
        const n = Number(d.dataset.g);
        const s = cfg.states[cfg.items[n].id];
        d.classList.toggle('is-on', n === cfg.pos.i);
        d.classList.toggle('is-done', !!(s && s.result === true));
        if (n === cfg.pos.i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
    }

    function draw() {
      const i = cfg.pos.i;
      const q = cfg.items[i];
      const st = cfg.states[q.id] || (cfg.states[q.id] = { response: undefined, result: null, hint: false, reveal: false });
      dots();
      let inner;
      if (q.type === 'explain') {
        inner = `<div class="q"><p class="q-prompt"><span class="q-num" aria-hidden="true">${i + 1}</span><span>${esc(q.prompt)}</span></p></div>` +
          `<div class="listen-box"><b>Listen for:</b><ul>${q.listenFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="explained">They explained it</button>` +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show the explanation</button></div>`;
      } else {
        inner = Q.render(q, cfg.keyPrefix + '-' + q.id, { number: i + 1, response: st.response }) +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="check">Check answer</button>` +
          (q.hint ? `<button type="button" class="btn btn-ghost" data-act="hint">Show a hint</button>` : '') +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show answer and why</button></div>`;
      }
      card.innerHTML = (q.parent ? `<div class="parent-tip"><b>Parent:</b> ${esc(q.parent)}</div>` : '') + inner +
        `<div class="hint-box" ${st.hint && q.hint ? '' : 'hidden'}><b>Hint:</b> ${esc(q.hint || '')}</div>` +
        `<div class="result-box" aria-live="polite"></div>` +
        `<div class="stage-nav stage-nav-inner"><button type="button" class="btn btn-ghost" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Previous</button>` +
        `<button type="button" class="btn btn-primary" data-act="next">${i === cfg.items.length - 1 ? esc(cfg.lastLabel || 'Done') : 'Next problem →'}</button></div>`;

      const resultBox = card.querySelector('.result-box');
      const showResult = () => {
        if (st.reveal) {
          const ans = q.type === 'explain' ? '' : `<p><b>Answer:</b> ${esc(Q.correctText(q))}</p>`;
          resultBox.innerHTML = `<div class="feedback feedback-info">${ans}<p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === true) {
          resultBox.innerHTML = `<div class="feedback feedback-ok"><p><b>✓ ${q.type === 'explain' ? 'Great explaining!' : 'Correct!'}</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === false) {
          const tip = q.type === 'expanded' ? Q.expandedTip(st.response, q.answer) + ' ' : '';
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
      if (qEl) Q.bind(qEl, q, (r) => { st.response = r; });

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
        } else if (act === 'next') {
          if (i < cfg.items.length - 1) { cfg.pos.i = i + 1; draw(); } else if (cfg.onLast) cfg.onLast();
        }
      }));
    }

    box.querySelectorAll('.dot').forEach((d) => d.addEventListener('click', () => { cfg.pos.i = Number(d.dataset.g); draw(); }));
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
    main.innerHTML =
      ctx.hero(cfg.eyebrow, esc(cfg.title), `Attempt ${cfg.attemptNumber} · Answer every question, then press Submit. No hints during the test.`) +
      `<section class="card test-run"><div class="test-progress"><span id="answered" aria-live="polite"></span></div>` +
      `<form id="test-form" novalidate><ol class="q-list">` +
      D.questions.map((q, i) => `<li class="q-item">${Q.render(q, 't-' + q.id, { number: i + 1, response: D.responses[q.id] })}</li>`).join('') +
      `</ol><div class="error-box" role="alert" hidden></div>` +
      `<div class="actions"><button type="submit" class="btn btn-primary btn-big">Submit test</button>` +
      `<button type="button" class="btn btn-ghost" data-exit>Save and finish later</button></div></form></section>`;

    const form = main.querySelector('#test-form');
    const els = Array.from(form.querySelectorAll('.q[data-qkey]'));
    const progress = () => {
      const done = D.questions.filter((q) => Q.isAnswered(q, D.responses[q.id])).length;
      const text = `${done} of ${D.questions.length} answered`;
      main.querySelector('#answered').textContent = text;
      const banner = document.getElementById('answered-banner');
      if (banner) banner.textContent = text;
      const fill = document.getElementById('bar-fill');
      if (fill) fill.style.width = `${(done / D.questions.length) * 100}%`;
    };
    els.forEach((el, i) => Q.bind(el, D.questions[i], (r) => {
      D.responses[D.questions[i].id] = r;
      el.closest('.q-item').classList.remove('needs-answer');
      cfg.store.set(cfg.draftKey, D);
      progress();
    }));
    progress();

    document.querySelectorAll('[data-exit]').forEach((b) => b.addEventListener('click', () => {
      cfg.store.set(cfg.draftKey, D);
      ctx.setTesting(false);
      cfg.onExit();
    }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      els.forEach((el, i) => { D.responses[D.questions[i].id] = Q.read(el, D.questions[i]); });
      const missing = D.questions.map((q, i) => (Q.isAnswered(q, D.responses[q.id]) ? null : i)).filter((x) => x !== null);
      const err = form.querySelector('.error-box');
      els.forEach((el, i) => el.closest('.q-item').classList.toggle('needs-answer', missing.includes(i)));
      if (missing.length) {
        err.hidden = false;
        err.textContent = `Please answer every question before submitting. Still needed: ${missing.map((i) => i + 1).join(', ')}.`;
        const first = els[missing[0]];
        first.scrollIntoView({ block: 'center' });
        const c = first.querySelector('input, select, button');
        if (c) c.focus({ preventScroll: true });
        return;
      }
      const correct = D.questions.map((q) => Q.grade(q, D.responses[q.id]));
      cfg.store.remove(cfg.draftKey);
      ctx.setTesting(false);
      cfg.onSubmit(D, correct);
    });
  }

  /** Clear-progress control with an in-page confirmation (no browser dialogs). */
  function bindClear(main, store, what, onCleared) {
    const btn = main.querySelector('#clear');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const area = main.querySelector('#clear-area');
      area.innerHTML = `<div class="confirm" role="alert"><p><b>Delete all saved ${esc(what)} on this device?</b> This cannot be undone. Other lessons and programs are not affected.</p>` +
        `<button type="button" class="btn btn-danger" id="clear-yes">Yes, delete</button> <button type="button" class="btn btn-ghost" id="clear-no">Cancel</button></div>`;
      area.querySelector('#clear-yes').focus();
      area.querySelector('#clear-yes').addEventListener('click', () => { store.clearAll(); onCleared(); });
      area.querySelector('#clear-no').addEventListener('click', () => onCleared());
    });
  }

  MB.shell = { LOGO, makeStore, recordActivity, readActivity, formatDate, newSeed, sectionHead, startShell, guidedRunner, testRunner, bindClear };
})(window);
