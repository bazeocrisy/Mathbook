const solve = (expr, explain) => ({ half: true, text: explain ? 'Solve. Explain your strategy.' : 'Solve. Use any strategy.', blocks: [{ p: expr, size: 28 }, { space: explain ? 0.65 : 0.85 }, ...(explain ? [{ lines: ['Strategy'] }] : [])] });

module.exports = {
  id: '2-14',
  title: 'Fluently Add Multi-Digit Numbers',
  pages: '87–90',
  bookNote: 'The book adds 2,322 + 1,569 by decomposing an addend, with partial sums, and with an algorithm.',
  goal: 'I can add multi-digit numbers by decomposing an addend, using partial sums, or using an algorithm with regrouping.',
  vocab: [
    ['decompose an addend', 'Break one addend into thousands, hundreds, tens, and ones and add them one at a time.'],
    ['partial sums', 'Add each place separately, then add those answers.'],
    ['algorithm', 'Step-by-step column adding: start with the ones and move left.'],
    ['regroup', 'Trade 10 of one place for 1 of the next place: 15 ones = 1 ten and 5 ones.'],
  ],
  teach: [
    '**Decompose an addend:** keep the first number. Add the thousands, then hundreds, tens, and ones of the second number, keeping a running total.',
    '**Partial sums:** add each place and write each answer with its full value (300 + 500 = 800, not 8). Then add the partial sums.',
    '**Algorithm:** line up the numbers by the **ones**. Add the ones first. If a place adds to 10 or more, write the ones digit and regroup 1 to the next place (write a small 1 above it).',
    'If the last place adds to 10 or more, the regrouped 1 makes a new place (5,736 + 4,582 = 10,318).',
  ],
  tip: 'Any strategy is fine. Ask, “What did you do with the extra ten?” In stories, cross out numbers you do not need; for “fewer than,” decide who has more.',
  examples: [
    { title: 'Example 1: Decompose an addend', body: ['3,146 + 2,537: add 2,000, then 500, then 30, then 7.', '3,146 → 5,146 → 5,646 → 5,676 → **5,683**'] },
    { title: 'Example 2: Partial sums', body: [{ psum: { nums: [2457, 1368], mode: 'stacked' }, size: 20 }] },
    {
      title: 'Example 3: Use an algorithm',
      body: [{ row: [[{ stack: { rows: ['2,457', '+1,368'], result: '3,825', top: '  11 ', size: 22, cellW: 230, indent: 0 } }], ['Ones: 7 + 8 = 15. Write 5, regroup 1 ten.', 'Tens: 1 + 5 + 6 = 12. Write 2, regroup 1.', 'Hundreds: 1 + 4 + 3 = 8. Thousands: 2 + 1 = 3.']], weights: [0.36, 0.64] }],
    },
    { title: 'Example 4: A new place; a “fewer” story', body: ['5,736 + 4,582: thousands 1 + 5 + 4 = 10, so the sum is **10,318**.', 'Ben has 1,250 fewer cards than Kai. Ben has 2,430. Kai has more, so add: 2,430 + 1,250 = **3,680**.'] },
  ],
  checklist: [
    'Decompose an addend and keep a running total.',
    'Find partial sums with full place values.',
    'Use the algorithm and regroup correctly.',
    'Line up numbers with different numbers of digits.',
    'Judge whether someone’s strategy works.',
    'Solve “fewer than,” extra-information, and two-step problems.',
  ],

  together: [
    { text: 'Use the algorithm. Write the regrouped 1s above the numbers.', blocks: [{ stack: { rows: ['548', '+376'], result: '', top: '   ', size: 32, cellW: 420 } }] },
    { text: 'Mia and Jon find 4,256 + 5,368. Mia uses an algorithm. Jon uses partial sums. Can either strategy be used? Explain. Find the sum.', blocks: [{ space: 0.6 }, { lines: ['', 'Sum'] }] },
    { text: 'Add **2,316 + 587** by decomposing 587. Hint: what can you add to 2,316 to make a hundred?', blocks: [{ space: 0.7 }, { lines: ['Sum'] }] },
  ],
  own: [
    solve('467 + 385 = ______'),
    solve('______ = 125 + 4,631'),
    solve('______ = 4,968 + 3,275'),
    solve('31,402 + 5,375 = ______'),
    { text: 'Nia adds 2,639 + 457. She adds 61, then 400, then 6. Do you agree with her strategy? Explain. What is the correct sum?', blocks: [{ lines: ['', '', 'Sum'] }] },
    {
      text: 'Sam adds 548 + 263. His partial sums are shown. What is another way Sam could find the sum? Show it.',
      blocks: [{ row: [[{ p: '500 + 200 = 700', size: 24 }, { p: '40 + 60 = 100', size: 24 }, { p: '8 + 3 = 11', size: 24 }], [{ space: 1.1 }]] }],
    },
    { half: true, text: 'Leo walked 2,165 fewer steps than his sister Ana. Leo walked 2,748 steps. How many steps did Ana walk?', blocks: [{ space: 1.2 }, { lines: ['Steps'] }] },
    { half: true, text: 'A library lent 1,245 books in fall and 2,136 books in winter. In spring it lent 1,105 more books than in fall and winter together. How many books did it lend in spring?', blocks: [{ space: 0.7 }, { lines: ['Books'] }] },
    solve('538 + 274 = ______', true),
    solve('6,247 + 568 = ______', true),
    { half: true, text: 'Mr. Diaz needs 800 paper cups. Cups come in packs of 300. How many packs should he buy?', blocks: [{ space: 0.9 }, { lines: ['Packs'] }] },
    { half: true, text: 'A school raised $3,276 at a fair and $1,858 at a bake sale. It spent $900 on books. How much money did the school raise?', blocks: [{ space: 0.75 }, { lines: ['Raised'] }] },
  ],
  answers: {
    together: [
      { a: ['**924**'], note: 'Ones 8 + 6 = 14 (write 4, regroup 1). Tens 1 + 4 + 7 = 12 (write 2, regroup 1). Hundreds 1 + 5 + 3 = 9. Common mistakes: 814 (forgetting both regrouped 1s) or 914 / 824 (forgetting one).' },
      { a: ['**Yes, both work.** Sum: **9,624**.'], note: 'Algorithm: 14 → 4 r1; 1 + 5 + 6 = 12 → 2 r1; 1 + 2 + 3 = 6; 4 + 5 = 9. Partial sums: 9,000 + 500 + 110 + 14 = 9,624.' },
      { a: ['2,316 + 84 = 2,400; 2,400 + 500 = 2,900; 2,900 + 3 = **2,903**'], note: '84 + 500 + 3 = 587, so the parts add back up. Place-value parts (500, 80, 7) also work.' },
    ],
    own: [
      { a: ['**852**'], note: 'Items 1–4: any strategy. 7 + 5 = 12 r1; 1 + 6 + 8 = 15 r1; 1 + 4 + 3 = 8.' },
      { a: ['**4,756**'], note: 'Line up the ones: 125 goes under the 631 part.' },
      { a: ['**8,243**'], note: 'Regroups three times: 13, 14, 12.' },
      { a: ['**36,777**'] },
      { a: ['**No.** 61 + 400 + 6 = 467, not 457, so she adds 10 too many (she would get 3,106). Correct sum: 2,639 + 457 = **3,096**.'], note: 'Her idea of making a friendly number works; the parts just have to add up to 457 (for example, 61 + 396).' },
      { a: ['Sample: the algorithm. 8 + 3 = 11 (write 1, regroup 1); 1 + 4 + 6 = 11 (write 1, regroup 1); 1 + 5 + 2 = 8. Sum **811**.'], note: 'Also accept decomposing an addend: 548 + 200 = 748, + 60 = 808, + 3 = 811.' },
      { a: ['Ana walked more. 2,748 + 2,165 = **4,913** steps.'], note: 'Subtracting is a common mistake with “fewer than.”' },
      { a: ['1,245 + 2,136 = 3,381. 3,381 + 1,105 = **4,486** books.'], note: 'Two steps: add fall and winter first, then add 1,105 more.' },
      { a: ['**812**'], note: 'e.g., partial sums 700 + 100 + 12 = 812.' },
      { a: ['**6,815**'], note: 'e.g., algorithm: 15 r1, 11 r1, 1 + 2 + 5 = 8, 6.' },
      { a: ['300 + 300 = 600 is not enough; 600 + 300 = 900 is enough. **3 packs**.'] },
      { a: ['$3,276 + $1,858 = **$5,134**'], note: 'The $900 is extra information.' },
    ],
  },
};
