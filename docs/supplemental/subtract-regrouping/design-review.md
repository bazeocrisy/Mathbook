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

## 3. Re-check at 98748ae

**Method:**
- I re-ran the same scene scripts with real CDP mouse, touch and keys, one headless Chrome, at 320, 390, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384.
- New screenshots overwrite the old ones in the scratchpad `shots/`. The extra position and measurement scenes are `pos-*.png` and `m-*.png`.
- No JS errors on any screen, and no sideways scroll anywhere.

**Result: 13 findings pass. SR-D04 passes with a minor leftover, SR-D07 and SR-D16 are partly fixed, and there is one new minor finding.**

| ID | Result | Evidence at 98748ae |
|---|---|---|
| SR-D01 | **pass** | Click Check right after typing a mark: feedback shows and focus stays on Check. Box → box: focus goes to r3 and the typed digit lands. Tab → a3. Enter keeps r1. Touch at 390: tap → Check works, tap → next box gets focus. Test Q1: mark, then click an answer box, focus on a0. |
| SR-D02 | **pass** | Zero-chain trace with real clicks: the filled box is selected (`0-2`). A wrong attempt keeps `{2:[10]}`. The final history is `{1:[10,9], 2:[10,9]}`, and the struck 10s render. |
| SR-D03 | **pass** | History is 18.9 px/700 with a horizontal strike. "10" reads clearly at 320, 1366 and in the mini solution (`learn6-3002-exch-320.png`, `indep-solution-1366.png`). |
| SR-D04 | **pass, minor leftover** | No sideways scroll at 320 or 390, and the headers are Th/H/T/O. At 320 the "Value" cells' text (3,002) is 58 px in a 53 px cell, touching the border (`learn1-chart-320.png`). Fix: `font-size: .95rem` or `padding-inline: .2rem` on `.sr-val` at 360 px and narrower. |
| SR-D05 | **pass** | Wrong supplier → the pressed "Tens" button. Done → the `✓ You did it!` message. Solution → the "Full solution" heading. Clear → Undo. A wrong exchange → the giver box. |
| SR-D06 | **pass** | One `.sk-live` node survives commits, Undo and Clear (a marker set on the node persisted), and the component has no `role="status"`. Announcements read "Tens now 8, was 9.", "Undone: tens back to 9." and "Regroup marks cleared." |
| SR-D07 | **partial** | **Demo:** two panes at 683 zoom (Next beside the grid at y=356), and the controls come first on phones (320: grid 465–744, Next 816–866). **Tablet 768:** two-pane guided. **Still failing, guided at 683×384:** `.sk` is 589 px inside `.wiz-check`, under the 600 px threshold, so it stacks. Grid top at 339 to Check bottom at 804 is 465 px, more than 384 (`pos-guided-s5-exch-zoom.png`). Fix: lower the two-pane container threshold to about 560 px (grid 278 + gap 24 leaves ≥ 258 for the coach). |
| SR-D08 | **pass** | Mistake items show "Omar's work" with his answer 2,653 under the line (`test-q13-mistake-320.png`, `skill-mistakes-1366.png`). See SR-D17. |
| SR-D09 | **pass** | At 320 the 4-digit grid fits inside the Your Turn panel (`.sk` 251 px, `pos-guided-s5-exch-320.png`). |
| SR-D10 | **pass** | Tab order: r2 → r1 → r0 → a3 → a2 → a1 → a0 → Hint → Check. |
| SR-D11 | **pass** | The previous step's "✓ …" sits above "Working on the ones" and the question. |
| SR-D12 | **pass** | ✓/✗ badges are 23×23 px at the top-right of the box. |
| SR-D13 | **pass** | No leading zero (1,938), steps in an ordered list, and focus on the heading. At 390 the solution still scrolls the child's grid out of view (grid top at −236). That's accepted: the solution is a separate read-only copy. |
| SR-D14 | **pass** | No interactive element under 44 px on any measured screen. |
| SR-D15 | **pass** | 9,001 − 3,755: hint 1 is the ones, hint 2 "the thousands place can give", hint 3 the exchange chain, hint 4 "11 − 5 = 6". |
| SR-D16 | **partial** | The wording is fixed ("your answer: 6,518 (reason chosen)"). The "Final answers **12 of / 12**" cell still wraps at 390 (`m-results-390.png`). The nowrap isn't reaching that cell: put `white-space: nowrap` on the score `<td>` itself. |

