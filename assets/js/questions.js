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

  function isAnswered(q, r) {
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

  MB.Q = { esc, visuals, render, read, bind, isAnswered, grade, correctResponse, describe, correctText, emptyResponse, expandedTip, partsTip, normSpell };
})(typeof window !== 'undefined' ? window : globalThis);
