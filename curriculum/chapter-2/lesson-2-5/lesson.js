/*
 * Mathbook — Chapter 2, Lesson 2-5: Addition Patterns (even and odd sums)
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-5.md (with the batch-B review fixes B-03, B-05, B-10…B-15, B-24, N-1).
 * The spec's "word + equation" items are two kinds of question here, because the shared engine keeps a written
 * equation (chain preset 'free', DESIGN §4.2) as its own question: word-fill items choose even/odd for pattern
 * sentences, and equation items keep the blank in the sentence ("odd + ___ = even. Write one equation…"), so the
 * child must work out the missing word to write a fitting equation.
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-5.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const EVEN = 'even', ODD = 'odd';
  const par = (n) => (n % 2 === 0 ? EVEN : ODD);
  const ones = (n) => n % 10;
  const sumOf = (list) => list.reduce((x, y) => x + y, 0);
  const plus = (list) => list.map(fmt).join(' + ');
  const nb = (t) => t.replace(/ ([+=]) /g, ' $1 ');
  /** "7 + 4 = 11 in the ones place, and 11 is odd." */
  const onesWhy = (a, b) => `${ones(a)} + ${ones(b)} = ${ones(a) + ones(b)} in the ones place, and ${ones(a) + ones(b)} is ${par(ones(a) + ones(b))}.`;
  /** Why a type of sum: pairs and leftovers. */
  function ruleWhy(pa, pb) {
    if (pa === EVEN && pb === EVEN) return 'Even + even = even: neither number has a leftover.';
    if (pa === ODD && pb === ODD) return 'Odd + odd = even: the two leftovers make a new pair.';
    return 'Even + odd = odd: the one leftover has no partner.';
  }

  /** True when a number the child must type is printed anywhere in the question. */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const fixedOrder = (seed, list) => pv.shuffle(pv.rng(seed), list);
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? fixedOrder(o.seed, list) : list);
  const WORDS = [EVEN, ODD];

  // The seven pattern sentences (the book's six plus "even + ___ = odd", review B-12). [a, b, sum] types.
  const SENTENCES = {
    'S=e+e': { text: '___ = even + even', answer: EVEN, types: [EVEN, EVEN] },
    'o+e=S': { text: 'odd + even = ___', answer: ODD, types: [ODD, EVEN] },
    'o+B=e': { text: 'odd + ___ = even', answer: ODD, types: [ODD, ODD] },
    'e+o=S': { text: 'even + odd = ___', answer: ODD, types: [EVEN, ODD] },
    'e+B=e': { text: 'even + ___ = even', answer: EVEN, types: [EVEN, EVEN] },
    'S=o+o': { text: '___ = odd + odd', answer: EVEN, types: [ODD, ODD] },
    'e+B=o': { text: 'even + ___ = odd', answer: ODD, types: [EVEN, ODD] }
  };
  const full = (k) => SENTENCES[k].text.replace('___', SENTENCES[k].answer);

  /** Fill the missing word in two or three pattern sentences. o: { id, keys: [...], hint?, seed?, r? } */
  function wordFillQ(o) {
    return {
      id: o.id, type: 'parts', skill: 'rules',
      prompt: 'Write even or odd to make each pattern true.',
      parts: o.keys.map((k) => ({ kind: 'choice', label: SENTENCES[k].text, answer: SENTENCES[k].answer, choices: WORDS.slice(), compact: true })),
      hint: o.hint || 'Think about pairs. Does a number have one left over?',
      explanation: o.keys.map((k) => `${full(k)}.`).join(' ') + ' Even + even = even, odd + odd = even, and even + odd = odd.'
    };
  }

  /** Write one equation that fits a sentence with a blank (chain preset 'free'). o: { id, key, eg: [a, b], hint? } */
  function equationQ(o) {
    const S = SENTENCES[o.key];
    const [ta, tb] = S.types;
    const mixed = ta !== tb;
    const [a, b] = o.eg;
    return {
      id: o.id, type: 'chain', preset: 'free', skill: 'rules',
      prompt: `${S.text}. Write one equation with 3-digit numbers that fits.`,
      addends: [{ digits: 3, parity: ta }, { digits: 3, parity: tb }], anyOrder: true,
      hint: o.hint || (mixed ? 'You need one even and one odd number. Then add.' : `Choose two ${ta} numbers. Look at the ones digits. Then add.`),
      explanation: `${full(o.key)}. ${ruleWhy(ta, tb)} For example, ${plus([a, b])} = ${fmt(a + b)}` +
        (mixed ? ' (the even and odd numbers can be in either order).' : '.')
    };
  }

  /** Predict even or odd, then add. o: { id, a, b, skill? } */
  function sumQ(o) {
    const { a, b } = o, s = a + b;
    return {
      id: o.id, type: 'parts', skill: o.skill || 'sum',
      prompt: `${plus([a, b])}: will the sum be even or odd? Then find the sum.`,
      parts: [
        { kind: 'choice', label: 'The sum will be', answer: par(s), choices: WORDS.slice(), compact: true },
        { kind: 'num', label: `${plus([a, b])} =`, answer: s }
      ],
      hint: o.hint || `Look at ${ones(a)} + ${ones(b)}.`,
      explanation: `${onesWhy(a, b)} So the sum is ${par(s)}. ${plus([a, b])} = ${fmt(s)}, which is ${par(s)}.`
    };
  }

  // Someone's sum has the wrong type (book Reflect, O13, T6).
  const wrongTypeChoices = (pa, pb, c) => {
    const want = par(sumOf([pa === EVEN ? 0 : 1, pb === EVEN ? 0 : 1]));
    const name = `${pa === EVEN ? 'Even' : 'Odd'} + ${pb}`;
    const other = want === EVEN ? ODD : EVEN;
    return {
      right: `No. ${name} must be ${want}, and ${fmt(c)} is ${par(c)}.`,
      wrong: [`Yes. ${name} is always ${other}.`, 'Yes. It is close to the real sum.', `No. ${name} must be ${other}, and ${fmt(c)} is ${want}.`]
    };
  };
  /** "Ben writes a + b = c. Can this be right?" (c has the wrong type). o: { id, who, a, b, c, seed?, r? } */
  function wrongTypeQ(o) {
    const { a, b, c } = o, s = a + b;
    const C = wrongTypeChoices(par(a), par(b), c);
    return {
      id: o.id, type: 'parts', skill: 'check',
      prompt: `${o.who} writes ${plus([a, b])} = ${fmt(c)}. Use a pattern: can this be right? Then find the sum.`,
      parts: [
        { kind: 'choice', label: 'Can it be right?', answer: C.right, choices: order(o, [C.right].concat(C.wrong)) },
        { kind: 'num', label: 'The correct sum:', answer: s }
      ],
      hint: o.hint || 'Predict even or odd first. Is the answer the right kind?',
      explanation: `${ruleWhy(par(a), par(b))} ${fmt(c)} is ${par(c)}, so it can't be right. ${plus([a, b])} = ${fmt(s)}.`
    };
  }

  // A matching type does not prove a sum is right (Work Together, PT4, T7; review B-05: no sum in the key).
  const proveRight = (c) => `No. ${fmt(c)} is odd like it should be, but a matching even/odd doesn't prove the sum is right.`;
  const PROVE_WRONG = ['Yes. The even/odd pattern proves the sum is right.', 'Yes. Every odd number is a correct sum for even + odd.', 'No. Even + odd should be even.'];
  /** o: { id, who, a, b, c (odd, wrong), pronoun, seed?, r? } */
  function proveQ(o) {
    const { a, b, c } = o, s = a + b;
    return {
      id: o.id, type: 'parts', skill: 'check',
      prompt: `${o.who} writes ${plus([a, b])} = ${fmt(c)}. ${o.pronoun} says it must be right because even + odd = odd. Do you agree?`,
      parts: [
        { kind: 'choice', label: 'Do you agree?', answer: proveRight(c), choices: order(o, [proveRight(c)].concat(PROVE_WRONG)) },
        { kind: 'num', label: 'The correct sum:', answer: s }
      ],
      hint: o.hint || 'Add it yourself.',
      explanation: `${fmt(c)} is odd, like even + odd should be. But ${plus([a, b])} = ${fmt(s)}, not ${fmt(c)}. A pattern can catch a wrong sum. It can't prove a sum is right, so always add to be sure.`
    };
  }

  /** One "why" choice. o: { id, skill, prompt, right, wrong: [...], explanation, seed?, r?, hint? } */
  function whyQ(o) {
    return {
      id: o.id, type: 'parts', skill: o.skill,
      prompt: o.prompt,
      parts: [{ kind: 'choice', label: o.label || 'Choose the best reason.', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) }],
      hint: o.hint, explanation: o.explanation
    };
  }

  /** Two groups that should make an even (or odd) total. o: { id, story, want, pairs: [[x, y] ...], seed?, r? } */
  function totalsQ(o) {
    const text = ([x, y]) => `${x} and ${y}`;
    const right = o.pairs.filter(([x, y]) => par(x + y) === o.want).map(text);
    return {
      id: o.id, type: 'parts', skill: 'apply',
      prompt: `${o.story} Choose all that work.`,
      parts: [{ kind: 'multi', label: `Which make an ${o.want} total?`, answer: right, choices: order(o, o.pairs.map(text)), compact: true }],
      hint: o.hint || (o.want === EVEN ? 'Both even, or both odd.' : 'One even and one odd.'),
      explanation: o.pairs.map(([x, y]) => `${x} + ${y} = ${x + y} (${par(x + y)})`).join(', ') + `. ` +
        (o.want === EVEN ? 'Even + even and odd + odd make an even total.' : 'Only even + odd makes an odd total.')
    };
  }

  /** Three addends: even or odd, then how many. o: { id, story, nums: [a, b, c] } */
  function threeQ(o) {
    const [a, b, c] = o.nums, ab = a + b, s = ab + c;
    return {
      id: o.id, type: 'parts', skill: 'apply',
      prompt: o.story,
      parts: [
        { kind: 'choice', label: 'Is the total even or odd?', answer: par(s), choices: WORDS.slice(), compact: true },
        { kind: 'num', label: 'How many in all?', answer: s }
      ],
      hint: o.hint || 'Do two numbers first. Then add the third.',
      explanation: `${plus([a, b])} is ${par(a)} + ${par(b)} = ${par(ab)}. Then ${par(ab)} + ${par(c)} (${fmt(c)}) = ${par(s)}. ` +
        `${plus([a, b])} = ${fmt(ab)}, and ${fmt(ab)} + ${fmt(c)} = ${fmt(s)}.`
    };
  }

  /** Which claimed sums can't be right? (type check only) o: { id, eqs: [[a, b, c] ...], seed?, r? } */
  function cantQ(o) {
    const text = ([a, b, c]) => `${plus([a, b])} = ${fmt(c)}`;
    const right = o.eqs.filter(([a, b, c]) => par(a + b) !== par(c)).map(text);
    return {
      id: o.id, type: 'parts', skill: 'check',
      prompt: 'Use patterns. Which sums can\'t be right? Choose all.',
      parts: [{ kind: 'multi', label: 'Choose every sum that can\'t be right.', answer: right, choices: order(o, o.eqs.map(text)) }],
      hint: o.hint || 'Predict even or odd for each. Is each answer the right kind?',
      explanation: o.eqs.map(([a, b, c]) => (par(a + b) !== par(c)
        ? `${text([a, b, c])} can't be right: ${par(a)} + ${par(b)} must be ${par(a + b)}, but ${fmt(c)} is ${par(c)}.`
        : `${text([a, b, c])} is the right kind (${par(c)}).`)).join(' ') + ' (The pattern can only catch a sum of the wrong kind.)'
    };
  }

  /** Choose all the even (or odd) numbers. o: { id, want, nums, skill?, seed?, r? } */
  function pickQ(o) {
    const right = o.nums.filter((n) => par(n) === o.want).map(fmt);
    return {
      id: o.id, type: 'parts', skill: o.skill || 'parity',
      prompt: `Choose all the ${o.want} numbers.`,
      parts: [{ kind: 'multi', label: `Which numbers are ${o.want}?`, answer: right, choices: order(o, o.nums.map(fmt)), compact: true }],
      hint: o.hint || 'Look only at the ones digit. 0, 2, 4, 6, 8 mean even.',
      explanation: o.nums.map((n) => `${fmt(n)} ends in ${ones(n)}, so it is ${par(n)}.`).join(' ')
    };
  }

  // ---------- Learn: five steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const look = (n) => { const t = fmt(n); return `${t.slice(0, -1)}<span class="rd-d is-look">${t.slice(-1)}</span>`; };
  const pairs = (groups, extra) => fig(Object.assign({ fig: 'counters', pairs: true, groups }, extra || {}));
  const RULE_CARD = '<div class="money"><p><b>Even:</b> the ones digit is 0, 2, 4, 6 or 8.</p><p><b>Odd:</b> the ones digit is 1, 3, 5, 7 or 9.</p></div>';

  // Numbers used in the Learn examples; Your Turn never repeats them.
  const DEMO = [6, 7, 348, 563, 214, 352, 135, 221, 412, 235, 3, 11, 15, 125, 302, 243, 124, 362, 316, 151, 457, 627, 154, 467, 367];
  const ok = (n) => !DEMO.includes(n);
  /** A 3-digit number of the given type (or any), not a demo number. */
  function num3(r, type, min, max) {
    let n;
    do { n = pv.randInt(r, min || 100, max || 999); } while (!ok(n) || (type && par(n) !== type));
    return n;
  }
  function noLeak(make) {
    let q;
    for (let g = 0; g < 300; g++) { q = make(); if (q && !leaks(q)) return q; }
    return q;
  }

  // Step 1: choose all the even numbers (3 even, 3 odd).
  function parityCheck(r) {
    for (;;) {
      const nums = [num3(r, EVEN), num3(r, EVEN), num3(r, EVEN), num3(r, ODD), num3(r, ODD), num3(r, ODD)];
      if (new Set(nums).size < 6 || new Set(nums.map(ones)).size < 3) continue;
      return pickQ({ id: 'learn-1', want: EVEN, nums, r });
    }
  }

  // Step 2: even + even and odd + odd (both "even"; part order random).
  function sameCheck(r) {
    let a, b, c, d;
    do { a = num3(r, EVEN); b = num3(r, EVEN); } while (a === b || a + b > 998);
    do { c = num3(r, ODD); d = num3(r, ODD); } while (c === d || c + d > 998);
    const p1 = { kind: 'choice', label: `${plus([a, b])} will be`, answer: EVEN, choices: WORDS.slice(), compact: true };
    const p2 = { kind: 'choice', label: `${plus([c, d])} will be`, answer: EVEN, choices: WORDS.slice(), compact: true };
    const swap = r() < 0.5;
    return {
      id: 'learn-2', type: 'parts', skill: 'rules',
      prompt: 'Will each sum be even or odd?',
      parts: swap ? [p2, p1] : [p1, p2],
      hint: 'Even + even: no leftovers. Odd + odd: the two leftovers make a pair.',
      explanation: `${plus([a, b])} = ${fmt(a + b)}: even + even = even. ${plus([c, d])} = ${fmt(c + d)}: odd + odd = even, because the two leftovers make a pair.`
    };
  }

  // Step 3: even + odd, and a cube train that adds the same even number (N-1: start 4–20, never 7, 11 or 15).
  const NOTICE = ['They are all odd.', 'They are all even.', 'They switch: odd, even, odd, even.', 'They are all bigger than 20.'];
  function oddCheck(r) {
    return noLeak(() => {
      let e, o;
      do { e = num3(r, EVEN); o = num3(r, ODD); } while (e + o > 999);
      const [x, y] = r() < 0.5 ? [e, o] : [o, e];
      const wantOdd = r() < 0.5;
      let s;
      do { s = pv.randInt(r, 4, 20); } while ([7, 11, 15].includes(s) || (s % 2 === 1) !== wantOdd);
      const k = pv.pick(r, [2, 4, 6]);
      const seq = [s, s + k, s + 2 * k, s + 3 * k];
      const notice = s % 2 ? NOTICE[0] : NOTICE[1];
      return {
        id: 'learn-3', type: 'parts', skill: 'rules',
        prompt: `Will ${plus([x, y])} be even or odd? Then: start with ${s} cubes and add ${k} each time.`,
        parts: [
          { kind: 'choice', label: `${plus([x, y])} will be`, answer: ODD, choices: WORDS.slice(), compact: true },
          { kind: 'num', label: `${seq.slice(0, 3).join(', ')}, ___ (next number)`, answer: seq[3] },
          { kind: 'choice', label: 'What do you notice about the numbers?', answer: notice, choices: pv.shuffle(r, NOTICE) }
        ],
        hint: `${k} is even. Adding an even number does not change a leftover.`,
        explanation: `${plus([x, y])} = ${fmt(x + y)}: even + odd = odd. The cubes: ${seq.join(', ')}. ` +
          `${k} is even, so the numbers stay ${par(s)} (${par(s)} + even = ${par(s)}).`
      };
    });
  }

  // Step 4: write an equation for a sentence with a missing addend (the blank decides which numbers fit).
  const EG = { 'o+B=e': [173, 245], 'e+B=e': [208, 446], 'e+B=o': [326, 159] };
  function equationCheck(r) {
    const key = pv.pick(r, Object.keys(EG));
    return equationQ({ id: 'learn-4', key, eg: EG[key], hint: 'First decide: even or odd? Then pick 3-digit numbers that end in the right digits, and add.' });
  }

  // Step 5: check a sum with patterns (B-10: 25% right, 35% off by 1, 40% off by 10 or 100; always 3-digit).
  function checkCheck(r) {
    let a, b, S;
    do { a = num3(r, null, 100, 899); b = num3(r, null, 100, 899); S = a + b; } while (a === b || S > 989 || S < 110);
    const u = r();
    let C;
    if (u < 0.25) C = S;
    else if (u < 0.6) C = S + pv.pick(r, [-1, 1]);
    else {
      const opts = [10, -10, 100, -100].map((d) => S + d).filter((x) => x >= 100 && x <= 999);
      C = pv.pick(r, opts);
    }
    const who = pv.pick(r, ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa']);
    const right = C === S;
    return {
      id: 'learn-5', type: 'parts', skill: 'check',
      prompt: `${who} writes ${plus([a, b])} = ${fmt(C)}.`,
      parts: [
        { kind: 'choice', label: `Should ${plus([a, b])} be even or odd?`, answer: par(S), choices: WORDS.slice(), compact: true },
        { kind: 'choice', label: `Is ${fmt(C)} correct?`, answer: right ? 'Yes' : 'No', choices: ['Yes', 'No'], compact: true },
        { kind: 'num', label: `${plus([a, b])} =`, answer: S }
      ],
      hint: 'Predict even or odd first. Then add to check.',
      explanation: `${onesWhy(a, b)} So the sum should be ${par(S)}. ${fmt(C)} is ${par(C)}. ` +
        (right ? `${plus([a, b])} = ${fmt(S)}, so ${fmt(C)} is correct.`
          : par(C) !== par(S) ? `So ${fmt(C)} must be wrong. ${plus([a, b])} = ${fmt(S)}.`
            : `It is the right kind, but adding shows ${plus([a, b])} = ${fmt(S)}, so ${fmt(C)} is wrong.`)
    };
  }

  const steps = [
    {
      id: 'parity', kind: 'slides', title: 'Even or odd?',
      explain: 'Make pairs. If none are left over, the number is even. If one is left over, it is odd.',
      slides: [
        pairs([{ n: 6, kind: 'a', label: '6 cubes' }], { label: '6 cubes in 3 pairs. None left over.' }) + say('6 cubes. Make pairs. None are left over. <b>6 is even.</b>'),
        pairs([{ n: 7, kind: 'a', label: '7 cubes' }], { label: '7 cubes: 3 pairs and 1 left over.' }) + say('7 cubes. Make pairs. One is left over. <b>7 is odd.</b>'),
        say('Big numbers: tens and hundreds always make pairs. Just look at the <b>ones digit</b>.') + RULE_CARD,
        big(look(348)) + say('<b>348</b> ends in 8, so it is <b>even</b>.') + big(look(563)) + say('<b>563</b> ends in 3, so it is <b>odd</b>.')
      ],
      check(r) { return parityCheck(r); }
    },
    {
      id: 'same-type', kind: 'slides', title: 'Even + even, odd + odd',
      explain: 'Even + even is even. Odd + odd is even too, because the two leftovers make a pair.',
      slides: [
        pairs([{ n: 4, kind: 'a', label: '4' }, { n: 6, kind: 'b', label: '6' }], { label: '4 and 6: all in pairs, no leftovers.' }) +
          say('4 + 6: both are all pairs. The total is all pairs: <b>10 is even</b>.'),
        pairs([{ n: 3, kind: 'a', label: '3' }, { n: 5, kind: 'b', label: '5' }], { join: true, label: '3 and 5: each has one left over. The two leftovers make a new pair.' }) +
          say('3 + 5: each has one left over. The two leftovers make a new pair: <b>8 is even</b>.'),
        say('It works for big numbers too.') + big(`214 + 352 = ${fmt(214 + 352)}`) + say('even + even = <b>even</b>') +
          big(`135 + 221 = ${fmt(135 + 221)}`) + say('odd + odd = <b>even</b>')
      ],
      check(r) { return sameCheck(r); }
    },
    {
      id: 'even-odd', kind: 'slides', title: 'Even + odd',
      explain: 'Even + odd is odd. The one leftover has no partner.',
      slides: [
        pairs([{ n: 4, kind: 'a', label: '4' }, { n: 3, kind: 'b', label: '3' }], { label: '4 and 3: one leftover with no partner.' }) +
          say('4 + 3: one leftover is still alone. <b>7 is odd</b>. The order does not matter: odd + even is odd too.'),
        big(`412 + 235 = ${fmt(412 + 235)}`) + say('even + odd = <b>odd</b>'),
        say('A cube train: start with 3 cubes and keep adding 4.') + big('3, 7, 11, 15, …') +
          say('Always odd! 4 is even, and odd + even = odd every time.')
      ],
      check(r) { return oddCheck(r); }
    },
    {
      id: 'ones-decide', kind: 'slides', title: 'The ones digits decide',
      explain: 'Tens and hundreds are groups of ten, and ten is even. Only the ones digits can leave a leftover.',
      slides: [
        say('Why only the ones? <b>300 + 40</b> is groups of ten. Ten is even, so tens and hundreds never leave a leftover.'),
        big(`62${'<span class="rd-d is-look">7</span>'} + 15${'<span class="rd-d is-look">4</span>'}`) +
          say(`Look at 7 + 4 = 11. 11 is odd, so the sum is odd. Check: 627 + 154 = <b>${fmt(627 + 154)}</b>. Odd!`),
        big('odd + even = <b>odd</b>') + say(`One example: 125 + 302 = ${fmt(125 + 302)}. 125 is odd, 302 is even, and ${fmt(427)} is odd.`) +
          say('You can write your own example with any numbers that fit.')
      ],
      check(r) { return equationCheck(r); }
    },
    {
      id: 'check-sum', kind: 'slides', title: 'Check a sum with patterns',
      explain: 'Predict even or odd before you add. A sum of the wrong kind must be wrong.',
      slides: [
        big('243 + 124 = 362?') + say('Predict: odd + even = odd. But 362 is even. So 362 <b>must be wrong</b>.') +
          say(`243 + 124 = <b>${fmt(243 + 124)}</b>.`),
        big('316 + 151 = 457?') + say('Predict: even + odd = odd. 457 is odd… but is it right?') +
          say(`Add: 316 + 151 = <b>${fmt(316 + 151)}</b>. So 457 is wrong.`) +
          say('A pattern can show a sum is wrong. It can\'t show a sum is right. <b>Always add to be sure.</b>')
      ],
      check(r) { return checkCheck(r); }
    }
  ];

  // ---------- Practice Together (10), On My Own (13), Test (13) ----------
  const O9 = 'Because 3 + 6 = 9 in the ones place, and 9 is odd.';
  const guided = [
    wordFillQ({ id: 'pt1', keys: ['e+B=e', 'e+o=S'], hint: 'Even numbers have no leftover. An odd number has one.' }),
    equationQ({ id: 'pt2', key: 'o+B=e', eg: [135, 241], hint: 'What do you add to one leftover to make a pair?' }),
    sumQ({ id: 'pt3', a: 357, b: 214 }),
    proveQ({ id: 'pt4', who: 'Kai', pronoun: 'He', a: 254, b: 413, c: 657, seed: 4 }),
    whyQ({ id: 'pt5', skill: 'ones', prompt: 'A number with 5 in the ones place plus a number with 2 in the ones place. Why is the sum always odd?',
      right: 'Because 5 + 2 = 7 in the ones place, and 7 is odd.', wrong: ['Because 5 is bigger than 2.', 'Because every sum with a 5 is odd.', 'Because 2 is odd.'],
      hint: 'Only the ones digits matter.', explanation: '5 + 2 = 7 in the ones place, and 7 is odd. Tens and hundreds are always even, so they never change it.', seed: 5 }),
    whyQ({ id: 'pt6', skill: 'ones', prompt: 'Why do the ones digits decide if a sum is even or odd?',
      right: 'Tens and hundreds are always even, so only the ones can leave one left over.',
      wrong: ['The ones digit is the smallest digit.', 'The hundreds digit is always even.', 'The ones digit is always odd.'],
      hint: 'Is 10 even or odd? Is 300?', explanation: 'Tens and hundreds are groups of ten, and ten is even, so they always make pairs. Only the ones can leave a leftover.', seed: 6 }),
    totalsQ({ id: 'pt7', story: 'Tess bakes cookies on 2 trays. She wants an even number of cookies in all.', want: EVEN,
      pairs: [[12, 14], [13, 15], [12, 15], [11, 16], [9, 13], [10, 20]] }),
    threeQ({ id: 'pt8', story: 'A bracelet has 121 red, 122 green and 124 white beads. Is the number of beads even or odd? How many beads?', nums: [121, 122, 124] }),
    { id: 'pt9', type: 'explain', skill: 'reason', prompt: 'Why is odd + odd always even?',
      parent: 'Have your child show it with real objects.',
      listenFor: ['Each odd number has one left over.', 'The two leftovers make a pair, so nothing is left over.'],
      explanation: 'Each odd number has one left over. The two leftovers make a new pair, so the total has none left over: it is even.' },
    equationQ({ id: 'pt10', key: 'e+B=e', eg: [432, 216], hint: 'Which kind of number adds no leftover?' })
  ];
  const parentTips = { pt1: 'Ask for a second example out loud.', pt4: 'Ask: what can the pattern tell us for sure?', pt6: 'Listen for: tens and hundreds are even; leftovers come only from the ones.', pt7: 'Ask: what rule did you use?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    wordFillQ({ id: 'o1', keys: ['S=e+e', 'o+e=S', 'o+B=e'] }),
    wordFillQ({ id: 'o2', keys: ['e+o=S', 'e+B=o', 'S=o+o'] }),
    equationQ({ id: 'o3', key: 'S=e+e', eg: [204, 316] }),
    equationQ({ id: 'o4', key: 'o+B=e', eg: [173, 359] }),
    equationQ({ id: 'o5', key: 'e+o=S', eg: [248, 135] }),
    equationQ({ id: 'o6', key: 'e+B=o', eg: [426, 251] }),
    sumQ({ id: 'o7', a: 375, b: 214 }),
    sumQ({ id: 'o8', a: 162, b: 324 }),
    whyQ({ id: 'o9', skill: 'ones', prompt: 'Why is a number ending in 3 plus a number ending in 6 always odd?',
      right: O9, wrong: ['Because 6 is bigger than 3.', 'Because 3 is smaller than 6.', 'Because the hundreds are odd.'],
      hint: 'Only the ones digits matter.', explanation: '3 + 6 = 9 in the ones place, and 9 is odd. Tens and hundreds are always even.', seed: 9 }),
    whyQ({ id: 'o10', skill: 'ones', prompt: 'Which digits tell you if a sum is even or odd?', label: 'Choose one.',
      right: 'The ones digits of the addends', wrong: ['The hundreds digits of the addends', 'The tens digits of the addends', 'The biggest digit'],
      hint: 'Tens and hundreds always make pairs.', explanation: 'The ones digits decide. Tens and hundreds are groups of ten, and ten is even.', seed: 10 }),
    totalsQ({ id: 'o11', story: 'Max puts muffins in 2 boxes. He wants an even number of muffins in all.', want: EVEN,
      pairs: [[8, 6], [7, 9], [8, 9], [5, 10], [11, 13], [6, 7]] }),
    threeQ({ id: 'o12', story: 'A quilt has 213 blue, 214 white and 215 red squares. Is the number of squares even or odd? How many squares?', nums: [213, 214, 215] }),
    wrongTypeQ({ id: 'o13', who: 'Ben', a: 431, b: 246, c: 676, seed: 13 }),
    // O14 and O15 give the test's "even or odd number" (T13) and "explain why" (T9) skills their own practice.
    pickQ({ id: 'o14', want: EVEN, nums: [426, 731, 958, 213, 604, 875], seed: 14 }),
    whyQ({ id: 'o15', skill: 'reason', prompt: 'Why do two odd numbers always add to an even number?',
      right: 'Each odd number has one left over, and the two leftovers make a pair.',
      wrong: ['Big odd numbers are always even.', 'Because 1 + 1 = 1.', 'Because the tens digits are even.'],
      hint: 'Draw two odd piles of dots. What happens to the leftovers?', explanation: 'Each odd number has one left over. Put the two leftovers together: they make a pair, so nothing is left over.', seed: 15 })
  ];

  const testItems = [
    wordFillQ({ id: 't1', keys: ['S=o+o', 'e+B=o', 'o+e=S'] }),
    equationQ({ id: 't2', key: 'e+B=o', eg: [418, 237] }),
    equationQ({ id: 't3', key: 'S=o+o', eg: [319, 457] }),
    sumQ({ id: 't4', a: 245, b: 526 }),
    sumQ({ id: 't5', a: 418, b: 360 }),
    wrongTypeQ({ id: 't6', who: 'Mia', a: 325, b: 142, c: 468 }),
    proveQ({ id: 't7', who: 'Omar', pronoun: 'He', a: 236, b: 341, c: 567 }),
    whyQ({ id: 't8', skill: 'ones', prompt: 'Why is a number ending in 1 plus a number ending in 8 always odd?',
      right: 'Because 1 + 8 = 9 in the ones place, and 9 is odd.', wrong: ['Because 8 is bigger than 1.', 'Because 1 is the smallest digit.', 'Because the hundreds are always odd.'],
      explanation: '1 + 8 = 9 in the ones place, and 9 is odd. Tens and hundreds are always even.' }),
    whyQ({ id: 't9', skill: 'reason', prompt: 'Why is odd + odd always even?',
      right: 'Each odd number has one left over. The two leftovers make a pair.',
      wrong: ['Odd numbers are even when they are big.', 'Because 1 + 1 = 1.', 'Because the hundreds digits are even.'],
      explanation: 'Each odd number has one left over. The two leftovers make a new pair, so nothing is left over.' }),
    totalsQ({ id: 't10', story: 'Lin puts books on 2 shelves. She wants an odd number of books in all.', want: ODD,
      pairs: [[14, 9], [12, 16], [7, 10], [15, 17], [20, 13], [11, 5]] }),
    threeQ({ id: 't11', story: 'A garden has 331 tulips, 332 daisies and 334 roses. Is the number of flowers even or odd? How many flowers?', nums: [331, 332, 334] }),
    cantQ({ id: 't12', eqs: [[216, 322, 539], [145, 233, 378], [260, 117, 376], [433, 124, 557], [304, 153, 457]] }),
    pickQ({ id: 't13', want: ODD, nums: [507, 362, 189, 940, 773, 618] })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Addition Patterns Test: the same 13 items each time; choice order changes with each attempt. */
  function patternsTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-5'] = {
    id: '2-5',
    storageKey: 'mathbook:v2:lesson-2-5',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-5',
    title: 'Addition Patterns',
    subtitle: 'Even and odd sums',
    objective: 'I can tell if a sum will be even or odd, explain why, and use the pattern to check my adding.',
    parentLearn: {
      goal: [
        'Tell if a number is even or odd from its ones digit.',
        'Know the three patterns: even + even = even, odd + odd = even, even + odd = odd (in either order).',
        'Explain why with pairs and leftovers: only the ones digits can leave a leftover.',
        'Write a 3-digit equation that fits a pattern sentence.',
        'Use a pattern to catch a wrong sum, and still add to be sure a sum is right.'
      ],
      words: [
        { term: 'Even number', meaning: 'A number you can split into pairs with none left over. Its ones digit is 0, 2, 4, 6 or 8.' },
        { term: 'Odd number', meaning: 'A number with one left over when you make pairs. Its ones digit is 1, 3, 5, 7 or 9.' },
        { term: 'Pattern', meaning: 'Something that happens the same way every time.' },
        { term: 'Sum', meaning: 'The answer when you add.' },
        { term: 'Addend', meaning: 'A number you add.' },
        { term: 'Ones digit', meaning: 'The digit in the ones place (the last digit).', example: 'The ones digit of 348 is 8.' }
      ],
      demoVisual: fig({ fig: 'counters', pairs: true, join: true, groups: [{ n: 5, kind: 'a', label: '5' }, { n: 3, kind: 'b', label: '3' }] }),
      demonstrate: [
        'Use 7 coins. Make pairs. One is left over, so 7 is odd.',
        'Make two piles, 5 and 3. Each has a leftover. Push the leftovers together: a pair. 8 is even.',
        'Make piles of 4 and 3. One leftover is alone: 7 is odd.',
        'Write 627 + 154. Cover everything but the 7 and the 4. 7 + 4 = 11 is odd, so the sum is odd. Add to check: 781.',
        'Write a wrong sum of the right kind (316 + 151 = 457) and ask "Is it right?" Add to find 467.',
        'Book example (Be Curious): cube trains of 3, 7, 11 cubes, adding 4 each time, stay odd. In the app, the child writes their own equations to fit a sentence (one per item).'
      ],
      ask: ['"What is the ones digit?"', '"Will there be a leftover?"', '"Should this sum be even or odd?"', '"Does matching prove it is right?"'],
      checklist: [
        'Names even and odd numbers by the ones digit.',
        'Knows the three patterns (in either order).',
        'Explains with pairs and leftovers.',
        'Writes a fitting 3-digit equation for a pattern sentence.',
        'Uses a pattern to reject a wrong sum, and still adds to confirm.',
        'Solves three-addend even/odd problems, and scores 90% or higher on the Addition Patterns Test.'
      ]
    },
    mistakes: [
      'Looking at the hundreds digit ("435 is even because 4 is even"). Say: "Only the ones digit decides."',
      'Thinking odd + odd = odd. Show two odd piles of objects and pair the leftovers.',
      'Believing a matching even/odd proves the sum is right. Say: "The pattern can catch a mistake, but you still need to add."',
      'With three addends, using a two-number rule on all three at once. Say: "Do two numbers, then add the third."',
      'Writing an example with the wrong kinds of numbers (124 + 233 for even + even). Ask: "Check each ones digit."'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'How can even and odd help you check your adding?',
        idea: 'If the sum should be odd but you got an even number, something is wrong. If it matches, still add carefully: matching doesn\'t prove it is right.'
      }
    },
    skills: {
      parity: 'Even or odd number',
      rules: 'Even and odd sum patterns',
      sum: 'Predict and find a sum',
      ones: 'The ones digits decide',
      check: 'Check a sum with patterns',
      reason: 'Explain why',
      apply: 'Real-world and three addends'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Addition Patterns Practice', blurb: 'All 15 practice questions: even and odd numbers and patterns, writing equations, checking sums, and real-world totals.', ids: bank.map((q) => q.id) }],
    tests: {
      patterns: { id: 'patterns', title: 'Addition Patterns Test', questions: 13, blurb: 'Even and odd sums, why the patterns work, and checking sums.', generate: patternsTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _sentences: SENTENCES
  };
})(typeof window !== 'undefined' ? window : globalThis);