**New finding**

**SR-D17 · minor: someone's read-only answer looks like an input.**
- **Evidence:** in the mistake items, "Omar's work" answer digits sit in the same purple-bordered 52 px boxes as the child's own answer boxes a few lines below (`test-q13-mistake-320.png`).
- **Failure scenario:** on a phone a child taps Omar's digits to "fix" them, and nothing happens.
- **Fix:** in `view` mode with a work answer, drop the box border and background, or use a light grey fill with no border, so the digits sit under the rule like printed work. Keep the visible caption.

**Still needed to close:** SR-D07 (guided at 200% zoom) and SR-D16 (score cell). Optional: the SR-D04 leftover and SR-D17.

## 4. Final re-check at f41cdc2

**Method:** the affected scenes only, with real CDP input in one headless Chrome. Screenshots are the `f-*.png` files in the scratchpad `shots/`. No JS errors, and no sideways scroll on any of them.

| ID | Result | Evidence |
|---|---|---|
| SR-D07 | **pass** | **Guided at 683×384:** two panes (`277.6px 284.3px`, `.sk` 589 px). Grid top at y=339 to Check bottom at 655 is 316 px, within the 384 px screen (`f-guided-s5-exch-zoom.png`). |
| SR-D16 | **pass** | "Final answers 12 of 12" stays on one line at 390 (`f-m-results-390.png`). |
| SR-D04 | **pass** | At 320 no chart cell overflows (the table is 276.6 px wide, inside the card). |
| SR-D17 | **pass** | Someone's answer digits show on a light grey fill (`#eef0f7`) with no visible box border, clearly unlike the child's dashed and outlined input boxes below (`f-test-q13-390.png`; `f-skill-mistakes-390.png` is the same). |

**The 560 px threshold elsewhere:**
- **768×1024:** two panes (Check at y=592–642, beside the grid).
- **1366×768:** two panes (Check at 466–516).
- **390 and 320:** still stacked (`.sk` 296 and 251 px), with the grid inside the card and no overlap.

**Status:** all design findings SR-D01 to SR-D17 are closed.

## 5. Review of the help and recovery revision (9912a66)

### How it was inspected

- **Real headless Chrome**, one instance, with real CDP mouse, touch and keys.
- **Viewports:** 320×640, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384.
- **Screens covered:**
  - Step 1 Example (all four parts and both examples);
  - Step 1 Your Turn: wrong answer, Try again, Get a hint, Show me how, refresh mid-question, completion;
  - Learn 2–9, Example and Your Turn, swept at 320, 390, 1366 and zoom;
  - guided Show me through a whole zero-chain problem, and guided wrong → Try again / Get a hint;
  - Learn 7, 8 and 9 (decide, mistake, check): wrong answer, and Hint then Show me;
  - Practice Together through Show me;
  - independent practice: Show me first, a wrong Check then Try again, and a 10-question session with help on every other question;
  - the decide and mistakes skills;
  - test review;
  - reset.
- **Where the evidence is:** scripts are `scenes-help.mjs` and `scenes-misc.mjs`; screenshots are in the scratchpad `shots/`. Image sizes are omitted below unless they matter.

### What passes

- **No layout faults:** no sideways scroll, no element past the viewport edge and no JS errors on any of the 64 swept screens or in any flow.
- **Step 1 Example:**
  - 49 and then 72 are shown as tens rods and ones cubes, one action per part (4 parts).
  - Changed columns get a 4 px outline plus −1/+10 chips, so they don't depend on colour.
  - The sentences are short and concrete: "The tens go from 4 to 3. The ones go from 9 to 19. Now there are 3 tens and 19 ones."
  - It reads well at every size (`s1ex-p3-390.png`).
