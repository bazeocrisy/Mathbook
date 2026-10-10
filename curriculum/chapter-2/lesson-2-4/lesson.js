/*
 * Mathbook — Chapter 2, Lesson 2-4: Use Addition Properties to Add
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-4.md (with the batch-A review fixes A-03, A-19…A-22 and N-05).
 * The child sees "order" and "grouping" only; the formal names are in the Parent Guide (PLAN decision 4).
 * Every answer, choice key and explanation is computed from the numbers, so they can never disagree.
 * See tests/lesson-2-4.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const sum = (list) => list.reduce((x, y) => x + y, 0);
  const ones = (n) => n % 10;
  const tens = (n) => Math.floor(n / 10) % 10;
  const hund = (n) => Math.floor(n / 100) % 10;
  const plus = (list, money) => list.map((n) => (money ? '$' : '') + fmt(n)).join(' + ');
  // Non-breaking spaces keep an expression (e.g. 47 + 76 + 53) on one line inside a choice chip.
  const nb = (t) => t.replace(/ ([+−=]) /g, ' $1 ');
  const reverse = (n) => Number(String(n).split('').reverse().join(''));
  const endsIn = (n, z) => n % (z === '00' ? 100 : 10) === 0;
  const PAIRS = [[0, 1], [0, 2], [1, 2]];

  /** Place-value reason a pair adds to its sum: "Ones: 3 + 7 = 10, so 0 ones and 1 more ten. Tens: …" */
  function pairWhy(x, y) {
    const o = ones(x) + ones(y), co = o >= 10 ? 1 : 0;
    const t = tens(x) + tens(y) + co, ct = t >= 10 ? 1 : 0;
    const h = hund(x) + hund(y) + ct;
    let s = `Ones: ${ones(x)} + ${ones(y)} = ${o}` + (co ? `, so ${o - 10} ones and 1 more ten.` : '.');
    s += ` Tens: ${tens(x)} + ${tens(y)}${co ? ' + 1' : ''} = ${t}` + (ct ? `, so ${t - 10} tens and 1 more hundred.` : '.');
    if (h) s += ` Hundreds: ${[hund(x), hund(y)].filter(Boolean).concat(ct ? [1] : []).join(' + ')} = ${h}.`;
    return `${s} So ${fmt(x)} + ${fmt(y)} = ${fmt(x + y)}.`;
  }

  /** True when a number the child must type is printed anywhere in the question (prompt, display, labels, choices). */
  function leaks(q) {
    const nums = [];
    if (q.type === 'number') nums.push(q.answer);
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const fixedOrder = (seed, list) => pv.shuffle(pv.rng(seed), list);
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? fixedOrder(o.seed, list) : list);

  const ORDER_FORMS = [
    (a, b) => ({ display: `${fmt(a)} + ${fmt(b)} = ${fmt(b)} + ___`, answer: a }),
    (a, b) => ({ display: `${fmt(a)} + ___ = ${fmt(b)} + ${fmt(a)}`, answer: b }),
    (a, b) => ({ display: `${fmt(a)} + ${fmt(b)} = ___ + ${fmt(a)}`, answer: b }),
    (a, b) => ({ display: `___ + ${fmt(b)} = ${fmt(b)} + ${fmt(a)}`, answer: a })
  ];
  /** Switch the order: the blank is the addend missing from that side. o: { id, a, b, form (0–3), hint? } */
  function orderQ(o) {
    const { a, b } = o;
    const f = ORDER_FORMS[o.form](a, b);
    return {
      id: o.id, type: 'number', skill: 'order',
      prompt: 'What number makes the equation true?',
      display: f.display, answer: f.answer,
      hint: o.hint || 'Find the addend that is missing from one side.',
      explanation: `Both sides add the same two numbers, ${fmt(a)} and ${fmt(b)}. Only the order changed, so the sum is the same. ` +
        `The missing number is ${fmt(f.answer)}. You don't need to add!`
    };
  }

  /**
   * Same addends, same total (book item 5). o: { id, title, rows: [[day, n] ×3] (rows 1 and 3 make 100),
   * rights: [[i, j, k] …] (orders of the three values), sub: [i, j, k] (v[i] − v[j] + v[k]), rev: true (the middle value
   * with its digits switched), ten?: [index, delta], prompt?, seed?, r? }
   */
  function sameQ(o) {
    const v = o.rows.map((r) => r[1]);
    const exp = (k) => plus(k.map((i) => v[i]));
    const rights = o.rights.map(exp);
    const sub = `${fmt(v[o.sub[0]])} − ${fmt(v[o.sub[1]])} + ${fmt(v[o.sub[2]])}`;
    const revV = v.slice(); revV[1] = reverse(v[1]);
    const rev = plus(revV);
    const wrong = [sub, rev];
    let tenV = null;
    if (o.ten) { tenV = v.slice(); tenV[o.ten[0]] += o.ten[1]; wrong.push(plus(tenV)); }
    const total = sum(v);
    const pair = v[0] + v[2] === 100 ? [0, 2] : null;
    return {
      id: o.id, type: 'parts', skill: 'same',
      prompt: o.prompt || `The table shows the ${o.title.toLowerCase()} each day. Which expressions find the total? Choose all.`,
      figure: { fig: 'table', title: o.title, head: ['Day', 'Number'], rows: o.rows },
      parts: [
        { kind: 'multi', label: 'Which show the total? Choose all.', answer: rights.map(nb), choices: order(o, rights.concat(wrong)).map(nb), compact: true },
        { kind: 'num', label: 'Total:', answer: total }
      ],
      hint: o.hint || 'Each one must add the same three numbers.',
      explanation: `${rights.join(', ')}: each adds ${fmt(v[0])}, ${fmt(v[1])} and ${fmt(v[2])}, just in a different order, so each finds the total. ` +
        `${sub} subtracts. ${rev} has ${fmt(revV[1])} instead of ${fmt(v[1])} (the digits are switched).` +
        (tenV ? ` ${plus(tenV)} has ${fmt(tenV[o.ten[0]])} instead of ${fmt(v[o.ten[0]])}.` : '') +
        (pair ? ` Total: ${fmt(v[0])} + ${fmt(v[2])} = ${fmt(100)}, then ${fmt(100)} + ${fmt(v[1])} = ${fmt(total)}.` : ` Total: ${fmt(total)}.`)
    };
  }

  /** The three pairs of three addends, in place order (1st + 2nd, 1st + 3rd, 2nd + 3rd). */
  const pairChoices = (ad, money) => PAIRS.map(([i, j]) => nb(plus([ad[i], ad[j]], money)));
  /** Index (into PAIRS) of the one pair that ends in z ('00' or '0'), or -1 when there isn't exactly one. */
  function onlyPair(ad, z) {
    const hits = PAIRS.map(([i, j], k) => (endsIn(ad[i] + ad[j], z) ? k : -1)).filter((k) => k >= 0);
    return hits.length === 1 ? hits[0] : -1;
  }

  /** Find a friendly pair, add it first, then the total. o: { id, addends: [x, y, z], ends: '00' | '0', seed?, r?, hint? } */
  function friendlyQ(o) {
    const ad = o.addends, z = o.ends || '00';
    const k = onlyPair(ad, z);
    const [i, j] = PAIRS[k];
    const rest = [0, 1, 2].find((n) => n !== i && n !== j);
    const H = ad[i] + ad[j], total = sum(ad);
    const choices = pairChoices(ad);
    const others = PAIRS.filter((_, n) => n !== k).map(([p, q]) => fmt(ad[p] + ad[q]));
    return {
      id: o.id, type: 'parts', skill: 'friendly',
      prompt: `Find a friendly pair. Add it first, then find the total.`,
      display: plus(ad),
      parts: [
        { kind: 'choice', label: `Which two addends make a number ending in ${z}?`, answer: choices[k], choices: o.r || o.seed ? order(o, choices) : choices, compact: true },
        { kind: 'num', label: 'Their sum:', answer: H },
        { kind: 'num', label: 'Total:', answer: total }
      ],
      hint: o.hint || (z === '00' ? 'Look at the ones digits. Which two make 10? Then check the tens.' : 'Look at the ones digits. Which two make 10?'),
      explanation: `${pairWhy(ad[i], ad[j])} The other pairs make ${others.join(' and ')}, which do not end in ${z}. ` +
        `Then ${fmt(H)} + ${fmt(ad[rest])} = ${fmt(total)}. Adding in any order or grouping gives the same sum.`
    };
  }

  /** Three costs on a list: which two to add first, their sum, the total. o: { id, story, items: [[name, price] ×3], seed?, r? } */
  function moneyQ(o) {
    const ad = o.items.map((x) => x[1]);
    const k = onlyPair(ad, '00');
    const [i, j] = PAIRS[k];
    const rest = [0, 1, 2].find((n) => n !== i && n !== j);
    const H = ad[i] + ad[j], total = sum(ad);
    const choices = pairChoices(ad, true);
    return {
      id: o.id, type: 'parts', skill: 'money',
      prompt: o.story,
      figure: { fig: 'table', title: o.title || 'Order list', head: ['Item', 'Cost'], rows: o.items.concat([['Total', '?']]), money: true },
      parts: [
        { kind: 'choice', label: o.ask || 'Which two costs should you add first?', answer: choices[k], choices: order(o, choices), compact: true },
        { kind: 'num', label: 'Their sum ($):', answer: H },
        { kind: 'num', label: 'Total cost ($):', answer: total }
      ],
      hint: o.hint || 'Find two prices that make a hundred.',
      explanation: `Add $${fmt(ad[i])} and $${fmt(ad[j])} first. ${pairWhy(ad[i], ad[j])} Then $${fmt(H)} + $${fmt(ad[rest])} = $${fmt(total)}.`
    };
  }

  /** A receipt: choose the efficient way (number-free except the prices), then the total. o: { id, who, prices: [a, b, c], seed?, r? } */
  function receiptQ(o) {
    const ad = o.prices;
    const k = onlyPair(ad, '00');
    const [i, j] = PAIRS[k];
    const rest = [0, 1, 2].find((n) => n !== i && n !== j);
    const $ = (n) => '$' + fmt(n);
    const right = `Add ${$(ad[i])} and ${$(ad[j])} first, then add ${$(ad[rest])}.`;
    const wrong = [
      `Add ${$(ad[0])} + ${$(ad[1])} first, because they are next to each other.`,
      `Subtract ${$(ad[j])} from ${$(ad[i])}, then add ${$(ad[rest])}.`,
      'Round each price to the nearest hundred and add.'
    ];
    const H = ad[i] + ad[j], total = sum(ad);
    return {
      id: o.id, type: 'parts', skill: 'money',
      prompt: `${o.who} checks ${o.his || 'the'} receipt: $${fmt(ad[0])}, $${fmt(ad[1])} and $${fmt(ad[2])}. How can ${o.pronoun || 'they'} add more efficiently?`,
      figure: { fig: 'table', title: 'Receipt', head: ['Item', 'Price'], rows: (o.names || ['Item 1', 'Item 2', 'Item 3']).map((n, k2) => [n, ad[k2]]).concat([['Total', '?']]), money: true },
      parts: [
        { kind: 'choice', label: 'What is the most efficient way?', answer: right, choices: order(o, [right].concat(wrong)) },
        { kind: 'num', label: 'Total ($):', answer: total }
      ],
      hint: o.hint || 'Find two prices that make a hundred.',
      explanation: `${pairWhy(ad[i], ad[j])} So ${$(ad[i])} + ${$(ad[j])} = ${$(H)}. Then ${$(H)} + ${$(ad[rest])} = ${$(total)}. ` +
        `Adding ${$(ad[0])} + ${$(ad[1])} first also works, but it is harder. Subtracting or rounding does not find the exact total.`
    };
  }

  // The efficient way to fill a + b = ___ + a (book Work Together). Choices are number-free and of similar length (A-03, N-05).
  const SWITCH = 'Switch the order. The same two addends are on both sides.';
  const SLOW = ['Add the two numbers, then add the first number again.', 'Subtract the smaller number from the bigger number.', 'There is no faster way. You must add, then subtract.'];
  const SLOW_LEARN = ['Add the two numbers, then subtract the first number.', 'Add the two numbers, then add the first number again.', 'Subtract the smaller number from the bigger number.'];
  /** o: { id, who?, a, b, shown? (print the slow sum), learn?, seed?, r? } */
  function efficientQ(o) {
    const { a, b } = o;
    const eqText = `${fmt(a)} + ${fmt(b)} = ___ + ${fmt(a)}`;
    const prompt = o.who
      ? `${o.who} fills in ${eqText}. ${o.pronoun} adds ${fmt(a)} + ${fmt(b)}${o.shown ? ` = ${fmt(a + b)}` : ''}, then subtracts ${fmt(a)}. How can ${o.pronoun2} do it faster?`
      : `Fill in ${eqText}. What is the fastest way?`;
    return {
      id: o.id, type: 'parts', skill: 'efficient',
      prompt,
      display: eqText,
      parts: [
        { kind: 'choice', label: 'Choose the fastest way.', answer: SWITCH, choices: order(o, [SWITCH].concat(o.learn ? SLOW_LEARN : SLOW)) },
        { kind: 'num', label: 'The blank:', answer: b }
      ],
      hint: o.hint || 'Are the same numbers on both sides?',
      explanation: `${fmt(a)} is on both sides, so the other side needs ${fmt(b)}. The order changed, so the sum is the same: the blank is ${fmt(b)}. ` +
        `No adding or subtracting is needed. (The slow way also gives ${fmt(a + b)} − ${fmt(a)} = ${fmt(b)}.)`
    };
  }

  /** Which equations are true? o: { id, eqs: [[left addends], [right addends]] ×4, seed?, r? } */
  function trueQ(o) {
    const text = (e) => `${plus(e[0])} = ${plus(e[1])}`;
    const all = o.eqs.map(text);
    const right = o.eqs.filter((e) => sum(e[0]) === sum(e[1])).map(text);
    const why = o.eqs.map((e) => (sum(e[0]) === sum(e[1])
      ? `${text(e)} is true: the same addends in a different order (${fmt(sum(e[0]))} on both sides).`
      : `${text(e)} is not true: ${fmt(sum(e[0]))} is not ${fmt(sum(e[1]))}. Look for switched digits.`));
    return {
      id: o.id, type: 'parts', skill: 'true',
      prompt: 'Which equations are true? Choose all.',
      parts: [{ kind: 'multi', label: 'Choose every true equation.', answer: right, choices: order(o, all) }],
      hint: o.hint || 'Check every number on both sides. Watch for switched digits.',
      explanation: why.join(' ')
    };
  }

  // ---------- Learn: five steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const story = (html) => `<div class="story"><p>${html}</p></div>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const BLANK = '<span class="blank" role="img" aria-label="blank"></span>';
  const gv = (addends, pair, reveal, extra) => fig(Object.assign({ fig: 'groupV', addends, pair, reveal }, extra || {}));

  // Numbers used in the Learn examples; Your Turn never repeats them.
  const DEMO = [36, 18, 245, 132, 34, 50, 66, 146, 289, 54, 125, 431, 215, 29, 45, 71, 643, 258, 340, 185];
  const ok = (n) => !DEMO.includes(n);
  /** Keep drawing until the question prints none of its own answers (skip for the order questions, where it is the point). */
  function noLeak(make) {
    let q;
    for (let g = 0; g < 400; g++) { q = make(); if (q && !leaks(q)) return q; }
    return q;
  }
  /** a and b are not the same digits switched around (e.g. 318 and 381). */
  const notSwitched = (a, b) => String(a).split('').sort().join() !== String(b).split('').sort().join();

  // Step 1: switch the order.
  function orderCheck(r) {
    let a, b;
    do { a = pv.randInt(r, 101, 899); b = pv.randInt(r, 10, 899); } while (a === b || !ok(a) || !ok(b) || !notSwitched(a, b));
    return orderQ({ id: 'learn-1', a, b, form: pv.randInt(r, 0, 3), hint: 'Find the number that is on one side but missing on the other side.' });
  }

  // Step 2: add the named pair first (review A-20: the pair total and its place vary).
  function groupCheck(r) {
    return noLeak(() => {
      const P = pv.pick(r, [60, 70, 80, 90, 100, 200, 300]);
      let x, y;
      do {
        x = P >= 200 ? pv.randInt(r, 101, P - 11) : pv.randInt(r, 11, P - 11);
        y = P - x;
      } while (ones(x) === 0 || y < 11 || x === y || !ok(x) || !ok(y));
      let z;
      do { z = P % 100 === 0 ? pv.randInt(r, 2, 9) * 10 : pv.randInt(r, 1, 6) * 100; } while (!ok(z) || z === x || z === y);
      const pos = pv.pick(r, PAIRS);
      const rest = [0, 1, 2].find((n) => !pos.includes(n));
      const ad = [];
      const [px, py] = r() < 0.5 ? [x, y] : [y, x];
      ad[pos[0]] = px; ad[pos[1]] = py; ad[rest] = z;
      return {
        id: 'learn-2', type: 'parts', skill: 'group',
        prompt: `Add the three addends. Add ${fmt(px)} and ${fmt(py)} first.`,
        figure: { fig: 'groupV', addends: ad, pair: pos, pairSum: '?', reveal: 'v', label: `${ad.map(fmt).join(' plus ')}. Add ${fmt(px)} and ${fmt(py)} first.` },
        parts: [
          { kind: 'num', label: `${fmt(px)} + ${fmt(py)} =`, answer: P },
          { kind: 'num', label: 'Total:', answer: P + z }
        ],
        hint: 'Which ones digits make 10?',
        explanation: `${pairWhy(px, py)} Then ${fmt(P)} + ${fmt(z)} = ${fmt(P + z)}. You can group the addends any way, and the sum stays the same.`
      };
    });
  }

  /** Three addends with exactly one pair ending in 00 (H a multiple of 100 from 200 to 700, total ≤ 999). */
  function hundredTriple(r) {
    for (;;) {
      const H = pv.randInt(r, 2, 7) * 100;
      const x = pv.randInt(r, 101, H - 11);
      const y = H - x;
      if (ones(x) === 0 || x === y || !ok(x) || !ok(y)) continue;
      const z = pv.randInt(r, 11, 999 - H);
      if (!ok(z) || z === x || z === y || z === H) continue;
      const ad = pv.shuffle(r, [x, y, z]);
      if (onlyPair(ad, '00') < 0) continue;
      return ad;
    }
  }
  /** Three addends with exactly one pair ending in 0 (not 00), and a last step with no regrouping (review A-19). */
  function tenTriple(r) {
    for (;;) {
      const H = pv.randInt(r, 15, 60) * 10;
      if (H % 100 === 0) continue;
      const x = pv.randInt(r, 11, H - 11);
      const y = H - x;
      if (ones(x) === 0 || x === y || Math.max(x, y) < 100 || !ok(x) || !ok(y)) continue;
      const z = pv.randInt(r, 11, 999 - H);
      if (tens(H) + tens(z) > 9 || !ok(z) || z === x || z === y) continue;
      const ad = pv.shuffle(r, [x, y, z]);
      if (onlyPair(ad, '0') < 0) continue;
      return ad;
    }
  }

  // Step 3: find the friendly pair. About one question in three is the "ends in 0" kind.
  function friendlyCheck(r) {
    const tensKind = r() < 1 / 3;
    return noLeak(() => friendlyQ({ id: 'learn-3', addends: tensKind ? tenTriple(r) : hundredTriple(r), ends: tensKind ? '0' : '00' }));
  }

  // Step 4: which expressions show the total? (six choices: three ✓, subtraction, switched digits, changed by 10)
  const TABLES = [['Seeds Planted', 'seeds'], ['Cans Collected', 'cans'], ['Laps Swum', 'laps'], ['Pages Read', 'pages'], ['Stickers Earned', 'stickers']];
  function sameCheck(r) {
    return noLeak(() => {
      let p, q, rr;
      for (;;) {
        p = pv.randInt(r, 11, 89); rr = 100 - p; q = pv.randInt(r, 12, 98);
        if (ones(p) === 0 || p === rr || !ok(p) || !ok(rr) || !ok(q)) continue;
        if (ones(q) === 0 || ones(q) === tens(q) || [p, rr, reverse(q)].includes(q) || [p, rr].includes(reverse(q))) continue;
        break;
      }
      const v = [p, q, rr];
      const perms = [[0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      const two = pv.shuffle(r, perms).slice(0, 2);
      const tenIdx = pv.pick(r, [0, 2]);
      const delta = v[tenIdx] + 10 <= 98 ? 10 : -10;
      const [title] = pv.pick(r, TABLES);
      const qq = sameQ({ id: 'learn-4', title, rows: [['Monday', p], ['Tuesday', q], ['Wednesday', rr]], rights: [[0, 1, 2]].concat(two),
        sub: q > rr ? [1, 2, 0] : [2, 1, 0], ten: [tenIdx, delta], r, prompt: `The table shows the ${title.toLowerCase()}. Which expressions find the total? Choose all.`,
        hint: 'Check that each one adds the same three numbers.' });
      return new Set(qq.parts[0].choices).size === 6 ? qq : null;
    });
  }

  // Step 5: alternate between the efficient fill-in (a) and a receipt (b).
  let effServed = 0;
  const WHO = ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Ivan', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa'];
  function efficientCheck(r) {
    const kind = effServed % 2;
    effServed += 1;
    if (kind === 0) {
      let a, b;
      do { a = pv.randInt(r, 101, 899); b = pv.randInt(r, 101, 899); } while (a === b || !ok(a) || !ok(b) || !notSwitched(a, b));
      return efficientQ({ id: 'learn-5', a, b, learn: true, r });
    }
    return noLeak(() => {
      const ad = hundredTriple(r);
      const k = onlyPair(ad, '00');
      const [i, j] = PAIRS[k];
      const choices = pairChoices(ad, true);
      const H = ad[i] + ad[j], total = sum(ad);
      const rest = [0, 1, 2].find((n) => n !== i && n !== j);
      const who = pv.pick(r, WHO);
      return {
        id: 'learn-5', type: 'parts', skill: 'efficient',
        prompt: `${who} checks a receipt: ${plus(ad, true)}. Add the prices the easy way.`,
        figure: { fig: 'table', title: 'Receipt', head: ['Item', 'Price'], rows: [['Item 1', ad[0]], ['Item 2', ad[1]], ['Item 3', ad[2]], ['Total', '?']], money: true },
        parts: [
          { kind: 'choice', label: 'Which prices should you add first?', answer: choices[k], choices, compact: true },
          { kind: 'num', label: 'Total ($):', answer: total }
        ],
        hint: 'Find two prices that make a hundred.',
        explanation: `${pairWhy(ad[i], ad[j])} Then $${fmt(H)} + $${fmt(ad[rest])} = $${fmt(total)}.`
      };
    });
  }

  const steps = [
    {
      id: 'order', kind: 'slides', title: 'Switch the order',
      explain: 'You can add numbers in any order. The sum stays the same.',
      slides: [
        fig({ fig: 'counters', groups: [{ n: 4, kind: 'a', label: '4 circles' }, { n: 3, kind: 'b', label: '3 squares' }], caption: '4 + 3 = 7' }) +
          fig({ fig: 'counters', groups: [{ n: 3, kind: 'b', label: '3 squares' }, { n: 4, kind: 'a', label: '4 circles' }], caption: '3 + 4 = 7' }) +
          say('4 + 3 = <b>7</b>. 3 + 4 = <b>7</b>. Same counters, same sum.'),
        big(`36 + 18 = ${fmt(36 + 18)}`) + big(`18 + 36 = ${fmt(18 + 36)}`) + say('Switch the order of the addends. The sum is the same.'),
        say('This works with big numbers too.') + big(`245 + 132 = 132 + ${BLANK}`) +
          say(`Both sides need the same two addends. 132 is already on the right side, so the blank is <b>245</b>. You don't even need to add!`) +
          say(`(Both sides are ${fmt(245 + 132)}.)`)
      ],
      check(r) { return orderCheck(r); }
    },
    {
      id: 'group', kind: 'slides', title: 'Group the addends',
      explain: 'With three addends, you can choose which two to add first. The sum stays the same.',
      slides: [
        story('Mia found <b>34</b> shells on Monday, <b>50</b> on Tuesday and <b>66</b> on Wednesday. How many shells did she find?') + gv([34, 50, 66], [0, 1], 'top'),
        say('Way 1: add 34 and 50 first.') + gv([34, 50, 66], [0, 1], 'all') + say(`34 + 50 = ${fmt(84)}, then ${fmt(84)} + 66 = <b>${fmt(150)}</b>.`),
        say('Way 2: add 34 and 66 first.') + gv([34, 50, 66], [0, 2], 'all', { look: true }) +
          say(`34 + 66 = ${fmt(100)}: 4 + 6 make a ten, and 3 tens + 6 tens + 1 ten make 100. Then ${fmt(100)} + 50 = <b>${fmt(150)}</b>. Same sum!`),
        say('Which way was easier?') +
          `<div class="slide-pair">${gv([34, 50, 66], [0, 1], 'all', { caption: 'Way 1' })}${gv([34, 50, 66], [0, 2], 'all', { caption: 'Way 2: adding to 100 is easy' })}</div>`
      ],
      check(r) { return groupCheck(r); }
    },
    {
      id: 'friendly', kind: 'slides', title: 'Find a friendly pair',
      explain: 'Look for two addends that make a number ending in 00, or at least ending in 0. Add them first.',
      slides: [
        gv([146, 289, 54], [0, 2], 'top', { look: true }) + say('Look at the ones digits: <b>6</b> and <b>4</b> make 10. Try 146 + 54.'),
        gv([146, 289, 54], [0, 2], 'v', { look: true }) + say(pairWhy(146, 54)),
        gv([146, 289, 54], [0, 2], 'all') + say(`${fmt(200)} + 289 = <b>${fmt(489)}</b>.`),
        say('A pair that ends in 0 helps too.') + gv([125, 431, 215], [0, 2], 'all', { look: true }) +
          say(`5 + 5 make 10, so add 125 + 215 = <b>${fmt(340)}</b> first. Then ${fmt(340)} + 431 = <b>${fmt(771)}</b>.`) +
          say(`(The other pairs make ${fmt(125 + 431)} and ${fmt(431 + 215)}. They do not end in 0.)`)
      ],
      check(r) { return friendlyCheck(r); }
    },
    {
      id: 'same', kind: 'slides', title: 'Same addends, same total',
      explain: 'Any order of the same addends gives the same total. Changing a number or subtracting changes the total.',
      slides: [
        fig({ fig: 'table', title: 'Seeds Planted', head: ['Day', 'Number'], rows: [['Monday', 29], ['Tuesday', 45], ['Wednesday', 71]] }) +
          say('Which expressions find the total number of seeds?'),
        `<div class="money"><p><b>✓ 29 + 45 + 71</b></p><p><b>✓ 71 + 29 + 45</b></p><p><b>✓ 45 + 71 + 29</b></p></div>` +
          say('All three add the same addends: 29, 45 and 71. Only the order changed.'),
        `<div class="money"><p><b>✗ 71 − 45 + 29</b>: that subtracts.</p><p><b>✗ 29 + 54 + 71</b>: 54 is not 45. The digits are switched.</p></div>` +
          say('Read every number and every sign.'),
        gv([29, 45, 71], [0, 2], 'all', { look: true }) + say(`Total: 29 + 71 = ${fmt(100)}, then ${fmt(100)} + 45 = <b>${fmt(145)}</b> seeds.`)
      ],
      check(r) { return sameCheck(r); }
    },
    {
      id: 'efficient', kind: 'slides', title: 'Add more efficiently',
      explain: 'Use the order and grouping to save work.',
      slides: [
        story(`Kayla must fill in 643 + 258 = ${BLANK} + 643.`) +
          `<div class="money"><p class="muted">Slow way: 643 + 258 = ${fmt(643 + 258)}. Then ${fmt(643 + 258)} − 643 = 258.</p></div>` + say('That works, but it is slow.'),
        big(`643 + 258 = <span class="fig-ans">258</span> + 643`) +
          say('Faster: both sides need the same two addends. 643 is on both sides, so the blank is <b>258</b>. No adding needed!'),
        fig({ fig: 'table', title: 'Receipt', head: ['Item', 'Price'], rows: [['Book', 215], ['Game', 340], ['Puzzle', 185], ['Total', '?']], money: true }) +
          gv([215, 340, 185], [0, 2], 'all', { look: true }) +
          say(`Group $215 + $185 = <b>$${fmt(400)}</b> first (5 + 5 = 10). Then $${fmt(400)} + $340 = <b>$${fmt(740)}</b>.`)
      ],
      check(r) { return efficientCheck(r); }
    }
  ];

  // ---------- Practice (14) and Test (14): matched one for one, different numbers ----------
  const practiceItems = () => [
    orderQ({ id: 'p1', a: 436, b: 217, form: 0 }),
    orderQ({ id: 'p2', a: 382, b: 64, form: 1 }),
    orderQ({ id: 'p3', a: 614, b: 278, form: 2 }),
    orderQ({ id: 'p4', a: 709, b: 85, form: 3 }),
    sameQ({ id: 'p5', title: 'Cups of Lemonade Sold', rows: [['Friday', 47], ['Saturday', 76], ['Sunday', 53]], rights: [[0, 1, 2], [2, 0, 1], [1, 2, 0]], sub: [1, 2, 0], seed: 5,
      prompt: 'The table shows the cups of lemonade sold each day. Which expressions find the total? Choose all.' }),
    friendlyQ({ id: 'p6', addends: [263, 418, 137] }),
    friendlyQ({ id: 'p7', addends: [46, 371, 254] }),
    friendlyQ({ id: 'p8', addends: [296, 214, 304] }),
    friendlyQ({ id: 'p9', addends: [562, 175, 38] }),
    friendlyQ({ id: 'p10', addends: [145, 231, 205], ends: '0' }),
    moneyQ({ id: 'p11', story: 'A pet shop orders fish food for $276, tanks for $415 and plants for $124.',
      ask: 'Which two costs should it add first?', items: [['Fish food', 276], ['Tanks', 415], ['Plants', 124]], seed: 11 }),
    receiptQ({ id: 'p12', who: 'Mr. Lee', his: 'his', pronoun: 'he', prices: [435, 210, 165], names: ['Lamp', 'Chair', 'Rug'], seed: 12 }),
    efficientQ({ id: 'p13', who: 'Owen', pronoun: 'He', pronoun2: 'he', a: 588, b: 143, shown: true, seed: 13 }),
    trueQ({ id: 'p14', eqs: [[[52, 319], [319, 52]], [[407, 26], [26, 470]], [[140, 60, 25], [25, 140, 60]], [[63, 208], [208, 36]]] })
  ];

  const parentTips = {
    p1: 'Ask: what is the same on both sides?',
    p5: 'Ask your child to point to the number in each choice that does not match the table.',
    p6: 'Cover the hundreds and ask which ones digits make 10.',
    p10: 'This pair makes a ten, not a hundred. That still helps.',
    p13: 'Ask: do you need to add at all?'
  };
  const guided = practiceItems();
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });
  guided.push(
    {
      id: 'g-e1', type: 'explain', skill: 'friendly',
      prompt: 'How would you group 418 + 236 + 182 to make it easy? Explain.',
      parent: 'Ask which ones digits make 10, then check the tens.',
      listenFor: [`418 + 182 = ${fmt(418 + 182)}, because 8 + 2 make 10 and the tens make 10 too.`, `Then ${fmt(418 + 182)} + 236 = ${fmt(418 + 182 + 236)}.`],
      explanation: `Group 418 and 182 first: ${pairWhy(418, 182)} Then ${fmt(600)} + 236 = ${fmt(836)}.`
    },
    {
      id: 'g-e2', type: 'explain', skill: 'efficient',
      prompt: 'How can changing the order of three addends help you add?',
      parent: 'Any answer about putting the easy pair together first is right.',
      listenFor: ['Put the friendly pair (the two that make a ten or a hundred) together and add it first.', 'The sum does not change when you change the order.'],
      explanation: 'You can move the two addends that make a ten or a hundred next to each other and add them first. The sum does not change, and the adding is easier.'
    }
  );

  const bank = practiceItems();

  const testItems = [
    orderQ({ id: 't1', a: 527, b: 164, form: 0 }),
    orderQ({ id: 't2', a: 253, b: 91, form: 1 }),
    orderQ({ id: 't3', a: 738, b: 186, form: 2 }),
    orderQ({ id: 't4', a: 842, b: 67, form: 3 }),
    sameQ({ id: 't5', title: 'Books Read', rows: [['Monday', 38], ['Tuesday', 85], ['Wednesday', 62]], rights: [[0, 1, 2], [2, 0, 1], [1, 2, 0]], sub: [1, 2, 0],
      prompt: 'The table shows the books read each day. Which expressions find the total? Choose all.' }),
    friendlyQ({ id: 't6', addends: [345, 271, 155] }),
    friendlyQ({ id: 't7', addends: [63, 412, 237] }),
    friendlyQ({ id: 't8', addends: [397, 186, 203] }),
    friendlyQ({ id: 't9', addends: [581, 207, 19] }),
    friendlyQ({ id: 't10', addends: [126, 432, 304], ends: '0' }),
    moneyQ({ id: 't11', story: 'A school orders paint for $238, paper for $419 and brushes for $162.',
      ask: 'Which two costs should it add first?', items: [['Paint', 238], ['Paper', 419], ['Brushes', 162]] }),
    receiptQ({ id: 't12', who: 'Ms. Park', his: 'her', pronoun: 'she', prices: [255, 320, 145], names: ['Shoes', 'Coat', 'Hat'] }),
    efficientQ({ id: 't13', who: 'Pia', pronoun: 'She', pronoun2: 'she', a: 675, b: 218 }),
    trueQ({ id: 't14', eqs: [[[74, 506], [506, 74]], [[318, 45], [45, 381]], [[230, 70, 18], [18, 230, 70]], [[96, 125], [125, 69]]] })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Addition Properties Test: the same 14 items each time; choice order changes with each attempt. */
  function propertiesTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-4'] = {
    id: '2-4',
    storageKey: 'mathbook:v2:lesson-2-4',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-4',
    title: 'Use Addition Properties to Add',
    subtitle: 'Change the order or the grouping to add more easily',
    objective: 'I can change the order of addends or group them in a different way to add more easily, and I know the sum stays the same.',
    parentLearn: {
      goal: [
        'Switch the order or change the grouping to add more easily. The sum does not change.',
        'Fill in a missing addend without adding (for example 245 + 132 = 132 + ___).',
        'Find a friendly pair (two addends that make a number ending in 0 or 00), add it first, then add the third number.',
        'Choose every expression with the same addends, and spot ones that subtract or switch digits.',
        'Explain why a way is more efficient.'
      ],
      words: [
        { term: 'Addend', meaning: 'A number you add.', example: 'In 34 + 66, the addends are 34 and 66.' },
        { term: 'Sum', meaning: 'The answer when you add.' },
        { term: 'Equation', meaning: 'A number sentence with an equal sign. Both sides have the same value.' },
        { term: 'Order property', meaning: 'Grown-up name: Commutative Property of Addition. You can switch the order of addends, and the sum stays the same.', example: '36 + 18 = 18 + 36' },
        { term: 'Grouping property', meaning: 'Grown-up name: Associative Property of Addition. You can choose which addends to add first, and the sum stays the same.', example: '(34 + 50) + 66 = 34 + (50 + 66)' },
        { term: 'Friendly pair', meaning: 'Two addends whose sum ends in 0 or 00.', example: '46 and 54 (100), or 135 and 215 (350)' },
        { term: 'Efficient', meaning: 'A faster, easier way that still gives the right answer.' }
      ],
      demoVisual: fig({ fig: 'groupV', addends: [34, 50, 66], pair: [0, 2], reveal: 'all', look: true }),
      demonstrate: [
        'Show 4 + 3 and 3 + 4 with objects. Same sum.',
        'Write 245 + 132 = 132 + ___. Ask: "Do we need to add?" (No: 245.)',
        'Write 34 + 50 + 66. Add left to right (84, then 150). Then add 34 + 66 first (100, then 150). Same sum; the second way is easier.',
        'Write 146 + 289 + 54. Circle the 6 and the 4. Add 146 + 54 = 200, then 200 + 289 = 489.',
        'Book example: Billy won 27 + 53 + 40 tickets. 27 + 53 = 80 first, then 80 + 40 = 120. Or 53 + 40 = 93, then 27 + 93 = 120.',
        'The child sees the words "order" and "grouping". The book draws a V joining the two addends added first; the app does too (no parentheses yet).'
      ],
      ask: [
        '"Which two addends make a ten or a hundred?"',
        '"Does the order change the sum?"',
        '"Is there a faster way?"',
        '"Is every number the same on both sides?"'
      ],
      checklist: [
        'Fills in a missing addend without adding (blank in any of the four places).',
        'Adds a named pair first and finds the total.',
        'Finds the friendly pair, adds it first, and finds the total.',
        'Chooses every expression with the same addends; rejects subtraction and switched digits.',
        'Explains why switching the order or grouping is more efficient.',
        'Scores 90% or higher on the Addition Properties Test.'
      ]
    },
    mistakes: [
      'Doing extra work (adding, then subtracting to fill a blank). Ask: "What is on both sides already?"',
      'Copying the wrong number into the blank (the number already on that side). Ask: "Which number is missing from that side?"',
      'Missing switched digits (42 and 24, 381 and 318). Say: "Read every digit."',
      'Thinking subtraction can be moved around like addition (76 − 53 + 47). Say: "Only adding can be switched around freely."',
      'Adding left to right only and missing the friendly pair. Ask: "Which ones digits make 10?"',
      'Ones make 10 but forgetting the extra ten (263 + 137 = 390). Say: "10 ones make 1 more ten."'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How can changing the order of three addends help you add faster?',
        idea: 'You can put two addends that make a ten or a hundred next to each other and add them first.'
      }
    },
    skills: {
      order: 'Switching the order of addends',
      group: 'Grouping addends',
      friendly: 'Adding a friendly pair first',
      same: 'Choosing expressions with the same total',
      money: 'Grouping prices to find a total',
      efficient: 'Choosing the efficient way',
      true: 'Deciding if an equation is true'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Addition Properties Practice', blurb: 'All 14 practice questions: switching the order, friendly pairs, tables, prices and true equations.', ids: bank.map((q) => q.id) }],
    tests: {
      properties: { id: 'properties', title: 'Addition Properties Test', questions: 14, blurb: 'Switching the order, grouping, friendly pairs, and true equations.', generate: propertiesTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _onlyPair: onlyPair,
    _pairWhy: pairWhy
  };
})(typeof window !== 'undefined' ? window : globalThis);
