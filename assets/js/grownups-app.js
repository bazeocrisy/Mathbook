/*
 * For Grown-Ups: one page for the parent — continue learning, progress and scores (first try vs. after a retry),
 * missed skills with suggested review, assessment history, the teaching guide, and Clear Progress.
 * Reads the same browser storage the child pages write. Nothing is sent anywhere.
 */
(function (root) {
  'use strict';
  const MB = root.Mathbook;
  const pv = MB.pv;
  const Q = MB.Q;
  const shell = MB.shell;
  const esc = Q.esc;

  const L = MB.lessons['2-1'];
  const P = MB.numberWords.program.phases.find((p) => p.id === '1');
  const lessonStore = shell.makeStore(L.storageKey);
  const nwStore = shell.makeStore(P.storageKey);
  const LESSON_PATH = 'curriculum/chapter-2/lesson-2-1/';
  const NW_PATH = 'number-words/phase-1/';

  function band(pct) {
    if (pct >= 90) return { key: 'mastered', label: 'Mastered', advice: 'Ready to move on.' };
    if (pct >= 70) return { key: 'review', label: 'Review missed skills', advice: 'Practice the missed skills below, then move on.' };
    return { key: 'reteach', label: 'Reteach and reassess', advice: 'Reteach with Learn, practice the skills below, then take a new test (new numbers every time).' };
  }
  const tag = (b) => `<span class="tag-m ${b.key}">${esc(b.label)}</span>`;
  const firstOf = (a) => a.first || a.correct || [];
  const finalOf = (a) => a.final || a.correct || [];

  /** The practice set with the most questions on a skill. */
  function setFor(skill) {
    let best = null;
    let most = 0;
    L.bankSets.forEach((s, i) => {
      const n = s.ids.filter((id) => L.bank.find((q) => q.id === id).skill === skill).length;
      if (n > most) { most = n; best = { set: s, n: i + 1 }; }
    });
    return best;
  }

  function attemptDetail(a) {
    const missed = a.questions.map((q, i) => ({ q, i })).filter((x) => !a.correct[x.i]);
    if (!missed.length) return '<p>Every question was correct.</p>';
    return `<ol class="rq-list">` + missed.map(({ q, i }) => `<li class="rq"><p class="rq-prompt">Question ${i + 1}: ${esc(q.prompt.replace('___', '_____'))}</p>${Q.visuals(q)}` +
      `<p><b>Answer given:</b> ${esc(Q.describe(q, a.responses[q.id]))}</p><p><b>Correct answer:</b> ${esc(Q.correctText(q))}</p>` +
      `<p><b>Why:</b> ${esc(q.explanation)}</p><p class="muted">Skill: ${esc(L.skills[q.skill] || q.skill)}</p></li>`).join('') + `</ol>`;
  }

  function continueSection() {
    const items = [];
    const act = shell.readActivity();
    if (act && act.path) items.push(`<li><a class="gu-btn" href="../${esc(act.path)}">Continue: ${esc(act.title)}${act.step ? ' · ' + esc(act.step) : ''}</a></li>`);
    Object.keys(L.tests).forEach((id) => {
      const d = lessonStore.get('draft-' + id, null);
      if (d && d.questions) items.push(`<li><a class="gu-btn" href="../${LESSON_PATH}#test/${id}">Resume unfinished ${esc(L.tests[id].title)} (${d.questions.filter((q) => Q.isAnswered(q, d.responses[q.id])).length} of ${d.questions.length} answered)</a></li>`);
    });
    const nd = nwStore.get('draft', null);
    if (nd && nd.questions) items.push(`<li><a class="gu-btn" href="../${NW_PATH}#test">Resume unfinished Spelling Test (${nd.questions.filter((q) => Q.isAnswered(q, nd.responses[q.id])).length} of ${nd.questions.length} answered)</a></li>`);
    return `<section class="gu-section" id="continue"><h2>Continue learning</h2>` +
      (items.length ? `<ul class="continue-list">${items.join('')}</ul>` : `<p class="empty-note">No saved progress yet in this browser.</p>`) + `</section>`;
  }

  function lessonSection() {
    const attempts = lessonStore.get('attempts', []);
    const bank = lessonStore.get('bank-sets', {});
    // Tests: latest of each
    const latest = Object.keys(L.tests).map((id) => {
      const a = attempts.filter((x) => x.testId === id).pop();
      return `<tr><td>${esc(L.tests[id].title)}</td>${a ? `<td class="num">${a.score}/${a.total} (${a.pct}%)</td><td>${tag(band(a.pct))}</td><td>${esc(shell.formatDate(a.date))}</td>` : '<td colspan="3" class="muted">Not taken yet</td>'}</tr>`;
    }).join('');
    // Missed skills from the latest attempt of each test
    const missedSkills = {};
    Object.keys(L.tests).forEach((id) => {
      const a = attempts.filter((x) => x.testId === id).pop();
      if (a) a.questions.forEach((q, i) => { if (!a.correct[i]) missedSkills[q.skill] = (missedSkills[q.skill] || 0) + 1; });
    });
    const skillRows = Object.keys(missedSkills).map((s) => {
      const target = setFor(s);
      const suggest = target ? `<a href="../${LESSON_PATH}#set/${target.set.id}">Practice Set ${target.n}: ${esc(target.set.title)}</a>`
        : `<a href="../${LESSON_PATH}#words">Words to Know</a> and <a href="../${LESSON_PATH}#word-practice">word practice</a>`;
      return `<tr><td>${esc(L.skills[s] || s)}</td><td class="num">${missedSkills[s]}</td><td>${suggest}</td></tr>`;
    }).join('');
    // Practice sets
    const setRows = L.bankSets.map((s, i) => {
      const st = bank[s.id] || { attempts: [], retries: [] };
      const last = st.attempts[st.attempts.length - 1];
      if (!last) return `<tr><td>Set ${i + 1}: ${esc(s.title)}</td><td colspan="4" class="muted">${st.active && !st.active.finished ? 'In progress' : 'Not started'}</td></tr>`;
      const first = firstOf(last).filter(Boolean).length;
      const fin = finalOf(last).filter(Boolean).length;
      const misses = last.order.filter((qid, k) => !firstOf(last)[k]);
      const fixed = new Set();
      st.retries.filter((r) => r.parentId === last.id).forEach((r) => r.order.forEach((qid, k) => { if (firstOf(r)[k]) fixed.add(qid); }));
      const best = Math.max(...st.attempts.map((a) => firstOf(a).filter(Boolean).length));
      return `<tr><td>Set ${i + 1}: ${esc(s.title)}</td><td class="num">${first}/${last.total}</td><td class="num">${fin}/${last.total}</td><td class="num">${best}/${last.total}</td>` +
        `<td class="num">${misses.length ? `${misses.filter((q) => fixed.has(q)).length} of ${misses.length}` : '—'}</td></tr>`;
    }).join('');
    const history = attempts.slice().reverse().map((a) => `<details class="gu-detail"><summary>${esc(shell.formatDate(a.date))} · ${esc(a.title)} · ${a.score}/${a.total} (${a.pct}%) · ${esc(band(a.pct).label)}${a.pauses ? ` · paused ${a.pauses}×` : ''}</summary>${attemptDetail(a)}</details>`).join('');

    return `<section class="gu-section" id="lesson"><h2>Lesson ${esc(L.number)}: ${esc(L.title)}</h2>` +
      `<h3>Tests (latest)</h3><div class="table-wrap"><table class="data"><thead><tr><th>Test</th><th>Score</th><th>Result</th><th>Date</th></tr></thead><tbody>${latest}</tbody></table></div>` +
      `<p class="muted">Mastered: 90–100% · Review missed skills: 70–89% · Reteach and reassess: below 70%</p>` +
      `<h3>Missed skills and suggested review</h3>` +
      (skillRows ? `<div class="table-wrap"><table class="data"><thead><tr><th>Skill</th><th>Missed</th><th>Suggested review</th></tr></thead><tbody>${skillRows}</tbody></table></div>` : `<p class="empty-note">Nothing to review yet.</p>`) +
      `<h3>Practice sets</h3><p class="muted">First try: right before any clue. After retry: right after the one Try Again. Misses fixed: first-try misses later answered right on the first try in Practice My Misses.</p>` +
      `<div class="table-wrap"><table class="data"><thead><tr><th>Set</th><th>First try (last)</th><th>After retry (last)</th><th>Best first try</th><th>Misses fixed</th></tr></thead><tbody>${setRows}</tbody></table></div>` +
      `<h3>Assessment history</h3>${history || '<p class="empty-note">No tests taken yet.</p>'}</section>`;
  }

  function wordsSection() {
    const said = Object.values(nwStore.get('said', {})).filter(Boolean).length;
    const written = Object.values(nwStore.get('written', {})).filter((x) => x.correct).length;
    const attempts = nwStore.get('attempts', []);
    const last = attempts[attempts.length - 1];
    const rows = attempts.slice().reverse().map((a) => `<tr><td>${esc(shell.formatDate(a.date))}</td><td class="num">${a.score}/${a.total}</td>` +
      `<td>${a.score >= P.masteryScore ? '<span class="tag-m mastered">Mastered</span>' : '<span class="tag-m review">Keep practicing</span>'}</td>` +
      `<td>${a.missed.length ? a.missed.map(esc).join(', ') : '—'}</td><td>${(a.omitted || []).map(esc).join(', ') || '—'}</td></tr>`).join('');
    return `<section class="gu-section" id="words"><h2>Number Words: ${P.words[0].n}–${P.words[P.words.length - 1].n}</h2>` +
      `<p>Said and spelled aloud: <b>${said} of ${P.words.length}</b> · Written from memory: <b>${written} of ${P.words.length}</b></p>` +
      (last && last.missed.length ? `<p><b>Words to practice:</b> ${last.missed.map(esc).join(', ')} — <a href="../${NW_PATH}#done">open the spelling results</a> and press "Practice the words I missed".</p>` : '') +
      `<h3>Spelling tests</h3>` +
      (rows ? `<div class="table-wrap"><table class="data"><thead><tr><th>Date</th><th>Score</th><th>Result</th><th>Missed</th><th>Not tested that time</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : `<p class="empty-note">No spelling tests yet.</p>`) +
      `<p class="muted">Mastery is ${P.masteryScore} or more out of ${P.testSize}. There are ${P.words.length} words and ${P.testSize} questions, so one word sits out each test and is always tested the next time.</p></section>`;
  }

  function guideSection() {
    const ex = L.seeIt.examples[0];
    const d = pv.digitsOf(ex);
    const asks = pv.PLACES.map((p, i) => (d[i] ? `"What is the ${d[i]} worth?" (${pv.fmt(d[i] * p.value)})` : `"Why do we still write the 0?"`));
    return `<section class="gu-section" id="guide"><h2>Teaching guide</h2>` +
      `<h3>Lesson ${esc(L.number)}: what your child will learn</h3><p><b>${esc(L.objective)}</b></p><ul class="gu-list">${L.targets.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` +
      `<h3>How the lesson works</h3><ol class="gu-list"><li><b>Learn</b>: the big ideas and worked examples, one page at a time.</li><li><b>Words to Know</b>: one word per card, then word practice.</li>` +
      `<li><b>Practice</b>: Practice Together (with you), then five sets of 10. Each question: Check Answer, one Try Again with a clue, then the answer and explanation. Practice My Misses retries the first-try misses.</li>` +
      `<li><b>Show What You Know</b>: Vocabulary Test and Math Test, 10 questions each, one at a time, no hints or feedback until the end.</li></ol>` +
      `<h3>Parent guide</h3><div class="guide-grid">${L.parentGuide.map((g) => `<div class="guide-card"><h4>${esc(g.q)}</h4><ul>${g.a.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('')}</div>` +
      `<h3>Teaching script (about 10–15 minutes)</h3><ol class="script">${L.script.map((s) => `<li><dl><div><dt>Show</dt><dd>${esc(s.show)}</dd></div><div><dt>Say</dt><dd>${esc(s.say)}</dd></div><div><dt>Ask</dt><dd>${esc(s.ask)} <span class="muted">Listen for: ${esc(s.listen)}</span></dd></div></dl></li>`).join('')}</ol>` +
      `<h3>Watch for these mistakes</h3><ul class="gu-list">${L.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` +
      `<h3>During Learn: questions to ask (example ${pv.fmt(ex)})</h3><ul class="gu-list"><li>"Which digit do you think is worth the most? Why?"</li>${asks.map((a) => `<li>${esc(a)}</li>`).join('')}<li>"Does ${esc(pv.expandedForm(ex))} make ${pv.fmt(ex)}?"</li></ul>` +
      `<h3>Practice Together: what to say</h3><ol class="gu-list">${L.guided.map((g) => `<li><b>${esc(g.prompt)}</b> ${esc(g.parent || '')}${g.listenFor ? ` <span class="muted">Listen for: ${g.listenFor.map(esc).join(' ')}</span>` : ''}</li>`).join('')}</ol>` +
      `<h3>Number Words: how to use each step</h3><ul class="gu-list"><li><b>Learn the Words</b>: point to the numeral, then the word; say each letter; read the tip together.</li>` +
      `<li><b>Say Them</b>: your child says the word, then spells it aloud; they press "I said it" when done.</li>` +
      `<li><b>Cover and Write</b>: let your child decide when to cover the word; after checking, point to any different letter and look again.</li>` +
      `<li><b>Spelling Test</b>: ${P.testSize} typed words, no clues. Capital letters and extra spaces don't matter; every letter does.</li></ul>` +
      `<p class="muted">${esc(MB.numberWords.program.convention)}</p></section>`;
  }

  function clearSection() {
    return `<section class="gu-section" id="clear"><h2>Saved progress</h2>` +
      `<p>Progress and results are saved only in this browser on this device. They do not sync to other devices or browsers, and Mathbook does not collect names or send results anywhere.</p>` +
      (lessonStore.works() ? '' : '<p class="msg msg-wrong">This browser is not allowing saved data right now (for example, a private window).</p>') +
      `<div class="actions" style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="gu-btn danger" data-clear="lesson">Clear Lesson ${esc(L.number)} progress…</button>` +
      `<button type="button" class="gu-btn danger" data-clear="words">Clear Number Words progress…</button></div><div id="clear-area"></div></section>`;
  }

  function render() {
    const mount = document.getElementById('mathbook');
    const page = shell.frame(mount, '../');
    page.main.classList.add('gu');
    page.main.innerHTML = `<h1 class="page-title">For Grown-Ups</h1><p class="page-sub">Progress, scores, and the teaching guide. Your child's screens stay simple.</p>` +
      `<ul class="gu-nav"><li><a href="#continue">Continue</a></li><li><a href="#lesson">Lesson ${esc(L.number)} progress</a></li><li><a href="#words">Number Words progress</a></li><li><a href="#guide">Teaching guide</a></li><li><a href="#clear">Clear progress</a></li></ul>` +
      continueSection() + lessonSection() + wordsSection() + guideSection() + clearSection();
    page.main.querySelectorAll('[data-clear]').forEach((b) => b.addEventListener('click', () => {
      const which = b.dataset.clear;
      const area = page.main.querySelector('#clear-area');
      const name = which === 'lesson' ? `Lesson ${L.number}` : 'Number Words';
      area.innerHTML = `<div class="confirm" role="alert"><p><b>Delete all saved ${esc(name)} progress on this device?</b> This cannot be undone. Nothing else is affected.</p>` +
        `<div class="actions"><button type="button" class="btn btn-danger" id="clear-yes">Yes, delete</button><button type="button" class="btn btn-back" id="clear-no">Cancel</button></div></div>`;
      area.querySelector('#clear-yes').focus();
      area.querySelector('#clear-yes').addEventListener('click', () => { (which === 'lesson' ? lessonStore : nwStore).clearAll(); render(); document.getElementById('clear').scrollIntoView(); });
      area.querySelector('#clear-no').addEventListener('click', () => { area.innerHTML = ''; b.focus(); });
    }));
  }

  render();
})(window);
