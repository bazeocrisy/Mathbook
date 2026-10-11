/*
 * Mathbook — Chapter 2, Lesson 2-11: Fluently Subtract within 1,000
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-11.md (with the batch-C review fixes C-5, C-10…C-13, C-15).
 * Book methods (p. 76): decompose the number you take away; adjust BOTH numbers by the same amount; use a related
 * addition equation (count up); choose an efficient strategy; ignore extra information. The keep-the-difference pair
 * is the shared chain preset 'adjust' with op '−' (any pair that keeps the difference; `show` gives the asked-for pair).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-11.test.js.
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
  const minus = (a, b) => `${fmt(a)} − ${fmt(b)}`;
  /** Steps for a − parts: ["564 − 100 = 464", …]. */
  function steps(a, parts) { let c = a; return parts.map((p) => { const t = `${minus(c, p)} = ${fmt(c - p)}`; c -= p; return t; }); }
  /** Counting-up jumps from p to w (to a ten, a hundred if on the way, then w). */
  function jumps(p, w) {
    const out = []; let cur = p;
    const ten = Math.ceil(cur / 10) * 10; if (ten > cur && ten <= w) { out.push([cur, ten]); cur = ten; }
    const hun = Math.ceil(cur / 100) * 100; if (hun > cur && hun <= w) { out.push([cur, hun]); cur = hun; }
    if (cur < w) out.push([cur, w]);
    return out;
  }
  function countUp(p, w) {
    const J = jumps(p, w);
    return `${J.map(([x, y]) => `${fmt(x)} + ${fmt(y - x)} = ${fmt(y)}`).join(', ')}.` + (J.length > 1 ? ` ${J.map(([x, y]) => fmt(y - x)).join(' + ')} = ${fmt(w - p)}.` : '');
  }
  /** Adjust a − b so b is the next ten (or hundred when it ends in 9x/98/99): both up by k. */
  function friendly(a, b) {
    const k = b % 100 >= 95 ? 100 - (b % 100) : b % 10 ? 10 - (b % 10) : 0;
    return { k, na: a + k, nb: b + k };
  }

  /** True when a number the child must type is printed in the question's own text (not a figure or table). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num' && !p.fromStory) nums.push(p.answer); });
    if (q.type === 'chain') nums.push(q.a - q.b);
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** Decompose the number you take away: one box per step. o: { id, a, b, parts?: [..] (default place values) } */
  function decomposeQ(o) {
    const { a, b } = o;
    const parts = o.parts || split(b).filter(Boolean);
    let cur = a;
    const P = parts.map((p, k) => { cur -= p; return { kind: 'num', label: k ? `then − ${fmt(p)} =` : `${minus(a, p)} =`, answer: cur }; });
    return {
      id: o.id, type: 'parts', skill: o.skill || 'decompose',
      prompt: o.prompt || `Find ${minus(a, b)}. Take away the hundreds, then the tens, then the ones.`,
      parts: P,
      hint: o.hint || `First take away the hundreds of ${fmt(b)}. Then the tens. Then the ones.`,
      explanation: `${fmt(b)} = ${parts.map(fmt).join(' + ')}. ${steps(a, parts).join(', ')}. So ${minus(a, b)} = ${fmt(a - b)}.`
    };
  }
  /** Adjust both numbers the same amount (keep-the-difference pair). o: { id, a, b, prompt?, hint? } */
  function adjustQ(o) {
    const { a, b } = o, s = friendly(a, b);
    return {
      id: o.id, type: 'chain', preset: 'adjust', a, b, op: '−', skill: 'adjust', show: [s.na, s.nb],
      prompt: o.prompt || `Add the same amount to both numbers so ${fmt(b)} becomes ${fmt(s.nb)}. Then find ${minus(a, b)}.`,
      labels: [`${fmt(a)} becomes`, `${fmt(b)} becomes`, 'Difference'],
      hint: o.hint || `How much does ${fmt(b)} need to reach ${fmt(s.nb)}? Add that much to ${fmt(a)}, too.`,
      explanation: `Add ${s.k} to both: ${minus(s.na, s.nb)} = ${fmt(a - b)}. Adding the same amount to both numbers keeps the difference the same, like sliding both ends of a ruler. (In addition, one goes up and one goes down. In subtraction, both move the same way.)`
    };
  }
  /** Related addition equation, then ?. o: { id, a, b, seed?, r? } */
  function relatedQ(o) {
    const { a, b } = o;
    const right = `${fmt(b)} + ? = ${fmt(a)}`;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'related',
      prompt: o.prompt || `${minus(a, b)} = ?. Use a related addition equation.`,
      parts: [
        { kind: 'choice', label: `Which addition equation is related to ${minus(a, b)} = ?`, answer: right, choices: order(o, [right, `${fmt(a)} + ${fmt(b)} = ?`, `${fmt(a)} + ? = ${fmt(b)}`]) },
        { kind: 'num', label: '? =', answer: a - b }
      ],
      hint: o.hint || `Start at ${fmt(b)} and count up to ${fmt(a)}.`,
      explanation: `${right}. Count up: ${countUp(b, a)} Check: ${fmt(b)} + ${fmt(a - b)} = ${fmt(a)}.`
    };
  }
  /** Find a − b (any strategy). o: { id, a, b, skill?, prompt?, label?, hint?, lead? } */
  function subQ(o) {
    const { a, b } = o, s = friendly(a, b);
    const adj = s.k && s.k <= 5 && s.nb <= 999 ? ` Or adjust: ${minus(s.na, s.nb)} = ${fmt(a - b)}.` : '';
    return {
      id: o.id, type: 'parts', skill: o.skill || 'subtract',
      prompt: o.prompt || `${minus(a, b)} = ___`,
      parts: [{ kind: 'num', label: o.label || 'The blank is', answer: a - b }],
      hint: o.hint || 'Decompose, adjust both numbers, or count up. Pick what is quick for you.',
      explanation: `${o.lead ? o.lead + ' ' : ''}Count up: ${countUp(b, a)}${adj}`
    };
  }
  /** Which ways give the right answer? o: { id, a, b, seed?, r? } */
  function waysQ(o) {
    const { a, b } = o, s = friendly(a, b);
    const parts = split(b).filter(Boolean);
    const right = [minus(s.na, s.nb), `${fmt(a)} − ${parts.map(fmt).join(' − ')}`, `${fmt(b)} + ? = ${fmt(a)}`];
    const wrong = [minus(a, s.nb), `Decompose ${fmt(a)} and take its parts away from ${fmt(b)}`];
    return {
      id: o.id, type: 'parts', skill: 'strategy',
      prompt: o.prompt || `Which ways give the right answer for ${minus(a, b)}? Choose all. Then find the difference.`,
      parts: [
        { kind: 'multi', label: 'Ways that work (choose all):', answer: right, choices: order(o, right.concat(wrong)) },
        { kind: 'num', label: `${minus(a, b)} =`, answer: a - b }
      ],
      hint: o.hint || 'When you adjust, change both numbers. Always take away from the bigger number.',
      explanation: `${minus(s.na, s.nb)} = ${fmt(a - b)} (both up ${s.k}). ${steps(a, parts).join(', ')}. ${fmt(b)} + ${fmt(a - b)} = ${fmt(a)}. ` +
        `${minus(a, s.nb)} = ${fmt(a - s.nb)}: only one number changed. Decomposing ${fmt(a)} and taking it from ${fmt(b)} is backward.`
    };
  }
  /** Two named strategies: both work. o: { id, a, b, names: [x, y], adj: [na, nb], seed? } */
  function twoWaysQ(o) {
    const { a, b } = o, right = 'Both work. They get the same answer.';
    return {
      id: o.id, type: 'parts', skill: 'strategy',
      prompt: `For ${minus(a, b)}, ${o.names[0]} writes ${minus(o.adj[0], o.adj[1])}. ${o.names[1]} writes ${fmt(b)} + ? = ${fmt(a)}. Which strategy works?`,
      parts: [
        { kind: 'choice', label: 'Which strategy works?', answer: right, choices: order(o, [right, `Only ${o.names[0]}'s works.`, `Only ${o.names[1]}'s works.`, 'Neither works.']) },
        { kind: 'num', label: `${minus(a, b)} =`, answer: a - b }
      ],
      hint: o.hint || `${o.names[0]} changed both numbers by ${Math.abs(o.adj[0] - a)}. Did they move the same way?`,
      explanation: `${o.names[0]} changed both numbers the same way: ${minus(o.adj[0], o.adj[1])} = ${fmt(a - b)}. ${o.names[1]} counts up: ${countUp(b, a)} Both get ${fmt(a - b)}.`
    };
  }
  /** Decomposed the wrong number (book #11). o: { id, who, pron, a, b, seed? } */
  function backwardQ(o) {
    const { a, b } = o;
    const right = `No. Decompose ${fmt(b)} and take its parts away from ${fmt(a)}.`;
    return {
      id: o.id, type: 'parts', skill: 'strategy',
      prompt: `${o.who} says to find ${minus(a, b)} ${o.pron} can decompose ${fmt(a)} and subtract its parts from ${fmt(b)}. Do you agree?`,
      parts: [
        { kind: 'choice', label: 'Do you agree?', answer: right, choices: order(o, [right, 'Yes. You can take parts of either number away from the other.', 'Yes, if you start with the hundreds.']) },
        { kind: 'num', label: `${minus(a, b)} =`, answer: a - b }
      ],
      hint: o.hint || 'Which number are we taking away?',
      explanation: `We take ${fmt(b)} away from ${fmt(a)}, so decompose ${fmt(b)}: ${steps(a, split(b).filter(Boolean)).join(', ')}.`
    };
  }
  /** Table: how much farther is the last place than the first? o: { id, rows: [[place, miles] x3], prompt? } */
  function tableQ(o) {
    const first = o.rows[0], last = o.rows[o.rows.length - 1];
    return {
      id: o.id, type: 'parts', skill: 'apply',
      prompt: o.prompt || `How much farther is ${last[0]} than ${first[0]}?`,
      figure: { fig: 'table', title: o.title || 'Road Sign', head: ['Place', 'Miles'], rows: o.rows },
      parts: [{ kind: 'num', label: 'Miles farther:', answer: last[1] - first[1] }],
      hint: o.hint || 'Find the two distances you need. Farther means subtract.',
      explanation: `${last[0]} is ${fmt(last[1])} miles; ${first[0]} is ${fmt(first[1])} miles. ${minus(last[1], first[1])} = ${fmt(last[1] - first[1])}. Count up: ${countUp(first[1], last[1])}`
    };
  }
  /** Extra information + compare. o: { id, story, big, small, extra, label, seed? } */
  function extraQ(o) {
    return {
      id: o.id, type: 'parts', skill: 'apply', prompt: o.story,
      parts: [
        { kind: 'choice', label: 'Which number do you NOT need?', answer: fmt(o.extra), choices: order(o, [fmt(o.extra), fmt(o.small), fmt(o.big)]), compact: true },
        { kind: 'num', label: o.label, answer: o.big - o.small }
      ],
      hint: o.hint || 'Which two numbers does the question compare?',
      explanation: `Compare ${fmt(o.big)} and ${fmt(o.small)}: ${minus(o.big, o.small)} = ${fmt(o.big - o.small)}. ${fmt(o.extra)} is extra information. Count up: ${countUp(o.small, o.big)}`
    };
  }
  /** Two subtractions, then compare with 100. o: { id, story, total, s1, s2 } */
  function twoStepQ(o) {
    const left1 = o.total - o.s1, left = left1 - o.s2;
    return {
      id: o.id, type: 'parts', skill: 'apply', prompt: o.story,
      parts: [
        { kind: 'num', label: 'Left:', answer: left },
        { kind: 'choice', label: 'More than 100 left?', answer: left > 100 ? 'Yes' : 'No', choices: ['Yes', 'No'], compact: true }
      ],
      hint: o.hint || 'Subtract one, then the other. Then compare with 100.',
      explanation: `${minus(o.total, o.s1)} = ${fmt(left1)}. ${minus(left1, o.s2)} = ${fmt(left)}. ${fmt(left)} is ${left > 100 ? 'more' : 'less'} than 100, so ${left > 100 ? 'yes' : 'no'}.`
    };
  }

  // ---------- Learn: five steps ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const lines = (list) => fig({ fig: 'eqs', lines: list });
  const arrows = (a, b, na, nb) => fig({ fig: 'arrows', a, b, op: '−', to: [na, nb], result: a - b, tags: [`${na > a ? '+' : '−'}${Math.abs(na - a)}`, `${nb > b ? '+' : '−'}${Math.abs(nb - b)}`] });
  const DEMO = [564, 145, 419, 569, 150, 600, 359, 241, 599, 358, 357, 124, 233, 363, 130, 236, 543, 134, 409];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };

  function decomposeCheck(r) {
    const cross = r() < 0.5;
    for (;;) {
      const a = pv.randInt(r, 400, 989), b = pv.randInt(r, 111, a - 100);
      const [h, t, o] = split(b);
      if (!h || !t || !o || !ok(a, b, a - b)) continue;
      if (cross !== (b % 10 > a % 10)) continue;
      return decomposeQ({ id: 'learn-1', a, b });
    }
  }
  function adjustCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 300, 990), b = pv.randInt(r, 106, a - 40);
      const o = b % 10, k = 10 - o;
      if (o < 6 || a + k > 999 || !ok(a, b, a - b)) continue;
      return Object.assign(adjustQ({ id: 'learn-2', a, b }), { show: [a + k, b + k],
        prompt: `Add the same amount to both numbers so ${fmt(b)} becomes a whole ten. Then subtract.` });
    }
  }
  function relatedCheck(r) {
    for (;;) {
      const a = r() < 0.34 ? 100 * pv.randInt(r, 3, 9) : pv.randInt(r, 300, 950), b = pv.randInt(r, 100, a - 50);
      if (!ok(a, b, a - b)) continue;
      return relatedQ({ id: 'learn-3', a, b, r, prompt: `${minus(a, b)} = ?` });
    }
  }
  function waysCheck(r) {
    for (;;) {
      const b = pv.randInt(r, 111, 699), a = pv.randInt(r, b + 100, 989);
      const [h, t, o] = split(b);
      if (o < 7 || !h || !t || b + 10 > 999 || !ok(a, b, a - b)) continue;
      return waysQ({ id: 'learn-4', a, b, r });
    }
  }
  const PLACES = ['Ash Hill', 'Bay Town', 'Cedar Lake', 'Dove Park', 'Echo Bay', 'Fern Gap'];
  function storyCheck(r) {
    for (;;) {
      const d = [pv.randInt(r, 100, 200), pv.randInt(r, 201, 330), pv.randInt(r, 331, 450)];
      const T = 50 * pv.randInt(r, 10, 18), s1 = pv.randInt(r, 150, 450), s2 = pv.randInt(r, 120, 400);
      const left = T - s1 - s2;
      if (left < 20 || left > 200 || left === 100 || !ok(d[2] - d[0], left)) continue;
      const names = pv.shuffle(r, PLACES).slice(0, 3);
      const rows = names.map((n, k) => [n, d[k]]);
      return {
        id: 'learn-5', type: 'parts', skill: 'apply',
        prompt: `(1) How much farther is ${rows[2][0]} than ${rows[0][0]}? (2) You have ${fmt(T)} points. You spend ${fmt(s1)}, then ${fmt(s2)}. How many are left? Is it more than 100?`,
        figure: { fig: 'table', title: 'Road Sign', head: ['Place', 'Miles'], rows },
        parts: [
          { kind: 'num', label: 'Miles farther:', answer: d[2] - d[0] },
          { kind: 'num', label: 'Points left:', answer: left },
          { kind: 'choice', label: 'More than 100 left?', answer: left > 100 ? 'Yes' : 'No', choices: ['Yes', 'No'], compact: true }
        ],
        hint: 'Farther means subtract the smaller distance. For two spends, subtract one, then the other.',
        explanation: `${minus(d[2], d[0])} = ${fmt(d[2] - d[0])} miles. ${minus(T, s1)} = ${fmt(T - s1)}, ${minus(T - s1, s2)} = ${fmt(left)}: ${left > 100 ? 'more' : 'less'} than 100.`
      };
    }
  }

  const stepsL = [
    {
      id: 'decompose', kind: 'slides', title: 'Decompose the number you take away',
      explain: 'Break apart the number you take away. Take away the hundreds, then the tens, then the ones.',
      slides: [
        say('A school library lent <b>564</b> books in March. In April it lent <b>145 fewer</b>. How many books in April?') + say('<b>Fewer</b> means subtract: 564 − 145.'),
        fig({ fig: 'tree', n: 145, parts: [100, 40, 5] }) + say('Break 145 into 100 + 40 + 5. Take away one part at a time.'),
        lines(['564 − 100 = 464', { text: '464 − 40 = 424', hi: true }]),
        lines(['564 − 100 = 464', '464 − 40 = 424', '424 − 4 = 420', { text: '420 − 1 = 419', hi: true }]) + say('5 ones: take 4 first to land on a ten, then 1 more. <b>564 − 145 = 419</b>.')
      ],
      check: noLeak(decomposeCheck)
    },
    {
      id: 'adjust', kind: 'slides', title: 'Adjust both numbers',
      explain: 'Add (or take away) the same amount to BOTH numbers. The difference stays the same.',
      slides: [
        say('564 − 145. 145 is 5 away from 150.'),
        arrows(564, 145, 569, 150) + say('+5 and +5: <b>569 − 150 = 419</b>. Add the same amount to <b>both</b> numbers. The difference stays the same, like sliding both ends of a ruler.'),
        say('Remember: in <b>adding</b>, one number goes up and the other goes down. In <b>subtracting</b>, both move the same way.'),
        arrows(600, 359, 599, 358) + say('Across zeros: 600 − 359. Take 1 from both: <b>599 − 358 = 241</b>. No regrouping needed!')
      ],
      check: noLeak(adjustCheck)
    },
    {
      id: 'related', kind: 'slides', title: 'Use a related addition equation',
      explain: 'a − b = ? is the same question as b + ? = a. Count up from b.',
      slides: [
        say('564 − 145 = ? is the same as <b>145 + ? = 564</b>.'),
        fig({ fig: 'nline', open: true, minGap: 24, marks: [145, 150, 200, 564], hops: [{ from: 145, to: 150, text: '+5' }, { from: 150, to: 200, text: '+50' }, { from: 200, to: 564, text: '+364' }] }) +
          say('Count up: 145 + 5 = 150, 150 + 50 = 200, 200 + 364 = 564. Jumps: 5 + 50 + 364 = <b>419</b>.'),
        say('Check: 145 + 419 = 564 ✓.')
      ],
      check: noLeak(relatedCheck)
    },
    {
      id: 'choose', kind: 'slides', title: 'More than one way',
      explain: 'Decompose, adjust both numbers, or count up. All work. Pick what is quick for you, and always take away from the bigger number.',
      slides: [
        say('Is decomposing the <b>only</b> way to find 357 − 124?') + lines(['357 − 100 = 257', '257 − 20 = 237', '237 − 4 = 233']),
        arrows(357, 124, 363, 130) + say('Adjust: +6 both → 363 − 130 = 233. Count up: 124 + ? = 357 → 233. <b>No! Three ways, same answer.</b>'),
        say('Two children solve 173 − 138. One adjusts to 175 − 140. One writes 138 + ? = 173. Both get <b>35</b>. Pick the one that is quick for you.'),
        say('Mistake: Ray says to do 357 − 124 he can decompose 357 and take the parts away from 124. <b>That\'s backward!</b> We take 124 away from 357, so decompose 124.')
      ],
      check: noLeak(waysCheck)
    },
    {
      id: 'stories', kind: 'slides', title: 'Tables, extra information, two steps',
      explain: 'Find the numbers the question compares. Subtract. For two spends, subtract twice.',
      slides: [
        fig({ fig: 'table', title: 'Road Sign', head: ['Place', 'Miles'], rows: [['Elm Town', 124], ['Lake City', 217], ['Hill Park', 352]] }) +
          say('How much farther is Hill Park than Elm Town? Farther than means compare: subtract. 352 − 124 = <b>228</b>.'),
        say('Jen scored <b>286</b> points. That was <b>95</b> more than last time. Ali scored <b>431</b>. How many more did Ali score than Jen?') +
          say('We need 431 and 286. The 95 is extra. 431 − 286 = <b>145</b>.'),
        say('Kai has <b>600</b> points. He spends <b>275</b> and then <b>210</b>. Does he have more than 100 left?') + lines(['600 − 275 = 325', { text: '325 − 210 = 115', hi: true }]) + say('115 > 100, so <b>yes</b>.')
      ],
      check: noLeak(storyCheck)
    }
  ];

  // ---------- Practice Together (14), On My Own (15), Test (12) ----------
  const guided = [
    decomposeQ({ id: 'p1', a: 675, b: 243, hint: 'Hundreds, tens, ones of 243.' }),
    decomposeQ({ id: 'p2', a: 563, b: 125, parts: [100, 20, 3, 2], prompt: 'Find 563 − 125. Take away 100, then 20, then 3 to land on a ten, then 2.', hint: 'Take 3 to land on 440.' }),
    adjustQ({ id: 'p3', a: 623, b: 198, hint: '198 is 2 from 200.' }),
    relatedQ({ id: 'p4', a: 731, b: 256, seed: 4, hint: 'Count up from 256.' }),
    waysQ({ id: 'p5', a: 652, b: 117, seed: 5, hint: 'Adjust both numbers, not one.' }),
    twoWaysQ({ id: 'p6', a: 182, b: 147, names: ['Nina', 'Theo'], adj: [180, 145], seed: 6, hint: 'Nina took 2 from both.' }),
    backwardQ({ id: 'p7', who: 'Dev', pron: 'he', a: 358, b: 124, seed: 7 }),
    subQ({ id: 'p8', a: 528, b: 375, skill: 'apply', prompt: 'A farm has 528 chickens and 375 ducks. How many more chickens than ducks?', label: 'More chickens:', hint: 'How many more → subtract.' }),
    tableQ({ id: 'p9', rows: [['Lakeview', 147], ['Pine Hill', 219], ['Rock City', 365]] }),
    extraQ({ id: 'p10', big: 506, small: 318, extra: 125, seed: 10, label: 'How many more did Eli score?',
      story: 'Nora scored 318. That was 125 more than her first game. Eli scored 506. How many more did Eli score than Nora?' }),
    twoStepQ({ id: 'p11', total: 600, s1: 284, s2: 197, story: 'Leo has 600 tickets. He spends 284 on a toy car and 197 on a kite. He saves the rest. Does he save more than 100?' }),
    subQ({ id: 'p12', a: 500, b: 248, hint: 'Take 1 from both: 499 − 247.' }),
    subQ({ id: 'p13', a: 142, b: 57, hint: 'Count up from 57 to 60, to 100, to 142.' }),
    { id: 'p14', type: 'explain', skill: 'reason', prompt: 'How do you know if a subtraction strategy is efficient?',
      parent: 'Parent marks. Any reasonable answer.',
      listenFor: ['It has few steps and easy numbers.', 'If the number taken away is close to a ten or hundred, adjust. If the numbers are close together, count up.'],
      explanation: 'An efficient strategy has few steps and easy numbers.' }
  ];
  const parentTips = { p2: 'Why take 3 first?', p5: 'Which way would you choose? Why?', p11: 'Could you add 284 + 197 first?', p13: 'Could you also take 1 from both? 141 − 56.' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = q.parent || parentTips[q.id]; });

  const bank = [
    subQ({ id: 'o1', a: 869, b: 425 }),
    subQ({ id: 'o2', a: 643, b: 287 }),
    subQ({ id: 'o3', a: 815, b: 756 }),
    subQ({ id: 'o4', a: 153, b: 79 }),
    subQ({ id: 'o5', a: 725, b: 468, skill: 'apply', prompt: 'A race has 468 runners and 725 water bottles. How many more bottles than runners?', label: 'More bottles:' }),
    twoWaysQ({ id: 'o6', a: 161, b: 128, names: ['Kim', 'Raj'], adj: [163, 130], seed: 16 }),
    extraQ({ id: 'o7', big: 512, small: 389, extra: 115, seed: 17, label: 'How many more did Max score?',
      story: 'Ella scored 389 points. That was 115 more than her first try. Max scored 512. How many more did Max score than Ella?' }),
    subQ({ id: 'o8', a: 600, b: 457 }),
    subQ({ id: 'o9', a: 784, b: 342 }),
    tableQ({ id: 'o10', rows: [['Oak Falls', 124], ['Bear Lake', 207], ['Red Rock', 392]] }),
    backwardQ({ id: 'o11', who: 'Sara', pron: 'she', a: 476, b: 152, seed: 21 }),
    twoStepQ({ id: 'o12', total: 650, s1: 418, s2: 147, story: 'Zoe has 650 points. She uses 418 on a castle and 147 on a dragon. She saves the rest. Does she save more than 100?' }),
    // O13–O15 give the test's decompose (T1), adjust (T2) and related (T3) skills their own practice (new numbers).
    decomposeQ({ id: 'o13', a: 857, b: 423 }),
    adjustQ({ id: 'o14', a: 721, b: 396 }),
    relatedQ({ id: 'o15', a: 634, b: 278, seed: 25 })
  ];

  const testItems = [
    decomposeQ({ id: 't1', a: 784, b: 351 }),
    adjustQ({ id: 't2', a: 532, b: 297 }),
    relatedQ({ id: 't3', a: 812, b: 365 }),
    subQ({ id: 't4', a: 163, b: 84 }),
    subQ({ id: 't5', a: 700, b: 426 }),
    subQ({ id: 't6', a: 642, b: 485, skill: 'apply', prompt: 'A bakery made 642 muffins and 485 cookies. How many more muffins?', label: 'More muffins:' }),
    waysQ({ id: 't7', a: 743, b: 128 }),
    backwardQ({ id: 't8', who: 'Ian', pron: 'he', a: 569, b: 235 }),
    tableQ({ id: 't9', rows: [['Elm Park', 156], ['Fox Hill', 238], ['Stone Bay', 411]] }),
    extraQ({ id: 't10', big: 463, small: 276, extra: 98, label: 'How many more pages did Ana read?',
      story: 'Ty read 276 pages. That was 98 more than last month. Ana read 463. How many more did Ana read than Ty?' }),
    twoStepQ({ id: 't11', total: 700, s1: 365, s2: 218, story: 'Ben has 700 coins. He spends 365 on a hat and 218 on a sword. Does he save more than 100?' }),
    { id: 't12', type: 'parts', skill: 'strategy', prompt: 'Is decomposing the only way to find 456 − 139?',
      parts: [
        { kind: 'choice', label: 'Is it the only way?', answer: 'No. You can also adjust both numbers (457 − 140) or count up (139 + ? = 456).', choices: ['No. You can also adjust both numbers (457 − 140) or count up (139 + ? = 456).', 'Yes. Decomposing is the only way.', 'No. You can add 456 + 139.'] },
        { kind: 'num', label: '456 − 139 =', answer: 317 }
      ],
      explanation: 'Adjust: add 1 to both, 457 − 140 = 317. Count up: 139 + 1 = 140, 140 + 60 = 200, 200 + 256 = 456; 1 + 60 + 256 = 317.' }
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  function subtractTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => ((p.kind === 'choice' && !p.compact) || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-11'] = {
    id: '2-11',
    storageKey: 'mathbook:v2:lesson-2-11',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-11',
    title: 'Fluently Subtract within 1,000',
    subtitle: 'Decompose, adjust, or count up: choose a strategy',
    objective: 'I can subtract 3-digit numbers by decomposing, by adjusting both numbers, or by using a related addition equation, and choose a strategy that works well for me.',
    parentLearn: {
      goal: [
        'Subtract by decomposing the number being taken away (hundreds, tens, ones; split the ones to land on a ten).',
        'Subtract by adjusting BOTH numbers by the same amount so the number taken away becomes a ten or hundred.',
        'Subtract with a related addition equation by counting up.',
        'Know that more than one strategy works, choose an efficient one, and spot "decompose the bigger number" as backward.',
        'Word problems: fewer, how many more, a table, extra information, two subtractions compared with 100.'
      ],
      words: [
        { term: 'Difference', meaning: 'The answer to a subtraction problem.' },
        { term: 'Decompose', meaning: 'Break a number into parts.', example: '145 → 100 + 40 + 5' },
        { term: 'Adjust', meaning: 'Change a number to make it easier. In subtraction, change both numbers by the same amount.' },
        { term: 'Related addition equation', meaning: 'An addition equation with the same numbers.', example: '145 + ? = 564' },
        { term: 'Efficient', meaning: 'Quick and easy for you, with few steps.' },
        { term: 'Fewer', meaning: 'Less. "145 fewer" means take 145 away.' },
        { term: 'Extra information', meaning: 'A number in a story you do not need.' }
      ],
      demoVisual: fig({ fig: 'arrows', a: 564, b: 145, op: '−', to: [569, 150], result: 419, tags: ['+5', '+5'] }),
      demonstrate: [
        '564 − 145 three ways. (1) Take away 100, 40, 4, 1: 464, 424, 420, 419.',
        '(2) Add 5 to both: 569 − 150 = 419.',
        '(3) Count up: 145 + ? = 564: 5 + 50 + 364 = 419.',
        'Book example: 543 − 134 = 409 (Sunday\'s 248 tickets are extra information).'
      ],
      ask: ['"Which number are we taking away?"', '"Is it close to a ten or hundred?"', '"If you change one number, what must you do to the other?"', '"Which numbers do we need?"', '"Is it more than 100?"'],
      checklist: [
        'Decomposes the number subtracted.',
        'Adjusts both numbers the same way.',
        'Uses a related addition equation.',
        'Recognizes valid and invalid strategies.',
        'Reads a table and ignores extra information.',
        'Solves two-step comparisons with 100, and scores 90% or higher on the Fluently Subtract Test.'
      ]
    },
    mistakes: [
      'Adjusting in opposite directions (564 + 5 and 145 − 5). That is the addition rule; in subtraction move both the same way.',
      'Adjusting only one number (652 − 120 for 652 − 117): the answer is off by 3.',
      'Subtracting from the wrong number, or smaller-from-larger in each place (153 − 79 → 126).',
      '424 − 5 done as 421 (taking 4 from 5). Correct: 419.',
      'Using extra information. Ask: "Which two numbers does the question compare?"',
      'Two steps: stopping after one subtraction.'
    ],
    seeIt: {
      steps: stepsL,
      reflection: {
        prompt: 'How do you decide if a subtraction strategy is efficient?',
        idea: 'It has few steps and easy numbers. If the number taken away is close to a ten or hundred, adjust. If the numbers are close together, count up.'
      }
    },
    skills: {
      decompose: 'Decompose to subtract',
      adjust: 'Adjust both numbers',
      related: 'Related addition',
      subtract: 'Subtract 3-digit numbers',
      strategy: 'Choosing and checking strategies',
      apply: 'Word problems',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Fluently Subtract', blurb: 'All 15 practice questions: differences, decomposing, adjusting, counting up, strategies, and word problems.', ids: bank.map((q) => q.id) }],
    tests: {
      subtract: { id: 'subtract', title: 'Fluently Subtract Test', questions: 12, blurb: 'Decompose, adjust, count up, choose strategies, and word problems.', generate: subtractTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO
  };
})(typeof window !== 'undefined' ? window : globalThis);
