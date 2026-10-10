// Builds the printable Chapter 2 study guides (.docx) from lessons/*.js.
// Usage: node build.js [2-1 2-2 ...] [--out <dir>]
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ImageRun, Footer, PageNumber, TabStopType, ShadingType, VerticalAlign,
  HeightRule, LevelFormat, TableLayoutType,
} = require('docx');
const { toPng } = require('./diagrams');

// ---------- Page geometry (DXA: 1440 = 1 inch) ----------
const PAGE_W = 12240, PAGE_H = 15840, MARGIN = 1008; // US Letter, 0.7" margins
const CONTENT = PAGE_W - 2 * MARGIN; // 10224
const FONT = 'Arial';
const SYM = 'Segoe UI Symbol';

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const line = (size = 8, color = '000000', style = BorderStyle.SINGLE) => ({ style, size, color });
const BOX = { top: line(8), bottom: line(8), left: line(8), right: line(8) };

// ---------- Text helpers ----------
// Mini-markup: **bold**, //italic//
function runs(str, opt = {}) {
  const out = [];
  const parts = String(str).split(/(\*\*[^*]+\*\*|\/\/[^/]+\/\/|☐)/g).filter(p => p !== '');
  for (const p of parts) {
    if (p.startsWith('**')) out.push(new TextRun({ text: p.slice(2, -2), bold: true, font: FONT, size: opt.size, italics: opt.italics }));
    else if (p.startsWith('//')) out.push(new TextRun({ text: p.slice(2, -2), italics: true, font: FONT, size: opt.size, bold: opt.bold }));
    else if ('☐✓✗◯'.includes(p)) out.push(new TextRun({ text: p, font: SYM, size: opt.size, bold: opt.bold }));
    else out.push(new TextRun({ text: p, font: FONT, size: opt.size, bold: opt.bold, italics: opt.italics }));
  }
  return out;
}
function para(str, opt = {}) {
  return new Paragraph({
    children: runs(str, opt),
    alignment: opt.align,
    spacing: { before: opt.before ?? 0, after: opt.after ?? 60, line: opt.line ?? 264 },
    keepNext: opt.keepNext,
    keepLines: true,
    indent: opt.indent,
    numbering: opt.numbering,
    border: opt.border,
  });
}
const spacer = (twips) => new Paragraph({ children: [], spacing: { before: 0, after: 0, line: Math.max(twips, 40), lineRule: 'exact' } });

// ---------- Block renderers (all take available width w in DXA) ----------
function imageBlock(b, w) {
  const { svg, w: sw, h: sh } = b.diagram;
  const maxIn = Math.min(b.width ?? 6.8, (w - 200) / 1440);
  const widthIn = Math.min(maxIn, sw / 96 * (b.scale ?? 1));
  const pxW = Math.round(widthIn * 96);
  const pxH = Math.round(pxW * sh / sw);
  return [new Paragraph({
    children: [new ImageRun({ type: 'png', data: toPng(svg), transformation: { width: pxW, height: pxH } })],
    alignment: b.align ?? AlignmentType.LEFT,
    spacing: { before: 60, after: 80 },
    keepNext: true,
  })];
}

