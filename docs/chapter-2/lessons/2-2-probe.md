# Rounding extension — Math Probe "Rounding Numbers" (pp. 41–42)

Short diagnostic after Lesson 2-2. It checks one idea: which numbers round to a given ten or hundred, and why. It targets three misconceptions: looking at the wrong digit, rounding halfway numbers down, and choosing numbers by their first digit instead of by closeness.

## Recommendation: extend Lesson 2-2 (no new lesson)

Add it to 2-2 as:
1. **A second On My Own set** in `bankSets`: `{ id: 's2', title: 'Rounding Check-Up', blurb: 'Choose every number that rounds to a target, then tell how you decided.' }` with practice items PR1–PR4 (below). Practice Together does not need them, but they may also be added to `guided` with hints.
2. **A second test** in `tests`: `checkup: { id: 'checkup', title: 'Rounding Check-Up', questions: 4 }` with items TR1–TR4 (below), using different numbers. 2-1 already has two tests (`math`, `vocab`), so the engine supports this.
3. The book's "Reflect On Your Learning" self-rating (I am confused / I'm still learning / I understand / I can teach someone else) is **not graded**. Put it on the Parent Guide as a question to ask after the Check-Up. No new interaction is needed.

Skills: reuse `select` for the select-all parts and add one skill key, `probe: 'Deciding which numbers round to an amount'`, for the reasoning choices. The Results screen then shows probe misses separately.

## 1. Source pages

| Page | Content |
|---|---|
| 41 | Math Probe "Rounding Numbers". "Circle all correct answers." (1) Rounding to the nearest 10, which numbers round to 630? a 632, b 638, c 627, d 625, e 623, f 635, g 534, h 529. Space to "Explain your choices." |
| 42 | (2) Rounding to the nearest 100, which numbers round to 900? a 956, b 871, c 943, d 839, e 962, f 819, g 988, h 925. "Explain your choices." Reflect On Your Learning: four-point self-rating scale. |

Book answers (recomputed): (1) 632, 627, 625. Not 638 (640), 623 (620), 635 (640, halfway rounds up), 534 (530), 529 (530). (2) 871, 943, 925. Not 956, 962, 988 (all round up to 1,000), 839 (800), 819 (800).

How the distractors work: 534 and 529 have the "3" in the tens place or round to "_30" but are in the wrong hundred. 956, 962 and 988 start with 9 but round up to 1,000. 871 starts with 8 but rounds up to 900. 635 tests the halfway rule. 625 tests that halfway rounds **up** into the target.

## 2. Goals and prerequisites
- Goal: find **every** number that rounds to a given ten or hundred, and explain the choice using closeness (the range of numbers) rather than the first digit.
- Prerequisite: Lesson 2-2 Learn steps 1–4.

## 3. Vocabulary
No new words. Reuse: round, nearest, halfway point.

## 4. Methods
No new method. Two ways to decide, both from 2-2:
- **Range:** the numbers that round to 480 (nearest ten) are 475 to 484. The numbers that round to 700 (nearest hundred) are 650 to 749.
- **Digit rule, one number at a time:** round each choice and keep the ones that land on the target.

## 5. Guided sequence
None. This is an assessment-style set. (Optional: one Parent Guide line, "Before you check each number, find the smallest and largest numbers that round to the target.")

## 6–7. Practice items (On My Own set "Rounding Check-Up")

Each item is `type: 'parts'` with a `multi` part (choose all) and a `choice` part (how did you decide). The book's written "explain your choices" becomes the structured reasoning choice. Both parts are auto-graded.

**PR1. Nearest ten → 480.** "You round to the nearest ten. Which numbers round to 480? Choose all."
- Choices: 483, 487, 476, 475, 474, 485, 384, 379
- Answer: **483, 476, 475**
- Check: 483 → 480 ✓; 487 → 490; 476 → 480 ✓; 475 → 480 ✓ (halfway, rounds up); 474 → 470; 485 → 490 (halfway, rounds up); 384 → 380; 379 → 380.
- Reasoning part, "How can you tell which numbers round to 480?"
  - ✓ "Numbers from 475 to 484 are closer to 480 (475 is halfway and rounds up)."
  - "Numbers with an 8 in the tens place round to 480."
  - "Numbers that end in 4 or 5 round to 480."
  - "Every number between 470 and 490 rounds to 480."
