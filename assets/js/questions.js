/*
 * Mathbook question types. Shared by guided practice, the practice bank, and tests.
 *
 * A question is plain JSON (so attempts can be saved and re-shown after a refresh):
 *   { id, type, prompt, answer, skill, explanation, hint?, display?, model?, block?, choices? }
 * Types:
 *   mc       – pick one choice (choices[], answer = the correct choice text)
 *   select   – fill a blank "___" in the prompt from a drop-down (choices[], answer)
 *   number   – type a whole number (answer = number); commas and spaces are optional
 *   expanded – type expanded form of `answer` (see Mathbook.pv.checkExpanded)
 *   words    – type word form of `answer` (case, hyphens, commas, and "and" are ignored)
 *   chart    – type the digit in each place of `answer`
 *   build    – use + / – to build `answer` with base-ten blocks
 *   spell    – type a whole word (answer = word); capitals and surrounding spaces are ignored
 *   letter   – type the missing letter of `word` at index `missing` (answer = that letter)
 *   parts    – several small answers graded together (all must be right). parts: [
 *                { kind: 'num', label, answer }            a whole number
 *                { kind: 'round', label, place, target }   any whole number that rounds to target at place (10 or 100)
 *                { kind: 'choice', label, choices, answer } pick one
 *                { kind: 'multi', label, choices, answer: [] } select all that apply (exactly the right set) ]
 *              line: { place } draws a blank number line (left end, halfway, right end) with nothing filled in.
 *   rline    – round n to the nearest place (10 or 100) on one number line, one small part at a time:
 *              the two tens/hundreds, halfway, which way it rounds, [why: { label, choices, answer }].
 *              render option mode: 'guided' (check each part) | 'test' (default: no feedback) | 'review'.
 * Optional visuals: model (number drawn as blocks, no captions), block (single block place index),
 *   numeral (big digit card), tenFrame (0–10 dots).
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function emptyResponse(q) {
    if (q.type === 'chart') return ['', '', '', ''];
    if (q.type === 'build') return [0, 0, 0, 0];
    if (q.type === 'parts') return q.parts.map((p) => (p.kind === 'multi' ? [] : ''));
    if (q.type === 'rline') return rlEmpty();
    if (q.type === 'chain') return chNorm(q);
    if (q.type === 'vcalc') return vcNorm(q);
    return '';
  }

  /** Blank number line for a rounding question: three marks to name, nothing revealed. */
  function blankLine(place) {
    const w = place === 10 ? 'ten' : 'hundred';
    return `<div class="nline nline-blank" aria-hidden="true"><div class="nline-track"><span class="nline-bar"></span>` +
      [0, 50, 100].map((p) => `<span class="nline-tick is-major" style="left:${p}%"></span>`).join('') +
      `<span class="nline-label is-start" style="left:0%">lower ${w}</span><span class="nline-label" style="left:50%">halfway</span>` +
      `<span class="nline-label is-end" style="left:100%">upper ${w}</span></div></div>`;
  }

  function partOK(p, r) {
    if (p.kind === 'num') return pv.parseWholeNumber(r) === p.answer;
    if (p.kind === 'round') { const n = pv.parseWholeNumber(r); return n !== null && pv.roundTo(n, p.place) === p.target; }
    if (p.kind === 'choice' || p.kind === 'symbol') return r === p.answer;
    if (p.kind === 'multi') return Array.isArray(r) && r.length === p.answer.length && p.answer.every((a) => r.includes(a));
    return false;
  }

  /**
   * Per-part results. `num` parts sharing an `anyOrder` group value are graded as a set: the typed values must be
   * the answers in any order. The whole set is right or wrong together.
   */
  function partsOK(q, r) {
    const rr = Array.isArray(r) ? r : [];
    const ok = q.parts.map((p, i) => partOK(p, rr[i]));
    const groups = {};
    q.parts.forEach((p, i) => { if (p.anyOrder && p.kind === 'num') (groups[p.anyOrder] = groups[p.anyOrder] || []).push(i); });
    Object.keys(groups).forEach((g) => {
      const idx = groups[g];
      const pool = idx.map((i) => q.parts[i].answer);
      const fine = idx.every((i) => {
        const v = pv.parseWholeNumber(rr[i]);
        const j = pool.indexOf(v);
        if (v === null || j < 0) return false;
        pool.splice(j, 1);
        return true;
      });
      idx.forEach((i) => { ok[i] = fine; });
    });
    return ok;
  }
  const SYMBOL_NAMES = { '<': 'less than', '>': 'greater than', '=': 'equal to', '≠': 'not equal to' };
  function symbolText(p, v) {
    return `${pv.fmt(p.left)} ${v || '◯'} ${pv.fmt(p.right)}${v ? ` (${SYMBOL_NAMES[v] || v})` : ''}`;
  }

  function partAnswered(p, r) {
    if (p.kind === 'multi') return Array.isArray(r) && r.length > 0;
    return String(r === undefined || r === null ? '' : r).trim() !== '';
  }

  function partCorrectText(p) {
    if (p.kind === 'num') return pv.fmt(p.answer);
    if (p.kind === 'round') { const [a, b] = pv.roundRange(p.target, p.place); return `any whole number from ${pv.fmt(a)} to ${pv.fmt(b)}`; }
    if (p.kind === 'multi') return p.answer.join(', ');
    if (p.kind === 'symbol') return symbolText(p, p.answer);
    return p.answer;
  }

  function visuals(q) {
    let html = '';
    if (q.display) html += `<div class="q-display">${withBlanks(q.display)}</div>`;
    if (q.figure) html += figureHTML(q.figure);
    if (typeof q.model === 'number') html += pv.blocksHTML(q.model, { captions: false });
    if (typeof q.block === 'number') html += `<div class="q-single-block">${pv.singleBlockSVG(q.block, 'A base-ten block')}</div>`;
    if (q.numeral !== undefined) html += `<div class="q-visual"><span class="numeral-card">${esc(q.numeral)}</span></div>`;
    if (typeof q.tenFrame === 'number') html += `<div class="q-visual">${pv.tenFrameSVG(q.tenFrame)}</div>`;
    return html;
  }

  /** Spelling answers: capitals and surrounding spaces don't matter; every letter does. */
  function normSpell(s) {
    return String(s === undefined || s === null ? '' : s).trim().toLowerCase();
  }

  // Attributes that stop phones and browsers from correcting or suggesting spellings.
  const NO_ASSIST = 'autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"';


  // ---------- rline: one rounding problem on one number line, in small stages ----------
  // Stages: 'ends' (the two tens/hundreds) → 'mid' (halfway) → 'pick' (which way) → ['why'] → 'done' (explanation).
  // mode 'guided' (Learn, Practice Together): Check Answer per stage, one hint after a miss, Continue after a right answer.
  // mode 'test' (Test, On My Own): Back / Next part between stages, no checking, nothing filled in for the child.
  // The whole response (values, stage, feedback) lives in one object so a refresh restores it exactly.
  function rlInfo(q) {
    const e = pv.roundEnds(q.n, q.place);
    const r = pv.roundTo(q.n, q.place);
    return Object.assign(e, { r, side: r === e.hi ? 'hi' : 'lo', half: q.n === e.mid, w: q.place === 10 ? 'ten' : 'hundred' });
  }
  const rlStages = (q) => ['ends', 'mid', 'pick'].concat(q.why ? ['why'] : [], ['done']);
  function rlEmpty() { return { lo: '', hi: '', mid: '', pick: '', why: '', stage: 0, ok: {}, tries: {}, fb: null, confirm: false, complete: false }; }
  function rlNorm(r) { return r && typeof r === 'object' && !Array.isArray(r) ? Object.assign(rlEmpty(), r) : rlEmpty(); }
  const num = (v) => pv.parseWholeNumber(v);

  function rlStageOK(q, R, st) {
    const I = rlInfo(q);
    if (st === 'ends') return num(R.lo) === I.lo && num(R.hi) === I.hi;
    if (st === 'mid') return num(R.mid) === I.mid;
    if (st === 'pick') return R.pick === I.side;
    if (st === 'why') return R.why === q.why.answer;
    return true;
  }
  function rlStageBlank(R, st) {
    if (st === 'ends') return !String(R.lo).trim() || !String(R.hi).trim();
    if (st === 'mid') return !String(R.mid).trim();
    if (st === 'pick') return !R.pick;
    if (st === 'why') return !R.why;
    return false;
  }
  /** One specific hint about the current part after a miss (it never gives the answer). */
  function rlHint(q, R, st) {
    const I = rlInfo(q), n = pv.fmt(q.n), lo = pv.fmt(I.lo), mid = pv.fmt(I.mid);
    if (st === 'ends') {
      if (num(R.lo) !== I.lo) return q.place === 10 ? `Which ten is just below ${n}? Change the ones digit to 0.` : `Which hundred is just below ${n}? Change the tens and ones digits to 0.`;
      return `Count up one ${I.w} from ${lo}.`;
    }
    if (st === 'mid') return `Halfway is ${q.place === 10 ? '5' : '50'} more than ${lo}.`;
    if (st === 'pick') {
      if (I.half) return `${n} is exactly halfway. When a number is exactly halfway, we round up to the higher ${I.w}.`;
      return `Look at the dot. Is ${n} before or after halfway (${mid})?`;
    }
    if (st === 'why') return `Is ${n} before or after the halfway mark?`;
    return '';
  }
  function rlPraise(q, st) {
    const I = rlInfo(q), n = pv.fmt(q.n);
    if (st === 'ends') return `Yes! ${n} is between ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)}.`;
    if (st === 'mid') return `Yes! Halfway is ${pv.fmt(I.mid)}.`;
    if (st === 'pick') return I.half ? `Yes! ${n} is exactly halfway, so we round up to ${pv.fmt(I.r)}.` : `Yes! ${n} is closer to ${pv.fmt(I.r)}.`;
    return 'Yes!';
  }
  /** The closing sentence. Halfway: both ends are equally close, and the rule is to round up. */
  function rlExplain(q) {
    const I = rlInfo(q), n = pv.fmt(q.n), r = pv.fmt(I.r);
    return I.half ? `${n} is exactly halfway. ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)} are equally close, so we use the rule: round up to the higher ${I.w}. ${n} rounds to ${r}.`
      : `${n} is closer to ${r}, so it rounds to ${r}.`;
  }

  function rlLine(q, R, mode, key) {
    const I = rlInfo(q);
    const stages = rlStages(q);
    const st = mode === 'review' ? 'review' : stages[Math.min(R.stage, stages.length - 1)];
    const at = stages.indexOf(st);
    const past = (s) => mode === 'review' || (at > stages.indexOf(s));
    const guided = mode === 'guided';
    const pct = (v) => ((v - I.lo) / (I.hi - I.lo)) * 100;
    const box = (f, label, where) => `<input class="rl-input rl-${where}" data-f="${f}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}" value="${esc(R[f])}">`;
    // Guided: a part is shown with the right number once it is checked. Test/review: always the child's own entry.
    const shown = (f, v) => (guided ? pv.fmt(v) : (String(R[f]).trim() || '?'));
    const lab = (cls, text) => `<span class="rl-label ${cls}">${esc(text)}</span>`;
    let h = `<div class="rl-line" aria-hidden="${st === 'ends' || st === 'mid' ? 'false' : 'true'}"><div class="rl-track"><span class="nline-bar"></span>`;
    for (let k = 0; k <= 10; k++) h += `<span class="nline-tick${k % 5 === 0 ? ' is-major' : ''}" style="left:${k * 10}%"></span>`;
    const showDot = guided && (st === 'pick' || st === 'why' || st === 'done');
    if (st === 'done') {
      const a = Math.min(q.n, I.r), b = Math.max(q.n, I.r);
      h += `<span class="nline-go ${I.r > q.n ? 'is-up' : 'is-down'}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></span>`;
    }
    if (showDot) h += `<span class="nline-dot" style="left:${pct(q.n)}%"></span><span class="nline-point${pct(q.n) < 8 ? ' is-start' : pct(q.n) > 92 ? ' is-end' : ''}" style="left:${pct(q.n)}%">${pv.fmt(q.n)}</span>`;
    h += st === 'ends' ? box('lo', `Lower ${I.w}`, 'start') + box('hi', `Upper ${I.w}`, 'end')
      : lab('is-start' + (st === 'done' && I.side === 'lo' ? ' is-answer' : ''), shown('lo', I.lo)) + lab('is-end' + (st === 'done' && I.side === 'hi' ? ' is-answer' : ''), shown('hi', I.hi));
    if (st === 'mid') h += box('mid', 'Halfway', 'mid');
    else if (past('mid')) h += lab('is-mid', shown('mid', I.mid));
    h += `</div></div>`;
    return h;
  }

  function rlBody(q, R, mode, key) {
    const I = rlInfo(q);
    const stages = rlStages(q);
    const n = pv.fmt(q.n);
    if (mode === 'review') {
      return rlLine(q, R, 'review', key) + `<p class="rl-summary">${esc(describe(q, R))}</p>`;
    }
    const st = stages[Math.min(R.stage, stages.length - 1)];
    const guided = mode === 'guided';
    const lo = guided ? pv.fmt(I.lo) : (String(R.lo).trim() || `lower ${I.w}`);
    const hi = guided ? pv.fmt(I.hi) : (String(R.hi).trim() || `upper ${I.w}`);
    let task = '';
    let controls = '';
    if (st === 'ends') task = `What two ${I.w}s is ${n} between?`;
    if (st === 'mid') task = guided ? `What number is halfway between ${lo} and ${hi}?` : 'What number is halfway?';
    if (st === 'pick') {
      task = !guided ? `Which ${I.w} does ${n} round to?` : I.half ? `${n} is exactly halfway. Which ${I.w} do we round to?` : `Which ${I.w} is closer to ${n}?`;
      controls += `<div class="rl-pick" role="group" aria-label="${esc(task)}">` + [['lo', lo], ['hi', hi]].map(([side, text]) =>
        `<button type="button" class="rl-choice" data-rl-act="pick" data-side="${side}" aria-pressed="${R.pick === side}">${esc(text)}</button>`).join('') + `</div>`;
    }
    if (st === 'why') {
      task = q.why.label;
      controls += `<div class="q-choices" role="radiogroup" aria-label="${esc(task)}">` + q.why.choices.map((c) =>
        `<label class="choice"><input type="radio" name="${key}-why" value="${esc(c)}"${R.why === c ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') + `</div>`;
    }
    if (st === 'done') task = rlExplain(q);
    const fb = guided && R.fb && R.fb.stage === st ? `<div class="feedback feedback-${R.fb.kind}"><p>${R.fb.kind === 'no' ? '<b>Not quite.</b> ' : ''}${esc(R.fb.text)}</p></div>` : '';
    let actions = '';
    if (guided) {
      if (st !== 'done' && !R.ok[st]) actions += `<button type="button" class="btn btn-primary" data-rl-act="check">Check Answer</button>`;
      if (st !== 'done' && R.ok[st]) actions += `<button type="button" class="btn btn-primary" data-rl-act="next">Continue →</button>`;
    } else if (R.stage < stages.length - 2) {
      actions += `<button type="button" class="btn btn-primary" data-rl-act="next">Next part →</button>`;
    }
    const back = R.stage > 0 ? `<button type="button" class="btn btn-ghost" data-rl-act="back">← Back a part</button>` : '';
    const over = !guided ? '' : R.confirm
      ? `<div class="rl-confirm" role="alertdialog" aria-label="Start this problem over?"><p><b>Start this problem over?</b></p>` +
        `<button type="button" class="btn btn-primary" data-rl-act="over-yes">Start Over</button> <button type="button" class="btn btn-ghost" data-rl-act="over-no">Cancel</button></div>`
      : `<button type="button" class="btn btn-ghost rl-over" data-rl-act="over">Start Over</button>`;
    const count = stages.length - (guided ? 1 : 1);
    const partNo = Math.min(R.stage + 1, count);
    return `<p class="rl-part">${st === 'done' ? 'Done!' : `Part ${partNo} of ${count}`}</p>` + rlLine(q, R, mode, key) +
      `<p class="rl-task${st === 'done' ? ' is-done' : ''}" tabindex="-1">${esc(task)}</p>${controls}` +
      `<div class="rl-feedback" aria-live="polite">${fb}<p class="feedback feedback-info" data-rl-empty hidden>Type or choose an answer first.</p></div>` +
      `<div class="rl-actions">${actions}</div><div class="rl-nav">${back}${over}</div>`;
  }

  // =====================================================================================
  // Chapter 2 controls (DESIGN.md §4): shared pieces, `chain`, `vcalc`, and marks.
  // Every response is plain JSON. Modes: 'guided' (Learn Your Turn, Practice Together: helper lines on),
  // 'test' (Take a Test, On My Own before checking: only the child's entries), 'review' (read-only, ✓/✗ per box).
  // =====================================================================================
  const MINUS = '−';
  const isMinus = (op) => op === '−' || op === '-';
  const blankStr = (v) => String(v === undefined || v === null ? '' : v).trim() === '';
  const opWord = (op) => (op === '+' ? 'plus' : isMinus(op) ? 'minus' : op === '=' ? 'equals' : String(op));
  const opGlyph = (op) => (op === '-' ? MINUS : String(op));
  const PLACE_KEYS = ['O', 'T', 'H', 'Th', 'TTh', 'HTh'];
  const PLACE_NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands', 'hundred thousands'];
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const parity = (n) => (n % 2 ? 'odd' : 'even');
  const sumOf = (a) => a.reduce((x, y) => x + y, 0);
  const clone = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x));
  const INPUT_ATTRS = 'type="text" inputmode="numeric" autocomplete="off" spellcheck="false"';

  /** Escaped text with every ___ drawn as an empty box (DESIGN §2). */
  function withBlanks(s) {
    return esc(s).split('___').join('<span class="blank" role="img" aria-label="blank"></span>');
  }

  /** The q.figure slot: drawn by Mathbook.fig (assets/js/figures.js) when that file is loaded; nothing otherwise. */
  function figureHTML(spec) {
    if (!spec || !MB.fig || typeof MB.fig.render !== 'function') return '';
    return MB.fig.render(spec);
  }

  function markBadge(m) {
    if (m === true) return '<span class="mk" aria-hidden="true">✓</span><span class="sr-only"> (right)</span>';
    if (m === false) return '<span class="mk" aria-hidden="true">✗</span><span class="sr-only"> (not right)</span>';
    return '';
  }
  /** An answer box (editable) or, in review, the child's entry with a ✓/✗ badge. */
  function boxHTML(ctx, k, val, label, cls, extra) {
    if (ctx.mode === 'review') {
      const shown = blankStr(val) ? '—' : String(val).trim();
      const m = ctx.bad ? !ctx.bad.has(k) : undefined;
      return `<span class="cell is-read ${cls || ''}${m === true ? ' mk-ok' : m === false ? ' mk-no' : ''}" data-k="${esc(k)}">${esc(shown)}${markBadge(m)}</span>`;
    }
    const attrs = /\bis-text\b/.test(cls || '') ? 'type="text" inputmode="text" autocomplete="off" spellcheck="false"' : INPUT_ATTRS;
    return `<span class="cell ${cls || ''}"><input class="ci" data-k="${esc(k)}" ${attrs} aria-label="${esc(label)}" value="${esc(blankStr(val) ? '' : String(val))}"${extra || ''}></span>`;
  }

  // ---------- Arrow layout (F1 and the chain `adjust` preset): a 5-column grid  num op num = res ----------
  /** o: { top: [5 html], bottom: [5 html], tags: [html, html], showArrows, showBottom, cls } */
  function arrowGrid(o) {
    const row = (cells, r) => cells.map((c, j) => `<span class="ar-c${j % 2 ? ' ar-sym' : ''}" style="grid-row:${r};grid-column:${j + 1}">${c}</span>`).join('');
    let h = `<div class="ar-grid ${o.cls || ''}">` + row(o.top, 1);
    if (o.showArrows !== false) {
      [0, 2].forEach((j, t) => {
        const tag = o.tags && o.tags[t] !== undefined && o.tags[t] !== null ? o.tags[t] : '';
        h += `<span class="ar-arrow" style="grid-row:2;grid-column:${j + 1}" aria-hidden="true">${tag}<span class="ar-shaft"></span><span class="ar-head"></span></span>`;
      });
    }
    if (o.showBottom !== false) h += row(o.bottom, 3);
    return h + `</div>`;
  }

  // ---------- Vertical stack layout (F7 display and the vcalc control) ----------
  // Columns are right-aligned by place (ones at the right). Addition gets one extra column on the left (for a regroup
  // into a new place); its operator sits in that column of the last addend row. Subtraction gets a narrow operator column.
  // Commas are 6px separator columns between thousands and hundreds.
  function stackHTML(S, ctx) {
    ctx = ctx || { mode: 'display' };
    const display = ctx.mode === 'display';
    const op = isMinus(S.op) ? MINUS : '+';
    const rows = S.rows.filter((n) => n !== undefined && n !== null);
    const len = (n) => String(n).length;
    const maxLen = Math.max(...rows.map(len));
    const answer = S.answer !== undefined ? S.answer : op === '+' ? sumOf(rows) : rows[0] - rows[1];
    const cols = S.cols || (op === '+' ? maxLen + 1 : Math.max(maxLen, len(answer)));
    const partials = S.partials || null;
    const noteOn = !!(partials && partials.some((p) => p.note !== undefined && p.note !== null && p.note !== '' || ctx.noteInputs));
    const opCol = op !== '+';
    const commaOn = cols >= 4 && (maxLen >= 4 || len(answer) >= 4 || (partials || []).some((p) => len(p.v) >= 4));
    const base = 1 + (noteOn ? 1 : 0) + (opCol ? 1 : 0);
    const placeOf = (i) => cols - 1 - i;
    const gc = (i) => base + i + (commaOn && placeOf(i) <= 2 ? 1 : 0);
    const commaCol = base + (cols - 4) + 1;
    const opAt = opCol ? base - 1 : gc(0);
    const tmpl = (noteOn ? 'auto ' : '') + (opCol ? 'var(--vc-op) ' : '') +
      Array.from({ length: cols }, (_, i) => (commaOn && placeOf(i) === 2 ? 'var(--vc-comma) ' : '') + 'var(--vc-col)').join(' ');
    const bad = ctx.bad || null;
    const look = S.focus ? PLACE_KEYS.indexOf(S.focus) : -1;
    let h = '';
    let r = 0;
    const cell = (row, col, html, cls) => `<span class="vc-c ${cls || ''}${look >= 0 && col === gc(cols - 1 - look) ? ' is-look' : ''}" style="grid-row:${row};grid-column:${col}">${html}</span>`;
    const comma = (row) => (commaOn ? `<span class="vc-c vc-comma" style="grid-row:${row};grid-column:${commaCol}" aria-hidden="true">,</span>` : '');
    const digitBox = (k, val, label) => {
      if (ctx.mode === 'review') {
        // An empty box that should stay empty (a leading place) gets no badge.
        const m = bad ? (bad.has(k) ? false : blankStr(val) ? undefined : true) : undefined;
        return `<span class="cell vc-box is-read${m === true ? ' mk-ok' : m === false ? ' mk-no' : ''}" data-k="${k}">${esc(blankStr(val) ? '' : String(val).trim())}${markBadge(m)}</span>`;
      }
      return `<span class="cell vc-box"><input class="ci vc-in" data-k="${k}" ${INPUT_ATTRS} maxlength="1" aria-label="${esc(label)}" value="${esc(blankStr(val) ? '' : String(val))}"></span>`;
    };
    const R = ctx.R || {};
    // Header row (place letters in place colours).
    if (S.places) {
      r++;
      for (let i = 0; i < cols; i++) {
        const p = placeOf(i);
        h += cell(r, gc(i), `<span class="vc-ph ph-${p >= 3 ? 'th' : ['on', 'te', 'hu'][p]}">${PLACE_KEYS[p] || ''}</span>`, 'vc-head');
      }
    }
    // Regroup row: display carries ({ T: 1 }) or optional, ungraded inputs.
    if (ctx.carryInputs || S.carries) {
      r++;
      for (let i = 0; i < cols - 1; i++) {
        const p = placeOf(i);
        if (ctx.carryInputs) {
          const k = `c:${i}`;
          const v = (R.c || [])[i];
          h += cell(r, gc(i), ctx.mode === 'review'
            ? `<span class="vc-carry is-read">${esc(blankStr(v) ? '' : v)}</span>`
            : `<input class="ci vc-carry" data-k="${k}" ${INPUT_ATTRS} maxlength="1" aria-label="regroup mark over the ${PLACE_NAMES[p]}, optional" value="${esc(blankStr(v) ? '' : v)}">`, 'vc-carrycell');
        } else if (S.carries[PLACE_KEYS[p]] !== undefined) {
          h += cell(r, gc(i), `<span class="vc-carry-d">${esc(S.carries[PLACE_KEYS[p]])}</span>`, 'vc-carrycell');
        }
      }
    }
    // Addend rows (missing high places are blank, never 0).
    const blanks = S.blanks || {};
    const rowKey = (ri) => (ri === 0 ? 'top' : ri === rows.length - 1 ? 'bottom' : 'mid');
    const startRow = r + 1;
    rows.forEach((n, ri) => {
      r++;
      const s = String(n);
      const key = rowKey(ri);
      const shift = S.misalign === 'left' && ri === rows.length - 1 && ri > 0 ? len(rows[0]) - s.length : 0;
      for (let k = 0; k < s.length; k++) {
        const p = s.length - 1 - k;
        const i = cols - 1 - p - shift;
        const want = (blanks[key] || []).includes(PLACE_KEYS[p]);
        let html;
        if (want && !display) {
          const bk = `b:${key}:${PLACE_KEYS[p]}`;
          html = digitBox(bk, (R.b || {})[bk], `missing ${PLACE_NAMES[p]} digit of the ${key === 'top' ? 'top number' : key === 'bottom' ? 'bottom number' : 'middle number'}`);
        } else if (want) html = `<span class="vc-hole" aria-hidden="true"></span>`;
        else html = `<span class="vc-d" aria-hidden="true">${s[k]}</span>`;
        h += cell(r, gc(i), html);
      }
      if (s.length >= 4 && !shift) h += comma(r);
      if (ri === rows.length - 1 && ri > 0) h += `<span class="vc-c vc-op" style="grid-row:${r};grid-column:${opAt}" aria-hidden="true">${op}</span>`;
      if (shift) h += `<span class="vc-mis" style="grid-row:${r};grid-column:${gc(cols - s.length - shift)} / ${gc(cols - 1 - shift) + 1}" aria-hidden="true"></span>`;
    });
    r++;
    h += `<span class="vc-rule" style="grid-row:${r};grid-column:${opCol ? base - 1 : base} / -1" aria-hidden="true"></span>`;
    if (partials) {
      const shownP = S.reveal !== undefined ? Math.min(S.reveal, partials.length) : partials.length;
      partials.forEach((pp, k) => {
        r++;
        if (noteOn) {
          // Each note gets a spare grid row above its partial: on a narrow card (container query) the note moves
          // up into it, right-aligned over the digit columns, instead of squeezing the columns.
          r++;
          const pos = `grid-row:var(--rw);grid-column:var(--cw);--rw:${r};--rn:${r - 1};--cw:1;--cn:${gc(0)} / -1`;
          if (ctx.noteInputs) h += `<span class="vc-c vc-notec" style="${pos}">${boxHTML(ctx, `n:${k}`, (R.n || [])[k], `${cap(PLACE_NAMES[pp.place])}: the place values you add, like 300 + 100`, 'vc-note-in is-text')}</span>`;
          else if (pp.note) h += `<span class="vc-c vc-note" style="${pos}">${esc(pp.note)}</span>`;
        }
        if (k === partials.length - 1 && partials.length > 1) h += `<span class="vc-c vc-op" style="grid-row:${r};grid-column:${opAt}" aria-hidden="true">+</span>`;
        if (ctx.partialInputs) {
          h += `<span class="vc-c vc-span" style="grid-row:${r};grid-column:${gc(1)} / -1">${boxHTML(ctx, `p:${k}`, (R.p || [])[k], `${cap(PLACE_NAMES[pp.place])} partial sum`, 'vc-wide')}</span>`;
        } else if (k < shownP && !S.hideResults) {
          const s = String(pp.v);
          for (let j = 0; j < s.length; j++) h += cell(r, gc(cols - s.length + j), `<span class="vc-d vc-part" aria-hidden="true">${s[j]}</span>`);
          if (s.length >= 4) h += comma(r);
        }
      });
      r++;
      h += `<span class="vc-rule" style="grid-row:${r};grid-column:${opCol ? base - 1 : base} / -1" aria-hidden="true"></span>`;
      r++;
      if (ctx.partialInputs) h += `<span class="vc-c vc-span" style="grid-row:${r};grid-column:${gc(0)} / -1">${boxHTML(ctx, 's', R.s, 'Sum', 'vc-wide')}</span>`;
      else if (S.total !== undefined && S.total !== null && (S.reveal === undefined || S.reveal > partials.length) && !S.hideResults) {
        const s = String(S.total);
        for (let j = 0; j < s.length; j++) h += cell(r, gc(cols - s.length + j), `<span class="vc-d vc-total" aria-hidden="true">${s[j]}</span>`);
        if (s.length >= 4) h += comma(r);
      }
    } else if (ctx.digitInputs || (blanks.result && blanks.result.length) || (S.result !== undefined && S.result !== 'none')) {
      r++;
      const s = String(answer);
      if (ctx.digitInputs) {
        for (let i = 0; i < cols; i++) h += cell(r, gc(i), digitBox(`d:${i}`, (R.d || [])[i], `${PLACE_NAMES[placeOf(i)]} digit of the answer`));
        if (commaOn) h += comma(r);
      } else {
        const show = S.result === 'all' || S.result === undefined ? s.length : Number(S.result) || 0;
        for (let k = 0; k < s.length; k++) {
          const p = s.length - 1 - k;
          const want = (blanks.result || []).includes(PLACE_KEYS[p]);
          let html = '';
          if (want && !display) html = digitBox(`b:result:${PLACE_KEYS[p]}`, (R.b || {})[`b:result:${PLACE_KEYS[p]}`], `missing ${PLACE_NAMES[p]} digit of the answer`);
          else if (want) html = `<span class="vc-hole" aria-hidden="true"></span>`;
          else if (p < show || (blanks.result && blanks.result.length)) html = `<span class="vc-d vc-ans" aria-hidden="true">${s[k]}</span>`;
          if (html) h += cell(r, gc(cols - 1 - p), html);
        }
        if (s.length >= 4 && (show >= 4 || (blanks.result && blanks.result.length))) h += comma(r);
      }
    }
    const focusBg = look >= 0 ? `<span class="vc-focus" style="grid-row:${startRow} / ${r + 1};grid-column:${gc(cols - 1 - look)}" aria-hidden="true"></span>` : '';
    return `<div class="vc-grid" style="grid-template-columns:${tmpl}">${focusBg}${h}</div>`;
  }

  /** Words for a stacked problem: "2,457 plus 1,368". */
  function stackWords(rows, op) {
    return rows.filter((n) => n !== undefined && n !== null).map((n) => pv.fmt(n)).join(` ${opWord(op)} `);
  }

  // ---------- Marks (guided: after Check Answer; review uses render) ----------
  /** Puts ✓ on every box when the answer is right, or ✗ on only the wrong boxes. New controls only (Decision 26). */
  function applyMarks(el, q, r) {
    if (!el || !CHECK[q.type]) return;
    clearMarks(el);
    const res = CHECK[q.type](q, r);
    const bad = new Set(res.bad);
    el.querySelectorAll('input[data-k]').forEach((inp) => {
      const k = inp.dataset.k;
      if (k.startsWith('c:')) return; // regroup marks are never graded
      const wrong = bad.has(k);
      if (!wrong && (!res.ok || !inp.value.trim())) return; // an empty leading box that is right stays unmarked
      const box = inp.closest('.cell') || inp.parentElement;
      box.classList.add(wrong ? 'mk-no' : 'mk-ok');
      box.insertAdjacentHTML('beforeend', `<span class="mk js-mk" aria-hidden="true">${wrong ? '✗' : '✓'}</span>`);
      if (wrong) inp.setAttribute('aria-invalid', 'true');
    });
  }
  function clearMarks(el) {
    if (!el) return;
    el.querySelectorAll('.js-mk').forEach((m) => m.remove());
    el.querySelectorAll('.cell.mk-ok, .cell.mk-no').forEach((c) => { if (!c.classList.contains('is-read')) c.classList.remove('mk-ok', 'mk-no'); });
    el.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
  }

  // ===================== chain: equation-chain control (DESIGN §4.2) =====================
  function treeCfg(n, t) {
    t = t || {};
    const min = t.min || 2, max = t.max || 4;
    return { n, min, max, start: t.given ? t.given.length : Math.min(max, Math.max(min, t.start || 3)), given: t.given || null };
  }
  function chTrees(q) {
    if (q.preset === 'steps') return [treeCfg(q.b, q.tree)];
    if (q.preset === 'trees') return Array.from({ length: q.count || 2 }, () => treeCfg(q.n, q.tree));
    return [];
  }
  function chNorm(q, r) {
    const R = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
    const out = { v: Object.assign({}, R.v || {}), t: [] };
    chTrees(q).forEach((T, ti) => {
      if (T.given) { out.t[ti] = T.given.map(String); return; }
      const a = Array.isArray(R.t && R.t[ti]) ? R.t[ti].map((x) => (x === undefined || x === null ? '' : String(x))) : Array(T.start).fill('');
      while (a.length < T.min) a.push('');
      out.t[ti] = a.slice(0, T.max);
    });
    return out;
  }
  function chVal(R, id) {
    if (id.indexOf('t:') === 0) { const p = id.split(':'); return (R.t[Number(p[1])] || [])[Number(p[2])]; }
    return R.v[id];
  }

  /** Expands a chain question (and the current response) into rows, trees, a final line and rules. */
  function chainSpec(q, R) {
    const S = { rows: [], trees: chTrees(q), final: null, layout: 'rows' };
    const p = q.preset;
    if (p === 'free') {
      const ad = q.addends || [{}, {}];
      S.rows = [{ cells: [{ in: 'a', digits: ad[0].digits, label: 'First addend' }, '+', { in: 'b', digits: ad[1].digits, label: 'Second addend' }, '=', { in: 's', label: 'Sum' }],
        true: true, parities: [ad[0].parity || null, ad[1].parity || null], anyOrder: q.anyOrder !== false }];
    } else if (p === 'rows') {
      const adds = q.addends;
      const L = Math.max(...adds.map((a) => String(a).length));
      const given = q.given === 'places';
      const last = [];
      for (let pl = L - 1; pl >= 0; pl--) {
        const vals = adds.map((a) => (Math.floor(a / 10 ** pl) % 10) * 10 ** pl);
        const cells = [];
        vals.forEach((v, i) => {
          if (i) cells.push('+');
          cells.push(given ? v : { in: `p${pl}_${i}`, answer: v, label: `${cap(PLACE_NAMES[pl])} of the ${ORD[i]} addend` });
        });
        cells.push('=', { in: `s${pl}`, answer: sumOf(vals), label: `${cap(PLACE_NAMES[pl])} partial sum` });
        S.rows.push({ cells, commute: true, tag: cap(PLACE_NAMES[pl]) });
        if (last.length) last.push('+');
        last.push({ echo: `s${pl}` });
      }
      last.push('=', { in: 'S', answer: sumOf(adds), label: 'Sum' });
      S.rows.push({ cells: last, tag: 'Sum' });
    } else if (p === 'steps') {
      const T = S.trees[0];
      S.rows = R.t[0].map((_, k) => ({
        cells: [k ? { echo: `r${k - 1}` } : q.a, MINUS, T.given ? Number(T.given[k]) : { echo: `t:0:${k}` }, '=', { in: `r${k}`, label: `Step ${k + 1} answer` }],
        true: true, step: true
      }));
      S.final = { in: 'f', label: (q.final && q.final.label) || `So ${pv.fmt(q.a)} − ${pv.fmt(q.b)} =`, answer: q.a - q.b };
    } else if (p === 'trees') {
      S.differ = q.differ !== false;
    } else if (p === 'adjust') {
      S.layout = 'adjust';
      const op = isMinus(q.op) ? MINUS : '+';
      S.adj = { a: q.a, b: q.b, op, res: op === '+' ? q.a + q.b : q.a - q.b };
      const lab = q.labels || [];
      S.rows = [{ cells: [{ in: 'na', label: lab[0] || `${pv.fmt(q.a)} becomes` }, op, { in: 'nb', label: lab[1] || `${pv.fmt(q.b)} becomes` }, '=',
        { in: 'r', label: lab[2] || (q.oneNumber ? 'Answer for the new numbers' : op === '+' ? 'Sum' : 'Difference') }] }];
      if (q.oneNumber) S.final = { in: 'f', label: (q.final && q.final.label) || `So ${pv.fmt(q.a)} ${op} ${pv.fmt(q.b)} =`, answer: S.adj.res };
    } else {
      S.rows = (q.rows || []).map((row) => Object.assign({}, row));
      if (q.final) S.final = Object.assign({ in: 'f' }, q.final);
    }
    return S;
  }

  /** Every input of a chain as { k, label } (tree parts and the final line included). */
  function chInputs(S, R) {
    const out = [];
    S.trees.forEach((T, ti) => { if (!T.given) R.t[ti].forEach((_, k) => out.push({ k: `t:${ti}:${k}` })); });
    S.rows.forEach((row) => row.cells.forEach((c) => { if (c && typeof c === 'object' && c.in) out.push({ k: 'v:' + c.in, cell: c }); }));
    if (S.final) out.push({ k: 'v:' + S.final.in, cell: S.final });
    return out;
  }
  const chGet = (R, k) => (k.indexOf('v:') === 0 ? R.v[k.slice(2)] : chVal(R, k));

  function cellValue(c, R) {
    if (typeof c === 'number') return c;
    if (c === '?') return null;
    if (c && typeof c === 'object') return pv.parseWholeNumber(c.in ? R.v[c.in] : chVal(R, c.echo));
    return null;
  }
  function cellText(c, R) {
    if (typeof c === 'number') return pv.fmt(c);
    if (typeof c === 'string') return opGlyph(c);
    const v = c.in ? R.v[c.in] : chVal(R, c.echo);
    return blankStr(v) ? '—' : String(v).trim();
  }
  function evalSide(cells, R) {
    let total = null, op = '+';
    for (const c of cells) {
      if (typeof c === 'string' && c !== '?') { op = c; continue; }
      const v = cellValue(c, R);
      if (v === null) return null;
      total = total === null ? v : isMinus(op) ? total - v : total + v;
    }
    return total;
  }

  function chRowCheck(q, row, ri, R, S, fail) {
    const N = pv.parseWholeNumber;
    const cells = row.cells;
    const eq = cells.indexOf('=');
    const ins = cells.map((c, j) => ({ c, j })).filter((x) => x.c && typeof x.c === 'object' && x.c.in);
    const where = row.tag ? `the ${row.tag.toLowerCase()} line` : S.rows.length > 1 ? `step ${ri + 1}` : 'the equation';
    const val = (x) => N(R.v[x.c.in]);
    const key = (x) => 'v:' + x.c.in;
    const missing = ins.filter((x) => val(x) === null);
    if (missing.length) fail(missing.map(key), `Write a whole number in every box of ${where}.`);
    ins.forEach((x) => {
      const v = val(x);
      if (v === null) return;
      if (x.c.digits && String(v).length !== x.c.digits) fail([key(x)], `${pv.fmt(v)} is not a ${x.c.digits}-digit number.`);
      else if (x.c.parity && parity(v) !== x.c.parity) fail([key(x)], `${pv.fmt(v)} is ${parity(v)}, but it needs to be ${x.c.parity}.`);
    });
    const left = ins.filter((x) => eq < 0 || x.j < eq);
    const lhs = cells.slice(0, eq < 0 ? cells.length : eq).map((c) => cellText(c, R)).join(' ');
    // Parity sentence (preset free): the two addends' parities as a set when anyOrder, else in order.
    if (row.parities && row.parities.some(Boolean) && left.length >= 2 && left.slice(0, 2).every((x) => val(x) !== null)) {
      const need = row.parities, got = left.slice(0, 2).map((x) => parity(val(x)));
      const fits = (a, b) => (!need[0] || need[0] === a) && (!need[1] || need[1] === b);
      if (!(fits(got[0], got[1]) || (row.anyOrder && fits(got[1], got[0])))) {
        const rhs = eq >= 0 ? cells.slice(eq + 1).map((c) => cellText(c, R)).join(' ') : '';
        const head = `${lhs}${rhs ? ' = ' + rhs : ''}: `;
        if (need[0] && need[0] === need[1]) {
          const off = left.slice(0, 2).filter((x) => parity(val(x)) !== need[0]);
          fail(off.map(key), `${head}${pv.fmt(val(off[0]))} is ${parity(val(off[0]))}, but the sentence needs two ${need[0]} numbers.`);
        } else if (need[0] && need[1] && row.anyOrder) {
          fail(left.slice(0, 2).map(key), `${head}${pv.fmt(val(left[0]))} and ${pv.fmt(val(left[1]))} are both ${got[0]}, but the sentence needs one even and one odd number.`);
        } else {
          const off = left.slice(0, 2).filter((x, i) => need[i] && got[i] !== need[i]);
          fail(off.map(key), `${head}${pv.fmt(val(off[0]))} is ${parity(val(off[0]))}, but it needs to be ${need[left.indexOf(off[0])]}.`);
        }
      }
    }
    // Exact answers; with commute the operand boxes before = are graded as a set.
    const group = row.commute ? left.filter((x) => x.c.answer !== undefined) : [];
    if (group.length) {
      const pool = group.map((x) => x.c.answer);
      const wrong = [];
      group.forEach((x) => { const v = val(x); const i = pool.indexOf(v); if (v !== null && i >= 0) pool.splice(i, 1); else if (v !== null) wrong.push(x); });
      if (wrong.length) fail(wrong.map(key), `Look again at ${where}.`);
    }
    ins.filter((x) => x.c.answer !== undefined && !group.includes(x) && val(x) !== null && val(x) !== x.c.answer)
      .forEach((x) => fail([key(x)], `Look again at ${where}.`));
    // A true equation using the typed values (decision 9: steps use the child's own earlier results).
    if (row.true && eq >= 0) {
      const a = evalSide(cells.slice(0, eq), R), b = evalSide(cells.slice(eq + 1), R);
      if (a !== null && b !== null && a !== b) {
        const right = ins.filter((x) => x.j > eq);
        fail((right.length ? right : left).map(key), row.step || right.length ? `Check ${lhs}.` : `Check your adding.`);
      }
    }
  }

  function adjustCheck(q, R, S, fail) {
    const N = pv.parseWholeNumber;
    const { a, b, op, res } = S.adj;
    const plus = op === '+';
    const na = N(R.v.na), nb = N(R.v.nb), rr = N(R.v.r);
    const both = ['v:na', 'v:nb'];
    const calc = (x, y) => (plus ? x + y : x - y);
    if (na === null || nb === null) fail(both.filter((k) => N(R.v[k.slice(2)]) === null), 'Write both new numbers.');
    else if (q.oneNumber) {
      const changed = (na !== a ? 1 : 0) + (nb !== b ? 1 : 0);
      if (changed !== 1) fail(both, changed ? 'Change just one of the numbers.' : 'Change one number to make it easier.');
    } else {
      const da = na - a, db = nb - b;
      if (na < 1 || nb < 1) fail(both, 'Use whole numbers, 1 or more.');
      else if (da === 0 && db === 0) fail(both, 'Change the numbers to make them easier to work with.');
      else if (plus && na === b && nb === a) fail(both, 'Switching the order is not adjusting. Change the numbers.');
      else if (plus ? da + db !== 0 : da !== db) {
        let m;
        if (plus) m = da === 0 || db === 0 ? 'You changed only one number. Take from one addend and give the same amount to the other.'
          : Math.sign(da) === Math.sign(db) ? 'You changed both numbers the same way. In adding, one goes up and the other goes down.'
            : 'Take from one number exactly what you give to the other.';
        else m = da === 0 || db === 0 ? 'You changed only one number. In subtracting, change both numbers by the same amount.'
          : Math.sign(da) !== Math.sign(db) ? 'You changed them opposite ways. In subtracting, change both the same way.'
            : 'Change both numbers by the same amount.';
        fail(both, m);
      }
    }
    const want = q.oneNumber ? (na !== null && nb !== null ? calc(na, nb) : null) : res;
    if (rr === null) fail(['v:r'], 'Write the answer.');
    else if (want !== null && rr !== want) fail(['v:r'], na !== null && nb !== null ? `Check ${pv.fmt(na)} ${op} ${pv.fmt(nb)}.` : 'Look again at the answer.');
  }

  /** { ok, bad: [input keys], msg: the first problem in words (never the answer) }. */
  function chainCheck(q, r) {
    const N = pv.parseWholeNumber;
    const R = chNorm(q, r);
    const S = chainSpec(q, R);
    const bad = new Set();
    let msg = '';
    const fail = (keys, m) => { keys.forEach((k) => bad.add(k)); if (!msg && m) msg = m; };
    const treeOK = [];
    S.trees.forEach((T, ti) => {
      treeOK[ti] = true;
      if (T.given) return;
      const vals = R.t[ti];
      const keys = vals.map((_, k) => `t:${ti}:${k}`);
      const nums = vals.map(N);
      const pre = S.trees.length > 1 ? `Way ${ti + 1}: ` : '';
      const badK = keys.filter((k, i) => nums[i] === null || nums[i] < 1);
      if (badK.length) { treeOK[ti] = false; fail(badK, `${pre}Write each part as a whole number, 1 or more.`); return; }
      if (vals.length < T.min || vals.length > T.max) { treeOK[ti] = false; fail(keys, `${pre}Use ${T.min} to ${T.max} parts.`); return; }
      const sum = sumOf(nums);
      if (sum !== T.n) { treeOK[ti] = false; fail(keys, `${pre}Your parts add to ${pv.fmt(sum)}, not ${pv.fmt(T.n)}.`); }
    });
    if (S.differ && S.trees.length > 1 && treeOK.every(Boolean)) {
      const sig = (ti) => R.t[ti].map(N).sort((x, y) => x - y).join(',');
      for (let ti = 1; ti < S.trees.length; ti++) {
        for (let tj = 0; tj < ti; tj++) {
          if (sig(ti) === sig(tj)) fail(R.t[ti].map((_, k) => `t:${ti}:${k}`), `Both ways use the same parts. Break ${pv.fmt(S.trees[ti].n)} apart a different way.`);
        }
      }
    }
    if (S.adj) adjustCheck(q, R, S, fail);
    else S.rows.forEach((row, ri) => chRowCheck(q, row, ri, R, S, fail));
    if (S.final) {
      const v = N(R.v[S.final.in]);
      const k = 'v:' + S.final.in;
      if (v === null) fail([k], 'Write the answer.');
      else if (v !== S.final.answer) {
        let m = 'Look again at the answer.';
        if (q.preset === 'steps') {
          const last = N(R.v['r' + (R.t[0].length - 1)]);
          if (last !== null && last !== v) m = `Your last step shows ${pv.fmt(last)}. Write it as the answer.`;
        } else if (q.oneNumber && S.adj) {
          const na = N(R.v.na), nb = N(R.v.nb);
          const k2 = na !== null && nb !== null ? Math.abs((na - S.adj.a) || (nb - S.adj.b)) : 0;
          m = k2 ? `You changed one number by ${pv.fmt(k2)}. Fix the answer so it matches ${pv.fmt(S.adj.a)} ${S.adj.op} ${pv.fmt(S.adj.b)}.` : m;
        }
        fail([k], m);
      }
    }
    return { ok: bad.size === 0 && !msg, bad: Array.from(bad), msg };
  }

  /** Place-value parts of n (non-zero places), split or merged to fit min..max parts. */
  function decompose(n, min, max) {
    const s = String(n);
    let parts = s.split('').map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean);
    while (parts.length < min) {
      parts.sort((x, y) => y - x);
      const big = parts[0];
      if (big < 2) break;
      const half = Math.floor(big / 2);
      parts = [big - half, half].concat(parts.slice(1)).sort((x, y) => y - x);
    }
    while (parts.length > max) { parts.sort((x, y) => y - x); const t = parts.pop() + parts.pop(); parts.push(t); }
    return parts.sort((x, y) => y - x);
  }

  function adjustSuggest(q) {
    const a = q.a, b = q.b, plus = !isMinus(q.op);
    const up = (x) => (x % 10 ? 10 - (x % 10) : x % 100 ? 100 - (x % 100) : 0);
    if (q.oneNumber) {
      const k = up(b) || 10;
      return { na: a, nb: b + k };
    }
    if (plus) {
      let k = up(b);
      if (k && a - k >= 1) return { na: a - k, nb: b + k };
      k = up(a);
      if (k && b - k >= 1) return { na: a + k, nb: b - k };
      return { na: a + 1, nb: b - 1 };
    }
    // Subtraction: move both the same way to the nearest ten (333 − 212 → 331 − 210, 364 − 198 → 366 − 200).
    const d = b % 10;
    if (d && d <= 4 && b - d >= 1) return { na: a - d, nb: b - d };
    const k = up(b) || 10;
    return { na: a + k, nb: b + k };
  }

  function chainCorrect(q) {
    const R = chNorm(q);
    const f = pv.fmt;
    if (q.preset === 'free') {
      const ad = q.addends || [{}, {}];
      const pickN = (x, i) => {
        const d = x.digits || 3;
        const base = 10 ** (d - 1), span = 10 ** d - base;
        let n = base + Math.floor(span * (i ? 0.47 : 0.21));
        if (x.parity && parity(n) !== x.parity) n += 1;
        return n;
      };
      const A = pickN(ad[0], 0), B = pickN(ad[1], 1);
      R.v = { a: f(A), b: f(B), s: f(A + B) };
      return R;
    }
    if (q.preset === 'steps') {
      const T = chTrees(q)[0];
      const parts = T.given ? T.given.map(Number) : decompose(q.b, T.min, T.max);
      R.t[0] = parts.map(String);
      let cur = q.a;
      parts.forEach((p, k) => { cur -= p; R.v[`r${k}`] = f(cur); });
      R.v.f = f(q.a - q.b);
      return R;
    }
    if (q.preset === 'trees') {
      const T = chTrees(q)[0];
      const seen = new Set();
      const ways = [decompose(q.n, T.min, T.max)];
      seen.add(ways[0].slice().sort((x, y) => x - y).join(','));
      for (let k = 10; ways.length < (q.count || 2) && k < q.n * 10; k = k === 10 ? 1 : k + 1) {
        if (k >= q.n) continue;
        const w = [q.n - k, k];
        const sig = w.slice().sort((x, y) => x - y).join(',');
        if (!seen.has(sig) && w.length >= T.min) { seen.add(sig); ways.push(w); }
      }
      ways.forEach((w, ti) => { R.t[ti] = w.map(String); });
      return R;
    }
    if (q.preset === 'adjust') {
      const s = adjustSuggest(q);
      const plus = !isMinus(q.op);
      R.v = { na: f(s.na), nb: f(s.nb), r: f(plus ? s.na + s.nb : s.na - s.nb) };
      if (q.oneNumber) R.v.f = f(plus ? q.a + q.b : q.a - q.b);
      return R;
    }
    const S = chainSpec(q, R);
    S.rows.forEach((row) => {
      row.cells.forEach((c) => { if (c && typeof c === 'object' && c.in && c.answer !== undefined) R.v[c.in] = f(c.answer); });
    });
    // A true row with one unanswered box after =: work it out from the others.
    S.rows.forEach((row) => {
      const eq = row.cells.indexOf('=');
      const free = row.cells.filter((c) => c && typeof c === 'object' && c.in && c.answer === undefined);
      if (row.true && eq >= 0 && free.length === 1 && row.cells.indexOf(free[0]) > eq) {
        const v = evalSide(row.cells.slice(0, eq), R);
        if (v !== null) R.v[free[0].in] = f(v);
      }
    });
    if (S.final) R.v[S.final.in] = f(S.final.answer);
    return R;
  }

  function chainDescribe(q, r) {
    const R = chNorm(q, r);
    const S = chainSpec(q, R);
    const bits = [];
    S.trees.forEach((T, ti) => bits.push(`${S.trees.length > 1 ? `Way ${ti + 1}: parts` : 'Parts'} ${R.t[ti].map((v) => (blankStr(v) ? '—' : String(v).trim())).join(', ')}`));
    if (S.adj) bits.push(`${pv.fmt(S.adj.a)} ${S.adj.op} ${pv.fmt(S.adj.b)} → ${S.rows[0].cells.map((c) => cellText(c, R)).join(' ')}`);
    else S.rows.forEach((row) => bits.push(row.cells.map((c) => cellText(c, R)).join(' ')));
    if (S.final) bits.push(`Answer ${cellText({ in: S.final.in }, R)}`);
    return bits.join(' · ');
  }

  function chainCorrectText(q) {
    const base = chainDescribe(q, chainCorrect(q));
    if (q.preset === 'free') {
      const ad = q.addends || [{}, {}];
      const d = ad[0].digits || 3;
      const p = ad.map((x) => x.parity);
      const R = chainCorrect(q);
      const eg = `e.g. ${R.v.a} + ${R.v.b} = ${R.v.s}`;
      if (p[0] && p[0] === p[1]) return `any two ${p[0]} ${d}-digit numbers and their correct sum, ${eg}`;
      if (p[0] && p[1] && q.anyOrder !== false) return `one even and one odd ${d}-digit number, in either order, and their correct sum, ${eg}`;
      return `any two ${d}-digit numbers that fit and their correct sum, ${eg}`;
    }
    if (q.preset === 'steps' && !(q.tree && q.tree.given)) return `${base} (any parts that add to ${pv.fmt(q.b)} work)`;
    if (q.preset === 'trees') return `${base} (any ${chTrees(q)[0].min} to ${chTrees(q)[0].max} parts that add to ${pv.fmt(q.n)} work)`;
    if (q.preset === 'adjust' && !q.oneNumber) return `${base} (any change that keeps the ${isMinus(q.op) ? 'difference' : 'sum'} the same works)`;
    return base;
  }

  /** The gentle, ungraded tip for an adjustment that doesn't make a friendlier number (decision 10). */
  function chainNote(q, r) {
    if (q.type !== 'chain' || q.preset !== 'adjust' || q.oneNumber) return '';
    const R = chNorm(q, r);
    const na = pv.parseWholeNumber(R.v.na), nb = pv.parseWholeNumber(R.v.nb);
    if (na === null || nb === null || na % 10 === 0 || nb % 10 === 0) return '';
    return q.tip || 'Tip: try to make a ten or a hundred.';
  }

  function chainHelperSum(R, ti) {
    const nums = R.t[ti].map(pv.parseWholeNumber).filter((x) => x !== null);
    return `Your parts add to ${nums.length ? pv.fmt(sumOf(nums)) : '…'}`;
  }
  function adjustTag(q, R, k) {
    const v = pv.parseWholeNumber(R.v[k]);
    const o = k === 'na' ? q.a : q.b;
    if (v === null || v === o) return '';
    return v > o ? `+${pv.fmt(v - o)}` : `${MINUS}${pv.fmt(o - v)}`;
  }

  function chainBody(q, R, mode, key) {
    const S = chainSpec(q, R);
    const ctx = { mode, bad: mode === 'review' ? new Set(chainCheck(q, R).bad) : null };
    const two = S.trees.length > 1;
    let h = '';
    if (S.trees.length) {
      h += `<div class="ch-trees${two ? ' is-two' : ''}">` + S.trees.map((T, ti) => {
        const parts = R.t[ti];
        const n = parts.length;
        const boxes = parts.map((v, k) => (T.given ? `<span class="tr-box">${pv.fmt(Number(T.given[k]))}</span>`
          : boxHTML(ctx, `t:${ti}:${k}`, v, `Part ${k + 1} of ${n}${two ? `, way ${ti + 1}` : ''}: a part of ${pv.fmt(T.n)}`, 'tr-in')));
        const btns = mode === 'review' || T.given ? '' : `<div class="tr-btns">` +
          `<button type="button" class="btn btn-ghost tr-btn" data-tree-add="${ti}"${n >= T.max ? ' disabled' : ''}>+ Add a part</button>` +
          `<button type="button" class="btn btn-ghost tr-btn" data-tree-remove="${ti}"${n <= T.min ? ' disabled' : ''}>− Remove a part</button></div>`;
        const helper = mode === 'guided' && !T.given ? `<p class="ch-helper" aria-live="polite" data-tree-sum="${ti}">${esc(chainHelperSum(R, ti))}</p>` : '';
        return `<div class="tr" role="group" aria-label="${two ? `Way ${ti + 1}: ` : ''}Break ${pv.fmt(T.n)} into parts">` +
          (two ? `<p class="tr-title">Way ${ti + 1}</p>` : '') +
          `<div class="tr-top"><span class="tr-box tr-n">${pv.fmt(T.n)}</span></div>` +
          `<div class="tr-parts" style="--n:${n}">${boxes.map((b) => `<div class="tr-slot">${b}</div>`).join('')}</div>${btns}${helper}</div>`;
      }).join('') + `</div>`;
    }
    if (S.adj) {
      const A = S.adj;
      const guided = mode === 'guided';
      const tag = (k) => (guided ? `<span class="ar-tag" data-tag="${k}">${esc(adjustTag(q, R, k))}</span>` : '');
      const desc = (k) => (guided ? ` aria-describedby="${esc(key)}-d${k}"` : '');
      const cells = S.rows[0].cells;
      const bottom = [boxHTML(ctx, 'v:na', R.v.na, cells[0].label, 'ch-in', desc('na')), A.op, boxHTML(ctx, 'v:nb', R.v.nb, cells[2].label, 'ch-in', desc('nb')), '=', boxHTML(ctx, 'v:r', R.v.r, cells[4].label, 'ch-in')];
      h += `<div class="ch-adjust" role="group" aria-label="Adjust ${pv.fmt(A.a)} ${opWord(A.op)} ${pv.fmt(A.b)}">` +
        arrowGrid({ top: [pv.fmt(A.a), A.op, pv.fmt(A.b), '=', '<span class="fig-unk">?</span>'], tags: [tag('na'), tag('nb')], bottom, cls: 'is-input' }) +
        (guided ? `<span class="sr-only" id="${esc(key)}-dna" data-tagsr="na">${esc(adjustTag(q, R, 'na') ? 'changed by ' + adjustTag(q, R, 'na') : '')}</span>` +
          `<span class="sr-only" id="${esc(key)}-dnb" data-tagsr="nb">${esc(adjustTag(q, R, 'nb') ? 'changed by ' + adjustTag(q, R, 'nb') : '')}</span>` : '') + `</div>`;
    } else if (S.rows.length) {
      const nRows = S.rows.length;
      h += `<div class="ch-rows">` + S.rows.map((row, ri) => {
        const eq = row.cells.indexOf('=');
        const rowLabel = row.label || row.tag || (nRows > 1 ? `Step ${ri + 1} of ${nRows}` : 'Equation');
        const words = (self) => row.cells.map((c) => {
          if (typeof c === 'number') return pv.fmt(c);
          if (c === '?') return 'question mark';
          if (typeof c === 'string') return opWord(c);
          if (c.in) return c === self ? 'this box' : 'box';
          const v = chVal(R, c.echo);
          return blankStr(v) ? 'your number' : String(v).trim();
        }).join(' ');
        const draw = (c) => {
          if (typeof c === 'number') return `<span class="ch-c ch-num">${pv.fmt(c)}</span>`;
          if (c === '?') return `<span class="ch-c ch-unk">?</span>`;
          if (typeof c === 'string') return `<span class="ch-op" aria-hidden="true">${esc(opGlyph(c))}</span>`;
          if (c.in) return boxHTML(ctx, 'v:' + c.in, R.v[c.in], `${c.label || 'Box'}. ${rowLabel}: ${words(c)}`, 'ch-c ch-in');
          const v = chVal(R, c.echo);
          return `<span class="ch-c ch-echo" data-echo="${esc(c.echo)}">${esc(blankStr(v) ? '…' : String(v).trim())}</span>`;
        };
        const L = eq < 0 ? row.cells : row.cells.slice(0, eq);
        const Rr = eq < 0 ? [] : row.cells.slice(eq);
        const operands = L.filter((c) => typeof c !== 'string' || c === '?').length;
        return `<div class="ch-row${operands > 3 ? ' is-long' : ''}${operands > 2 ? ' is-three' : ''}" role="group" aria-label="${esc(rowLabel)}">` +
          (row.tag ? `<span class="ch-tag">${esc(row.tag)}</span>` : '') +
          `<span class="ch-l">${L.map(draw).join('')}</span><span class="ch-r">${Rr.map(draw).join('')}</span></div>`;
      }).join('') + `</div>`;
    }
    if (S.final) {
      h += `<div class="ch-final"><span class="ch-flabel">${esc(S.final.label)}</span>` +
        boxHTML(ctx, 'v:' + S.final.in, R.v[S.final.in], S.final.label.replace(/\s*=\s*$/, ' equals'), 'ch-c ch-in') + `</div>`;
    }
    return h;
  }

  function bindChain(el, q, fire) {
    const box = el.querySelector('.ch');
    const mode = box.dataset.mode;
    if (mode === 'review') return;
    const key = el.dataset.qkey;
    let R = chNorm(q, JSON.parse(box.dataset.r));
    const sync = () => { box.dataset.r = JSON.stringify(R); };
    const redraw = () => { box.innerHTML = chainBody(q, R, mode, key); sync(); };
    const live = () => {
      box.querySelectorAll('[data-echo]').forEach((s) => { const v = chVal(R, s.dataset.echo); s.textContent = blankStr(v) ? '…' : String(v).trim(); });
      box.querySelectorAll('[data-tree-sum]').forEach((p) => { p.textContent = chainHelperSum(R, Number(p.dataset.treeSum)); });
      box.querySelectorAll('[data-tag]').forEach((t) => { t.textContent = adjustTag(q, R, t.dataset.tag); });
      box.querySelectorAll('[data-tagsr]').forEach((t) => { const g = adjustTag(q, R, t.dataset.tagsr); t.textContent = g ? 'changed by ' + g : ''; });
    };
    const setKey = (k, v) => {
      if (k.indexOf('v:') === 0) R.v[k.slice(2)] = v;
      else { const p = k.split(':'); R.t[Number(p[1])][Number(p[2])] = v; }
    };
    box.addEventListener('input', (e) => {
      const k = e.target.dataset && e.target.dataset.k;
      if (!k) return;
      setKey(k, e.target.value);
      clearMarks(el);
      live(); sync(); fire();
    });
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input')) e.preventDefault(); });
    box.addEventListener('click', (e) => {
      const add = e.target.closest('[data-tree-add]'), rem = e.target.closest('[data-tree-remove]');
      if (!add && !rem) return;
      const ti = Number((add || rem).dataset[add ? 'treeAdd' : 'treeRemove']);
      const T = chTrees(q)[ti];
      const parts = R.t[ti];
      if (add && parts.length < T.max) parts.push('');
      else if (rem && parts.length > T.min) { parts.pop(); if (q.preset === 'steps') delete R.v['r' + parts.length]; }
      else return;
      redraw();
      const target = box.querySelector(`input[data-k="t:${ti}:${parts.length - 1}"]`);
      if (target) target.focus();
      fire();
    });
    el.mbSetResponse = (r) => { R = chNorm(q, clone(r)); redraw(); fire(); };
  }

  // ===================== vcalc: vertical-stack answer control (DESIGN §4.3) =====================
  function vcInfo(q) {
    const op = isMinus(q.op) ? MINUS : '+';
    const rows = (q.rows || [q.top, q.bottom, q.third]).filter((x) => x !== undefined && x !== null);
    const answer = q.answer !== undefined ? q.answer : op === '+' ? sumOf(rows) : rows[0] - rows[1];
    const input = q.input === 'rows' ? 'rows' : 'digits';
    const maxLen = Math.max(...rows.map((n) => String(n).length));
    const cols = op === '+' ? maxLen + 1 : Math.max(maxLen, String(answer).length);
    let partials = null;
    if (input === 'rows') {
      partials = [];
      for (let p = maxLen - 1; p >= 0; p--) {
        const vals = rows.map((n) => (Math.floor(n / 10 ** p) % 10) * 10 ** p);
        partials.push({ place: p, vals, v: sumOf(vals), note: vals.map(pv.fmt).join(' + ') });
      }
    }
    const blanks = q.blanks && Object.values(q.blanks).some((a) => a && a.length) ? q.blanks : null;
    return { op, rows, answer, input, cols, maxLen, partials, blanks, places: q.places !== undefined ? !!q.places : maxLen >= 4 };
  }
  function vcBlankKeys(I) {
    const out = [];
    if (!I.blanks) return out;
    ['top', 'mid', 'bottom', 'result'].forEach((row) => (I.blanks[row] || []).forEach((pk) => out.push({ k: `b:${row}:${pk}`, row, place: PLACE_KEYS.indexOf(pk) })));
    return out;
  }
  function vcTrue(I, row, place) {
    const n = row === 'result' ? I.answer : row === 'top' ? I.rows[0] : row === 'bottom' ? I.rows[I.rows.length - 1] : I.rows[1];
    return Math.floor(n / 10 ** place) % 10;
  }
  function vcNorm(q, r) {
    const I = vcInfo(q);
    const R = r && typeof r === 'object' && !Array.isArray(r) ? r : {};
    const arr = (a, n) => Array.from({ length: n }, (_, i) => (Array.isArray(a) && a[i] !== undefined && a[i] !== null ? String(a[i]) : ''));
    return { d: arr(R.d, I.cols), c: arr(R.c, I.cols), b: Object.assign({}, R.b || {}), p: arr(R.p, (I.partials || []).length), s: R.s === undefined || R.s === null ? '' : String(R.s), n: arr(R.n, (I.partials || []).length) };
  }
  function parseNote(s) {
    const parts = String(s || '').split('+').map(pv.parseWholeNumber);
    return parts.some((x) => x === null) ? null : parts;
  }
  function vcCheck(q, r) {
    const I = vcInfo(q);
    const R = vcNorm(q, r);
    const bad = [];
    let msg = '';
    const fail = (k, m) => { bad.push(k); if (!msg) msg = m; };
    if (I.blanks) {
      vcBlankKeys(I).sort((x, y) => x.place - y.place).forEach((b) => {
        const v = String(R.b[b.k] || '').trim();
        if (!/^\d$/.test(v) || Number(v) !== vcTrue(I, b.row, b.place)) fail(b.k, `Look again at the ${PLACE_NAMES[b.place]}.`);
      });
    } else if (I.input === 'rows') {
      I.partials.forEach((pp, k) => {
        if (q.notes === 'input') {
          const got = parseNote(R.n[k]);
          const want = pp.vals.slice().sort((x, y) => x - y).join(',');
          if (!got || got.slice().sort((x, y) => x - y).join(',') !== want) fail(`n:${k}`, `Look again at the ${PLACE_NAMES[pp.place]}: write the value of each ${PLACE_NAMES[pp.place].replace(/s$/, '')} digit.`);
        }
        if (pv.parseWholeNumber(R.p[k]) !== pp.v) fail(`p:${k}`, `Look again at the ${PLACE_NAMES[pp.place]} partial sum.`);
      });
      if (pv.parseWholeNumber(R.s) !== I.answer) fail('s', 'Add the partial sums again.');
    } else {
      const s = String(I.answer);
      for (let i = I.cols - 1; i >= 0; i--) {
        const p = I.cols - 1 - i;
        const v = String(R.d[i] || '').trim();
        const want = p < s.length ? s[s.length - 1 - p] : null;
        const ok = want !== null ? v === want : v === '' || v === '0';
        if (!ok) fail(`d:${i}`, `Look again at the ${PLACE_NAMES[p]}.`);
      }
    }
    return { ok: !bad.length, bad, msg };
  }
  function vcIsAnswered(q, r) {
    const I = vcInfo(q);
    const R = vcNorm(q, r);
    if (I.blanks) return vcBlankKeys(I).every((b) => !blankStr(R.b[b.k]));
    if (I.input === 'rows') return R.p.every((v) => !blankStr(v)) && !blankStr(R.s) && (q.notes !== 'input' || R.n.every((v) => !blankStr(v)));
    const filled = R.d.map((v) => !blankStr(v));
    if (!filled[I.cols - 1]) return false;
    const first = filled.indexOf(true);
    return filled.slice(first).every(Boolean);
  }
  /** The answer row read as a number (leading empty boxes and leading zeros are nothing). */
  function vcValue(R) {
    const s = R.d.map((v) => String(v || '').trim()).join('');
    return /^\d+$/.test(s) ? Number(s) : null;
  }
  function vcCorrect(q) {
    const I = vcInfo(q);
    const R = vcNorm(q);
    if (I.blanks) { vcBlankKeys(I).forEach((b) => { R.b[b.k] = String(vcTrue(I, b.row, b.place)); }); return R; }
    if (I.input === 'rows') {
      I.partials.forEach((pp, k) => { R.p[k] = pv.fmt(pp.v); R.n[k] = pp.note; });
      R.s = pv.fmt(I.answer);
      return R;
    }
    const s = String(I.answer);
    for (let k = 0; k < s.length; k++) R.d[I.cols - s.length + k] = s[k];
    return R;
  }
  function vcDescribe(q, r) {
    const I = vcInfo(q);
    const R = vcNorm(q, r);
    if (I.blanks) return vcBlankKeys(I).map((b) => `${cap(PLACE_NAMES[b.place])} of the ${b.row === 'result' ? 'answer' : b.row + ' number'}: ${blankStr(R.b[b.k]) ? '—' : String(R.b[b.k]).trim()}`).join(' · ');
    if (I.input === 'rows') {
      return (q.notes === 'input' ? `Places ${R.n.map((v) => (blankStr(v) ? '—' : v.trim())).join(' | ')} · ` : '') +
        `Partial sums ${R.p.map((v) => (blankStr(v) ? '—' : v.trim())).join(', ')} · Sum ${blankStr(R.s) ? '—' : R.s.trim()}`;
    }
    const v = vcValue(R);
    const carries = R.c.some((x) => !blankStr(x)) ? ` (regroup marks: ${R.c.map((x) => (blankStr(x) ? '·' : x)).join(' ')})` : '';
    return `${v === null ? (R.d.some((x) => !blankStr(x)) ? R.d.map((x) => (blankStr(x) ? '_' : x)).join('') : '—') : pv.fmt(v)}${carries}`;
  }
  function vcCorrectText(q) {
    const I = vcInfo(q);
    if (I.blanks) return vcDescribe(q, vcCorrect(q));
    if (I.input === 'rows') return `${I.partials.map((p) => `${p.note} = ${pv.fmt(p.v)}`).join(' · ')} · ${I.partials.map((p) => pv.fmt(p.v)).join(' + ')} = ${pv.fmt(I.answer)}`;
    return pv.fmt(I.answer);
  }
  function vcBody(q, R, mode) {
    const I = vcInfo(q);
    const ctx = { mode, R, bad: mode === 'review' ? new Set(vcCheck(q, R).bad) : null, noteInputs: q.notes === 'input' && I.input === 'rows',
      partialInputs: I.input === 'rows', digitInputs: I.input === 'digits' && !I.blanks, carryInputs: !!q.carries && I.op === '+' && I.input === 'digits' && !I.blanks };
    const words = stackWords(I.rows, I.op);
    const how = I.blanks ? 'Type each missing digit.' : I.input === 'rows' ? 'Write each partial sum, then the sum.' : 'Type the answer one digit at a time, starting with the ones.';
    const S = { rows: I.rows, op: I.op, answer: I.answer, places: I.places, blanks: I.blanks || undefined, partials: I.partials ? I.partials.map((p) => ({ v: p.v, place: p.place, note: q.notes === 'input' ? '' : (q.notes === 'none' ? '' : p.note) })) : null };
    return `<div class="vc" role="group" aria-label="${esc(`${words} written in columns. ${how}`)}">${stackHTML(S, ctx)}</div>`;
  }
  function bindVcalc(el, q, fire, o) {
    const box = el.querySelector('.vc-wrap');
    const mode = box.dataset.mode;
    if (mode === 'review') return;
    let R = vcNorm(q, JSON.parse(box.dataset.r));
    const sync = () => { box.dataset.r = JSON.stringify(R); };
    const at = (i) => box.querySelector(`input[data-k="d:${i}"]`);
    const setKey = (k, v) => {
      const [t, a, b] = k.split(':');
      if (t === 'd' || t === 'c' || t === 'p' || t === 'n') R[t][Number(a)] = v;
      else if (t === 'b') R.b[k] = v;
      else if (t === 's') R.s = v;
      void b;
    };
    box.addEventListener('focusin', (e) => { if (e.target.matches('input[maxlength="1"]')) { try { e.target.select(); } catch (err) { /* ignore */ } } });
    box.addEventListener('input', (e) => {
      const t = e.target;
      const k = t.dataset && t.dataset.k;
      if (!k) return;
      if (t.maxLength === 1) t.value = t.value.replace(/\D/g, '').slice(-1);
      setKey(k, t.value);
      clearMarks(el);
      if (k.indexOf('d:') === 0 && t.value) { const prev = at(Number(k.slice(2)) - 1); if (prev) prev.focus(); }
      sync(); fire();
    });
    box.addEventListener('keydown', (e) => {
      const t = e.target;
      const k = t.dataset && t.dataset.k;
      if (e.key === 'Enter' && t.matches('input')) { e.preventDefault(); return; }
      if (!k || k.indexOf('d:') !== 0) return;
      const i = Number(k.slice(2));
      if (e.key === 'Backspace' && !t.value) {
        const nx = at(i + 1);
        if (nx) { e.preventDefault(); nx.value = ''; R.d[i + 1] = ''; nx.focus(); clearMarks(el); sync(); fire(); }
      } else if (e.key === 'ArrowLeft' && at(i - 1)) { e.preventDefault(); at(i - 1).focus(); }
      else if (e.key === 'ArrowRight' && at(i + 1)) { e.preventDefault(); at(i + 1).focus(); }
    });
    el.mbSetResponse = (r) => { R = vcNorm(q, clone(r)); box.innerHTML = vcBody(q, R, mode); sync(); fire(); };
    // Focus starts at the ones box (algorithm order), without scrolling the page.
    const I = vcInfo(q);
    if (I.input === 'digits' && !I.blanks && !(o && o.autofocus === false)) {
      setTimeout(() => {
        const ones = at(I.cols - 1);
        const a = document.activeElement;
        if (ones && el.isConnected && !ones.disabled && !(a && a !== ones && a.closest && a.closest('.q') && a.closest('.q') !== el && a.matches('input, select, textarea'))) ones.focus({ preventScroll: true });
      }, 0);
    }
  }

  const CHECK = { chain: chainCheck, vcalc: vcCheck };

  /** One plain coaching line after a miss (never the answer). Existing types keep their approved wording. */
  function tip(q, r) {
    if (q.type === 'expanded') return expandedTip(r, q.answer);
    if (q.type === 'parts') return partsTip(q, r);
    if (CHECK[q.type]) return CHECK[q.type](q, r).msg;
    return '';
  }
  function check(q, r) {
    if (CHECK[q.type]) return CHECK[q.type](q, r);
    return { ok: grade(q, r), bad: [], msg: tip(q, r) };
  }
  function note(q, r) { return chainNote(q, r); }
  /** Review-mode drawing of the child's own boxes (My Results); '' for types that have none. */
  function reviewHTML(q, r, key) {
    if (q.type === 'chain') return `<div class="q q-type-chain"><div class="ch" data-mode="review">${chainBody(q, chNorm(q, r), 'review', key || 'rv')}</div></div>`;
    if (q.type === 'vcalc') return `<div class="q q-type-vcalc"><div class="vc-wrap" data-mode="review">${vcBody(q, vcNorm(q, r), 'review')}</div></div>`;
    return '';
  }

  /**
   * HTML for one question. `key` must be unique on the page.
   * o.number: question number shown to the student; o.response: restore a saved response.
   */
  function render(q, key, o) {
    o = o || {};
    const r = o.response !== undefined ? o.response : emptyResponse(q);
    const pid = `${key}-prompt`;
    const num = o.number ? `<span class="q-num" aria-hidden="true">${o.number}</span>` : '';
    const sr = o.number ? `<span class="sr-only">Question ${o.number}. </span>` : '';
    let prompt = withBlanks(q.prompt);
    let body = '';
    const mode = o.review ? 'review' : o.mode === 'guided' ? 'guided' : 'test';

    switch (q.type) {
      case 'mc':
        body = `<div class="q-choices" role="radiogroup" aria-labelledby="${pid}">` +
          q.choices.map((c) => `<label class="choice"><input type="radio" name="${key}" value="${esc(c)}"${r === c ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') +
          `</div>`;
        break;
      case 'select': {
        const sel = `<select class="q-select" aria-label="Choose the missing word"><option value="">Choose…</option>` +
          q.choices.map((c) => `<option${r === c ? ' selected' : ''}>${esc(c)}</option>`).join('') + `</select>`;
        prompt = q.prompt.split('___').map(esc).join(sel);
        break;
      }
      case 'number':
        body = `<input class="q-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Type a number. Commas are optional.</p>`;
        break;
      case 'expanded':
        body = `<input class="q-input q-input-wide" type="text" autocomplete="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Use + between the values of the digits.</p>`;
        break;
      case 'words':
        body = `<input class="q-input q-input-wide" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Write the number in words.</p>`;
        break;
      case 'chart':
        body = `<div class="q-chart">` + pv.PLACES.map((p, i) =>
          `<label class="q-chart-cell place-${p.key}"><span aria-hidden="true">${p.label}</span><input type="text" inputmode="numeric" maxlength="1" autocomplete="off" aria-label="${p.name} digit" value="${esc(r[i])}"></label>`).join('') + `</div>`;
        break;
      case 'build':
        body = `<div class="q-build">` + pv.PLACES.map((p, i) =>
          `<div class="stepper place-${p.key}" data-place="${i}"><span class="stepper-name">${p.label}</span>` +
          `<button type="button" class="stepper-btn" data-step="-1" aria-label="Remove one ${p.blockName}">−</button>` +
          `<output class="stepper-count" aria-live="polite" aria-label="${p.name} blocks">${r[i]}</output>` +
          `<button type="button" class="stepper-btn" data-step="1" aria-label="Add one ${p.blockName}">+</button></div>`).join('') +
          `</div><div class="q-build-preview">${pv.blocksHTML(0, { captions: false, digits: r })}</div>`;
        break;
      case 'spell':
        body = `<input class="q-input q-input-wide" type="text" ${NO_ASSIST} aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Type the whole word.</p>`;
        break;
      case 'parts': {
        const rr = Array.isArray(r) ? r : emptyResponse(q);
        body = (q.line ? blankLine(q.line.place) : '') + `<div class="q-parts">` + q.parts.map((p, i) => {
          const v = rr[i];
          if (p.kind === 'num' || p.kind === 'round') {
            return `<label class="part part-num"><span class="part-label">${esc(p.label)}</span>` +
              `<input class="part-input" data-part="${i}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${esc(v || '')}"></label>`;
          }
          if (p.kind === 'symbol') {
            // "4,127 ◯ 3,986" with big native radio buttons; the circle mirrors the choice (the radios carry the state).
            const choices = p.choices || ['<', '>', '='];
            return `<fieldset class="part part-symbol" data-part="${i}"><legend class="part-label">${esc(p.label || 'Choose the symbol that makes it true.')}</legend>` +
              `<p class="sym-line" aria-hidden="true"><span class="sym-n">${pv.fmt(p.left)}</span><span class="sym-circle">${esc(v || '')}</span><span class="sym-n">${pv.fmt(p.right)}</span></p>` +
              `<p class="sr-only">Compare ${pv.fmt(p.left)} and ${pv.fmt(p.right)}.</p>` +
              `<div class="q-choices is-compact is-sym" role="radiogroup" style="grid-template-columns:repeat(${choices.length}, minmax(0, 6rem))">` + choices.map((c) =>
                `<label class="choice"><input type="radio" name="${key}-${i}" value="${esc(c)}"${v === c ? ' checked' : ''}><span class="sym-g" aria-hidden="true">${esc(c)}</span><span class="sr-only">${esc(SYMBOL_NAMES[c] || c)}</span></label>`).join('') +
              `</div></fieldset>`;
          }
          const multi = p.kind === 'multi';
          const compact = p.compact ? ` is-compact${p.choices.length === 3 ? ' is-three' : ''}${p.choices.some((c) => String(c).length > 6) ? ' is-wordy' : ''}` : '';
          return `<fieldset class="part part-${p.kind}" data-part="${i}"><legend class="part-label">${esc(p.label)}</legend>` +
            (multi ? '<p class="q-help">Choose every one that is correct.</p>' : '') + `<div class="q-choices${compact}">` +
            p.choices.map((c) => `<label class="choice"><input type="${multi ? 'checkbox' : 'radio'}" name="${key}-${i}" value="${esc(c)}"${(multi ? (v || []).includes(c) : v === c) ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') +
            `</div></fieldset>`;
        }).join('') + `</div>`;
        break;
      }
      case 'rline': {
        const R = rlNorm(r);
        const mode = o.review ? 'review' : o.mode === 'guided' ? 'guided' : 'test';
        body = `<div class="rl" data-mode="${mode}" data-rl="${esc(JSON.stringify(R))}">${rlBody(q, R, mode, key)}</div>`;
        break;
      }
      case 'chain': {
        const R = chNorm(q, r);
        body = `<div class="ch ch-${esc(q.preset || 'frame')}" data-mode="${mode}" data-r="${esc(JSON.stringify(R))}">${chainBody(q, R, mode, key)}</div>`;
        break;
      }
      case 'vcalc': {
        const R = vcNorm(q, r);
        body = `<div class="vc-wrap" data-mode="${mode}" data-r="${esc(JSON.stringify(R))}">${vcBody(q, R, mode)}</div>`;
        break;
      }
      case 'letter': {
        const letters = q.word.split('');
        const spoken = letters.map((ch, i) => (i === q.missing ? 'blank' : ch)).join(', ');
        body = `<div class="letter-word" role="group" aria-label="Word with a missing letter: ${spoken}">` +
          letters.map((ch, i) => (i === q.missing
            ? `<input class="letter-input" type="text" maxlength="1" ${NO_ASSIST} aria-label="Missing letter" value="${esc(r)}">`
            : `<span class="letter-tile" aria-hidden="true">${esc(ch)}</span>`)).join('') + `</div>`;
        break;
      }
      default:
        throw new Error('Unknown question type: ' + q.type);
    }

    return `<div class="q q-type-${q.type}" data-qkey="${esc(key)}">` +
      `<p class="q-prompt" id="${pid}">${num}${sr}<span>${prompt}</span></p>${visuals(q)}${body}` +
      `<div class="q-feedback" aria-live="polite"></div></div>`;
  }

  /** Current response from the DOM. */
  function read(el, q) {
    switch (q.type) {
      case 'mc': {
        const c = el.querySelector('input[type=radio]:checked');
        return c ? c.value : '';
      }
      case 'select':
        return el.querySelector('select').value;
      case 'number':
      case 'expanded':
      case 'words':
      case 'spell':
        return el.querySelector('.q-input').value;
      case 'letter':
        return el.querySelector('.letter-input').value;
      case 'chart':
        return Array.from(el.querySelectorAll('.q-chart input')).map((i) => i.value.trim());
      case 'build':
        return Array.from(el.querySelectorAll('.stepper-count')).map((c) => Number(c.textContent));
      case 'rline': {
        const box = el.querySelector('.rl');
        return box ? rlNorm(JSON.parse(box.dataset.rl)) : rlEmpty();
      }
      case 'chain': {
        const box = el.querySelector('.ch');
        return box ? chNorm(q, JSON.parse(box.dataset.r)) : chNorm(q);
      }
      case 'vcalc': {
        const box = el.querySelector('.vc-wrap');
        return box ? vcNorm(q, JSON.parse(box.dataset.r)) : vcNorm(q);
      }
      case 'parts':
        return q.parts.map((p, i) => {
          if (p.kind === 'num' || p.kind === 'round') return el.querySelector(`.part-input[data-part="${i}"]`).value;
          const box = el.querySelector(`fieldset[data-part="${i}"]`);
          const on = Array.from(box.querySelectorAll('input:checked')).map((x) => x.value);
          return p.kind === 'multi' ? on : (on[0] || '');
        });
    }
    return '';
  }

  /** Wire up interactive parts; onChange(response) fires after any edit. */
  function bind(el, q, onChange, o) {
    const fire = () => onChange && onChange(read(el, q));
    if (q.type === 'rline') return bindRline(el, q, fire);
    if (q.type === 'chain') return bindChain(el, q, fire);
    if (q.type === 'vcalc') return bindVcalc(el, q, fire, o);
    if (q.type === 'parts' && el.querySelector('.part-symbol')) {
      // The circle mirrors the chosen symbol (decoration only; the radios carry the state).
      el.addEventListener('change', (e) => {
        const fs = e.target.closest && e.target.closest('.part-symbol');
        if (fs) fs.querySelector('.sym-circle').textContent = e.target.value;
      });
    }
    if (q.type === 'build') {
      el.querySelectorAll('.stepper-btn').forEach((b) => b.addEventListener('click', () => {
        const out = b.parentElement.querySelector('.stepper-count');
        out.textContent = Math.min(9, Math.max(0, Number(out.textContent) + Number(b.dataset.step)));
        el.querySelector('.q-build-preview').innerHTML = pv.blocksHTML(0, { captions: false, digits: read(el, q) });
        fire();
      }));
      return;
    }
    if (q.type === 'chart') {
      // Move to the next box after a digit is typed (helpful on tablets).
      const boxes = Array.from(el.querySelectorAll('.q-chart input'));
      boxes.forEach((box, i) => box.addEventListener('input', () => {
        if (/^\d$/.test(box.value) && boxes[i + 1] && !boxes[i + 1].value) boxes[i + 1].focus();
      }));
    }
    el.addEventListener('input', fire);
    el.addEventListener('change', fire);
  }

  function bindRline(el, q, fire) {
    const box = el.querySelector('.rl');
    const mode = box.dataset.mode;
    if (mode === 'review') return;
    const key = el.dataset.qkey;
    let R = rlNorm(JSON.parse(box.dataset.rl));
    const stages = rlStages(q);
    // needWhy lets pages without the question (the home page) count this answer exactly as the test does.
    const sync = () => { R.needWhy = !!q.why; box.dataset.rl = JSON.stringify(R); };
    const draw = (focus) => {
      sync();
      box.innerHTML = rlBody(q, R, mode, key);
      const t = focus && box.querySelector(focus);
      if (t) t.focus({ preventScroll: false });
    };
    // Tests (and a parent "show me") can set a whole response at once.
    el.mbSetResponse = (r) => { R = rlNorm(JSON.parse(JSON.stringify(r))); draw(); fire(); };
    box.addEventListener('input', (e) => {
      const f = e.target.dataset && e.target.dataset.f;
      if (!f) return;
      R[f] = e.target.value;
      const st = stages[Math.min(R.stage, stages.length - 1)];
      if (mode === 'guided' && R.ok[st]) {
        // A part already marked right was changed: it must be checked again, so its "Yes!" no longer applies.
        // (A wrong-answer hint stays on screen while the child fixes the answer.)
        R.ok[st] = false; R.fb = null;
        sync(); fire();
        const old = box.querySelector('.rl-feedback .feedback:not([data-rl-empty])'); if (old) old.remove();
        box.querySelector('.rl-actions').innerHTML = '<button type="button" class="btn btn-primary" data-rl-act="check">Check Answer</button>';
        return;
      }
      sync(); fire();
    });
    box.addEventListener('change', (e) => {
      if (e.target.name === key + '-why') { R.why = e.target.value; sync(); fire(); }
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rl-act]');
      if (!b) return;
      const act = b.dataset.rlAct;
      const st = stages[Math.min(R.stage, stages.length - 1)];
      let focus = null;
      if (act === 'pick') { if (mode === 'guided' && R.pick !== b.dataset.side) { R.ok.pick = false; R.fb = null; } R.pick = b.dataset.side; draw(); fire(); box.querySelector(`[data-side="${R.pick}"]`).focus(); return; }
      if (act === 'check') {
        if (rlStageBlank(R, st)) { box.querySelector('[data-rl-empty]').hidden = false; return; }
        if (rlStageOK(q, R, st)) { R.ok[st] = true; R.fb = { stage: st, kind: 'ok', text: rlPraise(q, st) }; focus = '[data-rl-act="next"]'; }
        else { R.tries[st] = (R.tries[st] || 0) + 1; R.fb = { stage: st, kind: 'no', text: rlHint(q, R, st) }; focus = 'input, [data-rl-act="pick"], [data-rl-act="check"]'; }
      }
      if (act === 'next') {
        R.stage = Math.min(R.stage + 1, mode === 'guided' ? stages.length - 1 : stages.length - 2);
        R.fb = null;
        if (stages[R.stage] === 'done') R.complete = true;
        focus = '.rl-task';
      }
      if (act === 'back') { R.stage = Math.max(0, R.stage - 1); R.fb = null; focus = '.rl-task'; }
      if (act === 'over') { R.confirm = true; focus = '[data-rl-act="over-no"]'; }
      if (act === 'over-no') { R.confirm = false; focus = '[data-rl-act="over"]'; }
      // Start Over: same number, answers and feedback cleared. (Earned completion is kept by the activity, not here.)
      if (act === 'over-yes') { R = rlEmpty(); focus = '.rl-task'; }
      draw(focus);
      fire();
    });
  }

  function isAnswered(q, r) {
    if (q.type === 'rline') {
      const R = rlNorm(r);
      return [R.lo, R.hi, R.mid].every((v) => String(v).trim() !== '') && !!R.pick && (!q.why || !!R.why);
    }
    if (q.type === 'chart') return Array.isArray(r) && r.every((v) => String(v).trim() !== '');
    if (q.type === 'build') return Array.isArray(r) && r.some((v) => v > 0);
    if (q.type === 'parts') return Array.isArray(r) && q.parts.every((p, i) => partAnswered(p, r[i]));
    if (q.type === 'chain') {
      const R = chNorm(q, r);
      return chInputs(chainSpec(q, R), R).every((x) => !blankStr(chGet(R, x.k)));
    }
    if (q.type === 'vcalc') return vcIsAnswered(q, r);
    return String(r === undefined || r === null ? '' : r).trim() !== '';
  }

  function grade(q, r) {
    switch (q.type) {
      case 'mc':
      case 'select':
        return r === q.answer;
      case 'number':
        return pv.parseWholeNumber(r) === q.answer;
      case 'expanded':
        return pv.checkExpanded(r, q.answer).ok;
      case 'words':
        return pv.checkWords(r, q.answer);
      case 'spell':
      case 'letter':
        return normSpell(r) === normSpell(q.answer);
      case 'chart':
        return Array.isArray(r) && r.every((v) => /^\d$/.test(String(v).trim())) &&
          pv.fromDigits(r.map((v) => Number(String(v).trim()))) === q.answer;
      case 'build':
        return Array.isArray(r) && pv.fromDigits(r) === q.answer;
      case 'parts':
        return Array.isArray(r) && partsOK(q, r).every(Boolean);
      case 'chain':
        return chainCheck(q, r).ok;
      case 'vcalc':
        return vcCheck(q, r).ok;
      case 'rline': {
        const R = rlNorm(r);
        return ['ends', 'mid', 'pick'].concat(q.why ? ['why'] : []).every((st) => rlStageOK(q, R, st));
      }
    }
    return false;
  }

  /** The correct answer as a response (used by tests and "show answer"). */
  function correctResponse(q) {
    switch (q.type) {
      case 'number': return pv.fmt(q.answer);
      case 'expanded': return pv.expandedForm(q.answer);
      case 'words': return pv.numberToWords(q.answer);
      case 'chart': return pv.digitsOf(q.answer).map(String);
      case 'build': return pv.digitsOf(q.answer);
      case 'rline': {
        const I = rlInfo(q);
        const all = {}; rlStages(q).forEach((st) => { all[st] = true; });
        return Object.assign(rlEmpty(), { lo: pv.fmt(I.lo), hi: pv.fmt(I.hi), mid: pv.fmt(I.mid), pick: I.side, why: q.why ? q.why.answer : '', stage: rlStages(q).length - 1, ok: all, complete: true });
      }
      case 'parts': return q.parts.map((p) => (p.kind === 'num' ? pv.fmt(p.answer) : p.kind === 'round' ? pv.fmt(pv.roundRange(p.target, p.place)[0]) : p.kind === 'multi' ? p.answer.slice() : p.answer));
      case 'chain': return chainCorrect(q);
      case 'vcalc': return vcCorrect(q);
      default: return q.answer;
    }
  }

  function describeChart(d) {
    return pv.PLACES.map((p, i) => `${p.name} ${d[i] === '' ? '—' : d[i]}`).join(', ');
  }

  function describeBuild(d) {
    return pv.PLACES.map((p, i) => `${d[i]} ${d[i] === 1 ? p.one : p.key}`).join(', ');
  }

  /** Human-readable response for results pages. */
  function describe(q, r) {
    if (q.type === 'rline') {
      const R = rlNorm(r);
      const v = (x) => String(x).trim() || '—';
      const picked = R.pick === 'lo' ? v(R.lo) : R.pick === 'hi' ? v(R.hi) : '—';
      return `Between ${v(R.lo)} and ${v(R.hi)} · Halfway ${v(R.mid)} · Rounds to ${picked}` + (q.why ? ` · ${R.why || '—'}` : '');
    }
    if (q.type === 'parts' && Array.isArray(r) && q.parts.some((p, i) => partAnswered(p, r[i]))) return describeParts(q, r);
    if (q.type === 'chain') { const R = chNorm(q, r); return chInputs(chainSpec(q, R), R).some((x) => !blankStr(chGet(R, x.k))) ? chainDescribe(q, r) : 'No answer'; }
    if (q.type === 'vcalc') {
      const V = vcNorm(q, r);
      const any = V.d.concat(V.p, V.n, [V.s], Object.values(V.b)).some((x) => !blankStr(x));
      return any ? vcDescribe(q, r) : 'No answer';
    }
    if (!isAnswered(q, r)) return 'No answer';
    if (q.type === 'chart') return describeChart(r);
    if (q.type === 'build') return describeBuild(r) + ` (${pv.fmt(pv.fromDigits(r))})`;
    if (q.type === 'parts') return describeParts(q, r);
    return String(r).trim();
  }

  function describeParts(q, r) {
    const ok = partsOK(q, r);
    return q.parts.map((p, i) => {
      const mark = ok[i] ? ' ✓' : ' ✗';
      if (p.kind === 'symbol') return `${p.label ? p.label + ' ' : ''}${symbolText(p, partAnswered(p, r[i]) ? r[i] : '')}${mark}`;
      return `${p.label} ${partAnswered(p, r[i]) ? (Array.isArray(r[i]) ? r[i].join(', ') : String(r[i]).trim()) : '—'}${mark}`;
    }).join(' · ');
  }

  function correctText(q) {
    if (q.type === 'letter') return `${q.answer} (${q.word})`;
    if (q.type === 'chart') return describeChart(pv.digitsOf(q.answer));
    if (q.type === 'build') return describeBuild(pv.digitsOf(q.answer)) + ` (${pv.fmt(q.answer)})`;
    if (q.type === 'parts') return q.parts.map((p) => (p.kind === 'symbol' && !p.label ? partCorrectText(p) : `${p.label} ${partCorrectText(p)}`)).join(' · ');
    if (q.type === 'chain') return chainCorrectText(q);
    if (q.type === 'vcalc') return vcCorrectText(q);
    if (q.type === 'rline') { const I = rlInfo(q); return `Between ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)} · Halfway ${pv.fmt(I.mid)} · Rounds to ${pv.fmt(I.r)}` + (q.why ? ` · ${q.why.answer}` : ''); }
    return String(correctResponse(q));
  }

  /** Gentle, specific coaching when an expanded-form answer is not accepted. */
  function expandedTip(r, n) {
    const res = pv.checkExpanded(r, n);
    if (res.ok) return '';
    if (res.reason === 'format') return 'Write numbers joined by + signs, like a + b + c.';
    if (res.reason === 'term') return 'Each part should be the value of one digit, such as 300 or 40.';
    if (res.reason === 'repeat') return 'Use each place only once.';
    return 'The parts should add up to ' + pv.fmt(n) + '.';
  }

  /** Coaching for a "parts" answer: name the parts to look at again (never the answers). */
  function partsTip(q, r) {
    if (q.type !== 'parts' || !Array.isArray(r)) return '';
    const ok = partsOK(q, r);
    const wrong = q.parts.filter((p, i) => !ok[i]).map((p) => (p.label || (p.kind === 'symbol' ? 'the symbol' : 'this part')).replace(/[:?]$/, ''));
    return wrong.length && wrong.length < q.parts.length ? `Look again at: ${wrong.join('; ')}.` : '';
  }

  MB.Q = { esc, visuals, render, read, bind, isAnswered, grade, correctResponse, describe, correctText, emptyResponse, expandedTip, partsTip, normSpell, rlExplain,
    // Chapter 2 additions
    withBlanks, figureHTML, applyMarks, clearMarks, tip, check, note, reviewHTML,
    lay: { arrowGrid, stackHTML, stackWords, decompose } };
})(typeof window !== 'undefined' ? window : globalThis);
