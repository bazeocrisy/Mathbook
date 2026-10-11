/*
 * Mathbook — Chapter 2, Lesson 2-8: Adjust Numbers to Add or Subtract
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-8.md (with the batch-B review fixes B-07, B-19…B-24).
 * M-ADJUST is the shared chain preset 'adjust' (DESIGN §2): any valid adjustment is accepted —
 *   adding: one number goes up and the other goes down by the same amount (the sum stays the same);
 *   subtracting: both numbers go up, or both go down, by the same amount (the difference stays the same).
 * "Adjust + picture" items (PT5, O8, T8) are two connected questions: adjust, then choose the number-line picture
 * that slides both ends the same amount (B-07: pictures show only the original endpoints, no difference).
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-8.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const MINUS = '−';
  const opText = (a, op, b) => `${fmt(a)} ${op} ${fmt(b)}`;
  const calc = (a, op, b) => (op === '+' ? a + b : a - b);
  const sign = (k) => (k > 0 ? `+${k}` : k < 0 ? `${MINUS}${-k}` : '0');
  /** The friendly adjustment: make b a ten or a hundred (adding: a gives b the amount; subtracting: both move). */
  function suggest(a, op, b) {
    const up = b % 100 >= 90 ? 100 - (b % 100) : b % 10 >= 5 ? 10 - (b % 10) : -(b % 10);
    const k = up || 10;
    return op === '+' ? { na: a - k, nb: b + k, k } : { na: a + k, nb: b + k, k };
  }
  const RULE_ADD = 'In adding, take from one number and give the same amount to the other.';
  const RULE_SUB = 'In subtracting, add the same amount to both numbers, or take the same amount from both.';

  /** True when a number the child must type is printed in the question's own text (not a figure). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    if (q.type === 'chain') nums.push(calc(q.a, q.op === '+' ? '+' : MINUS, q.b));
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** Adjust the numbers, then add or subtract (any valid adjustment). o: { id, a, op, b, skill?, prompt?, hint?, lead?, label? } */
  function adjustQ(o) {
    const { a, op, b } = o;
    const s = suggest(a, op, b);
    const res = calc(a, op, b);
    const how = op === '+'
      ? `${fmt(a)} ${sign(s.na - a)} → ${fmt(s.na)} and ${fmt(b)} ${sign(s.nb - b)} → ${fmt(s.nb)}: one goes down, the other goes up the same amount.`
      : `${fmt(a)} ${sign(s.na - a)} → ${fmt(s.na)} and ${fmt(b)} ${sign(s.nb - b)} → ${fmt(s.nb)}: both change the same way.`;
    const q = {
      id: o.id, type: 'chain', preset: 'adjust', a, b, op: op === '+' ? '+' : MINUS, skill: o.skill || (op === '+' ? 'add' : 'sub'),
      prompt: o.prompt || `Adjust the numbers to make ${opText(a, op, b)} easier. Then ${op === '+' ? 'add' : 'subtract'}.`,
      hint: o.hint || (op === '+' ? `What can you add to ${fmt(b)} to make a ten or a hundred? Take that much from ${fmt(a)}.` : `Change ${fmt(b)} to a ten or a hundred, and change ${fmt(a)} the same way.`),
      explanation: `${o.lead ? o.lead + ' ' : ''}${how} ${opText(s.na, op, s.nb)} = ${fmt(res)}, so ${opText(a, op, b)} = ${fmt(res)}. ${op === '+' ? RULE_ADD : RULE_SUB} Other adjustments work too.`
    };
    if (o.label) q.labels = [null, null, o.label];
    return q;
  }

  /** Number-line pictures for a − b adjusted by `shift` (B-07). Returns { figure, right: 'A'|'B' }. */
  function pictures(a, b, shift, rightFirst) {
    const lo = Math.floor((Math.min(b, b + shift) - 20) / 100) * 100, hi = Math.ceil((Math.max(a, a + shift) + 20) / 100) * 100;
    const major = []; for (let v = lo; v <= hi; v += 100) major.push(v);
    const base = { min: lo, max: hi, minor: 10, major, below: major.map((v) => ({ v, text: fmt(v) })) };
    const orig = Object.assign({}, base, { bands: [{ from: b, to: a, text: '' }], points: [{ v: b, text: fmt(b) }, { v: a, text: fmt(a) }] });
    const line = (to) => Object.assign({}, base, { bands: [{ from: b + shift, to, text: '' }], points: [{ v: b + shift, text: '' }, { v: to, text: '' }] });
    const good = { fig: 'nline', lines: [orig, line(a + shift)] };
    const bad = { fig: 'nline', lines: [orig, line(a + shift - 60)] };
    const items = rightFirst ? [good, bad] : [bad, good];
    return { figure: { fig: 'pics', noun: 'Picture', items: items.map((f, k) => ({ label: 'AB'[k], fig: f })) }, right: rightFirst ? 'A' : 'B' };
  }
  /** Which picture shows sliding both ends the same amount? o: { id, a, b, shift, rightFirst } */
  function pictureQ(o) {
    const { a, b, shift } = o;
    const P = pictures(a, b, shift, o.rightFirst);
    return {
      id: o.id, type: 'parts', skill: 'numberline',
      prompt: `${opText(a, MINUS, b)}: the top line in each picture shows the gap from ${fmt(b)} to ${fmt(a)}. The bottom line slides both numbers ${shift > 0 ? 'right' : 'left'} by ${Math.abs(shift)}. Which picture keeps the gap the same?`,
      figure: P.figure,
      parts: [{ kind: 'choice', label: 'Which picture shows sliding both ends the same amount?', answer: P.right, choices: ['A', 'B'], compact: true }],
      hint: o.hint || 'Compare the two shaded gaps. Are they the same length?',
      explanation: `In picture ${P.right}, both ends moved ${Math.abs(shift)}, so the gap is the same length: ${opText(a + shift, MINUS, b + shift)} has the same difference as ${opText(a, MINUS, b)}. In the other picture the gap is shorter.`
    };
  }
  /** One or two choices (with an optional number). o: { id, skill, prompt, parts: [{ label, right, wrong } | { num, label }], explanation, hint?, figure?, seed? } */
  function choiceQ(o) {
    const r = o.r || (o.seed ? pv.rng(o.seed) : null);
    return {
      id: o.id, type: 'parts', skill: o.skill, prompt: o.prompt, figure: o.figure,
      parts: o.parts.map((p) => (p.num !== undefined ? { kind: 'num', label: p.label, answer: p.num }
        : p.multi ? { kind: 'multi', label: p.label, answer: p.right, choices: r ? pv.shuffle(r, p.choices) : p.choices.slice() }
          : { kind: 'choice', label: p.label, answer: p.right, choices: r ? pv.shuffle(r, [p.right].concat(p.wrong)) : [p.right].concat(p.wrong), compact: p.compact })),
      hint: o.hint, explanation: o.explanation
    };
  }
  /** "Changed only one number": how to fix the answer. o: { id, who, pron, a, op, b, nb, wrongAlt, seed? } */
  function fixQ(o) {
    const { a, op, b, nb } = o;
    const shown = calc(a, op, nb), right = calc(a, op, b);
    const d = shown - right;
    const why = op === '+' ? (d > 0 ? `${o.pron.toLowerCase()} added ${Math.abs(d)} extra` : `${o.pron.toLowerCase()} added ${Math.abs(d)} too few`)
      : (d < 0 ? `${o.pron.toLowerCase()} took away ${Math.abs(d)} too many` : `${o.pron.toLowerCase()} took away ${Math.abs(d)} too few`);
    const fix = d > 0 ? `Subtract ${Math.abs(d)}` : `Add ${Math.abs(d)}`;
    const opp = d > 0 ? `Add ${Math.abs(d)}.` : `Subtract ${Math.abs(d)}.`;
    const dbl = `${d > 0 ? 'Subtract' : 'Add'} ${2 * Math.abs(d)}.`;
    return choiceQ({ id: o.id, skill: 'fix', seed: o.seed, r: o.r,
      prompt: o.prompt || `${o.who} ${op === '+' ? 'adds' : 'finds'} ${opText(a, op, b)}. ${o.pron} changes only ${fmt(b)} to ${fmt(nb)} and gets ${fmt(shown)}. How should ${o.pron.toLowerCase()} fix the answer?`,
      parts: [{ label: 'How should the answer be fixed?', right: `${fix}, because ${why}.`, wrong: [opp, 'Nothing. It\'s right.', dbl] }, { num: right, label: 'The correct answer:' }],
      hint: o.hint || (op === '+' ? `Did ${o.pron.toLowerCase()} add too much or too little?` : `Did ${o.pron.toLowerCase()} take away too much or too little?`),
      explanation: `${opText(a, op, nb)} = ${fmt(shown)}. Changing ${fmt(b)} to ${fmt(nb)} ${op === '+' ? 'adds' : 'takes away'} ${Math.abs(nb - b)} ${nb > b ? 'more' : 'less'}, so ${fix.toLowerCase()}: ${opText(a, op, b)} = ${fmt(right)}.` +
        (op === '+' ? '' : ' In subtracting, the fix goes the other way: taking away too much means you add it back.') });
  }

  // ---------- Learn: six steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const arrows = (a, op, b, na, nb, extra) => fig(Object.assign({ fig: 'arrows', a, b, op, to: [na, nb], result: calc(na, op, nb), tags: [sign(na - a), sign(nb - b)] }, extra || {}));
  const cards = (list) => `<div class="slide-pair" style="grid-template-columns:repeat(2,minmax(0,1fr))">${list.map((t) => `<p class="q-display" style="text-align:center">${t}</p>`).join('')}</div>`;
  const nl = (lines) => fig({ fig: 'nline', lines });

  // Numbers used in the Learn examples and the book; Your Turn never repeats them.
  const DEMO = [[46, 29], [45, 30], [50, 25], [48, 27], [236, 198], [452, 197], [568, 323], [367, 196], [645, 298], [625, 197], [815, 768], [434, 214], [224, 109], [333, 212], [457, 208], [457, 251]];
  const isDemo = (a, b) => DEMO.some(([x, y]) => x === a && y === b);
  const NAMES = ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana', 'Jada', 'Kofi', 'Luz', 'Milo', 'Nia', 'Omar', 'Rosa'];
  const PRON = { Ava: 'She', Cora: 'She', Fay: 'She', Hana: 'She', Jada: 'She', Luz: 'She', Nia: 'She', Rosa: 'She', Ben: 'He', Dev: 'He', Eli: 'He', Gus: 'He', Kofi: 'He', Milo: 'He', Omar: 'He' };

  // Step 1: which have the same sum? (3 right: a−k, b+k; 3 wrong: both up, both down, one only)
  function sameCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 30, 69), b = pv.randInt(r, 15, 39);
      if (b % 10 < 7 || isDemo(a, b)) continue;
      const toTen = 10 - (b % 10);
      const ks = [toTen, ...pv.shuffle(r, [1, 2, 3, 4, 5].filter((k) => k !== toTen)).slice(0, 2)];
      const right = ks.map((k) => `${a - k} + ${b + k}`);
      const k2 = pv.randInt(r, 1, 3);
      const wrong = [`${a + k2} + ${b + k2}`, `${a - k2} + ${b - k2}`, `${a + 1} + ${b}`];
      if (new Set(right.concat(wrong)).size < 6) continue;
      const all = right.concat(wrong).map((t) => t.split(' + ').map(Number));
      return {
        id: 'learn-1', type: 'parts', skill: 'same',
        prompt: `Which have the same sum as ${a} + ${b}? Choose all.`,
        parts: [{ kind: 'multi', label: `Same sum as ${a} + ${b}:`, answer: right, choices: pv.shuffle(r, right.concat(wrong)), compact: true }],
        hint: 'If one number goes down and the other goes up the same amount, the sum stays the same.',
        explanation: `${a} + ${b} = ${a + b}. ` + all.map(([x, y]) => `${x} + ${y} = ${x + y}`).join(', ') + '. Only the ones where one number went down and the other went up the same amount keep the sum.'
      };
    }
  }
  // Step 2: adjust addition. a 120–799, b ending 7–9, a's ones ≥ what b needs.
  function addCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 120, 799), b = pv.randInt(r, 101, 999 - a);
      if (b % 10 < 7 || a % 10 < 10 - (b % 10) || isDemo(a, b) || a + b > 999) continue;
      return adjustQ({ id: 'learn-2', a, op: '+', b });
    }
  }
  // Step 3: adjust subtraction. b ending 7–9 or 1–2, a − b ≥ 50.
  function subCheck(r) {
    for (;;) {
      const a = pv.randInt(r, 300, 999), b = pv.randInt(r, 101, a - 50);
      const o = b % 10;
      if (!((o >= 7) || o === 1 || o === 2) || isDemo(a, b) || a - b === b) continue;
      return adjustQ({ id: 'learn-3', a, op: '-', b });
    }
  }
  // Step 4: addition vs subtraction (Math is… Structure).
  const STRUCT_RIGHT = 'In subtraction I change both numbers the same way. In addition I change them opposite ways.';
  const STRUCT_WRONG = ['There is no difference.', 'In subtraction I change only one number.', 'In subtraction I change them opposite ways.'];
  function structCheck(r) {
    let a, b, c, d;
    do { a = pv.randInt(r, 150, 700); b = pv.randInt(r, 101, 299); } while (b % 10 < 7 || a + b > 999 || isDemo(a, b));
    do { c = pv.randInt(r, 400, 999); d = pv.randInt(r, 101, c - 100); } while (d % 10 < 7 || isDemo(c, d));
    const k = 10 - (b % 10), j = 10 - (d % 10);
    const addR = `${a - k} + ${b + k}`, subR = `${c + j} − ${d + j}`;
    return {
      id: 'learn-4', type: 'parts', skill: 'structure',
      prompt: `Make ${a} + ${b} and ${c} − ${d} easier without changing the answers.`,
      parts: [
        { kind: 'choice', label: `Same sum as ${a} + ${b}:`, answer: addR, choices: pv.shuffle(r, [addR, `${a + k} + ${b + k}`, `${a - k} + ${b - k}`]), compact: true },
        { kind: 'choice', label: `Same difference as ${c} − ${d}:`, answer: subR, choices: pv.shuffle(r, [subR, `${c - j} − ${d + j}`, `${c} − ${d + j}`]), compact: true },
        { kind: 'choice', label: 'How is adjusting subtraction different from adjusting addition?', answer: STRUCT_RIGHT, choices: pv.shuffle(r, [STRUCT_RIGHT].concat(STRUCT_WRONG)) }
      ],
      hint: 'Adding: one goes up, one goes down. Subtracting: both go up or both go down.',
      explanation: `${addR} = ${a + b}, the same as ${a} + ${b}: ${a} went down ${k} and ${b} went up ${k}. ${subR} = ${c - d}, the same as ${c} − ${d}: both went up ${j}. ` + STRUCT_RIGHT
    };
  }
  // Step 5: fix an answer after changing only one number (addition or subtraction).
  function fixCheck(r) {
    const who = pv.pick(r, NAMES);
    if (r() < 0.5) {
      let a, b;
      do { a = pv.randInt(r, 120, 799); b = pv.randInt(r, 101, 980 - a); } while (b % 10 < 8 || a + b > 989 || isDemo(a, b));
      return fixQ({ id: 'learn-5', who, pron: PRON[who], a, op: '+', b, nb: b + 10 - (b % 10), r });
    }
    let a, b;
    do { a = pv.randInt(r, 300, 999); b = pv.randInt(r, 101, a - 50); } while (b % 10 < 7 || isDemo(a, b));
    return fixQ({ id: 'learn-5', who, pron: PRON[who], a, op: '−', b, nb: b + 10 - (b % 10), r });
  }
  // Step 6: a "how many more" story, adjusted.
  const STORIES = [
    (x, y) => `A shop had ${fmt(y)} orders in May and ${fmt(x)} in June. How many more orders in June?`,
    (x, y) => `Ray scored ${fmt(x)} points. Kim scored ${fmt(y)} points. How many more points did Ray score?`,
    (x, y) => `Lu walked ${fmt(x)} steps on Monday and ${fmt(y)} steps on Tuesday. How many more steps on Monday?`,
    (x, y) => `${fmt(x)} tickets were sold for the play and ${fmt(y)} for the concert. How many more for the play?`
  ];
  function storyCheck(r) {
    for (;;) {
      const x = pv.randInt(r, 200, 999), y = pv.randInt(r, 101, 989);
      if (y % 10 < 7 || x - y < 20 || x - y > 200 || isDemo(x, y)) continue;
      return adjustQ({ id: 'learn-6', a: x, op: '-', b: y, skill: 'story', prompt: `${pv.pick(r, STORIES)(x, y)} Adjust the numbers, then subtract.`,
        hint: 'How many more → subtract. Then change both numbers the same way.' });
    }
  }

  const steps = [
    {
      id: 'same-sum', kind: 'slides', title: 'Same sum, different numbers',
      explain: 'When one addend goes down and the other goes up by the same amount, the sum stays the same.',
      slides: [
        cards(['46 + 29', '45 + 30', '50 + 25', '48 + 27']) + say('Which one doesn\'t belong? Any good reason works. Maybe 45 + 30 and 50 + 25, because they have a 0 in the ones.'),
        cards(['46 + 29 = 75', '45 + 30 = 75', '50 + 25 = 75', '48 + 27 = 75']) + say('Surprise: they all equal <b>75</b>!'),
        arrows(46, '+', 29, 45, 30) + say('46 + 29 → 45 + 30: <b>one moved</b> from 46 to 29. The total stays 75.')
      ],
      check: sameCheck
    },
    {
      id: 'adjust-add', kind: 'slides', title: 'Adjust to add',
      explain: 'Adding: take an amount from one addend and give it to the other. The sum stays the same.',
      slides: [
        big('236 + 198') + say('198 is close to <b>200</b>.'),
        arrows(236, '+', 198, 234, 200) + say('Take <b>2</b> from 236. Give <b>2</b> to 198. <b>234 + 200 = 434</b>.'),
        say('Check: 236 + 198 = <b>434</b> too. One number went down 2 and the other went up 2, so the sum did not change.')
      ],
      check: addCheck
    },
    {
      id: 'adjust-sub', kind: 'slides', title: 'Adjust to subtract',
      explain: 'Subtracting: add the same amount to both numbers, or take the same amount from both. The difference stays the same.',
      slides: [
        big('452 − 197') + say('Make 197 into <b>200</b>.'),
        arrows(452, '−', 197, 455, 200) + say('In subtraction, do the <b>same</b> thing to both: +3 and +3. <b>455 − 200 = 255</b>.'),
        nl([{ min: 150, max: 500, minor: 10, major: [200, 300, 400, 500], below: [200, 300, 400, 500].map((v) => ({ v, text: fmt(v) })), bands: [{ from: 197, to: 452, text: '255 apart' }] },
          { min: 150, max: 500, minor: 10, major: [200, 300, 400, 500], below: [200, 300, 400, 500].map((v) => ({ v, text: fmt(v) })), bands: [{ from: 200, to: 455, text: '255 apart' }] }]) +
          say('Both ends slid 3 to the right. <b>The gap did not change.</b>'),
        arrows(568, '−', 323, 565, 320) + say('You can also take away the same amount: −3 and −3. <b>565 − 320 = 245</b>.')
      ],
      check: subCheck
    },
    {
      id: 'add-vs-sub', kind: 'slides', title: 'Adding or subtracting?',
      explain: 'Adding: change the numbers opposite ways. Subtracting: change them the same way.',
      slides: [
        `<div class="slide-pair">${arrows(224, '+', 109, 223, 110)}${arrows(333, '−', 212, 331, 210)}</div>` +
          say('Book example. Adding 224 + 109: <b>−1 and +1</b>, opposite ways. Subtracting 333 − 212: <b>−2 and −2</b>, the same way.'),
        say('Why? In adding, both numbers are parts of the total: what one loses, the other gets. In subtracting, the answer is the <b>gap</b> between them: slide both together and the gap stays.')
      ],
      check: structCheck
    },
    {
      id: 'fix', kind: 'slides', title: 'Spot and fix mistakes',
      explain: 'Change both numbers the right way. If you change only one, fix the answer by the same amount.',
      slides: [
        arrows(367, '+', 196, 370, 199, { caption: '<span class="fig-no">✗</span> +3 and +3' }) +
          say('Leo adds 367 + 196 as 370 + 199 = 569. He added 3 to <b>both</b>, so the sum is 6 too big. Right way: 363 + 200 = <b>563</b>.'),
        say('Kim adds 645 + 298. She changes only 298 to 300 and gets 945. She added 2 extra, so <b>take 2 away</b>: <b>943</b>.'),
        say('Ann finds 625 − 197. She subtracts 200 instead and gets 425. She took away 3 too many, so <b>add 3 back</b>: <b>428</b>. In subtraction, the fix goes the other way!')
      ],
      check: fixCheck
    },
    {
      id: 'stories', kind: 'slides', title: 'Story problems',
      explain: '"How many more" means subtract. Adjust to make it easier.',
      slides: [
        say('A library had 768 visitors in March and 815 in April. How many more in April?') + arrows(815, '−', 768, 817, 770) + say('<b>47</b> more visitors.'),
        say('236 people are in the red tent and 214 in the blue tent. Then 198 more people come to the red tent. How many more are in the red tent?') +
          arrows(236, '+', 198, 234, 200) + say('First add: opposite moves. <b>434</b> in the red tent.'),
        arrows(434, '−', 214, 420, 200) + say('Then subtract: same moves. <b>220</b> more people. Adding: opposite moves. Subtracting: same moves.')
      ],
      check: storyCheck
    }
  ];

  // ---------- Practice Together (12), On My Own (14), Test (14) ----------
  const describe = (o) => choiceQ({ id: o.id, skill: 'describe', seed: o.seed, prompt: `${o.who} changed ${opText(o.a, '+', o.b)} to ${opText(o.na, '+', o.nb)}. How did ${o.pron.toLowerCase()} adjust? Why?`,
    parts: [{ label: `How did ${o.pron.toLowerCase()} adjust, and why?`, right: o.right, wrong: o.wrong }, { num: o.a + o.b, label: 'The sum:' }],
    hint: 'Which number went up? Which went down? Which one became a friendly number?',
    explanation: `${fmt(o.a)} ${sign(o.na - o.a)} → ${fmt(o.na)}, ${fmt(o.b)} ${sign(o.nb - o.b)} → ${fmt(o.nb)}: opposite ways, so the sum stays ${fmt(o.a + o.b)}. ${opText(o.na, '+', o.nb)} = ${fmt(o.a + o.b)}.` });
  const whoRight = (o) => choiceQ({ id: o.id, skill: 'compare', seed: o.seed, prompt: o.prompt,
    parts: [{ label: 'Who is right?', right: o.right, wrong: o.wrong }],
    hint: o.hint, explanation: o.explanation });
  const bothWays = (o) => choiceQ({ id: o.id, skill: 'error', seed: o.seed, prompt: o.prompt,
    parts: [{ label: 'Do you agree?', right: o.right, wrong: o.wrong }, { num: o.answer, label: 'The correct sum:' }],
    hint: o.hint, explanation: o.explanation });

  const guided = [
    adjustQ({ id: 'pt1', a: 248, op: '+', b: 195, hint: 'Make 195 a hundred.' }),
    adjustQ({ id: 'pt2', a: 364, op: '-', b: 198, hint: 'Add 2 to both.' }),
    adjustQ({ id: 'pt3', a: 735, op: '-', b: 412, hint: 'Take 2 from both.' }),
    describe({ id: 'pt4', who: 'Ava', pron: 'She', a: 207, b: 158, na: 205, nb: 160, seed: 4,
      right: 'She took 2 from 207 and gave 2 to 158, so 158 became 160, a friendly number.',
      wrong: ['She added 2 to both numbers.', 'She took 2 from both numbers.', 'She changed only one number.'] }),
    adjustQ({ id: 'pt5', a: 487, op: '-', b: 245, skill: 'numberline', hint: 'Slide both ends the same way. Try 240.' }),
    pictureQ({ id: 'pt5b', a: 487, b: 245, shift: -5, rightFirst: false, hint: 'Slide both ends the same way. Which gap stays the same length?' }),
    bothWays({ id: 'pt6', seed: 6, prompt: 'Owen adds 368 + 205. He changes them to 370 + 207 = 577. Do you agree?', answer: 573,
      right: 'No. He added 2 to both, so the sum is 4 too big.', wrong: ['Yes. Adding to both keeps the sum the same.', 'No. He should add 2 to both and 2 more.', 'No. The sum is 2 too big.'],
      hint: 'In addition, the moves must go opposite ways.', explanation: 'Owen added 2 to each number, so the sum grew by 4: 577 − 4 = 573. Right way: 370 + 203 = 573.' }),
    whoRight({ id: 'pt7', seed: 7, prompt: 'For 148 + 236, Lily writes 150 + 238 = 388. Sam writes 150 + 234 = 384. Who is right?',
      right: 'Sam. He added 2 to 148 and took 2 from 236.', wrong: ['Lily. She added 2 to both numbers.', 'Both are right.', 'Neither is right.'],
      hint: 'Did each one change the numbers opposite ways?', explanation: '148 + 236 = 384. Sam moved 2 from 236 to 148, so the sum stays 384. Lily added 2 to both, so her sum is 4 too big.' }),
    fixQ({ id: 'pt8', who: 'Ray', pron: 'He', a: 563, op: '+', b: 302, nb: 300, seed: 8 }),
    adjustQ({ id: 'pt9', a: 712, op: '-', b: 634, skill: 'story', prompt: 'A bakery sold 634 rolls in May and 712 in June. How many more rolls in June? Adjust the numbers, then subtract.',
      hint: 'How many more → subtract 712 − 634.', lead: 'How many more → 712 − 634.' }),
    { id: 'pt10', type: 'explain', skill: 'reason', prompt: 'How can adjusting just one number change the answer?',
      parent: 'Look for: the answer goes up or down by the amount changed.',
      listenFor: ['If you change only one number, the answer changes by that much.', 'You have to fix the answer: add it back or take it away.'],
      explanation: 'If only one number changes, the answer goes up or down by that amount, so you must fix it.' },
    fixQ({ id: 'pt11', who: 'Mo', pron: 'He', a: 534, op: '−', b: 296, nb: 300, seed: 11, hint: 'Did he take away too much or too little?' })
  ];
  const parentTips = { pt1: 'Ask: why take 5 from 248?', pt5b: 'Have your child point to both gaps.', pt11: 'Ask: why do we add here but subtract in addition problems?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    adjustQ({ id: 'o1', a: 381, op: '-', b: 99 }),
    adjustQ({ id: 'o2', a: 147, op: '+', b: 228 }),
    adjustQ({ id: 'o3', a: 958, op: '-', b: 423 }),
    adjustQ({ id: 'o4', a: 297, op: '+', b: 356 }),
    adjustQ({ id: 'o5', a: 583, op: '-', b: 317 }),
    adjustQ({ id: 'o6', a: 138, op: '+', b: 149 }),
    describe({ id: 'o7', who: 'Noah', pron: 'He', a: 119, b: 208, na: 120, nb: 207, seed: 12,
      right: 'He added 1 to 119 and took 1 from 208, so 119 became 120, a friendly number.',
      wrong: ['He added 1 to both numbers.', 'He took 1 from both numbers.', 'He changed only 119.'] }),
    adjustQ({ id: 'o8', a: 594, op: '-', b: 327, skill: 'numberline' }),
    pictureQ({ id: 'o8b', a: 594, b: 327, shift: 3, rightFirst: true }),
    choiceQ({ id: 'o9', skill: 'choose', seed: 9, prompt: 'Which keep the same difference as 345 − 128? Then choose the easiest one.',
      parts: [{ multi: true, label: 'Same difference as 345 − 128 (choose all):', right: ['347 − 130', '337 − 120', '350 − 133'], choices: ['347 − 130', '345 − 130', '337 − 120', '350 − 133', '343 − 130'] },
        { label: 'Which of these is easiest, and why?', right: '347 − 130, because 130 ends in 0, so it is easy to take away.',
          wrong: ['350 − 133, because 133 ends in 3.', '345 − 128, because nothing changed.', '343 − 130, because both numbers got smaller.'] }],
      hint: 'Both numbers must change the same way. Then look for a number that ends in 0.',
      explanation: '345 − 128 = 217. 347 − 130 = 217, 337 − 120 = 217 and 350 − 133 = 217 (both changed the same way). 345 − 130 = 215 and 343 − 130 = 213 are different. 347 − 130 is easy because 130 ends in 0.' }),
    whoRight({ id: 'o10', seed: 10, prompt: 'For 139 + 268, Kim writes 140 + 269 = 409. Dev writes 140 + 267 = 407. Who is right?',
      right: 'Dev. He added 1 to 139 and took 1 from 268.', wrong: ['Kim. She added 1 to both numbers.', 'Both are right.', 'Neither is right.'],
      hint: 'Did each one change the numbers opposite ways?', explanation: '139 + 268 = 407. Dev moved 1 from 268 to 139. Kim added 1 to both, so her sum is 2 too big.' }),
    adjustQ({ id: 'o11', a: 841, op: '-', b: 763, skill: 'story', prompt: 'A chef made 763 pies last year and 841 this year. How many more pies this year? Adjust the numbers, then subtract.', lead: 'How many more → 841 − 763.' }),
    fixQ({ id: 'o12', who: 'Jo', pron: 'She', a: 624, op: '+', b: 199, nb: 200, seed: 13 }),
    fixQ({ id: 'o13', who: 'Lee', pron: 'He', a: 712, op: '−', b: 399, nb: 400, seed: 14 }),
    // O14 gives the test's "find the mistake" skill (T13) its own practice (new numbers).
    bothWays({ id: 'o14', seed: 15, prompt: 'Zara adds 286 + 309. She changes them to 290 + 313 = 603. Do you agree?', answer: 595,
      right: 'No. She added 4 to both, so the sum is 8 too big.', wrong: ['Yes. Adding to both keeps the sum the same.', 'No. The sum is 4 too big.', 'No. She should have added 4 to only one number.'],
      hint: 'In addition, the moves must go opposite ways.', explanation: 'Zara added 4 to each number, so the sum grew by 8: 603 − 8 = 595. Right way: 290 + 305 = 595.' })
  ];

  const testItems = [
    adjustQ({ id: 't1', a: 531, op: '-', b: 189 }),
    adjustQ({ id: 't2', a: 168, op: '+', b: 325 }),
    adjustQ({ id: 't3', a: 876, op: '-', b: 541 }),
    adjustQ({ id: 't4', a: 499, op: '+', b: 237 }),
    adjustQ({ id: 't5', a: 673, op: '-', b: 418 }),
    adjustQ({ id: 't6', a: 159, op: '+', b: 126 }),
    describe({ id: 't7', who: 'Grace', pron: 'She', a: 309, b: 147, na: 310, nb: 146,
      right: 'She added 1 to 309 and took 1 from 147, so 309 became 310.',
      wrong: ['She added 1 to both numbers.', 'She took 1 from both numbers.', 'She changed only 147.'] }),
    adjustQ({ id: 't8', a: 385, op: '-', b: 156, skill: 'numberline' }),
    pictureQ({ id: 't8b', a: 385, b: 156, shift: 4, rightFirst: false }),
    choiceQ({ id: 't9', skill: 'choose', prompt: 'Which keep the same difference as 426 − 219? Then choose the easiest one.',
      parts: [{ multi: true, label: 'Same difference as 426 − 219 (choose all):', right: ['427 − 220', '407 − 200', '430 − 223'], choices: ['427 − 220', '426 − 220', '407 − 200', '430 − 223', '424 − 221'] },
        { label: 'Which of these is easiest, and why?', right: '407 − 200, because 200 is a hundred, so it is easiest to take away.',
          wrong: ['430 − 223, because 223 ends in 3.', '426 − 219, because nothing changed.', '424 − 221, because both numbers got smaller.'] }],
      explanation: '426 − 219 = 207. 427 − 220, 407 − 200 and 430 − 223 all equal 207. 426 − 220 = 206 and 424 − 221 = 203. 407 − 200 is easiest: 200 is a hundred.' }),
    whoRight({ id: 't10', prompt: 'For 248 + 127, Ana writes 250 + 129 = 379. Ben writes 250 + 125 = 375. Who is right?',
      right: 'Ben. He added 2 to 248 and took 2 from 127.', wrong: ['Ana. She added 2 to both numbers.', 'Both are right.', 'Neither is right.'],
      explanation: '248 + 127 = 375. Ben moved 2 from 127 to 248. Ana added 2 to both, so her sum is 4 too big.' }),
    adjustQ({ id: 't11', a: 917, op: '-', b: 864, skill: 'story', prompt: '917 tickets were sold on Saturday and 864 on Friday. How many more on Saturday? Adjust the numbers, then subtract.', lead: 'How many more → 917 − 864.' }),
    fixQ({ id: 't12', who: 'Kit', pron: 'She', a: 538, op: '+', b: 401, nb: 400 }),
    bothWays({ id: 't13', prompt: 'Pat adds 476 + 314 by changing them to 480 + 318 = 798. Do you agree?', answer: 790,
      right: 'No. He added 4 to both, so the sum is 8 too big.', wrong: ['Yes. Adding to both keeps the sum the same.', 'No. The sum is 4 too big.', 'No. He should have added 4 to only one number.'],
      explanation: 'Pat added 4 to each number, so the sum grew by 8: 798 − 8 = 790. Right way: 480 + 310 = 790.' })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Adjust Numbers Test: the same 14 questions each time; choice order changes with each attempt. */
  function adjustTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => ((p.kind === 'choice' && !p.compact) || p.kind === 'multi' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-8'] = {
    id: '2-8',
    storageKey: 'mathbook:v2:lesson-2-8',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-8',
    title: 'Adjust Numbers to Add or Subtract',
    subtitle: 'Make friendly numbers and keep the answer the same',
    objective: 'I can change the numbers in an addition or subtraction problem to make it easier, and keep the answer the same.',
    parentLearn: {
      goal: [
        'Adding: take an amount from one addend and give it to the other. The sum stays the same.',
        'Subtracting: add the same amount to both numbers, or take the same amount from both. The difference stays the same.',
        'Explain the difference: adding = opposite moves; subtracting = same moves (the gap on a number line keeps its length).',
        'Choose a helpful adjustment that makes a ten or a hundred.',
        'Spot wrong adjustments, and fix the answer when only one number was changed.',
        'Solve "how many more" story problems by adjusting.'
      ],
      words: [
        { term: 'Adjust', meaning: 'Change a number a little to make it easier to work with.' },
        { term: 'Friendly number', meaning: 'A number that is easy to add or subtract, like 200 or 450.' },
        { term: 'Sum', meaning: 'The answer when you add.' },
        { term: 'Difference', meaning: 'The answer when you subtract. It is also the distance between two numbers on a number line.' },
        { term: 'Addend', meaning: 'A number you add.' },
        { term: 'Equation', meaning: 'A number sentence with an equal sign.', example: '234 + 200 = 434' }
      ],
      demoVisual: fig({ fig: 'arrows', a: 224, b: 109, op: '+', to: [223, 110], result: 333, tags: ['−1', '+1'] }),
      demonstrate: [
        'Book example: 224 + 109. Move 1 from 224 to 109: 223 + 110 = 333.',
        'Book example: 333 − 212. Take 2 from both: 331 − 210 = 121.',
        'Adding with two piles of coins: move one coin from one pile to the other. The total doesn\'t change.',
        'Subtracting on a number line: slide both ends the same amount. The gap doesn\'t change.',
        'Work Together: Marco changes 457 + 208 to 460 + 211 = 671. He added 3 to both, so the sum is 6 too big (665).'
      ],
      ask: ['"Which number is close to a ten or a hundred?"', '"Adding or subtracting: opposite moves or the same moves?"', '"Is the answer still the same?"', '"If you only changed one number, how do you fix the answer?"'],
      checklist: [
        'Adjusts addition with opposite moves.',
        'Adjusts subtraction with the same moves.',
        'Explains the difference between the two.',
        'Shows the same difference on a number line.',
        'Picks valid adjustments and the easiest one.',
        'Fixes a one-number adjustment.',
        'Solves how-many-more stories, and scores 90% or higher on the Adjust Numbers Test.'
      ]
    },
    mistakes: [
      'Changing both addends the same way in addition (Marco: 457 + 208 → 460 + 211). Say: "In adding, one goes up and one goes down."',
      'Changing subtraction numbers opposite ways (452 − 197 → 449 − 200). Say: "In subtracting, both slide the same way. Look at the number line."',
      'Adjusting only one number and forgetting to fix the answer (Yazmin: 457 + 250 = 707).',
      'Adjusting into harder numbers. Aim for a ten or a hundred.',
      'Fixing in the wrong direction (subtracting when they should add back).'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'What happens if you adjust only one number?',
        idea: 'The answer changes by that much, so you have to fix it.'
      }
    },
    skills: {
      same: 'Same sum, different numbers',
      add: 'Adjust to add',
      sub: 'Adjust to subtract',
      structure: 'Adding vs. subtracting',
      describe: 'Describe an adjustment',
      numberline: 'Same difference on a number line',
      choose: 'Choose valid adjustments',
      compare: 'Which adjustment is right',
      fix: 'Fix a one-number adjustment',
      error: 'Find the mistake',
      story: 'How-many-more stories',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Adjust Numbers', blurb: 'All 15 practice questions: adjust to add and to subtract, number lines, choosing adjustments, fixing mistakes, and stories.', ids: bank.map((q) => q.id) }],
    tests: {
      adjust: { id: 'adjust', title: 'Adjust Numbers Test', questions: 14, blurb: 'Adjust to add and subtract, number lines, mistakes, and stories.', generate: adjustTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _pictures: pictures
  };
})(typeof window !== 'undefined' ? window : globalThis);
