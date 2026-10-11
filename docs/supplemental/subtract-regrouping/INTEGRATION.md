# SubtractKit: reusable vertical subtraction with regrouping

A small component for vertical subtraction with regrouping (exchanges), including across zeros. It is not tied to Mathbook: it reads no Mathbook routes, lesson ids, globals or storage keys. Mathbook uses it through an adapter (`curriculum/supplemental/subtract-regrouping/app.js`). A standalone page proves it works on its own: `dev/subtract-demo/index.html`.

## Files another app needs

| File | What it is |
|---|---|
| `assets/js/subtract/sub-math.js` | Pure math: exchanges, the standard method, difficulty, generation, reading and grading answers, mistakes, hints. No DOM. Browser global `SubtractKit.math`, or `require()` in Node. |
| `assets/js/subtract/sub-workspace.js` | The vertical workspace: `SubtractKit.mount(el, options)`. Needs `sub-math.js` loaded first. |
| `assets/css/subtract-workspace.css` | Styles scoped to `.sk`, themed with `--sk-*` variables. |

There are no other dependencies: no framework, no build step, no network. It needs a browser with `AbortController` and CSS grid, which every current browser has.

## Initialize

```html
<link rel="stylesheet" href="subtract-workspace.css">
<div id="problem"></div>
<script src="sub-math.js"></script>
<script src="sub-workspace.js"></script>
<script>
  const ws = SubtractKit.mount(document.getElementById('problem'), {
    top: 3002, bottom: 1578,          // whole numbers, 0 ≤ bottom ≤ top ≤ 9,999
    mode: 'independent',              // 'demo' | 'guided' | 'independent' | 'test' | 'view'
    hints: true, feedback: true,      // independent mode only (always off in test mode)
    solution: true,                   // allow "Show the full solution" after hint 4
    state: savedState,                // optional: restore earlier work (ignored if it does not validate)
    theme: { accent: '#006b75' },     // optional: sets --sk-accent etc. on the element (removed again by destroy())
    caption: "Zoe's work",            // optional: a visible label above the grid
    answerLabel: "Zoe's answer",       // optional: how the answer cells are read aloud in view mode
    answer: true,                     // false hides the answer row (e.g. 'write the regrouped top number')
    text: { check: 'Check it' },      // optional: replace any wording (see SubtractKit.text)
    on: { complete: (e) => {} }       // optional: event handlers (or use ws.on)
  });
  ws.on('answer', (e) => console.log(e.status, e.correct));
</script>
```

### Modes

| Mode | What the child does |
|---|---|
| `demo` | Steps through the standard method with Back, Next and Start over: one exchange or one answer digit per part, a sentence for each, and a "Top number now" list. |
| `guided` | Decides each step, column by column: does it need regrouping? which place can give? the new values of both columns? the answer digit? Wrong answers get specific feedback; correct work is kept. A valid but non-standard choice is told "that could work too". |
| `independent` | Optional regroup marks above the columns (Undo, Clear work), answer boxes, Check, specific feedback, and hints 1–4. The full solution is a separate request; the child's grid is never filled in. |
| `test` | Regroup marks and answer boxes only. No Check, hints, feedback, solution or marks, even if the options ask for them. Read the result with `ws.result()`. |
| `view` | Read-only. Shows `options.work = { ann, d, misaligned? }`: someone's work (with its answer under the line), or a solution. Leading zeros in the answer are left blank. `answer: false` hides the answer row. |

### API

| Method | Description |
|---|---|
| `getState()` | A JSON copy of the work (see the state format below). |
| `setState(s)` | Restores state. Returns `false`, and changes nothing, if `s` doesn't validate. |
| `check()` | Independent mode: grades and shows feedback. Test mode: grades silently. Returns `{ status, correct, value, marks, issues }`. |
| `result()` | `{ status, correct, value, marks }` with no display, for hosts that grade later (tests). |
| `hint()`, `showSolution()` | The same as the buttons. They do nothing in test mode. |
| `undo()`, `clearWork()` | Undo the last regroup mark; clear all marks. Answer digits are kept. |
| `reset()` | Clears all work for this problem. |
| `on(event, fn)`, `off(event, fn)` | Subscribe and unsubscribe; `'*'` receives every event. |
| `destroy()` | Removes every listener (one `AbortController`), empties the element and removes its classes. |
| `SubtractKit.validState(s, top, bottom)` | The same validation `setState` uses, for hosts checking saved records. |

