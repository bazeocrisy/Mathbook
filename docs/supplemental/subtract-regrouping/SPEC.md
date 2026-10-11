# Subtract with Regrouping — owner specification (2026-10-11)

Recorded from the owner's message. It is complete and self-contained, and it replaces all earlier regrouping prompts and audit addenda. Lightly reformatted; requirements unchanged.

## Project and scope
- Repository: bazeocrisy/Mathbook.
- Read the repository instructions, STATUS.md, the relevant existing components, and Lessons 2-7, 2-11 and 2-15.
- Preserve completed lessons, Number Words and existing student progress. Save any unfinished work before switching tasks.
- This is a **new supplemental section, not a replacement for 2-15**. Do not invent a textbook lesson number.
- Add a "Subtract with Regrouping" card **immediately after 2-15** in the Mathbook menu.
- Keep the existing color scheme and the simple guided child experience.

## Team
- The coordinator is the lead builder.
- There are exactly two supporting agents, in separate roles. Reuse them to verify fixes; add no others.
  1. **Design agent:** the vertical workspace, regrouping annotations, guided teaching, hint presentation, accessibility, and phone/tablet/desktop layouts. It inspects actual rendered screens.
  2. **Independent math/testing agent:** examples, exchanges, generated questions, difficulty rules, grading, hints, assessment integrity, persistence, reset and portability.
- The coordinator owns implementation, integration, publishing and completion.

## Vertical subtraction is mandatory
- **Where:** every subtraction is shown vertically in examples and Your Turn, guided and independent practice, tests, hints and solutions, and error-analysis questions.
- **What it shows:**
  - the top number above the bottom number, with the minus sign beside the bottom number;
  - an answer line, with answer-digit boxes below it;
  - fixed, aligned Thousands, Hundreds, Tens and Ones columns as applicable.
- **Alignment:**
  - Right-align operands of different lengths, leaving unused leading places blank.
  - Use a real grid, not spaces in a string.
  - Keep vertical alignment on every device.
- **Regrouping marks:**
  - Regrouped values appear above the correct top-number columns.
  - Replaced values are crossed out, and current values are clearly distinguished.
  - Leave room for two-digit annotations (10, 11, 12).
- Horizontal equations may support explanations or addition checks, but must never replace the vertical task.

## Interactive regrouping workspace
- Keep the original top number visible as a reference.
- Show one adjacent exchange at a time: decrease the supplying column by 1, increase the receiving column by 10, explain the exchange, and show the updated values above their columns.
- Teach these sentences:
  - "Regrouping changes how we represent the number. Its value stays the same."
  - "Exchange 1 ten for 10 ones."
  - "Exchange 1 hundred for 10 tens."
  - "Exchange 1 thousand for 10 hundreds."
- Use existing place-value or base-ten visuals where they help; no large new illustration system.
- In guided practice the child makes the decisions, not a passive animation or a bare answer box:
  - Does this column need regrouping?
  - Which place can supply the exchange?
  - What are the new column values?
  - What digit goes in the answer?
- Across zeros, show each exchange through the intervening places; never jump straight to the receiving column.

## Learn sequence
Use wizard steps, each with an Example phase and a Your Turn phase. Group related topics; do not put the whole sequence on one page. Cover:
1. Why an exchange preserves value.
2. 2-digit subtraction with one exchange.
3. 3-digit subtraction with one exchange.
4. Multiple exchanges.
5. 4-digit subtraction with one exchange.
6. 4-digit subtraction with multiple exchanges.
7. Regrouping across one zero.
8. Regrouping across consecutive zeros.
9. Deciding whether regrouping is necessary.
10. Finding and correcting mistakes.
11. Checking subtraction with addition.

Every assessed skill must be taught and practised.

