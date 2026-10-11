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

## 2. Review of the build (c696fa6)

### How it was inspected

- **Real headless Chrome**, one instance, via `tests/lib/harness.mjs`.
- **Input:** real CDP mouse, touch and key events. No synthetic `.click()` on the workspace.
- **Viewports:** 320×640, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, and 683×384 (200% zoom).
- **Screens covered:**
  - Learn steps 1, 2 and 6 (Examples and Your Turn);
  - Practice Together, Practice on My Own (setup → Start, marks, Undo/Clear, hints 1–4 and the full solution, wrong-answer feedback), and the skills `skill-mistakes` and `skill-decide`;
  - the test (Q1, Q10 steps, Q12 decide, Q13 mistake, then finish) and the results;
  - the Parent Guide;
  - the demo page, including the Sea theme.
- **Where the evidence is:** scripts and screenshots are in the session scratchpad `design/` folder (`run.mjs` plus `scenes-*.mjs`; images in `shots/`). Below, `shots/x.png (W×H)` is a full-page capture unless it says otherwise.
- **The branch moved during the review:** HEAD went to 1df0bc5 (SR-M math fixes). That commit doesn't change the render, focus, live-region, history-row CSS or layout code, so SR-D01–D14 still apply. SR-D15 needs a re-check against the new per-column hints.

### What passes

- **No sideways scroll** on any screen at any size, except SR-D04.
- **The digit grid stays aligned** at every size and under the Sea theme. The minus track, the comma track and right-aligned short bottom numbers are all correct.
- **Desktop fit at 1366×768:**
  - Learn demo: grid bottom at y=568, controls at about 533;
  - guided: Check at y=406–456;
  - independent practice: Check bottom at y=634, card bottom at 754.
  - The problem plus its main controls are visible without scrolling. 1920×1080 is also fine.
- **States without colour:** the crossed-out original (slash), current value (box, bold), answer (below the rule, larger box), and active, giver and getter columns (solid band and ▼, dashed border with −1, solid border with +10) all read correctly in greyscale.
- **The test** has no Hint, Check or feedback controls. Undo and Clear are present.
- **No hidden focusable elements** were found on any screen.
- **Tap targets:** every workspace input and button measures ≥ 44 px. Radio circles are 23 px, but they sit inside full-width labels at least 48 px tall.
- **Answer boxes:**
  - typing moves focus left, as in 2-15;
  - ArrowUp, ArrowDown, ArrowLeft and ArrowRight work;
  - Backspace on an empty box moves right.
- **Focus outline:** 3 px in `--sk-focus` with a 2 px offset, clearly visible.
- **Results, the Parent Guide and the demo page** lay out cleanly. Theme changes don't break alignment.

### Findings

| ID | Sev. | Summary |
|---|---|---|
| SR-D01 | critical | A regroup commit rebuilds the whole component: clicks and taps are lost and focus drops to `<body>` |
| SR-D02 | critical | A filled regroup box can't be retyped, and a wrong exchange erases earlier correct history |
| SR-D03 | major | Struck earlier values ("10" over 9) are illegible |
| SR-D04 | major | Step 1's place chart scrolls sideways at 320 and 390 |
| SR-D05 | major | Focus is lost after many guided, hint and toolbar actions |
| SR-D06 | major | The live region is recreated on every render, so announcements are unreliable or doubled |
| SR-D07 | major | On phones and at 200% zoom the controls are far from the grid; the two-pane rule is dead code |
| SR-D08 | major | Error-analysis work doesn't show the wrong answer under the line |
| SR-D09 | minor | The grid overflows the Your Turn panel at 320 |
| SR-D10 | minor | Tab order runs column by column, not row by row |
| SR-D11 | minor | The previous step's ✓ sits under the new question's Check |
| SR-D12 | minor | The ✓/✗ marks are tiny and overlap the box border |
| SR-D13 | minor | Full solution: a leading "0" in the answer and a run-on paragraph |
| SR-D14 | minor | The "Earlier hints" summary is 32 px tall |
| SR-D15 | minor | Hints 2–3 repeat themselves when the next column needs no exchange |
| SR-D16 | minor | The results score cell wraps at 390 |

