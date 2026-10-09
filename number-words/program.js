/*
 * Number Words — Read It, Say It, Spell It, Write It.
 * Curriculum data only. The reusable phase engine is assets/js/number-words-app.js.
 * Phase 1 is complete. Phases 2–4 are an outline only (no lessons, exercises, or tests yet).
 * Spelling follows American English and matches Lesson 2-1's word form (Mathbook.pv.numberToWords).
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});

  const PHASE_1_WORDS = [
    { n: 0, word: 'zero', tip: 'z-e-r-o: it starts with z and ends with o.', misspellings: ['zerro', 'zeroe', 'sero'] },
    { n: 1, word: 'one', tip: 'It sounds like "won," but it is spelled o-n-e.', misspellings: ['won', 'wun', 'oen'] },
    { n: 2, word: 'two', tip: 'The w is silent: t-w-o. Not "to" or "too."', misspellings: ['to', 'tow', 'tuw'] },
    { n: 3, word: 'three', tip: 't-h-r-e-e: it starts with th and ends with a double e.', misspellings: ['thre', 'tree', 'threa'] },
    { n: 4, word: 'four', tip: 'f-o-u-r: it sounds like "for," but four has a u.', misspellings: ['for', 'fore', 'foor'] },
    { n: 5, word: 'five', tip: 'f-i-v-e: the silent e at the end makes the i say its name.', misspellings: ['fiv', 'fife', 'fyve'] },
    { n: 6, word: 'six', tip: 's-i-x: three letters, ending in x.', misspellings: ['sixe', 'siks', 'sicks'] },
    { n: 7, word: 'seven', tip: 's-e-v-e-n: there is an e on each side of the v.', misspellings: ['sevin', 'sevn', 'seaven'] },
    { n: 8, word: 'eight', tip: 'e-i-g-h-t: the g and h are silent. It sounds like "ate."', misspellings: ['ate', 'eigt', 'eihgt'] },
    { n: 9, word: 'nine', tip: 'n-i-n-e: the silent e at the end makes the first i say its name.', misspellings: ['nien', 'nin', 'nyne'] },
    { n: 10, word: 'ten', tip: 't-e-n: three letters.', misspellings: ['tenn', 'tin', 'tne'] }
  ];

  MB.numberWords = MB.numberWords || {};
  MB.numberWords.program = {
    title: 'Number Words',
    subtitle: 'Read It, Say It, Spell It, Write It',
    convention: 'American English. Hyphens join tens and ones (twenty-seven). Mathbook writes a comma after "thousand" (two thousand, one hundred thirty-seven) to match Lesson 2-1; answers are accepted with or without that comma.',
    phases: [
      {
        id: '1', title: 'Numbers 0–10', status: 'ready', href: 'phase-1/',
        storageKey: 'mathbook:v2:number-words:phase-1',
        words: PHASE_1_WORDS,
        testSize: 10,
        masteryScore: 9,
        practiceSize: 8
      },
      {
        id: '2', title: 'Numbers 11–20', status: 'planned',
        words: ['eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
        focus: [
          'eleven and twelve do not follow a pattern — learn them as whole words.',
          'thirteen and fifteen change the start: thir- (not three-), fif- (not five-).',
          'eighteen has only one t: eight + een.',
          'fourteen, sixteen, seventeen, nineteen: the number word + teen.'
        ]
      },
      {
        id: '3', title: 'Tens and two-digit numbers', status: 'planned',
        words: ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
        focus: [
          'forty has no u (not "fourty").',
          'thirty and fifty change the start: thir- (not three-), fif- (not five-).',
          'eighty is eight + y, with only one t.',
          'A hyphen joins tens and ones: twenty-seven, forty-two, ninety-nine.'
        ]
      },
      {
        id: '4', title: 'Hundreds and thousands', status: 'planned',
        examples: [135, 2137, 5072],
        focus: [
          'Say and write the hundreds, then the tens and ones: one hundred thirty-five.',
          'Thousands come first, then the rest: two thousand, one hundred thirty-seven.',
          'A zero place is not said: 5,072 is five thousand, seventy-two.'
        ]
      }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
