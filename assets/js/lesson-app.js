/*
 * Mathbook lesson engine: a lesson menu that opens Learn, Practice, Take a Test, My Results, and the Parent Guide.
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

  // The first stage is the lesson menu; there is no stage bar. Old bookmarks (#teach, #see, #practice,
  // #test, #results) still open the same screens.
  const STAGES = [
    { id: 'menu', label: 'Lesson Menu' },
    { id: 'teach', label: 'Parent Guide' },
    { id: 'see', label: 'Learn' },
    { id: 'practice', label: 'Practice' },
    { id: 'test', label: 'Take a Test' },
    { id: 'results', label: 'My Results' }
  ];
  const SHORT = ['Th', 'H', 'T', 'O']; // column labels for compact charts

  function mastery(pct) {
    if (pct >= 90) return { key: 'mastered', label: 'Mastered', advice: 'Ready to move on to the next lesson.' };
    if (pct >= 70) return { key: 'review', label: 'Review missed skills', advice: 'Practice the skills listed below, then move on.' };
    return { key: 'reteach', label: 'Reteach and reassess', advice: 'Reteach the skills below with Learn, practice them, and then take a new test. Every new test uses different numbers.' };
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
      builder: digitsOf(L.seeIt.builderStart || 0),
      change: L.seeIt.changeStart,
      guidedPos: { i: 0 },
      guidedStates: {},
      vocabPos: { i: 0 },
      vocabStates: {},
      vocabItems: L.vocabPractice ? L.vocabPractice(shell.newSeed()) : [],
      bank: store.get('bank-sets', {}),
      openSet: store.get('bank-open', null),
      activeTest: null,
      pendingStart: null,
      view: null,
      unsaved: null
    };
    if (L.saveGuided) {
      const g = store.get('guided', null);
      if (g) { S.guidedStates = g.states || {}; S.guidedPos.i = Math.min(g.i || 0, L.guided.length - 1); }
    }
    const saveGuided = () => { if (L.saveGuided) store.set('guided', { i: S.guidedPos.i, states: S.guidedStates }); };
    /** Forget this lesson's in-memory progress after its saved progress is erased. */
    function forgetProgress() {
      S.bank = {}; S.openSet = null; S.view = null; S.unsaved = null; S.guidedStates = {}; S.guidedPos.i = 0; S.vocabStates = {}; S.vocabPos.i = 0;
      // Home's Continue must not point into erased progress.
      const act = shell.readActivity && shell.readActivity();
      if (act && act.path && opts.path && act.path.indexOf(opts.path) === 0) { try { root.localStorage.removeItem('mathbook:v2:activity'); } catch (e) { /* ignore */ } }
    }
    const lessonEyebrow = () => `Lesson ${esc(L.number)} · ${esc(L.title)}`;
    const eyebrow = lessonEyebrow;

    document.title = `Lesson ${L.number}: ${L.title} · Mathbook`;
    const ctx = shell.startShell({
      mount: opts.mount,
      homeHref: opts.homeHref || './',
      path: opts.path || '',
      crumbs: `Grade 3 · Chapter ${L.chapter}: ${L.chapterTitle}`,
      pill: `Lesson ${L.number}`,
      stages: STAGES,
      stagebar: false,
      menuLink: { href: '#menu', label: 'Lesson Menu' },
      activityTitle: `Lesson ${L.number}: ${L.title}`,
      // Leaving a running test (any way at all) closes it; its draft stays saved. Every screen starts as a menu-width page.
      beforeRender() { S.activeTest = null; activity(false); },
      views: { menu: menuView, teach: teachView, see: seeView, practice: practiceView, test: testView, results: resultsView }
    });
    const main = ctx.main;
    /** Menus and lists use the wider layout (about 960px); one-at-a-time activities use about 800px. */
    const activity = (on, learn) => { main.classList.toggle('stage-activity', on); main.classList.toggle('stage-menu', !on); main.classList.toggle('stage-learn', !!learn); };

    // ---------- Navigation pieces ----------
    /** A whole-card link: icon, title, one short line. */
    function choiceCard(href, title, desc, icon, extra, tag) {
      return `<a class="choice-card${extra ? ' ' + extra : ''}" href="${href}"><span class="choice-icon" aria-hidden="true">${icon}</span>` +
        `<span class="choice-text"><span class="choice-title">${esc(title)}</span><span class="choice-desc">${esc(desc)}</span></span>${tag || ''}</a>`;
    }
    /** Bottom navigation for an activity: an optional way back, plus the Lesson Menu. */
    function menuNav(backHref, backLabel) {
      return `<div class="stage-nav">${backHref ? `<a class="btn btn-ghost" href="${backHref}">← ${esc(backLabel)}</a>` : '<span></span>'}` +
        `<a class="btn btn-ghost" href="#menu">Lesson Menu</a></div>`;
    }

    // ===== Lesson menu =====
    function menuView() {
      const W = store.get('see-wizard', null);
      const firstVisit = !W || !Object.keys(W.done || {}).length;
      main.innerHTML =
        `<section class="hero menu-hero"><p class="eyebrow">Lesson ${esc(L.number)}</p><h1 tabindex="-1">${esc(L.title)}</h1>` +
        `<p class="lead">What would you like to do?</p></section>` +
        `<nav class="choice-grid" aria-label="Lesson choices">` +
        choiceCard('#see', 'Learn', 'See an example and try it.', '💡', firstVisit ? 'is-recommended' : '', firstVisit ? '<span class="choice-tag">Start here</span>' : '') +
        choiceCard('#practice', 'Practice', 'Work on one problem at a time.', '✏️') +
        choiceCard('#test', 'Take a Test', 'Show what you know.', '✓') +
        choiceCard('#results', 'My Results', 'See how you did.', '★') +
        `</nav><p class="parent-link"><a href="#teach">Parent Guide</a> <span class="muted">· how to teach this lesson</span></p>`;
    }

    // ===== Parent Guide (was Teach It) =====
    function teachView() {
      if (L.parentLearn) return parentLearnView();
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
        ctx.hero(eyebrow('teach'), 'Parent Guide', 'How to teach this lesson: ' + esc(L.subtitle), [
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
        `<p class="muted">Vocabulary practice with hints is in <a href="#practice/words">Practice → Math Words</a>, before the Math Words Test.</p></section>` +
        `<section class="card card-parent" id="parent-guide">${head('C', 'Parent guide', 'parent')}` +
        `<div class="guide-grid">${guide}</div></section>` +
        `<section class="card card-parent" id="script">${head('D', 'Teaching script', 'parent')}` +
        `<p class="muted">About 10–15 minutes. Follow the steps in order.</p><ol class="script">${script}</ol>` +
        `<div class="callout"><h3>During Learn: questions to ask (example ${fmt(L.seeIt.examples[0])})</h3><ul>` +
        demoSteps(L.seeIt.examples[0]).map((s) => `<li>${esc(s.ask.replace(/^Ask: /, ''))}</li>`).join('') +
        `<li>Each Learn step ends with a short check. If your student misses it twice, the answer is explained and a new question appears.</li></ul></div>` +
        `<div class="callout callout-warn"><h3>Watch for these mistakes</h3><ul>${L.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul></div></section>` +
        menuNav();
    }

    /** Parent Learn from lesson data: goal, words, demonstration, questions to ask, mistakes, and a checklist for the Learn steps. */
    function parentLearnView() {
      const p = L.parentLearn;
      const list = (items) => `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
      main.innerHTML =
        ctx.hero(eyebrow('teach'), 'Parent Guide', esc(L.subtitle), [
          { id: 'goal', label: 'A · Goal' }, { id: 'words', label: 'B · Math words' },
          { id: 'demo', label: 'C · Demonstrate' }, { id: 'check', label: 'D · Questions, mistakes, checklist' }]) +
        `<section class="card card-parent" id="goal">${head('A', 'Goal', 'parent')}<p class="objective">${esc(L.objective)}</p>${list(p.goal)}</section>` +
        `<section class="card card-parent" id="words">${head('B', 'Math words', 'parent')}<dl class="pl-words">` +
        p.words.map((w) => `<div><dt>${esc(w.term)}</dt><dd>${esc(w.meaning)}${w.example ? ` <span class="muted">Example: ${esc(w.example)}</span>` : ''}</dd></div>`).join('') + `</dl></section>` +
        `<section class="card card-parent" id="demo">${head('C', 'Demonstrate', 'parent')}${p.demoVisual || ''}<ol>${p.demonstrate.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` +
        `<section class="card card-parent" id="check">${head('D', 'Questions, mistakes, and checklist', 'parent')}` +
        `<h3>Ask</h3>${list(p.ask)}<div class="callout callout-warn"><h3>Watch for these mistakes</h3>${list(L.mistakes)}</div>` +
        `<h3>Checklist: the five Learn steps</h3><ol class="checks">${p.checklist.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></section>` +
        `<section class="card card-parent" id="reset">${head('', 'Reset Lesson Progress', 'parent')}` +
        `<p>Erase Section ${esc(L.number)}'s saved answers, Learn completion, and test scores on this device. Other lessons and Number Words are not changed.</p>` +
        `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Reset Lesson Progress…</button></div></section>` +
        menuNav();
      const bindReset = () => shell.bindClear(main, store, `answers, Learn completion, and scores for Section ${L.number}`,
        () => { forgetProgress(); ctx.go('menu'); },
        () => { main.querySelector('#clear-area').innerHTML = '<button type="button" class="btn btn-ghost" id="clear">Reset Lesson Progress…</button>'; bindReset(); main.querySelector('#clear').focus(); },
        'Reset');
      bindReset();
    }

    // ===== Learn (the See It wizard) =====
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

    /** childOnly: leave out the parent's "Ask:" prompt (those live in the Parent Guide's teaching script). */
    function demoBody(n, k, childOnly) {
      const s = demoSteps(n)[k];
      const d = digitsOf(n);
      const shown = d.map((x, i) => x * PLACES[i].value).filter((v, i) => i < s.values && v > 0).map(fmt);
      let expanded = shown.length ? shown.join(' + ') : '…';
      if (s.values < 4) expanded += shown.length ? ' + …' : '';
      if (s.total) expanded = `${expandedForm(n)} = ${fmt(n)}`;
      return `<div class="demo-note"><p class="demo-say">${esc(s.say)}</p>${childOnly ? '' : `<p class="demo-ask">${esc(s.ask)}</p>`}</div>` +
        `<div class="demo-split"><div class="demo-left">` +
        chartHTML(n, { highlight: s.highlight, values: [0, 1, 2, 3].map((i) => i < s.values) }) +
        formsHTML(n, { expanded: esc(expanded), words: s.words ? esc(numberToWords(n)) : '<span class="muted">(last step)</span>' }) +
        `</div><div class="demo-right">` + pv.blocksHTML(n, { dim: s.dim }) + `</div></div>`;
    }

    /** Which ±10/100/1,000 changes stay inside 1,000–9,999 without regrouping? */
    function changeOK(n, delta) {
      const i = PLACES.findIndex((p) => p.value === Math.abs(delta));
      const d = digitsOf(n)[i];
      return delta > 0 ? d <= 8 : d >= (i === 0 ? 2 : 1);
    }

    // ----- See It: a guided wizard, one step at a time -----
    // Saved as 'see-wizard': { step, done: { [stepId]: true }, checks: { [stepId]: { q, tries, retry, solved, revealed, response } }, ex, sub,
    //   phase: { [stepId]: 'example' | 'try' }, builder: [th, h, t, o], change }  (phase, builder, change are optional)
    // A step is complete when its check is answered correctly (on any try). After two misses the answer is
    // taught and a new question of the same kind is offered, so a child is never stuck and never skips the check.
    function seeView(c, arg) {
      activity(true, true);
      const steps = L.seeIt.steps;
      const W = store.get('see-wizard', null) || { step: 0, done: {}, checks: {}, ex: 0, sub: 0 };
      const save = () => store.set('see-wizard', W);
      const reachable = (i) => i === 0 || steps.slice(0, i).every((s) => W.done[s.id]);
      if (!reachable(W.step)) W.step = 0;
      if (Array.isArray(W.builder) && W.builder.length === 4) S.builder = W.builder.slice();
      if (typeof W.change === 'number' && W.change >= 1000 && W.change <= 9999) S.change = W.change;

      function checkState(step) {
        if (!W.checks[step.id]) W.checks[step.id] = { q: step.check(pv.rng(shell.newSeed())), tries: 0, retry: false, solved: false, revealed: false };
        return W.checks[step.id];
      }

      function demoHTML(step) {
        if (step.kind === 'slides') {
          const n = step.slides.length;
          return `<div id="slide-body" class="demo-body slide-body"></div>` + `<div class="slide-over" id="slide-over"></div>` + (n > 1
            ? `<div class="demo-controls"><button type="button" class="btn btn-ghost" id="slide-prev">◀ Back a part</button>` +
              `<span class="step-count" id="slide-count" aria-live="polite"></span>` +
              `<button type="button" class="btn btn-ghost" id="slide-next">Next part ▶</button></div>` : '');
        }
        if (step.kind === 'examples') {
          const ex = L.seeIt.examples;
          return `<div class="ex-nav"><button type="button" class="btn btn-ghost" id="ex-prev">◀ Previous Example</button>` +
            `<span class="ex-count" id="ex-count" aria-live="polite">Example ${W.ex + 1} of ${ex.length}</span>` +
            `<button type="button" class="btn btn-ghost" id="ex-next">Next Example ▶</button></div>` +
            `<div id="demo-body" class="demo-body"></div>` +
            `<div class="demo-controls"><button type="button" class="btn btn-ghost" id="demo-prev">◀ Back a part</button>` +
            `<span class="step-count" id="demo-count" aria-live="polite"></span>` +
            `<button type="button" class="btn btn-ghost" id="demo-next">Next part ▶</button></div>`;
        }
        if (step.kind === 'build') {
          // The + / − controls on top; below them the number, chart, and forms beside the blocks they build (wide screens).
          return `<div class="builder-top">${stepperHTML(S.builder, 'bld')}` +
            `<label class="builder-type">Type a number <input id="bld-input" type="text" inputmode="numeric" autocomplete="off" maxlength="5" aria-describedby="bld-note"></label></div>` +
            `<p class="q-help" id="bld-note">Any whole number from 0 to 9,999.</p><div class="demo-split"><div class="demo-left" id="bld-out" aria-live="polite"></div>` +
            `<div class="demo-right" id="bld-blocks"></div></div>`;
        }
        if (step.kind === 'change') {
          return `<div class="change-row" role="group" aria-label="Change the number">` +
            [1000, 100, 10].map((v) => `<button type="button" class="btn btn-ghost" data-delta="${v}">+ ${fmt(v)}</button>`).join('') +
            [1000, 100, 10].map((v) => `<button type="button" class="btn btn-ghost" data-delta="${-v}">− ${fmt(v)}</button>`).join('') +
            `<button type="button" class="btn btn-small" id="change-reset">Start again at ${fmt(L.seeIt.changeStart)}</button></div>` +
            `<p class="q-help">Buttons that would need regrouping are turned off. That comes in a later lesson.</p>` +
            `<div class="change-out" id="change-out" aria-live="polite"></div>`;
        }
        if (step.kind === 'ten') {
          return `<div class="chain">` + [3, 2, 1, 0].map((i, j) =>
            `<div class="chain-item"><div class="chain-art">${pv.singleBlockSVG(i)}</div><b>${fmt(PLACES[i].value)}</b><span>${PLACES[i].blockName}</span></div>` +
            (j < 3 ? `<div class="chain-arrow" aria-hidden="true">×10 →</div>` : '')).join('') + `</div>`;
        }
        const cd = L.seeIt.composeDigits;
        const greatest = fromDigits(cd.slice().sort((a, b) => b - a));
        const smallest = fromDigits(cd.slice().sort((a, b) => a - b));
        return `<p>Example: use the digits <b>${cd.join(', ')}</b> once each.</p><div class="idea-pair">` +
          `<div class="idea"><h3>Greatest number: ${fmt(greatest)}</h3><p>Put the <b>greatest</b> digit in the thousands place, then the next greatest in the hundreds place, and so on.</p>${chartHTML(greatest, { label: 'Greatest number' })}</div>` +
          `<div class="idea"><h3>Smallest number: ${fmt(smallest)}</h3><p>Put the <b>smallest</b> digit in the thousands place, then the next smallest, and so on.</p>${chartHTML(smallest, { label: 'Smallest number' })}</div></div>`;
      }

      function bindDemo(step) {
        if (step.kind === 'slides') {
          W.slide = W.slide || {};
          const n = step.slides.length;
          const draw = () => {
            const k = Math.min(Math.max(0, W.slide[step.id] || 0), n - 1);
            W.slide[step.id] = k;
            main.querySelector('#slide-body').innerHTML = step.slides[k];
            if (n > 1) {
              main.querySelector('#slide-count').textContent = `Part ${k + 1} of ${n}`;
              main.querySelector('#slide-prev').disabled = k === 0;
              main.querySelector('#slide-next').disabled = k === n - 1;
            }
            // A step without a check is done once the child reaches its last part.
            if (typeof step.check !== 'function' && k === n - 1 && !W.done[step.id]) {
              W.done[step.id] = true;
              const nx = main.querySelector('[data-wiz="next-nc"]');
              if (nx) nx.disabled = false;
              const fin = main.querySelector('a[data-wiz="finish"]');
              if (fin) { fin.classList.remove('is-disabled'); fin.removeAttribute('aria-disabled'); fin.removeAttribute('tabindex'); }
              const note = main.querySelector('#wiz-locked');
              if (note) note.remove();
            }
            save();
          };
          const overBox = main.querySelector('#slide-over');
          const overButton = () => {
            overBox.innerHTML = '<button type="button" class="btn btn-ghost" data-over="ask">Start Over</button>';
            overBox.querySelector('[data-over]').addEventListener('click', () => {
              overBox.innerHTML = '<div class="rl-confirm" role="alertdialog" aria-label="Start this problem over?"><p><b>Start this problem over?</b></p>' +
                '<button type="button" class="btn btn-primary" data-over="yes">Start Over</button> <button type="button" class="btn btn-ghost" data-over="no">Cancel</button></div>';
              overBox.querySelector('[data-over="yes"]').addEventListener('click', () => { W.slide[step.id] = 0; draw(); overButton(); main.querySelector('#slide-body').scrollIntoView({ block: 'nearest' }); });
              overBox.querySelector('[data-over="no"]').addEventListener('click', () => { overButton(); overBox.querySelector('[data-over]').focus(); });
              overBox.querySelector('[data-over="no"]').focus();
            });
          };
          overButton();
          if (n > 1) {
            main.querySelector('#slide-prev').addEventListener('click', () => { W.slide[step.id] -= 1; draw(); });
            main.querySelector('#slide-next').addEventListener('click', () => { W.slide[step.id] += 1; draw(); });
          }
          draw();
        }
        if (step.kind === 'examples') {
          const ex = L.seeIt.examples;
          const body = main.querySelector('#demo-body');
          const draw = () => {
            const n = ex[W.ex];
            const total = demoSteps(n).length;
            W.sub = Math.min(W.sub, total - 1);
            body.innerHTML = demoBody(n, W.sub, true);
            main.querySelector('#demo-count').textContent = `Part ${W.sub + 1} of ${total}`;
            main.querySelector('#demo-prev').disabled = W.sub === 0;
            main.querySelector('#demo-next').disabled = W.sub === total - 1;
            main.querySelector('#ex-count').textContent = `Example ${W.ex + 1} of ${ex.length}: ${fmt(n)}`;
            main.querySelector('#ex-prev').disabled = W.ex === 0;
            main.querySelector('#ex-next').disabled = W.ex === ex.length - 1;
            save();
          };
          const pickEx = (d) => { W.ex = Math.min(ex.length - 1, Math.max(0, W.ex + d)); W.sub = 0; draw(); };
          main.querySelector('#ex-prev').addEventListener('click', () => pickEx(-1));
          main.querySelector('#ex-next').addEventListener('click', () => pickEx(1));
          main.querySelector('#demo-prev').addEventListener('click', () => { W.sub = Math.max(0, W.sub - 1); draw(); });
          main.querySelector('#demo-next').addEventListener('click', () => { W.sub += 1; draw(); });
          draw();
        }
        if (step.kind === 'build') {
          const out = main.querySelector('#bld-out');
          const blocks = main.querySelector('#bld-blocks');
          const input = main.querySelector('#bld-input');
          const draw = (fromInput) => {
            const n = fromDigits(S.builder);
            main.querySelectorAll('.builder-top .stepper-count').forEach((o, i) => { o.textContent = S.builder[i]; });
            if (!fromInput) input.value = fmt(n);
            out.innerHTML = `<p class="big-number" aria-label="Number built: ${fmt(n)}">${fmt(n)}</p>` + chartHTML(n, { values: [true, true, true, true] }) + formsHTML(n);
            blocks.innerHTML = pv.blocksHTML(n);
            W.builder = S.builder.slice();
            save();
          };
          main.querySelectorAll('.builder-top .stepper-btn').forEach((b) => b.addEventListener('click', () => {
            const i = Number(b.parentElement.dataset.place);
            S.builder[i] = Math.min(9, Math.max(0, S.builder[i] + Number(b.dataset.step)));
            draw(false);
          }));
          input.addEventListener('input', () => {
            const n = pv.parseWholeNumber(input.value);
            if (n !== null && n <= 9999) { S.builder = digitsOf(n); draw(true); }
          });
          draw(false);
        }
        if (step.kind === 'change') {
          const out = main.querySelector('#change-out');
          const draw = (before, delta) => {
            const n = S.change;
            W.change = n;
            save();
            main.querySelectorAll('[data-delta]').forEach((b) => { b.disabled = !changeOK(n, Number(b.dataset.delta)); });
            if (before === undefined) { out.innerHTML = `<p class="change-eq">${fmt(n)}</p>${chartHTML(n, { label: 'Current number' })}`; return; }
            const i = PLACES.findIndex((p) => p.value === Math.abs(delta));
            out.innerHTML = `<p class="change-eq">${fmt(before)} ${delta > 0 ? '+' : '−'} ${fmt(Math.abs(delta))} = ${fmt(n)}</p>` +
              `<p><b>Only the ${PLACES[i].key} digit changed:</b> ${digitsOf(before)[i]} became ${digitsOf(n)[i]}.</p>` +
              `<div class="change-charts"><div><h3>Before</h3>${chartHTML(before, { highlight: i, label: 'Before' })}</div><div><h3>After</h3>${chartHTML(n, { highlight: i, label: 'After' })}</div></div>`;
          };
          main.querySelectorAll('[data-delta]').forEach((b) => b.addEventListener('click', () => {
            const delta = Number(b.dataset.delta);
            if (!changeOK(S.change, delta)) return;
            const before = S.change;
            S.change += delta;
            draw(before, delta);
          }));
          main.querySelector('#change-reset').addEventListener('click', () => { S.change = L.seeIt.changeStart; draw(); });
          draw();
        }
      }

      /** Your Turn: the check question, Check Answer right under it, then feedback beside the answer. */
      function checkHTML(step) {
        const c = checkState(step);
        const q = c.q;
        let msg = '';
        if (c.solved) {
          const note = Q.note(q, c.response);
          msg = `<div class="feedback feedback-ok"><p><b>✓ ${c.tries <= 1 ? 'Correct!' : 'You got it!'}</b> ${esc(q.explanation)}</p>${note ? `<p class="q-note">${esc(note)}</p>` : ''}</div>`;
        } else if (c.revealed) msg = `<div class="feedback feedback-info"><p><b>The answer is ${esc(Q.correctText(q))}.</b> ${esc(q.explanation)}</p><p>Now try a new one like it.</p></div>`;
        else if (c.retry) {
          const t = Q.tip(q, c.response);
          const tip = t ? t + ' ' : '';
          msg = `<div class="feedback feedback-no"><p><b>Not quite.</b> ${esc(tip + (q.hint || 'See the example again if you need help.'))}</p></div>`;
        }
        let action;
        if (c.solved) action = `<button type="button" class="btn btn-ghost" data-wiz="another">Try another one</button>`;
        else if (c.revealed) action = `<button type="button" class="btn btn-primary" data-wiz="new">Try a new one</button>`;
        else if (c.retry) action = `<button type="button" class="btn btn-primary" data-wiz="again">Try Again</button>`;
        else action = `<button type="button" class="btn btn-primary" data-wiz="check">Check Answer</button>`;
        if (q.type === 'rline') return `<div class="wiz-check">${Q.render(q, 'wiz-' + step.id, { response: c.response, mode: 'guided' })}</div>`;
        return `<div class="wiz-check">` + Q.render(q, 'wiz-' + step.id, { response: c.response, mode: 'guided' }) +
          `<div class="actions wiz-check-actions">${action}</div>` +
          `<div aria-live="polite">${msg}<p class="feedback feedback-info" data-empty hidden>Type or choose an answer first.</p></div></div>`;
      }

      // Each step has two phases, one on screen at a time: 'example' (watch and explore) and 'try' (Your Turn).
      // Saved per step in W.phase; a step with no saved phase (including older saved progress) opens at Example.
      const phaseOf = (step) => (W.phase && W.phase[step.id] === 'try' ? 'try' : 'example');
      const setPhase = (step, p) => { W.phase = W.phase || {}; W.phase[step.id] = p; };

      function draw() {
        const i = W.step;
        const step = steps[i];
        // A slides step without a check (Unit Review "Remind Me") has only the Example phase (DESIGN §4.4.1).
        const noCheck = typeof step.check !== 'function';
        const c = noCheck ? null : checkState(step);
        const phase = noCheck ? 'example' : phaseOf(step);
        save(); // keep this step's check question the same across a refresh
        const done = !!W.done[step.id];
        const last = i === steps.length - 1;
        const head = `<h2 tabindex="-1" class="wiz-h"><span class="phase-tag phase-${phase}">${phase === 'try' ? 'Your Turn' : 'Example'}</span>` +
          `<span class="wiz-step-title">${esc(step.title)}</span></h2>`;
        const goOn = !noCheck ? `<button type="button" class="btn btn-star btn-big" data-wiz="try">Now I'll Try →</button>`
          : !last ? `<button type="button" class="btn btn-star btn-big" data-wiz="next-nc" ${done ? '' : 'disabled'}>Next Step →</button>`
            : `<a class="btn btn-star btn-big${done ? '' : ' is-disabled'}" href="#see/done" ${done ? '' : 'aria-disabled="true" tabindex="-1"'} data-wiz="finish">Finish →</a>`;
        const body = phase === 'example'
          ? `<p class="wiz-explain">${esc(step.explain)}</p><div class="wiz-demo">${demoHTML(step)}</div>` +
            `<div class="wiz-actions">${i > 0 ? `<button type="button" class="btn btn-ghost" data-wiz="prev-step">← Previous Step</button>` : '<span></span>'}` +
            `${goOn}</div>` + (noCheck && !done ? `<p class="wiz-locked-note" id="wiz-locked">Go through every part to unlock ${last ? 'Finish' : 'the next step'}.</p>` : '')
          : checkHTML(step) +
            `<div class="wiz-actions"><button type="button" class="btn btn-ghost" data-wiz="example">← See the Example Again</button>` +
            (!last
              ? `<button type="button" class="btn btn-primary btn-big" data-wiz="next" ${done ? '' : 'disabled'}>Next Step →</button>`
              : `<a class="btn btn-primary btn-big${done ? '' : ' is-disabled'}" href="#see/done" ${done ? '' : 'aria-disabled="true" tabindex="-1"'} data-wiz="finish">Finish →</a>`) +
            `</div>` + (done ? '' : `<p class="wiz-locked-note" id="wiz-locked">Answer correctly to unlock ${last ? 'Finish' : 'the next step'}.</p>`);
        main.innerHTML =
          `<section class="hero act-hero"><p class="eyebrow">${lessonEyebrow()}</p>` +
          `<div class="act-title"><h1 tabindex="-1">Learn</h1><p class="wiz-count">Step ${i + 1} of ${steps.length}</p></div></section>` +
          `<section class="card wiz-card" data-phase="${phase}">${head}${body}</section>` +
          `<div class="wiz-menu"><a class="btn btn-ghost" href="#menu">Lesson Menu</a></div>`;
        const qEl = main.querySelector('.wiz-check .q[data-qkey]');
        if (phase === 'example') bindDemo(step);
        else if (c.q.type === 'rline') {
          Q.bind(qEl, c.q, (r) => {
            c.response = r;
            if (r.complete && !W.done[step.id]) {
              // Completion is earned once and kept (Start Over clears answers, never completion).
              c.solved = true; W.done[step.id] = true; save(); draw();
              const t = main.querySelector('.rl-task'); if (t) t.focus();
              return;
            }
            save();
          });
        } else if (c.solved || c.revealed || c.retry) {
          qEl.querySelectorAll('input, select, button').forEach((x) => { x.disabled = true; });
          // Chapter 2 controls: ✓ on every box when right, ✗ on the wrong boxes after a miss (Try Again clears them).
          if (c.response !== undefined) Q.applyMarks(qEl, c.q, c.response);
        } else Q.bind(qEl, c.q, (r) => { c.response = r; save(); });
        main.querySelectorAll('[data-wiz]').forEach((b) => b.addEventListener('click', (e) => {
          const act = b.dataset.wiz;
          if (act === 'finish') { if (!W.done[step.id]) e.preventDefault(); return; }
          if (act === 'check') {
            const r = Q.read(qEl, c.q);
            if (!Q.isAnswered(c.q, r)) { main.querySelector('[data-empty]').hidden = false; return; }
            c.response = r;
            c.tries += 1;
            if (Q.grade(c.q, r)) { c.solved = true; c.retry = false; W.done[step.id] = true; } else if (c.tries >= 2) { c.revealed = true; c.retry = false; } else { c.retry = true; }
          }
          if (act === 'again') c.retry = false;
          if (act === 'new' || act === 'another') W.checks[step.id] = { q: step.check(pv.rng(shell.newSeed())), tries: 0, retry: false, solved: false, revealed: false };
          // Before leaving Your Turn, keep whatever is typed (even unchecked).
          if (act === 'example' && qEl && !(c.solved || c.revealed || c.retry)) c.response = Q.read(qEl, c.q);
          if (act === 'try') setPhase(step, 'try');
          if (act === 'example') setPhase(step, 'example');
          if (act === 'prev-step') { W.step = Math.max(0, i - 1); setPhase(steps[W.step], 'example'); }
          if ((act === 'next' || act === 'next-nc') && W.done[step.id]) { W.step = i + 1; setPhase(steps[W.step], 'example'); }
          save();
          draw();
          // A new phase or step: start at the top with focus on its heading.
          if (['try', 'example', 'prev-step', 'next', 'next-nc'].includes(act)) { root.scrollTo(0, 0); main.querySelector('.wiz-h').focus({ preventScroll: true }); return; }
          const focusTarget = main.querySelector('[data-wiz="next"]:not([disabled]), a[data-wiz="finish"]:not(.is-disabled), [data-wiz="again"], [data-wiz="new"], .wiz-check input:not([disabled]), .wiz-check button:not([disabled])');
          if (focusTarget) focusTarget.focus();
        }));
      }

      // #see/done: the completion screen (only once every step is done).
      if (arg === 'done' && steps.every((s) => W.done[s.id])) {
        main.innerHTML = ctx.hero(lessonEyebrow(), 'You finished learning!', 'Great work. Now try some practice problems.') +
          `<section class="card done-card"><p class="done-title">You finished all ${steps.length} steps.</p>` +
          (L.seeIt.reflection ? `<div class="reflect"><p class="reflect-title">Think and talk</p><p>${esc(L.seeIt.reflection.prompt)}</p>` +
            (L.seeIt.reflection.idea ? `<details class="parent-help"><summary>Parent Help</summary><p>${esc(L.seeIt.reflection.idea)}</p></details>` : '') + `</div>` : '') +
          `<div class="actions"><a class="btn btn-primary btn-big" href="#practice">Start Practice</a>` +
          `<a class="btn btn-ghost btn-big" href="#menu">Lesson Menu</a>` +
          `<button type="button" class="btn btn-ghost" id="learn-again">Go through Learn again</button></div></section>`;
        main.querySelector('#learn-again').addEventListener('click', () => { W.step = 0; save(); ctx.go('see'); });
        return;
      }
      draw();
    }

    // ===== Practice =====
    // Practice: a choice screen first, then ONE activity on screen.
    //   #practice  choices · #practice/words  Math Words · #practice/together  Practice Together
    //   #practice/own  On My Own (choose a set) · #practice/s1 … s5  one set, one question at a time
    function practiceView(c, arg) {
      if (arg === 'words' && L.vocabPractice) return mathWordsView();
      if (arg === 'together') return togetherView();
      if (arg === 'own') return ownView();
      if (arg && setOf(arg)) return setView(arg);
      main.innerHTML =
        ctx.hero(lessonEyebrow(), 'Practice', 'Choose how you want to practice.') +
        `<nav class="choice-grid" aria-label="Practice activities">` +
        (L.vocabPractice ? choiceCard('#practice/words', 'Math Words', 'Practice the math words with hints.', 'Ab') : '') +
        (L.guided ? choiceCard('#practice/together', 'Practice Together', 'Solve problems with a grown-up. Hints and help are on.', '👥', 'icon-text') : '') +
        (L.bankSets ? choiceCard('#practice/own', 'On My Own', L.bankSets.length > 1
          ? `Choose a set of ${L.bankSets[0].ids.length}. Answer every question, then check your work.`
          : `Answer all ${L.bankSets[0].ids.length} questions, then check your work.`, '★') : '') +
        `</nav>` + menuNav();
    }

    function mathWordsView() {
      activity(true);
      main.innerHTML = ctx.hero(lessonEyebrow(), 'Math Words', 'Answer one question at a time. Use a hint if you need one.') +
        `<section class="card activity-card"><div id="vocab-runner"></div></section>` + menuNav('#practice', 'Practice choices');
      const run = () => shell.guidedRunner(main.querySelector('#vocab-runner'), {
        items: S.vocabItems, states: S.vocabStates, pos: S.vocabPos, keyPrefix: 'vp', lastLabel: 'Finish',
        onLast: () => doneCard('You finished Math Words practice!', `<button type="button" class="btn btn-primary" id="vocab-new">Practice new words</button>`, () => {
          main.querySelector('#vocab-new').addEventListener('click', () => {
            S.vocabItems = L.vocabPractice(shell.newSeed());
            S.vocabStates = {};
            S.vocabPos.i = 0;
            mathWordsView();
          });
        })
      });
      run();
    }

    function togetherView() {
      activity(true);
      main.innerHTML = ctx.hero(lessonEyebrow(), 'Practice Together', 'Work with a grown-up. Check each answer, use hints, and fix mistakes.') +
        `<section class="card activity-card"><div id="guided-runner"></div></section>` + menuNav('#practice', 'Practice choices');
      shell.guidedRunner(main.querySelector('#guided-runner'), {
        items: L.guided, states: S.guidedStates, pos: S.guidedPos, keyPrefix: 'g', lastLabel: 'Finish', onChange: saveGuided,
        context: L.guidedContext || (L.guided && L.guided.context) || null,
        onLast: () => doneCard('You finished Practice Together!', `<button type="button" class="btn btn-primary" id="together-again">Practice together again</button><a class="btn btn-ghost" href="#practice/own">Go to On My Own</a>`, () => {
          main.querySelector('#together-again').addEventListener('click', () => { S.guidedStates = {}; S.guidedPos.i = 0; saveGuided(); togetherView(); });
        })
      });
    }

    function ownView() {
      main.innerHTML = ctx.hero(lessonEyebrow(), 'On My Own', `Choose a set. Answer every question, then check your work. No hints until you check.`) +
        `<div class="set-grid" id="set-grid"></div>` + menuNav('#practice', 'Practice choices');
      drawSets();
    }

    function setView(id) {
      activity(true);
      const set = setOf(id);
      if (!setState(id).active) startSet(id);
      S.openSet = id;
      saveBank();
      main.innerHTML = ctx.hero(lessonEyebrow(), `Set ${L.bankSets.indexOf(set) + 1}: ${esc(set.title)}`, esc(set.blurb)) +
        `<section class="card activity-card"><div id="indep"></div></section>` + menuNav('#practice/own', 'Choose a set');
      drawIndep();
    }

    /** End-of-activity card: a short message, the activity's own action, and the Lesson Menu. */
    function doneCard(message, actions, bind) {
      main.innerHTML = ctx.hero(lessonEyebrow(), message, '') +
        `<section class="card done-card"><p class="done-title">${esc(message)}</p><div class="actions">${actions}<a class="btn btn-ghost" href="#menu">Lesson Menu</a></div></section>`;
      if (bind) bind();
      root.scrollTo(0, 0);
      main.querySelector('h1').focus({ preventScroll: true });
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
        ctx.go('practice/' + id);
      }));
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
      if (!checked) return drawOneQuestion(box, st, A, qs, isRetry, intro);
      // After checking: the whole set with feedback for every question (unchanged from before).
      box.innerHTML = `<h3 class="set-title" tabindex="-1">${title}</h3>${intro}${score}<ol class="q-list">` + qs.map((q, i) => {
        const r = A.responses[q.id];
        const fb = Q.grade(q, r)
          ? `<div class="feedback feedback-ok"><p><b>✓ Correct.</b> ${esc(q.explanation)}</p></div>`
          : `<div class="feedback feedback-no"><p><b>✗ Your answer:</b> ${esc(Q.describe(q, r))}</p><p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p><p><b>Why:</b> ${esc(q.explanation)}</p></div>`;
        return `<li class="q-item is-checked">${Q.render(q, 'p-' + q.id, { number: i + 1, response: r, review: true })}${fb}</li>`;
      }).join('') + `</ol>` +
        `<div class="actions">` +
        (missesLeft ? `<button type="button" class="btn btn-primary" id="practice-misses">Practice My Misses (${missesLeft})</button>` : '') +
        `<button type="button" class="btn ${missesLeft ? 'btn-ghost' : 'btn-primary'}" id="set-again">Practice this set again</button>` +
        `<button type="button" class="btn btn-ghost" id="choose-set">Choose another set</button>` +
        `<a class="btn btn-ghost" href="#menu">Lesson Menu</a></div>`;
      box.querySelectorAll('.q[data-qkey] input, .q[data-qkey] select, .q[data-qkey] button').forEach((c) => { c.disabled = true; });
      box.querySelector('#practice-misses') && box.querySelector('#practice-misses').addEventListener('click', () => { startMisses(set.id); restart(); });
      box.querySelector('#set-again').addEventListener('click', () => { startSet(set.id); restart(); });
      box.querySelector('#choose-set').addEventListener('click', () => ctx.go('practice/own'));
    }

    /** Back to the top of the set screen with the first question showing. */
    function restart() {
      drawIndep();
      root.scrollTo(0, 0);
      const first = main.querySelector('#indep .q input, #indep .q select, #indep .q button');
      if (first) first.focus({ preventScroll: true });
    }

    /**
     * An unchecked set, ONE question at a time ("Question X of N"), Previous / Next, then Check my work.
     * Responses are saved as they change, so Back/Next and a refresh keep them. No hints or answers until checked.
     */
    function drawOneQuestion(box, st, A, qs, isRetry, intro) {
      const n = qs.length;
      A.pos = Math.min(Math.max(0, A.pos || 0), n - 1);
      const i = A.pos;
      const q = qs[i];
      box.innerHTML = `${intro}<p class="q-count" aria-live="polite">Question ${i + 1} of ${n}</p>` +
        `<div class="one-q">${Q.render(q, 'p-' + q.id, { response: A.responses[q.id] })}</div>` +
        `<div class="error-box" role="alert" hidden></div>` +
        `<div class="stage-nav one-q-nav">` +
        (i > 0 ? `<button type="button" class="btn btn-ghost" data-q="prev">← Previous</button>` : '<span></span>') +
        (i < n - 1 ? `<button type="button" class="btn btn-primary" data-q="next">Next →</button>`
          : `<button type="button" class="btn btn-primary" id="check-set">Check my work</button>`) + `</div>`;
      const el = box.querySelector('.q[data-qkey]');
      Q.bind(el, q, (r) => { A.responses[q.id] = r; saveBank(); });
      const keep = () => { A.responses[q.id] = Q.read(el, q); saveBank(); };
      const moveTo = (k) => {
        keep();
        A.pos = k;
        saveBank();
        drawIndep();
        box.scrollIntoView({ block: 'start' });
        const c = box.querySelector('.q input, .q select, .q button');
        if (c) c.focus({ preventScroll: true });
      };
      box.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => moveTo(i + (b.dataset.q === 'next' ? 1 : -1))));
      const btn = box.querySelector('#check-set');
      if (btn) btn.addEventListener('click', () => {
        keep();
        const missing = qs.map((x, k) => (Q.isAnswered(x, A.responses[x.id]) ? null : k)).filter((k) => k !== null);
        const err = box.querySelector('.error-box');
        if (missing.length) {
          err.hidden = false;
          err.innerHTML = `<p>Answer every question first. Still needed: ${missing.map((k) => k + 1).join(', ')}.</p>` +
            `<div class="actions">${missing.map((k) => `<button type="button" class="btn btn-small" data-goto="${k}">Go to question ${k + 1}</button>`).join('')}</div>`;
          err.querySelectorAll('[data-goto]').forEach((b) => b.addEventListener('click', () => moveTo(Number(b.dataset.goto))));
          err.querySelector('[data-goto]').focus();
          return;
        }
        const correct = qs.map((x) => Q.grade(x, A.responses[x.id]));
        const record = { id: Date.now(), date: new Date().toISOString(), order: A.order.slice(), responses: Object.assign({}, A.responses),
          correct, score: correct.filter(Boolean).length, total: n };
        if (isRetry) { record.parentId = A.parentId; st.retries.push(record); A.retryId = record.id; } else { st.attempts.push(record); A.attemptId = record.id; }
        A.checked = true;
        delete A.pos;
        saveBank();
        drawIndep();
        box.scrollIntoView({ block: 'start' });
        box.querySelector('.set-title').focus({ preventScroll: true });
      });
    }

    // ===== Take a Test =====
    // #test chooses a test; #test/math or #test/vocab starts (or resumes) that test directly.
    function testView(c, arg) {
      if (arg && L.tests[arg] && !S.activeTest) S.pendingStart = arg;
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
        const resume = draft ? `<p class="test-last"><b>Unfinished:</b> ${draft.questions.filter((q) => Q.isAnswered(q, (draft.responses || {})[q.id])).length} of ${draft.questions.length} answered so far.</p>` : '';
        return `<div class="card test-card"><h2>${esc(t.title)}</h2><p>${esc(t.blurb)}</p>` +
          `<p class="test-meta">${t.questions || 10} questions · one at a time</p>${status}${resume}` +
          `<button type="button" class="btn btn-primary btn-big" data-start="${id}">${draft ? 'Keep going' : mine.length ? 'Take it again' : 'Start'}<span class="sr-only">: ${esc(t.title)}</span></button></div>`;
      }).join('');

      main.innerHTML =
        ctx.hero(eyebrow('test'), 'Take a Test', 'Which test would you like to take?') +
        `<div class="test-grid">${cards}</div>` +
        `<details class="parent-help"><summary>Parent Help</summary><ul class="rules">` +
        `<li>Each test has ${Object.values(L.tests).map((x) => x.questions || 10).join(' or ')} questions, shown one at a time. Every question must be answered before pressing <b>Finish Test</b>.</li>` +
        `<li>No hints and no answer feedback until the test is finished.</li>` +
        `<li>To stop early, press <b>Save and finish later</b>. Answers are kept.</li>` +
        `<li>You may read the directions aloud. Do not explain the math during the test.</li>` +
        `<li>Every new attempt uses new numbers, so retakes test understanding, not memory.</li></ul></details>` + menuNav();

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
      activity(true);
      const D = S.activeTest;
      const t = L.tests[D.testId];
      shell.testRunner(ctx, {
        store, draftKey: 'draft-' + D.testId, draft: D, title: t.title, eyebrow: eyebrow('test'),
        attemptNumber: store.get('attempts', []).filter((a) => a.testId === D.testId).length + 1,
        onExit() { S.activeTest = null; ctx.go('test'); },
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

    // ===== My Results =====
    function resultsView() {
      const attempts = store.get('attempts', []);
      if (S.unsaved && !attempts.some((a) => a.id === S.unsaved.id)) attempts.push(S.unsaved);
      const top = ctx.hero(eyebrow('results'), 'My Results', 'See how you did.');
      const testTitle = (a) => (L.tests[a.testId] || a).title;
      const notice = `<details class="parent-help" id="privacy"><summary>Parent Help: saved progress</summary>` +
        `<p>Results are saved only in this browser on this device. They do <b>not</b> sync to other devices or browsers, and clearing browser data erases them. Mathbook does not ask for names or send results anywhere.</p>` +
        (store.works() ? '' : `<p class="warn-text">This browser is not allowing saved data right now (for example, a private window). Results will disappear when the page closes.</p>`) +
        (attempts.length ? `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Clear saved progress for this lesson…</button></div>` : '') + `</details>`;

      if (!attempts.length) {
        main.innerHTML = top + `<section class="card done-card"><p class="done-title">You haven't taken a test yet.</p>` +
          `<div class="actions"><a class="btn btn-primary btn-big" href="#test">Take a Test</a><a class="btn btn-ghost btn-big" href="#menu">Lesson Menu</a></div></section>` + notice;
        shell.bindClear(main, store, 'results, practice, and unfinished tests for this lesson', cleared);
        return;
      }

      const selected = attempts.find((a) => a.id === S.view) || attempts[attempts.length - 1];
      const latest = Object.keys(L.tests).map((id) => {
        const mine = attempts.filter((a) => a.testId === id);
        const a = mine[mine.length - 1];
        const t = L.tests[id];
        if (!a) return `<div class="card sum-card"><h3>${esc(t.title)}</h3><p class="muted">Not taken yet.</p><a class="btn btn-ghost" href="#test/${id}">Take it</a></div>`;
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
          // Results by lesson (DESIGN §4.4.2): a linked skill opens that lesson's menu; a skill whose lesson
          // is not built yet (link left empty) shows no button.
          if (L.skillLinks && Object.prototype.hasOwnProperty.call(L.skillLinks, s)) {
            const href = L.skillLinks[s];
            return `<li><span>${esc(L.skills[s] || s)}</span>${href ? `<a class="btn btn-small" href="${esc(href)}">Review this lesson (${esc(s)})</a>` : ''}</li>`;
          }
          const action = bankSkills.has(s)
            ? `<button type="button" class="btn btn-small" data-practice="${s}">Practice this skill (Set ${L.bankSets.indexOf(setOf(bestSetFor(s))) + 1})</button>`
            : `<button type="button" class="btn btn-small" data-vocab="1">Math Words practice</button>`;
          return `<li><span>${esc(L.skills[s] || s)}</span>${action}</li>`;
        }).join('') + `</ul>`
        : '<p>No skills to review. Every question was correct.</p>';

      const qBlock = (x, ok) => {
        const q = x.q;
        const r = selected.responses[q.id];
        return `<li class="rq ${ok ? 'rq-ok' : 'rq-no'}"><p class="rq-prompt"><span class="rq-mark" aria-hidden="true">${ok ? '✓' : '✗'}</span>` +
          `<span><span class="sr-only">${ok ? 'Correct' : 'Incorrect'}. </span>Question ${x.i + 1}. ${esc(q.prompt.replace('___', '_____'))}</span></p>` +
          (ok ? '' : Q.visuals(q) + Q.reviewHTML(q, r, `rv-${selected.id}-${q.id}`)) +
          (q.display && ok ? `<p class="rq-display">${esc(q.display)}</p>` : '') +
          `<p><b>Your answer:</b> ${esc(Q.describe(q, r))}</p>` +
          (ok ? '' : `<p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p><p><b>Why:</b> ${esc(q.explanation)}</p>`) + `</li>`;
      };

      const history = attempts.slice().reverse().map((a) => {
        const am = mastery(a.pct);
        return `<tr${a.id === selected.id ? ' class="is-on"' : ''}><td>${esc(shell.formatDate(a.date))}</td><td>${esc(testTitle(a))}</td><td>${a.score}/${a.total}</td><td>${a.pct}%</td>` +
          `<td><span class="badge-m m-${am.key}">${am.label}</span></td><td><button type="button" class="btn btn-small btn-ghost" data-view="${a.id}">View</button></td></tr>`;
      }).join('');

      main.innerHTML = top +
        `<div class="sum-grid">${latest}</div>` +
        `<section class="card result-detail" id="detail"><h2>${esc(testTitle(selected))} <span class="muted">· ${esc(shell.formatDate(selected.date))}</span></h2>` +
        `<div class="score-row"><p class="score-big">${selected.score}<span>/${selected.total}</span></p><p class="score-pct">${selected.pct}%</p>` +
        `<p class="badge-m badge-big m-${m.key}">${m.label}</p></div>` +
        `<p class="advice"><b>Next step:</b> ${esc(m.advice)}</p>` +
        `<p class="muted">Mastered: 90–100% · Review missed skills: 70–89% · Reteach and reassess: below 70%` +
        (selected.pauses ? ` · This test was paused and resumed ${plural(selected.pauses, 'time')}.` : '') + `</p>` +
        `<h3>Skills to review</h3>${skillHTML}` +
        (missed.length ? `<h3>Mistakes to review (${missed.length})</h3><ol class="rq-list">${missed.map((x) => qBlock(x, false)).join('')}</ol>` : '') +
        (right.length ? `<details class="rq-right"><summary>Correct answers (${right.length})</summary><ol class="rq-list">${right.map((x) => qBlock(x, true)).join('')}</ol></details>` : '') +
        `<div class="actions"><button type="button" class="btn btn-primary" data-retake="${selected.testId}">Take a new ${esc(testTitle(selected))}</button></div></section>` +
        `<section class="card">${head('', 'Attempt history', '')}<div class="table-wrap"><table class="history"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>%</th><th>Result</th><th><span class="sr-only">View</span></th></tr></thead><tbody>${history}</tbody></table></div></section>` +
        menuNav() + notice;

      main.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
        S.view = Number(b.dataset.view);
        resultsView();
        main.querySelector('#detail').scrollIntoView({ block: 'start' });
      }));
      main.querySelectorAll('[data-practice]').forEach((b) => b.addEventListener('click', () => {
        const id = bestSetFor(b.dataset.practice);
        const st = setState(id);
        if (!st.active || st.active.checked) startSet(id); else { S.openSet = id; saveBank(); }
        ctx.go('practice/' + id);
      }));
      main.querySelectorAll('[data-vocab]').forEach((b) => b.addEventListener('click', () => ctx.go('practice/words')));
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
      if (!store.get('attempts', null)) forgetProgress(); // a confirmed reset (Cancel leaves the attempts in place)
      else { S.bank = store.get('bank-sets', {}); S.view = null; S.unsaved = null; }
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
