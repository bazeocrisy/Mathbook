/*
 * Number Words logic (no DOM): practice rounds, spelling tests with rotating coverage, letter comparison.
 * Reusable by every Number Words phase; unit-tested in tests/number-words.test.js.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;

  const letters = (w) => w.split('').join('-');
  // Most tips already spell the word letter by letter, so only add the letters when the tip doesn't.
  const explain = (w) => `${w.n} is spelled ${w.word}. ${w.tip.includes(letters(w.word)) ? w.tip : `${letters(w.word)}. ${w.tip}`}`;

  // ---------- Item builders ----------
  const item = {
    fromNumeral(w) {
      return { type: 'spell', skill: w.word, numeral: w.n, answer: w.word, prompt: 'Write this number as a word.',
        hint: `It starts with "${w.word[0]}" and has ${w.word.length} letters.`, explanation: explain(w) };
    },
    fromTenFrame(w) {
      return { type: 'spell', skill: w.word, tenFrame: w.n, answer: w.word, prompt: 'How many dots? Write the number as a word.',
        hint: `Count the dots. The word starts with "${w.word[0]}" and has ${w.word.length} letters.`, explanation: explain(w) };
    },
    choose(w, r) {
      return { type: 'mc', skill: w.word, answer: w.word, choices: pv.shuffle(r, [w.word].concat(w.misspellings)),
        prompt: `Which is the correct spelling of ${w.n}?`, hint: 'Say the word slowly. Picture it from the Learn page.', explanation: explain(w) };
    },
    missingLetter(w, r) {
      const missing = pv.randInt(r, 0, w.word.length - 1);
      return { type: 'letter', skill: w.word, word: w.word, missing, answer: w.word[missing],
        prompt: `Fill in the missing letter in the word for ${w.n}.`, hint: `Say "${w.word}" slowly and listen for each sound.`, explanation: explain(w) };
    }
  };

  /** A guided-practice round: varied activity types, cycling through the chosen words. */
  function practiceRound(phase, seed, focusWords) {
    const r = pv.rng(seed);
    const pool = phase.words.filter((w) => !focusWords || !focusWords.length || focusWords.includes(w.word));
    const size = phase.practiceSize || 8;
    const order = [];
    while (order.length < size) order.push(...pv.shuffle(r, pool));
    const kinds = ['fromNumeral', 'choose', 'missingLetter', 'fromTenFrame'];
    return order.slice(0, size).map((w, i) => Object.assign(item[kinds[i % kinds.length]](w, r), { id: `pr${i + 1}` }));
  }

  /**
   * Which word to leave out of this test (a test has fewer questions than words).
   * Never the word left out last time, so every word is tested within any two attempts in a row.
   * Among the rest, leave out the word tested most often so far (ties broken randomly).
   */
  function chooseOmitted(phase, history, r) {
    const n = phase.words.length - phase.testSize;
    if (n <= 0) return [];
    const counts = {};
    phase.words.forEach((w) => { counts[w.word] = 0; });
    (history || []).forEach((a) => (a.assessed || []).forEach((word) => { if (word in counts) counts[word] += 1; }));
    const last = history && history.length ? history[history.length - 1].omitted || [] : [];
    const candidates = pv.shuffle(r, phase.words.map((w) => w.word).filter((word) => !last.includes(word)));
    candidates.sort((a, b) => counts[b] - counts[a]);
    return candidates.slice(0, n);
  }

  /** A spelling test: every answer must be typed in full; no hints; random order. */
  function spellingTest(phase, seed, history) {
    const r = pv.rng(seed);
    const omitted = chooseOmitted(phase, history, r);
    const words = pv.shuffle(r, phase.words.filter((w) => !omitted.includes(w.word)));
    const questions = words.map((w, i) => {
      const q = r() < 0.5 ? item.fromNumeral(w) : item.fromTenFrame(w);
      delete q.hint; // tests never show hints
      return Object.assign(q, { id: `s${i + 1}` });
    });
    return { questions, omitted, assessed: words.map((w) => w.word) };
  }

  /** Letter-by-letter comparison for feedback: [{ ch, ok }] for what was typed, padded with '_' for missing letters. */
  function compareLetters(typed, correct) {
    const t = String(typed || '').trim().toLowerCase().split('');
    const out = t.map((ch, i) => ({ ch, ok: ch === correct[i] }));
    for (let i = t.length; i < correct.length; i++) out.push({ ch: '_', ok: false });
    return out;
  }

  MB.numberWords = MB.numberWords || {};
  Object.assign(MB.numberWords, { item, practiceRound, chooseOmitted, spellingTest, compareLetters, letters });
})(typeof window !== 'undefined' ? window : globalThis);