function chartBlock(b, w, size) {
  const heads = b.heads ?? ['thousands', 'hundreds', 'tens', 'ones'];
  const colW = Math.min(b.colW ?? 1250, Math.floor((w - 200) / heads.length));
  const vals = b.chart || heads.map(() => '');
  const tw = colW * heads.length;
  return [new Table({
    width: { size: tw, type: WidthType.DXA },
    columnWidths: heads.map(() => colW),
    layout: TableLayoutType.FIXED,
    borders: { top: line(10), bottom: line(10), left: line(10), right: line(10), insideHorizontal: line(10), insideVertical: line(10) },
    rows: [
      new TableRow({ cantSplit: true, children: heads.map(hd => new TableCell({ width: { size: colW, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, fill: 'E7E7E7', color: 'auto' }, children: [para(hd, { bold: true, size: Math.min(20, Math.floor(colW / 66)), align: AlignmentType.CENTER, after: 0 })] })) }),
      new TableRow({ cantSplit: true, height: { value: b.rowH ?? 560, rule: HeightRule.ATLEAST }, children: vals.map(v => new TableCell({ width: { size: colW, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, children: [para(v, { size: 30, align: AlignmentType.CENTER, after: 0, bold: true })] })) }),
    ],
  }), spacer(100)];
}

// Vertical computation: rows like ['347', '+125'], result '472' or '' (blank for the child)
function stackBlock(b, w, size) {
  const s = b.stack;
  const parse = r => { const m = /^([+−\-=]?)\s*(.*)$/.exec(r); return { op: m[1] === '-' ? '−' : m[1], n: m[2] }; };
  const rows = s.rows.map(parse);
  const all = [...rows.map(r => r.n), s.result ?? '', ...(s.top ? [s.top] : [])];
  const digits = Math.max(...all.map(x => x.length));
  const cw = s.cellW ?? 330;
  const cols = digits + 1;
  const fsz = s.size ?? 30;
  // '□' marks a missing digit: drawn as an empty box
  const cell = (txt, opts = {}) => new TableCell({
    width: { size: cw, type: WidthType.DXA },
    borders: txt === '□' ? { top: line(10), bottom: line(10), left: line(10), right: line(10) } : { top: opts.top ? line(16) : NONE, bottom: NONE, left: NONE, right: NONE },
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: txt === '□' ? '' : txt, font: FONT, size: opts.size ?? fsz, bold: opts.bold })] })],
  });
  const mkRow = (op, n, opts = {}) => {
    const padded = n.padStart(digits, ' ');
    return new TableRow({ cantSplit: true, height: opts.h ? { value: opts.h, rule: HeightRule.ATLEAST } : undefined, children: [cell(op, opts), ...[...padded].map(ch => cell(ch === ' ' ? '' : ch, opts))] });
  };
  const trs = [];
  if (s.top) trs.push(mkRow('', s.top, { size: 20 }));
  rows.forEach(r => trs.push(mkRow(r.op, r.n)));
  trs.push(mkRow('', s.result ?? '', { top: true, bold: !!s.result, h: s.result ? undefined : 520 }));
  return [new Table({
    width: { size: cw * cols, type: WidthType.DXA }, columnWidths: Array(cols).fill(cw), layout: TableLayoutType.FIXED,
    borders: NO_BORDERS, rows: trs, indent: { size: b.stack.indent ?? b.indent ?? 300, type: WidthType.DXA },
  }), spacer(80)];
}

// Labelled write-on lines: {lines: ['Standard form', 'Expanded form']}
function linesBlock(b, w, size) {
  const tab = w - 260;
  return b.lines.map(lbl => new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: tab, leader: 'underscore' }],
    spacing: { before: b.gap ?? 220, after: 40 },
    keepLines: true,
    children: [...runs(lbl ? (/=$/.test(lbl) ? `${lbl} ` : `${lbl}: `) : '', { size: size ?? 24 }), new TextRun({ text: '\t', font: FONT, size: size ?? 24 })],
  }));
}

