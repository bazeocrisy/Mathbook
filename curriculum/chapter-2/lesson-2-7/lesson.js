/*
 * Mathbook — Chapter 2, Lesson 2-7: Decompose to Subtract
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-7.md (with the batch-B review fixes B-01, B-02, B-08, B-09, B-24).
 * The spec's M-DTREE model is the shared chain control (DESIGN §2): tree-only = preset 'trees'; subtract = preset
 * 'steps' (tree given or the child's own; `ways: 2` for "subtract two ways"). Empty or 0 tree parts are left out
 * (B-01). A "decompose + why" item (O3, O4, T2) is two connected questions: subtract with your own tree, then a
 * choice about a named tree (B-02: never graded against the child's tree).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-7.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const UNIT = [100, 10, 1];
  /** 175 → [100, 70, 5] (place values that are not 0). */
  const placeParts = (n) => UNIT.map((u) => Math.floor(n / u) % 10 * u).filter(Boolean);
  const plus = (list) => list.map(fmt).join(' + ');
  const minus = (a, b) => `${fmt(a)} − ${fmt(b)}`;
  /** The steps for a − parts…: ["362 − 100 = 262", …]. */
  function stepLines(a, parts) {
    let cur = a;
    return parts.map((p) => { const t = `${minus(cur, p)} = ${fmt(cur - p)}`; cur -= p; return t; });
  }
  const stepsText = (a, parts) => stepLines(a, parts).join(', ');

  /** True when a number the child must type is printed in the question's own text (not a figure or table). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    if (q.type === 'chain' && q.preset === 'steps') nums.push(q.a - q.b);
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** Break n apart in 2 different ways (two trees). */
  function treesQ(o) {
    const pp = placeParts(o.n);
    return {
      id: o.id, type: 'chain', preset: 'trees', n: o.n, skill: 'decompose',
      prompt: o.prompt || `Break ${fmt(o.n)} apart in 2 different ways.`,
      hint: o.hint || 'Try place value first. Then try a different way.',
      explanation: `The parts must add back to ${fmt(o.n)}. By place value: ${fmt(o.n)} = ${plus(pp)}. Another way: ${fmt(o.n)} = ${plus([o.n - 10, 10])}.`
    };
  }
  /** Subtract a − b by breaking b apart: the tree given by place value (given: true) or the child's own. */
  function stepsQ(o) {
    const { a, b } = o;
    const pp = placeParts(b);
    const q = {
      id: o.id, type: 'chain', preset: 'steps', a, b, skill: o.skill || 'regroup',
      prompt: o.prompt || (o.given ? `Find ${minus(a, b)}. ${fmt(b)} is broken apart by place value. Take away one part at a time.` : `Find ${minus(a, b)}. Break ${fmt(b)} apart, then take away one part at a time.`),
      hint: o.hint || (o.given ? 'Take away the hundreds first, then the tens, then the ones.' : 'Place value always works. Can a part make a hundred?'),
      explanation: o.explanation || `${o.lead ? o.lead + ' ' : ''}${fmt(b)} = ${plus(pp)}: ${stepsText(a, pp)}. So ${minus(a, b)} = ${fmt(a - b)}.` +
        (o.given ? '' : ' Any parts that add to ' + fmt(b) + ' work.')
    };
    if (o.given) q.tree = { given: pp };
    if (o.final) q.final = { label: o.final };
    if (o.ways) q.ways = o.ways;
    if (o.figure) q.figure = o.figure;
    return q;
  }
  /** "Ana breaks 101 into 100 and 10" (parts that don't add back). o: { id, who, pron, a, b, wrongParts, rightParts, wrong: [...], seed?, r? } */
  function partsMistakeQ(o) {
    const { a, b } = o;
    const [p, q2] = o.wrongParts;
    const right = `${plus([p, q2])} = ${fmt(p + q2)}, not ${fmt(b)}. ${o.pron} should use ${fmt(o.rightParts[0])} and ${fmt(o.rightParts[1])}.`;
    return {
      id: o.id, type: 'parts', skill: 'error',
      prompt: o.prompt,
      parts: [
        { kind: 'choice', label: 'What is wrong?', answer: o.rightText || right, choices: order(o, [o.rightText || right].concat(o.wrong)) },
        { kind: 'num', label: 'The correct difference:', answer: a - b }
      ],
      hint: o.hint || 'Add the parts. Do they make the number?',
      explanation: `${plus([p, q2])} = ${fmt(p + q2)}, not ${fmt(b)}, so the parts are wrong. ${fmt(b)} = ${plus(o.rightParts)}: ${stepsText(a, o.rightParts)}.`
    };
  }
  /** Take away the parts in another order. o: { id, who, a, b, parts (in their order), right, wrong, seed? } */
  function orderQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'parts', skill: 'order',
      prompt: `${o.who} subtracts ${minus(a, b)} by taking away ${o.parts.slice(0, -1).map(fmt).join(', then ')}, then ${fmt(o.parts[o.parts.length - 1])}. ${o.ask || 'Does that work? What is the difference?'}`,
      parts: [
        { kind: 'choice', label: o.label || 'Does it work?', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) },
        { kind: 'num', label: 'The difference:', answer: a - b }
      ],
      hint: o.hint || `Do the parts still add to ${fmt(b)}?`,
      explanation: `${plus(o.parts)} = ${fmt(b)}, so ${o.who} still takes away ${fmt(b)} in all. ${stepsText(a, o.parts)}. Any order gives ${fmt(a - b)}.`
    };
  }
  /** Greatest minus least from a table. o: { id, title, unit, rows: [[day, n] …] } */
  function tableQ(o) {
    const nums = o.rows.map((r) => r[1]);
    const hi = Math.max(...nums), lo = Math.min(...nums);
    return {
      id: o.id, type: 'parts', skill: 'table',
      prompt: o.prompt || `The table shows ${o.what}. What is the difference between the greatest and the least number?`,
      figure: { fig: 'table', title: o.title, head: ['Day', o.unit], rows: o.rows },
      parts: [
        { kind: 'num', label: 'Greatest:', answer: hi },
        { kind: 'num', label: 'Least:', answer: lo },
        { kind: 'num', label: 'Difference:', answer: hi - lo }
      ],
      hint: o.hint || 'Find the biggest and the smallest numbers first.',
      explanation: `Greatest: ${fmt(hi)}. Least: ${fmt(lo)}. ${minus(hi, lo)}: ${stepsText(hi, placeParts(lo))}. The difference is ${fmt(hi - lo)}.`
    };
  }
  /** One choice question. o: { id, skill, prompt, right, wrong, figure?, label?, explanation, hint?, seed?, r? } */
  function choiceQ(o) {
    return {
      id: o.id, type: 'parts', skill: o.skill, prompt: o.prompt, figure: o.figure,
      parts: [{ kind: 'choice', label: o.label || 'Choose the best answer.', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) }],
      hint: o.hint, explanation: o.explanation
    };
  }
  // B-02: the "why" question names one tree and is graded on its own.
  const PV_REASON = 'Each part is a hundreds, tens or ones part, and each one is easy to take away.';
  const LAND_REASON = (n) => `Taking away ${fmt(n)} first lands on a hundred, a friendly number.`;

  // ---------- Learn: six steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const tree = (n, parts, extra) => fig(Object.assign({ fig: 'tree', n, parts }, extra || {}));
  const lines = (list, extra) => fig(Object.assign({ fig: 'eqs', lines: list }, extra || {}));
  /** Be Curious (p. 59): the same hexagon made of different pieces. */
  function hexagons() {
    const hex = '5,26 20,0 50,0 65,26 50,52 20,52';
    const shape = (cuts, fill) => `<svg viewBox="0 0 70 56" width="120" height="96" aria-hidden="true"><polygon points="${hex}" fill="${fill}" stroke="var(--heading)" stroke-width="2"/>` +
      cuts.map((c) => `<line x1="${c[0]}" y1="${c[1]}" x2="${c[2]}" y2="${c[3]}" stroke="var(--heading)" stroke-width="2"/>`).join('') + '</svg>';
    const six = shape([[5, 26, 65, 26], [20, 0, 50, 52], [50, 0, 20, 52]], 'var(--star)');
    const two = shape([[5, 26, 65, 26]], 'var(--primary-soft, #e4defd)');
    return `<div class="slide-pair" style="justify-items:center">${six}${two}</div>`;
  }

  // Numbers used in the Learn examples and the book; Your Turn never repeats them.
  const DEMO = [[362, 175], [458, 102], [538, 215], [276, 139], [353, 184], [572, 378], [345, 101], [438, 342], [239, 126]];
  const DEMO_N = [175, 184];
  const isDemo = (a, b) => DEMO.some(([x, y]) => x === a && y === b);
  /** A "DS pair" (spec §5): a 300–999, b 101 to a − 100, b's tens and ones not 0, some place needs regrouping, not a demo pair. */
  function dsPair(r) {
    for (;;) {
      const a = pv.randInt(r, 300, 999);
      const b = pv.randInt(r, 101, a - 100);
      if (b % 10 === 0 || Math.floor(b / 10) % 10 === 0 || isDemo(a, b) || a - b === b) continue;
      if (b % 10 <= a % 10 && Math.floor(b / 10) % 10 <= Math.floor(a / 10) % 10) continue;
      return [a, b];
    }
  }
  const NAMES = ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa'];

  function treesCheck(r) {
    let n;
    do { n = pv.randInt(r, 101, 999); } while (n % 10 === 0 || Math.floor(n / 10) % 10 === 0 || DEMO_N.includes(n));
    return treesQ({ id: 'learn-1', n });
  }
  const pvCheck = (r) => { const [a, b] = dsPair(r); return stepsQ({ id: 'learn-2', a, b, given: true, skill: 'placevalue' }); };
  const ownCheck = (r) => { const [a, b] = dsPair(r); return stepsQ({ id: 'learn-3', a, b, skill: 'friendly', hint: 'Can you pick a first part that makes a hundred? Place value works too.' }); };
  // Step 4: two named trees for the same number; the same difference, any order.
  const SAME_RIGHT = 'All the parts together still make the same number, so I take away the same amount.';
  const SAME_WRONG = ['Because the hundreds part is always the same.', 'It isn\'t always the same.', 'Because I took away the ones first.'];
  const ORDER_RIGHT = 'Yes. You still take away the whole number.';
  const ORDER_WRONG = ['No. Always take away the hundreds first.', 'No. The order changes the answer.'];
  function sameCheck(r) {
    for (;;) {
      const [a, b] = dsPair(r);
      const pp = placeParts(b);
      const first = a % 100;
      if (first < 1 || first >= b || b - first < 2) continue;
      const other = [first].concat(placeParts(b - first));
      if (other.length < 2 || other.slice().sort().join() === pp.slice().sort().join()) continue;
      const [w1, w2] = pv.shuffle(r, NAMES).slice(0, 2);
      return {
        id: 'learn-4', type: 'parts', skill: 'twoways',
        prompt: `${w1} and ${w2} both find ${minus(a, b)}. They break ${fmt(b)} apart in different ways.`,
        figure: [{ fig: 'tree', n: b, parts: pp, caption: `${w1}’s parts` }, { fig: 'tree', n: b, parts: other, alt: true, caption: `${w2}’s parts` }],
        parts: [
          { kind: 'choice', label: 'Why do they get the same difference?', answer: SAME_RIGHT, choices: pv.shuffle(r, [SAME_RIGHT].concat(SAME_WRONG)) },
          { kind: 'choice', label: 'Can you take away the parts in any order?', answer: ORDER_RIGHT, choices: pv.shuffle(r, [ORDER_RIGHT].concat(ORDER_WRONG)) },
          { kind: 'num', label: `${minus(a, b)} =`, answer: a - b }
        ],
        hint: 'Add each set of parts. What do they make?',
        explanation: `Both sets of parts add to ${fmt(b)}. ${w1}: ${stepsText(a, pp)}. ${w2}: ${stepsText(a, other)}. Same difference, ${fmt(a - b)}.`
      };
    }
  }
  // Step 5 (B-09): a 200–999; b = 100 + d; the parts given are 100 and 10 × d.
  function partsCheck(r) {
    let a;
    do { a = pv.randInt(r, 200, 999); } while (DEMO.some(([x]) => x === a));
    let d, b;
    do { d = pv.randInt(r, 1, 9); b = 100 + d; } while ([b, 100, 10 * d, 100 + 10 * d].includes(a - b));
    const who = pv.pick(r, NAMES);
    return partsMistakeQ({ id: 'learn-5', a, b, pron: 'They', wrongParts: [100, 10 * d], rightParts: [100, d], r,
      prompt: `${who} subtracts ${minus(a, b)}. ${who} breaks ${fmt(b)} into 100 and ${fmt(10 * d)}. What is the mistake? What is the difference?`,
      rightText: `100 + ${fmt(10 * d)} = ${fmt(100 + 10 * d)}, not ${fmt(b)}. The parts must add to ${fmt(b)}.`,
      wrong: [`You can't break apart ${fmt(b)}.`, `${who} should take away the 100 last.`, 'Nothing. The parts are right.'] });
  }
  // Step 6: a table of 4 days (all different 3-digit numbers, greatest − least 40 to 300).
  const TABLES = [['Book Fair Visitors', 'Visitors'], ['Lemonade Cups Sold', 'Cups'], ['Library Books Borrowed', 'Books'], ['Zoo Tickets Sold', 'Tickets']];
  function tableCheck(r) {
    for (;;) {
      const nums = [0, 1, 2, 3].map(() => pv.randInt(r, 100, 450));
      const d = Math.max(...nums) - Math.min(...nums);
      if (new Set(nums).size < 4 || d < 40 || d > 300) continue;
      const [title, unit] = pv.pick(r, TABLES);
      return tableQ({ id: 'learn-6', title, unit, what: `the ${unit.toLowerCase()} each day`, rows: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'].map((day, k) => [day, nums[k]]) });
    }
  }

  const steps = [
    {
      id: 'break-apart', kind: 'slides', title: 'Break a number apart',
      explain: 'Decompose a number in different ways. The parts must always add back to the number.',
      slides: [
        hexagons() + say('The same hexagon, made of different pieces. <b>Same shape, different parts.</b> Numbers work that way too.'),
        tree(175, [100, 70, 5]) + say('By place value: <b>175 → 100, 70, 5</b>.'),
        tree(175, [162, 10, 3], { alt: true }) + say('Another way: <b>175 → 162, 10, 3</b>. Check: 162 + 10 + 3 = 175.'),
        tree(175, [150, 25]) + say('Two parts are fine too: <b>150 + 25</b>. The parts must always add back to 175.')
      ],
      check: treesCheck
    },
    {
      id: 'place-value', kind: 'slides', title: 'Take away one part at a time',
      explain: 'Break apart the number you take away. Take away its parts one at a time. Each step starts from the last answer.',
      slides: [
        say('Find <b>362 − 175</b>. Break apart 175 by place value.') + tree(175, [100, 70, 5]),
        say('Take away the hundreds:') + lines([{ text: '362 − 100 = 262', hi: true }]),
        say('Then the tens. Start from <b>262</b>:') + lines(['362 − 100 = 262', { text: '262 − 70 = 192', hi: true }]),
        say('Then the ones:') + lines(['362 − 100 = 262', '262 − 70 = 192', { text: '192 − 5 = 187', hi: true }]) + say('So <b>362 − 175 = 187</b>.')
      ],
      check: pvCheck
    },
    {
      id: 'friendly', kind: 'slides', title: 'Land on a friendly number',
      explain: 'Choose a first part that takes you to a hundred or a ten. Then take away the rest.',
      slides: [
        say('362 − 175 again. This time break 175 into <b>162, 10, 3</b>. Why 162? Because 362 − 162 is easy!') + tree(175, [162, 10, 3], { alt: true }),
        lines(['362 − 162 = 200', '200 − 10 = 190', { text: '190 − 3 = 187', hi: true }]) + say('200 is a <b>friendly number</b>.'),
        say('Same difference: <b>187</b>. All the parts together still make 175, so you take away the same amount.')
      ],
      check: ownCheck
    },
    {
      id: 'same', kind: 'slides', title: 'Same difference, any order',
      explain: 'Different parts or a different order: you still take away the whole number, so the difference is the same.',
      slides: [
        say('Why is the difference the same when 175 is broken apart differently? <b>All the parts together still make 175.</b>') +
          `<div class="slide-pair">${tree(175, [100, 70, 5])}${tree(175, [162, 10, 3], { alt: true })}</div>`,
        say('<b>538 − 215</b> in two orders:') + `<div class="slide-pair">${lines(['538 − 5 = 533', '533 − 200 = 333', { text: '333 − 10 = 323', hi: true }])}${lines(['538 − 200 = 338', '338 − 10 = 328', { text: '328 − 5 = 323', hi: true }])}</div>` +
          say('Any order works, because you still take away 215 in all.')
      ],
      check: sameCheck
    },
    {
      id: 'check-parts', kind: 'slides', title: 'Check your parts',
      explain: 'Before you subtract, add your parts. They must make the number you take away.',
      slides: [
        say('Eli subtracts <b>458 − 102</b>. He breaks 102 into 100 and 20.') + tree(102, [100, 20], { check: false }),
        say('Check: 100 + 20 = <b>120</b>, not 102! The parts are wrong.'),
        say('Use <b>100 and 2</b>:') + lines(['458 − 100 = 358', { text: '358 − 2 = 356', hi: true }]) + say('So 458 − 102 = <b>356</b>.')
      ],
      check: partsCheck
    },
    {
      id: 'stories', kind: 'slides', title: 'Tables and stories',
      explain: 'Find the numbers to subtract first: the greatest and the least, or the whole and the part you know.',
      slides: [
        fig({ fig: 'table', title: 'Book Fair Visitors', head: ['Day', 'Visitors'], rows: [['Monday', 126], ['Tuesday', 184], ['Wednesday', 239], ['Thursday', 207]] }) +
          say('Greatest: <b>239</b>. Least: <b>126</b>. 239 − 126: break 126 into 100, 20, 6.') + lines(stepLines(239, [100, 20, 6])),
        say('276 marbles. 139 are green. The rest are red. How many are red? <b>276 − 139</b>.') + tree(139, [76, 60, 3], { alt: true }) +
          lines(stepLines(276, [76, 60, 3])) + say('<b>137</b> red marbles. (76 + 60 + 3 = 139)')
      ],
      check: tableCheck
    }
  ];

  // ---------- Practice Together (9), On My Own (14), Test (13) ----------
  const ORDER_YES = (b) => `Yes. The parts still add to ${fmt(b)}, so the order doesn't matter.`;
  const guided = [
    treesQ({ id: 'pt1', n: 258, hint: 'Place value is one way.' }),
    stepsQ({ id: 'pt2', a: 462, b: 235, given: true, skill: 'placevalue', hint: 'Hundreds, then tens, then ones.' }),
    stepsQ({ id: 'pt3', a: 541, b: 263, skill: 'friendly', hint: 'What part takes 541 to 300?',
      explanation: '263 = 241 + 22: 541 − 241 = 300, 300 − 22 = 278. Or by place value: 541 − 200 = 341, 341 − 60 = 281, 281 − 3 = 278. Any parts that add to 263 work.' }),
    stepsQ({ id: 'pt4', a: 634, b: 287, ways: 2, skill: 'twoways', prompt: 'Find 634 − 287. Break 287 apart in two different ways and subtract both ways.',
      hint: 'One way by place value. One way to land on 400.',
      explanation: 'Way 1: 634 − 200 = 434, 434 − 80 = 354, 354 − 7 = 347. Way 2: 287 = 234 + 53: 634 − 234 = 400, 400 − 53 = 347. Same difference both ways.' }),
    partsMistakeQ({ id: 'pt5', a: 468, b: 202, pron: 'She', wrongParts: [200, 20], rightParts: [200, 2], seed: 5,
      prompt: 'Nia subtracts 468 − 202. She breaks 202 into 200 and 20, and gets 248. Help her: what is wrong? What is the difference?',
      wrong: ['She should take away 20 first.', 'Nothing is wrong.', 'You can\'t break apart 202.'] }),
    orderQ({ id: 'pt6', who: 'Zoe', a: 527, b: 314, parts: [4, 300, 10], seed: 6, right: ORDER_YES(314),
      wrong: ['No. You must take away the hundreds first.', 'No. You must take away the ones first.', 'Yes, but the answer will be different.'] }),
    tableQ({ id: 'pt7', title: 'Pumpkin Patch Visitors', unit: 'Visitors', what: 'the visitors each day', prompt: 'The table shows the pumpkin patch visitors. What is the difference between the most and the fewest visitors?',
      rows: [['Monday', 124], ['Tuesday', 176], ['Wednesday', 243], ['Thursday', 218]] }),
    stepsQ({ id: 'pt8', a: 286, b: 138, skill: 'word', prompt: 'There are 286 stickers. 138 are stars. The rest are hearts. How many hearts? Break apart 138 and subtract.',
      final: 'Hearts: 286 − 138 =', hint: 'Take away the stars.' }),
    { id: 'pt9', type: 'explain', skill: 'reason', prompt: 'How do you decide how to break apart the number you subtract?',
      parent: 'Accept any sensible reason.',
      listenFor: ['Place value always works.', 'A part that makes a hundred or a ten (a friendly number) can be quicker.'],
      explanation: 'Place value always works. If a part can take you to a hundred or a ten, that can be quicker.' }
  ];
  const parentTips = { pt1: 'Ask for a third way out loud.', pt3: 'Ask: why did you pick that first part?', pt4: 'Ask: why are both answers the same?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    treesQ({ id: 'o1', n: 438 }),
    treesQ({ id: 'o2', n: 765 }),
    stepsQ({ id: 'o3', a: 586, b: 241, skill: 'placevalue' }),
    choiceQ({ id: 'o3b', skill: 'friendly', seed: 31, prompt: 'Lena found 586 − 241. She broke 241 into 200, 40 and 1. Which is a good reason?',
      figure: { fig: 'tree', n: 241, parts: [200, 40, 1] }, right: PV_REASON,
      wrong: ['The parts have to add to 586.', 'You can only break a number by place value.', 'Bigger parts always give a bigger answer.'],
      hint: 'What kind of parts are 200, 40 and 1?', explanation: '200, 40 and 1 are the hundreds, tens and ones of 241: 586 − 200 = 386, 386 − 40 = 346, 346 − 1 = 345.' }),
    stepsQ({ id: 'o4', a: 728, b: 460, skill: 'friendly' }),
    choiceQ({ id: 'o4b', skill: 'friendly', seed: 41, prompt: 'Omar found 728 − 460. He broke 460 into 428 and 32. Which is a good reason?',
      figure: { fig: 'tree', n: 460, parts: [428, 32], alt: true }, right: LAND_REASON(428),
      wrong: ['460 can\'t be broken apart by place value.', 'The parts must be equal.', 'You must always take away the ones first.'],
      hint: 'What is 728 − 428?', explanation: '728 − 428 = 300, a hundred. Then 300 − 32 = 268.' }),
    stepsQ({ id: 'o5', a: 395, b: 172, skill: 'placevalue', prompt: '395 − 172 = ___. Break 172 apart and subtract.' }),
    stepsQ({ id: 'o6', a: 442, b: 215, prompt: '___ = 442 − 215. Break 215 apart and subtract.', final: 'The blank is' }),
    stepsQ({ id: 'o7', a: 603, b: 285, prompt: '603 − 285 = ___. Break 285 apart and subtract.' }),
    stepsQ({ id: 'o8', a: 831, b: 547, prompt: '831 − 547 = ___. Break 547 apart and subtract.' }),
    partsMistakeQ({ id: 'o9', a: 576, b: 103, pron: 'He', wrongParts: [100, 30], rightParts: [100, 3], seed: 9,
      prompt: 'Max subtracts 576 − 103. He breaks 103 into 100 and 30. What is wrong? What is the difference?',
      rightText: '100 + 30 = 130, not 103. Use 100 and 3.',
      wrong: ['He should take away 30 first.', 'Nothing is wrong.', '103 can only be broken into 100 and 30.'] }),
    tableQ({ id: 'o10', title: 'Bake Sale Cookies', unit: 'Cookies', what: 'the cookies sold each day', prompt: 'The table shows the cookies sold at a bake sale. What is the difference between the most and the fewest?',
      rows: [['Monday', 156], ['Tuesday', 209], ['Wednesday', 184], ['Thursday', 132]] }),
    stepsQ({ id: 'o11', a: 357, b: 168, skill: 'word', prompt: 'There are 357 balloons. 168 are red. The rest are blue. How many are blue? Break apart 168 and subtract.',
      final: 'Blue: 357 − 168 =' }),
    orderQ({ id: 'o12', who: 'Ken', a: 649, b: 425, parts: [5, 400, 20], seed: 12, ask: 'Can he? What is the difference?', label: 'Can he?', right: ORDER_YES(425),
      wrong: ['No. He must take away 400 first.', 'No. The parts are in the wrong order.', 'Yes, but he will get a different answer.'] }),
    // O13 gives the test's "two ways" skill (T7) its own practice (new numbers).
    stepsQ({ id: 'o13', a: 652, b: 278, ways: 2, skill: 'twoways', prompt: 'Find 652 − 278. Break 278 apart in two different ways and subtract both ways.',
      hint: 'One way by place value. One way to land on 600.',
      explanation: 'Way 1: 652 − 200 = 452, 452 − 70 = 382, 382 − 8 = 374. Way 2: 278 = 52 + 226: 652 − 52 = 600, 600 − 200 = 400, 400 − 26 = 374. Same difference both ways.' })
  ];

  const testItems = [
    treesQ({ id: 't1', n: 592 }),
    stepsQ({ id: 't2', a: 674, b: 352, skill: 'placevalue' }),
    choiceQ({ id: 't2b', skill: 'friendly', prompt: 'Kim found 674 − 352. She broke 352 into 300, 50 and 2. Which is a good reason?',
      figure: { fig: 'tree', n: 352, parts: [300, 50, 2] }, right: PV_REASON,
      wrong: ['The parts have to add to 674.', 'Taking away 300 first lands on a hundred.', 'You must always break a number into exactly two parts.'],
      explanation: '300, 50 and 2 are the hundreds, tens and ones of 352, and each is easy to take away: 674 − 300 = 374 (not a hundred), 374 − 50 = 324, 324 − 2 = 322.' }),
    stepsQ({ id: 't3', a: 953, b: 610, skill: 'placevalue' }),
    stepsQ({ id: 't4', a: 516, b: 238 }),
    stepsQ({ id: 't5', a: 425, b: 167, prompt: '___ = 425 − 167. Break 167 apart and subtract.', final: 'The blank is' }),
    stepsQ({ id: 't6', a: 802, b: 456 }),
    stepsQ({ id: 't7', a: 743, b: 258, ways: 2, skill: 'twoways', prompt: 'Find 743 − 258. Break 258 apart in two different ways and subtract both ways.',
      explanation: 'Way 1: 743 − 200 = 543, 543 − 50 = 493, 493 − 8 = 485. Way 2: 258 = 243 + 15: 743 − 243 = 500, 500 − 15 = 485. Same difference both ways.' }),
    partsMistakeQ({ id: 't8', a: 689, b: 104, pron: 'She', wrongParts: [100, 40], rightParts: [100, 4],
      prompt: 'Ivy subtracts 689 − 104 by breaking 104 into 100 and 40. Help her: what is wrong? What is the difference?',
      rightText: '100 + 40 = 140, not 104. Use 100 and 4.',
      wrong: ['She should take away 40 first.', 'Nothing is wrong.', '104 can\'t be broken apart.'] }),
    tableQ({ id: 't9', title: 'Library Books Borrowed', unit: 'Books', what: 'the books borrowed each day', prompt: 'The table shows library books borrowed. What is the difference between the most and the fewest?',
      rows: [['Monday', 214], ['Tuesday', 187], ['Wednesday', 302], ['Thursday', 245]] }),
    stepsQ({ id: 't10', a: 463, b: 275, skill: 'word', prompt: 'There are 463 beads. 275 are blue. The rest are yellow. How many are yellow? Break apart 275 and subtract.',
      final: 'Yellow: 463 − 275 =' }),
    orderQ({ id: 't11', who: 'Rob', a: 867, b: 532, parts: [30, 2, 500], right: ORDER_YES(532),
      wrong: ['No. He must take away 500 first.', 'No. The ones must come last.', 'Yes, but the answer will be different.'] }),
    { id: 't12', type: 'parts', skill: 'friendly',
      prompt: 'Lu wants to find 524 − 196 quickly. Which way to break 196 lands on a hundred first? Then find the difference.',
      parts: [
        { kind: 'choice', label: 'Which way lands on a hundred first?', answer: '124 + 72', choices: ['124 + 72', '100 + 90 + 6', '120 + 76', '96 + 100'] },
        { kind: 'num', label: '524 − 196 =', answer: 328 }
      ],
      explanation: '524 − 124 = 400, a hundred. Then 400 − 72 = 328. (524 − 100 = 424, 524 − 120 = 404 and 524 − 96 = 428 are not hundreds.)' }
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Decompose to Subtract Test: the same 13 items each time; choice order changes with each attempt. */
  function subtractTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-7'] = {
    id: '2-7',
    storageKey: 'mathbook:v2:lesson-2-7',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-7',
    title: 'Decompose to Subtract',
    subtitle: 'Break apart one number, then take away the parts',
    objective: 'I can break apart the number I am taking away, in more than one way, and subtract the parts one at a time to find the difference.',
    parentLearn: {
      goal: [
        'Break a 3-digit number apart in more than one way, with parts that add back to the number.',
        'Subtract by breaking apart the number being taken away and taking away its parts one at a time.',
        'Choose helpful parts: by place value, or a first part that lands on a hundred or a ten.',
        'Know the difference stays the same however the number is broken apart, and in any order.',
        'Spot parts that don\'t add back to the number.',
        'Solve table ("greatest and least") and "the rest" story problems.'
      ],
      words: [
        { term: 'Decompose', meaning: 'Break a number into parts.', example: '175 = 100 + 70 + 5' },
        { term: 'Part', meaning: 'One of the pieces you break a number into. The parts must add back to the number.' },
        { term: 'Difference', meaning: 'The answer when you subtract.' },
        { term: 'Subtract', meaning: 'Take away.' },
        { term: 'Friendly number', meaning: 'A number that is easy to work with, like 200 or 190.' },
        { term: 'Decomposition tree', meaning: 'A picture with the number on top and arrows down to its parts.' }
      ],
      demoVisual: fig({ fig: 'tree', n: 184, parts: [100, 80, 4] }),
      demonstrate: [
        'Book example: 353 − 184. Draw a tree: 184 → 100, 80, 4. Take away one part at a time: 353 − 100 = 253, 253 − 80 = 173, 173 − 4 = 169.',
        'Draw another tree: 184 → 153, 30, 1. 353 − 153 = 200 (a friendly number), 200 − 30 = 170, 170 − 1 = 169. The same answer.',
        'Take away the parts in another order (4 first). The answer is still 169.',
        'Show a broken tree: 101 → 100, 10. Ask: "Do the parts add back to 101?" (No: 110.)'
      ],
      ask: ['"Do your parts add back to the number?"', '"What is the easiest part to take away first?"', '"Can you land on a hundred?"', '"Why is the answer the same both ways?"'],
      checklist: [
        'Breaks a number apart 2 ways.',
        'Subtracts by place-value parts.',
        'Uses a part that lands on a friendly number.',
        'Explains why the difference is the same, and that any order works.',
        'Spots parts that don\'t add up.',
        'Solves table and "the rest" problems, and scores 90% or higher on the Decompose to Subtract Test.'
      ]
    },
    mistakes: [
      'Parts that don\'t add back to the number (100 + 10 for 101). Ask: "Add your parts. Do they make the number?"',
      'Taking each part away from the first number every time (362 − 100, then 362 − 70). Say: "Each step starts with the last answer."',
      'Breaking apart both numbers and subtracting place by place. Say: "Keep the first number whole. Break apart only the number you take away."',
      'Thinking the order changes the answer. Show two orders that give the same difference.',
      'In tables, subtracting the first and last rows instead of the greatest and the least.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How do you decide how to break apart the number you subtract?',
        idea: 'Place value always works. If a part can make a hundred or a ten, that can be quicker.'
      }
    },
    skills: {
      decompose: 'Break a number apart 2 ways',
      placevalue: 'Subtract by place value',
      regroup: 'Decompose to subtract (harder)',
      friendly: 'Choose helpful parts',
      twoways: 'Two ways, same difference',
      order: 'Any order',
      error: 'Check the parts',
      table: 'Data table',
      word: 'Story problems',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Decompose to Subtract', blurb: 'All 15 practice questions: break numbers apart, subtract one part at a time, check parts, any order, tables and stories.', ids: bank.map((q) => q.id) }],
    tests: {
      decompose: { id: 'decompose', title: 'Decompose to Subtract Test', questions: 13, blurb: 'Break apart, subtract one part at a time, two ways, mistakes, order, tables and stories.', generate: subtractTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _dsPair: dsPair,
    _placeParts: placeParts
  };
})(typeof window !== 'undefined' ? window : globalThis);
