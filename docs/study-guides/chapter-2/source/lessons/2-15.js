const col = (top, bottom) => ({ half: true, text: 'Use an algorithm to subtract.', blocks: [{ stack: { rows: [top, '−' + bottom], result: '', size: 30, cellW: 380 } }, { space: 0.25 }] });

module.exports = {
  id: '2-15',
  title: 'Use an Algorithm to Subtract',
  pages: '91–94',
  bookNote: 'The book subtracts 8,386 − 7,185 one place at a time. Every problem in this lesson needs no regrouping.',
  goal: 'I can subtract multi-digit numbers with an algorithm by lining up the places and subtracting from the ones to the left, and check with addition.',
  vocab: [
    ['difference', 'The answer when you subtract.'],
    ['algorithm', 'Step-by-step column subtracting: start with the ones and move left.'],
    ['vertical', 'Written in columns, one number under the other.'],
    ['line up', 'Put ones under ones, tens under tens, and so on.'],
    ['increase', 'How much a number grew. Find it by subtracting.'],
  ],
  teach: [
    'Write the numbers vertically. Line up the **ones** first, even if one number is shorter.',
    'Subtract the ones, then the tens, then the hundreds, then the thousands (top digit minus bottom digit).',
    'If a place comes out 0, write the 0 so the other digits stay in their places (4,020).',
    'If the bottom number has no digit in a place, write the top digit down (6,957 − 615: the 6 thousands stay).',
    'Check: difference + the number you took away = the number you started with.',
  ],
  tip: 'This lesson has no regrouping (every top digit is at least as big as the bottom digit). Subtraction with regrouping is practiced with the strategies in Lessons 2-7, 2-8, and 2-11; regrouping in the algorithm comes later, so there is no need to teach borrowing here.',
  examples: [
    {
      title: 'Example 1: Subtract place by place',
      body: [{ row: [[{ stack: { rows: ['9,486', '−6,253'], result: '3,233', size: 22, cellW: 230, indent: 0 } }], ['Ones: 6 − 3 = 3', 'Tens: 8 − 5 = 3', 'Hundreds: 4 − 2 = 2', 'Thousands: 9 − 6 = 3']], weights: [0.4, 0.6] }],
    },
    {
      title: 'Example 2: Line up the ones',
      body: [{ row: [[{ stack: { rows: ['5,867', '−742'], result: '5,125', size: 22, cellW: 230, indent: 0 } }], ['742 has no thousands, so write the 5 thousands down.', 'Do not line up on the left!']], weights: [0.4, 0.6] }],
    },
    { title: 'Example 3: Zeros and checking', body: ['6,438 − 2,418 = **4,020** (8 − 8 = 0 ones; 3 − 1 = 2 tens; 4 − 4 = 0 hundreds; 6 − 2 = 4 thousands).', 'Check: 4,020 + 2,418 = 6,438 ✓'] },
    {
      title: 'Example 4: Missing digits',
      body: [{ row: [[{ stack: { rows: ['3,8□6', '−1,□4□'], result: '□,513', size: 22, cellW: 230, indent: 0 } }], ['Ones: 6 − **3** = 3. Tens: **5** − 4 = 1.', 'Hundreds: 8 − **3** = 5. Thousands: 3 − 1 = **2**.', '3,856 − 1,343 = 2,513']], weights: [0.4, 0.6] }],
    },
  ],
  checklist: [
    'Line up numbers by place, starting with the ones.',
    'Subtract from right to left and write any 0s.',
    'Subtract 3-, 4-, and 5-digit numbers.',
    'Check a difference with addition.',
    'Find missing digits in a subtraction problem.',
    'Solve “how many left,” “other part,” and “which grew more” problems.',
  ],

  together: [
    { text: 'Line up the ones. Then use an algorithm to subtract **9,365 − 142**.', blocks: [{ space: 1.3 }, { lines: ['Difference'] }] },
    { text: 'A school play sold 7,968 tickets for two shows. It sold 4,725 tickets for the first show. How many tickets did it sell for the second show? Use an algorithm.', blocks: [{ space: 0.9 }, { lines: ['Tickets'] }] },
    { text: 'Find **5,439 − 2,108**. Then check your answer with addition.', blocks: [{ space: 0.7 }, { lines: ['Difference', 'Check'] }] },
  ],
  own: [
    col('957', '314'),
    col('685', '263'),
    col('4,879', '456'),
    col('6,857', '3,807'),
    col('7,596', '4,284'),
    col('47,596', '3,284'),
    { half: true, text: 'A family is driving 3,785 miles. They have driven 562 miles. How many miles do they have left to drive?', blocks: [{ space: 1.0 }, { lines: ['Miles'] }] },
    { half: true, text: 'A club spent $5,896 on a trip and food. The trip cost $2,473. How much did the club spend on food?', blocks: [{ space: 1.0 }, { lines: ['Food'] }] },
    { text: 'Fill in the missing digits. Explain how you found each one.', blocks: [{ row: [[{ stack: { rows: ['6,□47', '−3,5□□'], result: '□,435', size: 32, cellW: 420, indent: 0 } }], [{ lines: ['', '', ''] }]], weights: [0.42, 0.58] }] },
    {
      text: 'A school fundraiser raised this much money each year. Was the increase greater from Year 1 to Year 2, or from Year 2 to Year 3? Explain.',
      blocks: [{ table: { head: ['Year 1', 'Year 2', 'Year 3'], rows: [['$1,423', '$3,645', '$5,856']], width: 4600, size: 24 } }, { space: 0.8 }, { lines: [''] }],
    },
  ],
  answers: {
    together: [
      { a: ['**9,223**'], note: 'Line up 142 under 365: 5 − 2 = 3, 6 − 4 = 2, 3 − 1 = 2, then write the 9.' },
      { a: ['7,968 − 4,725 = **3,243** tickets'] },
      { a: ['**3,331**. Check: 3,331 + 2,108 = 5,439 ✓'] },
    ],
    own: [
      { a: ['**643**'] },
      { a: ['**422**'] },
      { a: ['**4,423**'], note: 'Watch the lining up: 456 goes under 879.' },
      { a: ['**3,050**'], note: 'Write the zeros: ones 7 − 7 = 0; tens 5 − 0 = 5; hundreds 8 − 8 = 0; thousands 6 − 3 = 3.' },
      { a: ['**3,312**'] },
      { a: ['**44,312**'], note: 'The 4 ten-thousands come straight down.' },
      { a: ['3,785 − 562 = **3,223** miles'] },
      { a: ['$5,896 − $2,473 = **$3,423**'] },
      { a: ['6,**9**47 − 3,5**12** = **3**,435'], note: 'Ones: 7 − 2 = 5. Tens: 4 − 1 = 3. Hundreds: 9 − 5 = 4. Thousands: 6 − 3 = 3. Check: 3,435 + 3,512 = 6,947.' },
      { a: ['Year 1 to Year 2: 3,645 − 1,423 = 2,222. Year 2 to Year 3: 5,856 − 3,645 = 2,211. **Year 1 to Year 2** had the greater increase.'], note: '2,222 > 2,211 (compare the tens: 2 > 1).' },
    ],
  },
};
