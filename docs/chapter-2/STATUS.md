# Chapter 2 status (coordinator's checkpoint)

Single source of truth for Chapter 2 progress. Updated by the coordinator after every stage so an interrupted session can resume without reconstructing anything.

- Textbook: `docs/textbook-references/chapter-2/` (3 PDFs, printed pages 33–100). Upright page images: run `node tools/extract-textbook-pages.mjs` → `docs/textbook-references/chapter-2/pages/page-033.jpg … page-100.jpg` (git-ignored). Even pages are stored with /Rotate 180 in the PDFs; the tool turns them upright.
- Plan: [PLAN.md](PLAN.md) · Per-lesson specs: [lessons/](lessons/) · Shared design: [DESIGN.md](DESIGN.md)
- Live site: https://bazeocrisy.github.io/Mathbook/ · Approved template: Section 2-1 (commit `b826b91`)

## Current scope (owner, 2026-10-10, updated)

Lesson 2-3 is **locked as complete**. Then build **Lesson 2-4 only** (one builder, one independent reviewer, the existing automated checks plus skill practice), publish, verify live, and stop. Everything else stays planned and saved for later. All specs, design and review findings are kept.

## Lessons

| Lesson | Pages | Planned | Implemented | Independent review | Tests | Live-verified | Findings / blockers | Next action |
|---|---|---|---|---|---|---|---|---|
| 2-1 Represent 4-Digit Numbers | 33–36 | ✅ | ✅ | ✅ | ✅ | ✅ | Locked design reference | — |
| 2-2 Round Multi-Digit Numbers | 37–40 | ✅ | ✅ | ⏳ re-check against the real pages | ✅ | ✅ (PR #8) | Content was written before the textbook was available | Curriculum + math review vs pp. 37–40 |
| Rounding extension (Math Probe: Rounding Numbers) | 41–42 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-3 Estimate Sums and Differences | 43–46 | ✅ spec reviewed + re-verified | ✅ | ✅ 0 critical / 1 major / 10 minor (L23-01 … L23-11); all fixed and re-verified | ✅ npm test 67/67; browser 2-3 122/122, skill practice 71/71 | ✅ (main 567997f) | **Complete (locked).** L23-04 closed | — |
| 2-4 Use Addition Properties to Add | 47–50 | ✅ spec reviewed + re-verified | ✅ | ✅ 0 critical / 1 major (L24-01) / 6 minor; all fixed and re-verified (L24-05 avoided in 2-4; the shared-engine part stays open) | ✅ npm test 77/77; browser 2-4 109/109, skill practice 62/62 | ✅ (main 53d7f30) | **Complete.** | — |
| 2-5 Addition Patterns | 51–54 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-6 Use Partial Sums to Add | 55–58 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-7 Decompose to Subtract | 59–62 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-8 Adjust Numbers to Add or Subtract | 63–66 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-9 Use Addition to Subtract | 67–70 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-10 Fluently Add within 1,000 | 71–74 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-11 Fluently Subtract within 1,000 | 75–78 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-12 Solve Two-Step Problems | 79–82 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-13 Compare 4-Digit Numbers | 83–86 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-14 Fluently Add Multi-Digit Numbers | 87–90 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-15 Use an Algorithm to Subtract | 91–94 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| Unit Review | 95–97 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| Performance Task | 98 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| Fluency Practice / Fluency Check | 99–100 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |

Legend: ✅ done · ⏳ in progress · — not started · ❌ blocked

## Agents (actually created)

| Role | Agent | Stage | Notes |
|---|---|---|---|
| Independent reviewer (2-2 wizard) | general-purpose subagent | 2-2 staged-line review (PR #8) | Three rounds, findings fixed and re-verified |
| Curriculum agent A | general-purpose subagent | Specs: 2-2 verification, rounding probe, 2-3, 2-4 | Done (4 specs; 4 significant 2-2 gaps → PLAN decisions) |
| Curriculum agent B | general-purpose subagent | Specs: 2-5 – 2-8 | Done (4 specs) |
| Curriculum agent C | general-purpose subagent | Specs: 2-9 – 2-12 | Done (4 specs) |
| Curriculum agent D | general-purpose subagent | Specs: 2-13 – 2-15, Unit Review, Performance Task, Fluency | Done (6 specs) |
| Independent math & teaching reviewer A | general-purpose subagent | Batch A plan review vs pp. 37–50 | Done — reviews/batch-A-plan-review.md; fixes re-verified (leftovers → Decision 28) |
| Independent math & teaching reviewer B | general-purpose subagent | Batch B plan review vs pp. 51–66 | Done — reviews/batch-B-plan-review.md; fixes re-verified (leftovers → Decision 28) |
| Independent math & teaching reviewer C | general-purpose subagent | Batch C plan review vs pp. 67–82 | Done — reviews/batch-C-plan-review.md; fixes re-verified (leftovers → Decision 28) |
| Independent math & teaching reviewer D | general-purpose subagent | Batch D/E plan review vs pp. 83–100 | Done — reviews/batch-D-plan-review.md; fixes re-verified (leftovers → Decision 28) |
| Design agent | general-purpose subagent | DESIGN.md: global patterns, shared models, Batch A screens | Done (DESIGN.md; decisions 23–27) |
| Builder (Lesson 2-4) | coordinator (this session), worktree ../Mathbook-24, branch claude/lesson-2-4 | Lesson 2-4 build + review fixes | Done (353a40f, d0a3e14, ddd5a0e) |
| Independent reviewer (Lesson 2-4) | general-purpose subagent | Build review + 2 re-verifications | Done — reviews/lesson-2-4-review.md |
| Builder (Lesson 2-3) | general-purpose subagent, worktree ../Mathbook-23, branch claude/lesson-2-3 | Lesson 2-3 build + review fixes | Done (ecfce0d, 4142219, 0a881a0) |
| Independent reviewer (Lesson 2-3) | general-purpose subagent | Build review + 2 re-verifications; L23-04 fix review + re-verification | Done — reviews/lesson-2-3-review.md |
| Builder (shared components) | general-purpose subagent, worktree ../Mathbook-shared, branch claude/ch2-shared | figures.js F1–F10, chain, vcalc, parts additions, engine additions, component tests | Done; merged (21c157d) and re-verified by the coordinator: npm test 54/54, components 52/52, 2-1 198/198, 2-2 96/96, Number Words 64/64 |

## Log

- 2026-10-10 — **Lesson 2-4 complete.** Built from the reviewed spec (pp. 47–50): 5 Learn steps (switch the order, group the addends, friendly pair, same addends same total, add more efficiently), Practice Together 14 + 2 explain, On My Own 14, Addition Properties Test 14, skill practice on. Independent review: 0 critical / 1 major (L24-01 position shortcut) / 6 minor (L24-02…L24-07); all fixed and re-verified. Suites: unit 77; browser 2-1 198, 2-2 96, 2-3 + 2-4 229, skill practice 2-3 71 / 2-4 62, Number Words 64, components 52. Merged to main (53d7f30); live: 2-4 journey 109/109 and skill practice 62/62 against the live site; home, 2-1, 2-2, 2-3 load with no errors. Lesson 2-3 locked. Stopped; 2-5 not started.
- 2026-10-10 — **Lesson 2-3 complete.** L23-04 fixed: "Practice this skill" opens only that skill (`#practice/skill-<skill>`, opt-in `skillPractice` engine option, saved apart as `skill-practice`), plus "Practice all 14 questions". Independent review: 0 critical / 0 major / 2 minor (L23-10 damaged saved data, L23-11 skill name in the heading), both fixed and re-verified. All suites green (unit 67; browser 2-1 198, 2-2 96, 2-3 122, skill practice 71, Number Words 64, components 52). Merged to main (567997f); the skill-practice browser test passed 71/71 against the live site; home, 2-1, 2-2 load with no errors. Stopped; 2-4 not started.
- 2026-10-10 — Resumed after a computer restart. Committed the reviewer's harness fix (Chrome closes reliably on Windows) and the 2-3 review. Re-ran everything: npm test 67/67; browser 2-1 198, 2-2 96, 2-3 122, Number Words 64, components 52; no leftover Chrome. Merged to main (c755418); Pages deployed; live check at 390 and 1366 px: home, 2-1, 2-2, 2-3 menu and Estimation Test load, no sideways scroll, no JavaScript errors. Scope complete; stopping.
- 2026-10-10 — Shared components merged and verified (21c157d). 2-3 builder starting (worktree ../Mathbook-23, branch claude/lesson-2-3).
- 2026-10-10 — Owner narrowed scope: shared components + 2-3 only, then stop. No lesson builders had started.
- 2026-10-10 — All plan fixes re-verified by the original reviewers; specs committed (28f8e3f). Waiting for shared components to start Batch A builders.
- 2026-10-10 — Plan reviews: A 1 critical/4 major, B 0/7, C 0/5, D 0/4 (no arithmetic errors outside A-01). Fixes assigned to the authoring curriculum agents. DESIGN.md adopted. Shared-components builder started in worktree claude/ch2-shared.
- 2026-10-10 — All 19 specs written by 4 curriculum agents (docs/chapter-2/lessons/). Coordinator decisions 1–22 in PLAN.md. Catalog + generic lesson tests committed. Math reviews (4) and design (DESIGN.md) running.
- 2026-10-10 — Session start. main at `3f214fb` (textbook scans added). Textbook pages extracted and rotated upright (68 pages). Lesson/page map recorded above.

## Saved for later (not started)

- Shared engine (L24-05): `partsTip` in assets/js/questions.js strips a trailing ":" or "?" from a part label but not ".", so a label ending in "." prints a doubled period in "Look again at: …". 2-4 avoids it; 2-3's "Choose the best way." label still shows it. One-character fix (`/[:?.]$/`), left for an engine batch so completed lessons are not changed.
- Lessons 2-5 … 2-15, Unit Review, Performance Task, Fluency: specs reviewed and ready (docs/chapter-2/lessons/).
- 2-2 fixes + Rounding Check-Up (PLAN Decision 1–2, spec 2-2-verification.md §6 and 2-2-probe.md).
- Note for 2-7: the shared `chain` steps preset rejects a 0 part; the reviewed 2-7 spec (B-01) says ignore 0/blank parts when ≥2 non-zero parts remain — adjust the preset when 2-7 is built.
- Shared-components builder notes: F8 wide-label callout not built (segments have an 18% minimum width); optional desktop figure-left layout not built.

## Blockers

None.
