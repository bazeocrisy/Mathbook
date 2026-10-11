/*
 * Mathbook — Chapter 2, Lesson 2-9: Use Addition to Subtract
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-9.md (with the batch-C review fixes C-1, C-9, C-13, C-14, C-15).
 * Book models: the bar diagram (F8 compare layout, lettered boxes A/B the child fills) and the two related equations
 * (whole − part = ? and part + ? = whole). The app finds the unknown addend by counting up in friendly jumps
 * (F5 number-line hops). The related-equation frame "[A] + ? = [B]" is the shared chain control with fixed order (C-14).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-9.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  /** Counting-up jumps from p to w: to the next ten, then the next hundred (if it's on the way), then to w. */
  function jumps(p, w) {
    const out = [];
    let cur = p;
    const ten = Math.ceil(cur / 10) * 10;
    if (ten > cur && ten <= w) { out.push([cur, ten]); cur = ten; }
    const hun = Math.ceil(cur / 100) * 100;
    if (hun > cur && hun <= w) { out.push([cur, hun]); cur = hun; }
    if (cur < w) out.push([cur, w]);
    return out;
  }
  /** "248 + 2 = 250, 250 + 50 = 300, 300 + 263 = 563. 2 + 50 + 263 = 315." */
  function countUp(p, w) {
    const J = jumps(p, w);
    const steps = J.map(([x, y]) => `${fmt(x)} + ${fmt(y - x)} = ${fmt(y)}`).join(', ');
    return J.length > 1 ? `${steps}. Add the jumps: ${J.map(([x, y]) => fmt(y - x)).join(' + ')} = ${fmt(w - p)}.` : `${steps}.`;
  }
  /** Number-line hops for counting up (open line). */
  const hopsFig = (p, w) => fig({ fig: 'nline', open: true, minGap: 24, marks: [p].concat(jumps(p, w).map((j) => j[1])), hops: jumps(p, w).map(([x, y]) => ({ from: x, to: y, text: `+${fmt(y - x)}` })) });
  const sub = (w, p) => `${fmt(w)} − ${fmt(p)}`;

  /** True when an answer the child must work out is printed in the question's own text (diagram boxes come from the story). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num' && !/^Box /.test(p.label)) nums.push(p.answer); });
    if (q.type === 'chain') nums.push(q.final.answer);
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);
  /** A compare bar diagram: whole (long) on top, part below, dashed ?; labels may be lettered boxes. */
  const bars = (top, bottom, sizes) => ({ fig: 'bar', kind: 'cmp', long: top, short: bottom, gap: '?', sizes });

  /** Find w − p by counting up (the answer only is graded). o: { id, w, p, left?, money?, prompt?, skill?, hint? } */
  function solveQ(o) {
    const { w, p } = o;
    const eq = o.left ? `___ = ${sub(w, p)}` : `${sub(w, p)} = ___`;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'solve',
      prompt: o.prompt || (o.noEq ? `${eq}. Use addition to find it.` : `${eq}. Use addition: ${fmt(p)} + ? = ${fmt(w)}.`),
      parts: [{ kind: 'num', label: o.label || (o.money ? 'Amount left: $' : 'The blank is'), answer: w - p }],
      hint: o.hint || `Count up from ${fmt(p)} to the next ten, then to the next hundred if you can, then to ${fmt(w)}. Add your jumps.`,
      explanation: `${fmt(p)} + ? = ${fmt(w)}. Count up: ${countUp(p, w)} Check: ${fmt(p)} + ${fmt(w - p)} = ${fmt(w)}, so ${sub(w, p)} = ${fmt(w - p)}.`
    };
  }
  /** Write the related addition equation in the frame [A] + ? = [B], then ? = . o: { id, w, p, skill?, hint? } */
  function frameQ(o) {
    const { w, p } = o;
    return {
      id: o.id, type: 'chain', preset: 'frame', skill: o.skill || 'related',
      prompt: `Write a related addition equation for ${sub(w, p)} = ?. Then find ?.`,
      rows: [{ cells: [{ in: 'A', answer: p, label: 'The part you know' }, '+', '?', '=', { in: 'B', answer: w, label: 'The whole' }], label: 'Related addition equation' }],
      final: { label: '? =', answer: w - p },
      hint: o.hint || 'Start with the part you know. The whole goes after the = sign.',
      explanation: `${fmt(p)} + ? = ${fmt(w)}: the part you know plus the missing part makes the whole. Count up: ${countUp(p, w)} So ${fmt(p)} + ${fmt(w - p)} = ${fmt(w)}.`
    };
  }
  /** Which addition equation is related to w − p = ? o: { id, w, p, extra?, seed?, r?, num? } */
  function relatedQ(o) {
    const { w, p } = o;
    const right = `${fmt(p)} + ? = ${fmt(w)}`;
    const wrong = [`${fmt(w)} + ${fmt(p)} = ?`, `${fmt(w)} + ? = ${fmt(p)}`, `? − ${fmt(p)} = ${fmt(w)}`];
    const parts = [{ kind: 'choice', label: o.label || 'Which addition equation is related?', answer: right, choices: order(o, [right].concat(wrong)) }];
    if (o.num) parts.push({ kind: 'num', label: '? =', answer: w - p });
    return {
      id: o.id, type: 'parts', skill: o.skill || 'related', prompt: o.prompt || `${sub(w, p)} = ?. Which addition equation is related?`, parts,
      hint: o.hint || 'Start with the part you know. What do you add to get the whole?',
      explanation: `${fmt(w)} is the whole and ${fmt(p)} is a part, so ${right}.` + (o.num ? ` Count up: ${countUp(p, w)}` : ` ${fmt(p)} + ${fmt(w - p)} = ${fmt(w)}.`)
    };
  }
  /** "Omar adds a + b to find b − a." o: { id, who, pron, p, w, seed? } */
  function errorQ(o) {
    const { p, w } = o;
    const right = `Find ${fmt(p)} + ? = ${fmt(w)}: what you add to ${fmt(p)} to get ${fmt(w)}.`;
    return {
      id: o.id, type: 'parts', skill: 'error',
      prompt: `${o.who} adds ${fmt(p)} + ${fmt(w)} to find ${sub(w, p)}. How can you help ${o.pron}?`,
      parts: [
        { kind: 'choice', label: `How can you help ${o.pron}?`, answer: right, choices: order(o, [right, `${o.pron === 'him' ? 'He' : 'She'} is right. Adding the two numbers finds the difference.`, `${o.pron === 'him' ? 'He' : 'She'} should find ${fmt(w)} + ? = ${fmt(p)}.`]) },
        { kind: 'num', label: 'The difference is', answer: w - p }
      ],
      hint: o.hint || `Can a difference be bigger than ${fmt(w)}?`,
      explanation: `${fmt(p)} + ${fmt(w)} = ${fmt(p + w)}, which is bigger than ${fmt(w)}, so it can't be the difference. ${fmt(p)} + ? = ${fmt(w)}: ${countUp(p, w)}`
    };
  }
  /** How many more (compare diagram with boxes A and B, the equation, ?). o: { id, story, S, L, eq?, seed? } */
  function compareQ(o) {
    const { S, L } = o;
    const parts = [
      { kind: 'num', label: 'Box A (the long bar):', answer: L },
      { kind: 'num', label: 'Box B (the short bar):', answer: S }
    ];
    if (o.eq) { const right = `${fmt(S)} + ? = ${fmt(L)}`; parts.push({ kind: 'choice', label: 'Which equation fits the diagram?', answer: right, choices: order(o, [right, `${fmt(S)} + ${fmt(L)} = ?`, `${fmt(L)} + ? = ${fmt(S)}`]) }); }
    parts.push({ kind: 'num', label: o.ask || 'How many more?', answer: L - S });
    return {
      id: o.id, type: 'parts', skill: o.skill || 'compare', prompt: o.story,
      figure: bars({ slot: 'A' }, { slot: 'B' }, [L, S]), parts,
      hint: o.hint || 'Put the bigger number in the long bar. The ? is how many more.',
      explanation: `The long bar is ${fmt(L)}; the short bar is ${fmt(S)}. ${fmt(S)} + ? = ${fmt(L)}: ${countUp(S, L)} So ${sub(L, S)} = ${fmt(L - S)}.`
    };
  }
  /** Part-whole story with a diagram (whole on top, part below). o: { id, story, W, P, ask } */
  function diagramQ(o) {
    const { W, P } = o;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'diagram', prompt: o.story,
      figure: bars({ slot: 'A' }, { slot: 'B' }, [W, P]),
      parts: [
        { kind: 'num', label: 'Box A (the whole):', answer: W },
        { kind: 'num', label: 'Box B (the part you know):', answer: P },
        { kind: 'num', label: o.ask, answer: W - P }
      ],
      hint: o.hint || 'The whole is the biggest number. It goes in the long bar.',
      explanation: `Whole ${fmt(W)}, part ${fmt(P)}. ${fmt(P)} + ? = ${fmt(W)}: ${countUp(P, W)}`
    };
  }
  /** w − ? = rest: which addition equation helps, then ?. o: { id, w, rest, third?, seed?, r? (random order) } */
  function unknownQ(o) {
    const { w } = o, r = o.rest;
    const right = `${fmt(r)} + ? = ${fmt(w)}`;
    return {
      id: o.id, type: 'parts', skill: 'unknown', prompt: `${fmt(w)} − ? = ${fmt(r)}. Which addition equation helps? Then find ?.`,
      parts: [
        { kind: 'choice', label: 'Which equation helps?', answer: right, choices: order(o, [right, `${fmt(w)} + ${fmt(r)} = ?`, o.third || `${fmt(r)} − ${fmt(w)} = ?`]) },
        { kind: 'num', label: '? =', answer: w - r }
      ],
      hint: o.hint || `${fmt(w)} is the whole. Start at the other number and count up to it.`,
      explanation: `${fmt(w)} is the whole; ${fmt(r)} and ? are the parts, so ${right}. ${countUp(r, w)} Check: ${fmt(w)} − ${fmt(w - r)} = ${fmt(r)}.`
    };
  }

  // ---------- Learn: six steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const NAMES = ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa'];
  // Example numbers (spec §5); Your Turn never uses them.
  const DEMO = [563, 248, 315, 400, 153, 247, 452, 237, 215, 541, 268, 273, 302, 458, 156];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };

  const LEFT = [
    { make: (w, p) => `A class is reading a book with ${fmt(w)} pages. They have read ${fmt(p)} pages. How many pages are left?`, ask: 'Pages left:' },
    { make: (w, p) => `A theater has ${fmt(w)} seats. ${fmt(p)} seats are filled. How many seats are empty?`, ask: 'Empty seats:' },
    { make: (w, p) => `Kim has ${fmt(w)} stickers. She uses ${fmt(p)} of them. How many stickers are left?`, ask: 'Stickers left:' }
  ];
  function diagramCheck(r) {
    for (;;) {
      const W = pv.randInt(r, 400, 900), P = pv.randInt(r, 120, W - 100);
      if (P % 100 === 0 || !ok(W, P, W - P)) continue;
      const S = pv.pick(r, LEFT);
      const right = 'the part that is left';
      return {
        id: 'learn-1', type: 'parts', skill: 'diagram', prompt: S.make(W, P),
        figure: bars({ slot: 'A' }, { slot: 'B' }, [W, P]),
        parts: [
          { kind: 'num', label: 'Box A (the whole):', answer: W },
          { kind: 'num', label: 'Box B (the part we know):', answer: P },
          { kind: 'choice', label: 'What does the ? stand for?', answer: right, choices: pv.shuffle(r, [right, 'the whole', 'the two numbers added together']) }
        ],
        hint: 'The whole is the biggest number. It goes in the long bar.',
        explanation: `The whole is ${fmt(W)} (the long bar). The part we know is ${fmt(P)}. The ? is the part that is left: ${sub(W, P)} = ${fmt(W - P)}.`
      };
    }
  }
  function relatedCheck(r) {
    for (;;) { const w = pv.randInt(r, 300, 999), p = pv.randInt(r, 100, w - 50); if (ok(w, p, w - p)) return relatedQ({ id: 'learn-2', w, p, r }); }
  }
  function countCheck(r) {
    for (;;) {
      const w = pv.randInt(r, 300, 950), p = pv.randInt(r, 100, w - 60);
      if (p % 10 === 0 || w - p < 50 || !ok(w, p, w - p)) continue;
      if (r() < 0.5 && p % 10 <= w % 10) continue; // the regrouping case at least half the time
      return solveQ({ id: 'learn-3', w, p, prompt: `Use addition to find ${sub(w, p)}.`, label: `${fmt(p)} + ? = ${fmt(w)}, so ? =` });
    }
  }
  function zerosCheck(r) {
    for (;;) {
      const h = 100 * pv.randInt(r, 3, 9), p = pv.randInt(r, 101, h - 50);
      if (p % 10 === 0 || !ok(h, p, h - p)) continue;
      return solveQ({ id: 'learn-4', w: h, p, left: true, prompt: `___ = ${sub(h, p)}. Count up from ${fmt(p)}.`,
        hint: `Count up from ${fmt(p)} to the next ten, then to the next hundred, then to ${fmt(h)}.` });
    }
  }
  function unknownCheck(r) {
    for (;;) { const w = pv.randInt(r, 300, 900), x = pv.randInt(r, 100, w - 80); if (ok(w, x, w - x)) return unknownQ({ id: 'learn-5', w, rest: x, third: `${fmt(w)} + ? = ${fmt(x)}`, r }); }
  }
  const MORE = [
    { make: (s, l) => `The class collected ${fmt(s)} cans in week 1 and ${fmt(l)} cans in week 2. How many more cans in week 2?`, ask: 'More cans:' },
    { make: (s, l) => `${fmt(s)} runners ran the short race. ${fmt(l)} ran the long race. How many more ran the long race?`, ask: 'More runners:' }
  ];
  function moreCheck(r) {
    for (;;) {
      const s = pv.randInt(r, 150, 600), l = pv.randInt(r, s + 80, 950);
      if (!ok(s, l, l - s)) continue;
      const M = pv.pick(r, MORE);
      return compareQ({ id: 'learn-6', S: s, L: l, story: M.make(s, l), ask: M.ask });
    }
  }

  const steps = [
    {
      id: 'diagram', kind: 'slides', title: 'Show a story with a bar diagram',
      explain: 'A bar diagram shows the whole and its parts. The long bar is the whole. The dashed ? is the part we don\'t know.',
      slides: [
        say('A class is reading a book with <b>563</b> pages. They have read <b>248</b> pages. How many pages are left?'),
        fig(bars(563, 248, [563, 248])) + say('The long bar is the whole book. The short bar is the part they read.'),
        fig(bars(563, 248, [563, 248])) + say('The dashed part is the pages that are <b>left</b>. That\'s the unknown, <b>?</b>.')
      ],
      check: noLeak(diagramCheck)
    },
    {
      id: 'two-equations', kind: 'slides', title: 'Two equations, one diagram',
      explain: 'Subtract the part from the whole, or add: part + ? = whole. Both ask the same question.',
      slides: [
        fig(bars(563, 248, [563, 248])) + say('You can subtract:') + big('563 − 248 = ?'),
        fig(bars(563, 248, [563, 248])) + say('Or you can add. The part you know, plus the missing part, makes the whole:') + big('248 + ? = 563'),
        say('Both ask the same question: what goes with 248 to make 563?') + big('563 − 248 = <b>315</b>') + big('248 + <b>315</b> = 563')
      ],
      check: noLeak(relatedCheck)
    },
    {
      id: 'count-up', kind: 'slides', title: 'Count up to find the missing addend',
      explain: 'Start at the part you know. Jump to a ten, then a hundred, then to the whole. Add the jumps.',
      slides: [
        big('248 + ? = 563') + say('Count up from 248 in friendly jumps.'),
        hopsFig(248, 563) + say('248 + 2 = 250, 250 + 50 = 300, 300 + 263 = 563.'),
        say('Add the jumps: 2 + 50 + 263 = <b>315</b>.'),
        say('Check: 248 + 315 = 563 ✓, so <b>563 − 248 = 315</b>.')
      ],
      check: noLeak(countCheck)
    },
    {
      id: 'zeros', kind: 'slides', title: 'Count up across zeros',
      explain: 'Taking away from a number like 400 is tricky. Count up instead.',
      slides: [
        big('400 − 153 = ?') + say('Taking away from 400 is tricky. Count up instead: <b>153 + ? = 400</b>.'),
        hopsFig(153, 400) + say('153 + 7 = 160, 160 + 40 = 200, 200 + 200 = 400. Jumps: 7 + 40 + 200 = <b>247</b>.'),
        big('___ = 400 − 153'.replace('___', '<span class="blank" role="img" aria-label="blank"></span>')) + say('The answer can sit on the left, too. It means the same thing: the blank is <b>247</b>.')
      ],
      check: noLeak(zerosCheck)
    },
    {
      id: 'unknown', kind: 'slides', title: 'Unknown in another place',
      explain: 'Find the whole first. Then add: part + ? = whole. Never add the whole and a part to find a difference.',
      slides: [
        big('452 − ? = 237') + say('Now the unknown is the number taken away. 452 is the whole. 237 and ? are the parts.'),
        fig(bars(452, 237, [452, 237])) + say('So <b>237 + ? = 452</b>. Count up: 237 + 3 = 240, 240 + 60 = 300, 300 + 152 = 452. 3 + 60 + 152 = <b>215</b>.'),
        say('A mistake: Jo wants 458 − 302 and adds 302 + 458 = 760.') + say('760 is bigger than 458. A difference can\'t be bigger than the whole! Jo should find <b>302 + ? = 458</b>. ? = <b>156</b>.')
      ],
      check: noLeak(unknownCheck)
    },
    {
      id: 'how-many-more', kind: 'slides', title: '"How many more?" with two bars',
      explain: 'Put the bigger number in the long bar. The ? is how many more.',
      slides: [
        say('<b>268</b> people visit the zoo on Monday. <b>541</b> visit on Saturday. How many more visit on Saturday?'),
        fig(bars(541, 268, [541, 268])) + say('The longer bar is the bigger number. The ? is how many <b>more</b>.'),
        big('541 − 268 = ?') + big('268 + ? = 541') + hopsFig(268, 541) + say('268 + 2 = 270, + 30 = 300, + 241 = 541. 2 + 30 + 241 = <b>273</b> more people.')
      ],
      check: noLeak(moreCheck)
    }
  ];

  // ---------- Practice Together (10), On My Own (12), Test (12) ----------
  const guided = [
    relatedQ({ id: 'p1', w: 584, p: 342, num: true, seed: 1, prompt: 'Lena wants to use addition to solve 584 − 342 = ?.', label: 'Which addition equation can she use?', hint: 'Start with the part you know.' }),
    frameQ({ id: 'p2', w: 728, p: 315, hint: 'The whole goes after the = sign.' }),
    solveQ({ id: 'p3', w: 500, p: 263, hint: 'Count up from 263 to 270, to 300, to 500. Then add your jumps.' }),
    solveQ({ id: 'p4', w: 600, p: 348, left: true, hint: 'The blank is on the left. It still means 600 − 348. Count up from 348 and add your jumps.' }),
    errorQ({ id: 'p5', who: 'Omar', pron: 'him', p: 214, w: 563, seed: 5 }),
    compareQ({ id: 'p6', S: 386, L: 712, eq: true, seed: 6, story: 'The library has 386 picture books and 712 chapter books. How many more chapter books?', ask: 'More chapter books:', hint: 'The bigger number is the long bar.' }),
    solveQ({ id: 'p7', w: 600, p: 358, skill: 'apply', prompt: 'Mia needs 600 beads for a necklace. She has strung 358. How many more beads does she need?', label: 'More beads:', hint: '358 + ? = 600. Count up and add your jumps.' }),
    solveQ({ id: 'p8', w: 800, p: 517, skill: 'apply', money: true, prompt: 'A club has $800 to buy a tent and a stove. The tent costs $517. How much is left for the stove?', hint: '517 + ? = 800. Count up and add your jumps.' }),
    unknownQ({ id: 'p9', w: 652, rest: 418, seed: 9, hint: '652 is the whole.' }),
    { id: 'p10', type: 'explain', skill: 'reason', prompt: 'How are addition and subtraction related? Use 300, 120 and 180.',
      parent: 'Parent marks. Accept any true pair of related facts.',
      listenFor: ['120 + 180 = 300 and 300 − 120 = 180 use the same three numbers.', 'Subtracting is finding a missing addend.'],
      explanation: '120 + 180 = 300, so 300 − 120 = 180 and 300 − 180 = 120. The same three numbers.' }
  ];
  const parentTips = { p1: 'Explain aloud why her addition equation works.', p3: 'Show me your jumps.', p5: 'Ask: is the answer bigger or smaller than 563?', p9: 'Can you draw the bar diagram on paper?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = q.parent || parentTips[q.id]; });

  const bank = [
    frameQ({ id: 'o1', w: 847, p: 413 }),
    relatedQ({ id: 'o2', w: 300, p: 162, seed: 12 }),
    frameQ({ id: 'o3', w: 936, p: 255 }),
    errorQ({ id: 'o4', who: 'Nia', pron: 'her', p: 205, w: 638, seed: 14 }),
    compareQ({ id: 'o5', S: 468, L: 735, eq: true, seed: 15, story: '468 people rode the ferry on Saturday. 735 rode on Sunday. How many more rode on Sunday?', ask: 'More on Sunday:' }),
    solveQ({ id: 'o6', w: 570, p: 326, noEq: true }),
    solveQ({ id: 'o7', w: 700, p: 285, left: true, noEq: true }),
    solveQ({ id: 'o8', w: 803, p: 457, noEq: true }),
    solveQ({ id: 'o9', w: 231, p: 164, noEq: true }),
    // O10 also practises filling in the part-whole diagram (the test's "diagram" skill, T5).
    diagramQ({ id: 'o10', W: 400, P: 186, story: 'Kids must plant 400 tulip bulbs. They planted 186. How many are left to plant?', ask: 'Bulbs left to plant:' }),
    solveQ({ id: 'o11', w: 900, p: 638, skill: 'apply', money: true, prompt: 'A science club can spend $900 on a telescope and a camera. The telescope costs $638. How much is left for the camera?' }),
    unknownQ({ id: 'o12', w: 563, rest: 327, seed: 18 }),
    // O13 practises the test's "which must also be true" format (T12), with new numbers (review L29-02).
    { id: 'o13', type: 'parts', skill: 'related', prompt: '418 + 265 = 683. Which must also be true? Choose all.',
      parts: [{ kind: 'multi', label: 'Which must also be true?', answer: ['683 − 418 = 265', '683 − 265 = 418'], choices: ['683 − 265 = 418', '418 − 683 = 265', '683 − 418 = 265', '265 + 683 = 418'] }],
      hint: 'The whole is 683. Subtract a part from the whole to get the other part.',
      explanation: '418 + 265 = 683 uses the same three numbers as 683 − 418 = 265 and 683 − 265 = 418. The whole, 683, is the number you subtract from.' }
  ];

  const testItems = [
    frameQ({ id: 't1', w: 769, p: 425 }),
    relatedQ({ id: 't2', w: 500, p: 173 }),
    errorQ({ id: 't3', who: 'Ben', pron: 'him', p: 312, w: 586 }),
    compareQ({ id: 't4', S: 297, L: 524, eq: true, story: 'Ava read 297 pages in March and 524 in April. How many more pages in April?', ask: 'More pages in April:' }),
    diagramQ({ id: 't5', W: 900, P: 438, story: 'A train trip is 900 miles. The train has gone 438 miles. How many miles are left?', ask: 'Miles left:' }),
    solveQ({ id: 't6', w: 680, p: 435, noEq: true }),
    solveQ({ id: 't7', w: 800, p: 364, left: true, noEq: true }),
    solveQ({ id: 't8', w: 604, p: 278, noEq: true }),
    solveQ({ id: 't9', w: 322, p: 157, noEq: true }),
    solveQ({ id: 't10', w: 600, p: 455, skill: 'apply', money: true, prompt: 'You have $600 for a bike and a helmet. The bike costs $455. How much is left for the helmet?' }),
    unknownQ({ id: 't11', w: 712, rest: 485 }),
    { id: 't12', type: 'parts', skill: 'related', prompt: '356 + 287 = 643. Which must also be true? Choose all.',
      parts: [{ kind: 'multi', label: 'Which must also be true?', answer: ['643 − 356 = 287', '643 − 287 = 356'], choices: ['643 − 356 = 287', '643 − 287 = 356', '356 − 643 = 287', '287 + 643 = 356'] }],
      explanation: '356 + 287 = 643 uses the same three numbers as 643 − 356 = 287 and 643 − 287 = 356. The whole, 643, is the number you subtract from.' }
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Use Addition to Subtract Test: the same 12 questions each time; choice order changes with each attempt. */
  function relatedTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-9'] = {
    id: '2-9',
    storageKey: 'mathbook:v2:lesson-2-9',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-9',
    title: 'Use Addition to Subtract',
    subtitle: 'Find the missing addend',
    objective: 'I can use a bar diagram and a related addition equation to find a difference.',
    parentLearn: {
      goal: [
        'Show a subtraction story with a bar diagram: the whole (long bar), a part, and the unknown part (dashed ?).',
        'Write both related equations for the diagram: whole − part = ? and part + ? = whole.',
        'Find the missing addend by counting up in friendly jumps, including across zeros (400 − 153).',
        'Use the relationship when the unknown is somewhere else (452 − ? = 237) or on the left (___ = 300 − 179).',
        'Explain why adding the two numbers does not find a difference.',
        'Solve "how many more" and "how many left" problems.'
      ],
      words: [
        { term: 'Bar diagram', meaning: 'A drawing with bars that shows how the numbers in a story fit together.' },
        { term: 'Whole', meaning: 'The total amount; the longest bar.' },
        { term: 'Part', meaning: 'One piece of the whole.' },
        { term: 'Addend', meaning: 'A number you add.', example: 'In 248 + ? = 563, 248 and ? are addends.' },
        { term: 'Unknown', meaning: 'The number we don\'t know yet, written as ?.' },
        { term: 'Difference', meaning: 'The answer to a subtraction problem.' },
        { term: 'Related equations', meaning: 'Addition and subtraction equations that use the same three numbers.', example: '248 + 315 = 563 and 563 − 248 = 315' },
        { term: 'Count up', meaning: 'Start at the smaller number and add jumps until you reach the bigger number.' }
      ],
      demoVisual: fig(bars(575, 246, [575, 246])),
      demonstrate: [
        'Book example: a family drives 575 miles and has driven 246. Draw a long bar "575" and a shorter bar "246" under it; dash the gap with "?".',
        'Write 575 − 246 = ? and 246 + ? = 575. They ask the same question.',
        'Count up: 246 + 4 = 250, 250 + 50 = 300, 300 + 275 = 575. Add the jumps: 4 + 50 + 275 = 329.',
        'Check: 246 + 329 = 575.',
        'Error: adding 301 + 447 to find 447 − 301 gives 748, bigger than 447, so it can\'t be the difference.'
      ],
      ask: ['"Which number is the whole?"', '"What do you add to the part to get the whole?"', '"Is your answer smaller than the whole?"', '"How can you check with addition?"'],
      checklist: [
        'Fills in a bar diagram (whole, part, ?).',
        'Writes both related equations.',
        'Counts up correctly, including across zeros.',
        'Solves 452 − ? = 237.',
        'Explains why adding the two numbers is wrong.',
        'Solves how-many-more problems, and scores 90% or higher on the Use Addition to Subtract Test.'
      ]
    },
    mistakes: [
      'Adding the two numbers (302 + 458). Ask: "Can the answer be bigger than the whole?"',
      'Putting the whole as an addend (563 + ? = 248). Point to the bar diagram: the whole is the long bar, after the = sign.',
      'Not adding the counting-up jumps together (saying 263, the last jump). Say: "Add all your jumps."',
      'Across zeros: writing 400 − 153 = 353. Switch to counting up.',
      'For 452 − ? = 237, adding 452 + 237. The whole is 452: count up from 237.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How are addition and subtraction related?',
        idea: 'They use the same three numbers. If 248 + 315 = 563, then 563 − 248 = 315. Subtracting is finding a missing addend.'
      }
    },
    skills: {
      diagram: 'Bar diagrams',
      related: 'Related addition equations',
      solve: 'Use addition to find a difference',
      compare: 'How many more',
      error: 'Finding the mistake',
      unknown: 'Unknown in another place',
      apply: 'Word problems',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Use Addition to Subtract', blurb: 'All 13 practice questions: related equations, bar diagrams, counting up, mistakes, and word problems.', ids: bank.map((q) => q.id) }],
    tests: {
      related: { id: 'related', title: 'Use Addition to Subtract Test', questions: 12, blurb: 'Bar diagrams, related equations, counting up, and word problems.', generate: relatedTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _jumps: jumps
  };
})(typeof window !== 'undefined' ? window : globalThis);
