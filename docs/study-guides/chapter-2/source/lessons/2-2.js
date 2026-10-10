const { numberLine } = require('../diagrams');

// Blank number line: 10 equal jumps, boxes for both ends and the halfway point.
const blankLine = (width = 5.2) => ({ diagram: numberLine({ from: 0, to: 10, step: 1, labels: [0, 5, 10], blankLabels: [0, 5, 10], width: 600, height: 84 }), width });

module.exports = {
  id: '2-2',
  title: 'Round Multi-Digit Numbers',
  pages: '37–42',
  bookNote: 'Includes the Math Probe on rounding (pp. 41–42).',
  goal: 'I can round a number to the nearest 10 or nearest 100 using a number line or place value.',
  vocab: [
    ['round', 'Find a ten or hundred that is close to a number. We round to tell “about how many.”'],
    ['nearest ten', 'The ten that is closest: 127 rounded to the nearest ten is 130.'],
    ['nearest hundred', 'The hundred that is closest: 127 rounded to the nearest hundred is 100.'],
    ['halfway point', 'The number exactly in the middle of two tens or hundreds: 125 is halfway between 120 and 130.'],
    ['round up / round down', 'Move to the greater ten or hundred (up) or the lesser one (down).'],
  ],
  teach: [
    'Name the two tens (or hundreds) the number is between. 364 is between 360 and 370, and between 300 and 400.',
    '**Number line:** label the two ends and the halfway point. Place the number. It rounds to the end it is closer to.',
    '**Place value:** underline the place you are rounding to. Look at the digit just to its right. If it is **5 or more**, round up. If it is **less than 5**, round down. The digits after the rounding place become 0.',
    'A number exactly on the halfway point (like 125 or 650) rounds **up**.',
    'In word problems, round each number to find “about how many” before deciding.',
  ],
  tip: 'Ask, “Which two tens is it between? Which one is it closer to?” The number line explains why the 5-or-more rule works.',
  examples: [
    {
      title: 'Example 1: Number line, nearest 10',
      body: [
        { diagram: numberLine({ from: 360, to: 370, step: 1, labels: [360, 365, 370], marks: [{ v: 364, dot: true, label: '364' }], width: 520, height: 84 }), width: 3.2 },
        '364 is between 360 and 370. The halfway point is 365.',
        '364 is to the **left** of halfway, so it rounds to **360**.',
      ],
    },
    {
      title: 'Example 2: Number line, nearest 100',
      body: [
        { diagram: numberLine({ from: 300, to: 400, step: 10, labels: [300, 350, 400], marks: [{ v: 364, dot: true, label: '364' }], width: 520, height: 84 }), width: 3.2 },
        '364 is between 300 and 400. The halfway point is 350.',
        '364 is to the **right** of halfway, so it rounds to **400**.',
      ],
    },
    {
      title: 'Example 3: Use place value',
      body: [
        'Round 58**3** to the nearest 10. Look at the ones digit: 3 is less than 5, so round down → **580**.',
        'Round 5**8**3 to the nearest 100. Look at the tens digit: 8 is 5 or more, so round up → **600**.',
      ],
    },
    {
      title: 'Example 4: Which numbers round to it?',
      body: [
        'Which numbers round to 450 (nearest 10)?',
        'Every number from **445 to 454**. 445 is the halfway point, so it rounds up to 450. 455 rounds up to 460.',
      ],
    },
  ],
  checklist: [
    'Find the two tens or hundreds a number is between.',
    'Round to the nearest 10 using a number line.',
    'Round to the nearest 100 using a number line.',
    'Round using the “5 or more, round up” rule.',
    'Find all the numbers that round to a given number.',
    'Use rounding to answer “about how many” questions.',
  ],

  together: [
    {
      text: 'Round **46** to the nearest 10. Fill in the boxes on the number line. Mark 46.',
      blocks: [blankLine(), { lines: ['46 rounded to the nearest 10 is'] }],
    },
    {
      text: 'Round **752** to the nearest 100. Underline the hundreds digit. Look at the digit to its right.',
      blocks: [{ lines: ['752 rounded to the nearest 100 is'] }],
    },
    {
      text: 'Mia rounds 345 to 350. Leo rounds 345 to 300. Why are their rounded numbers different?',
      blocks: [{ lines: ['', ''] }],
    },
  ],
  own: [
    {
      text: 'Use a number line. Round **83** to the nearest 10.',
      blocks: [blankLine(), { lines: ['83 rounded to the nearest 10 is'] }],
    },
    {
      text: 'Use a number line. Round **517** to the nearest 100.',
      blocks: [blankLine(), { lines: ['517 rounded to the nearest 100 is'] }],
    },
    { half: true, text: 'Round **65** to the nearest 10.', blocks: [{ lines: [''] }] },
    { half: true, text: 'Round **384** to the nearest 10.', blocks: [{ lines: [''] }] },
    { half: true, text: 'Round **249** to the nearest 100.', blocks: [{ lines: [''] }] },
    { half: true, text: 'Round **951** to the nearest 100.', blocks: [{ lines: [''] }] },
    {
      text: 'Round to the nearest 10. Circle **all** the numbers that round to **470**. Explain your choices.',
      blocks: [{ p: '468      474      465      476      462      475      471', size: 28, bold: true }, { lines: ['', ''] }],
    },
    {
      text: 'Ben says that 735 rounded to the nearest 10 is 730. Do you agree? Explain.',
      blocks: [{ lines: ['', ''] }],
    },
    {
      text: 'A pet store has 34 goldfish, 18 turtles, 26 hamsters, 41 birds, and 22 rabbits. Which animals does the store have **about 20** of?',
      blocks: [{ lines: ['', ''] }],
    },
    {
      text: 'Lily has $60. She wants a book for $24, a game for $18, and a puzzle for $13. Round each price to the nearest 10. About how much will she spend? Does she have enough money?',
      blocks: [{ space: 0.5 }, { lines: ['', ''] }],
    },
  ],
  answers: {
    together: [
      { a: ['Boxes: **40, 45, 50**. 46 is to the right of 45, closer to 50. Answer: **50**'] },
      { a: ['7**5**2: the tens digit is 5, so round up. Answer: **800**'] },
      { a: ['Mia rounded to the **nearest 10** (345 is halfway between 340 and 350, so it rounds up to 350). Leo rounded to the **nearest 100** (345 is less than 350, so it rounds down to 300).'], note: 'Accept any answer that says they rounded to different places.' },
    ],
    own: [
      { a: ['Boxes: **80, 85, 90**. 83 is left of 85. Answer: **80**'] },
      { a: ['Boxes: **500, 550, 600**. 517 is left of 550. Answer: **500**'] },
      { a: ['**70**'], note: 'Ones digit is 5, so round up.' },
      { a: ['**380**'], note: 'Ones digit 4 is less than 5.' },
      { a: ['**200**'], note: 'Tens digit 4 is less than 5. A common mistake is rounding 249 → 250 → 300.' },
      { a: ['**1,000**'], note: '951 is between 900 and 1,000; the tens digit 5 means round up.' },
      { a: ['Circle **468, 474, 465, 471**.'], note: 'Numbers from 465 to 474 round to 470. 475 and 476 round to 480; 462 rounds to 460. Accept a number line or place-value explanation.' },
      { a: ['**No.** The ones digit is 5, so 735 rounds **up** to **740**.'], note: '735 is exactly halfway between 730 and 740, and halfway numbers round up.' },
      { a: ['**Turtles and rabbits.** 18 → 20 and 22 → 20.'], note: 'Goldfish → 30, hamsters → 30, birds → 40.' },
      { a: ['$24 → $20, $18 → $20, $13 → $10. About **$50**. **Yes**, she has enough because $50 is less than $60.'], note: 'The exact total is $55, which is also less than $60. Accept a check with exact numbers too.' },
    ],
  },
};
