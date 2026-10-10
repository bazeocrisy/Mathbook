# Chapter 2 design: shared screens and components

The design agent wrote this from the running app (2-1 and 2-2 on a 390 px phone and a 1280 px desktop), the shared engine, every lesson spec in [lessons/](lessons/), and the book pages. It is the single specification for screen patterns and shared models (PLAN.md decision 17). Lesson specs say *what* to teach. This file says *how it looks and behaves*. Where a lesson spec proposes its own component (`eqmake`, `pstack`, `dsub`, `adjust`, `vcalc`, `stackHTML`, `adjustHTML`, `barDiagramHTML`, `symbol`…), use the component here instead (see the mapping table in §2).

Rule zero: **reuse, don't redesign.** Section 2-1 is locked. Everything below uses the existing palette, cards, buttons, wording and flows. New things are limited to display figures plus three answer controls (`chain`, `vcalc`, and small `parts` additions).

---

## 1. Global screen patterns (every lesson)

These describe what exists, so builders reproduce it exactly. Lessons supply data only.

| Screen | Child sees | Child does | Primary action | Next |
|---|---|---|---|---|
| **Lesson Menu** `#menu` | Eyebrow "Lesson 2-N", lesson title, "What would you like to do?", 4 white cards (Learn with a yellow "Start here" badge until Learn is done, Practice, Take a Test, My Results), then a small "Parent Guide · how to teach this lesson" link. 2×2 on desktop, 1 column on phones. | Taps a card | The card | The activity |
| **Learn: Example** `#see` | Header "Learn" + "Step X of Y" (yellow). White card: purple **EXAMPLE** tag, step title, one-sentence explain (18 px regular), the slide body (one idea per part, with its model), "Start Over" (ghost, right), then "◀ Back a part · Part k of n · Next part ▶". | Steps through parts | **Now I'll Try →** (yellow star button, full width on phone). "← Previous Step" (ghost) to its left from step 2. | Your Turn |
| **Learn: Your Turn** | Yellow **YOUR TURN** tag, same title. A lavender question panel: prompt, figure (if any), answer controls, then **Check Answer** directly under the answer, feedback directly under that (`aria-live`). | Answers and checks. Miss 1: "Not quite." + hint and the names of the parts to look at, then **Try Again**. Miss 2: "The answer is …" + explanation, then **Try a new one**. Right: "✓ Correct!" + explanation, then "Try another one" (ghost). | **Check Answer** → **Next Step →** (disabled until correct; note "Answer correctly to unlock the next step."). "← See the Example Again" (ghost) above it. | Next step. The last step shows **Finish →** and then "You finished learning!" with an optional "Think and talk" reflection and **Start Practice**. |
| **Practice** `#practice` | "Choose how you want to practice": only the activities the lesson defines (Math Words, Practice Together, On My Own) | Picks one | The card | |
| **Practice Together** | "Question X of N", the question, Check Answer / Show a hint / Show answer and why, a folded orange **Parent Help** (coaching). Explain items: "Listen for: …", **They explained it** / Show the explanation. | Works with the parent | **Check Answer**, then **Next problem →** | Completion: "You finished Practice Together!" |
| **On My Own** | Set cards ("Set k", title, blurb, status chip Not started / In progress / Completed, "Last score") with **Start set / Continue / Practice this set again** | One question at a time, "Question X of N", ← Previous / Next →, last one **Check my work** | **Check my work** | Checked list: each question in review mode with ✓/✗, "Your answer / Correct answer", explanation; **Practice My Misses (n)**, Practice this set again, Choose another set |
| **Take a Test** `#test` | One card per test (title, blurb, "N questions · one at a time", Last score / Not taken yet / Unfinished) with **Start / Keep going / Take it again**; Parent Help (test rules) | — | Start | Test runner |
| **Test runner** | Sticky banner "Test title · a of N answered" + progress bar + **Save and finish later**. "Attempt k · No hints during the test." One question per screen. No hints, no checking, no marks. | Answers, Next → … **Review my answers →** | Review screen: "Ready to finish? You answered a of N", links "Go to question k" for blanks, **Finish Test** only when all answered | My Results |
| **My Results** `#results` | Score, mastery band (90–100 Mastered · 70–89 Review missed skills · below 70 Reteach and reassess), Skills to review with **Practice this skill (Set k)**, Mistakes to review (question, Your answer, Correct answer, explanation), Correct answers (folded), Attempt history; test picker when there are 2+ tests | | Take a new <test> | |
| **Parent Guide** `#teach` | Orange parent styling. Sections A Goal · B Math words · C Demonstrate · D Questions, mistakes, checklist (from `parentLearn`), then **Reset Lesson Progress…** card | Reads; may reset | — | Reset asks inline "Delete all saved answers, Learn completion, and scores for Section 2-N on this device?" **Yes, delete** / Cancel |

Wording that stays fixed: *Now I'll Try →, See the Example Again, Check Answer, Try Again, Try a new one, Next Step →, Finish →, Back a part / Next part, Start Over ("Start this problem over?" Start Over / Cancel), Check my work, Practice My Misses, Save and finish later, Review my answers →, Finish Test, Reset Lesson Progress…*. Resume is automatic: Learn reopens on the saved step and phase, sets and tests show **Continue / Keep going**. Never add a new resume or restart word.

