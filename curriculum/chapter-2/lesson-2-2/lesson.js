/*
 * Mathbook — Chapter 2, Lesson 2-2: Round Multi-Digit Numbers
 * Teaching content only. The reusable engine lives in assets/js/.
 * Rounds whole numbers to the nearest 10 and 100 (halfway rounds up). Every answer, number line,
 * and explanation is computed with Mathbook.pv.roundTo / roundEnds, so they can never disagree.
 * See tests/rounding.test.js for the checks.
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;
  const { fmt, roundTo, roundEnds, roundRange, roundLineHTML, numberLineHTML } = pv;

  const word = (place) => (place === 10 ? 'ten' : 'hundred');
  const digitName = (place) => (place === 10 ? 'ones' : 'tens');
  const digitAt = (n, place) => Math.floor(n / (place / 10)) % 10;

  /** Number-line reasoning: endpoints, halfway, and which way n rounds. */
  function why(n, place) {
    const { lo, hi, mid } = roundEnds(n, place);
    const r = roundTo(n, place);
    if (n % place === 0) return `${fmt(n)} is already a multiple of ${place}, so to the nearest ${word(place)} it stays ${fmt(n)}.`;
    if (n === mid) return `${fmt(n)} is between ${fmt(lo)} and ${fmt(hi)}, exactly halfway. Both are equally close, so we use the rule: round up to the higher ${word(place)}. ${fmt(n)} rounds to ${fmt(r)}.`;
    const side = n > mid ? `past halfway, so it is closer to ${fmt(hi)}` : `before halfway, so it is closer to ${fmt(lo)}`;
    return `${fmt(n)} is between ${fmt(lo)} and ${fmt(hi)}. Halfway is ${fmt(mid)}. ${fmt(n)} is ${side}. ${fmt(n)} rounds to ${fmt(r)}.`;
  }

  /** Place-value reasoning: the digit to look at, up or down, and the carry when rounding up fills a place. */
  function digitWhy(n, place) {
    const d = digitAt(n, place);
    const r = roundTo(n, place);
    const lower = Math.floor(n / place) * place;
    let s = `To round to the nearest ${word(place)}, look at the ${digitName(place)} digit: ${d}. ` +
      (d >= 5 ? `${d} is 5 or more, so round up to ${fmt(r)}.` : `${d} is less than 5, so round down to ${fmt(r)}.`);
    if (r > lower && r % (place * 10) === 0) {
      s += ` ${lower / place} ${word(place)}s and 1 more ${word(place)} make ${r / place} ${word(place)}s, which is ${fmt(r)}.`;
    }
    return s;
  }

  // ---------- Question builders ----------

  /**
   * Number line: one line, one small part at a time — the two tens/hundreds, halfway, then which one it rounds to.
   * Checks the method, not just the answer. Hints and feedback for each part come from the "rline" question type.
   */
  function lineQ(n, place, id) {
    return {
      id, type: 'rline', n, place, skill: place === 10 ? 'line10' : 'line100',
      prompt: `Round ${fmt(n)} to the nearest ${word(place)}.`,
      hint: `Which two ${word(place)}s is ${fmt(n)} between? Then find halfway.`,
      explanation: why(n, place)
    };
  }

  /** Place value: one number, one place. */
  function pvQ(n, place, id) {
    return {
      id, type: 'number', skill: place === 10 ? 'pv10' : 'pv100',
      prompt: `Round ${fmt(n)} to the nearest ${word(place)}.`, answer: roundTo(n, place),
      hint: `Look at the ${digitName(place)} digit. 0 to 4: round down. 5 to 9: round up.`,
      explanation: digitWhy(n, place)
    };
  }

  // ---------- Learn: five steps, each Example then Your Turn ----------

  const say = (html) => `<p class="slide-say">${html}</p>`;
  const look = (n, place) => {
    const s = String(n);
    const k = s.length - (place === 10 ? 1 : 2);
    return `<p class="rd-num" aria-label="${fmt(n)}: look at the ${digitName(place)} digit, ${s[k]}">` +
      s.split('').map((c, i) => `<span class="rd-d${i === k ? ' is-look' : ''}${i > k ? ' is-after' : ''}" aria-hidden="true">${c}</span>`).join('') + `</p>`;
  };
  const rule = (place) => `<div class="rd-rule"><p><b>0, 1, 2, 3, 4</b> → round <b>down</b> (keep the same ${word(place)}).</p>` +
    `<p><b>5, 6, 7, 8, 9</b> → round <b>up</b> to the next ${word(place)}.</p><p>Every digit to the right becomes <b>0</b>.</p></div>`;

  // Numbers used in the Learn examples; Your Turn never repeats them.
  const DEMO = [127, 342, 265, 896, 995, 950, 255, 315, 240];

  function randomNot(r, min, max, ok) {
    let n;
    do { n = pv.randInt(r, min, max); } while (!ok(n) || DEMO.includes(n));
    return n;
  }

  const steps = [
    {
      id: 'tens-line', kind: 'slides', title: 'Nearest ten on a number line',
      explain: 'Find the two tens. Find halfway. Then see which ten is closer.',
      slides: [
        say('What two tens is 127 between? <b>120</b> and <b>130</b>.') + roundLineHTML(127, 10, 'ends'),
        say('What number is halfway? <b>125</b>.') + roundLineHTML(127, 10, 'mid'),
        say('Put 127 on the line. Which ten is closer? <b>130</b>.') + roundLineHTML(127, 10, 'point'),
        say('Which way does it round?') + roundLineHTML(127, 10, 'all')
      ],
      check(r) { return lineQ(randomNot(r, 101, 989, (n) => n % 10 !== 0), 10, 'learn-1'); },
      staged: true
    },
    {
      id: 'hundreds-line', kind: 'slides', title: 'Nearest hundred on a number line',
      explain: 'Now use hundreds. Find the two hundreds. Find halfway. Then see which hundred is closer.',
      slides: [
        say('What two hundreds is 127 between? <b>100</b> and <b>200</b>.') + roundLineHTML(127, 100, 'ends'),
        say('What number is halfway? <b>150</b>.') + roundLineHTML(127, 100, 'mid'),
        say('Put 127 on the line. Which hundred is closer? <b>100</b>.') + roundLineHTML(127, 100, 'point'),
        say('Which way does it round?') + roundLineHTML(127, 100, 'all')
      ],
      // Your Turn: a number past the halfway point (it rounds up).
      check(r) { return lineQ(randomNot(r, 151, 999, (n) => n % 100 > 50), 100, 'learn-2'); },
      staged: true
    },
    {
      id: 'place-value', kind: 'slides', title: 'Use place value',
      explain: 'You can round without drawing a line. Look at one digit: the ones digit for the nearest ten, the tens digit for the nearest hundred.',
      slides: [
        say('Nearest <b>ten</b>: look at the <b>ones</b> digit. In 342 it is <b>2</b>.') + look(342, 10) + rule(10) + say('2 is less than 5, so <b>342 rounds to 340</b>.'),
        say('Nearest <b>hundred</b>: look at the <b>tens</b> digit. In 342 it is <b>4</b>.') + look(342, 100) + rule(100) + say('4 is less than 5, so <b>342 rounds to 300</b>.'),
        say('Halfway: <b>265</b> to the nearest ten. The ones digit is <b>5</b>.') + look(265, 10) + say('5 means exactly halfway, and halfway rounds <b>up</b>. <b>265 rounds to 270.</b>'),
        say('<b>896</b> to the nearest ten. The ones digit is <b>6</b>, so round up.') + look(896, 10) +
          say('89 tens and 1 more ten make 90 tens. <b>896 rounds to 900.</b>') +
          say('The same thing happens at 1,000: <b>995</b> rounds to <b>1,000</b> (nearest ten), and <b>950</b> rounds to <b>1,000</b> (nearest hundred).')
      ],
      check(r) {
        const n = randomNot(r, 101, 989, (x) => x % 10 !== 0 && roundTo(x, 10) !== roundTo(x, 100));
        return {
          id: 'learn-3', type: 'parts', skill: 'pv10', prompt: `Round ${fmt(n)} two ways.`, display: fmt(n),
          parts: [{ kind: 'num', label: 'Nearest ten:', answer: roundTo(n, 10) }, { kind: 'num', label: 'Nearest hundred:', answer: roundTo(n, 100) }],
          hint: 'For the nearest ten, look at the ones digit. For the nearest hundred, look at the tens digit.',
          explanation: digitWhy(n, 10) + ' ' + digitWhy(n, 100)
        };
      }
    },
    {
      id: 'reasoning', kind: 'slides', title: 'Explain and work backward',
      explain: 'The same number can round to different answers. You can also work backward from a rounded number.',
      slides: [
        say('<b>255</b> to the nearest <b>ten</b> is <b>260</b>. To the nearest <b>hundred</b> it is <b>300</b>.') +
          `<div class="slide-pair">${roundLineHTML(255, 10, 'all')}${roundLineHTML(255, 100, 'all')}</div>` +
          say('The answers are different because they ask about different places: the nearest ten looks at the ones digit, and the nearest hundred looks at the tens digit.'),
        say('Work backward: which numbers round to <b>240</b> (nearest ten)?') +
          numberLineHTML({ min: 230, max: 250, minor: 1, major: [230, 240, 250], band: { from: 235, to: 244 },
            below: [{ v: 230, text: '230' }, { v: 235, text: '235', cls: 'is-answer' }, { v: 244, text: '244', cls: 'is-answer' }, { v: 250, text: '250' }],
            point: { v: 240, text: '240' }, label: 'Number line from 230 to 250 with 235 through 244 shaded: these all round to 240.' }) +
          say('Every whole number from <b>235 through 244</b> rounds to 240. 234 rounds to 230, and 245 rounds to 250.'),
        say('Find the mistake. Jo says <b>315</b> rounded to the nearest ten is <b>310</b>.') + roundLineHTML(315, 10, 'all') +
          say('The ones digit is 5: exactly halfway. Halfway rounds <b>up</b>, so 315 rounds to <b>320</b>, not 310.')
      ],
      check(r) {
        const place = pv.pick(r, [10, 100]);
        const m = randomNot(r, 101, 989, (x) => x % 10 !== 0);
        let t, h;
        do { t = pv.randInt(r, 11, 98) * 10; } while (DEMO.includes(t));
        do { h = pv.randInt(r, 10, 98) * 10 + 5; } while (DEMO.includes(h));
        const right = `No. ${fmt(h)} is exactly halfway, and halfway rounds up to ${fmt(h + 5)}.`;
        return {
          id: 'learn-4', type: 'parts', skill: 'reason', prompt: 'Answer all three.',
          parts: [
            { kind: 'num', label: `Round ${fmt(m)} to the nearest ${word(place)}:`, answer: roundTo(m, place) },
            { kind: 'round', label: `Write a whole number that rounds to ${fmt(t)} (nearest ten):`, place: 10, target: t },
            { kind: 'choice', label: `Kim says ${fmt(h)} rounds to ${fmt(h - 5)} (nearest ten). Is Kim right?`, answer: right,
              choices: pv.shuffle(r, [right, 'Yes. Numbers exactly halfway round down.', `Yes. ${fmt(h)} is closer to ${fmt(h - 5)}.`]) }
          ],
          hint: 'Use the digit rule for the first one. For the second, any number from 5 below to 4 above works. For the third, think about halfway.',
          explanation: `${digitWhy(m, place)} Any whole number from ${fmt(t - 5)} to ${fmt(t + 4)} rounds to ${fmt(t)}. ${fmt(h)} is exactly halfway, so it rounds up to ${fmt(h + 5)}.`
        };
      }
    },
    {
      id: 'real-life', kind: 'slides', title: 'Use rounding in real life',
      explain: 'Rounding helps you estimate. An estimate is close, but it is not exact — check the exact amount when it matters.',
      slides: [
        say('Which lengths round to <b>60 cm</b> (nearest ten)? Check each one.') +
          `<ul class="sa-list">${[[54, 50], [55, 60], [60, 60], [63, 60], [65, 70]].map(([n, r]) =>
            `<li class="${r === 60 ? 'is-yes' : 'is-no'}"><b>${n} cm</b> rounds to ${r} cm <span>${r === 60 ? '✓ choose it' : '✗ not 60'}</span></li>`).join('')}</ul>` +
          say('Choose <b>all</b> the ones that work: 55, 60, and 63. (60 is already a ten, so it stays 60.)'),
        say('Rita has <b>$50</b>. She wants three things: <b>$15</b>, <b>$22</b>, and <b>$12</b>.') +
          `<div class="money"><p><b>Estimate</b> (nearest $10): $20 + $20 + $10 = <b>$50</b>.</p><p>That is about $50 — but an estimate is not exact, so it can't tell us for sure.</p>` +
          `<p><b>Exact total:</b> $15 + $22 + $12 = <b>$49</b>.</p><p>$49 is less than $50, so Rita <b>has enough</b>, with <b>$1</b> left.</p></div>`
      ],
      check(r) {
        let T;
        do { T = pv.randInt(r, 3, 9) * 10; } while (T === 60); // 60 is the worked example
        const pool = [[T - 6, false], [T - 5, true], [T - 2, true], [T, true], [T + 4, true], [T + 5, false]];
        const shown = pv.shuffle(r, pool);
        // Prices: two items, budget = the rounded estimate; sometimes enough, sometimes not.
        let a, b;
        do { a = pv.randInt(r, 11, 39); b = pv.randInt(r, 11, 39); } while (a % 10 === 0 || b % 10 === 0 || a === b);
        const est = roundTo(a, 10) + roundTo(b, 10);
        const exact = a + b;
        // The right choice checks the exact total; the others are the usual mistakes.
        const enough = exact <= est;
        const answer = enough ? `Yes. The exact total is $${exact}, so she has enough${est - exact > 0 ? ` with $${est - exact} left` : ''}.`
          : `No. The exact total is $${exact}, which is more than $${est}.`;
        const others = enough ? [`No. The exact total is more than $${est}.`, 'Yes. An estimate is always the exact cost.']
          : [`Yes. The estimate is $${est}, so she has enough.`, 'Yes. An estimate is always the exact cost.'];
        return {
          id: 'learn-5', type: 'parts', skill: 'apply', prompt: 'Answer both.',
          parts: [
            { kind: 'multi', label: `Which lengths round to ${T} cm (nearest ten)?`, choices: shown.map(([n]) => `${n} cm`), answer: shown.filter(([, ok]) => ok).map(([n]) => `${n} cm`) },
            { kind: 'choice', label: `Mia has $${est}. She buys things for $${a} and $${b}. She says, "My estimate is $${est}, so I have enough." Is she right?`, answer,
              choices: pv.shuffle(r, [answer, ...others]) }
          ],
          hint: 'Round each length and keep the ones that land on the target. For money, add the exact prices to be sure.',
          explanation: `Lengths from ${T - 5} cm to ${T + 4} cm round to ${T} cm. Mia's estimate is $${roundTo(a, 10)} + $${roundTo(b, 10)} = $${est}, but the exact total is $${a} + $${b} = $${exact}. ` +
            (exact <= est ? `$${exact} is not more than $${est}, so she has enough.` : `$${exact} is more than $${est}, so she does not have enough.`)
        };
      }
    }
  ];

  // ---------- Practice (12) and Test (12): different numbers, the same coverage ----------

  const fixedOrder = (seed, list) => pv.shuffle(pv.rng(seed), list);
  function compareQ(id, n, seed) {
    const digitTen = digitAt(n, 10), digitHundred = digitAt(n, 100);
    const right = `Nearest ten looks at the ones digit (${digitTen}), so it rounds ${digitTen >= 5 ? 'up' : 'down'}. Nearest hundred looks at the tens digit (${digitHundred}), so it rounds ${digitHundred >= 5 ? 'up' : 'down'}.`;
    return {
      id, type: 'parts', skill: 'compare', prompt: `Round ${fmt(n)} two ways, then explain.`, display: fmt(n),
      parts: [
        { kind: 'num', label: 'Nearest ten:', answer: roundTo(n, 10) },
        { kind: 'num', label: 'Nearest hundred:', answer: roundTo(n, 100) },
        { kind: 'choice', label: 'Why are the answers different?', answer: right, choices: fixedOrder(seed, [right,
          'One answer must be a mistake. A number can only round one way.',
          'Rounding to the nearest hundred always gives a smaller number.',
          'Both answers look at the ones digit.']) }
      ],
      hint: 'Which digit do you look at for the nearest ten? Which digit for the nearest hundred?',
      explanation: `${digitWhy(n, 10)} ${digitWhy(n, 100)} The answers differ because each one asks about a different place.`
    };
  }
  function backQ(id, target) {
    const [a, b] = roundRange(target, 10);
    return {
      id, type: 'parts', skill: 'reverse', prompt: `A number rounded to the nearest ten is ${fmt(target)}. What could the number be?`,
      parts: [{ kind: 'round', label: 'Write one whole number:', place: 10, target }],
      hint: `Which numbers are close enough to ${fmt(target)}? Think about the halfway points on each side.`,
      explanation: `Any whole number from ${fmt(a)} to ${fmt(b)} rounds to ${fmt(target)}. ${fmt(a)} is exactly halfway up from ${fmt(target - 10)}, so it rounds up to ${fmt(target)}; ${fmt(b + 1)} is halfway to ${fmt(target + 10)}, so it rounds to ${fmt(target + 10)}.`
    };
  }
  function explain100Q(id, n, seed) {
    const { mid } = roundEnds(n, 100);
    const up = n >= mid;
    const right = up ? 'It is past the halfway mark, so it is closer to the upper hundred.' : 'It is before the halfway mark, so it is closer to the lower hundred.';
    const flip = up ? 'It is before the halfway mark, so it is closer to the lower hundred.' : 'It is past the halfway mark, so it is closer to the upper hundred.';
    const d = n % 10;
    return {
      id, type: 'rline', n, place: 100, skill: 'explain100', prompt: `Round ${fmt(n)} to the nearest hundred, then explain why.`,
      why: { label: `Why does ${fmt(n)} round that way?`, answer: right, choices: fixedOrder(seed, [right, flip,
        `The ones digit is ${d}, so it rounds ${d >= 5 ? 'up' : 'down'}.`, `Numbers always round ${up ? 'down' : 'up'}.`]) },
      hint: 'Find the two hundreds and the halfway point. Is the number before or after halfway?',
      explanation: why(n, 100)
    };
  }
  function halfwayQ(id, who, n, place, seed) {
    const up = n + place / 2, down = n - place / 2;
    const right = `No. A number exactly halfway rounds up to the higher ${word(place)}.`;
    return {
      id, type: 'parts', skill: 'halfway',
      prompt: `${who} says ${fmt(n)} rounded to the nearest ${word(place)} is ${fmt(down)}, because ${fmt(n)} is exactly halfway.`,
      parts: [
        { kind: 'choice', label: `Is ${who} right?`, answer: right, choices: fixedOrder(seed, [right, 'Yes. Numbers exactly halfway round down.',
          'Yes. The smaller number is always the answer.', `No. ${fmt(n)} rounds to the next ${place === 10 ? 'hundred' : 'thousand'}.`]) },
        { kind: 'num', label: 'The correct answer:', answer: up }
      ],
      hint: `${fmt(n)} is exactly halfway between ${fmt(down)} and ${fmt(up)}. Which way do halfway numbers round?`,
      explanation: `${fmt(n)} is exactly halfway between ${fmt(down)} and ${fmt(up)}, so both are equally close. The rule is to round up to the higher ${word(place)}: ${fmt(up)}.`
    };
  }
  function selectQ(id, target, unit, list) {
    const choices = list.map((n) => `${n} ${unit}`);
    return {
      id, type: 'parts', skill: 'select', prompt: `Which round to ${fmt(target)} ${unit} (nearest hundred)?`,
      parts: [{ kind: 'multi', label: 'Choose all that do:', choices, answer: list.filter((n) => roundTo(n, 100) === target).map((n) => `${n} ${unit}`) }],
      hint: 'Round each one to the nearest hundred. Keep only the ones that land on the target.',
      explanation: list.map((n) => `${n} rounds to ${fmt(roundTo(n, 100))}${roundTo(n, 100) === target ? ' ✓' : ''}`).join('; ') + '.'
    };
  }
  function moneyQ(id, name, have, prices, seed) {
    const est = prices.reduce((s, p) => s + roundTo(p, 10), 0);
    const exact = prices.reduce((s, p) => s + p, 0);
    const enough = exact <= have;
    const left = have - exact;
    const right = enough ? `Yes. The exact total is not more than $${have}.` : `No. The exact total is more than $${have}.`;
    const wrong = enough
      ? [`No. An estimate can never tell us anything.`, `Yes, because the estimate is always the exact cost.`, `No. The exact total is more than $${have}.`]
      : [`Yes. The estimate is not more than $${have}, so that proves it.`, `Yes, because the estimate is always the exact cost.`, `No. The estimate is more than $${have}.`];
    return {
      id, type: 'parts', skill: 'money',
      prompt: `${name} has $${have}. ${name} wants things that cost ${prices.map((p) => `$${p}`).join(', ').replace(/, ([^,]*)$/, ', and $1')}.`,
      parts: [
        { kind: 'num', label: 'Estimate: round each price to the nearest $10 and add. $', answer: est },
        { kind: 'num', label: 'Exact total: $', answer: exact },
        { kind: 'choice', label: `Can ${name} be sure of having enough money?`, answer: right, choices: fixedOrder(seed, [right, ...wrong]) }
      ],
      hint: 'The estimate is close but not exact. Add the real prices to be sure.',
      explanation: `Estimate: ${prices.map((p) => `$${roundTo(p, 10)}`).join(' + ')} = $${est}. Exact: ${prices.map((p) => `$${p}`).join(' + ')} = $${exact}. ` +
        (enough ? `$${exact} is not more than $${have}, so ${name} has enough${left > 0 ? `, with $${left} left` : ''}.` : `$${exact} is more than $${have}, so ${name} does not have enough — even though the estimate was only $${est}.`)
    };
  }

  /**
   * Rounding Check-Up (Math Probe, pp. 41–42): choose every number that rounds to a target, then say how you decided.
   * The reasoning choices state a range or a rule and never name the item's own numbers (review A-04, A-09).
   * o: { id, target, place, prompt, nums, unit?, ask, right, wrong: [...], hint, rule, seed }
   */
  function probeQ(o) {
    const lab = (n) => (o.unit ? `${n} ${o.unit}` : fmt(n));
    return {
      id: o.id, type: 'parts', skill: 'probe', prompt: o.prompt,
      parts: [
        { kind: 'multi', label: 'Choose all that do:', choices: o.nums.map(lab), answer: o.nums.filter((n) => roundTo(n, o.place) === o.target).map(lab), compact: true },
        { kind: 'choice', label: o.ask, answer: o.right, choices: fixedOrder(o.seed, [o.right].concat(o.wrong)) }
      ],
      hint: o.hint,
      explanation: o.nums.map((n) => `${fmt(n)} rounds to ${fmt(roundTo(n, o.place))}${roundTo(n, o.place) === o.target ? ' ✓' : ''}`).join('; ') + `. ${o.rule}`
    };
  }
  const RANGE_WRONG_10 = (t, tens) => [`Numbers with a ${tens} in the tens place round to ${t}.`, `Every number from ${t - 10} to ${t + 10} rounds to ${t}.`];
  const FIRST_DIGIT = (who, d, t, lo, hi) => [
    `No. Look at the tens digit: numbers from ${lo} to ${hi} round to ${t}, whatever the first digit.`,
    ['Yes. The hundreds digit tells you the nearest hundred, so look only at it.', `No. Only numbers that end in 00 can round to ${t} when you round them.`, 'Yes, as long as the ones digit of the number is less than 5.']
  ];
  const HALF = (n, lo, hi) => [`${n} is exactly halfway between ${lo} and ${hi}, and halfway rounds up.`,
    [`${n} is closer to ${hi} than it is to ${lo}.`, `Its tens digit is ${Math.floor(n / 10)}, so the number rounds up.`, 'Every number with a 5 in it rounds up to the next ten.']];
  const MISTAKE = (pron, d, t, lo, hi) => [`Only numbers from ${lo} to ${hi} round to ${t}. Some of ${pron} numbers are outside that range.`,
    [`Numbers starting with ${d} always round to ${d}00, and ${pron === 'his' ? 'he' : 'she'} forgot that rule.`, `Numbers ending in 0 always round down, and ${pron === 'his' ? 'he' : 'she'} forgot that rule.`,
      `${pron === 'his' ? 'He' : 'She'} made no mistake. Every number ${pron === 'his' ? 'he' : 'she'} chose rounds to ${t}.`]];
  function checkUp(test) {
    const [f1, f2] = test ? FIRST_DIGIT('Ben', 4, 400, 350, 449) : FIRST_DIGIT('Lily', 7, 700, 650, 749);
    const [h1, h2] = test ? HALF(35, 30, 40) : HALF(75, 70, 80);
    const [m1, m2] = test ? MISTAKE('her', 7, 800, 750, 849) : MISTAKE('his', 3, 400, 350, 449);
    return test ? [
      probeQ({ id: 'tr1', target: 260, place: 10, prompt: 'You round to the nearest ten. Which numbers round to 260? Choose all.', nums: [263, 258, 255, 254, 266, 265, 163, 159],
        ask: 'How can you tell which numbers round to 260?', right: 'Numbers from 255 to 264 round to 260 (255 is halfway and rounds up).',
        wrong: ['Numbers with a 6 in the tens place round to 260.', 'Numbers that end in 3, 5 or 8 round to 260.', 'Every number from 250 to 270 rounds to 260.'],
        rule: 'Only numbers from 255 to 264 round to 260. 265 is halfway to 270, so it rounds up to 270.', seed: 401 }),
      probeQ({ id: 'tr2', target: 400, place: 100, prompt: 'You round to the nearest hundred. Which numbers round to 400? Choose all.', nums: [438, 352, 449, 451, 467, 349, 486, 318],
        ask: 'Ben says every number that starts with 4 rounds to 400. Is he right?', right: f1, wrong: f2,
        rule: 'Numbers from 350 to 449 round to 400. 352 starts with 3 but rounds up to 400. 451, 467 and 486 are 450 or more, so they round to 500.', seed: 402 }),
      probeQ({ id: 'tr3', target: 50, place: 10, prompt: 'You round to the nearest ten. Which numbers round to 50? Choose all.', nums: [46, 55, 45, 54, 49, 44],
        ask: 'Why does 35 round to 40 and not to 30?', right: h1, wrong: h2,
        rule: 'Numbers from 45 to 54 round to 50. 45 is halfway and rounds up to 50; 55 is halfway and rounds up to 60.', seed: 403 }),
      probeQ({ id: 'tr4', target: 800, place: 100, prompt: 'Kara chose 850, 761, 829 and 708 as numbers that round to 800 (nearest hundred). Which of her choices are right? Choose all.',
        nums: [850, 761, 829, 708], ask: 'What mistake did Kara make?', right: m1, wrong: m2,
        rule: 'Only numbers from 750 to 849 round to 800. 850 is halfway, so it rounds up to 900. 708 rounds down to 700.', seed: 404 })
    ] : [
      probeQ({ id: 'pr1', target: 480, place: 10, prompt: 'You round to the nearest ten. Which numbers round to 480? Choose all.', nums: [483, 487, 476, 475, 474, 485, 384, 379],
        ask: 'How can you tell which numbers round to 480?', right: 'Numbers from 475 to 484 round to 480 (475 is halfway and rounds up).',
        wrong: ['Numbers with an 8 in the tens place round to 480.', 'Numbers that end in 4 or 5 round to 480.', 'Every number from 470 to 490 rounds to 480.'],
        hint: 'Find halfway on each side of 480: 475 and 485. Which numbers are between them?',
        rule: 'Only numbers from 475 to 484 round to 480. 485 is halfway to 490, so it rounds up to 490. 384 and 379 are near 380, not 480.', seed: 301 }),
      probeQ({ id: 'pr2', target: 700, place: 100, prompt: 'You round to the nearest hundred. Which numbers round to 700? Choose all.', nums: [756, 681, 742, 627, 769, 609, 794, 715],
        ask: 'Lily says every number that starts with 7 rounds to 700. Is she right?', right: f1, wrong: f2,
        hint: 'Look at the tens digit, not the first digit. Numbers from 650 to 749 round to 700.',
        rule: 'Numbers from 650 to 749 round to 700. 681 is past 650, so it rounds up to 700. 756, 769 and 794 are 750 or more, so they round to 800.', seed: 302 }),
      probeQ({ id: 'pr3', target: 90, place: 10, unit: 'stickers', prompt: 'Bags of stickers. Which bags have about 90 stickers (nearest ten)? Choose all.', nums: [86, 94, 95, 85, 89, 79],
        ask: 'Why does 75 round to 80 and not to 70?', right: h1, wrong: h2,
        hint: 'Halfway points: 85 and 95. Which way does halfway round?',
        rule: 'Numbers from 85 to 94 round to 90. 85 is halfway and rounds up to 90; 95 is halfway and rounds up to 100.', seed: 303 }),
      probeQ({ id: 'pr4', target: 400, place: 100, prompt: 'Max chose 450, 362, 418 and 309 as numbers that round to 400 (nearest hundred). Which of his choices are right? Choose all.',
        nums: [450, 362, 418, 309], ask: 'What mistake did Max make?', right: m1, wrong: m2,
        hint: 'Find halfway on each side of 400: 350 and 450. Which way does halfway round?',
        rule: 'Only numbers from 350 to 449 round to 400. 450 is halfway, so it rounds up to 500. 309 rounds down to 300.', seed: 304 })
    ];
  }
  const checkPractice = checkUp(false);
  const checkTestItems = checkUp(true).map((q) => { const c = Object.assign({}, q); delete c.hint; return c; });
  /** The Rounding Check-Up test: the same 4 items; choice order changes with each attempt. */
  function checkupTest(seed) {
    const r = pv.rng(seed);
    return checkTestItems.map((q) => Object.assign({}, q, { parts: q.parts.map((p) => Object.assign({}, p, { choices: pv.shuffle(r, p.choices) })) }));
  }

  // Practice: items 1–12 match the Test item for item, with different numbers.
  const practice = [
    lineQ(46, 10, 'p1'),                        // 1 nearest 10, number line, 2-digit (book item 1)
    lineQ(396, 10, 'p2'),                       // 2 nearest 10, number line, carry into the next hundred (→ 400)
    pvQ(63, 10, 'p3'),                          // 3 nearest 10, place value, rounds down (2-digit)
    pvQ(485, 10, 'p4'),                         // 4 nearest 10, place value, rounds up (halfway)
    lineQ(418, 100, 'p5'),                      // 5 nearest 100, number line, rounds down
    lineQ(87, 100, 'p6'),                       // 6 nearest 100, number line, 2-digit: between 0 and 100 (book item 7)
    compareQ('p7', 249, 71),              // 7 tens vs hundreds
    backQ('p8', 380),                           // 8 a possible original number (375–384)
    explain100Q('p9', 561, 91),                 // 9 explain a nearest-100 result
    halfwayQ('p10', 'Maya', 650, 100, 101),     // 10 correct a halfway claim (→ 700)
    selectQ('p11', 300, 'crayons', [249, 251, 300, 342, 350, 399]), // 11 select all (exact multiple 300; halfway 350 → 400)
    moneyQ('p12', 'Dev', 45, [14, 23, 12], 121) // 12 estimate $40 says yes; exact $49 says no
  ];
  const parentTips = {
    p1: 'Ask: "Which two tens is 46 between?" Then: "What is halfway?"',
    p6: 'Ask: "Which two hundreds is 87 between?" (0 and 100.) Then: "What is halfway?"',
    p2: 'Watch for the carry: one more ten after 390 is 400, not 3,100 or 310.',
    p4: 'Ask: "Is 5 rounding up or down?" (Halfway rounds up.)',
    p7: 'Ask your student to say which digit each rounding looks at.',
    p8: 'There are 10 right answers. Ask for a second one.',
    p12: 'Ask: "Does the estimate tell us for sure? What does?"'
  };
  practice.forEach((q) => { if (parentTips[q.id]) q.parent = parentTips[q.id]; });

  const testItems = [
    lineQ(72, 10, 't1'),                         // 2-digit on a number line
    lineQ(297, 10, 't2'),                        // carry (→ 300)
    pvQ(621, 10, 't3'),                          // rounds down
    pvQ(735, 10, 't4'),                          // halfway, rounds up
    lineQ(314, 100, 't5'),                       // rounds down
    lineQ(781, 100, 't6'),                       // rounds up
    compareQ('t7', 347, 77),
    backQ('t8', 520),                            // 515–524
    explain100Q('t9', 849, 97),
    halfwayQ('t10', 'Leo', 85, 10, 107),         // 2-digit halfway (→ 90)
    selectQ('t11', 500, 'pages', [449, 450, 482, 500, 538, 551]), // halfway 450 ✓, exact 500 ✓
    moneyQ('t12', 'Ana', 60, [27, 16, 14], 127)  // estimate $60, exact $57: enough, $3 left
  ].map((q) => { const c = Object.assign({}, q); delete c.hint; delete c.parent; return c; });

  /** The Rounding Test: the same 12 items each time; choice order changes with each attempt. */
  function roundingTest(seed) {
    const r = pv.rng(seed);
    return testItems.map((q) => (!q.parts ? Object.assign({}, q) : Object.assign({}, q, { parts: q.parts.map((p) => (p.kind === 'choice' ? Object.assign({}, p, { choices: pv.shuffle(r, p.choices) }) : p)) })));
  }

  MB.lessons = MB.lessons || {};
  MB.lessons['2-2'] = {
    id: '2-2',
    storageKey: 'mathbook:v2:lesson-2-2',
    chapter: 2,
    chapterTitle: 'Place Value',
    number: '2-2',
    title: 'Round Multi-Digit Numbers',
    subtitle: 'Round to the nearest 10 and 100',
    objective: 'I can round 2- and 3-digit numbers to the nearest 10 and 100 with a number line and with place value, and explain my answer.',
    parentLearn: {
      goal: [
        'Find the two tens (or hundreds) a number is between.',
        'Find the halfway point and decide which one is nearest. Halfway rounds up.',
        'Use place value: the ones digit for the nearest ten, the tens digit for the nearest hundred.',
        'Explain an answer, work backward from a rounded number, and use rounding to estimate — then check the exact amount when it matters.'
      ],
      words: [
        { term: 'Round', meaning: 'Change a number to a nearby, simpler number.', example: '127 rounds to 130.' },
        { term: 'Nearest', meaning: 'The closest one. To the nearest ten means the closest multiple of 10.' },
        { term: 'Multiple of 10 / 100', meaning: 'A number you say when counting by 10s or 100s.', example: '120, 130 · 100, 200' },
        { term: 'Halfway point', meaning: 'The number exactly in the middle of two tens or two hundreds. A number exactly halfway rounds up.', example: '125 is halfway between 120 and 130.' },
        { term: 'Estimate', meaning: 'An answer that is close, found with rounded numbers. It is not exact.' },
        { term: 'Exact', meaning: 'The real amount, found with the actual numbers.', example: '$15 + $22 + $12 = $49 exactly.' }
      ],
      demoVisual: `<div class="slide-pair">${roundLineHTML(127, 10, 'all')}${roundLineHTML(127, 100, 'all')}</div>`,
      demonstrate: [
        'Write 127. Ask which two tens it is between (120 and 130).',
        'Find halfway: 125. 127 is past halfway, so it rounds to 130 (nearest ten).',
        'Now hundreds: 127 is between 100 and 200. Halfway is 150.',
        '127 is before 150, so it rounds to 100 (nearest hundred).',
        'Point out that the same number gave two different answers because we asked about different places.',
        'Rounding Check-Up: to find what rounds to 480, find the halfway points 475 and 485. Numbers from 475 up to 484 round to 480.'
      ],
      ask: [
        '"Which two tens (or hundreds) is it between?"',
        '"What is halfway?"',
        '"Which end is it closer to?"',
        '"Which digit do you look at for the nearest ten? For the nearest hundred?"',
        '"Does the estimate tell us for sure? How can we check?"',
        '"Why is a number line helpful for rounding?" (the book\'s Choosing Tools question)',
        'Rounding Check-Up: "What is the smallest number that rounds to it? The largest?" and "Does the first digit decide it?"',
        'After the Check-Up: "How do you feel about rounding: confused, still learning, I understand, or I can teach someone?"'
      ],
      checklist: [
        'Nearest ten on a number line: names both tens, halfway, and the rounded number.',
        'Nearest hundred on a number line: the same, with hundreds.',
        'Place value: looks at the right digit and writes zeros to the right (including 896 → 900).',
        'Explain and work backward: says why 255 → 260 and 300; finds a number that rounds to 240; fixes 315 → 320.',
        'Real life: chooses all quantities that round to an amount; checks the exact total before saying there is enough money.',
        'Rounding Check-Up: chooses every number that rounds to a ten or hundred, including halfway cases, and explains with the range, not the first digit.'
      ]
    },
    mistakes: [
      'Looking at the wrong digit (the tens digit when rounding to the nearest ten).',
      'Rounding halfway numbers down: 125 → 120. Halfway rounds up: 130.',
      'Forgetting the zeros: writing 13 instead of 130.',
      'Rounding in two steps: 145 → 150 → 200. To the nearest hundred, 145 is 100.',
      'Treating an estimate as exact: "$50 estimate, so I surely have enough."'
    ],
    seeIt: {
      steps,
      reflection: {
        prompt: 'When is rounding to the nearest ten more useful than rounding to the nearest hundred?',
        idea: 'Any sensible answer is fine. Example: for prices like $47 and $52, the nearest ten ($50 + $50) is much closer to the real cost than the nearest hundred ($0 + $100).'
      }
    },
    skills: {
      line10: 'Nearest 10 on a number line',
      pv10: 'Nearest 10 with place value',
      pv100: 'Nearest 100 with place value',
      line100: 'Nearest 100 on a number line',
      compare: 'Why tens and hundreds give different answers',
      reverse: 'Finding a number from its rounded value',
      explain100: 'Explaining a nearest-100 result',
      halfway: 'Halfway numbers round up',
      select: 'Choosing all numbers that round to an amount',
      money: 'Estimate vs. exact total',
      reason: 'Explaining and working backward',
      apply: 'Rounding in real life',
      probe: 'Choosing every number that rounds to an amount'
    },
    guided: practice,
    saveGuided: true, // Practice Together keeps its place and answers across a refresh
    bank: practice.concat(checkPractice),
    bankSets: [{ id: 's1', title: 'Rounding Practice', blurb: 'All 12 practice questions: number lines, place value, reasoning, and real life.', ids: practice.map((q) => q.id) },
      { id: 's2', title: 'Rounding Check-Up', blurb: 'Choose every number that rounds to a target, then tell how you decided.', ids: checkPractice.map((q) => q.id) }],
    tests: {
      rounding: { id: 'rounding', title: 'Rounding Test', questions: 12, blurb: 'Number lines, place value, explaining, working backward, and real life.', generate: roundingTest },
      checkup: { id: 'checkup', title: 'Rounding Check-Up', questions: 4, blurb: 'Choose every number that rounds to a target, and tell how you decided.', generate: checkupTest }
    },
    _why: why,
    _digitWhy: digitWhy,
    _testItems: testItems,
    _checkTestItems: checkTestItems
  };
})(typeof window !== 'undefined' ? window : globalThis);