// Generic small table {table: {head, rows, widths (fractions), align}}
function tableBlock(b, w, size) {
  const t = b.table;
  const tw = Math.min(w - 120, t.width ?? w - 120);
  const fr = t.widths ?? t.head.map(() => 1 / t.head.length);
  const ws = fr.map(f => Math.floor(f * tw));
  const sz = t.size ?? size ?? 22;
  const mk = (cells, head) => new TableRow({
    cantSplit: true,
    height: t.rowH && !head ? { value: t.rowH, rule: HeightRule.ATLEAST } : undefined,
    children: cells.map((c, i) => new TableCell({
      width: { size: ws[i], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      shading: head ? { type: ShadingType.CLEAR, fill: 'E7E7E7', color: 'auto' } : undefined,
      children: [para(c, { size: sz, bold: head, after: 0, align: (t.align && t.align[i]) || AlignmentType.CENTER })],
    })),
  });
  return [new Table({
    width: { size: ws.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED,
    borders: { top: line(8), bottom: line(8), left: line(8), right: line(8), insideHorizontal: line(6), insideVertical: line(6) },
    rows: [...(t.head ? [mk(t.head, true)] : []), ...t.rows.map(r => mk(r, false))],
  }), spacer(80)];
}

// Estimate arrows (book layout): {arrows: {top: '576 − 122 = ?', bottom: '580 − 120 = 460' | null}}
// A null bottom gives write-on blanks under each number and the answer.
function arrowsBlock(b, w, size) {
  const top = b.arrows.top.split(' ');
  const isNum = t => /^[0-9,$?]+$/.test(t);
  const eq = top.indexOf('=');
  const q = top.indexOf('?');
  const operand = i => isNum(top[i]) && i !== q;
  const bottom = b.arrows.bottom ? b.arrows.bottom.split(' ') : top.map(t => (isNum(t) ? '' : t));
  const fsz = b.size ?? (size >= 24 ? 28 : 22);
  const numW = fsz >= 28 ? 1150 : 820, opW = fsz >= 28 ? 480 : 360;
  const ws = top.map(t => (isNum(t) ? numW : opW));
  const cell = (txt, i, opts = {}) => new TableCell({
    width: { size: ws[i], type: WidthType.DXA },
    margins: { top: 0, bottom: 0, left: 40, right: 40 }, verticalAlign: VerticalAlign.BOTTOM,
    borders: { top: NONE, left: NONE, right: NONE, bottom: opts.blank ? line(10) : NONE },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [new TextRun({ text: txt, font: FONT, size: fsz, bold: opts.bold })] })],
  });
  void eq;
  const rows = [
    new TableRow({ cantSplit: true, children: top.map((t, i) => cell(t, i)) }),
    ...(b.arrows.tags ? [new TableRow({ cantSplit: true, children: top.map((t, i) => {
      const tg = b.arrows.tags === true ? (operand(i) ? '____' : '') : (b.arrows.tags[i] || '');
      return cell(tg, i, { bold: true });
    }) })] : []),
    new TableRow({ cantSplit: true, children: top.map((t, i) => cell(operand(i) ? '↓' : '', i)) }),
    new TableRow({ cantSplit: true, height: { value: b.arrows.bottom ? 300 : 560, rule: HeightRule.ATLEAST }, children: bottom.map((t, i) => cell(t, i, { blank: !b.arrows.bottom && isNum(top[i]), bold: !!b.arrows.bottom && i === q })) }),
  ];
  return [new Table({ width: { size: ws.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: ws, layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows }), spacer(100)];
}

// Partial sums (Lesson 2-6 and later): {psum: {nums: [367, 145], mode: 'row'|'stacked', show: true|false}}
// show=false prints the problem with blank write-on lines for the partial sums and total.
function psumBlock(b, w, size) {
  const { nums, mode, show = true } = b.psum;
  const fmt = n => n.toLocaleString('en-US');
  const places = [];
  for (let p = 10 ** (String(Math.max(...nums)).length - 1); p >= 1; p /= 10) places.push(p);
  const parts = places.map(p => nums.map(n => Math.floor(n / p) % 10 * p));
  const partials = parts.map(ps => ps.reduce((a, c) => a + c, 0));
  const total = nums.reduce((a, c) => a + c, 0);
  const fsz = b.size ?? (size >= 24 ? 26 : 21);
  const BL = '______';
  if (mode === 'row') {
    const lines = [`${nums.map(fmt).join(' + ')} = ${show ? fmt(total) : '?'}`];
    parts.forEach((ps, i) => lines.push(show ? `${ps.map(fmt).join(' + ')} = ${fmt(partials[i])}` : `${ps.map(() => BL).join(' + ')} = ${BL}`));
    lines.push(show ? `${partials.map(fmt).join(' + ')} = **${fmt(total)}**` : `${partials.map(() => BL).join(' + ')} = ${BL}`);
    const cw = b.width ?? Math.min(w - 200, show ? 3400 : 5200);
    return [new Table({
      width: { size: cw, type: WidthType.DXA }, columnWidths: [cw], layout: TableLayoutType.FIXED, borders: NO_BORDERS,
      rows: lines.map(l => new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: cw, type: WidthType.DXA }, margins: { left: 0, right: 0 }, children: [para(l, { size: fsz, after: show ? 20 : 150, before: show ? 0 : 60, align: AlignmentType.RIGHT })] })] })),
    }), spacer(80)];
  }
  // stacked: [label | value] columns
  const lw = b.labelW ?? (fsz >= 24 ? 2300 : 1700), vw = b.valueW ?? (fsz >= 24 ? 1500 : 1100);
  const cell = (txt, wd, opts = {}) => new TableCell({
    width: { size: wd, type: WidthType.DXA }, margins: { top: 10, bottom: 10, left: 40, right: 60 },
    verticalAlign: VerticalAlign.BOTTOM,
    borders: { top: NONE, left: NONE, right: NONE, bottom: opts.under ? line(opts.thick ? 14 : 8) : NONE },
    children: [para(txt, { size: fsz, after: 0, align: AlignmentType.RIGHT, bold: opts.bold })],
  });
  const h = show ? undefined : { value: 470, rule: HeightRule.ATLEAST };
  const rows = [];
  rows.push(new TableRow({ cantSplit: true, children: [cell('', lw), cell(fmt(nums[0]), vw)] }));
  nums.slice(1).forEach((n, i) => rows.push(new TableRow({ cantSplit: true, children: [cell('', lw), cell(`${i === nums.length - 2 ? '+   ' : ''}${fmt(n)}`, vw, { under: i === nums.length - 2, thick: true })] })));
  parts.forEach((ps, i) => rows.push(new TableRow({ cantSplit: true, height: h, children: [
    cell(show ? ps.map(fmt).join(' + ') : '', lw, { under: !show }),
    cell(show ? `${i === parts.length - 1 ? '+   ' : ''}${fmt(partials[i])}` : (i === parts.length - 1 ? '+' : ''), vw, { under: !show || i === parts.length - 1, thick: i === parts.length - 1 }),
  ] })));
  rows.push(new TableRow({ cantSplit: true, height: h, children: [cell('', lw), cell(show ? fmt(total) : '', vw, { bold: show, under: !show })] }));
  return [new Table({ width: { size: lw + vw, type: WidthType.DXA }, columnWidths: [lw, vw], layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows }), spacer(80)];
}