Placement rules for every new question type and figure:
1. Order inside the question panel: **prompt → figure(s) → answer controls → Check Answer (guided only) → feedback**. Nothing goes beside the answer on phones. On ≥ 900 px a figure may sit left of the parts only where §5 says so.
2. One question per screen and one idea per Example part. If a part needs two figures, use the existing `.slide-pair` (side by side ≥ 900 px, stacked below).
3. Instructions are 18 px regular text. Numbers in figures and inputs are bold, 1.15–1.4 rem.
4. Every target is at least 48 px tall, and buttons are at least 48 × 48. The only exception is §4.3 digit boxes at ≤ 360 px.
5. Meaning is never colour-only. Every ✓/✗ is a glyph plus colour, highlights also get a bold weight or outline, and unknowns are "?" or a lettered box.

---

## 2. Component map (spec names → this file)

| Need (lesson specs) | Use |
|---|---|
| Estimate arrows (2-3), adjust-arrows display (2-8, 2-10, 2-11) | **F1 Arrow equation** |
| Grouping V (2-4) | **F2 Grouping V** |
| Counters (2-4 step 1), M-PAIRS (2-5) | **F3 Counters** |
| Data tables, receipts, distance sign (2-4, 2-7, 2-11, 2-12, 2-15) | **F4 Table** |
| Number-line points, hops, band pairs (2-8, 2-9, 2-13, fluency p. 99) | **F5 Number line** (extends `pv.numberLineHTML`) |
| Decomposition tree display (2-7) | **F6 Tree** |
| `stackHTML`, `vcalcHTML`, partial-sum stack display, misalign (2-6, 2-10, 2-14, 2-15) | **F7 Vertical stack** |
| `barDiagramHTML` (2-9, 2-12, 2-14 bar picture) | **F8 Bar diagram** |
| Picture choices A/B/C (decision 11; 2-8, 2-12) | **F9 Picture choices** |
| `cmpChartHTML` (2-13) | **F10 Compare chart** (2-1 chart styles) |
| `either` addends (2-6), equivalent equations (decision 15) | **A1 `anyOrder`** on `parts` |
| `symbol` comparison picker (2-13) | **A1 `symbol`** part kind |
| Long select-all lists (probe, 2-4, 2-8) | **A1 `compact`** choices |
| `eqmake` (2-5), `pstack` row mode (2-6), `dsub` (2-7), `adjust` (2-8), equation frame (2-9), adjust in 2-10/2-11 | **A2 `chain`** (one control, six presets) |
| `pstack` stacked mode (2-6), `vcalc` + carries + `blanks` (2-14, 2-15, Unit Review), column items in 2-10/2-11 | **A3 `vcalc`** (one control, two input modes) |
| Jump number line (fluency A), number-line hops (2-9) | **F5 `hops`** with `open: true` |
| `adjustHTML` (fluency B) | **F1** with `tags` |
| Inline "___ + ___ = ___" frame (fluency C, 2-9) | **A2 `chain`** preset `frame` |
| Unit Review bar picture, `barHTML` | **F8** `ppw` |
| `tableHTML` (Performance Task, 2-15) | **F4** |
| Slides with no check ("Remind Me"), results by lesson (`skillLinks`), two-line choices, shared task header | **§4.4 small engine additions** |

**One engine change everything depends on: a `figure` slot.** Today `q.display` is escaped text and `q.prompt` is escaped. Add `q.figure`: a spec object, or an array of them, `{ fig: 'arrows' | 'groupV' | 'counters' | 'table' | 'nline' | 'tree' | 'stack' | 'bar' | 'pics' | 'cmp', ...options }`. `Q.visuals()` renders it after `display` through one registry (`Mathbook.fig.render(spec)`). The spec stays JSON, so saved attempts and reviews re-render exactly. Learn slides call the same `Mathbook.fig.*` functions directly. Suggested home: a new `assets/js/figures.js` (no DOM state; loaded after `place-value.js`). Also in `display` and `prompt` text, render `___` as a blank box (`<span class="blank" aria-label="blank">`), except in `select` prompts, where `___` is already the drop-down.

Figure palette (existing tokens only):
- Given numbers: `--heading`, bold. The answer or result being taught: a `--star` pill with `#1a1446` text (as `.nline-label.is-answer`). Unknowns: "?" in `--muted` bold.
- Lines, arrows and V strokes: `--primary`, 3 px. Change tags (−1, +1): a `--primary` box with white bold text, as the book draws them on p. 64.
- Partial-sum rows and changed parts: `--primary` text, bold (the book uses blue).
- Focus digit or column: the `.rd-d.is-look` treatment (star fill plus `#e0a800` border).
- Place columns: header letters only in place colours (`--th/hu/te/on-ink`). Cells stay white.
- Right/wrong in review: `--ok` ✓ / `--no` ✗ glyph in a small badge at the top-right of the cell, plus a 2 px border in the same colour.

Every figure: root `<figure class="fig fig-KIND" role="img" aria-label="…full sentence…">` with children `aria-hidden`. The label reads the math as words, for example "576 minus 122. 576 rounds to 580, 122 rounds to 120. 580 minus 120 equals 460." Figures that contain inputs are not `role="img"` (see A2/A3).

---

## 3. Display figures

