/*
 * Mathbook — Chapter 2, Lesson 2-6: Use Partial Sums to Add
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-6.md (with the batch-B review fixes B-04, B-06, B-16, B-17, B-18, B-24).
 * The spec's M-STACK model uses the shared controls (DESIGN §2): partial sums in a row = chain preset 'rows';
 * stacked partial sums = vcalc input 'rows' (notes: 'input' when the child writes the "300 + 200" labels);
 * someone else's work = figures F7 (stack) and F11 (equation lines); reverse items = `num` parts with anyOrder.
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-6.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  // ---------- Math helpers ----------
  const PLACES = ['Hundreds', 'Tens', 'Ones'];
  const UNIT = [100, 10, 1];
  /** 367 → [300, 60, 7] */
  const split = (n) => UNIT.map((u) => Math.floor(n / u) % 10 * u);
  const sumOf = (list) => list.reduce((x, y) => x + y, 0);
  const plus = (list) => list.map(fmt).join(' + ');
  /** The three place lines: [{ place, vals, sum }] for hundreds, tens and ones. */
  const lines = (adds) => PLACES.map((place, k) => { const vals = adds.map((a) => split(a)[k]); return { place, vals, sum: sumOf(vals) }; });
  /** "300 + 100 = 400" for each place (results blank when hide). */
  const workLines = (adds, hide) => lines(adds).map((l) => `${plus(l.vals)} = ${hide ? '___' : fmt(l.sum)}`);
  const partialSums = (adds) => lines(adds).map((l) => l.sum);
  /** "Hundreds: 300 + 100 = 400. Tens: … 400 + 110 + 12 = 522." */
  function worked(adds) {
    return lines(adds).map((l) => `${l.place}: ${plus(l.vals)} = ${fmt(l.sum)}.`).join(' ') + ` ${plus(partialSums(adds))} = ${fmt(sumOf(adds))}.`;
  }

  /** True when a number the child must type is printed anywhere in the question's text (not the figure). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    const text = [q.prompt, q.display || ''].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders (practice, test and Learn share them) ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** Partial sums in a row (chain preset 'rows'): every place value, every partial sum, then the sum. */
  function rowQ(o) {
    const adds = o.adds;
    return {
      id: o.id, type: 'chain', preset: 'rows', addends: adds, skill: o.skill || 'row',
      prompt: o.prompt || `Add ${plus(adds)} with partial sums in a row.`,
      figure: o.figure,
      hint: o.hint || 'Hundreds with hundreds, tens with tens, ones with ones.',
      explanation: (o.lead ? o.lead + ' ' : '') + worked(adds)
    };
  }
  /** Stacked partial sums (vcalc input 'rows'); notes: 'input' when the child writes each place's numbers too. */
  function stackQ(o) {
    const adds = o.adds;
    return {
      id: o.id, type: 'vcalc', op: '+', rows: adds, input: 'rows', notes: o.notes, skill: o.skill || 'stack',
      prompt: o.prompt || `Stack ${plus(adds)}. Find the partial sums, then the sum.`,
      figure: o.figure,
      hint: o.hint || 'Line up the places. Add each place, then add the partial sums.',
      explanation: (o.lead ? o.lead + ' ' : '') + worked(adds)
    };
  }

  /** Work backward: which two numbers made these partial sums? What is the sum? o: { id, a, b, hint?, prompt? } */
  function reverseQ(o) {
    const { a, b } = o;
    const L = lines([a, b]);
    return {
      id: o.id, type: 'parts', skill: 'reverse',
      prompt: o.prompt || 'These are partial sums. Which two numbers were added? What is the sum?',
      figure: { fig: 'eqs', lines: workLines([a, b]) },
      parts: [
        { kind: 'num', label: 'One addend:', answer: a, anyOrder: 'ab' },
        { kind: 'num', label: 'The other addend:', answer: b, anyOrder: 'ab' },
        { kind: 'num', label: 'The sum:', answer: a + b }
      ],
      hint: o.hint || 'Use the first number in each line to build one addend.',
      explanation: `The first numbers make ${plus(L.map((l) => l.vals[0]))} = ${fmt(a)}. The second numbers make ${plus(L.map((l) => l.vals[1]))} = ${fmt(b)}. ` +
        `The addends can go in either order. ${plus(partialSums([a, b]))} = ${fmt(a + b)}, so ${plus([a, b])} = ${fmt(a + b)}.`
    };
  }

  /** "Rami says the sum is 600" (only the hundreds partial sum). o: { id, who, pron, a, b, right, wrong, hint?, seed?, r? } */
  function onlyHundredsQ(o) {
    const { a, b } = o, P = partialSums([a, b]);
    return {
      id: o.id, type: 'parts', skill: 'error',
      prompt: `${o.who} adds ${plus([a, b])}. ${o.pron} partial sums are ${fmt(P[0])}, ${fmt(P[1])} and ${fmt(P[2])}. ${o.who} says the sum is ${fmt(P[0])}. Do you agree?`,
      figure: { fig: 'stack', rows: [a, b], op: '+', partials: true, total: null },
      parts: [
        { kind: 'choice', label: 'Do you agree?', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) },
        { kind: 'num', label: 'The correct sum:', answer: a + b }
      ],
      hint: o.hint || `Is ${fmt(P[0])} one partial sum or all of them?`,
      explanation: `${fmt(P[0])} is only the hundreds partial sum. Add all three: ${plus(P)} = ${fmt(a + b)}.`
    };
  }
  /** Someone's written work with a mistake (book 11, the dropped ten). o: { id, prompt, work: [lines], a, b, right, wrong, explanation, hint?, seed? } */
  function mistakeQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'parts', skill: 'error',
      prompt: o.prompt,
      figure: { fig: 'eqs', lines: o.work },
      parts: [
        { kind: 'choice', label: o.label || 'What went wrong?', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) },
        { kind: 'num', label: 'The correct sum:', answer: a + b }
      ],
      hint: o.hint, explanation: o.explanation
    };
  }
  /** One "why" or "which" choice. o: { id, skill, prompt, right, wrong: [...], figure?, explanation, hint?, seed?, r? } */
  function choiceQ(o) {
    return {
      id: o.id, type: 'parts', skill: o.skill, prompt: o.prompt, figure: o.figure,
      parts: [{ kind: 'choice', label: o.label || 'Choose the best answer.', answer: o.right, choices: order(o, [o.right].concat(o.wrong)) }],
      hint: o.hint, explanation: o.explanation
    };
  }

  // ---------- Learn: six steps, each Example then Your Turn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const colour = (n) => { const [h, t, o] = split(n); return `<span class="ph-hu">${fmt(h)}</span> + <span class="ph-te">${fmt(t)}</span> + <span class="ph-on">${fmt(o)}</span>`; };
  const eqs = (adds, extra) => fig(Object.assign({ fig: 'eqs', lines: lines(adds).map((l) => ({ text: `${plus(l.vals)} = ${fmt(l.sum)}`, tag: l.place })).concat(extra === false ? [] : [{ text: `${plus(partialSums(adds))} = ${fmt(sumOf(adds))}`, hi: true }]) }));
  const stackFig = (adds, extra) => fig(Object.assign({ fig: 'stack', rows: adds, op: '+', partials: true }, extra || {}));
  /** Be Curious (p. 55): the same 11 icons in rows of 5 and in rows of 3. */
  function icons(cols) {
    const dot = '<span style="display:block;width:1.5rem;height:1.5rem;border-radius:6px;background:var(--primary)"></span>';
    return `<div style="display:grid;grid-template-columns:repeat(${cols},1.5rem);gap:0.35rem;justify-content:center;margin:0.4rem 0">${dot.repeat(11)}</div>`;
  }

  // Numbers used in the Learn examples and the book; Your Turn never repeats these pairs.
  const DEMO = [[368, 154], [406, 237], [345, 123], [163, 163], [367, 145], [309, 225], [216, 382], [200, 300]];
  const isDemo = (a, b) => DEMO.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const zeros = (n) => String(n).split('').filter((d) => d === '0').length;
  /** A "PS pair" (spec §5): 3-digit, sum ≤ 999, at most one 0 digit each, some place makes 10 or more, not a demo pair. */
  function psPair(r) {
    for (;;) {
      const a = pv.randInt(r, 101, 899), b = pv.randInt(r, 101, 899);
      if (a + b > 999 || zeros(a) > 1 || zeros(b) > 1 || isDemo(a, b) || a === b) continue;
      if ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10) continue;
      return [a, b];
    }
  }

  // Step 1: decompose one number by place value.
  function decomposeCheck(r) {
    let n;
    do { n = pv.randInt(r, 101, 999); } while (n % 10 === 0 || Math.floor(n / 10) % 10 === 0 || [368, 154, 367, 145].includes(n));
    const [h, t, o] = split(n);
    return {
      id: 'learn-1', type: 'parts', skill: 'decompose',
      prompt: `Break apart ${fmt(n)} by place value.`,
      display: `${fmt(n)} = ___ + ___ + ___`,
      parts: [
        { kind: 'num', label: 'Hundreds:', answer: h },
        { kind: 'num', label: 'Tens:', answer: t },
        { kind: 'num', label: 'Ones:', answer: o }
      ],
      hint: 'What is each digit worth? In 368, the 3 is worth 300.',
      explanation: `${fmt(n)} = ${plus([h, t, o])}. The ${String(n)[0]} is worth ${fmt(h)}, the ${String(n)[1]} is worth ${fmt(t)}, and the ${String(n)[2]} is worth ${fmt(o)}.`
    };
  }
  const rowCheck = (r) => rowQ({ id: 'learn-2', adds: psPair(r) });
  const stackCheck = (r) => stackQ({ id: 'learn-3', adds: psPair(r), hint: 'Line up the places. Write each partial sum under the line.' });
  // Step 4: the same sum in a row or stacked (Math is… Explaining).
  const SAME_RIGHT = 'We add the same partial sums. Only the way we write them changes.';
  const SAME_WRONG = ['Stacking makes the sum bigger.', 'It isn\'t always the same.', 'A row only works for small numbers.'];
  function sameCheck(r) {
    const adds = psPair(r);
    const [w1, w2] = pv.shuffle(r, ['Ava', 'Ben', 'Cora', 'Dev', 'Eli', 'Fay', 'Gus', 'Hana']).slice(0, 2);
    return {
      id: 'learn-4', type: 'parts', skill: 'stack',
      prompt: `${w1} added ${plus(adds)} in a row. ${w2} stacked the same addends.`,
      figure: [{ fig: 'eqs', lines: workLines(adds).concat(`${plus(partialSums(adds))} = ${fmt(sumOf(adds))}`) }, { fig: 'stack', rows: adds, op: '+', partials: true, hideResults: true }],
      parts: [
        { kind: 'choice', label: `${w2}'s sum will be`, answer: 'the same', choices: ['the same', 'bigger', 'smaller'], compact: true },
        { kind: 'choice', label: 'Why?', answer: SAME_RIGHT, choices: pv.shuffle(r, [SAME_RIGHT].concat(SAME_WRONG)) }
      ],
      hint: 'Look at the partial sums. Are they the same numbers?',
      explanation: `Both ways add ${plus(partialSums(adds))}, so both sums are ${fmt(sumOf(adds))}. Only the way the work is written changes.`
    };
  }
  const reverseCheck = (r) => { const [a, b] = psPair(r); return reverseQ({ id: 'learn-5', a, b }); };
  // Step 6: a story problem, stacked.
  const STORIES = [
    (a, b) => `Mia has ${fmt(a)} stickers. She gets ${fmt(b)} more. How many stickers does she have now?`,
    (a, b) => `Leo walks ${fmt(a)} steps to the park and ${fmt(b)} steps back. How many steps in all?`,
    (a, b) => `A library has ${fmt(a)} animal books and ${fmt(b)} space books. How many books is that?`,
    (a, b) => `Nia found ${fmt(a)} shells on Monday and ${fmt(b)} shells on Tuesday. How many shells did she find?`
  ];
  function storyCheck(r) {
    const [a, b] = psPair(r);
    return stackQ({ id: 'learn-6', adds: [a, b], skill: 'word', prompt: `${pv.pick(r, STORIES)(a, b)} Use partial sums.`,
      hint: 'Which two numbers do you add? Stack them and add each place.', lead: `Add ${plus([a, b])}.` });
  }

  const steps = [
    {
      id: 'decompose', kind: 'slides', title: 'Break apart by place value',
      explain: 'Decompose means break apart. Write each addend as hundreds + tens + ones.',
      slides: [
        say('Add <b>368 + 154</b>. First, look at each digit\'s place.') + fig({ fig: 'stack', rows: [368, 154], op: '+', places: true, label: '368 plus 154 in columns, with hundreds, tens and ones headings.' }),
        big(`368 = ${colour(368)}`) + say('The 3 is worth <b>300</b>, the 6 is worth <b>60</b>, and the 8 is worth <b>8</b>.'),
        big(`154 = ${colour(154)}`) + say('Now both addends are broken apart. That is called <b>decomposing</b>.')
      ],
      check: decomposeCheck
    },
    {
      id: 'row', kind: 'slides', title: 'Partial sums in a row',
      explain: 'Add the hundreds, the tens, and the ones. Each answer is a partial sum. Then add the partial sums.',
      slides: [
        say('368 + 154. Add the hundreds:') + big('300 + 100 = <b>400</b>'),
        say('Add the tens:') + big('60 + 50 = <b>110</b>'),
        say('Add the ones:') + big('8 + 4 = <b>12</b>') + say('400, 110 and 12 are the <b>partial sums</b>.'),
        say('Add the partial sums:') + eqs([368, 154]) + say('368 + 154 = <b>522</b>.')
      ],
      check: rowCheck
    },
    {
      id: 'stacked', kind: 'slides', title: 'Stack the partial sums',
      explain: 'Stack the addends and line up the places. Write each partial sum under the line, then add them.',
      slides: [
        say('Another way: <b>stack</b> the addends. Line up the places.') + stackFig([368, 154], { reveal: 0 }),
        say('Write the partial sums under the line, one place at a time: 300 + 100 = 400, then 60 + 50 = 110, then 8 + 4 = 12.') + stackFig([368, 154], { reveal: 3 }),
        say('Add the partial sums: <b>522</b>. Same answer as in a row!') + stackFig([368, 154])
      ],
      check: stackCheck
    },
    {
      id: 'same', kind: 'slides', title: 'Same sum either way',
      explain: 'In a row or stacked, you add the same partial sums, so the sum is the same.',
      slides: [
        say('The same 11 apps on a phone: in rows of 5, then in rows of 3.') + `<div class="slide-pair">${icons(5)}${icons(3)}</div>` + say('Still <b>11</b> apps. Only the layout changed.'),
        `<div class="slide-pair">${eqs([368, 154])}${stackFig([368, 154])}</div>` + say('In a row or stacked: the same partial sums, 400, 110 and 12, so the same sum, <b>522</b>.')
      ],
      check: sameCheck
    },
    {
      id: 'backward', kind: 'slides', title: 'Every partial sum counts',
      explain: 'Add all the partial sums. Each partial-sum line shows one place of each addend, so you can work backward.',
      slides: [
        say('Rami adds <b>406 + 237</b>. His partial sums are 600, 30 and 13. He says the sum is 600.') + stackFig([406, 237], { total: null }),
        say('600 is only the hundreds! Add <b>all three</b>: 600 + 30 + 13 = <b>643</b>.') + stackFig([406, 237]),
        say('Working backward. Which two numbers were added?') + fig({ fig: 'eqs', lines: workLines([345, 123]) }) +
          say('The first numbers make 300 + 40 + 5 = <b>345</b>. The second numbers make 100 + 20 + 3 = <b>123</b>. So the equation was 345 + 123 = 468.')
      ],
      check: reverseCheck
    },
    {
      id: 'stories', kind: 'slides', title: 'Three addends and stories',
      explain: 'With three addends, add three hundreds, three tens, and three ones. In a story, find the numbers to add first.',
      slides: [
        say('<b>132 + 305 + 214</b>: add the hundreds, the tens, and the ones of all three.') + eqs([132, 305, 214]) + say('132 + 305 + 214 = <b>651</b>.'),
        say('A farm stand sold 163 pumpkins on Saturday and the <b>same number</b> on Sunday. Add 163 + 163.') + stackFig([163, 163]) + say('They sold <b>326</b> pumpkins.')
      ],
      check: storyCheck
    }
  ];

  // ---------- Practice Together (9), On My Own (13), Test (13) ----------
  const ADDENDS_RIGHT = 'Take the first number from each line to build one addend, and the second number from each line to build the other.';
  const guided = [
    rowQ({ id: 'pt1', adds: [258, 316], hint: 'Hundreds first.' }),
    stackQ({ id: 'pt2', adds: [473, 189], hint: '70 + 80 is more than 100. That\'s OK!' }),
    onlyHundredsQ({ id: 'pt3', who: 'Rosa', pron: 'Her', a: 507, b: 238, seed: 3,
      right: 'No. 700 is only the hundreds partial sum. She must add all three partial sums.',
      wrong: ['Yes. The hundreds partial sum is the answer.', 'Yes. You can skip the tens and ones.', 'No. The sum is just the tens and ones.'] }),
    reverseQ({ id: 'pt4', a: 234, b: 451, hint: 'The first numbers make one addend.' }),
    choiceQ({ id: 'pt5', skill: 'reverse', prompt: 'How can you find the addends from the partial sums?', seed: 5, right: ADDENDS_RIGHT,
      wrong: ['Add all the partial sums.', 'Use only the hundreds.', 'Take the biggest partial sum.'],
      hint: 'Each line has one number from each addend.', explanation: 'Each partial-sum line adds one place from each addend. The first numbers (like 200, 30, 4) build one addend, 234. The second numbers build the other.' }),
    stackQ({ id: 'pt6', adds: [176, 176], skill: 'word', prompt: 'A camp has 176 campers in July and the same number in August. How many campers in all? Use partial sums.',
      hint: 'Same number both months: 176 + 176.', lead: 'The same number twice: 176 + 176.' }),
    rowQ({ id: 'pt7', adds: [241, 306, 132], skill: 'three', prompt: '241 + 306 + 132', hint: 'Add three hundreds, three tens, three ones.' }),
    { id: 'pt8', type: 'explain', skill: 'reason', prompt: 'Why is place value important when you use partial sums?',
      parent: 'Listen for: hundreds with hundreds, tens with tens.',
      listenFor: ['You add matching places: hundreds with hundreds, tens with tens, ones with ones.', 'Each digit has a value, like the 6 in 367 is 60.'],
      explanation: 'You must add hundreds to hundreds and tens to tens. If you mix places (300 + 4), the partial sums are wrong.' },
    mistakeQ({ id: 'pt9', a: 247, b: 136, seed: 9,
      prompt: 'Ivan adds 247 + 136. His partial sums are 300, 70 and 13, but he writes 300 + 70 + 3 = 373. What went wrong? What is the sum?',
      work: ['200 + 100 = 300', '40 + 30 = 70', '7 + 6 = 13', '300 + 70 + 3 = 373'],
      right: '7 + 6 = 13, not 3. He must add the whole 13.', wrong: ['He should add only the hundreds.', 'Nothing. 300 + 70 + 3 is right.', 'The tens partial sum should be 7.'],
      hint: 'What is 7 + 6?', explanation: 'The ones partial sum is 13, so add the whole 13: 300 + 70 + 13 = 383.' })
  ];
  const parentTips = { pt1: 'Ask: what is the 5 in 258 worth?', pt3: 'Ask: how many partial sums are there?', pt5: 'Have your child explain it in their own words too.', pt9: 'Ask: where did the ten from 13 go?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    rowQ({ id: 'o1', adds: [356, 427] }),
    stackQ({ id: 'o2', adds: [614, 279] }),
    stackQ({ id: 'o3', adds: [538, 247] }),
    rowQ({ id: 'o4', adds: [265, 158] }),
    reverseQ({ id: 'o5', a: 413, b: 275 }),
    choiceQ({ id: 'o6', skill: 'reverse', prompt: 'How do you find the addends from partial sums?', seed: 6,
      right: 'Build one addend from the first number in each line and the other addend from the second number in each line.',
      wrong: ['Add all the partial sums together.', 'Use only the hundreds line.', 'Take the two biggest partial sums.'],
      hint: 'Each line adds one place from each addend.', explanation: 'Each line adds one place of each addend, so the first numbers build one addend and the second numbers build the other.' }),
    stackQ({ id: 'o7', adds: [186, 186], skill: 'word', prompt: 'A school ordered 186 pencils in the fall and the same number in the spring. How many pencils? Use partial sums.',
      hint: 'The same number twice: 186 + 186.', lead: 'The same number twice: 186 + 186.' }),
    stackQ({ id: 'o8', adds: [346, 271], skill: 'convert', notes: 'input', figure: { fig: 'eqs', lines: workLines([346, 271], true) },
      prompt: 'Jay started 346 + 271 in a row. Finish it a different way: stacked. Write what you add in each place (like 300 + 200), each partial sum, and the sum.',
      hint: 'Use the same place values as Jay. Stack them and add.' }),
    rowQ({ id: 'o9', adds: [247, 352], skill: 'convert', figure: { fig: 'stack', rows: [247, 352], op: '+', partials: true, hideResults: true },
      prompt: 'Here is the start of stacked work for 247 + 352. Write it in a row and finish it.', hint: 'Each label is one line in a row.' }),
    stackQ({ id: 'o10', adds: [358, 475], skill: 'word', prompt: 'A game shows 358 points. Then Lia scores 475 more. How many points now? Use partial sums.',
      hint: 'Add the points she had and the points she scored.', lead: 'Add 358 + 475.' }),
    mistakeQ({ id: 'o11', a: 465, b: 232, seed: 11,
      prompt: 'Theo adds 465 + 232. He adds 400 + 200 = 600 and writes 465 + 232 = 600. What is his mistake? What is the sum?',
      work: ['400 + 200 = 600', '465 + 232 = 600'], label: 'What is his mistake?',
      right: 'He added only the hundreds. He forgot the tens and ones partial sums.', wrong: ['He should add the ones first.', 'Nothing. 600 is right.', 'He added the tens wrong.'],
      hint: 'How many partial sums should there be?', explanation: '600 is only the hundreds partial sum. Tens: 60 + 30 = 90. Ones: 5 + 2 = 7. 600 + 90 + 7 = 697.' }),
    stackQ({ id: 'o12', adds: [318, 204, 165], skill: 'three', prompt: 'Stack 318 + 204 + 165. Find the partial sums, then the sum.', hint: 'Add three hundreds, three tens, three ones.' }),
    mistakeQ({ id: 'o13', a: 159, b: 324, seed: 13,
      prompt: 'Kia adds 159 + 324. She writes 400 + 70 + 3 = 473. What went wrong? What is the sum?',
      work: ['400 + 70 + 3 = 473'],
      right: '9 + 4 = 13, not 3. The ones partial sum is 13.', wrong: ['She should add only the hundreds.', 'Nothing. 473 is right.', 'The hundreds partial sum should be 300.'],
      hint: 'What is 9 + 4?', explanation: 'Hundreds: 100 + 300 = 400. Tens: 50 + 20 = 70. Ones: 9 + 4 = 13, not 3. 400 + 70 + 13 = 483.' })
  ];

  const testItems = [
    rowQ({ id: 't1', adds: [245, 639] }),
    stackQ({ id: 't2', adds: [527, 368] }),
    rowQ({ id: 't3', adds: [176, 453] }),
    stackQ({ id: 't4', adds: [389, 246] }),
    reverseQ({ id: 't5', a: 259, b: 630 }),
    choiceQ({ id: 't6', skill: 'reverse', prompt: 'Which equation has these partial sums?', label: 'Choose the equation.',
      figure: { fig: 'eqs', lines: workLines([174, 528]) }, right: '174 + 528', wrong: ['154 + 728', '174 + 582', '167 + 528'],
      explanation: 'The first numbers make 100 + 70 + 4 = 174. The second numbers make 500 + 20 + 8 = 528. So the equation is 174 + 528.' }),
    stackQ({ id: 't7', adds: [268, 268], skill: 'word', prompt: 'A bakery made 268 muffins on Monday and the same number on Tuesday. How many muffins? Use partial sums.', lead: 'The same number twice: 268 + 268.' }),
    rowQ({ id: 't8', adds: [263, 548], skill: 'convert', figure: { fig: 'stack', rows: [263, 548], op: '+', partials: true, hideResults: true },
      prompt: 'Ella stacked 263 + 548 and wrote the place values, but no partial sums. Write her work in a row and finish it.' }),
    stackQ({ id: 't9', adds: [274, 568], skill: 'word', prompt: 'Jada walked 274 steps, then 568 more. How many steps? Use partial sums.', lead: 'Add 274 + 568.' }),
    onlyHundredsQ({ id: 't10', who: 'Leah', pron: 'Her', a: 508, b: 316,
      right: 'No. 800 is only the hundreds partial sum. She must add all three.',
      wrong: ['Yes. The hundreds partial sum is the answer.', 'Yes. The tens and ones are too small to count.', 'No. She should add only the tens and ones.'] }),
    mistakeQ({ id: 't11', a: 468, b: 235, prompt: 'Sam adds 468 + 235. He writes 600 + 90 + 3 = 693. What went wrong? What is the sum?',
      work: ['600 + 90 + 3 = 693'],
      right: '8 + 5 = 13, not 3. The ones partial sum is 13.', wrong: ['He should add only the hundreds.', 'Nothing. 693 is right.', '60 + 30 is 80, not 90.'],
      explanation: 'Hundreds: 400 + 200 = 600. Tens: 60 + 30 = 90. Ones: 8 + 5 = 13, not 3. 600 + 90 + 13 = 703.' }),
    stackQ({ id: 't12', adds: [226, 403, 158], skill: 'three', prompt: 'Stack 226 + 403 + 158. Find the partial sums, then the sum.' }),
    stackQ({ id: 't13', adds: [384, 457], skill: 'convert', notes: 'input', figure: { fig: 'eqs', lines: workLines([384, 457], true) },
      prompt: 'Ben started 384 + 457 in a row. Show it stacked and finish it. Write what you add in each place, each partial sum, and the sum.' })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Partial Sums Test: the same 13 items each time; choice order changes with each attempt. */
  function partialSumsTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' && !p.compact ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-6'] = {
    id: '2-6',
    storageKey: 'mathbook:v2:lesson-2-6',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-6',
    title: 'Use Partial Sums to Add',
    subtitle: 'Break apart by place value, then add',
    objective: 'I can break apart addends by place value, add the hundreds, tens, and ones, and add the partial sums, in a row or stacked.',
    parentLearn: {
      goal: [
        'Break apart (decompose) 3-digit numbers by place value: 367 = 300 + 60 + 7.',
        'Add the hundreds, the tens, and the ones to get partial sums, then add the partial sums.',
        'Write the work in a row or stacked, and know the sum is the same either way.',
        'Work backward from partial sums to the two addends.',
        'Find partial-sum mistakes: stopping at the hundreds, or dropping the ten from a partial sum like 13.',
        'Solve story problems and add three addends.'
      ],
      words: [
        { term: 'Decompose', meaning: 'Break a number apart into smaller parts.', example: '368 = 300 + 60 + 8' },
        { term: 'Place value', meaning: 'What a digit is worth because of its place (hundreds, tens, ones).', example: 'In 367, the 6 is worth 60.' },
        { term: 'Partial sum', meaning: 'The sum of one place: the hundreds, the tens, or the ones.' },
        { term: 'Addend', meaning: 'A number you add.' },
        { term: 'Sum', meaning: 'The total when you add all the partial sums.' },
        { term: 'Stack', meaning: 'Write numbers one under the other, lining up the places.' }
      ],
      demoVisual: fig({ fig: 'stack', rows: [367, 145], op: '+', partials: true }),
      demonstrate: [
        'Write 367 + 145. Say each number in expanded form: 300 + 60 + 7 and 100 + 40 + 5.',
        'Add the hundreds (300 + 100 = 400), the tens (60 + 40 = 100), and the ones (7 + 5 = 12). Then add 400 + 100 + 12 = 512.',
        'Write it again stacked. Show the same three partial sums give the same 512.',
        'Show 309 + 225 with partial sums 500, 20, 14. Ask: "Is 500 the sum?" (No, it is only the hundreds. The sum is 534.)',
        'Book example (Be Curious): the same 11 apps in rows of 5 or rows of 3 are still 11. The layout changes, not the total.'
      ],
      ask: ['"What is this digit worth?"', '"Did you add every partial sum?"', '"Which numbers made this partial sum?"', '"Would the answer change if you stacked it?"'],
      checklist: [
        'Decomposes 3-digit numbers by place value.',
        'Finds partial sums in a row.',
        'Finds stacked partial sums.',
        'Says why both ways give the same sum.',
        'Finds the addends from partial sums.',
        'Finds the "only the hundreds" and "dropped ten" mistakes.',
        'Adds three addends and solves story problems, and scores 90% or higher on the Partial Sums Test.'
      ]
    },
    mistakes: [
      'Stopping after the hundreds partial sum (500 for 309 + 225). Ask: "How many partial sums? Add them all."',
      'Writing digits instead of values (3 + 1 = 4 instead of 300 + 100 = 400). Ask: "What is the 3 worth?"',
      'Dropping the ten in a partial sum (7 + 5 written as 2). The ones partial sum is 12: write the whole 12.',
      'Lining up the places wrong when stacking. Point to the hundreds, tens and ones columns.',
      'In working backward, mixing first and second numbers across lines. Say: "The first numbers build one addend."'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'Why does place value matter when you use partial sums?',
        idea: 'You must add hundreds to hundreds and tens to tens. If you mix places, the partial sums are wrong.'
      }
    },
    skills: {
      decompose: 'Break apart by place value',
      row: 'Partial sums in a row',
      stack: 'Stacked partial sums',
      reverse: 'Find the addends',
      error: 'Find the mistake',
      word: 'Story problems',
      three: 'Three addends',
      convert: 'Change row work to stacked (or back)',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Partial Sums Practice', blurb: 'All 13 practice questions: partial sums in a row and stacked, finding the addends, mistakes, stories, and three addends.', ids: bank.map((q) => q.id) }],
    tests: {
      partial: { id: 'partial', title: 'Partial Sums Test', questions: 13, blurb: 'Partial sums in a row and stacked, working backward, mistakes, and stories.', generate: partialSumsTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _psPair: psPair
  };
})(typeof window !== 'undefined' ? window : globalThis);
