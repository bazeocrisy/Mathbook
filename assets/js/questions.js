/*
 * Mathbook question types. Shared by guided practice, the practice bank, and tests.
 *
 * A question is plain JSON (so attempts can be saved and re-shown after a refresh):
 *   { id, type, prompt, answer, skill, explanation, hint?, display?, model?, block?, choices? }
 * Types:
 *   mc       – pick one choice (choices[], answer = the correct choice text)
 *   select   – fill a blank "___" in the prompt from a drop-down (choices[], answer)
 *   number   – type a whole number (answer = number); commas and spaces are optional
 *   expanded – type expanded form of `answer` (see Mathbook.pv.checkExpanded)
 *   words    – type word form of `answer` (case, hyphens, commas, and "and" are ignored)
 *   chart    – type the digit in each place of `answer`
 *   build    – use + / – to build `answer` with base-ten blocks
 *   spell    – type a whole word (answer = word); capitals and surrounding spaces are ignored
 *   letter   – type the missing letter of `word` at index `missing` (answer = that letter)
 *   parts    – several small answers graded together (all must be right). parts: [
 *                { kind: 'num', label, answer }            a whole number
 *                { kind: 'round', label, place, target }   any whole number that rounds to target at place (10 or 100)
 *                { kind: 'choice', label, choices, answer } pick one
 *                { kind: 'multi', label, choices, answer: [] } select all that apply (exactly the right set) ]
 *              line: { place } draws a blank number line (left end, halfway, right end) with nothing filled in.
 *   rline    – round n to the nearest place (10 or 100) on one number line, one small part at a time:
 *              the two tens/hundreds, halfway, which way it rounds, [why: { label, choices, answer }].
 *              render option mode: 'guided' (check each part) | 'test' (default: no feedback) | 'review'.
 * Optional visuals: model (number drawn as blocks, no captions), block (single block place index),
 *   numeral (big digit card), tenFrame (0–10 dots).
 */
