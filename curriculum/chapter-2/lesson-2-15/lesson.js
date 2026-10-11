/*
 * Mathbook — Chapter 2, Lesson 2-15: Use an Algorithm to Subtract
 * Teaching content only. The reusable engine lives in assets/js/.
 * Spec: docs/chapter-2/lessons/2-15.md (with the batch-D review fixes D-1, D-11).
 * Book method (p. 92): write the numbers vertically, ones under ones; subtract the ones, then the tens, hundreds,
 * thousands (and ten thousands). Like the book, every subtraction here is regroup-free (Decision 18): each top digit
 * is at least the bottom digit. Check with addition; missing digits; word problems (left, other part, increases).
 * Shared controls: vcalc `digits` (op −, no regroup boxes), vcalc `blanks`, F7 `misalign`, F4 table, `parts`.
 * Every answer, choice key and explanation is computed from the numbers. See tests/lesson-2-15.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const minus = (a, b) => `${fmt(a)} − ${fmt(b)}`;
  const PLACE = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
  const KEYS = ['O', 'T', 'H', 'Th', 'TTh'];
  const dig = (n, p) => Math.floor(n / 10 ** p) % 10;
  /** True when no column needs regrouping (every top digit ≥ the bottom digit). */
  const regroupFree = (a, b) => { for (let p = 0; p < String(a).length; p++) if (dig(a, p) < dig(b, p)) return false; return a >= b; };
  /** Column-by-column text, right to left: "6 − 3 = 3; 8 − 5 = 3; …; bring down the 5. 5,867 − 742 = 5,125." */
  function subText(a, b) {
    const steps = [];
    for (let p = 0; p < String(a).length; p++) steps.push(p < String(b).length ? `${dig(a, p)} − ${dig(b, p)} = ${dig(a, p) - dig(b, p)}` : `bring down the ${dig(a, p)}`);
    return `${steps.join('; ')}. ${minus(a, b)} = ${fmt(a - b)}.`;
  }

  /** True when a number the child must type is printed in the question's own text (not a figure). */
  function leaks(q) {
    const nums = [];
    (q.parts || []).forEach((p) => { if (p.kind === 'num') nums.push(p.answer); });
    if (q.type === 'vcalc' && !q.blanks) nums.push(q.rows[0] - q.rows[1]);
    const text = [q.prompt].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ');
    const shown = (text.match(/\d[\d,]*/g) || []).map((t) => Number(t.replace(/,/g, '')));
    return nums.some((n) => shown.includes(n));
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);

  /** The algorithm: the answer row one digit at a time (no regroup boxes). */
  function subQ(o) {
    const { a, b } = o;
    return {
      id: o.id, type: 'vcalc', op: '−', rows: [a, b], input: 'digits', skill: o.skill,
      prompt: o.prompt || `Subtract one place at a time: ${minus(a, b)} = ?`,
      hint: o.hint || 'Start with the ones. Subtract the bottom digit from the top digit in each place.',
      explanation: subText(a, b)
    };
  }
  /** Missing digits: blanks = { top: [..], bottom: [..], result: [..] } (place keys), one unknown per column. */
  function missingQ(o) {
    const { a, b, blanks } = o, d = a - b;
    const why = [];
    for (let p = 0; p < 4; p++) {
      const k = KEYS[p], t = dig(a, p), u = dig(b, p), r = dig(d, p);
      if ((blanks.top || []).includes(k)) why.push(`${cap(PLACE[p])}: □ − ${u} = ${r}, and ${r} + ${u} = ${t}, so the top digit is ${t}.`);
      else if ((blanks.bottom || []).includes(k)) why.push(`${cap(PLACE[p])}: ${t} − □ = ${r}, so the bottom digit is ${t - r}.`);
      else if ((blanks.result || []).includes(k)) why.push(`${cap(PLACE[p])}: ${t} − ${u} = ${r}.`);
    }
    return {
      id: o.id, type: 'vcalc', op: '−', rows: [a, b], input: 'digits', blanks, skill: 'missing',
      prompt: o.prompt || 'Find the missing digits. Work one place at a time, starting with the ones.',
      hint: o.hint || 'In each place: top − bottom = difference. Use the two digits you can see to find the missing one.',
      explanation: `${why.join(' ')} So ${minus(a, b)} = ${fmt(d)}. Check: ${fmt(d)} + ${fmt(b)} = ${fmt(a)}.`
    };
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  /** Word problem: whole − part. o: { id, total, part, skill, story, label, money?, seed?|r? } */
  function wordQ(o) {
    const { total, part } = o, right = `${minus(total, part)} = ?`;
    return {
      id: o.id, type: 'parts', skill: o.skill, prompt: o.story,
      parts: [
        { kind: 'choice', label: 'Which equation solves it?', answer: right, choices: order(o, [right, `${fmt(total)} + ${fmt(part)} = ?`, `${minus(part, total)} = ?`]) },
        { kind: 'num', label: o.label, answer: total - part }
      ],
      hint: o.hint || 'You know the whole and one part. Subtract to find the other part.',
      explanation: `${o.lead ? o.lead + ' ' : ''}${subText(total, part)}`
    };
  }
  /** Total minus one part, worked in the column (book Work Together). */
  function togetherQ(o) {
    return subQ({ id: o.id, a: o.total, b: o.part, skill: 'together', prompt: o.story, hint: o.hint || 'Total minus the part you know.' });
  }
  /** Compare two increases from a table. o: { id, title, vals: [y1, y2, y3], unit } */
  function increaseQ(o) {
    const [y1, y2, y3] = o.vals, i1 = y2 - y1, i2 = y3 - y2;
    const bigger = i1 > i2 ? 'Year 1 to Year 2' : 'Year 2 to Year 3';
    return {
      id: o.id, type: 'parts', skill: 'increase',
      prompt: 'Was the increase greater from Year 1 to Year 2, or from Year 2 to Year 3?',
      figure: { fig: 'table', title: o.title, head: ['Year', 'Money raised'], rows: [['Year 1', y1], ['Year 2', y2], ['Year 3', y3]], money: true },
      parts: [
        { kind: 'num', label: 'Increase from Year 1 to Year 2 ($):', answer: i1 },
        { kind: 'num', label: 'Increase from Year 2 to Year 3 ($):', answer: i2 },
        { kind: 'choice', label: 'Which increase was greater?', answer: bigger, choices: ['Year 1 to Year 2', 'Year 2 to Year 3'], compact: true }
      ],
      hint: o.hint || 'Subtract to find each increase. Then compare the two increases, not the totals.',
      explanation: `${subText(y2, y1)} ${subText(y3, y2)} ${fmt(Math.max(i1, i2))} > ${fmt(Math.min(i1, i2))}, so the increase from ${bigger} was greater.`
    };
  }
  /** Someone lined up the left digits. o: { id, who, pron, a, b, seed? } */
  function lineupQ(o) {
    const { a, b } = o, right = `${o.pron} lined up the left digits. Ones must go under ones.`;
    return {
      id: o.id, type: 'parts', skill: 'lineup',
      prompt: `${o.who} subtracted ${minus(a, b)} like this. What went wrong?`,
      // Neutral caption and spoken label: the picture shows the work; saying the places don't line up would give the answer away.
      figure: { fig: 'stack', rows: [a, b], op: '−', misalign: 'left', caption: `${o.who}'s work`, label: `${o.who}'s work: ${fmt(a)} on top and ${fmt(b)} below it, with the ${String(b)[0]} under the ${String(a)[0]}.` },
      parts: [
        { kind: 'choice', label: 'What went wrong?', answer: right, choices: order(o, [right, `${o.pron} started with the thousands.`, 'Nothing. You can line up either side.', `${o.pron} should add instead.`]) },
        { kind: 'num', label: 'The correct difference:', answer: a - b }
      ],
      hint: o.hint || `Where should the ${dig(b, 0)} go?`,
      explanation: `Ones go under ones: the ${dig(b, 0)} goes under the ${dig(a, 0)}. ${subText(a, b)}`
    };
  }
  /** Check with addition: the difference, then how to check it (the choices never show the difference). */
  function checkQ(o) {
    const { a, b } = o, right = `Add your answer to ${fmt(b)}. You should get ${fmt(a)}.`;
    return {
      id: o.id, type: 'parts', skill: 'check', prompt: `${minus(a, b)} = ?`,
      parts: [
        { kind: 'num', label: 'The difference:', answer: a - b },
        { kind: 'choice', label: 'How can you check your answer with addition?', answer: right,
          choices: order(o, [right, `Add your answer to ${fmt(a)}. You should get ${fmt(b)}.`, `Add ${fmt(a)} and ${fmt(b)}. You should get your answer.`, `Subtract ${fmt(b)} from your answer. You should get ${fmt(a)}.`]) }
      ],
      hint: o.hint || 'Add the difference to the number you took away.',
      explanation: `${subText(a, b)} Check: ${fmt(a - b)} + ${fmt(b)} = ${fmt(a)}.`
    };
  }

  // ---------- Learn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const stackFig = (a, b, extra) => fig(Object.assign({ fig: 'stack', rows: [a, b], op: '−' }, extra || {}));
  const DEMO = [9486, 6253, 3233, 5867, 742, 5125, 6438, 2418, 4020, 28975, 3510, 25465, 3856, 1343, 2513, 1875, 643, 1232, 2968, 415, 2553, 1203, 3415, 5638, 2212, 2223];
  const ok = (...ns) => ns.every((n) => !DEMO.includes(n));
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };
  /**
   * A regroup-free pair: top has `topLen` digits, bottom `botLen`; diff digits chosen per place.
   * zeros: how many 0s the difference must have below its leading place (exactly).
   */
  function pair(r, topLen, botLen, zeros) {
    for (;;) {
      let a = 0, b = 0, z = 0;
      for (let p = 0; p < topLen; p++) {
        const lead = p === topLen - 1;
        let u = p < botLen ? pv.randInt(r, p === botLen - 1 ? 1 : 0, 8) : 0;
        if (lead && p < botLen) u = pv.randInt(r, 1, 7);
        const lo = lead ? 1 : 0;
        if (u + lo > 9) { u = 9 - lo; }
        const dd = pv.randInt(r, lo, 9 - u);
        if (!lead && dd === 0) z++;
        a += (u + dd) * 10 ** p; b += u * 10 ** p;
      }
      if (z !== zeros || !regroupFree(a, b) || !ok(a, b, a - b)) continue;
      return [a, b];
    }
  }

  function subCheck(r) {
    const [a, b] = pair(r, 4, 4, r() < 0.7 ? 0 : 1);
    return subQ({ id: 'learn-1', a, b, skill: 'sub44' });
  }
  function sizeCheck(r) {
    const k = pv.randInt(r, 0, 2);
    const [a, b] = k === 0 ? pair(r, 4, 3, 0) : k === 1 ? pair(r, 4, 4, pv.randInt(r, 1, 2)) : pair(r, 5, 4, 0);
    return subQ({ id: 'learn-2', a, b, skill: ['sub43', 'zeros', 'sub5'][k], hint: 'Line up the ones first. If a place comes out 0, write the 0 so the other digits stay in their places.' });
  }
  function checkCheck(r) {
    const [a, b] = r() < 0.5 ? pair(r, 4, 4, 0) : pair(r, 4, 3, 0);
    return checkQ({ id: 'learn-3', a, b, r });
  }
  function missingCheck(r) {
    const [a, b] = pair(r, 4, 4, r() < 0.7 ? 0 : 1);
    const cols = pv.shuffle(r, ['Th', 'H', 'T', 'O']);
    const blanks = { top: [cols[0]], bottom: [cols[1], cols[2]].sort((x, y) => KEYS.indexOf(y) - KEYS.indexOf(x)), result: [cols[3]] };
    return missingQ({ id: 'learn-4', a, b, blanks });
  }
  const LEFT = [
    (t, p, n) => [`A hike is ${fmt(t)} meters long. ${n} has walked ${fmt(p)} meters. How many meters are left?`, 'Meters left:'],
    (t, p, n) => [`${n} is reading a book with ${fmt(t)} pages. ${n} has read ${fmt(p)} pages. How many pages are left?`, 'Pages left:'],
    (t, p) => [`A family is driving ${fmt(t)} miles. They drove ${fmt(p)} miles on the first day. How many miles are left?`, 'Miles left:']
  ];
  const PART = [
    (t, p) => [`A family spent $${fmt(t)} on a bike and a helmet. The helmet cost $${fmt(p)}. How much did the bike cost?`, 'The bike ($):'],
    (t, p) => [`A school spent $${fmt(t)} on books and shelves. The shelves cost $${fmt(p)}. How much did the books cost?`, 'The books ($):']
  ];
  function storyCheck(r) {
    const n = pv.pick(r, ['Dev', 'Ivy', 'Omar', 'Nia', 'Sam', 'Lena']);
    const [t, p] = r() < 0.5 ? pair(r, 4, 3, 0) : pair(r, 4, 4, 0);
    const left = r() < 0.5;
    const [story, label] = pv.pick(r, left ? LEFT : PART)(t, p, n);
    return wordQ({ id: 'learn-5', total: t, part: p, skill: left ? 'left' : 'part', story, label, r });
  }

  const steps = [
    {
      id: 'place', kind: 'slides', title: 'Subtract place by place',
      explain: 'Write the numbers in a column, ones under ones. Subtract the ones first, then move left one place at a time.',
      slides: [
        stackFig(9486, 6253, { places: true }) + say('A truck weighs 9,486 pounds. A van weighs 6,253 pounds. How much heavier is the truck? Write 9,486 − 6,253 in a column, ones under ones.'),
        stackFig(9486, 6253, { places: true, result: 1, focus: 'O' }) + say('Ones: 6 − 3 = <b>3</b>.'),
        stackFig(9486, 6253, { places: true, result: 2, focus: 'T' }) + say('Tens: 8 tens − 5 tens = <b>3</b> tens.'),
        stackFig(9486, 6253, { places: true, result: 3, focus: 'H' }) + say('Hundreds: 4 hundreds − 2 hundreds = <b>2</b> hundreds.'),
        stackFig(9486, 6253, { places: true, result: 'all', focus: 'Th' }) + say('Thousands: 9 thousands − 6 thousands = <b>3</b> thousands. The truck is <b>3,233</b> pounds heavier.')
      ],
      check: noLeak(subCheck)
    },
    {
      id: 'sizes', kind: 'slides', title: 'Line up different sizes (and zeros)',
      explain: 'Line up the ones. If the bottom number has no digit in a place, bring the top digit down. Write every 0.',
      slides: [
        stackFig(5867, 742, { misalign: 'left' }) + stackFig(5867, 742, { places: true, caption: '<span class="fig-ok">✓</span> Ones under ones.' }) + say('5,867 − 742. Line up the <b>ones</b>: the 2 goes under the 7, not under the 5.'),
        stackFig(5867, 742, { places: true, result: 'all' }) + say('7 − 2 = 5. 6 − 4 = 2. 8 − 7 = 1. There is nothing to take from the 5, so bring it down: <b>5,125</b>.'),
        stackFig(6438, 2418, { places: true, result: 'all' }) + say('Zeros: 6,438 − 2,418. 8 − 8 = <b>0</b>, 3 − 1 = 2, 4 − 4 = <b>0</b>, 6 − 2 = 4. <b>4,020</b>. Write the 0s: they hold the places.'),
        stackFig(28975, 3510, { places: true, result: 'all' }) + say('Big numbers work the same way: 28,975 − 3,510 = <b>25,465</b>.')
      ],
      check: noLeak(sizeCheck)
    },
    {
      id: 'check', kind: 'slides', title: 'Check with addition',
      explain: 'Addition undoes subtraction. Add your answer to the number you took away. You should get the number you started with.',
      slides: [
        say('If 9,486 − 6,253 = 3,233, then 3,233 + 6,253 should be 9,486.'),
        fig({ fig: 'stack', rows: [3233, 6253], op: '+', places: true, result: 'all' }) + say('3 + 3 = 6, 3 + 5 = 8, 2 + 2 = 4, 3 + 6 = 9. <b>9,486</b> ✓. It matches, so the difference is right.'),
        say('If the check does not match, look for the place that went wrong.')
      ],
      check: noLeak(checkCheck)
    },
    {
      id: 'missing', kind: 'slides', title: 'Missing digits',
      explain: 'In each place, top − bottom = difference. Use the two digits you can see to find the missing one.',
      slides: [
        stackFig(3856, 1343, { places: true, blanks: { top: ['T'], bottom: ['H', 'O'], result: ['Th'] } }) + say('Some digits are missing. Work one place at a time. Start with the ones.'),
        stackFig(3856, 1343, { places: true, blanks: { top: ['T'], bottom: ['H'], result: ['Th'] }, focus: 'O' }) + say('Ones: 6 − □ = 3. 6 take away what is 3? <b>3</b>.'),
        stackFig(3856, 1343, { places: true, blanks: { bottom: ['H'], result: ['Th'] }, focus: 'T' }) + say('Tens: □ − 4 = 1. What minus 4 is 1? Think 1 + 4 = <b>5</b>.'),
        stackFig(3856, 1343, { places: true, result: 'all' }) + say('Hundreds: 8 − □ = 5, so the missing digit is <b>3</b>. Thousands: 3 − 1 = <b>2</b>.'),
        say('3,856 − 1,343 = 2,513. Check: 2,513 + 1,343 = 3,856 ✓.')
      ],
      check: noLeak(missingCheck)
    },
    {
      id: 'words', kind: 'slides', title: 'Word problems',
      explain: 'Find the whole and the part you know. Subtract to find the other part.',
      slides: [
        say('<b>How many are left?</b> A hike is 1,875 meters. Dev has walked 643 meters. 1,875 − 643 = <b>1,232</b> meters left.'),
        say('<b>Find the other part.</b> A family spent $2,968 on a TV and a stand. The stand cost $415. The TV: 2,968 − 415 = <b>$2,553</b>.'),
        fig({ fig: 'table', title: 'Plants Sold', head: ['Year', 'Plants'], rows: [['Year 1', 1203], ['Year 2', 3415], ['Year 3', 5638]] }) +
          say('<b>Compare increases.</b> Year 1 to Year 2: 3,415 − 1,203 = <b>2,212</b>. Year 2 to Year 3: 5,638 − 3,415 = <b>2,223</b>. 2,223 > 2,212, so the increase from Year 2 to Year 3 was greater.')
      ],
      check: noLeak(storyCheck)
    }
  ];

  // ---------- Practice Together (14 + explain), On My Own (14), Test (14) ----------
  const guided = [
    subQ({ id: 'p1', a: 869, b: 425, skill: 'sub3', hint: 'Ones first.' }),
    subQ({ id: 'p2', a: 784, b: 352, skill: 'sub3', hint: 'Ones first.' }),
    subQ({ id: 'p3', a: 6957, b: 615, skill: 'sub43', hint: 'Line up the ones.' }),
    subQ({ id: 'p4', a: 3486, b: 254, skill: 'sub43', hint: 'Line up the ones.' }),
    subQ({ id: 'p5', a: 5798, b: 2463, skill: 'sub44', hint: 'Four places, right to left.' }),
    subQ({ id: 'p6', a: 8647, b: 3205, skill: 'sub44', hint: '0 tens: 4 − 0 = 4.' }),
    subQ({ id: 'p7', a: 7586, b: 2546, skill: 'zeros', hint: 'Write a 0 when a place has nothing left.' }),
    subQ({ id: 'p8', a: 26875, b: 4630, skill: 'sub5', hint: 'Line up the ones; bring down the ten thousands.' }),
    wordQ({ id: 'p9', total: 2496, part: 274, skill: 'left', seed: 9, label: 'Miles left:', hint: 'Whole minus the part they drove.', story: 'The Lee family is driving 2,496 miles. They drove 274 miles the first day. How many miles are left?' }),
    wordQ({ id: 'p10', total: 3876, part: 1352, skill: 'part', seed: 10, label: 'The paint ($):', hint: 'You know the total and one part.', story: 'A club spent $3,876 on paint and brushes. The brushes cost $1,352. How much did the paint cost?' }),
    missingQ({ id: 'p11', a: 4658, b: 2243, blanks: { top: ['T'], bottom: ['H', 'O'], result: ['Th'] }, hint: 'One place at a time, starting with the ones.' }),
    { id: 'p11x', type: 'explain', skill: 'reason', prompt: 'Explain aloud how you found each missing digit in 4,6□8 − 2,□4□ = □,415.', parent: 'Parent review: listen to the explanation.',
      listenFor: ['Ones: 8 − 3 = 5, so the missing digit is 3.', 'Tens: what minus 4 is 1? 5, because 1 + 4 = 5.', 'Hundreds: 6 − 2 = 4. Thousands: 4 − 2 = 2.'], explanation: '4,658 − 2,243 = 2,415. Check: 2,415 + 2,243 = 4,658.' },
    increaseQ({ id: 'p12', title: 'Bake Sale', vals: [2315, 4527, 6748] }),
    togetherQ({ id: 'p13', total: 8947, part: 5312, story: 'A fair sold 8,947 tickets on two days. It sold 5,312 on the first day. How many tickets did it sell on the second day?', hint: 'Total minus the first day.' }),
    lineupQ({ id: 'p14', who: 'Max', pron: 'He', a: 4869, b: 523, seed: 14 })
  ];
  const parentTips = {
    p3: 'Ask: which digit is in the ones place? Put your finger on both ones digits.', p8: 'Ask: which digit is in the ones place? Put your finger on both ones digits.',
    p14: 'Ask: which digit is in the ones place? Put your finger on both ones digits.', p7: 'Ask: why do we write the 0s?',
    p11: 'Ask: what plus 4 makes 9? (Use addition to find a missing digit.)', p12: 'Ask: what does increase mean? How much did it grow?'
  };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = q.parent || parentTips[q.id]; });

  const bank = [
    subQ({ id: 'o1', a: 957, b: 314, skill: 'sub3' }),
    subQ({ id: 'o2', a: 685, b: 263, skill: 'sub3' }),
    subQ({ id: 'o3', a: 4879, b: 456, skill: 'sub43' }),
    subQ({ id: 'o4', a: 9365, b: 142, skill: 'sub43' }),
    subQ({ id: 'o5', a: 7968, b: 4725, skill: 'sub44' }),
    subQ({ id: 'o6', a: 5439, b: 2108, skill: 'sub44' }),
    subQ({ id: 'o7', a: 6857, b: 3807, skill: 'zeros' }),
    subQ({ id: 'o8', a: 47596, b: 3284, skill: 'sub5' }),
    wordQ({ id: 'o9', total: 3785, part: 562, skill: 'left', seed: 29, label: 'Meters left:', story: 'A river trail is 3,785 meters long. Kim has paddled 562 meters. How many meters are left?' }),
    wordQ({ id: 'o10', total: 5896, part: 2473, skill: 'part', seed: 30, label: 'The desks ($):', story: 'A school spent $5,896 on desks and chairs. The chairs cost $2,473. How much did the desks cost?' }),
    missingQ({ id: 'o11', a: 6947, b: 3512, blanks: { top: ['H'], bottom: ['T', 'O'], result: ['Th'] } }),
    increaseQ({ id: 'o12', title: 'Car Wash', vals: [1423, 3645, 5856] }),
    togetherQ({ id: 'o13', total: 9786, part: 6451, story: 'A show sold 9,786 tickets in two weeks. It sold 6,451 in the first week. How many tickets did it sell in the second week?' }),
    lineupQ({ id: 'o14', who: 'Sam', pron: 'He', a: 5987, b: 352, seed: 34 })
  ];

  const testItems = [
    subQ({ id: 't1', a: 976, b: 543, skill: 'sub3' }),
    subQ({ id: 't2', a: 658, b: 207, skill: 'sub3' }),
    subQ({ id: 't3', a: 5749, b: 326, skill: 'sub43' }),
    subQ({ id: 't4', a: 7893, b: 561, skill: 'sub43' }),
    subQ({ id: 't5', a: 6879, b: 3452, skill: 'sub44' }),
    subQ({ id: 't6', a: 9568, b: 4325, skill: 'sub44' }),
    subQ({ id: 't7', a: 8495, b: 3465, skill: 'zeros' }),
    subQ({ id: 't8', a: 38769, b: 5415, skill: 'sub5' }),
    wordQ({ id: 't9', total: 1598, part: 476, skill: 'left', label: 'Meters left:', story: 'A bike race is 1,598 meters. Pia has ridden 476 meters. How many meters are left?' }),
    wordQ({ id: 't10', total: 4968, part: 1725, skill: 'part', label: 'The fence ($):', story: 'A farm spent $4,968 on a fence and a gate. The gate cost $1,725. How much did the fence cost?' }),
    missingQ({ id: 't11', a: 5786, b: 3452, blanks: { top: ['O'], bottom: ['H', 'T'], result: ['Th'] } }),
    increaseQ({ id: 't12', title: 'Book Fair', vals: [1204, 3457, 5689] }),
    togetherQ({ id: 't13', total: 7659, part: 4325, story: 'A zoo had 7,659 visitors on two days. 4,325 came on the first day. How many visitors came on the second day?' }),
    lineupQ({ id: 't14', who: 'Jen', pron: 'She', a: 7958, b: 634 })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** Subtracting Test: the same 14 questions; choice order changes per attempt (the two "Year … to Year …" choices stay in order). */
  function subtractTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.parts
      ? Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' && !/^Year/.test(p.choices[0]) ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })
      : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-15'] = {
    id: '2-15',
    storageKey: 'mathbook:v2:lesson-2-15',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-15',
    title: 'Use an Algorithm to Subtract',
    subtitle: 'Line up the places and subtract from the ones',
    objective: 'I can subtract multi-digit numbers with an algorithm: line up the places, subtract the ones, then the tens, hundreds, thousands (and ten thousands).',
    parentLearn: {
      goal: [
        'Write the numbers in a column with the ones lined up.',
        'Subtract place by place from right to left; write a 0 when a place subtracts to 0.',
        'Subtract numbers with different numbers of digits (3, 4 and 5 digits). In this lesson, as in the book, no place needs regrouping.',
        'Check a difference with addition, and find missing digits one place at a time.',
        'Solve "how many are left", "find the other part" and "which increase is greater" problems.'
      ],
      words: [
        { term: 'Difference', meaning: 'The answer to a subtraction problem.' },
        { term: 'Algorithm', meaning: 'Steps you do the same way every time.' },
        { term: 'Vertical', meaning: 'Written in a column, one number under the other.' },
        { term: 'Line up', meaning: 'Put ones under ones, tens under tens, and so on.' },
        { term: 'Increase', meaning: 'How much bigger a number got.', example: 'From 1,203 to 3,415 is an increase of 2,212.' }
      ],
      demoVisual: fig({ fig: 'stack', rows: [9486, 6253], op: '−', places: true, result: 'all' }),
      demonstrate: [
        '9,486 − 6,253 on squared paper, one place at a time, right to left (3,233).',
        '5,867 − 742: show the wrong, left-lined-up version, then the right one (5,125).',
        'Check: 3,233 + 6,253 = 9,486.',
        'The missing-digit puzzle 3,8□6 − 1,□4□ = □,513.',
        'Book example: 8,386 − 7,185 = 1,201 (elephant weights).'
      ],
      ask: ['"Which place do you start with?"', '"Are the ones lined up?"', '"How can you check with addition?"', '"What plus 4 makes 9?"', '"What does the question want: what\'s left, the other part, or which grew more?"'],
      checklist: [
        'Lines up by place.',
        'Subtracts right to left and writes the 0s.',
        'Handles 3-, 4- and 5-digit numbers.',
        'Checks with addition.',
        'Finds missing digits.',
        'Solves left, other-part and increase problems, and scores 90% or higher on the Subtracting Test.'
      ]
    },
    mistakes: [
      'Lining up on the left (4,869 − 523 with 5 under 4). Line up the ones first: "ones under ones."',
      'Subtracting the top digit from the bottom digit. Re-read the column: top − bottom.',
      'Dropping a middle 0 (5,040 written as 540). Every place in the answer gets a digit.',
      'Forgetting to bring down the top digit when the bottom number is shorter (6,957 − 615 → 342). Nothing to take away: write the top digit.',
      'Missing digits: subtracting when the unknown is in the top row. Top = bottom + difference.',
      'Increase problems: comparing the yearly totals instead of the increases. Find both increases first.'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'Why is it helpful to write numbers vertically when you subtract?',
        idea: 'The places line up: ones under ones, tens under tens. So you subtract like units, one place at a time.'
      }
    },
    skills: {
      sub3: 'Subtract 3-digit numbers',
      sub43: '4-digit minus 3-digit',
      sub44: '4-digit minus 4-digit',
      zeros: 'Zeros in the difference',
      sub5: '5-digit numbers',
      check: 'Check with addition',
      left: 'How many are left?',
      part: 'Find the other part',
      missing: 'Missing digits',
      increase: 'Compare increases',
      together: 'Total minus one part',
      lineup: 'Line up the ones',
      reason: 'Explain why'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Subtracting Practice', blurb: 'All 14 practice questions: 3-, 4- and 5-digit numbers, zeros, missing digits, and word problems.', ids: bank.map((q) => q.id) }],
    tests: {
      subtract: { id: 'subtract', title: 'Subtracting Test', questions: 14, blurb: 'Subtract with the algorithm, find missing digits, and solve problems.', generate: subtractTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _regroupFree: regroupFree
  };
})(typeof window !== 'undefined' ? window : globalThis);
