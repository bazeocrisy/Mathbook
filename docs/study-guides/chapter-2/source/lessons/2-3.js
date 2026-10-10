const blank = top => ({ arrows: { top, bottom: null } });

module.exports = {
  id: '2-3',
  title: 'Estimate Sums and Differences',
  pages: '43–46',
  bookNote: 'The book estimates 576 − 122 by rounding (460 or 500) and with compatible numbers (450).',
  goal: 'I can estimate sums and differences by rounding or by using compatible numbers, and use an estimate to check whether an answer makes sense.',
  vocab: [
    ['estimate', 'A number close to the exact answer. “About how many?” asks for an estimate.'],
    ['exact answer', 'The real answer you get from the real numbers.'],
    ['round', 'Change a number to the nearest ten or hundred (Lesson 2-2).'],
    ['compatible numbers', 'Nearby numbers that are easy to work with in your head, like 575 and 125. Numbers ending in 00, 25, 50, or 75 work well.'],
    ['sum / difference', 'The answer when you add / the answer when you subtract.'],
    ['reasonable', 'Makes sense; close to what you expected.'],
  ],
  teach: [
    'Read the problem. Does it ask “about how many”? Then an estimate is enough.',
    '**Round:** change each number to the nearest hundred (fast) or nearest ten (closer). Draw an arrow from each number to its rounded number, then add or subtract.',
    '**Compatible numbers:** change each number to a close, friendly number (ending in 00, 25, 50, or 75), then add or subtract in your head.',
    'In word problems, decide first: putting together → add; how many more, how many left, or how much taller → subtract.',
    'To check an answer, estimate first. If the answer is far from the estimate, check the work again.',
  ],
  tip: 'Different methods give different estimates. Any estimate made with a sensible method is reasonable; rounding to tens is usually closer than rounding to hundreds.',
  examples: [
    {
      title: 'Example 1: Round to the nearest hundred',
      body: [{ arrows: { top: '576 − 122 = ?', bottom: '600 − 100 = 500' } }, '576 → 600 and 122 → 100. About **500**.'],
    },
    {
      title: 'Example 2: Round to the nearest ten',
      body: [{ arrows: { top: '576 − 122 = ?', bottom: '580 − 120 = 460' } }, 'About **460**. The exact answer is 454, so this is closer.'],
    },
    {
      title: 'Example 3: Compatible numbers',
      body: [{ arrows: { top: '247 + 352 = ?', bottom: '250 + 350 = 600' } }, '247 is close to 250. 352 is close to 350. About **600** (exact: 599).'],
    },
    {
      title: 'Example 4: Word problem and checking',
      body: [
        'A shelf holds 560 books. It needs 213 more to be full. About how many books are on it? The whole is 560, so **subtract**: 560 − 210 = **350**.',
        'Leo says 389 + 205 = 794. Estimate: 400 + 200 = 600. 794 is far from 600, so it is **not reasonable**.',
      ],
    },
  ],
  checklist: [
    'Explain the difference between an estimate and an exact answer.',
    'Estimate by rounding to the nearest hundred.',
    'Estimate by rounding to the nearest ten.',
    'Estimate with compatible numbers.',
    'Choose add or subtract in a word problem and estimate.',
    'Use an estimate to tell if an answer is reasonable.',
  ],

  together: [
    { text: 'Estimate. Round each number to the **nearest hundred**.', blocks: [blank('386 + 241 = ?')] },
    { text: 'Estimate. Round each number to the **nearest ten**.', blocks: [blank('683 − 318 = ?')] },
    { text: 'Estimate with **compatible numbers** (numbers ending in 00, 25, 50, or 75).', blocks: [blank('526 − 248 = ?')] },
  ],
  own: [
    { half: true, text: 'Round to the **nearest hundred**.', blocks: [blank('? = 462 + 315')] },
    { half: true, text: 'Round to the **nearest ten**.', blocks: [blank('791 − 246 = ?')] },
    { half: true, text: 'Round to the **nearest ten**.', blocks: [blank('? = 374 + 518')] },
    { half: true, text: 'Use **compatible numbers**.', blocks: [blank('874 − 627 = ?')] },
    { text: 'How can you use rounding to estimate the sum of 289 + 432? Write your estimate.', blocks: [{ lines: ['', ''] }] },
    { text: 'A puzzle has 815 pieces. Mia still needs to place 362 pieces. About how many pieces has she placed? Round each number to the nearest ten.', blocks: [{ space: 0.55 }, { lines: ['About'] }] },
    { text: 'A school has 272 books in the library and 449 books in classrooms. Use compatible numbers to find about how many books there are in all.', blocks: [{ space: 0.55 }, { lines: ['About'] }] },
    { text: 'Omar biked about 640 miles in May and June together. He biked 287 miles in June. About how many miles did he bike in May? Round 287 to the nearest ten.', blocks: [{ space: 0.55 }, { lines: ['About'] }] },
    { text: 'Ruby has 536 beads. She uses 39 beads on each of 2 bracelets. About how many beads are left? Round each number to the nearest ten.', blocks: [{ space: 0.75 }, { lines: ['About'] }] },
    { text: 'Ben says 347 + 238 = 785. Estimate to check. Is Ben’s answer reasonable? Explain.', blocks: [{ space: 0.35 }, { lines: ['', ''] }] },
  ],
  answers: {
    together: [
      { a: ['386 → 400, 241 → 200. 400 + 200 = **600**'], note: 'Exact: 627.' },
      { a: ['683 → 680, 318 → 320. 680 − 320 = **360**'], note: 'Exact: 365.' },
      { a: ['526 → 525, 248 → 250. 525 − 250 = **275**'], note: 'Exact: 278. Accept other close friendly numbers (e.g., 530 − 250 = 280) if your child explains them.' },
    ],
    own: [
      { a: ['500 + 300 = **800**'], note: 'Exact: 777.' },
      { a: ['790 − 250 = **540**'], note: 'Exact: 545.' },
      { a: ['370 + 520 = **890**'], note: 'Exact: 892.' },
      { a: ['875 − 625 = **250**'], note: 'Exact: 247.' },
      { a: ['Round each number, then add: 300 + 400 = **700** (nearest hundred) or 290 + 430 = **720** (nearest ten).'], note: 'Accept either estimate with a clear explanation. Exact: 721.' },
      { a: ['815 → 820, 362 → 360. Subtract: 820 − 360 = **460** pieces'], note: 'The whole puzzle is 815 and 362 are still missing. Exact: 453.' },
      { a: ['275 + 450 = **725** books'], note: 'Exact: 721. Also accept 270 + 450 = 720 or 300 + 400 = 700 with an explanation.' },
      { a: ['287 → 290. 640 − 290 = **350** miles'] },
      { a: ['536 → 540, 39 → 40. 540 − 40 − 40 = **460** beads'], note: 'Exact: 536 − 78 = 458. Also accept 540 − 80 = 460.' },
      { a: ['Estimate: 300 + 200 = 500 (or 350 + 250 = 600). **Not reasonable**: 785 is far from the estimate.'], note: 'Accept any sensible estimate (e.g., 350 + 240 = 590). The exact sum is 585 (Ben added an extra hundred).' },
    ],
  },
};
