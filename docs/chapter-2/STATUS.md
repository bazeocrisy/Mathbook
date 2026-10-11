# Chapter 2 status (coordinator's checkpoint)

Single source of truth for Chapter 2 progress. Updated by the coordinator after every stage so an interrupted session can resume without reconstructing anything.

- Textbook: `docs/textbook-references/chapter-2/` (3 PDFs, printed pages 33–100). Upright page images: run `node tools/extract-textbook-pages.mjs` → `docs/textbook-references/chapter-2/pages/page-033.jpg … page-100.jpg` (git-ignored). Even pages are stored with /Rotate 180 in the PDFs; the tool turns them upright.
- Plan: [PLAN.md](PLAN.md) · Per-lesson specs: [lessons/](lessons/) · Shared design: [DESIGN.md](DESIGN.md)
- Live site: https://bazeocrisy.github.io/Mathbook/ · Approved template: Section 2-1 (commit `b826b91`)

## Current scope (owner, 2026-10-10, updated)

**Batch 1 (owner, 2026-10-10): Lessons 2-6 and 2-7 only**, one after the other (2-6 finished, published and live-verified before 2-7 starts). The coordinator is the builder; one independent reviewer. Reuse the shared components and add only what these lessons need. Stop after 2-7: no 2-8, no end-of-chapter activities.

Earlier: lessons 2-3 and 2-4 are complete. Then build **Lesson 2-5 only** (one builder, one independent reviewer, the existing automated checks plus skill practice), publish, verify live, and stop before 2-6. Owner decision for 2-5: the even/odd word question and its written equation are separate, connected questions (same pattern, same example, separate skills); Learn completes only when both are right; no new question type and no engine expansion for this. Everything else stays planned and saved for later.

## Lessons

