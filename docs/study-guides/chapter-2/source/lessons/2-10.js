const add = (expr, explain) => ({ half: true, text: explain ? 'Solve. Explain your strategy.' : 'Solve. Use any strategy.', blocks: [{ p: expr, size: 28 }, { space: explain ? 0.7 : 0.95 }, ...(explain ? [{ lines: ['Strategy'] }] : [])] });

module.exports = {
  id: '2-10',
  title: 'Fluently Add within 1,000',
  pages: '71–74',
  bookNote: 'The book adds 722 + 169 with partial sums (row and column) and by adjusting to 721 + 170.',
  goal: 'I can add 3-digit numbers using partial sums or by adjusting addends, and choose a strategy that works well for me.',
  vocab: [
    ['addend / sum', 'A number you add / the answer when you add.'],
    ['partial sums', 'Add the hundreds, tens, and ones separately, then add those answers together.'],
    ['adjust addends', 'Take some from one addend and give it to the other so a number is friendlier.'],
    ['strategy', 'A way to solve a problem.'],
    ['efficient', 'Quick and easy, and still correct.'],
    ['extra information', 'A number in a story that you do not need to answer the question.'],
  ],
  teach: [
    '**Partial sums:** add hundreds + hundreds, tens + tens, ones + ones. Then add the three partial sums. Write them in a row or in a column.',
    '**Adjust addends:** if a number is close to a ten or hundred (like 259 or 299), take a little from the other addend and give it to that number.',
    'If you change only one addend, undo it at the end: 340 + 457 = 797 is 4 too many, so 793.',
    'Let your child choose. Any correct strategy is fine. Ask which one felt easier and why.',
    'In stories, read the question first and cross out numbers you do not need.',
  ],
  tip: 'Ask, “Is one number close to a ten or a hundred?” If yes, adjusting is quick. Partial sums always work.',
  examples: [
    { title: 'Example 1: Partial sums in a row', body: [{ psum: { nums: [634, 259], mode: 'row' } }] },
    { title: 'Example 2: Partial sums in a column', body: [{ psum: { nums: [634, 259], mode: 'stacked' } }] },
    { title: 'Example 3: Adjust addends', body: [{ arrows: { top: '634 + 259 = ?', bottom: '633 + 260 = 893', tags: ['−1', '', '+1', '', ''] } }, 'Take 1 from 634 and give it to 259. The sum stays the same.'] },
    {
      title: 'Example 4: Find the useful information',
      body: ['A school of 410 students collected 356 books in May and 218 in June. How many books in all?', 'The 410 is extra. 356 + 218 → 354 + 220 = **574** books.'],
    },
  ],
  checklist: [
    'Add with partial sums in a row.',
    'Add with partial sums in a column.',
    'Adjust addends and keep the sum the same.',
    'Fix the sum after changing only one addend.',
    'Choose and explain a strategy.',
    'Ignore extra information and solve two-step stories.',
  ],

  together: [
    { text: 'Find **538 + 246** two ways.', blocks: [{ row: [[{ p: '**Partial sums**', size: 24 }, { space: 1.05 }], [{ p: '**Adjust addends**', size: 24 }, { space: 1.05 }]] }, { lines: ['Sum'] }] },
    { text: 'Rosa and Ben find 457 + 238. Rosa adjusts the addends. Ben uses partial sums. Can either strategy be used? Explain. What is the sum?', blocks: [{ space: 0.3 }, { lines: ['', 'Sum'] }] },
    { text: 'A farm grew 274 pumpkins and 419 squash. It sold 300 vegetables at the market. How many vegetables did the farm grow? Which number do you not need?', blocks: [{ space: 0.25 }, { lines: ['Vegetables grown', 'Number not needed'] }] },
  ],
  own: [
    add('546 + 239 = ______'),
    add('______ = 152 + 637'),
    { text: 'Leo adds 436 + 285. He adds 4 to 436 and finds 440 + 285 = 725. Then he subtracts 4 from the sum. Do you agree with his strategy? Explain.', blocks: [{ lines: ['', '', 'Sum'] }] },
    { text: 'Ana adds 263 + 518 by writing the addends in a row. Show another way to find 263 + 518.', blocks: [{ space: 0.95 }, { lines: ['Sum'] }] },
    { half: true, text: 'A bike path is 342 meters long. Kim rides the whole path 2 times. How many meters does she ride?', blocks: [{ space: 1.0 }, { lines: ['Meters'] }] },
    { half: true, text: 'A reading club read 215 books in fall and 162 books in winter. In spring, they read 118 more books than in fall and winter together. How many books did they read in spring?', blocks: [{ space: 0.6 }, { lines: ['Books'] }] },
    add('368 + 257 = ______', true),
    add('526 + 297 = ______', true),
    { half: true, text: 'Ms. Lee needs 700 stickers. Stickers come in packs of 250. How many packs should she buy? Explain.', blocks: [{ space: 0.9 }, { lines: ['Packs'] }] },
    { half: true, text: 'A class collected 356 cans in March and 389 cans in April. They gave 500 cans to a food bank. How many cans did the class collect?', blocks: [{ space: 0.6 }, { lines: ['Cans'] }] },
  ],
  answers: {
    together: [
      { a: ['Partial sums: 500 + 200 = 700; 30 + 40 = 70; 8 + 6 = 14; 700 + 70 + 14 = **784**', 'Adjust: 538 + 246 → 540 + 244 = **784**'], note: 'Any correct adjustment is fine (e.g., 534 + 250 = 784).' },
      { a: ['**Yes, both work.** Adjusting: 455 + 240 = 695. Partial sums: 600 + 80 + 15 = 695. Sum: **695**'], note: 'Both strategies keep every hundred, ten, and one, so they give the same sum.' },
      { a: ['274 + 419 = **693** vegetables. The **300** is not needed.'] },
    ],
    own: [
      { a: ['**785**'], note: 'Items 1–2: accept any correct strategy (e.g., 545 + 240 = 785).' },
      { a: ['**789**'] },
      { a: ['**Yes.** Adding 4 made the sum 4 too big, so subtracting 4 fixes it: 725 − 4 = **721**.'] },
      { a: ['Sample (stacked partial sums): 200 + 500 = 700; 60 + 10 = 70; 3 + 8 = 11; sum **781**.'], note: 'Also accept adjusting: 261 + 520 = 781, or any correct other way.' },
      { a: ['342 + 342 = **684** meters'] },
      { a: ['215 + 162 = 377. 377 + 118 = **495** books.'] },
      { a: ['**625**'], note: 'Sample: 600 + 110 + 15 = 625, or 370 + 255 = 625. Any explained strategy.' },
      { a: ['**823**'], note: 'Sample: adjust to 523 + 300 = 823.' },
      { a: ['250 + 250 = 500 is not enough. 500 + 250 = 750 is enough. **3 packs**.'], note: '2 packs is a common wrong answer (500 < 700).' },
      { a: ['356 + 389 = **745** cans. The 500 is extra information.'] },
    ],
  },
};
