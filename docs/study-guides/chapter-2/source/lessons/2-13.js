const { numberLine } = require('../diagrams');

const cmp = (a, b) => ({ p: `${a}   ◯   ${b}`, size: 30, bold: true });
const cmpItem = (a, b, text = 'Write <, >, or =.') => ({ half: true, text, blocks: [cmp(a, b), { space: 0.25 }] });
const why = (a, b, text) => ({ half: true, text, blocks: [cmp(a, b), { lines: ['', ''] }] });
const fmt = n => n.toLocaleString('en-US');
const range = (from, to, step) => { const r = []; for (let v = from; v <= to; v += step) r.push(v); return r; };

module.exports = {
  id: '2-13',
  title: 'Compare 4-Digit Numbers',
  pages: '83–86',
  bookNote: 'The book compares 1,324 and 1,249 with a number line and with place value.',
  goal: 'I can compare 4-digit numbers using a number line or place value, and write <, >, =, or ≠.',
  vocab: [
    ['compare', 'Decide which number is greater, which is less, or if they are equal.'],
    ['greater than (>)', '5,362 > 5,318 means 5,362 is greater than 5,318.'],
    ['less than (<)', '2,371 < 2,436 means 2,371 is less than 2,436.'],
    ['equal to (=)', 'The numbers are the same: every place has the same digit.'],
    ['not equal to (≠)', 'The numbers are different: at least one place has a different digit.'],
    ['place value', 'The value of a digit because of its place: thousands, hundreds, tens, ones.'],
  ],
  teach: [
    '**Number line:** numbers get greater to the right. Plot both numbers. The one farther right is greater.',
    '**Place value:** line up the numbers. Compare the thousands first. If they are the same, compare the hundreds, then the tens, then the ones.',
    'Stop at the **first** place where the digits are different. That place decides.',
    'A 3-digit number has 0 thousands, so any 4-digit number is greater: 3,158 > 958.',
    'Read the sentence aloud: “2,814 is less than 2,841.” The open side of < or > faces the greater number.',
  ],
  tip: 'Watch for numbers with the same digits in a different order (2,814 and 2,841). They are not equal. Compare place by place.',
  examples: [
    {
      title: 'Example 1: Use a number line',
      body: [{ diagram: numberLine({ from: 2000, to: 2500, step: 100, marks: [{ v: 2371, dot: true, label: '2,371' }, { v: 2436, dot: true, label: '2,436' }], width: 560, height: 84 }), width: 3.2 }, '2,436 is farther right, so **2,371 < 2,436**.'],
    },
    {
      title: 'Example 2: Use place value',
      body: [{ table: { head: ['', 'Th', 'H', 'T', 'O'], rows: [['5,362', '5', '3', '6', '2'], ['5,318', '5', '3', '1', '8']], width: 3600, size: 20, widths: [0.32, 0.17, 0.17, 0.17, 0.17] } }, 'Thousands and hundreds are the same. Tens: 6 > 1, so **5,362 > 5,318**.'],
    },
    { title: 'Example 3: Equal or not equal', body: ['6,207 and 6,270: the tens are different (0 and 7).', 'So **6,207 ≠ 6,270**. Also 6,207 < 6,270.'] },
    { title: 'Example 4: Different number of digits; order three', body: ['3,158 vs 958: think of 958 as 0,958. 3 thousands > 0 thousands, so **3,158 > 958**.', 'Order 4,572, 3,986, 4,519: **3,986 < 4,519 < 4,572**.'] },
  ],
  checklist: [
    'Plot two numbers on a number line and tell which is greater.',
    'Compare by place value, starting with the thousands.',
    'Use = and ≠ correctly.',
    'Write < and > correctly and read them aloud.',
    'Compare a 3-digit number with a 4-digit number.',
    'Order three numbers and solve “which is more” problems.',
  ],

  together: [
    { text: 'Which is greater? Write <, >, or =. Explain your thinking.', blocks: [cmp('6,384', '6,381'), { lines: ['', ''] }] },
    {
      text: 'Plot 1,450 and 1,720 on the number line. Then write <, >, or =.',
      blocks: [{ diagram: numberLine({ from: 1000, to: 2000, step: 100, labels: range(1000, 2000, 100), width: 720, height: 88 }), width: 6.2 }, cmp('1,450', '1,720'), { space: 0.1 }],
    },
    { text: 'Are the numbers equal or not equal? Write = or ≠. Explain.', blocks: [cmp('5,269', '5,296'), { lines: ['', ''] }] },
  ],
  own: [
    {
      text: 'Plot each number on the number line. Then write <, >, or =.',
      blocks: [cmp('6,500', '8,000'), { diagram: numberLine({ from: 0, to: 10000, step: 1000, labels: range(0, 10000, 1000), width: 760, height: 88 }), width: 6.3 }],
    },
    {
      text: 'Plot each number on the number line. Then write <, >, or =.',
      blocks: [cmp('2,945', '2,610'), { diagram: numberLine({ from: 2500, to: 3000, step: 50, labels: range(2500, 3000, 50), width: 760, height: 88 }), width: 6.3 }],
    },
    why('7,316', '7,316', 'Write = or ≠. Explain.'),
    why('4,052', '4,025', 'Write = or ≠. Explain.'),
    why('6,215', '5,980', 'Write < or >. Explain.'),
    why('9,412', '9,705', 'Write < or >. Explain.'),
    cmpItem('2,567', '567'),
    cmpItem('4,728', '4,782'),
    cmpItem('3,602', '3,606'),
    cmpItem('836', '1,059'),
    { text: 'Oak School has 1,850 books. Pine School has 1,792 books. Which school has more books? How do you know?', blocks: [{ lines: ['', ''] }] },
    { text: 'Order these numbers from **least** to **greatest**: 5,302   4,999   5,230', blocks: [{ space: 0.3 }, { lines: [''] }] },
  ],
  answers: {
    together: [
      { a: ['**6,384 > 6,381**'], note: 'Thousands, hundreds, and tens are the same. Ones: 4 > 1.' },
      { a: ['1,450 is halfway between 1,400 and 1,500; 1,720 is between 1,700 and 1,800. **1,450 < 1,720**'], note: 'Accept dots placed close to the right spots; 1,720 must be to the right of 1,450.' },
      { a: ['**5,269 ≠ 5,296**'], note: 'Thousands and hundreds match, but the tens are different (6 and 9). Also 5,269 < 5,296.' },
    ],
    own: [
      { a: ['6,500 halfway between 6,000 and 7,000; 8,000 on its tick. **6,500 < 8,000**'] },
      { a: ['2,945 just left of 2,950; 2,610 just right of 2,600. **2,945 > 2,610**'], note: 'This line counts by 50s.' },
      { a: ['**7,316 = 7,316**'], note: 'Every place has the same digit.' },
      { a: ['**4,052 ≠ 4,025**'], note: 'Same digits, different places: the tens are 5 and 2. Also 4,052 > 4,025.' },
      { a: ['**6,215 > 5,980**'], note: 'Thousands: 6 > 5. The thousands decide, even though 980 > 215.' },
      { a: ['**9,412 < 9,705**'], note: 'Thousands are the same. Hundreds: 4 < 7.' },
      { a: ['**2,567 > 567**'], note: '567 has 0 thousands.' },
      { a: ['**4,728 < 4,782**'], note: 'Tens: 2 < 8.' },
      { a: ['**3,602 < 3,606**'], note: 'Ones: 2 < 6.' },
      { a: ['**836 < 1,059**'], note: '836 has 0 thousands.' },
      { a: ['**Oak School.** Thousands are the same (1). Hundreds: 8 > 7, so 1,850 > 1,792.'] },
      { a: ['**4,999 < 5,230 < 5,302**'], note: '4,999 has only 4 thousands. For 5,230 and 5,302, hundreds: 2 < 3.' },
    ],
  },
};
