/*
 * Number Words (child view): a simple menu and one word or question at a time.
 *   #          menu: Learn the Words · Say Them · Cover and Write · Practice · Spelling Test
 *   #learn  #say  #write  #practice  #test  #done
 * Words, tips, and sizes come from number-words/program.js; logic from assets/js/number-words.js.
 * Progress is stored in this browser only, separately from Lesson 2-1. Grown-up details are on grown-ups/.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const shell = MB.shell;
  const NW = MB.numberWords;
  const esc = Q.esc;

  const ICON = {
    learn: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="8" width="36" height="32" rx="6" fill="#fff" stroke="#6b4fd8" stroke-width="2.5"/><text x="24" y="31" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="18" fill="#24305e">7</text></svg>',
    say: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10 h32 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-18 l-9 8 v-8 h-5 a4 4 0 0 1 -4 -4 v-16 a4 4 0 0 1 4 -4z" fill="#efe9ff" stroke="#6b4fd8" stroke-width="2.5"/></svg>',
    write: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 38 l4 -12 20 -20 8 8 -20 20z" fill="#ffde85" stroke="#9a7000" stroke-width="2.5" stroke-linejoin="round"/><path d="M10 38 l12 -4" stroke="#9a7000" stroke-width="2.5"/></svg>',
    practice: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="6" width="32" height="36" rx="6" fill="#fff" stroke="#6b4fd8" stroke-width="2.5"/><path d="M15 18 l4 4 8 -9 M15 31 l4 4 8 -9" stroke="#1f8a52" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
    test: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4 l6 13 14 2 -10 10 2 14 -12 -7 -12 7 2 -14 -10 -10 14 -2z" fill="#ffc93c" stroke="#b88700" stroke-width="2" stroke-linejoin="round"/></svg>'
  };

  function menuBtn(href, icon, title, sub, extra) {
    return `<a class="menu-btn violet" href="${href}"><span class="icon">${icon}</span><span><b>${esc(title)}</b><span class="sub">${esc(sub)}</span>${extra && extra.text ? `<span class="done-text">${esc(extra.text)}</span>` : ''}</span>${extra && extra.star ? '<span class="done" aria-label="Done">★</span>' : ''}</a>`;
  }

  function tiles(word) {
    return `<div class="letter-word" aria-hidden="true">${word.split('').map((ch) => `<span class="letter-tile">${esc(ch)}</span>`).join('')}</div>`;
  }

  function start(phaseId, opts) {
    opts = opts || {};
    const P = NW.program.phases.find((p) => p.id === phaseId);
    if (!P || P.status !== 'ready') throw new Error('Number Words phase not available: ' + phaseId);
    NW.current = P;
    const store = shell.makeStore(P.storageKey);
    const page = shell.frame(document.getElementById(opts.mount || 'mathbook'), opts.homeHref || './');
    const main = page.main;
    const range = `${P.words[0].n} to ${P.words[P.words.length - 1].n}`;
    const S = {
      learnI: 0, sayI: 0, writeI: null, writeStep: 'look', writeTyped: '',
      practice: NW.practiceRound(P, shell.newSeed(), null), practiceRun: { pos: 0, items: {} }, focus: null
    };
    document.title = `Number Words ${range} · Mathbook`;
    const back = () => page.setBack('Number Words', '#');

    const R = shell.router((route) => {
      const views = { '': menuView, learn: learnView, say: sayView, write: writeView, practice: practiceView, test: testView, done: doneView };
      (views[route] || menuView)();
      const labels = { '': 'Menu', learn: 'Learn the Words', say: 'Say Them', write: 'Cover and Write', practice: 'Practice', test: 'Spelling Test', done: 'Spelling Test' };
      shell.recordActivity({ path: (opts.path || '') + '#' + route, title: `Number Words ${range}`, step: labels[route] || '' });
      shell.focusTitle(main);
    });

    // ===== Menu =====
    function menuView() {
      page.setBack('All Number Words', opts.programHref || '../');
      const said = Object.values(store.get('said', {})).filter(Boolean).length;
      const written = Object.values(store.get('written', {})).filter((x) => x.correct).length;
      const tests = store.get('attempts', []);
      const mastered = tests.some((a) => a.score >= P.masteryScore);
      const draft = store.get('draft', null);
      main.innerHTML = `<h1 class="page-title">Number Words: ${esc(range)}</h1><p class="page-sub">Read it, say it, spell it, write it.</p>` +
        `<nav class="menu" aria-label="Number Words activities">` +
        menuBtn('#learn', ICON.learn, 'Learn the Words', `See and study ${P.words.length} words`) +
        menuBtn('#say', ICON.say, 'Say Them', 'Say and spell each word out loud', said ? { text: `${said} of ${P.words.length} said`, star: said === P.words.length } : null) +
        menuBtn('#write', ICON.write, 'Cover and Write', 'Look, cover, write, and check', written ? { text: `${written} of ${P.words.length} written`, star: written === P.words.length } : null) +
        menuBtn('#practice', ICON.practice, 'Practice', 'Spelling practice with clues') +
        menuBtn('#test', ICON.test, 'Spelling Test', `${P.testSize} words, no clues`, draft ? { text: 'Keep going' } : mastered ? { text: 'Mastered', star: true } : tests.length ? { text: 'Done' } : null) +
        `</nav>`;
    }

    function wordCard(w, showTip) {
      return `<div class="nw-row"><span class="numeral-card">${w.n}</span>${pv.tenFrameSVG(w.n)}</div>` +
        `<p class="nw-big-word">${esc(w.word)}</p>${tiles(w.word)}` +
        `<p class="say-big" style="text-align:center"><span class="sr-only">Spelled </span>${esc(NW.letters(w.word))} · ${w.word.length} letters</p>` +
        (showTip ? `<p class="nw-tip"><b>Tip:</b> ${esc(w.tip)}</p>` : '');
    }

    function pager(title, i, n, label) {
      return `<div class="activity-head"><h1>${esc(title)}</h1>${shell.dotsHTML(n, i, () => '', label)}</div>`;
    }

    // ===== Learn =====
    function learnView() {
      back();
      const i = S.learnI;
      const w = P.words[i];
      const last = i === P.words.length - 1;
      main.innerHTML = pager('Learn the Words', i, P.words.length, `Word ${i + 1} of ${P.words.length}`) +
        `<section class="qcard">${wordCard(w, true)}</section>` +
        `<div class="controls">${i > 0 ? '<button type="button" class="btn btn-back" data-act="prev">← Previous</button>' : '<span class="spacer"></span>'}` +
        (last ? '<a class="btn btn-main" href="#say">Next: Say Them →</a>' : '<button type="button" class="btn btn-main" data-act="next">Next →</button>') + `</div>`;
      main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => { S.learnI += b.dataset.act === 'next' ? 1 : -1; learnView(); shell.focusTitle(main); }));
    }

    // ===== Say =====
    function sayView() {
      back();
      const i = S.sayI;
      const w = P.words[i];
      const said = store.get('said', {});
      const last = i === P.words.length - 1;
      main.innerHTML = pager('Say Them', i, P.words.length, `Word ${i + 1} of ${P.words.length}`) +
        `<section class="qcard">${wordCard(w, false)}<p class="say-big" style="text-align:center">Say <b>${esc(w.word)}</b>. Then spell it out loud: ${esc(w.word.split('').join(', '))}.</p>` +
        (said[w.word] ? `<p class="msg msg-right" style="text-align:center">You said it! ✓</p>` : '') + `</section>` +
        `<div class="controls">${i > 0 ? '<button type="button" class="btn btn-back" data-act="prev">← Previous</button>' : '<span class="spacer"></span>'}` +
        (said[w.word]
          ? (last ? '<a class="btn btn-main" href="#write">Next: Cover and Write →</a>' : '<button type="button" class="btn btn-main" data-act="next">Next →</button>')
          : '<button type="button" class="btn btn-main" data-act="said">I said it and spelled it!</button>') + `</div>`;
      main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        if (b.dataset.act === 'said') { const s = store.get('said', {}); s[w.word] = true; store.set('said', s); sayView(); main.querySelector('[data-act="next"], a.btn-main').focus(); return; }
        S.sayI += b.dataset.act === 'next' ? 1 : -1;
        sayView();
        shell.focusTitle(main);
      }));
    }

    // ===== Look, Cover, Write, Check =====
    function writeView() {
      back();
      const written = store.get('written', {});
      if (S.writeI === null) {
        const next = P.words.findIndex((x) => !(written[x.word] && written[x.word].correct));
        S.writeI = next === -1 ? 0 : next;
      }
      const i = S.writeI;
      const w = P.words[i];
      const last = i === P.words.length - 1;
      const head = pager('Cover and Write', i, P.words.length, `Word ${i + 1} of ${P.words.length}`);
      const visual = `<div class="nw-row"><span class="numeral-card">${w.n}</span>${pv.tenFrameSVG(w.n)}</div>`;
      const prev = i > 0 ? '<button type="button" class="btn btn-back" data-act="prev">← Previous</button>' : '<span class="spacer"></span>';
      if (S.writeStep === 'look') {
        main.innerHTML = head + `<section class="qcard">${visual}<p class="nw-big-word">${esc(w.word)}</p>${tiles(w.word)}<p class="say-big" style="text-align:center">Look at the word. Say each letter. When you are ready, cover it.</p></section>` +
          `<div class="controls">${prev}<button type="button" class="btn btn-main" data-act="cover">Cover the word</button></div>`;
      } else if (S.writeStep === 'write') {
        // The word is removed from the page (not just hidden) while the child writes.
        main.innerHTML = head + `<section class="qcard">${visual}<div class="nw-cover">The word is covered. Write it from memory.</div>` +
          `<p><label class="q-prompt" for="lcwc-input">Write the word for ${w.n}:</label></p>` +
          `<input id="lcwc-input" class="q-input q-input-wide" type="text" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">` +
          `<p class="msg msg-info" data-empty hidden>Type the word first.</p></section>` +
          `<div class="controls">${prev}<button type="button" class="btn btn-main" data-act="check">Check Answer</button></div>`;
        const input = main.querySelector('#lcwc-input');
        input.focus();
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') main.querySelector('[data-act=check]').click(); });
      } else {
        const ok = Q.normSpell(S.writeTyped) === w.word;
        const cmp = NW.compareLetters(S.writeTyped, w.word);
        main.innerHTML = head + `<section class="qcard">${visual}` +
          `<p class="msg ${ok ? 'msg-right' : 'msg-wrong'}" role="status">${ok ? `Yes! ${esc(w.word)} is spelled ${esc(NW.letters(w.word))}.` : 'Not quite. Look at the letters.'}</p>` +
          `<div class="compare"><div class="compare-row"><b>You wrote:</b><span class="compare-letters">${cmp.map((c) => `<span class="${c.ok ? 'is-right' : 'is-wrong'}">${esc(c.ch)}</span>`).join('')}</span></div>` +
          `<div class="compare-row"><b>The word:</b><span class="compare-letters">${w.word.split('').map((ch) => `<span>${esc(ch)}</span>`).join('')}</span></div></div>` +
          `<p class="nw-tip"><b>Tip:</b> ${esc(w.tip)}</p></section>` +
          `<div class="controls">${ok ? prev : '<span class="spacer"></span>'}` +
          (ok ? (last ? '<a class="btn btn-main" href="#practice">Next: Practice →</a>' : '<button type="button" class="btn btn-main" data-act="next">Next word →</button>')
            : `<button type="button" class="btn btn-try" data-act="again">Try Again</button>`) + `</div>` +
          (ok ? '' : `<p style="text-align:center"><button type="button" class="btn btn-quiet" data-act="skip">Go to the next word</button></p>`);
      }
      main.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const act = b.dataset.act;
        if (act === 'cover') { S.writeStep = 'write'; S.writeTyped = ''; writeView(); return; }
        if (act === 'check') {
          const typed = main.querySelector('#lcwc-input').value;
          if (!typed.trim()) { main.querySelector('[data-empty]').hidden = false; return; }
          S.writeTyped = typed;
          S.writeStep = 'checked';
          const all = store.get('written', {});
          const prevRec = all[w.word] || { tries: 0, correct: false };
          all[w.word] = { tries: prevRec.tries + 1, correct: prevRec.correct || Q.normSpell(typed) === w.word };
          store.set('written', all);
          writeView();
          const m = main.querySelector('.controls .btn-main, .controls .btn-try');
          if (m) m.focus();
          return;
        }
        if (act === 'again') { S.writeStep = 'look'; S.writeTyped = ''; writeView(); return; }
        if (act === 'prev') S.writeI = Math.max(0, i - 1);
        if (act === 'next' || act === 'skip') S.writeI = Math.min(P.words.length - 1, i + 1);
        S.writeStep = 'look';
        S.writeTyped = '';
        writeView();
        shell.focusTitle(main);
      }));
    }

    // ===== Practice =====
    function practiceView() {
      back();
      const title = S.focus && S.focus.length ? `Practice: ${S.focus.join(', ')}` : 'Practice';
      shell.stepRunner({
        main, title, items: S.practice, run: S.practiceRun, save() {}, keyPrefix: 'nwp', finishLabel: 'Finish',
        onFinish(sum) {
          main.innerHTML = `<section class="qcard" style="text-align:center"><h1>You finished practice!</h1><p class="result-stars" aria-hidden="true">${'★'.repeat(shell.starsFor(sum.firstRight / sum.total * 100))}</p>` +
            `<p class="say-big">You got ${sum.firstRight} of ${sum.total} right on the first try.</p></section>` +
            `<div class="controls"><button type="button" class="btn btn-back" id="again">Practice again</button><a class="btn btn-main" href="#test">Spelling Test →</a></div>`;
          main.querySelector('#again').addEventListener('click', () => newRound(S.focus));
          shell.focusTitle(main);
        }
      });
    }

    function newRound(focus) {
      S.focus = focus;
      S.practice = NW.practiceRound(P, shell.newSeed(), focus);
      S.practiceRun = { pos: 0, items: {} };
      if (location.hash === '#practice') { practiceView(); shell.focusTitle(main); } else R.go('practice');
    }

    // ===== Spelling test =====
    function testView() {
      back();
      let draft = store.get('draft', null);
      if (!draft) {
        const seed = shell.newSeed();
        const t = NW.spellingTest(P, seed, store.get('attempts', []));
        draft = { seed, questions: t.questions, omitted: t.omitted, assessed: t.assessed, responses: {}, started: new Date().toISOString() };
      }
      shell.testPager({
        main, store, draftKey: 'draft', draft, title: 'Spelling Test',
        onExit() { R.go(''); },
        onSubmit(D, correct) {
          const score = correct.filter(Boolean).length;
          const all = store.get('attempts', []);
          all.push({ id: Date.now(), date: new Date().toISOString(), seed: D.seed, questions: D.questions, responses: D.responses, correct, score, total: D.questions.length,
            assessed: D.assessed, omitted: D.omitted, missed: D.questions.filter((q, i) => !correct[i]).map((q) => q.answer), pauses: Math.max(0, (D.sessions || 1) - 1) });
          store.set('attempts', all);
          R.go('done');
        }
      });
    }

    function doneView() {
      back();
      const a = store.get('attempts', []).slice(-1)[0];
      if (!a) return R.go('test');
      const ok = a.score >= P.masteryScore;
      const missedRows = a.questions.map((q, i) => ({ q, i })).filter((x) => !a.correct[x.i]).map(({ q }) => {
        const w = P.words.find((y) => y.word === q.answer);
        const cmp = NW.compareLetters(a.responses[q.id], w.word);
        return `<li class="rq"><p class="rq-prompt">The word for ${w.n}</p>` +
          `<div class="compare"><div class="compare-row"><b>You wrote:</b><span class="compare-letters">${cmp.map((c) => `<span class="${c.ok ? 'is-right' : 'is-wrong'}">${esc(c.ch)}</span>`).join('')}</span></div>` +
          `<div class="compare-row"><b>The word:</b><span class="compare-letters">${w.word.split('').map((ch) => `<span class="is-right">${esc(ch)}</span>`).join('')}</span></div></div>` +
          `<p>${esc(q.explanation)}</p></li>`;
      }).join('');
      main.innerHTML = `<section class="qcard" style="text-align:center"><h1>You finished the Spelling Test!</h1>` +
        `<p class="result-stars" aria-hidden="true">${'★'.repeat(shell.starsFor(a.score / a.total * 100))}</p><p class="result-big">${a.score} out of ${a.total}</p>` +
        `<p class="say-big">${ok ? 'Amazing spelling! You mastered these words.' : 'Good try! Let\'s practice the words you missed.'}</p></section>` +
        (a.missed.length ? `<section class="qcard"><h2 style="font-size:1.6rem">Words to practice</h2><ol class="rq-list">${missedRows}</ol></section>` : '') +
        `<div class="controls">` + (a.missed.length ? `<button type="button" class="btn btn-main" id="practice-missed">Practice the words I missed</button>` : '') +
        `<a class="btn ${a.missed.length ? 'btn-back' : 'btn-main'}" href="#">Back to Number Words</a></div>`;
      const pm = main.querySelector('#practice-missed');
      if (pm) pm.addEventListener('click', () => newRound(a.missed.slice()));
    }

    R.run();
  }

  MB.numberWords.startPhase = start;
})(window);