- **Step 1 Your Turn:**
  - one numeric question at a time;
  - the starting blocks stay on screen;
  - feedback is concrete ("54 has 5 tens. When 1 ten is exchanged for 10 ones, there is 1 fewer ten, not 1 more.");
  - after Show me, the worked line appears under its question with "(shown)";
  - the question position survives a refresh.
- **Help everywhere it should be:** 💡 Hint and Show me sit next to the answer on every Learn Your Turn (1–9), in Practice Together, in independent practice (Show me needs no earlier hints) and in the decide and mistakes skills. The test still has no help controls; they render only alongside Check, which test mode leaves out.
- **No dead ends:**
  - Next Step / Finish unlocks immediately after completion or Show me, with no refresh.
  - "Done with help. … Try a similar problem" is offered but is not a gate.
  - Independent practice moves on after Show me.
- **"With help" is recorded and visible:**
  - `see-wizard.helped`;
  - My Results: "Learn: 1 of 9 steps done (1 with help)";
  - the practice summary: "5 of 10 solved on your own · 5 on the first try · 5 with help", with each item labelled "done with help" or "✓ on your own".
- **Guided Show me:**
  - does exactly one step, updates the vertical marks (crossed-out digits, new values, struck 10s) and explains with the amounts;
  - focus moves to the next control: the supplier choice, the next regroup box, the answer box, then the "✓ …" done message.
- **Guided wrong answer:**
  - the retry row (Try again · Get a hint · Show me how) **replaces** the normal help row;
  - Try again focuses the first choice;
  - Get a hint focuses the hint text.
- **Vertical work:** mistake and check Show me add a vertical "Worked answer" plus numbered steps. Test review has "See the worked answer" with a vertical worked answer and steps.
- **Reset:** confirms first, then clears every section key, including the "with help" records, and returns to the menu.
- **Desktop 1366×768:** in guided mode the grid, Check, Hint and Show me are all above the fold (`g6-show-1366.png`).

### Findings

| ID | Sev. | Summary |
|---|---|---|
| SR-D18 | major | Step 1 Example parts are not announced to screen readers |
| SR-D19 | major | After a wrong Check, form items, Step 1 and independent practice show two sets of help buttons |
| SR-D20 | major | Focus drops to `<body>` when Step 1 Your Turn is completed |
| SR-D21 | minor | "✓ You did it!" after a problem finished entirely with Show me |
| SR-D22 | minor | The decide Show me explanation uses amounts the visible grid doesn't show |
| SR-D23 | minor | Independent Show me on phones moves the child's own problem out of view |
| SR-D24 | minor | Independent "Try again" focuses the thousands box, not the first wrong digit from the ones |
| SR-D25 | minor | Guided wrong-answer feedback already gives the conclusion, so "Get a hint" is weaker than the feedback |
| SR-D26 | minor | Step 1 details: part position, two navigation rows, grammar, a stray space |
| SR-D27 | minor | Test review "See the worked answer" summaries are 28 px tall |

**SR-D18 · major: Step 1 Example parts are not announced.**
- **Cause:**
  - Back and Next replace `.sr-example` with new HTML, and focus stays on the button.
  - Only the handler attached at first draw adds `aria-live` to `.sr-say`, and it does so after the new text is already present.
  - The handlers attached by `bindParts()` don't add it at all.
- **Evidence:** after two Next presses, `.sr-say` has `aria-live = null` at all 7 sizes (`s1ex-p3-*`).
- **Failure scenario:** a screen-reader user presses Next and hears only "Next, button". The new sentence ("The tens go from 4 to 3…") and the changed blocks are never read.
- **Fix:**
  - Keep one persistent polite live region outside `.sr-example` (for example a `.sk-sr` paragraph in the card) and write each part's sentence into it after the redraw.
  - Give the blocks figure an `aria-label` per part, e.g. "3 tens and 19 ones".

