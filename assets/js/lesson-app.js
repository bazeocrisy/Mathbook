/*
 * Mathbook lesson (child view): a simple lesson menu and one activity at a time.
 *   #           lesson menu: Learn · Words to Know · Practice · Show What You Know
 *   #learn      the lesson, one page at a time
 *   #words      word cards, then #word-practice
 *   #practice   practice menu: Practice Together + five sets of 10
 *   #together   guided practice;  #set/s1 … #set/s5  a practice set;  #misses/s1  Practice My Misses
 *   #quiz       the two tests;  #quiz/vocab, #quiz/math  a test;  #done/vocab, #done/math  its result
 * All teaching content comes from the lesson object (curriculum/.../lesson.js). Grown-up material is on grown-ups/.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const shell = MB.shell;
  const esc = Q.esc;
  const { PLACES, fmt, digitsOf, fromDigits, expandedForm, numberToWords } = pv;
  const SHORT = ['Th', 'H', 'T', 'O'];

  // ---------- Pictures and charts ----------
  function chartHTML(n, o) {
    o = o || {};
    const d = o.digits || digitsOf(n);
    const showValues = o.values || [false, false, false, false];
    const on = (i) => (o.highlight === i ? ' is-on' : '');
    return `<div class="pv-chart${o.small ? ' pv-chart-small' : ''}" role="table" aria-label="${esc(o.label || 'Place-value chart')}">` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="columnheader" class="pv-head place-${p.key}${on(i)}">` +
        (o.small ? `<span aria-hidden="true">${SHORT[i]}</span>` : `<span aria-hidden="true">${p.label}</span>`) + `<span class="sr-only">${p.name}</span></div>`).join('') + `</div>` +
      `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-digit place-${p.key}${on(i)}">${d[i]}</div>`).join('') + `</div>` +
      (showValues.some(Boolean) ? `<div class="pv-row" role="row">` + PLACES.map((p, i) => `<div role="cell" class="pv-value place-${p.key}${on(i)}">${showValues[i] ? fmt(d[i] * p.value) : ''}</div>`).join('') + `</div>` : '') +
      `</div>`;
  }

  function formsHTML(n, o) {
    o = o || {};
    return `<dl class="forms">` +
      `<div class="form-row"><dt>Standard form</dt><dd>${fmt(n)}</dd></div>` +
      `<div class="form-row"><dt>Expanded form</dt><dd>${o.expanded !== undefined ? o.expanded : (n === 0 ? '0' : expandedForm(n))}</dd></div>` +
      `<div class="form-row"><dt>Word form</dt><dd>${o.words !== undefined ? o.words : esc(numberToWords(n))}</dd></div></dl>`;
  }

  function stepperHTML(digits) {
    return `<div class="q-build">` + PLACES.map((p, i) =>
      `<div class="stepper place-${p.key}" data-place="${i}"><span class="stepper-name">${p.label}</span>` +
      `<button type="button" class="stepper-btn" data-step="-1" aria-label="Remove one ${p.blockName}">−</button>` +
      `<output class="stepper-count" aria-label="${p.name}">${digits[i]}</output>` +
      `<button type="button" class="stepper-btn" data-step="1" aria-label="Add one ${p.blockName}">+</button></div>`).join('') + `</div>`;
  }

  const ICON = {
    learn: '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="#1d5c96" stroke-width="2"><rect x="3" y="18" width="22" height="22" rx="3" fill="#9ccaf5"/><path d="M3 18 l7 -7 h22 l-7 7z" fill="#c4e0fa"/><path d="M25 18 l7 -7 v22 l-7 7z" fill="#6fa9de"/></g><rect x="36" y="6" width="7" height="34" rx="2" fill="#ffde85" stroke="#9a7000" stroke-width="2"/></svg>',
    words: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="10" width="40" height="30" rx="6" fill="#efe9ff" stroke="#6b4fd8" stroke-width="2.5"/><text x="24" y="32" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="17" fill="#24305e">ABC</text></svg>',
    practice: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="6" fill="#fff" stroke="#2f6fe0" stroke-width="2.5"/><path d="M15 18 l4 4 8 -9 M15 31 l4 4 8 -9" stroke="#1f8a52" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    quiz: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z" fill="#ffc93c" stroke="#b88700" stroke-width="2" stroke-linejoin="round"/></svg>',
    together: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="16" r="7" fill="#9ccaf5"/><circle cx="33" cy="20" r="5.5" fill="#d9ccff"/><path d="M5 40 q12 -18 24 0z" fill="#9ccaf5"/><path d="M24 40 q9 -14 19 0z" fill="#d9ccff"/></svg>'
  };

  function menuBtn(href, icon, title, sub, extra, cls) {
    return `<a class="menu-btn${cls ? ' ' + cls : ''}" href="${href}"><span class="icon">${icon}</span><span><b>${esc(title)}</b><span class="sub">${esc(sub)}</span>${extra && extra.text ? `<span class="done-text">${esc(extra.text)}</span>` : ''}</span>${extra && extra.star ? '<span class="done" aria-label="Done">★</span>' : ''}</a>`;
  }

  // ---------- App ----------
  function start(L, opts) {
    opts = opts || {};
    const store = shell.makeStore(L.storageKey);
    const page = shell.frame(document.getElementById(opts.mount || 'mathbook'), opts.homeHref || './');
    const main = page.main;
    const S = {
      bank: store.get('bank-sets', {}),
      builder: digitsOf(L.seeIt.builderStart),
      change: L.seeIt.changeStart,
      together: { pos: 0, items: {} },
      vocabItems: L.vocabPractice(shell.newSeed()),
      vocabRun: { pos: 0, items: {} },
      cardI: 0
    };
    document.title = `Lesson ${L.number}: ${L.title} · Mathbook`;
    const saveBank = () => store.set('bank-sets', S.bank);
    const bankQ = (id) => L.bank.find((q) => q.id === id);
    const setOf = (id) => L.bankSets.find((s) => s.id === id);
    const setState = (id) => S.bank[id] || (S.bank[id] = { attempts: [], retries: [], active: null });
    const lessonName = `Lesson ${L.number}`;

    const R = shell.router((route, arg) => {
      const views = { '': menuView, learn: learnView, words: wordsView, 'word-practice': wordPracticeView, practice: practiceMenu, together: togetherView,
        set: () => setView(arg), misses: () => missesView(arg), quiz: quizMenu, test: () => testView(arg), done: () => doneView(arg) };
      (views[route] || menuView)();
      const labels = { '': 'Lesson menu', learn: 'Learn', words: 'Words to Know', 'word-practice': 'Words to Know', practice: 'Practice', together: 'Practice', set: 'Practice', misses: 'Practice', quiz: 'Show What You Know', test: 'Show What You Know', done: 'Show What You Know' };
      shell.recordActivity({ path: (opts.path || '') + '#' + (route + (arg ? '/' + arg : '')), title: `${lessonName}: ${L.title}`, step: labels[route] || '' });
      shell.focusTitle(main);
    });

    // ===== Lesson menu =====
    function menuView() {
      page.setBack('Math Lessons', opts.mathHref || '../../../math/');
      const setsDone = L.bankSets.filter((s) => setState(s.id).attempts.length).length;
      const attempts = store.get('attempts', []);
      const testsDone = Object.keys(L.tests).filter((id) => attempts.some((a) => a.testId === id)).length;
      main.innerHTML = `<h1 class="page-title">${esc(lessonName)}: ${esc(L.title)}</h1><p class="page-sub">${esc(L.subtitle)}</p>` +
        `<nav class="menu" aria-label="Lesson activities">` +
        menuBtn('#learn', ICON.learn, 'Learn', 'See how big numbers are built') +
        menuBtn('#words', ICON.words, 'Words to Know', 'The math words for this lesson', null, 'violet') +
        menuBtn('#practice', ICON.practice, 'Practice', '5 practice sets', setsDone ? { text: `${setsDone} of 5 sets done`, star: setsDone === 5 } : null) +
        menuBtn('#quiz', ICON.quiz, 'Show What You Know', '2 short tests', testsDone ? { text: `${testsDone} of 2 tests done`, star: testsDone === 2 } : null, 'violet') +
        `</nav>`;
    }

    // ===== Learn: one page at a time =====
    function demoPages(n) {
      const d = digitsOf(n);
      const pages = [{ say: `Here is ${fmt(n)}. It has four digits. Each digit is in a place.`, dim: [0, 1, 2, 3], highlight: null, values: 0 }];
      PLACES.forEach((p, i) => {
        const v = d[i] * p.value;
        pages.push({
          say: d[i] ? `The ${d[i]} is in the ${p.key} place. ${d[i]} ${d[i] === 1 ? p.one : p.key} = ${fmt(v)}.` : `The 0 is in the ${p.key} place. There are no ${p.key}. The 0 holds the place.`,
          dim: [0, 1, 2, 3].filter((x) => x > i), highlight: i, values: i + 1
        });
      });
      pages.push({ say: 'Add the values of the digits. This is expanded form.', dim: [], highlight: null, values: 4, total: true });
      pages.push({ say: 'Read the thousands and say "thousand." Then read the rest. This is word form.', dim: [], highlight: null, values: 4, total: true, words: true });
      return pages.map((s, k) => ({ kind: 'demo', n, s, title: `Let's build ${fmt(n)}`, step: `Step ${k + 1} of ${pages.length}` }));
    }

    function learnPages() {
      return [{ kind: 'idea1', title: 'A digit\'s place tells its value' }]
        .concat(...L.seeIt.examples.map(demoPages))
        .concat([{ kind: 'build', title: 'Build your own number' }, { kind: 'change', title: '10, 100, or 1,000 more or less' },
          { kind: 'ten', title: 'Groups of ten' }, { kind: 'compose', title: 'The biggest and smallest numbers' }]);
    }

    function learnView() {
      page.setBack(lessonName, '#');
      const pages = learnPages();
      let i = Math.min(store.get('learn-page', 0), pages.length - 1);
      const draw = () => {
        const p = pages[i];
        main.innerHTML = `<div class="activity-head"><h1>Learn</h1>${shell.dotsHTML(pages.length, i, () => '', `Page ${i + 1} of ${pages.length}`)}</div>` +
          `<section class="qcard" id="learn-card">${learnCard(p)}</section>` +
          `<div class="controls">${i > 0 ? '<button type="button" class="btn btn-back" data-act="prev">← Previous</button>' : '<span class="spacer"></span>'}` +
          `<button type="button" class="btn btn-main" data-act="next">${i === pages.length - 1 ? 'All done! Back to the lesson' : 'Next →'}</button></div>`;
        bindLearnCard(p);
        main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
          if (b.dataset.act === 'next' && i === pages.length - 1) { store.set('learn-page', 0); R.go(''); return; }
          i += b.dataset.act === 'next' ? 1 : -1;
          store.set('learn-page', i);
          draw();
          shell.focusTitle(main);
        }));
      };
      draw();
    }

    function learnCard(p) {
      if (p.kind === 'idea1') {
        return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2>${L.intro.map((t) => `<p class="say-big">${esc(t)}</p>`).join('')}` +
          chartHTML(L.introNumber, { highlight: 0, values: [true, true, true, true] }) +
          `<p class="say-big">You will learn to:</p><ul>${L.targets.map((t) => `<li style="font-size:1.15rem">${esc(t)}</li>`).join('')}</ul>`;
      }
      if (p.kind === 'demo') {
        const { n, s } = p;
        const d = digitsOf(n);
        const shown = d.map((x, k) => x * PLACES[k].value).filter((v, k) => k < s.values && v > 0).map(fmt);
        let expanded = shown.length ? shown.join(' + ') + (s.values < 4 ? ' + …' : '') : '…';
        if (s.total) expanded = `${expandedForm(n)} = ${fmt(n)}`;
        return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2><p class="muted">${esc(p.step)}</p><p class="say-big">${esc(s.say)}</p>` +
          chartHTML(n, { highlight: s.highlight, values: [0, 1, 2, 3].map((k) => k < s.values) }) + pv.blocksHTML(n, { dim: s.dim }) +
          formsHTML(n, { expanded: esc(expanded), words: s.words ? esc(numberToWords(n)) : '…' });
      }
      if (p.kind === 'build') {
        return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2><p class="say-big">Press + and − to add and take away blocks. Watch the number change.</p>` +
          stepperHTML(S.builder) + `<div id="bld-out" aria-live="polite"></div>`;
      }
      if (p.kind === 'change') {
        return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2><p class="say-big">${esc(L.changeIdea.text)}</p>` +
          `<div class="change-row" role="group" aria-label="Change the number">` +
          [1000, 100, 10].map((v) => `<button type="button" class="btn btn-back" data-delta="${v}">+ ${fmt(v)}</button>`).join('') +
          [1000, 100, 10].map((v) => `<button type="button" class="btn btn-back" data-delta="${-v}">− ${fmt(v)}</button>`).join('') +
          `<button type="button" class="btn btn-quiet" id="change-reset">Start again at ${fmt(L.seeIt.changeStart)}</button></div>` +
          `<div id="change-out" aria-live="polite"></div>`;
      }
      if (p.kind === 'ten') {
        return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2><div class="chain">` + [3, 2, 1, 0].map((k, j) =>
          `<div class="chain-item"><div class="chain-art">${pv.singleBlockSVG(k)}</div><b>${fmt(PLACES[k].value)}</b><span>${PLACES[k].blockName}</span></div>` +
          (j < 3 ? `<div class="chain-arrow" aria-hidden="true">×10 →</div>` : '')).join('') + `</div>` +
          `<p class="say-big">10 units make 1 rod. 10 rods make 1 flat. 10 flats make 1 cube.</p><p class="say-big">So each place is worth 10 times the place to its right.</p>`;
      }
      const cd = L.seeIt.composeDigits;
      const greatest = fromDigits(cd.slice().sort((a, b) => b - a));
      const smallest = fromDigits(cd.slice().sort((a, b) => a - b));
      return `<h2 style="font-size:1.8rem">${esc(p.title)}</h2><p class="say-big">Use the digits ${cd.join(', ')} once each.</p>` +
        `<p class="say-big">Greatest number: <b>${fmt(greatest)}</b>. Put the greatest digit in the thousands place, then the next greatest, and so on.</p>${chartHTML(greatest, { label: 'Greatest number' })}` +
        `<p class="say-big">Smallest number: <b>${fmt(smallest)}</b>. Put the smallest digit in the thousands place, then the next smallest.</p>${chartHTML(smallest, { label: 'Smallest number' })}`;
    }

    function changeOK(n, delta) {
      const k = PLACES.findIndex((p) => p.value === Math.abs(delta));
      const d = digitsOf(n)[k];
      return delta > 0 ? d <= 8 : d >= (k === 0 ? 2 : 1);
    }

    function bindLearnCard(p) {
      if (p.kind === 'build') {
        const out = main.querySelector('#bld-out');
        const draw = () => {
          const n = fromDigits(S.builder);
          main.querySelectorAll('.stepper-count').forEach((o, k) => { o.textContent = S.builder[k]; });
          out.innerHTML = `<p class="big-number" aria-label="Number built: ${fmt(n)}">${fmt(n)}</p>` + chartHTML(n, { values: [true, true, true, true] }) + pv.blocksHTML(n) + formsHTML(n);
        };
        main.querySelectorAll('.stepper-btn').forEach((b) => b.addEventListener('click', () => {
          const k = Number(b.parentElement.dataset.place);
          S.builder[k] = Math.min(9, Math.max(0, S.builder[k] + Number(b.dataset.step)));
          draw();
        }));
        draw();
      }
      if (p.kind === 'change') {
        const out = main.querySelector('#change-out');
        const draw = (before, delta) => {
          const n = S.change;
          main.querySelectorAll('[data-delta]').forEach((b) => { b.disabled = !changeOK(n, Number(b.dataset.delta)); });
          if (before === undefined) { out.innerHTML = `<p class="change-eq">${fmt(n)}</p>${chartHTML(n, { label: 'Current number' })}`; return; }
          const k = PLACES.findIndex((x) => x.value === Math.abs(delta));
          out.innerHTML = `<p class="change-eq">${fmt(before)} ${delta > 0 ? '+' : '−'} ${fmt(Math.abs(delta))} = ${fmt(n)}</p>` +
            `<p class="say-big">Only the ${PLACES[k].key} digit changed: ${digitsOf(before)[k]} became ${digitsOf(n)[k]}.</p>` +
            `<div class="change-charts"><div><h3>Before</h3>${chartHTML(before, { highlight: k, label: 'Before' })}</div><div><h3>After</h3>${chartHTML(n, { highlight: k, label: 'After' })}</div></div>`;
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

    // ===== Words to Know: one card at a time, then practice =====
    function wordCards() {
      return L.vocabulary.map((v) => ({ term: v.term, meaning: v.meaning, example: v.example, chart: v.chart }))
        .concat(L.placeWords.slice().reverse().map((w) => ({ term: w.term, meaning: w.meaning, block: w.block, blockWord: w.blockWord })));
    }

    function wordsView() {
      page.setBack(lessonName, '#');
      const cards = wordCards();
      const draw = () => {
        const i = S.cardI;
        const c = cards[i];
        const pic = c.chart !== undefined ? chartHTML(c.chart, { small: true }) + `<p class="muted">Th = thousands, H = hundreds, T = tens, O = ones</p>`
          : c.block !== undefined ? `<div class="block-pic">${pv.singleBlockSVG(c.block)}</div><p class="say-big">Block: ${esc(c.blockWord)}</p>`
            : `<p class="example">${esc(c.example)}</p>`;
        main.innerHTML = `<div class="activity-head"><h1>Words to Know</h1>${shell.dotsHTML(cards.length, i, () => '', `Word ${i + 1} of ${cards.length}`)}</div>` +
          `<section class="qcard word-card"><p class="term">${esc(c.term)}</p><p class="meaning">${esc(c.meaning.replace(/\.$/, ''))}.</p>${pic}</section>` +
          `<div class="controls">${i > 0 ? '<button type="button" class="btn btn-back" data-act="prev">← Previous</button>' : '<span class="spacer"></span>'}` +
          (i < cards.length - 1 ? '<button type="button" class="btn btn-main" data-act="next">Next →</button>' : '<a class="btn btn-main" href="#word-practice">Practice the words →</a>') + `</div>`;
        main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { S.cardI += b.dataset.act === 'next' ? 1 : -1; draw(); shell.focusTitle(main); }));
      };
      draw();
    }

    function wordPracticeView() {
      page.setBack(lessonName, '#');
      shell.stepRunner({
        main, title: 'Practice the Words', items: S.vocabItems, run: S.vocabRun, save() {}, keyPrefix: 'vp', finishLabel: 'Finish',
        onFinish(sum) {
          main.innerHTML = `<section class="qcard" style="text-align:center"><h1>You practiced the words!</h1><p class="result-stars" aria-hidden="true">${'★'.repeat(shell.starsFor(sum.firstRight / sum.total * 100))}</p>` +
            `<p class="say-big">You got ${sum.firstRight} of ${sum.total} right on the first try.</p></section>` +
            `<div class="controls"><button type="button" class="btn btn-back" id="again">Practice new words</button><a class="btn btn-main" href="#">Back to ${esc(lessonName)}</a></div>`;
          main.querySelector('#again').addEventListener('click', () => { S.vocabItems = L.vocabPractice(shell.newSeed()); S.vocabRun = { pos: 0, items: {} }; wordPracticeView(); });
          shell.focusTitle(main);
        }
      });
    }

    // ===== Practice =====
    function practiceMenu() {
      page.setBack(lessonName, '#');
      main.innerHTML = `<h1 class="page-title">Practice</h1><p class="page-sub">Pick any set. Answer one question at a time.</p><nav class="menu one" aria-label="Practice">` +
        menuBtn('#together', ICON.together, 'Practice Together', `With a grown-up · ${L.guided.length} problems`, null, 'violet') +
        L.bankSets.map((set, n) => {
          const st = setState(set.id);
          const doing = st.active && !st.active.finished && st.active.kind === 'set';
          const done = st.attempts.length > 0;
          return menuBtn(`#set/${set.id}`, `<span>${n + 1}</span>`, `Set ${n + 1}: ${set.title}`, set.blurb, doing ? { text: 'Keep going' } : done ? { text: 'Done', star: true } : null);
        }).join('') + `</nav>`;
    }

    function togetherView() {
      page.setBack('Practice', '#practice');
      shell.stepRunner({
        main, title: 'Practice Together', items: L.guided, run: S.together, save() {}, keyPrefix: 'g', finishLabel: 'Finish',
        onFinish() {
          main.innerHTML = `<section class="qcard" style="text-align:center"><h1>Great teamwork!</h1><p class="say-big">You finished Practice Together.</p></section>` +
            `<div class="controls"><a class="btn btn-back" href="#practice">Back to Practice</a><a class="btn btn-main" href="#set/s1">Start Set 1 →</a></div>`;
          S.together = { pos: 0, items: {} };
        }
      });
    }

    /** Older saved sets (whole set checked at the end) become first-try results. */
    const firstOf = (a) => a.first || a.correct || [];
    const finalOf = (a) => a.final || a.correct || [];

    function startRun(id, kind, order, parentId) {
      setState(id).active = { kind, order, run: { pos: 0, items: {} }, parentId: parentId || null, finished: false, started: new Date().toISOString() };
      saveBank();
    }

    function ensureRun(st) {
      // Build 2.1 saved an unchecked set as { order, responses }; keep those answers as starting answers.
      if (st.active && !st.active.run) {
        if (st.active.checked) st.active.finished = true;
        st.active.run = { pos: 0, items: {} };
        st.active.legacyResponses = st.active.responses || {};
        if (st.active.checked && st.active.kind !== 'retry') st.active.recordId = st.active.attemptId;
        if (st.active.checked && st.active.kind === 'retry') st.active.recordId = st.active.retryId;
      }
    }

    function setView(id, retry) {
      const set = setOf(id);
      if (!set) return R.go('practice');
      const n = L.bankSets.indexOf(set) + 1;
      const st = setState(id);
      ensureRun(st);
      page.setBack('Practice', '#practice');
      // No set yet, or the last Practice My Misses is finished: start a fresh attempt at the whole set.
      if (!retry && (!st.active || (st.active.kind === 'retry' && st.active.finished))) {
        startRun(id, 'set', pv.shuffle(pv.rng(shell.newSeed()), set.ids));
      }
      const A = st.active;
      if (A.finished) return setSummary(id);
      if (retry && A.kind !== 'retry') return setSummary(id);
      const title = A.kind === 'retry' ? `Set ${n}: Practice My Misses` : `Set ${n}: ${set.title}`;
      shell.stepRunner({
        main, title, items: A.order.map(bankQ), run: A.run, keyPrefix: 'p', finishLabel: 'Finish',
        prefill: (q) => (A.legacyResponses || {})[q.id],
        save: saveBank,
        onFinish(sum) {
          const record = { id: Date.now(), date: new Date().toISOString(), order: A.order.slice(), first: sum.first, final: sum.final, correct: sum.first,
            responses: sum.responses, score: sum.firstRight, finalScore: sum.finalRight, total: sum.total };
          if (A.kind === 'retry') { record.parentId = A.parentId; st.retries.push(record); } else st.attempts.push(record);
          A.finished = true;
          A.recordId = record.id;
          saveBank();
          setSummary(id);
        }
      });
    }

    function setSummary(id) {
      const set = setOf(id);
      const n = L.bankSets.indexOf(set) + 1;
      const st = setState(id);
      const A = st.active;
      const rec = (A.kind === 'retry' ? st.retries : st.attempts).find((r) => r.id === A.recordId) || (A.kind === 'retry' ? st.retries[st.retries.length - 1] : st.attempts[st.attempts.length - 1]);
      const first = firstOf(rec);
      const misses = rec.order.filter((qid, k) => !first[k]);
      const firstRight = first.filter(Boolean).length;
      const laterRight = finalOf(rec).filter(Boolean).length - firstRight;
      main.innerHTML = `<section class="qcard" style="text-align:center"><h1>${A.kind === 'retry' ? 'You practiced your misses!' : `You finished Set ${n}!`}</h1>` +
        `<p class="result-stars" aria-hidden="true">${'★'.repeat(shell.starsFor(firstRight / rec.total * 100))}</p>` +
        `<p class="say-big">You got ${firstRight} of ${rec.total} right on the first try${laterRight > 0 ? `, and ${laterRight} more when you tried again` : ''}.</p>` +
        (misses.length ? `<p class="say-big">Let's practice the ${misses.length === 1 ? 'one' : misses.length} you missed on the first try.</p>` : `<p class="say-big">Every one right on the first try!</p>`) +
        `</section><div class="controls">` +
        (misses.length ? `<button type="button" class="btn btn-main" id="misses">Practice My Misses (${misses.length})</button>` : '') +
        `<button type="button" class="btn btn-back" id="again">Practice Set ${n} again</button>` +
        `<a class="btn ${misses.length ? 'btn-back' : 'btn-main'}" href="#practice">Back to Practice</a></div>`;
      const m = main.querySelector('#misses');
      if (m) m.addEventListener('click', () => {
        const parentId = A.kind === 'retry' ? A.parentId : rec.id;
        startRun(id, 'retry', pv.shuffle(pv.rng(shell.newSeed()), misses), parentId);
        R.go('misses/' + id);
      });
      main.querySelector('#again').addEventListener('click', () => { startRun(id, 'set', pv.shuffle(pv.rng(shell.newSeed()), set.ids)); setView(id); shell.focusTitle(main); });
    }

    function missesView(id) {
      const st = setState(id);
      if (!st.active || st.active.kind !== 'retry') return R.go('set/' + id);
      setView(id, true);
    }

    // ===== Show What You Know =====
    function quizMenu() {
      page.setBack(lessonName, '#');
      const attempts = store.get('attempts', []);
      main.innerHTML = `<h1 class="page-title">Show What You Know</h1><p class="page-sub">Try your best! A test has no hints. You can go back and change answers before you finish.</p><nav class="menu one" aria-label="Tests">` +
        Object.keys(L.tests).map((id, k) => {
          const t = L.tests[id];
          const draft = store.get('draft-' + id, null);
          const done = attempts.some((a) => a.testId === id);
          return menuBtn(`#test/${id}`, ICON.quiz, t.title, '10 questions', draft ? { text: 'Keep going' } : done ? { text: 'Done', star: true } : null, k ? 'violet' : '');
        }).join('') + `</nav>`;
    }

    function testView(id) {
      const t = L.tests[id];
      if (!t) return R.go('quiz');
      page.setBack('Show What You Know', '#quiz');
      let draft = store.get('draft-' + id, null);
      if (!draft) {
        const seed = shell.newSeed();
        draft = { testId: id, seed, questions: t.generate(seed), responses: {}, started: new Date().toISOString() };
      }
      shell.testPager({
        main, store, draftKey: 'draft-' + id, draft, title: t.title,
        onExit() { R.go('quiz'); },
        onSubmit(D, correct) {
          const score = correct.filter(Boolean).length;
          const all = store.get('attempts', []);
          all.push({ id: Date.now(), testId: id, title: t.title, date: new Date().toISOString(), seed: D.seed, questions: D.questions, responses: D.responses, correct, score,
            total: D.questions.length, pct: Math.round((score / D.questions.length) * 100), pauses: Math.max(0, (D.sessions || 1) - 1) });
          store.set('attempts', all);
          R.go('done/' + id);
        }
      });
    }

    function doneView(id) {
      page.setBack('Show What You Know', '#quiz');
      const a = store.get('attempts', []).filter((x) => x.testId === id).pop();
      if (!a) return R.go('quiz');
      const msg = a.pct >= 90 ? 'Amazing! You really know this.' : a.pct >= 70 ? 'Good work! Let\'s practice a little more.' : 'Let\'s learn this together and try again.';
      const missed = a.correct.filter((c) => !c).length;
      main.innerHTML = `<section class="qcard" style="text-align:center"><h1>You finished the ${esc(a.title)}!</h1>` +
        `<p class="result-stars" aria-hidden="true">${'★'.repeat(shell.starsFor(a.pct))}</p><p class="result-big">${a.score} out of ${a.total}</p><p class="say-big">${esc(msg)}</p></section>` +
        (missed ? `<section class="qcard"><button type="button" class="btn btn-back" id="show-mistakes" aria-expanded="false">Look at my mistakes (${missed})</button><div id="mistakes" hidden>${shell.mistakesHTML(a.questions, a.responses, a.correct)}</div></section>` : '') +
        `<div class="controls"><a class="btn btn-back" href="#quiz">Back to the tests</a><a class="btn btn-main" href="#">Back to ${esc(lessonName)}</a></div>`;
      const b = main.querySelector('#show-mistakes');
      if (b) b.addEventListener('click', () => { const box = main.querySelector('#mistakes'); box.hidden = !box.hidden; b.setAttribute('aria-expanded', String(!box.hidden)); });
    }

    R.run();
  }

  MB.startLesson = function (id, opts) {
    const L = MB.lessons && MB.lessons[id];
    if (!L) throw new Error('Lesson not found: ' + id);
    start(L, opts);
  };
})(window);