### F1 Arrow equation (estimate arrows and adjust arrows): `fig: 'arrows'`
Book pp. 44 and 64. `{ a, b, op: '+'|'−', to: [ra, rb], result?, tags?: ['−1', '+1'], reveal?: 'top'|'arrows'|'all', unknown?: true }`
- Row 1: `a op b = ?`. Under the *centre* of each number, a 3 px `--primary` down-arrow (28 px tall), with the optional tag box between the shaft and the head (book p. 64). Row 2: `ra op rb = result`, each new number centred under its original. The result is a star pill when shown and "?" otherwise.
- Built as a 5-column CSS grid (`num op num = res`) so the two rows align. `reveal` drives slide parts: `top` (row 1 only), `arrows` (+ arrows and row 2 numbers, result "?"), `all`.
- Phone: font 1.3 rem and the grid is about 260 px at 320 px for 3-digit numbers. No wrapping is needed for two operands with up to 4 digits. Desktop: 1.5 rem, left-aligned in the card.
- In questions (2-3 Your Turn) use `unknown: true`: row 2 shows "?" boxes (dashed, not inputs), and the actual inputs are ordinary `num` parts below, labelled "312 rounds to", "465 rounds to", "Estimate". Display only.

### F2 Grouping V: `fig: 'groupV'`
Book p. 48. `{ addends: [a, b, c], pair: [i, j], pairSum, total, reveal?: 'top'|'v'|'all' }`
- Row 1: the three addends with "+" between them (grid columns). An inline SVG overlay draws two `--primary` strokes from under addend i and addend j down to a point under their midpoint. When the pair is 1st and 3rd, the V passes under the middle addend, and the middle addend gets a light dashed underline so it reads as "left for later".
- Row 2 (at the V tip): `pairSum + remaining = total`. The pair sum is bold `--primary` and the total is a star pill. The ones digits that "make 10" may be highlighted with `.is-look` (2-4 step 3).
- The SVG uses `viewBox` and percentage positions, so it scales with the grid. Fits 320 px at 1.25 rem.
- aria: "34 plus 50 plus 66. Add 34 and 66 first: 100. 100 plus 50 equals 150."

### F3 Counters: `fig: 'counters'`
`{ groups: [{ n, kind: 'a'|'b', label }], pairs?: true, join?: true }`
- Round 28 px dots in rows (wrap). Kind **a** is a filled `--primary` circle and kind **b** is a `--star` square, so kinds differ by shape and colour. A text label sits under each group ("4 red" in the book becomes "4 purple circles"; use plain words that match the shapes).
- `pairs: true` (2-5) draws dots in columns of 2 with a thin `--line` box around each pair. A leftover dot gets a dashed `--no` outline and the word "left over". `join` shows two groups, then their two leftovers boxed together as a new pair.
- Max 20 dots. Display only.

### F4 Table: `fig: 'table'`
`{ title, head: [..], rows: [[..]], money?: true }`. A plain semantic `<table>` (not `role="img"`), `<caption>` = title. Header row `--primary-soft`, 2 px `--line` borders, numbers right-aligned and bold, cells ≥ 44 px tall. Two or three columns stay a table on phones. A wider table (4-day rows) switches to one row per day (transposed) at < 560 px rather than scrolling. Receipts (2-4) are the same table with a "Total" row left blank ("?").

### F5 Number line: extend `pv.numberLineHTML` (`fig: 'nline'`)
Keep today's look (96 px track, heading-colour bar, major/minor ticks, labels below). Add:
- `points: [{ v, text, cls }]`: several dots and labels. Dots are `--primary`. Lettered dots (A/B) show the letter only. Labels alternate above/below when two points are within 12% of each other. Content keeps points ≥ 6% apart.
- `hops: [{ from, to, text }]`: arcs above the line (SVG, arrowhead at `to`) with the jump label ("+50") centred above the arc in a white pill. Jumps to the right are `--primary`, solid. Jumps to the left are `--no`, dashed, and their label always carries "−", so direction is never colour-only. Arc height grows with jump length (min 24 px), and labels of short neighbouring arcs are nudged up so they never overlap. Used for count-up (2-9), adjust (2-8) and fluency.
- `open: true` (open number line, fluency/2-9/2-11): no scale ticks. Only the `marks: [37, 40, 85]` get a tick and a label below, positioned proportionally, with a minimum gap of 12% between marks (stretch short gaps; the line is a sketch, as in the book). aria: "Number line: from 37 jump +3 to 40, then +45 to 85."
- `bands: [{ from, to, text }]`: several of today's `band`, with the label centred under the band ("255 apart").
- Pairs (2-8 "same difference"): two lines in one `.slide-pair`, always stacked vertically (not side by side), so equal band lengths can be compared, with the same min/max on both.
- 4-digit labels at 320 px: label only major ticks, and use at most 6 labels per line.

