const { pairsJoin } = require('../diagrams');

const pattern = s => ({ half: true, text: 'Write **even** or **odd**. Then write two equations with 3-digit numbers that fit.', blocks: [{ p: s, size: 28, bold: true }, { lines: ['', ''], gap: 300 }] });

module.exports = {
  id: '2-5',
  title: 'Addition Patterns',
  pages: '51–54',
  bookNote: 'The book shows the three even/odd sum patterns with 3-digit examples.',
  goal: 'I can use even and odd patterns to tell whether a sum is even or odd, explain why, and use the patterns to check a sum.',
  vocab: [
    ['even number', 'A number that can be split into pairs with none left over. Its ones digit is 0, 2, 4, 6, or 8.'],
    ['odd number', 'A number that has one left over when you make pairs. Its ones digit is 1, 3, 5, 7, or 9.'],
    ['pattern', 'Something that happens again and again in the same way.'],
    ['ones digit', 'The digit in the ones place. In 427, the ones digit is 7.'],
    ['sum / addend', 'The answer when you add / a number that you add.'],
  ],
  teach: [
    'Use small objects. Make pairs. If one is left over, the number is odd. If none are left over, it is even.',
    'Join two odd groups: the two leftovers make a new pair, so **odd + odd = even**. Even + even has no leftovers, so it is **even**. Even + odd still has one leftover, so it is **odd**.',
    'For big numbers, look only at the **ones digits**. Tens and hundreds are made of groups of ten, and ten is even, so they never leave a leftover.',
    'Before adding, predict: will the sum be even or odd? After adding, check that the sum matches.',
    'Remember: if the sum does not match the pattern, it is wrong. If it does match, you still need to add to be sure.',
  ],
  tip: 'Ask, “What is the ones digit? Will there be a leftover?”',
  examples: [
    {
      title: 'Example 1: Why odd + odd = even',
      body: [{ diagram: pairsJoin(5, 3), width: 3.2 }, '5 and 3 each have one leftover (dashed). Together the leftovers make a pair, so 8 is **even**.'],
    },
    {
      title: 'Example 2: The three patterns',
      body: [
        '**even + even = even**  214 + 352 = 566',
        '**odd + odd = even**  135 + 221 = 356',
        '**even + odd = odd**  412 + 235 = 647',
        'The order does not matter: odd + even = odd too.',
      ],
    },
    {
      title: 'Example 3: Only the ones digits matter',
      body: ['627 + 154: look at 7 + 4 = 11, which is odd. So the sum is **odd**.', 'Add to find it: 627 + 154 = **781**. 781 is odd. ✓'],
    },
    {
      title: 'Example 4: Check a sum',
      body: ['Is 316 + 151 = 457 correct?', 'even + odd = odd, and 457 is odd, so the pattern matches. But we must still add: 316 + 151 = **467**. The pattern can catch some mistakes, not all.'],
    },
  ],
  checklist: [
    'Tell if a number is even or odd from its ones digit.',
    'Say the three sum patterns.',
    'Explain the patterns with pairs and leftovers.',
    'Write a 3-digit equation that fits a pattern.',
    'Predict if a sum is even or odd, then add to check.',
    'Know that a matching pattern does not prove a sum is right.',
  ],

  together: [
    { text: 'Write **even** or **odd**. Then write one equation with 3-digit numbers that fits.', blocks: [{ p: 'odd + odd = ________', size: 28, bold: true }, { lines: ['Equation'] }] },
    { text: 'Is the sum of **358 + 227** even or odd? Decide before you add. Then find the sum.', blocks: [{ lines: ['Even or odd', 'Sum'] }] },
    { text: 'Omar writes 243 + 316 = 549. He says it is correct because odd + even = odd. Do you agree? Explain.', blocks: [{ space: 0.3 }, { lines: ['', ''] }] },
  ],
  own: [
    pattern('________ = odd + even'),
    pattern('even + even = ________'),
    pattern('even + ________ = odd'),
    pattern('odd + ________ = odd'),
    pattern('________ + odd = even'),
    pattern('________ = odd + odd'),
    { half: true, text: 'Find the sum. Use a pattern to check your answer.', blocks: [{ p: '352 + 417 = ________', size: 28 }, { space: 0.6 }] },
    { half: true, text: 'Find the sum. Use a pattern to check your answer.', blocks: [{ p: '263 + 525 = ________', size: 28 }, { space: 0.6 }] },
    { text: 'Why is the sum of a number with a **5** in the ones place and a number with a **2** in the ones place always odd?', blocks: [{ lines: ['', ''] }] },
    { text: 'A pet shop has two fish tanks. One tank has 25 fish. How many fish could be in the other tank so that the total number of fish is **even**? Explain.', blocks: [{ lines: ['', ''] }] },
    { text: 'Ava reads 121 pages, then 122 pages, then 124 pages. Is the total number of pages even or odd? Explain how you know.', blocks: [{ lines: ['', ''] }] },
  ],
  answers: {
    together: [
      { a: ['**even**. Sample: 135 + 241 = 376'], note: 'Accept any two odd 3-digit numbers with a correct sum.' },
      { a: ['**Odd** (8 + 7 = 15, and 15 is odd). Sum: **585**'], note: 'even + odd = odd.' },
      { a: ['**No.** The pattern is right (the sum should be odd), but 243 + 316 = **559**, not 549.'], note: 'A sum can match the pattern and still be wrong. You have to add to be sure.' },
    ],
    own: [
      { a: ['**odd**. Samples: 347 = 133 + 214; 527 = 405 + 122'], note: 'For items 1–6, accept any 3-digit equations that fit the pattern and are added correctly.' },
      { a: ['**even**. Samples: 312 + 124 = 436; 250 + 406 = 656'] },
      { a: ['**odd**. Samples: 132 + 215 = 347; 400 + 301 = 701'] },
      { a: ['**even**. Samples: 213 + 104 = 317; 121 + 340 = 461'] },
      { a: ['**odd**. Samples: 123 + 211 = 334; 305 + 105 = 410'] },
      { a: ['**even**. Samples: 111 + 223 = 334; 455 + 135 = 590'] },
      { a: ['**769**. even + odd = odd, and 769 is odd.'] },
      { a: ['**788**. odd + odd = even, and 788 is even.'] },
      { a: ['5 + 2 = 7, which is odd. The tens and hundreds are groups of ten, which are even, so only the ones digits decide.'], note: 'Also accept a pairs explanation: 5 has one leftover and 2 has none, so one is left over.' },
      { a: ['**Any odd number**, such as 13 (25 + 13 = 38) or 25 (25 + 25 = 50).'], note: '25 is odd, and odd + odd = even.' },
      { a: ['**Odd.** 121 + 122 is odd + even = odd. Then odd + 124 (even) = odd. Total: 367.'], note: 'Also accept checking the ones digits: 1 + 2 + 4 = 7, which is odd.' },
    ],
  },
};