function blocks(list, w, size) {
  const out = [];
  for (const b of list || []) {
    if (b === null || b === undefined) continue;
    if (typeof b === 'string') out.push(para(b, { size, after: 80 }));
    else if (b.diagram) out.push(...imageBlock(b, w));
    else if (b.chart !== undefined) out.push(...chartBlock(b, w, size));
    else if (b.stack) out.push(...stackBlock(b, w, size));
    else if (b.arrows) out.push(...arrowsBlock(b, w, size));
    else if (b.psum) out.push(...psumBlock(b, w, size));
    else if (b.lines) out.push(...linesBlock(b, w, size));
    else if (b.table) out.push(...tableBlock(b, w, size));
    else if (b.space) out.push(spacer(Math.round(b.space * 1440)));
    else if (b.p) out.push(para(b.p, { size: b.size ?? size, after: b.after ?? 80, bold: b.bold, italics: b.italics, align: b.align, indent: b.indent }));
    else if (b.row) { // side-by-side sub-blocks: {row: [[blocks], [blocks]]}
      const n = b.row.length;
      const wt = b.weights ?? Array(n).fill(1 / n);
      const cws = wt.map(f => Math.floor((w - 100) * f));
      out.push(new Table({
        width: { size: cws.reduce((a, c) => a + c, 0), type: WidthType.DXA }, columnWidths: cws, layout: TableLayoutType.FIXED, borders: NO_BORDERS,
        rows: [new TableRow({ cantSplit: true, children: b.row.map((col, i) => new TableCell({ width: { size: cws[i], type: WidthType.DXA }, verticalAlign: b.valign ?? VerticalAlign.TOP, margins: { left: 0, right: 120 }, children: ensure(blocks(col, cws[i] - 120, size)) })) })],
      }));
    } else throw new Error('Unknown block: ' + JSON.stringify(b).slice(0, 80));
  }
  return out;
}
const ensure = arr => (arr.length ? arr : [new Paragraph({ children: [] })]);

// ---------- Headings ----------
function topLine(lesson, part) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    spacing: { after: 40 },
    children: [
      new TextRun({ text: `Mathbook · Chapter 2 · Lesson ${lesson.id}`, font: FONT, size: 19, color: '444444' }),
      new TextRun({ text: `\t${part}`, font: FONT, size: 19, color: '444444', bold: true }),
    ],
  });
}
function title(lesson) {
  return new Paragraph({
    spacing: { after: 100 },
    border: { bottom: line(18) },
    children: [new TextRun({ text: `${lesson.id}  ${lesson.title}`, font: FONT, size: 36, bold: true })],
  });
}
function heading(text, opt = {}) {
  return new Paragraph({
    keepNext: true,
    spacing: { before: opt.before ?? 110, after: opt.after ?? 60 },
    border: opt.rule === false ? undefined : { bottom: line(6, '777777') },
    children: [new TextRun({ text, font: FONT, size: opt.size ?? 25, bold: true }), ...(opt.sub ? [new TextRun({ text: `   ${opt.sub}`, font: FONT, size: opt.subSize ?? 20, italics: true })] : [])],
  });
}
function boxed(children, w = CONTENT, fill) {
  return new Table({
    width: { size: w, type: WidthType.DXA }, columnWidths: [w], layout: TableLayoutType.FIXED,
    borders: { ...BOX, insideHorizontal: NONE, insideVertical: NONE },
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({ width: { size: w, type: WidthType.DXA }, shading: fill ? { type: ShadingType.CLEAR, fill, color: 'auto' } : undefined, margins: { top: 80, bottom: 60, left: 140, right: 140 }, children }) ] })],
  });
}

