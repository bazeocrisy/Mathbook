/*
 * Number Words phase engine: Learn → Say → Look, Cover, Write, Check → Practice → Spelling Test → Results.
 * Reusable for every phase: the words, tips, and sizes come from number-words/program.js.
 * Progress and results are stored in this browser only, separately from Lesson 2-1.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const shell = MB.shell;
  const NW = MB.numberWords;
  const esc = Q.esc;
  const head = shell.sectionHead;

  const STAGES = [
    { id: 'learn', label: 'Learn' },
    { id: 'say', label: 'Say' },
    { id: 'write', label: 'Write' },
    { id: 'practice', label: 'Practice' },
    { id: 'test', label: 'Test' },
    { id: 'results', label: 'Results' }
  ];

  function start(phaseId, opts) {
    opts = opts || {};
    const P = NW.program.phases.find((p) => p.id === phaseId);
    if (!P || P.status !== 'ready') throw new Error('Number Words phase not available: ' + phaseId);
    NW.current = P;
    const store = shell.makeStore(P.storageKey);
    const S = {
      learnI: 0,
      writeI: null,
      writeStep: 'look', // look → write → checked
      writeTyped: '',
      practice: NW.practiceRound(P, shell.newSeed(), null),
      practiceStates: {},
      practicePos: { i: 0 },
      focus: null,
      activeTest: null,
      pendingStart: false,
      view: null
    };
    const range = `${P.words[0].n}–${P.words[P.words.length - 1].n}`;
    const eyebrow = (stage) => `Number Words · Phase ${P.id} · Step ${STAGES.findIndex((s) => s.id === stage) + 1} of ${STAGES.length}`;
    const mastered = (score) => score >= P.masteryScore;

    document.title = `Number Words Phase ${P.id}: ${P.title} · Mathbook`;
    const ctx = shell.startShell({
      mount: opts.mount,
      homeHref: opts.homeHref || './',
      path: opts.path || '',
      crumbs: `Number Words · Read It, Say It, Spell It, Write It`,
      pill: `Phase ${P.id}: ${range}`,
      navLabel: 'Number Words steps',
      stages: STAGES,
      activityTitle: `Number Words Phase ${P.id} (${range})`,
      beforeRender() { S.activeTest = null; },
      views: { learn: learnView, say: sayView, write: writeView, practice: practiceView, test: testView, results: resultsView }
    });
    const main = ctx.main;

    function pad(selected, doneSet, attr) {
      return `<div class="nw-pad" role="group" aria-label="Choose a number">` + P.words.map((w, i) =>
        `<button type="button" data-${attr}="${i}" aria-pressed="${i === selected}" class="${doneSet && doneSet[w.word] ? 'is-done' : ''}" aria-label="${w.n}${doneSet && doneSet[w.word] ? ' (done)' : ''}">${w.n}</button>`).join('') + `</div>`;
    }

    function letterTiles(word) {
      return `<div class="letter-word" aria-hidden="true">${word.split('').map((ch) => `<span class="letter-tile">${esc(ch)}</span>`).join('')}</div>`;
    }

    // ===== 1. Learn =====
    function learnView() {
      main.innerHTML =
        ctx.hero(eyebrow('learn'), `Learn the words ${range}`, 'Look at each number, its word, and how the word is spelled.') +
        `<section class="card" id="learn-words">${head('A', 'Read it', 'student')}` +
        pad(S.learnI, null, 'learn') + `<div id="learn-panel" aria-live="polite"></div>` +
        `<div class="demo-controls"><button type="button" class="btn btn-ghost" id="learn-prev">← Previous</button>` +
        `<span class="step-count" id="learn-count"></span>` +
        `<button type="button" class="btn btn-primary" id="learn-next">Next word →</button></div></section>` +
        `<section class="card card-parent" id="learn-parent">${head('B', 'How to teach it', 'parent')}<ul class="rules">` +
        `<li>Point to the numeral, then the word. Read the word together.</li>` +
        `<li>Point to each letter tile and say the letter.</li>` +
        `<li>Read the spelling tip aloud. Ask: "What is tricky about this word?"</li></ul></section>` +
        ctx.navButtons('learn');
      const draw = () => {
        const w = P.words[S.learnI];
        main.querySelector('#learn-panel').innerHTML =
          `<div class="nw-word-panel"><div><span class="numeral-card">${w.n}</span><div style="margin-top:0.6rem">${pv.tenFrameSVG(w.n)}</div></div>` +
          `<div><p class="nw-big-word">${esc(w.word)}</p>${letterTiles(w.word)}` +
          `<p class="nw-spelled"><span class="sr-only">Spelled </span>${esc(NW.letters(w.word))} · ${w.word.length} letters</p>` +
          `<p class="nw-tip"><b>Spelling tip:</b> ${esc(w.tip)}</p></div></div>`;
        main.querySelector('#learn-count').textContent = `Word ${S.learnI + 1} of ${P.words.length}`;
        main.querySelector('#learn-prev').disabled = S.learnI === 0;
        main.querySelector('#learn-next').disabled = S.learnI === P.words.length - 1;
        main.querySelectorAll('[data-learn]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.learn) === S.learnI)));
      };
      main.querySelectorAll('[data-learn]').forEach((b) => b.addEventListener('click', () => { S.learnI = Number(b.dataset.learn); draw(); }));
      main.querySelector('#learn-prev').addEventListener('click', () => { S.learnI = Math.max(0, S.learnI - 1); draw(); });
      main.querySelector('#learn-next').addEventListener('click', () => { S.learnI = Math.min(P.words.length - 1, S.learnI + 1); draw(); });
      draw();
    }

    // ===== 2. Say =====
    function sayView() {
      const said = store.get('said', {});
      main.innerHTML =
        ctx.hero(eyebrow('say'), 'Say it out loud', 'Say each word, then spell it out loud letter by letter. No microphone is needed.') +
        `<section class="card card-parent">${head('', 'How to do it', 'parent')}<ol class="rules">` +
        `<li>Your child says the word: "seven."</li><li>Then spells it aloud: "s, e, v, e, n."</li>` +
        `<li>Tick the box when they have done both.</li></ol></section>` +
        `<section class="card" id="say-list">${head('A', 'Say it, spell it', 'together', `<span class="step-count" id="say-count" aria-live="polite"></span>`)}` +
        `<ul class="say-list">` + P.words.map((w) =>
          `<li class="say-row"><span class="numeral-card" aria-hidden="true">${w.n}</span>` +
          `<div><div class="say-word">${esc(w.word)}</div><div class="say-letters">${esc(NW.letters(w.word))}</div></div>` +
          `<label class="say-check"><input type="checkbox" data-said="${esc(w.word)}"${said[w.word] ? ' checked' : ''}> Said and spelled <span class="sr-only">${esc(w.word)}</span></label></li>`).join('') +
        `</ul></section>` + ctx.navButtons('say');
      const count = () => { main.querySelector('#say-count').textContent = `${Object.values(store.get('said', {})).filter(Boolean).length} of ${P.words.length} done`; };
      main.querySelectorAll('[data-said]').forEach((c) => c.addEventListener('change', () => {
        const s = store.get('said', {});
        s[c.dataset.said] = c.checked;
        store.set('said', s);
        count();
      }));
      count();
    }

    // ===== 3. Look, Cover, Write, Check =====
    function writeView() {
      const written = store.get('written', {});
      if (S.writeI === null) {
        const next = P.words.findIndex((w) => !(written[w.word] && written[w.word].correct));
        S.writeI = next === -1 ? 0 : next;
      }
      const doneSet = {};
      Object.keys(written).forEach((k) => { doneSet[k] = written[k].correct; });
      main.innerHTML =
        ctx.hero(eyebrow('write'), 'Look, Cover, Write, Check', 'Study the word, cover it, write it from memory, then check.') +
        `<section class="card" id="lcwc">${head('A', 'Spell it from memory', 'student')}` +
        `<p class="muted">Choose a number. A ✓ means it was written correctly from memory.</p>` +
        pad(S.writeI, doneSet, 'wi') +
        `<ol class="nw-steps" aria-label="Steps">` + ['Look', 'Cover', 'Write', 'Check'].map((s, i) => `<li data-step="${i}">${i + 1}. ${s}</li>`).join('') + `</ol>` +
        `<div id="lcwc-panel"></div></section>` +
        `<section class="card card-parent">${head('', 'Tips', 'parent')}<ul class="rules">` +
        `<li>Let your child decide when they are ready to cover the word.</li>` +
        `<li>After checking, point to any letter that is different and look at the word again.</li></ul></section>` +
        ctx.navButtons('write');
      main.querySelectorAll('[data-wi]').forEach((b) => b.addEventListener('click', () => {
        S.writeI = Number(b.dataset.wi); S.writeStep = 'look'; S.writeTyped = ''; writeView();
      }));
      drawWrite();
    }

    function drawWrite() {
      const w = P.words[S.writeI];
      const panel = main.querySelector('#lcwc-panel');
      const stepIndex = { look: 0, write: 2, checked: 3 }[S.writeStep];
      main.querySelectorAll('.nw-steps li').forEach((li) => {
        const i = Number(li.dataset.step);
        li.classList.toggle('is-on', i === stepIndex || (S.writeStep === 'write' && i === 1));
        li.classList.toggle('is-done', i < stepIndex && !(S.writeStep === 'write' && i === 1));
      });
      const visual = `<div><span class="numeral-card">${w.n}</span><div style="margin-top:0.6rem">${pv.tenFrameSVG(w.n)}</div></div>`;
      if (S.writeStep === 'look') {
        panel.innerHTML = `<div class="nw-word-panel">${visual}<div><p class="nw-big-word">${esc(w.word)}</p>${letterTiles(w.word)}` +
          `<p class="muted">Study the word. Say each letter. When you are ready, cover it.</p>` +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="cover">Cover the word</button></div></div></div>`;
      } else if (S.writeStep === 'write') {
        // The word is removed from the page (not just hidden) while the student writes.
        panel.innerHTML = `<div class="nw-word-panel">${visual}<div><div class="nw-cover">The word is covered. Write it from memory.</div>` +
          `<label class="q-prompt" for="lcwc-input" style="margin-top:0.8rem">Write the word for ${w.n}:</label>` +
          `<input id="lcwc-input" class="q-input q-input-wide" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">` +
          `<div class="error-box" role="alert" hidden></div>` +
          `<div class="actions"><button type="button" class="btn btn-primary" data-act="check">Check</button></div></div></div>`;
        const input = panel.querySelector('#lcwc-input');
        input.focus();
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') panel.querySelector('[data-act=check]').click(); });
      } else {
        const ok = Q.normSpell(S.writeTyped) === w.word;
        const cmp = NW.compareLetters(S.writeTyped, w.word);
        panel.innerHTML = `<div class="nw-word-panel">${visual}<div>` +
          `<div class="feedback ${ok ? 'feedback-ok' : 'feedback-no'}" role="status"><p><b>${ok ? '✓ Correct!' : 'Not quite yet.'}</b> ` +
          `${ok ? `${esc(w.word)} is spelled ${esc(NW.letters(w.word))}.` : 'Compare your letters with the word. Look again, then try once more.'}</p></div>` +
          `<div class="compare"><div class="compare-row"><b>You wrote:</b><span class="compare-letters">${cmp.map((c) => `<span class="${c.ok ? 'is-right' : 'is-wrong'}">${esc(c.ch)}</span>`).join('')}</span></div>` +
          `<div class="compare-row"><b>The word:</b><span class="compare-letters">${w.word.split('').map((ch) => `<span>${esc(ch)}</span>`).join('')}</span></div></div>` +
          `<p class="nw-tip"><b>Spelling tip:</b> ${esc(w.tip)}</p>` +
          `<div class="actions"><button type="button" class="btn ${ok ? 'btn-ghost' : 'btn-primary'}" data-act="again">Try this word again</button>` +
          (S.writeI < P.words.length - 1 ? `<button type="button" class="btn ${ok ? 'btn-primary' : 'btn-ghost'}" data-act="next">Next word →</button>` : `<a class="btn btn-primary" href="#practice">Go to Practice →</a>`) +
          `</div></div></div>`;
      }
      panel.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'cover') { S.writeStep = 'write'; S.writeTyped = ''; drawWrite(); }
        if (act === 'check') {
          const typed = panel.querySelector('#lcwc-input').value;
          if (!typed.trim()) { const e = panel.querySelector('.error-box'); e.hidden = false; e.textContent = 'Type the word first.'; return; }
          S.writeTyped = typed;
          S.writeStep = 'checked';
          const written = store.get('written', {});
          const prev = written[w.word] || { tries: 0, correct: false };
          written[w.word] = { tries: prev.tries + 1, correct: prev.correct || Q.normSpell(typed) === w.word };
          store.set('written', written);
          writeView();
        }
        if (act === 'again') { S.writeStep = 'look'; S.writeTyped = ''; drawWrite(); }
        if (act === 'next') { S.writeI += 1; S.writeStep = 'look'; S.writeTyped = ''; writeView(); }
      }));
    }

    // ===== 4. Practice =====
    function practiceView() {
      main.innerHTML =
        ctx.hero(eyebrow('practice'), 'Guided practice', 'Different kinds of spelling practice. Hints and second tries are allowed.') +
        `<section class="card" id="nw-practice">${head('A', 'Practice round', 'together')}` +
        (S.focus && S.focus.length
          ? `<p class="parent-tip"><b>Practicing missed words:</b> ${S.focus.map(esc).join(', ')}. <button type="button" class="btn btn-small" id="practice-all">Practice all words instead</button></p>`
          : `<p class="muted">${P.practiceSize} questions: write the word, choose the right spelling, and fill in a missing letter.</p>`) +
        `<div id="practice-runner"></div>` +
        `<div class="actions"><button type="button" class="btn btn-small" id="practice-new">New practice round</button></div></section>` +
        ctx.navButtons('practice');
      const run = () => shell.guidedRunner(main.querySelector('#practice-runner'), {
        items: S.practice, states: S.practiceStates, pos: S.practicePos, keyPrefix: 'nwp',
        lastLabel: 'New round', onLast: () => newRound(S.focus)
      });
      const newRound = (focus) => {
        S.focus = focus;
        S.practice = NW.practiceRound(P, shell.newSeed(), focus);
        S.practiceStates = {};
        S.practicePos.i = 0;
        practiceView();
      };
      main.querySelector('#practice-new').addEventListener('click', () => newRound(S.focus));
      const all = main.querySelector('#practice-all');
      if (all) all.addEventListener('click', () => newRound(null));
      run();
    }

    // ===== 5. Spelling test =====
    function testView() {
      if (S.pendingStart) { S.pendingStart = false; beginTest(); }
      if (S.activeTest) return runTest();
      const attempts = store.get('attempts', []);
      const last = attempts[attempts.length - 1];
      const draft = store.get('draft', null);
      main.innerHTML =
        ctx.hero(eyebrow('test'), 'Spelling test', `${P.testSize} words. Type each word in full.`) +
        `<section class="card card-parent">${head('', 'Before you start', 'parent')}<ul class="rules">` +
        `<li>Each question shows a number or a ten-frame. Your child types the number word.</li>` +
        `<li>No hints, and no answers are shown until the test is submitted.</li>` +
        `<li>Capital letters and extra spaces don't matter. Every letter does.</li>` +
        `<li>There are ${P.words.length} words and ${P.testSize} questions, so one word sits out each time. It is always tested on the next attempt.</li>` +
        `<li>Mastery: ${P.masteryScore} or more correct out of ${P.testSize}.</li></ul></section>` +
        `<div class="card test-card"><h2>Phase ${P.id} spelling test</h2>` +
        (last ? `<p class="test-last">Last score: <b>${last.score}/${last.total}</b> <span class="badge-m ${mastered(last.score) ? 'm-mastered' : 'm-review'}">${mastered(last.score) ? 'Mastered' : 'Keep practicing'}</span></p>` : '<p class="test-last muted">Not taken yet.</p>') +
        (draft ? `<p class="test-last"><b>Unfinished:</b> ${Object.values(draft.responses || {}).filter((r) => String(r).trim()).length} of ${draft.questions.length} answered so far.</p>` : '') +
        `<button type="button" class="btn btn-primary" data-start>${draft ? 'Resume test' : last ? 'Take a new test' : 'Start test'}</button></div>` +
        ctx.navButtons('test');
      main.querySelector('[data-start]').addEventListener('click', () => { beginTest(); runTest(); root.scrollTo(0, 0); });
    }

    function beginTest() {
      let draft = store.get('draft', null);
      if (!draft) {
        const seed = shell.newSeed();
        const t = NW.spellingTest(P, seed, store.get('attempts', []));
        draft = { seed, questions: t.questions, omitted: t.omitted, assessed: t.assessed, responses: {}, started: new Date().toISOString() };
        store.set('draft', draft);
      }
      S.activeTest = draft;
    }

    function runTest() {
      const D = S.activeTest;
      shell.testRunner(ctx, {
        store, draftKey: 'draft', draft: D, title: `Phase ${P.id} spelling test`, eyebrow: eyebrow('test'),
        attemptNumber: store.get('attempts', []).length + 1,
        onExit() { S.activeTest = null; testView(); root.scrollTo(0, 0); },
        onSubmit(draft, correct) {
          const score = correct.filter(Boolean).length;
          const attempt = {
            id: Date.now(), date: new Date().toISOString(), seed: draft.seed, questions: draft.questions, responses: draft.responses,
            correct, score, total: draft.questions.length, assessed: draft.assessed, omitted: draft.omitted,
            missed: draft.questions.filter((q, i) => !correct[i]).map((q) => q.answer), pauses: Math.max(0, (draft.sessions || 1) - 1)
          };
          const all = store.get('attempts', []);
          all.push(attempt);
          store.set('attempts', all);
          S.activeTest = null;
          S.view = attempt.id;
          ctx.go('results');
        }
      });
    }

    // ===== 6. Results =====
    function resultsView() {
      const attempts = store.get('attempts', []);
      const top = ctx.hero(eyebrow('results'), 'Spelling results', 'Which words are mastered, and which to practice again.');
      const notice = `<section class="card card-notice">${head('', 'About saved progress', 'parent')}` +
        `<p>Number Words progress is saved only in this browser on this device, separately from Lesson 2-1. It does not sync to other devices, and nothing is sent anywhere.</p>` +
        (store.works() ? '' : `<p class="warn-text">This browser is not allowing saved data right now. Results will disappear when the page closes.</p>`) +
        `<div id="clear-area"><button type="button" class="btn btn-ghost" id="clear">Clear saved Number Words Phase ${P.id} progress…</button></div></section>`;
      const said = Object.values(store.get('said', {})).filter(Boolean).length;
      const written = Object.values(store.get('written', {})).filter((x) => x.correct).length;
      const progress = `<section class="card">${head('', 'Practice progress', 'parent')}` +
        `<p>Said and spelled aloud: <b>${said} of ${P.words.length}</b> · Written from memory: <b>${written} of ${P.words.length}</b></p></section>`;

      if (!attempts.length) {
        main.innerHTML = top + `<section class="card"><h2>No spelling test results yet</h2><p>Take the spelling test and the results will appear here.</p>` +
          `<a class="btn btn-primary" href="#test">Go to the test →</a></section>` + progress + notice + ctx.navButtons('results');
        shell.bindClear(main, store, `Number Words Phase ${P.id} progress`, () => resultsView());
        return;
      }
      const a = attempts.find((x) => x.id === S.view) || attempts[attempts.length - 1];
      const ok = mastered(a.score);
      const missedRows = a.questions.map((q, i) => ({ q, i })).filter((x) => !a.correct[x.i]).map((x) => {
        const w = P.words.find((y) => y.word === x.q.answer);
        const cmp = NW.compareLetters(a.responses[x.q.id], w.word);
        return `<li class="rq rq-no"><p class="rq-prompt"><span class="rq-mark" aria-hidden="true">✗</span><span><span class="sr-only">Incorrect. </span>Question ${x.i + 1}: the word for ${w.n}</span></p>` +
          `<div class="compare"><div class="compare-row"><b>You wrote:</b><span class="compare-letters">${cmp.map((c) => `<span class="${c.ok ? 'is-right' : 'is-wrong'}">${esc(c.ch)}</span>`).join('')}</span></div>` +
          `<div class="compare-row"><b>Correct:</b><span class="compare-letters">${w.word.split('').map((ch) => `<span class="is-right">${esc(ch)}</span>`).join('')}</span></div></div>` +
          `<p><b>Why:</b> ${esc(x.q.explanation)}</p></li>`;
      }).join('');
      const rightWords = a.questions.filter((q, i) => a.correct[i]).map((q) => q.answer);
      const history = attempts.slice().reverse().map((x) => `<tr${x.id === a.id ? ' class="is-on"' : ''}><td>${esc(shell.formatDate(x.date))}</td><td>${x.score}/${x.total}</td>` +
        `<td><span class="badge-m ${mastered(x.score) ? 'm-mastered' : 'm-review'}">${mastered(x.score) ? 'Mastered' : 'Keep practicing'}</span></td>` +
        `<td>${x.missed.length ? x.missed.map(esc).join(', ') : '—'}</td><td><button type="button" class="btn btn-small btn-ghost" data-view="${x.id}">View</button></td></tr>`).join('');

      main.innerHTML = top +
        `<section class="card result-detail" id="detail"><h2>Spelling test <span class="muted">· ${esc(shell.formatDate(a.date))}</span></h2>` +
        `<div class="score-row"><p class="score-big">${a.score}<span>/${a.total}</span></p><p class="score-pct">${Math.round(a.score / a.total * 100)}%</p>` +
        `<p class="badge-m badge-big ${ok ? 'm-mastered' : 'm-review'}">${ok ? 'Mastered' : 'Keep practicing'}</p></div>` +
        `<p class="advice"><b>Next step:</b> ${ok ? `Phase ${P.id} is mastered. Keep reviewing any missed word below.` : `Practice the missed words, then take a new test. Mastery is ${P.masteryScore} or more out of ${P.testSize}.`}</p>` +
        (a.pauses ? `<p class="muted">This test was paused and resumed ${a.pauses} time${a.pauses === 1 ? '' : 's'}.</p>` : '') +
        `<h3>Words tested this time (${a.assessed.length})</h3><ul class="word-list">${a.assessed.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>` +
        (a.omitted.length ? `<p class="muted">Not tested this time: <b>${a.omitted.map(esc).join(', ')}</b> — it will be tested on the next attempt.</p>` : '') +
        (a.missed.length ? `<h3>Words to practice (${a.missed.length})</h3><ol class="rq-list">${missedRows}</ol>` : '<p><b>Every word was spelled correctly.</b></p>') +
        (rightWords.length ? `<details class="rq-right"><summary>Spelled correctly (${rightWords.length})</summary><ul class="word-list">${rightWords.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></details>` : '') +
        `<div class="actions">${a.missed.length ? `<button type="button" class="btn btn-primary" data-practice-missed>Practice missed words</button>` : ''}` +
        `<button type="button" class="btn ${a.missed.length ? 'btn-ghost' : 'btn-primary'}" data-retake>Take another test</button></div></section>` +
        `<section class="card">${head('', 'Attempt history', '')}<div class="table-wrap"><table class="history"><thead><tr><th>Date</th><th>Score</th><th>Result</th><th>Missed</th><th><span class="sr-only">View</span></th></tr></thead><tbody>${history}</tbody></table></div></section>` +
        progress + notice + ctx.navButtons('results');

      main.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => { S.view = Number(b.dataset.view); resultsView(); main.querySelector('#detail').scrollIntoView({ block: 'start' }); }));
      const pm = main.querySelector('[data-practice-missed]');
      if (pm) pm.addEventListener('click', () => {
        S.focus = a.missed.slice();
        S.practice = NW.practiceRound(P, shell.newSeed(), S.focus);
        S.practiceStates = {};
        S.practicePos.i = 0;
        ctx.go('practice');
      });
      main.querySelector('[data-retake]').addEventListener('click', () => { S.pendingStart = true; ctx.go('test'); });
      shell.bindClear(main, store, `Number Words Phase ${P.id} progress`, () => { S.view = null; resultsView(); });
    }

    ctx.render();
  }

  MB.numberWords.startPhase = start;
})(window);
