// SVG diagram builders for the printed study guides. Black-and-white line art,
// rendered to PNG with resvg so Word embeds a crisp raster image.
const { Resvg } = require('@resvg/resvg-js');

const INK = '#000';
const GRID = '#777';
const FONT = 'Arial';

function svgDoc(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
}

function text(x, y, s, size = 14, anchor = 'middle', weight = 'normal') {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${INK}">${s}</text>`;
}

// ---------- Base-ten blocks ----------
const U = 7; // size of one unit cube in px
const D = 16; // isometric depth offset for cubes
const R = 12; // drawn width of rods and units (wider than U so single units are visible)

function gridLines(x, y, cols, rows) {
  let s = '';
  for (let i = 1; i < cols; i++) s += `<line x1="${x + i * U}" y1="${y}" x2="${x + i * U}" y2="${y + rows * U}" stroke="${GRID}" stroke-width="0.8"/>`;
  for (let j = 1; j < rows; j++) s += `<line x1="${x}" y1="${y + j * U}" x2="${x + cols * U}" y2="${y + j * U}" stroke="${GRID}" stroke-width="0.8"/>`;
  return s;
}

function cube(x, y) { // (x,y) = top-left of front face; drawn with top/side faces
  const S = 10 * U;
  let s = `<polygon points="${x},${y} ${x + D},${y - D} ${x + S + D},${y - D} ${x + S},${y}" fill="#eee" stroke="${INK}" stroke-width="1.3"/>`;
  s += `<polygon points="${x + S},${y} ${x + S + D},${y - D} ${x + S + D},${y + S - D} ${x + S},${y + S}" fill="#ccc" stroke="${INK}" stroke-width="1.3"/>`;
  s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#fff" stroke="${INK}" stroke-width="1.3"/>`;
  s += gridLines(x, y, 10, 10);
  s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
  return s;
}
function flat(x, y) {
  const S = 10 * U;
  return `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="#fff" stroke="${INK}" stroke-width="1.3"/>` + gridLines(x, y, 10, 10) +
    `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="none" stroke="${INK}" stroke-width="1.3"/>`;
}
function rod(x, y) {
  let s = `<rect x="${x}" y="${y}" width="${R}" height="${10 * U}" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
  for (let j = 1; j < 10; j++) s += `<line x1="${x}" y1="${y + j * U}" x2="${x + R}" y2="${y + j * U}" stroke="${GRID}" stroke-width="0.8"/>`;
  return s + `<rect x="${x}" y="${y}" width="${R}" height="${10 * U}" fill="none" stroke="${INK}" stroke-width="1.2"/>`;
}
function unit(x, y) {
  return `<rect x="${x}" y="${y}" width="${R}" height="${R}" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;
}

// counts: {th, h, t, o}; labels: show "2 cubes / 2,000" captions under each group
function baseTen(counts, { labels = false } = {}) {
  const { th = 0, h = 0, t = 0, o = 0 } = counts;
  const S = 10 * U;
  const top = D + 4;
  const gap = 26;
  let x = 6;
  let body = '';
  const groups = [];
  const startGroup = () => x;
  if (th) {
    const gx = startGroup();
    for (let i = 0; i < th; i++) { body += cube(x, top); x += S + D + 8; }
    groups.push([gx, x - 8, th, th === 1 ? 'cube' : 'cubes', (th * 1000).toLocaleString('en-US')]);
    x += gap;
  }
  if (h) {
    const gx = startGroup();
    for (let i = 0; i < h; i++) { body += flat(x, top); x += S + 6; }
    groups.push([gx, x - 6, h, h === 1 ? 'flat' : 'flats', String(h * 100)]);
    x += gap;
  }
  if (t) {
    const gx = startGroup();
    for (let i = 0; i < t; i++) { body += rod(x, top); x += R + 5; }
    groups.push([gx, x - 5, t, t === 1 ? 'rod' : 'rods', String(t * 10)]);
    x += gap;
  }
  if (o) {
    const gx = startGroup();
    const perCol = 5;
    const cols = Math.ceil(o / perCol);
    for (let i = 0; i < o; i++) {
      const c = Math.floor(i / perCol), r = i % perCol;
      body += unit(x + c * (R + 4), top + S - (r + 1) * (R + 3) + 3);
    }
    x += cols * (R + 4);
    groups.push([gx, x - 4, o, o === 1 ? 'unit' : 'units', String(o)]);
    x += gap;
  }
  let h2 = top + S + 6;
  if (labels) {
    for (const [a, b, n, word, val] of groups) {
      const cx = (a + b) / 2;
      body += text(cx, top + S + 26, `${n} ${word}`, 21);
      body += text(cx, top + S + 52, val, 21, 'middle', 'bold');
    }
    h2 = top + S + 60;
  }
  const w = Math.max(x - gap + (labels ? 40 : 6), 40);
  return { svg: svgDoc(w, h2, body), w, h: h2 };
}

