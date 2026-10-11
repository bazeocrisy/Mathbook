# Subtract with Regrouping — design review

Design agent's notes. Section 1 is written before the build; later sections review rendered screens.

## 1. Design brief (before build)

**Baseline measured on Lesson 2-15 Learn** (local build, 18 px root):
- **Existing `.vc` grid:** 54 px place columns.
- **Usable card width:** about 277 px at 320 (card padding 0.65rem), 329 px at 390, and 1017 px at 1366.
- **At 1366×768:**
  - the problem starts at y ≈ 293;
  - the demo controls and Back/Next row end at y ≈ 710;
  - the card ends at y ≈ 732.
- **Height left for the problem:** about **280 px** for the workspace, plus one row of controls.

### 1.1 Grid geometry

- **Columns:**
  - `grid-template-columns: var(--sk-op) repeat(n, var(--sk-col))`, with a 6 px comma track between Th and H when n = 4 (same as `.vc`).
  - `--sk-op: 1.2rem` (minus sign).
  - `--sk-col: clamp(44px, 3.4rem, 60px)`.
  - `column-gap: 2px`.
  - **Width check at 320:** 22 + 6 + 4×56 + 10 = 262 px, which fits the 277 px card. The `clamp` floor keeps every column ≥ 44 px.
  - Set `width: max-content; max-width: 100%` and **never** `overflow-x: auto` on the grid.
