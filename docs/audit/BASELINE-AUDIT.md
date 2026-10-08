# Mathbook — Phase 0 Baseline Forensic Audit

**Build audited:** `main` @ `2418d34c1aa7097c3f9dbe8f64cbba4ddb230042` (live at https://bazeocrisy.github.io/Mathbook/, verified byte-identical to `main` for `index.html`, `lesson.js`, `lesson-app.js`, `mathbook.css`)
**Date:** 2026-10-08 · **Code changes during this phase:** none (audit tooling only: `tests/audit.mjs`, `tests/lib/harness.mjs`)

## How this audit was done

| Method | What it covers | Limits |
|---|---|---|
| **Measured** (`node tests/audit.mjs baseline`) | 11 screen-states × 9 viewports (8 required + 640×360 = 200% page zoom on 1280×720): horizontal overflow, off-screen elements, text spilling out of its box, touch-target size, smallest font, WCAG text contrast, sticky-bar coverage, page length; keyboard focus (45 Tab presses × 5 screens); root text size doubled; reduced motion; 15 state-transition/leakage checks | Headless **Chrome with emulated viewports** — not real phones/tablets, not Safari/Firefox. Contrast is computed against the nearest solid background (text on gradients reported as "unknown"). |
| **Visually inspected** | Full-page screenshots (`docs/audit/baseline/*.png`) for crowding, grouping, hierarchy | Judgment, not measurement — labeled as such below |
| **Not verified** | Real screen reader (NVDA/VoiceOver), real touch devices, classroom-distance reading on a physical display | No devices/screen reader available in this environment |

Full raw measurements: [`baseline/measurements.md`](baseline/measurements.md).

## Baseline test results

- Unit tests (`npm test`): **13 / 13 pass**
- Browser tests (`npm run test:browser`): **53 / 53 pass**
- Audit transitions: **11 pass, 1 FAIL (T06), 3 observations** (T05, L03, T12)

## Architecture (current)

- Static site, no dependencies. `index.html` (home, one lesson link) → `curriculum/chapter-2/lesson-2-1/index.html`.
- Reusable: `assets/js/place-value.js` (math + SVG blocks), `assets/js/questions.js` (7 question types), `assets/js/lesson-app.js` (five-stage engine), `assets/css/mathbook.css`.
- Lesson content: `curriculum/chapter-2/lesson-2-1/lesson.js` (vocabulary, parent guide, 5 guided items, 50-question bank, Vocabulary/Math test generators).
- Storage: `localStorage` keys `mathbook:v2:lesson-2-1:{attempts, practice, draft-vocab, draft-math}`. Legacy key `mathbook-2-1` (v1) is left untouched and not displayed.

---

## A. Device-state defect matrix (summary)

✔ = no measured problem · numbers are from `measurements.md`

| State | 320×568 | 375×667 | 390×844 | 768×1024 | 1024×768 | 1280×720 | 1440×900 | 1920×1080 | 640×360 (zoom) |
|---|---|---|---|---|---|---|---|---|---|
| Home | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Teach It | chart text spill ×4 (B-07); **15.9 screens** (B-05) | spill ×1; 11.8 screens | 9.3 screens | spill ×2 | spill ×1 | spill ×1; 5.6 screens | spill ×1 | spill ×1 | 15.3 screens |
| See It step 1 | spill ×4; contrast ×14 (B-06, B-13) | spill ×2; contrast ×14 | contrast ×14 | contrast ×14 | contrast ×14 | contrast ×14 | contrast ×14 | contrast ×14 | contrast ×14 |
| See It final | spill ×4; contrast ×2 | spill ×2; contrast ×2 | contrast ×2 | contrast ×2 | contrast ×2 | contrast ×2 | contrast ×2 | contrast ×2 | contrast ×2 |
| Guided (wrong + hint) | contrast ×3; small inputs; sticky 18% | contrast ×3; sticky 15% | contrast ×3 | contrast ×3 | contrast ×3 | contrast ×3 | contrast ×3 | contrast ×3 | contrast ×3; **sticky 23%** (B-09) |
| Independent set | contrast ×3; 10.4 screens | 8.3 screens | 6.6 screens | ✔ | ✔ | ✔ | ✔ | ✔ | 14 screens; sticky 23% |
| Independent checked | contrast ×3; 12.8 screens | 10.5 screens | 7.9 screens | ✔ | ✔ | ✔ | ✔ | ✔ | sticky 23% |
| Test chooser | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Vocabulary Test running | `.q-select` <44px | same | same | same | same | same | same | same | same |
| Math Test blocked submit | chart inputs <44px | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Results (with attempts) | **overflow 618px** (B-01) | **overflow 617px** | **overflow 617px** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

All screens: brand link < 44px tall (B-12). No JavaScript errors, no 404s. Reduced motion: no animations exist (0 running in either mode).

**Height-specific findings:** sticky stage bar covers 18% of a 320×568 screen and 23% of 640×360 (B-09); 1024×768 and 1280×720 are fine (9–10%).

## B. Instructional-objective matrix

Each objective traced through **Taught → Shown → Guided → Practiced → Assessed → Feedback**.

| # | Objective | Taught (Teach It) | Shown (See It) | Guided | Practiced (bank of 50) | Assessed | Feedback | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | Name the place of each digit | Big idea, place cards, script step 2 | Every step highlights the place | G1 (chart) | 12 (place) | Math: place name, chart; Vocab: cloze, "left of" | Explanation per item | ✔ |
| O2 | Value of a digit | Big idea, guide, script step 3 | Captions "3 tens = 30" | G5 (explain 700) | 7 (value) | Math: value | ✔ | ✔ |
| O3 | Model with base-ten blocks | Place/block cards | Step-through + builder | **none** (builder is unguided) | 6 (model/build) | Math: read model, build | ✔ | ⚠ partial — no guided item |
| O4 | Standard form | Vocabulary card | Forms panel | G3 | 5 | Math: from expanded | ✔ | ✔ |
| O5 | Expanded form | Vocabulary, script step 4 | Builds term by term | G2 | 5 | Math: write expanded | ✔ + format tips | ✔ |
| O6 | Word form | Vocabulary, script step 1 | Last step | G4 (typed) | 9 | Math: both directions | ✔ | ✔ |
| O7 | Zero as placeholder | Guide, script step 5, mistakes list | 5,072 example | G1, G2 | Items with zeros | Generated numbers with zeros | Zero note in explanations | ✔ |
| O8 | **10, 100, 1,000 more or less** | **not taught** | **not shown** | **none** | 4 | **Math Test (1 of 10 = 10%)** | ✔ | ❌ **assessed without instruction** (B-02) |
| O9 | **Lesson vocabulary** | Definitions only | — | **none** | **0** | **Vocabulary Test (10 items)** | ✔ | ❌ **assessed with no guided practice or practice** (B-03) |
| O10 | Greatest/smallest number from digits | **not taught** | — | none | 2 | not assessed | ✔ | ⚠ practiced without instruction (B-11) |

## C. State-transition and leakage results

| ID | Check | Result |
|---|---|---|
| T01 | Start lesson → Teach It | pass |
| T02 | Next button forward; browser Back returns | pass |
| T03 | Switch stages via tabs | pass |
| T04 | Guided: wrong → hint → retry → correct | pass |
| L01 | Test shows no hints, feedback, explanations | pass |
| L02 | Practice answers do not prefill test | pass |
| L03 | Answer key stored in plain localStorage during a test | observation (B-15) |
| T05 | Stage tabs stay active during a test (Teach It definitions can be opened mid-Vocabulary-Test) | observation → defect B-04 |
| **T06** | **After leaving a test via a tab and returning, the other test cannot be started** | **FAIL (B-04)** |
| T07 | Refresh with unfinished test → Resume, answers kept | pass |
| T08 | Complete → Results | pass |
| T09 | Retake → new version | pass |
| T10 | Clear progress → confirm → clears only this lesson | pass |
| T11 | Fresh session → no fabricated progress | pass |
| T12 | Home "Continue Learning" | absent (B-10) |

## D. Cognitive-load analysis (visual inspection unless noted)

1. **Teach It runs together** (owner's complaint confirmed). One page holds four different activities — learning target, vocabulary (6 cards + 4 place cards), six-card parent guide, five-step script — with student-facing and parent-facing material alternating and similar card styling. Measured length: 15.9 screens (320×568), 11.8 (375×667), 5.6 (1280×720).
2. **Section boundaries are weak**: white cards on a near-white page (#f3f7fc) with 1rem gaps; the parent guide and teaching script look like the vocabulary cards apart from a small badge.
3. **Practice It** stacks guided and independent practice; an independent set is 10–13 screens on phones with no section landmarks.
4. **Duplicate guidance**: after a wrong guided answer with the hint open, the same hint text appears twice (hint box and "Not yet" message) — screenshot `guided-wrong+hint__tablet-landscape-1024x768.png`.
5. **Scroll targets hide under the sticky bar**: jumping to "Independent practice" / "Practice this skill" / vocabulary places the heading under the stage bar.
6. Home page is a single plain card — nothing invites a child in, and no resume path.

## E. Accessibility and readability

| Check | Method | Result |
|---|---|---|
| Keyboard operation | Measured (Tab ×45 per screen) | All controls reachable; every stop shows a focus ring |
| Focus order | Measured | Logical DOM order. After a stage change focus is placed on the page heading; on Teach It the next Tab goes to the bottom "Next" button because Teach It has no other controls (B-16, low) |
| Labels / names | Measured (browser test) | Every control labeled |
| Contrast | Measured | **Parent-orange text 3.96–4.26:1** (`.demo-ask`, "Together" pill, "Parent:" label) fails AA 4.5:1 (B-06). Faded "not yet shown" block columns 2.6:1 (B-13). Disabled buttons 3.34:1 (exempt under WCAG) |
| Touch targets | Measured | All ≥ 24px (passes WCAG 2.2 AA 2.5.8). Below 44px (AAA / Apple guidance): brand link, Results "Practice this skill" buttons (40px), drop-down blanks (≈38px), chart inputs at ≤390px (B-12) |
| Reduced motion | Measured | No animations present; `prefers-reduced-motion` rule exists |
| Page zoom 200% (640×360) | Measured | No overflow; sticky bar 23% of height (B-09) |
| Root text size 200% | Measured | Overflow on phones in steppers, drop-downs, long headings (B-17, low); chart headers spill at all sizes |
| Screen reader | **Not verified** | Semantics reviewed in code only (roles, aria-live, labels) |
| Classroom-distance readability | **Visual only, not measured on a physical display** | Smallest text 11.5–14px (chart headers, helper text). Math expressions (digits 1.8–2.6rem, forms 1.12–1.4rem) read well in screenshots; small uppercase chart headers are the weakest element |

---

## F. Defect register (severity-ranked)

| ID | Severity | Screen / state | Device / viewport | Reproduction | Expected | Actual | Evidence | Root-cause hypothesis | Instructional impact | Regression risk of fix | Recommended correction |
|---|---|---|---|---|---|---|---|---|---|---|---|
| B-01 | **High** | Results with ≥1 attempt | 320, 375, 390 wide | Take any test → Results on a phone | No horizontal scroll | Document 574–618px wide; page can pan sideways | measurements.md (results rows); `results__modern-phone-390x844.png` | `.sr-only` "View" header (absolutely positioned) escapes the non-positioned `.table-wrap`; `body{overflow-x:hidden}` hid it from the earlier test | Child/parent sees a wobbling page right when reading feedback | Low | `position:relative` on `.table-wrap`; remove `body` overflow mask so tests see real overflow |
| B-02 | **High** | Teach It / See It / Guided | all | Search Teach/See/Guided for "more"/"less" | Taught and shown before it is tested | Not taught or shown; 1 Math Test item (10%) and 4 practice items | Objective matrix O8 | Skill added to bank/test without matching instruction | Child is graded on an untaught skill | Low (additive) | Add a teaching card + See It "change one place" demo + 1 guided problem + parent script step |
| B-03 | **High** | Practice It | all | Look for vocabulary practice | Guided practice of vocabulary before the Vocabulary Test | None; bank has 0 vocabulary items | Objective matrix O9 | Vocabulary test built without a practice path | Vocabulary assessed after reading definitions only | Low (additive) | Add a guided "Vocabulary practice" round (hints + feedback) using the same templates with new numbers |
| B-04 | **High** | Test It | all | Start Vocabulary Test → click "See It" tab → click "Test It" | Choose either test; tabs don't expose lesson content mid-test | Vocabulary Test reopens; Math Test unreachable without "Save and finish later"; Teach It definitions viewable mid-test | T05, T06 | Active test kept in memory; stage bar always active | Confusing for parent; vocabulary answers visible mid-test | Medium (navigation) | Focus mode during tests: hide stage tabs, single exit "Save and finish later" → test chooser; record pauses on the attempt |
| B-05 | Medium | Teach It | all (worst on phones) | Open Teach It | Distinct, separated activities | 4 activities on one continuous page; 15.9 screens at 320×568 | `teach__small-phone-320x568.png`, `teach__laptop-1280x720.png` | No section hierarchy beyond same-style cards | Parent can't find the script; child sees parent text | Medium (shared CSS) | Section bands with audience labels (Student / Parent), "On this page" jump links, larger gaps, dark page ground so cards separate |
| B-06 | Medium | See It, Practice It | all | Measure parent-orange text | ≥ 4.5:1 | 3.96–4.26:1 | measurements.md | `--parent:#b85d00` too light on tinted backgrounds | Hard to read for some parents | Low | Darken parent color to ≥ 4.5:1 on its backgrounds |
| B-07 | Medium | Teach It / See It charts | 320, 375, 768, ≥1024 (highlighted) | Open Teach It | Column labels fit | "Thousands"/"Hundreds" spill out of cells | measurements.md spill column | Uppercase + letter-spacing at fixed size in narrow cells | Labels overlap — the key concept on screen | Low | Sentence case, fluid font size, allow wrapping |
| B-08 | Medium | Practice It, Results → practice, vocabulary jump | all | Click "Go to independent practice ↓" | Heading visible below the sticky bar | Heading hidden under stage bar | guided screenshot (bar over hero) | No `scroll-margin-top` | Parent loses place | Low | `scroll-margin-top` on sections/cards |
| B-09 | Medium | Any long screen | 320×568, 640×360 | Scroll | Content keeps most of the screen | Sticky bar covers 18–23% | measurements.md sticky column | Sticky at all heights | Less room for math on short screens | Low | Make the stage bar static when viewport height < 600px |
| B-10 | Medium | Home | all | Open home | Inviting start, Continue Learning | Plain card; no resume | `home__laptop-1280x720.png`, T12 | Minimal pilot home | Child doesn't find where they left off | Low | Phase 1 landing page |
| B-11 | Medium | Practice bank | all | Practice skill "Making numbers from digits" | Taught first | 2 items, never taught | Objective matrix O10 | Bank broader than instruction | Child guesses | Low | Add a short worked example in See It |
| B-12 | Low | Brand link, Results buttons, drop-downs, chart inputs | all / ≤390 | Measure | ≥ 44px | 32–40px (all ≥ 24px) | measurements.md small-target column | Compact sizing | Minor tapping difficulty | Low | Raise to 44px |
| B-13 | Low | See It step 1–4 | all | Step 1 | Unrevealed places clearly "coming next" | Faded to 22% opacity, text 2.6:1 | measurements.md | Intentional dimming | Faint text could be miscounted | Low | Keep blocks faint but hide captions until revealed |
| B-14 | Low | Guided practice | all | Wrong answer + Show hint | One clear hint | Hint text repeated twice | guided screenshot | Feedback repeats hint | Clutter | Low | Don't repeat the hint in feedback when it is already open |
| B-15 | Low | Test running | all | DevTools → localStorage | — | Answer key stored with draft | L03 | Draft = generated questions | Only a determined student could look | n/a | Disclose; acceptable for a parent-led tool |
| B-16 | Low | Teach It keyboard | all | Tab after page load | Reach stage tabs | First Tab goes to bottom "Next" button | focus table | Focus placed on h1 | Minor for keyboard users | Low | Add jump links on Teach It (also fixes B-05) |
| B-17 | Low | Several | phone, root text 200% | Double root font | No overflow | Steppers/drop-downs/headings overflow | text-scaling table | Fixed control sizes | Only with large-text settings | Low | Allow wrapping; flexible steppers |
| B-18 | Info | Disabled buttons | all | — | — | 3.34:1 | measurements.md | Disabled styling | none | — | No change (WCAG exempt) |
| B-19 | Info | Storage | all | — | — | v1 key `mathbook-2-1` neither shown nor deleted | code review | Incompatible format | none | — | Keep untouched (never delete history) |

## Prioritized correction plan

1. **High:** B-01 (results overflow), B-02 (teach "more/less"), B-03 (vocabulary practice), B-04 (test focus mode + test switching).
2. **Phase 1–2 redesign absorbs:** B-05, B-07, B-08, B-09, B-10, B-12, B-14, B-16 (galaxy shell, section bands, jump links, spacing, sizes).
3. **Small fixes:** B-06 (parent color), B-11 (compose worked example), B-13 (hide captions until revealed), B-17 (wrapping).
4. **Disclose only:** B-15, B-18, B-19.
