const { ppwBar, barDiagram } = require('../diagrams');

const story = (text, space = 1.0, label = 'Answer') => ({ text, blocks: [{ space }, { lines: [label] }] });

module.exports = {
  id: '2-12',
  title: 'Solve Two-Step Problems Involving Addition and Subtraction',
  pages: '79–82',
  bookNote: 'The book solves Lea’s points problem in two steps: 235 + 112 = a, then 475 − 347 = b.',
  goal: 'I can solve two-step word problems by drawing bar diagrams and writing an equation with a letter for each unknown.',
  vocab: [
    ['two-step problem', 'A word problem that needs two equations to solve.'],
    ['unknown', 'The number we do not know yet.'],
    ['letter for the unknown', 'A letter like a or b that stands for the unknown number: 246 + 131 = a.'],
    ['bar diagram', 'Bars that show the parts and the whole. A dashed bracket shows the unknown.'],
    ['equation', 'A number sentence with an equal sign, like 500 − 377 = b.'],
  ],
  teach: [
    'Read the problem. Ask, “What do we know? What do we need to find?”',
    '**Step 1:** find the hidden number first (often a total). Draw a bar diagram and write an equation with a letter.',
    '**Step 2:** use the Step 1 answer to answer the question. Draw a second diagram and equation with a new letter.',
    'Letters can be on either side of the equal sign: 812 = 345 + k means the same as 345 + k = 812.',
    'Check that the answer makes sense and that you answered the question that was asked.',
  ],
  tip: 'Watch for stopping after one step, and for “more than” stories: “Raj has 128 more than Kim” means Raj has Kim’s amount plus 128.',
  examples: [
    {
      title: 'Example 1: Step 1, find the total',
      body: ['Max has 246 stickers and gets 131 more. He needs 500 to fill his album. How many more does he need?', { diagram: ppwBar({ parts: [246, 131], sizes: [246, 131], whole: 'a', caption: 'stickers he has', width: 440 }), width: 2.7 }, '246 + 131 = a, so a = **377**'],
    },
    {
      title: 'Example 2: Step 2, compare with what is needed',
      body: [{ diagram: barDiagram({ whole: '500', part: '377', frac: 0.75, q: 'b', width: 440 }), width: 2.7 }, '500 − 377 = b, so b = **123**. Max needs 123 more stickers.'],
    },
    {
      title: 'Example 3: Spend two times',
      body: ['Ben has $215. He spends $148 and then $19. How much is left?', '215 − 148 = c, c = 67.  67 − 19 = d, d = **48**. Ben has $48 left.'],
    },
    {
      title: 'Example 4: “More than,” then together',
      body: ['Kim has 215 shells. Raj has 128 more than Kim. How many do they have together?', '215 + 128 = r, r = 343 (Raj).  215 + 343 = t, t = **558**.'],
    },
  ],
  checklist: [
    'Write an equation for a bar diagram.',
    'Draw a bar diagram for an equation.',
    'Use a letter for an unknown on either side of =.',
    'Solve two-step add-then-subtract problems.',
    'Solve “more than” and “spend two times” problems.',
    'Work backward from what is left.',
  ],

  together: [
    { text: 'Write an equation for the bar diagram. Then solve.', blocks: [{ diagram: ppwBar({ parts: [320, 455], sizes: [320, 455], whole: 'a', bracket: 'below', width: 440 }), width: 3.0 }, { lines: ['Equation', 'a ='] }] },
    { text: 'A class collected 276 cans one week and 418 cans the next week. They gave 350 cans to a food bank. How many cans are left? Write an equation with a letter for each step.', blocks: [{ space: 0.6 }, { lines: ['Step 1', 'Step 2', 'Cans left'] }] },
    { text: 'Draw a bar diagram for the equation. Then find b.', blocks: [{ p: '702 − b = 354', size: 28 }, { space: 0.9 }, { lines: ['b ='] }] },
  ],
  own: [
    { half: true, text: 'Write an equation for the bar diagram. Solve.', blocks: [{ diagram: ppwBar({ parts: [280, 435], sizes: [280, 435], whole: 'a', bracket: 'below', width: 400 }), width: 2.7 }, { lines: ['Equation', 'a ='] }] },
    { half: true, text: 'Write an equation for the bar diagram. Solve.', blocks: [{ diagram: barDiagram({ whole: '836', part: '609', frac: 0.73, q: 'b', width: 400 }), width: 2.7 }, { lines: ['Equation', 'b ='] }] },
    { half: true, text: 'Draw a bar diagram for the equation. Solve.', blocks: [{ p: '803 − b = 347', size: 28 }, { space: 0.9 }, { lines: ['b ='] }] },
    { half: true, text: 'Draw a bar diagram for the equation. Solve.', blocks: [{ p: '300 + a = 820', size: 28 }, { space: 0.9 }, { lines: ['a ='] }] },
    story('Together, Lena and Max biked 326 miles in May and 488 miles in June. Lena biked 439 of the miles. How many miles did Max bike? Use letters for the unknowns.', 0.9, 'Max biked'),
    story('Jo has $164. She buys a game for $118 and a book for $27. How much money does she have left?', 0.8, 'Money left'),
    story('Ana has 214 stamps. Leo has 165 more stamps than Ana. How many stamps do they have together?', 0.8, 'Stamps together'),
    { half: true, text: 'Solve for the unknown.', blocks: [{ p: 'm = 674 − 352', size: 28 }, { space: 0.5 }, { lines: ['m ='] }] },
    { half: true, text: 'Solve for the unknown.', blocks: [{ p: '905 = 467 + k', size: 28 }, { space: 0.5 }, { lines: ['k ='] }] },
    story('A juice stand made 263 cups of juice in the morning and some more in the afternoon. It sold 512 cups, and 46 cups were left. How many cups did it make in the afternoon?', 0.9, 'Afternoon cups'),
    story('A store has 9 boxes of crayons. Each box has 100 crayons. The store sells 3 boxes on Monday and 4 boxes on Tuesday. How many crayons are left to sell?', 0.7, 'Crayons left'),
    { text: 'Write a two-step word problem that this bar diagram could show. Then find t.', blocks: [{ diagram: ppwBar({ parts: [208, 315, 146], sizes: [208, 315, 146], whole: 't', bracket: 'below', width: 440 }), width: 3.0 }, { lines: ['', '', 't ='] }] },
  ],
  answers: {
    together: [
      { a: ['320 + 455 = a. **a = 775**'] },
      { a: ['Step 1: 276 + 418 = a, a = 694. Step 2: 694 − 350 = b, **b = 344** cans left.'], note: 'Any letters are fine. Watch for stopping at 694.' },
      { a: ['Whole bar 702; parts 354 and b. **b = 348**'], note: 'Accept any diagram that shows 702 as the whole and 354 and b as the parts.' },
    ],
    own: [
      { a: ['280 + 435 = a. **a = 715**'] },
      { a: ['836 − 609 = b (or 609 + b = 836). **b = 227**'] },
      { a: ['Whole 803; parts 347 and b. **b = 456**'], note: 'Items 3–4: accept any correct part-part-whole or compare diagram.' },
      { a: ['Whole 820; parts 300 and a. **a = 520**'] },
      { a: ['326 + 488 = a, a = 814. 814 − 439 = b, **b = 375** miles.'] },
      { a: ['164 − 118 = c, c = 46. 46 − 27 = d, **d = $19**.'], note: 'Also accept 118 + 27 = 145, then 164 − 145 = 19.' },
      { a: ['214 + 165 = L, L = 379 (Leo). 214 + 379 = t, **t = 593** stamps.'], note: 'A common mistake is 214 + 165 = 379 as the final answer.' },
      { a: ['**m = 322**'] },
      { a: ['**k = 438**'], note: '467 + k = 905: count up 467 → 500 (+33) → 905 (+405) = 438.' },
      { a: ['512 + 46 = c, c = 558 cups made in all. 558 − 263 = a, **a = 295** cups.'], note: 'Work backward: sold + left = everything made.' },
      { a: ['9 boxes = 900 crayons. 900 − 300 − 400 = **200** crayons.'], note: 'Also accept 9 − 3 − 4 = 2 boxes = 200 crayons. The answer must be in crayons, not boxes.' },
      { a: ['Sample: “A farm picked 208 apples on Monday and 315 on Tuesday. On Wednesday it picked 146 more. How many apples did it pick in all?” 208 + 315 = a, a = 523; 523 + 146 = t, **t = 669**'], note: 'Accept any two-step story that joins the three amounts.' },
    ],
  },
};