### Events

Every event has `{ type, instance }` plus:

| Event | Extra fields |
|---|---|
| `answer` | `status` (`'typing'`, `'correct'`, `'wrong'`, `'empty'`, `'incomplete'`, `'invalid'`, or `'partial'` in guided mode), `correct`, `value`, `marks` (`'none'`, `'valid'` or `'invalid'`), `issues` |
| `step` | `kind` (`'regroup'`, `'undo'`, `'needs'`, `'supplier'`, `'exchange'`, `'digit'` or `'demo'`), `correct`, `column`, `place`, `value`, `index`/`total` (demo) |
| `hint` | `level` (1–5), `place`, `solution` |
| `complete` | `correct`. Fired when guided work finishes, the answer is right, or the last demo part is reached. |
| `reset` | `scope` (`'marks'` or `'all'`) |
| `change` | `state`. Fired on every change; save it if you persist work. |

Instances are independent: each has its own id prefix, its own listeners on its own element, and no document-level listeners or shared state.

**Rendering guarantees.** The component builds its skeleton once: grid, toolbar, coach panel and one polite live region. A regroup mark, Undo or Clear updates only the changed cells, so the box or button the child moves to is never replaced. Every other rebuild moves focus to a named place: the pressed button after a wrong guided choice, the done message, the solution heading, Undo after Clear work. Tapping a filled regroup box selects it, so typing replaces the value.

**Layout.** `.sk` is a CSS size container (`container-type: inline-size`). Column width follows the component's own width (`--sk-col` uses `cqi`). The coach panel sits beside the grid when the component is at least 600 px wide, and below it otherwise. Inside a flex row, give the host element a width (e.g. `flex: 1 1 260px`), because a size container does not size itself from its content.

## State format (`v: 1`)

```js
{ v: 1, top: 3002, bottom: 1578, mode: 'independent',
  ann: { 3: [2], 2: [10, 9], 1: [10, 9], 0: [12] }, // regroup marks per place (0 = ones): history, current value last
  log: [ { place: 2, before: [10] } ],              // undo log (or { clear: true, before: {…} })
  d: ['4', '2', '4', '1'],                          // answer digits from the ones up ('' = empty)
  hint: 0, hintCol: null, demo: 0,                  // hint level 0–5 for the hinted column (a new column starts at 1); demo part
  guided: { col: 0, stage: 'needs', ex: 0 } | null, // guided progress
  result: null, done: false }
```

Answers are read from `d` only. An all-empty answer is "empty", never 0. Leading zeros are accepted but never required. A gap between digits is "incomplete". Regroup marks never affect whether a final answer is right; they are reported separately (`marks`).

## Theming

Set any of these CSS variables on the element or an ancestor, or pass `options.theme`:

| Group | Variables |
|---|---|
| Layout | `--sk-col` (column width, default `clamp(44px, 3.4rem, 60px)`), `--sk-op`, `--sk-comma` |
| Type | `--sk-digit`, `--sk-font` (digits), `--sk-ui-font` (text and buttons) |
| Ink | `--sk-ink`, `--sk-muted`, `--sk-accent`, `--sk-line` (answer line) |
| Backgrounds and boxes | `--sk-bg`, `--sk-box-bg`, `--sk-box-line`, `--sk-cross` (cross-outs) |
| Active column and feedback | `--sk-active-bg`, `--sk-active-line`, `--sk-focus`, `--sk-ok`, `--sk-no` |
| Place tags | `--sk-tag-th`, `--sk-tag-h`, `--sk-tag-t`, `--sk-tag-o` |
| Buttons | `--sk-btn-bg`, `--sk-btn-ink`, `--sk-btn-line`, `--sk-primary-bg`, `--sk-primary-ink`, `--sk-radius` |

