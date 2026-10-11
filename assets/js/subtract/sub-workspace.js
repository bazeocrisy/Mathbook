/*
 * SubtractKit.mount(el, options): a vertical subtraction workspace with regrouping (exchanges).
 * Reusable: no host routes, lesson ids, storage keys or globals except window.SubtractKit. Needs sub-math.js first and
 * assets/css/subtract-workspace.css. Modes: 'demo' (step through the standard method), 'guided' (the child decides each
 * step), 'independent' (free regroup marks, answer, Check, hints), 'test' (marks and answer only — no Check, hints or
 * feedback), 'view' (read-only: someone's work, or a solution).
 * API, events and state format: docs/supplemental/subtract-regrouping/INTEGRATION.md.
 */
(function (root) {
  'use strict';
  const SK = (root.SubtractKit = root.SubtractKit || {});
  const M = SK.math;
  if (!M) throw new Error('SubtractKit: load sub-math.js before sub-workspace.js');
  const P = M.PLACES;
  const KEYS = ['O', 'T', 'H', 'Th'];
  let counter = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  /** Every word the component says. Hosts may replace any of them with options.text. */
  const TEXT = {
    place: (i) => P[i].name,
    working: (i) => `Working on the ${P[i].name}`,
    needsQ: (i) => `Does the ${P[i].name} column need regrouping?`,
    needsYes: (t, b) => `Yes. ${t} is less than ${b}, so you can't take ${b} away yet.`,
    needsNo: (t, b) => `No. ${t} is enough to take away ${b}.`,
    needsWrongNo: (i, t, b) => `Look again: the ${P[i].name} has ${t} and you need to take away ${b}. ${t} is less than ${b}, so you need an exchange first.`,
    needsAltYes: (i, t, b) => `You could exchange, and the value would stay the same, but you don't need to: ${t} is enough to take away ${b}. Choose No.`,
    supplierQ: 'Which place can give?',
    supplierZero: (k) => `The ${P[k].name} place has 0, so it has nothing to give. Look further left.`,
    supplierFar: (k, best) => `That could work too, but it takes more exchanges than you need. Take from the nearest place that has something: the ${P[best].name}.`,
    supplierRight: (k) => `The ${P[k].name} can only give to the place next to it, so start there.`,
    exchangeQ: (from, to) => `Exchange 1 ${P[from].one} for 10 ${P[to].name}. Write the new ${P[from].name} and the new ${P[to].name} above the top number.`,
    exchangeKept: (from, to, after) => `${M.describe(after)}. The value is still the same.`,
    exchangeNoReduce: (from) => `The ${P[from].name} must give 1 away, so it has 1 less than before.`,
    exchangeGiver: (from) => `The ${P[from].name} gives 1 away: write 1 less than it had.`,
    exchangeGetter: (to) => `The ${P[to].name} gets 10 more than it had (1 ${P[to + 1].one} = 10 ${P[to].name}).`,
    exchangeEmpty: 'Write both new values above the top number, then check.',
    digitQ: (i, t, b) => `${cap(P[i].name)}: ${t} − ${b} = ? Write the digit in the ${P[i].name} answer box.`,
    digitOriginal: (i, orig, now) => `The ${P[i].name} changed when it gave 1 away. Use ${now}, not the original ${orig}.`,
    digitSwap: (i, t, b, now) => `You can't turn it around to ${b} − ${t}. After the exchange the ${P[i].name} has ${now}: use ${now} − ${b}.`,
    digitWrong: (i, t, b) => `Look again: ${t} − ${b}.`,
    digitEmpty: 'Write one digit in the answer box, then check.',
    guidedDone: (top, bottom, ans) => `You did it! ${M.fmt(top)} − ${M.fmt(bottom)} = ${M.fmt(ans)}.`,
    correct: (top, bottom, ans) => `Correct! ${M.fmt(top)} − ${M.fmt(bottom)} = ${M.fmt(ans)}.`,
    correctMarksOff: 'Your answer is right. One regroup mark does not keep the value the same; look at your marks again.',
    altValid: 'Your regroup marks are a different valid way: the value stays the same.',
    empty: 'Write your answer in the boxes below the line, then check.',
    incomplete: 'There is an empty box between your digits. Fill it in (use 0 if needed).',
    invalid: 'Use one digit in each answer box.',
    tryAgain: 'Not yet. Fix the parts marked ✗ and check again. Your other work is kept.',
    issue: {
      'smaller-from-larger': (i, t, b) => `In the ${P[i].name}, the top has ${t} and the bottom has ${b}. You can't take ${b} from ${t}, and you can't turn it around. Exchange first.`,
      'original-digit': (i, orig) => `The ${P[i].name} gave 1 away, so use its new amount, not the original ${orig}.`,
      misaligned: () => 'Check the places: ones go under ones. It looks like the bottom number moved to the left.',
      'no-reduce': (i) => `You added 10 to the ${P[i].name}, but the place on its left must give 1 away. Make that place 1 less.`,
      'zero-ten': () => 'When you exchange through a zero, that place gets 10 and then gives 1 away, so it ends with 9, not 10.',
      'skip-zero': () => 'Exchanges go to the place next door. Go through each zero, one place at a time.',
      'wrong-digit': (i) => `Look again at the ${P[i].name} column.`
    },
    hintButton: (n) => (n === 0 ? 'Hint' : `Next hint (${n + 1} of 4)`),
    hintLabel: (n) => `Hint ${n} of 4`,
    showSolution: 'Show the full solution',
    solutionTitle: 'Full solution',
    earlierHints: (n) => `Earlier hints (${n})`,
    undo: '↶ Undo',
    clear: 'Clear work',
    check: 'Check',
    back: '◀ Back a part',
    next: 'Next part ▶',
    startOver: 'Start over',
    partOf: (i, n) => `Part ${i} of ${n}`,
    topNow: 'Top number now',
    demoStart: (top, bottom) => `${M.fmt(top)} − ${M.fmt(bottom)}. Start with the ones.`,
    demoNeeds: (i, t, b) => `${cap(P[i].name)}: ${t} is less than ${b}. We need an exchange.`,
    demoSupplier: (col) => col.chain === 0 ? `The ${P[col.place + 1].name} can give.` : `The ${chainNames(col)} ${col.chain === 1 ? 'has' : 'have'} 0, so the ${P[col.supplier].name} gives. We go through each zero, one place at a time.`,
    demoNoNeed: (i, t, b) => `${cap(P[i].name)}: ${t} is enough to take away ${b}. No exchange needed.`,
    demoExchange: (e) => `Exchange 1 ${P[e.from].one} for 10 ${P[e.to].name}. Now ${M.describe(e.after)}.`,
    demoDigit: (i, t, b, d) => `${cap(P[i].name)}: ${t} − ${b} = ${d}.`,
    demoEnd: (top, bottom, ans) => `${M.fmt(top)} − ${M.fmt(bottom)} = ${M.fmt(ans)}.`,
    undone: (i, now) => `Undone: ${P[i].name} back to ${now === null ? 'no mark' : now}.`,
    cleared: 'Regroup marks cleared.',
    committed: (i, now, was) => (now === null ? `${cap(P[i].name)} mark removed.` : `${cap(P[i].name)} now ${now}${was !== null ? `, was ${was}` : ''}.`),
    digitsOnly: 'Use digits only.',
    yes: 'Yes', no: 'No'
  };
  function chainNames(col) {
    const names = [];
    for (let k = col.place + 1; k < col.supplier; k++) names.push(P[k].name);
    return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }

  // ---------- State validation (also used by hosts when restoring saved work) ----------
  const isDigitText = (v) => typeof v === 'string' && /^\d?$/.test(v);
  /** True when s is a well-formed state for this problem (structure and values, not just JSON). */
  function validState(s, top, bottom) {
    if (!s || typeof s !== 'object' || Array.isArray(s) || s.v !== 1) return false;
    if (s.top !== top || s.bottom !== bottom) return false;
    const n = M.lengthOf(top);
    if (!s.ann || typeof s.ann !== 'object' || Array.isArray(s.ann)) return false;
    for (const k of Object.keys(s.ann)) {
      const i = Number(k), h = s.ann[k];
      if (!Number.isInteger(i) || i < 0 || i >= n || !Array.isArray(h) || h.length > 30) return false;
      if (!h.every((x) => Number.isInteger(x) && x >= 0 && x <= 99)) return false;
    }
    if (!Array.isArray(s.d) || s.d.length > n || !s.d.every(isDigitText)) return false;
    if (!Array.isArray(s.log) || s.log.length > 200) return false;
    if (!Number.isInteger(s.hint) || s.hint < 0 || s.hint > 5) return false;
    if (!Number.isInteger(s.demo) || s.demo < 0 || s.demo > 60) return false;
    if (s.guided !== null && (typeof s.guided !== 'object' || !Number.isInteger(s.guided.col) || s.guided.col < 0 || s.guided.col > n ||
      !['needs', 'supplier', 'exchange', 'digit', 'done'].includes(s.guided.stage) || !Number.isInteger(s.guided.ex) || s.guided.ex < 0 || s.guided.ex > 4)) return false;
    return true;
  }
  function freshState(top, bottom, mode) {
    return { v: 1, top, bottom, mode, ann: {}, log: [], d: [], hint: 0, demo: 0, guided: mode === 'guided' ? { col: 0, stage: 'needs', ex: 0 } : null, result: null, done: false };
  }

  // ---------- The component ----------
  function mount(el, options) {
    if (!el || !el.nodeType) throw new Error('SubtractKit.mount: an element is required');
    const o = Object.assign({ mode: 'independent', hints: true, feedback: true, solution: true }, options || {});
    const top = o.top, bottom = o.bottom;
    const err = M.checkOperands(top, bottom);
    if (err) throw new Error('SubtractKit.mount: ' + err);
    const mode = ['demo', 'guided', 'independent', 'test', 'view'].includes(o.mode) ? o.mode : 'independent';
    // Test mode can never show hints, Check, feedback or the solution, whatever the options say.
    const allowHints = mode === 'independent' && o.hints !== false;
    const allowCheck = mode === 'independent' && o.feedback !== false;
    const allowSolution = allowHints && o.solution !== false;
    const T = Object.assign({}, TEXT, o.text || {}, { issue: Object.assign({}, TEXT.issue, (o.text && o.text.issue) || {}) });
    const id = 'sk' + (++counter);
    const n = M.lengthOf(top), orig = M.digitsOf(top, n), bdig = M.digitsOf(bottom, n), blen = M.lengthOf(bottom);
    const plan = M.plan(top, bottom);
    const ac = new AbortController();
    const listeners = {};
    let S = freshState(top, bottom, mode);
    if (o.state && validState(o.state, top, bottom)) S = Object.assign(clone(o.state), { mode });
    if (mode === 'view') { S.ann = clone((o.work && o.work.ann) || {}); S.d = ((o.work && o.work.d) || []).map(String); }
    let destroyed = false, feedbackHTML = '', marks = {}, solutionInst = null;

    el.classList.add('sk', 'sk-mode-' + mode);
    if (o.theme) Object.keys(o.theme).forEach((k) => el.style.setProperty(k.startsWith('--') ? k : '--sk-' + k, o.theme[k]));
    el.setAttribute('data-sk', id);

    // ----- Events -----
    function on(name, fn) { (listeners[name] = listeners[name] || []).push(fn); return api; }
    function off(name, fn) { listeners[name] = (listeners[name] || []).filter((f) => f !== fn); return api; }
    function emit(name, detail) {
      if (destroyed) return;
      const d = Object.assign({ type: name, instance: id }, detail || {});
      (listeners[name] || []).concat(listeners['*'] || []).forEach((f) => { try { f(d); } catch (e) { /* a host handler must not break the workspace */ } });
      if (o.on && typeof o.on[name] === 'function') try { o.on[name](d); } catch (e) { /* ignore */ }
    }
    const change = () => emit('change', { state: getState() });
    const say = (msg) => { const lr = el.querySelector('.sk-live'); if (lr && mode !== 'test') { lr.textContent = ''; lr.textContent = msg; } };
    const sayAlways = (msg) => { const lr = el.querySelector('.sk-live'); if (lr) { lr.textContent = ''; lr.textContent = msg; } };

    // ----- Derived amounts -----
    const current = () => M.amountsFrom(top, S.ann, n);
    function demoSteps() {
      const steps = [{ kind: 'start', note: T.demoStart(top, bottom), ann: {}, digits: 0 }];
      const ann = {}; let digits = 0;
      const push = (kind, note, extra) => steps.push(Object.assign({ kind, note, ann: clone(ann), digits }, extra || {}));
      plan.columns.forEach((c) => {
        if (c.needs) {
          push('needs', `${T.demoNeeds(c.place, c.before[c.place], c.bottomDigit)} ${T.demoSupplier(c)}`, { col: c.place, supplier: c.supplier });
          c.exchanges.forEach((e) => {
            (ann[e.from] = ann[e.from] || []).push(e.after[e.from]);
            (ann[e.to] = ann[e.to] || []).push(e.after[e.to]);
            push('exchange', T.demoExchange(e), { col: c.place, ex: e });
          });
        } else if (c.place > 0 || plan.exchanges.length) push('check', T.demoNoNeed(c.place, c.topNow, c.bottomDigit), { col: c.place });
        digits = c.place + 1;
        push('digit', T.demoDigit(c.place, c.topNow, c.bottomDigit, c.digit), { col: c.place });
      });
      push('end', (o.demoEnd || T.demoEnd)(top, bottom, top - bottom), {});
      return steps;
    }
    const DEMO = mode === 'demo' ? demoSteps() : null;
    if (DEMO && S.demo >= DEMO.length) S.demo = DEMO.length - 1;

    // ----- Rendering -----
    // Grid tracks: minus sign, then one per place (largest first) with a thin comma track after the thousands.
    const colOf = (i) => { const fromLeft = n - 1 - i; return 2 + fromLeft + (n === 4 && i < 3 ? 1 : 0); };
    const tracks = `var(--sk-op) ${n === 4 ? 'var(--sk-col) var(--sk-comma) repeat(3, var(--sk-col))' : `repeat(${n}, var(--sk-col))`}`;
    const commaCol = n === 4 ? 3 : null;
    const cell = (row, col, html, cls, extra) => `<div class="sk-cell ${cls || ''}" style="grid-row:${row};grid-column:${col}"${extra || ''}>${html}</div>`;

    function editable(kind, i) {
      if (mode === 'test' || mode === 'independent') return true;
      if (mode !== 'guided' || !S.guided) return false;
      const g = S.guided, col = plan.columns[g.col];
      if (kind === 'regroup') return g.stage === 'exchange' && col && col.exchanges[g.ex] && (i === col.exchanges[g.ex].from || i === col.exchanges[g.ex].to);
      if (kind === 'answer') return g.stage === 'digit' && i === g.col;
      return false;
    }
    function activeInfo() {
      // Which column is highlighted, and the −1 / +10 chips.
      if (mode === 'demo') { const st = DEMO[S.demo]; return { col: st.col, ex: st.ex || null, supplier: st.kind === 'needs' ? st.supplier : null }; }
      if (mode === 'guided' && S.guided && S.guided.stage !== 'done') {
        const col = plan.columns[S.guided.col];
        return { col: S.guided.col, ex: S.guided.stage === 'exchange' ? col.exchanges[S.guided.ex] : null, supplier: null };
      }
      if (mode === 'independent' && S.hint > 0 && marks.hintCol !== undefined && marks.hintCol !== null) return { col: marks.hintCol, ex: null, supplier: S.hint >= 2 ? marks.hintSupplier : null };
      return { col: null, ex: null, supplier: null };
    }

    function gridHTML() {
      const act = activeInfo();
      const demoStep = mode === 'demo' ? DEMO[S.demo] : null;
      const ann = demoStep ? demoStep.ann : S.ann;
      const showChips = mode === 'demo' || mode === 'guided';
      let h = '';
      for (let i = n - 1; i >= 0; i--) {
        const c = colOf(i), hist = ann[i] || [], marked = hist.length > 0;
        const isAct = act.col === i;
        const cls = (isAct ? ' is-active' : '') + (act.ex && act.ex.from === i ? ' is-giver' : '') + (act.ex && act.ex.to === i ? ' is-getter' : '') + (act.supplier === i ? ' is-giver' : '');
        // Band behind the whole column (decoration).
        h += `<div class="sk-band${cls}" style="grid-row:1 / 9;grid-column:${c}" aria-hidden="true"></div>`;
        h += cell(1, c, `${isAct ? '<span class="sk-here" aria-hidden="true">▼</span>' : ''}<abbr class="sk-tag sk-tag-${KEYS[i]}" title="${P[i].name}">${KEYS[i]}</abbr>`, 'sk-tagcell' + cls);
        if (showChips) {
          const chip = act.ex && act.ex.from === i ? '−1' : act.ex && act.ex.to === i ? '+10' : '';
          h += cell(2, c, chip ? `<span class="sk-chip">${chip}</span>` : '', 'sk-chipcell');
        }
        // One earlier value (struck), then the current value: a box to type in, or a read-only box.
        const earlier = hist.length >= 2 ? hist[hist.length - 2] : null;
        h += cell(3, c, earlier !== null ? `<span class="sk-x sk-hist" aria-hidden="true">${earlier}</span>` : '', 'sk-histcell');
        const now = marked ? hist[hist.length - 1] : '';
        if (editable('regroup', i) && mode !== 'demo' && mode !== 'view') {
          h += cell(4, c, `<input class="sk-cur sk-in" data-k="r${i}" inputmode="numeric" maxlength="2" autocomplete="off" spellcheck="false" placeholder=" " ` +
            `aria-label="Regrouped ${P[i].name}${mode === 'guided' ? '' : ', optional'}" value="${esc(now)}">`, 'sk-curcell');
        } else {
          h += cell(4, c, marked ? `<span class="sk-cur sk-cur-read" aria-hidden="true">${now}</span>` : '', 'sk-curcell');
        }
        const label = `${cap(P[i].name)}: ${orig[i]}${marked ? `, crossed out${earlier !== null ? `, was ${earlier}` : ''}, now ${now}` : ''}`;
        h += cell(5, c, `<span class="sk-d${marked ? ' sk-x' : ''}" aria-hidden="true">${orig[i]}</span>`, 'sk-topcell', ` role="img" aria-label="${esc(label)}"`);
        // Bottom number: right-aligned (or shifted left when showing someone's misaligned work).
        const shift = mode === 'view' && o.work && o.work.misaligned ? o.work.misaligned : 0;
        const bi = i - shift;
        const bd = bi >= 0 && bi < blen ? String(bottom)[blen - 1 - bi] : '';
        h += cell(6, c, bd ? `<span class="sk-d">${bd}</span>` : '', 'sk-botcell' + (shift ? ' is-shifted' : ''), bd ? ` aria-label="${P[i].name} ${bd}"` : '');
        // Answer row (hidden with answer: false, e.g. 'write the regrouped top number' or 'does it need regrouping?').
        const dv = S.d[i] || '';
        if (o.answer === false) { /* no answer row */ } else if (mode === 'demo') {
          const shown = demoStep && i < demoStep.digits ? String(plan.columns[i].digit) : '';
          h += cell(8, c, `<span class="sk-ans sk-ans-read">${shown}</span>`, 'sk-anscell', shown ? ` aria-label="Answer ${P[i].name} digit ${shown}"` : '');
        } else if (mode === 'view' || !editable('answer', i)) {
          const mk = marks[i];
          h += cell(8, c, `<span class="sk-ans sk-ans-read${mk ? ' is-' + mk : ''}">${esc(dv)}</span>${mk ? `<span class="sk-mark" aria-hidden="true">${mk === 'ok' ? '✓' : '✗'}</span>` : ''}`, 'sk-anscell',
            ` aria-label="Answer ${P[i].name} digit${dv ? ' ' + dv : ', empty'}${mk ? (mk === 'ok' ? ', correct' : ', not correct') : ''}"`);
        } else {
          const mk = marks[i];
          h += cell(8, c, `<input class="sk-ans sk-in${mk ? ' is-' + mk : ''}" data-k="a${i}" inputmode="numeric" maxlength="1" autocomplete="off" spellcheck="false" ` +
            `aria-label="Answer, ${P[i].name} digit${mk === 'no' ? ', marked not correct' : mk === 'ok' ? ', marked correct' : ''}" value="${esc(dv)}">${mk ? `<span class="sk-mark" aria-hidden="true">${mk === 'ok' ? '✓' : '✗'}</span>` : ''}`, 'sk-anscell');
        }
      }
      // Minus sign beside the bottom number; commas; the answer line.
      h += cell(6, 1, '<span class="sk-op" aria-hidden="true">−</span>', 'sk-opcell');
      if (commaCol) {
        h += cell(5, commaCol, '<span class="sk-comma" aria-hidden="true">,</span>', 'sk-commacell');
        if (blen === 4 && !(mode === 'view' && o.work && o.work.misaligned)) h += cell(6, commaCol, '<span class="sk-comma" aria-hidden="true">,</span>', 'sk-commacell');
      }
      h += `<div class="sk-rule" style="grid-row:7;grid-column:1 / -1" aria-hidden="true"></div>`;
      return `<div class="sk-grid${showChips ? ' has-chips' : ''}${o.answer === false ? ' no-answer' : ''}" style="grid-template-columns:${tracks}" role="group" aria-label="${esc(`${M.fmt(top)} minus ${M.fmt(bottom)}, written in columns`)}">${h}</div>`;
    }

    function coachHTML() {
      if (mode === 'demo') {
        const st = DEMO[S.demo];
        const lines = [M.describe(orig)];
        DEMO.slice(0, S.demo + 1).forEach((x) => { if (x.kind === 'exchange') lines.push(M.describe(x.ex.after)); });
        const list = plan.exchanges.length ? `<p class="sk-topnow-h">${esc(T.topNow)}</p><ol class="sk-topnow">${lines.map((l, k) => `<li${k === lines.length - 1 ? ' class="is-now"' : ''}>${esc(l)}${k === lines.length - 1 ? ' <span aria-hidden="true">◀ now</span>' : ''}</li>`).join('')}</ol>` : '';
        return `<p class="sk-note">${esc(st.note)}</p>${list}` +
          `<div class="sk-democtl"><button type="button" class="sk-btn" data-act="back"${S.demo === 0 ? ' disabled' : ''}>${esc(T.back)}</button>` +
          `<span class="sk-partof" aria-live="off">${esc(T.partOf(S.demo + 1, DEMO.length))}</span>` +
          `<button type="button" class="sk-btn sk-btn-primary" data-act="next"${S.demo === DEMO.length - 1 ? ' disabled' : ''}>${esc(T.next)}</button>` +
          `<button type="button" class="sk-btn sk-btn-ghost" data-act="restart">${esc(T.startOver)}</button></div>`;
      }
      if (mode === 'guided') {
        const g = S.guided;
        if (g.stage === 'done') return `<p class="sk-note sk-ok-note"><span aria-hidden="true">✓ </span>${esc(T.guidedDone(top, bottom, top - bottom))}</p>`;
        const col = plan.columns[g.col], i = g.col, t = col.before[i], b = col.bottomDigit;
        let q = '', ctl = '';
        if (g.stage === 'needs') {
          q = T.needsQ(i);
          ctl = `<div class="sk-choices"><button type="button" class="sk-btn" data-act="needs" data-v="yes">${esc(T.yes)}</button><button type="button" class="sk-btn" data-act="needs" data-v="no">${esc(T.no)}</button></div>`;
        } else if (g.stage === 'supplier') {
          q = T.supplierQ;
          const opts = [];
          for (let k = i + 1; k < n; k++) opts.push(`<button type="button" class="sk-btn" data-act="supplier" data-v="${k}">${esc(cap(P[k].name))}</button>`);
          ctl = `<div class="sk-choices">${opts.join('')}</div>`;
        } else if (g.stage === 'exchange') {
          const e = col.exchanges[g.ex];
          q = T.exchangeQ(e.from, e.to);
          ctl = `<button type="button" class="sk-btn sk-btn-primary" data-act="check-ex">${esc(T.check)}</button>`;
        } else if (g.stage === 'digit') {
          q = T.digitQ(i, col.topNow, b);
          ctl = `<button type="button" class="sk-btn sk-btn-primary" data-act="check-digit">${esc(T.check)}</button>`;
        }
        return `<p class="sk-working">${esc(T.working(i))}</p><p class="sk-q" id="${id}-q">${esc(q)}</p>${ctl}<div class="sk-fb" role="status">${feedbackHTML}</div>` +
          (g.stage === 'needs' ? '' : `<p class="sk-sub">${esc(g.stage === 'supplier' ? T.needsYes(t, b) : '')}</p>`);
      }
      if (mode === 'independent' && (allowHints || allowCheck)) {
        let hintsH = '';
        if (S.hint > 0) {
          const H = M.hints(top, bottom, { d: S.d }).levels;
          const shown = Math.min(S.hint, 4);
          const older = [];
          for (let k = 1; k < shown; k++) older.push(`<li><b>${esc(T.hintLabel(k))}:</b> ${esc(H[k - 1])}</li>`);
          hintsH = (older.length ? `<details class="sk-older"><summary>${esc(T.earlierHints(older.length))}</summary><ul>${older.join('')}</ul></details>` : '') +
            `<p class="sk-hint"><b>${esc(T.hintLabel(shown))}:</b> ${esc(H[shown - 1])}</p>` +
            (S.hint >= 5 ? `<div class="sk-solution"><p class="sk-solution-h">${esc(T.solutionTitle)}</p><div class="sk-mini" data-sk-mini></div><p class="sk-sub">${esc(H[4])}</p></div>` : '');
        }
        return `<div class="sk-fb" role="status">${feedbackHTML}</div>${hintsH}`;
      }
      return '';
    }

    function toolbarHTML() {
      if (mode === 'demo' || mode === 'view' || mode === 'guided') return '';
      const undo = `<button type="button" class="sk-btn sk-btn-ghost" data-act="undo"${S.log.length ? '' : ' disabled'}>${esc(T.undo)}</button>`;
      const clear = `<button type="button" class="sk-btn sk-btn-ghost" data-act="clear"${Object.keys(S.ann).length ? '' : ' disabled'}>${esc(T.clear)}</button>`;
      let right = '';
      if (allowHints) right += S.hint < 4 ? `<button type="button" class="sk-btn sk-btn-ghost" data-act="hint">💡 ${esc(T.hintButton(S.hint))}</button>`
        : allowSolution && S.hint === 4 ? `<button type="button" class="sk-btn sk-btn-outline" data-act="solution">${esc(T.showSolution)}</button>` : '';
      if (allowCheck) right += `<button type="button" class="sk-btn sk-btn-primary" data-act="check">${esc(T.check)}</button>`;
      return `<div class="sk-toolbar"><div class="sk-tl">${undo}${clear}</div>${right ? `<div class="sk-tr">${right}</div>` : ''}</div>`;
    }

    function render(focusKey) {
      if (destroyed) return;
      const coach = coachHTML();
      el.innerHTML = `<div class="sk-wrap${coach ? ' has-coach' : ''}"><div class="sk-main">${gridHTML()}${toolbarHTML()}</div>` +
        (coach ? `<div class="sk-coach">${coach}</div>` : '') + `</div><p class="sk-live sk-sr" aria-live="polite" id="${id}-live"></p>`;
      if (solutionInst) { solutionInst.destroy(); solutionInst = null; }
      const mini = el.querySelector('[data-sk-mini]');
      if (mini) solutionInst = mount(mini, { top, bottom, mode: 'view', work: { ann: solutionAnn(), d: plan.columns.map((c) => String(c.digit)) } });
      if (focusKey) { const f = el.querySelector(`[data-k="${focusKey}"], [data-act="${focusKey}"]`); if (f && !f.disabled) f.focus({ preventScroll: true }); }
    }
    function solutionAnn() {
      const ann = {};
      plan.exchanges.forEach((e) => { (ann[e.from] = ann[e.from] || []).push(e.after[e.from]); (ann[e.to] = ann[e.to] || []).push(e.after[e.to]); });
      return ann;
    }

    // ----- Regroup marks (independent, test, guided exchange) -----
    function commitRegroup(i, text) {
      const v = M.readAmount(text);
      const hist = S.ann[i] || [];
      const was = hist.length ? hist[hist.length - 1] : null;
      if (Number.isNaN(v)) { render('r' + i); sayAlways(T.digitsOnly); return; }
      if (v === was) return;
      S.log.push({ place: i, before: hist.slice() });
      if (v === null) { hist.pop(); if (hist.length) S.ann[i] = hist; else delete S.ann[i]; }
      else S.ann[i] = hist.concat(v);
      marks = {}; feedbackHTML = '';
      render(null);
      if (mode === 'test') sayAlways(T.committed(i, v, was)); else say(T.committed(i, v, was));
      emit('step', { kind: 'regroup', place: i, value: v, was });
      change();
    }
    function undo() {
      const last = S.log.pop();
      if (!last) return;
      if (last.clear) S.ann = last.before;
      else if (last.before.length) S.ann[last.place] = last.before; else delete S.ann[last.place];
      marks = {}; feedbackHTML = '';
      render('undo');
      const now = last.clear ? null : (S.ann[last.place] ? S.ann[last.place][S.ann[last.place].length - 1] : null);
      sayAlways(last.clear ? 'Regroup marks restored.' : T.undone(last.place, now));
      emit('step', { kind: 'undo' }); change();
    }
    function clearWork() {
      if (!Object.keys(S.ann).length) return;
      S.log.push({ clear: true, before: clone(S.ann) });
      S.ann = {}; marks = {}; feedbackHTML = '';
      render('clear');
      sayAlways(T.cleared);
      emit('reset', { scope: 'marks' }); change();
    }

    // ----- Check (independent) -----
    function check() {
      if (mode !== 'independent' && mode !== 'test') return null;
      const g = M.gradeFinal(top, bottom, S.d);
      const ev = M.evaluateWork(top, bottom, S.ann);
      const result = { status: g.status, correct: g.correct, value: g.value, marks: ev.status, standardMarks: ev.status === 'valid' ? ev.standard : null, issues: [] };
      if (mode === 'test' || !allowCheck) return result; // graded silently (the host decides what to show)
      marks = {};
      const msgs = [];
      if (g.status === 'empty') msgs.push(T.empty);
      else if (g.status === 'incomplete') msgs.push(T.incomplete);
      else if (g.status === 'invalid') msgs.push(T.invalid);
      else if (g.correct) {
        for (let i = 0; i < n; i++) marks[i] = 'ok';
        msgs.push(T.correct(top, bottom, top - bottom));
        if (ev.status === 'invalid') msgs.push(T.correctMarksOff);
        else if (ev.status === 'valid' && !ev.standard) msgs.push(T.altValid);
      } else {
        const issues = M.diagnose(top, bottom, { ann: S.ann, d: S.d });
        result.issues = issues;
        for (let i = 0; i < n; i++) { const v = (S.d[i] || '').trim(); if (v !== '' || i < M.lengthOf(top - bottom)) marks[i] = v === String(plan.columns[i].digit) ? 'ok' : 'no'; }
        const named = issues.filter((x) => x.kind !== 'wrong-digit');
        const show = (named.length ? named : issues).slice(0, 2);
        show.forEach((x) => {
          const f = T.issue[x.kind];
          const i = x.place;
          if (x.kind === 'smaller-from-larger') msgs.push(f(i, orig[i], bdig[i]));
          else if (x.kind === 'original-digit') msgs.push(f(i, orig[i]));
          else msgs.push(f(i));
        });
        if (ev.status === 'valid' && !ev.standard) msgs.push(T.altValid);
        msgs.push(T.tryAgain);
      }
      feedbackHTML = `<p class="${g.correct ? 'sk-ok-note' : 'sk-no-note'}"><span aria-hidden="true">${g.correct ? '✓ ' : g.status === 'wrong' ? '✗ ' : ''}</span>${msgs.map(esc).join(' ')}</p>`;
      S.result = { status: g.status, correct: g.correct };
      if (g.correct) S.done = true;
      render(g.correct ? 'check' : null);
      say(msgs.join(' '));
      emit('answer', { status: g.status, correct: g.correct, value: g.value, marks: ev.status, issues: result.issues });
      if (g.correct) emit('complete', { correct: true, hintsUsed: S.hint });
      change();
      return result;
    }

    // ----- Guided decisions -----
    function guidedFeedback(ok, msg) { feedbackHTML = `<p class="${ok ? 'sk-ok-note' : 'sk-no-note'}"><span aria-hidden="true">${ok ? '✓ ' : '✗ '}</span>${esc(msg)}</p>`; }
    function guidedNext(stage, extra) {
      Object.assign(S.guided, { stage }, extra || {});
      render(null);
      const g = S.guided;
      if (g.stage === 'done') { say(T.guidedDone(top, bottom, top - bottom)); emit('complete', { correct: true }); }
      else {
        const f = el.querySelector(g.stage === 'exchange' ? '.sk-in[data-k^="r"]' : g.stage === 'digit' ? `[data-k="a${g.col}"]` : '.sk-choices .sk-btn');
        if (f) f.focus({ preventScroll: true });
        say(`${feedbackText()} ${el.querySelector('.sk-q') ? el.querySelector('.sk-q').textContent : ''}`.trim());
      }
      change();
    }
    const feedbackText = () => { const d = document.createElement('div'); d.innerHTML = feedbackHTML; return d.textContent; };
    function guidedAct(act, v) {
      const g = S.guided, col = plan.columns[g.col], i = g.col, t = col.before[i], b = col.bottomDigit;
      if (act === 'needs') {
        const yes = v === 'yes';
        if (yes === col.needs) {
          guidedFeedback(true, yes ? T.needsYes(t, b) : T.needsNo(t, b));
          emit('step', { kind: 'needs', column: i, correct: true });
          return guidedNext(yes ? 'supplier' : 'digit');
        }
        guidedFeedback(false, yes ? T.needsAltYes(i, t, b) : T.needsWrongNo(i, t, b));
        emit('step', { kind: 'needs', column: i, correct: false, valid: yes });
      } else if (act === 'supplier') {
        const k = Number(v), cur = col.before;
        if (k === col.supplier) {
          guidedFeedback(true, col.chain ? T.demoSupplier(col) : `Yes. The ${P[k].name} can give.`);
          emit('step', { kind: 'supplier', column: i, correct: true });
          return guidedNext('exchange', { ex: 0 });
        }
        if (cur[k] === 0) guidedFeedback(false, T.supplierZero(k));
        else guidedFeedback(false, T.supplierFar(k, col.supplier));
        emit('step', { kind: 'supplier', column: i, correct: false, valid: cur[k] > 0 });
      } else if (act === 'check-ex') {
        const e = col.exchanges[g.ex];
        const rv = (j) => { const inp = el.querySelector(`[data-k="r${j}"]`); return inp ? M.readAmount(inp.value) : null; };
        const giver = rv(e.from), getter = rv(e.to);
        // Commit what is typed so it is kept, right or wrong.
        [[e.from, giver], [e.to, getter]].forEach(([j, val]) => {
          if (val === null || Number.isNaN(val)) return;
          const h = S.ann[j] || []; if (h[h.length - 1] !== val) S.ann[j] = h.concat(val);
        });
        if (giver === null || getter === null || Number.isNaN(giver) || Number.isNaN(getter)) { guidedFeedback(false, T.exchangeEmpty); render('check-ex'); change(); return; }
        const okG = giver === e.after[e.from], okR = getter === e.after[e.to];
        if (okG && okR) {
          guidedFeedback(true, T.exchangeKept(e.from, e.to, e.after));
          emit('step', { kind: 'exchange', column: i, from: e.from, to: e.to, correct: true });
          return g.ex + 1 < col.exchanges.length ? guidedNext('exchange', { ex: g.ex + 1 }) : guidedNext('digit');
        }
        // Keep the correct value; take back only the wrong one.
        [[e.from, okG], [e.to, okR]].forEach(([j, ok]) => { if (!ok && S.ann[j]) { S.ann[j].pop(); if (!S.ann[j].length) delete S.ann[j]; } });
        guidedFeedback(false, okR && !okG && giver === e.before[e.from] ? T.exchangeNoReduce(e.from) : !okG ? T.exchangeGiver(e.from) : T.exchangeGetter(e.to));
        emit('step', { kind: 'exchange', column: i, correct: false });
        render(!okG ? 'r' + e.from : 'r' + e.to); say(feedbackText()); change();
      } else if (act === 'check-digit') {
        const inp = el.querySelector(`[data-k="a${i}"]`), dv = inp ? inp.value.trim() : '';
        S.d[i] = dv;
        if (!/^\d$/.test(dv)) { guidedFeedback(false, T.digitEmpty); render('a' + i); say(feedbackText()); change(); return; }
        const d = Number(dv);
        if (d === col.digit) {
          guidedFeedback(true, `${cap(P[i].name)}: ${col.topNow} − ${b} = ${d}.`);
          emit('step', { kind: 'digit', column: i, correct: true });
          emit('answer', { status: i === n - 1 ? 'correct' : 'partial', column: i });
          return g.col + 1 < n ? guidedNext('needs', { col: g.col + 1, ex: 0 }) : guidedNext('done');
        }
        const lent = col.topNow !== orig[i] && !col.needs;
        guidedFeedback(false, lent && d === orig[i] - b ? T.digitOriginal(i, orig[i], col.topNow) : (d === b - t && t < b) ? T.digitSwap(i, t, b, col.topNow) : T.digitWrong(i, col.topNow, b));
        emit('step', { kind: 'digit', column: i, correct: false });
        render('a' + i); say(feedbackText()); change();
      }
      if (act === 'needs' || act === 'supplier') { render(null); say(feedbackText()); change(); }
    }

    // ----- Input handling (one set of listeners on the container; removed by destroy) -----
    const sig = { signal: ac.signal };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || !el.contains(b) || b.disabled) return;
      const act = b.dataset.act;
      if (act === 'undo') return undo();
      if (act === 'clear') return clearWork();
      if (act === 'check') return check();
      if (act === 'hint') return showHint(false);
      if (act === 'solution') return showHint(true);
      if (act === 'next' || act === 'back' || act === 'restart') return demoMove(act);
      if (mode === 'guided') return guidedAct(act, b.dataset.v);
    }, sig);
    el.addEventListener('change', (e) => {
      const t = e.target;
      if (!t.matches || !t.matches('.sk-in[data-k^="r"]') || mode === 'guided') return;
      commitRegroup(Number(t.dataset.k.slice(1)), t.value);
    }, sig);
    el.addEventListener('input', (e) => {
      const t = e.target;
      if (!t.matches) return;
      if (t.matches('.sk-in[data-k^="r"]')) { const c = t.value.replace(/\D/g, '').slice(0, 2); if (c !== t.value) t.value = c; return; }
      if (!t.matches('.sk-in[data-k^="a"]')) return;
      const i = Number(t.dataset.k.slice(1));
      const v = t.value.replace(/\D/g, '').slice(-1);
      t.value = v; S.d[i] = v;
      while (S.d.length && S.d[S.d.length - 1] === '') S.d.pop();
      if (Object.keys(marks).length && mode === 'independent') { delete marks[i]; t.classList.remove('is-ok', 'is-no'); const m = t.parentNode.querySelector('.sk-mark'); if (m) m.remove(); }
      if (v && mode !== 'guided') { const nx = el.querySelector(`[data-k="a${i + 1}"]`); if (nx) nx.focus({ preventScroll: true }); }
      emit('answer', { status: 'typing', digits: S.d.slice() });
      change();
    }, sig);
    el.addEventListener('keydown', (e) => {
      const t = e.target;
      if (!t.matches || !t.matches('.sk-in')) return;
      const kind = t.dataset.k[0], i = Number(t.dataset.k.slice(1));
      const go = (k) => { const x = el.querySelector(`[data-k="${k}"]`); if (x) { e.preventDefault(); x.focus({ preventScroll: true }); if (x.select) x.select(); } };
      if (e.key === 'ArrowLeft') go(kind + (i + 1));
      else if (e.key === 'ArrowRight') go(kind + (i - 1));
      else if (e.key === 'ArrowUp' && kind === 'a') go('r' + i);
      else if (e.key === 'ArrowDown' && kind === 'r') go('a' + i);
      else if (e.key === 'Backspace' && kind === 'a' && t.value === '') go('a' + (i - 1));
      else if (e.key === 'Enter' && kind === 'r' && mode !== 'guided') { e.preventDefault(); commitRegroup(i, t.value); }
    }, sig);
    el.addEventListener('focusin', (e) => { const t = e.target; if (t.matches && t.matches('.sk-cur.sk-in') && t.select) t.select(); }, sig);

    function showHint(solution) {
      if (!allowHints) return;
      if (solution) { if (!allowSolution || S.hint < 4) return; S.hint = 5; }
      else if (S.hint < 4) S.hint += 1; else return;
      const h = M.hints(top, bottom, { d: S.d });
      marks.hintCol = h.place;
      const col = h.place !== null ? plan.columns[h.place] : null;
      marks.hintSupplier = col && col.needs ? col.supplier : null;
      render(S.hint >= 5 ? null : S.hint < 4 ? 'hint' : 'solution');
      const box = el.querySelector(S.hint >= 5 ? '.sk-solution' : '.sk-hint');
      if (box && box.scrollIntoView) box.scrollIntoView({ block: 'nearest' });
      say(S.hint >= 5 ? `${T.solutionTitle}. ${h.levels[4]}` : `${T.hintLabel(S.hint)}: ${h.levels[S.hint - 1]}`);
      emit('hint', { level: S.hint, place: h.place, solution: S.hint >= 5 });
      change();
    }
    function demoMove(act) {
      if (mode !== 'demo') return;
      if (act === 'next' && S.demo < DEMO.length - 1) S.demo++;
      else if (act === 'back' && S.demo > 0) S.demo--;
      else if (act === 'restart') S.demo = 0;
      else return;
      render(act === 'restart' ? 'next' : (act === 'next' && S.demo === DEMO.length - 1) ? 'back' : act);
      say(DEMO[S.demo].note);
      emit('step', { kind: 'demo', index: S.demo, total: DEMO.length, part: DEMO[S.demo].kind });
      if (S.demo === DEMO.length - 1) emit('complete', { correct: true, demo: true });
      change();
    }

    // ----- Public API -----
    function getState() { const s = clone(S); return s; }
    function setState(s) {
      if (!validState(s, top, bottom)) return false;
      S = Object.assign(clone(s), { mode });
      if (mode === 'guided' && !S.guided) S.guided = { col: 0, stage: 'needs', ex: 0 };
      if (DEMO && S.demo >= DEMO.length) S.demo = DEMO.length - 1;
      marks = {}; feedbackHTML = '';
      render(null);
      return true;
    }
    function reset() {
      S = freshState(top, bottom, mode); marks = {}; feedbackHTML = '';
      render(null); sayAlways('Work cleared.'); emit('reset', { scope: 'all' }); change();
    }
    function destroy() {
      if (destroyed) return;
      if (solutionInst) solutionInst.destroy();
      ac.abort();
      destroyed = true;
      Object.keys(listeners).forEach((k) => delete listeners[k]);
      el.innerHTML = '';
      el.classList.remove('sk', 'sk-mode-' + mode);
      el.removeAttribute('data-sk');
    }
    const api = {
      id, mode, top, bottom,
      on, off, getState, setState, check, reset, destroy,
      hint: () => showHint(false), showSolution: () => showHint(true),
      undo, clearWork, focus: () => { const f = el.querySelector('.sk-in, .sk-btn'); if (f) f.focus(); },
      result: () => (mode === 'test' || mode === 'independent' ? Object.assign(M.gradeFinal(top, bottom, S.d), { marks: M.evaluateWork(top, bottom, S.ann).status }) : null),
      get destroyed() { return destroyed; }
    };
    render(null);
    return api;
  }

  SK.mount = mount;
  SK.validState = validState;
  SK.text = TEXT;
  SK.version = '1.0.0';
})(typeof window !== 'undefined' ? window : globalThis);
