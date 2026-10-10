module.exports = {
  id: '2-6',
  title: 'Use Partial Sums to Add',
  pages: '55–58',
  bookNote: 'The book adds 367 + 145 with partial sums written in a row and stacked.',
  goal: 'I can break apart addends by place value, add the partial sums, and show my work in a row or stacked.',
  vocab: [
    ['decompose', 'Break apart a number by place value: 367 = 300 + 60 + 7.'],
    ['addend', 'A number you add.'],
    ['partial sum', 'The sum of one place: the hundreds, the tens, or the ones. 300 + 100 = 400 is a partial sum.'],
    ['sum', 'The answer when you add all the partial sums.'],
    ['stack', 'Write the numbers one under the other, lining up the places.'],
  ],
  teach: [
    'Say each addend in expanded form: 368 is 300 + 60 + 8; 154 is 100 + 50 + 4.',
    'Add the hundreds, then the tens, then the ones. Each answer is a **partial sum**: 400, 110, 12.',
    'Add the partial sums to find the sum: 400 + 110 + 12 = 522.',
    'Show it **in a row** (equations) or **stacked** (labels on the left, partial sums on the right). The sum is the same either way because the parts are the same.',
    'To work backward, the first number in each partial-sum equation builds one addend, and the second number builds the other.',
  ],
  tip: 'Ask, “What is this digit worth?” and “Did you add every partial sum?” Watch for children who stop at the hundreds or write 12 as just 2.',
  examples: [
    { title: 'Example 1: Partial sums in a row', body: [{ psum: { nums: [368, 154], mode: 'row' } }] },
    { title: 'Example 2: Stacked partial sums', body: [{ psum: { nums: [368, 154], mode: 'stacked' } }] },
    {
      title: 'Example 3: Work backward',
      body: ['400 + 200 = 600,  30 + 50 = 80,  1 + 7 = 8', 'First numbers: 400, 30, 1 → **431**. Second numbers: 200, 50, 7 → **257**.', 'So the equation was 431 + 257 = 688.'],
    },
    {
      title: 'Example 4: Watch for this mistake',
      body: ['406 + 237 → partial sums 600, 30, 13.', 'The sum is **not** 600. 600 is only the hundreds. 600 + 30 + 13 = **643**.'],
    },
  ],
  checklist: [
    'Break apart a 3-digit number by place value.',
    'Find partial sums in a row.',
    'Find partial sums stacked.',
    'Explain why both ways give the same sum.',
    'Find the addends from the partial sums.',
    'Spot a mistake, like stopping at the hundreds.',
  ],

  together: [
    { text: 'Break apart each addend. Find the partial sums in a row. Then find the sum.', blocks: [{ psum: { nums: [256, 318], mode: 'row', show: false } }] },
    { text: 'Stack the addends. Find the partial sums. Then find the sum.', blocks: [{ psum: { nums: [427, 165], mode: 'stacked', show: false } }] },
    { text: 'Kai adds 518 + 341. His partial sums are 800, 50, and 9. Kai says the sum is 800. Do you agree? Explain.', blocks: [{ lines: ['', ''] }] },
  ],
  own: [
    { half: true, text: 'Use partial sums in a row.', blocks: [{ psum: { nums: [358, 426], mode: 'row', show: false, width: 4300 }, size: 24 }] },
    { half: true, text: 'Use stacked partial sums.', blocks: [{ psum: { nums: [615, 273], mode: 'stacked', show: false }, size: 26 }] },
    { half: true, text: 'Use stacked partial sums.', blocks: [{ psum: { nums: [539, 247], mode: 'stacked', show: false }, size: 26 }] },
    { half: true, text: 'Use partial sums in a row.', blocks: [{ psum: { nums: [264, 189], mode: 'row', show: false, width: 4300 }, size: 24 }] },
    {
      text: 'Nia used partial sums. Look at her work. Which two numbers did she add? How do you know?',
      blocks: [{ row: [[{ p: '300 + 400 = 700', size: 26 }, { p: '20 + 50 = 70', size: 26 }, { p: '5 + 3 = 8', size: 26 }, { p: '700 + 70 + 8 = 778', size: 26 }], [{ space: 0.2 }, { p: '________ + ________ = 778', size: 26 }, { lines: ['', ''] }]] }],
    },
    { text: 'A library lent 186 books on Monday. It lent the same number of books on Tuesday. How many books did it lend in the two days?', blocks: [{ space: 1.0 }, { lines: ['Books'] }] },
    {
      text: 'Find the sum in a different way. The work in a row is shown. Show it stacked.',
      blocks: [{ row: [[{ psum: { nums: [352, 436], mode: 'row' }, size: 24 }], [{ psum: { nums: [352, 436], mode: 'stacked', show: false }, size: 24 }]] }],
    },
    { text: 'Max adds 457 + 231. He adds 400 + 200 = 600 and writes 457 + 231 = 600. Explain his mistake. What is the correct sum?', blocks: [{ space: 0.4 }, { lines: ['', 'Sum'] }] },
    { text: 'How can you find 213 + 342 + 125 using partial sums? Show your work.', blocks: [{ space: 1.3 }, { lines: ['Sum'] }] },
  ],
  answers: {
    together: [
      { a: ['200 + 300 = 500;  50 + 10 = 60;  6 + 8 = 14', '500 + 60 + 14 = **574**'] },
      { a: ['400 + 100 = 500;  20 + 60 = 80;  7 + 5 = 12', '500 + 80 + 12 = **592**'] },
      { a: ['**No.** 800 is only the hundreds partial sum. Add all three: 800 + 50 + 9 = **859**.'] },
    ],
    own: [
      { a: ['300 + 400 = 700;  50 + 20 = 70;  8 + 6 = 14;  sum **784**'], note: 'Items 1–4: the two numbers on each line may be in either order.' },
      { a: ['600 + 200 = 800;  10 + 70 = 80;  5 + 3 = 8;  sum **888**'] },
      { a: ['500 + 200 = 700;  30 + 40 = 70;  9 + 7 = 16;  sum **786**'] },
      { a: ['200 + 100 = 300;  60 + 80 = 140;  4 + 9 = 13;  sum **453**'] },
      { a: ['**325 + 453** = 778 (either order)'], note: 'The first numbers (300, 20, 5) make one addend and the second numbers (400, 50, 3) make the other. Accept any explanation that uses place value.' },
      { a: ['186 + 186: 100 + 100 = 200; 80 + 80 = 160; 6 + 6 = 12. 200 + 160 + 12 = **372** books'] },
      { a: ['Stacked: 352 + 436 → 300 + 400 = 700; 50 + 30 = 80; 2 + 6 = 8. Sum **788**'], note: 'The child should write the labels and partial sums in the stacked form, not just copy 788.' },
      { a: ['Max only added the hundreds. He forgot the tens (50 + 30 = 80) and ones (7 + 1 = 8). 600 + 80 + 8 = **688**.'] },
      { a: ['Hundreds: 200 + 300 + 100 = 600. Tens: 10 + 40 + 20 = 70. Ones: 3 + 2 + 5 = 10. 600 + 70 + 10 = **680**.'] },
    ],
  },
};