## Verified examples (rendered vertically)
- **Easy:** 4,352 − 2,126 = 2,226.
- **Medium:** 4,532 − 1,768 = 2,764.
- **Hard:** 3,002 − 1,578 = 1,424. Show each stage of the top number, then subtract using the current values:
  - 3 thousands, 0 hundreds, 0 tens, 2 ones
  - 2 thousands, 10 hundreds, 0 tens, 2 ones
  - 2 thousands, 9 hundreds, 10 tens, 2 ones
  - 2 thousands, 9 hundreds, 9 tens, 12 ones

Independently verify every additional example.

## Number size and difficulty
- **Practice setup wizard, in this order:**
  1. Number size: 2-digit, 3-digit, 4-digit or Mixed.
  2. Difficulty: Easy, Medium, Hard or Mixed.
  3. Length: 10, 25 or 50 questions.
  4. Start.
- **Default:** 4-digit, Easy, 10 questions.
- **Four-digit** means the top number has four digits; the bottom number may have fewer and stays right-aligned.
- **Difficulty**, classified by the exchanges the standard right-to-left algorithm needs:
  - Easy: exactly one exchange, with no zero chain.
  - Medium: several exchanges, with no zero chain.
  - Hard: an exchange chain through one or more zero-valued places.
  - Mixed: a balanced mix, including some problems with no regrouping.
- **Supported combinations only:**
  - Offer only combinations the generator supports. For example, 2-digit Hard is impossible under these rules.
  - When a combination is unavailable, say so briefly and offer a valid choice. Never silently change the number size.
- **Mixed size:** at least half the questions have four-digit top numbers.
- **Number rules:**
  - Operands are whole and nonnegative, top numbers are at most 9,999, and answers are nonnegative.
  - Sessions are varied enough for 50 questions, with no duplicate operand pairs within a session where practical.
  - Exchange positions and zero patterns vary. Equal operands, zero answers and no-regrouping problems belong in the mixed or decision categories.

## Practice, hints and feedback
- **Navigation:** guided and independent practice use the established simple navigation.
- **Independent practice:**
  - Optional regrouping annotations go above the columns, and the answer goes below the line.
  - Intermediate entries are never required.
  - Undo and Clear Work apply to annotations without resetting the session.
- **Progressive hints:**
  1. The column that needs attention.
  2. Where an exchange can come from.
  3. The exchange explained.
  4. The next worked step.
  5. The full solution, only on request.

  The first hint never reveals the final answer.
- **Specific feedback for these mistakes:**
  - Subtracting the smaller digit from the larger regardless of position.
  - Adding 10 without reducing the supplying column.
  - Skipping a zero in an exchange chain.
  - Using an original digit after regrouping.
  - Misaligning places.
- **Retrying:** a retry keeps the correct work.
- **Method:** teach a consistent right-to-left method. A different valid exchange sequence is not a mathematical error.
- **Targeted practice:**
  - Skills: one exchange; multiple exchanges; across one zero; across consecutive zeros; four-digit regrouping; deciding whether to regroup; correcting mistakes.
  - Each has enough varied questions for repeated practice.
  - Targeted progress is saved apart from full-set progress.

## Test and results
- **The test:**
  - 15 questions, balanced, with at least eight four-digit problems.
  - It includes final answers, some explicit regrouping-step questions, a regrouping decision and error analysis, with both single-zero and consecutive-zero cases.
- **During the test:**
  - No hints and no correctness feedback before submission.
  - No automatic exchanges or correct annotations.
  - Optional annotations are allowed, with no signal about whether they are right.
  - Entered work is kept across navigation.
- **Grading:**
  - Final answers are graded independently of optional annotations; omitted annotations never invalidate a correct final answer.
  - Final-answer accuracy is reported separately from regrouping-step performance.
- **Reporting:**
  - Never diagnose a specific misconception from an incorrect final answer alone.
  - Guided completion is kept distinct from independent assessment results.
  - Use the existing scoring conventions.

## Parent Guide
Covers:
- the goal and the meaning of regrouping;
- the learning progression;
- a worked four-digit example;
- exchanges across zeros;
- common mistakes;
- parent prompts that help without giving answers;
- a skill checklist;
- how to use results and targeted practice.

