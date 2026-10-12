# Number Words Phases 2 and 3 + landing page: decision record

Owner request 2026-10-11: complete Phase 2 (11–20) and Phase 3 (tens and two-digit numbers, 20–99), and simplify the
Number Words landing page. One builder (coordinator) and one independent reviewer. Phases 1 and 4, their saved
progress, and the math lessons are not changed.

## Decisions

1. **Template.** Phases 2 and 3 run on the shared lesson engine (`assets/js/lesson-app.js`) like Phase 4 — Parent
   Guide, Learn (Example → Your Turn), Practice (Practice Together, On My Own, Practice One Skill), Take a Test,
   My Results — with Number Words branding (`brand`). Content: `number-words/phase-2/lesson.js`,
   `number-words/phase-3/lesson.js`; shared 0–99 word logic: `number-words/words99.js` (`Mathbook.nw99`).
2. **Help mode (engine opt-in `help: true`).** Lessons without the flag are unchanged. With it:
   - Every Learn Your Turn, Practice Together and On My Own question shows **Check Answer · 💡 Hint · Show Me** next
     to the answer.
   - Hint shows the question's clue (never the full answer). Show Me shows the answer, fills it in, explains it, and
     the child may go on; the item is recorded as **completed with help** (Learn `helped`, Practice Together
     `helped`, On My Own `helped` ids) and never counts as independently correct or toward mastery.
   - After a wrong answer: Not quite + specific feedback, then **Try Again · Get a Hint · Show Me How**. Learn keeps
     the child's answer; nothing auto-reveals after two misses (no dead end: Show Me always unlocks Next).
   - On My Own scores count only answers the child got without Show Me; Practice My Misses includes the shown ones.
   - Feedback comes from the lesson's `tip(q, r)` when it has one (spelling-aware for Phases 2–3).
   - My Results adds **Results by skill** (grouped: Number recognition · Spelling) and a line for Learn/Practice
     Together completed with help (not part of any test score).
   - Saved records are checked on load (shape and values); a malformed record is replaced by a fresh one for that
     key only, so the screen never blanks and other progress is kept.
   - Tests are unchanged: no hints, no Show Me, no feedback before Finish; worked answers in My Results afterwards.
3. **Storage.** `mathbook:v2:number-words:phase-2:*` and `…:phase-3:*` (new keys, no migration). Reset in a phase's
   Parent Guide clears only that prefix.
4. **Grading.** Numerals: `pv.parseWholeNumber` (empty is unanswered, never 0). Spelling: `pv.checkWords` — capitals,
   surrounding spaces, a hyphen or a space between tens and ones are accepted; every letter must be right; a missing
   part or a different number is wrong. Feedback says "check the spelling of …" when the intended number is clear,
   and names the value only when the words spell a different number.
5. **Skills.** match (numeral ↔ word), read (word → numeral) = Number recognition; spell (numeral → word), tricky
   (complete a tricky spelling: the missing letter), fix (correct a misspelled word, clearly labelled as a mistake)
   = Spelling.
6. **Landing page.** Four compact cards (Numbers 0–10, 11–20, 20–99, 100–9,999): title, one line, Open. Two columns
   from 700 px, one on phones. "How each phase works" and the spelling convention move to `number-words/parent/`
   behind a Parent Guide link; spelling explanations live in each phase's Learn.
