/*
 * Mathbook — Number Words, Phase 2: Numbers 11–20.
 * Teaching content only; it runs on the shared lesson engine (assets/js/lesson-app.js) in help mode (Check Answer ·
 * Hint · Show Me on every Learn and practice question; Show Me is recorded as completed with help). Words, choices,
 * hints, explanations and feedback come from number-words/words99.js. See tests/number-words-2-3.test.js and
 * tests/number-words-2-3.browser.mjs.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const N = MB.nw99;
  const { W, matchQ, readQ, spellQ, trickyQ, fixQ, tensOnesFig: model, partsHTML: parts } = N;

  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const mistake = (w) => `<p class="q-display nw-mistake"><span class="nw-x" aria-hidden="true">✗</span> <s>${w}</s> <span class="nw-tag">mistake</span></p>`;
  const right = (w) => `<p class="q-display nw-right"><span aria-hidden="true">✓</span> ${w}</p>`;
  const pick = (r, list) => list[Math.floor(r() * list.length)];

  // ---------- Learn: six steps, each an Example and a Your Turn in a format practised later ----------
  const steps = [
    {
      id: 'eleven', kind: 'slides', title: 'Eleven and twelve',
      explain: 'Eleven and twelve are 1 ten and some ones, but they have their own words. Learn them as whole words.',
      slides: [
        model(11) + big('11 → eleven') + say('11 is 1 ten and 1 one. Its word is <b>eleven</b>: e-l-e-v-e-n. There is no "teen" in it.'),
        model(12) + big('12 → twelve') + say('12 is 1 ten and 2 ones. Its word is <b>twelve</b>. It starts with <b>tw</b>, like two: t-w-e-l-v-e.'),
        big('eleven · twelve') + say('These two words do not follow a pattern. Say each one, spell it aloud, then write it from memory.')
      ],
      check: (r) => spellQ({ id: 'learn-1', n: pick(r, [11, 12]) })
    },
    {
      id: 'teen', kind: 'slides', title: 'Number + teen',
      explain: 'For 14, 16, 17 and 19, say the ones word, then add -teen.',
      slides: [
        model(14) + parts(['four', { t: 'teen' }]) + big('14 → fourteen') + say('14 is 1 ten and 4 ones: four + teen. <b>fourteen</b> keeps the u of four.'),
        parts(['six', { t: 'teen' }]) + big('16 → sixteen') + parts(['seven', { t: 'teen' }]) + big('17 → seventeen'),
        model(19) + parts(['nine', { t: 'teen' }]) + big('19 → nineteen') + say('Keep every letter of nine, even the e at the end: <b>nineteen</b>.')
      ],
      check: (r) => spellQ({ id: 'learn-2', n: pick(r, [14, 16, 17, 19]) })
    },
    {
      id: 'thirfif', kind: 'slides', title: 'Thirteen and fifteen',
      explain: 'Thirteen and fifteen end in -teen, but their starts change: thir-, not three-; fif-, not five-.',
      slides: [
        model(13) + parts([{ t: 'thir' }, 'teen']) + big('13 → thirteen') + say('The start changes to <b>thir</b>. We do not write three + teen.'),
        model(15) + parts([{ t: 'fif' }, 'teen']) + big('15 → fifteen') + say('The start changes to <b>fif</b>. We do not write five + teen.'),
        say('Complete a tricky spelling: one letter is missing.') + big('fo _ rteen') + say('Say "fourteen" slowly. It is four + teen, so the missing letter is <b>u</b>: <b>fourteen</b>.')
      ],
      check: (r) => trickyQ({ id: 'learn-3', n: pick(r, [13, 15]) })
    },
    {
      id: 'eighteen', kind: 'slides', title: 'Eighteen has one t',
      explain: 'Eighteen is eight + een. Eight already ends in t, so there is only one t.',
      slides: [
        model(18) + big('eight + teen → eighteen') + say('Eight already ends in <b>t</b>, so the two t\'s become one: e-i-g-h-t-e-e-n.'),
        say('Fix a spelling mistake. Someone wrote 18 with an extra t:') + mistake('eightteen') + right('eighteen') +
          say('Find the part that is wrong, then write the whole word the right way.')
      ],
      // 18 uses its other misspelling: the example already showed "eightteen" (review NW23-04).
      check: (r) => { const n = pick(r, [18, 15, 13, 19, 12]); return fixQ({ id: 'learn-4', n, which: n === 18 ? 1 : Math.floor(r() * 2) }); }
    },
    {
      id: 'twenty', kind: 'slides', title: 'Twenty: 2 tens',
      explain: 'After nineteen comes twenty: 2 tens and 0 ones. Twenty starts the tens words, which end in -ty.',
      slides: [
        model(19) + big('19 → nineteen') + say('1 ten and 9 ones. One more one makes 10 ones, and 10 ones make another ten.'),
        model(20) + big('20 → twenty') + say('Now there are <b>2 tens</b> and 0 ones. <b>twenty</b> starts with tw, like two and twelve, and ends with <b>-ty</b>.'),
        say('Read a word, then write its number.') + big('"seventeen" → 17') + say('-teen means 1 ten. seven means 7 ones. So the number is 17.')
      ],
      check: (r) => readQ({ id: 'learn-5', n: pick(r, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) })
    },
    {
      id: 'match', kind: 'slides', title: 'Match numbers and words',
      explain: 'Say the number aloud, then find the word that matches. Listen to how it ends: -teen or -ty.',
      slides: [
        `<div class="q-visual"><span class="numeral-card">14</span></div>` + say('Which word names this number? Choices: four · fourteen · forty.') +
          right('fourteen') + say('14 is 1 ten and 4 ones: four + teen. <b>forty</b> is 4 tens (40), and <b>four</b> is just 4.'),
        say('It works the other way too: which number is "twelve"? Choices: 2 · 12 · 20.') + right('12') + say('twelve is 1 ten and 2 ones.')
      ],
      check: (r) => matchQ({ id: 'learn-6', n: pick(r, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]), toNumber: r() < 0.5, r })
    }
  ];

  // ---------- Practice Together (10): every number 11–20 once ----------
  const guided = [
    spellQ({ id: 'g1', n: 11 }),
    spellQ({ id: 'g2', n: 14, figure: undefined }),
    trickyQ({ id: 'g3', n: 15 }),
    readQ({ id: 'g4', n: 19 }),
    matchQ({ id: 'g5', n: 13, seed: 5 }),
    fixQ({ id: 'g6', n: 18 }),
    spellQ({ id: 'g7', n: 12 }),
    matchQ({ id: 'g8', n: 16, toNumber: true, seed: 11 }),
    spellQ({ id: 'g9', n: 17 }),
    trickyQ({ id: 'g10', n: 20 })
  ];
  const parentTips = { g1: 'Ask your child to say "eleven" and spell it aloud before typing.', g3: 'Ask: which part of fifteen changes from five?', g5: 'Say each choice aloud together. Which ends in -teen?', g6: 'Ask: which letter is extra?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  // ---------- On My Own: two sets of 10; each set has every number 11–20 ----------
  const bank = [
    spellQ({ id: 'o1', n: 13 }), fixQ({ id: 'o2', n: 19 }), readQ({ id: 'o3', n: 12 }), readQ({ id: 'o4', n: 17 }),
    matchQ({ id: 'o5', n: 15, seed: 3 }), matchQ({ id: 'o6', n: 14, toNumber: true, seed: 7 }), trickyQ({ id: 'o7', n: 18 }),
    trickyQ({ id: 'o8', n: 11 }), fixQ({ id: 'o9', n: 16 }), spellQ({ id: 'o10', n: 20 }),
    spellQ({ id: 'o11', n: 15 }), fixQ({ id: 'o12', n: 18 }), spellQ({ id: 'o13', n: 16 }), readQ({ id: 'o14', n: 14 }),
    readQ({ id: 'o15', n: 20 }), matchQ({ id: 'o16', n: 19, seed: 9 }), matchQ({ id: 'o17', n: 13, toNumber: true, seed: 13 }),
    trickyQ({ id: 'o18', n: 12 }), trickyQ({ id: 'o19', n: 17 }), fixQ({ id: 'o20', n: 11 })
  ];

  // ---------- Test: 12 questions, new numbers and order each attempt ----------
  const BLUEPRINT = ['spell', 'spell', 'spell', 'fix', 'fix', 'tricky', 'tricky', 'read', 'read', 'read', 'match', 'match'];
  function testFor(seed) {
    const r = pv.rng(seed);
    for (let tries = 0; tries < 5000; tries++) {
      const nums = pv.shuffle(r, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]).concat(pv.shuffle(r, [11, 12, 13, 15, 18, 20]).slice(0, 2));
      const kinds = pv.shuffle(r, BLUEPRINT.slice());
      const qs = kinds.map((k, i) => {
        const n = nums[i], id = `t${i + 1}`;
        if (k === 'spell') return spellQ({ id, n });
        if (k === 'fix') return fixQ({ id, n, which: Math.floor(r() * 2) });
        if (k === 'tricky') return trickyQ({ id, n });
        if (k === 'read') return readQ({ id, n });
        return matchQ({ id, n, toNumber: r() < 0.5, r });
      });
      if (N.testOK(qs)) return qs.map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });
    }
    throw new Error('Number Words Phase 2: no test for seed ' + seed);
  }
  MB.lessons = MB.lessons || {};
  MB.lessons['nw-2'] = {
    id: 'nw-2',
    storageKey: 'mathbook:v2:number-words:phase-2',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2',
    title: 'Numbers 11–20',
    subtitle: 'Read and spell the number words from eleven to twenty',
    help: true,
    tip: N.tip,
    brand: {
      noun: 'Number Words Phase', pill: 'Phase 2: 11–20', crumbs: 'Number Words · Read It, Say It, Spell It, Write It', menu: 'Phase Menu', thing: 'phase',
      resetNote: 'Number Words Phases 1, 3 and 4, Subtract with Regrouping, and the math lessons are not changed.'
    },
    objective: 'I can read and spell the number words from eleven to twenty, including the tricky ones.',
    parentLearn: {
      goal: [
        'Learn eleven and twelve as whole words.',
        'Spell the number + teen words: fourteen, sixteen, seventeen, nineteen.',
        'Remember the tricky starts: thirteen (thir-) and fifteen (fif-), and the single t in eighteen.',
        'Know twenty as 2 tens, the first of the tens words.',
        'Match and read each number word, and fix a misspelled one.'
      ],
      words: [
        { term: 'Number word', meaning: 'A number written in letters.', example: 'fourteen' },
        { term: '-teen', meaning: 'The ending for 13 to 19: 1 ten and some ones.', example: 'sixteen = six + teen' },
        { term: 'Tens and ones', meaning: 'A two-digit number is some tens and some ones.', example: '14 = 1 ten and 4 ones' }
      ],
      demoVisual: N.tensOnesFig(14),
      demonstrate: [
        'Show 14 as 1 ten and 4 ones. Say "four + teen" and write fourteen.',
        'Write eleven and twelve. Point out that they have no -teen: learn them as whole words.',
        'Write thirteen and fifteen next to three and five. Circle the start that changes (thir-, fif-).',
        'Write eight + teen and show how the t is shared: eighteen.',
        'Add one more to 19: 10 ones make a ten, so 20 is 2 tens: twenty.'
      ],
      ask: ['"How many tens and ones?"', '"Which part of the word tells the ones?"', '"Is this one of the tricky words? What changes?"', '"Say it, then spell it aloud before you type."'],
      checklist: [
        'Spells eleven and twelve.',
        'Spells fourteen, sixteen, seventeen and nineteen (the ones word + teen).',
        'Spells thirteen and fifteen with their changed starts.',
        'Spells eighteen with one t, and twenty.',
        'Writes the number for each word, and matches numbers and words.',
        'Finds and fixes a misspelled number word.'
      ]
    },
    mistakes: [
      'Writing "threeteen" or "fiveteen": the starts change to thir- and fif-.',
      'Writing "eightteen": eighteen has only one t.',
      'Writing "ninteen": nineteen keeps the e of nine.',
      'Mixing up -teen and -ty: fourteen (14) and forty (40) sound alike.',
      'Writing 41 for fourteen: a -teen number is 1 ten and some ones, so it is written 14.'
    ],
    seeIt: {
      steps,
      reflection: { prompt: 'Which number words from 11 to 20 are the trickiest for you? Why?', idea: 'Eleven and twelve are whole words. Thirteen and fifteen change their starts. Eighteen has one t. The rest are the ones word + teen.' }
    },
    skills: {
      match: 'Match numbers and words',
      read: 'Read a number word',
      spell: 'Write the number word',
      tricky: 'Complete a tricky spelling',
      fix: 'Fix a spelling mistake'
    },
    skillGroups: [
      { title: 'Number recognition', skills: ['match', 'read'] },
      { title: 'Spelling', skills: ['spell', 'tricky', 'fix'] }
    ],
    guided,
    saveGuided: true,
    bank,
    skillPractice: true,
    bankSets: [
      { id: 's1', title: 'Numbers 11–20, Set A', blurb: 'All ten numbers: write, read, match, complete and fix the words.', ids: bank.slice(0, 10).map((q) => q.id) },
      { id: 's2', title: 'Numbers 11–20, Set B', blurb: 'All ten numbers again, in new ways.', ids: bank.slice(10).map((q) => q.id) }
    ],
    tests: {
      words: { id: 'words', title: 'Numbers 11–20 Test', questions: 12, blurb: 'Read, match and spell the number words from eleven to twenty.', generate: testFor }
    },
    _blueprint: BLUEPRINT
  };
})(typeof window !== 'undefined' ? window : globalThis);
