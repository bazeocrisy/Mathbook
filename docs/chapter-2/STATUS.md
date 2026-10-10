# Chapter 2 status (coordinator's checkpoint)

Single source of truth for Chapter 2 progress. Updated by the coordinator after every stage so an interrupted session can resume without reconstructing anything.

- Textbook: `docs/textbook-references/chapter-2/` (3 PDFs, printed pages 33–100). Upright page images: run `node tools/extract-textbook-pages.mjs` → `docs/textbook-references/chapter-2/pages/page-033.jpg … page-100.jpg` (git-ignored). Even pages are stored with /Rotate 180 in the PDFs; the tool turns them upright.
- Plan: [PLAN.md](PLAN.md) · Per-lesson specs: [lessons/](lessons/) · Shared design: [DESIGN.md](DESIGN.md)
- Live site: https://bazeocrisy.github.io/Mathbook/ · Approved template: Section 2-1 (commit `b826b91`)

## Lessons

| Lesson | Pages | Planned | Implemented | Independent review | Tests | Live-verified | Findings / blockers | Next action |
|---|---|---|---|---|---|---|---|---|
| 2-1 Represent 4-Digit Numbers | 33–36 | ✅ | ✅ | ✅ | ✅ | ✅ | Locked design reference | — |
| 2-2 Round Multi-Digit Numbers | 37–40 | ✅ | ✅ | ⏳ re-check against the real pages | ✅ | ✅ (PR #8) | Content was written before the textbook was available | Curriculum + math review vs pp. 37–40 |
| Rounding extension (Math Probe: Rounding Numbers) | 41–42 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-3 Estimate Sums and Differences | 43–46 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
| 2-4 Use Addition Properties to Add | 47–50 | ✅ spec reviewed + re-verified | — | — | — | — | | Build (after shared components) |
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
| Builder (shared components) | general-purpose subagent, worktree ../Mathbook-shared, branch claude/ch2-shared | figures.js F1–F10, chain, vcalc, parts additions, engine additions, component tests | Running |

## Log

- 2026-10-10 — All plan fixes re-verified by the original reviewers; specs committed (28f8e3f). Waiting for shared components to start Batch A builders.
- 2026-10-10 — Plan reviews: A 1 critical/4 major, B 0/7, C 0/5, D 0/4 (no arithmetic errors outside A-01). Fixes assigned to the authoring curriculum agents. DESIGN.md adopted. Shared-components builder started in worktree claude/ch2-shared.
- 2026-10-10 — All 19 specs written by 4 curriculum agents (docs/chapter-2/lessons/). Coordinator decisions 1–22 in PLAN.md. Catalog + generic lesson tests committed. Math reviews (4) and design (DESIGN.md) running.
- 2026-10-10 — Session start. main at `3f214fb` (textbook scans added). Textbook pages extracted and rotated upright (68 pages). Lesson/page map recorded above.

## Blockers

None.
