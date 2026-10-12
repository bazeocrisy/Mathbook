/*
 * Mathbook — Number Words, Phase 3: Tens and two-digit numbers (20–99).
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
  const { matchQ, readQ, spellQ, trickyQ, fixQ, tensOnesFig: model, partsHTML: parts } = N;

  const say = (html) => `<p class="slide-say">${html}</p>`;
  const big = (html) => `<p class="q-display">${html}</p>`;
  const mistake = (w) => `<p class="q-display nw-mistake"><span class="nw-x" aria-hidden="true">✗</span> <s>${w}</s> <span class="nw-tag">mistake</span></p>`;
  const right = (w) => `<p class="q-display nw-right"><span aria-hidden="true">✓</span> ${w}</p>`;
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const twoDigit = (r, avoid) => { for (;;) { const n = pv.randInt(r, 2, 9) * 10 + pv.randInt(r, 1, 9); if (!(avoid || []).includes(n)) return n; } };
  const tensList = N.TENS.map((n) => `<li><b>${n}</b> <span>${N.W(n)}</span></li>`).join('');

  // ---------- Learn: six steps, each an Example and a Your Turn in a format practised later ----------
  const steps = [
    {
      id: 'tens', kind: 'slides', title: 'The tens words',
      explain: 'Count by tens: twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety. Each one names a number of tens and ends in -ty.',
      slides: [
        model(60) + parts(['six', { t: 'ty' }]) + big('60 → sixty') + say('60 is 6 tens and 0 ones: six + ty.'),
        `<ul class="nw-tens">${tensList}</ul>` + say('Say them aloud as you count by tens. Each ends in <b>-ty</b>.'),
        parts(['seven', { t: 'ty' }]) + big('70 → seventy') + parts(['nine', { t: 'ty' }]) + big('90 → ninety') + say('ninety keeps the e of nine.')
      ],
      check: (r) => spellQ({ id: 'learn-1', n: pick(r, [20, 60, 70, 90]) })
    },
    {
      id: 'tricky', kind: 'slides', title: 'Tricky tens: thirty, forty, fifty, eighty',
      explain: 'Four tens words change: thirty and fifty start like thirteen and fifteen, forty has no u, and eighty has one t.',
      slides: [
        model(30) + parts([{ t: 'thir' }, 'ty']) + big('30 → thirty') + say('Not three + ty. It starts like <b>thirteen</b>: thir + ty.'),
        model(50) + parts([{ t: 'fif' }, 'ty']) + big('50 → fifty') + say('Not five + ty. It starts like <b>fifteen</b>: fif + ty.'),
        model(40) + big('40 → forty') + say('four has a u, but <b>forty</b> does not: f-o-r-t-y.'),
        model(80) + parts(['eigh', { t: 't' }, 'y']) + big('80 → eighty') + say('eight already ends in t, so just add y: <b>eighty</b> has one t.'),
        say('Complete a tricky spelling: one letter is missing.') + big('nin _ ty') + say('Say "ninety". It keeps every letter of nine, so the missing letter is <b>e</b>: <b>ninety</b>.')
      ],
      check: (r) => trickyQ({ id: 'learn-2', n: pick(r, [30, 40, 50, 80]) })
    },
    {
      id: 'teenty', kind: 'slides', title: '-teen or -ty?',
      explain: '13 and 30 sound alike. A -teen word is 1 ten and some ones. A -ty word is tens.',
      slides: [
        `<div class="nw-pair">${model(13)}${model(30)}</div>` + big('13 → thirteen · 30 → thirty') + say('thir<b>teen</b> is 1 ten and 3 ones. thir<b>ty</b> is 3 tens.'),
        `<div class="nw-pair">${model(14)}${model(40)}</div>` + big('14 → fourteen · 40 → forty') + say('fourteen keeps the u of four. forty does not.'),
        big('15 → fifteen · 50 → fifty') + big('18 → eighteen · 80 → eighty') + say('Listen to the end of the word: <b>-teen</b> or <b>-ty</b>.'),
        `<div class="q-visual"><span class="numeral-card">40</span></div>` + say('Which word names this number? Choices: fourteen · forty · four.') + right('forty') + say('40 is 4 tens, so it ends in -ty.')
      ],
      check: (r) => matchQ({ id: 'learn-3', n: pick(r, [13, 14, 15, 18, 30, 40, 50, 80]), toNumber: r() < 0.5, r })
    },
    {
      id: 'compound', kind: 'slides', title: 'Tens and ones: forty-two',
      explain: 'For a number like 42, write the tens word, then the ones word. A hyphen joins them: forty-two.',
      slides: [
        model(42) + say('42 is 4 tens and 2 ones.'),
        big('4 tens → forty') + big('2 ones → two') + big('42 → forty-two') + say('A hyphen (-) joins the tens word and the ones word.'),
        model(67) + big('6 tens → sixty · 7 ones → seven') + big('67 → sixty-seven')
      ],
      check: (r) => spellQ({ id: 'learn-4', n: twoDigit(r, [42, 67]) })
    },
    {
      id: 'exact', kind: 'slides', title: 'Exact tens: no ones word',
      explain: 'When there are 0 ones, there is no ones word: 40 is forty.',
      slides: [
        model(40) + big('40 → forty') + say('4 tens and 0 ones. There is nothing to say for the ones, so the word is just <b>forty</b>.'),
        mistake('forty-zero') + right('forty') + say('We never write a ones word for 0.'),
        say('Read the words, then write the number.') + big('"forty" → 40') + big('"forty-six" → 46') + say('The tens word gives the tens digit. The word after the hyphen gives the ones digit. No ones word means 0 ones.')
      ],
      check: (r) => readQ({ id: 'learn-5', n: r() < 0.5 ? pick(r, [30, 50, 60, 80, 90]) : twoDigit(r, [46]) })
    },
    {
      id: 'fix', kind: 'slides', title: 'Fix the spelling',
      explain: 'Find the misspelled part, then write the whole number the right way.',
      slides: [
        say('Someone wrote 46 like this:') + mistake('fourty-six') + say('forty has no u.') + right('forty-six'),
        say('Someone wrote 83 like this:') + mistake('eightty-three') + say('eighty has one t.') + right('eighty-three')
      ],
      check: (r) => { const t = pick(r, [3, 4, 5, 8, 9]); const n = t * 10 + (r() < 0.6 ? pv.randInt(r, 1, 9) : 0); return fixQ({ id: 'learn-6', n: n === 46 || n === 83 ? n + 1 : n, which: Math.floor(r() * 2) }); }
    }
  ];

  // ---------- Practice Together (12): every tens word ----------
  const guided = [
    spellQ({ id: 'g1', n: 30 }),
    spellQ({ id: 'g2', n: 47 }),
    trickyQ({ id: 'g3', n: 40 }),
    matchQ({ id: 'g4', n: 50, seed: 3 }),
    readQ({ id: 'g5', n: 81 }),
    spellQ({ id: 'g6', n: 90 }),
    fixQ({ id: 'g7', n: 53 }),
    matchQ({ id: 'g8', n: 18, toNumber: true, seed: 5 }),
    spellQ({ id: 'g9', n: 72 }),
    trickyQ({ id: 'g10', n: 28 }),
    readQ({ id: 'g11', n: 60 }),
    spellQ({ id: 'g12', n: 85 })
  ];
  const parentTips = { g2: 'Ask: how many tens? What is the word for that many tens? Then the ones.', g3: 'Ask your child to say forty and four slowly. Which one has a u?', g4: 'Say each choice aloud together. Which ends in -ty?', g7: 'Ask: which part is spelled wrong?' };
  guided.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  // ---------- On My Own: two sets of 12; each set has every tens word ----------
  const bank = [
    spellQ({ id: 'o1', n: 34 }), spellQ({ id: 'o2', n: 80 }), spellQ({ id: 'o3', n: 59 }), spellQ({ id: 'o4', n: 26 }),
    readQ({ id: 'o5', n: 71 }), readQ({ id: 'o6', n: 40 }), matchQ({ id: 'o7', n: 30, seed: 7 }), matchQ({ id: 'o8', n: 17, toNumber: true, seed: 9 }),
    trickyQ({ id: 'o9', n: 45 }), trickyQ({ id: 'o10', n: 88 }), fixQ({ id: 'o11', n: 92 }), fixQ({ id: 'o12', n: 63 }),
    spellQ({ id: 'o13', n: 41 }), spellQ({ id: 'o14', n: 70 }), spellQ({ id: 'o15', n: 98 }), spellQ({ id: 'o16', n: 83 }),
    readQ({ id: 'o17', n: 37 }), readQ({ id: 'o18', n: 50 }), matchQ({ id: 'o19', n: 80, seed: 11 }), matchQ({ id: 'o20', n: 60, toNumber: true, seed: 13 }),
    trickyQ({ id: 'o21', n: 30 }), trickyQ({ id: 'o22', n: 52 }), fixQ({ id: 'o23', n: 46 }), fixQ({ id: 'o24', n: 29 })
  ];

  // ---------- Test: 14 questions, new numbers each attempt; every tens word appears ----------
  const SPELL_KINDS = ['spell', 'spell', 'spell', 'fix', 'tricky', 'tricky'];
  const CONTRAST = [13, 14, 15, 16, 17, 18, 19, 30, 40, 50, 60, 70, 80, 90];
  function testFor(seed) {
    const r = pv.rng(seed);
    for (let tries = 0; tries < 20000; tries++) {
      const tens = pv.shuffle(r, [2, 3, 4, 5, 6, 7, 8, 9]);
      const ones = () => (r() < 0.3 ? 0 : pv.randInt(r, 1, 9));
      // Six spelling questions, each on its own tens word; recognition questions use the other two tens words.
      const sp = pv.shuffle(r, SPELL_KINDS.slice()).map((k, i) => ({ k, n: tens[i] * 10 + ones() }));
      const rest = tens.slice(6);
      const rd = [0, 1, 2, 3].map((i) => ({ k: 'read', n: rest[i % 2] * 10 + ones() }));
      const mt = [0, 1, 2, 3].map(() => ({ k: 'match', n: pick(r, CONTRAST) }));
      const plan = pv.shuffle(r, sp.concat(rd, mt));
      const qs = plan.map((x, i) => {
        const id = `t${i + 1}`;
        if (x.k === 'spell') return spellQ({ id, n: x.n });
        if (x.k === 'fix') return fixQ({ id, n: x.n, which: Math.floor(r() * 2) });
        if (x.k === 'tricky') return trickyQ({ id, n: x.n });
        if (x.k === 'read') return readQ({ id, n: x.n });
        return matchQ({ id, n: x.n, toNumber: r() < 0.5, r });
      });
      if (fair(qs)) return qs.map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });
    }
    throw new Error('Number Words Phase 3: no test for seed ' + seed);
  }
  /** Fair (no spelling given away), every tens word appears, and both exact tens and two-word numbers are asked. */
  function fair(qs) {
    if (!N.testOK(qs)) return false;
    const nums = qs.map(N.numOf);
    const big2 = nums.filter((n) => n >= 20);
    const tensSeen = new Set(big2.map((n) => Math.floor(n / 10)));
    return tensSeen.size === 8 && big2.filter((n) => n % 10 === 0).length >= 2 && big2.filter((n) => n % 10 !== 0).length >= 4;
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['nw-3'] = {
    id: 'nw-3',
    storageKey: 'mathbook:v2:number-words:phase-3',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '3',
    title: 'Numbers 20–99',
    subtitle: 'Read and spell the tens words and two-digit numbers',
    help: true,
    tip: N.tip,
    brand: {
      noun: 'Number Words Phase', pill: 'Phase 3: 20–99', crumbs: 'Number Words · Read It, Say It, Spell It, Write It', menu: 'Phase Menu', thing: 'phase',
      resetNote: 'Number Words Phases 1, 2 and 4, Subtract with Regrouping, and the math lessons are not changed.'
    },
    objective: 'I can read and spell the tens words and every number from 20 to 99, with a hyphen between the tens and the ones.',
    parentLearn: {
      goal: [
        'Spell the tens words: twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety.',
        'Remember the tricky ones: thirty and fifty (thir-, fif-), forty (no u), eighty (one t).',
        'Tell -teen from -ty: 13 and 30, 14 and 40, 15 and 50, 18 and 80.',
        'Write two-digit numbers as the tens word, a hyphen, and the ones word: forty-two.',
        'Write exact tens with no ones word: 40 is forty.'
      ],
      words: [
        { term: 'Tens word', meaning: 'The word for a number of tens, ending in -ty.', example: 'sixty = 6 tens' },
        { term: 'Hyphen', meaning: 'The short line that joins the tens word and the ones word.', example: 'forty-two' },
        { term: '-teen and -ty', meaning: '-teen is 1 ten and some ones (13–19); -ty is tens.', example: 'fourteen = 14, forty = 40' }
      ],
      demoVisual: N.tensOnesFig(42),
      demonstrate: [
        'Count by tens with ten-rods, saying each tens word. Write the list.',
        'Write three, five, four and eight above thirty, fifty, forty and eighty. Circle what changes.',
        'Say 14 and 40 slowly. Write fourteen and forty side by side.',
        'Build 42 with 4 rods and 2 cubes: forty, hyphen, two.',
        'Build 40: there are no ones, so the word is just forty.'
      ],
      ask: ['"How many tens? How many ones?"', '"Does it end in -teen or -ty?"', '"Is there a ones word? Where does the hyphen go?"', '"Is this a tricky tens word?"'],
      checklist: [
        'Spells all eight tens words.',
        'Spells thirty, forty, fifty and eighty correctly.',
        'Tells -teen from -ty when reading and writing.',
        'Writes two-digit numbers with a hyphen (a space is accepted).',
        'Writes exact tens with no ones word.',
        'Reads number words as numbers and fixes misspelled ones.'
      ]
    },
    mistakes: [
      'Writing "fourty": forty has no u.',
      'Writing "threety" or "fivety": the starts change to thir- and fif-.',
      'Writing "eightty": eighty has one t.',
      'Mixing up -teen and -ty: fourteen (14) and forty (40).',
      'Writing 24 for forty-two: the tens word comes first.',
      'Writing "forty-zero": exact tens have no ones word.'
    ],
    seeIt: {
      steps,
      reflection: { prompt: 'How can you tell fourteen from forty when you hear them?', idea: 'Fourteen ends in -teen: 1 ten and 4 ones. Forty ends in -ty: 4 tens. Saying the end clearly helps.' }
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
      { id: 's1', title: 'Numbers 20–99, Set A', blurb: 'Every tens word: write, read, match, complete and fix the words.', ids: bank.slice(0, 12).map((q) => q.id) },
      { id: 's2', title: 'Numbers 20–99, Set B', blurb: 'Every tens word again, with new numbers.', ids: bank.slice(12).map((q) => q.id) }
    ],
    tests: {
      words: { id: 'words', title: 'Numbers 20–99 Test', questions: 14, blurb: 'Read, match and spell the tens words and two-digit numbers.', generate: testFor }
    },
    _fair: fair
  };
})(typeof window !== 'undefined' ? window : globalThis);
