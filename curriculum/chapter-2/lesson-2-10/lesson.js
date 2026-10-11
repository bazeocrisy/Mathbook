/*
 * Mathbook — Chapter 2, Lesson 2-10: Fluently Add within 1,000
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-10.md (with the batch-C review fixes C-5, C-7, C-8, C-13, C-15).
 * Book methods (p. 72): partial sums (in a row and in a column) and adjusting addends; choose a strategy; use only the
 * useful numbers in a story. The spec's "keep-the-sum pair" is the shared chain preset 'adjust' (DESIGN §2: any
 * adjustment that keeps the sum is accepted; swaps and no change are not). Column items show the F7 stack figure.
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-10.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const UNIT = [100, 10, 1];
  const split = (n) => UNIT.map((u) => Math.floor(n / u) % 10 * u);
  const plus = (list) => list.map(fmt).join(' + ');
  /** [hundreds, tens, ones] partial sums of a + b. */
  const partials = (a, b) => [0, 1, 2].map((k) => split(a)[k] + split(b)[k]);
  /** "500 + 200 = 700, 30 + 50 = 80, 6 + 1 = 7. 700 + 80 + 7 = 787." */
  function partialText(a, b) {
    const P = partials(a, b);
    return [0, 1, 2].map((k) => `${plus([split(a)[k], split(b)[k]])} = ${fmt(P[k])}`).join(', ') + `. ${plus(P)} = ${fmt(a + b)}.`;
  }
  /** The friendly adjustment for a + b: make b the next ten (or hundred when it ends in 98/99). */
  function friendly(a, b) {
    const k = b % 100 >= 98 ? 100 - (b % 100) : b % 10 ? 10 - (b % 10) : 0;
    return { k, na: a - k, nb: b + k };
  }

  /** True when a number the child must type is printed in the question's own text (not a figure). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num' && !p.fromStory) nums.push(p.answer); });
    if (q.type === 'chain') nums.push(q.a + q.b);
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);
  const stackFig = (a, b, extra) => Object.assign({ fig: 'stack', rows: [a, b], op: '+' }, extra || {});

  /** Partial sums: hundreds, tens, ones, sum (column: the problem as a stack). o: { id, a, b, column?, prompt?, hint? } */
  function partialQ(o) {
    const { a, b } = o, P = partials(a, b);
    return {
      id: o.id, type: 'parts', skill: o.skill || 'partial',
      prompt: o.prompt || `Add ${plus([a, b])} with partial sums${o.column ? ' in a column' : ''}.`,
      figure: o.column ? stackFig(a, b) : undefined,
      parts: [
        { kind: 'num', label: 'Hundreds:', answer: P[0] },
        { kind: 'num', label: 'Tens:', answer: P[1] },
        { kind: 'num', label: 'Ones:', answer: P[2] },
        { kind: 'num', label: 'Sum:', answer: a + b }
      ],
      hint: o.hint || 'Add the hundreds first. Then the tens. Then the ones. Then add those three answers.',
      explanation: partialText(a, b)
    };
  }
  /** Find the sum (sum on either side). o: { id, a, b, left?, skill?, prompt?, label?, hint? } */
  function sumQ(o) {
    const { a, b } = o;
    const s = friendly(a, b);
    const adjust = s.k > 0 && s.k <= 3 && a - s.k >= 1 ? ` Or adjust: ${plus([s.na, s.nb])} = ${fmt(a + b)}.` : '';
    return {
      id: o.id, type: 'parts', skill: o.skill || 'add',
      prompt: o.prompt || (o.left ? `___ = ${plus([a, b])}` : `${plus([a, b])} = ___`),
      parts: [{ kind: 'num', label: o.label || 'The blank is', answer: a + b }],
      hint: o.hint || 'Use partial sums, or adjust if a number is close to a ten or hundred.',
      explanation: (o.lead ? o.lead + ' ' : '') + `Partial sums: ${partialText(a, b)}${adjust}`
    };
  }
  /** Make b a whole ten or hundred, then add (shared adjust control: any adjustment that keeps the sum). */
  function adjustQ(o) {
    // first: the first addend is the one to round (299 + 456 → 300 + 455); otherwise the second.
    const { a, b } = o;
    const [x, y] = o.first ? [b, a] : [a, b]; // y is rounded, x gives the amount
    const s = friendly(x, y);
    const pair = o.first ? [s.nb, s.na] : [s.na, s.nb];
    return {
      id: o.id, type: 'chain', preset: 'adjust', a, b, op: '+', skill: 'adjust', show: pair,
      prompt: o.prompt || `Make ${fmt(y)} a whole ${s.nb % 100 === 0 ? 'hundred' : 'ten'}. Then add ${plus([a, b])}.`,
      labels: [`${fmt(a)} becomes`, `${fmt(b)} becomes`, 'Sum'],
      hint: o.hint || `How much does ${fmt(y)} need to reach ${fmt(s.nb)}? Take that much from ${fmt(x)}.`,
      explanation: `${fmt(y)} + ${s.k} = ${fmt(s.nb)}, so take ${s.k} from ${fmt(x)}: ${plus(pair)} = ${fmt(a + b)}. Take from one addend, give to the other: the sum stays the same.`
    };
  }
  /** Changed one addend by k, then fixed the sum (book #5). o: { id, who, pron, a, b, k, fixUp: subtract (valid) or add (invalid), seed? } */
  function fixQ(o) {
    const { a, b, k } = o;
    const shown = a + k + b;
    const valid = !o.addBack;
    const right = valid ? `Yes. ${o.pron} added ${k} extra, so ${o.pron.toLowerCase()} takes ${k} away.` : `No. ${o.pron} added ${k} extra, so ${o.pron.toLowerCase()} must take ${k} away.`;
    const wrong = valid ? [`No. ${o.pron} should add ${k} again.`, 'No. You can never change an addend.'] : [`Yes. Add ${k} again.`, 'Yes. Any change works.'];
    return {
      id: o.id, type: 'parts', skill: 'strategy',
      prompt: `${o.who} adds ${plus([a, b])}. ${o.pron} adds ${k} to ${fmt(a)}: ${plus([a + k, b])} = ${fmt(shown)}. Then ${o.pron.toLowerCase()} ${valid ? 'subtracts' : 'adds'} ${k} ${valid ? 'from' : 'to'} the sum. Do you agree?`,
      parts: [
        { kind: 'choice', label: 'Do you agree?', answer: right, choices: order(o, [right].concat(wrong)) },
        { kind: 'num', label: 'The correct sum:', answer: a + b }
      ],
      hint: o.hint || `Did ${o.pron.toLowerCase()} add extra? Then what must ${o.pron.toLowerCase()} do to the sum?`,
      explanation: `${o.pron} added ${k} extra, so the sum ${fmt(shown)} is ${k} too many: ${fmt(shown)} − ${k} = ${fmt(a + b)}. Check: ${partialText(a, b)}`
    };
  }
  /** Can either strategy be used? (Work Together) o: { id, a, b, names: [x, y], seed? } */
  function bothQ(o) {
    const { a, b } = o, s = friendly(a, b);
    const right = 'Yes. Both strategies work and give the same sum.';
    return {
      id: o.id, type: 'parts', skill: 'strategy',
      prompt: `${o.names[0]} adjusts addends and ${o.names[1]} uses partial sums to find ${plus([a, b])}. Can either strategy be used?`,
      parts: [
        { kind: 'choice', label: 'Can either strategy be used?', answer: right, choices: order(o, [right, 'Only partial sums works.', 'Only adjusting works.', 'No. They will get different sums.']) },
        { kind: 'num', label: 'The sum:', answer: a + b }
      ],
      hint: o.hint || 'Try both!',
      explanation: `Partial sums: ${partialText(a, b)} Adjust: ${plus([s.na, s.nb])} = ${fmt(a + b)}. Same sum.`
    };
  }
  /** Which show the same sum? (book #6) o: { id, a, b, right2, wrong2, seed? } */
  function sameQ(o) {
    const { a, b } = o;
    const expand = plus([split(a)[0], split(b)[0], split(a)[1], split(b)[1], split(a)[2], split(b)[2]]);
    const right = [expand, plus(o.right2)];
    const wrong = o.wrong.map((w) => (typeof w === 'string' ? w : plus(w)));
    return {
      id: o.id, type: 'parts', skill: 'strategy', prompt: `Which show the same sum as ${plus([a, b])}? Choose all. Then find the sum.`,
      parts: [
        { kind: 'multi', label: 'Same sum (choose all):', answer: right, choices: order(o, right.concat(wrong)) },
        { kind: 'num', label: 'The sum:', answer: a + b }
      ],
      hint: o.hint || 'Partial sums or adjusting keep the sum the same.',
      explanation: `${expand} = ${fmt(a + b)} (partial sums). ${plus(o.right2)} = ${fmt(o.right2[0] + o.right2[1])} (adjusted). ` +
        o.wrong.map((w) => (typeof w === 'string' ? `${w} adds only the digits, not their values.` : `${plus(w)} = ${fmt(w[0] + w[1])}.`)).join(' ')
    };
  }
  /** Packs: keep adding until you have enough. o: { id, need, pack, item, who, seed? } */
  function packsQ(o) {
    const { need, pack } = o;
    const n = Math.ceil(need / pack);
    return {
      id: o.id, type: 'parts', skill: 'apply',
      prompt: `${o.who} needs ${fmt(need)} ${o.item}. ${cap(o.item)} come in ${o.unit} of ${fmt(pack)}. How many ${o.unit} should ${o.pron} buy?`,
      parts: [
        { kind: 'num', label: `${n - 1} ${o.unit} =`, answer: pack * (n - 1) },
        { kind: 'num', label: `${n} ${o.unit} =`, answer: pack * n },
        { kind: 'num', label: `${cap(o.unit)} to buy:`, answer: n, fromStory: true }
      ],
      hint: o.hint || `Keep adding ${fmt(pack)} until you have at least ${fmt(need)}.`,
      explanation: `${Array.from({ length: n - 1 }, () => fmt(pack)).join(' + ')} = ${fmt(pack * (n - 1))}, not enough. ${Array.from({ length: n }, () => fmt(pack)).join(' + ')} = ${fmt(pack * n)}, at least ${fmt(need)}. So ${n} ${o.unit}.`
    };
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** Story with one number not needed. o: { id, story, a, b, extra, label, seed? } */
  function usefulQ(o) {
    return {
      id: o.id, type: 'parts', skill: 'apply', prompt: o.story,
      parts: [
        { kind: 'choice', label: 'Which number do you NOT need?', answer: fmt(o.extra), choices: order(o, [fmt(o.extra), fmt(o.a), fmt(o.b)]), compact: true },
        { kind: 'num', label: o.label, answer: o.a + o.b }
      ],
      hint: o.hint || 'What does the question ask? Find the numbers that answer it.',
      explanation: `The question asks about ${o.about}, so add ${plus([o.a, o.b])} = ${fmt(o.a + o.b)}. ${fmt(o.extra)} is extra information.`
    };
  }
  /** Two additions in a row (book #12). o: { id, story, a, b, c, l1, l2 } */
  function twoQ(o) {
    const { a, b, c } = o;
    return {
      id: o.id, type: 'parts', skill: 'apply', prompt: o.story,
      parts: [{ kind: 'num', label: o.l1, answer: a + b }, { kind: 'num', label: o.l2, answer: a + b + c }],
      hint: o.hint || 'Two steps: add, then add again.',
      explanation: `${plus([a, b])} = ${fmt(a + b)}. Then ${plus([a + b, c])} = ${fmt(a + b + c)}.`
    };
  }

  // ---------- Learn: five steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const lines = (list) => fig({ fig: 'eqs', lines: list });
  // Example numbers (spec §5); Your Turn never repeats them.
  const DEMO = [634, 259, 893, 356, 218, 574, 336, 457, 410, 722, 169, 891, 121, 246, 110];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };
  const dig = (r, lo, hi) => pv.randInt(r, lo, hi);
  /** a, b from digits [h, t, o] each. */
  const num = (h, t, o) => 100 * h + 10 * t + o;

  function rowCheck(r) {
    for (;;) {
      const h1 = dig(r, 1, 7), h2 = dig(r, 1, 8 - h1), t1 = dig(r, 1, 8), t2 = dig(r, 1, 9 - t1), o1 = dig(r, 1, 9), o2 = dig(r, 10 - o1, 9);
      if (h2 > 7 || t2 < 1) continue;
      const a = num(h1, t1, o1), b = num(h2, t2, o2);
      if (!ok(a, b, a + b)) continue;
      return partialQ({ id: 'learn-1', a, b });
    }
  }
  function columnCheck(r) {
    for (;;) {
      const h1 = dig(r, 1, 7), h2 = dig(r, 1, 8 - h1), t1 = dig(r, 1, 9), t2 = dig(r, 10 - t1, 9), o1 = dig(r, 1, 9), o2 = dig(r, 1, 9);
      if (h2 > 7) continue;
      const a = num(h1, t1, o1), b = num(h2, t2, o2);
      if (a + b > 999 || !ok(a, b, a + b)) continue;
      return partialQ({ id: 'learn-2', a, b, column: true, hint: 'The tens can make more than 100. 60 + 70 = 130.' });
    }
  }
  function adjustCheck(r) {
    for (;;) {
      const b = pv.randInt(r, 101, 899), a = pv.randInt(r, 101, 899);
      const s = friendly(a, b);
      const fine = (b % 10 >= 7) || b % 100 >= 98;
      if (!fine || a % 10 < s.k || a + b > 999 || !ok(a, b, a + b)) continue;
      return adjustQ({ id: 'learn-3', a, b });
    }
  }
  const NAMES = [['Kim', 'She'], ['Ben', 'He'], ['Ava', 'She'], ['Dev', 'He'], ['Nia', 'She'], ['Omar', 'He']];
  function strategyCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 101, 899), b = pv.randInt(r, 101, 899);
      if (a % 10 < 7) continue;
      const k = 10 - (a % 10);
      if (a + b + 2 * k > 999 || !ok(a, b, a + b)) continue;
      const [who, pron] = pv.pick(r, NAMES);
      return fixQ({ id: 'learn-4', who, pron, a, b, k, addBack: r() < 0.5, r });
    }
  }
  function usefulCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 120, 600), b = pv.randInt(r, 120, 600), c = 50 * pv.randInt(r, 2, 9);
      if (a === b || a + b > 999 || c === a || c === b || !ok(a, b, a + b)) continue;
      return usefulQ({ id: 'learn-5', a, b, extra: c, r, about: 'visitors', label: 'Visitors in all:',
        story: `A zoo had ${fmt(a)} visitors on Saturday and ${fmt(b)} visitors on Sunday. The zoo has ${fmt(c)} parking spaces. How many visitors came in all?` });
    }
  }

  const steps = [
    {
      id: 'row', kind: 'slides', title: 'Partial sums in a row',
      explain: 'Break each addend into hundreds, tens and ones. Add each place. Then add the partial sums.',
      slides: [
        say('<b>634 + 259</b>. Break each number into hundreds, tens, and ones.'),
        lines([{ text: '600 + 200 = 800', tag: 'Hundreds', hi: true }]),
        lines(['600 + 200 = 800', { text: '30 + 50 = 80', tag: 'Tens', hi: true }, { text: '4 + 9 = 13', tag: 'Ones', hi: true }]) + say('13 is one ten and three ones. Keep both!'),
        lines(['600 + 200 = 800', '30 + 50 = 80', '4 + 9 = 13', { text: '800 + 80 + 13 = 893', hi: true }]) + say('Add the partial sums: <b>893</b>. Every hundred, ten and one is counted once.')
      ],
      check: noLeak(rowCheck)
    },
    {
      id: 'column', kind: 'slides', title: 'Partial sums in a column',
      explain: 'Write the same partial sums in a column, then add them.',
      slides: [
        fig(stackFig(634, 259)),
        fig(stackFig(634, 259, { partials: true, reveal: 3 })) + say('The partial sums go one per row: 800, 80, 13.'),
        fig(stackFig(634, 259, { partials: true })) + say('Add them: <b>893</b>. Same numbers, written in a column.')
      ],
      check: noLeak(columnCheck)
    },
    {
      id: 'adjust', kind: 'slides', title: 'Adjust addends',
      explain: 'Take some from one addend and give it to the other to make a ten or a hundred. The sum stays the same.',
      slides: [
        say('<b>634 + 259</b>. 259 is 1 away from 260.'),
        fig({ fig: 'arrows', a: 634, b: 259, op: '+', to: [633, 260], result: 893, tags: ['−1', '+1'] }) + say('Take 1 from one addend and give it to the other. <b>633 + 260 = 893</b>. The sum stays the same.'),
        fig({ fig: 'arrows', a: 356, b: 218, op: '+', to: [354, 220], result: 574, tags: ['−2', '+2'] }) + say('356 + 218 → 354 + 220 = <b>574</b>.')
      ],
      check: noLeak(adjustCheck)
    },
    {
      id: 'strategy', kind: 'slides', title: 'Does this strategy work?',
      explain: 'Any strategy that keeps the sum the same works. If you add extra to one addend, take it back from the sum.',
      slides: [
        say('Ana adjusts 356 + 218: 354 + 220 = 574. Dan uses partial sums: 500 + 60 + 14 = 574.') + say('<b>Both strategies work.</b> They give the same sum.'),
        say('Kofi does <b>336 + 457</b>. She adds 4 to 336: 340 + 457 = 797. Then she takes 4 away from the sum: 797 − 4 = <b>793</b>.') + say('She added 4 extra, so she takes 4 back. It works!'),
        say('If she forgot to take the 4 back, 797 would be 4 too many.')
      ],
      check: noLeak(strategyCheck)
    },
    {
      id: 'choose', kind: 'slides', title: 'Choose a strategy, use the useful numbers',
      explain: 'Find the numbers the question needs. Then pick a strategy you like.',
      slides: [
        say('A book drive collected <b>634</b> books in week 1 and <b>259</b> books in week 2. The school has <b>410</b> students. How many books were collected?') +
          say('Which numbers do we need? 634 and 259. The 410 students don\'t tell us about books, so we don\'t need it.'),
        say('634 + 259 = <b>893</b> books. Adjusting is quick when a number is close to a ten or hundred. Partial sums always work.'),
        say('A reading club had <b>121</b> members in fall and <b>246</b> in winter. In summer it had <b>110</b> more than fall and winter together.') +
          lines(['121 + 246 = 367', { text: '367 + 110 = 477', hi: true }]) + say('Two additions in a row: <b>477</b> in summer.')
      ],
      check: noLeak(usefulCheck)
    }
  ];

  // ---------- Practice Together (12), On My Own (14), Test (12) ----------
  const guided = [
    partialQ({ id: 'p1', a: 536, b: 251, hint: 'Hundreds, tens, ones.' }),
    sumQ({ id: 'p2', a: 248, b: 535, left: true, hint: 'The sum can be on the left.' }),
    partialQ({ id: 'p3', a: 467, b: 385, column: true, hint: '60 + 80 is more than 100.' }),
    adjustQ({ id: 'p4', a: 299, b: 456, first: true, hint: '299 is 1 away from 300.' }),
    bothQ({ id: 'p5', a: 538, b: 246, names: ['Rosa', 'Jay'], seed: 5 }),
    fixQ({ id: 'p6', who: 'Leo', pron: 'He', a: 526, b: 387, k: 4, seed: 6 }),
    sameQ({ id: 'p7', a: 356, b: 471, right2: [355, 472], wrong: [[357, 472], '356 − 471', '3 + 5 + 6 + 4 + 7 + 1'], seed: 7 }),
    sumQ({ id: 'p8', a: 248, b: 248, skill: 'apply', prompt: 'A school bus drives 248 miles each week. How many miles in 2 weeks?', label: 'Miles:', hint: 'Add 248 two times.', lead: 'Add 248 two times.' }),
    packsQ({ id: 'p9', who: 'Ms. Lee', pron: 'she', need: 700, pack: 250, item: 'stickers', unit: 'rolls' }),
    usefulQ({ id: 'p10', a: 274, b: 419, extra: 500, seed: 10, about: 'pumpkins', label: 'Pumpkins picked:',
      story: 'A farm picked 274 pumpkins on Friday and 419 on Saturday. The farm has 500 baskets. How many pumpkins were picked?' }),
    twoQ({ id: 'p11', a: 124, b: 213, c: 146, l1: 'Fall + spring:', l2: 'Summer:', story: 'Art club had 124 members in fall and 213 in spring. Summer camp had 146 more than fall and spring together. How many in summer camp?' }),
    { id: 'p12', type: 'explain', skill: 'reason', prompt: 'How do you choose an addition strategy? Try 398 + 245.',
      parent: 'Parent marks. Any valid explanation.',
      listenFor: ['398 is close to 400, so adjust: 400 + 243 = 643.', 'Partial sums always work: 500 + 130 + 13 = 643.'],
      explanation: 'Adjusting is quick here: 398 + 2 = 400 and 245 − 2 = 243, so 400 + 243 = 643.' }
  ];
  const parentTips = { p5: 'Tell me how each person solves it.', p7: 'Write 356 + 471 in a column on paper.', p9: 'Why not 2 rolls?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    sumQ({ id: 'o1', a: 625, b: 263 }),
    sumQ({ id: 'o2', a: 147, b: 528, left: true }),
    sumQ({ id: 'o3', a: 384, b: 409, left: true }),
    sumQ({ id: 'o4', a: 682, b: 217 }),
    fixQ({ id: 'o5', who: 'Ty', pron: 'He', a: 618, b: 285, k: 2, addBack: true, seed: 15 }),
    sameQ({ id: 'o6', a: 263, b: 518, right2: [261, 520], wrong: [[263, 520], '2 + 6 + 3 + 5 + 1 + 8'], seed: 16 }),
    sumQ({ id: 'o7', a: 342, b: 342, skill: 'apply', prompt: 'A theater has 342 seats. It is full for 2 shows. How many tickets were sold?', label: 'Tickets:', lead: 'Add 342 two times.' }),
    sumQ({ id: 'o8', a: 368, b: 257 }),
    sumQ({ id: 'o9', a: 526, b: 297 }),
    packsQ({ id: 'o10', who: 'Coach', pron: 'he', need: 500, pack: 150, item: 'cups', unit: 'packs' }),
    usefulQ({ id: 'o11', a: 356, b: 389, extra: 600, seed: 21, about: 'cans', label: 'Cans collected:',
      story: 'Pine School collected 356 cans in week 1 and 389 in week 2. The school has 600 lockers. How many cans did they collect?' }),
    twoQ({ id: 'o12', a: 215, b: 162, c: 118, l1: 'Monday + Tuesday:', l2: 'Wednesday:', story: 'A library had 215 visitors Monday and 162 Tuesday. Wednesday had 118 more than Monday and Tuesday together. How many on Wednesday?' }),
    // O13 and O14 give the test's partial-sums (T4) and adjusting (T5) skills their own practice (new numbers).
    partialQ({ id: 'o13', a: 476, b: 358, column: true }),
    adjustQ({ id: 'o14', a: 197, b: 548, first: true })
  ];

  const testItems = [
    sumQ({ id: 't1', a: 413, b: 375 }),
    sumQ({ id: 't2', a: 256, b: 619, left: true }),
    sumQ({ id: 't3', a: 476, b: 347, left: true }),
    partialQ({ id: 't4', a: 584, b: 238, column: true }),
    adjustQ({ id: 't5', a: 398, b: 267, first: true }),
    fixQ({ id: 't6', who: 'Mia', pron: 'She', a: 289, b: 437, k: 1 }),
    sameQ({ id: 't7', a: 427, b: 352, right2: [430, 349], wrong: [[427, 350], '4 + 2 + 7 + 3 + 5 + 2'] }),
    bothQ({ id: 't8', a: 365, b: 248, names: ['Ana', 'Ben'] }),
    sumQ({ id: 't9', a: 287, b: 287, skill: 'apply', prompt: 'A train carries 287 people each trip. How many people in 2 trips?', label: 'People:', lead: 'Add 287 two times.' }),
    packsQ({ id: 't10', who: 'Ms. Ray', pron: 'she', need: 800, pack: 300, item: 'beads', unit: 'bags' }),
    usefulQ({ id: 't11', a: 274, b: 538, extra: 400, about: 'tickets', label: 'Tickets in all:',
      story: 'Hill School sold 274 tickets for the first play and 538 for the second. The gym has 400 seats. How many tickets in all?' }),
    twoQ({ id: 't12', a: 134, b: 251, c: 127, l1: 'June + July:', l2: 'August:', story: 'Camp had 134 kids in June and 251 in July. August had 127 more than June and July together. How many kids in August?' })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Fluently Add Test: the same 12 questions each time; choice order changes with each attempt. */
  function addTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-10'] = {
    id: '2-10',
    storageKey: 'mathbook:v2:lesson-2-10',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-10',
    title: 'Fluently Add within 1,000',
    subtitle: 'Partial sums or adjusting: choose a strategy',
    objective: 'I can add 3-digit numbers using partial sums or by adjusting addends, and choose a strategy that works well for me.',
    parentLearn: {
      goal: [
        'Add two 3-digit numbers with partial sums, written in a row and in a column.',
        'Add by adjusting addends: take from one, give to the other, to make a ten or a hundred.',
        'Decide whether a strategy works (both methods work; adding 3 and then taking 3 from the sum works).',
        'Solve with the sum on either side (___ = 123 + 443).',
        'Word problems: use only the useful numbers, add the same number twice, buy enough packs, add twice in a row.'
      ],
      words: [
        { term: 'Addend', meaning: 'A number being added.' },
        { term: 'Sum', meaning: 'The answer to an addition problem.' },
        { term: 'Partial sums', meaning: 'Add the hundreds, the tens, and the ones separately, then add those answers.' },
        { term: 'Adjust addends', meaning: 'Take some from one addend and give it to the other so the numbers are easier. The sum stays the same.' },
        { term: 'Strategy', meaning: 'A way to solve a problem.' },
        { term: 'Efficient', meaning: 'Quick and easy for you, with few steps.' },
        { term: 'Extra information', meaning: 'A number in a story that you do not need.' }
      ],
      demoVisual: fig(stackFig(722, 169, { partials: true })),
      demonstrate: [
        'Write 634 + 259. Add 600 + 200 = 800, 30 + 50 = 80, 4 + 9 = 13, then 800 + 80 + 13 = 893. Write it again in a column.',
        'Show 633 + 260 = 893 with −1 and +1 arrows: take 1 from 634 and give it to 259.',
        'Book example: 722 + 169 = 891 (800 + 80 + 11, or 721 + 170). The 350 in the book\'s story is extra information.',
        'Kofi adds 4 to 336 (340 + 457 = 797), then takes 4 from the sum: 793.'
      ],
      ask: ['"Is one number close to a ten or hundred?"', '"Did your sum stay the same when you adjusted?"', '"Which numbers does the question need?"', '"Is that enough?"'],
      checklist: [
        'Uses partial sums in a row and in a column.',
        'Adjusts addends correctly.',
        'Decides whether a strategy is valid.',
        'Solves with the sum on the left.',
        'Ignores extra information.',
        'Solves packs and two-step problems, and scores 90% or higher on the Fluently Add Test.'
      ]
    },
    mistakes: [
      'Writing the ones partial 11 as 1 and losing the ten. Say: "11 is one ten and one one; keep both."',
      'Adjusting both addends the same way (635 + 260). Say: "Take from one, give to the other."',
      'Forgetting to undo a change made to only one addend.',
      'Using every number in a story. Ask: "What does the question ask?"',
      'Packs: stopping below the target (2 rolls = 500 < 700). Ask: "Is that enough?"',
      'A tens partial over 100 (60 + 80 = 140) written as 14. Read it as tens.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How do you decide which addition strategy to use?',
        idea: 'Look at the numbers. If one is close to a ten or hundred, adjust. Otherwise, partial sums always work. Use the one that is quick and makes sense to you.'
      }
    },
    skills: {
      partial: 'Partial sums',
      adjust: 'Adjusting addends',
      add: 'Adding 3-digit numbers',
      strategy: 'Judging strategies',
      apply: 'Word problems',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Fluently Add', blurb: 'All 14 practice questions: sums, partial sums, adjusting, judging strategies, and word problems.', ids: bank.map((q) => q.id) }],
    tests: {
      add: { id: 'add', title: 'Fluently Add Test', questions: 12, blurb: 'Adding 3-digit numbers, partial sums, adjusting, strategies, and word problems.', generate: addTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO
  };
})(typeof window !== 'undefined' ? window : globalThis);