**SR-D01 · critical: a regroup commit rebuilds the component and drops clicks, taps and focus.**
- **Cause:** `commitRegroup()` runs on `change` (blur) and calls `render(null)`, which replaces the whole `el.innerHTML`, so the element the child is moving to no longer exists. This affects independent practice, test mode and every host.
- **Evidence:** `shots/indep-clickloss-1366.png (1366×992)` and `shots/indep-touch-390.png (390×1267)`. The run logs show:
  - **Click Check right after typing a mark:** no feedback appears (`fb=""`), and focus goes to `BODY`.
  - **Click from one regroup box to another, then type "1":** focus is on `BODY` and the "1" is lost.
  - **Tab out of a box, or Enter:** focus goes to `BODY`, and the next Tab starts at the top of the page.
  - **Touch at 390:** the same happens with tap → Check and with tap → next box.
  - **Test Q1:** typing a mark, then clicking an answer box, also leaves focus on `BODY`.
- **Failure scenario:** a child writes 9 above the tens and taps Check. Nothing happens. They tap again and it works, or they tap the next box, type, and see nothing.
- **Fix:**
  - Don't rebuild on a commit. Patch only the affected column's history, current and top cells, plus the disabled state of Undo and Clear. Never replace an `<input>` or `<button>` that already exists.
  - Split `render()` into `renderGrid`, `renderToolbar` and `renderCoach` so `innerHTML` is never used on the container after mount.
  - As a backstop, after any render, restore focus to the element (by `data-k` or `data-act`) that held focus or was the `relatedTarget` of the blur.