**SR-D19 · major: two sets of help buttons after a wrong Check.**
- **Evidence:** after a wrong Check, Step 1 Your Turn and the Learn 7–9 / skill form items show six help-related buttons, and form items with an answer workspace add Undo and Clear for eight in all. Independent practice shows eight in its toolbar and coach (`s1try-wrong-1366.png`, `l8-mistake-wrong-390.png`, `indep-wrongretry-390.png`):
  - the original row: Check Answer · 💡 Hint · Show me;
  - the retry row added below the feedback: Try again · Get a hint · Show me how.
- **Failure scenario:**
  - A child sees two hint buttons and two show buttons with different names, and doesn't know which to press.
  - "Try again" only focuses the input, which the child could already do.
  - It contradicts "simple navigation"; guided mode already does this correctly.
- **Fix:**
  - Do as guided mode does: after a wrong Check, **replace** the Hint / Show me buttons with the retry row, keeping Check Answer next to the input.
  - Restore the normal row on Try again or when the child edits an answer.
  - In independent practice, hide the toolbar's Hint and Show me while the retry row is visible.

**SR-D20 · major: focus drops to `<body>` when Step 1 Your Turn is completed.**
- **Cause:** `draw('.feedback-ok')` focuses a `<div>` without `tabindex`, so focus falls to `<body>`.
- **Evidence:** at 320, 390 and 1366 (`misc-s1try-done-*`) and after "Show me how" → completion (`s1try-wrong-390`).
- **Failure scenario:** a keyboard user finishes Step 1 and has to Tab from the page header to reach Next Step.
- **Fix:** add `tabindex="-1"` to the completion message and focus it, or focus Next Step.

**SR-D21 · minor: "✓ You did it!" after a problem finished entirely with Show me.**
- **Evidence:** `g6-show-all-390.png`. Every step was revealed, yet the done line reads "✓ You did it! 6,007 − 2,049 = 3,958." directly above "Done with help…".
- **Failure scenario:** the message tells the child the work was independent, contradicting the recorded status. A parent can't tell independent success from help at a glance.
- **Fix:** when `S.helped`, use neutral wording, e.g. "Finished with help: 6,007 − 2,049 = 3,958. Try one on your own next." The same applies in Practice Together.

**SR-D22 · minor: the decide Show me explanation uses amounts the grid doesn't show.**
- **Evidence:** `l7-decide-show-390.png`, 8,140 − 474. Show me says "tens: 3 is less than 7 → exchange", which is correct after the ones exchange. But the grid above has no marks and still shows 4 tens, and decide items get no worked vertical.
- **Failure scenario:** the child compares "3" with the 4 on screen and is confused. This is the "using an original digit" trap seen from the other side.
- **Fix:** for decide, also show the worked vertical with exchange marks, as mistake and check do, or add the marks to the item's view grid when Show me is pressed.

**SR-D23 · minor: independent Show me on phones moves the child's own problem out of view.**
- **Evidence:** after Show me, the child's grid top is at −163 at 390 and −366 at 320 (`indep-showfirst-*`). The solution says "Read each step, then try writing the answer yourself."
- **Failure scenario:** the child has to scroll back up and find their own boxes.
- **Fix:** add a "Back to my problem ↑" button under the solution that scrolls the child's grid into view and focuses the ones answer box.

**SR-D24 · minor: independent "Try again" focuses the thousands box.**
- **Evidence:** `focusRetry = a3` (thousands) at every size.
- **Failure scenario:** the method runs from the ones, so the child is sent to the wrong end of the problem.
- **Fix:** focus the lowest place marked ✗, or the ones box if none is marked.