- **Every row uses all columns** (the problem's place count). Columns a shorter operand doesn't use stay empty, so the bottom number right-aligns through the grid itself. Never pad strings.
  - The minus sign goes in track 1 of the bottom row, never next to the first bottom digit.
- **Digit size** (monospace `ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace`, weight 800):
  - ≥ 900 px: 1.6rem;
  - 401–899 px: 1.5rem;
  - ≤ 400 px: 1.35rem;
  - `@media (max-height: 600px)` (200% zoom, landscape phones): 1.3rem, with `line-height: 1.25`.
- **Row stack and heights** (desktop):

  | Row | Height | Present in |
  |---|---|---|
  | place tags (Th H T O, 0.8rem) | 20 | all modes |
  | exchange chips (−1 / +10) | 20 | demo and guided only, always reserved there so nothing jumps |
  | history (one earlier value, struck) | 20 | all modes |
  | current regroup value / box | 44 | all modes |
  | top digits | 44 | all modes |
  | bottom digits | 44 | all modes |
  | rule | 3 | all modes |
  | answer boxes | 52 | all modes |

  - With `row-gap: 4px` the total is ≈ 275 px.
  - At `max-height: 600px`: the history and chip rows drop to 16, and the digit rows to 38.
- **Room for regroup values:** the **regroup area is two stacked rows**, not side by side, so a 44 px column never has to fit "10 9".
  - The **current** value sits in the 44 px box. "10", "11" and "12" fit at 1.15rem monospace (about 26 px).
  - **One** earlier value appears above it, struck through.
  - **Example, 3,002, hundreds column:** the original `0` is crossed out in the top row, the history row shows a struck "10", and the box shows "9".
  - The standard method never needs more than one earlier value. If a child makes more changes, show only the latest earlier value. Undo still walks the full log.

### 1.2 States without colour (exact CSS)

```css
.sk-d      { font-weight: 800; color: var(--sk-ink); }                       /* original digit */
.sk-x      { position: relative; color: var(--sk-muted); font-weight: 600; } /* crossed-out: original OR earlier value */
.sk-x::after { content: ""; position: absolute; inset: 10% 6%; pointer-events: none;
  background: linear-gradient(to top right, transparent calc(50% - 1.5px), var(--sk-cross) calc(50% - 1.5px),
              var(--sk-cross) calc(50% + 1.5px), transparent calc(50% + 1.5px)); }
.sk-hist   { font-size: 0.85rem; line-height: 1; }                           /* earlier regroup value: small + .sk-x */
.sk-cur    { display: grid; place-items: center; width: 100%; max-width: 44px; height: 44px; font-size: 1.15rem;
             font-weight: 800; color: var(--sk-accent); background: var(--sk-box-bg);
             border: 2px solid var(--sk-box-line); border-radius: 8px; }    /* current value: boxed + bold */
.sk-cur:placeholder-shown { border-style: dashed; }                          /* empty regroup box */
.sk-ans    { width: 100%; max-width: 48px; height: 52px; font-size: 1.5rem; border: 2px solid var(--sk-box-line);
             border-radius: 10px; }                                          /* answer digit: below the rule, larger box */
@media (forced-colors: active) { .sk-x::after { display: none; } .sk-x { text-decoration: line-through 3px; } }
```

- **Why a diagonal slash:** it is how the textbook shows a cross-out, and a horizontal line-through on "0" looks like "θ" or a minus sign.
- **How the states differ without colour:**
  - original digit: normal;
  - crossed-out original: slash, lighter weight, same size;
  - earlier regroup value: slash and smaller;
  - current value: box and bold;
  - answer digit: below the rule, in a bigger box.
- **Red is not used for cross-outs.** Red means "wrong" everywhere else in Mathbook.
- **Screen-reader text,** in visually hidden spans or the `aria-label`:

  | State | Text |
  |---|---|
  | Original digit | "3 thousands" |
  | Crossed-out original | "3 thousands, crossed out" |
  | Earlier regroup value | "was 10" |
  | Current regroup value (read-only) | "now 9 hundreds" |
  | Regroup input | `aria-label="Regrouped hundreds, optional"` |
  | Answer input | `aria-label="Answer, hundreds digit"` |

- **One summary of the column:** each top-number column is a `role="group"` whose label reads the whole column. For example: "Hundreds: 0, crossed out, was 10, now 9".

### 1.3 Annotation entry (independent and test modes)

- **The regroup box** is an `<input inputmode="numeric" maxlength="2" autocomplete="off">` in the regroup row of every top column.
  - Tapping it selects its content.
  - The value is committed on `change` or blur, not on each keystroke, so typing "12" makes one undo entry.
  - On commit, the previous current value moves to the history row, and the top digit becomes crossed out.
  - Committing an empty box removes the current value. That is undoable too.
  - Digits only; anything else is stripped. No auto-advance, because values have two digits.
- **The answer boxes** keep the 2-15 behaviour:
  - one digit each;
  - typing moves focus one box **left**;
  - Backspace on an empty box moves right;
  - focus starts at the ones.
- **Arrow keys:**
  - Left/Right move within a row.
  - Up/Down move between a column's regroup box and its answer box.
  - Tab order follows the DOM: regroup boxes Th→O, answer boxes Th→O, then the toolbar.
- **Toolbar,** directly under the answer row, one line on desktop and wrapping on phones:
  - **left:** `↶ Undo` and `Clear work` (`.btn btn-ghost btn-small`, 48 px tall);
  - **right:** `💡 Hint` (ghost) and `Check` (`.btn-primary`).
  - In test mode only Undo and Clear work appear.
  - Undo is disabled when the log is empty.
- **Clear work:**
  - removes every regroup mark, but not the answer digits;
  - is one undo step, so it needs no confirm dialog.
- **Touch targets:** every input and button is ≥ 44×44 (inputs) or 48 tall (buttons). Space toolbar buttons 8 px apart.

### 1.4 Guided mode layout

- **Two panes at card width ≥ 860 px:**
  - `grid-template-columns: max-content minmax(0, 1fr); gap: 1.5rem`;
  - the workspace on the left, and the **coach panel** on the right, top-aligned.
  - Below 860 the coach panel stacks directly under the workspace, above the wizard actions.
- **The coach panel** (`.wiz-check` look) holds one question at a time:
  - "Does the ones column need regrouping?" with **Yes** and **No** buttons. A short reason follows: "2 is less than 8."
  - "Which place can give?" with buttons only for places to the left: Tens, Hundreds, Thousands.
  - "Exchange 1 hundred for 10 tens." The new values are typed **in the grid**: only the two regroup boxes of the supplier and the receiver are enabled. The panel says "Write the new hundreds and the new tens above the top number."
  - "What digit goes in the answer?" Only the active column's answer box is enabled.
  - Feedback (✓/✗ glyph plus text) shows under the question. Correct work stays.
- **Active column, without colour alone:**
  - a band behind the column (`--sk-active-bg`) with a **3 px solid border** (`--sk-active-line`);
  - a **▼** above its place tag, and the tag in bold and underlined;
  - the label "Working on the ones" (screen-reader text and coach heading).
- **Exchanges:**
  - **Supplier:** dashed 3 px border, and a **−1** chip in the chip row.
  - **Receiver:** solid border, and a **+10** chip.
- **One exchange per step:**
  - The panel shows the sentence, e.g. "Exchange 1 hundred for 10 tens", and below it "9 hundreds, 10 tens: the value is still the same."
  - In a zero chain, each exchange is its own step.
  - The chips move to the next pair; the previous pair's chips clear.

### 1.5 Demo mode (Learn Examples)

- **Layout:** the same two panes. The right pane holds:
  - the `.demo-note` sentence for the step;
  - for zero-chain examples, a **"Top number now"** ordered list.
- **For 3,002 − 1,578**, the list reveals one line per exchange:
  1. 3 thousands, 0 hundreds, 0 tens, 2 ones
  2. 2 thousands, 10 hundreds, 0 tens, 2 ones
  3. 2 thousands, 9 hundreds, 10 tens, 2 ones
  4. 2 thousands, 9 hundreds, 9 tens, 12 ones

  The current line is bold, with a "◀ now" marker. Earlier lines stay at normal weight, and later lines are not shown yet.
- **Steps** (10 parts):
  1. the problem;
  2. the ones need regrouping, and only the thousands can give;
  3. to 5. exchanges 1 to 3;
  6. to 9. the answer digits, ones → thousands;
  10. the answer, with "3,002 = 2,000 + 900 + 90 + 12".
- **Controls:** reuse `.demo-controls`: `◀ Back a part`, `Part 3 of 10`, `Next part ▶`. "Start over" goes **in that same row**, not on its own row as in 2-15, which costs 60 px.

### 1.6 Hints (independent practice)

- **Hint button:**
  - Each press adds the next level, labelled "Hint 2 of 4".
  - After hint 4 the button becomes **"Show the full solution"**, in a different style (`btn-ghost` with an outline). It is a separate, deliberate tap.
- **Only the newest hint is shown in full.** Earlier hints collapse into `<details><summary>Earlier hints (2)</summary>`, so the panel stays about 3 lines tall.
- **Grid marks for each level** (they never fill in the child's boxes):
  - level 1: the active-column band;
  - level 2: adds the supplier's dashed border;
  - levels 3–4: text only, with the exchange sentence.
- **The full solution** is a **separate read-only mini workspace** in the hint panel, with all marks and answer digits. The child's grid stays untouched and visible above or beside it.
- **Where hints go:** the hint panel is the coach-panel position: on the right at ≥ 860 px, and under the toolbar on phones.
  - On phones, bring a new hint into view with `scrollIntoView({ block: 'nearest' })`, never `'start'`, so the problem doesn't scroll away.

### 1.7 Desktop fit (1366×768)

- **Keep the 2-15 structure:** act hero, then `.wiz-card`, then the Example/Your Turn heading, a **one-line** explain, the two-pane workspace, controls, and `.wiz-actions`.
- **Height budget:**
  - the workspace (≤ 280 px) starts at y ≈ 293;
  - the toolbar or demo controls end at ≈ 640;
  - `.wiz-actions` end at ≈ 720.
  - The problem, the answer boxes and Check are all visible without scrolling.
- **Width:** cap the grid at `--sk-col` 60 px; at 1920×1080 the workspace stays compact.
- **At 200% zoom (683×384):** require only the full workspace (≈ 230 px, compact rows) within one screen, with no sideways scroll.

### 1.8 Theming (`.sk` scope; Mathbook defaults)

```css
.sk {
  --sk-col: clamp(44px, 3.4rem, 60px);  --sk-op: 1.2rem;  --sk-digit: 1.6rem;
  --sk-font: ui-monospace, "Cascadia Mono", Consolas, Menlo, monospace;
  --sk-ink: #1f2370;        /* --heading */
  --sk-muted: #4f5a7a;      /* --muted, 6.8:1 on white */
  --sk-accent: #5236c9;     /* --primary */
  --sk-line: #1f2370;       /* answer rule */
  --sk-bg: #ffffff;  --sk-box-bg: #ffffff;
  --sk-box-line: #6a58c8;   /* NOT #b5a8e8 (2.2:1 fails the 3:1 rule for input borders); 5.5:1 */
  --sk-cross: #1b2440;      /* --ink; never red */
  --sk-active-bg: #fff3c9;  /* --te-bg */
  --sk-active-line: #9a7000;/* --te-line, 4.5:1 */
  --sk-focus: #5236c9;      /* matches .ci:focus */
  --sk-ok: #157347;  --sk-no: #b3261e;
  --sk-tag-th: #134677; --sk-tag-h: #135c33; --sk-tag-t: #5f4500; --sk-tag-o: #8a1f34; /* place tag inks */
}
```

### 1.9 Focus and announcements

- **Focus:** `outline: 3px solid var(--sk-focus); outline-offset: 2px` on every input and button. It must not be clipped by the column band, so give the band `z-index: 0` and the inputs `z-index: 1`, as `.vc-focus` does.
- **Live region:** one per instance, `aria-live="polite"`, visually hidden. It announces only on these events:
  - **demo step:** the step sentence, e.g. "Exchange 1 thousand for 10 hundreds. Now 2 thousands, 10 hundreds, 0 tens, 2 ones.";
  - **guided stage change:** "Working on the tens. Does the tens column need regrouping?";
  - **regroup commit:** "Hundreds now 9, was 10.";
  - **Undo / Clear work:** "Undone: hundreds back to 10." or "Regroup marks cleared.";
  - **Check / feedback:** the feedback sentence, e.g. "Not yet. The tens gave 1 to the ones, so use 9 tens, not 0.";
  - **hint:** "Hint 2 of 4: …".
- **No announcement** for single answer digits. Test mode announces only Undo and Clear work.
