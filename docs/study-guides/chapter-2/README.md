# Chapter 2 Study Guides (Lessons 2-1 to 2-15)

These are short printable guides for home practice, one guide per lesson. Each guide has:

1. **Parent Learn** (1 page): the learning goal, words to know, how to teach the method, worked examples, and a skills checklist.
2. **Together and On My Own** (2–3 pages): guided questions (A–C) and independent questions (numbered), with name and date fields and room for handwritten work.
3. **Parent Answer Key** (1 page): an answer for every question, with explanations and guidance on what to accept.

The pages are US Letter, portrait, black and white. There is no cover page.

## Files

- `word/`: editable Word files (.docx)
- `pdf/`: print-ready PDFs, exported by Microsoft Word from the .docx files
- `Chapter-2-Study-Guides.zip`: all of the Word files and PDFs
- `source/`: the generator. `lessons/2-N.js` holds each lesson's content and answers, `build.js` is the layout engine, and `diagrams.js` draws the diagrams.

To regenerate the files (you need Node 18 or newer):

```
npm install docx@9 @resvg/resvg-js
node source/build.js            # all lessons, or: node source/build.js 2-7
```

## Completion checklist

| Lesson | Book pages | Pages | Book verified | Review | Rendered pages inspected |
|---|---|---|---|---|---|
| 2-1 Represent 4-Digit Numbers | 33–36 | 4 | ✅ | ✅ batch 1 | ✅ |
| 2-2 Round Multi-Digit Numbers (incl. Math Probe) | 37–42 | 4 | ✅ | ✅ batch 1 | ✅ |
| 2-3 Estimate Sums and Differences | 43–46 | 4 | ✅ | ✅ batch 1 | ✅ |
| 2-4 Use Addition Properties to Add | 47–50 | 4 | ✅ | ✅ batch 1 | ✅ |
| 2-5 Addition Patterns | 51–54 | 4 | ✅ | ✅ batch 2 | ✅ |
| 2-6 Use Partial Sums to Add | 55–58 | 5 | ✅ | ✅ batch 2 | ✅ |
| 2-7 Decompose to Subtract | 59–62 | 5 | ✅ | ✅ batch 2 | ✅ |
| 2-8 Adjust Numbers to Add or Subtract | 63–66 | 4 | ✅ | ✅ batch 2 | ✅ |
| 2-9 Use Addition to Subtract | 67–70 | 4 | ✅ | ✅ batch 3 | ✅ |
| 2-10 Fluently Add within 1,000 | 71–74 | 4 | ✅ | ✅ batch 3 | ✅ |
| 2-11 Fluently Subtract within 1,000 | 75–78 | 4 | ✅ | ✅ batch 3 | ✅ |
| 2-12 Solve Two-Step Problems | 79–82 | 5 | ✅ | ✅ batch 3 | ✅ |
| 2-13 Compare 4-Digit Numbers | 83–86 | 4 | ✅ | ✅ batch 4 | ✅ |
| 2-14 Fluently Add Multi-Digit Numbers | 87–90 | 4 | ✅ | ✅ batch 4 | ✅ |
| 2-15 Use an Algorithm to Subtract | 91–94 | 4 | ✅ | ✅ batch 4 | ✅ |

Notes:

- **Book verified:** for every lesson, the scanned Learn and On My Own pages were rendered and checked. The reviewed lesson specs (`docs/chapter-2/lessons/` on `claude/ch2-plan`) were used as a secondary reference.
- **Review:** a single independent reviewer recomputed every answer in four batches and found no math errors. All of its FIX items were applied.
- **Page counts:** 2-6, 2-7 and 2-12 have 5 pages because partial sums, decomposition trees and two-step bar diagrams need extra writing space. No guide has more than 5 pages.
- **Numbers:** all questions use original numbers. The book's examples appear only in the "Textbook" note on each Parent Learn page.
- **2-15:** this lesson has no regrouping, matching the book.
- **Not covered:** the Unit Review, Performance Task and Fluency pages (95–100) are outside the scope of lessons 2-1 to 2-15.
