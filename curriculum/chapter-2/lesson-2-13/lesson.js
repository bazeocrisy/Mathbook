/*
 * Mathbook — Chapter 2, Lesson 2-13: Compare 4-Digit Numbers
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-13.md (with the batch-D review fixes D-1, D-5, D-6, D-7).
 * Book methods (p. 84): a number line (farther right is greater) and place value (compare from the thousands; the
 * first place that differs decides); =, ≠, <, >. Comparisons use the shared `symbol` part; reasons name a place,
 * never "greater"/"less" (D-7); number lines are F5 with lettered dots; place-value charts are F10.
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-13.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const PLACES = ['Thousands', 'Hundreds', 'Tens', 'Ones'];
  const NO_PLACE = 'No place — every digit is the same';
  const NAMES_SYM = { '<': 'is less than', '>': 'is greater than', '=': 'is equal to', '≠': 'is not equal to' };
  /** Four digits (a 3-digit number has 0 thousands). */
  const digits = (n) => [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  /** Index of the first place where a and b differ, or -1. */
  const firstDiff = (a, b) => { const A = digits(a), B = digits(b); return A.findIndex((d, i) => d !== B[i]); };
  const sym = (a, b) => (a > b ? '>' : a < b ? '<' : '=');
  /** "Thousands 5 = 5, hundreds 3 = 3, tens 6 > 1." */
  function why(a, b) {
    const A = digits(a), B = digits(b), k = firstDiff(a, b);
    if (k < 0) return `Every place has the same digit, so ${fmt(a)} = ${fmt(b)}.`;
    const same = PLACES.slice(0, k).map((p, i) => `${p.toLowerCase()} ${A[i]} = ${B[i]}`);
    const lead = same.length ? cap(same.join(', ')) + '. ' : '';
    const unit = ['thousand', 'hundred', 'ten', 'one'][k], val = (d) => `${d} ${unit}${d === 1 ? '' : 's'}`, v = (d) => fmt(d * 10 ** (3 - k));
    return `${lead}${PLACES[k]}: ${val(A[k])} ${A[k] > B[k] ? '>' : '<'} ${val(B[k])}${k < 3 ? ` (${v(A[k])} ${A[k] > B[k] ? '>' : '<'} ${v(B[k])})` : ''}, so ${fmt(a)} ${sym(a, b)} ${fmt(b)}.`;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /** True when a number the child must type is printed. (Comparisons have no typed numbers.) */
  const leaks = () => false;

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);
  const decides = (a, b) => ({ kind: 'choice', label: 'Which place decides?', answer: PLACES[firstDiff(a, b)], choices: PLACES.slice(), compact: true });
  const firstDifferent = (a, b) => { const k = firstDiff(a, b); return { kind: 'choice', label: 'Which place is different first?', answer: k < 0 ? NO_PLACE : PLACES[k], choices: PLACES.concat(NO_PLACE) }; };

  /** Tick labels; on phones only the first, middle and last stay (the rest are is-wide-only) so long labels never collide. */
  const marks = (vals) => vals.map((v, i) => ({ v, text: fmt(v), cls: i === 0 || i === vals.length - 1 || i === Math.floor((vals.length - 1) / 2) ? '' : 'is-wide-only' }));
  /** Number line with dots A and B. o: { id, a, b, min, max, step, ask (number asked), labelsEvery? } */
  function lineQ(o) {
    const { a, b, min, max, step } = o;
    const major = []; for (let v = min; v <= max; v += step) major.push(v);
    const lblEvery = o.labelsEvery || (major.length > 6 ? 2 : 1);
    const [left, right] = a < b ? [a, b] : [b, a];
    const leftLabel = o.flip ? 'B' : 'A', rightLabel = o.flip ? 'A' : 'B';
    const labelOf = (v) => (v === left ? leftLabel : rightLabel);
    const S = sym(a, b);
    return {
      id: o.id, type: 'parts', skill: o.skill,
      prompt: o.prompt || `The dots show ${fmt(a)} and ${fmt(b)}.`,
      figure: { fig: 'nline', min, max, minor: o.minor || step, major, below: marks(major.filter((_, i) => i % lblEvery === 0 || i === major.length - 1)), points: [{ v: left, text: leftLabel }, { v: right, text: rightLabel }] },
      parts: [
        { kind: 'choice', label: `Which dot shows ${fmt(o.ask)}?`, answer: labelOf(o.ask), choices: ['A', 'B'], compact: true },
        { kind: 'symbol', left: a, right: b, choices: ['<', '>', '='], answer: S, label: 'Choose the symbol that makes it true.' }
      ],
      hint: o.hint || 'Find the two tick marks each number is between. The number farther right is greater.',
      explanation: `${fmt(a)} and ${fmt(b)}: ${fmt(right)} is farther right, so ${fmt(a)} ${S} ${fmt(b)} (${fmt(a)} ${NAMES_SYM[S]} ${fmt(b)}).`
    };
  }
  /** < / > with "Which place decides?" (or without a reason). */
  function cmpQ(o) {
    const { a, b } = o;
    const parts = [{ kind: 'symbol', left: a, right: b, choices: ['<', '>', '='], answer: sym(a, b), label: 'Choose the symbol that makes it true.' }];
    if (o.reason) parts.push(decides(a, b));
    return {
      id: o.id, type: 'parts', skill: o.skill, prompt: o.prompt || `Compare ${fmt(a)} and ${fmt(b)}.`, parts,
      hint: o.hint || 'Start at the left. Find the first place where the digits are different.',
      explanation: (a < 1000 || b < 1000 ? `${fmt(Math.min(a, b))} has 0 thousands. ` : '') + why(a, b)
    };
  }
  /** = / ≠ with "Which place is different first?". */
  function eqQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'parts', skill: 'equal', prompt: o.prompt || `Are ${fmt(a)} and ${fmt(b)} equal?`,
      parts: [
        { kind: 'symbol', left: a, right: b, choices: ['=', '≠'], answer: a === b ? '=' : '≠', label: 'Choose = or ≠.' },
        firstDifferent(a, b)
      ],
      hint: o.hint || 'Check every place, from left to right.',
      explanation: why(a, b) + (a === b ? '' : ` So ${fmt(a)} ≠ ${fmt(b)}.`)
    };
  }
  /** 3-digit vs 4-digit with someone's mistake. o: { id, small, big, who, smallFirst? , seed?, r? } */
  function digitsErrQ(o) {
    const { small, big } = o;
    const [a, b] = o.smallFirst ? [small, big] : [big, small];
    const s0 = String(small)[0], b0 = String(big)[0];
    const right = `No. ${fmt(small)} has 0 thousands. Compare the thousands first.`;
    return {
      id: o.id, type: 'parts', skill: 'digits', prompt: `Compare ${fmt(a)} and ${fmt(b)}.`,
      parts: [
        { kind: 'symbol', left: a, right: b, choices: ['<', '>', '='], answer: sym(a, b), label: 'Choose the symbol that makes it true.' },
        { kind: 'choice', label: `${o.who} says ${fmt(small)} > ${fmt(big)} because ${s0} > ${b0}. Is ${o.who} right?`, answer: right, choices: order(o, [right, 'Yes. Compare the first digits.', `Yes. ${s0} is bigger than ${b0}.`]) }
      ],
      hint: o.hint || 'How many thousands does each number have?',
      explanation: `${fmt(small)} is 0,${String(small).padStart(3, '0')}: 0 thousands. ${fmt(big)} has ${b0} thousands, so ${fmt(a)} ${sym(a, b)} ${fmt(b)}. ${o.who} compared hundreds with thousands.`
    };
  }
  /** Order three numbers: Least / Middle / Greatest. */
  function orderQ(o) {
    const sorted = o.nums.slice().sort((x, y) => x - y);
    const ch = o.nums.map(fmt);
    const parts = ['Least:', 'Middle:', 'Greatest:'].map((label, i) => ({ kind: 'choice', label, answer: fmt(sorted[i]), choices: ch.slice() }));
    if (o.ask) parts.push({ kind: 'choice', label: o.ask, answer: fmt(sorted[2]), choices: ch.slice() });
    return {
      id: o.id, type: 'parts', skill: 'order', prompt: o.prompt || `Order from least to greatest: ${ch.join(', ')}.`, parts,
      hint: o.hint || 'Find the least first by looking at the thousands. Then compare the two that are left.',
      explanation: `${why(sorted[0], sorted[1])} ${why(sorted[1], sorted[2])} So ${sorted.map(fmt).join(' < ')}.`
    };
  }
  /** Which is more (real world). o: { id, a, b, unit, thing, q } */
  function realQ(o) {
    const { a, b } = o, more = Math.max(a, b);
    const opt = o.opt || ((n) => `the ${fmt(n)} ${o.unit} ${o.thing}`);
    return {
      id: o.id, type: 'parts', skill: 'real', prompt: o.prompt,
      parts: [
        { kind: 'choice', label: o.q, answer: opt(more), choices: order(o, [opt(a), opt(b)]) },
        { kind: 'symbol', left: a, right: b, choices: ['<', '>', '='], answer: sym(a, b), label: 'Choose the symbol that makes it true.' }
      ],
      hint: o.hint || 'Compare the thousands first.',
      explanation: why(a, b)
    };
  }

  // ---------- Learn: five steps ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const chart = (a, b, focus) => fig({ fig: 'cmp', a, b, focus });
  const DEMO = [2371, 2436, 5362, 5318, 6207, 6270, 3158, 958, 4572, 3986, 4519, 1324, 1249];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));

  function lineCheck(r) {
    for (;;) {
      const L = 500 * pv.randInt(r, 2, 17);
      const a = pv.randInt(r, L + 1, L + 499), b = pv.randInt(r, L + 1, L + 499);
      if (a % 10 === 0 || b % 10 === 0 || Math.abs(a - b) < 40 || !ok(a, b)) continue;
      return lineQ({ id: 'learn-1', skill: 'line', a, b, min: L, max: L + 500, step: 100, minor: 10, ask: a, flip: r() < 0.5, labelsEvery: 1 });
    }
  }
  function placeCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 1000, 9999), P = pv.randInt(r, 0, 3);
      const D = digits(a).slice();
      let nd; do { nd = pv.randInt(r, P === 0 ? 1 : 0, 9); } while (nd === D[P]);
      D[P] = nd;
      if (P < 3 && r() < 0.6) { const Q = pv.randInt(r, P + 1, 3); D[Q] = pv.randInt(r, 0, 9); }
      const b = D[0] * 1000 + D[1] * 100 + D[2] * 10 + D[3];
      if (b < 1000 || b === a || !ok(a, b)) continue;
      return { id: 'learn-2', type: 'parts', skill: 'pv', prompt: `Compare ${fmt(a)} and ${fmt(b)}.`,
        parts: [decides(a, b), { kind: 'symbol', left: a, right: b, choices: ['<', '>', '='], answer: sym(a, b), label: 'Choose the symbol that makes it true.' }],
        hint: 'Start at the left. Find the first place where the digits are different.', explanation: why(a, b) };
    }
  }
  function equalCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 1000, 9999);
      let b = a;
      if (r() < 0.5) {
        const D = digits(a), i = pv.randInt(r, 0, 2);
        if (D[i] === D[i + 1] || (i === 0 && D[1] === 0)) continue;
        [D[i], D[i + 1]] = [D[i + 1], D[i]];
        b = D[0] * 1000 + D[1] * 100 + D[2] * 10 + D[3];
      }
      if (!ok(a, b)) continue;
      return eqQ({ id: 'learn-3', a, b });
    }
  }
  const WHO = ['Max', 'Ivy', 'Leo', 'Ana', 'Sam', 'Nia'];
  function digitsCheck(r) {
    for (;;) {
      const big4 = pv.randInt(r, 1000, 8999), small = pv.randInt(r, 100, 999);
      if (Number(String(small)[0]) <= Math.floor(big4 / 1000) || !ok(big4, small)) continue;
      return digitsErrQ({ id: 'learn-4', small, big: big4, who: pv.pick(r, WHO), smallFirst: r() < 0.5, r });
    }
  }
  const TRAILS = [['trails', 'Which trail is longest?'], ['rivers', 'Which river is longest?'], ['roads', 'Which road is longest?']];
  function orderCheck(r) {
    for (;;) {
      const t = pv.randInt(r, 2, 8), h = pv.randInt(r, 0, 9);
      const x = t * 1000 + h * 100 + pv.randInt(r, 0, 99), y = t * 1000 + h * 100 + pv.randInt(r, 0, 99);
      const z = (r() < 0.5 ? t - 1 : t + 1) * 1000 + pv.randInt(r, 0, 999);
      if (Math.floor(x / 10) % 10 === Math.floor(y / 10) % 10 || z < 1000 || z > 9999 || !ok(x, y, z)) continue;
      const nums = pv.shuffle(r, [x, y, z]);
      const [things, q] = pv.pick(r, TRAILS);
      return orderQ({ id: 'learn-5', nums, ask: q, prompt: `Three ${things} are ${nums.map((n) => fmt(n) + ' m').join(', ')} long. Order them from least to greatest.` });
    }
  }

  const steps = [
    {
      id: 'number-line', kind: 'slides', title: 'Compare on a number line',
      explain: 'Numbers get bigger as you go right. The number farther right is greater.',
      slides: [
        say('Nia has <b>2,436</b> stickers. Omar has <b>2,371</b>. Who has more?') + fig({ fig: 'nline', min: 2000, max: 2500, minor: 10, major: [2000, 2100, 2200, 2300, 2400, 2500], below: marks([2000, 2100, 2200, 2300, 2400, 2500]) }),
        fig({ fig: 'nline', min: 2000, max: 2500, minor: 10, major: [2000, 2100, 2200, 2300, 2400, 2500], below: marks([2000, 2100, 2200, 2300, 2400, 2500]), points: [{ v: 2371, text: '2,371' }] }) + say('2,371 is between 2,300 and 2,400.'),
        fig({ fig: 'nline', min: 2000, max: 2500, minor: 10, major: [2000, 2100, 2200, 2300, 2400, 2500], below: marks([2000, 2100, 2200, 2300, 2400, 2500]), points: [{ v: 2371, text: '2,371' }, { v: 2436, text: '2,436' }] }) + say('2,436 is between 2,400 and 2,500.'),
        big('2,436 > 2,371') + big('2,371 < 2,436') + say('2,436 is farther right, so it is greater. <b>Nia has more.</b> The open side of &gt; or &lt; faces the greater number.')
      ],
      check: lineCheck
    },
    {
      id: 'place-value', kind: 'slides', title: 'Compare with place value',
      explain: 'Line the numbers up by place. Start at the thousands. The first place that is different decides.',
      slides: [
        chart(5362, 5318) + say('Compare 5,362 and 5,318. Line them up by place.'),
        chart(5362, 5318, 'Th') + say('Thousands: 5 and 5. The same. Move right.'),
        chart(5362, 5318, 'H') + say('Hundreds: 3 and 3. The same. Move right.'),
        chart(5362, 5318, 'T') + say('Tens: 6 and 1. Different! 6 tens > 1 ten, so <b>5,362 > 5,318</b>. We can stop.'),
        say('Why can we stop? 6 tens is 60. Even 9 ones can\'t make up 50 more.')
      ],
      check: placeCheck
    },
    {
      id: 'equal', kind: 'slides', title: 'Equal or not equal',
      explain: 'Two numbers are equal only if every place has the same digit. ≠ means not equal.',
      slides: [
        chart(6207, 6207) + say('6,207 and 6,207: thousands, hundreds, tens and ones are all the same. <b>6,207 = 6,207</b>.'),
        chart(6207, 6270, 'T') + say('6,207 and 6,270: the tens are different (0 and 7). So <b>6,207 ≠ 6,270</b>. ≠ is = with a slash. It means <i>not equal</i>.'),
        say('If they are not equal, one is greater: 6,270 > 6,207.')
      ],
      check: equalCheck
    },
    {
      id: 'digits', kind: 'slides', title: 'Different numbers of digits',
      explain: 'A 3-digit number has 0 thousands. Any 4-digit number is greater than any 3-digit number.',
      slides: [
        say('Compare 3,158 and 958. Ivy says 958 is greater because 9 > 3. Let\'s check.'),
        chart(3158, 958, 'Th') + say('958 has <b>no thousands</b>: write a 0 in the thousands place.'),
        say('Thousands: 3 and 0. 3 > 0, so <b>3,158 > 958</b>. Ivy compared the wrong places.'),
        fig({ fig: 'nline', min: 0, max: 4000, minor: 100, major: [0, 1000, 2000, 3000, 4000], below: marks([0, 1000, 2000, 3000, 4000]), points: [{ v: 958, text: '958' }, { v: 3158, text: '3,158' }] }) +
          say('Any 4-digit number is greater than any 3-digit number.')
      ],
      check: digitsCheck
    },
    {
      id: 'order', kind: 'slides', title: 'Order numbers and solve problems',
      explain: 'Find the least by looking at the thousands. Then compare the two that are left.',
      slides: [
        say('Three bike trails: 4,572 m, 3,986 m and 4,519 m. Order them from least to greatest.'),
        say('Thousands: 3,986 has 3 thousands. It is the least.'),
        chart(4572, 4519, 'T') + say('4,572 and 4,519 both have 4 thousands and 5 hundreds. Tens: 7 > 1, so 4,519 < 4,572.'),
        big('3,986 < 4,519 < 4,572') + fig({ fig: 'nline', min: 3500, max: 5000, minor: 50, major: [3500, 4000, 4500, 5000], below: marks([3500, 4000, 4500, 5000]), points: [{ v: 3986, text: '3,986' }, { v: 4519, text: '4,519' }, { v: 4572, text: '4,572' }] }),
        say('Which trail is longest? The greatest number: <b>4,572 m</b>.')
      ],
      check: orderCheck
    }
  ];

  // ---------- Practice Together (12), On My Own (12), Test (12) ----------
  const guided = [
    lineQ({ id: 'p1', skill: 'line', a: 5250, b: 3000, min: 0, max: 10000, step: 1000, minor: 500, ask: 5250, labelsEvery: 2, hint: 'Numbers grow to the right.' }),
    lineQ({ id: 'p2', skill: 'line', a: 6315, b: 6480, min: 6200, max: 6700, step: 50, minor: 10, ask: 6480, labelsEvery: 2, flip: true, hint: 'Count by 50s from 6,200.' }),
    eqQ({ id: 'p3', a: 7536, b: 7536 }),
    eqQ({ id: 'p4', a: 2814, b: 2841, hint: 'Look carefully: the same digits can be in different places.' }),
    cmpQ({ id: 'p5', skill: 'pv', a: 4127, b: 3986, reason: true, hint: 'Compare the thousands first.' }),
    cmpQ({ id: 'p6', skill: 'pv', a: 2605, b: 2950, reason: true, hint: 'Thousands are the same. Look at the next place.' }),
    cmpQ({ id: 'p7', skill: 'digits', a: 6072, b: 972, hint: 'How many thousands does 972 have?' }),
    cmpQ({ id: 'p8', skill: 'pv', a: 8463, b: 8497, hint: 'Same thousands, same hundreds…' }),
    cmpQ({ id: 'p9', skill: 'pv', a: 5708, b: 5705, hint: 'Keep going until a digit is different.' }),
    digitsErrQ({ id: 'p10', small: 863, big: 2519, who: 'Ty', smallFirst: true, seed: 10, hint: 'Line the numbers up by place, not by the first digit.' }),
    realQ({ id: 'p11', a: 3475, b: 2968, unit: 'L', thing: 'tank', q: 'Which tank holds more?', seed: 11, prompt: 'Two water tanks hold 3,475 liters and 2,968 liters. Which tank holds more?' }),
    orderQ({ id: 'p12', nums: [4615, 3947, 4598] })
  ];
  const parentTips = { p1: 'Ask: which two tick marks is the number between?', p2: 'Ask: which two tick marks is the number between?', p4: 'Ask your child to read both numbers aloud slowly. Do they sound the same?', p7: 'Write the shorter number with a 0 in front (0,972) so the places line up.', p10: 'Write the shorter number with a 0 in front (0,863) so the places line up.', p12: 'Ask: how do you know you can stop comparing?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    lineQ({ id: 'o1', skill: 'line', a: 6500, b: 8000, min: 0, max: 10000, step: 1000, minor: 500, ask: 8000, labelsEvery: 2, flip: true }),
    lineQ({ id: 'o2', skill: 'line', a: 2945, b: 2610, min: 2500, max: 3000, step: 50, minor: 10, ask: 2610, labelsEvery: 2, flip: true }),
    eqQ({ id: 'o3', a: 3718, b: 3718 }),
    eqQ({ id: 'o4', a: 5269, b: 5296 }),
    cmpQ({ id: 'o5', skill: 'pv', a: 6034, b: 5987, reason: true }),
    cmpQ({ id: 'o6', skill: 'pv', a: 9416, b: 9758, reason: true }),
    cmpQ({ id: 'o7', skill: 'digits', a: 2083, b: 983 }),
    cmpQ({ id: 'o8', skill: 'pv', a: 4725, b: 4781 }),
    cmpQ({ id: 'o9', skill: 'pv', a: 7392, b: 7396 }),
    digitsErrQ({ id: 'o10', small: 594, big: 1836, who: 'Leo', smallFirst: true, seed: 20 }),
    realQ({ id: 'o11', a: 1850, b: 1792, unit: 'm', thing: 'bridge', q: 'Which bridge is longer?', seed: 21, prompt: 'Two bridges are 1,850 meters and 1,792 meters long. Which bridge is longer?' }),
    orderQ({ id: 'o12', nums: [5302, 5230, 4999] })
  ];

  const testItems = [
    lineQ({ id: 't1', skill: 'line', a: 1750, b: 4000, min: 0, max: 10000, step: 1000, minor: 250, ask: 1750, labelsEvery: 2, flip: true }),
    lineQ({ id: 't2', skill: 'line', a: 3860, b: 3715, min: 3500, max: 4000, step: 50, minor: 10, ask: 3860, labelsEvery: 2, flip: true }),
    eqQ({ id: 't3', a: 9042, b: 9042 }),
    eqQ({ id: 't4', a: 4367, b: 4376 }),
    cmpQ({ id: 't5', skill: 'pv', a: 5013, b: 4899, reason: true }),
    cmpQ({ id: 't6', skill: 'pv', a: 7284, b: 7692, reason: true }),
    cmpQ({ id: 't7', skill: 'digits', a: 3506, b: 506 }),
    cmpQ({ id: 't8', skill: 'pv', a: 1945, b: 1962 }),
    cmpQ({ id: 't9', skill: 'pv', a: 6331, b: 6338 }),
    digitsErrQ({ id: 't10', small: 748, big: 3102, who: 'Ana', smallFirst: true }),
    realQ({ id: 't11', a: 6284, b: 6319, opt: (n) => `the library with ${fmt(n)} books`, q: 'Which library has more books?', prompt: 'Two libraries have 6,284 books and 6,319 books. Which has more?' }),
    orderQ({ id: 't12', nums: [2709, 2790, 2097] })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** Comparing Test: the same 12 items; choice order changes per attempt (place lists, A/B, symbols and Least/Middle/Greatest options stay in order). */
  function compareTest(seed) {
    const r = pv.rng(seed);
    const fixed = (p) => p.kind !== 'choice' || p.choices.join() === 'A,B' || PLACES.every((x) => p.choices.includes(x)) || /^(Least|Middle|Greatest):$/.test(p.label);
    return testItems.map((q) => Object.assign({}, q, { parts: q.parts.map((p) => (fixed(p) ? p : Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }))) }));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-13'] = {
    id: '2-13',
    storageKey: 'mathbook:v2:lesson-2-13',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-13',
    title: 'Compare 4-Digit Numbers',
    subtitle: 'Number lines, place value, and <, >, =, ≠',
    objective: 'I can compare two numbers up to 9,999 using a number line or place value, and write <, >, =, or ≠.',
    parentLearn: {
      goal: [
        'Locate numbers on a number line; the number farther right is greater.',
        'Compare digits from the greatest place (left) to the least; the first place that is different decides.',
        'Use <, >, = and ≠ correctly and read them aloud.',
        'Compare a 4-digit number with a 3-digit number (the 3-digit number has 0 thousands).',
        'Order three numbers and answer a "which is more" question.'
      ],
      words: [
        { term: 'Compare', meaning: 'Decide which number is greater, which is less, or if they are equal.' },
        { term: 'Greater than (>)', meaning: 'Is more than.', example: '5,200 > 4,900' },
        { term: 'Less than (<)', meaning: 'Is fewer than.', example: '4,900 < 5,200' },
        { term: 'Equal to (=)', meaning: 'Is the same amount as.' },
        { term: 'Not equal to (≠)', meaning: 'Is not the same amount as.' },
        { term: 'Place value', meaning: 'The value of a digit because of its place (thousands, hundreds, tens, ones).' }
      ],
      demoVisual: fig({ fig: 'cmp', a: 5362, b: 5318, focus: 'T' }),
      demonstrate: [
        'Draw a line 2,000–2,500; plot 2,371 and 2,436: "farther right is greater."',
        'Write 5,362 over 5,318; cover all but the thousands; uncover one place at a time until the digits differ.',
        'Write 3,158 over 958 and fill in a 0 in front of 958.',
        'Book example: 1,324 > 1,249 (same thousands; 3 hundreds > 2 hundreds).'
      ],
      ask: ['"Which place do you look at first?"', '"Where are they first different?"', '"How do you know you can stop?"', '"Read your sentence aloud. Does it make sense?"', '"Which is farther right on the number line?"'],
      checklist: [
        'Locates two numbers on a number line and says which is greater.',
        'Compares by place value from the left.',
        'Uses = and ≠ correctly.',
        'Handles a 3-digit vs 4-digit pair.',
        'Orders three numbers and answers a "which is more" word problem, and scores 90% or higher on the Comparing Test.'
      ]
    },
    mistakes: [
      'Comparing the first digits of numbers with different lengths (958 vs 3,158). Write a 0 placeholder so places line up.',
      'Stopping too early or too late: deciding by the ones when the hundreds differ. Always go left to right; stop at the first difference.',
      'Thinking the same digits mean equal (2,814 vs 2,841). Compare place by place.',
      'Reversing < and >. Read the sentence aloud; the open side faces the greater number.',
      'Reading a "by 50s" number line as "by 100s". Find the step between two labels first.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'What did you notice about comparing 4-digit numbers?',
        idea: 'Start with the thousands. The first place that is different tells you which is greater. A number line shows the same thing: the greater number is farther right.'
      }
    },
    skills: {
      line: 'Compare on a number line',
      pv: 'Compare with place value',
      equal: 'Equal or not equal',
      digits: '3-digit and 4-digit numbers',
      real: 'Which is more?',
      order: 'Order three numbers'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Comparing Practice', blurb: 'All 12 practice questions: number lines, place value, = and ≠, 3-digit and 4-digit numbers, and ordering.', ids: bank.map((q) => q.id) }],
    tests: {
      compare: { id: 'compare', title: 'Comparing Test', questions: 12, blurb: 'Compare 4-digit numbers with <, >, = and ≠, and order three numbers.', generate: compareTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _firstDiff: firstDiff
  };
})(typeof window !== 'undefined' ? window : globalThis);