**SR-D25 · minor: guided wrong-answer feedback already gives the conclusion.**
- **Evidence:** `g6-wrong-retry-390.png`. The feedback "Look again: the ones has 0 and you need to take away 2. 0 is less than 2, so you need an exchange first." already answers the question. The "Get a hint" that follows ("Can you take 2 away from 0?") is weaker.
- **Failure scenario:** the help ladder runs backwards. Try again becomes "press the other button".
- **Fix:** wrong feedback states the facts only ("The ones has 0 and we take away 2."). The hint asks the guiding question, and Show me gives the conclusion. The math/testing agent should check the wording.

**SR-D26 · minor: Step 1 details.**
- **Part position:** it is kept in memory (`exPart`). It resets to Part 1 on refresh but stays when you leave and return. Store it with `W.ex`, or reset it consistently.
- **Two navigation rows:** Back / Part x of 4 / Next and Previous example / Example x of 2 / Next example sit together (`s1ex-p3-390.png`). Make "Next ▶" on the last part go to Example 2, and show the example row only on the last part.
- **Grammar:** "Now there are 1 tens and 14 ones" (n = 24, `misc-s1try-done-1366`). Use ten/tens and is/are; the guided text already does.
- **Stray space:** the prompt reads "in 54 ." with a space before the full stop.

**SR-D27 · minor: the test review summary is 28 px tall.**
- **Evidence:** "See the worked answer" summaries measure 28 px at 390 (`misc-testreview-390`).
- **Fix:** `.sr-review summary { min-height: 44px; display: flex; align-items: center }`.

### What closing this needs

- **Must fix:** SR-D18–D20.
- **Recommended:** SR-D21–D27.
- **Re-check:** I'll re-run `scenes-help.mjs` and `scenes-misc.mjs` after the fixes.

## 6. Re-check at 7470cbb

**Method:**
- I re-ran `scenes-help.mjs` and `scenes-misc.mjs` with real CDP input in one headless Chrome, at 320, 390, 768×1024, 1024×768, 1366×768, 1920×1080 and 683×384.
- Two scene fixes on my side: the Step 1 number is now read from the prompt text, and the live-region and solution-position checks were added.
- No JS errors, no sideways scroll and no overflow on any screen. The 64-screen Learn sweep is clean again.

**Result:** all of SR-D18–D27 pass, except SR-D26's part position, which is kept by decision. SR-D23's own goal is met but raises a new issue (SR-D28).

| ID | Result | Evidence at 7470cbb |
|---|---|---|
| SR-D18 | **pass** | After Next, `#sr-part-live` (polite, persistent) holds the part's sentence, e.g. "The tens go from 4 to 3. The ones go from 9 to 19. Now there are 3 tens and 19 ones.", at all 7 sizes. Focus stays on Next. |
| SR-D19 | **pass** | After a wrong answer, one help set shows: Step 1 and forms show Check Answer · Try again · Get a hint · Show me how; independent practice shows Undo · Clear work · Check · Try again · Get a hint · Show me how. The toolbar's Hint and Show me come back after Try again. |
| SR-D20 | **pass** | Step 1 completion focuses `.sr-complete` ("✓ Now there are … The value is the same.") at 320, 390 and 1366, including after Show me how. Next Step is enabled. |
| SR-D21 | **pass** | A guided problem finished with Show me ends "✓ Finished with help: 8,000 − 49 = 7,951. Try a similar problem on your own when you are ready." Practice Together reads the same. |
| SR-D22 | **pass** | Decide Show me now quotes only the digits on screen, up to the first column that needs an exchange. Examples: "ones: 9 is enough for 0. Tens: 2 is less than 6, so yes, the tens column needs an exchange first.", and the no-regroup case lists every column pair. |
| SR-D23 | **pass, see SR-D28** | Show me no longer scrolls the child's problem away (`scrollY` 0 at 390, grid top at 437). |
| SR-D24 | **pass** | Try again focuses `a0`, "Answer, ones digit, marked not correct", at all sizes. |
| SR-D25 | **pass** | Guided: "✗ Look again at the ones: the top has 0 and you need to take away 2." Get a hint asks the question, and Show me gives the conclusion. Decide forms now point too ("Check each column, starting with the ones …"). |
| SR-D26 | **pass, one part kept by decision** | **Fixed:** "Exchange 1 ten for 10 ones in 91." has no stray space, and the text uses `tens()`/`ones()` for singular and plural. **Kept:** the part position still resets on refresh but stays when you leave and return. Accepted: it is a short 4-part demo, and the step and phase are saved. |
| SR-D27 | **pass** | The "See the worked answer" summary is 44 px tall. |

