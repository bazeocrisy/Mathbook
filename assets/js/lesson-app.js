/*
 * Mathbook lesson engine: the five-stage lesson (Teach It, See It, Practice It, Test It, Results).
 * Reusable for every lesson: all teaching content comes from the lesson object (curriculum/.../lesson.js);
 * navigation, guided practice, and the test runner come from the shared shell (app-shell.js).
 * Progress is stored in this browser's localStorage only.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const shell = MB.shell;
  const esc = Q.esc;
  const head = shell.sectionHead;
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

  function mastery(pct) {
    if (pct >= 90) return { key: 'mastered', label: 'Mastered', advice: 'Ready to move on to the next lesson.' };
    if (pct >= 70) return { key: 'review', label: 'Review missed skills', advice: 'Practice the skills listed below, then move on.' };
    return { key: 'reteach', label: 'Reteach and reassess', advice: 'Reteach the skills below with See It, practice them, and then take a new test. Every new test uses different numbers.' };
  }

  function plural(n, word) {
    return `${n} ${word}${n === 1 ? '' : 's'}`;
  }

  // ---------- Shared pieces ----------

  /** Place-value chart. o.highlight: place index; o.values: booleans (show value row per place). */
  function chartHTML(n, o) {
    o = o || {};
    const d = o.digits || digitsOf(n);
    const showValues = o.values || [false, false, false, false];
    const anyValues = showValues.some(Boolean);
    const on = (i) => (o.highlight === i || (o.highlightAll && o.highlightAll.includes(i)) ? ' is-on' : '');
    return `<div class="pv-chart${o.small ? ' pv-chart-small' : ''}" role="table" aria-label="${esc(o.label || 'Place-value chart')}">` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="columnheader" class="pv-head place-${p.key}${on(i)}">` +
        (o.small ? `<span aria-hidden="true">${SHORT[i]}</span><span class="sr-only">${p.name}</span>` : `<span aria-hidden="true">${p.label}</span><span class="sr-only">${p.name}</span>`) + `</div>`).join('') + `</div>` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-digit place-${p.key}${on(i)}">${d[i]}</div>`).join('') + `</div>` +
      (anyValues ? `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-value place-${p.key}${on(i)}">${showValues[i] ? fmt(d[i] * p.value) : ''}</div>`).join('') + `</div>` : '') +
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
      `<div class="stepper place-${p.key}" data-place="${i}"><span class="stepper-name">${p.label}</span>` +
      `<button type="button" class="stepper-btn" data-step="-1" aria-label="Remove one ${p.blockName}">−</button>` +
      `<output class="stepper-count" id="${prefix}-${p.key}" aria-label="${p.name}">${digits[i]}</output>` +
      `<button type="button" class="stepper-btn" data-step="1" aria-label="Add one ${p.blockName}">+</button></div>`).join('') + `</div>`;
  }

  // ---------- App ----------

  function start(L, opts) {
    opts = opts || {};
    const store = shell.makeStore(L.storageKey);
    const S = {
      see: { ex: 0, step: 0 },
      builder: digitsOf(L.seeIt.builderStart),
      change: L.seeIt.changeStart,
      guidedPos: { i: 0 },
      guidedStates: {},
      vocabPos: { i: 0 },
      vocabStates: {},
      vocabItems: L.vocabPractice(shell.newSeed()),
      bank: store.get('bank-sets', {}),
      openSet: store.get('bank-open', null),
      activeTest: null,
      pendingStart: null,
      view: null,
      unsaved: null
    };
    const eyebrow = (stage) => `Chapter ${L.chapter} · Lesson ${esc(L.number)} · Step ${STAGES.findIndex((s) => s.id === stage) + 1} of 5`;

    document.title = `Lesson ${L.number}: ${L.title} · Mathbook`;
    const ctx = shell.startShell({
      mount: opts.mount,
      homeHref: opts.homeHref || './',
      path: opts.path || '',
      crumbs: `Grade 3 · Chapter ${L.chapter}: ${L.chapterTitle}`,
      pill: `Lesson ${L.number}`,
      stages: STAGES,
      activityTitle: `Lesson ${L.number}: ${L.title}`,
      // Leaving the Test It stage (any way at all) closes the running test; its draft stays saved.
      beforeRender() { S.activeTest = null; },
      views: { teach: teachView, see: seeView, practice: practiceView, test: testView, results: resultsView }
    });
    const main = ctx.main;

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
        ctx.hero(eyebrow('teach'), esc(L.title), esc(L.subtitle), [
          { id: 'brief', label: 'A · Mission brief' }, { id: 'vocabulary', label: 'B · Vocabulary' },
          { id: 'parent-guide', label: 'C · Parent guide' }, { id: 'script', label: 'D · Teaching script' }]) +
        `<section class="card" id="brief">${head('A', 'Mission brief', 'student')}` +
        `<div class="grid-2"><div class="card-target" style="border-radius:16px;padding:1rem"><h3 style="margin-top:0">Learning target</h3><p class="objective">${esc(L.objective)}</p>` +
        `<ul class="checks">${L.targets.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` +
        `<div><div class="idea"><h3>Big idea 1: a digit's place tells its value</h3>${L.intro.map((p) => `<p>${esc(p)}</p>`).join('')}` +
        chartHTML(L.introNumber, { highlight: 0, values: [true, true, true, true] }) + `</div>` +
        `<div class="idea"><h3>Big idea 2: 10, 100, or 1,000 more or less</h3><p>${esc(L.changeIdea.text)}</p>` +
        L.changeIdea.examples.map((x) => `<p class="idea-math">${esc(x)}</p>`).join('') + `</div></div></div></section>` +
        `<section class="card" id="vocabulary">${head('B', 'Vocabulary', 'together')}` +
        `<p class="muted">Read each word together. Have your student point to the example and say it in their own words.</p>` +
        `<div class="vocab-grid">${vocab}</div>` +
        `<h3 class="sub">Places and base-ten blocks</h3><div class="place-grid">${placeWords}</div>` +
        `<p class="muted">Vocabulary practice with hints is in <a href="#practice">Practice It</a>, before the Vocabulary Test.</p></section>` +
        `<section class="card card-parent" id="parent-guide">${head('C', 'Parent guide', 'parent')}` +
        `<div class="guide-grid">${guide}</div></section>` +
        `<section class="card card-parent" id="script">${head('D', 'Teaching script', 'parent')}` +
        `<p class="muted">About 10–15 minutes. Follow the steps in order.</p><ol class="script">${script}</ol>` +
        `<div class="callout callout-warn"><h3>Watch for these mistakes</h3><ul>${L.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></section>` +
        ctx.navButtons('teach');
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
      steps.push({ say: 'Add the values of the digits. This is expanded form.', ask: `Ask: "Does ${expandedForm(n)} make ${fmt(n)}?"`, dim: [], highlight: null, values: 4, total: true });
      steps.push({ say: 'Read the thousands and say "thousand." Then read the rest. This is word form.', ask: `Ask: "Read ${fmt(n)} aloud with me."`, dim: [], highlight: null, values: 4, total: true, words: true });
      return steps;
    }

    function demoBody(n, k) {
      const s = demoSteps(n)[k];
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

    /** Which ±10/100/1,000 changes stay inside 1,000–9,999 without regrouping? */
    function changeOK(n, delta) {
      const i = PLACES.findIndex((p) => p.value === Math.abs(delta));
      const d = digitsOf(n)[i];
      return delta > 0 ? d <= 8 : d >= (i === 0 ? 2 : 1);
    }

    function seeView() {
      const ex = L.seeIt.examples;
      const tenChain = [3, 2, 1, 0].map((i, j) =>
        `<div class="chain-item"><div class="chain-art">${pv.singleBlockSVG(i)}</div><b>${fmt(PLACES[i].value)}</b><span>${PLACES[i].blockName}</span></div>` +
        (j < 3 ? `<div class="chain-arrow" aria-hidden="true">×10 →</div>` : '')).join('');
      const cd = L.seeIt.composeDigits;
      const greatest = fromDigits(cd.slice().sort((a, b) => b - a));
      const smallest = fromDigits(cd.slice().sort((a, b) => a - b));

      main.innerHTML =
        ctx.hero(eyebrow('see'), 'See It: Build 4-Digit Numbers', 'Step through each example one place at a time. Then build and change numbers yourself.', [
          { id: 'demo', label: 'A · Worked examples' }, { id: 'builder', label: 'B · Build a number' },
          { id: 'change', label: 'C · Change one place' }, { id: 'why', label: 'D · Groups of ten' }, { id: 'challenge', label: 'E · Biggest and smallest' }]) +
        `<section class="card" id="demo">${head('A', 'Worked examples', 'together',
          `<div class="seg" role="group" aria-label="Choose an example">` + ex.map((n, i) => `<button type="button" class="seg-btn" data-ex="${i}" aria-pressed="${i === S.see.ex}">${fmt(n)}</button>`).join('') + `</div>`)}` +
        `<div id="demo-body" class="demo-body"></div>` +
        `<div class="demo-controls"><button type="button" class="btn btn-ghost" id="demo-prev">← Back</button>` +
        `<span class="step-count" id="demo-count" aria-live="polite"></span>` +
        `<button type="button" class="btn btn-primary" id="demo-next">Next step →</button></div></section>` +
        `<section class="card" id="builder">${head('B', 'Build your own number', 'student')}` +
        `<p class="muted">Add or remove blocks, or type a number. Everything updates together.</p>` +
        `<div class="builder-top">${stepperHTML(S.builder, 'bld')}` +
        `<label class="builder-type">Type a number <input id="bld-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" aria-describedby="bld-note"></label></div>` +
        `<p class="q-help" id="bld-note">Any whole number from 0 to 9,999.</p>` +
        `<div id="bld-out" aria-live="polite"></div></section>` +
        `<section class="card" id="change">${head('C', 'Change one place: 10, 100, or 1,000 more or less', 'together')}` +
        `<p>Press a button. Watch which digit changes. <span class="muted">Buttons that would need regrouping are turned off — that comes in a later lesson.</span></p>` +
        `<div class="change-row" role="group" aria-label="Change the number">` +
        [1000, 100, 10].map((v) => `<button type="button" class="btn btn-ghost" data-delta="${v}">+ ${fmt(v)}</button>`).join('') +
        [1000, 100, 10].map((v) => `<button type="button" class="btn btn-ghost" data-delta="${-v}">− ${fmt(v)}</button>`).join('') +
        `<button type="button" class="btn btn-small" id="change-reset">Start again at ${fmt(L.seeIt.changeStart)}</button></div>` +
        `<div class="change-out" id="change-out" aria-live="polite"></div></section>` +
        `<section class="card" id="why">${head('D', 'Why it works: groups of ten', 'student')}` +
        `<div class="chain">${tenChain}</div>` +
        `<p>10 units make 1 rod. 10 rods make 1 flat. 10 flats make 1 cube. That is why each place is worth 10 times the place to its right.</p></section>` +
        `<section class="card" id="challenge">${head('E', 'Challenge: biggest and smallest numbers', 'together')}` +
        `<p>Use the digits <b>${cd.join(', ')}</b> once each.</p>` +
        `<div class="idea"><h3>Greatest number: ${fmt(greatest)}</h3><p>The thousands place is worth the most, so put the <b>greatest</b> digit there, then the next greatest in the hundreds place, and so on.</p>${chartHTML(greatest, { label: 'Greatest number' })}</div>` +
        `<div class="idea"><h3>Smallest number: ${fmt(smallest)}</h3><p>Put the <b>smallest</b> digit in the thousands place, then the next smallest, and so on.</p>${chartHTML(smallest, { label: 'Smallest number' })}</div></section>` +
        ctx.navButtons('see');

      // Worked examples
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
      main.querySelectorAll('.seg-btn').forEach((b) => b.addEventListener('click', () => { S.see = { ex: Number(b.dataset.ex), step: 0 }; drawDemo(); }));
      main.querySelector('#demo-prev').addEventListener('click', () => { S.see.step = Math.max(0, S.see.step - 1); drawDemo(); });
      main.querySelector('#demo-next').addEventListener('click', () => { S.see.step += 1; drawDemo(); });
      drawDemo();

      // Builder
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
        if (n !== null && n <= 9999) { S.builder = digitsOf(n); drawBuilder(true); }
      });
      drawBuilder(false);

      // Change one place
      const changeOut = main.querySelector('#change-out');
      const drawChange = (before, delta) => {
        const n = S.change;
        main.querySelectorAll('[data-delta]').forEach((b) => { b.disabled = !changeOK(n, Number(b.dataset.delta)); });
        if (before === undefined) {
          changeOut.innerHTML = `<p class="change-eq">${fmt(n)}</p>${chartHTML(n, { label: 'Current number' })}`;
          return;
        }
        const i = PLACES.findIndex((p) => p.value === Math.abs(delta));
        const p = PLACES[i];
        changeOut.innerHTML = `<p class="change-eq">${fmt(before)} ${delta > 0 ? '+' : '−'} ${fmt(Math.abs(delta))} = ${fmt(n)}</p>` +
          `<p><b>Only the ${p.key} digit changed:</b> ${digitsOf(before)[i]} became ${digitsOf(n)[i]}.</p>` +
          `<div class="change-charts"><div><h3>Before</h3>${chartHTML(before, { highlight: i, label: 'Before' })}</div><div><h3>After</h3>${chartHTML(n, { highlight: i, label: 'After' })}</div></div>`;
      };
      main.querySelectorAll('[data-delta]').forEach((b) => b.addEventListener('click', () => {
        const delta = Number(b.dataset.delta);
        if (!changeOK(S.change, delta)) return;
        const before = S.change;
        S.change += delta;
        drawChange(before, delta);
      }));
      main.querySelector('#change-reset').addEventListener('click', () => { S.change = L.seeIt.changeStart; drawChange(); });
      drawChange();
    }

    // ===== 3. Practice It =====
    function practiceView() {
      main.innerHTML =
        ctx.hero(eyebrow('practice'), 'Practice It', 'Warm up with vocabulary, solve problems together, then your student works alone.', [
          { id: 'vocab-practice', label: 'A · Vocabulary practice' }, { id: 'guided', label: 'B · Guided practice' }, { id: 'independent', label: 'C · Independent practice' }]) +
        `<section class="card" id="vocab-practice">${head('A', 'Vocabulary practice', 'together')}` +
        `<p class="muted">Ten vocabulary questions with hints. Check each answer, fix mistakes, and read the explanation. New numbers every round.</p>` +
        `<div id="vocab-runner"></div>` +
        `<div class="actions"><button type="button" class="btn btn-small" id="vocab-new">New vocabulary round</button></div></section>` +
        `<section class="card" id="guided">${head('B', 'Guided practice', 'together')}` +
        `<p class="muted">Solve these together. Use hints, check answers, fix mistakes, and talk about why.</p>` +
        `<div id="guided-runner"></div></section>` +
        `<section class="card" id="independent">${head('C', `Independent practice: ${L.bankSets.length} sets of ${SET_SIZE}`, 'student')}` +
        `<p class="muted">The ${L.bank.length} practice questions are in ${L.bankSets.length} sets, in teaching order. Choose any set. Your student answers every question, then checks the work. No hints until then.</p>` +
        `<div class="set-grid" id="set-grid"></div>` +
        `<div id="indep"></div></section>` +
        ctx.navButtons('practice');

      const vocabRunner = () => shell.guidedRunner(main.querySelector('#vocab-runner'), {
        items: S.vocabItems, states: S.vocabStates, pos: S.vocabPos, keyPrefix: 'vp',
        lastLabel: 'Go to guided practice ↓', onLast: () => main.querySelector('#guided').scrollIntoView({ block: 'start' })
      });
      vocabRunner();
      main.querySelector('#vocab-new').addEventListener('click', () => {
        S.vocabItems = L.vocabPractice(shell.newSeed());
        S.vocabStates = {};
        S.vocabPos.i = 0;
        vocabRunner();
      });
      shell.guidedRunner(main.querySelector('#guided-runner'), {
        items: L.guided, states: S.guidedStates, pos: S.guidedPos, keyPrefix: 'g',
        lastLabel: 'Go to independent practice ↓', onLast: () => main.querySelector('#independent').scrollIntoView({ block: 'start' })
      });
      drawSets();
    }

    // ----- Practice bank: five sets of 10 and "Practice My Misses" -----
    // Saved as 'bank-sets': { [setId]: { attempts: [], retries: [], active } } — attempts and retries are never edited after checking.
    const bankQ = (id) => L.bank.find((q) => q.id === id);
    const setOf = (id) => L.bankSets.find((s) => s.id === id);
    const setState = (id) => S.bank[id] || (S.bank[id] = { attempts: [], retries: [], active: null });
    const saveBank = () => { store.set('bank-sets', S.bank); store.set('bank-open', S.openSet); };

    /** Start a new attempt at a whole set, in a new random order (each question once). */
    function startSet(id) {
      const st = setState(id);
      st.active = { kind: 'set', order: pv.shuffle(pv.rng(shell.newSeed()), setOf(id).ids), responses: {}, checked: false, started: new Date().toISOString() };
      S.openSet = id;
      saveBank();
    }

    /** Retry only the questions missed in the checked attempt (or checked retry) — fresh, unanswered, no answers shown. */
    function startMisses(id) {
      const st = setState(id);
      const a = st.active;
      const missed = a.order.filter((qid) => !Q.grade(bankQ(qid), a.responses[qid]));
      st.active = { kind: 'retry', order: pv.shuffle(pv.rng(shell.newSeed()), missed), responses: {}, checked: false,
        parentId: a.kind === 'set' ? a.attemptId : a.parentId, started: new Date().toISOString() };
      saveBank();
    }

    /** Which original misses have since been answered correctly in a "Practice My Misses" retry. */
    function improvement(st, attempt) {
      const missed = attempt.order.filter((qid, i) => !attempt.correct[i]);
      const fixed = new Set();
      st.retries.filter((r) => r.parentId === attempt.id).forEach((r) => r.order.forEach((qid, i) => { if (r.correct[i]) fixed.add(qid); }));
      return { missed: missed.length, fixed: missed.filter((qid) => fixed.has(qid)).length };
    }

    function drawSets() {
      const grid = main.querySelector('#set-grid');
      grid.innerHTML = L.bankSets.map((set, n) => {
        const st = setState(set.id);
        const last = st.attempts[st.attempts.length - 1];
        const best = st.attempts.reduce((m, a) => Math.max(m, a.score), 0);
        const inProgress = st.active && !st.active.checked;
        const status = inProgress
          ? `<span class="badge-m m-review">In progress</span>`
          : last ? `<span class="badge-m m-mastered">Completed</span>` : `<span class="badge-m set-new">Not started</span>`;
        let scores = '';
        if (last) {
          const imp = improvement(st, last);
          scores = `<p class="set-scores">Last score <b>${last.score}/${last.total}</b> · Best <b>${best}/${last.total}</b>` +
            (imp.missed && st.retries.some((r) => r.parentId === last.id) ? ` · Misses fixed <b>${imp.fixed} of ${imp.missed}</b>` : '') + `</p>`;
        }
        const label = inProgress ? 'Continue' : last ? 'Practice this set again' : 'Start set';
        return `<div class="set-card${S.openSet === set.id ? ' is-open' : ''}"><p class="eyebrow-dark">Set ${n + 1}</p><h3>${esc(set.title)}</h3><p>${esc(set.blurb)}</p>` +
          `<p class="set-status">${status}</p>${scores}` +
          `<button type="button" class="btn ${inProgress ? 'btn-primary' : 'btn-ghost'}" data-open-set="${set.id}" aria-label="${label}: Set ${n + 1}, ${esc(set.title)}">${label}</button></div>`;
      }).join('');
      grid.querySelectorAll('[data-open-set]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.openSet;
        const st = setState(id);
        if (!st.active || st.active.checked) startSet(id); else { S.openSet = id; saveBank(); }
        drawSets();
        drawIndep();
        main.querySelector('#indep').scrollIntoView({ block: 'start' });
        const first = main.querySelector('#indep .q input, #indep .q select, #indep .q button');
        if (first) first.focus({ preventScroll: true });
      }));
      drawIndep();
    }

    function drawIndep() {
      const box = main.querySelector('#indep');
      const set = S.openSet && setOf(S.openSet);
      const st = set && setState(set.id);
      const A = st && st.active;
      if (!A) {
        box.innerHTML = `<p class="empty">Choose a set above to begin.</p>`;
        return;
      }
      const n = L.bankSets.indexOf(set) + 1;
      const qs = A.order.map(bankQ);
      const checked = A.checked;
      const isRetry = A.kind === 'retry';
      const parent = isRetry ? st.attempts.find((a) => a.id === A.parentId) : null;
      const attemptNo = isRetry ? null : (checked ? st.attempts.findIndex((a) => a.id === A.attemptId) + 1 : st.attempts.length + 1);
      let title = isRetry ? `Set ${n} · ${esc(set.title)} — Practice My Misses (${plural(qs.length, 'question')})` : `Set ${n} · ${esc(set.title)} — attempt ${attemptNo}`;
      let intro = isRetry
        ? `<p class="parent-tip"><b>On your own:</b> these are the questions missed before. Answer them again without help. Explanations appear after you check.</p>`
        : '';
      let score = '';
      if (checked) {
        const right = qs.filter((q) => Q.grade(q, A.responses[q.id])).length;
        if (isRetry && parent) {
          const imp = improvement(st, parent);
          score = `<div class="set-score" role="status"><b>Practice My Misses: ${right} of ${qs.length} now correct.</b> ` +
            `The original attempt stays ${parent.score}/${parent.total}. Misses fixed so far: ${imp.fixed} of ${imp.missed}.</div>`;
        } else {
          score = `<div class="set-score" role="status"><b>${right} of ${qs.length} correct.</b> ` +
            (right < qs.length ? 'Read the explanations together for any ✗, then press Practice My Misses.' : 'Every question correct!') + `</div>`;
        }
      }
      const missesLeft = checked ? qs.filter((q) => !Q.grade(q, A.responses[q.id])).length : 0;
      box.innerHTML = `<h3 class="set-title" tabindex="-1">${title}</h3>${intro}${score}<ol class="q-list">` + qs.map((q, i) => {
        const r = A.responses[q.id];
        let fb = '';
        if (checked) {
          fb = Q.grade(q, r)
            ? `<div class="feedback feedback-ok"><p><b>✓ Correct.</b> ${esc(q.explanation)}</p></div>`
            : `<div class="feedback feedback-no"><p><b>✗ Your answer:</b> ${esc(Q.describe(q, r))}</p><p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p><p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        }
        return `<li class="q-item${checked ? ' is-checked' : ''}">${Q.render(q, 'p-' + q.id, { number: i + 1, response: r })}${fb}</li>`;
      }).join('') + `</ol>` +
        `<div class="error-box" role="alert" hidden></div>` +
        `<div class="actions">` +
        (checked
          ? (missesLeft ? `<button type="button" class="btn btn-primary" id="practice-misses">Practice My Misses (${missesLeft})</button>` : '') +
            `<button type="button" class="btn ${missesLeft ? 'btn-ghost' : 'btn-primary'}" id="set-again">Practice this set again</button>` +
            `<button type="button" class="btn btn-ghost" id="choose-set">Choose another set ↑</button>`
          : `<button type="button" class="btn btn-primary" id="check-set">Check my work</button>`) +
        `</div>`;

      box.querySelectorAll('.q[data-qkey]').forEach((el, i) => {
        const q = qs[i];
        if (checked) { el.querySelectorAll('input, select, button').forEach((c) => { c.disabled = true; }); return; }
        Q.bind(el, q, (r) => { A.responses[q.id] = r; saveBank(); });
      });
      const focusTitle = () => { box.scrollIntoView({ block: 'start' }); box.querySelector('.set-title').focus({ preventScroll: true }); };
      const btn = box.querySelector('#check-set');
      if (btn) btn.addEventListener('click', () => {
        box.querySelectorAll('.q[data-qkey]').forEach((el, i) => { A.responses[qs[i].id] = Q.read(el, qs[i]); });
        const missing = qs.map((q, i) => (Q.isAnswered(q, A.responses[q.id]) ? null : i + 1)).filter(Boolean);
        const err = box.querySelector('.error-box');
        if (missing.length) {
          err.hidden = false;
          err.textContent = `Answer every question first. Still needed: ${missing.join(', ')}.`;
          const el = box.querySelectorAll('.q[data-qkey]')[missing[0] - 1];
          el.scrollIntoView({ block: 'center' });
          const c = el.querySelector('input, select, button');
          if (c) c.focus({ preventScroll: true });
          return;
        }
        const correct = qs.map((q) => Q.grade(q, A.responses[q.id]));
        const record = { id: Date.now(), date: new Date().toISOString(), order: A.order.slice(), responses: Object.assign({}, A.responses),
          correct, score: correct.filter(Boolean).length, total: qs.length };
        if (isRetry) { record.parentId = A.parentId; st.retries.push(record); A.retryId = record.id; } else { st.attempts.push(record); A.attemptId = record.id; }
        A.checked = true;
        saveBank();
        drawSets();
        focusTitle();
      });
      const pm = box.querySelector('#practice-misses');
      if (pm) pm.addEventListener('click', () => { startMisses(set.id); drawSets(); focusTitle(); });
      const again = box.querySelector('#set-again');
      if (again) again.addEventListener('click', () => { startSet(set.id); drawSets(); focusTitle(); });
      const choose = box.querySelector('#choose-set');
      if (choose) choose.addEventListener('click', () => main.querySelector('#set-grid').scrollIntoView({ block: 'start' }));
    }

    // ===== 4. Test It =====
    function testView() {
      if (S.pendingStart) { const id = S.pendingStart; S.pendingStart = null; beginTest(id); }
      if (S.activeTest) return runTest();
      const attempts = store.get('attempts', []);
      const cards = Object.keys(L.tests).map((id) => {
        const t = L.tests[id];
        const mine = attempts.filter((a) => a.testId === id);
        const last = mine[mine.length - 1];
        const draft = store.get('draft-' + id, null);
        const status = last
          ? `<p class="test-last">Last score: <b>${last.score}/${last.total} (${last.pct}%)</b> <span class="badge-m m-${mastery(last.pct).key}">${mastery(last.pct).label}</span></p>`
          : '<p class="test-last muted">Not taken yet.</p>';
        const resume = draft ? `<p class="test-last"><b>Unfinished:</b> ${Object.keys(draft.responses || {}).length} of ${draft.questions.length} answered so far.</p>` : '';
        return `<div class="card test-card"><h2>${esc(t.title)}</h2><p>${esc(t.blurb)}</p>` +
          `<p class="test-meta">10 questions · about 10–15 minutes · ${plural(mine.length, 'attempt')} so far</p>${status}${resume}` +
          `<button type="button" class="btn btn-primary" data-start="${id}">${draft ? 'Resume test' : mine.length ? 'Take a new test' : 'Start test'}</button></div>`;
      }).join('');

      main.innerHTML =
        ctx.hero(eyebrow('test'), 'Test It', 'Two short tests. Take the Vocabulary Test first, then the Math Test.') +
        `<section class="card card-parent">${head('', 'Before you start', 'parent')}<ul class="rules">` +
        `<li>Each test has 10 questions. Every question must be answered before submitting.</li>` +
        `<li>No hints and no answer feedback until the test is submitted.</li>` +
        `<li>During a test the lesson tabs are hidden. To stop early, press <b>Save and finish later</b>.</li>` +
        `<li>You may read the directions aloud. Do not explain the math during the test.</li>` +
        `<li>Every new attempt uses new numbers, so retakes test understanding, not memory.</li></ul></section>` +
        `<div class="test-grid">${cards}</div>` + ctx.navButtons('test');

      main.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => {
        beginTest(b.dataset.start);
        runTest();
        root.scrollTo(0, 0);
      }));
    }

    /** Resume the unfinished attempt, or generate a new one with new numbers. */
    function beginTest(id) {
      let draft = store.get('draft-' + id, null);
      if (!draft) {
        const seed = shell.newSeed();
        draft = { testId: id, seed, questions: L.tests[id].generate(seed), responses: {}, started: new Date().toISOString() };
        store.set('draft-' + id, draft);
      }
      S.activeTest = draft;
    }

    function runTest() {
      const D = S.activeTest;
      const t = L.tests[D.testId];
      shell.testRunner(ctx, {
        store, draftKey: 'draft-' + D.testId, draft: D, title: t.title, eyebrow: eyebrow('test'),
        attemptNumber: store.get('attempts', []).filter((a) => a.testId === D.testId).length + 1,
        onExit() { S.activeTest = null; testView(); root.scrollTo(0, 0); },
        onSubmit(draft, correct) {
          const score = correct.filter(Boolean).length;
          const attempt = {
            id: Date.now(), testId: draft.testId, title: t.title, date: new Date().toISOString(), seed: draft.seed,
            questions: draft.questions, responses: draft.responses, correct, score, total: draft.questions.length,
            pct: Math.round((score / draft.questions.length) * 100), pauses: Math.max(0, (draft.sessions || 1) - 1)
          };
          const all = store.get('attempts', []);
          all.push(attempt);
          S.unsaved = store.set('attempts', all) ? null : attempt;
          S.activeTest = null;
          S.view = attempt.id;
          ctx.go('results');
        }
      });
    }

    // ===== 5. Results =====
    function resultsView() {
      const attempts = store.get('attempts', []);
      if (S.unsaved && !attempts.some((a) => a.id === S.unsaved.id)) attempts.push(S.unsaved);
      const top = ctx.hero(eyebrow('results'), 'Results', 'Scores, mistakes to review, and what to do next.');
      const notice = `<section class="card card-notice" id="privacy">${head('', 'About saved progress', 'parent')}` +
        `<p>Results are saved only in this browser on this device. They do <b>not</b> sync to other devices or browsers, and clearing browser data erases them. Mathbook does not ask for names or send results anywhere.</p>` +
        (store.works() ? '' : `<p class="warn-text">This browser is not allowing saved data right now (for example, a private window). Results will disappear when the page closes.</p>`) +
        (attempts.length ? `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Clear saved progress for this lesson…</button></div>` : '') + `</section>`;

      if (!attempts.length) {
        main.innerHTML = top + `<section class="card"><h2>No test results yet</h2><p>Take the Vocabulary Test and the Math Test, and the results will appear here.</p>` +
          `<a class="btn btn-primary" href="#test">Go to Test It →</a></section>` + notice + ctx.navButtons('results');
        shell.bindClear(main, store, 'results, practice, and unfinished tests for this lesson', cleared);
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
            ? `<button type="button" class="btn btn-small" data-practice="${s}">Practice this skill (Set ${L.bankSets.indexOf(setOf(bestSetFor(s))) + 1})</button>`
            : `<button type="button" class="btn btn-small" data-vocab="1">Vocabulary practice</button>`;
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
        return `<tr${a.id === selected.id ? ' class="is-on"' : ''}><td>${esc(shell.formatDate(a.date))}</td><td>${esc(a.title)}</td><td>${a.score}/${a.total}</td><td>${a.pct}%</td>` +
          `<td><span class="badge-m m-${am.key}">${am.label}</span></td><td><button type="button" class="btn btn-small btn-ghost" data-view="${a.id}">View</button></td></tr>`;
      }).join('');

      main.innerHTML = top +
        `<div class="sum-grid">${latest}</div>` +
        `<section class="card result-detail" id="detail"><h2>${esc(selected.title)} <span class="muted">· ${esc(shell.formatDate(selected.date))}</span></h2>` +
        `<div class="score-row"><p class="score-big">${selected.score}<span>/${selected.total}</span></p><p class="score-pct">${selected.pct}%</p>` +
        `<p class="badge-m badge-big m-${m.key}">${m.label}</p></div>` +
        `<p class="advice"><b>Next step:</b> ${esc(m.advice)}</p>` +
        `<p class="muted">Mastered: 90–100% · Review missed skills: 70–89% · Reteach and reassess: below 70%` +
        (selected.pauses ? ` · This test was paused and resumed ${plural(selected.pauses, 'time')}.` : '') + `</p>` +
        `<h3>Skills to review</h3>${skillHTML}` +
        (missed.length ? `<h3>Mistakes to review (${missed.length})</h3><ol class="rq-list">${missed.map((x) => qBlock(x, false)).join('')}</ol>` : '') +
        (right.length ? `<details class="rq-right"><summary>Correct answers (${right.length})</summary><ol class="rq-list">${right.map((x) => qBlock(x, true)).join('')}</ol></details>` : '') +
        `<div class="actions"><button type="button" class="btn btn-primary" data-retake="${selected.testId}">Take a new ${esc(selected.title)}</button></div></section>` +
        `<section class="card">${head('', 'Attempt history', '')}<div class="table-wrap"><table class="history"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>%</th><th>Result</th><th><span class="sr-only">View</span></th></tr></thead><tbody>${history}</tbody></table></div></section>` +
        notice + ctx.navButtons('results');

      main.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
        S.view = Number(b.dataset.view);
        resultsView();
        main.querySelector('#detail').scrollIntoView({ block: 'start' });
      }));
      main.querySelectorAll('[data-practice]').forEach((b) => b.addEventListener('click', () => {
        const id = bestSetFor(b.dataset.practice);
        const st = setState(id);
        if (!st.active || st.active.checked) startSet(id); else { S.openSet = id; saveBank(); }
        ctx.go('practice', 'independent');
      }));
      main.querySelectorAll('[data-vocab]').forEach((b) => b.addEventListener('click', () => ctx.go('practice', 'vocab-practice')));
      main.querySelectorAll('[data-retake]').forEach((b) => b.addEventListener('click', () => {
        S.pendingStart = b.dataset.retake;
        ctx.go('test');
      }));
      shell.bindClear(main, store, 'results, practice, and unfinished tests for this lesson', cleared);
    }

    /** The set with the most practice questions for a skill (for "Practice this skill" on Results). */
    function bestSetFor(skill) {
      let best = L.bankSets[0];
      let most = -1;
      L.bankSets.forEach((set) => {
        const n = set.ids.filter((id) => bankQ(id).skill === skill).length;
        if (n > most) { most = n; best = set; }
      });
      return best.id;
    }

    function cleared() {
      S.bank = {};
      S.openSet = null;
      S.view = null;
      S.unsaved = null;
      resultsView();
    }

    ctx.render();
  }

  MB.startLesson = function (id, opts) {
    const L = MB.lessons && MB.lessons[id];
    if (!L) throw new Error('Lesson not found: ' + id);
    start(L, opts);
  };
  MB._mastery = mastery;
})(window);
