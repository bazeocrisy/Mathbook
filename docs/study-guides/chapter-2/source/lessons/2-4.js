const { groupV } = require('../diagrams');

module.exports = {
  id: '2-4',
  title: 'Use Addition Properties to Add',
  pages: '47–50',
  bookNote: 'The book adds 27 + 53 + 40 by grouping and by changing the order.',
  goal: 'I can change the order of addends or group them in a different way to add more easily, and I know the sum stays the same.',
  vocab: [
    ['addend', 'A number you add. In 34 + 66, the addends are 34 and 66.'],
    ['sum', 'The answer when you add.'],
    ['equation', 'A number sentence with an equal sign. Both sides have the same value.'],
    ['order property', 'Switch the order of addends and the sum stays the same: 18 + 36 = 36 + 18. (Grown-up name: Commutative Property.)'],
    ['grouping property', 'Choose which addends to add first and the sum stays the same. (Grown-up name: Associative Property.)'],
    ['friendly pair', 'Two addends whose sum ends in 0 or 00, like 46 + 54 = 100.'],
  ],
  teach: [
    'Show that order does not matter: 4 + 3 and 3 + 4 are both 7. Then try bigger numbers: 245 + 132 = 132 + 245.',
    'For a fill-in equation like 245 + 132 = 132 + ___, look at both sides. The same addends must be there, so the blank is 245. No adding is needed.',
    'With three addends, look for a **friendly pair** (ones digits that make 10, or numbers that make a hundred). Draw a V from the two addends to their sum.',
    'Add the friendly pair first, then add the third number. If the pair is not next to each other, switch the order first.',
    'To check an expression, it must use the **same numbers** and **only addition**.',
  ],
  tip: 'Ask, “Which two numbers are easy to add together?” Ones digits that make 10 (7 + 3, 8 + 2) are a great clue.',
  examples: [
    {
      title: 'Example 1: Group a friendly pair',
      body: [{ diagram: groupV({ addends: [34, 66, 25], pair: 0 }), width: 1.8 }, '4 + 6 make a ten, so add 34 + 66 = 100 first. Sum: **125**.'],
    },
    {
      title: 'Example 2: Switch the order, then group',
      body: [
        { diagram: groupV({ addends: [18, 82, 45], pair: 0 }), width: 1.8 },
        '18 + 45 + 82 = 18 + 82 + 45. Group 18 + 82 = 100. Sum: **145**.',
      ],
    },
    {
      title: 'Example 3: Make the equation true',
      body: ['245 + 132 = 132 + ___', 'Both sides need the same addends. 132 is already there, so the blank is **245**.'],
    },
    {
      title: 'Example 4: Which expressions show the total?',
      body: ['Days: 58, 67, 42.', '**Yes:** 42 + 67 + 58 and 58 + 42 + 67 (same numbers, only +).', '**No:** 67 − 58 + 42 (subtracts) and 58 + 67 + 24 (24 is not 42).'],
    },
  ],
  checklist: [
    'Explain that the order of addends does not change the sum.',
    'Fill in an equation like 324 + 158 = 158 + ___ without adding.',
    'Find a friendly pair in three addends.',
    'Group addends to add more easily and find the sum.',
    'Choose all expressions that give the same total.',
    'Explain why a way of grouping is easier.',
  ],

  together: [
    { text: 'Make the equation true. Do you need to add?', blocks: [{ p: '436 + 251 = 251 + ________', size: 30 }, { space: 0.15 }] },
    {
      text: 'The table shows how many cans a class collected. Circle **all** the expressions that find the total.',
      blocks: [{ row: [
        [{ p: 'A.  36 + 64 + 49', size: 26 }, { p: 'B.  64 + 49 − 36', size: 26 }, { p: 'C.  49 + 36 + 64', size: 26 }, { p: 'D.  64 + 94 + 36', size: 26 }],
        [{ table: { head: ['Day', 'Cans'], rows: [['Saturday', '64'], ['Sunday', '49'], ['Monday', '36']], width: 3200, size: 24 } }],
      ] }],
    },
    { text: 'How can you group the addends to make it easier? Find the sum.', blocks: [{ p: '46 + 125 + 54', size: 30 }, { space: 0.7 }, { lines: ['Sum'] }] },
  ],
  own: [
    { half: true, text: 'Make the equation true.', blocks: [{ p: '347 + 286 = 286 + _______', size: 26 }] },
    { half: true, text: 'Make the equation true.', blocks: [{ p: '518 + _______ = 69 + 518', size: 26 }] },
    { half: true, text: 'Make the equation true.', blocks: [{ p: '624 + 153 = _______ + 624', size: 26 }] },
    { half: true, text: 'Make the equation true.', blocks: [{ p: '_______ + 87 = 87 + 702', size: 26 }] },
    { text: 'How can you group the addends to make it easier to find the sum? Explain your thinking.', blocks: [{ p: '263 + 418 + 137', size: 30 }, { space: 0.5 }, { lines: ['', 'Sum'] }] },
    { half: true, text: 'Show one way to group the addends and solve.', blocks: [{ p: '165 + 28 + 72', size: 28 }, { space: 0.9 }] },
    { half: true, text: 'Show one way to group the addends and solve.', blocks: [{ p: '396 + 204 + 172', size: 28 }, { space: 0.9 }] },
    { half: true, text: 'Show one way to group the addends and solve.', blocks: [{ p: '243 + 316 + 57', size: 28 }, { space: 0.9 }] },
    { half: true, text: 'Show one way to group the addends and solve.', blocks: [{ p: '125 + 314 + 175', size: 28 }, { space: 0.9 }] },
    { text: 'Sam buys a bike for $276, a helmet for $145, and a lock for $124. How can he group the prices to find the total cost? What is the total?', blocks: [{ space: 0.7 }, { lines: ['Total'] }] },
    { text: 'Jada says 58 + 39 + 42 is easier if she adds 58 + 42 first. Is she right? Explain, and find the sum.', blocks: [{ lines: ['', '', 'Sum'] }] },
  ],
  answers: {
    together: [
      { a: ['**436**'], note: 'No adding needed: both sides must have the same two addends (order property).' },
      { a: ['Circle **A** and **C**.'], note: 'B subtracts. D uses 94 instead of 49. The total is 149.' },
      { a: ['46 + 54 = 100, then 100 + 125 = **225**'], note: '6 + 4 make a ten, so 46 and 54 are a friendly pair.' },
    ],
    own: [
      { a: ['**347**'] },
      { a: ['**69**'] },
      { a: ['**153**'] },
      { a: ['**702**'] },
      { a: ['Group 263 + 137 = 400 first (3 + 7 make a ten). Then 400 + 418 = **818**.'], note: 'Accept any explanation that adds a friendly pair first.' },
      { a: ['28 + 72 = 100; 100 + 165 = **265**'] },
      { a: ['396 + 204 = 600; 600 + 172 = **772**'] },
      { a: ['243 + 57 = 300; 300 + 316 = **616**'] },
      { a: ['125 + 175 = 300; 300 + 314 = **614**'] },
      { a: ['Group $276 + $124 = $400 first. Then $400 + $145 = **$545**.'], note: 'Other groupings are acceptable if the total is $545.' },
      { a: ['**Yes.** 58 + 42 = 100 because 8 + 2 make a ten. Then 100 + 39 = **139**.'], note: 'She can add in any order or grouping and the sum stays the same.' },
    ],
  },
};
