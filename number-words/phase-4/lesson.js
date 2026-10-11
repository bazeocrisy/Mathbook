/*
 * Mathbook — Number Words, Phase 4: Hundreds and thousands (100–9,999).
 * Teaching content only; it runs on the shared lesson engine (assets/js/lesson-app.js) with Number Words branding.
 * Range and wording are the ones documented in number-words/program.js and Lesson 2-1: word form as in the book,
 * "two thousand, one hundred thirty-seven" (a comma after "thousand"; hyphens join tens and ones). A zero place is
 * not said (5,072 → five thousand, seventy-two). Answers are graded by pv.checkWords: capitals, spaces, hyphens, the
 * comma and an optional "and" do not matter; a wrong value, a missing part or a misspelling is wrong.
 * Every answer, choice key and explanation is computed from the numbers. See tests/number-words-phase-4.test.js and tests/number-words-phase-4.browser.mjs.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt, numberToWords: W } = pv;
  const fig = (spec) => (MB.fig ? MB.fig.html(spec) : '');

  const NAMES = ['Thousands', 'Hundreds', 'Tens', 'Ones'];
  const digits4 = (n) => [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10];
  /** Place-value chart (F4 table) for n: only the places n uses. */
  function chart(n) {
    const d = digits4(n), from = n >= 1000 ? 0 : 1;
    return { fig: 'table', title: `${fmt(n)} in a place-value chart`, head: NAMES.slice(from), rows: [d.slice(from)] };
  }
  /** "2 thousands, 0 hundreds, 7 tens, 2 ones" (only the places n uses). */
  function placeText(n) {
    const d = digits4(n), from = n >= 1000 ? 0 : 1;
    const unit = ['thousand', 'hundred', 'ten', 'one'];
    return d.slice(from).map((x, i) => `${x} ${unit[i + from]}${x === 1 ? '' : 's'}`).join(', ');
  }
  /** Why the words are what they are: one clause per place that is said; zero places are named as "not said". */
  function wordsWhy(n) {
    const d = digits4(n), out = [];
    if (d[0]) out.push(`${d[0]} thousand${d[0] === 1 ? '' : 's'} → "${W(d[0] * 1000)}"`);
    if (d[1]) out.push(`${d[1]} hundred${d[1] === 1 ? '' : 's'} → "${W(d[1] * 100)}"`);
    const r = n % 100;
    if (r) out.push(`${r < 10 ? `${r} one${r === 1 ? '' : 's'}` : `${d[2]} ten${d[2] === 1 ? '' : 's'} and ${d[3]} one${d[3] === 1 ? '' : 's'}`} → "${W(r)}"`);
    const zeros = NAMES.filter((_, i) => (i > 0 || n >= 1000) && d[i] === 0).map((x) => x.toLowerCase());
    return `${out.join('; ')}.${zeros.length ? ` 0 ${zeros.join(' and 0 ')}: not said.` : ''}`;
  }

  /** True when the answer to type is printed in the question's own text. */
  function leaks(q) {
    const text = [q.prompt].concat((q.parts || []).map((p) => (p.label || '') + ' ' + (p.choices || []).join(' '))).join(' ').toLowerCase();
    if (q.type === 'words') return text.includes(W(q.answer));
    if (q.type === 'number') return (text.match(/\d[\d,]*/g) || []).some((t) => Number(t.replace(/,/g, '')) === q.answer);
    return false;
  }

  // ---------- Question builders ----------
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);
  /** Numeral → words (typed). */
  function toWordsQ(o) {
    const n = o.n;
    return {
      id: o.id, type: 'words', skill: o.skill || 'towords', answer: n,
      prompt: o.prompt || `Write ${fmt(n)} in words.`, figure: o.chart ? chart(n) : undefined,
      hint: o.hint || (n >= 1000 ? 'Say the thousands first, then a comma, then the hundreds, tens and ones.' : 'Say the hundreds first, then the tens and ones. A hyphen joins tens and ones, as in forty-two.'),
      explanation: `${fmt(n)} = ${placeText(n)}. ${wordsWhy(n)} So ${fmt(n)} is "${W(n)}".`
    };
  }
  /** Words → numeral (typed). */
  function toNumberQ(o) {
    const n = o.n;
    return {
      id: o.id, type: 'number', skill: o.skill || 'tonumber', answer: n,
      prompt: o.prompt || `Write the number: ${W(n)}.`,
      hint: o.hint || 'Find each place in the words. Write a 0 for any place that is not said.',
      explanation: `"${W(n)}" is ${placeText(n)}, so the number is ${fmt(n)}.`
    };
  }
  /** Distractor word forms for n: a place shift (a 0 dropped or digits swapped) and a missing part; all different from n. */
  function wrongWords(n) {
    const s = String(n), out = [];
    if (s.includes('0')) { const m = Number(s.replace(/0/, '')); if (m !== n && m > 0) out.push(m); }
    const nz = s.split('').map((c, i) => i).filter((i) => s[i] !== '0');
    for (let k = 0; k + 1 < nz.length; k++) { const a = s.split(''); [a[nz[k]], a[nz[k + 1]]] = [a[nz[k + 1]], a[nz[k]]]; const m = Number(a.join('')); if (m !== n) out.push(m); }
    const d = digits4(n);
    if (n >= 1000 && d[1]) out.push(n - d[1] * 100);
    if (n >= 1000) out.push(n % 1000 || d[0] * 100);
    return out.filter((m, i) => m >= 1 && m <= 9999 && out.indexOf(m) === i && m !== n).map(W);
  }
  /** Which is the word form of n? */
  function pickQ(o) {
    const n = o.n, right = W(n), wrong = wrongWords(n).filter((w) => w !== right).slice(0, 2);
    return {
      id: o.id, type: 'mc', skill: 'check', answer: right, choices: order(o, [right].concat(wrong)),
      prompt: o.prompt || `Which is the word form of ${fmt(n)}?`,
      hint: o.hint || 'Read each choice. Does it name every place that is not 0, and nothing else?',
      explanation: `${fmt(n)} = ${placeText(n)}. ${wordsWhy(n)} So the word form is "${right}".`
    };
  }
  /** Place value link: which digit is in a place, then the words. */
  function placeQ(o) {
    const n = o.n, d = digits4(n), k = o.place;
    return {
      id: o.id, type: 'parts', skill: 'place', prompt: o.prompt || `Look at ${fmt(n)}.`,
      parts: [
        { kind: 'num', label: `How many ${NAMES[k].toLowerCase()}?`, answer: d[k] },
        { kind: 'choice', label: d[k] ? `Do you say the ${NAMES[k].toLowerCase()} in the words?` : `Do you say "${NAMES[k].toLowerCase()}" in the words?`, answer: d[k] ? 'Yes' : 'No', choices: ['Yes', 'No'], compact: true }
      ],
      hint: o.hint || 'A place with 0 is not said in the words.',
      explanation: `${fmt(n)} = ${placeText(n)}. ${d[k] ? `There ${d[k] === 1 ? 'is' : 'are'} ${d[k]} ${NAMES[k].toLowerCase()}, so you say them.` : `There are 0 ${NAMES[k].toLowerCase()}, so you do not say them.`} ${fmt(n)} is "${W(n)}".`
    };
  }

  // ---------- Learn ----------
  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const DEMO = [135, 462, 715, 2137, 5072, 3405, 6008, 4600, 4060, 7056];
  const ok = (n) => !DEMO.includes(n);
  const noLeak = (gen) => (r) => { let q; for (let g = 0; g < 200; g++) { q = gen(r); if (!leaks(q)) return q; } return q; };
  const d1 = (r) => pv.randInt(r, 1, 9);

  function hundredsCheck(r) {
    for (;;) { const n = d1(r) * 100 + pv.randInt(r, 2, 9) * 10 + d1(r); if (ok(n)) return toWordsQ({ id: 'learn-1', n }); }
  }
  function readCheck(r) {
    for (;;) { const n = d1(r) * 100 + (r() < 0.35 ? pv.randInt(r, 11, 19) : pv.randInt(r, 2, 9) * 10 + d1(r)); if (ok(n)) return toNumberQ({ id: 'learn-2', n }); }
  }
  function thousandsCheck(r) {
    for (;;) { const n = d1(r) * 1000 + d1(r) * 100 + pv.randInt(r, 2, 9) * 10 + d1(r); if (ok(n)) return toWordsQ({ id: 'learn-3', n }); }
  }
  /** 4-digit with 1 or 2 zeros below the thousands (never all three). */
  function zeroNumber(r) {
    for (;;) {
      const d = [d1(r), pv.randInt(r, 0, 9), pv.randInt(r, 0, 9), pv.randInt(r, 0, 9)];
      const z = d.slice(1).filter((x) => x === 0).length;
      const n = d[0] * 1000 + d[1] * 100 + d[2] * 10 + d[3];
      if (z >= 1 && z <= 2 && ok(n)) return n;
    }
  }
  function zerosCheck(r) {
    const n = zeroNumber(r);
    return r() < 0.5 ? toNumberQ({ id: 'learn-4', n, skill: 'znumber' }) : toWordsQ({ id: 'learn-4', n, skill: 'zwords' });
  }
  function pickCheck(r) {
    for (;;) { const n = zeroNumber(r); const q = pickQ({ id: 'learn-5', n, r }); if (q.choices.length === 3) return q; }
  }

  const steps = [
    {
      id: 'hundreds', kind: 'slides', title: 'Hundreds in words',
      explain: 'Say the hundreds first. Then say the tens and ones. A hyphen joins tens and ones: thirty-five.',
      slides: [
        fig(chart(135)) + say('135 has 1 hundred, 3 tens and 5 ones.'),
        big('1 hundred → one hundred') + big('3 tens and 5 ones → thirty-five') + say('A hyphen joins the tens and the ones.'),
        big('135 → one hundred thirty-five') + say('Read it aloud: <b>one hundred thirty-five</b>.')
      ],
      check: noLeak(hundredsCheck)
    },
    {
      id: 'read', kind: 'slides', title: 'Words to numbers',
      explain: 'Find each place in the words. Write its digit in that place.',
      slides: [
        say('"four hundred sixty-two"') + say('<b>four hundred</b> → 4 hundreds. <b>sixty-two</b> → 6 tens and 2 ones.') + fig(chart(462)),
        big('four hundred sixty-two → 462'),
        say('"seven hundred fifteen": <b>fifteen</b> is 1 ten and 5 ones.') + big('seven hundred fifteen → 715')
      ],
      check: noLeak(readCheck)
    },
    {
      id: 'thousands', kind: 'slides', title: 'Thousands in words',
      explain: 'Say the thousands first, then a comma, then the hundreds, tens and ones, the same way as before.',
      slides: [
        fig(chart(2137)) + say('2,137 has 2 thousands, 1 hundred, 3 tens and 7 ones.'),
        big('2 thousands → two thousand,') + big('137 → one hundred thirty-seven'),
        big('2,137 → two thousand, one hundred thirty-seven') + say('The comma in the words goes where the comma in the number is.')
      ],
      check: noLeak(thousandsCheck)
    },
    {
      id: 'zeros', kind: 'slides', title: 'Zeros are not said',
      explain: 'A place with 0 is not said in the words. When you write the number, write a 0 to hold that place.',
      slides: [
        fig(chart(5072)) + say('5,072 has <b>0 hundreds</b>. We don\'t say "zero hundred".') + big('5,072 → five thousand, seventy-two'),
        big('3,405 → three thousand, four hundred five') + big('6,008 → six thousand, eight') + say('0 tens, or 0 hundreds and 0 tens: those places are not said.'),
        say('Words to a number: "four thousand, sixty". Thousands 4. Hundreds? Not said, so 0. Sixty → 6 tens, 0 ones.') + fig(chart(4060)) + big('four thousand, sixty → 4,060'),
        say('Without the 0s you would write 46, a different number. The 0s hold the places.')
      ],
      check: noLeak(zerosCheck)
    },
    {
      id: 'check', kind: 'slides', title: 'Check the words',
      explain: 'Good word form names every place that is not 0, in order, and nothing else.',
      slides: [
        say('Which is the word form of 7,056?') + big('seven thousand, fifty-six ✓') + say('7 thousands, 0 hundreds, 5 tens, 6 ones.'),
        say('"seven thousand, five hundred six" is 7,506: the 5 moved to the hundreds. ✗') + say('"seven hundred fifty-six" is 756: the thousands are missing. ✗'),
        say('Spelling to watch: <b>forty</b> (no u), <b>fifteen</b>, <b>eighteen</b> (one t), <b>ninety</b>.')
      ],
      check: noLeak(pickCheck)
    }
  ];

  // ---------- Practice Together (12), On My Own (12), Test (12) ----------
  const guided = [
    toWordsQ({ id: 'p1', n: 248, chart: true }),
    toWordsQ({ id: 'p2', n: 6193, chart: true }),
    toNumberQ({ id: 'p3', n: 513, hint: 'Thirteen is 1 ten and 3 ones.' }),
    toNumberQ({ id: 'p4', n: 8246 }),
    toWordsQ({ id: 'p5', n: 4027, skill: 'zwords', hint: 'How many hundreds? A place with 0 is not said.' }),
    toWordsQ({ id: 'p6', n: 9300, skill: 'zwords' }),
    toNumberQ({ id: 'p7', n: 3008, skill: 'znumber', hint: 'Hundreds and tens are not said, so write 0s there.' }),
    toNumberQ({ id: 'p8', n: 7090, skill: 'znumber' }),
    toNumberQ({ id: 'p9', n: 604, skill: 'znumber' }),
    pickQ({ id: 'p10', n: 2805, seed: 7 }),
    pickQ({ id: 'p11', n: 1460, seed: 13 }),
    placeQ({ id: 'p12', n: 3705, place: 2 })
  ];
  const parentTips = { p1: 'Ask your child to read the number aloud first, then write what they said.', p5: 'Cover the 0 with a finger: what do you still say?', p7: 'Say each place: thousands, hundreds, tens, ones. Which ones did the words skip?', p10: 'Ask: which choice names every place that is not 0?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const bank = [
    toWordsQ({ id: 'o1', n: 376 }),
    toWordsQ({ id: 'o2', n: 4581 }),
    toNumberQ({ id: 'o3', n: 917 }),
    toNumberQ({ id: 'o4', n: 5362 }),
    toWordsQ({ id: 'o5', n: 8034, skill: 'zwords' }),
    toWordsQ({ id: 'o6', n: 2600, skill: 'zwords' }),
    toNumberQ({ id: 'o7', n: 9005, skill: 'znumber' }),
    toNumberQ({ id: 'o8', n: 4070, skill: 'znumber' }),
    toNumberQ({ id: 'o9', n: 802, skill: 'znumber' }),
    pickQ({ id: 'o10', n: 6403, seed: 25 }),
    pickQ({ id: 'o11', n: 3950, seed: 29 }),
    placeQ({ id: 'o12', n: 5038, place: 2 })
  ];

  const testItems = [
    toWordsQ({ id: 't1', n: 589 }),
    toWordsQ({ id: 't2', n: 7254 }),
    toNumberQ({ id: 't3', n: 816 }),
    toNumberQ({ id: 't4', n: 3471 }),
    toWordsQ({ id: 't5', n: 6052, skill: 'zwords' }),
    toWordsQ({ id: 't6', n: 1900, skill: 'zwords' }),
    toNumberQ({ id: 't7', n: 8006, skill: 'znumber' }),
    toNumberQ({ id: 't8', n: 2030, skill: 'znumber' }),
    toNumberQ({ id: 't9', n: 409, skill: 'znumber' }),
    pickQ({ id: 't10', n: 4308 }),
    pickQ({ id: 't11', n: 9160 }),
    placeQ({ id: 't12', n: 7046, place: 1 })
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** Number Words Test: the same 12 questions; the word-form choices change order with each attempt (Yes/No stays). */
  function wordsTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (q.type === 'mc' ? Object.assign({}, q, { choices: pv.shuffle(r, q.choices) }) : Object.assign({}, q)));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['nw-4'] = {
    id: 'nw-4',
    storageKey: 'mathbook:v2:number-words:phase-4',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '4',
    title: 'Hundreds and Thousands',
    subtitle: 'Read and write numbers to 9,999 in words',
    brand: {
      noun: 'Number Words Phase', pill: 'Phase 4: 100–9,999', crumbs: 'Number Words · Read It, Say It, Spell It, Write It', menu: 'Phase Menu', thing: 'phase',
      resetNote: 'Number Words Phase 1 and the math lessons are not changed.'
    },
    objective: 'I can write numbers from 100 to 9,999 in words, and write the number for the words, including numbers with zeros.',
    parentLearn: {
      goal: [
        'Link each place (thousands, hundreds, tens, ones) to its words.',
        'Write a number in words: thousands first, then a comma, then the hundreds, tens and ones; a hyphen joins tens and ones.',
        'Write the number for the words, with a 0 in every place that is not said.',
        'Spot word forms with a missing or moved place.'
      ],
      words: [
        { term: 'Word form', meaning: 'A number written in words.', example: 'two thousand, one hundred thirty-seven' },
        { term: 'Standard form', meaning: 'A number written with digits.', example: '2,137' },
        { term: 'Place', meaning: 'Thousands, hundreds, tens or ones.' },
        { term: 'Hyphen', meaning: 'The short line that joins tens and ones: forty-two.' }
      ],
      demoVisual: fig(chart(5072)),
      demonstrate: [
        'Write 135 in a place-value chart, read it aloud, then write "one hundred thirty-five".',
        'Write 2,137: say "two thousand," pause at the comma, then "one hundred thirty-seven".',
        'Write 5,072 and cover the 0: "five thousand, seventy-two". The 0 hundreds is not said.',
        'Read "four thousand, sixty" and write it with 0s: 4,060.'
      ],
      ask: ['"Which place do you say first?"', '"Which places are not said? Why?"', '"Where does the hyphen go?"', '"Did you write a 0 for every place that was not said?"'],
      checklist: [
        'Writes 3- and 4-digit numbers in words, with hyphens and the comma after "thousand".',
        'Writes the number for word form, with 0s where places are not said.',
        'Spots a word form with a missing or moved place.',
        'Scores 90% or higher on the Number Words Test.'
      ]
    },
    mistakes: [
      'Saying the zeros ("five thousand, zero hundred seventy-two"). A place with 0 is not said.',
      'Leaving out the 0s when writing the number ("four thousand, sixty" written as 460). Write a digit in every place.',
      'Spelling: "fourty" (forty has no u), "eightteen" (eighteen has one t), "nineteen", "ninety".',
      'Writing "and" between hundreds and tens is accepted, but Mathbook writes it without "and", as in the book.'
    ],
    seeIt: {
      steps,
      reflection: { prompt: 'How do the places help you write a number in words?', idea: 'Say each place from the left. Skip any place that is 0. A hyphen joins tens and ones, and a comma comes after the thousands.' }
    },
    skills: {
      towords: 'Write numbers in words',
      tonumber: 'Write the number for the words',
      zwords: 'Words for numbers with zeros',
      znumber: 'Numbers with zeros from words',
      check: 'Check the word form',
      place: 'Places and words'
    },
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [{ id: 's1', title: 'Number Words Practice', blurb: 'All 12 practice questions: numbers to words, words to numbers, zeros, and checking the word form.', ids: bank.map((q) => q.id) }],
    tests: {
      words: { id: 'words', title: 'Number Words Test', questions: 12, blurb: 'Write numbers to 9,999 in words and words as numbers, including zeros.', generate: wordsTest }
    },
    _leaks: leaks,
    _testItems: testItems,
    _demo: DEMO,
    _wrongWords: wrongWords
  };
})(typeof window !== 'undefined' ? window : globalThis);