- Hint: "Find halfway on each side of 480: 475 and 485. Which numbers are between them?"
- Explanation: "Only numbers from 475 to 484 round to 480. 485 is halfway to 490, so it rounds up to 490. 384 and 379 are near 380, not 480."

**PR2. Nearest hundred → 700.** "You round to the nearest hundred. Which numbers round to 700? Choose all."
- Choices: 756, 681, 742, 627, 769, 609, 794, 715
- Answer: **681, 742, 715**
- Check: 756 → 800 (tens digit 5); 681 → 700 ✓; 742 → 700 ✓; 627 → 600; 769 → 800; 609 → 600; 794 → 800; 715 → 700 ✓.
- Reasoning part, "Lily says every number that starts with 7 rounds to 700. Is she right?"
  - ✓ "No. 756, 769 and 794 start with 7 but round up to 800, and 681 starts with 6 but rounds up to 700."
  - "Yes. The hundreds digit tells you the answer."
  - "No. Only numbers that end in 00 round to 700."
  - "Yes, but only if the ones digit is less than 5."
- Hint: "Look at the tens digit, not the first digit. Numbers from 650 to 749 round to 700."
- Explanation: "Numbers from 650 to 749 round to 700. 681 is past 650, so it rounds up to 700. 756, 769 and 794 are 750 or more, so they round to 800."

**PR3. Nearest ten → 90 (2-digit, amounts).** "Which of these round to about 90 (nearest ten)? Choose all." Context: stickers in bags.
- Choices: 86 stickers, 94 stickers, 95 stickers, 85 stickers, 89 stickers, 79 stickers
- Answer: **86, 94, 85, 89**
- Check: 86 → 90 ✓; 94 → 90 ✓; 95 → 100 (halfway, rounds up); 85 → 90 ✓ (halfway, rounds up); 89 → 90 ✓; 79 → 80.
- Reasoning part, "Why is 95 not one of them?"
  - ✓ "95 is exactly halfway between 90 and 100, and halfway rounds up to 100."
  - "95 is closer to 90."
  - "Its tens digit is 9, so it rounds down."
- Hint: "Halfway points: 85 and 95. Which way does halfway round?"

**PR4. Nearest hundred → 400 (spot the mistake).** "Max chose 450, 362, 418 and 309 as numbers that round to 400 (nearest hundred). Which of his choices are right? Choose all."
- Choices: 450, 362, 418, 309
- Answer: **362, 418**
- Check: 450 → 500 (halfway, rounds up); 362 → 400 ✓; 418 → 400 ✓; 309 → 300.
- Reasoning part, "What mistake did Max make?"
  - ✓ "He chose numbers that are not between 350 and 449. 450 rounds up to 500 and 309 rounds down to 300."
  - "He forgot that numbers starting with 3 always round to 300."
  - "He made no mistake."

## 8. Test items (Rounding Check-Up test; different numbers)

**TR1. Nearest ten → 260.** Choices: 263, 258, 255, 254, 266, 265, 163, 159. Answer: **263, 258, 255**. Check: 263 → 260 ✓; 258 → 260 ✓; 255 → 260 ✓ (halfway up); 254 → 250; 266 → 270; 265 → 270 (halfway up); 163 → 160; 159 → 160. Reasoning choice: ✓ "Numbers from 255 to 264 are closest to 260." / "Numbers with a 6 in the tens place." / "Numbers that end in 3, 5 or 8." / "Every number between 250 and 270."

**TR2. Nearest hundred → 400.** Choices: 438, 352, 449, 451, 467, 349, 486, 318. Answer: **438, 352, 449**. Check: 438 → 400 ✓; 352 → 400 ✓; 449 → 400 ✓; 451 → 500; 467 → 500; 349 → 300; 486 → 500; 318 → 300. Reasoning choice, "Ben says every number that starts with 4 rounds to 400": ✓ "No. 451, 467 and 486 start with 4 but round up to 500, and 352 starts with 3 but rounds up to 400." / "Yes. The hundreds digit tells you the answer." / "No. Only 400 itself rounds to 400." / "Yes, but only if the ones digit is less than 5."