// ---------- Page 1: Parent Learn ----------
function learnSection(L) {
  const S = 20; // 10 pt
  const kids = [topLine(L, 'Parent Learn'), title(L)];
  kids.push(boxed([
    para(`**Learning goal:** ${L.goal}`, { size: 22, after: 30 }),
    para(`**Textbook:** pages ${L.pages}. ${L.bookNote ?? ''}`, { size: 19, after: 0 }),
  ], CONTENT, 'F2F2F2'));

  // Words to know
  kids.push(heading('Words to Know'));
  const tw = [2000, CONTENT - 2000];
  kids.push(new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: tw, layout: TableLayoutType.FIXED,
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideVertical: NONE, insideHorizontal: line(4, 'BBBBBB', BorderStyle.DOTTED) },
    rows: L.vocab.map(([t, d]) => new TableRow({ cantSplit: true, children: [
      new TableCell({ width: { size: tw[0], type: WidthType.DXA }, margins: { top: 20, bottom: 20, left: 60 }, children: [para(t, { bold: true, size: S, after: 0 })] }),
      new TableCell({ width: { size: tw[1], type: WidthType.DXA }, margins: { top: 20, bottom: 20, left: 60 }, children: [para(d, { size: S, after: 0 })] }),
    ] })),
  }));

  // How to teach
  kids.push(heading('How to Teach It'));
  L.teach.forEach(t => kids.push(para(t, { size: S, after: 30, numbering: { reference: 'steps', level: 0 } })));
  if (L.tip) kids.push(para(`**Tip:** ${L.tip}`, { size: S, after: 0, before: 30 }));

  // Worked examples: each item is {title, body, full?}; non-full items pair up two per row
  kids.push(heading('Worked Examples', { sub: L.exampleSub }));
  const rows = [];
  let pending = [];
  const half = Math.floor((CONTENT - 120) / 2);
  const exCell = (ex, w) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders: BOX, margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: ensure([para(`**${ex.title}**`, { size: S, after: 40 }), ...blocks(ex.body, w - 260, S)]),
  });
  const gapCell = () => new TableCell({ width: { size: 120, type: WidthType.DXA }, borders: { top: NONE, bottom: NONE, left: line(8), right: line(8) }, children: [new Paragraph({ children: [] })] });
  const flush = () => {
    if (!pending.length) return;
    if (pending.length === 1) pending.push(null);
    rows.push(new TableRow({ cantSplit: true, children: [exCell(pending[0], half), gapCell(), pending[1] ? exCell(pending[1], half) : new TableCell({ width: { size: half, type: WidthType.DXA }, borders: { top: NONE, bottom: NONE, left: line(8), right: NONE }, children: [new Paragraph({ children: [] })] })] }));
    rows.push(spacerRow(3));
    pending = [];
  };
  const spacerRow = n => new TableRow({ height: { value: 90, rule: HeightRule.EXACT }, children: Array.from({ length: n }, (_, i) => new TableCell({ width: { size: i === 1 ? 120 : half, type: WidthType.DXA }, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, children: [new Paragraph({ children: [] })] })) });
  for (const ex of L.examples) {
    if (ex.full) {
      flush();
      rows.push(new TableRow({ cantSplit: true, children: [new TableCell({ columnSpan: 3, width: { size: CONTENT, type: WidthType.DXA }, borders: BOX, margins: { top: 60, bottom: 60, left: 120, right: 120 }, children: ensure([para(`**${ex.title}**`, { size: S, after: 40 }), ...blocks(ex.body, CONTENT - 260, S)]) })] }));
      rows.push(spacerRow(3));
    } else {
      pending.push(ex);
      if (pending.length === 2) flush();
    }
  }
  flush();
  rows.pop(); // drop trailing spacer
  kids.push(new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [half, 120, half], layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows }));

  // Skills checklist (two columns)
  kids.push(heading('Skills Checklist', { sub: 'Check off each skill your child can do without help.' }));
  const cw = Math.floor(CONTENT / 2);
  const mid = Math.ceil(L.checklist.length / 2);
  const col = items => new TableCell({ width: { size: cw, type: WidthType.DXA }, margins: { left: 40, right: 100 }, children: ensure(items.map(c => para(`☐  ${c}`, { size: S, after: 30, indent: { left: 300, hanging: 300 } }))) });
  kids.push(new Table({ width: { size: cw * 2, type: WidthType.DXA }, columnWidths: [cw, cw], layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows: [new TableRow({ cantSplit: true, children: [col(L.checklist.slice(0, mid)), col(L.checklist.slice(mid))] })] }));
  return kids;
}

