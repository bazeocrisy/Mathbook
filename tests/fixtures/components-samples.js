// Sample questions and figures for every Chapter 2 shared component (DESIGN.md §3–§4).
// Used by tests/fixtures/components.html (browser) and tests/components.test.js (Node).
(function (root) {
  'use strict';
  const questions = [
    { id: 'blank', type: 'number', prompt: 'What number makes the equation true?', display: '436 + 217 = 217 + ___', answer: 436, skill: 's', explanation: 'Switching the order keeps the sum: 436.' },
    { id: 'anyorder', type: 'parts', prompt: 'Write a related addition equation for 728 − 315 = ?. Then solve it.', skill: 's', explanation: '315 + 413 = 728, so 728 − 315 = 413.',
      parts: [{ kind: 'num', label: 'First addend:', answer: 315, anyOrder: 'add' }, { kind: 'num', label: 'Second addend:', answer: 413, anyOrder: 'add' }, { kind: 'num', label: 'Whole (after =):', answer: 728 }] },
    { id: 'compact', type: 'parts', prompt: 'You round to the nearest ten. Which numbers round to 480? Choose all.', skill: 's', explanation: '475 to 484 round to 480.',
      parts: [{ kind: 'multi', label: 'Round to 480:', compact: true, choices: ['483', '487', '475', '471', '480', '485', '479', '474'], answer: ['483', '475', '480', '479'] },
        { kind: 'choice', label: 'Add or subtract?', compact: true, choices: ['Add', 'Subtract'], answer: 'Add' }] },
    { id: 'symbol', type: 'parts', prompt: 'Compare the numbers.', skill: 's', explanation: '4 thousands is more than 3 thousands.',
      parts: [{ kind: 'symbol', left: 4127, right: 3986, choices: ['<', '>', '='], answer: '>' }] },
    { id: 'pics', type: 'parts', prompt: 'Which number line shows that 482 − 240 has the same difference as 487 − 245?', skill: 's', explanation: 'Both gaps are 242 long.',
      figure: { fig: 'pics', items: [
        { label: 'A', fig: { fig: 'nline', lines: [{ min: 200, max: 500, major: [200, 300, 400, 500], below: [{ v: 200, text: '200' }, { v: 500, text: '500' }], bands: [{ from: 245, to: 487, text: '242' }] }, { min: 200, max: 500, major: [200, 300, 400, 500], below: [{ v: 200, text: '200' }, { v: 500, text: '500' }], bands: [{ from: 240, to: 482, text: '242' }] }] } },
        { label: 'B', fig: { fig: 'nline', lines: [{ min: 200, max: 500, major: [200, 300, 400, 500], below: [{ v: 200, text: '200' }, { v: 500, text: '500' }], bands: [{ from: 245, to: 487, text: '242' }] }, { min: 200, max: 500, major: [200, 300, 400, 500], below: [{ v: 200, text: '200' }, { v: 500, text: '500' }], bands: [{ from: 240, to: 492, text: '252' }] }] } }] },
      parts: [{ kind: 'choice', label: 'Number line', compact: true, choices: ['A', 'B'], answer: 'A' }] },
    { id: 'est', type: 'parts', prompt: 'Estimate 437 + 251. Round each number to the nearest hundred.', skill: 's', explanation: '437 → 400, 251 → 300, 400 + 300 = 700.',
      figure: { fig: 'arrows', a: 437, b: 251, op: '+', unknown: true },
      parts: [{ kind: 'num', label: '437 rounds to', answer: 400 }, { kind: 'num', label: '251 rounds to', answer: 300 }, { kind: 'num', label: 'Estimate', answer: 700 }] },
    { id: 'free', type: 'chain', preset: 'free', prompt: 'even + ___ = odd. Write one equation with 3-digit numbers that fits.', skill: 's', explanation: 'One even and one odd addend make an odd sum.',
      addends: [{ digits: 3, parity: 'even' }, { digits: 3, parity: 'odd' }] },
    { id: 'rows', type: 'chain', preset: 'rows', prompt: 'Add 367 + 145 with partial sums.', addends: [367, 145], skill: 's', explanation: '400 + 100 + 12 = 512.' },
    { id: 'rows3', type: 'chain', preset: 'rows', prompt: 'Add 241 + 306 + 132 with partial sums.', addends: [241, 306, 132], skill: 's', explanation: '600 + 70 + 9 = 679.' },
    { id: 'steps', type: 'chain', preset: 'steps', a: 362, b: 175, prompt: 'Break apart 175 to find 362 − 175.', skill: 's', explanation: '362 − 100 − 70 − 5 = 187.', hint: 'Take away the hundreds first.' },
    { id: 'given', type: 'chain', preset: 'steps', a: 674, b: 352, tree: { given: [300, 50, 2] }, prompt: 'Subtract 674 − 352 one part at a time.', skill: 's', explanation: '674 − 300 − 50 − 2 = 322.' },
    { id: 'trees', type: 'chain', preset: 'trees', n: 175, prompt: 'Break 175 apart in 2 different ways.', skill: 's', explanation: '100 + 70 + 5 and 165 + 10 both make 175.' },
    { id: 'frame', type: 'chain', prompt: 'Write a related addition equation for 728 − 315 = ?.', skill: 's', explanation: '315 + 413 = 728.',
      rows: [{ cells: [{ in: 'a', answer: 315, label: 'First addend' }, '+', '?', '=', { in: 'b', answer: 728, label: 'Whole' }] }], final: { label: '? =', answer: 413 } },
    { id: 'jump', type: 'chain', prompt: 'Write the equation for the jumps.', skill: 's', explanation: '37 + 48 = 85.',
      figure: { fig: 'nline', open: true, marks: [37, 40, 85], hops: [{ from: 37, to: 40, text: '+3' }, { from: 40, to: 85, text: '+45' }] },
      rows: [{ cells: [{ in: 'a', answer: 37, label: 'Start' }, '+', { in: 'b', answer: 48, label: 'Jump' }, '=', { in: 'c', answer: 85, label: 'End' }], commute: true }] },
    { id: 'adjadd', type: 'chain', preset: 'adjust', a: 248, b: 195, op: '+', prompt: 'Adjust the numbers to add 248 + 195.', skill: 's', explanation: '243 + 200 = 443.' },
    { id: 'adjsub', type: 'chain', preset: 'adjust', a: 364, b: 198, op: '−', prompt: 'Adjust the numbers to subtract 364 − 198.', skill: 's', explanation: '366 − 200 = 166.' },
    { id: 'adjone', type: 'chain', preset: 'adjust', a: 336, b: 457, op: '+', oneNumber: true, prompt: 'Change just one number, add, then fix the sum.', skill: 's', explanation: '336 + 460 = 796, and 796 − 3 = 793.' },
    { id: 'vadd', type: 'vcalc', op: '+', top: 2457, bottom: 1368, carries: true, prompt: 'Add. Regroup when you need to.', skill: 's', explanation: '2,457 + 1,368 = 3,825.' },
    { id: 'vadd5', type: 'vcalc', op: '+', top: 47586, bottom: 35927, carries: true, prompt: 'Add 47,586 + 35,927.', skill: 's', explanation: '47,586 + 35,927 = 83,513.' },
    { id: 'vsub', type: 'vcalc', op: '−', top: 58367, bottom: 23145, prompt: 'Subtract.', skill: 's', explanation: '58,367 − 23,145 = 35,222.' },
    { id: 'vrows', type: 'vcalc', op: '+', top: 367, bottom: 145, input: 'rows', prompt: 'Find the partial sums, then the sum.', skill: 's', explanation: '400 + 100 + 12 = 512.' },
    { id: 'vrows3', type: 'vcalc', op: '+', rows: [318, 204, 165], input: 'rows', notes: 'input', prompt: 'Write the place values, the partial sums, and the sum.', skill: 's', explanation: '600 + 70 + 17 = 687.' },
    { id: 'vblank', type: 'vcalc', op: '−', top: 4867, bottom: 2345, blanks: { top: ['T'], bottom: ['H'], result: ['Th'] }, prompt: 'Find the missing digits.', skill: 's', explanation: '4,867 − 2,345 = 2,522.' }
  ];

  const figures = [
    { fig: 'arrows', a: 312, b: 465, op: '+', to: [300, 500], result: 800, caption: 'Exact: 777. 800 is close.' },
    { fig: 'arrows', a: 224, b: 109, op: '+', to: [223, 110], result: 333, tags: ['−1', '+1'] },
    { fig: 'arrows', a: 333, b: 212, op: '−', to: [331, 210], result: 121, tags: ['−2', '−2'], reveal: 'arrows' },
    { fig: 'groupV', addends: [34, 50, 66], pair: [0, 2], look: true },
    { fig: 'groupV', addends: [34, 50, 66], pair: [0, 1] },
    { fig: 'counters', groups: [{ n: 5, kind: 'a', label: '5 purple circles' }, { n: 3, kind: 'b', label: '3 yellow squares' }], pairs: true, join: true },
    { fig: 'table', title: 'Seeds Planted', head: ['Day', 'Seeds'], rows: [['Monday', 29], ['Tuesday', 45], ['Wednesday', 71]] },
    { fig: 'table', title: 'Customers', head: ['Week', 'Mon', 'Tue', 'Wed', 'Thu'], rows: [['Week 1', 436, 378, 512, '?'], ['Week 2', 401, 389, 455, 470]] },
    { fig: 'nline', min: 300, max: 400, minor: 10, major: [300, 350, 400], below: [{ v: 300, text: '300' }, { v: 400, text: '400' }], points: [{ v: 320, text: 'A' }, { v: 326, text: 'B' }, { v: 380, text: 'C' }] },
    { fig: 'nline', open: true, marks: [37, 40, 85], hops: [{ from: 37, to: 40, text: '+3' }, { from: 40, to: 85, text: '+45' }] },
    { fig: 'nline', open: true, marks: [224, 230, 300, 333], hops: [{ from: 224, to: 230 }, { from: 230, to: 300 }, { from: 300, to: 333 }, { from: 333, to: 300 }] },
    { fig: 'nline', lines: [
      { min: 300, max: 400, minor: 10, major: [300, 400], below: [{ v: 300, text: '300' }, { v: 400, text: '400' }], bands: [{ from: 312, to: 335, text: '23 apart' }] },
      { min: 300, max: 400, minor: 10, major: [300, 400], below: [{ v: 300, text: '300' }, { v: 400, text: '400' }], bands: [{ from: 310, to: 333, text: '23 apart' }] }] },
    { fig: 'tree', n: 184, parts: [100, 80, 4] },
    { fig: 'tree', n: 184, parts: [153, 30, 1], alt: true },
    { fig: 'stack', rows: [367, 145], op: '+', partials: true },
    { fig: 'stack', rows: [2457, 1368], op: '+', carries: { T: 1, H: 1 }, focus: 'T', result: 'all' },
    { fig: 'stack', rows: [4867, 2345], op: '−', blanks: { top: ['T'], result: ['Th'] } },
    { fig: 'stack', rows: [4526, 312], op: '+', misalign: 'left' },
    { fig: 'bar', kind: 'ppw', parts: [248, { slot: 'A' }], sizes: [248, 315], whole: 563, caption: 'miles in all' },
    { fig: 'bar', kind: 'cmp', long: 575, short: 246, gap: '?', sizes: [575, 246] },
    { fig: 'bar', kind: 'ppw', parts: [{ letter: 'a' }, 131, 22], sizes: [246, 131, 22], whole: '?', bracket: 'below', small: true },
    { fig: 'cmp', a: 4127, b: 986, focus: 'Th' },
    { fig: 'cmp', a: 4127, b: 4196, focus: 'T' }
  ];
  root.FX = { questions, figures };
})(typeof window !== 'undefined' ? window : globalThis);
