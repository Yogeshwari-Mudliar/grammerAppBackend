export interface ParsedQuizOption {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuizQuestion {
  question: string;
  options: ParsedQuizOption[];
  explanation: string;
}

export interface ParsedSection {
  heading: string;
  content: string;

  isQuiz: boolean;
  sectionType: string;

  orderNo: number;

  quizData?: {
    questions: ParsedQuizQuestion[];
  };
}


// ============================================================
// MAIN PARSER
// ============================================================

export function buildSections(
  text: string,
): ParsedSection[] {

  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText =
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

  const blocks =
    splitIntoSections(normalizedText);

  return blocks.map(
    (block, index) => {

      const heading =
        block.heading.trim();

      const rawContent =
        block.content.trim();

      const isQuiz =
        isQuizHeading(heading) ||
        looksLikeQuiz(rawContent);

      // Quiz raw text database content mein save nahi hoga.
      // Parsed questions quizData mein jayenge.
      const content =
        isQuiz
          ? ''
          : rawContent;

      return {
        heading,

        content,

        isQuiz,

        sectionType:
          isQuiz
            ? 'QUIZ'
            : 'TEXT',

        orderNo:
          index + 1,

        ...(isQuiz
          ? {
              quizData:
                parseQuiz(rawContent),
            }
          : {}),
      };
    },
  );
}


// ============================================================
// SECTION SPLITTER
// ============================================================

function splitIntoSections(
  text: string,
): {
  heading: string;
  content: string;
}[] {

  const lines =
    text.split('\n');

  const blocks: {
    heading: string;
    content: string;
  }[] = [];

  let currentHeading = '';

  let currentContent: string[] = [];

  for (const rawLine of lines) {

    const line =
      rawLine.trim();

    // ---------------------------------------------
    // BLANK LINE
    // ---------------------------------------------

    if (!line) {

      if (currentContent.length > 0) {
        currentContent.push('');
      }

      continue;
    }


    // ---------------------------------------------
    // SECTION HEADING
    // ---------------------------------------------

    if (isSectionHeading(line)) {

      // Save previous section
      if (currentHeading) {

        blocks.push({
          heading:
            currentHeading,

          content:
            currentContent
              .join('\n')
              .trim(),
        });
      }

      currentHeading =
        cleanHeading(line);

      currentContent = [];

      continue;
    }


    // ---------------------------------------------
    // NORMAL CONTENT
    // ---------------------------------------------

    currentContent.push(rawLine);
  }


  // ---------------------------------------------
  // SAVE LAST SECTION
  // ---------------------------------------------

  if (currentHeading) {

    blocks.push({
      heading:
        currentHeading,

      content:
        currentContent
          .join('\n')
          .trim(),
    });
  }


  // ---------------------------------------------
  // FALLBACK
  // ---------------------------------------------

  if (blocks.length === 0) {

    return [
      {
        heading: 'Lesson',
        content: text.trim(),
      },
    ];
  }

  return blocks;
}


// ============================================================
// SECTION HEADING DETECTION
//
// IMPORTANT:
// Your document format is fixed.
//
// Numbered lines like:
//
// 1. I could swim.
// 2. She could sing.
//
// are EXAMPLES, NOT section headings.
//
// Therefore we DO NOT use a generic rule like:
// /^\d+\./
//
// ============================================================

function isSectionHeading(
  line: string,
): boolean {

  const value =
    line
      .trim()
      .replace(/^#+\s*/, '')
      .trim();

  if (!value) {
    return false;
  }


  // ---------------------------------------------
  // MARKDOWN HEADINGS
  // Example:
  // # Introduction
  // ## Structure of Could
  // ---------------------------------------------

  if (/^#{1,6}\s+/.test(line)) {
    return true;
  }


  // ---------------------------------------------
  // QUIZ
  // ---------------------------------------------

  if (/^quiz$/i.test(value)) {
    return true;
  }


  // ---------------------------------------------
  // INTRODUCTION
  // ---------------------------------------------

  if (/^introduction$/i.test(value)) {
    return true;
  }


  // ---------------------------------------------
  // USE HEADINGS
  //
  // Use 1: Past Ability
  // Use 2: Polite Request
  // Use 3: Suggestion
  // Use 4: Possibility in the Past
  //
  // Also supports:
  // Use 1 - Past Ability
  // Use 1. Past Ability
  // ---------------------------------------------

  if (
    /^use\s+\d+\s*[:.\-]\s*.+$/i.test(value)
  ) {
    return true;
  }


  // ---------------------------------------------
  // STRUCTURE HEADINGS
  //
  // Structure of COULD
  // Structure: Could Have
  // Structure - Could Have
  // ---------------------------------------------

  if (
    /^structure\s+(of\s+.+)$/i.test(value)
  ) {
    return true;
  }

  if (
    /^structure\s*[:\-]\s*.+$/i.test(value)
  ) {
    return true;
  }


  // ---------------------------------------------
  // NEGATIVE FORM
  // ---------------------------------------------

  if (/^negative\s+form$/i.test(value)) {
    return true;
  }


  // ---------------------------------------------
  // OPTIONAL COMMON FIXED-FORMAT HEADINGS
  //
  // These allow future grammar lessons to use
  // similar standard lesson structures.
  // ---------------------------------------------

  if (
    /^(affirmative\s+form|interrogative\s+form|question\s+form)$/i.test(
      value,
    )
  ) {
    return true;
  }

  if (
    /^(usage|uses|examples|summary|practice|activities)$/i.test(
      value,
    )
  ) {
    return true;
  }


  return false;
}


// ============================================================
// CLEAN HEADING
//
// We do NOT remove "1." generically because numbered
// example lines are not headings.
//
// ============================================================

function cleanHeading(
  line: string,
): string {

  return line
    .replace(/^#+\s*/, '')
    .trim();
}


// ============================================================
// QUIZ HEADING
// ============================================================

function isQuizHeading(
  heading: string,
): boolean {

  return /^quiz$/i.test(
    heading.trim(),
  );
}


// ============================================================
// QUIZ CONTENT DETECTION
//
// This is a fallback.
// Main detection is heading === Quiz.
//
// ============================================================

function looksLikeQuiz(
  content: string,
): boolean {

  if (!content) {
    return false;
  }

  const hasQuestion =
    /Question\s+\d+\s*:/i.test(content);

  return hasQuestion;
}


// ============================================================
// QUIZ PARSER
// ============================================================

function parseQuiz(
  content: string,
): {
  questions: ParsedQuizQuestion[];
} {

  if (!content) {
    return {
      questions: [],
    };
  }

  const questions: ParsedQuizQuestion[] =
    [];

  const lines =
    content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim());


  // ---------------------------------------------
  // FIND:
  //
  // Question 1:
  // Question 2:
  // Question 3:
  // ---------------------------------------------

  const questionIndexes: number[] =
    [];

  lines.forEach(
    (line, index) => {

      if (
        /^Question\s+\d+\s*:/i.test(line)
      ) {
        questionIndexes.push(index);
      }
    },
  );


  // ---------------------------------------------
  // PARSE EACH QUESTION BLOCK
  // ---------------------------------------------

  for (
    let i = 0;
    i < questionIndexes.length;
    i++
  ) {

    const start =
      questionIndexes[i];

    const end =
      questionIndexes[i + 1] ??
      lines.length;

    const block =
      lines
        .slice(start, end)
        .join('\n')
        .trim();

    const question =
      parseQuestionBlock(block);

    if (question) {
      questions.push(question);
    }
  }

  return {
    questions,
  };
}


// ============================================================
// SINGLE QUESTION PARSER
// ============================================================

function parseQuestionBlock(
  block: string,
): ParsedQuizQuestion | null {

  if (!block) {
    return null;
  }

  const lines =
    block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);


  // ---------------------------------------------
  // FIND QUESTION HEADER
  // ---------------------------------------------

  const questionIndex =
    lines.findIndex(
      line =>
        /^Question\s+\d+\s*:/i.test(line),
    );

  if (questionIndex === -1) {
    return null;
  }


  // ==========================================================
  // QUESTION TEXT
  //
  // Supports:
  //
  // Question 1: What is the correct answer?
  //
  // AND:
  //
  // Question 1:
  // What is the correct answer?
  //
  // Also supports questions without options,
  // such as "Make your own sentence..."
  // ==========================================================

  const questionHeader =
    lines[questionIndex];

  let questionText =
    questionHeader
      .replace(
        /^Question\s+\d+\s*:\s*/i,
        '',
      )
      .trim();


  if (!questionText) {

    const questionLines: string[] =
      [];

    for (
      let i = questionIndex + 1;
      i < lines.length;
      i++
    ) {

      const line =
        lines[i];


      // Stop when options start
      if (/^[A-D][.)]\s+/i.test(line)) {
        break;
      }


      // Stop at Correct answer
      if (
        /^Correct\s+answer\s*:/i.test(line)
      ) {
        break;
      }


      // Stop at Explanation
      if (
        /^Explanation\s*:/i.test(line)
      ) {
        break;
      }


      // Stop at Sample answer
      //
      // Sample answer should NOT become
      // part of the question text.
      if (
        /^Sample\s+answer\s*:/i.test(line)
      ) {
        break;
      }


      questionLines.push(line);
    }

    questionText =
      questionLines
        .join(' ')
        .trim();
  }


  // ==========================================================
  // OPTIONS
  // ==========================================================

  const options: ParsedQuizOption[] =
    [];

  const optionRegex =
    /^([A-D])[.)]\s*(.+)$/i;


  let correctLetter:
    string | null = null;

  let correctAnswerText:
    string | null = null;

  let explanation =
    '';

  let explanationStarted =
    false;


  // ---------------------------------------------
  // PARSE REMAINING LINES
  // ---------------------------------------------

  for (
    let i = questionIndex + 1;
    i < lines.length;
    i++
  ) {

    const line =
      lines[i];


    // -------------------------------------------
    // OPTION
    // -------------------------------------------

    const optionMatch =
      line.match(optionRegex);

    if (optionMatch) {

      options.push({
        text:
          optionMatch[2].trim(),

        isCorrect:
          false,
      });

      continue;
    }


    // -------------------------------------------
    // CORRECT ANSWER
    // -------------------------------------------

    const correctMatch =
      line.match(
        /^Correct\s+answer\s*:\s*(.+)$/i,
      );

    if (correctMatch) {

      const answer =
        correctMatch[1].trim();

      correctAnswerText =
        answer;


      // Supports:
      //
      // B
      // B.
      // B) could
      // B. could
      // -----------------------------------------

      const letterMatch =
        answer.match(
          /^([A-D])(?:[.)]|\s|$)/i,
        );

      if (letterMatch) {

        correctLetter =
          letterMatch[1]
            .toUpperCase();

      } else {

        // Correct answer supplied directly as text
        const answerOption =
          options.find(
            option =>
              option.text
                .trim()
                .toLowerCase() ===
              answer
                .trim()
                .toLowerCase(),
          );

        if (answerOption) {

          answerOption.isCorrect =
            true;
        }
      }

      continue;
    }


    // -------------------------------------------
    // EXPLANATION
    // -------------------------------------------

    const explanationMatch =
      line.match(
        /^Explanation\s*:\s*(.*)$/i,
      );

    if (explanationMatch) {

      explanationStarted =
        true;

      explanation =
        explanationMatch[1]
          .trim();

      continue;
    }


    // -------------------------------------------
    // CONTINUE MULTI-LINE EXPLANATION
    // -------------------------------------------

    if (explanationStarted) {

      explanation =
        explanation
          ? `${explanation} ${line}`
          : line;
    }
  }


  // ==========================================================
  // MARK CORRECT OPTION USING LETTER
  // ==========================================================

  if (correctLetter) {

    const correctIndex =
      correctLetter.charCodeAt(0) -
      'A'.charCodeAt(0);

    if (options[correctIndex]) {

      options[
        correctIndex
      ].isCorrect = true;
    }
  }


  // ==========================================================
  // FALLBACK:
  // MATCH CORRECT ANSWER WITH OPTION TEXT
  // ==========================================================

  if (
    correctAnswerText &&
    !options.some(
      option => option.isCorrect,
    )
  ) {

    const cleanedAnswer =
      correctAnswerText
        .replace(
          /^([A-D])[.)]\s*/i,
          '',
        )
        .trim()
        .toLowerCase();

    const matchingOption =
      options.find(
        option =>
          option.text
            .trim()
            .toLowerCase() ===
          cleanedAnswer,
      );

    if (matchingOption) {
      matchingOption.isCorrect = true;
    }
  }


  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    question: questionText,
    options,
    explanation,
  };
}