/*
 * Mathbook — Chapter 2, Lesson 2-1: Represent 4-Digit Numbers
 * Teaching content only. The reusable engine lives in assets/js/.
 * Every question's answer and explanation is computed from the number itself (Mathbook.pv),
 * so a model, chart, and answer can never disagree. See tests/ for the checks.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { PLACES, fmt, digitsOf, expandedForm, numberToWords } = pv;

  // "1 hundred" / "3 hundreds"
  const count = (d, i) => `${d} ${d === 1 ? PLACES[i].one : PLACES[i].key}`;
  const PLACE_CHOICES = PLACES.map((p) => p.key);

  function zeroNote(n) {
    const zeros = digitsOf(n).map((d, i) => (d === 0 ? PLACES[i].key : null)).filter(Boolean);
    if (!zeros.length) return '';
    return ` The 0 means there are no ${zeros.join(' and no ')}; it holds that place.`;
  }

  function fullBreakdown(n) {
    return digitsOf(n).map(count).join(', ');
  }

  // ---------- Question builders (used by guided practice, the bank, and both tests) ----------

  const make = {
    value(n, i) {
      const d = digitsOf(n)[i];
      return {
        type: 'number', skill: 'value', answer: d * PLACES[i].value,
        prompt: `What is the value of the ${d} in ${fmt(n)}?`,
        hint: `Which place is the ${d} in? What is one ${PLACES[i].one} worth?`,
        explanation: `The ${d} is in the ${PLACES[i].key} place. ${count(d, i)} = ${fmt(d * PLACES[i].value)}.`
      };
    },
    placeName(n, i) {
      const d = digitsOf(n)[i];
      return {
        type: 'mc', skill: 'place', answer: PLACES[i].key, choices: PLACE_CHOICES,
        prompt: `In ${fmt(n)}, which place is the ${d} in?`,
        hint: 'Start at the right and name the places: ones, tens, hundreds, thousands.',
        explanation: `From the right: ones, tens, hundreds, thousands. The ${d} is in the ${PLACES[i].key} place, so it is worth ${fmt(d * PLACES[i].value)}.`
      };
    },
    digitIn(n, i) {
      const d = digitsOf(n)[i];
      return {
        type: 'number', skill: 'place', answer: d,
        prompt: `Which digit is in the ${PLACES[i].key} place of ${fmt(n)}?`,
        hint: 'Point to each digit from the right: ones, tens, hundreds, thousands.',
        explanation: `${fmt(n)} has ${fullBreakdown(n)}. The ${PLACES[i].key} digit is ${d}.`
      };
    },
    expanded(n) {
      return {
        type: 'expanded', skill: 'expanded', answer: n,
        prompt: `Write ${fmt(n)} in expanded form.`,
        hint: 'Write the value of each digit, then join the values with + signs.',
        explanation: `${fmt(n)} = ${expandedForm(n)}. Each part is the value of one digit.` + zeroNote(n)
      };
    },
    standardFromExpanded(n, order) {
      const terms = order || pv.expandedTerms(n);
      return {
        type: 'number', skill: 'standard', answer: n,
        prompt: 'Write this number in standard form.', display: terms.map(fmt).join(' + '),
        hint: 'Which place does each value belong to? Put one digit in each place.',
        explanation: `${expandedForm(n)} = ${fmt(n)}: ${fullBreakdown(n)}.` + zeroNote(n)
      };
    },
    wordToStandard(n) {
      return {
        type: 'number', skill: 'word', answer: n,
        prompt: 'Write this number in standard form.', display: numberToWords(n),
        hint: 'The words before the comma tell the thousands. The rest tells hundreds, tens, and ones.',
        explanation: `"${numberToWords(n)}" is ${fullBreakdown(n)}, so it is ${fmt(n)}.` + zeroNote(n)
      };
    },
    standardToWord(n, r) {
      return {
        type: 'mc', skill: 'word', answer: numberToWords(n),
        choices: pv.shuffle(r, [n].concat(wordDistractors(n, r)).map(numberToWords)),
        prompt: `Which is the word form of ${fmt(n)}?`,
        hint: 'Read the thousands, then the hundreds, then the tens and ones together.',
        explanation: `${fmt(n)} is ${fullBreakdown(n)}. We say "${numberToWords(n)}."` + zeroNote(n)
      };
    },
    words(n) {
      return {
        type: 'words', skill: 'word', answer: n,
        prompt: `Write ${fmt(n)} in word form.`,
        hint: 'Say it aloud first. Write a comma after the word "thousand."',
        explanation: `${fmt(n)} is written "${numberToWords(n)}."` + zeroNote(n)
      };
    },
    model(n) {
      return {
        type: 'number', skill: 'model', answer: n, model: n,
        prompt: 'What number do the base-ten blocks show? Write it in standard form.',
        hint: 'Count each kind of block. Each count is the digit for that place.',
        explanation: `The blocks show ${fullBreakdown(n)}: ${expandedForm(n)} = ${fmt(n)}.`
      };
    },
    build(n) {
      const d = digitsOf(n);
      return {
        type: 'build', skill: 'model', answer: n,
        prompt: `Build ${fmt(n)} with base-ten blocks.`,
        hint: 'Each digit tells how many blocks of that kind to use.',
        explanation: `${fmt(n)} has ${fullBreakdown(n)}, so use ${d[0]} thousand cubes, ${d[1]} hundred flats, ${d[2]} ten rods, and ${d[3]} unit cubes.`
      };
    },
    chart(n, source) {
      const display = source === 'expanded' ? expandedForm(n) : source === 'word' ? numberToWords(n) : fmt(n);
      return {
        type: 'chart', skill: 'place', answer: n, display,
        prompt: 'Write the digit for each place in the place-value chart.',
        hint: 'Find the thousands first. If a place has nothing, write 0.',
        explanation: `${display} has ${fullBreakdown(n)}, so the chart reads ${digitsOf(n).join(' | ')}.`
      };
    },
    change(n, delta) {
      const size = Math.abs(delta);
      const i = PLACES.findIndex((p) => p.value === size);
      const d = digitsOf(n)[i];
      const nd = d + Math.sign(delta);
      return {
        type: 'number', skill: 'change', answer: n + delta,
        prompt: `What is ${fmt(size)} ${delta > 0 ? 'more' : 'less'} than ${fmt(n)}?`,
        hint: `Which place is worth ${fmt(size)}? Only that digit changes.`,
        explanation: `${fmt(size)} ${delta > 0 ? 'more' : 'less'} changes only the ${PLACES[i].key} digit: ${d} becomes ${nd}. ${fmt(n)} ${delta > 0 ? '+' : '−'} ${fmt(size)} = ${fmt(n + delta)}.`
      };
    },
    compose(digits, goal) {
      const sorted = digits.slice().sort((a, b) => (goal === 'greatest' ? b - a : a - b));
      const n = pv.fromDigits(sorted);
      return {
        type: 'number', skill: 'compose', answer: n,
        prompt: `Use the digits ${digits.slice(0, 3).join(', ')}, and ${digits[3]} once each. What is the ${goal} number you can make?`,
        hint: `The thousands place matters most. Which digit should go there?`,
        explanation: `Put the ${goal === 'greatest' ? 'greatest' : 'smallest'} digit in the thousands place, the next in the hundreds place, and so on: ${fmt(n)}.`
      };
    }
  };

  /** Three wrong numbers whose word forms look close to n's (swapped digits, a dropped zero, a changed place). */
  function wordDistractors(n, r) {
    const d = digitsOf(n);
    const close = new Set();
    const far = new Set();
    for (let a = 0; a < 4; a++) {
      for (let b = a + 1; b < 4; b++) {
        const s = d.slice();
        [s[a], s[b]] = [s[b], s[a]];
        if (s[0] !== 0) close.add(pv.fromDigits(s));
      }
    }
    const noZero = Number(d.filter((x) => x !== 0).join(''));
    if (noZero !== n && noZero >= 100) close.add(noZero);
    [1000, 100, 10, -1000, -100, -10].forEach((step) => {
      const m = n + step;
      if (m >= 1000 && m <= 9999) far.add(m);
    });
    close.delete(n);
    far.delete(n);
    const pool = pv.shuffle(r, Array.from(close)).concat(pv.shuffle(r, Array.from(far).filter((m) => !close.has(m))));
    return pool.slice(0, 3);
  }

  function mc(o) {
    return Object.assign({ type: 'mc' }, o);
  }

  // ---------- Vocabulary ----------

  const VOCAB = [
    { term: 'digit', meaning: 'A symbol (0–9) used to write numbers', example: '2,137 has four digits: 2, 1, 3, and 7.' },
    { term: 'place value', meaning: 'The value of a digit based on its place in a number', example: 'In 2,137, the 3 is in the tens place, so its value is 30.' },
    { term: 'place-value chart', meaning: 'A chart with a column for each place', example: 'Thousands | Hundreds | Tens | Ones → 2 | 1 | 3 | 7', chart: 2137 },
    { term: 'standard form', meaning: 'A number written with digits, like 2,137', example: '2,137' },
    { term: 'expanded form', meaning: 'A number written as the sum of the values of its digits', example: '2,000 + 100 + 30 + 7' },
    { term: 'word form', meaning: 'A number written with words', example: 'two thousand, one hundred thirty-seven' }
  ];

  const PLACE_WORDS = [
    { term: 'ones', meaning: 'Each one is worth 1.', block: 3, blockWord: 'unit' },
    { term: 'tens', meaning: 'Each ten is worth 10. 10 ones = 1 ten.', block: 2, blockWord: 'rod' },
    { term: 'hundreds', meaning: 'Each hundred is worth 100. 10 tens = 1 hundred.', block: 1, blockWord: 'flat' },
    { term: 'thousands', meaning: 'Each thousand is worth 1,000. 10 hundreds = 1 thousand.', block: 0, blockWord: 'cube' }
  ];

  const BLOCK_WORDS = ['cube', 'flat', 'rod', 'unit']; // by place index

  // ---------- Tests (new numbers every attempt) ----------

  /**
   * Vocabulary items with new numbers for each seed. Practice rounds keep the hints;
   * the Vocabulary Test removes them (see vocabTest).
   */
  function vocabItems(seed, idPrefix) {
    const r = pv.rng(seed);
    const [defTerm, matchTerm] = pv.shuffle(r, VOCAB);
    const others = (v) => pv.shuffle(r, VOCAB.filter((x) => x !== v)).slice(0, 3).concat(v);
    const formN = pv.randomFourDigit(r, { zeros: 'maybe' });
    const form = pv.pick(r, ['standard form', 'expanded form', 'word form']);
    const blockI = pv.randInt(r, 0, 3);
    const pictureI = pv.randInt(r, 0, 3);
    const tenI = pv.randInt(r, 1, 3); // ones→ten, tens→hundred, hundreds→thousand
    const clozeN = pv.randomFourDigit(r, { distinct: true });
    const clozeI = pv.randInt(r, 0, 3);
    const leftI = pv.randInt(r, 1, 3);
    const countN = pv.randomFourDigit(r, { zeros: 'maybe' });

    const items = [
      mc({
        skill: 'vocab-words', prompt: `What does "${defTerm.term}" mean?`, answer: defTerm.meaning,
        choices: pv.shuffle(r, others(defTerm).map((v) => v.meaning)),
        hint: `Here is an example of ${defTerm.term}: ${defTerm.example}`,
        explanation: `${defTerm.term}: ${defTerm.meaning}. Example: ${defTerm.example}`
      }),
      mc({
        skill: 'vocab-words', prompt: 'Which word matches this meaning?', display: matchTerm.meaning, answer: matchTerm.term,
        choices: pv.shuffle(r, others(matchTerm).map((v) => v.term)),
        hint: `It is the word whose example looks like this: ${matchTerm.example}`,
        explanation: `${matchTerm.meaning} is called ${matchTerm.term}. Example: ${matchTerm.example}`
      }),
      mc({
        skill: 'vocab-forms', prompt: 'Which form is this number written in?', answer: form,
        display: form === 'standard form' ? fmt(formN) : form === 'expanded form' ? expandedForm(formN) : numberToWords(formN),
        choices: ['standard form', 'expanded form', 'word form'],
        hint: 'Is it written with only digits, with plus signs, or with words?',
        explanation: 'Standard form uses digits (like 2,137). Expanded form adds the values of the digits. Word form uses words.'
      }),
      mc({
        skill: 'vocab-blocks', prompt: `Which base-ten block shows ${fmt(PLACES[blockI].value)}?`, answer: BLOCK_WORDS[blockI],
        choices: ['unit', 'rod', 'flat', 'cube'],
        hint: 'From smallest to biggest: unit, rod, flat, cube. Each one is 10 of the one before.',
        explanation: 'unit = 1, rod = 10, flat = 100, cube = 1,000.'
      }),
      mc({
        skill: 'vocab-blocks', prompt: 'What is this base-ten block worth?', block: pictureI, answer: fmt(PLACES[pictureI].value),
        choices: ['1', '10', '100', '1,000'],
        hint: 'A rod is 10 units in a row. A flat is 10 rods side by side. A cube is 10 flats stacked up.',
        explanation: `This is a ${BLOCK_WORDS[pictureI]}. A ${BLOCK_WORDS[pictureI]} is worth ${fmt(PLACES[pictureI].value)}.`
      }),
      {
        type: 'number', skill: 'vocab-blocks', answer: 10,
        prompt: `How many ${PLACES[tenI].key} make 1 ${PLACES[tenI - 1].one}?`,
        hint: 'Think of the blocks: how many units make a rod? How many rods make a flat?',
        explanation: `10 ${PLACES[tenI].key} = 1 ${PLACES[tenI - 1].one}. Each place is worth 10 times the place to its right.`
      },
      {
        type: 'select', skill: 'vocab-places', answer: PLACES[clozeI].key, choices: PLACE_CHOICES,
        prompt: `In ${fmt(clozeN)}, the ${digitsOf(clozeN)[clozeI]} is in the ___ place.`,
        hint: 'Start at the right and name the places: ones, tens, hundreds, thousands.',
        explanation: `From the right: ones, tens, hundreds, thousands. The ${digitsOf(clozeN)[clozeI]} is in the ${PLACES[clozeI].key} place.`
      },
      mc({
        skill: 'vocab-places', prompt: `Which place is just to the left of the ${PLACES[leftI].key} place?`, answer: PLACES[leftI - 1].key,
        choices: PLACE_CHOICES,
        hint: 'Read the place-value chart from left to right.',
        explanation: 'Left to right the places are thousands, hundreds, tens, ones.'
      }),
      {
        type: 'select', skill: 'vocab-words', answer: 'value', choices: pv.shuffle(r, ['value', 'color', 'size', 'shape']),
        prompt: 'The ___ of a digit depends on its place in the number.',
        hint: 'The 3 in 2,137 is worth 30, but the 3 in 3,127 is worth 3,000. What changed?',
        explanation: 'Place value: a digit\'s value depends on its place. The 3 in 2,137 is worth 30; the 3 in 3,127 is worth 3,000.'
      },
      {
        type: 'number', skill: 'vocab-words', answer: 4,
        prompt: `How many digits are in the number ${fmt(countN)}?`,
        hint: 'Point to each digit and count. The comma is not a digit.',
        explanation: `${fmt(countN)} is written with 4 digits: ${digitsOf(countN).join(', ')}. The comma is not a digit.`
      }
    ];
    return pv.shuffle(r, items).map((q, i) => Object.assign(q, { id: `${idPrefix}${i + 1}` }));
  }

  function vocabTest(seed) {
    // Tests never show hints.
    return vocabItems(seed, 'v').map((q) => Object.assign(q, { hint: undefined }));
  }

  function vocabPractice(seed) {
    return vocabItems(seed, 'vp');
  }

  function changeItem(r) {
    for (;;) {
      const n = pv.randomFourDigit(r);
      const i = pv.randInt(r, 0, 2);
      const up = r() < 0.6;
      const d = digitsOf(n)[i];
      // No regrouping, and the answer stays a four-digit number.
      if (up ? d <= 8 : d >= (i === 0 ? 2 : 1)) return make.change(n, (up ? 1 : -1) * PLACES[i].value);
    }
  }

  function mathTest(seed) {
    const r = pv.rng(seed);
    const n4 = (o) => pv.randomFourDigit(r, o);
    const items = [
      make.value(n4({ distinct: true }), pv.randInt(r, 0, 3)),
      make.placeName(n4({ distinct: true }), pv.randInt(r, 0, 3)),
      make.model(n4({ zeros: 'maybe' })),
      make.build(n4({ zeros: 'maybe' })),
      make.expanded(n4({ zeros: 'maybe' })),
      make.standardFromExpanded(n4({ zeros: 'maybe' })),
      make.standardToWord(n4({ zeros: 'maybe' }), r),
      make.wordToStandard(n4({ zeros: 'one' })),
      make.chart(n4({ zeros: 'maybe' }), pv.pick(r, ['expanded', 'word'])),
      changeItem(r)
    ];
    // Tests never show hints.
    return pv.shuffle(r, items).map((q, i) => Object.assign(q, { id: `m${i + 1}`, hint: undefined }));
  }

  // ---------- Practice bank: 50 fixed, original questions ----------

  const seeded = (n) => pv.rng(n);
  const bank = [
    // Value of a digit
    make.value(8341, 0), make.value(2659, 1), make.value(7315, 2), make.value(4821, 1),
    make.value(9064, 0), make.value(5482, 3), make.value(3790, 1),
    // Places and the place-value chart
    make.placeName(6247, 1), make.placeName(1938, 3), make.placeName(4152, 2), make.placeName(7604, 0),
    make.digitIn(9418, 2), make.digitIn(2375, 1), make.digitIn(8026, 0), make.digitIn(5610, 3),
    mc({
      skill: 'place', prompt: 'Why does 5,012 have no hundreds?', answer: 'Its hundreds digit is 0.',
      choices: ['It has only four digits.', 'The 5 is in the hundreds place.', 'Its hundreds digit is 0.', 'It is less than 100.'],
      hint: 'Find the hundreds place in 5,012. What digit is there?',
      explanation: '5,012 has 5 thousands, 0 hundreds, 1 ten, and 2 ones. The 0 shows there are no hundreds.'
    }),
    make.chart(2814, 'standard'), make.chart(6070, 'expanded'), make.chart(8913, 'word'),
    // Expanded form
    make.expanded(4207), make.expanded(6104), make.expanded(5072), make.expanded(3406), make.expanded(8530),
    // Standard form
    make.standardFromExpanded(3562), make.standardFromExpanded(6329), make.standardFromExpanded(4081),
    make.standardFromExpanded(9705), make.standardFromExpanded(5231, [30, 5000, 200, 1]),
    // Word form
    make.wordToStandard(7035), make.wordToStandard(2508), make.wordToStandard(9460),
    make.standardToWord(4628, seeded(4628)), make.standardToWord(6019, seeded(6019)),
    make.standardToWord(3300, seeded(3300)), make.standardToWord(8147, seeded(8147)),
    make.words(3516), make.words(4090),
    // Base-ten models
    make.model(2137), make.model(3051), make.model(1406), make.model(4220),
    make.build(2305), make.build(1062),
    // 10, 100, 1,000 more or less
    make.change(2349, 100), make.change(4516, 10), make.change(3782, 1000), make.change(6458, -100),
    // Making numbers from digits
    make.compose([2, 8, 4, 1], 'smallest'), make.compose([3, 9, 5, 7], 'greatest')
  ].map((q, i) => Object.assign(q, { id: 'b' + String(i + 1).padStart(2, '0') }));

  // ---------- The bank as five sets of 10, in teaching order (ids above never change) ----------
  // Every bank question is in exactly one set (checked by tests/math.test.js).
  const bankSets = [
    { id: 's1', title: 'Place and Digit Value', blurb: 'Name the place of a digit and tell how much it is worth.',
      ids: ['b01', 'b02', 'b03', 'b04', 'b05', 'b06', 'b07', 'b08', 'b09', 'b10'] },
    { id: 's2', title: 'Base-Ten Models', blurb: 'Read and build numbers with base-ten blocks and place-value charts, including zeros.',
      ids: ['b39', 'b40', 'b41', 'b42', 'b43', 'b44', 'b17', 'b18', 'b19', 'b16'] },
    { id: 's3', title: 'Standard Form', blurb: 'Write numbers with digits from expanded form and word form.',
      ids: ['b25', 'b26', 'b27', 'b28', 'b29', 'b30', 'b31', 'b32', 'b12', 'b13'] },
    { id: 's4', title: 'Expanded and Word Form', blurb: 'Write numbers as the sum of their digit values and in words.',
      ids: ['b20', 'b21', 'b22', 'b23', 'b24', 'b33', 'b34', 'b35', 'b36', 'b37'] },
    { id: 's5', title: 'Mixed Review and Reasoning', blurb: '10, 100, or 1,000 more or less, greatest and smallest numbers, and mixed place-value questions.',
      ids: ['b45', 'b46', 'b47', 'b48', 'b49', 'b50', 'b11', 'b14', 'b15', 'b38'] }
  ];

  // ---------- Guided practice (parent and student together) ----------

  // One guided problem for every objective that is assessed.
  const guided = [
    Object.assign(make.chart(3406, 'standard'), {
      id: 'g1',
      parent: 'Have your student say each digit\'s value aloud as they fill the chart: "3,000 … 400 … 0 tens … 6."',
      hint: 'Start at the left: the 3 is in the thousands place. Which place has the 0?'
    }),
    Object.assign(make.build(3052), {
      id: 'g2',
      parent: 'Ask: "How many hundred flats do we need?" (None — the hundreds digit is 0.)'
    }),
    Object.assign(make.expanded(5072), {
      id: 'g3',
      parent: 'Ask: "What digit is in the hundreds place?" (0) "So do we need a hundreds part?" (No.)',
      hint: 'The hundreds digit is zero, so there are no hundreds to write.'
    }),
    Object.assign(make.standardFromExpanded(6329), {
      id: 'g4',
      parent: 'Point to each value and ask: "Which place does this belong to?"'
    }),
    Object.assign(make.words(2508), {
      id: 'g5',
      parent: 'Have your student say the number aloud first. Check the comma after "thousand."'
    }),
    {
      id: 'g6', type: 'explain', skill: 'value',
      prompt: 'Explain: why is the 7 in 4,719 worth 700?',
      parent: 'Let your student explain out loud. Do not give the words first.',
      listenFor: ['"The 7 is in the hundreds place."', '"7 hundreds is 700."'],
      explanation: '4,719 has 4 thousands, 7 hundreds, 1 ten, and 9 ones. The 7 is in the hundreds place, and 7 hundreds = 700.'
    },
    Object.assign(make.change(7284, -10), {
      id: 'g7',
      parent: 'Ask: "Which place is worth 10?" (tens) "So which digit changes?" (Only the tens digit.)'
    })
  ];

  MB.lessons = MB.lessons || {};
  MB.lessons['2-1'] = {
    id: '2-1',
    storageKey: 'mathbook:v2:lesson-2-1',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-1',
    title: 'Represent 4-Digit Numbers',
    subtitle: 'Thousands, hundreds, tens, and ones',
    objective: 'I can show a 4-digit number with base-ten blocks and a place-value chart, and write it in standard, expanded, and word form.',
    targets: [
      'Name the place of each digit: thousands, hundreds, tens, ones.',
      'Tell the value of any digit.',
      'Build numbers with base-ten blocks.',
      'Write numbers in standard, expanded, and word form.',
      'Find 10, 100, or 1,000 more or less than a number.'
    ],
    intro: [
      'Numbers are made of digits. Where a digit sits — its place — tells how much it is worth.',
      'In 2,137 the 2 is not just 2. It is in the thousands place, so it means 2 thousands: 2,000.'
    ],
    introNumber: 2137,
    // Second big idea (taught in Teach It, shown in See It, guided in g7, assessed on the Math Test).
    changeIdea: {
      text: 'Adding or taking away 10, 100, or 1,000 changes only one digit — the digit in that place.',
      examples: ['4,125 + 100 = 4,225 (the hundreds digit 1 becomes 2)', '4,125 − 10 = 4,115 (the tens digit 2 becomes 1)']
    },
    vocabulary: VOCAB,
    placeWords: PLACE_WORDS,
    parentGuide: [
      { q: 'What am I teaching?', a: [
        'Each digit in a 4-digit number has a place: thousands, hundreds, tens, or ones.',
        'The place tells how much the digit is worth.',
        'Three ways to write a number: standard, expanded, and word form.',
        'Adding 10, 100, or 1,000 changes just one digit.'] },
      { q: 'What does it mean?', a: [
        'In 2,137 the 2 means 2 thousands (2,000), not 2.',
        'Expanded form shows each digit\'s value: 2,000 + 100 + 30 + 7.',
        'A 0 holds a place: 5,072 has no hundreds.'] },
      { q: 'Why does it work?', a: [
        'We count in groups of ten: 10 ones = 1 ten, 10 tens = 1 hundred, 10 hundreds = 1 thousand.',
        'Each place is worth 10 times the place to its right.',
        'So the farther left a digit is, the more it is worth.'] },
      { q: 'How do I demonstrate it?', a: [
        'Open See It and step through 2,137 one place at a time.',
        'Point to each group of blocks. Say its count and its value.',
        'Build the expanded form as you go, then read the word form aloud.',
        'Use "Change one place" in See It: press +100 and watch only the hundreds digit change.'] },
      { q: 'What questions should I ask?', a: [
        '"What is the 3 worth? How do you know?"',
        '"If the 1 became a 5, what number would it be?" (2,537)',
        '"Why do we write the 0 in 5,072?"',
        '"Which is more: 3 hundreds or 3 tens?"',
        '"What is 100 more than 4,125? Which digit changed?" (4,225; the hundreds digit)'] },
      { q: 'How do I know they understand?', a: [
        'They name the place and value of any digit.',
        'They write 5,072 correctly, keeping the 0.',
        'They explain: "The 7 is worth 700 because it is in the hundreds place."',
        'They score 90% or higher on the Math Test.'] }
    ],
    script: [
      { show: 'Write 2,137.', say: '"This number has four digits. Each digit has a place."', ask: '"Can you read it aloud?"', listen: 'two thousand, one hundred thirty-seven' },
      { show: 'Point to 7, 3, 1, 2 — from right to left.', say: '"Ones, tens, hundreds, thousands."', ask: '"Which place is the 3 in?"', listen: 'the tens place' },
      { show: 'Step through 2,137 on See It.', say: '"3 tens means 3 rods of ten. That is 30."', ask: '"What is the 1 worth?"', listen: '100' },
      { show: 'Write 2,000 + 100 + 30 + 7.', say: '"This is expanded form: each digit\'s value, added together."', ask: '"Does it add back to 2,137?"', listen: 'yes' },
      { show: 'Write 5,072.', say: '"The 0 means no hundreds. It keeps the 5 in the thousands place."', ask: '"What number would 572 be?"', listen: 'five hundred seventy-two, a different number' },
      { show: 'Write 4,125, then 4,225 under it.', say: '"100 more changes only the hundreds digit: 1 becomes 2."', ask: '"What is 10 more than 4,125?"', listen: '4,135' }
    ],
    mistakes: [
      'Dropping the zero: reading 5,072 as "five hundred seventy-two."',
      'Saying a digit\'s face value: "the 3 in 2,137 is worth 3."',
      'Combining places: writing 2,000 + 100 + 37.',
      'Changing the wrong digit: saying 100 more than 4,125 is 4,135.'
    ],
    seeIt: {
      examples: [2137, 4628, 5072],
      builderStart: 2137,
      changeStart: 4125,
      // Worked example for "making numbers from digits" (different digits from the practice bank).
      composeDigits: [4, 1, 8, 6]
    },
    skills: {
      value: 'Value of a digit',
      place: 'Places and the place-value chart',
      standard: 'Standard form',
      expanded: 'Expanded form',
      word: 'Word form',
      model: 'Base-ten block models',
      change: '10, 100, or 1,000 more or less',
      compose: 'Making numbers from digits',
      'vocab-words': 'Vocabulary: math words',
      'vocab-forms': 'Vocabulary: forms of a number',
      'vocab-blocks': 'Vocabulary: base-ten blocks',
      'vocab-places': 'Vocabulary: place names'
    },
    guided,
    bank,
    bankSets,
    vocabPractice,
    tests: {
      vocab: { id: 'vocab', title: 'Vocabulary Test', blurb: 'Math words, number forms, base-ten blocks, and place names.', generate: vocabTest },
      math: { id: 'math', title: 'Math Test', blurb: 'Digit values, models, charts, and standard, expanded, and word form.', generate: mathTest }
    },
    _make: make,
    _wordDistractors: wordDistractors
  };
})(typeof window !== 'undefined' ? window : globalThis);
