/*
 * Mathbook lesson engine: the five-stage lesson (Teach It, See It, Practice It, Test It, Results).
 * Reusable for every lesson: all teaching content comes from the lesson object (curriculum/.../lesson.js).
 * Progress is stored in this browser's localStorage only.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const esc = Q.esc;
  const { PLACES, fmt, digitsOf, fromDigits, expandedForm, numberToWords } = pv;

  const STAGES = [
    { id: 'teach', label: 'Teach It' },
    { id: 'see', label: 'See It' },
    { id: 'practice', label: 'Practice It' },
    { id: 'test', label: 'Test It' },
    { id: 'results', label: 'Results' }
  ];

  const SET_SIZE = 10;
  const SHORT = ['Th', 'H', 'T', 'O']; // column labels for compact charts

  // ---------- Storage (never throws; the lesson works without it) ----------

  function makeStore(prefix) {
    const key = (k) => `${prefix}:${k}`;
    return {
      get(k, fallback) {
        try {
          const v = root.localStorage.getItem(key(k));
          return v ? JSON.parse(v) : fallback;
        } catch (e) { return fallback; }
      },
      set(k, v) {
        try { root.localStorage.setItem(key(k), JSON.stringify(v)); return true; } catch (e) { return false; }
      },
      remove(k) {
        try { root.localStorage.removeItem(key(k)); } catch (e) { /* ignore */ }
      },
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

  function mastery(pct) {
    if (pct >= 90) return { key: 'mastered', label: 'Mastered', advice: 'Ready to move on to the next lesson.' };
    if (pct >= 70) return { key: 'review', label: 'Review missed skills', advice: 'Practice the skills listed below, then move on.' };
    return { key: 'reteach', label: 'Reteach and reassess', advice: 'Reteach the skills below with See It, practice them, and then take a new test. Every new test uses different numbers.' };
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  function plural(n, word) {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
  }

  // ---------- Shared pieces ----------

  /** Place-value chart. o.highlight: place index; o.values: array of booleans (show value row per place). */
  function chartHTML(n, o) {
    o = o || {};
    const d = o.digits || digitsOf(n);
    const showValues = o.values || [false, false, false, false];
    const anyValues = showValues.some(Boolean);
    return `<div class="pv-chart${o.small ? ' pv-chart-small' : ''}" role="table" aria-label="Place-value chart">` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="columnheader" class="pv-head place-${p.key}${o.highlight === i ? ' is-on' : ''}">` +
        (o.small ? `<span aria-hidden="true">${SHORT[i]}</span><span class="sr-only">${p.name}</span>` : p.name) + `</div>`).join('') + `</div>` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-digit place-${p.key}${o.highlight === i ? ' is-on' : ''}">${d[i]}</div>`).join('') + `</div>` +
      (anyValues ? `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-value place-${p.key}${o.highlight === i ? ' is-on' : ''}">${showValues[i] ? fmt(d[i] * p.value) : ''}</div>`).join('') + `</div>` : '') +
      `</div>`;
  }

  function formsHTML(n, o) {
    o = o || {};
    const exp = n === 0 ? '0' : expandedForm(n);
    return `<dl class="forms">` +
      `<div class="form-row"><dt>Standard form</dt><dd class="form-standard">${fmt(n)}</dd></div>` +
      `<div class="form-row"><dt>Expanded form</dt><dd>${o.expanded !== undefined ? o.expanded : exp}</dd></div>` +
      `<div class="form-row"><dt>Word form</dt><dd>${o.words !== undefined ? o.words : esc(numberToWords(n))}</dd></div>` +
      `</dl>`;
  }

  function stepperHTML(digits, prefix) {
    return `<div class="q-build">` + PLACES.map((p, i) =>
      `<div class="stepper place-${p.key}" data-place="${i}"><span class="stepper-name">${p.name}</span>` +
      `<button type="button" class="stepper-btn" data-step="-1" aria-label="Remove one ${p.blockName}">−</button>` +
      `<output class="stepper-count" id="${prefix}-${p.key}" aria-label="${p.name}">${digits[i]}</output>` +
      `<button type="button" class="stepper-btn" data-step="1" aria-label="Add one ${p.blockName}">+</button></div>`).join('') + `</div>`;
  }

  // ---------- App ----------

  function start(L, opts) {
    opts = opts || {};
    const mount = document.getElementById(opts.mount || 'mathbook');
    const store = makeStore(L.storageKey);
    const S = {
      stage: 'teach',
      see: { ex: 0, step: 0 },
      builder: digitsOf(L.seeIt.builderStart),
      guidedIndex: 0,
      guided: {},
      indep: store.get('practice', null),
      activeTest: null,
      view: null,
      scrollTo: null
    };

    document.title = `Lesson ${L.number}: ${L.title} · Mathbook`;
    mount.innerHTML =
      `<a class="skip" href="#stage">Skip to lesson</a>` +
      `<header class="topbar"><div class="topbar-in">` +
      `<a class="brand" href="${esc(opts.homeHref || './')}"><span class="brand-mark" aria-hidden="true">M</span>Mathbook</a>` +
      `<span class="crumbs">Chapter ${L.chapter} · ${esc(L.chapterTitle)}</span>` +
      `<span class="lesson-pill">Lesson ${esc(L.number)}</span></div></header>` +
      `<nav class="stagebar" aria-label="Lesson steps"><ol>` + STAGES.map((s, i) =>
        `<li><a class="stage-link" href="#${s.id}" data-stage="${s.id}"><span class="stage-n">${i + 1}</span><span class="stage-t">${s.label}</span></a></li>`).join('') +
      `</ol></nav>` +
      `<main id="stage" class="stage" tabindex="-1"></main>` +
      `<footer class="footer"><p>Mathbook · Original lesson content · Progress is saved in this browser only.</p></footer>`;
    const main = mount.querySelector('#stage');

    function go(stage, scrollTo) {
      S.scrollTo = scrollTo || null;
      if (location.hash === '#' + stage) render();
      else location.hash = stage;
    }

    function stageFromHash() {
      const h = location.hash.replace('#', '');
      return STAGES.some((s) => s.id === h) ? h : 'teach';
    }

    function navButtons(stage) {
      const i = STAGES.findIndex((s) => s.id === stage);
      const prev = STAGES[i - 1];
      const next = STAGES[i + 1];
      return `<div class="stage-nav">` +
        (prev ? `<a class="btn btn-ghost" href="#${prev.id}">← ${prev.label}</a>` : '<span></span>') +
        (next ? `<a class="btn btn-primary" href="#${next.id}">Next: ${next.label} →</a>` : '') + `</div>`;
    }

    function hero(eyebrow, title, lead) {
      return `<section class="hero"><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</section>`;
    }

    function render() {
      S.stage = stageFromHash();
      mount.querySelectorAll('.stage-link').forEach((a) => {
        if (a.dataset.stage === S.stage) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
      const views = { teach: teachView, see: seeView, practice: practiceView, test: testView, results: resultsView };
      views[S.stage]();
      if (S.scrollTo) {
        const t = main.querySelector('#' + S.scrollTo);
        if (t) t.scrollIntoView({ block: 'start' });
        S.scrollTo = null;
      } else {
        root.scrollTo(0, 0);
        const h1 = main.querySelector('h1');
        if (h1) h1.focus({ preventScroll: true });
      }
    }

    // ===== 1. Teach It =====
    function teachView() {
      const vocab = L.vocabulary.map((v) =>
        `<div class="vocab-card"><h3>${esc(v.term)}</h3><p>${esc(v.meaning)}.</p>` +
        (v.chart ? chartHTML(v.chart, { small: true }) + `<p class="q-help">Th = thousands, H = hundreds, T = tens, O = ones</p>` : `<p class="vocab-example">${esc(v.example)}</p>`) + `</div>`).join('');
      const placeWords = L.placeWords.slice().reverse().map((w) =>
        `<div class="place-card place-${w.term}"><div class="place-art">${pv.singleBlockSVG(w.block)}</div>` +
        `<h3>${esc(w.term)}</h3><p class="place-block">Block: <b>${esc(w.blockWord)}</b></p><p>${esc(w.meaning)}</p></div>`).join('');
      const guide = L.parentGuide.map((g, i) =>
        `<div class="guide-card"><h3><span class="guide-n">${i + 1}</span>${esc(g.q)}</h3><ul>${g.a.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`).join('');
      const script = L.script.map((s) =>
        `<li class="script-step"><dl>` +
        `<div><dt class="tag tag-show">Show</dt><dd>${esc(s.show)}</dd></div>` +
        `<div><dt class="tag tag-say">Say</dt><dd>${esc(s.say)}</dd></div>` +
        `<div><dt class="tag tag-ask">Ask</dt><dd>${esc(s.ask)} <span class="listen">Listen for: ${esc(s.listen)}</span></dd></div>` +
        `</dl></li>`).join('');

      main.innerHTML =
        hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · Teach It`, esc(L.title), esc(L.subtitle)) +
        `<div class="grid-2">` +
        `<section class="card card-target"><h2>Learning target</h2><p class="objective">${esc(L.objective)}</p>` +
        `<ul class="checks">${L.targets.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></section>` +
        `<section class="card"><h2>The big idea</h2>${L.intro.map((p) => `<p>${esc(p)}</p>`).join('')}` +
        chartHTML(L.introNumber, { highlight: 0, values: [true, true, true, true] }) + `</section>` +
        `</div>` +
        `<section class="card" id="vocabulary"><h2>Vocabulary</h2><p class="muted">Read each word together. Have your student point to an example.</p>` +
        `<div class="vocab-grid">${vocab}</div>` +
        `<h3 class="sub">Places and base-ten blocks</h3><div class="place-grid">${placeWords}</div></section>` +
        `<section class="card card-parent" id="parent-guide"><p class="badge">For the parent</p><h2>Parent guide</h2>` +
        `<div class="guide-grid">${guide}</div></section>` +
        `<section class="card card-parent" id="script"><p class="badge">For the parent</p><h2>Teaching script</h2>` +
        `<p class="muted">About 10 minutes. Follow the steps in order.</p><ol class="script">${script}</ol>` +
        `<div class="callout callout-warn"><h3>Watch for these mistakes</h3><ul>${L.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></section>` +
        navButtons('teach');
    }

    // ===== 2. See It =====
    function demoSteps(n) {
      const d = digitsOf(n);
      const steps = [{
        say: `Here is ${fmt(n)}. It has four digits. Each digit is in a place.`,
        ask: 'Ask: "Which digit do you think is worth the most? Why?"',
        dim: [0, 1, 2, 3], highlight: null, values: 0
      }];
      PLACES.forEach((p, i) => {
        const v = d[i] * p.value;
        steps.push(d[i]
          ? {
            say: `The ${d[i]} is in the ${p.key} place. ${d[i]} ${d[i] === 1 ? p.one : p.key} = ${fmt(v)}. Show ${plural(d[i], p.blockName)}.`,
            ask: `Ask: "What is the ${d[i]} worth?" (${fmt(v)})`,
            dim: [0, 1, 2, 3].filter((x) => x > i), highlight: i, values: i + 1
          }
          : {
            say: `The 0 is in the ${p.key} place. There are no ${p.key}, so there are no ${p.blockName}s. The 0 holds the place.`,
            ask: 'Ask: "Why do we still write the 0?" (It keeps the other digits in their places.)',
            dim: [0, 1, 2, 3].filter((x) => x > i), highlight: i, values: i + 1
          });
      });
      steps.push({
        say: 'Add the values of the digits. This is expanded form.',
        ask: `Ask: "Does ${expandedForm(n)} make ${fmt(n)}?"`, dim: [], highlight: null, values: 4, total: true
      });
      steps.push({
        say: 'Read the thousands and say "thousand." Then read the rest. This is word form.',
        ask: `Ask: "Read ${fmt(n)} aloud with me."`, dim: [], highlight: null, values: 4, total: true, words: true
      });
      return steps;
    }

    function demoBody(n, k) {
      const steps = demoSteps(n);
      const s = steps[k];
      const d = digitsOf(n);
      const shown = d.map((x, i) => x * PLACES[i].value).filter((v, i) => i < s.values && v > 0).map(fmt);
      let expanded = shown.length ? shown.join(' + ') : '…';
      if (s.values < 4) expanded += shown.length ? ' + …' : '';
      if (s.total) expanded = `${expandedForm(n)} = ${fmt(n)}`;
      return `<div class="demo-note"><p class="demo-say">${esc(s.say)}</p><p class="demo-ask">${esc(s.ask)}</p></div>` +
        chartHTML(n, { highlight: s.highlight, values: [0, 1, 2, 3].map((i) => i < s.values) }) +
        pv.blocksHTML(n, { dim: s.dim }) +
        formsHTML(n, { expanded: esc(expanded), words: s.words ? esc(numberToWords(n)) : '<span class="muted">(last step)</span>' });
    }

    function seeView() {
      const ex = L.seeIt.examples;
      const tenChain = [3, 2, 1, 0].map((i, j) =>
        `<div class="chain-item"><div class="chain-art">${pv.singleBlockSVG(i)}</div><b>${fmt(PLACES[i].value)}</b><span>${PLACES[i].blockName}</span></div>` +
        (j < 3 ? `<div class="chain-arrow" aria-hidden="true">×10 →</div>` : '')).join('');

      main.innerHTML =
        hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · See It`, 'See It: Build 4-Digit Numbers',
          'Step through each example one place at a time. Then build your own number.') +
        `<section class="card" id="demo"><div class="section-head"><h2>Worked examples</h2>` +
        `<div class="seg" role="group" aria-label="Choose an example">` +
        ex.map((n, i) => `<button type="button" class="seg-btn" data-ex="${i}" aria-pressed="${i === S.see.ex}">${fmt(n)}</button>`).join('') +
        `</div></div><div id="demo-body" class="demo-body"></div>` +
        `<div class="demo-controls"><button type="button" class="btn btn-ghost" id="demo-prev">← Back</button>` +
        `<span class="step-count" id="demo-count" aria-live="polite"></span>` +
        `<button type="button" class="btn btn-primary" id="demo-next">Next step →</button></div></section>` +
        `<section class="card" id="builder"><div class="section-head"><h2>Build your own number</h2></div>` +
        `<p class="muted">Add or remove blocks, or type a number. Everything updates together.</p>` +
        `<div class="builder-top">${stepperHTML(S.builder, 'bld')}` +
        `<label class="builder-type">Type a number <input id="bld-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" aria-describedby="bld-note"></label></div>` +
        `<p class="q-help" id="bld-note">Any whole number from 0 to 9,999.</p>` +
        `<div id="bld-out" aria-live="polite"></div></section>` +
        `<section class="card" id="why"><h2>Why it works: groups of ten</h2>` +
        `<div class="chain">${tenChain}</div>` +
        `<p>10 units make 1 rod. 10 rods make 1 flat. 10 flats make 1 cube. That is why each place is worth 10 times the place to its right.</p></section>` +
        navButtons('see');

      const body = main.querySelector('#demo-body');
      const drawDemo = () => {
        const n = ex[S.see.ex];
        const total = demoSteps(n).length;
        body.innerHTML = demoBody(n, S.see.step);
        main.querySelector('#demo-count').textContent = `Step ${S.see.step + 1} of ${total}`;
        main.querySelector('#demo-prev').disabled = S.see.step === 0;
        main.querySelector('#demo-next').disabled = S.see.step === total - 1;
        main.querySelectorAll('.seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.ex) === S.see.ex)));
      };
      main.querySelectorAll('.seg-btn').forEach((b) => b.addEventListener('click', () => {
        S.see = { ex: Number(b.dataset.ex), step: 0 };
        drawDemo();
      }));
      main.querySelector('#demo-prev').addEventListener('click', () => { S.see.step = Math.max(0, S.see.step - 1); drawDemo(); });
      main.querySelector('#demo-next').addEventListener('click', () => { S.see.step += 1; drawDemo(); });
      drawDemo();

      const out = main.querySelector('#bld-out');
      const input = main.querySelector('#bld-input');
      const drawBuilder = (fromInput) => {
        const n = fromDigits(S.builder);
        main.querySelectorAll('#builder .stepper-count').forEach((o, i) => { o.textContent = S.builder[i]; });
        if (!fromInput) input.value = fmt(n);
        out.innerHTML = `<p class="big-number" aria-label="Number built: ${fmt(n)}">${fmt(n)}</p>` +
          chartHTML(n, { values: [true, true, true, true] }) + pv.blocksHTML(n) + formsHTML(n);
      };
      main.querySelectorAll('#builder .stepper-btn').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.parentElement.dataset.place);
        S.builder[i] = Math.min(9, Math.max(0, S.builder[i] + Number(b.dataset.step)));
        drawBuilder(false);
      }));
      input.addEventListener('input', () => {
        const n = pv.parseWholeNumber(input.value);
        if (n !== null && n <= 9999) {
          S.builder = digitsOf(n);
          drawBuilder(true);
        }
      });
      drawBuilder(false);
    }

    // ===== 3. Practice It =====
    function practiceView() {
      const skillCounts = {};
      L.bank.forEach((q) => { skillCounts[q.skill] = (skillCounts[q.skill] || 0) + 1; });
      const skill = S.indep ? S.indep.skill : 'all';

      main.innerHTML =
        hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · Practice It`, 'Practice It', 'First practice together. Then your student works alone.') +
        `<section class="card" id="guided"><div class="section-head"><h2>Guided practice</h2><span class="pill pill-together">Together</span></div>` +
        `<p class="muted">Solve these together. Use hints, check answers, fix mistakes, and talk about why.</p>` +
        `<div class="dots" role="group" aria-label="Guided problems">` +
        L.guided.map((g, i) => `<button type="button" class="dot" data-g="${i}" aria-label="Problem ${i + 1}">${i + 1}</button>`).join('') + `</div>` +
        `<div id="guided-card"></div></section>` +
        `<section class="card" id="independent"><div class="section-head"><h2>Independent practice</h2><span class="pill pill-alone">On your own</span></div>` +
        `<p class="muted">The practice bank has ${L.bank.length} questions. Each set picks ${SET_SIZE}. Your student answers every question, then checks the work. No hints until then.</p>` +
        `<div class="indep-controls"><label>Skill <select id="skill-filter">` +
        `<option value="all">All skills (${L.bank.length})</option>` +
        Object.keys(skillCounts).map((k) => `<option value="${k}"${k === skill ? ' selected' : ''}>${esc(L.skills[k])} (${skillCounts[k]})</option>`).join('') +
        `</select></label><button type="button" class="btn btn-primary" id="new-set">Start a new set</button></div>` +
        `<div id="indep"></div></section>` +
        navButtons('practice');

      drawGuided();
      main.querySelector('#new-set').addEventListener('click', () => newSet(main.querySelector('#skill-filter').value));
      drawIndep();
    }

    function drawGuided() {
      const box = main.querySelector('#guided-card');
      const i = S.guidedIndex;
      const q = L.guided[i];
      const st = S.guided[q.id] || (S.guided[q.id] = { response: undefined, result: null, hint: false, reveal: false, tries: 0 });
      main.querySelectorAll('.dot').forEach((d) => {
        const qq = L.guided[Number(d.dataset.g)];
        const s = S.guided[qq.id];
        d.classList.toggle('is-on', Number(d.dataset.g) === i);
        d.classList.toggle('is-done', !!(s && s.result === true));
        if (Number(d.dataset.g) === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });

      let inner;
      if (q.type === 'explain') {
        inner = `<div class="q"><p class="q-prompt"><span class="q-num" aria-hidden="true">${i + 1}</span><span>${esc(q.prompt)}</span></p></div>` +
          `<div class="listen-box"><b>Listen for:</b><ul>${q.listenFor.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="explained">They explained it</button>` +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show the explanation</button></div>`;
      } else {
        inner = Q.render(q, 'g-' + q.id, { number: i + 1, response: st.response }) +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="check">Check answer</button>` +
          `<button type="button" class="btn btn-ghost" data-act="hint">Show a hint</button>` +
          `<button type="button" class="btn btn-ghost" data-act="reveal">Show answer and why</button></div>`;
      }
      box.innerHTML = `<div class="parent-tip"><b>Parent:</b> ${esc(q.parent)}</div>` + inner +
        `<div class="hint-box" ${st.hint && q.hint ? '' : 'hidden'}><b>Hint:</b> ${esc(q.hint || '')}</div>` +
        `<div class="result-box" aria-live="polite"></div>` +
        `<div class="stage-nav stage-nav-inner"><button type="button" class="btn btn-ghost" data-act="prev" ${i === 0 ? 'disabled' : ''}>← Previous</button>` +
        `<button type="button" class="btn btn-primary" data-act="next">${i === L.guided.length - 1 ? 'Go to independent practice ↓' : 'Next problem →'}</button></div>`;

      const resultBox = box.querySelector('.result-box');
      const showResult = () => {
        if (st.reveal) {
          const ans = q.type === 'explain' ? '' : `<p><b>Answer:</b> ${esc(Q.correctText(q))}</p>`;
          resultBox.innerHTML = `<div class="feedback feedback-info">${ans}<p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === true) {
          resultBox.innerHTML = `<div class="feedback feedback-ok"><p><b>✓ Correct!</b> ${esc(q.explanation)}</p></div>`;
        } else if (st.result === false) {
          const tip = q.type === 'expanded' ? Q.expandedTip(st.response, q.answer) + ' ' : '';
          resultBox.innerHTML = `<div class="feedback feedback-no"><p><b>Not yet.</b> ${esc(tip)}${q.hint ? 'Hint: ' + esc(q.hint) : ''} Fix it and check again.</p></div>`;
        } else if (st.result === 'empty') {
          resultBox.innerHTML = `<div class="feedback feedback-info"><p>Write an answer first.</p></div>`;
        } else {
          resultBox.innerHTML = '';
        }
      };
      showResult();

      const qEl = box.querySelector('.q[data-qkey]');
      if (qEl) Q.bind(qEl, q, (r) => { st.response = r; });

      box.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'check') {
          st.response = Q.read(qEl, q);
          if (!Q.isAnswered(q, st.response)) st.result = 'empty';
          else { st.result = Q.grade(q, st.response); st.tries += 1; }
          st.reveal = false;
          showResult();
        } else if (act === 'hint') {
          st.hint = true;
          box.querySelector('.hint-box').hidden = false;
        } else if (act === 'reveal') {
          st.reveal = true;
          showResult();
        } else if (act === 'explained') {
          st.result = true;
          st.reveal = false;
          resultBox.innerHTML = `<div class="feedback feedback-ok"><p><b>✓ Great explaining!</b> ${esc(q.explanation)}</p></div>`;
          drawDotsOnly();
        } else if (act === 'prev') {
          S.guidedIndex = Math.max(0, i - 1);
          drawGuided();
        } else if (act === 'next') {
          if (i < L.guided.length - 1) { S.guidedIndex = i + 1; drawGuided(); }
          else main.querySelector('#independent').scrollIntoView({ block: 'start' });
        }
        if (act === 'check') drawDotsOnly();
      }));

      main.querySelectorAll('.dot').forEach((d) => { d.onclick = () => { S.guidedIndex = Number(d.dataset.g); drawGuided(); }; });
    }

    function drawDotsOnly() {
      main.querySelectorAll('.dot').forEach((d) => {
        const s = S.guided[L.guided[Number(d.dataset.g)].id];
        d.classList.toggle('is-done', !!(s && s.result === true));
      });
    }

    /** A fresh set of practice questions, avoiding the previous set's questions when the pool allows. */
    function makeSet(skill) {
      const pool = L.bank.filter((q) => skill === 'all' || q.skill === skill);
      const last = new Set(S.indep ? S.indep.ids : []);
      const r = pv.rng((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);
      const ordered = pv.shuffle(r, pool).sort((a, b) => Number(last.has(a.id)) - Number(last.has(b.id)));
      S.indep = { skill, ids: ordered.slice(0, SET_SIZE).map((q) => q.id), responses: {}, checked: false };
      store.set('practice', S.indep);
    }

    function newSet(skill) {
      makeSet(skill);
      drawIndep();
      const first = main.querySelector('#indep .q input, #indep .q select, #indep .q button');
      if (first) first.focus();
    }

    function drawIndep() {
      const box = main.querySelector('#indep');
      if (!S.indep || !S.indep.ids.length) {
        box.innerHTML = `<p class="empty">Choose a skill (or all skills) and press <b>Start a new set</b>.</p>`;
        return;
      }
      const qs = S.indep.ids.map((id) => L.bank.find((q) => q.id === id)).filter(Boolean);
      const checked = S.indep.checked;
      let score = '';
      if (checked) {
        const right = qs.filter((q) => Q.grade(q, S.indep.responses[q.id])).length;
        score = `<div class="set-score" role="status"><b>${right} of ${qs.length} correct.</b> Read the explanations together for any ✗, then start a new set.</div>`;
      }
      box.innerHTML = score + `<ol class="q-list">` + qs.map((q, i) => {
        const r = S.indep.responses[q.id];
        let fb = '';
        if (checked) {
          const ok = Q.grade(q, r);
          fb = ok
            ? `<div class="feedback feedback-ok"><p><b>✓ Correct.</b> ${esc(q.explanation)}</p></div>`
            : `<div class="feedback feedback-no"><p><b>✗ Your answer:</b> ${esc(Q.describe(q, r))}</p><p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p><p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        }
        return `<li class="q-item${checked ? ' is-checked' : ''}">${Q.render(q, 'p-' + q.id, { number: i + 1, response: r })}${fb}</li>`;
      }).join('') + `</ol>` +
        `<div class="error-box" role="alert" hidden></div>` +
        (checked ? '' : `<div class="actions"><button type="button" class="btn btn-primary" id="check-set">Check my work</button></div>`);

      box.querySelectorAll('.q[data-qkey]').forEach((el, i) => {
        const q = qs[i];
        if (checked) {
          el.querySelectorAll('input, select, button').forEach((c) => { c.disabled = true; });
          return;
        }
        Q.bind(el, q, (r) => { S.indep.responses[q.id] = r; store.set('practice', S.indep); });
      });
      const btn = box.querySelector('#check-set');
      if (btn) btn.addEventListener('click', () => {
        box.querySelectorAll('.q[data-qkey]').forEach((el, i) => { S.indep.responses[qs[i].id] = Q.read(el, qs[i]); });
        const missing = qs.map((q, i) => (Q.isAnswered(q, S.indep.responses[q.id]) ? null : i + 1)).filter(Boolean);
        const err = box.querySelector('.error-box');
        if (missing.length) {
          err.hidden = false;
          err.textContent = `Answer every question first. Still needed: ${missing.join(', ')}.`;
          focusQuestion(box, missing[0] - 1);
          return;
        }
        S.indep.checked = true;
        store.set('practice', S.indep);
        drawIndep();
        box.scrollIntoView({ block: 'start' });
      });
    }

    function focusQuestion(container, index) {
      const el = container.querySelectorAll('.q[data-qkey]')[index];
      if (!el) return;
      el.scrollIntoView({ block: 'center' });
      const c = el.querySelector('input, select, button');
      if (c) c.focus({ preventScroll: true });
    }

    // ===== 4. Test It =====
    function testView() {
      if (S.activeTest) return drawTestRunner();
      const attempts = store.get('attempts', []);
      const cards = Object.keys(L.tests).map((id) => {
        const t = L.tests[id];
        const mine = attempts.filter((a) => a.testId === id);
        const last = mine[mine.length - 1];
        const draft = store.get('draft-' + id, null);
        const status = last
          ? `<p class="test-last">Last score: <b>${last.score}/${last.total} (${last.pct}%)</b> <span class="badge-m m-${mastery(last.pct).key}">${mastery(last.pct).label}</span></p>`
          : '<p class="test-last muted">Not taken yet.</p>';
        return `<div class="card test-card"><h2>${esc(t.title)}</h2><p>${esc(t.blurb)}</p>` +
          `<p class="test-meta">10 questions · about 10–15 minutes · ${plural(mine.length, 'attempt')} so far</p>${status}` +
          `<button type="button" class="btn btn-primary" data-start="${id}">${draft ? 'Resume test' : mine.length ? 'Take a new test' : 'Start test'}</button></div>`;
      }).join('');

      main.innerHTML =
        hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · Test It`, 'Test It', 'Two short tests. Take the Vocabulary Test first, then the Math Test.') +
        `<section class="card card-parent"><p class="badge">For the parent</p><h2>Before you start</h2><ul class="rules">` +
        `<li>Each test has 10 questions. Every question must be answered before submitting.</li>` +
        `<li>No hints and no answer feedback until the test is submitted.</li>` +
        `<li>You may read the directions aloud. Do not explain the math during the test.</li>` +
        `<li>Scratch paper is fine.</li>` +
        `<li>Every new attempt uses new numbers, so retakes test understanding, not memory.</li></ul></section>` +
        `<div class="test-grid">${cards}</div>` + navButtons('test');

      main.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => {
        beginTest(b.dataset.start);
        drawTestRunner();
        root.scrollTo(0, 0);
      }));
    }

    /** Resume the unfinished attempt, or generate a new one with new numbers. */
    function beginTest(id) {
      let draft = store.get('draft-' + id, null);
      if (!draft) {
        const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
        draft = { testId: id, seed, questions: L.tests[id].generate(seed), responses: {}, started: new Date().toISOString() };
        store.set('draft-' + id, draft);
      }
      S.activeTest = draft;
    }

    function drawTestRunner() {
      const D = S.activeTest;
      const t = L.tests[D.testId];
      const n = store.get('attempts', []).filter((a) => a.testId === D.testId).length + 1;
      main.innerHTML =
        hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · Test It`, esc(t.title), `Attempt ${n} · Answer all 10 questions, then press Submit.`) +
        `<section class="card test-run"><div class="test-progress"><span id="answered" aria-live="polite"></span>` +
        `<div class="bar" aria-hidden="true"><span id="bar-fill"></span></div></div>` +
        `<form id="test-form" novalidate><ol class="q-list">` +
        D.questions.map((q, i) => `<li class="q-item">${Q.render(q, 't-' + q.id, { number: i + 1, response: D.responses[q.id] })}</li>`).join('') +
        `</ol><div class="error-box" role="alert" hidden></div>` +
        `<div class="actions"><button type="submit" class="btn btn-primary btn-big">Submit test</button>` +
        `<button type="button" class="btn btn-ghost" id="save-exit">Save and finish later</button></div></form></section>`;

      const form = main.querySelector('#test-form');
      const els = Array.from(form.querySelectorAll('.q[data-qkey]'));
      const progress = () => {
        const done = D.questions.filter((q) => Q.isAnswered(q, D.responses[q.id])).length;
        main.querySelector('#answered').textContent = `${done} of ${D.questions.length} answered`;
        main.querySelector('#bar-fill').style.width = `${(done / D.questions.length) * 100}%`;
      };
      els.forEach((el, i) => Q.bind(el, D.questions[i], (r) => {
        D.responses[D.questions[i].id] = r;
        el.classList.remove('needs-answer');
        store.set('draft-' + D.testId, D);
        progress();
      }));
      progress();

      main.querySelector('#save-exit').addEventListener('click', () => {
        store.set('draft-' + D.testId, D);
        S.activeTest = null;
        testView();
        root.scrollTo(0, 0);
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        els.forEach((el, i) => { D.responses[D.questions[i].id] = Q.read(el, D.questions[i]); });
        const missing = D.questions.map((q, i) => (Q.isAnswered(q, D.responses[q.id]) ? null : i)).filter((x) => x !== null);
        const err = form.querySelector('.error-box');
        els.forEach((el, i) => el.classList.toggle('needs-answer', missing.includes(i)));
        if (missing.length) {
          err.hidden = false;
          err.textContent = `Please answer every question before submitting. Still needed: ${missing.map((i) => i + 1).join(', ')}.`;
          focusQuestion(form, missing[0]);
          return;
        }
        const correct = D.questions.map((q) => Q.grade(q, D.responses[q.id]));
        const score = correct.filter(Boolean).length;
        const attempt = {
          id: Date.now(), testId: D.testId, title: t.title, date: new Date().toISOString(), seed: D.seed,
          questions: D.questions, responses: D.responses, correct, score, total: D.questions.length,
          pct: Math.round((score / D.questions.length) * 100)
        };
        const all = store.get('attempts', []);
        all.push(attempt);
        const saved = store.set('attempts', all);
        store.remove('draft-' + D.testId);
        S.activeTest = null;
        S.view = attempt.id;
        S.unsaved = saved ? null : attempt;
        go('results');
      });
    }

    // ===== 5. Results =====
    function resultsView() {
      const attempts = store.get('attempts', []);
      if (S.unsaved && !attempts.some((a) => a.id === S.unsaved.id)) attempts.push(S.unsaved);
      const head = hero(`Chapter ${L.chapter} · Lesson ${esc(L.number)} · Results`, 'Results', 'Scores, mistakes to review, and what to do next.');
      const notice = `<section class="card card-notice" id="privacy"><h2>About saved progress</h2>` +
        `<p>Results are saved only in this browser on this device. They do <b>not</b> sync to other devices or browsers, and clearing browser data erases them. Mathbook does not ask for names or send results anywhere.</p>` +
        (store.works() ? '' : `<p class="warn-text">This browser is not allowing saved data right now (for example, a private window). Results will disappear when the page closes.</p>`) +
        (attempts.length ? `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Clear saved progress…</button></div>` : '') + `</section>`;

      if (!attempts.length) {
        main.innerHTML = head + `<section class="card"><h2>No test results yet</h2><p>Take the Vocabulary Test and the Math Test, and the results will appear here.</p>` +
          `<a class="btn btn-primary" href="#test">Go to Test It →</a></section>` + notice + navButtons('results');
        bindClear();
        return;
      }

      const selected = attempts.find((a) => a.id === S.view) || attempts[attempts.length - 1];
      const latest = Object.keys(L.tests).map((id) => {
        const mine = attempts.filter((a) => a.testId === id);
        const a = mine[mine.length - 1];
        const t = L.tests[id];
        if (!a) return `<div class="card sum-card"><h3>${esc(t.title)}</h3><p class="muted">Not taken yet.</p><a class="btn btn-ghost" href="#test">Take it</a></div>`;
        const m = mastery(a.pct);
        return `<div class="card sum-card m-${m.key}"><h3>${esc(t.title)}</h3><p class="sum-score">${a.score}/${a.total} <span>${a.pct}%</span></p>` +
          `<p><span class="badge-m m-${m.key}">${m.label}</span></p><button type="button" class="btn btn-ghost" data-view="${a.id}">See details</button></div>`;
      }).join('');

      const m = mastery(selected.pct);
      const qs = selected.questions;
      const missed = qs.map((q, i) => ({ q, i })).filter((x) => !selected.correct[x.i]);
      const right = qs.map((q, i) => ({ q, i })).filter((x) => selected.correct[x.i]);
      const skills = Array.from(new Set(missed.map((x) => x.q.skill)));
      const bankSkills = new Set(L.bank.map((q) => q.skill));
      const skillHTML = skills.length
        ? `<ul class="skill-list">` + skills.map((s) => {
          const action = bankSkills.has(s)
            ? `<button type="button" class="btn btn-small" data-practice="${s}">Practice this skill</button>`
            : `<button type="button" class="btn btn-small" data-vocab="1">Review vocabulary</button>`;
          return `<li><span>${esc(L.skills[s] || s)}</span>${action}</li>`;
        }).join('') + `</ul>`
        : '<p>No skills to review. Every question was correct.</p>';

      const qBlock = (x, ok) => {
        const q = x.q;
        const r = selected.responses[q.id];
        return `<li class="rq ${ok ? 'rq-ok' : 'rq-no'}"><p class="rq-prompt"><span class="rq-mark" aria-hidden="true">${ok ? '✓' : '✗'}</span>` +
          `<span><span class="sr-only">${ok ? 'Correct' : 'Incorrect'}. </span>Question ${x.i + 1}. ${esc(q.prompt.replace('___', '_____'))}</span></p>` +
          (ok ? '' : Q.visuals(q)) +
          (q.display && ok ? `<p class="rq-display">${esc(q.display)}</p>` : '') +
          `<p><b>Your answer:</b> ${esc(Q.describe(q, r))}</p>` +
          (ok ? '' : `<p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p><p><b>Why:</b> ${esc(q.explanation)}</p>`) + `</li>`;
      };

      const history = attempts.slice().reverse().map((a) => {
        const am = mastery(a.pct);
        return `<tr${a.id === selected.id ? ' class="is-on"' : ''}><td>${esc(formatDate(a.date))}</td><td>${esc(a.title)}</td><td>${a.score}/${a.total}</td><td>${a.pct}%</td>` +
          `<td><span class="badge-m m-${am.key}">${am.label}</span></td><td><button type="button" class="btn btn-small btn-ghost" data-view="${a.id}">View</button></td></tr>`;
      }).join('');

      main.innerHTML = head +
        `<div class="sum-grid">${latest}</div>` +
        `<section class="card result-detail" id="detail"><h2>${esc(selected.title)} <span class="muted">· ${esc(formatDate(selected.date))}</span></h2>` +
        `<div class="score-row"><p class="score-big">${selected.score}<span>/${selected.total}</span></p><p class="score-pct">${selected.pct}%</p>` +
        `<p class="badge-m badge-big m-${m.key}">${m.label}</p></div>` +
        `<p class="advice"><b>Next step:</b> ${esc(m.advice)}</p>` +
        `<p class="muted">Mastered: 90–100% · Review missed skills: 70–89% · Reteach and reassess: below 70%</p>` +
        `<h3>Skills to review</h3>${skillHTML}` +
        (missed.length ? `<h3>Mistakes to review (${missed.length})</h3><ol class="rq-list">${missed.map((x) => qBlock(x, false)).join('')}</ol>` : '') +
        (right.length ? `<details class="rq-right"><summary>Correct answers (${right.length})</summary><ol class="rq-list">${right.map((x) => qBlock(x, true)).join('')}</ol></details>` : '') +
        `<div class="actions"><button type="button" class="btn btn-primary" data-retake="${selected.testId}">Take a new ${esc(selected.title)}</button></div></section>` +
        `<section class="card"><h2>Attempt history</h2><div class="table-wrap"><table class="history"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>%</th><th>Result</th><th><span class="sr-only">View</span></th></tr></thead><tbody>${history}</tbody></table></div></section>` +
        notice + navButtons('results');

      main.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
        S.view = Number(b.dataset.view);
        resultsView();
        main.querySelector('#detail').scrollIntoView({ block: 'start' });
      }));
      main.querySelectorAll('[data-practice]').forEach((b) => b.addEventListener('click', () => {
        makeSet(b.dataset.practice);
        go('practice', 'independent');
      }));
      main.querySelectorAll('[data-vocab]').forEach((b) => b.addEventListener('click', () => go('teach', 'vocabulary')));
      main.querySelectorAll('[data-retake]').forEach((b) => b.addEventListener('click', () => {
        beginTest(b.dataset.retake);
        go('test');
      }));
      bindClear();
    }

    function bindClear() {
      const btn = main.querySelector('#clear');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const area = main.querySelector('#clear-area');
        area.innerHTML = `<div class="confirm" role="alert"><p><b>Delete all saved results, practice, and unfinished tests for this lesson on this device?</b> This cannot be undone.</p>` +
          `<button type="button" class="btn btn-danger" id="clear-yes">Yes, delete</button> <button type="button" class="btn btn-ghost" id="clear-no">Cancel</button></div>`;
        area.querySelector('#clear-yes').focus();
        area.querySelector('#clear-yes').addEventListener('click', () => {
          store.clearAll();
          S.indep = null;
          S.view = null;
          S.unsaved = null;
          resultsView();
        });
        area.querySelector('#clear-no').addEventListener('click', () => resultsView());
      });
    }

    root.addEventListener('hashchange', render);
    render();
  }

  MB.startLesson = function (id, opts) {
    const L = MB.lessons && MB.lessons[id];
    if (!L) throw new Error('Lesson not found: ' + id);
    start(L, opts);
  };
  MB._mastery = mastery;
})(window);
