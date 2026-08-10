export interface ParsedSection {
  heading: string;
  content: string;
  orderNo: number;
  isQuiz: boolean;
  sectionType: 'CONTENT' | 'QUIZ';
}

// =====================================================
// CONSTANTS
// =====================================================

const QUIZ_HEADING = 'quiz';

const EXAMPLES_HEADING = /^examples?\s*:?\s*$/i;

const ANSWER_HEADING = /^correct\s+answer\s*:?\s*$/i;

const IGNORE_HEADINGS = [
  'lesson title',
  'subject / grade level / course name',
];

// =====================================================
// NORMALIZE
// =====================================================

function normalizeLine(line: string): string {
  return line
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// =====================================================
// HELPERS
// =====================================================

function isQuizHeading(line: string): boolean {
  return QUIZ_HEADING === line.toLowerCase().trim();
}

function isExamplesHeading(line: string): boolean {
  return EXAMPLES_HEADING.test(line.trim());
}

function isAnswerHeading(line: string): boolean {
  return ANSWER_HEADING.test(line.trim());
}

function isIgnoredHeading(line: string): boolean {
  const value = line.toLowerCase().trim();

  return IGNORE_HEADINGS.some(
    heading => value === heading,
  );
}

// =====================================================
// DETECT METADATA
// =====================================================

function isMetadataLine(
  line: string,
  index: number,
): boolean {
  const value = line.trim();

  // First two lines of the template are metadata
  if (index === 0 || index === 1) {
    return true;
  }

  return isIgnoredHeading(value);
}

// =====================================================
// BUILD CONTENT
// =====================================================

function joinLines(lines: string[]): string {
  return lines
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n');
}

// =====================================================
// BUILD SECTIONS
// =====================================================

export function buildSections(
  document: string,
): ParsedSection[] {

  const normalized = normalizeText(document);

  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const sections: ParsedSection[] = [];

  let currentSection: ParsedSection | null = null;

  let insideQuiz = false;

  // ===================================================
  // PROCESS LINES
  // ===================================================

  for (let i = 0; i < lines.length; i++) {

    const line = lines[i];

    // -----------------------------------------------
    // Ignore document metadata
    // -----------------------------------------------

    if (!sections.length && !currentSection) {

      if (isMetadataLine(line, i)) {
        continue;
      }

    }

    // -----------------------------------------------
    // QUIZ
    // -----------------------------------------------

    if (isQuizHeading(line)) {

      // Save previous content section
      if (currentSection) {

        sections.push(currentSection);

        currentSection = null;
      }

      insideQuiz = true;

      currentSection = {
        heading: 'Quiz',
        content: '',
        orderNo: sections.length + 1,
        isQuiz: true,
        sectionType: 'QUIZ',
      };

      continue;
    }

    // -----------------------------------------------
    // Everything after Quiz belongs to Quiz
    // -----------------------------------------------

    if (insideQuiz) {

      if (currentSection) {

        currentSection.content =
          appendContent(
            currentSection.content,
            line,
          );
      }

      continue;
    }

    // -----------------------------------------------
    // EXAMPLES
    // -----------------------------------------------

    if (isExamplesHeading(line)) {

      if (currentSection) {

        currentSection.content =
          appendContent(
            currentSection.content,
            line,
          );
      }

      continue;
    }

    // -----------------------------------------------
    // CORRECT ANSWER
    // -----------------------------------------------

    if (isAnswerHeading(line)) {

      if (currentSection) {

        currentSection.content =
          appendContent(
            currentSection.content,
            line,
          );
      }

      continue;
    }

    // -----------------------------------------------
    // FIRST REAL HEADING
    // -----------------------------------------------

    if (!currentSection) {

      currentSection = {
        heading: line,
        content: '',
        orderNo: sections.length + 1,
        isQuiz: false,
        sectionType: 'CONTENT',
      };

      continue;
    }

    // -----------------------------------------------
    // NEW TOPIC
    //
    // A line becomes a new topic when it is not:
    // - Examples
    // - Quiz
    // - Correct answer
    //
    // The template expects topic → content → examples
    // -----------------------------------------------

    if (isLikelyHeading(line, lines, i)) {

      sections.push(currentSection);

      currentSection = {
        heading: line,
        content: '',
        orderNo: sections.length + 1,
        isQuiz: false,
        sectionType: 'CONTENT',
      };

      continue;
    }

    // -----------------------------------------------
    // NORMAL CONTENT
    // -----------------------------------------------

    currentSection.content =
      appendContent(
        currentSection.content,
        line,
      );
  }

  // ===================================================
  // SAVE LAST SECTION
  // ===================================================

  if (currentSection) {
    sections.push(currentSection);
  }

  // ===================================================
  // CLEAN SECTIONS
  // ===================================================

  return sections
    .map((section, index) => ({
      ...section,
      orderNo: index + 1,
      content: section.content.trim(),
    }))
    .filter(section => {
      return (
        section.heading.trim().length > 0 ||
        section.content.trim().length > 0
      );
    });
}

// =====================================================
// APPEND CONTENT
// =====================================================

function appendContent(
  existing: string,
  line: string,
): string {

  if (!existing) {
    return line;
  }

  return `${existing}\n${line}`;
}

// =====================================================
// HEADING DETECTION
// =====================================================

function isLikelyHeading(
  line: string,
  lines: string[],
  index: number,
): boolean {

  const value = line.trim();

  if (!value) {
    return false;
  }

  // ------------------------------------------------
  // NEVER HEADING
  // ------------------------------------------------

  // Numbered content
  // 1. It might rain.
  // 2. She might come later.
  if (/^\d+[.)]\s+/.test(value)) {
    return false;
  }

  // Alphabetic options
  // (a) ...
  // (b) ...
  // A. ...
  // B. ...
  if (
    /^\([a-d]\)\s+/i.test(value) ||
    /^[A-D][.)]\s+/i.test(value)
  ) {
    return false;
  }

  // Answer / examples stay inside current section
  if (isAnswerHeading(value)) {
    return false;
  }

  if (isExamplesHeading(value)) {
    return false;
  }

  // ------------------------------------------------
  // SENTENCE = CONTENT
  // ------------------------------------------------

  if (/[.!?]$/.test(value)) {
    return false;
  }

  // ------------------------------------------------
  // STRUCTURE / DEFINITION LINES = CONTENT
  // ------------------------------------------------
  
  const lower = value.toLowerCase();

  const contentPatterns = [
    /^subject\s*\+/i,
    /^negative\s+structure\s*:/i,
    /^positive\s+structure\s*:/i,
    /^question\s+structure\s*:/i,
    /^structure\s*:/i,
    /^might\s+is\s+/i,
    /^might\s+shows?\s+/i,
    /^might\s+can\s+/i,
    /^it\s+is\s+/i,
    /^it\s+can\s+/i,
    /^this\s+is\s+/i,
    /^this\s+means\s+/i,
    /^used\s+to\s+/i,
    /^used\s+for\s+/i,
    /^can\s+be\s+used\s+to\s+/i,
  ];

  if (
    contentPatterns.some(pattern =>
      pattern.test(value)
    )
  ) {
    return false;
  }

  // ------------------------------------------------
  // QUESTION / INSTRUCTION = CONTENT
  // ------------------------------------------------

  if (
    /^make\s+/i.test(value) ||
    /^choose\s+/i.test(value) ||
    /^select\s+/i.test(value) ||
    /^fill\s+/i.test(value) ||
    /^complete\s+/i.test(value) ||
    /^write\s+/i.test(value)
  ) {
    return false;
  }

  // ------------------------------------------------
  // LONG SENTENCES = CONTENT
  // ------------------------------------------------

  if (value.length > 100) {
    return false;
  }

  const words = value.split(/\s+/);

  if (words.length > 12) {
    return false;
  }

  // ------------------------------------------------
  // KNOWN TOPIC HEADINGS
  // ------------------------------------------------

  // Explicitly recognize common grammar-topic headings.
  if (
    /^(introduction|conclusion)$/i.test(value)
  ) {
    return true;
  }

  if (
    /^structure\s+of\s+/i.test(value)
  ) {
    return true;
  }

  if (
    /^use\s+\d+\s*:/i.test(value)
  ) {
    return true;
  }

  if (
    /^(negative\s+form|positive\s+form|question\s+form)$/i.test(value)
  ) {
    return true;
  }

  if (
    /^(future\s+possibility|more\s+examples.*|more\s+suggestion.*)$/i.test(value)
  ) {
    return true;
  }

  // ------------------------------------------------
  // DEFAULT
  // ------------------------------------------------

  return true;
}