// ---------- Page 2: Together and On My Own ----------
const QS = 25; // 12.5 pt for the child's pages
function questionTable(items, labelFn) {
  const numW = 660;
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const q = items[i];
    const sep = { bottom: line(6, '999999', BorderStyle.DASHED) };
    if (q.half && items[i + 1] && items[i + 1].half) {
      const q2 = items[i + 1];
      const hw = Math.floor(CONTENT / 2) - numW;
      const cellsFor = (qq, idx) => [
        new TableCell({ width: { size: numW, type: WidthType.DXA }, borders: { top: NONE, left: NONE, right: NONE, ...sep }, children: [para(`**${labelFn(idx)}.**`, { size: 28, after: 0 })] }),
        new TableCell({ width: { size: hw, type: WidthType.DXA }, borders: { top: NONE, left: NONE, right: NONE, ...sep }, margins: { bottom: 100, right: 160 }, children: ensure(qBody(qq, hw - 160)) }),
      ];
      rows.push(new TableRow({ cantSplit: true, children: [...cellsFor(q, i), ...cellsFor(q2, i + 1)] }));
      i++;
    } else {
      rows.push(new TableRow({ cantSplit: true, children: [
        new TableCell({ width: { size: numW, type: WidthType.DXA }, borders: { top: NONE, left: NONE, right: NONE, ...sep }, children: [para(`**${labelFn(i)}.**`, { size: 28, after: 0 })] }),
        new TableCell({ columnSpan: 3, width: { size: CONTENT - numW, type: WidthType.DXA }, borders: { top: NONE, left: NONE, right: NONE, ...sep }, margins: { bottom: 100 }, children: ensure(qBody(q, CONTENT - numW)) }),
      ] }));
    }
  }
  const hw = Math.floor(CONTENT / 2) - numW;
  return new Table({ width: { size: CONTENT, type: WidthType.DXA }, columnWidths: [numW, hw, numW, CONTENT - 2 * numW - hw], layout: TableLayoutType.FIXED, borders: NO_BORDERS, rows });
}
function qBody(q, w) {
  const out = [];
  if (q.tag) out.push(para(`**${q.tag}**`, { size: 21, after: 20 }));
  out.push(para(q.text, { size: QS, after: 80, before: 20 }));
  out.push(...blocks(q.blocks, w, QS));
  if (q.space) out.push(spacer(Math.round(q.space * 1440)));
  return out;
}
function nameDate() {
  return new Paragraph({
    tabStops: [{ type: TabStopType.LEFT, position: 6400, leader: 'underscore' }, { type: TabStopType.RIGHT, position: CONTENT, leader: 'underscore' }],
    spacing: { before: 60, after: 120 },
    children: [new TextRun({ text: 'Name ', font: FONT, size: 26 }), new TextRun({ text: '\t   Date ', font: FONT, size: 26 }), new TextRun({ text: '\t', font: FONT, size: 26 })],
  });
}
function studentSection(L) {
  const kids = [topLine(L, 'Together and On My Own'), title(L), nameDate()];
  kids.push(heading('Together', { sub: L.togetherSub ?? 'Work with your grown-up. Talk about each step.', size: 30, subSize: 22, before: 60 }));
  kids.push(questionTable(L.together, i => String.fromCharCode(65 + i)));
  kids.push(heading('On My Own', { sub: L.ownSub ?? 'Try these by yourself. Show your work.', size: 30, subSize: 22, before: 240 }));
  if (L.ownBreakBefore) kids[kids.length - 1] = new Paragraph({ ...kids[kids.length - 1], pageBreakBefore: true });
  kids.push(questionTable(L.own, i => String(i + 1)));
  return kids;
}