**New finding**

**SR-D28 · major: independent Show me on phones looks as if nothing happened.**
- **Evidence:** `indep-showfirst-390.png (390×1878)`. After Show me, focus moves to the "Full solution" heading with `preventScroll`, but the heading starts at y=857 on an 844 px screen. At 320 it is at 675 of 640. The only visible change is Hint and Show me vanishing from the toolbar.
- **Failure scenario:** a child on a phone taps Show me, sees the buttons disappear and nothing else, and thinks the help is broken or gone. A screen reader does announce the solution, so this is a problem for sighted users only.
- **Fix:**
  - After focusing, call `heading.scrollIntoView({ block: 'nearest' })` on the **heading only**. That scrolls just enough (about 60 px at 390) to show the heading and its first line at the bottom of the screen, while the child's answer row stays visible.
  - Optionally add a short visible note under the toolbar, "Full solution below ↓", while the solution is open.

**Still open:** SR-D28 only.

### SR-D28 re-check at 55e26c6: pass

**Method:** in independent practice (`#practice/setup` → Start, and `#practice/skill-one`) I pressed Show me with a real click, then measured the "Full solution" heading and the child's answer row in viewport coordinates. One headless Chrome, closed afterwards. Script: `scenes-d28.mjs`.

| Viewport | Heading (top–bottom) | Child's answer row | Both visible |
|---|---|---|---|
| 320×640 | 614–640 | 402–454 | yes |
| 360×740 | 714–740 | 502–554 | yes |
| 390×844 | 818–844 | 605–658 | yes |
| 768×1024 | 379–405 (no scroll) | 565–617 | yes |
| 1024×768 | 334–360 (no scroll) | 519–571 | yes |
| 1366×768 | 336–362 (no scroll) | 521–573 | yes |
| 683×384 (200% zoom) | 54–80 | 215–259 | yes |

- **Focus** is on `.sk-solution-h` everywhere.
- **No sideways scroll** and no JS errors.
- **On phones** the heading sits flush with the bottom edge. That's enough to show that help appeared, and the child's work stays in view. Tablet and desktop don't scroll at all.

**Status:** SR-D28 is closed. All design findings SR-D01 to SR-D28 are closed.

## 7. Show me player review (ee798a4)

### How it was inspected

- **Real headless Chrome**, one instance (closed afterwards), with real CDP clicks and keys.
- **Viewports:** 320×640, 360×740, 390×844, 768×1024, 1024×768, 1366×768 and 683×384.
- **Scripts:** `scenes-show.mjs` and `scenes-show2.mjs`. Screenshots are in the scratchpad `shots/show-*`.
- **What I stepped through, every part, recording each time** the focus, the live text, the player's marks and answer row, the child's own boxes and radios, and the Continue state:
  - Step 1 Your Turn;
  - Learn 7, 8 and 9 (decide, mistake, check) at 320, 390 and 1366;
  - independent practice on `#practice/skill-zeros2` (four-digit, consecutive zeros) at all 7 sizes;
  - guided Learn 6;
  - the test.
- **Refresh:** I reloaded mid-play and after completion.

### What passes

- **Every exchange is visible before any answer appears.** Example: 9,004 − 8,117 at 320.
  - The player shows the thousands → hundreds → tens → ones exchanges one per part ("8, 10", then "8, 9, 10" with a struck 10, then "8, 9, 9, 14" with two struck 10s).
  - Only then does it show the column digits.
  - The **child's own grid stays empty**: no marks, no crossed digits and no answers through all 11 intermediate parts, at every size.
  - The child's grid fills (answers, regroup marks and ✓) only at the last part.
  - Learn forms behave the same: the child's answers and radios stay empty or unchecked until the last part.
  - Step 1 hides the question inputs while playing and fills both answers only at Part 4.
