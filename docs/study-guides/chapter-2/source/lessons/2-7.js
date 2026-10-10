const { tree } = require('../diagrams');

const T = (n, parts, width = 1.9) => ({ diagram: tree(parts ? { n, parts } : { n }), width });
const steps = (n = 3) => ({ lines: Array(n).fill(''), gap: 260 });
const sub = (expr) => ({ half: true, text: 'Find the difference. Show the strategy you used.', blocks: [{ p: expr, size: 28 }, { space: 1.25 }, { lines: ['Difference'] }] });

module.exports = {
  id: '2-7',
  title: 'Decompose to Subtract',
  pages: '59–62',
  bookNote: 'The book subtracts 353 − 184 by breaking 184 apart in two different ways.',
  goal: 'I can break apart the number I am subtracting and take away the parts one at a time to find the difference.',
  vocab: [
    ['decompose', 'Break a number into parts. 184 can be 100 + 80 + 4 or 153 + 30 + 1.'],
    ['part', 'One of the smaller numbers that add up to the whole number.'],
    ['difference', 'The answer when you subtract.'],
    ['decomposition tree', 'A picture with the number on top and its parts below.'],
    ['friendly number', 'A number that is easy to work with, like 200 or 170.'],
  ],
  teach: [
    'Keep the first number whole. Break apart only the number you are **taking away**.',
    '**By place value:** break it into hundreds, tens, and ones. Take away the hundreds, then the tens, then the ones. Each step starts from the last answer.',
    '**Another way:** choose a first part that lands you on a friendly number. For 362 − 175, take away 162 first to land on 200.',
    'Check the tree: the parts must **add back** to the number you are taking away.',
    'The difference is the same for any correct tree, and the parts can be taken away in any order.',
  ],
  tip: 'Ask, “Do your parts add back to the number?” and “Can you land on a hundred?”',
  examples: [
    {
      title: 'Example 1: Decompose by place value',
      body: [{ row: [[T(175, [100, 70, 5], 1.6)], ['362 − 100 = 262', '262 − 70 = 192', '192 − 5 = 187', '362 − 175 = **187**']] }],
    },
    {
      title: 'Example 2: Decompose another way',
      body: [{ row: [[T(175, [162, 10, 3], 1.6)], ['362 − 162 = 200', '200 − 10 = 190', '190 − 3 = 187', 'Same difference: **187**']] }],
    },
    {
      title: 'Example 3: Check the parts',
      body: ['458 − 102: Sam breaks 102 into 100 and 20. But 100 + 20 = 120, not 102.', 'Use 100 and 2: 458 − 100 = 358, 358 − 2 = **356**.'],
    },
    {
      title: 'Example 4: Any order works',
      body: ['538 − 215 with parts 200, 10, 5.', 'Ones first: 533, 523, **323**.', 'Hundreds first: 338, 328, **323**.'],
    },
  ],
  checklist: [
    'Decompose a 3-digit number in two different ways.',
    'Subtract the parts by place value.',
    'Choose parts that land on a friendly number.',
    'Check that the parts add back to the number.',
    'Explain why the difference is the same either way.',
    'Solve word problems and table problems by subtracting.',
  ],

  together: [
    { text: 'Decompose **258** in two different ways.', blocks: [{ row: [[T(258)], [T(258)]] }] },
    {
      text: 'Subtract **462 − 235**. Break apart 235 by place value. Take away one part at a time.',
      blocks: [{ row: [[T(235, null, 1.8)], [steps(4)]], weights: [0.38, 0.62] }],
    },
    { text: 'How can you decompose 263 in two different ways to find **541 − 263**? Show both ways.', blocks: [{ row: [[{ space: 1.5 }], [{ space: 1.5 }]] }, { lines: ['Difference'] }] },
  ],
  own: [
    { text: 'Decompose **486** in two different ways.', blocks: [{ row: [[T(486)], [T(486)]] }] },
    { text: 'Decompose **735** in two different ways.', blocks: [{ row: [[T(735)], [T(735)]] }] },
    { half: true, text: 'Decompose one number to subtract. Why did you choose that way?', blocks: [{ p: '586 − 241', size: 28 }, { space: 1.2 }, { lines: ['Why'] }] },
    { half: true, text: 'Decompose one number to subtract. Why did you choose that way?', blocks: [{ p: '728 − 460', size: 28 }, { space: 1.2 }, { lines: ['Why'] }] },
    sub('______ = 603 − 285'),
    sub('831 − 547 = ______'),
    { text: 'Leo subtracts 576 − 103. He breaks 103 into 100 and 30. How can you help him understand his mistake? What is the correct difference?', blocks: [{ lines: ['', '', 'Difference'] }] },
    {
      text: 'The table shows how many books a class read each day. Find the difference between the **greatest** and **least** number of books.',
      blocks: [{ row: [[{ table: { head: ['Day', 'Books'], rows: [['Monday', '214'], ['Tuesday', '187'], ['Wednesday', '309'], ['Thursday', '256']], width: 3400, size: 24 } }], [{ space: 1.2 }, { lines: ['Difference'] }]] }],
    },
    { text: 'Mia has 357 stickers. 168 are star stickers. The rest are heart stickers. How many heart stickers does she have?', blocks: [{ space: 0.9 }, { lines: ['Heart stickers'] }] },
    { text: 'Ana subtracts 649 − 425. She takes away 5, then 400, then 20. Can she take away the parts in any order? Explain.', blocks: [{ lines: ['', ''] }] },
  ],
  answers: {
    together: [
      { a: ['Two different trees whose parts add to 258, e.g., **200, 50, 8** and **150, 100, 8**.'], note: 'Accept any 3 parts that add to 258, as long as the two trees use different parts (the same parts in a new order do not count).' },
      { a: ['Tree: 200, 30, 5. 462 − 200 = 262; 262 − 30 = 232; 232 − 5 = 227. Difference: **227**'] },
      { a: ['Way 1: 263 → 200, 60, 3: 541 − 200 = 341; 341 − 60 = 281; 281 − 3 = 278.', 'Way 2: 263 → 241, 22: 541 − 241 = 300; 300 − 22 = 278. Difference: **278**'], note: 'Accept any two correct trees that give 278.' },
    ],
    own: [
      { a: ['Sample: **400, 80, 6** and **386, 90, 10**'], note: 'Items 1–2: accept any two trees whose parts add to the number. Reordering the same parts is not a different way.' },
      { a: ['Sample: **700, 30, 5** and **635, 90, 10**'] },
      { a: ['Sample: 241 → 200, 40, 1: 386, 346, **345**.'], note: 'Reason: place-value parts are easy to take away because no regrouping is needed. Accept other correct trees with a sensible reason.' },
      { a: ['Sample: 460 → 428, 32: 728 − 428 = 300; 300 − 32 = **268**. Or 400, 60: 328, **268**.'], note: 'Reason: taking away 428 lands on 300, a friendly number. Accept any sensible reason.' },
      { a: ['**318**  (e.g., 603 − 200 = 403; 403 − 80 = 323; 323 − 5 = 318)'] },
      { a: ['**284**  (e.g., 831 − 500 = 331; 331 − 40 = 291; 291 − 7 = 284)'] },
      { a: ['100 + 30 = 130, not 103. The parts must add back to 103. Use 100 and 3: 576 − 100 = 476; 476 − 3 = **473**.'] },
      { a: ['Greatest 309 (Wed), least 187 (Tue). 309 − 187 = **122** books.'], note: 'Sample: 309 − 100 = 209; 209 − 80 = 129; 129 − 7 = 122. Watch for subtracting the first and last rows instead.' },
      { a: ['357 − 168 = **189** heart stickers'], note: 'Sample: 357 − 100 = 257; 257 − 60 = 197; 197 − 8 = 189.' },
      { a: ['**Yes.** 649 − 5 = 644; 644 − 400 = 244; 244 − 20 = 224. She still takes away 425 in all, so the difference, **224**, is the same in any order.'] },
    ],
  },
};
