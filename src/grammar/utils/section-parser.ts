export interface ParsedSection {
  heading: string;
  content: string;
  orderNo: number;

  isQuiz: boolean;
  sectionType: 'CONTENT' | 'QUIZ';
}

/**
 * Detect quiz headings
 */
function isQuizHeading(text: string): boolean {
  const value = text.toLowerCase();

  return [
    'quiz',
    'activity',
    'exercise',
    'practice',
    'fill in the blanks',
    'choose the correct',
    'match the following',
    'true or false',
    'think and answer',
    'test yourself',
    'mcq',
    'multiple choice',
  ].some(keyword => value.includes(keyword));
}

/**
 * Detect quiz content even if heading is normal
 */
function isQuizContent(text: string): boolean {
  const value = text.toLowerCase();

  return (
    value.includes('correct answer') ||
    value.includes('fill in the blanks') ||
    value.includes('choose the correct') ||
    value.includes('true or false') ||
    value.includes('match the following') ||
    value.includes('tick the correct') ||
    value.includes('select the correct') ||
    value.includes('multiple choice') ||
    /\b[a-d]\)/i.test(value) ||
    /\b[a-d]\./i.test(value)
  );
}

/**
 * Ignore page numbers / slide numbers
 */
function isPageMarker(text: string): boolean {
  const value = text.trim().toLowerCase();

  return (
    /^--\s*\d+\s*of\s*\d+\s*--$/.test(value) ||
    /^page\s*\d+$/i.test(value) ||
    /^slide\s*\d+$/i.test(value)
  );
}

export function buildSections(document: string): ParsedSection[] {

  const blocks = document
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean)
    .filter(block => {
      const firstLine = block.split('\n')[0].trim();
      return !isPageMarker(firstLine);
    });

  return blocks.map((block, index) => {

    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const heading =
      lines[0] || `Section ${index + 1}`;

    const content =
      lines.slice(1).join('\n');

    const quiz =
      isQuizHeading(heading) ||
      isQuizContent(content);

    return {
      heading,
      content,
      orderNo: index + 1,

      isQuiz: quiz,
      sectionType: quiz
        ? 'QUIZ'
        : 'CONTENT',
    };
  });
}