### F6 Tree: `fig: 'tree'`
Book p. 60. `{ n, parts: [..] }`. Top box (n) centred. 2–4 part boxes in a row beneath, each joined by a 3 px `--primary` arrow from the top box. Boxes are 3.4 rem min-width, 48 px tall, `--primary` fill, white bold text (book teal → our purple). A second tree in the same slide uses `--star` fill with dark text (the book's second colour). Under the tree, a check line in muted text: "100 + 70 + 5 = 175". Fits 4 parts at 320 px (4 × 3.4 rem + gaps ≈ 270 px). Display only. The input version is in A2.

### F7 Vertical stack: `fig: 'stack'`
Book pp. 56, 88, 92. One renderer for column addition/subtraction, partial-sum stacks, the algorithm, missing digits and misalignment.
`{ rows: [top, bottom, (third)], op, places?: auto, partials?: [{ v, note }], total?, result?: 'none'|'all'|k, carries?: {T:1, H:1}, focus?: 'T', blanks?: {...}, misalign?: 'left', reveal?: k }`
- Grid of digit columns, right-aligned by place (ones at far right). The column count is the longest row's digits, + 1 for addition. Optional place header row (TTh Th H T O) in place colours, small (0.8 rem). Column width 2.2 rem, digits 1.4 rem bold.
- Commas are a thin non-column separator (6 px with a comma glyph) between Th and H. 4-digit numbers show commas, as the book does.
- The operator sits in the leftmost column of the bottom addend row. Missing high places are blank, never 0. 3 px `--heading` rule under the addends.
- `partials`: each partial is a row under the rule in `--primary`, right-aligned in the same columns. The optional left note ("300 + 100") goes in a separate left column (muted, 1 rem). A "+" goes before the last partial, then a second rule and the total, as on p. 56. On phones the note column stacks *above* the row only when the card is < 300 px wide. Otherwise it stays left.
- `carries`: small (0.85 rem) `--primary` digits above the top row in the column they go to. `focus`: that whole column gets the `.is-look` tint. `result: k` shows only the k rightmost answer digits (slide build-up).
- `blanks`: listed cells render as dashed empty boxes (display) or inputs (A3).
- `misalign: 'left'`: the bottom row is shifted left with a 3 px `--no` outline and the caption "✗ The places don't line up." A correct twin may sit beside it with "✓".
- aria: "2,322 plus 1,569 in columns. Partial sums 3,000, 800, 80, 11. Total 3,891."

### F8 Bar diagram: `fig: 'bar'`
Book pp. 68, 80, 81. Adopt the 2-12 §13 spec (`kind: 'ppw' | 'cmp'`, `parts`/`sizes`/`whole`/`bracket`, `long`/`short`/`gap`/`order`, `caption`, `small`), drawn in HTML/CSS with these specifics:
- Bars are 48 px tall (36 px when `small`), fill `--primary-soft`, 2 px `--primary` border, 8 px radius. Labels are centred, bold 1.1 rem. Segment boundaries are 2 px `--primary` lines. Widths are proportional with a minimum of 18%.
- Brackets (the whole in `ppw`, the gap in `cmp`) are dashed 2 px `--muted` lines with end ticks. The label sits in a white pill centred on the dash ("?" or a number or letter), as on p. 68, where the gap is level with the short bar.
- Label types: number (commas), letter (italic serif-free bold, e.g. *a*), "?" (muted), slot `{ slot: 'A' }` = an empty white dashed box (3 rem × 36 px) with a small `--primary` tag "A" at its top-left. Slots are filled through `num` parts labelled "Box A (the whole):". The diagram never shows the child's typed value. In review, the parts list shows it with ✓/✗.
- Max width 560 px. Full card width on phones. Labels never shrink below 1 rem: a segment narrower than its label puts the label in a callout below it with a thin leader line.
- aria-label in words: "Bar diagram. Whole: 563. Part: 248. The other part is unknown."

### F9 Picture choices: `fig: 'pics'`
Decision 11. `{ items: [{ label: 'A', fig: {...} }, ...] }`. Each item is a white bordered tile headed by a bold pill "Diagram A" / "Number line A". The grid is 1 column < 700 px and 2–3 columns above. It is followed by a `choice` part with choices "A", "B", "C" rendered `compact` (A1). The tile is *not* clickable (the choice buttons are the only controls), which avoids two ways to answer.

### F10 Compare chart: `fig: 'cmp'`
2-13. Reuse 2-1's place-value chart styles: two rows (the two numbers) under Th | H | T | O headers in place colours. 3-digit numbers show a faint grey 0 in Th. The focus column has the `.is-look` tint, and columns left of it carry a small "same" tag under the column. Display only.

---

## 4. Answer controls

### 4.0 Modes (all new controls follow these)
| Mode | Where | Behaviour |
|---|---|---|
| **guided** | Learn Your Turn, Practice Together | Editable. The helper line is on (A2 running total, adjust tags). On **Check Answer**: if right, every input gets ✓. If wrong, only the wrong inputs get ✗ (glyph badge + red border), plus one message naming the *first* problem in words (never the answer), then the usual Try Again / second-miss reveal. Try Again keeps the entries and clears the marks. |
| **test** | Take a Test, On My Own (before Check my work) | Editable, no marks, no messages. **Helper lines are hidden** (no running total, no live tags; see §7 Q2). Echo cells (the child's own earlier entries copied forward) stay, because they are the child's work, not help. |
| **review** | My Results, On My Own after checking | Read-only render of the child's own entries with ✓/✗ per cell. Below it, the existing "Correct answer:" line (`correctText`), then the explanation. The correct worked model is never drawn inside the child's boxes. |

All new types implement the existing contract: `emptyResponse, render(mode), read, bind, isAnswered, grade, correctResponse, describe, correctText`. `describe` is one plain line, for example "Parts 100, 70, 5 · 362 − 100 = 262 · 262 − 70 = 192 · 192 − 5 = 187 · Answer 187". `isAnswered` = every required input is non-blank. Inputs: `type="text" inputmode="numeric" autocomplete="off" spellcheck="false"`. Commas are optional when typing (`parseWholeNumber`).

### 4.1 `parts` additions (A1, small)
1. **`anyOrder: 'g'`** on two or more `num` parts: those parts are graded as a set (the multiset of typed values = the multiset of answers). Marks are per set. Covers 2-6 reverse items, 2-9/2-12 equivalent equations (decision 15: `? + part = whole` and `part + ? = whole` become `anyOrder` parts "First addend" / "Second addend"), and chain operands (A2 `commute`).
2. **`compact: true`** on `choice`/`multi`: short choices (≤ 14 characters: numbers, "A", "Add") become a chip grid (2 columns at < 560 px, 4 columns above; 3 in one row for A/B/C). Each chip is still a native checkbox or radio label, 52 px tall, with the box or circle visible. Checked = `--primary` border + `--primary-soft` fill + visible checkmark. The "Choose every one that is correct." help line stays for `multi`.
3. **`kind: 'symbol'`** (2-13): renders "4,127 ◯ 3,986" in 1.5 rem with an empty 3 rem circle. Below it, a row of **native radio buttons styled as big buttons** (`compact` chips, min 64 × 52 px) showing `<` `>` `=` (or `=` `≠`), each with a visually hidden name ("less than", etc.) after the glyph. Arrow keys move between them (native radiogroup). The circle shows the chosen glyph (`aria-hidden`; the radios carry the state). Review: "4,127 > 3,986 (greater than) ✓".

### 4.2 `chain`: equation-chain control (A2)
**One control for every "fill in a few equations" task**: partial sums in a row (2-6), decomposition steps with a tree (2-7), adjusting (2-8, 2-10, 2-11), a child-written equation (2-5), and an equation frame (2-9). Rows of cells laid out on a shared grid so the `=` signs line up, as in the book.

Data:
```
{ type: 'chain', preset, prompt, figure?, skill, explanation, hint,
  rows: [ { cells: [Cell, '+', Cell, '=', Cell], true?: bool, commute?: bool } ],
  final?: { label: 'So 362 − 175 =', answer },
  tree?: { of, min: 2, max: 4, start: 3, given?: [..] },   // preset 'steps' / 'trees'
  keep?: 'sum' | 'diff', orig?: { a, b, op } }             // preset 'adjust'
Cell = number (printed) | { in: 'id', answer?: n, digits?: 3, parity?: 'even'|'odd' }
     | { echo: 'id' }  (the child's entry of input id, read-only; "…" while blank)
```
Grading primitives (shared): exact `answer`; `digits`/`parity` constraints; row `true` = the row must be a true equation using the typed values; `commute` = the two operands may be swapped; `keep` = the new pair keeps the original sum/difference and at least one number changed; `final` exact. A miss returns the first failed rule as a message (wording from the lesson specs: "Your parts add to 110, not 101", "Check 262 − 70", "215 is odd, but the sentence needs two even numbers", "You changed them opposite ways. In subtracting, change both the same way.").

Presets (the builder implements one renderer and grader; presets only generate `rows`):

| Preset | Used by | Layout | Graded |
|---|---|---|---|
| `free` | 2-5 eqmake | One row `[ ] + [ ] = [ ]` | constraints on the two addends; row `true` (sum may be 4 digits, decision 8) |
| `rows` | 2-6 row mode; 2-9 equation frame | `[300] + [100] = [400]` ×3 (place lines), then `[echo H] + [echo T] + [echo O] = [S]` | each place value exact (300, not 3), each partial exact, S exact. Inputs or given per `given` |
| `steps` | 2-7 dsub (and 2-10/2-11 decompose items) | **Tree input** (below), then one row per tree part: `[echo prev] − [echo part] = [ ]` (the first row starts with a printed `a`), then the `final` line | parts valid (2–4 whole numbers ≥ 1 that add to b); each row `true` against the child's *own* previous result (decision 9); final = a − b exactly |
| `trees` | 2-7 "break apart 2 ways" | Two tree inputs side by side (stacked < 560 px), no rows | each tree valid; the two multisets differ |
| `frame` | 2-9 related equation, fluency "___ + ___ = ___", 2-12 letter equations | One row mixing printed numbers, "?" and inputs, e.g. `[ ] + ? = [ ]` | exact values; `commute` where decision 15 allows either order |
| `adjust` | 2-8; 2-10 T5, 2-11 T2 | Row 1 printed `a op b = ?`; arrows; row 2 `[new a] op [new b] = [answer]` | `keep`; answer = original result. A "not friendlier" adjustment gets the gentle tip only (decision 10) |

**Tree input** (inside `steps`/`trees`): the top box shows n (printed, F6 style). Below it, `start` (3) part inputs in a row joined by arrows. Under the boxes, two small ghost buttons, "+ Add a part" and "− Remove a part" (min 2, max 4; disabled at the limit; focus goes to the new box or to the last box). If `given` is set, the parts are printed, not inputs. Helper line (guided only): "Your parts add to 175" (muted, `aria-live="polite"`, no colour judgement). Adding or removing a part adds or removes the matching step row; typed results in surviving rows are kept.

**Adjust arrows (input version):** the F1 layout with row 2 as inputs. Between the rows, each arrow carries a live tag box computed from the child's entry ("+3", "−2", blank while empty), in guided mode only. In test mode the arrows show no tags. The tag box is `aria-hidden`. The input's accessible description includes "changed by +3" in guided mode only.

Layout and keyboard:
- Grid columns: `[operand][op][operand]([op][operand])[=][result]`, so `=` aligns down the chain. Operators and `=` are 1.4 rem text with a 0.4 rem gap. Printed numbers are bold 1.3 rem. Echo cells look printed but in muted ink with a dotted underline ("your number"). Input cells are 4.6 rem wide × 48 px, bold 1.2 rem, centred (the `.part-input` style).
- Tab order: left to right, then down rows (natural DOM order). Enter does not submit. No auto-advance (multi-digit cells).
- Each input has an `aria-label` built from the row, for example "Row 2: 262 minus 70 equals, answer" or "Hundreds, first addend". Each row is a `role="group"` with a label "Step 2 of 3".
- 320 px: inputs shrink to 3.6 rem (≈ 65 px; 4 digits with a comma still fit at 1.1 rem). A row with 4+ operands (three-addend partial sums, `H + T + O = S`) wraps before `=`: "= [S]" moves to its own line, right-aligned under the row. No horizontal scroll.

Review: the same grid read-only, the child's values with ✓/✗ badges, and the tree with the child's parts. A blank shows "—".

### 4.3 `vcalc`: vertical-stack answer control (A3)
One control on top of F7 with two input modes.

**`input: 'rows'`** (2-6 stacked partial sums): F7 with `partials` where each partial row is a whole-number input right-aligned across its columns (one box, not digits), plus a total input under the second rule. The left notes are printed (or are `in` cells when the item asks the child to write them). Graded like `rows` in A2: each partial exact, total exact. 3 addends: three addend rows, same partial rows.

**`input: 'digits'`** (2-14 algorithm, 2-15 subtraction and missing digits, optional 2-10/2-11 column items):
- The answer row has one box per column (digits of the longer number, + 1 for addition). Boxes are 52 px tall, monospace bold 1.5 rem, `maxlength=1`, numeric keypad.
- Typing a digit moves focus **left** (algorithm order: start at the ones). **Backspace** on an empty box clears the box to the right and moves right. ←/→ move freely. Tab follows DOM order (left to right) so screen-reader reading order is natural. Focus starts at the ones box when the question opens (guided and test), without scrolling the page.
- Optional regroup boxes (addition: `carries: true`): a row of small boxes (36 × 36 px, 1 rem) above the top row for every column except the ones. They are **never graded**, are saved with the response, and are shown in review exactly as typed. Each has the aria-label "regroup mark over the tens, optional". In test mode they stay available (it's the child's paper work).
- `blanks` (2-15 missing digits): the listed cells in the top, bottom or result rows become single-digit inputs inside the printed rows. All other digits are printed. Graded all-or-nothing, with per-cell marks in review.
- Grading reads the answer row as a number (leading empty boxes = nothing; a leading 0 counts as empty). Guided feedback names the first wrong column from the right ("Look again at the tens."), never the digit.
- Accessibility: the grid is a `role="group"` with the label "2,457 plus 1,368 written in columns. Type the answer one digit at a time, starting with the ones." Each box is labelled "ones digit of the answer", "tens digit…". Place headers are on by default for 4–5-digit items.
- Review shows the child's digits (and their regroup marks) with a ✓/✗ badge per answer box. The correct digits appear only in the "Correct answer:" line under it, with the column-by-column explanation.

Width: columns are `min(3rem, (card width − 1rem) / columns)`. At 320 px with 6 columns (5-digit + carry column), columns are ≈ 42 px. Boxes stay 52 px tall (see §7 Q3). Commas are 6 px separators, not columns.

### 4.4 Small engine additions (Unit Review, Performance Task, Fluency)
1. **Learn step without a check** (Unit Review "Remind Me"): a `slides` step with no `check` shows only the Example phase. The yellow button reads **Next Step →** (or **Finish →** on the last step) instead of Now I'll Try, and is enabled once the child reaches the last part (the step is then marked done). There is no "I remember" button.
2. **Results by lesson** (`skillLinks: { '2-7': '../lesson-2-7/#menu' }`): in Skills to review, a linked skill's button reads **Review this lesson (2-7)** and opens that lesson's menu in the same tab. Skills for lessons that don't exist yet show no button.
3. **Two-line choices** (Unit Review R19/T19): a `\n` in `mc`/`choice` text renders as a line break (`white-space: pre-line` on the choice label). It stays plain text, with no HTML in choices.
4. **Shared task header** (Performance Task): a guided set may carry `context: { title, text, figure }`. It is drawn once at the top of every question card as a lavender "The story" box (text plus F4 table), above "Question X of N". On phones, from the second question on, it is a `<details>` open by default whose summary is "The story and table". Answers never move above it.
5. **Fluency**: no timers, countdowns or speed scores anywhere (decision 21). Ordinary sets and a test.

---

## 5. Batch A screens

### 5.1 Lesson 2-2 additions: Rounding Check-Up (spec `2-2-probe.md`)
- **On My Own** shows two set cards: "Set 1 · Rounding Practice" (unchanged) and "Set 2 · Rounding Check-Up", blurb "Choose every number that rounds to a target, then tell how you decided." It has 4 questions, with the usual statuses, Check my work and Practice My Misses.
- **Each Check-Up question (PR1–PR4, TR1–TR4)** is one screen. Prompt: "You round to the nearest ten. Which numbers round to 480? Choose all." No figure (the probe checks the child without a number line). Part 1 is a `multi` with **`compact`** chips (8 numbers: 2 columns × 4 on phones, 4 × 2 on desktop; PR3's "86 stickers" chips fit at 2 columns). Part 2 is a full-width `choice`, "How can you tell which numbers round to 480?", with the 3–4 sentence options as today's radio cards. Practice Together, if the builder adds the items, uses the same layout with hints.
- **Take a Test** shows two cards: "Rounding Test" (12) and "Rounding Check-Up" (4 questions, "Choosing every number that rounds to a target"). Banner: "Rounding Check-Up · a of 4 answered". My Results gets the test picker. Skill "Deciding which numbers round to an amount" appears under Skills to review with **Practice this skill (Set 2)**.
- **Review / explanation**: one line per choice in the explanation ("483 → 480 ✓ · 487 → 490 · 475 → 480 ✓ (halfway rounds up) …"), as `selectQ` does today.
- **Parent Guide**: add the probe goal, demonstrate and ask lines to the existing sections. The self-rating ("confused / still learning / I understand / I can teach someone") is an *Ask* line only. No widget.
- Home **Continue** counts `s2` and `checkup`.

### 5.2 Lesson 2-3 Estimate Sums and Differences (6 steps)
Every Example uses **F1** with `reveal` stepping through parts. Every Your Turn: prompt, then F1 with `unknown: true` (the child sees the structure), then the parts.

| Step | Example parts (one idea each) | Your Turn layout |
|---|---|---|
| 1 Round to the nearest hundred | (1) Story card: two numbers in bold, "about" in bold. (2) F1 `arrows`: 312 → 300, 465 → 500, result "?", with the reason sentence under it. (3) F1 `all`: = 800 (star pill), then "Exact: 777. 800 is close." | Prompt "Estimate 437 + 251. Round each number to the nearest hundred." F1 unknown. Parts (2 columns ≥ 900 px, else stacked): "437 rounds to", "251 rounds to", "Estimate". |
| 2 Nearest ten is closer | (1) F1 312 → 310, 465 → 470. (2) F1 all = 780, then a 3-column **F4 table** "Nearest hundred 800 · Nearest ten 780 · Exact 777", optionally plus an **F5** line 750–820 with three labelled points. (3) the "faster vs. closer" sentence | Same as step 1 with tens |
| 3 Estimate a difference | (1) story ("how much taller" = subtract, in bold). (2) F1 tens 670 − 230 = 440. (3) F1 hundreds 700 − 200 = 500. (4) F4 compare row with exact 443 | Same 3 parts. When the "? = a − b" form is used, `display` shows "? = 674 − 231" so the unknown is on the left |
| 4 Compatible numbers | (1) F1 526 → 525, 274 → 275, plus a line of quarter chips "25 · 50 · 75 · 100". (2) = 250, exact 252. (3) F1 247 + 352 → 250 + 350 = 600. (4) two small F1s in `.slide-pair`: "Rounding: 200" vs "Compatible: 250" | `choice` "Which compatible numbers are closest?" (4 options, written as "525 − 275", `compact` 2×2), then `num` "Estimate" |
| 5 Word problems | (1) story → "in the two weeks" highlighted with `.is-look` → Add → F1. (2) "needs … more" story → Subtract → F1 tens | Story prompt. `choice` "Add or subtract?" as two `compact` chips, then `num` "Estimate (nearest ten)" |
| 6 Check with an estimate | (1) "Leo says 389 + 205 = 794." F1 → 600. A ✗ badge: "794 is far from 600." (2) Ivy 594 ✓ "close to 600", plus the "estimates can't prove exact" sentence | `num` "Estimate (nearest hundred)", then `choice` "Is Kim's answer reasonable?" (2 full-width options) |

Finish screen reflection: "When might you estimate a sum or difference in your life?" Practice and test items reuse these exact layouts (P/T rows map to steps by skill). P14/T14 "two ways" = two `num` parts + a 2-chip `choice`. Explanations use text arrows ("437 → 400 (tens digit 3)").

### 5.3 Lesson 2-4 Use Addition Properties to Add (5 steps)
| Step | Example parts | Your Turn layout |
|---|---|---|
| 1 Switch the order | (1) **F3** two rows: 4 circles + 3 squares, then 3 squares + 4 circles, each row with its sentence "4 + 3 = 7". (2) "36 + 18 = 54 and 18 + 36 = 54" as two lines in `display` style. (3) "245 + 132 = 132 + ___" with the blank box, and the arrow sentence "the blank is 245" | `number`. `display` shows the equation with a blank box, for example "436 + 217 = 217 + ___". Input below, labelled by the prompt "What number makes the equation true?" |
| 2 Group the addends | (1) story + "34 + 50 + 66". (2) **F2** pair [0,1]: 84 + 66 = 150. (3) **F2** pair [0,2]: 100 + 50 = 150, with 4 and 6 highlighted. (4) both F2s in `.slide-pair` "Which was easier?" | `display` "34 + 50 + 66" (new numbers), then 2 `num` parts: "34 + 66 =", "Total:" |
| 3 Find a friendly pair | (1) "146 + 289 + 54" with the ones digits 6 and 4 highlighted (`.is-look`). (2) F2 pair [0,2] = 200 (carry sentence under it). (3) 200 + 289 = 489 star pill | `display` the three addends. `choice` "Which two addends make a number ending in 00?" (3 pairs, `compact`), `num` "Their sum:", `num` "Total:" |
| 4 Same addends, same total | (1) **F4** "Seeds Planted" (Mon 29, Tue 45, Wed 71). (2) three expressions, each with a ✓ badge + "same addends". (3) two expressions with ✗ + reason ("subtracts", "54 is not 45"). (4) F2 29 + 71 = 100 → 145 | F4 table figure. `multi` "Which show the total? Choose all." (6 expressions, `compact` 2 columns), `num` "Total:" |
| 5 Add more efficiently | (1) "643 + 258 = ___ + 643" with "slow way" steps in muted text. (2) the fast way, with the blank filled by a star pill. (3) **F4** receipt ($215, $340, $185, Total ?) then F2 on $215 + $185 | Variant a: `display` equation with blank. `choice` (4 full-width strategy sentences), `num` "The blank:". Variant b: F4 receipt, `choice` "Which prices should you add first?" (`compact`), `num` "Total:" |

Finish screen reflection per spec. P5/T5 and P11/P12 use the F4 table. P14/T14 (true equations) = `multi` with full-width choices (equations are too long for chips on phones). The child sees "order" and "grouping" only (decision 4).

---

## 6. Phone, tablet and desktop rules for new models
1. **Minimum 320 px, never horizontal page scroll.** Test every new figure and control at 320, 390, 768 and 1280 px with 200% text zoom. A figure that cannot fit must reflow by the rule in its own section, never by scrolling. The one exception is an F4 table with more than 4 columns: it transposes below 560 px, and only if it still can't fit, it scrolls inside its own container with a visible "scroll →" hint.
2. Card inner width at 320 px is about 260 px. Every figure is designed to that: 3-digit two-operand equations at 1.3 rem, 4-part trees, 6-column stacks, bars with an 18% minimum segment.
3. **When to stack:** two figures side by side (`.slide-pair`, tree pairs, F9 tiles) only at ≥ 900 px (F9 ≥ 700 px). Chain rows wrap before `=` when they have more than three operands at < 400 px. `parts` use 2 columns only at ≥ 900 px (existing). Choice and multi parts are always full width. Number-line pairs are always stacked.
4. Sizes: digits and numbers in figures 1.3–1.5 rem (phones may drop 0.1–0.2 rem). Inputs 48 px tall (digit boxes 52 px). Buttons and chips 52 px. Helper text 1 rem muted.
5. Figures scale with `rem` and percentages (SVG `viewBox`), so 200% zoom enlarges them. They never use fixed pixel widths except the minimums above.
6. Learn stays compact (≈ 1,100 px max width, card padding 1.25 rem desktop / 0.9 rem phone). A slide with a figure should fit a 390 × 844 phone screen together with the slide controls. If not, split it into two parts.
7. Focus is visible on every input and chip (existing star outline). After Check Answer, focus moves to the feedback for a miss (existing), and after Add/Remove a part, to the affected box.
8. Print styles are unchanged. Figures print in black on white.

---

## 7. Decisions for the coordinator
1. **Engine changes before Batch A builders:** (a) add `q.figure` plus `Mathbook.fig` registry (new `assets/js/figures.js`), which is required because `display` and prompts are escaped text; (b) `___` renders as a blank box in `display`; (c) `parts` `compact` and `anyOrder`. Batch A needs F1, F2, F3, F4 only. `chain`, `vcalc`, F5–F10 and `symbol` can land before Batch B, C and D.
2. **Helpers in tests:** I specified that the tree's "Your parts add to …" line and the live adjust tags are **hidden in Test mode** (they are support, and Test has "no hints"). Echoed entries stay. Confirm.
3. **Digit box width:** with 5-digit addition (6 columns) at 320 px, boxes are ≈ 42 px wide × 52 px tall, just under the 48 px rule in one dimension. Accept, or limit 5-digit items to wider screens (not recommended).
4. **Consolidation:** the lesson specs' `eqmake`, `pstack` (row), `dsub` and `adjust` become presets of **one** `chain` type. `pstack` (stacked mode) and the 2-14 `vcalc` (with `blanks`) become **one** `vcalc` type with two input modes, which also covers column items in 2-10, 2-11 and the Unit Review (2-15 has no regrouping per decision 18, so it simply leaves regroup boxes off). The builders' specs should be read through §2. The grading rules in those specs are kept unchanged.
5. **Guided marks:** new controls mark individual wrong cells (✗) after a miss in Learn and Practice Together. Today's `parts` only lists the labels to look at. Should `parts` adopt per-field ✗ marks too, for consistency (small change), or stay as is?
6. **2-3 Your Turn figure:** I show the F1 layout with "?" boxes above the three typed parts (structure is visible, no answers). Alternative: no figure in Your Turn. Recommend keeping it for Learn and Practice Together, and dropping it in On My Own and the Test, so the test shows only the numbers.