| Lesson | Pages | Planned | Implemented | Independent review | Tests | Live-verified | Findings / blockers | Next action |
|---|---|---|---|---|---|---|---|---|
| 2-1 Represent 4-Digit Numbers | 33–36 | ✅ | ✅ | ✅ | ✅ | ✅ | Locked design reference | — |
| 2-2 Round Multi-Digit Numbers | 37–40 | ✅ | ✅ | ✅ re-checked against pp. 37–40 (2-2-verification.md); fixes reviewed: 0 critical / 2 major / 4 minor (L22F-01…06), all fixed and re-verified | ✅ unit 89/89; browser 2-2 96/96, Check-Up 27/27 | ✅ (main 451f830) | PLAN decision 1 changes made (p1 36, p5 418, p6 87, p12 Dev, t1 72, t9 68, t10 65; t11 549–651; no book numbers) | — |
| Rounding extension (Math Probe: Rounding Numbers) | 41–42 | ✅ spec reviewed + re-verified | ✅ inside 2-2 (PLAN decision 2) | ✅ (with the 2-2 fixes) | ✅ Check-Up 27/27 | ✅ (main 451f830) | On My Own set s2 "Rounding Check-Up" (PR1–PR4) and test "checkup" (TR1–TR4), skill `probe` | — |
| 2-3 Estimate Sums and Differences | 43–46 | ✅ spec reviewed + re-verified | ✅ | ✅ 0 critical / 1 major / 10 minor (L23-01 … L23-11); all fixed and re-verified | ✅ npm test 67/67; browser 2-3 122/122, skill practice 71/71 | ✅ (main 567997f) | **Complete (locked).** L23-04 closed | — |
| 2-4 Use Addition Properties to Add | 47–50 | ✅ spec reviewed + re-verified | ✅ | ✅ 0 critical / 1 major (L24-01) / 6 minor; all fixed and re-verified (L24-05 avoided in 2-4; the shared-engine part stays open) | ✅ npm test 77/77; browser 2-4 109/109, skill practice 62/62 | ✅ (main 53d7f30) | **Complete.** | — |
| 2-5 Addition Patterns | 51–54 | ✅ spec reviewed + re-verified | ✅ | ✅ 0 critical / 1 major (L25-05) / 6 minor (L25-01…L25-07); all fixed and re-verified | ✅ npm test 87/87; browser 2-5 122/122, skill practice 68/68 | ✅ (main 927b8c2) | **Complete.** 6 Learn steps (word, then equation for the same pattern) | — |
| 2-6 Use Partial Sums to Add | 55–58 | ✅ spec reviewed + re-verified | ✅ built (86ccc61) | ⏳ independent review running (reviews/lesson-2-6-review.md) | ✅ npm test 100/100; browser 2-6 122/122, skill practice 65/65 | — | 6 Learn steps (spec's step 3 "why the same?" is its own step 4); new shared figure F11 `eqs` | Review → fixes → publish |
| 2-7 Decompose to Subtract | 59–62 | ✅ spec reviewed + re-verified | — | — | — | — | | Batch 1: build after 2-6 is live |
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
| Builder (2-2 fixes + Check-Up) | coordinator (this session), worktree ../Mathbook-22, branch claude/lesson-2-2-fixes | 2-2 fixes, Rounding Check-Up, shared fixes | Done (a2b4d3c, c0cd053, a5a5ee3) |
| Independent reviewer (2-2 fixes) | general-purpose subagent | Review + 2 re-verifications | Done — reviews/lesson-2-2-fixes-review.md |
| Builder (Lesson 2-5) | coordinator (this session), worktree ../Mathbook-25, branch claude/lesson-2-5 | Lesson 2-5 build, owner's pairing, review fixes | Done (364eb0f, ae56b7f, 86419dd, 87e3cfd) |
| Independent reviewer (Lesson 2-5) | general-purpose subagent | Build review + 2 re-verifications | Done — reviews/lesson-2-5-review.md |
| Builder (Lesson 2-4) | coordinator (this session), worktree ../Mathbook-24, branch claude/lesson-2-4 | Lesson 2-4 build + review fixes | Done (353a40f, d0a3e14, ddd5a0e) |
| Independent reviewer (Lesson 2-4) | general-purpose subagent | Build review + 2 re-verifications | Done — reviews/lesson-2-4-review.md |
| Builder (Lesson 2-3) | general-purpose subagent, worktree ../Mathbook-23, branch claude/lesson-2-3 | Lesson 2-3 build + review fixes | Done (ecfce0d, 4142219, 0a881a0) |
| Independent reviewer (Lesson 2-3) | general-purpose subagent | Build review + 2 re-verifications; L23-04 fix review + re-verification | Done — reviews/lesson-2-3-review.md |
| Builder (shared components) | general-purpose subagent, worktree ../Mathbook-shared, branch claude/ch2-shared | figures.js F1–F10, chain, vcalc, parts additions, engine additions, component tests | Done; merged (21c157d) and re-verified by the coordinator: npm test 54/54, components 52/52, 2-1 198/198, 2-2 96/96, Number Words 64/64 |

## Log

- 2026-10-10 — **Batch 1 started (2-6, then 2-7).** Checked after a computer restart: all worktrees clean, every branch matches GitHub, 2-5 merged and live (main 62a2d78). 2-6 builder: coordinator, worktree ../Mathbook-26, branch claude/lesson-2-6 (from 62a2d78).
- 2026-10-10 — **All open fixes done** (owner: "make all fixes"). (1) 2-2 fixes per PLAN decision 1: p1 36 and t1 72 on a number line, p5 418, p6 87 and t9 68 to the nearest hundred (0 to 100), t10 65, p12 Dev; t11 moved to 549–651 and t12 / p12 prices and PR2 adjusted so no book number is rounded and no Check-Up number is retested; Parent Guide adds the Choosing Tools question. (2) Rounding Check-Up (PLAN decision 2): set s2 PR1–PR4 and a 4-item test "checkup". (3) Shared: the doubled period in "Look again at" (L24-05; 2-3 "Choose the best way."); Practice menu says "Choose a set." when sets differ in size; Home Continue counts a multi-part answer only when every part is filled; the lesson list's score and "done" come from the main test, and a lesson with only another test taken shows that test's named score. Independent review: 0 critical / 2 major / 4 minor (L22F-01…06), all fixed and re-verified. Suites (one at a time): unit 89; browser 2-1 + home 198, 2-2 96, Check-Up 27, 2-3/2-4/2-5 349, skill practice 71/62/68, Number Words 64, components 52. Merged to main (451f830); live: Check-Up 27/27, 2-2 96/96, home + 2-1 198/198, 2-3 122/122, 2-4 + 2-5 229/229, no JavaScript errors.
- 2026-10-10 — **Lesson 2-5 complete.** Built from the reviewed spec (pp. 51–54) with pairs pictures (counters `pairs`/`join`): 6 Learn steps (even or odd; even + even and odd + odd; even + odd and cube trains, start 4–20 never 7/11/15 per PLAN decision 28; the ones digits decide (word question); write an equation for the same pattern; check a sum), Practice Together 13, On My Own 19, Addition Patterns Test 14, skill practice on. Owner decision: each pattern is a word question (skill `rules`) and a connected equation question (skill `write`, chain preset `free`) with the same example; Learn step 5 uses step 4's sentence and unlocks only after it. Independent review: 0 critical / 1 major (L25-05 O18 key) / 6 minor; all fixed and re-verified. Shared fixes it exposed (no other lesson changes): blanks in part labels draw as the blank box (L25-02); Home Continue counts written-equation answers and no longer counts an empty select-all (L25-04). A full background browser run was once stopped for low memory; suites were then run one at a time. Suites: unit 87; browser 2-1 + home 198, 2-2 96, 2-3/2-4/2-5 349, skill practice 71/62/68, Number Words 64, components 52. Merged to main (927b8c2); live: 2-5 journey 122/122, 2-5 skill practice 68/68, 2-4 journey 109/109, home + 2-1 198/198; no JavaScript errors. Stopped; 2-6 not started.
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

- Lessons 2-6 … 2-15, Unit Review, Performance Task, Fluency: specs reviewed and ready (docs/chapter-2/lessons/).
- Note for 2-7: the shared `chain` steps preset rejects a 0 part; the reviewed 2-7 spec (B-01) says ignore 0/blank parts when ≥2 non-zero parts remain — adjust the preset when 2-7 is built.
- Shared-components builder notes: F8 wide-label callout not built (segments have an 18% minimum width); optional desktop figure-left layout not built.

## Blockers

None.