(function (root) {
  'use strict';
  const MB = (root.Mathbook = root.Mathbook || {});
  const pv = MB.pv;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function emptyResponse(q) {
    if (q.type === 'chart') return ['', '', '', ''];
    if (q.type === 'build') return [0, 0, 0, 0];
    if (q.type === 'parts') return q.parts.map((p) => (p.kind === 'multi' ? [] : ''));
    if (q.type === 'rline') return rlEmpty();
    return '';
  }

  /** Blank number line for a rounding question: three marks to name, nothing revealed. */
  function blankLine(place) {
    const w = place === 10 ? 'ten' : 'hundred';
    return `<div class="nline nline-blank" aria-hidden="true"><div class="nline-track"><span class="nline-bar"></span>` +
      [0, 50, 100].map((p) => `<span class="nline-tick is-major" style="left:${p}%"></span>`).join('') +
      `<span class="nline-label is-start" style="left:0%">lower ${w}</span><span class="nline-label" style="left:50%">halfway</span>` +
      `<span class="nline-label is-end" style="left:100%">upper ${w}</span></div></div>`;
  }

  function partOK(p, r) {
    if (p.kind === 'num') return pv.parseWholeNumber(r) === p.answer;
    if (p.kind === 'round') { const n = pv.parseWholeNumber(r); return n !== null && pv.roundTo(n, p.place) === p.target; }
    if (p.kind === 'choice') return r === p.answer;
    if (p.kind === 'multi') return Array.isArray(r) && r.length === p.answer.length && p.answer.every((a) => r.includes(a));
    return false;
  }

  function partAnswered(p, r) {
    if (p.kind === 'multi') return Array.isArray(r) && r.length > 0;
    return String(r === undefined || r === null ? '' : r).trim() !== '';
  }

  function partCorrectText(p) {
    if (p.kind === 'num') return pv.fmt(p.answer);
    if (p.kind === 'round') { const [a, b] = pv.roundRange(p.target, p.place); return `any whole number from ${pv.fmt(a)} to ${pv.fmt(b)}`; }
    if (p.kind === 'multi') return p.answer.join(', ');
    return p.answer;
  }

  function visuals(q) {
    let html = '';
    if (q.display) html += `<div class="q-display">${esc(q.display)}</div>`;
    if (typeof q.model === 'number') html += pv.blocksHTML(q.model, { captions: false });
    if (typeof q.block === 'number') html += `<div class="q-single-block">${pv.singleBlockSVG(q.block, 'A base-ten block')}</div>`;
    if (q.numeral !== undefined) html += `<div class="q-visual"><span class="numeral-card">${esc(q.numeral)}</span></div>`;
    if (typeof q.tenFrame === 'number') html += `<div class="q-visual">${pv.tenFrameSVG(q.tenFrame)}</div>`;
    return html;
  }

  /** Spelling answers: capitals and surrounding spaces don't matter; every letter does. */
  function normSpell(s) {
    return String(s === undefined || s === null ? '' : s).trim().toLowerCase();
  }

  // Attributes that stop phones and browsers from correcting or suggesting spellings.
  const NO_ASSIST = 'autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"';


  // ---------- rline: one rounding problem on one number line, in small stages ----------
  // Stages: 'ends' (the two tens/hundreds) → 'mid' (halfway) → 'pick' (which way) → ['why'] → 'done' (explanation).
  // mode 'guided' (Learn, Practice Together): Check Answer per stage, one hint after a miss, Continue after a right answer.
  // mode 'test' (Test, On My Own): Back / Next part between stages, no checking, nothing filled in for the child.
  // The whole response (values, stage, feedback) lives in one object so a refresh restores it exactly.
  function rlInfo(q) {
    const e = pv.roundEnds(q.n, q.place);
    const r = pv.roundTo(q.n, q.place);
    return Object.assign(e, { r, side: r === e.hi ? 'hi' : 'lo', half: q.n === e.mid, w: q.place === 10 ? 'ten' : 'hundred' });
  }
  const rlStages = (q) => ['ends', 'mid', 'pick'].concat(q.why ? ['why'] : [], ['done']);
  function rlEmpty() { return { lo: '', hi: '', mid: '', pick: '', why: '', stage: 0, ok: {}, tries: {}, fb: null, confirm: false, complete: false }; }
  function rlNorm(r) { return r && typeof r === 'object' && !Array.isArray(r) ? Object.assign(rlEmpty(), r) : rlEmpty(); }
  const num = (v) => pv.parseWholeNumber(v);

  function rlStageOK(q, R, st) {
    const I = rlInfo(q);
    if (st === 'ends') return num(R.lo) === I.lo && num(R.hi) === I.hi;
    if (st === 'mid') return num(R.mid) === I.mid;
    if (st === 'pick') return R.pick === I.side;
    if (st === 'why') return R.why === q.why.answer;
    return true;
  }
  function rlStageBlank(R, st) {
    if (st === 'ends') return !String(R.lo).trim() || !String(R.hi).trim();
    if (st === 'mid') return !String(R.mid).trim();
    if (st === 'pick') return !R.pick;
    if (st === 'why') return !R.why;
    return false;
  }
  /** One specific hint per miss; a second miss on the same part gives the answer for that part. */
  function rlHint(q, R, st) {
    const I = rlInfo(q), n = pv.fmt(q.n), lo = pv.fmt(I.lo), hi = pv.fmt(I.hi), mid = pv.fmt(I.mid);
    const again = (R.tries[st] || 0) >= 2;
    if (st === 'ends') {
      if (again) return `The ${I.w}s around ${n} are ${lo} and ${hi}.`;
      if (num(R.lo) !== I.lo) return q.place === 10 ? `Which ten is just below ${n}? Change the ones digit to 0.` : `Which hundred is just below ${n}? Change the tens and ones digits to 0.`;
      return `Count up one ${I.w} from ${lo}.`;
    }
    if (st === 'mid') return again ? `Halfway between ${lo} and ${hi} is ${mid}.` : `Halfway is ${q.place === 10 ? '5' : '50'} more than ${lo}.`;
    if (st === 'pick') {
      if (I.half) return `${n} is exactly halfway. When a number is exactly halfway, we round up to the higher ${I.w}.`;
      return again ? `${n} is ${q.n < I.mid ? 'before' : 'after'} halfway, so it is closer to ${pv.fmt(I.r)}.` : `Look at the dot. Is ${n} before or after halfway (${mid})?`;
    }
    if (st === 'why') return `Is ${n} before or after the halfway mark?`;
    return '';
  }
  function rlPraise(q, st) {
    const I = rlInfo(q), n = pv.fmt(q.n);
    if (st === 'ends') return `Yes! ${n} is between ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)}.`;
    if (st === 'mid') return `Yes! Halfway is ${pv.fmt(I.mid)}.`;
    if (st === 'pick') return I.half ? `Yes! ${n} is exactly halfway, so we round up to ${pv.fmt(I.r)}.` : `Yes! ${n} is closer to ${pv.fmt(I.r)}.`;
    return 'Yes!';
  }
  /** The closing sentence. Halfway: both ends are equally close, and the rule is to round up. */
  function rlExplain(q) {
    const I = rlInfo(q), n = pv.fmt(q.n), r = pv.fmt(I.r);
    return I.half ? `${n} is exactly halfway. ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)} are equally close, so we use the rule: round up to the higher ${I.w}. ${n} rounds to ${r}.`
      : `${n} is closer to ${r}, so it rounds to ${r}.`;
  }

  function rlLine(q, R, mode, key) {
    const I = rlInfo(q);
    const stages = rlStages(q);
    const st = mode === 'review' ? 'review' : stages[Math.min(R.stage, stages.length - 1)];
    const at = stages.indexOf(st);
    const past = (s) => mode === 'review' || (at > stages.indexOf(s));
    const guided = mode === 'guided';
    const pct = (v) => ((v - I.lo) / (I.hi - I.lo)) * 100;
    const box = (f, label, where) => `<input class="rl-input rl-${where}" data-f="${f}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="${label}" value="${esc(R[f])}">`;
    // Guided: a part is shown with the right number once it is checked. Test/review: always the child's own entry.
    const shown = (f, v) => (guided ? pv.fmt(v) : (String(R[f]).trim() || '?'));
    const lab = (cls, text) => `<span class="rl-label ${cls}">${esc(text)}</span>`;
    let h = `<div class="rl-line" aria-hidden="${st === 'ends' || st === 'mid' ? 'false' : 'true'}"><div class="rl-track"><span class="nline-bar"></span>`;
    for (let k = 0; k <= 10; k++) h += `<span class="nline-tick${k % 5 === 0 ? ' is-major' : ''}" style="left:${k * 10}%"></span>`;
    const showDot = guided && (st === 'pick' || st === 'why' || st === 'done');
    if (st === 'done') {
      const a = Math.min(q.n, I.r), b = Math.max(q.n, I.r);
      h += `<span class="nline-go ${I.r > q.n ? 'is-up' : 'is-down'}" style="left:${pct(a)}%;width:${pct(b) - pct(a)}%"></span>`;
    }
    if (showDot) h += `<span class="nline-dot" style="left:${pct(q.n)}%"></span><span class="nline-point${pct(q.n) < 8 ? ' is-start' : pct(q.n) > 92 ? ' is-end' : ''}" style="left:${pct(q.n)}%">${pv.fmt(q.n)}</span>`;
    h += st === 'ends' ? box('lo', `Lower ${I.w}`, 'start') + box('hi', `Upper ${I.w}`, 'end')
      : lab('is-start' + (st === 'done' && I.side === 'lo' ? ' is-answer' : ''), shown('lo', I.lo)) + lab('is-end' + (st === 'done' && I.side === 'hi' ? ' is-answer' : ''), shown('hi', I.hi));
    if (st === 'mid') h += box('mid', 'Halfway', 'mid');
    else if (past('mid')) h += lab('is-mid', shown('mid', I.mid));
    h += `</div></div>`;
    return h;
  }

  function rlBody(q, R, mode, key) {
    const I = rlInfo(q);
    const stages = rlStages(q);
    const n = pv.fmt(q.n);
    if (mode === 'review') {
      return rlLine(q, R, 'review', key) + `<p class="rl-summary">${esc(describe(q, R))}</p>`;
    }
    const st = stages[Math.min(R.stage, stages.length - 1)];
    const guided = mode === 'guided';
    const lo = guided ? pv.fmt(I.lo) : (String(R.lo).trim() || `lower ${I.w}`);
    const hi = guided ? pv.fmt(I.hi) : (String(R.hi).trim() || `upper ${I.w}`);
    let task = '';
    let controls = '';
    if (st === 'ends') task = `What two ${I.w}s is ${n} between?`;
    if (st === 'mid') task = guided ? `What number is halfway between ${lo} and ${hi}?` : 'What number is halfway?';
    if (st === 'pick') {
      task = !guided ? `Which ${I.w} does ${n} round to?` : I.half ? `${n} is exactly halfway. Which ${I.w} do we round to?` : `Which ${I.w} is closer to ${n}?`;
      controls += `<div class="rl-pick" role="group" aria-label="${esc(task)}">` + [['lo', lo], ['hi', hi]].map(([side, text]) =>
        `<button type="button" class="rl-choice" data-rl-act="pick" data-side="${side}" aria-pressed="${R.pick === side}">${esc(text)}</button>`).join('') + `</div>`;
    }
    if (st === 'why') {
      task = q.why.label;
      controls += `<div class="q-choices" role="radiogroup" aria-label="${esc(task)}">` + q.why.choices.map((c) =>
        `<label class="choice"><input type="radio" name="${key}-why" value="${esc(c)}"${R.why === c ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') + `</div>`;
    }
    if (st === 'done') task = rlExplain(q);
    const fb = guided && R.fb && R.fb.stage === st ? `<div class="feedback feedback-${R.fb.kind}"><p>${R.fb.kind === 'no' ? '<b>Not quite.</b> ' : ''}${esc(R.fb.text)}</p></div>` : '';
    let actions = '';
    if (guided) {
      if (st !== 'done' && !R.ok[st]) actions += `<button type="button" class="btn btn-primary" data-rl-act="check">Check Answer</button>`;
      if (st !== 'done' && R.ok[st]) actions += `<button type="button" class="btn btn-primary" data-rl-act="next">Continue →</button>`;
    } else if (R.stage < stages.length - 2) {
      actions += `<button type="button" class="btn btn-primary" data-rl-act="next">Next part →</button>`;
    }
    const back = R.stage > 0 ? `<button type="button" class="btn btn-ghost" data-rl-act="back">← Back a part</button>` : '';
    const over = !guided ? '' : R.confirm
      ? `<div class="rl-confirm" role="alertdialog" aria-label="Start this problem over?"><p><b>Start this problem over?</b></p>` +
        `<button type="button" class="btn btn-primary" data-rl-act="over-yes">Start Over</button> <button type="button" class="btn btn-ghost" data-rl-act="over-no">Cancel</button></div>`
      : `<button type="button" class="btn btn-ghost rl-over" data-rl-act="over">Start Over</button>`;
    const count = stages.length - (guided ? 1 : 1);
    const partNo = Math.min(R.stage + 1, count);
    return `<p class="rl-part">${st === 'done' ? 'Done!' : `Part ${partNo} of ${count}`}</p>` + rlLine(q, R, mode, key) +
      `<p class="rl-task${st === 'done' ? ' is-done' : ''}" tabindex="-1">${esc(task)}</p>${controls}` +
      `<div class="rl-feedback" aria-live="polite">${fb}<p class="feedback feedback-info" data-rl-empty hidden>Type or choose an answer first.</p></div>` +
      `<div class="rl-actions">${actions}</div><div class="rl-nav">${back}${over}</div>`;
  }

  /**
   * HTML for one question. `key` must be unique on the page.
   * o.number: question number shown to the student; o.response: restore a saved response.
   */
  function render(q, key, o) {
    o = o || {};
    const r = o.response !== undefined ? o.response : emptyResponse(q);
    const pid = `${key}-prompt`;
    const num = o.number ? `<span class="q-num" aria-hidden="true">${o.number}</span>` : '';
    const sr = o.number ? `<span class="sr-only">Question ${o.number}. </span>` : '';
    let prompt = esc(q.prompt);
    let body = '';

    switch (q.type) {
      case 'mc':
        body = `<div class="q-choices" role="radiogroup" aria-labelledby="${pid}">` +
          q.choices.map((c) => `<label class="choice"><input type="radio" name="${key}" value="${esc(c)}"${r === c ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') +
          `</div>`;
        break;
      case 'select': {
        const sel = `<select class="q-select" aria-label="Choose the missing word"><option value="">Choose…</option>` +
          q.choices.map((c) => `<option${r === c ? ' selected' : ''}>${esc(c)}</option>`).join('') + `</select>`;
        prompt = q.prompt.split('___').map(esc).join(sel);
        break;
      }
      case 'number':
        body = `<input class="q-input" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Type a number. Commas are optional.</p>`;
        break;
      case 'expanded':
        body = `<input class="q-input q-input-wide" type="text" autocomplete="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Use + between the values of the digits.</p>`;
        break;
      case 'words':
        body = `<input class="q-input q-input-wide" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Write the number in words.</p>`;
        break;
      case 'chart':
        body = `<div class="q-chart">` + pv.PLACES.map((p, i) =>
          `<label class="q-chart-cell place-${p.key}"><span aria-hidden="true">${p.label}</span><input type="text" inputmode="numeric" maxlength="1" autocomplete="off" aria-label="${p.name} digit" value="${esc(r[i])}"></label>`).join('') + `</div>`;
        break;
      case 'build':
        body = `<div class="q-build">` + pv.PLACES.map((p, i) =>
          `<div class="stepper place-${p.key}" data-place="${i}"><span class="stepper-name">${p.label}</span>` +
          `<button type="button" class="stepper-btn" data-step="-1" aria-label="Remove one ${p.blockName}">−</button>` +
          `<output class="stepper-count" aria-live="polite" aria-label="${p.name} blocks">${r[i]}</output>` +
          `<button type="button" class="stepper-btn" data-step="1" aria-label="Add one ${p.blockName}">+</button></div>`).join('') +
          `</div><div class="q-build-preview">${pv.blocksHTML(0, { captions: false, digits: r })}</div>`;
        break;
      case 'spell':
        body = `<input class="q-input q-input-wide" type="text" ${NO_ASSIST} aria-labelledby="${pid}" value="${esc(r)}">` +
          `<p class="q-help">Type the whole word.</p>`;
        break;
      case 'parts': {
        const rr = Array.isArray(r) ? r : emptyResponse(q);
        body = (q.line ? blankLine(q.line.place) : '') + `<div class="q-parts">` + q.parts.map((p, i) => {
          const v = rr[i];
          if (p.kind === 'num' || p.kind === 'round') {
            return `<label class="part part-num"><span class="part-label">${esc(p.label)}</span>` +
              `<input class="part-input" data-part="${i}" type="text" inputmode="numeric" autocomplete="off" spellcheck="false" value="${esc(v || '')}"></label>`;
          }
          const multi = p.kind === 'multi';
          return `<fieldset class="part part-${p.kind}" data-part="${i}"><legend class="part-label">${esc(p.label)}</legend>` +
            (multi ? '<p class="q-help">Choose every one that is correct.</p>' : '') + `<div class="q-choices">` +
            p.choices.map((c) => `<label class="choice"><input type="${multi ? 'checkbox' : 'radio'}" name="${key}-${i}" value="${esc(c)}"${(multi ? (v || []).includes(c) : v === c) ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('') +
            `</div></fieldset>`;
        }).join('') + `</div>`;
        break;
      }
      case 'rline': {
        const R = rlNorm(r);
        const mode = o.review ? 'review' : o.mode === 'guided' ? 'guided' : 'test';
        body = `<div class="rl" data-mode="${mode}" data-rl="${esc(JSON.stringify(R))}">${rlBody(q, R, mode, key)}</div>`;
        break;
      }
      case 'letter': {
        const letters = q.word.split('');
        const spoken = letters.map((ch, i) => (i === q.missing ? 'blank' : ch)).join(', ');
        body = `<div class="letter-word" role="group" aria-label="Word with a missing letter: ${spoken}">` +
          letters.map((ch, i) => (i === q.missing
            ? `<input class="letter-input" type="text" maxlength="1" ${NO_ASSIST} aria-label="Missing letter" value="${esc(r)}">`
            : `<span class="letter-tile" aria-hidden="true">${esc(ch)}</span>`)).join('') + `</div>`;
        break;
      }
      default:
        throw new Error('Unknown question type: ' + q.type);
    }

    return `<div class="q q-type-${q.type}" data-qkey="${esc(key)}">` +
      `<p class="q-prompt" id="${pid}">${num}${sr}<span>${prompt}</span></p>${visuals(q)}${body}` +
      `<div class="q-feedback" aria-live="polite"></div></div>`;
  }

  /** Current response from the DOM. */
  function read(el, q) {
    switch (q.type) {
      case 'mc': {
        const c = el.querySelector('input[type=radio]:checked');
        return c ? c.value : '';
      }
      case 'select':
        return el.querySelector('select').value;
      case 'number':
      case 'expanded':
      case 'words':
      case 'spell':
        return el.querySelector('.q-input').value;
      case 'letter':
        return el.querySelector('.letter-input').value;
      case 'chart':
        return Array.from(el.querySelectorAll('.q-chart input')).map((i) => i.value.trim());
      case 'build':
        return Array.from(el.querySelectorAll('.stepper-count')).map((c) => Number(c.textContent));
      case 'rline': {
        const box = el.querySelector('.rl');
        return box ? rlNorm(JSON.parse(box.dataset.rl)) : rlEmpty();
      }
      case 'parts':
        return q.parts.map((p, i) => {
          if (p.kind === 'num' || p.kind === 'round') return el.querySelector(`.part-input[data-part="${i}"]`).value;
          const box = el.querySelector(`fieldset[data-part="${i}"]`);
          const on = Array.from(box.querySelectorAll('input:checked')).map((x) => x.value);
          return p.kind === 'multi' ? on : (on[0] || '');
        });
    }
    return '';
  }

  /** Wire up interactive parts; onChange(response) fires after any edit. */
  function bind(el, q, onChange) {
    const fire = () => onChange && onChange(read(el, q));
    if (q.type === 'rline') return bindRline(el, q, fire);
    if (q.type === 'build') {
      el.querySelectorAll('.stepper-btn').forEach((b) => b.addEventListener('click', () => {
        const out = b.parentElement.querySelector('.stepper-count');
        out.textContent = Math.min(9, Math.max(0, Number(out.textContent) + Number(b.dataset.step)));
        el.querySelector('.q-build-preview').innerHTML = pv.blocksHTML(0, { captions: false, digits: read(el, q) });
        fire();
      }));
      return;
    }
    if (q.type === 'chart') {
      // Move to the next box after a digit is typed (helpful on tablets).
      const boxes = Array.from(el.querySelectorAll('.q-chart input'));
      boxes.forEach((box, i) => box.addEventListener('input', () => {
        if (/^\d$/.test(box.value) && boxes[i + 1] && !boxes[i + 1].value) boxes[i + 1].focus();
      }));
    }
    el.addEventListener('input', fire);
    el.addEventListener('change', fire);
  }

  function bindRline(el, q, fire) {
    const box = el.querySelector('.rl');
    const mode = box.dataset.mode;
    if (mode === 'review') return;
    const key = el.dataset.qkey;
    let R = rlNorm(JSON.parse(box.dataset.rl));
    const stages = rlStages(q);
    const sync = () => { box.dataset.rl = JSON.stringify(R); };
    const draw = (focus) => {
      sync();
      box.innerHTML = rlBody(q, R, mode, key);
      const t = focus && box.querySelector(focus);
      if (t) t.focus({ preventScroll: false });
    };
    // Tests (and a parent "show me") can set a whole response at once.
    el.mbSetResponse = (r) => { R = rlNorm(JSON.parse(JSON.stringify(r))); draw(); fire(); };
    box.addEventListener('input', (e) => {
      const f = e.target.dataset && e.target.dataset.f;
      if (f) { R[f] = e.target.value; sync(); fire(); }
    });
    box.addEventListener('change', (e) => {
      if (e.target.name === key + '-why') { R.why = e.target.value; sync(); fire(); }
    });
    box.addEventListener('click', (e) => {
      const b = e.target.closest('[data-rl-act]');
      if (!b) return;
      const act = b.dataset.rlAct;
      const st = stages[Math.min(R.stage, stages.length - 1)];
      let focus = null;
      if (act === 'pick') { R.pick = b.dataset.side; draw(); fire(); box.querySelector(`[data-side="${R.pick}"]`).focus(); return; }
      if (act === 'check') {
        if (rlStageBlank(R, st)) { box.querySelector('[data-rl-empty]').hidden = false; return; }
        if (rlStageOK(q, R, st)) { R.ok[st] = true; R.fb = { stage: st, kind: 'ok', text: rlPraise(q, st) }; focus = '[data-rl-act="next"]'; }
        else { R.tries[st] = (R.tries[st] || 0) + 1; R.fb = { stage: st, kind: 'no', text: rlHint(q, R, st) }; focus = 'input, [data-rl-act="pick"], [data-rl-act="check"]'; }
      }
      if (act === 'next') {
        R.stage = Math.min(R.stage + 1, mode === 'guided' ? stages.length - 1 : stages.length - 2);
        R.fb = null;
        if (stages[R.stage] === 'done') R.complete = true;
        focus = '.rl-task';
      }
      if (act === 'back') { R.stage = Math.max(0, R.stage - 1); R.fb = null; focus = '.rl-task'; }
      if (act === 'over') { R.confirm = true; focus = '[data-rl-act="over-no"]'; }
      if (act === 'over-no') { R.confirm = false; focus = '[data-rl-act="over"]'; }
      // Start Over: same number, answers and feedback cleared. (Earned completion is kept by the activity, not here.)
      if (act === 'over-yes') { R = rlEmpty(); focus = '.rl-task'; }
      draw(focus);
      fire();
    });
  }

  function isAnswered(q, r) {
    if (q.type === 'rline') {
      const R = rlNorm(r);
      return [R.lo, R.hi, R.mid].every((v) => String(v).trim() !== '') && !!R.pick && (!q.why || !!R.why);
    }
    if (q.type === 'chart') return Array.isArray(r) && r.every((v) => String(v).trim() !== '');
    if (q.type === 'build') return Array.isArray(r) && r.some((v) => v > 0);
    if (q.type === 'parts') return Array.isArray(r) && q.parts.every((p, i) => partAnswered(p, r[i]));
    return String(r === undefined || r === null ? '' : r).trim() !== '';
  }

  function grade(q, r) {
    switch (q.type) {
      case 'mc':
      case 'select':
        return r === q.answer;
      case 'number':
        return pv.parseWholeNumber(r) === q.answer;
      case 'expanded':
        return pv.checkExpanded(r, q.answer).ok;
      case 'words':
        return pv.checkWords(r, q.answer);
      case 'spell':
      case 'letter':
        return normSpell(r) === normSpell(q.answer);
      case 'chart':
        return Array.isArray(r) && r.every((v) => /^\d$/.test(String(v).trim())) &&
          pv.fromDigits(r.map((v) => Number(String(v).trim()))) === q.answer;
      case 'build':
        return Array.isArray(r) && pv.fromDigits(r) === q.answer;
      case 'parts':
        return Array.isArray(r) && q.parts.every((p, i) => partOK(p, r[i]));
      case 'rline': {
        const R = rlNorm(r);
        return ['ends', 'mid', 'pick'].concat(q.why ? ['why'] : []).every((st) => rlStageOK(q, R, st));
      }
    }
    return false;
  }

  /** The correct answer as a response (used by tests and "show answer"). */
  function correctResponse(q) {
    switch (q.type) {
      case 'number': return pv.fmt(q.answer);
      case 'expanded': return pv.expandedForm(q.answer);
      case 'words': return pv.numberToWords(q.answer);
      case 'chart': return pv.digitsOf(q.answer).map(String);
      case 'build': return pv.digitsOf(q.answer);
      case 'rline': {
        const I = rlInfo(q);
        const all = {}; rlStages(q).forEach((st) => { all[st] = true; });
        return Object.assign(rlEmpty(), { lo: pv.fmt(I.lo), hi: pv.fmt(I.hi), mid: pv.fmt(I.mid), pick: I.side, why: q.why ? q.why.answer : '', stage: rlStages(q).length - 1, ok: all, complete: true });
      }
      case 'parts': return q.parts.map((p) => (p.kind === 'num' ? pv.fmt(p.answer) : p.kind === 'round' ? pv.fmt(pv.roundRange(p.target, p.place)[0]) : p.kind === 'multi' ? p.answer.slice() : p.answer));
      default: return q.answer;
    }
  }

  function describeChart(d) {
    return pv.PLACES.map((p, i) => `${p.name} ${d[i] === '' ? '—' : d[i]}`).join(', ');
  }

  function describeBuild(d) {
    return pv.PLACES.map((p, i) => `${d[i]} ${d[i] === 1 ? p.one : p.key}`).join(', ');
  }

  /** Human-readable response for results pages. */
  function describe(q, r) {
    if (q.type === 'rline') {
      const R = rlNorm(r);
      const v = (x) => String(x).trim() || '—';
      const picked = R.pick === 'lo' ? v(R.lo) : R.pick === 'hi' ? v(R.hi) : '—';
      return `Between ${v(R.lo)} and ${v(R.hi)} · Halfway ${v(R.mid)} · Rounds to ${picked}` + (q.why ? ` · ${R.why || '—'}` : '');
    }
    if (q.type === 'parts' && Array.isArray(r) && q.parts.some((p, i) => partAnswered(p, r[i]))) {
      return q.parts.map((p, i) => `${p.label} ${partAnswered(p, r[i]) ? (Array.isArray(r[i]) ? r[i].join(', ') : String(r[i]).trim()) : '—'}${partOK(p, r[i]) ? ' ✓' : ' ✗'}`).join(' · ');
    }
    if (!isAnswered(q, r)) return 'No answer';
    if (q.type === 'chart') return describeChart(r);
    if (q.type === 'build') return describeBuild(r) + ` (${pv.fmt(pv.fromDigits(r))})`;
    if (q.type === 'parts') return q.parts.map((p, i) => `${p.label} ${partAnswered(p, r[i]) ? (Array.isArray(r[i]) ? r[i].join(', ') : String(r[i]).trim()) : '—'}${partOK(p, r[i]) ? ' ✓' : ' ✗'}`).join(' · ');
    return String(r).trim();
  }

  function correctText(q) {
    if (q.type === 'letter') return `${q.answer} (${q.word})`;
    if (q.type === 'chart') return describeChart(pv.digitsOf(q.answer));
    if (q.type === 'build') return describeBuild(pv.digitsOf(q.answer)) + ` (${pv.fmt(q.answer)})`;
    if (q.type === 'parts') return q.parts.map((p) => `${p.label} ${partCorrectText(p)}`).join(' · ');
    if (q.type === 'rline') { const I = rlInfo(q); return `Between ${pv.fmt(I.lo)} and ${pv.fmt(I.hi)} · Halfway ${pv.fmt(I.mid)} · Rounds to ${pv.fmt(I.r)}` + (q.why ? ` · ${q.why.answer}` : ''); }
    return String(correctResponse(q));
  }

  /** Gentle, specific coaching when an expanded-form answer is not accepted. */
  function expandedTip(r, n) {
    const res = pv.checkExpanded(r, n);
    if (res.ok) return '';
    if (res.reason === 'format') return 'Write numbers joined by + signs, like a + b + c.';
    if (res.reason === 'term') return 'Each part should be the value of one digit, such as 300 or 40.';
    if (res.reason === 'repeat') return 'Use each place only once.';
    return 'The parts should add up to ' + pv.fmt(n) + '.';
  }

  /** Coaching for a "parts" answer: name the parts to look at again (never the answers). */
  function partsTip(q, r) {
    if (q.type !== 'parts' || !Array.isArray(r)) return '';
    const wrong = q.parts.filter((p, i) => !partOK(p, r[i])).map((p) => p.label.replace(/[:?]$/, ''));
    return wrong.length && wrong.length < q.parts.length ? `Look again at: ${wrong.join('; ')}.` : '';
  }

  MB.Q = { esc, visuals, render, read, bind, isAnswered, grade, correctResponse, describe, correctText, emptyResponse, expandedTip, partsTip, normSpell, rlExplain };
})(typeof window !== 'undefined' ? window : globalThis);
