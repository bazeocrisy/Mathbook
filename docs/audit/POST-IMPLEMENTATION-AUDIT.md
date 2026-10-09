# Mathbook Build 2.1 — Post-Implementation Forensic Audit

**Branch:** `claude/build-2.1-galaxy-number-words` · **Compared against:** baseline `main` @ `2418d34` ([BASELINE-AUDIT.md](BASELINE-AUDIT.md))
**Scope delivered:** galaxy landing page · Lesson 2-1 visual refinement and audit fixes · Number Words Phase 1 (0–10) with Phases 2–4 as outlines · shared app shell. Lesson 2-2 not started.

## Method and limits (read first)

| Kind of evidence | What it covers |
|---|---|
| **Measured** — `npm run audit` (`tests/audit.mjs`) | 16 screen-states × 9 viewports = **144 screen-states** (the 8 required sizes + 640×360 = 200% page zoom); keyboard focus on 7 screens; root text doubled on 16 states; reduced motion; 18 state-transition / leakage checks |
| **Automated tests** | 24 unit tests, 83 + 64 browser checks (headless Chrome, site served under `/Mathbook/`) |
| **Visually inspected** | Screenshots in `docs/audit/after/` — judgments are labeled as visual |
| **NOT verified** | Real phones/tablets (all device results are **emulated** in desktop Chrome); Safari and Firefox; a real screen reader (NVDA/VoiceOver); classroom-distance reading on a physical display |

One audit measure was refined after the baseline: a checkbox inside a ≥44px clickable label is now measured by its label (the actual touch target). This affects only the new Say-step checkboxes; baseline numbers are unchanged by it.

## Results summary (baseline → after)

| Measure | Baseline | After |
|---|---|---|
| Screen-states measured | 99 | 144 |
| Horizontal overflow (states) | 3 | **0** |
| Text spilling out of its box | 23 | **0** |
| Touch targets < 44px | 185 | **0** |
| Touch targets < 24px | 0 | 0 |
| Text contrast failures (WCAG AA) | 225 | **0** |
| Smallest font | 11.5px | 12.2px |
| Max viewport covered by sticky bars | 23% | 16% |
| Focus stops without a visible ring | 0 | 0 |
| Root text 200%: states with overflow | 6 of 12 | 1 of 16 (A-04) |
| Running animations (either motion setting) | 0 | 0 |
| State-transition checks failing | T06 | **none** (18 checks) |
| JavaScript errors / missing files | 0 / 0 | 0 / 0 |

Full tables: [`after/measurements.md`](after/measurements.md), comparison: [`after/comparison.md`](after/comparison.md).

## Automated test results (exact)

| Suite | Command | Result |
|---|---|---|
| Unit — Lesson 2-1 math, grading, content (`tests/math.test.js`) | `npm test` | **14 / 14 pass** |
| Unit — Number Words (`tests/number-words.test.js`) | `npm test` | **10 / 10 pass** |
| Browser — home + Lesson 2-1 | `npm run test:browser` | **83 / 83 pass** |
| Browser — Number Words | `npm run test:browser` | **64 / 64 pass** |
| **Total** | | **171 / 171 pass, 0 fail** |