// ---------- Page 3: Parent Answer Key ----------
function keySection(L) {
  const kids = [topLine(L, 'Parent Answer Key'), title(L)];
  const w = [700, CONTENT - 700];
  const mkRows = (list, labelFn) => list.map((a, i) => new TableRow({ cantSplit: true, children: [
    new TableCell({ width: { size: w[0], type: WidthType.DXA }, children: [para(`**${labelFn(i)}**`, { size: 22, after: 0, align: AlignmentType.CENTER })] }),
    new TableCell({ width: { size: w[1], type: WidthType.DXA }, margins: { top: 50, bottom: 50, left: 120, right: 120 }, children: ensure([
      ...[].concat(a.a).map(t => (typeof t === 'string' ? para(t, { size: 21, after: 30 }) : null)).filter(Boolean),
      ...blocks([].concat(a.a).filter(t => typeof t !== 'string'), w[1] - 240, 21),
      ...(a.note ? [para(`//${a.note}//`, { size: 19, after: 0 })] : []),
    ]) }),
  ] }));
  const tbl = (list, labelFn) => new Table({
    width: { size: CONTENT, type: WidthType.DXA }, columnWidths: w, layout: TableLayoutType.FIXED,
    borders: { top: line(8), bottom: line(8), left: line(8), right: line(8), insideHorizontal: line(4, '888888'), insideVertical: line(4, '888888') },
    rows: mkRows(list, labelFn),
  });
  if (L.keyIntro) kids.push(para(L.keyIntro, { size: 20, after: 60 }));
  kids.push(heading('Together', { before: 80 }));
  kids.push(tbl(L.answers.together, i => String.fromCharCode(65 + i)));
  kids.push(heading('On My Own'));
  kids.push(tbl(L.answers.own, i => String(i + 1)));
  if (L.keyFooter) kids.push(para(L.keyFooter, { size: 20, before: 100 }));
  return kids;
}

function footer(L, part) {
  return new Footer({ children: [new Paragraph({
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT }],
    border: { top: line(4, '999999') },
    children: [
      new TextRun({ text: `Lesson ${L.id} ${L.title} · ${part}`, font: FONT, size: 16, color: '555555' }),
      new TextRun({ children: ['\tPage ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: '555555' }),
    ],
  })] });
}

function buildDoc(L) {
  const props = { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 864, bottom: 864, left: MARGIN, right: MARGIN, footer: 432 } } };
  if (L.answers.together.length !== L.together.length || L.answers.own.length !== L.own.length) {
    throw new Error(`${L.id}: answer count mismatch (together ${L.together.length}/${L.answers.together.length}, own ${L.own.length}/${L.answers.own.length})`);
  }
  return new Document({
    creator: 'Mathbook', title: `Lesson ${L.id} ${L.title} — Study Guide`,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    numbering: { config: [{ reference: 'steps', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 360, hanging: 300 } }, run: { bold: true } } }] }] },
    sections: [
      { properties: props, footers: { default: footer(L, 'Parent Learn') }, children: learnSection(L) },
      { properties: props, footers: { default: footer(L, 'Together and On My Own') }, children: studentSection(L) },
      { properties: props, footers: { default: footer(L, 'Parent Answer Key') }, children: keySection(L) },
    ],
  });
}

function fileName(L) {
  const [a, b] = L.id.split('-');
  return `Lesson-${a}-${b.padStart(2, '0')}-${L.title.replace(/(\d),(\d)/g, '$1$2').replace(/[^A-Za-z0-9]+/g, '-').replace(/-+$/, '')}`;
}

async function main() {
  const args = process.argv.slice(2);
  const oi = args.indexOf('--out');
  const out = oi >= 0 ? args[oi + 1] : path.join(__dirname, '..');
  const ids = args.filter((a, i) => a !== '--out' && i !== oi + 1);
  const dir = path.join(__dirname, 'lessons');
  const all = fs.readdirSync(dir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));
  const pick = ids.length ? ids : all;
  fs.mkdirSync(out, { recursive: true });
  for (const id of pick) {
    const L = require(path.join(dir, id + '.js'));
    const buf = await Packer.toBuffer(buildDoc(L));
    const f = path.join(out, fileName(L) + '.docx');
    fs.writeFileSync(f, buf);
    console.log(f);
  }
}
if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
module.exports = { buildDoc, fileName };