**SR-D02 · critical: a filled regroup box can't be retyped, and a wrong exchange erases earlier correct history.**
- **Evidence:** a trace on 6,000 − 1,467, guided, Learn step 6:
  1. After exchange 1, `ann = {2:[10], 3:[7]}`, and the hundreds box is pre-filled with "10" and already focused.
  2. The child clicks it: selection is `1-1` (no select-all, because focusin doesn't fire again).
  3. Typing "9" is blocked by `maxlength=2`, so the value stays "10".
  4. On Check, the wrong-exchange branch runs `S.ann[j].pop()`, which removes the **earlier, correct 10**.
  5. After the retry the history is `{1:[10], 2:[9]}`, and the finished problem shows no struck 10s (`shots/guided-s5-done-1366.png (1366×768)`, viewport only: the regroup row shows 5, 9, 9, 10 with nothing struck above).
- **Failure scenario:** in every zero chain (Learn 5–6, Practice Together, hard skills) a child who taps the "10" box and types 9:
  - sees nothing happen;
  - is told they're wrong;
  - watches their earlier correct 10 vanish.

  It breaks "crossed-out earlier values stay visible" and "a retry keeps the correct work". The same `maxlength` trap hits independent and test mode whenever a focused, filled box is clicked again.
- **Fix:**
  - On `pointerup` or `click` in `.sk-cur.sk-in`, call `select()` when the selection is collapsed.
  - Alternatively, drop `maxlength` and, on `input`, replace the value with the newly typed characters when the box already had 2.
  - In `check-ex`, remember which entries this attempt pushed and pop **only those**. Never pop an entry that existed before the attempt.

**SR-D03 · major: struck earlier values are illegible.**
- **Cause:**
  - `.sk-hist` is 0.85rem (15.3 px in Mathbook, 13.6 px on a 16 px host), weight 600 in `--sk-muted`.
  - A 3 px `--sk-cross` slash crosses both digits, so "10" reads as "1Ø" or a scribble.
- **Evidence:**
  - `shots/learn6-3002-exch-320.png (320×1628)`: the hundreds and tens history;
  - `shots/test-q10-steps-1366.png (1366×939)`: the "6" over 16 is nearly invisible;
  - `shots/demo-sea-1366.png (1366×1739)`: the "12" over 9.
- **Failure scenario:** the 3,002 example's key idea (0 → 10 → 9) can't be read on any device.
- **Fix:**
  - **Size:** `.sk-hist { font-size: 1.05rem; font-weight: 700; padding: 0 3px }`, with history row height 24 px (20 px on short screens).
  - **Strike style:** for the history row only, use a horizontal `text-decoration: line-through 2px var(--sk-cross)`. Two digits under a horizontal strike are unambiguous, and the "θ" concern applies only to single top digits. Keep the diagonal slash for top digits, but make it `2px` and draw it in `--sk-muted`, so the digit underneath stays readable.

**SR-D04 · major: Step 1's place chart scrolls sideways at 320 and 390.**
- **Evidence:** `scrollWidth` is 387 at 320 and 396 at 390. The "Value" column is cut off: `shots/learn1-chart-320.png (320×1264)` and `shots/learn1-chart-390.png (390×1156)`.
- **Failure scenario:** the very first Learn screen scrolls sideways on phones, and the "value stays the same" column (the point of the step) is hidden.
- **Fix:**
  - At 400 px and narrower, use `Th / H / T / O` headers (as `<abbr title>`), `padding: .3rem .25rem`, `min-width: 0`, and `table-layout: fixed; width: 100%`.
  - Or stack "Value" under the row as a caption line.

**SR-D05 · major: focus is lost after many actions.**
- **Evidence** (focus becomes `BODY`):
  - a wrong Yes/No or wrong supplier in guided mode (`shots/guided-s5-wrongsupp-390.png (390×1508)`);
  - finishing a guided problem;
  - Show the full solution;
  - Clear work (the button becomes disabled);
  - Undo when it empties the log;
  - Enter commit (SR-D01).
- **Failure scenario:** a keyboard or switch user answers wrong and has to Tab from the page header back into the problem every time.
- **Fix:** always pass a focus target to `render()`:
  - **wrong choice:** the button that was pressed;
  - **done:** the done message (`tabindex="-1"`), and the host's Next Step after that;
  - **solution:** the "Full solution" heading (`tabindex="-1"`);
  - **Clear:** Undo;
  - **disabled Undo:** the first regroup box.

**SR-D06 · major: the live region is recreated on every render.**
- **Cause:** `.sk-live` is part of the markup `render()` rebuilds, and `say()` writes to it in the same task. Screen readers often miss announcements in a newly inserted live region.
- **Doubling:** `.sk-fb role="status"` is re-inserted with its text, so the same feedback may be read twice or not at all. Both regions held the text in every guided and wrong-answer log, e.g. `status: ✗ The tens place has 0…` and `polite: ✗ The tens place has 0…`. The 1df0bc5 "done" view adds another `role="status"` copy.
- **Failure scenario:** a blind child hears nothing after Check, or hears the feedback twice.
- **Fix:**
  - Create `.sk-live` once at mount, outside the subtree that gets re-rendered. Clear it, then set the text about 50 ms later.
  - Remove `role="status"` from `.sk-fb`; `say()` already announces it.

**SR-D07 · major: on phones and at 200% zoom the controls are far from the grid.**
- **Evidence:**
  - **Demo at 320×640:** the grid is at y=465–740 and Next part at about y=1190 (`shots/learn6-3002-exch-320.png`). The child can't see the change and press Next on the same screen.
  - **Guided at 683×384:** the grid's entry boxes and Check span 405 px, more than the 384 px viewport (`shots/guided-s5-exch-zoom.png (683×1201)`). There is about 300 px of empty space beside the grid.
  - **Dead rule:** `@container (min-width: 860px)` in `subtract-workspace.css` never applies, because no ancestor declares `container-type`. Two panes depend only on viewport width ≥ 1000.
- **Fix:**
  - **Container:** `.sk { container-type: inline-size }`, and switch to two panes at `@container (min-width: 600px)`. This puts the coach beside the grid at 683, at 768 and inside wide cards, and drop the viewport media rule.
  - **Stacked order:** in demo, put the Back / Part / Next row first, then the sentence, then "Top number now". In guided, show the question and its buttons first.
  - **Narrow widths:** show only the current "Top number now" line, with earlier lines in a `<details>`.

**SR-D08 · major: error-analysis work doesn't show the wrong answer under the line.**
- **Cause:** the "someone's work" view is mounted with `answer: false`. Zoe's 3,584 appears only in the sentence.
- **Evidence:** `shots/test-q13-mistake-390.png (390×1835)` and `shots/skill-mistakes-1366.png (1366×1528)`.
- **Failure scenario:** the child can't compare column by column to find where it went wrong. The spec requires error analysis shown vertically.
- **Fix:**
  - Show the work's answer digits read-only in the answer row, with a visible label ("Zoe's answer") to the left of the row or as the grid caption.
  - Use `aria-label`s like "Zoe's answer, tens digit 8".
  - Leave the view's regroup marks as they are.

**SR-D09 · minor: the grid overflows the Your Turn panel at 320.**
- **Cause:** the 4-digit tracks total about 262 px, but `.wiz-check` gives 252 px. The ones band spills over the panel border.
- **Evidence:** `shots/guided-s5-exch-320.png (320×1583)`.
- **Fix:** with SR-D07's container, use `--sk-col: clamp(44px, calc((100cqi - var(--sk-op) - var(--sk-comma) - 12px) / 4), 60px)`. Alternatively, at 360 px and narrower, set `.wiz-check .sk { --sk-col: 52px; --sk-op: 1rem }`.

**SR-D10 · minor: Tab order runs column by column.**
- **Evidence:** Tab goes r3 → a3 → r2 → a2 → r1 → a1 → r0 → a0 (`indep-keys` log).
- **Failure scenario:** Tab from the thousands answer jumps up to the hundreds regroup box.
- **Fix:** emit all regroup cells, then all answer cells, in DOM order. Grid placement is explicit, so the visual layout is unchanged.

**SR-D11 · minor: the previous step's ✓ sits under the new question's Check.**
- **Evidence:** `shots/guided-s5-exch-1366.png (1366×768)`, viewport only: "✓ The tens and hundreds have 0…" sits under the new question's Check button, so it reads as the result of a Check not yet pressed. In the supplier stage, `.sk-sub` repeats the needs-Yes sentence.
- **Fix:**
  - Show the confirmation for the previous step **above** the new question, as a muted "✓ …" line.
  - Keep `.sk-fb` under the button for the current step only.
  - Drop the repeated `.sk-sub` line.

**SR-D12 · minor: the ✓/✗ marks are tiny.**
- **Cause:** the marks are 0.85rem glyphs at bottom-right, partly over the box border.
- **Evidence:** `shots/indep-wrong-1366.png (1366×992)`.
- **Fix:** reuse Mathbook's `.mk` badge: a 1.3rem white circle with a 2 px border, top-right, `z-index: 2`, coloured `--sk-ok` / `--sk-no`.

**SR-D13 · minor: full-solution presentation.**
- **Evidence:** `shots/indep-solution-1366.png (1366×768)`, viewport only:
  - **Leading zero:** the answer row shows a leading "0" (0,935).
  - **Run-on text:** the explanation is one long paragraph.
  - **Focus:** it is lost (SR-D05).
  - **Scrolling at 390:** opening the solution scrolls the child's grid out of view (grid top at −157).
- **Fix:**
  - Leave leading-zero answer boxes blank in `view` mode (1df0bc5 fixed this for guided only).
  - Render the steps as an ordered list, one exchange or digit per line.
  - Bring the solution into view with `block: 'nearest'`, as now, and focus its heading.

**SR-D14 · minor: the "Earlier hints" summary is 32 px tall.**
- **Evidence:** the metrics on `shots/indep-hints-1366.png (1366×768)`.
- **Fix:** `.sk-older summary { min-height: 44px; display: flex; align-items: center }`.

**SR-D15 · minor: hints 2–3 repeat when the next column needs no exchange.** (Re-check against 1df0bc5.)
- **Evidence:** for 7,008 − 264 the hints were:
  1. "Is 8 enough to take away 4?"
  2. "8 is enough…, so the ones column does not need an exchange."
  3. "No exchange is needed in the ones."
  4. "8 − 4 = 4."

  Levels 2–3 add nothing, and the hints never reach the tens, the column that actually needs attention. The math/testing agent should confirm the content.
- **Fix:** for a column that needs no exchange, collapse it to one hint ("8 − 4 = 4"). Then aim the next hint level at the next column that needs regrouping.

**SR-D16 · minor: the results score cell wraps at 390.**
- **Evidence:** `shots/results-390.png (390×2100)`: "12 of" breaks onto two lines. The review line also reads "you wrote: chose a reason; answer 427".
- **Fix:**
  - Give the score cell `white-space: nowrap`.
  - Reword the review line, e.g. "Your answer: 427 (reason chosen)".

### Re-verification I need after fixes

- **Scripted runs:** re-run `indep-clickloss`, `indep-touch`, the guided zero-chain trace, and the `learn1-chart`, `guided-*-zoom`, `learn6-*-320` and `test-q13` scenes. The scripts are kept in the scratchpad `design/` folder.
- **Pass criteria:**
  - every click, tap, Tab and Enter lands where intended;
  - history keeps `[10, 9]`;
  - no `scrollWidth > clientWidth`;
  - controls sit within one screen of the grid at 320×640 and 683×384.