(Added after the owner's feature review: practice-bank refresh persistence before/after checking, navigation, "new set" freshness; Number Words write-from-memory persistence and wrong-then-right retry.)

## Owner feature review: confirmed findings (not defects in the assigned scope)

| ID | Finding | Evidence | Severity / status |
|---|---|---|---|
| F-01 | The 50-question bank is **not** organized as five fixed sets of 10. Each set is 10 questions drawn at random from all 50 (or from one skill via the Skill filter), avoiding the previous set's questions. | Code (`makeSet`), browser check "Start a new set gives 10 new questions" | Medium — design choice from Build 1; change only if requested |
| F-02 | There is **no "retry missed questions"** button for the practice bank. A checked set shows each mistake with the correct answer and explanation; to practice again, the student starts a new set (optionally filtered to the skill). Missed *test* questions do link to "Practice this skill". | Browser finding: no retry control present | Medium — feature gap; not built in this build (scope) |
| F-03 | A Number Words **practice round** in progress is not saved across a refresh (a new round starts). Say ticks, write-from-memory progress, test drafts, and results are saved. | Code (`S.practice` is in memory); persistence checks for the others | Low |

Test expectations changed only where the content changed on purpose, each with a comment in the test: guided practice 5 → 7 problems; the expanded-form guided item moved from position 2 to 3; teaching script 5 → 6 steps.

## Mathematics verification

All verified by automated tests (not by inspection):

- 2,137 = 2,000 + 100 + 30 + 7 · 5,072 = 5,000 + 70 + 2 · the 8 in 8,341 = 8,000 · 100 more than 2,349 = 2,449 (`practice bank answers spot-check`).
- Word form for **every** number 0–9,999 cross-checked against an independent parser; expanded form and digits for every number.
- Base-ten pictures draw exactly the right number of each block for **every** number 0–9,999; ten-frames draw exactly 0–10 dots.
- All 50 bank questions, 7 guided problems, 300 vocabulary-practice rounds, and 2,000 generated versions of each test: the correct answer (and alternate correct formats) always grades correct; blanks and wrong choices always grade wrong.
- **Repeated digits:** "value of the d in N" and "which place is the d in" never use a number where d repeats. **Zero placeholders:** generated tests include zeros; explanations name the empty place.
- New teaching examples checked: 4,125 + 100 = 4,225; 4,125 − 10 = 4,115; 7,284 − 10 = 7,274; greatest/smallest from 4, 1, 8, 6 = 8,641 / 1,468. The "Change one place" demo disables any ±10/100/1,000 that would need regrouping.
- Mastery: 10, 9, 8, 7, 6, and 0 correct land in the correct band (browser test thresholds); Number Words 9/10 = Mastered, 8/10 = Keep practicing.
- All 11 Phase 1 words equal the lesson's own word form for 0–10; every misspelling distractor is wrong; every tip that spells a word letter-by-letter spells it correctly.

## Instructional-objective matrix (after)

| # | Objective | Taught | Shown | Guided | Practiced | Assessed | Feedback | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Name the place of each digit | Big idea 1, place cards, script 2 | Step-through highlights | g1 chart | 12 bank | Math, Vocab | ✔ | ✔ |
| O2 | Value of a digit | Big idea 1, script 3 | Captions | g6 explain | 7 | Math | ✔ | ✔ |
| O3 | Model with base-ten blocks | Place/block cards | Step-through, builder | **g2 build 3,052 (new)** | 6 | Math | ✔ | ✔ (was partial) |
| O4 | Standard form | Vocabulary | Forms panel | g4 | 5 | Math | ✔ | ✔ |
| O5 | Expanded form | Vocabulary, script 4 | Term by term | g3 | 5 | Math | ✔ + tips | ✔ |
| O6 | Word form | Vocabulary, script 1 | Last step | g5 | 9 | Math ×2 | ✔ | ✔ |
| O7 | Zero as placeholder | Guide, script 5, mistakes | 5,072 example | g1–g3 | zeros in items | generated zeros | zero notes | ✔ |
| O8 | 10/100/1,000 more or less | **Big idea 2, guide, script 6 (new)** | **Change one place (new)** | **g7 (new)** | 4 | Math | ✔ | ✔ (was ❌) |
| O9 | Lesson vocabulary | Definitions + examples | Charts/blocks in cards | **Vocabulary practice with hints (new)** | **10 per round, new numbers** | Vocabulary Test | ✔ | ✔ (was ❌) |
| O10 | Greatest/smallest from digits | — | **Challenge worked example (new)** | — | 2 | not assessed | ✔ | ✔ for a practice-only skill |
| N1 | Read number words 0–10 | Learn (numeral, ten-frame, tiles, tip) | Learn | — | — | — | — | ✔ |
| N2 | Say and spell aloud | Say (parent ticks) | — | parent-led | — | — | — | ✔ (no microphone, by design) |
| N3 | Spell from memory | Look-Cover-Write-Check | letter comparison | retry | 4 activity types | 10 typed words | missed words + tips | ✔ |
| N4 | Spell every Phase 1 word | — | — | — | focus on missed words | rotation: all 11 within 2 attempts | words tested / left out shown | ✔ |

## State transitions and leakage (after)

All pass: T01–T12, L01–L02, N01 (covered word removed from the page), N02 (spelling test shows no hints and none of the tested words), X01 (unfinished Lesson 2-1 and Number Words tests coexist). L03 remains an observation (A-06).
Focus mode: while any test runs, the stage tabs are hidden; the only exits are Submit and "Save and finish later". Pauses are counted on the attempt. Browser Back or the Home link still leave the page (the draft is kept) — a parent-led tool cannot fully lock a browser.

## Regression map

| Shared change | Functions at risk | Retested by |
|---|---|---|
| `mathbook.css` rewrite (theme, spacing, place labels) | Every screen, every viewport | 144-state audit matrix; screenshots |
| `questions.js` (place labels, `spell`/`letter` types, visuals) | All 7 existing question types, bank, both tests, results display | Unit grading over bank + 4,000 generated tests; 40 all-correct UI attempts; independent set |
| `app-shell.js` (navigation, guided runner, test runner) | Stage routing, Back button, guided check/hint/retry, test submit/required/resume | T01–T12; guided + vocabulary practice; resume after refresh; Save and finish later |
| `lesson-app.js` rebuilt on the shell | Teach/See/Practice/Test/Results | All 80 lesson browser checks |
| `localStorage` | Saved Lesson 2-1 attempts, practice, drafts | Lesson key **unchanged** (`mathbook:v2:lesson-2-1`); attempt format unchanged (new optional `pauses`); bank ids b01–b50 unchanged; Number Words uses its own prefix; Clear removes only its own program; legacy v1 key never touched |

## Defect register — resolution

| ID | Sev. | Defect | Status | Evidence |
|---|---|---|---|---|
| B-01 | High | Results overflow on phones | **Fixed** (`.table-wrap` positioned; `body` overflow mask removed) | overflow 0 at 320/375/390; browser test |
| B-02 | High | More/less assessed but not taught | **Fixed** — taught, shown, guided | Objective matrix O8; browser tests "Teach It … taught", "Change one place" |
| B-03 | High | Vocabulary not practiced before test | **Fixed** — vocabulary practice with hints | O9; unit test "Vocabulary practice has hints" |
| B-04 | High | Test switching trap; tabs open mid-test | **Fixed** — focus mode; chooser on return | T05, T06 pass |
| B-05 | Med | Teach It runs together | **Fixed** — parts A–D with audience labels, jump links, larger gaps, dark ground between cards | `after/teach__*.png` vs `baseline/teach__*.png` (visual) |
| B-06 | Med | Parent-orange contrast 3.96–4.26 | **Fixed** (parent color darkened) | contrast 0 |
| B-07 | Med | Chart headers spill | **Fixed** (soft hyphens, sentence case) | spill 0 |
| B-08 | Med | Jump targets under sticky bar | **Fixed** (`scroll-margin-top`) | browser test "Jump links land below…" |
| B-09 | Med | Sticky bar 18–23% on short screens | **Fixed** (static below 600px height) | max 16%; browser test |
| B-10 | Med | No real home / no resume | **Fixed** — galaxy landing, Continue Learning from real data only | T12; browser tests |
| B-11 | Med | Compose skill never taught | **Fixed** — worked example | browser test "Challenge" |
| B-12 | Low | Targets < 44px | **Fixed** | 0 |
| B-13 | Low | Faded columns 2.6:1 | **Fixed** — only blocks fade; labels full contrast | contrast 0 |
| B-14 | Low | Hint repeated | **Fixed** | browser test |
| B-15 | Low | Answer key in localStorage | Disclosed (A-06) | — |
| B-16 | Low | Keyboard first Tab | **Fixed** — jump links give early focus stops | focus table |
| B-17 | Low | Text 200% overflow | **Mostly fixed** (6 → 1 states); remainder A-04 | text-scaling table |
| B-18/19 | Info | Disabled contrast; v1 key | Disabled buttons now readable (≥4.5:1); v1 key untouched | — |
| B-20 | Low | *Found during build:* skip link changed the stage (hash) | **Fixed** | browser test "Skip link…" |

### Defects found during this build

| ID | Sev. | Description | Status |
|---|---|---|---|
| A-01 | High (pre-release) | Shell rendered before the lesson context existed → blank lesson | Fixed before any commit; covered by smoke and browser tests |
| A-02 | Low | Number Words explanation spelled the word twice | Fixed; unit test added |
| A-03 | — | Audit tool: same-URL hash navigation didn't reload | Tool fixed |
| A-04 | Low | Teach It at 390px with **text-only** scaling 200%: page ~49px wider (script tags overflow ≈7px; remainder not isolated). Page zoom 200% passes everywhere | **Open — disclosed** |
| A-05 | Low | Attempt-history tables scroll sideways inside their box on phones | By design (the page itself does not scroll) |
| A-06 | Low | During a test, the generated questions (with answers) sit in this browser's localStorage | Disclosed; acceptable for a parent-led tool |
| A-07 | Info | The assignment's Phase 4 examples omit the comma after "thousand"; Lesson 2-1 uses it | Kept Lesson 2-1's convention for consistency; both forms are accepted by the grader; stated on the Number Words page — **decision for the parent/curriculum lead** |

**Critical: 0 open. High: 0 open.** Medium: 0 open. Low: A-04 open (disclosed), A-05/A-06 accepted.

## Before / after evidence (actual rendered pages, emulated viewports)

| Comparison | Before (baseline `main`) | After (this branch) |
|---|---|---|
| Homepage, laptop 1280×720 | `baseline/home__laptop-1280x720.png` | `after/home__laptop-1280x720.png` |
| Homepage, phone 390×844 | `baseline/home__modern-phone-390x844.png` | `after/home__modern-phone-390x844.png` |
| Crowded Teach It, laptop 1280×720 | `baseline/teach__laptop-1280x720.png` | `after/teach__laptop-1280x720.png` |
| Crowded Teach It, small phone 320×568 | `baseline/teach__small-phone-320x568.png` | `after/teach__small-phone-320x568.png` |
| See It, phone 390×844 | `baseline/see-step-1__modern-phone-390x844.png` | `after/see-step-1__modern-phone-390x844.png` |
| Guided practice, tablet 1024×768 | `baseline/guided-wrong+hint__tablet-landscape-1024x768.png` | `after/guided-wrong+hint__tablet-landscape-1024x768.png` |
| Number Words learning, 1280×720 / 390×844 | — | `after/nw-learn__laptop-1280x720.png`, `after/nw-learn__modern-phone-390x844.png` |
| Number Words cover-and-write, 390×844 | — | `after/nw-cover-write__modern-phone-390x844.png` |
| Number Words practice, 1280×720 | — | `after/nw-practice-feedback__laptop-1280x720.png` |
| Number Words test and results | — | `after/nw-test-running__modern-phone-390x844.png`, `after/nw-results__laptop-1280x720.png`, `after/nw-results__modern-phone-390x844.png` |
| Lesson 2-1 Math Test after regression, 390×844 | `baseline/math-test-submit-blocked__modern-phone-390x844.png` | `after/math-test-submit-blocked__modern-phone-390x844.png` |
| Lesson 2-1 Results, 390×844 | `baseline/results__modern-phone-390x844.png` | `after/results__modern-phone-390x844.png` |

## Known limitations and unverified checks

1. **Unverified:** real iPhone/iPad/Android hardware, Safari, Firefox, real screen readers, classroom-distance readability on a physical screen.
2. Text-only 200% scaling on narrow phones: one residual overflow (A-04).
3. A test can still be left via browser Back or Home (draft kept; pauses recorded) — client-side apps can't lock the browser.
4. Saved progress is per browser and per device; nothing syncs.
5. The Say step relies on the parent's judgment (no microphone, by design).

## Release decision

**READY FOR PARENT ACCEPTANCE TESTING**

All automated release-blocking checks pass (171/171), no Critical or High defects remain open, and the remaining limitations are listed above. This is not approval for full student use: real-device testing with the student, a screen-reader pass, and review of the A-07 convention decision are still outstanding.