States never rely on color alone:
- crossed-out values have a diagonal slash and are lighter (a line-through in forced-colors mode);
- earlier marks are also smaller;
- current marks are boxed and bold;
- answer digits sit in larger boxes below the line;
- the active column has a band, a 3 px border, a ▼ marker and an underlined tag.

The grid is a real CSS grid with one track per place, so changing `--sk-col` or fonts keeps every column aligned. The demo page checks this.

## Ranges and difficulty rules (`SubtractKit.math`)

- **Operands:** whole numbers with 0 ≤ bottom ≤ top ≤ 9,999. "4-digit" means the top number has 4 digits; the bottom may have fewer and stays right-aligned.
- **Difficulty** comes from the standard right-to-left method. At each column, if the current top amount is less than the bottom digit, take from the nearest place on the left that has something, passing through zeros one adjacent exchange at a time.
  - `none`: no exchange.
  - `easy`: exactly 1 exchange and no zero chain.
  - `medium`: 2 or more exchanges and no zero chain.
  - `hard`: an exchange passes through a zero-valued place. `chain` gives the length: 1 = across one zero, 2 or more = across zeros next to each other.
- **Supported sizes:**
  - 2-digit: `easy` only. Medium needs a second exchange and hard needs a zero to pass through, and neither is possible with tens and ones.
  - 3- and 4-digit: every difficulty.
  - `unavailableReason(size, difficulty)` returns a plain sentence for unsupported combinations; the generator never changes the size.
- **Generation:** `generateSession({ size: 2|3|4|'mixed', difficulty: 'easy'|'medium'|'hard'|'mixed', length, seed })`.
  - No duplicate pairs in a session.
  - Mixed size: at least half 4-digit.
  - Mixed difficulty: an even share of the supported difficulties, plus about 1 in 6 with no regrouping (some with equal numbers, so the answer is 0).
- **Exchanges:** `exchange(amounts, from)` moves 1 from place `from` to `from − 1` (+10). It keeps the value, refuses a place with nothing to give, and allows amounts above 9.
- **Grading:**
  - `gradeFinal(top, bottom, digits)` grades only the final answer.
  - `checkAmounts(top, bottom, amounts)` accepts any regrouped top number that keeps the value and lets every column subtract, not only the standard one.
  - `evaluateWork(top, bottom, ann)` reports the marks as `valid` (and whether they are `standard`) or `invalid`, with an issue: `no-reduce`, `zero-ten`, `skip-zero` or `changed-value`.
- **Practice feedback:** `diagnose(…)` names specific mistakes from the child's own marks and digits: smaller-from-larger, original digit after regrouping, misaligned, no-reduce, zero-ten, skip-zero. Hosts should not use it to grade or diagnose tests.

## What the host provides

- **Storage.** The component never touches storage. Save `getState()` on `change` and pass it back as `options.state`; validate saved records with `SubtractKit.validState`. Mathbook's adapter keeps namespaced, versioned records under `mathbook:v2:subtract-regrouping:` (each has `v: 1`). It stores seeds and indexes rather than whole questions, drops a malformed record on its own, and resets only that prefix.
- **Navigation and pages:** question lists, Next/Previous, test review and results. Mathbook's adapter uses its own shell (`assets/js/app-shell.js`).
- **Scoring and reporting.** Example: Mathbook reports final answers separately from regrouping-step questions, decisions and error analysis.
- **Theme:** the CSS variables above.

## Verification

- `tests/subtract-math.test.js`: the math (Node).
- `tests/subtract-regrouping.test.js`: the Mathbook content, checked with an independent column routine.
- `tests/subtract-regrouping.browser.mjs`: the section end to end, plus the demo page:
  - mounting without Mathbook;
  - two instances;
  - export/restore and rejecting bad state;
  - `destroy()` removing listeners;
  - a host theme keeping columns aligned;
  - test mode never showing hints, Check or the solution.
