// Test-only lesson: the Chapter 2 controls running inside the real lesson engine (Learn, Practice Together,
// On My Own, Take a Test, My Results). Driven by tests/components.browser.mjs. Not in the catalog.
(function () {
  'use strict';
  const MB = window.Mathbook;
  const { pv } = MB;
  const fig = MB.fig;
  const base = (o) => Object.assign({ explanation: 'Here is how the answer works, step by step.' }, o);
  const stepsQ = (id, a, b) => base({ id, type: 'chain', preset: 'steps', a, b, prompt: `Break apart ${pv.fmt(b)} to find ${pv.fmt(a)} − ${pv.fmt(b)}.`, skill: 'decompose', hint: 'Take away the hundreds first.' });
  const vaddQ = (id, top, bottom) => base({ id, type: 'vcalc', op: '+', top, bottom, carries: true, prompt: 'Add. Start with the ones.', skill: 'add' });
  const L = {
    storageKey: 'mathbook:v2:fx-ch2',
    number: 'FX', chapter: 2, chapterTitle: 'Test fixture', title: 'Chapter 2 components', subtitle: 'Fixture lesson',
    objective: 'Use the shared Chapter 2 controls.',
    seeIt: {
      steps: [
        { id: 'dsub', kind: 'slides', title: 'Decompose to subtract', explain: 'Break apart the number you take away.',
          slides: [fig.html({ fig: 'tree', n: 184, parts: [100, 80, 4] }), fig.html({ fig: 'stack', rows: [367, 145], op: '+', partials: true })],
          check: (r) => stepsQ('ls1', pv.randInt(r, 300, 899), pv.randInt(r, 111, 299)) },
        { id: 'alg', kind: 'slides', title: 'Add in columns', explain: 'Start with the ones.',
          slides: [fig.html({ fig: 'stack', rows: [2457, 1368], op: '+', carries: { T: 1, H: 1 }, result: 'all' })],
          check: (r) => vaddQ('ls2', pv.randInt(r, 1000, 4999), pv.randInt(r, 1000, 4999)) },
        { id: 'remind', kind: 'slides', title: 'Remind me', explain: 'A step to read, with no check.',
          slides: ['<p>Part one.</p>', '<p>Part two.</p>'] }
      ],
      reflection: { prompt: 'Which control did you like?' }
    },
    guidedContext: { title: 'The story', text: 'A shop counts customers each week.', figure: { fig: 'table', title: 'Customers', head: ['Week', 'Customers'], rows: [[1, 436], [2, 378]] } },
    guided: [
      base({ id: 'g1', type: 'chain', preset: 'adjust', a: 248, b: 195, op: '+', prompt: 'Adjust the numbers to add 248 + 195.', skill: 'adjust', hint: 'Make 195 a hundred.' }),
      vaddQ('g2', 2457, 1368),
      base({ id: 'g3', type: 'parts', prompt: 'Compare.', skill: 'compare', parts: [{ kind: 'symbol', left: 4127, right: 3986, choices: ['<', '>', '='], answer: '>' }] })
    ],
    bank: [
      base({ id: 'b1', type: 'chain', preset: 'rows', addends: [367, 145], prompt: 'Add with partial sums.', skill: 'add' }),
      base({ id: 'b2', type: 'vcalc', op: '−', top: 4867, bottom: 2345, blanks: { top: ['T'], result: ['Th'] }, prompt: 'Find the missing digits.', skill: 'add' }),
      base({ id: 'b3', type: 'chain', preset: 'trees', n: 175, prompt: 'Break 175 apart in 2 different ways.', skill: 'decompose' })
    ],
    bankSets: [{ id: 's1', title: 'Mixed', blurb: 'One of each.', ids: ['b1', 'b2', 'b3'] }],
    skills: { decompose: 'Decompose to subtract', add: 'Add in columns', adjust: 'Adjust to add', compare: 'Compare numbers', '2-1': 'Represent numbers', '2-7': 'Lesson 2-7 skill' },
    skillLinks: { '2-1': '../../../curriculum/chapter-2/lesson-2-1/#menu', '2-7': '' },
    tests: {
      math: { title: 'Fixture Test', blurb: 'Four questions.', questions: 4,
        generate: (seed) => {
          const r = pv.rng(seed);
          return [
            Object.assign(stepsQ('t1', pv.randInt(r, 300, 899), pv.randInt(r, 111, 299)), { hint: undefined }),
            vaddQ('t2', pv.randInt(r, 1000, 4999), pv.randInt(r, 1000, 4999)),
            base({ id: 't3', type: 'chain', preset: 'adjust', a: 364, b: 198, op: '−', prompt: 'Adjust to subtract 364 − 198.', skill: '2-1' }),
            base({ id: 't4', type: 'parts', prompt: 'Write the related addition equation for 728 − 315 = ?.', skill: '2-7',
              parts: [{ kind: 'num', label: 'First addend:', answer: 315, anyOrder: 'g' }, { kind: 'num', label: 'Second addend:', answer: 413, anyOrder: 'g' }, { kind: 'num', label: 'Whole:', answer: 728 }] })
          ];
        } }
    },
    parentLearn: { goal: ['Try the controls.'], words: [{ term: 'chain', meaning: 'rows of equations' }], demonstrate: ['Show one.'], ask: ['Which one?'], checklist: ['Done.'] },
    mistakes: ['None.']
  };
  MB.lessons = MB.lessons || {};
  MB.lessons['fx-ch2'] = L;
})();
