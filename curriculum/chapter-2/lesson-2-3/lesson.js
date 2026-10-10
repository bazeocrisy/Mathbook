/*
 * Mathbook — Chapter 2, Lesson 2-3: Estimate Sums and Differences
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-3.md (with the batch-A review fixes N-02, N-03, N-04).
 * Every question names its method (nearest ten, nearest hundred, or compatible numbers = the nearest number ending in
 * 00, 25, 50 or 75), so each estimate has exactly one accepted answer. Every answer, choice key and explanation is
 * computed from the numbers (roundTo / compat), so they can never disagree. See tests/lesson-2-3.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt, roundTo } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const word = (place) => (place === 10 ? 'ten' : 'hundred');
  const digitName = (place) => (place === 10 ? 'ones' : 'tens');
  const digitAt = (n, place) => Math.floor(n / (place / 10)) % 10;
  /** Compatible number: the nearest number ending in 00, 25, 50 or 75 (nearest multiple of 25; never a tie for whole numbers). */
  const compat = (n) => Math.round(n / 25) * 25;
  const sym = (op) => (op === '+' ? '+' : '−');
  const calc = (x, op, y) => (op === '+' ? x + y : x - y);
  const opWord = (op) => (op === '+' ? 'sum' : 'difference');
  const eq = (x, op, y) => `${fmt(x)} ${sym(op)} ${fmt(y)}`;

  /** Short reason: "437 rounds to 400 (tens digit 3)." / "251 rounds to 300 (tens digit 5, round up)." */
  function rWhy(n, place) {
    const d = digitAt(n, place);
    return `${fmt(n)} rounds to ${fmt(roundTo(n, place))} (${digitName(place)} digit ${d}${d >= 5 ? ', round up' : ''}).`;
  }
  /** 2-2 wording: the digit to look at, up or down, and the carry when rounding up fills a place. */
  function digitWhy(n, place) {
    const d = digitAt(n, place);
    const r = roundTo(n, place);
    const lower = Math.floor(n / place) * place;
    let s = `To round ${fmt(n)} to the nearest ${word(place)}, look at the ${digitName(place)} digit: ${d}. ` +
      (d >= 5 ? `${d} is 5 or more, so round up to ${fmt(r)}.` : `${d} is less than 5, so round down to ${fmt(r)}.`);
    if (r > lower && r % (place * 10) === 0 && r < 1000) s += ` ${lower / place} ${word(place)}s and 1 more ${word(place)} make ${r / place} ${word(place)}s, which is ${fmt(r)}.`;
    return s;
  }
  /** Mental math with 25s: do the hundreds first ("650 − 400 = 250, then 250 − 25 = 225"). */
  function hundredsFirst(x, op, y) {
    const h = y - (y % 100), rest = y % 100;
    if (!h || !rest) return '';
    const mid = calc(x, op, h);
    return ` Hundreds first: ${eq(x, op, h)} = ${fmt(mid)}, then ${eq(mid, op, rest)} = ${fmt(calc(mid, op, rest))}.`;
  }

  /** True when a number the child must type is printed anywhere in the question (prompt, display, labels, choices). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const fixedOrder = (seed, list) => pv.shuffle(pv.rng(seed), list);
  const ROUND_HINT = 'Look at the tens digit (nearest hundred) or the ones digit (nearest ten).';
  const arrowsUnknown = (a, b, op, label) => ({ fig: 'arrows', a, b, op: sym(op), unknown: true, label });

  /** Round each number to the nearest ten or hundred, then add or subtract. o: { id, a, b, op, place, skill, left?, figure?, long?, hint? } */
  function roundQ(o) {
    const { a, b, op, place } = o;
    const ra = roundTo(a, place), rb = roundTo(b, place), est = calc(ra, op, rb), exact = calc(a, op, b);
    const how = `Round each number to the nearest ${word(place)}`;
    const q = {
      id: o.id, type: 'parts', skill: o.skill,
      prompt: o.left ? `? = ${eq(a, op, b)}. ${how} to estimate.` : `Estimate ${eq(a, op, b)}. ${how}.`,
      parts: [
        { kind: 'num', label: `${fmt(a)} rounds to`, answer: ra },
        { kind: 'num', label: `${fmt(b)} rounds to`, answer: rb },
        { kind: 'num', label: 'Estimate', answer: est }
      ],
      hint: o.hint || ROUND_HINT,
      explanation: (o.long ? `${digitWhy(a, place)} ${digitWhy(b, place)}` : `${rWhy(a, place)} ${rWhy(b, place)}`) +
        ` ${eq(ra, op, rb)} = ${fmt(est)}. The exact ${opWord(op)} is ${fmt(exact)}, close to ${fmt(est)}.`
    };
    if (o.figure) q.figure = arrowsUnknown(a, b, op);
    return q;
  }

  /** The compatible pair and three wrong pairs (nearest hundreds, only one number changed, changed the wrong way). */
  function compatPairs(a, b, op) {
    const ca = compat(a), cb = compat(b);
    const away = (n, c) => c + (n > c ? 25 : -25);
    const est = calc(ca, op, cb);
    const cands = [[roundTo(a, 100), roundTo(b, 100)], [a, cb], [away(a, ca), away(b, cb)], [ca, b], [roundTo(a, 10), roundTo(b, 10)]];
    const seen = new Set([eq(ca, op, cb)]);
    const wrong = [];
    for (const [x, y] of cands) {
      const s = eq(x, op, y);
      if (seen.has(s) || x <= 0 || y <= 0 || (op === '−' && x <= y) || x === est || y === est) continue;
      seen.add(s); wrong.push(s);
      if (wrong.length === 3) break;
    }
    return { ca, cb, est, right: eq(ca, op, cb), wrong };
  }

  /** Compatible numbers. o: { id, a, b, op, story?, wrong? (fixed distractors), seed?, r?, figure? } */
  function compatQ(o) {
    const { a, b, op } = o;
    const P = compatPairs(a, b, op);
    const wrong = o.wrong || P.wrong;
    // Non-breaking spaces keep each choice (e.g. 750 − 500) on one line at any width or zoom.
    const nb = (t) => t.replace(/ ([+−]) /g, '\u00a0$1\u00a0');
    const list = [P.right].concat(wrong).map(nb);
    const choices = o.r ? pv.shuffle(o.r, list) : fixedOrder(o.seed || 1, list);
    const rule = '(numbers ending in 00, 25, 50 or 75)';
    const q = {
      id: o.id, type: 'parts', skill: 'compat',
      prompt: o.story ? `${o.story} Use compatible numbers ${rule} to find about how many ${o.noun || 'in all'}.` : `Use compatible numbers ${rule} to estimate ${eq(a, op, b)}.`,
      parts: [
        { kind: 'choice', label: 'Which compatible numbers are closest?', answer: nb(P.right), choices, compact: true },
        { kind: 'num', label: 'Estimate', answer: P.est }
      ],
      hint: o.hint || 'Count by 25s near each number. Find the nearest number that ends in 00, 25, 50 or 75.',
      explanation: `${fmt(a)} → ${fmt(P.ca)} and ${fmt(b)} → ${fmt(P.cb)}: the nearest numbers ending in 00, 25, 50 or 75. ` +
        `${P.right} = ${fmt(P.est)}.${hundredsFirst(P.ca, op, P.cb)} The exact ${opWord(op)} is ${fmt(calc(a, op, b))}. ` +
        'Other friendly numbers can work too, but this question asks for numbers ending in 00, 25, 50 or 75.'
    };
    if (o.figure) q.figure = arrowsUnknown(a, b, op, `${fmt(a)} ${op === '+' ? 'plus' : 'minus'} ${fmt(b)}. Change each number to a compatible number, then find the estimate.`);
    return q;
  }

  const ADD = 'Add', SUB = 'Subtract';
  const WORD_HINT = 'Put together → add. Find what is left or how many more → subtract.';
  /** A story: add or subtract, then one estimate. o: { id, story, op, a, b, place, cue, seed?, r? } */
  function wordQ(o) {
    const { a, b, op, place } = o;
    const ra = roundTo(a, place), rb = roundTo(b, place), est = calc(ra, op, rb);
    const choices = [ADD, SUB];
    return {
      id: o.id, type: 'parts', skill: o.skill || 'word',
      prompt: `${o.story} Round each number to the nearest ${word(place)}.`,
      parts: [
        { kind: 'choice', label: 'Add or subtract?', answer: op === '+' ? ADD : SUB, choices, compact: true },
        { kind: 'num', label: 'Estimate', answer: est }
      ],
      hint: o.hint || WORD_HINT,
      explanation: `${o.cue} ${rWhy(a, place)} ${rWhy(b, place)} ${eq(ra, op, rb)} = ${fmt(est)}.` +
        (o.exact === false ? '' : ` (Exact: ${eq(a, op, b)} = ${fmt(calc(a, op, b))}.)`)
    };
  }

  /** Missing part from an estimated total (round only the known part, to the nearest ten). */
  function missingQ(o) {
    const { total, part } = o;
    const rp = roundTo(part, 10), est = total - rp;
    return {
      id: o.id, type: 'parts', skill: 'missing',
      prompt: `${o.story} Round ${fmt(part)} to the nearest ten.`,
      parts: [
        { kind: 'num', label: `${fmt(part)} rounds to`, answer: rp },
        { kind: 'num', label: 'Estimate', answer: est }
      ],
      hint: 'Total minus the part you know gives the other part.',
      explanation: `The ${fmt(total)} is the estimated total for both parts, and ${fmt(part)} is one part, so subtract. ${rWhy(part, 10)} ${fmt(total)} − ${fmt(rp)} = ${fmt(est)}.`
    };
  }

  /** Two steps: has X, uses Y for each of 2. */
  function twoStepQ(o) {
    const { x, y } = o;
    const rx = roundTo(x, 10), ry = roundTo(y, 10), mid = rx - ry, est = mid - ry;
    return {
      id: o.id, type: 'parts', skill: 'twostep',
      prompt: `${o.story} Round each number to the nearest ten.`,
      parts: [
        { kind: 'num', label: `${fmt(x)} rounds to`, answer: rx },
        { kind: 'num', label: `${fmt(y)} rounds to`, answer: ry },
        { kind: 'num', label: 'Estimate', answer: est }
      ],
      hint: o.hint || 'Take away for the first friend, then take away again for the second friend.',
      explanation: `${rWhy(x, 10)} ${rWhy(y, 10)} Take away ${fmt(ry)} two times: ${fmt(rx)} − ${fmt(ry)} = ${fmt(mid)}, then ${fmt(mid)} − ${fmt(ry)} = ${fmt(est)}. ` +
        `(Exact: ${fmt(y)} + ${fmt(y)} = ${fmt(2 * y)}, and ${fmt(x)} − ${fmt(2 * y)} = ${fmt(x - 2 * y)}.)`
    };
  }

  const YES = 'Yes. It is close to the estimate.';
  const NO = 'No. It is far from the estimate.';
  const SILLY = 'Yes. Any answer with three digits is reasonable.';
  /** Someone's answer, checked with a nearest-hundred estimate. o: { id, who, a, b, op, c, extra?, seed?, r?, figure? } */
  function checkQ(o) {
    const { a, b, op, c, who } = o;
    const ra = roundTo(a, 100), rb = roundTo(b, 100), est = calc(ra, op, rb), exact = calc(a, op, b);
    const close = Math.abs(c - est) <= 100;
    const right = close ? YES : NO;
    const list = [YES, NO].concat(o.extra ? [SILLY] : []);
    const q = {
      id: o.id, type: 'parts', skill: 'check',
      prompt: `${who} says ${eq(a, op, b)} = ${fmt(c)}. Estimate to check.`,
      parts: [
        { kind: 'num', label: 'Estimate (nearest hundred)', answer: est },
        { kind: 'choice', label: `Is ${who}'s answer reasonable?`, answer: right, choices: o.r ? pv.shuffle(o.r, list) : fixedOrder(o.seed || 1, list) }
      ],
      hint: 'Estimate first. Is the answer close?',
      explanation: `${rWhy(a, 100)} ${rWhy(b, 100)} ${eq(ra, op, rb)} = ${fmt(est)}. ` +
        (close ? `${fmt(c)} is close to ${fmt(est)}, so it is reasonable. (An estimate can't prove it is exactly right. The exact ${opWord(op)} is ${fmt(exact)}.)`
          : `${fmt(c)} is far from ${fmt(est)}, so ${who} should check again. The exact ${opWord(op)} is ${fmt(exact)}.`)
    };
    if (o.figure) q.figure = arrowsUnknown(a, b, op);
    return q;
  }

  const HOW_RIGHT = 'Round each number to the nearest hundred. Then add the rounded numbers.';
  const HOW_WRONG = ['Round only one of the numbers. Then add it to the other number.', 'Round each number down to the hundred below it. Then add.', 'Add the two numbers first. Then round the answer you get.'];
  /** How to use rounding (book item 7): a number-free method choice, then the estimate. */
  function explainQ(o) {
    const { a, b } = o;
    const ra = roundTo(a, 100), rb = roundTo(b, 100), est = ra + rb;
    const q = {
      id: o.id, type: 'parts', skill: 'explain',
      prompt: `How can you use rounding to estimate ${eq(a, '+', b)} without finding the exact sum?`,
      parts: [
        { kind: 'choice', label: 'Choose the best way.', answer: HOW_RIGHT, choices: fixedOrder(o.seed || 1, [HOW_RIGHT].concat(HOW_WRONG)) },
        { kind: 'num', label: 'Estimate (nearest hundred)', answer: est }
      ],
      hint: 'An estimate means you round first, so you never need the exact sum.',
      explanation: `Round both numbers first: ${rWhy(a, 100)} ${rWhy(b, 100)} Then add: ${eq(ra, '+', rb)} = ${fmt(est)}. ` +
        `Adding first and then rounding needs the hard exact sum (${fmt(a + b)}), so it is not estimating.`
    };
    if (o.figure) q.figure = arrowsUnknown(a, b, '+');
    return q;
  }

  const TEN = 'Nearest ten', HUNDRED = 'Nearest hundred';
  /** Estimate two ways and say which is closer to the exact answer. */
  function compareQ(o) {
    const { a, b } = o;
    const op = '−';
    const t = calc(roundTo(a, 10), op, roundTo(b, 10)), h = calc(roundTo(a, 100), op, roundTo(b, 100)), exact = a - b;
    const closer = Math.abs(t - exact) <= Math.abs(h - exact) ? TEN : HUNDRED;
    const q = {
      id: o.id, type: 'parts', skill: 'compare',
      prompt: `Estimate ${eq(a, op, b)} two ways. The exact answer is ${fmt(exact)}.`,
      parts: [
        { kind: 'num', label: 'Estimate (nearest ten)', answer: t },
        { kind: 'num', label: 'Estimate (nearest hundred)', answer: h },
        { kind: 'choice', label: `Which estimate is closer to ${fmt(exact)}?`, answer: closer, choices: [TEN, HUNDRED], compact: true }
      ],
      hint: 'Round to the nearest ten, then to the nearest hundred. Which estimate is nearer the exact answer?',
      explanation: `Nearest ten: ${eq(roundTo(a, 10), op, roundTo(b, 10))} = ${fmt(t)}. Nearest hundred: ${eq(roundTo(a, 100), op, roundTo(b, 100))} = ${fmt(h)}. ` +
        `${fmt(t)} is ${fmt(Math.abs(t - exact))} away from ${fmt(exact)} and ${fmt(h)} is ${fmt(Math.abs(h - exact))} away, so the ${closer.toLowerCase()} estimate is closer.`
    };
    if (o.figure) q.figure = arrowsUnknown(a, b, op);
    return q;
  }

  // ---------- Learn: six steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const story = (html) => `<div class="story"><p>${html}</p></div>`;
  const arrows = (a, b, op, to, reveal, extra) => fig(Object.assign({ fig: 'arrows', a, b, op: sym(op), to, result: calc(to[0], op, to[1]), reveal }, extra || {}));
  const upDown = (n, place) => {
    const d = digitAt(n, place), r = roundTo(n, place);
    return `<b>${fmt(n)}</b> has a ${d} in the ${digitName(place)} place, so it rounds ${d >= 5 ? 'up' : 'down'} to <b>${fmt(r)}</b>.`;
  };

  // Numbers used in the Learn examples; Your Turn never repeats them.
  const DEMO = [312, 465, 674, 231, 526, 274, 247, 352, 326, 750, 325, 375, 450, 284, 517, 640, 389, 560, 213, 820, 394, 455, 29, 205];
  // Compatible pairs that Your Turn never produces: practice and test (650/425, 225/350, 825/375, 475/250),
  // the slides (525/275, 250/350, 750/325, 375/450) and the book's own pair 575/125 (review N-04).
  const USED_PAIRS = [[650, 425], [225, 350], [825, 375], [475, 250], [525, 275], [250, 350], [750, 325], [375, 450], [575, 125], [250, 325]];
  const pairUsed = (x, y) => USED_PAIRS.some(([p, q]) => (p === x && q === y) || (p === y && q === x));

  /** A 3-digit number (min–max) that is not a demo number and passes ok(n). */
  function num(r, min, max, ok) {
    let n;
    do { n = pv.randInt(r, min, max); } while (DEMO.includes(n) || (ok && !ok(n)));
    return n;
  }
  /** Keep drawing until the question prints none of its own answers. */
  function noLeak(make) {
    let q;
    for (let g = 0; g < 200; g++) { q = make(); if (q && !leaks(q)) return q; }
    return q;
  }

  // Step 1 / 2: estimate a sum by rounding.
  function sumCheck(r, place, id) {
    return noLeak(() => {
      let a, b;
      do {
        a = num(r, 101, 899, (n) => n % place !== 0);
        b = num(r, 101, 899, (n) => n % place !== 0);
      } while (a === b || roundTo(a, place) + roundTo(b, place) > 1000);
      return roundQ({ id, a, b, op: '+', place, skill: place === 100 ? 'round100' : 'round10', figure: true, long: true,
        hint: place === 100 ? 'Look at the tens digit of each number. Then add the hundreds.' : 'Look at the ones digit of each number. Then add the tens.' });
    });
  }

  // Step 4: compatible numbers. The first question in each visit needs no regrouping in the last two digits;
  // a new question (after two misses, or "Try another one") may.
  let compatServed = 0;
  function compatCheck(r) {
    const easy = compatServed === 0;
    compatServed += 1;
    return noLeak(() => {
      const op = pv.pick(r, ['+', '−']);
      let ca, cb, a, b;
      for (;;) {
        ca = pv.randInt(r, 5, 35) * 25;
        cb = pv.randInt(r, 5, 35) * 25;
        a = ca + pv.pick(r, [-2, -1, 1, 2]);
        b = cb + pv.pick(r, [-2, -1, 1, 2]);
        if (ca % 100 === 0 && cb % 100 === 0) continue;
        if (op === '−' ? ca <= cb : ca + cb > 1000) continue;
        if (pairUsed(ca, cb) || DEMO.includes(a) || DEMO.includes(b) || a === b) continue;
        if (easy && (op === '−' ? ca % 100 < cb % 100 : (ca % 100) + (cb % 100) > 75)) continue;
        break;
      }
      const q = compatQ({ id: 'learn-4', a, b, op, r, figure: true, hint: 'Find the nearest number that ends in 00, 25, 50 or 75.' });
      return q.parts[0].choices.length === 4 ? q : null;
    });
  }

  // Step 5: word problems from five templates.
  const NAMES = ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivan', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa'];
  function wordCheck(r) {
    const t = pv.pick(r, ['add', 'sub', 'needs', 'missing', 'twostep']);
    const who = pv.pick(r, NAMES);
    return noLeak(() => {
      const place = pv.pick(r, [10, 100]);
      const nz = (n) => n % place !== 0;
      if (t === 'add') {
        let a, b;
        do { a = num(r, 101, 899, nz); b = num(r, 101, 899, nz); } while (a === b || roundTo(a, place) + roundTo(b, place) > 1000);
        const s = pv.pick(r, [
          [`A school collects ${fmt(a)} cans in May and ${fmt(b)} cans in June. About how many cans does it collect in all?`, '"In all" means put together, so add.'],
          [`${who} walks ${fmt(a)} steps before lunch and ${fmt(b)} steps after lunch. About how many steps is that altogether?`, '"Altogether" means put together, so add.'],
          [`A farm has ${fmt(a)} hens and ${fmt(b)} ducks. About how many birds are there in all?`, '"In all" means put together, so add.']
        ]);
        return wordQ({ id: 'learn-5', story: s[0], cue: s[1], op: '+', a, b, place });
      }
      if (t === 'sub') {
        let a, b;
        do { a = num(r, 201, 899, nz); b = num(r, 101, 799, nz); } while (roundTo(a, place) <= roundTo(b, place) || a <= b);
        const s = pv.pick(r, [
          [`A tower is ${fmt(a)} cm tall. A lamp post is ${fmt(b)} cm tall. About how much taller is the tower?`, '"How much taller" compares two heights, so subtract.'],
          [`A shop had ${fmt(a)} balloons. It sold ${fmt(b)}. About how many balloons are left?`, '"How many are left" means take away, so subtract.'],
          [`${who} wants to read ${fmt(a)} pages. ${who} has read ${fmt(b)} pages. About how many more pages are there to read?`, '"How many more" finds the part still to go, so subtract.']
        ]);
        return wordQ({ id: 'learn-5', story: s[0], cue: s[1], op: '−', a, b, place });
      }
      if (t === 'needs') {
        let a, b;
        do { a = num(r, 301, 899, nz); b = num(r, 101, 699, nz); } while (roundTo(a, place) <= roundTo(b, place) || a <= b);
        const s = pv.pick(r, [
          `A box holds ${fmt(a)} crayons. It still needs ${fmt(b)} more crayons to be full. About how many crayons are in the box now?`,
          `A photo album has room for ${fmt(a)} photos. ${who} still needs ${fmt(b)} more photos to fill it. About how many photos does ${who} have now?`
        ]);
        return wordQ({ id: 'learn-5', story: s, cue: `The whole is ${fmt(a)}, and ${fmt(b)} is the part still missing. Subtract to find the part there now.`, op: '−', a, b, place });
      }
      if (t === 'missing') {
        // Review N-03: round only the known part, always to the nearest ten; the estimated total is a multiple of 10.
        let x, y;
        do { x = pv.randInt(r, 40, 95) * 10; y = num(r, 101, 899, (n) => n % 10 !== 0); } while (DEMO.includes(x) || x - roundTo(y, 10) < 100);
        const s = `${who} estimates about ${fmt(x)} people came to a fair on two days. ${fmt(y)} people came on the second day. About how many could have come on the first day?`;
        const q = wordQ({ id: 'learn-5', story: s, cue: `${fmt(x)} is the estimated total and ${fmt(y)} is one part, so subtract.`, op: '−', a: x, b: y, place: 10, exact: false });
        q.prompt = `${s} Round ${fmt(y)} to the nearest ten.`;
        q.explanation = `${fmt(x)} is the estimated total and ${fmt(y)} is one part, so subtract. ${rWhy(y, 10)} ${fmt(x)} − ${fmt(roundTo(y, 10))} = ${fmt(q.parts[1].answer)}.`;
        return q;
      }
      // Two steps (review N-03: nearest ten).
      let x, y;
      do { x = num(r, 301, 899, (n) => n % 10 !== 0); y = pv.randInt(r, 11, 49); } while (y % 10 === 0 || DEMO.includes(y) || roundTo(x, 10) - 2 * roundTo(y, 10) < 100);
      const rx = roundTo(x, 10), ry = roundTo(y, 10), est = rx - 2 * ry;
      const s = pv.pick(r, [
        `${who} has ${fmt(x)} beads. ${who} uses ${y} beads for each of 2 bracelets. About how many beads are left?`,
        `A teacher has ${fmt(x)} stickers. She gives ${y} stickers to each of 2 classes. About how many stickers are left?`
      ]);
      return {
        id: 'learn-5', type: 'parts', skill: 'word',
        prompt: `${s} Round each number to the nearest ten.`,
        parts: [
          { kind: 'choice', label: 'Add or subtract?', answer: SUB, choices: [ADD, SUB], compact: true },
          { kind: 'num', label: 'Estimate', answer: est }
        ],
        hint: WORD_HINT,
        explanation: `Things are used up, so subtract, once for each of the 2. ${rWhy(x, 10)} ${rWhy(y, 10)} ${fmt(rx)} − ${fmt(ry)} = ${fmt(rx - ry)}, then ${fmt(rx - ry)} − ${fmt(ry)} = ${fmt(est)}.`
      };
    });
  }

  // Step 6: check someone's answer (sums half the time, differences the other half).
  function checkCheck(r) {
    return noLeak(() => {
      const op = pv.pick(r, ['+', '−']);
      let a, b;
      const nz = (n) => n % 100 !== 0;
      if (op === '+') {
        do { a = num(r, 101, 799, nz); b = num(r, 101, 799, nz); } while (a === b || a + b > 999 || roundTo(a, 100) + roundTo(b, 100) > 1000);
      } else {
        do { a = num(r, 201, 899, nz); b = num(r, 101, 799, nz); } while (a <= b || roundTo(a, 100) <= roundTo(b, 100));
      }
      const exact = calc(a, op, b);
      const est = calc(roundTo(a, 100), op, roundTo(b, 100));
      let c = exact;
      if (r() < 0.5) {
        const opts = [200, -200, 300, -300].map((d) => exact + d).filter((x) => x > 0 && x <= 999 && Math.abs(x - est) > 150);
        c = pv.pick(r, opts);
      }
      if (c === est) return null;
      return checkQ({ id: 'learn-6', who: 'Kim', a, b, op, c, r, figure: true });
    });
  }

  const steps = [
    {
      id: 'nearest-hundred', kind: 'slides', title: 'Estimate: round to the nearest hundred',
      explain: 'An estimate is a close answer. Round each number to the nearest hundred. Then add.',
      slides: [
        story('A book has <b>312</b> pages. Another book has <b>465</b> pages. <b>About</b> how many pages in all?') +
          say('"About" means we can <b>estimate</b>. An estimate is close to the exact answer.') + arrows(312, 465, '+', [300, 500], 'top'),
        arrows(312, 465, '+', [300, 500], 'arrows') + say(`${upDown(312, 100)} ${upDown(465, 100)}`),
        arrows(312, 465, '+', [300, 500], 'all') + say(`300 + 500 = <b>${fmt(300 + 500)}</b>. About ${fmt(800)} pages.`) +
          say(`The exact sum is ${fmt(312 + 465)}. ${fmt(roundTo(312, 100) + roundTo(465, 100))} is close to ${fmt(312 + 465)}. That is a good estimate.`)
      ],
      check(r) { return sumCheck(r, 100, 'learn-1'); }
    },
    {
      id: 'nearest-ten', kind: 'slides', title: 'Round to the nearest ten for a closer estimate',
      explain: 'Rounding to the nearest ten changes the numbers less. The estimate is usually closer.',
      slides: [
        say('The same problem: 312 + 465. This time, round to the nearest <b>ten</b>.') + arrows(312, 465, '+', [310, 470], 'arrows') +
          say(`${upDown(312, 10)} ${upDown(465, 10)}`),
        arrows(312, 465, '+', [310, 470], 'all') +
          fig({ fig: 'table', title: 'Estimates for 312 + 465', head: ['Nearest 100', 'Nearest 10', 'Exact'], rows: [[roundTo(312, 100) + roundTo(465, 100), roundTo(312, 10) + roundTo(465, 10), 312 + 465]] }) +
          say(`${fmt(780)} is closer to ${fmt(777)}.`),
        say('Hundreds are faster to add. Tens are closer. <b>You choose.</b>') +
          `<div class="slide-pair">${arrows(312, 465, '+', [300, 500], 'all', { caption: 'Nearest hundred: faster' })}${arrows(312, 465, '+', [310, 470], 'all', { caption: 'Nearest ten: closer' })}</div>`
      ],
      check(r) { return sumCheck(r, 10, 'learn-2'); }
    },
    {
      id: 'difference', kind: 'slides', title: 'Estimate a difference',
      explain: 'You can round to estimate when you subtract, too.',
      slides: [
        story('A tree is <b>674</b> cm tall. A fence is <b>231</b> cm tall. <b>About how much taller</b> is the tree?') +
          say('"How much taller" means <b>subtract</b>.') + arrows(674, 231, '−', [670, 230], 'top'),
        say('Nearest <b>ten</b>:') + arrows(674, 231, '−', [670, 230], 'all') + say(`${upDown(674, 10)} ${upDown(231, 10)} 670 − 230 = <b>${fmt(670 - 230)}</b>.`),
        say('Nearest <b>hundred</b>:') + arrows(674, 231, '−', [700, 200], 'all') + say(`${upDown(674, 100)} ${upDown(231, 100)} 700 − 200 = <b>${fmt(700 - 200)}</b>.`),
        fig({ fig: 'table', title: 'Estimates for 674 − 231', head: ['Nearest 100', 'Nearest 10', 'Exact'], rows: [[700 - 200, 670 - 230, 674 - 231]] }) +
          say(`The exact difference is ${fmt(674 - 231)}. The nearest-ten estimate, ${fmt(670 - 230)}, is very close.`)
      ],
      check(r) {
        const place = pv.pick(r, [10, 100]);
        const left = r() < 0.5;
        return noLeak(() => {
          let a, b;
          do { a = num(r, 201, 899, (n) => n % place !== 0); b = num(r, 101, 799, (n) => n % place !== 0); } while (a <= b || roundTo(a, place) <= roundTo(b, place));
          return roundQ({ id: 'learn-3', a, b, op: '−', place, skill: 'diff', figure: true, long: true, left,
            hint: place === 10 ? 'Look at the ones digit of each number. Then subtract the tens.' : 'Look at the tens digit of each number. Then subtract the hundreds.' });
        });
      }
    },
    {
      id: 'compatible', kind: 'slides', title: 'Use compatible numbers',
      explain: 'Compatible numbers are close numbers that are easy to work with. Numbers that end in 00, 25, 50 or 75 are easy to add and subtract.',
      slides: [
        say('Estimate <b>526 − 274</b>. Think of quarters: <b>25 · 50 · 75 · 100</b>.') + arrows(526, 274, '−', [compat(526), compat(274)], 'arrows') +
          say(`${fmt(526)} is 1 away from <b>${fmt(compat(526))}</b>. ${fmt(274)} is 1 away from <b>${fmt(compat(274))}</b>.`),
        arrows(526, 274, '−', [compat(526), compat(274)], 'all') +
          say(`${fmt(compat(526))} − ${fmt(compat(274))} = <b>${fmt(compat(526) - compat(274))}</b>. The exact difference is ${fmt(526 - 274)}.`),
        say('It works for sums too: <b>247 + 352</b>.') + arrows(247, 352, '+', [compat(247), compat(352)], 'all') +
          say(`${fmt(compat(247))} + ${fmt(compat(352))} = <b>${fmt(compat(247) + compat(352))}</b>. The exact sum is ${fmt(247 + 352)}.`),
        say('Compatible numbers are not always the same as rounding.') +
          `<div class="slide-pair">${fig({ fig: 'arrows', a: 247, b: 326, op: '+', to: [roundTo(247, 100), roundTo(326, 100)], result: roundTo(247, 100) + roundTo(326, 100), caption: 'Rounding (nearest hundred)' })}` +
          `${fig({ fig: 'arrows', a: 247, b: 326, op: '+', to: [compat(247), compat(326)], result: compat(247) + compat(326), caption: 'Compatible numbers' })}</div>` +
          say(`For <b>247 + 326</b>, rounding gives <b>${fmt(roundTo(247, 100) + roundTo(326, 100))}</b> but compatible numbers give <b>${fmt(compat(247) + compat(326))}</b>. The exact sum is ${fmt(247 + 326)}, so here the compatible numbers are closer.`),
        say('Working with 25s in your head: do the <b>hundreds first</b>.') +
          `<div class="money"><p><b>750 − 325:</b> 750 − 300 = ${fmt(750 - 300)}, then ${fmt(750 - 300)} − 25 = <b>${fmt(750 - 325)}</b>.</p>` +
          `<p><b>375 + 450:</b> 375 + 400 = ${fmt(375 + 400)}, then ${fmt(375 + 400)} + 50 = <b>${fmt(375 + 450)}</b>.</p></div>`
      ],
      check(r) { return compatCheck(r); }
    },
    {
      id: 'word-problems', kind: 'slides', title: 'Estimate in word problems',
      explain: 'Read the question. Decide: add or subtract? Then estimate.',
      slides: [
        story('A zoo\'s bears eat <b>284</b> pounds of food one week and <b>517</b> pounds the next week. About how much do they eat <span class="rd-d is-look">in the two weeks</span>?') +
          say('"In the two weeks" means put together: <b>add</b>. Round to the nearest hundred.') + arrows(284, 517, '+', [roundTo(284, 100), roundTo(517, 100)], 'all') +
          say(`About <b>${fmt(roundTo(284, 100) + roundTo(517, 100))}</b> pounds.`),
        story('A sticker book holds <b>640</b> stickers. Jo has <b>389</b>. About <b>how many more</b> does she need?') +
          say('"How many more" means <b>subtract</b>. Round to the nearest ten.') + arrows(640, 389, '−', [roundTo(640, 10), roundTo(389, 10)], 'all') +
          say(`About <b>${fmt(roundTo(640, 10) - roundTo(389, 10))}</b> more stickers.`),
        story('A shelf holds <b>560</b> books. It <b>still needs 213 more</b> books to be full. About how many books are on it now?') +
          say('The whole is 560, and 213 is the part still missing. So <b>subtract</b>. Round to the nearest ten.') +
          arrows(560, 213, '−', [roundTo(560, 10), roundTo(213, 10)], 'all') +
          say(`About <b>${fmt(560 - roundTo(213, 10))}</b> books. (Exact: ${fmt(560 - 213)}.)`),
        story('Pia estimates she sold <b>about 820</b> tickets on two nights. She sold <b>394</b> on the second night. About how many could she have sold on the first night?') +
          say('820 is already an estimate of the total. Round only 394 to the nearest ten, then <b>subtract</b>.') +
          arrows(820, 394, '−', [820, roundTo(394, 10)], 'all') + say(`About <b>${fmt(820 - roundTo(394, 10))}</b> tickets on the first night.`),
        story('A box has <b>455</b> beads. Lin uses <b>29</b> beads for <b>each of 2</b> necklaces. About how many beads are left?') +
          say(`Round: 455 → <b>${fmt(roundTo(455, 10))}</b> and 29 → <b>${fmt(roundTo(29, 10))}</b>. Take away for each necklace:`) +
          `<div class="money"><p>First necklace: ${fmt(roundTo(455, 10))} − ${roundTo(29, 10)} = <b>${fmt(roundTo(455, 10) - roundTo(29, 10))}</b></p>` +
          `<p>Second necklace: ${fmt(roundTo(455, 10) - roundTo(29, 10))} − ${roundTo(29, 10)} = <b>${fmt(roundTo(455, 10) - 2 * roundTo(29, 10))}</b></p></div>` +
          say(`About <b>${fmt(roundTo(455, 10) - 2 * roundTo(29, 10))}</b> beads are left. (Exact: 455 − 58 = ${fmt(455 - 58)}.)`)
      ],
      check(r) { return wordCheck(r); }
    },
    {
      id: 'check-answer', kind: 'slides', title: 'Check an answer with an estimate',
      explain: 'An estimate helps you catch mistakes. If an answer is far from the estimate, check it again.',
      slides: [
        story('Leo says <b>389 + 205 = 794</b>.') + say('Estimate (nearest hundred):') + arrows(389, 205, '+', [roundTo(389, 100), roundTo(205, 100)], 'all') +
          say(`<b>✗ 794 is far from ${fmt(roundTo(389, 100) + roundTo(205, 100))}.</b> Leo's answer is not reasonable. The exact sum is ${fmt(389 + 205)}: he added an extra hundred.`),
        story('Ivy says <b>389 + 205 = 594</b>.') + arrows(389, 205, '+', [roundTo(389, 100), roundTo(205, 100)], 'all') +
          say(`<b>✓ 594 is close to ${fmt(roundTo(389, 100) + roundTo(205, 100))},</b> so it is reasonable.`) +
          say('In this lesson, <b>close</b> means within about 100 of the estimate. More than that is <b>far</b>.') +
          say('An estimate can\'t prove an answer is exactly right. It tells you if it is close.')
      ],
      check(r) { return checkCheck(r); }
    }
  ];

  // ---------- Practice (14) and Test (14): matched one for one, different numbers ----------
  // Each builder takes `g` (true for the Practice Together copy, which shows the arrows layout with "?" boxes —
  // PLAN decision 27; On My Own and the Test show plain fields).
  const practiceItems = (g) => [
    roundQ({ id: 'p1', a: 437, b: 251, op: '+', place: 100, skill: 'round100', figure: g }),
    roundQ({ id: 'p2', a: 784, b: 319, op: '−', place: 100, skill: 'round100', figure: g, left: true }),
    roundQ({ id: 'p3', a: 236, b: 453, op: '+', place: 10, skill: 'round10', figure: g, left: true }),
    roundQ({ id: 'p4', a: 862, b: 527, op: '−', place: 10, skill: 'round10', figure: g }),
    compatQ({ id: 'p5', a: 651, b: 424, op: '−', seed: 51, figure: g, wrong: ['700 − 400', '651 − 400', '675 − 450'] }),
    compatQ({ id: 'p6', a: 226, b: 348, op: '+', seed: 61, figure: g, noun: 'books in all', story: 'A library has 226 picture books and 348 chapter books.', wrong: ['200 + 300', '230 + 350', '250 + 325'] }),
    explainQ({ id: 'p7', a: 278, b: 416, seed: 71, figure: g }),
    wordQ({ id: 'p8', op: '−', a: 735, b: 288, place: 100, story: 'A sticker book has spaces for 735 stickers. Mia still needs 288 more stickers to fill it. About how many stickers does Mia have?',
      cue: 'The whole is 735 and 288 is the part still missing, so subtract.' }),
    wordQ({ id: 'p9', op: '−', a: 462, b: 238, place: 10, story: 'A farm needs to plant 462 trees. It has planted 238. About how many more trees does it need to plant?',
      cue: '"How many more" finds the part still to go, so subtract.' }),
    missingQ({ id: 'p10', total: 710, part: 318, story: 'Theo estimates he read about 710 pages in two weeks. He read 318 pages in week 2. About how many pages could he have read in week 1?' }),
    twoStepQ({ id: 'p11', x: 563, y: 48, story: 'Nora has 563 stickers. She gives 48 stickers to each of 2 friends. About how many stickers does she have left?' }),
    checkQ({ id: 'p12', who: 'Ben', a: 428, b: 265, op: '+', c: 493, extra: true, seed: 121, figure: g }),
    wordQ({ id: 'p13', op: '+', a: 317, b: 482, place: 100, story: 'The bears at a zoo eat 317 pounds of food on Saturday and 482 pounds on Sunday. About how many pounds do they eat in the two days?',
      cue: '"In the two days" means put together, so add.' }),
    compareQ({ id: 'p14', a: 547, b: 183, figure: g })
  ];

  const parentTips = {
    p2: 'Read "? = 784 − 319" as "what equals 784 take away 319?"',
    p5: 'Count by 25s with your child: 25, 50, 75, 100.',
    p10: 'Ask: what do we know, and what part is missing?',
    p11: 'Ask: what happens for each friend? How many friends?',
    p12: 'Ask: is 493 close to your estimate?'
  };
  const guided = practiceItems(true);
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });
  guided.push(
    {
      id: 'g-e1', type: 'explain', skill: 'compare',
      prompt: 'Ada estimated 573 − 248 as 400. Max estimated it as 320. Who is right? Explain.',
      parent: 'Ask which estimate is closer and which is faster.',
      listenFor: [
        `Both are reasonable. Ada rounded to the nearest hundred (${fmt(roundTo(573, 100))} − ${fmt(roundTo(248, 100))} = ${fmt(roundTo(573, 100) - roundTo(248, 100))}).`,
        `Max rounded to the nearest ten (${fmt(roundTo(573, 10))} − ${fmt(roundTo(248, 10))} = ${fmt(roundTo(573, 10) - roundTo(248, 10))}).`,
        `The exact answer is ${fmt(573 - 248)}, so Max's estimate is closer.`
      ],
      explanation: `Both are reasonable estimates. Ada rounded to the nearest hundred: ${fmt(roundTo(573, 100))} − ${fmt(roundTo(248, 100))} = ${fmt(roundTo(573, 100) - roundTo(248, 100))}. ` +
        `Max rounded to the nearest ten: ${fmt(roundTo(573, 10))} − ${fmt(roundTo(248, 10))} = ${fmt(roundTo(573, 10) - roundTo(248, 10))}. The exact answer is ${fmt(573 - 248)}, so Max's estimate is closer, and Ada's was faster.`
    },
    {
      id: 'g-e2', type: 'explain', skill: 'word',
      prompt: 'Tell about a time when you would estimate instead of finding the exact answer.',
      parent: 'Any real situation where "about" is enough is right. Then ask for a time when you need the exact answer.',
      listenFor: ['A time when "about" is enough: about how much things cost, about how far a trip is, about how many more to save.', 'A time when exact is needed: paying, or checking that you have enough.'],
      explanation: 'We estimate when "about" is enough, like guessing the cost of a few things or how long a trip is. We need the exact answer when we pay or must be sure there is enough.'
    }
  );

  const bank = practiceItems(false);

  const testItems = [
    roundQ({ id: 't1', a: 356, b: 418, op: '+', place: 100, skill: 'round100' }),
    roundQ({ id: 't2', a: 921, b: 286, op: '−', place: 100, skill: 'round100', left: true }),
    roundQ({ id: 't3', a: 527, b: 264, op: '+', place: 10, skill: 'round10', left: true }),
    roundQ({ id: 't4', a: 743, b: 318, op: '−', place: 10, skill: 'round10' }),
    compatQ({ id: 't5', a: 826, b: 374, op: '−', wrong: ['800 − 400', '826 − 400', '850 − 350'] }),
    compatQ({ id: 't6', a: 476, b: 251, op: '+', noun: 'in all', story: 'A fair sold 476 lemonades and 251 ice pops.', wrong: ['500 + 300', '480 + 250', '450 + 275'] }),
    explainQ({ id: 't7', a: 362, b: 547 }),
    wordQ({ id: 't8', op: '−', a: 812, b: 317, place: 100, story: 'A puzzle has 812 pieces. Kai still needs to place 317 pieces. About how many pieces has he placed?',
      cue: 'The whole is 812 and 317 is the part still missing, so subtract.' }),
    wordQ({ id: 't9', op: '−', a: 584, b: 336, place: 10, story: 'A baker must pack 584 muffins. She has packed 336. About how many more must she pack?',
      cue: '"How many more" finds the part still to go, so subtract.' }),
    missingQ({ id: 't10', total: 570, part: 284, story: 'Ella estimates she biked about 570 miles in two months. She biked 284 miles in June. About how many miles could she have biked in May?' }),
    twoStepQ({ id: 't11', x: 682, y: 37, story: 'A class has 682 craft sticks. Each of 2 groups uses 37 sticks. About how many sticks are left?' }),
    checkQ({ id: 't12', who: 'Zoe', a: 652, b: 297, op: '−', c: 155, extra: true }),
    wordQ({ id: 't13', op: '+', a: 286, b: 591, place: 100, story: 'A farm picked 286 apples on Monday and 591 apples on Tuesday. About how many apples in the two days?',
      cue: '"In the two days" means put together, so add.' }),
    compareQ({ id: 't14', a: 726, b: 352 })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; delete c.figure; return c; });

  /** The Estimation Test: the same 14 items each time; choice order changes with each attempt. */
  function estimationTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) }));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-3'] = {
    id: '2-3',
    storageKey: 'mathbook:v2:lesson-2-3',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-3',
    title: 'Estimate Sums and Differences',
    subtitle: 'Round or use compatible numbers to estimate',
    objective: 'I can estimate sums and differences by rounding to the nearest 10 or 100 or by using compatible numbers, and I can use an estimate to check if an answer makes sense.',
    parentLearn: {
      goal: [
        'Estimate sums and differences by rounding or with compatible numbers.',
        'Know that an estimate is a close answer, not the exact one.',
        'Round each number to the nearest hundred, or to the nearest ten for a closer estimate.',
        'Use compatible numbers: the nearest numbers ending in 00, 25, 50 or 75.',
        'Choose add or subtract in a story, then estimate. Use estimates to check answers.'
      ],
      words: [
        { term: 'Estimate', meaning: 'A number close to the exact answer. "About how many?" asks for an estimate.' },
        { term: 'Exact answer', meaning: 'The real answer you get from the real numbers.', example: '312 + 465 = 777' },
        { term: 'Round', meaning: 'Change a number to the nearest ten or hundred.', example: '465 rounds to 500 (nearest hundred).' },
        { term: 'Compatible numbers', meaning: 'Nearby numbers that are easy to work with in your head. In this lesson: numbers ending in 00, 25, 50 or 75.', example: '526 − 274 → 525 − 275' },
        { term: 'Sum / Difference', meaning: 'The answer when you add / the answer when you subtract.' },
        { term: 'Reasonable', meaning: 'Makes sense; close to what you expected.' }
      ],
      demoVisual: fig({ fig: 'arrows', a: 312, b: 465, op: '+', to: [300, 500], result: 800 }),
      demonstrate: [
        'Write 312 + 465. Draw arrows to 300 and 500. Add: 800.',
        'Do it again with tens: 310 + 470 = 780. The exact sum is 777. Which is closer?',
        'Write 526 − 274. Count by 25s: 525 and 275. Subtract: 250.',
        'Say "Leo says 389 + 205 = 794." Estimate 600. "Is 794 close? No, so check it."',
        'Book example: the book uses 576 − 122 (a giraffe and a child): 580 − 120 = 460 (nearest ten), 600 − 100 = 500 (nearest hundred) and 575 − 125 = 450 (compatible numbers).',
        'Other friendly numbers can also work in conversation (for example 318 + 502 → 320 + 500). The app\'s questions always name one method, so each has one expected estimate.'
      ],
      ask: [
        '"About how many? Do we need exact?"',
        '"Round to tens or hundreds? Why?"',
        '"Add or subtract? How do you know?"',
        '"Is that answer close to your estimate?"'
      ],
      checklist: [
        'Rounds both numbers to the nearest hundred and adds or subtracts.',
        'Rounds to the nearest ten and says why that estimate is closer.',
        'Uses compatible numbers ending in 00, 25, 50 or 75.',
        'Chooses add or subtract in a story, including missing-part and two-step stories.',
        'Uses an estimate to say if an answer is reasonable.',
        'Scores 90% or higher on the Estimation Test.'
      ]
    },
    mistakes: [
      'Rounding the answer instead of the numbers (278 + 416 = 694, then rounding). Say: "Estimate first, so you don\'t have to do the hard math."',
      'Rounding only one number. Ask: "Did you round both numbers?"',
      'Looking at the wrong digit, or rounding halfway down (from 2-2). Ask: "Which digit do you look at?"',
      'Adding when the story needs subtraction ("needs 288 more" is not "add"). Ask: "Is the whole known? Are we finding a part?"',
      'Thinking an estimate must equal the exact answer, or that a close answer must be right. Say: "An estimate tells you if an answer is close, not if it is exactly right."',
      'Compatible numbers that are far away (651 → 700). Ask: "Is there a friendly number closer than that?"'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'When might you estimate a sum or difference in your life?',
        idea: 'Shopping (about how much will it cost?), trips (about how far?), saving (about how much more do I need?).'
      }
    },
    skills: {
      round100: 'Estimate by rounding to the nearest 100',
      round10: 'Estimate by rounding to the nearest 10',
      compat: 'Estimate with compatible numbers',
      explain: 'Explaining how to estimate',
      word: 'Estimating in word problems',
      missing: 'Estimating a missing part',
      twostep: 'Estimating a two-step problem',
      check: 'Checking an answer with an estimate',
      compare: 'Comparing estimates',
      diff: 'Estimating a difference'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Estimation Practice', blurb: 'All 14 practice questions: rounding, compatible numbers, word problems, and checking answers.', ids: bank.map((q) => q.id) }],
    tests: {
      estimate: { id: 'estimate', title: 'Estimation Test', questions: 14, blurb: 'Rounding, compatible numbers, word problems, and checking answers.', generate: estimationTest }
    },
    _compat: compat,
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _usedPairs: USED_PAIRS
  };
})(typeof window !== 'undefined' ? window : globalThis);
