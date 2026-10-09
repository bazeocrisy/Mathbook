/*
 * Mathbook shared engine for the child-facing book: page frame, simple hash routing,
 * the one-question-at-a-time practice runner, the paged test runner, and local storage.
 * Used by every lesson and by Number Words. Grown-up material lives on grown-ups/.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const Q = MB.Q;
  const pv = MB.pv;
  const esc = Q.esc;
  const ACTIVITY_KEY = 'mathbook:v2:activity';

  const LOGO = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="11" fill="#ffc93c"/>' +
    '<circle cx="16" cy="16" r="3.5" fill="#ffe08f"/><ellipse cx="20" cy="21" rx="18" ry="6" fill="none" stroke="#6b4fd8" stroke-width="2.6" transform="rotate(-18 20 20)"/></svg>';
  const STARS = '<svg class="stars" viewBox="0 0 940 220" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
    '<path d="M610 34 l5 11 11 5 -11 5 -5 11 -5 -11 -11 -5 11 -5z" fill="#ffc93c"/>' +
    '<path d="M880 96 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4z" fill="#b9a6ff"/>' +
    '<circle cx="760" cy="30" r="3" fill="#7fb0ff"/><circle cx="470" cy="18" r="2.5" fill="#b9a6ff"/></svg>';

  // ---------- Storage (never throws; pages work without it) ----------
  function makeStore(prefix) {
    const key = (k) => `${prefix}:${k}`;
    return {
      prefix,
      get(k, fallback) { try { const v = root.localStorage.getItem(key(k)); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
      set(k, v) { try { root.localStorage.setItem(key(k), JSON.stringify(v)); return true; } catch (e) { return false; } },
      remove(k) { try { root.localStorage.removeItem(key(k)); } catch (e) { /* ignore */ } },
      /** Removes only this program's keys (never other lessons or programs). */
      clearAll() {
        try { Object.keys(root.localStorage).filter((k) => k.indexOf(prefix + ':') === 0).forEach((k) => root.localStorage.removeItem(k)); } catch (e) { /* ignore */ }
      },
      works() { try { root.localStorage.setItem(key('probe'), '1'); root.localStorage.removeItem(key('probe')); return true; } catch (e) { return false; } }
    };
  }
  function recordActivity(a) { try { root.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(Object.assign({ at: new Date().toISOString() }, a))); } catch (e) { /* ignore */ } }
  function readActivity() { try { return JSON.parse(root.localStorage.getItem(ACTIVITY_KEY) || 'null'); } catch (e) { return null; } }
  function formatDate(iso) { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return iso; } }
  function newSeed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }

  // ---------- Page frame ----------
  /** Draws the book frame and returns { main, setBack(label, href) }. The logo is the only way home. */
  function frame(mount, homeHref) {
    mount.innerHTML = `<div class="book">${STARS}<a class="skip" href="#main-area" data-skip>Skip to the page</a>` +
      `<header class="bookbar"><a class="logo" href="${esc(homeHref)}" aria-label="Mathbook home">${LOGO}<span>Mathbook</span></a><a class="backlink" hidden></a></header>` +
      `<main id="main-area" tabindex="-1"></main></div>`;
    const main = mount.querySelector('main');
    const back = mount.querySelector('.backlink');
    mount.querySelector('[data-skip]').addEventListener('click', (e) => { e.preventDefault(); main.focus(); });
    return {
      main,
      setBack(label, href) {
        if (!label) { back.hidden = true; return; }
        back.hidden = false;
        back.textContent = '← ' + label;
        back.setAttribute('href', href);
      }
    };
  }

  /** Hash routing: '#learn' → route 'learn', '#set/s1' → route 'set' with arg 's1'. */
  function router(render) {
    const parse = () => { const h = location.hash.replace(/^#/, ''); const [route, arg] = h.split('/'); return { route: route || '', arg: arg || null }; };
    const run = () => { const r = parse(); render(r.route, r.arg); root.scrollTo(0, 0); };
    root.addEventListener('hashchange', run);
    return { run, go(h) { if (location.hash === '#' + h || (h === '' && !location.hash)) run(); else location.hash = h; } };
  }

  function focusTitle(main) {
    const h = main.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function dotsHTML(n, pos, cls, label) {
    if (n > 14) {
      return `<div class="progress-line" role="img" aria-label="${esc(label)}"><span style="width:${Math.round(((pos + 1) / n) * 100)}%"></span></div><p class="muted" aria-hidden="true">${esc(label)}</p>`;
    }
    let s = '';
    for (let i = 0; i < n; i++) s += `<i class="${i === pos ? 'now' : cls(i)}"></i>`;
    return `<div class="dots" role="img" aria-label="${esc(label)}">${s}<em aria-hidden="true">${pos + 1} of ${n}</em></div>`;
  }

  const PRAISE = ['Great job!', 'You got it!', 'Super!', 'Nice work!', 'Well done!'];

  // ---------- Practice: one question at a time ----------
  /**
   * cfg: { main, title, items, run: { pos, items: {} } (saved by the caller), save(), keyPrefix,
   *        prefill(q) (optional earlier answer), finishLabel, onFinish(summary) }
   * Each question: Check Answer → right ("Great job!") or wrong (a clue + Try Again);
   * after a second wrong answer the correct answer and explanation are shown. Never advances by itself.
   */
  function stepRunner(cfg) {
    const run = cfg.run;
    run.pos = Math.min(run.pos || 0, cfg.items.length - 1);
    run.items = run.items || {};
    const rec = (q) => run.items[q.id] || (run.items[q.id] = { tries: 0, first: null, final: null, response: undefined, done: false, retry: false });

    function summary() {
      const recs = cfg.items.map((q) => run.items[q.id] || {});
      return { total: cfg.items.length, firstRight: recs.filter((r) => r.first === true).length, finalRight: recs.filter((r) => r.final === true).length,
        first: recs.map((r) => r.first === true), final: recs.map((r) => r.final === true), responses: cfg.items.reduce((o, q) => { o[q.id] = (run.items[q.id] || {}).response; return o; }, {}) };
    }

    function draw() {
      const i = run.pos;
      const q = cfg.items[i];
      const r = rec(q);
      const last = i === cfg.items.length - 1;
      const dots = dotsHTML(cfg.items.length, i, (k) => { const x = run.items[cfg.items[k].id]; return x && x.done ? (x.first ? 'done' : 'missed') : ''; }, `Question ${i + 1} of ${cfg.items.length}`);
      let body;
      if (q.type === 'explain') {
        body = `<div class="q" data-qkey="${cfg.keyPrefix}-${q.id}"><p class="q-prompt"><span>${esc(q.childPrompt || q.prompt)}</span></p></div>`;
      } else {
        const response = r.response !== undefined ? r.response : (cfg.prefill ? cfg.prefill(q) : undefined);
        body = Q.render(q, `${cfg.keyPrefix}-${q.id}`, { response });
      }
      let msg = '';
      if (r.done && q.type === 'explain') msg = `<p class="msg msg-right">Great explaining!<small>${esc(q.explanation)}</small></p>`;
      else if (r.done && r.first) msg = `<p class="msg msg-right">${PRAISE[i % PRAISE.length]}<small>${esc(q.explanation)}</small></p>`;
      else if (r.done && r.final) msg = `<p class="msg msg-right">You got it this time!<small>${esc(q.explanation)}</small></p>`;
      else if (r.done) msg = `<p class="msg msg-reveal">The answer is ${esc(Q.correctText(q))}.<small>${esc(q.explanation)}</small></p>`;
      else if (r.retry) {
        const tip = q.type === 'expanded' ? Q.expandedTip(r.response, q.answer) + ' ' : '';
        msg = `<p class="msg msg-wrong">Not quite.<small>${esc(tip + (q.hint || 'Look carefully and try once more.'))}</small></p>`;
      }
      let mainBtn;
      if (r.done) mainBtn = `<button type="button" class="btn btn-main" data-act="next">${last ? esc(cfg.finishLabel || 'Finish') : 'Next →'}</button>`;
      else if (r.retry) mainBtn = `<button type="button" class="btn btn-try" data-act="again">Try Again</button>`;
      else if (q.type === 'explain') mainBtn = `<button type="button" class="btn btn-main" data-act="explained">I told a grown-up</button>`;
      else mainBtn = `<button type="button" class="btn btn-main" data-act="check">Check Answer</button>`;
      cfg.main.innerHTML = `<div class="activity-head"><h1>${esc(cfg.title)}</h1>${dots}</div>` +
        `<section class="qcard ${r.done ? (r.final || r.first ? 'is-right' : 'is-wrong') : r.retry ? 'is-wrong' : ''}" aria-labelledby="q-title">` +
        `<h2 class="sr-only" id="q-title">Question ${i + 1}</h2>${body}<div aria-live="polite">${msg}<p class="msg msg-info" data-empty hidden>Type or choose an answer first.</p></div></section>` +
        `<div class="controls">${i > 0 ? `<button type="button" class="btn btn-back" data-act="prev">← Previous</button>` : '<span class="spacer"></span>'}${mainBtn}</div>`;

      const qEl = cfg.main.querySelector('.q[data-qkey]');
      const lock = r.done || r.retry;
      if (qEl && q.type !== 'explain') {
        if (lock) qEl.querySelectorAll('input, select, button').forEach((c) => { c.disabled = true; });
        else Q.bind(qEl, q, (resp) => { r.response = resp; cfg.save(); });
      }
      cfg.main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'check') {
          const resp = Q.read(qEl, q);
          if (!Q.isAnswered(q, resp)) { cfg.main.querySelector('[data-empty]').hidden = false; return; }
          r.response = resp;
          r.tries += 1;
          const ok = Q.grade(q, resp);
          if (r.tries === 1) r.first = ok;
          if (ok || r.tries >= 2) { r.done = true; r.final = ok; r.retry = false; } else { r.retry = true; }
          cfg.save();
          draw();
          const m = cfg.main.querySelector('[data-act="next"], [data-act="again"]');
          if (m) m.focus();
        } else if (act === 'again') {
          r.retry = false;
          cfg.save();
          draw();
          const c = cfg.main.querySelector('.q input:not([type=radio]), .q select, .q input[type=radio], .q .stepper-btn');
          if (c) c.focus();
        } else if (act === 'explained') {
          Object.assign(r, { tries: 1, first: true, final: true, done: true });
          cfg.save();
          draw();
        } else if (act === 'prev') {
          run.pos = Math.max(0, i - 1);
          cfg.save();
          draw();
        } else if (act === 'next') {
          if (last) { cfg.onFinish(summary()); return; }
          run.pos = i + 1;
          cfg.save();
          draw();
          focusTitle(cfg.main);
        }
      }));
    }
    draw();
    return { summary };
  }

  // ---------- Tests: one question at a time, review, then submit ----------
  /**
   * cfg: { main, store, draftKey, draft, title, onSubmit(draft, correct[]), onExit() }
   * No hints and no feedback until the test is submitted. The review screen lists unanswered questions.
   */
  function testPager(cfg) {
    const D = cfg.draft;
    const n = D.questions.length;
    D.sessions = (D.sessions || 0) + 1; // > 1 means the test was paused and resumed
    D.pos = Math.min(D.pos || 0, n);
    const save = () => cfg.store.set(cfg.draftKey, D);
    save();
    const answered = (q) => Q.isAnswered(q, D.responses[q.id]);

    function draw() {
      if (D.pos >= n) return review();
      const i = D.pos;
      const q = D.questions[i];
      const dots = dotsHTML(n, i, (k) => (answered(D.questions[k]) ? 'done' : ''), `Question ${i + 1} of ${n}`);
      cfg.main.innerHTML = `<div class="activity-head"><h1>${esc(cfg.title)}</h1>${dots}</div>` +
        `<section class="qcard" aria-label="Question ${i + 1}">${Q.render(q, 't-' + q.id, { response: D.responses[q.id] })}</section>` +
        `<div class="controls">${i > 0 ? `<button type="button" class="btn btn-back" data-act="prev">← Previous</button>` : '<span class="spacer"></span>'}` +
        `<button type="button" class="btn btn-main" data-act="next">${i === n - 1 ? 'Review my answers →' : 'Next →'}</button></div>` +
        `<p style="text-align:center"><button type="button" class="btn btn-quiet" data-act="later">Save and finish later</button></p>`;
      const el = cfg.main.querySelector('.q[data-qkey]');
      Q.bind(el, q, (r) => { D.responses[q.id] = r; save(); });
      cfg.main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        D.responses[q.id] = Q.read(el, q);
        if (b.dataset.act === 'prev') D.pos = i - 1;
        if (b.dataset.act === 'next') D.pos = i + 1;
        save();
        if (b.dataset.act === 'later') return cfg.onExit();
        draw();
        focusTitle(cfg.main);
      }));
    }

    function review() {
      const missing = D.questions.map((q, i) => (answered(q) ? null : i + 1)).filter(Boolean);
      cfg.main.innerHTML = `<div class="activity-head"><h1>${esc(cfg.title)}</h1></div>` +
        `<section class="qcard"><h2 style="font-size:1.7rem">Check your test</h2>` +
        `<p class="say-big">You answered ${n - missing.length} of ${n} questions.</p>` +
        (missing.length
          ? `<p class="msg msg-wrong" role="status">${missing.length === 1 ? `Question ${missing[0]} still needs an answer.` : `Questions ${missing.join(', ')} still need answers.`}<small>Tap a number to go back to it.</small></p>`
          : `<p class="msg msg-info" role="status">Every question has an answer. You can tap a number to look again, or finish.</p>`) +
        `<div class="review-grid" role="group" aria-label="Questions">` +
        D.questions.map((q, i) => `<button type="button" data-go="${i}" class="${answered(q) ? 'answered' : 'missing'}" aria-label="Question ${i + 1}${answered(q) ? ', answered' : ', needs an answer'}">${i + 1}</button>`).join('') +
        `</div></section>` +
        `<div class="controls"><button type="button" class="btn btn-back" data-act="prev">← Previous</button>` +
        `<button type="button" class="btn btn-main" data-act="submit" ${missing.length ? 'disabled' : ''}>I'm done! Grade my test</button></div>` +
        `<p style="text-align:center"><button type="button" class="btn btn-quiet" data-act="later">Save and finish later</button></p>`;
      cfg.main.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { D.pos = Number(b.dataset.go); save(); draw(); focusTitle(cfg.main); }));
      cfg.main.querySelector('[data-act="prev"]').addEventListener('click', () => { D.pos = n - 1; save(); draw(); });
      cfg.main.querySelector('[data-act="later"]').addEventListener('click', () => cfg.onExit());
      cfg.main.querySelector('[data-act="submit"]').addEventListener('click', () => {
        if (D.questions.some((q) => !answered(q))) return; // guarded twice: button is disabled too
        const correct = D.questions.map((q) => Q.grade(q, D.responses[q.id]));
        cfg.store.remove(cfg.draftKey);
        cfg.onSubmit(D, correct);
      });
    }
    draw();
  }

  /** "Look at my mistakes" list for a finished test (child-friendly). */
  function mistakesHTML(questions, responses, correct) {
    const missed = questions.map((q, i) => ({ q, i })).filter((x) => !correct[x.i]);
    if (!missed.length) return '';
    return `<ol class="rq-list">` + missed.map(({ q, i }) => `<li class="rq"><p class="rq-prompt">Question ${i + 1}: ${esc(q.prompt.replace('___', '_____'))}</p>${Q.visuals(q)}` +
      `<p><b>Your answer:</b> ${esc(Q.describe(q, responses[q.id]))}</p><p><b>The answer:</b> ${esc(Q.correctText(q))}</p><p>${esc(q.explanation)}</p></li>`).join('') + `</ol>`;
  }

  function starsFor(pct) { return pct >= 90 ? 3 : pct >= 70 ? 2 : 1; }

  MB.shell = { LOGO, STARS, makeStore, recordActivity, readActivity, formatDate, newSeed, frame, router, focusTitle, dotsHTML, stepRunner, testPager, mistakesHTML, starsFor };
})(window);
