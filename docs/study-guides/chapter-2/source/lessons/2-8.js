const { slideLine, openLine } = require('../diagrams');

const adj = top => ({ half: true, text: 'Adjust the equation to solve.', blocks: [{ arrows: { top, bottom: null, tags: true } }] });

module.exports = {
  id: '2-8',
  title: 'Adjust Numbers to Add or Subtract',
  pages: '63–66',
  bookNote: 'The book adjusts 224 + 109 to 223 + 110 and 333 − 212 to 331 − 210.',
  goal: 'I can change the numbers in an addition or subtraction problem to friendlier numbers and keep the sum or difference the same.',
  vocab: [
    ['adjust', 'Change the numbers a little to make them easier to work with.'],
    ['friendly number', 'A number that is easy to add or subtract, like 200 or 110.'],
    ['addend', 'A number you add.'],
    ['sum / difference', 'The answer when you add / the answer when you subtract.'],
    ['equation', 'A number sentence with an equal sign, like 223 + 110 = 333.'],
  ],
  teach: [
    'Find the number that is close to a ten or hundred (like 198 or 109).',
    '**Adding:** take some away from one addend and give the same amount to the other (**opposite** moves). 224 + 109 → 223 + 110.',
    '**Subtracting:** add the same amount to both numbers, or take the same amount from both (**same** moves). 333 − 212 → 331 − 210.',
    'Show subtraction on a number line: sliding both numbers the same amount keeps the distance between them.',
    'If only one number was changed, fix the answer: 645 + 300 = 945 used 2 too many, so take 2 away → 943.',
  ],
  tip: 'Use coins for addition (move one coin from one pile to the other: the total stays the same). Ask, “Adding or subtracting? Opposite or same?”',
  examples: [
    { title: 'Example 1: Adjust addition (opposite moves)', body: [{ arrows: { top: '236 + 198 = ?', bottom: '234 + 200 = 434', tags: ['−2', '', '+2', '', ''] } }] },
    { title: 'Example 2: Adjust subtraction (same moves)', body: [{ arrows: { top: '452 − 197 = ?', bottom: '455 − 200 = 255', tags: ['+3', '', '+3', '', ''] } }] },
    {
      title: 'Example 3: Why subtraction uses the same moves',
      body: [{ diagram: slideLine({ a: 563, b: 288, a2: 575, b2: 300, from: 260, to: 600 }), width: 3.2 }, '563 − 288 → 575 − 300 = **275**. Both moved up 12, so the distance stays the same.'],
    },
    {
      title: 'Example 4: Mistakes to fix',
      body: ['367 + 196 → 370 + 199? **No.** Both went up 3, so the sum is 6 too big. Use 363 + 200 = **563**.', '645 + 298: changed only 298 to 300 → 945. Added 2 extra, so take 2 away: **943**.'],
    },
  ],
  checklist: [
    'Adjust an addition problem by moving an amount from one addend to the other.',
    'Adjust a subtraction problem by changing both numbers the same way.',
    'Explain how adjusting addition and subtraction are different.',
    'Show on a number line that the difference stays the same.',
    'Tell if someone adjusted correctly.',
    'Fix the answer when only one number was changed.',
  ],

  together: [
    { text: 'Adjust to make a friendly number. Write the change on each arrow. Then add.', blocks: [{ arrows: { top: '248 + 195 = ?', bottom: null, tags: true } }] },
    { text: 'Adjust to make a friendly number. Write the change on each arrow. Then subtract.', blocks: [{ arrows: { top: '364 − 198 = ?', bottom: null, tags: true } }] },
    { text: 'Rosa adds 538 + 207. She adjusts it to 540 + 209 and finds 749. Do you agree with her strategy? Explain.', blocks: [{ lines: ['', ''] }] },
  ],
  own: [
    adj('463 − 98 = ?'),
    adj('156 + 237 = ?'),
    adj('769 − 412 = ?'),
    adj('499 + 286 = ?'),
    adj('672 − 318 = ?'),
    adj('148 + 159 = ?'),
    { text: 'Kim changed 208 + 119 = ? to 207 + 120 = ?. Describe how she adjusted the equation. Why do you think she did it that way?', blocks: [{ lines: ['', ''] }] },
    { text: 'Show how you can adjust 584 − 297. Use the number line to show that the new equation has the same difference.', blocks: [{ space: 0.25 }, { diagram: openLine(), width: 5.6 }, { lines: ['New equation'] }] },
    { half: true, text: 'You can adjust 345 − 128 in different ways. Explain one way and why it makes the problem easier.', blocks: [{ lines: ['', '', ''] }] },
    { half: true, text: 'Tia and Sam find 139 + 268 by adjusting. Tia uses 140 + 269 = 409. Sam uses 140 + 267 = 407. Which sum is correct? Explain.', blocks: [{ lines: ['', '', ''] }] },
    { text: 'A library had 674 books last year. Now it has 935 books. How many more books does it have now? Adjust the numbers to solve.', blocks: [{ space: 0.7 }, { lines: ['More books'] }] },
    { text: 'Jon adds 624 + 199. He changes 199 to 200 but forgets to change 624. He gets 824. How can he fix his sum? Explain.', blocks: [{ lines: ['', ''] }] },
  ],
  answers: {
    together: [
      { a: ['Sample: −5 and +5 → 243 + 200 = **443**'], note: 'Accept any adjustment that takes from one addend and gives the same amount to the other (e.g., 250 + 193 = 443).' },
      { a: ['Sample: +2 and +2 → 366 − 200 = **166**'], note: 'Both numbers must change the same way (e.g., 364 − 198 → 366 − 200).' },
      { a: ['**No.** She added 2 to **both** numbers, so her sum is 4 too big. In adding, one number goes up and the other goes down: 545 + 200 = **745**.'] },
    ],
    own: [
      { a: ['+2, +2 → 465 − 100 = **365**'], note: 'Items 1–6: accept any correct adjustment. Addition: opposite moves. Subtraction: same moves.' },
      { a: ['−3, +3 → 153 + 240 = **393**'] },
      { a: ['−2, −2 → 767 − 410 = **357**'] },
      { a: ['+1, −1 → 500 + 285 = **785**'] },
      { a: ['+2, +2 → 674 − 320 = **354**'] },
      { a: ['−1, +1 → 147 + 160 = **307**'] },
      { a: ['She took 1 from 208 and gave it to 119. Now 120 is a friendly number, and the sum stays the same: 207 + 120 = **327**.'] },
      { a: ['Add 3 to both: 587 − 300 = **287**. On the number line, both ends slide 3 to the right, so the distance stays 287.'], note: 'Accept any correct same-move adjustment drawn on the line (e.g., 584 − 297 → 587 − 300).' },
      { a: ['Sample: add 2 to both → 347 − 130 = **217**. It is easier because 130 is a friendly number.'], note: 'Accept any same-move adjustment, e.g., 342 − 125 = 217 or 350 − 133 = 217.' },
      { a: ['**Sam (407).** Tia added 1 to both numbers, so her sum is 2 too big. Sam took 1 from 268 and gave it to 139.'] },
      { a: ['935 − 674. Sample: add 26 to both → 961 − 700 = **261** more books.'], note: 'Also accept 935 − 674 → 931 − 670 = 261 or any correct method.' },
      { a: ['He added 1 too many (200 instead of 199), so he should subtract 1: 824 − 1 = **823**.'] },
    ],
  },
};
