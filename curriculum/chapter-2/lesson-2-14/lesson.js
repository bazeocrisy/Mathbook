/*
 * Mathbook — Chapter 2, Lesson 2-14: Fluently Add Multi-Digit Numbers
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-14.md (with the batch-D review fixes D-1…D-4, D-8…D-10).
 * Book methods (p. 88): decompose an addend (running total), partial sums with full values, and the addition algorithm
 * (start at the ones; regroup 10 of a place as 1 of the next, including into a new place); choose a strategy; useful
 * information. Shared controls: chain rows with the child's own running total (Decision 9), vcalc `rows` (partial
 * sums) and vcalc `digits` with optional, ungraded regroup boxes (the algorithm).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-14.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const plus = (a, b) => `${fmt(a)} + ${fmt(b)}`;
  /** Place-value parts of n (non-zero), largest first. */
  const parts = (n) => String(n).split('').map((d, i, s) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean);
  /** Column-by-column algorithm text: "7 + 8 = 15 → 5 r1; 1 + 5 + 6 = 12 → 2 r1; … → 3,825." */
  function algText(a, b) {
    const A = String(a).split('').reverse().map(Number), B = String(b).split('').reverse().map(Number);
    const n = Math.max(A.length, B.length);
    let carry = 0; const steps = [];
    for (let i = 0; i < n; i++) {
      const x = A[i] || 0, y = B[i] || 0, s = x + y + carry;
      const terms = (carry ? [1] : []).concat(i < A.length ? [x] : [], i < B.length ? [y] : []);
      steps.push(`${terms.join(' + ')} = ${s}${s >= 10 ? ` → ${s % 10}, regroup 1` : ''}`);
      carry = s >= 10 ? 1 : 0;
    }
    if (carry) steps.push('the regrouped 1 makes a new place');
    return `${steps.join('; ')}. ${plus(a, b)} = ${fmt(a + b)}.`;
  }
  /** Partial sums by place: [{ place, v }] largest first. */
  function partialsOf(a, b) {
    const L = Math.max(String(a).length, String(b).length);
    const out = [];
    for (let p = L - 1; p >= 0; p--) { const u = 10 ** p; out.push(Math.floor(a / u) % 10 * u + Math.floor(b / u) % 10 * u); }
    return out;
  }
  const partialText = (a, b) => `${partialsOf(a, b).map(fmt).join(' + ')} = ${fmt(a + b)}`;
  const regroups = (a, b) => { let c = 0, n = 0; for (let u = 1; u <= Math.max(a, b); u *= 10) { const s = Math.floor(a / u) % 10 + Math.floor(b / u) % 10 + c; c = s >= 10 ? 1 : 0; n += c; } return n; };

  /** True when a number the child must type is printed in the question's own text (not a figure). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    if (q.type === 'vcalc') nums.push(q.rows.reduce((x, y) => x + y, 0));
    if (q.type === 'chain' && q.final) nums.push(q.final.answer);
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** The algorithm (answer row one digit at a time, regroup boxes optional). */
  function algQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'vcalc', op: '+', rows: [a, b], input: 'digits', carries: true, skill: o.skill || 'algorithm',
      prompt: o.prompt || (o.left ? `Use the algorithm: ? = ${plus(a, b)}` : `Use the algorithm: ${plus(a, b)} = ?`),
      figure: o.figure,
      hint: o.hint || 'Start with the ones. If a place makes 10 or more, write the ones digit and regroup 1.',
      explanation: (o.lead ? o.lead + ' ' : '') + algText(a, b)
    };
  }
  /** Partial sums (rows control). */
  function partialQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'vcalc', op: '+', rows: [a, b], input: 'rows', skill: o.skill || 'partial',
      prompt: o.prompt || `Use partial sums: ${plus(a, b)}.`,
      hint: o.hint || 'Write what each place is worth: 5 tens + 6 tens = 11 tens = 110.',
      explanation: `${partialsOf(a, b).map(fmt).join(' + ')} = ${fmt(a + b)}.`
    };
  }
  /** Written across: the child lines up the places. */
  function acrossQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'across', prompt: o.prompt || (o.left ? `? = ${plus(a, b)}` : `${plus(a, b)} = ?`),
      parts: [{ kind: 'num', label: o.label || (o.left ? 'The ? is' : 'The sum:'), answer: a + b }],
      hint: o.hint || 'Line up the ones on paper. Then add each place, starting with the ones.',
      explanation: `Line up the ones. ${algText(a, b)}`
    };
  }
  /** Decompose an addend into given parts; agree or not. o: { id, who, pron, a, b, split: [..], seed? } */
  function splitQ(o) {
    const { a, b, split } = o, sum = split.reduce((x, y) => x + y, 0);
    const good = sum === b;
    const right = good ? `Yes. ${split.map(fmt).join(' + ')} = ${fmt(b)}, so ${o.pron.toLowerCase()} added all of ${fmt(b)}.` : `No. ${split.map(fmt).join(' + ')} = ${fmt(sum)}, not ${fmt(b)}.`;
    const wrong = good ? ['No. You must add the hundreds first.', `No. ${fmt(split[0])} is not a place-value part, so it is not allowed.`, 'No. The parts are too big.']
      : [`Yes. ${o.pron} added in three steps.`, `No. ${o.pron} must add the hundreds first.`, `Yes. ${fmt(split[0])} makes a friendly number.`];
    let cur = a; const chainTxt = split.map((p) => { cur += p; return `+ ${fmt(p)} = ${fmt(cur)}`; }).join(', ');
    return {
      id: o.id, type: 'parts', skill: 'error',
      prompt: `${o.who} adds ${plus(a, b)}. ${o.pron} adds ${split.map(fmt).join(', then ')}. Do you agree with ${o.pron === 'He' ? 'his' : 'her'} strategy?`,
      parts: [
        { kind: 'choice', label: 'Do you agree?', answer: right, choices: order(o, [right].concat(wrong)) },
        { kind: 'num', label: good ? 'What is the sum?' : 'What is the correct sum?', answer: a + b }
      ],
      hint: o.hint || `Add ${o.pron === 'He' ? 'his' : 'her'} parts. Do they make ${fmt(b)}?`,
      explanation: `${split.map(fmt).join(' + ')} = ${fmt(sum)}${good ? ` = ${fmt(b)} ✓` : `, not ${fmt(b)}`}. ${fmt(a)} ${chainTxt}${good ? '' : ` (${fmt(Math.abs(sum - b))} too ${sum > b ? 'many' : 'few'})`}. Correct: ${plus(a, b)} = ${fmt(a + b)}.`
    };
  }
  /** Partial-sum rows shown without the total; find the sum with the algorithm, then "same?". Two questions. */
  function anotherWayQs(o) {
    const { a, b } = o, P = partialsOf(a, b);
    const figure = { fig: 'stack', rows: [a, b], op: '+', partials: P.map((v) => ({ v })), total: null, caption: `${o.who}'s partial sums (no total yet)` };
    return [
      algQ({ id: o.id, a, b, skill: 'another', figure, prompt: `${o.who} used partial sums for ${plus(a, b)} and wrote the rows ${P.map(fmt).join(', ')}. Find the sum another way: use the algorithm.` }),
      { id: o.id + 'b', type: 'parts', skill: 'another', prompt: `${o.who}'s partial sums were ${P.map(fmt).join(', ')}. Is your algorithm sum the same as ${P.map(fmt).join(' + ')}?`,
        parts: [{ kind: 'choice', label: 'Is it the same?', answer: 'Yes. Both ways add the same places.', choices: order(o, ['Yes. Both ways add the same places.', 'No. Partial sums give a different answer.']) }],
        hint: 'Add the partial sums and compare.', explanation: `${P.map(fmt).join(' + ')} = ${fmt(a + b)}, the same as the algorithm.` }
    ];
  }
  /** "Fewer than" → add. */
  function fewerQ(o) {
    const { small, diff } = o, right = `${plus(small, diff)} = ?`;
    return {
      id: o.id, type: 'parts', skill: 'fewer', prompt: o.story,
      parts: [
        { kind: 'choice', label: 'Which equation helps?', answer: right, choices: order(o, [right, `${fmt(small)} − ${fmt(diff)} = ?`, `${fmt(diff)} − ${fmt(small)} = ?`]) },
        { kind: 'num', label: o.label, answer: small + diff }
      ],
      hint: o.hint || 'Who has more? If someone has fewer, the other has more.',
      explanation: `${o.big} has more, so add: ${algText(small, diff)}`
    };
  }
  /** Useful information: which numbers do you add, then the sum. */
  function usefulQ(o) {
    const { a, b, extra } = o;
    return {
      id: o.id, type: 'parts', skill: 'useful', prompt: o.story,
      parts: [
        { kind: 'multi', label: 'Which numbers do you need?', answer: [fmt(a), fmt(b)], choices: order(o, [fmt(a), fmt(b), fmt(extra)]), compact: true },
        { kind: 'num', label: o.label, answer: a + b }
      ],
      hint: o.hint || 'What does the question ask? Cross out what you don\'t need.',
      explanation: `${fmt(extra)} is extra information. ${algText(a, b)}`
    };
  }
  /** Packs: how many packs, and how many extra. */
  function packsQ(o) {
    const n = Math.ceil(o.need / o.pack), extra = n * o.pack - o.need;
    return {
      id: o.id, type: 'parts', skill: 'packs', prompt: o.story,
      parts: [{ kind: 'num', label: 'Packs to buy:', answer: n }, { kind: 'num', label: `Extra ${o.item}:`, answer: extra }],
      hint: o.hint || `Add ${fmt(o.pack)} again and again until you reach ${fmt(o.need)} or more.`,
      explanation: `${Array.from({ length: n }, (_, i) => fmt(o.pack * (i + 1))).join(', ')}: ${n - 1} packs make ${fmt(o.pack * (n - 1))}, not enough; ${n} packs make ${fmt(n * o.pack)}. ${fmt(n * o.pack)} − ${fmt(o.need)} = ${fmt(extra)} extra.`
    };
  }
  /** Two-step "more than both together". */
  function twoQ(o) {
    const t = o.a + o.b;
    return {
      id: o.id, type: 'parts', skill: 'twostep', prompt: o.story,
      parts: [{ kind: 'num', label: o.l1, answer: t }, { kind: 'num', label: o.l2, answer: t + o.c }],
      hint: o.hint || 'First find "together." Then add the "more."',
      explanation: `${plus(o.a, o.b)} = ${fmt(t)}. ${plus(t, o.c)} = ${fmt(t + o.c)}.`
    };
  }
  /** Both strategies work (Work Together). */
  function bothQ(o) {
    const { a, b } = o, right = 'Yes. Both add every place, so both get the same sum.';
    return {
      id: o.id, type: 'parts', skill: 'both', prompt: `${o.names[0]} and ${o.names[1]} add ${plus(a, b)}. ${o.names[0]} uses the algorithm. ${o.names[1]} uses partial sums. Can both strategies work?`,
      parts: [
        { kind: 'choice', label: 'Can both work?', answer: right, choices: order(o, [right, 'No. Partial sums only work for 3-digit numbers.', 'No. The sum is more than 9,999, so you can\'t add it.', `Only ${o.names[0]}'s way works.`]) },
        { kind: 'num', label: 'The sum:', answer: a + b }
      ],
      hint: o.hint || 'Try both. Do they match?',
      explanation: `Partial sums: ${partialText(a, b)}. Algorithm: ${algText(a, b)}`
    };
  }
  /** Decompose an addend: a running total, checked against the child's own previous line (Decision 9). */
  function decomposeQ(o) {
    const { a, b } = o, P = parts(b);
    const rows = P.map((p, k) => ({ cells: [k ? { echo: `r${k - 1}` } : a, '+', p, '=', { in: `r${k}`, label: `Step ${k + 1} answer` }], true: true, step: true }));
    let cur = a; const lines = P.map((p) => { const t = `${fmt(cur)} + ${fmt(p)} = ${fmt(cur + p)}`; cur += p; return t; });
    return {
      id: o.id, type: 'chain', preset: 'frame', skill: 'decompose',
      prompt: `${plus(a, b)}. Add one part of ${fmt(b)} at a time: ${P.map(fmt).join(' + ')}.`,
      rows, final: { label: `So ${plus(a, b)} =`, answer: a + b },
      hint: o.hint || 'Add the thousands first. Then add each smaller part to your new number.',
      explanation: `${lines.join(', ')}. ${plus(a, b)} = ${fmt(a + b)}.`
    };
  }

  // ---------- Learn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const lines = (list) => fig({ fig: 'eqs', lines: list });
  const stackFig = (a, b, extra) => fig(Object.assign({ fig: 'stack', rows: [a, b], op: '+' }, extra || {}));
  const DEMO = [3146, 2537, 2457, 1368, 6184, 359, 5428, 384, 5736, 4582, 2180, 3465, 4250, 1375];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };
  const digit = (r, lo) => pv.randInt(r, lo === undefined ? 1 : lo, 9);

  function decomposeCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 1000, 8999), b = digit(r) * 1000 + digit(r) * 100 + digit(r) * 10 + digit(r);
      if (a + b > 9999 || !ok(a, b, a + b)) continue;
      return decomposeQ({ id: 'learn-1', a, b });
    }
  }
  function partialCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 1000, 8999), b = pv.randInt(r, 1000, 8999);
      if (a + b > 9999 || regroups(a, b) < 1 || !ok(a, b, a + b)) continue;
      return partialQ({ id: 'learn-2', a, b });
    }
  }
  function algCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 1000, 8999), b = pv.randInt(r, 1000, 8999);
      const g = regroups(a, b);
      if (a + b > 9999 || g < 1 || g > 2 || !ok(a, b, a + b)) continue;
      return algQ({ id: 'learn-3', a, b });
    }
  }
  function bigCheck(r) {
    const k = pv.randInt(r, 0, 2);
    for (;;) {
      let a, b;
      if (k === 0) { a = pv.randInt(r, 1000, 9499); b = pv.randInt(r, 100, 999); if (a + b > 9999) continue; }
      else if (k === 1) { a = pv.randInt(r, 2000, 9999); b = pv.randInt(r, 2000, 9999); if (a + b < 10000 || a + b > 18000) continue; }
      else { a = pv.randInt(r, 10000, 29999); b = pv.randInt(r, 1000, 9999); if (a + b > 39999) continue; }
      if (!ok(a, b, a + b)) continue;
      return algQ({ id: 'learn-4', a, b, hint: 'Line up the ones. Keep going left until every place is added, including a regrouped 1.' });
    }
  }
  function storyCheck(r) {
    const n = pv.pick(r, ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana']);
    for (;;) {
      if (r() < 0.5) {
        const a = pv.randInt(r, 1000, 5000), b = pv.randInt(r, 1000, 4000), extra = 50 * pv.randInt(r, 4, 18);
        if (a + b > 9999 || !ok(a, b, a + b)) continue;
        return usefulQ({ id: 'learn-5', a, b, extra, r, label: 'Visitors on both days:',
          story: `A zoo had ${fmt(a)} visitors on Friday and ${fmt(b)} on Saturday. On Friday, ${fmt(extra)} visitors bought hats. How many visitors came on both days?` });
      }
      const small = pv.randInt(r, 1000, 6000), diff = pv.randInt(r, 1000, 3000);
      if (small + diff > 9999 || !ok(small, diff, small + diff)) continue;
      const other = n === 'Ava' ? 'Ben' : 'Ava';
      return fewerQ({ id: 'learn-5', small, diff, big: other, r, label: `${other}'s points:`,
        story: `${n} scored ${fmt(diff)} fewer points than ${other}. ${n} scored ${fmt(small)}. How many points did ${other} score?` });
    }
  }

  const steps = [
    {
      id: 'decompose', kind: 'slides', title: 'Decompose an addend',
      explain: 'Keep the first addend. Break the second into parts and add one part at a time.',
      slides: [
        say('A school library has <b>3,146</b> books. It gets <b>2,537</b> more. How many books now? 3,146 + 2,537.'),
        say('Break 2,537 into thousands, hundreds, tens and ones: <b>2,000 + 500 + 30 + 7</b>.'),
        lines(['3,146 + 2,000 = 5,146', '5,146 + 500 = 5,646', '5,646 + 30 = 5,676', { text: '5,676 + 7 = 5,683', hi: true }]) + say('3,146 + 2,537 = <b>5,683</b>.'),
        say('The parts don\'t have to be place-value parts. 5,428 + 384: 5,428 needs <b>72</b> to make 5,500. Split 384 into 72 + 300 + 12.') + lines(['5,428 + 72 = 5,500', '5,500 + 300 = 5,800', { text: '5,800 + 12 = 5,812', hi: true }]),
        say('Always check: do the parts make the number? 72 + 300 + 12 = 384 ✓.') + say('Jay splits 384 into 72 + 300 + 2. Check: 72 + 300 + 2 = 374, not 384 ✗. His parts are 10 too small, so his answer would be 10 too small (5,802).')
      ],
      check: noLeak(decomposeCheck)
    },
    {
      id: 'partial', kind: 'slides', title: 'Partial sums',
      explain: 'Add each place. Write what each part is worth. Then add the partial sums.',
      slides: [
        stackFig(2457, 1368) + say('2,457 + 1,368. Add each place. Write what each part is worth.'),
        stackFig(2457, 1368, { partials: true, reveal: 2 }) + say('Thousands: 2,000 + 1,000 = <b>3,000</b>. Hundreds: 400 + 300 = <b>700</b>.'),
        stackFig(2457, 1368, { partials: true, reveal: 4 }) + say('Tens: 50 + 60 = <b>110</b>. Ones: 7 + 8 = <b>15</b>.'),
        stackFig(2457, 1368, { partials: true }) + say('Add the partial sums: 3,000 + 700 + 110 + 15 = <b>3,825</b>.')
      ],
      check: noLeak(partialCheck)
    },
    {
      id: 'algorithm', kind: 'slides', title: 'The addition algorithm',
      explain: 'Line up the places. Start with the ones. If a place makes 10 or more, write the ones digit and regroup 1 to the next place.',
      slides: [
        stackFig(2457, 1368, { places: true }) + say('Same problem, fewer steps. Line up the places. Start with the ones.'),
        stackFig(2457, 1368, { places: true, carries: { T: 1 }, result: 1, focus: 'O' }) + say('Ones: 7 + 8 = 15. 15 ones = 1 ten and 5 ones. Write <b>5</b>. Regroup the 1 ten: write a small 1 above the tens.'),
        stackFig(2457, 1368, { places: true, carries: { T: 1, H: 1 }, result: 2, focus: 'T' }) + say('Tens: 1 + 5 + 6 = 12. 12 tens = 1 hundred and 2 tens. Write <b>2</b>. Regroup 1 above the hundreds.'),
        stackFig(2457, 1368, { places: true, carries: { T: 1, H: 1 }, result: 'all' }) + say('Hundreds: 1 + 4 + 3 = <b>8</b>. Thousands: 2 + 1 = <b>3</b>. 2,457 + 1,368 = <b>3,825</b>, the same as partial sums. The algorithm just writes less.')
      ],
      check: noLeak(algCheck)
    },
    {
      id: 'big', kind: 'slides', title: 'Line up different sizes and go past 9,999',
      explain: 'Line up the ones. Keep adding to the left; a regrouped 1 at the end makes a new place.',
      slides: [
        stackFig(6184, 359, { places: true }) + say('6,184 + 359: line up the <b>ones</b> under the ones. 359 has no thousands.'),
        stackFig(6184, 359, { places: true, carries: { T: 1, H: 1 }, result: 'all' }) + say('4 + 9 = 13 → 3, regroup. 1 + 8 + 5 = 14 → 4, regroup. 1 + 1 + 3 = 5. 6. <b>6,543</b>.'),
        stackFig(5736, 4582, { places: true, carries: { H: 1, Th: 1, TTh: 1 }, result: 'all' }) + say('5,736 + 4,582: ones 6 + 2 = 8. Tens 3 + 8 = 11 → 1, regroup. Hundreds 1 + 7 + 5 = 13 → 3, regroup. Thousands 1 + 5 + 4 = 10 → write 0, regroup 1 <b>ten thousand</b>.'),
        say('The sum is <b>10,318</b>, a 5-digit number. Partial sums agree: 9,000 + 1,200 + 110 + 8 = 10,318.')
      ],
      check: noLeak(bigCheck)
    },
    {
      id: 'choose', kind: 'slides', title: 'Choose a strategy and solve problems',
      explain: 'Use the numbers the question needs. "Fewer than" means the other one has more. Pick a strategy that keeps the places straight.',
      slides: [
        say('A zoo had 2,180 visitors on Friday and 3,465 on Saturday. On Friday, 450 visitors bought hats. How many visitors came on both days?') +
          say('We need 2,180 and 3,465. The 450 hat buyers are already counted on Friday. 2,180 + 3,465 = <b>5,645</b>.'),
        say('Ben scored 1,375 fewer points than Ava. Ben scored 4,250. Ava scored <b>more</b>, so add: 4,250 + 1,375 = <b>5,625</b>.') +
          fig({ fig: 'bar', kind: 'cmp', long: '?', short: 4250, gap: 1375, sizes: [5625, 4250] }),
        say('Which strategy? 3,000 + 2,999: decompose or adjust. 4,786 + 3,659: the algorithm. Any strategy that keeps the places straight is fine.')
      ],
      check: noLeak(storyCheck)
    }
  ];

  // ---------- Practice Together (15), On My Own (15), Test (14) ----------
  const guided = [
    algQ({ id: 'p1', a: 548, b: 376, skill: 'alg3', hint: 'Start with the ones.' }),
    acrossQ({ id: 'p2', a: 214, b: 3352, left: true, skill: 'left', hint: 'The = sign means "is the same as." The ? is the sum.' }),
    algQ({ id: 'p3', a: 2785, b: 5469, left: true, skill: 'alg4', hint: 'Three places regroup.' }),
    algQ({ id: 'p4', a: 15203, b: 2416, skill: 'big', hint: 'Line up the ones; 2,416 has no ten thousands.' }),
    splitQ({ id: 'p5', who: 'Leo', pron: 'He', a: 2316, b: 587, split: [84, 500, 3], seed: 5 }),
    ...anotherWayQs({ id: 'p6', who: 'Mia', a: 437, b: 285, seed: 6 }),
    fewerQ({ id: 'p7', small: 3640, diff: 1285, big: 'His brother', label: 'Pages his brother read:', seed: 7, story: 'Kai read 1,285 fewer pages than his brother. Kai read 3,640 pages. How many pages did his brother read?' }),
    partialQ({ id: 'p8', a: 627, b: 285, hint: 'Hundreds, tens, ones: write what each is worth.' }),
    { id: 'p8x', type: 'explain', skill: 'reason', prompt: 'Explain aloud how you added 627 + 285 and why you chose that strategy.', parent: 'Parent review: listen to the explanation.',
      listenFor: ['Partial sums: 800 + 100 + 12 = 912.', 'Or the algorithm: 7 + 5 = 12, write 2 and regroup 1…'], explanation: 'Any clear strategy that adds every place works: 627 + 285 = 912.' },
    acrossQ({ id: 'p9', a: 8365, b: 247, hint: 'Line up the ones: 7 goes under 5.' }),
    packsQ({ id: 'p10', need: 700, pack: 250, item: 'cups', story: 'Ms. Lee needs 700 paper cups. Cups come in packs of 250. How many packs should she buy? How many cups will be extra?' }),
    usefulQ({ id: 'p11', a: 1465, b: 2738, extra: 900, seed: 11, label: 'Cans collected:', hint: 'The question asks how many were collected.', story: 'A school collected 1,465 cans in the fall and 2,738 cans in the spring. They gave 900 cans to a food bank. How many cans did the school collect?' }),
    twoQ({ id: 'p12', a: 126, b: 243, c: 118, l1: 'Morning and afternoon together:', l2: 'Evening:', story: 'A museum had 126 visitors in the morning and 243 in the afternoon. In the evening it had 118 more visitors than the morning and afternoon together. How many visitors came in the evening?' }),
    bothQ({ id: 'p13', a: 6527, b: 4385, names: ['Ana', 'Ben'], seed: 13 }),
    splitQ({ id: 'p14', who: 'Ella', pron: 'She', a: 4527, b: 268, split: [73, 200, 5], seed: 14 })
  ];
  const parentTips = { p1: 'Ask: what did you do with the extra ten?', p3: 'Ask: what did you do with the extra ten?', p5: 'Ask: why did Leo choose 84 first? (2,316 + 84 makes 2,400.)', p7: 'Draw two bars. Which bar is longer?', p10: 'Let your child count by 250s out loud: 250, 500, 750.', p11: 'Ask: what is the question asking? Cross out what we don\'t need.' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = q.parent || parentTips[q.id]; });

  const bank = [
    algQ({ id: 'o1', a: 467, b: 385, skill: 'alg3' }),
    acrossQ({ id: 'o2', a: 125, b: 4631, left: true, skill: 'left' }),
    algQ({ id: 'o3', a: 4968, b: 3275, left: true, skill: 'alg4' }),
    algQ({ id: 'o4', a: 31402, b: 5375, skill: 'big' }),
    splitQ({ id: 'o5', who: 'Nico', pron: 'He', a: 3245, b: 692, split: [55, 600, 37], seed: 25 }),
    ...anotherWayQs({ id: 'o6', who: 'Sara', a: 548, b: 263, seed: 26 }),
    fewerQ({ id: 'o7', small: 2748, diff: 1165, big: 'Jo', label: 'Meters Jo biked:', seed: 27, story: 'Mae biked 1,165 fewer meters than Jo. Mae biked 2,748 meters. How far did Jo bike?' }),
    partialQ({ id: 'o8', a: 538, b: 274 }),
    acrossQ({ id: 'o9', a: 6247, b: 568 }),
    packsQ({ id: 'o10', need: 800, pack: 300, item: 'balloons', story: 'Mr. Diaz needs 800 balloons. Balloons come in packs of 300. How many packs should he buy? How many balloons will be extra?' }),
    usefulQ({ id: 'o11', a: 3276, b: 1858, extra: 500, seed: 31, label: 'Apples picked:', story: 'A farm picked 3,276 apples in September and 1,858 in October. It sold 500 apples at a market. How many apples did the farm pick?' }),
    twoQ({ id: 'o12', a: 231, b: 145, c: 116, l1: 'June and July together:', l2: 'August:', story: 'A camp had 231 campers in June and 145 in July. In August it had 116 more campers than June and July together. How many campers in August?' }),
    bothQ({ id: 'o13', a: 7264, b: 3958, names: ['Pat', 'Sue'], seed: 33 }),
    splitQ({ id: 'o14', who: 'Ray', pron: 'He', a: 2639, b: 457, split: [61, 400, 6], seed: 34 })
  ];

  const testItems = [
    algQ({ id: 't1', a: 659, b: 287, skill: 'alg3' }),
    acrossQ({ id: 't2', a: 342, b: 4516, left: true, skill: 'left' }),
    algQ({ id: 't3', a: 3847, b: 4395, left: true, skill: 'alg4' }),
    algQ({ id: 't4', a: 23105, b: 4672, skill: 'big' }),
    splitQ({ id: 't5', who: 'Zoe', pron: 'She', a: 3428, b: 365, split: [72, 300, 3] }),
    ...anotherWayQs({ id: 't6', who: 'Raj', a: 356, b: 478 }),
    fewerQ({ id: 't7', small: 2365, diff: 1470, big: 'Her aunt', label: 'Stamps her aunt has:', story: 'Rosa has 1,470 fewer stamps than her aunt. Rosa has 2,365 stamps. How many does her aunt have?' }),
    partialQ({ id: 't8', a: 718, b: 196 }),
    acrossQ({ id: 't9', a: 7456, b: 386 }),
    packsQ({ id: 't10', need: 900, pack: 350, item: 'stickers', story: 'Mr. Cruz needs 900 stickers. Stickers come in packs of 350. How many packs should he buy? How many stickers will be extra?' }),
    usefulQ({ id: 't11', a: 2586, b: 1947, extra: 800, label: 'Visitors in June and July:', story: 'A park had 2,586 visitors in June and 1,947 in July. It sold 800 ice creams in July. How many visitors did the park have in June and July?' }),
    twoQ({ id: 't12', a: 214, b: 152, c: 127, l1: 'Saturday and Sunday together:', l2: 'Monday:', story: 'A pool had 214 swimmers on Saturday and 152 on Sunday. On Monday it had 127 more swimmers than Saturday and Sunday together. How many on Monday?' }),
    bothQ({ id: 't13', a: 5618, b: 4753, names: ['Kim', 'Lou'] })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** Adding Test: the same 14 questions; choice order changes with each attempt. */
  function addingTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-14'] = {
    id: '2-14',
    storageKey: 'mathbook:v2:lesson-2-14',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-14',
    title: 'Fluently Add Multi-Digit Numbers',
    subtitle: 'Decompose, partial sums, or the algorithm',
    objective: 'I can add multi-digit numbers by decomposing an addend, with partial sums, and with the addition algorithm, and I can pick a strategy that works well.',
    parentLearn: {
      goal: [
        'Decompose one addend by place value and add the parts one at a time.',
        'Find partial sums by place (thousands, hundreds, tens, ones) and add them.',
        'Use the addition algorithm: line up by place, start at the ones, regroup 10 of a place as 1 of the next, including into a new ten-thousands place.',
        'Add numbers with different numbers of digits (3 + 4 digits, 5 + 4 digits).',
        'Judge someone else\'s strategy; use only the needed information; read "fewer than" correctly; solve two-step and packs problems.'
      ],
      words: [
        { term: 'Addend', meaning: 'A number you add.' },
        { term: 'Sum', meaning: 'The answer to an addition problem.' },
        { term: 'Decompose', meaning: 'Break a number into parts.', example: '1,569 = 1,000 + 500 + 60 + 9' },
        { term: 'Partial sums', meaning: 'The sums you get when you add one place at a time; add them to get the total.' },
        { term: 'Algorithm', meaning: 'A set of steps you do the same way every time.' },
        { term: 'Regroup', meaning: 'Trade 10 of one place for 1 of the next place (10 ones → 1 ten).' },
        { term: 'Strategy', meaning: 'A way to solve a problem.' }
      ],
      demoVisual: fig({ fig: 'stack', rows: [2457, 1368], op: '+', places: true, carries: { T: 1, H: 1 }, result: 'all' }),
      demonstrate: [
        '3,146 + 2,537 by adding 2,000, 500, 30, 7.',
        '2,457 + 1,368 by partial sums (3,000; 700; 110; 15).',
        'The same problem with the algorithm, saying "15 ones is 1 ten and 5 ones."',
        '5,736 + 4,582 = 10,318: the last regroup makes a new place.',
        'Book example: 2,322 + 1,569 = 3,891 (the 1,350 in the story is not needed).'
      ],
      ask: ['"What place do you start with?"', '"What did you do with the extra ten?"', '"Do the parts add back up to the number?"', '"Which numbers does the question need?"', '"Who has more?"'],
      checklist: [
        'Decomposes an addend and keeps a running total.',
        'Finds partial sums with full values.',
        'Uses the algorithm with regrouping, including into a new place.',
        'Lines up numbers of different sizes.',
        'Judges another person\'s strategy.',
        'Solves "fewer than", extra-information, packs and two-step problems, and scores 90% or higher on the Adding Test.'
      ]
    },
    mistakes: [
      'Forgetting the regrouped 1 (548 + 376 → 814). Write the small 1 above the next place every time.',
      'Writing the whole place sum (7 + 8 = 15, writing "15" in the ones). One digit per box; the ten moves left.',
      'Lining up the left digits instead of the ones (8,365 + 247). Start lining up from the right.',
      'Stopping before the last regroup (5,736 + 4,582 → 0,318). A regrouped 1 left over goes in a new place.',
      'Decomposing wrongly (72 + 300 + 3 for 365). Add the parts back up to check.',
      'Subtracting in "fewer than" problems. Decide who has more; draw two bars.',
      'Using every number in a word problem. Re-read the question; cross out what is not needed.',
      'Packs: answering 2 because it is "about 2". The packs must cover the whole amount.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How do you decide which addition strategy to use?',
        idea: 'Look at the numbers. If one number is easy to break apart or close to a ten or hundred, use mental math. For big numbers with lots of regrouping, the algorithm is quick.'
      }
    },
    skills: {
      decompose: 'Decompose an addend',
      partial: 'Partial sums',
      algorithm: 'The addition algorithm',
      alg3: 'Add 3-digit numbers',
      alg4: 'Add 4-digit numbers',
      left: 'The sum on the left',
      big: 'Sums past 9,999',
      across: 'Line up different sizes',
      error: 'Check someone\'s parts',
      another: 'Another way',
      fewer: '"Fewer than" problems',
      packs: 'How many packs',
      useful: 'Useful information',
      twostep: 'Two-step problems',
      both: 'Both strategies work',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Adding Practice', blurb: 'All 15 practice questions: the algorithm, partial sums, big sums, checking strategies, and word problems.', ids: bank.map((q) => q.id) }],
    tests: {
      adding: { id: 'adding', title: 'Adding Test', questions: 14, blurb: 'Add multi-digit numbers with the algorithm and partial sums, check strategies, and solve problems.', generate: addingTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _partialsOf: partialsOf
  };
})(typeof window !== 'undefined' ? window : globalThis);
