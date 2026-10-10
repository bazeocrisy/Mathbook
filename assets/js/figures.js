/*
 * Mathbook display figures (Chapter 2 DESIGN.md §3). No DOM state: every figure is HTML built from a plain JSON spec,
 * so a question's `figure` slot (q.figure) re-renders exactly in saved attempts and reviews, and Learn slides can use
 * the same drawings: Mathbook.fig.html({ fig: 'arrows', a: 312, b: 465, op: '+', to: [300, 500], result: 800 }).
 *
 * Load after place-value.js (and before lesson.js). questions.js draws q.figure through Mathbook.fig.render when this
 * file is present; pages without it still work (figures are simply not drawn).
 *
 *   arrows   F1  { a, b, op, to: [ra, rb], result?, tags?: ['−1', '+1'], reveal?: 'top'|'arrows'|'all', unknown?: true }
 *   groupV   F2  { addends: [a, b, c], pair: [i, j], pairSum?, total?, reveal?: 'top'|'v'|'all', look?: true }
 *   counters F3  { groups: [{ n, kind: 'a'|'b', label }], pairs?: true, join?: true }
 *   table    F4  { title, head: [..], rows: [[..]], money?: true }
 *   nline    F5  pv.numberLineHTML options (points, hops, open + marks, bands …), or { lines: [cfg, cfg] } stacked
 *   tree     F6  { n, parts: [..], alt?: true, check?: true }
 *   stack    F7  { rows: [a, b], op, places?, partials?: true | [{ v, note }], total?, result?, carries?, focus?, blanks?, misalign?, reveal?, hideResults? }
 *   bar      F8  { kind: 'ppw', parts, sizes, whole, bracket?, caption?, small? } | { kind: 'cmp', long, short, gap, sizes: [long, short], order?, caption?, small? }
 *   pics     F9  { items: [{ label: 'A', fig: {...} }], noun?: 'Diagram' }
 *   cmp      F10 { a, b, focus?: 'Th'|'H'|'T'|'O' }
 * Every spec may carry `label` (the full spoken sentence) and `caption` (visible text under the figure).
 * Labels in figures: a number, '?', { letter: 'a' }, or { slot: 'A' } (an empty lettered box the child fills in a part).
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const fmt = (n) => pv.fmt(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MINUS = '−';
  const glyph = (op) => (op === '-' || op === '−' ? MINUS : op === undefined ? '+' : String(op));
  const word = (op) => (glyph(op) === '+' ? 'plus' : glyph(op) === MINUS ? 'minus' : glyph(op));
  const Q = () => MB.Q;

  /** One figure (or an array of them) as HTML. */
  function render(spec) {
    if (!spec) return '';
    if (Array.isArray(spec)) return spec.map(render).join('');
    const f = REG[spec.fig];
    if (!f) throw new Error('Unknown figure: ' + spec.fig);
    return f(spec);
  }

  function wrap(kind, label, inner, caption, extraCls) {
    return `<figure class="fig fig-${kind}${extraCls ? ' ' + extraCls : ''}" role="img" aria-label="${esc(label)}"><div class="fig-body" aria-hidden="true">${inner}</div>` +
      (caption ? `<figcaption class="fig-cap" aria-hidden="true">${caption}</figcaption>` : '') + `</figure>`;
  }

  /** A label: number (commas), '?', { letter }, { slot } or plain text. */
  function lab(l, small) {
    if (l === undefined || l === null) return '';
    if (typeof l === 'number') return `<span class="fig-num">${fmt(l)}</span>`;
    if (l === '?') return `<span class="fig-unk">?</span>`;
    if (typeof l === 'object' && l.letter) return `<span class="fig-letter">${esc(l.letter)}</span>`;
    if (typeof l === 'object' && l.slot) return `<span class="fig-slot${small ? ' is-small' : ''}"><span class="fig-slot-tag">${esc(l.slot)}</span></span>`;
    return `<span class="fig-num">${esc(l)}</span>`;
  }
  function labWords(l) {
    if (typeof l === 'number') return fmt(l);
    if (l === '?' || l === undefined || l === null) return 'unknown';
    if (typeof l === 'object' && l.letter) return l.letter;
    if (typeof l === 'object' && l.slot) return `box ${l.slot}`;
    return String(l);
  }

  // ---------- F1 Arrow equation ----------
  function arrows(s) {
    const op = glyph(s.op);
    const to = s.to || [];
    const reveal = s.reveal || 'all';
    const hasRes = s.result !== undefined && s.result !== null;
    const res = reveal === 'all' && hasRes ? `<span class="fig-ans">${fmt(s.result)}</span>` : `<span class="fig-unk">?</span>`;
    const qbox = '<span class="fig-qbox">?</span>';
    const bottom = s.unknown ? [qbox, op, qbox, '=', qbox] : [to[0] !== undefined ? fmt(to[0]) : qbox, op, to[1] !== undefined ? fmt(to[1]) : qbox, '=', res];
    const tags = (s.tags || []).map((t) => (t ? `<span class="ar-tag">${esc(t)}</span>` : ''));
    const inner = Q().lay.arrowGrid({ top: [fmt(s.a), op, fmt(s.b), '=', '<span class="fig-unk">?</span>'], bottom, tags,
      showArrows: reveal !== 'top', showBottom: reveal !== 'top' });
    let label = s.label;
    if (!label) {
      label = `${fmt(s.a)} ${word(op)} ${fmt(s.b)}.`;
      if (reveal !== 'top' && !s.unknown && to.length) {
        label += s.tags ? ` ${fmt(s.a)} changes by ${s.tags[0]} to ${fmt(to[0])}, and ${fmt(s.b)} changes by ${s.tags[1]} to ${fmt(to[1])}.`
          : ` ${fmt(s.a)} rounds to ${fmt(to[0])}, ${fmt(s.b)} rounds to ${fmt(to[1])}.`;
        label += ` ${fmt(to[0])} ${word(op)} ${fmt(to[1])} equals ${reveal === 'all' && hasRes ? fmt(s.result) : 'what number'}.`;
      } else if (s.unknown) label += ' Round each number, then find the estimate.';
    }
    return wrap('arrows', label, inner, s.caption);
  }

  // ---------- F2 Grouping V ----------
  function groupV(s) {
    const ad = s.addends;
    const [i, j] = s.pair;
    const reveal = s.reveal || 'all';
    const rest = ad.map((_, k) => k).filter((k) => k !== i && k !== j);
    const pairSum = s.pairSum !== undefined ? s.pairSum : ad[i] + ad[j];
    const total = s.total !== undefined ? s.total : ad.reduce((x, y) => x + y, 0);
    const center = (k) => (2 * k + 1) * (100 / (2 * ad.length - 1)); // equal-width columns: addend, +, addend, +, addend
    const tip = (center(i) + center(j)) / 2;
    const num = (n, k) => {
      if (!s.look || (k !== i && k !== j)) return fmt(n);
      const t = fmt(n);
      return `${t.slice(0, -1)}<span class="rd-d is-look gv-look">${t.slice(-1)}</span>`;
    };
    let top = '';
    ad.forEach((n, k) => {
      if (k) top += `<span class="gv-c gv-op">+</span>`;
      const skip = rest.includes(k) && Math.abs(i - j) === 2 && reveal !== 'top';
      top += `<span class="gv-c gv-n${skip ? ' is-later' : ''}">${num(n, k)}</span>`;
    });
    let h = `<div class="gv-row" style="grid-template-columns:repeat(${2 * ad.length - 1}, minmax(0, 1fr))">${top}</div>`;
    if (reveal !== 'top') {
      h += `<svg class="gv-svg" viewBox="0 0 100 36" preserveAspectRatio="none" focusable="false">` +
        `<path d="M${center(i).toFixed(2)} 2 L${tip.toFixed(2)} 32 L${center(j).toFixed(2)} 2" vector-effect="non-scaling-stroke"/></svg>`;
    }
    if (reveal === 'all') {
      const restSum = rest.map((k) => fmt(ad[k])).join(' + ');
      h += `<div class="gv-sum" style="margin-left:max(0px, min(calc(${tip.toFixed(2)}% - 2.2rem), calc(100% - 11rem)))">` +
        `<b class="gv-pair">${fmt(pairSum)}</b>${restSum ? ` + ${restSum}` : ''} = <span class="fig-ans">${fmt(total)}</span></div>`;
    } else if (reveal === 'v') {
      h += `<div class="gv-sum" style="margin-left:max(0px, min(calc(${tip.toFixed(2)}% - 1.2rem), calc(100% - 4rem)))"><b class="gv-pair">${fmt(pairSum)}</b></div>`;
    }
    const label = s.label || `${ad.map(fmt).join(' plus ')}.` + (reveal === 'top' ? '' : ` Add ${fmt(ad[i])} and ${fmt(ad[j])} first: ${fmt(pairSum)}.`) +
      (reveal === 'all' ? ` ${fmt(pairSum)} plus ${rest.map((k) => fmt(ad[k])).join(' plus ')} equals ${fmt(total)}.` : '');
    return wrap('groupV', label, `<div class="gv">${h}</div>`, s.caption);
  }

  // ---------- F3 Counters ----------
  function counters(s) {
    const dot = (kind, cls) => `<span class="cn-dot cn-${kind === 'b' ? 'b' : 'a'}${cls ? ' ' + cls : ''}"></span>`;
    const groupHTML = (g) => {
      const n = Math.min(20, g.n);
      let dots = '';
      if (s.pairs) {
        for (let k = 0; k + 1 < n; k += 2) dots += `<span class="cn-pair">${dot(g.kind)}${dot(g.kind)}</span>`;
        if (n % 2) dots += `<span class="cn-pair is-left">${dot(g.kind)}<span class="cn-left">left over</span></span>`;
      } else for (let k = 0; k < n; k++) dots += dot(g.kind);
      return `<div class="cn-group"><div class="cn-dots${s.pairs ? ' is-pairs' : ''}">${dots}</div>${g.label ? `<p class="cn-label">${esc(g.label)}</p>` : ''}</div>`;
    };
    let h = `<div class="cn-row">${s.groups.map(groupHTML).join('')}</div>`;
    if (s.join && s.groups.length === 2 && s.groups.every((g) => g.n % 2)) {
      h += `<div class="cn-join"><span class="cn-pair is-new">${dot(s.groups[0].kind)}${dot(s.groups[1].kind)}</span><span class="cn-label">The two left-over counters make a new pair.</span></div>`;
    }
    const label = s.label || s.groups.map((g) => `${g.n} ${g.label || (g.kind === 'b' ? 'squares' : 'circles')}`).join(', ') + '.' +
      (s.pairs ? ` In pairs: ${s.groups.map((g) => (g.n % 2 ? `${g.n} has one left over` : `${g.n} has no left over`)).join(', ')}.` : '') +
      (s.join ? ' The two left-overs make a new pair.' : '');
    return wrap('counters', label, h, s.caption);
  }

  // ---------- F4 Table (a real table, not role="img") ----------
  function table(s) {
    const cell = (v) => (typeof v === 'number' ? (s.money ? '$' + fmt(v) : fmt(v)) : esc(v));
    const isNum = (v) => typeof v === 'number' || v === '?' || /^\$?[\d,]+$/.test(String(v));
    const tbl = (head, rows, cls) => `<table class="fig-table${cls ? ' ' + cls : ''}">${s.title ? `<caption>${esc(s.title)}</caption>` : ''}` +
      (head ? `<thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>` : '') +
      `<tbody>${rows.map((r) => `<tr>${r.map((v, k) => (k === 0 && head ? `<th scope="row"${isNum(v) ? ' class="is-num"' : ''}>${cell(v)}</th>` : `<td${isNum(v) ? ' class="is-num"' : ''}>${cell(v)}</td>`)).join('')}</tr>`).join('')}</tbody></table>`;
    const head = s.head || null;
    const wide = head && head.length > 3;
    let h = tbl(head, s.rows, wide ? 'is-wide' : '');
    if (wide) {
      // Below 560px a wide table is shown transposed (one row per column) instead of scrolling.
      const T = head.map((hd, k) => [hd].concat(s.rows.map((r) => r[k])));
      h += tbl(T[0], T.slice(1), 'is-tall');
    }
    return `<div class="fig fig-table-wrap">${h}${s.caption ? `<p class="fig-cap">${s.caption}</p>` : ''}</div>`;
  }

  // ---------- F5 Number line ----------
  function nline(s) {
    if (s.lines) return `<div class="nline-pair">${s.lines.map((c) => pv.numberLineHTML(c)).join('')}</div>`;
    return pv.numberLineHTML(s);
  }

  // ---------- F6 Tree (display) ----------
  function tree(s) {
    const parts = s.parts;
    const h = `<div class="tr tr-fig${s.alt ? ' is-alt' : ''}"><div class="tr-top"><span class="tr-box tr-n">${fmt(s.n)}</span></div>` +
      `<div class="tr-parts" style="--n:${parts.length}">${parts.map((p) => `<div class="tr-slot"><span class="tr-box">${typeof p === 'number' ? fmt(p) : lab(p)}</span></div>`).join('')}</div>` +
      (s.check !== false && parts.every((p) => typeof p === 'number') ? `<p class="tr-check">${parts.map(fmt).join(' + ')} = ${fmt(s.n)}</p>` : '') + `</div>`;
    const label = s.label || `${fmt(s.n)} broken into parts: ${parts.map(labWords).join(', ')}.`;
    return wrap('tree', label, h, s.caption);
  }

  // ---------- F7 Vertical stack ----------
  function stack(s) {
    const rows = s.rows;
    const op = glyph(s.op);
    let partials = s.partials;
    const len = Math.max(...rows.map((n) => String(n).length));
    if (partials === true) {
      partials = [];
      for (let p = len - 1; p >= 0; p--) {
        const vals = rows.map((n) => (Math.floor(n / 10 ** p) % 10) * 10 ** p);
        partials.push({ v: vals.reduce((a, b) => a + b, 0), note: vals.map(fmt).join(' + '), place: p });
      }
    }
    if (partials && s.notes === false) partials = partials.map((p) => Object.assign({}, p, { note: '' }));
    const answer = s.answer !== undefined ? s.answer : op === '+' ? rows.reduce((a, b) => a + b, 0) : rows[0] - rows[1];
    const total = partials ? (s.total !== undefined ? s.total : answer) : undefined;
    const S = { rows, op, answer, places: s.places !== undefined ? s.places : len >= 4, carries: s.carries, focus: s.focus, blanks: s.blanks,
      misalign: s.misalign, partials, total, reveal: s.reveal, hideResults: s.hideResults,
      result: s.result !== undefined ? s.result : partials ? 'none' : 'none' };
    const inner = `<div class="vc vc-fig${s.misalign ? ' is-mis' : ''}">${Q().lay.stackHTML(S, { mode: 'display' })}</div>`;
    let label = s.label;
    if (!label) {
      label = `${Q().lay.stackWords(rows, op)} in columns.`;
      if (s.misalign) label += ' The places do not line up.';
      if (partials && !s.hideResults) label += ` Partial sums ${partials.slice(0, s.reveal !== undefined ? s.reveal : partials.length).map((p) => fmt(p.v)).join(', ')}.` + (s.reveal === undefined || s.reveal > partials.length ? ` Total ${fmt(total)}.` : '');
      if (!partials && S.result !== 'none') label += ` Answer ${S.result === 'all' ? fmt(answer) : 'shown in part'}.`;
      if (s.blanks) label += ' Some digits are missing.';
    }
    const caption = s.caption !== undefined ? s.caption : s.misalign ? '<span class="fig-no">✗</span> The places don’t line up.' : '';
    return wrap('stack', label, inner, caption);
  }

  // ---------- F8 Bar diagram ----------
  function widths(sizes, minPct) {
    const tot = sizes.reduce((a, b) => a + b, 0) || 1;
    let w = sizes.map((x) => (x / tot) * 100);
    for (let k = 0; k < 5; k++) {
      w = w.map((x) => Math.max(minPct, x));
      const t = w.reduce((a, b) => a + b, 0);
      w = w.map((x) => (x * 100) / t);
    }
    return w;
  }
  function bracket(labelHTML, cls) {
    return `<div class="bdg-brk ${cls || ''}"><span class="bdg-brk-line"></span><span class="bdg-brk-lab">${labelHTML}</span></div>`;
  }
  function bar(s) {
    const small = s.small ? ' is-small' : '';
    let h, label;
    if (s.kind === 'cmp') {
      const sz = s.sizes || [2, 1];
      const pct = Math.max(18, Math.min(82, (sz[1] / sz[0]) * 100));
      const longBar = `<div class="bdg-row"><div class="bdg-seg" style="width:100%">${lab(s.long, s.small)}</div></div>`;
      const shortBar = `<div class="bdg-row"><div class="bdg-seg" style="width:${pct.toFixed(2)}%">${lab(s.short, s.small)}</div>` +
        `<div class="bdg-gap" style="width:${(100 - pct).toFixed(2)}%">${bracket(lab(s.gap, s.small), 'is-gap')}</div></div>`;
      h = (s.caption ? `<p class="bdg-caption" style="margin-left:${pct.toFixed(2)}%">${esc(s.caption)}</p>` : '') +
        (s.order === 'shortTop' ? shortBar + longBar : longBar + shortBar);
      label = s.label || `Bar diagram. A long bar: ${labWords(s.long)}. A shorter bar: ${labWords(s.short)}. The difference between them: ${labWords(s.gap)}.`;
    } else {
      const parts = s.parts;
      const w = widths(s.sizes || parts.map(() => 1), 18);
      const whole = s.whole !== undefined ? `${s.caption ? `<span class="bdg-cap-text">${esc(s.caption)}</span> ` : ''}${lab(s.whole, s.small)}` : '';
      const segs = `<div class="bdg-row"><div class="bdg-whole">${parts.map((p, k) => `<div class="bdg-seg" style="width:${w[k].toFixed(2)}%">${lab(p, s.small)}</div>`).join('')}</div></div>`;
      const br = s.whole !== undefined ? bracket(whole, s.bracket === 'below' ? 'is-below' : 'is-above') : '';
      h = s.bracket === 'below' ? segs + br : br + segs;
      label = s.label || `Bar diagram. Whole: ${labWords(s.whole)}. Parts: ${parts.map(labWords).join(' and ')}.`;
    }
    return wrap('bar', label, `<div class="bdg${small}">${h}</div>`, s.figCaption);
  }

  // ---------- F9 Picture choices ----------
  function pics(s) {
    const nounFor = (f) => s.noun || (f.fig === 'nline' ? 'Number line' : f.fig === 'bar' ? 'Diagram' : 'Picture');
    const tiles = s.items.map((it) => `<div class="pics-tile"><p class="pics-head"><span class="pics-pill">${esc(nounFor(it.fig))} ${esc(it.label)}</span></p>${render(it.fig)}</div>`).join('');
    return `<div class="fig fig-pics pics-${Math.min(3, s.items.length)}">${tiles}</div>`;
  }

  // ---------- F10 Compare chart ----------
  function cmp(s) {
    const keys = ['Th', 'H', 'T', 'O'];
    const names = ['thousands', 'hundreds', 'tens', 'ones'];
    const places = ['thousands', 'hundreds', 'tens', 'ones'];
    const f = s.focus ? keys.indexOf(s.focus) : -1;
    // Leading zeros (a 3-digit number's thousands) are drawn as a faint grey 0.
    const digits = (n) => pv.digitsOf(n).map((x, i) => ({ x, faint: i < 3 && n < 10 ** (3 - i) }));
    const row = (n) => `<div class="pv-row">${digits(n).map((d, i) => `<div class="pv-digit place-${places[i]}${i === f ? ' is-look' : ''}${d.faint ? ' is-faint' : ''}">${d.x}</div>`).join('')}</div>`;
    const h = `<div class="pv-chart pv-chart-small cmp-chart">` +
      `<div class="pv-row">${keys.map((k, i) => `<div class="pv-head place-${places[i]}${i === f ? ' is-look' : ''}">${k}</div>`).join('')}</div>` +
      row(s.a) + row(s.b) +
      (f > 0 ? `<div class="pv-row cmp-same">${keys.map((k, i) => `<div>${i < f ? '<span class="cmp-tag">same</span>' : ''}</div>`).join('')}</div>` : '') + `</div>`;
    const label = s.label || `${fmt(s.a)} and ${fmt(s.b)} in a place-value chart.` + (f >= 0 ? `${f > 0 ? ` The ${names.slice(0, f).join(' and ')} digits are the same.` : ''} Compare the ${names[f]} digits.` : '');
    return wrap('cmp', label, h, s.caption);
  }

  const REG = { arrows, groupV, counters, table, nline, tree, stack, bar, pics, cmp };
  MB.fig = Object.assign({ render, html: render, register(name, fn) { REG[name] = fn; } }, REG);
})(typeof window !== 'undefined' ? window : globalThis);
