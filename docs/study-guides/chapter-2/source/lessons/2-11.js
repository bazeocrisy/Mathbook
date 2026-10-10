const sub = (expr, explain) => ({ half: true, text: explain ? 'Solve. Explain your strategy.' : 'Solve. Use any strategy.', blocks: [{ p: expr, size: 28 }, { space: explain ? 0.7 : 0.95 }, ...(explain ? [{ lines: ['Strategy'] }] : [])] });

module.exports = {
  id: '2-11',
  title: 'Fluently Subtract within 1,000',
  pages: '75–78',
  bookNote: 'The book solves 543 − 134 three ways: decompose, adjust (+6 to both), and a related addition equation.',
  goal: 'I can subtract 3-digit numbers by decomposing, adjusting, or using a related addition equation, and choose a strategy that is efficient for me.',
  vocab: [
    ['difference', 'The answer when you subtract.'],
    ['decompose', 'Break the number you are taking away into parts, then take away one part at a time.'],
    ['adjust', 'Add the same amount to both numbers (or take the same amount from both). The difference stays the same.'],
    ['related addition', 'Write subtraction as addition with a missing part: 564 − 145 = ? → 145 + ? = 564.'],
    ['fewer', 'Less. “134 fewer than 543” means 543 − 134.'],
    ['extra information', 'A number in a story that you do not need.'],
  ],
  teach: [
    '**Decompose:** take away the hundreds, then the tens, then the ones. Split the ones to land on a ten if that helps (− 4 then − 1).',
    '**Adjust:** if the number you take away is close to a ten or hundred, add the same amount to **both** numbers (subtraction uses the same move on both).',
    '**Related addition:** count up from the smaller number to the larger one. Add the jumps.',
    'Any correct strategy is fine. Ask which one is fastest for these numbers.',
    'In stories, find the two numbers being compared. Cross out the extra one.',
  ],
  tip: 'Remember the rule: adding → opposite moves; subtracting → same moves. Ask, “If you change one number, what must you do to the other?”',
  examples: [
    { title: 'Example 1: Decompose one number', body: ['564 − 100 = 464', '464 − 40 = 424', '424 − 4 = 420', '420 − 1 = 419   So 564 − 145 = **419**.'] },
    { title: 'Example 2: Adjust both numbers', body: [{ arrows: { top: '564 − 145 = ?', bottom: '569 − 150 = 419', tags: ['+5', '', '+5', '', ''] } }, 'Both move up 5, so the difference stays the same.'] },
    { title: 'Example 3: Related addition equation', body: ['145 + ? = 564', 'Count up: 145 → 150 (+5) → 200 (+50) → 564 (+364).', '5 + 50 + 364 = **419**'] },
    { title: 'Example 4: Find the useful numbers', body: ['The library lent 482 books in March, 129 fewer in April, and 350 in May. How many in April?', 'May is extra. 482 − 129 → 483 − 130 = **353**.'] },
  ],
  checklist: [
    'Subtract by decomposing the number taken away.',
    'Adjust both numbers the same way.',
    'Use a related addition equation and count up.',
    'Choose an efficient strategy and explain it.',
    'Spot a strategy that does not work.',
    'Ignore extra information and solve two-step stories.',
  ],

  together: [
    { text: 'Find **652 − 118** two ways.', blocks: [{ row: [[{ p: '**Decompose 118**', size: 24 }, { space: 1.1 }], [{ p: '**Adjust both numbers**', size: 24 }, { space: 1.1 }]] }, { lines: ['Difference'] }] },
    {
      text: 'Nina and Theo solve 182 − 147. Nina writes 180 − 145 = ?. Theo writes 147 + ? = 182. Do both strategies work? Which would you choose? Solve.',
      blocks: [{ space: 0.3 }, { lines: ['', 'Difference'] }],
    },
    {
      text: 'A road sign shows how far away three towns are. How much farther is Oak Hill than Lakeview?',
      blocks: [{ row: [[{ table: { head: ['Town', 'Miles'], rows: [['Lakeview', '147'], ['Pine City', '215'], ['Oak Hill', '384']], width: 3200, size: 24 } }], [{ space: 0.6 }, { lines: ['Miles farther'] }]] }],
    },
  ],
  own: [
    sub('878 − 435 = ______'),
    sub('652 − 286 = ______'),
    sub('824 − 768 = ______'),
    sub('152 − 78 = ______'),
    { half: true, text: '713 people want tickets to a show. The theater has 227 fewer seats than that. How many seats does the theater have?', blocks: [{ space: 0.9 }, { lines: ['Seats'] }] },
    { half: true, text: 'Sam scored 318 points. That was 105 more than his last game. Ava scored 503 points. How many more points did Ava score than Sam?', blocks: [{ space: 0.75 }, { lines: ['More points'] }] },
    sub('500 − 268 = ______', true),
    sub('775 − 325 = ______', true),
    { text: 'Jay says that to find 368 − 125, he can decompose 368 and subtract the parts from 125. Do you agree? Explain.', blocks: [{ lines: ['', '', 'Difference'] }] },
    { text: 'Mia has 600 points. She spends 284 points on a hat and 197 points on shoes. Does she have more than 100 points left? Show how you know.', blocks: [{ space: 0.9 }, { lines: ['Answer'] }] },
  ],
  answers: {
    together: [
      { a: ['Decompose: 652 − 100 = 552; 552 − 10 = 542; 542 − 8 = 534.', 'Adjust: +2 to both → 654 − 120 = 534. Difference: **534**'], note: 'Also accept 542 − 2 = 540, 540 − 6 = 534 for the ones step.' },
      { a: ['**Both work.** Nina took 2 from both numbers (same moves). Theo used a related addition. 182 − 147 = **35**.'], note: 'Theo: 147 → 150 (+3) → 180 (+30) → 182 (+2) = 35. Any choice with a reason is fine.' },
      { a: ['384 − 147 = **237** miles farther'], note: 'Pine City (215) is not needed. e.g., 387 − 150 = 237.' },
    ],
    own: [
      { a: ['**443**'], note: 'Items 1–4: accept any correct strategy.' },
      { a: ['**366**'], note: 'e.g., 656 − 290 = 366 (+4 to both).' },
      { a: ['**56**'], note: 'Counting up is quick: 768 → 770 (+2) → 800 (+30) → 824 (+24) = 56.' },
      { a: ['**74**'], note: 'e.g., 154 − 80 = 74. A common mistake is 126 (taking smaller digits from larger in each place).' },
      { a: ['713 − 227 = **486** seats'], note: '“227 fewer than 713” means 713 − 227.' },
      { a: ['503 − 318 = **185** more points'], note: 'The 105 is extra information.' },
      { a: ['**232**'], note: 'Sample: related addition 268 + ? = 500 (2 + 30 + 200), or 499 − 267 = 232.' },
      { a: ['**450**'], note: 'Sample: 775 − 300 = 475; 475 − 25 = 450, or adjust to 750 − 300.' },
      { a: ['**No.** You must take away 125 from 368, so decompose 125 (100, 20, 5): 268, 248, **243**.'], note: 'Taking parts of 368 away from 125 does not work: 125 is smaller than 368.' },
      { a: ['600 − 284 = 316; 316 − 197 = 119. **Yes**, 119 is more than 100.'] },
    ],
  },
};