// ---------- Number line ----------
// opts: {from, to, step, labelEvery, marks:[{v, label, dot, above}], width}
function numberLine({ from, to, step, labelEvery = step, labels = null, marks = [], width = 640, height = 92, blankLabels = [] }) {
  const pad = 34;
  const y = 44;
  const n = Math.round((to - from) / step);
  const px = v => pad + ((v - from) / (to - from)) * (width - 2 * pad);
  let s = `<line x1="${pad - 22}" y1="${y}" x2="${width - pad + 22}" y2="${y}" stroke="${INK}" stroke-width="2"/>`;
  s += `<polygon points="${pad - 26},${y} ${pad - 16},${y - 6} ${pad - 16},${y + 6}" fill="${INK}"/>`;
  s += `<polygon points="${width - pad + 26},${y} ${width - pad + 16},${y - 6} ${width - pad + 16},${y + 6}" fill="${INK}"/>`;
  for (let i = 0; i <= n; i++) {
    const v = from + i * step;
    const big = Math.abs((v - from) % labelEvery) < 1e-9;
    s += `<line x1="${px(v)}" y1="${y - (big ? 11 : 7)}" x2="${px(v)}" y2="${y + (big ? 11 : 7)}" stroke="${INK}" stroke-width="${big ? 2 : 1.3}"/>`;
    const showLabel = labels ? labels.includes(v) : big;
    if (showLabel) {
      if (blankLabels.includes(v)) s += `<rect x="${px(v) - 22}" y="${y + 16}" width="44" height="24" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
      else s += text(px(v), y + 34, v.toLocaleString('en-US'), 16);
    }
  }
  for (const m of marks) {
    if (m.dot) s += `<circle cx="${px(m.v)}" cy="${y}" r="6.5" fill="${INK}"/>`;
    if (m.label) s += text(px(m.v), y - 18, m.label, 16, 'middle', 'bold');
  }
  if (marks.some(m => m.arrowTo !== undefined)) {
    for (const m of marks.filter(mm => mm.arrowTo !== undefined)) {
      const x1 = px(m.v), x2 = px(m.arrowTo);
      const mid = (x1 + x2) / 2;
      s += `<path d="M ${x1} ${y - 10} Q ${mid} ${y - 40} ${x2} ${y - 12}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
      const dir = x2 > x1 ? -1 : 1;
      s += `<polygon points="${x2},${y - 12} ${x2 + dir * 9},${y - 20} ${x2 + dir * 2},${y - 23}" fill="${INK}"/>`;
    }
  }
  return { svg: svgDoc(width, height, s), w: width, h: height };
}

