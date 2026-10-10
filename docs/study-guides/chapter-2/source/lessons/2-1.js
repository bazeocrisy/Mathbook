const { baseTen } = require('../diagrams');

const PV = { chart: null }; // blank place-value chart

module.exports = {
  id: '2-1',
  title: 'Represent 4-Digit Numbers',
  pages: '33–36',
  bookNote: 'The book models 2,138 with base-ten blocks, a place-value chart, and three written forms.',
  goal: 'I can show a 4-digit number with base-ten blocks and a place-value chart, and write it in standard form, expanded form, and word form.',
  vocab: [
    ['digit', 'One of the symbols 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 that we use to write numbers.'],
    ['place value', 'The value a digit has because of its place. In 2,138 the 2 means 2 thousands, or 2,000.'],
    ['base-ten blocks', 'A **cube** is 1,000. A **flat** is 100. A **rod** is 10. A **unit** is 1.'],
    ['standard form', 'The usual way to write a number with digits: **2,138**.'],
    ['expanded form', 'The number written as the value of each digit added together: **2,000 + 100 + 30 + 8**.'],
    ['word form', 'The number written in words: **two thousand, one hundred thirty-eight**.'],
  ],
  teach: [
    'Build or draw the number. Count the cubes, flats, rods, and units.',
    'Write each count in a place-value chart: thousands, hundreds, tens, ones. If a place has none, write **0** there.',
    'Read the chart from left to right to write **standard form**. Put a comma after the thousands digit.',
    'For **expanded form**, write the value of each digit and join them with + signs. Skip places that have a 0 (6,000 + 400 + 9).',
    'For **word form**, say the thousands, then the word “thousand,” then read the rest like a 3-digit number. Use a hyphen for numbers like forty-one.',
  ],
  tip: 'Ask, “What is this digit worth?” A 0 holds a place. In 3,206 the 0 shows there are no tens.',
  examples: [
    {
      title: 'Example 1: Blocks to chart and standard form',
      full: true,
      body: [
        { weights: [0.6, 0.4], row: [
          [{ diagram: baseTen({ th: 3, h: 2, o: 6 }, { labels: true }), width: 4.6 }],
          [{ chart: ['3', '2', '0', '6'], colW: 980, rowH: 380 }, 'No rods, so write **0** in the tens place.', 'Standard form: **3,206**', 'Expanded form: **3,000 + 200 + 6**'],
        ] },
      ],
    },
    {
      title: 'Example 2: Standard form to expanded and word form',
      body: [
        '**4,152** → the digits are worth 4,000, 100, 50, and 2.',
        'Expanded form: **4,000 + 100 + 50 + 2**',
        'Word form: **four thousand, one hundred fifty-two**',
      ],
    },
    {
      title: 'Example 3: Word or expanded form to standard form',
      body: [
        '“five thousand, seventy-three”',
        '5 thousands, 0 hundreds, 7 tens, 3 ones → **5,073**',
        'Expanded form: **5,000 + 70 + 3**',
        '6,000 + 400 + 9 → 6 thousands, 4 hundreds, 0 tens, 9 ones → **6,409**',
      ],
    },
  ],
  checklist: [
    'Tell what a cube, flat, rod, and unit are worth.',
    'Write the number shown by base-ten blocks.',
    'Fill in a place-value chart, using 0 for an empty place.',
    'Write a number in expanded form.',
    'Read and write a number in word form.',
    'Use place value to explain how two numbers are different.',
  ],

  together: [
    {
      text: 'What number do the base-ten blocks show? Fill in the chart. Then write the number in standard form.',
      blocks: [{ diagram: baseTen({ th: 2, h: 4, t: 3, o: 5 }), width: 5.4 }, PV, { lines: ['Standard form'] }],
    },
    {
      text: 'Write **3,081** in expanded form and in word form.',
      blocks: [{ lines: ['Expanded form', 'Word form', ''] }],
    },
    {
      text: 'Write **four thousand, six hundred nine** in standard form and in expanded form.',
      blocks: [{ lines: ['Standard form', 'Expanded form'] }],
    },
  ],
  own: [
    {
      text: 'What number do the base-ten blocks show? Fill in the chart.',
      blocks: [{ diagram: baseTen({ th: 1, h: 3, o: 7 }), width: 3.6 }, PV, { lines: ['Standard form'] }],
    },
    {
      text: 'Show **5,264** in the place-value chart and in expanded form.',
      blocks: [PV, { lines: ['Expanded form'] }],
    },
    {
      text: 'Write **eight thousand, fifty-six** in standard form and in expanded form.',
      blocks: [{ lines: ['Standard form', 'Expanded form'] }],
    },
    {
      half: true,
      text: 'Write the number in standard form.',
      blocks: ['**7,000 + 300 + 8**', { lines: [''] }],
    },
    {
      half: true,
      text: 'Write the number in standard form.',
      blocks: ['**9,000 + 60 + 4**', { lines: [''] }],
    },
    {
      text: 'Write the number shown in standard form and in expanded form.',
      blocks: [{ diagram: baseTen({ th: 2, h: 6, t: 4, o: 1 }), width: 6.0 }, { lines: ['Standard form', 'Expanded form'] }],
    },
    {
      text: 'A library had **2,374** books in May. In June it had **2,474** books. Which digit changed? Use place value to tell how many more books the library had in June.',
      blocks: [{ lines: ['', '', ''] }],
    },
    {
      text: 'Use all four digits **6, 4, 9, 4** to write the 4-digit number with the **least** value. Write it in standard form, expanded form, and word form.',
      blocks: [{ lines: ['Standard form', 'Expanded form', 'Word form', ''] }],
    },
  ],
  answers: {
    together: [
      { a: ['Chart: 2 | 4 | 3 | 5.  Standard form: **2,435**'], note: '2 cubes = 2,000; 4 flats = 400; 3 rods = 30; 5 units = 5.' },
      { a: ['Expanded form: **3,000 + 80 + 1**', 'Word form: **three thousand, eighty-one**'], note: 'There are 0 hundreds, so no hundreds part is written. Also accept 3,000 + 0 + 80 + 1.' },
      { a: ['Standard form: **4,609**', 'Expanded form: **4,000 + 600 + 9**'], note: 'There are 0 tens, so write 0 in the tens place. Also accept 4,000 + 600 + 0 + 9.' },
    ],
    own: [
      { a: ['Chart: 1 | 3 | 0 | 7.  Standard form: **1,307**'], note: 'No rods, so the tens digit is 0. If your child writes 137, point to the empty tens place.' },
      { a: ['Chart: 5 | 2 | 6 | 4', 'Expanded form: **5,000 + 200 + 60 + 4**'] },
      { a: ['Standard form: **8,056**', 'Expanded form: **8,000 + 50 + 6**'], note: '0 hundreds. Also accept 8,000 + 0 + 50 + 6.' },
      { a: ['**7,308**'], note: 'No tens, so the tens digit is 0.' },
      { a: ['**9,064**'], note: 'No hundreds, so the hundreds digit is 0.' },
      { a: ['Standard form: **2,641**', 'Expanded form: **2,000 + 600 + 40 + 1**'] },
      { a: ['The **hundreds** digit changed from 3 to 4. That is 1 more hundred, so the library had **100 more books** in June.'], note: 'Accept any clear place-value explanation, e.g., “The thousands, tens, and ones are the same. Only the hundreds went up by one, so it is 100 more.”' },
      { a: ['Standard form: **4,469**', 'Expanded form: **4,000 + 400 + 60 + 9**', 'Word form: **four thousand, four hundred sixty-nine**'], note: 'Put the smallest digits in the biggest places: 4, 4, 6, 9.' },
    ],
  },
};
