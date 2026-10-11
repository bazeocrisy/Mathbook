/*
 * Mathbook — Chapter 2, Lesson 2-12: Solve Two-Step Problems Involving Addition and Subtraction
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-12.md (with the batch-C review fixes C-2, C-3, C-4, C-6, C-13, C-15).
 * Book models (p. 80): a letter for each unknown; a part-part-whole bar (bracket for the whole) for joining and a
 * compare bar (dashed missing piece) for "how many more / left"; one equation per step, the first answer used in the
 * second. Diagrams are the shared F8 bar figure; "which diagram" items use F9 picture choices (Diagram A/B/C).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-12.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const L = (x) => (typeof x === 'string' ? { letter: x } : x);
  /** Part-part-whole bar: parts (numbers or letters), sizes for widths, whole label, bracket above/below. */
  const ppw = (parts, sizes, whole, o) => Object.assign({ fig: 'bar', kind: 'ppw', parts: parts.map(L), sizes, whole: L(whole), bracket: 'above' }, o || {});
  /** Compare bar: long (whole), short (part), dashed gap. */
  const cmp = (long, short, gap, sizes, o) => Object.assign({ fig: 'bar', kind: 'cmp', long: L(long), short: L(short), gap: L(gap), sizes }, o || {});
  const plus = (a, b) => `${fmt(a)} + ${fmt(b)}`;
  const minus = (a, b) => `${fmt(a)} − ${fmt(b)}`;

  /** True when a number the child must type is printed in the question's own text (not a diagram). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** Equation for a part-part-whole diagram p | q with bracket a. */
  function ppwEqQ(o) {
    const { p, q } = o, right = `${plus(p, q)} = a`;
    return {
      id: o.id, type: 'parts', skill: 'diagram', prompt: o.prompt || 'Which equation matches the bar diagram? Then find a.',
      figure: ppw([p, q], [p, q], 'a', { bracket: o.below ? 'below' : 'above' }),
      parts: [
        { kind: 'choice', label: 'Which equation matches?', answer: right, choices: order(o, [right, `${minus(q, p)} = a`, `a + ${fmt(p)} = ${fmt(q)}`]) },
        { kind: 'num', label: 'a =', answer: p + q }
      ],
      hint: o.hint || 'The bracket shows the whole. The parts together make the whole.',
      explanation: `The parts ${fmt(p)} and ${fmt(q)} make the whole a: ${plus(p, q)} = ${fmt(p + q)}, so a = ${fmt(p + q)}.`
    };
  }
  /** Equations for a compare diagram (whole W, part P, dashed b). */
  function cmpEqQ(o) {
    const { W, P } = o, right = [`${minus(W, P)} = b`, `${fmt(P)} + b = ${fmt(W)}`];
    return {
      id: o.id, type: 'parts', skill: 'diagram', prompt: o.prompt || 'Which equations match the bar diagram? Choose all. Then find b.',
      figure: cmp(W, P, 'b', [W, P]),
      parts: [
        { kind: 'multi', label: 'Which equations match?', answer: right, choices: order(o, right.concat([`${plus(W, P)} = b`, `${minus(P, W)} = b`])) },
        { kind: 'num', label: 'b =', answer: W - P }
      ],
      hint: o.hint || 'The dashed piece is what\'s missing. Subtract, or count up.',
      explanation: `${fmt(W)} is the whole and ${fmt(P)} is a part, so ${minus(W, P)} = b, or ${fmt(P)} + b = ${fmt(W)}. b = ${fmt(W - P)}.`
    };
  }
  /** Which diagram shows the equation? kind 'sub': W − b = R; kind 'add': P + a = W (C-4 distractors). */
  function diagramForQ(o) {
    const { W, n } = o, v = W - n;
    let figs, eq, letter;
    if (o.kind === 'sub') {
      eq = `${fmt(W)} − b = ${fmt(n)}`; letter = 'b';
      figs = [cmp(W, n, 'b', [W, n], { small: true }), ppw([W, n], [W, n], 'b', { small: true }), ppw([W, 'b'], [W, v], n, { small: true })];
    } else {
      eq = `${fmt(n)} + a = ${fmt(W)}`; letter = 'a';
      figs = [ppw([n, 'a'], [n, v], W, { small: true }), ppw([n, W], [n, W], 'a', { small: true }), cmp('a', n, W, [W, n], { small: true })];
    }
    const idx = order(o, [0, 1, 2]);
    const right = 'ABC'[idx.indexOf(0)];
    return {
      id: o.id, type: 'parts', skill: o.skill || 'diagram', prompt: `Which bar diagram shows ${eq}? Then find ${letter}.`,
      figure: { fig: 'pics', noun: 'Diagram', items: idx.map((k, i) => ({ label: 'ABC'[i], fig: figs[k] })) },
      parts: [
        { kind: 'choice', label: 'Which diagram matches?', answer: right, choices: ['A', 'B', 'C'], compact: true },
        { kind: 'num', label: `${letter} =`, answer: v }
      ],
      hint: o.hint || 'Find the whole first. Is it a number or the letter?',
      explanation: o.kind === 'sub'
        ? `${fmt(W)} is the whole; ${fmt(n)} and b are its parts, so the compare diagram with ${fmt(W)} on top fits. b = ${minus(W, n)} = ${fmt(v)}.`
        : `${fmt(W)} is the whole; ${fmt(n)} and a are its parts, so the bar ${fmt(n)} | a with the bracket ${fmt(W)} fits. a = ${minus(W, n)} = ${fmt(v)}.`
    };
  }
  /** Two named steps (add, then compare or take away). o: { id, story, x, y, T, more: true (needed) | false (left), la, lb } */
  function addThenQ(o) {
    const a = o.x + o.y, b = o.more ? o.T - a : a - o.T;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'twostep', prompt: o.story,
      parts: [{ kind: 'num', label: o.la, answer: a }, { kind: 'num', label: o.lb, answer: b }],
      hint: o.hint || 'What do you need to find first?',
      explanation: `Step 1: ${plus(o.x, o.y)} = a, a = ${fmt(a)}. Step 2: ${o.more ? `${minus(o.T, a)} = b` : `${minus(a, o.T)} = b`}, b = ${fmt(b)}.`
    };
  }
  /** Spend twice: only the final answer (either order works). */
  function spendQ(o) {
    const left = o.M - o.c1 - o.c2;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'twostep', prompt: o.story,
      parts: [{ kind: 'num', label: 'Money left: $', answer: left }],
      hint: o.hint || 'Subtract both costs.',
      explanation: `${minus(o.M, o.c1)} = ${fmt(o.M - o.c1)}, then ${minus(o.M - o.c1, o.c2)} = ${fmt(left)}. Or add the costs first: ${plus(o.c1, o.c2)} = ${fmt(o.c1 + o.c2)}, ${minus(o.M, o.c1 + o.c2)} = ${fmt(left)}. Both orders work.`
    };
  }
  /** More than, then together. */
  function moreQ(o) {
    const y = o.x + o.d;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'twostep', prompt: o.story,
      parts: [{ kind: 'num', label: `${o.n2} has:`, answer: y }, { kind: 'num', label: 'Together:', answer: o.x + y }],
      hint: o.hint || `Find ${o.n2}'s first.`,
      explanation: `${o.n2} has ${fmt(o.x)} and ${fmt(o.d)} more: ${plus(o.x, o.d)} = ${fmt(y)}. Together: ${plus(o.x, y)} = ${fmt(o.x + y)}.`
    };
  }
  /** Work backward: only the final answer. */
  function backwardQ(o) {
    const all = o.s + o.l, v = all - o.m;
    return {
      id: o.id, type: 'parts', skill: 'backward', prompt: o.story,
      parts: [{ kind: 'num', label: o.label, answer: v }],
      hint: o.hint || 'What was sold and what is left together make everything that was made.',
      explanation: `All: ${plus(o.s, o.l)} = ${fmt(all)}. Then ${minus(all, o.m)} = ${fmt(v)}. (Another order also works: ${minus(o.s, o.m)} = ${fmt(o.s - o.m)}, ${plus(o.s - o.m, o.l)} = ${fmt(v)}.)`
    };
  }
  /** Groups of 100. */
  function boxesQ(o) {
    const left = (o.n - o.s1 - o.s2) * 100;
    return {
      id: o.id, type: 'parts', skill: 'twostep', prompt: o.story,
      parts: [{ kind: 'num', label: o.label, answer: left }],
      hint: o.hint || 'How many boxes are left? Each box has 100.',
      explanation: `${o.n} − ${o.s1} − ${o.s2} = ${o.n - o.s1 - o.s2} boxes, and ${o.n - o.s1 - o.s2} boxes of 100 = ${fmt(left)}. (Or ${minus(o.n * 100, (o.s1 + o.s2) * 100)} = ${fmt(left)}.)`
    };
  }
  /** Solve for a letter (letter on either side). */
  function letterQ(o) {
    const v = o.op === '−' ? o.a - o.b : o.W - o.p;
    return {
      id: o.id, type: 'parts', skill: 'letters',
      prompt: o.op === '−' ? `m = ${minus(o.a, o.b)}` : `${fmt(o.W)} = ${fmt(o.p)} + k`,
      parts: [{ kind: 'num', label: o.op === '−' ? 'm =' : 'k =', answer: v }],
      hint: o.hint || (o.op === '−' ? 'Subtract.' : `${fmt(o.p)} + what makes ${fmt(o.W)}?`),
      explanation: o.op === '−' ? `${minus(o.a, o.b)} = ${fmt(v)}, so m = ${fmt(v)}.` : `The equal sign means both sides are the same. ${fmt(o.p)} + k = ${fmt(o.W)}, so k = ${minus(o.W, o.p)} = ${fmt(v)}.`
    };
  }
  /** Which story fits a 3-part diagram with bracket t. o: { id, x, y, z, things, who, seed?, r? } */
  function storyQ(o) {
    const { x, y, z } = o;
    const right = `${o.who} sold ${fmt(x)} ${o.things} on Monday, ${fmt(y)} on Tuesday, and ${fmt(z)} on Wednesday. How many in all?`;
    const wrong = [`${o.who} had ${fmt(y)} ${o.things}. It sold ${fmt(x)} and then ${fmt(z)}. How many are left?`, `${o.who} sold ${fmt(x)} ${o.things} and ${fmt(y)} more. How many more on the second day than the first?`];
    return {
      id: o.id, type: 'parts', skill: 'sense', prompt: 'Which story fits the bar diagram? Then find t.',
      figure: ppw([x, y, z], [x, y, z], 't'),
      parts: [
        { kind: 'choice', label: 'Which story fits?', answer: right, choices: order(o, [right].concat(wrong)) },
        { kind: 'num', label: 't =', answer: x + y + z }
      ],
      hint: o.hint || 'The bracket covers all the parts. What do we do to find the whole?',
      explanation: `The bracket t covers all three parts, so add: ${plus(x, y)} = ${fmt(x + y)}, ${plus(x + y, z)} = ${fmt(x + y + z)}. t = ${fmt(x + y + z)}.`
    };
  }

  // ---------- Learn: six steps ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const DEMO = [246, 131, 377, 500, 123, 703, 288, 415, 645, 321, 324, 812, 345, 467, 190, 124, 38, 28, 215, 128, 343, 558, 238, 497, 43, 302, 120, 305, 214, 639];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };
  const pickName = (r) => pv.pick(r, ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa']);

  function joinCheck(r) {
    for (;;) {
      const p = pv.randInt(r, 100, 600), q = pv.randInt(r, 100, 600);
      if (p + q < 300 || p + q > 900 || p === q || !ok(p, q, p + q)) continue;
      const n = pickName(r);
      return ppwEqQ({ id: 'learn-1', p, q, r, prompt: `${n} has ${fmt(p)} stamps. Then ${n} gets ${fmt(q)} more. Which equation matches the bar diagram? Then find a.` });
    }
  }
  function missingCheck(r) {
    for (;;) {
      const W = pv.randInt(r, 400, 950), P = pv.randInt(r, 150, W - 40);
      if (!ok(W, P, W - P)) continue;
      return cmpEqQ({ id: 'learn-2', W, P, r });
    }
  }
  const GOALS = [
    { thing: 'shells', a: 'shells in all now', b: 'shells still needed', story: (n, x, y, T) => `${n} collects ${fmt(x)} shells, then ${fmt(y)} more. ${n} wants ${fmt(T)} shells. How many more does ${n} need?`, more: true },
    { thing: 'steps', a: 'steps walked so far', b: 'steps still to walk', story: (n, x, y, T) => `${n} walks ${fmt(x)} steps, then ${fmt(y)} more. The goal is ${fmt(T)} steps. How many more steps?`, more: true },
    { thing: 'cans', a: 'cans collected', b: 'cans left', story: (n, x, y, T) => `${n}'s class collects ${fmt(x)} cans, then ${fmt(y)} more. They give ${fmt(T)} cans away. How many are left?`, more: false }
  ];
  function twoStepCheck(r) {
    for (;;) {
      const x = pv.randInt(r, 100, 500), y = pv.randInt(r, 100, 500), a = x + y;
      if (a < 250 || a > 800) continue;
      const G = pv.pick(r, GOALS);
      let T;
      if (G.more) { const lo = Math.ceil((a + 30) / 50); if (lo * 50 > 999) continue; T = 50 * pv.randInt(r, lo, Math.min(19, lo + 6)); }
      else { const hi = Math.floor((a - 50) / 50); if (hi < 2) continue; T = 50 * pv.randInt(r, 2, hi); }
      const b = G.more ? T - a : a - T;
      if (!ok(x, y, a, T, b)) continue;
      return addThenQ({ id: 'learn-3', x, y, T, more: G.more, story: G.story(pickName(r), x, y, T), la: `a = ${G.a}:`, lb: `b = ${G.b}:` });
    }
  }
  function diagramCheck(r) {
    for (;;) {
      const W = pv.randInt(r, 300, 950), n = pv.randInt(r, 100, W - 60);
      if (!ok(W, n, W - n)) continue;
      return diagramForQ({ id: 'learn-4', W, n, kind: r() < 0.5 ? 'sub' : 'add', r });
    }
  }
  const ITEMS = [['a ball', 'a pump'], ['a book', 'a bookmark'], ['a kite', 'string'], ['paint', 'a brush']];
  function kindsCheck(r) {
    const n = pickName(r), k = pv.randInt(r, 0, 2);
    for (;;) {
      if (k === 0) {
        const M = pv.randInt(r, 150, 600), c1 = pv.randInt(r, 50, M - 70), c2 = pv.randInt(r, 10, 99);
        if (c1 + c2 > M - 10 || c1 === c2 || !ok(M, c1, c2, M - c1 - c2)) continue;
        const [i1, i2] = pv.pick(r, ITEMS);
        return spendQ({ id: 'learn-5', M, c1, c2, story: `${n} has $${fmt(M)}. ${n} buys ${i1} for $${fmt(c1)} and ${i2} for $${fmt(c2)}. How much is left?` });
      }
      if (k === 1) {
        const x = pv.randInt(r, 100, 400), d = pv.randInt(r, 50, 250);
        if (2 * x + d > 999 || !ok(x, d, x + d, 2 * x + d)) continue;
        const n2 = n === 'Ben' ? 'Kofi' : 'Ben';
        return moreQ({ id: 'learn-5', x, d, n2, story: `${n} has ${fmt(x)} cards. ${n2} has ${fmt(d)} more than ${n}. How many cards together?` });
      }
      const m = pv.randInt(r, 150, 350), s = pv.randInt(r, 300, 600), l = pv.randInt(r, 20, 90);
      if (s + l > 999 || s + l - m < 50 || !ok(m, s, l, s + l - m)) continue;
      return backwardQ({ id: 'learn-5', m, s, l, label: 'Afternoon:', story: `A bakery makes ${fmt(m)} rolls in the morning and more in the afternoon. It sells ${fmt(s)} rolls and has ${fmt(l)} left. How many rolls were made in the afternoon?` });
    }
  }
  const SHOPS = [['A shop', 'hats'], ['A stand', 'apples'], ['A store', 'books'], ['A cafe', 'muffins']];
  function senseCheck(r) {
    for (;;) {
      const x = pv.randInt(r, 100, 350), y = pv.randInt(r, 100, 350), z = pv.randInt(r, 100, 350);
      if (x + y + z > 999 || new Set([x, y, z]).size < 3 || !ok(x, y, z, x + y + z)) continue;
      const [who, things] = pv.pick(r, SHOPS);
      return storyQ({ id: 'learn-6', x, y, z, who, things, r });
    }
  }

  const steps = [
    {
      id: 'letter', kind: 'slides', title: 'A letter for the unknown',
      explain: 'Use a letter, like a, for a number you don\'t know yet. The parts together make the whole.',
      slides: [
        say('Max has <b>246</b> stickers. Then he gets <b>131</b> more. He wants <b>500</b> stickers to fill his album.') + say('First: how many stickers does he have?'),
        fig(ppw([246, 131], [246, 131], 'a', { caption: 'stickers he has' })) + say('We don\'t know the total yet. Call it <b><i>a</i></b>.'),
        big('246 + 131 = <i>a</i>') + say('<i>a</i> = <b>377</b>. Max has 377 stickers.')
      ],
      check: noLeak(joinCheck)
    },
    {
      id: 'missing', kind: 'slides', title: 'The missing part',
      explain: 'A compare diagram shows the whole and a part. The dashed piece is the missing part.',
      slides: [
        say('He has 377. He needs 500. How many <b>more</b> does he need?'),
        fig(cmp(500, 377, 'b', [500, 377], { caption: 'stickers needed', order: 'shortTop' })) + say('The long bar is the 500 he needs. The dashed piece <b><i>b</i></b> is what is missing.'),
        big('500 − 377 = <i>b</i>') + say('Or 377 + <i>b</i> = 500. <i>b</i> = <b>123</b>. Max needs 123 more stickers.')
      ],
      check: noLeak(missingCheck)
    },
    {
      id: 'two-steps', kind: 'slides', title: 'Put the two steps together',
      explain: 'Find the first unknown. Then use it in the second step.',
      slides: [
        `<div class="slide-pair">${fig(ppw([246, 131], [246, 131], 'a'))}${fig(cmp(500, 'a', 'b', [500, 377], { order: 'shortTop' }))}</div>` + say('The whole story: two diagrams, two letters.'),
        say('Step 1: 246 + 131 = <i>a</i>, <i>a</i> = 377.') + say('Step 2: 500 − <i>a</i> = <i>b</i> → 500 − 377 = <i>b</i>, <i>b</i> = <b>123</b>.'),
        say('Use the answer from Step 1 in Step 2. Answer the question that was asked: <b>123</b> more stickers, not 377.')
      ],
      check: noLeak(twoStepCheck)
    },
    {
      id: 'diagrams', kind: 'slides', title: 'Diagrams and equations',
      explain: 'Find the whole first: it is the long bar or the bracket. Letters can be on either side of the equal sign.',
      slides: [
        say('Which bar diagram shows <b>703 − <i>b</i> = 288</b>?') + fig({ fig: 'pics', noun: 'Diagram', items: [
          { label: 'A', fig: cmp(703, 288, 'b', [703, 288], { small: true }) }, { label: 'B', fig: ppw([703, 288], [703, 288], 'b', { small: true }) }, { label: 'C', fig: ppw([703, 'b'], [703, 415], 288, { small: true }) }] }) +
          say('703 is the whole. 288 is a part. <i>b</i> is the other part. <b>A</b> fits: <i>b</i> = 415.'),
        fig(cmp(645, 321, 'm', [645, 321])) + say('An equation for this diagram: 645 − 321 = <i>m</i> (or 321 + <i>m</i> = 645). <i>m</i> = <b>324</b>.'),
        big('812 = 345 + <i>k</i>') + say('The equal sign means both sides are the same amount. 345 + <i>k</i> = 812, so <i>k</i> = <b>467</b>.')
      ],
      check: noLeak(diagramCheck)
    },
    {
      id: 'kinds', kind: 'slides', title: 'Different two-step stories',
      explain: 'Spend twice, more than then together, work backward, groups of 100: find what you need first.',
      slides: [
        say('<b>Spend twice.</b> Sam has $190. He buys a ball for $124 and a pump for $38. How much is left?') + big('190 − 124 = 66, 66 − 38 = <b>28</b>') + say('Or add the costs first: 124 + 38 = 162, 190 − 162 = 28. Both orders work.'),
        say('<b>More than, then together.</b> Amy has 215 cards. Raj has 128 more than Amy. How many together?') + fig(cmp('r', 215, 128, [343, 215])) + big('215 + 128 = 343 (Raj), 215 + 343 = <b>558</b>'),
        say('<b>Work backward.</b> A school garden picks 238 carrots in the morning and more in the afternoon. The class eats 497 and has 43 left. How many in the afternoon?') + big('497 + 43 = 540 in all, 540 − 238 = <b>302</b>'),
        say('<b>Groups of 100.</b> A shop has 8 boxes of 100 crayons. It sells 2 boxes, then 3 boxes. 8 − 2 − 3 = 3 boxes = <b>300</b> crayons.')
      ],
      check: noLeak(kindsCheck)
    },
    {
      id: 'sense', kind: 'slides', title: 'Make sense of a two-step problem',
      explain: 'Read it, say what you know and what you need, draw a bar diagram, write an equation for each step, and check.',
      slides: [
        fig(ppw([120, 305, 214], [120, 305, 214], 't')) + say('What story could this be? A class picked 120 apples on Monday, 305 on Tuesday, and 214 on Wednesday. How many in all?') +
          big('120 + 305 = 425, 425 + 214 = 639, <i>t</i> = 639'),
        say('To make sense of a two-step problem: read it, say what you know and what you need, draw a bar diagram, write an equation for each step with a letter, then check that the answer makes sense.')
      ],
      check: noLeak(senseCheck)
    }
  ];

  // ---------- Practice Together (14), On My Own (12), Test (12) ----------
  const guided = [
    ppwEqQ({ id: 'p1', p: 320, q: 455, below: true, seed: 1, hint: 'Parts make the whole.' }),
    cmpEqQ({ id: 'p2', W: 742, P: 518, seed: 2, hint: 'The dashed piece is missing.' }),
    diagramForQ({ id: 'p3', W: 702, n: 348, kind: 'sub', seed: 3, hint: 'Which number is the whole?' }),
    diagramForQ({ id: 'p4', W: 650, n: 200, kind: 'add', seed: 4, hint: '650 is the whole.' }),
    addThenQ({ id: 'p5', x: 276, y: 418, T: 350, more: false, la: 'a = cans collected:', lb: 'b = cans left:', hint: 'First find all the cans.',
      story: 'Scouts collect 276 cans one week and 418 the next. They give 350 cans to a shelter. How many are left?' }),
    addThenQ({ id: 'p6', x: 248, y: 135, T: 500, more: true, la: 'a = money he has now: $', lb: 'b = money he still needs: $', hint: 'What does he have now?',
      story: 'Owen has saved $248. He earns $135 more. A bike costs $500. How much more does he need?' }),
    spendQ({ id: 'p7', M: 215, c1: 148, c2: 19, story: 'Kara has $215. She buys a scooter for $148 and a bell for $19. How much is left?' }),
    moreQ({ id: 'p8', x: 238, d: 157, n2: 'Ben', story: 'Ali has 238 shells. Ben has 157 more than Ali. How many shells together?' }),
    letterQ({ id: 'p9', op: '−', a: 587, b: 245 }),
    letterQ({ id: 'p10', op: '+', W: 921, p: 384 }),
    backwardQ({ id: 'p11', m: 215, s: 468, l: 37, label: 'Afternoon:', hint: 'Cups sold + cups left = all cups made.',
      story: 'A juice stand makes 215 cups in the morning and more in the afternoon. It sells 468 cups and has 37 left. How many cups were made in the afternoon?' }),
    boxesQ({ id: 'p12', n: 9, s1: 2, s2: 4, label: 'Pencils left:', story: 'A shop has 9 boxes of 100 pencils. It sells 2 boxes in May and 4 in June. How many pencils are left?' }),
    storyQ({ id: 'p13', x: 125, y: 340, z: 212, who: 'A shop', things: 'hats', seed: 13 }),
    { id: 'p14', type: 'explain', skill: 'reason', prompt: 'How can you make sense of a two-step problem?',
      parent: 'Parent marks. Any reasonable answer.',
      listenFor: ['Find what the question asks and what you need first.', 'Draw a bar diagram and use a letter for each unknown; check the answer makes sense.'],
      explanation: 'Find what the question asks. Decide what you need to know first. Draw a bar diagram and use a letter for each unknown.' }
  ];
  const parentTips = { p3: 'Draw it on paper first.', p5: 'Draw both bar diagrams.', p7: 'Which order did you use?', p13: 'Make up your own story for this diagram.' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = q.parent || parentTips[q.id]; });

  const bank = [
    ppwEqQ({ id: 'o1', p: 280, q: 435, seed: 21 }),
    cmpEqQ({ id: 'o2', W: 836, P: 609, seed: 22 }),
    diagramForQ({ id: 'o3', W: 803, n: 456, kind: 'sub', seed: 23 }),
    diagramForQ({ id: 'o4', W: 820, n: 300, kind: 'add', seed: 24 }),
    addThenQ({ id: 'o5', x: 326, y: 488, T: 439, more: false, la: 'a = miles biked in all:', lb: 'b = miles Leo biked:',
      story: 'Two friends biked 326 miles in spring and 488 in fall. Maya biked 439 of the miles. Leo biked the rest. How many did Leo bike?' }),
    spendQ({ id: 'o6', M: 164, c1: 118, c2: 27, story: 'Tom has $164. He buys a game for $118 and batteries for $27. How much is left?' }),
    moreQ({ id: 'o7', x: 214, d: 165, n2: 'Paul', story: 'Rita has 214 stamps. Paul has 165 more than Rita. How many stamps together?' }),
    letterQ({ id: 'o8', op: '−', a: 674, b: 352 }),
    letterQ({ id: 'o9', op: '+', W: 905, p: 467 }),
    backwardQ({ id: 'o10', m: 263, s: 512, l: 46, label: 'Afternoon:', story: 'A farm stand picks 263 apples in the morning and more in the afternoon. It sells 512 and has 46 left. How many were picked in the afternoon?' }),
    boxesQ({ id: 'o11', n: 9, s1: 3, s2: 4, label: 'Oranges left:', story: 'A store had 9 crates of 100 oranges. It sold 3 crates Monday and 4 crates Tuesday. How many oranges are left?' }),
    storyQ({ id: 'o12', x: 208, y: 315, z: 146, who: 'A bakery', things: 'pies', seed: 32 })
  ];

  const testItems = [
    ppwEqQ({ id: 't1', p: 345, q: 290 }),
    cmpEqQ({ id: 't2', W: 914, P: 658 }),
    diagramForQ({ id: 't3', W: 640, n: 275, kind: 'sub', seed: 43 }),
    diagramForQ({ id: 't4', W: 900, n: 150, kind: 'add', seed: 44 }),
    addThenQ({ id: 't5', x: 318, y: 157, T: 600, more: true, la: 'a = shells she has now:', lb: 'b = shells she still needs:',
      story: 'Jada collects 318 shells, then 157 more. She wants 600 shells for a craft. How many more does she need?' }),
    boxesQ({ id: 't6', n: 7, s1: 2, s2: 3, label: 'Cups left:', story: 'A shop has 7 boxes of 100 cups. It sells 2 boxes Saturday and 3 Sunday. How many cups are left?' }),
    spendQ({ id: 't7', M: 260, c1: 176, c2: 38, story: 'Eva has $260. She buys shoes for $176 and socks for $38. How much is left?' }),
    moreQ({ id: 't8', x: 342, d: 129, n2: 'Kim', story: 'Jon has 342 marbles. Kim has 129 more than Jon. How many marbles together?' }),
    letterQ({ id: 't9', op: '−', a: 768, b: 425 }),
    letterQ({ id: 't10', op: '+', W: 846, p: 279 }),
    backwardQ({ id: 't11', m: 286, s: 545, l: 61, label: 'Later:', story: 'A popcorn stand pops 286 bags in the morning and more later. It sells 545 bags and has 61 left. How many bags were popped later?' }),
    storyQ({ id: 't12', x: 132, y: 247, z: 115, who: 'A farm', things: 'pumpkins' })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** Two-Step Problems Test: the same 12 questions; choice order changes with each attempt (diagram letters stay with their pictures). */
  function twoStepTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => ((p.kind === 'choice' && !['A,B,C', 'Yes,No'].includes(p.choices.join())) || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-12'] = {
    id: '2-12',
    storageKey: 'mathbook:v2:lesson-2-12',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-12',
    title: 'Solve Two-Step Problems',
    subtitle: 'Bar diagrams and letters for unknowns',
    objective: 'I can use bar diagrams and equations with letters to solve two-step problems.',
    parentLearn: {
      goal: [
        'Use a letter (a, b, m, k, t) for an unknown number.',
        'Read part-part-whole bar diagrams (bracket for the whole) and compare diagrams (dashed missing piece).',
        'Write an equation for a bar diagram, and pick the bar diagram for an equation.',
        'Solve two-step problems: add then subtract; spend twice; more than, then together; work backward; groups of 100.',
        'Solve equations with the letter on either side (m = 456 − 236; 867 = 235 + k).',
        'Make sense of a two-step problem: what to find first.'
      ],
      words: [
        { term: 'Two-step problem', meaning: 'A problem you solve with two equations, one after the other.' },
        { term: 'Unknown', meaning: 'The number we need to find.' },
        { term: 'Letter for the unknown', meaning: 'A letter like a or b that stands for the unknown number.' },
        { term: 'Bar diagram', meaning: 'Bars that show how the numbers fit together.' },
        { term: 'Whole / parts', meaning: 'The parts together make the whole.' },
        { term: 'Equation', meaning: 'A number sentence with an equal sign.', example: '246 + 131 = a' }
      ],
      demoVisual: fig(ppw([246, 131], [246, 131], 'a')),
      demonstrate: [
        'Max\'s sticker story: draw 246 | 131 with a bracket a above: 246 + 131 = a = 377.',
        'Then draw a 500 bar with 377 under it and a dashed b: 500 − 377 = b = 123.',
        'Book example: Lea 235 + 112 = 347; 475 − 347 = 128.',
        'Ask your child to say the story back and point to each letter.'
      ],
      ask: ['"What do we know? What do we need?"', '"What do we find first?"', '"Which number is the whole?"', '"Does the answer make sense?"'],
      checklist: [
        'Reads and writes equations for both kinds of bar diagram.',
        'Picks the diagram for an equation.',
        'Solves equations with the letter on either side.',
        'Solves add-then-subtract, spend-twice, more-than-together, work-backward and groups-of-100 problems.',
        'Matches a story to a diagram, and scores 90% or higher on the Two-Step Problems Test.'
      ]
    },
    mistakes: [
      'Doing only one step (answering 383 instead of 117). Ask: "Did you answer the question that was asked?"',
      'Adding when the story compares (500 + 377). Use the compare diagram: the dashed piece is missing.',
      '"More than" read as the total (Raj = 128). Raj has Amy\'s amount and 128 more.',
      'Work backward: subtracting 43 from 497 instead of adding. Say: "Eaten and left together are everything that was picked."',
      'Groups of 100: answering in boxes (3) instead of crayons (300).',
      'Letter on the right side (812 = 345 + k). The equal sign means "the same as".'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How can you make sense of a two-step problem?',
        idea: 'Find what the question asks. Decide what you need to know first. Draw a bar diagram and use a letter for each unknown.'
      }
    },
    skills: {
      diagram: 'Bar diagrams and equations',
      letters: 'Solving for a letter',
      twostep: 'Two-step problems',
      backward: 'Working backward',
      sense: 'Making sense of a problem',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Two-Step Problems', blurb: 'All 12 practice questions: bar diagrams and equations, letters, two-step stories, working backward, and making sense.', ids: bank.map((q) => q.id) }],
    tests: {
      twostep: { id: 'twostep', title: 'Two-Step Problems Test', questions: 12, blurb: 'Bar diagrams, letters, and two-step problems.', generate: twoStepTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO
  };
})(typeof window !== 'undefined' ? window : globalThis);
