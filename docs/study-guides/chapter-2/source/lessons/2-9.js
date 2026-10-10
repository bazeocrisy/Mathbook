const { barDiagram, hopLine } = require('../diagrams');

const related = expr => ({ half: true, text: 'Write a related addition equation. Then solve.', blocks: [{ p: expr, size: 28 }, { space: 0.2 }, { lines: ['Addition equation', 'Answer'] }] });
const diff = expr => ({ half: true, text: 'Use addition to find the difference.', blocks: [{ p: expr, size: 28 }, { space: 0.65 }] });

module.exports = {
  id: '2-9',
  title: 'Use Addition to Subtract',
  pages: '67–70',
  bookNote: 'The book shows 575 − 246 = ? and 246 + ? = 575 with one bar diagram.',
  goal: 'I can use a bar diagram and a related addition equation to solve a subtraction problem.',
  vocab: [
    ['bar diagram', 'A drawing with bars that shows the whole and its parts.'],
    ['whole / part', 'The whole is the total amount. The parts are the amounts that make up the whole.'],
    ['unknown', 'The number we do not know yet. We write it as ?.'],
    ['addend', 'A number you add. In 248 + ? = 563, the ? is an unknown addend.'],
    ['related equations', 'Equations that use the same three numbers, like 563 − 248 = 315 and 248 + 315 = 563.'],
    ['count up', 'Start at the part and add jumps until you reach the whole.'],
  ],
  teach: [
    'Draw a bar diagram: the **whole** is the long bar on top. The known **part** is below it. The dashed piece with **?** is the part you need.',
    'Write the subtraction: whole − part = ?. Then write the related addition: part + ? = whole.',
    'Solve the addition by **counting up** from the part: jump to the next ten, then to the next hundred, then to the whole. Add all the jumps.',
    'Check: part + answer should equal the whole.',
    'Watch for adding the two numbers (the answer would be bigger than the whole). Ask, “Can the answer be bigger than the whole?”',
  ],
  tip: 'Ask, “Which number is the whole? What do you add to the part to get the whole?”',
  examples: [
    {
      title: 'Example 1: Bar diagram and related equations',
      body: [{ diagram: barDiagram({ whole: '563', part: '248', frac: 0.44 }), width: 2.9 }, '563 − 248 = ?   is the same as   248 + ? = 563'],
    },
    {
      title: 'Example 2: Count up to solve',
      body: [
        { diagram: hopLine({ points: [{ v: 248, at: 0 }, { v: 250, at: 0.22 }, { v: 300, at: 0.48 }, { v: 563, at: 1 }], hops: [{ from: 248, to: 250, label: '+2' }, { from: 250, to: 300, label: '+50' }, { from: 300, to: 563, label: '+263' }], width: 520, height: 104 }), width: 3.0 },
        '2 + 50 + 263 = **315**. Check: 248 + 315 = 563 ✓',
      ],
    },
    {
      title: 'Example 3: Subtract across zeros',
      body: ['400 − 153 = ? → 153 + ? = 400', 'Count up: 153 → 160 (+7) → 200 (+40) → 400 (+200).', '7 + 40 + 200 = **247**'],
    },
    {
      title: 'Example 4: Watch for these mistakes',
      body: ['To find 458 − 302, do **not** add 302 + 458. Solve 302 + ? = 458 → **156**.', '452 − ? = 237: the missing number is a part. Solve 237 + ? = 452 → **215**.'],
    },
  ],
  checklist: [
    'Fill in a bar diagram for a story.',
    'Write a related addition equation for a subtraction.',
    'Count up to find an unknown addend.',
    'Count up across zeros (like 400 − 153).',
    'Check a difference with addition.',
    'Explain why adding the two numbers is wrong.',
  ],

  together: [
    { text: 'Write a related addition equation for **584 − 342 = ?**. Then count up to solve.', blocks: [{ space: 0.35 }, { lines: ['Addition equation', 'Answer'] }] },
    {
      text: 'A book has 500 pages. Ben has read 263 pages. How many pages are left? Label the bar diagram. Then write an addition equation and solve.',
      blocks: [{ diagram: barDiagram({ frac: 0.55 }), width: 3.6 }, { space: 0.15 }, { lines: ['Equation', 'Pages left'] }],
    },
    { text: 'Lila wants to use addition to solve 728 − 315 = ?. How can you explain her strategy? What is the answer?', blocks: [{ lines: ['', 'Answer'] }] },
  ],
  own: [
    related('847 − 413 = ?'),
    related('300 − 162 = ?'),
    related('936 − 255 = ?'),
    { half: true, text: 'Omar adds 205 + 638 to find 638 − 205. How can you help him use addition the right way?', blocks: [{ lines: ['', '', ''] }] },
    {
      text: 'On Saturday, 468 people visited the zoo. On Sunday, 735 people visited. How many more people visited on Sunday?',
      blocks: [{ row: [[{ p: '**a.** Label the bar diagram.', size: 24 }, { diagram: barDiagram({ frac: 0.62, width: 420 }), width: 2.9 }], [{ p: '**b.** Write an equation with an unknown. Solve.', size: 24 }, { space: 0.2 }, { lines: ['Equation', 'Answer'] }]] }],
    },
    diff('590 − 347 = ______'),
    diff('______ = 600 − 274'),
    diff('804 − 368 = ______'),
    diff('321 − 156 = ______'),
    { half: true, text: 'Mia and Jo picked 400 apples in all. Mia picked 186 apples. How many apples did Jo pick?', blocks: [{ space: 0.6 }, { lines: ['Apples'] }] },
    { half: true, text: 'A club has $900 for a trip. The bus costs $638. How much money is left?', blocks: [{ space: 0.6 }, { lines: ['Money left'] }] },
    { text: 'Ray says he can solve 563 − ? = 327 by finding 563 + 327. Do you agree? Explain.', blocks: [{ lines: ['', ''] }] },
  ],
  answers: {
    together: [
      { a: ['**342 + ? = 584**. Count up: 342 → 384 (+42) → 584 (+200). Answer: **242**'], note: 'Also accept ? + 342 = 584. Any correct counting-up jumps are fine.' },
      { a: ['Whole bar: **500**. Part bar: **263**. ?: pages left.', '263 + ? = 500. 263 → 270 (+7) → 300 (+30) → 500 (+200). **237** pages'] },
      { a: ['Think 315 + ? = 728: what do you add to 315 to get 728? Count up: 315 → 328 (+13) → 728 (+400). Answer: **413**'], note: 'Accept any explanation that turns the subtraction into “part + ? = whole.”' },
    ],
    own: [
      { a: ['413 + ? = 847 → **434**'], note: 'Items 1–3: also accept ? + 413 = 847, etc.' },
      { a: ['162 + ? = 300 → **138**'], note: '162 → 170 (+8) → 200 (+30) → 300 (+100).' },
      { a: ['255 + ? = 936 → **681**'] },
      { a: ['Adding makes a number bigger than 638, the whole. He should solve 205 + ? = 638. Answer: **433**.'] },
      { a: ['a. Whole (long bar): **735**. Part: **468**. ?: how many more.', 'b. 468 + ? = 735 (or 735 − 468 = ?). Answer: **267**'] },
      { a: ['**243**  (347 + 243 = 590)'], note: 'Items 6–9: check each answer by adding it to the smaller number.' },
      { a: ['**326**  (274 + 326 = 600)'] },
      { a: ['**436**  (368 + 436 = 804)'] },
      { a: ['**165**  (156 + 165 = 321)'] },
      { a: ['186 + ? = 400 → **214** apples'] },
      { a: ['638 + ? = 900 → **$262**'] },
      { a: ['**No.** 563 is the whole, so the missing number is a part: 327 + ? = 563. Answer: **236**. 563 + 327 = 890 is bigger than the whole.'] },
    ],
  },
};
