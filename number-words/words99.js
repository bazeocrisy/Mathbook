/*
 * Number Words 11–99 (Phases 2 and 3): spelling notes, question builders, and spelling-aware feedback.
 * Words come from Mathbook.pv.numberToWords (American English; a hyphen joins tens and ones: forty-two).
 * Grading stays with the shared question types: 'words' (pv.checkWords: capitals, surrounding spaces, and a hyphen
 * or a space between tens and ones are accepted; every letter must be right), 'number' (pv.parseWholeNumber: empty is
 * unanswered, never 0), 'mc', and 'letter' (one missing letter). Every question is plain JSON (saved and re-shown).
 * Unit-tested in tests/number-words-2-3.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const W = (n) => pv.numberToWords(n);
  const norm = (s) => pv.normalizeWords(s);

  // ---------- Spelling notes ----------
  // note: shown after the answer is known (explanations, Show Me); it may name the word.
  // clue: a hint that points at the tricky part without spelling the whole word.
  // blank: the letter left out in "complete the tricky spelling". wrong: common misspellings (only ever shown
  // labelled as a mistake, in "fix the spelling" questions).
  const NOTES = {
    one: { note: 'one is spelled o-n-e (it sounds like "won").', clue: 'The ones word sounds like "won" but starts with o.' },
    two: { note: 'two has a silent w: t-w-o.', clue: 'The ones word has a silent w.' },
    three: { note: 'three ends with a double e.', clue: 'The ones word ends with a double e.' },
    four: { note: 'four has a u: f-o-u-r.', clue: 'The ones word has a u in it.' },
    five: { note: 'five ends with a silent e.', clue: 'The ones word ends with a silent e.' },
    six: { note: 'six ends with x.', clue: 'The ones word ends with x.' },
    seven: { note: 'seven has an e on each side of the v.', clue: 'The ones word has an e on each side of the v.' },
    eight: { note: 'eight has a silent g and h: e-i-g-h-t.', clue: 'The ones word has a silent g and h.' },
    nine: { note: 'nine ends with a silent e.', clue: 'The ones word ends with a silent e.' },
    ten: { note: 'ten is t-e-n.', clue: 'It has three letters.' },
    eleven: { note: 'eleven is a whole word to learn, with no -teen: e-l-e-v-e-n.', clue: 'It is a whole word with no -teen. It starts with "el" and has 6 letters.', blank: 3, tclue: 'It is a whole word with no -teen. Say it slowly and listen for the sound just before the last two letters.', wrong: ['elevin', 'elevan'] },
    twelve: { note: 'twelve is a whole word to learn, with no -teen. It starts with tw, like two: t-w-e-l-v-e.', clue: 'It is a whole word with no -teen. It starts with "tw", like two, and ends with "ve".', blank: 4, tclue: 'It is a whole word with no -teen. Say it slowly and listen for the sound just before the last letter.', wrong: ['twelf', 'twelv'] },
    thirteen: { note: 'thirteen starts with thir-, not three-: thir + teen.', clue: 'It ends with -teen, but the start changes: it is not "three" + teen.', blank: 2, tclue: 'The start is not the word three. Say it slowly: which vowel sound comes right after th?', wrong: ['threeteen', 'thirtean'] },
    fourteen: { note: 'fourteen is four + teen. It keeps the u of four.', clue: 'Write the word for 4, then -teen.', blank: 2, tclue: 'It is the word for 4, then -teen. Keep every letter of the word for 4.', wrong: ['forteen', 'fourtean'] },
    fifteen: { note: 'fifteen starts with fif-, not five-: fif + teen.', clue: 'It ends with -teen, but the start changes: it is not "five" + teen.', blank: 2, tclue: 'The start is not the word five. Say it slowly and listen for the sound before -teen.', wrong: ['fiveteen', 'fifeteen'] },
    sixteen: { note: 'sixteen is six + teen.', clue: 'Write the word for 6, then -teen.', blank: 2, tclue: 'It is the word for 6, then -teen.', wrong: ['sixtean', 'sixten'] },
    seventeen: { note: 'seventeen is seven + teen.', clue: 'Write the word for 7, then -teen.', blank: 5, tclue: 'It is the word for 7, then the ending that the words for 13 to 19 share.', wrong: ['seventene', 'sevunteen'] },
    eighteen: { note: 'eighteen is eight + een, with only one t: eight already ends in t.', clue: 'Eight already ends in t, so -teen does not add another t.', blank: 4, tclue: 'Think about how the word for 8 ends. That letter is not written twice.', wrong: ['eightteen', 'eighten'] },
    nineteen: { note: 'nineteen is nine + teen. It keeps the e at the end of nine.', clue: 'Write all of the word for 9, then -teen.', blank: 3, tclue: 'Keep every letter of the word for 9, then add -teen.', wrong: ['ninteen', 'ninetean'] },
    twenty: { note: 'twenty means 2 tens. It starts with tw, like two and twelve, and ends with -ty.', clue: 'It means 2 tens: it starts with "tw", like two, and ends with -ty.', blank: 2, tclue: 'Say it slowly and listen for the vowel sound after tw.', wrong: ['twinty', 'tweny'] },
    thirty: { note: 'thirty starts with thir-, like thirteen, not three-: thir + ty.', clue: 'It starts like thirteen and ends with -ty.', blank: 2, tclue: 'The start is not the word three. Say it slowly: which vowel sound comes right after th?', wrong: ['threety', 'thirdy'] },
    forty: { note: 'forty has no u. four has a u, but forty does not: f-o-r-t-y.', clue: 'It starts like four, but it drops the u. It ends with -ty.', blank: 2, tclue: 'It sounds like the word for 4, but one letter is dropped. Say it slowly and listen before -ty.', wrong: ['fourty', 'fortey'] },
    fifty: { note: 'fifty starts with fif-, like fifteen, not five-: fif + ty.', clue: 'It starts like fifteen and ends with -ty.', blank: 2, tclue: 'The start is not the word five. Say it slowly and listen for the sound before -ty.', wrong: ['fivety', 'fifdy'] },
    sixty: { note: 'sixty is six + ty.', clue: 'Write the word for 6, then -ty.', blank: 2, tclue: 'It is the word for 6, then -ty.', wrong: ['sixdy', 'sixtey'] },
    seventy: { note: 'seventy is seven + ty.', clue: 'Write the word for 7, then -ty.', blank: 4, tclue: 'Keep every letter of the word for 7, then add -ty.', wrong: ['sevendy', 'seventie'] },
    eighty: { note: 'eighty is eight + y, with only one t: eight already ends in t.', clue: 'Eight already ends in t, so just add y.', blank: 4, tclue: 'Think about how the word for 8 ends. Then only y is added.', wrong: ['eightty', 'eigthy'] },
    ninety: { note: 'ninety is nine + ty. It keeps the e of nine.', clue: 'Write all of the word for 9, then -ty.', blank: 3, tclue: 'Keep every letter of the word for 9, then add -ty.', wrong: ['ninty', 'ninedy'] }
  };
  const TENS = [20, 30, 40, 50, 60, 70, 80, 90];
  const TEENS = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const tensOf = (n) => Math.floor(n / 10), onesOf = (n) => n % 10;
  const plural = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;
  /** The word that carries the spelling lesson for n: the teen or tens word (twenty for 20). */
  const keyWord = (n) => (n < 20 ? W(n) : W(tensOf(n) * 10));

  /** Every word form from 0 to 99, normalized → value (for reading a child's typed words). */
  const VALUE = {};
  for (let n = 0; n <= 99; n++) VALUE[norm(W(n))] = n;
  const WORDS = Object.keys(NOTES); // the single words 1–20 and the tens
  /** Each listed misspelling → the word it misspells (checked before any closest-word guess). */
  const MISSPELT = {};
  WORDS.forEach((w) => (NOTES[w].wrong || []).forEach((bad) => { MISSPELT[bad] = w; }));

  function dist(a, b) {
    const m = a.length, n = b.length, d = [];
    for (let i = 0; i <= m; i++) { d[i] = [i]; }
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }
  /** The closest real number word to a typed token (ties go to `prefer`). */
  function closest(tok, prefer) {
    if (MISSPELT[tok]) return { word: MISSPELT[tok], d: 1 };
    let best = null, bd = Infinity;
    WORDS.forEach((w) => { const d = dist(tok, w); if (d < bd || (d === bd && w === prefer)) { best = w; bd = d; } });
    return { word: best, d: bd };
  }

  // ---------- Explanations and hints ----------
  /** "42 = 4 tens and 2 ones → forty + two → forty-two." plus the spelling note. */
  function explain(n) {
    const t = tensOf(n), o = onesOf(n), k = NOTES[keyWord(n)];
    if (n === 11 || n === 12) return `${n} is 1 ten and ${plural(o, 'one')}, but it has its own word: ${W(n)}. ${cap(k.note)}`;
    if (n < 20) return `${n} is 1 ten and ${plural(o, 'one')}. Say the ones, then -teen: ${W(n)}. ${cap(k.note)}`;
    if (!o) return `${n} is ${plural(t, 'ten')} and 0 ones, so there is no ones word: ${W(n)}. ${cap(k.note)}`;
    const ones = NOTES[W(o)];
    return `${n} is ${plural(t, 'ten')} and ${plural(o, 'one')}: ${W(t * 10)} + ${W(o)}. A hyphen joins them: ${W(n)}. ${cap(k.note)}${['two', 'four', 'eight'].includes(W(o)) ? ` And ${ones.note}` : ''}`;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  function spellHint(n) {
    const t = tensOf(n), o = onesOf(n), k = NOTES[keyWord(n)];
    if (n === 11 || n === 12) return `${n} has its own word. ${k.clue}`;
    if (n < 20) return `${n} is 1 ten and ${plural(o, 'one')}: say the ones, then -teen. ${k.clue}`;
    if (!o) return `${n} is ${plural(t, 'ten')}, with no ones, so there is just one word. ${k.clue}`;
    return `${n} is ${plural(t, 'ten')} and ${plural(o, 'one')}. Write the tens word, a hyphen, then the ones word. ${k.clue}`;
  }
  const READ_HINT = 'A word ending in -teen is 1 ten and some ones. A word ending in -ty names tens. A word after the hyphen names the ones.';

  // ---------- Question builders ----------
  /** Correctly spelled words for other numbers that look or sound close to n (no misspellings, all different). */
  function nearNumbers(n) {
    const t = tensOf(n), o = onesOf(n), out = [];
    if (n === 11) out.push(12, 1, 10);
    else if (n === 12) out.push(11, 2, 20);
    else if (n < 20) out.push(o * 10, o, n + 1 <= 19 ? n + 1 : n - 1);
    else if (n === 20) out.push(12, 2, 30);
    else if (!o) out.push(10 + t, t, t < 9 ? n + 10 : n - 10);
    else { if (o >= 2) out.push(o * 10 + t); out.push(t * 10, 10 + o, t < 9 ? n + 10 : n - 10, o > 1 ? n - 1 : n + 1); }
    return out.filter((m, i) => m !== n && m >= 1 && m <= 99 && out.indexOf(m) === i);
  }
  const order = (o, list) => (o.r ? pv.shuffle(o.r, list) : o.seed ? pv.shuffle(pv.rng(o.seed), list) : list);
  /** Match a numeral to its word (choose the word) or a word to its numeral (choose the number). Three choices. */
  function matchQ(o) {
    const n = o.n, near = nearNumbers(n).slice(0, 2);
    if (o.toNumber) {
      return { id: o.id, type: 'mc', skill: 'match', answer: String(n), choices: order(o, [n].concat(near).map(String)),
        prompt: `Which number is "${W(n)}"?`, hint: READ_HINT, explanation: explain(n), nwMatch: 'number' };
    }
    return { id: o.id, type: 'mc', skill: 'match', answer: W(n), choices: order(o, [n].concat(near).map(W)), numeral: n,
      prompt: 'Which word names this number?', hint: READ_HINT, explanation: explain(n), nwMatch: 'word' };
  }
  /** Read the word, write the numeral. */
  function readQ(o) {
    const n = o.n;
    return { id: o.id, type: 'number', skill: 'read', answer: n, prompt: o.prompt || `Write the number for "${W(n)}".`,
      hint: o.hint || READ_HINT, explanation: explain(n) };
  }
  /** Type the number word for a numeral (spelling). */
  function spellQ(o) {
    const n = o.n;
    return { id: o.id, type: 'words', skill: 'spell', answer: n, numeral: n, prompt: n < 20 || !onesOf(n) ? 'Write this number as a word.' : 'Write this number in words.',
      figure: o.figure, hint: o.hint || spellHint(n), explanation: explain(n) };
  }
  /** Complete a tricky spelling: one missing letter in the tricky part of the word. */
  function trickyQ(o) {
    const n = o.n, k = keyWord(n), word = W(n), missing = NOTES[k].blank;
    return { id: o.id, type: 'letter', skill: 'tricky', word, missing, answer: word[missing],
      prompt: `Fill in the missing letter in the word for ${n}.`, hint: NOTES[k].tclue, explanation: explain(n) };
  }
  /** Fix a misspelled word. The wrong spelling is shown only here, always labelled as a mistake. */
  function fixQ(o) {
    const n = o.n, k = keyWord(n), bad = NOTES[k].wrong[o.which || 0];
    const wrongForm = n < 20 || !onesOf(n) ? bad : `${bad}-${W(onesOf(n))}`;
    return { id: o.id, type: 'words', skill: 'fix', answer: n, wrongForm,
      prompt: `Spelling mistake: someone wrote "${wrongForm}" for ${n}. Write ${n} the right way.`,
      hint: `Find the part that is spelled wrong. ${NOTES[k].clue}`, explanation: `"${wrongForm}" is a misspelling. ${explain(n)}` };
  }

  // ---------- Feedback after a wrong answer (never the full answer) ----------
  function valueMsg(n, v, looks) {
    const t = tensOf(n), o = onesOf(n);
    let why = '';
    if (n >= 13 && n <= 19 && v === o * 10) why = ' A -teen word is 1 ten and some ones; a -ty word is tens.';
    else if (v >= 13 && v <= 19 && n === (v % 10) * 10) why = ' A -ty word is tens; a -teen word is only 1 ten and some ones.';
    else if (o && v === t * 10) why = ` You wrote only the tens. ${n} also has ${plural(o, 'one')}: add the ones word with a hyphen.`;
    else if (o && n >= 20 && v === o) why = ` You wrote only the ones. ${n} also has ${plural(t, 'ten')}.`;
    else if (n >= 20 && o >= 1 && v === o * 10 + t) why = ` The tens and ones are swapped: ${n} has ${plural(t, 'ten')} and ${plural(o, 'one')}.`;
    return `${looks ? `That looks like the word for ${v}` : `Those words name ${v}`}, not ${n}.${why}`;
  }
  function wordsTip(q, r) {
    const n = q.answer, typed = norm(r), want = norm(W(n));
    if (!typed || typed === want) return '';
    if (VALUE[typed] !== undefined) return valueMsg(n, VALUE[typed]);
    if (typed.replace(/ /g, '') === want.replace(/ /g, '')) return 'Put a hyphen (or a space) between the tens word and the ones word.';
    const tt = typed.split(' '), wt = want.split(' ');
    // Read each typed word as the closest real number word; a misspelling of the right word is a spelling slip.
    const read = tt.map((tok, i) => { const c = closest(tok, wt[i]); return { tok, word: c.d <= Math.max(2, Math.floor(tok.length / 3)) ? c.word : null }; });
    if (read.every((x) => x.word)) {
      const meant = norm(read.map((x) => x.word).join(' '));
      if (meant === want) {
        const slip = read.find((x, i) => x.tok !== wt[i]);
        return `Check the spelling of "${slip.tok}". ${NOTES[slip.word].clue}`;
      }
      if (VALUE[meant] !== undefined && tt.length === wt.length) return valueMsg(n, VALUE[meant], true);
      if (tt.length < wt.length && wt.includes(read[0].word)) return `A part is missing. ${n} is ${plural(tensOf(n), 'ten')} and ${plural(onesOf(n), 'one')}: write the tens word, a hyphen, then the ones word.`;
    }
    return `Say ${n} slowly and write each part. ${spellHint(n)}`;
  }
  function numberTip(q, r) {
    const n = q.answer, v = pv.parseWholeNumber(r);
    if (v === null) return 'Write the number with digits, like 37.';
    if (v === n) return '';
    const t = tensOf(n), o = onesOf(n);
    if (n >= 13 && n <= 19 && v === o * 10) return '"-teen" means 1 ten and some ones, so the number is between 13 and 19.';
    if (n >= 13 && n <= 19 && v === 10 * o + 1) return 'A -teen number has 1 ten. Write the 1 first, then the ones digit.';
    if (n >= 20 && o && v === o * 10 + t) return `The tens word comes first: write the tens digit first, then the ones digit.`;
    if (n >= 20 && !o && v === 10 + t) return '"-ty" names tens, so the number ends in 0.';
    if (o && v === t * 10) return 'Look after the hyphen: the ones word tells the ones digit.';
    if (n === 11 || n === 12) return `"${W(n)}" is 1 ten and ${plural(o, 'one')}.`;
    return 'Find the tens word first, then the ones word.';
  }
  function mcTip(q, r) {
    if (!r || r === q.answer) return '';
    if (q.nwMatch === 'number') { const v = Number(r); return `${v} is "${W(v)}". Look at how the word ends: -teen or -ty?`; }
    const v = VALUE[norm(r)];
    return v === undefined ? '' : `"${r}" is the word for ${v}. Say the number aloud and listen to how it ends.`;
  }
  function letterTip(q, r) {
    if (!r || String(r).trim().toLowerCase() === q.answer) return '';
    const n = VALUE[norm(q.word)];
    return `Not that letter. ${NOTES[keyWord(n)].tclue}`;
  }
  /** The engine's feedback hook (help mode): specific, encouraging, and never the full answer. */
  function tip(q, r) {
    if (q.type === 'words') return wordsTip(q, r);
    if (q.type === 'number') return numberTip(q, r);
    if (q.type === 'mc') return mcTip(q, r);
    if (q.type === 'letter') return letterTip(q, r);
    return '';
  }

  // ---------- Pictures ----------
  /** A simple tens-and-ones model: rods for tens, cubes for ones, with counts. */
  function tensOnesFig(n, o) {
    o = o || {};
    const t = tensOf(n), u = onesOf(n);
    const col = (pi, count, label, unit, hi) => `<div class="blocks-col place-${pi === 2 ? 'tens' : 'ones'}${hi ? ' is-hi' : ''}"><div class="blocks-label">${label}</div><div class="blocks-art">${pv.placeSVG(pi, count)}</div>` +
      `<figcaption><b>${count}</b> ${unit}${count === 1 ? '' : 's'}</figcaption></div>`;
    return `<figure class="blocks blocks-2" aria-label="${n}: ${plural(t, 'ten')} and ${plural(u, 'one')}">${col(2, t, 'Tens', 'ten', o.hiT)}${col(3, u, 'Ones', 'one', o.hiO)}</figure>`;
  }
  /** A word split into its parts, the part that matters highlighted: "four" + "teen". */
  function partsHTML(parts) {
    return `<p class="nw-parts">${parts.map((p) => (typeof p === 'string' ? `<span class="nw-part">${esc(p)}</span>` : `<span class="nw-part is-key">${esc(p.t)}</span>`)).join('<span class="nw-plus" aria-hidden="true">+</span>')}</p>`;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** True when a question's own text prints the answer it asks for. */
  function leaks(q) {
    const text = [q.prompt].concat(q.type === 'mc' ? [] : []).join(' ').toLowerCase();
    if (q.type === 'words') return new RegExp(`(^|[^a-z-])${W(q.answer)}([^a-z-]|$)`).test(text);
    if (q.type === 'number') return (text.match(/\d+/g) || []).some((x) => Number(x) === q.answer);
    return false;
  }


  // ---------- Tests: no question gives away another question's spelling ----------
  /** The number a question is about. */
  const numOf = (q) => (q.type === 'letter' ? VALUE[norm(q.word)] : q.type === 'mc' ? (q.nwMatch === 'number' ? Number(q.answer) : VALUE[norm(q.answer)]) : q.answer);
  /** Words a question prints on screen. */
  function shownWords(q) {
    if (q.type === 'mc') return q.nwMatch === 'number' ? [W(Number(q.answer))] : q.choices.slice();
    if (q.type === 'number') return [W(q.answer)];
    if (q.type === 'letter') return [q.word];
    if (q.wrongForm) return [q.wrongForm];
    return [];
  }
  const SPELLING = ['spell', 'fix', 'tricky'];
  /**
   * A test is fair when each spelling question (write, fix, complete) has its own tricky word (the teen or tens word),
   * and no other question prints that word (or a two-word answer's ones word), whole or as part of a two-word number.
   */
  function testOK(qs) {
    const sp = qs.filter((q) => SPELLING.includes(q.skill));
    const keys = sp.map((q) => keyWord(numOf(q)));
    if (new Set(keys).size !== keys.length) return false;
    if (new Set(qs.map((q) => q.skill + ':' + numOf(q))).size !== qs.length) return false; // never the same task twice
    // The teen or tens word, and for a two-word number its ones word too (review NW23-03), is printed by no other question.
    return sp.every((q) => {
      const n = numOf(q), guard = [keyWord(n)].concat(n >= 20 && n % 10 ? [W(n % 10)] : []);
      return !qs.some((o) => o.id !== q.id && shownWords(o).some((w) => norm(w).split(' ').some((part) => guard.includes(part))));
    });
  }

  MB.nw99 = { NOTES, TENS, TEENS, VALUE, W, explain, spellHint, READ_HINT, nearNumbers, matchQ, readQ, spellQ, trickyQ, fixQ, tip, wordsTip, numberTip, tensOnesFig, partsHTML, leaks, keyWord, closest, numOf, shownWords, testOK, MISSPELT };
})(typeof window !== 'undefined' ? window : globalThis);