**TR3. Nearest ten → 50 (2-digit).** Choices: 46, 55, 45, 54, 49, 44. Answer: **46, 45, 54, 49**. Check: 46 → 50 ✓; 55 → 60; 45 → 50 ✓ (halfway up); 54 → 50 ✓; 49 → 50 ✓; 44 → 40. Reasoning choice, "Why is 55 not one of them?": ✓ "55 is exactly halfway between 50 and 60, and halfway rounds up to 60." / "55 is closer to 50." / "Its tens digit is 5, so it rounds down."

**TR4. Nearest hundred → 800 (spot the mistake).** "Kara chose 850, 761, 829 and 708 as numbers that round to 800." Answer: **761, 829**. Check: 850 → 900 (halfway up); 761 → 800 ✓; 829 → 800 ✓; 708 → 700. Reasoning choice: ✓ "She chose numbers that are not between 750 and 849. 850 rounds up to 900 and 708 rounds down to 700." / "Numbers starting with 7 always round to 700." / "She made no mistake."

Grading: a select-all part is right only if exactly the correct set is chosen (existing `multi` behaviour). The explanation should list every choice with its rounded value and a ✓, like `selectQ` in 2-2.

## 9. Book problem coverage map

| Book | Covered by |
|---|---|
| Probe 1 (nearest 10 → 630, circle all, explain) | PR1, PR3; TR1, TR3 (multi + reasoning choice) |
| Probe 2 (nearest 100 → 900, circle all, explain) | PR2, PR4; TR2, TR4 |
| Reflect On Your Learning (self-rating) | Parent Guide question (ungraded) |

## 10. Common mistakes and coaching
- **Choosing by the first digit** ("starts with 7, so 700"). Ask: "Which digit do you look at for the nearest hundred?"
- **Missing the halfway numbers** (leaving out 475 or 85, or including 485 or 95). Ask: "Where are the two halfway points around the target?"
- **Choosing only one answer.** Remind: "Choose every one that works. There can be more than one."
- **Wrong hundred with the right tens** (384 for 480). Ask: "Is 384 close to 480?"

## 11. Parent Guide content (add to 2-2's Parent Guide)
- Goal: "Find every number that rounds to a target, and say why."
- Demonstrate: "To find what rounds to 480, find the halfway points 475 and 485. Numbers from 475 up to 484 round to 480."
- Ask: "What is the smallest number that rounds to it? The largest?"; "Does the first digit decide it?"; afterwards: "How do you feel about rounding: confused, still learning, I understand, or I can teach someone?"
- Checklist: chooses all correct numbers to the nearest 10 and 100, including halfway cases; explains using the range, not the first digit.

## 12. Answer key check
Every check above was recomputed with round-half-up: nearest ten = floor((n + 5) / 10) × 10, nearest hundred = floor((n + 50) / 100) × 100.
- PR1: 483 → 480, 487 → 490, 476 → 480, 475 → 480, 474 → 470, 485 → 490, 384 → 380, 379 → 380.
- PR2: 756 → 800, 681 → 700, 742 → 700, 627 → 600, 769 → 800, 609 → 600, 794 → 800, 715 → 700.
- PR3: 86 → 90, 94 → 90, 95 → 100, 85 → 90, 89 → 90, 79 → 80.
- PR4: 450 → 500, 362 → 400, 418 → 400, 309 → 300.
- TR1: 263 → 260, 258 → 260, 255 → 260, 254 → 250, 266 → 270, 265 → 270, 163 → 160, 159 → 160.
- TR2: 438 → 400, 352 → 400, 449 → 400, 451 → 500, 467 → 500, 349 → 300, 486 → 500, 318 → 300.
- TR3: 46 → 50, 55 → 60, 45 → 50, 54 → 50, 49 → 50, 44 → 40.
- TR4: 850 → 900, 761 → 800, 829 → 800, 708 → 700.
- Book probe: 632/627/625 → 630; 638/635 → 640; 623 → 620; 534/529 → 530. 871/943/925 → 900; 956/962/988 → 1,000; 839/819 → 800.

## 13. New interaction or model needed
None. Uses `parts` with `multi` and `choice`, a second entry in `bankSets`, and a second entry in `tests`.

## 14. Open questions / assumptions
- Assumed the Check-Up is a separate short test (4 items) rather than added to the 12-item Rounding Test, so the main test stays the same length. If the owner prefers one test, add TR1 and TR2 only (they cover both places).
- Should the home page "Continue" check count the new `s2` set and `checkup` test? Assumed yes (same storage key prefix).
