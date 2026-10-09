// Summarize and compare two audit runs: node tests/audit-compare.mjs baseline after
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/harness.mjs';

const [a, b] = process.argv.slice(2);
const load = (l) => JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'audit-output', l, 'metrics.json'), 'utf8'));
function summary(m) {
  const rows = m.matrix.filter((r) => !r.error);
  const sum = (f) => rows.reduce((n, r) => n + f(r), 0);
  return {
    'Screen-states measured': rows.length,
    'Errors while measuring': m.matrix.length - rows.length,
    'Horizontal overflow (states)': rows.filter((r) => r.overflowX).length,
    'Elements off-screen (states)': rows.filter((r) => r.offscreen.length).length,
    'Text spilling out of its box (instances)': sum((r) => r.spill.length),
    'Touch targets < 24px (instances)': sum((r) => r.small24),
    'Touch targets < 44px (instances)': sum((r) => r.small44),
    'Contrast failures (instances, excl. faded/disabled)': sum((r) => r.contrastList.filter((x) => !/disabled|is-dim|blocks-label|figcaption|\bb \d/.test(x)).length ? r.contrastFails : 0),
    'Contrast failures (all instances)': sum((r) => r.contrastFails),
    'Smallest font (px)': Math.min(...rows.map((r) => r.minFont)),
    'Max sticky coverage (%)': Math.max(...rows.map((r) => r.stickyPct)),
    'Focus stops without visible ring': m.focus.reduce((n, f) => n + f.noRing.length, 0),
    'Text scaling 200%: states with overflow': m.scaling.filter((s) => s.overflowX).length + ' of ' + m.scaling.length,
    'Running animations (reduced motion)': m.motion.reduce.running,
    'Transition checks FAIL': m.transitions.filter((t) => t.ok === 'FAIL').map((t) => t.id).join(', ') || 'none',
    'JavaScript errors': m.errors.length,
    'Missing files (404)': m.missing.length
  };
}
const A = summary(load(a));
const B = summary(load(b));
const lines = ['| Measure | ' + a + ' | ' + b + ' |', '|---|---|---|'];
Object.keys(A).forEach((k) => lines.push(`| ${k} | ${A[k]} | ${B[k]} |`));
console.log(lines.join('\n'));
const mb = load(b);
const issues = mb.matrix.filter((r) => !r.error && (r.overflowX || r.offscreen.length || r.spill.length || r.small24 || r.contrastFails));
console.log('\nRemaining issues in ' + b + ':');
issues.forEach((r) => console.log(`- ${r.state} @ ${r.viewport}: ${[r.overflowX && 'overflow ' + r.scrollW, r.offscreen.length && 'offscreen ' + r.offscreen.join(','), r.spill.length && 'spill ' + r.spill.join('; '), r.small24 && '<24px ' + r.small24List.join(','), r.contrastFails && 'contrast ' + r.contrastList.join('; ')].filter(Boolean).join(' | ')}`));
console.log('\nSmall (<44px) targets in ' + b + ':', [...new Set(mb.matrix.flatMap((r) => r.small44List || []))].join(', '));
console.log('Focus without ring:', mb.focus.map((f) => f.state + ': ' + f.noRing.join(', ')).filter((x) => !/: $/.test(x)).join(' | ') || 'none');
console.log('Text scaling overflow:', mb.scaling.filter((s) => s.overflowX).map((s) => s.state + ' @ ' + s.viewport + ' ' + s.offscreen.join(',')).join(' | ') || 'none');
console.log('Transitions:', mb.transitions.map((t) => t.id + '=' + t.ok).join(' '));