- **The model stays on screen.** After the last part, the player stays at its final part. The written steps (6–8 lines) and the "Completed with help" note are added below, and a refresh after completion restores all of it.
- **Continue and "Completed with help":**
  - Next Step / Finish stays disabled during play and enables at the last part.
  - Focus goes to the completion note: `.sr-complete` in Step 1, `.sr-shown-done` in forms, `.sk-shown-done` in independent practice.
  - Wording: "Completed with help: 9,004 − 8,117 = 887. Your answer boxes are filled in." Guided Learn 6 also ends "Completed with help: …".
- **Focus and announcements while playing:**
  - Next keeps focus on Next (on Back when the end is reached).
  - Each part's sentence reaches a persistent polite live region. Examples: "Exchange 1 hundred for 10 tens: the hundreds go from 10 to 9, and the tens from 0 to 10. Now 8 thousands, 9 hundreds, 10 tens, 4 ones. 8,000 + 900 + 100 + 4 = 9,004: the value is the same." and, in Step 1, "The tens go from 2 to 1. The ones go from 9 to 19…".
- **Nested player layout:**
  - No sideways scroll and no element outside the player at any size.
  - No player button under 44 px.
  - The mini grid is 198 px wide (40 px columns), with digits and struck 10s legible (`show2-zeros2-mid-390.png`).
  - At 1024 and wider the coach is two-pane, so Next sits beside the mini grid (y=436 at 1366).
  - On phones the player stacks: mini grid, then controls, then the sentence. The grid, Next and sentence together span 373 px, which fits one screen at 320×640.
- **Refresh mid-play in independent practice:** resumes at the same part ("Part 4 of 13"), and the child's grid stays empty.
- **The test stays free of help:** none of the 15 questions has a help control (Hint, Show me, Check or g-show).

### Findings

**SR-D29 · minor: on phones the player's sentence sits below its controls.**
- **Evidence:** `show2-zeros2-mid-390.png`. At 390 the mini grid is at y=508–723, Next at 794–844 (two rows: Back / Part, then Next / Start over) and the sentence at 855–881. At 320: grid 304–519, Next 591–640, sentence 651–677.
- **Failure scenario:** a child keeps tapping Next where it sits at the bottom of the screen. The grid changes in view, but the explanation for that change sits just below the fold. The owner asked for each exchange to be explained, not only shown. A screen reader still hears it through the live region.
- **Fix:** for the nested player (`.sk-mini` with the demo coach), put the part sentence directly under the mini grid and the controls after it. Grid + sentence + controls is about 380 px and still fits 640. Alternatively, scroll the sentence into view (`block: 'nearest'`) after each Next on narrow widths.

**SR-D30 · minor: refresh mid-play in Step 1 and Learn forms drops the player.**
- **Evidence:**
  - **Step 1:** a reload at Part 2 returns to "How many tens are left?" with Check / Hint / Show me and no player (`show-s1-midrefresh-390`).
  - **Learn 8:** a reload at Part 3 shows no worked player (`show-l8-midrefresh-390`).
  - **Independent practice** does resume at the same part, and every player is restored correctly after completion.
- **Failure scenario:** a child who refreshes or switches apps mid-demo loses their place and has to press Show me again. Help is already recorded, so nothing is wrong in the data. It is just inconsistent with independent practice.
- **Fix:** save the playing part, as independent practice does with `S.show`: `R0.sp` for Step 1 and `R.sp` for forms. On restore, reopen the player at that part.

### Status

The Show me revision meets the owner's requirements: exchanges before answers, the model stays on screen, Continue unlocks with "Completed with help", it works for four-digit problems across zeros, everything is vertical, and the test has no help. SR-D29 and SR-D30 are minor polish and don't block release.
