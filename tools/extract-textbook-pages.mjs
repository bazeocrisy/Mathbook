// Extracts the Chapter 2 textbook scans into one upright JPEG per printed page:
//   docs/textbook-references/chapter-2/pages/page-033.jpg … page-100.jpg   (git-ignored; regenerate any time)
// The PDFs hold one 300-dpi JPEG per page (some wrapped in Flate). Even pages are marked /Rotate 180 (duplex scan),
// so they are turned upright with headless Chrome (no image libraries needed).
// Run: node tools/extract-textbook-pages.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { startBrowser } from '../tests/lib/harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'docs', 'textbook-references', 'chapter-2');
const OUT = path.join(SRC, 'pages');
const PARTS = [['Chapter_2_Part_1_Pages_33-53.pdf', 33], ['Chapter_2_Part_2_Pages_54-76.pdf', 54], ['Chapter_2_Part_3_Pages_77-100.pdf', 77]];

function extract(file, first) {
  const buf = fs.readFileSync(path.join(SRC, file));
  const s = buf.toString('latin1');
  const objs = {};
  const re = /(\d+)\s+0\s+obj\b/g;
  let m;
  while ((m = re.exec(s))) objs[m[1]] = { start: m.index + m[0].length, text: s.slice(m.index, Math.min(s.indexOf('endobj', m.index), m.index + 4000)) };
  const ref = (t, k) => { const r = new RegExp('/' + k + '\\s+(\\d+)\\s+0\\s+R').exec(t); return r && r[1]; };
  const kids = (id) => (/\/Type\s*\/Page\b(?!s)/.test(objs[id].text) ? [id]
    : /\/Kids\s*\[([^\]]*)\]/.exec(objs[id].text)[1].match(/(\d+)\s+0\s+R/g).map((x) => x.split(/\s+/)[0]).flatMap(kids));
  const pages = kids(ref(objs[/\/Root\s+(\d+)\s+0\s+R/.exec(s)[1]].text, 'Pages'));
  return pages.map((pid, i) => {
    const t = objs[pid].text;
    const res = ref(t, 'Resources') ? objs[ref(t, 'Resources')].text : t;
    const xo = /\/XObject\s*<<([^>]*)>>/.exec(res);
    const ids = ((xo ? xo[1] : (ref(res, 'XObject') ? objs[ref(res, 'XObject')].text : '')).match(/(\d+)\s+0\s+R/g) || []).map((x) => x.split(/\s+/)[0]);
    let best = null;
    for (const id of ids) {
      const o = objs[id];
      if (!/\/DCTDecode/.test(o.text)) continue;
      const len = Number(/\/Length\s+(\d+)/.exec(o.text)[1]);
      if (!best || len > best.len) best = { len, o };
    }
    const si = s.indexOf('stream', best.o.start) + 6;
    const start = s[si] === '\r' ? si + 2 : si + 1;
    let jpg = buf.subarray(start, start + best.len);
    if (!(jpg[0] === 0xff && jpg[1] === 0xd8)) jpg = zlib.inflateSync(jpg); // Flate-wrapped JPEG
    const rot = Number((/\/Rotate\s+(-?\d+)/.exec(t) || [0, 0])[1]);
    return { page: first + i, jpg, rot };
  });
}

fs.mkdirSync(OUT, { recursive: true });
const all = PARTS.flatMap(([f, first]) => extract(f, first));
const name = (p) => `page-${String(p).padStart(3, '0')}.jpg`;
all.forEach((p) => fs.writeFileSync(path.join(OUT, name(p.page)), p.jpg));
const turn = all.filter((p) => p.rot % 360 !== 0);
if (turn.length) {
  const server = http.createServer((req, res) => {
    const f = path.join(OUT, decodeURIComponent(req.url.slice(1).split('?')[0]));
    if (fs.existsSync(f) && f.endsWith('.jpg')) { res.writeHead(200, { 'Content-Type': 'image/jpeg' }); fs.createReadStream(f).pipe(res); } else { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end('<html></html>'); }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const b = await startBrowser();
  try {
    await b.load(`http://127.0.0.1:${server.address().port}/index.html`);
    for (const p of turn) {
      const data = await b.js(`const img = new Image(); img.src = '/${name(p.page)}?' + Date.now(); await img.decode();
        const c = document.createElement('canvas'); const q = ${p.rot} % 180 !== 0;
        c.width = q ? img.naturalHeight : img.naturalWidth; c.height = q ? img.naturalWidth : img.naturalHeight;
        const x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); x.rotate(${p.rot} * Math.PI / 180); x.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        return c.toDataURL('image/jpeg', 0.9).split(',')[1];`);
      fs.writeFileSync(path.join(OUT, name(p.page)), Buffer.from(data, 'base64'));
    }
  } finally { b.close(); server.close(); }
}
console.log(`${all.length} pages → ${OUT} (${turn.length} rotated upright)`);