## Reusable component
- **Scope:** a small reusable subtraction component, not a general-purpose engine.
- **Four separate parts:** pure math logic, the vertical visual workspace, teaching content and configuration, and the Mathbook integration.
- **Math rules:**
  - Core math never depends on displayed text or crossed-out digits.
  - Original operands, current place amounts, student entries and annotation history are tracked separately.
  - Every valid adjacent exchange preserves the represented value, and temporary amounts above 9 are supported.
- **Independence:** no dependence on Mathbook routes, lesson ids, globals or storage keys. Follow the existing module conventions; no framework.
- **Documented interface:**
  - supply operands and ranges;
  - select demonstration, guided, independent or test mode;
  - configure hints and feedback;
  - export and restore state;
  - answer, step, hint, completion and reset events;
  - host styling;
  - destroying an instance.
- **Instances:** two independent instances work side by side, with no id or event conflicts.
- **Persistence:** the host owns it. A Mathbook adapter keeps namespaced, versioned records.

## Persistence and accessibility
- **Saving:**
  - Save the activity, question, setup choices, answers, annotations, hint state and results as appropriate.
  - Refresh and navigation keep work.
  - Restored data is validated by structure and values, not just "valid JSON".
  - Malformed records are recovered safely, without blanking the page or erasing unrelated progress.
- **Reset:** reset only this section, with confirmation.
- **Input:**
  - Whole-number and digit inputs are validated consistently.
  - Empty input never counts as zero.
  - Optional leading zeros are accepted but not required.
- **Accessibility:**
  - Descriptive input labels, keyboard and touch support, visible focus, and announcements for important changes.
  - Annotation states are never distinguished by color alone.

## Portability handoff
- **Demo page:** a minimal developer demonstration page, outside the child menu, that works without Mathbook navigation or persistence.
- **Verify:**
  - independent mounting;
  - two simultaneous instances;
  - state export and restoration;
  - listeners removed on destroy;
  - host theme changes without broken alignment;
  - test mode cannot expose practice hints.
- **Integration README** covering:
  - required files and dependencies;
  - initialization;
  - events and state format;
  - styling options;
  - supported ranges and difficulty rules;
  - what the host must provide (storage and navigation).
- **Repository:** commit the reusable code and docs, and list their paths in the final report.

## Review and device checks
- **Math/testing agent:**
  - Independently verify the fixed examples and generated cases, never using only the functions under test to compute expected results.
  - Check that every exchange preserves value, supplying columns decrease correctly, zero chains work, and answers pass independent subtraction and addition checks.
  - Verify difficulty classification, grading, hints, assessment integrity, progress, reset, malformed saves and the reusable component's behavior.
- **Design agent:**
  - Inspect real rendered screens: simple and hard examples, guided work, independent practice, the test and results.
  - Devices: 320 and 390 px phones, 768×1024 and 1024×768 tablets, 1366×768 and 1920×1080 desktops, and 200% zoom.
- **Layout requirements:**
  - Digits and annotations stay aligned, legible, unclipped and usable, with no unintended sideways scrolling and comfortable tap targets.
  - On desktop the active problem and the main answer/check controls are visible without unnecessary scrolling.
  - Longer instruction is split into wizard steps.

## Completion process
1. Source and component inspection, and a saved checkpoint.
2. Design and teaching outline.
3. One complete interactive vertical example.
4. Full Learn and practice.
5. Test, results and persistence.
6. Agent review, fixes and re-verification.
7. Relevant tests and necessary shared regressions.
8. Commit, push, publish and live verification.

Save durable checkpoints at milestones, and don't rerun unchanged tests without a reason. Resolve routine decisions without asking; if genuinely blocked, record the blocker and continue other work. Verify the deployed version and main student flows, update STATUS.md, and commit both agent review reports.

**Final report:** the live link, teaching/practice coverage, test results, agent findings and fixes, portability documentation and remaining limitations.

Do not redesign other lessons or add other supplemental topics.