// ---------- Open number line with hops (for counting on / adjusting) ----------
// points: [{v, label}] in order, hops: [{from, to, label}]
function hopLine({ points, hops, width = 640, height = 110, min, max }) {
  const pad = 40;
  const y = 72;
  const lo = min ?? Math.min(...points.map(p => p.v));
  const hi = max ?? Math.max(...points.map(p => p.v));
  const px = v => pad + ((v - lo) / (hi - lo)) * (width - 2 * pad);
  let s = `<line x1="${pad - 20}" y1="${y}" x2="${width - pad + 20}" y2="${y}" stroke="${INK}" stroke-width="2"/>`;
  for (const p of points) {
    s += `<line x1="${px(p.v)}" y1="${y - 9}" x2="${px(p.v)}" y2="${y + 9}" stroke="${INK}" stroke-width="2"/>`;
    if (p.blank) s += `<rect x="${px(p.v) - 26}" y="${y + 13}" width="52" height="24" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    else s += text(px(p.v), y + 30, p.label ?? p.v.toLocaleString('en-US'), 16);
  }
  for (const hp of hops) {
    const x1 = px(hp.from), x2 = px(hp.to);
    const mid = (x1 + x2) / 2;
    const rise = Math.min(48, 18 + Math.abs(x2 - x1) * 0.25);
    s += `<path d="M ${x1} ${y - 6} Q ${mid} ${y - rise * 2} ${x2} ${y - 6}" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
    const dir = x2 > x1 ? -1 : 1;
    s += `<polygon points="${x2},${y - 5} ${x2 + dir * 10},${y - 12} ${x2 + dir * 3},${y - 16}" fill="${INK}"/>`;
    if (hp.blank) s += `<rect x="${mid - 26}" y="${y - rise - 30}" width="52" height="22" fill="#fff" stroke="${INK}" stroke-width="1.2"/>`;
    else if (hp.label) s += text(mid, y - rise - 12, hp.label, 15, 'middle', 'bold');
  }
  return { svg: svgDoc(width, height, s), w: width, h: height };
}

// ---------- Grouping V (Lesson 2-4) ----------
// addends: [27, 53, 40]; pair: index of first of two adjacent addends added first
function groupV({ addends, pair, size = 26 }) {
  const cw = size * 0.62; // approx char width
  const items = [];
  addends.forEach((a, i) => { if (i) items.push('+'); items.push(String(a)); });
  // x positions for each token on the top line
  let x = 10; const xs = [];
  const tokW = t => t.length * cw + (t === '+' ? 2 : 0);
  items.forEach(t => { xs.push(x + tokW(t) / 2); x += tokW(t) + size * 0.55; });
  const W = Math.max(x + 10, 10);
  const yTop = size + 4, yV = yTop + size * 1.9, yBot = yV + size * 1.05;
  let s = items.map((t, i) => text(xs[i], yTop, t, size)).join('');
  const i1 = pair * 2, i2 = pair * 2 + 2;
  const mid = (xs[i1] + xs[i2]) / 2;
  s += `<line x1="${xs[i1]}" y1="${yTop + 8}" x2="${mid}" y2="${yV}" stroke="${INK}" stroke-width="2"/>`;
  s += `<line x1="${xs[i2]}" y1="${yTop + 8}" x2="${mid}" y2="${yV}" stroke="${INK}" stroke-width="2"/>`;
  const ps = addends[pair] + addends[pair + 1];
  const total = addends.reduce((a, c) => a + c, 0);
  const rest = addends.filter((_, i) => i !== pair && i !== pair + 1);
  let line2;
  if (pair === 0) line2 = [ps, ...rest.flatMap(r => ['+', r])];
  else line2 = [...rest.flatMap(r => [r, '+']), ps];
  const str = line2.join(' ') + ' = ' + total;
  // place the pair sum under the V; build the rest of the line around it
  const before = pair === 0 ? '' : line2.slice(0, -1).join(' ') + ' ';
  const after = pair === 0 ? ' ' + line2.slice(1).join(' ') + ' = ' + total : ' = ' + total;
  const sumW = String(ps).length * cw;
  const startX = mid - sumW / 2 - before.length * cw;
  void str;
  s += `<text x="${startX}" y="${yBot}" font-family="${FONT}" font-size="${size}" fill="${INK}" xml:space="preserve">${before}<tspan font-weight="bold">${ps}</tspan>${after}</text>`;
  const endX = startX + (before.length + String(ps).length + after.length) * cw;
  const w2 = Math.max(W, endX + 10);
  return { svg: svgDoc(Math.ceil(w2), Math.ceil(yBot + 10), s), w: w2, h: yBot + 10 };
}

function toPng(svg, scale = 3) {
  const r = new Resvg(svg, { fitTo: { mode: 'zoom', value: scale }, font: { loadSystemFonts: true, defaultFontFamily: FONT } });
  return r.render().asPng();
}

module.exports = { baseTen, numberLine, hopLine, groupV, toPng, svgDoc, text };
