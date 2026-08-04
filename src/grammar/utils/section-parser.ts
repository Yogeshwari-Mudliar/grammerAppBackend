export interface ParsedSection {
  heading: string;
  content: string;
  orderNo: number;
}

export function buildSections(document: string): ParsedSection[] {
  const blocks = document
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return {
      heading: lines[0] || `Section ${index + 1}`,
      content: lines.slice(1).join('\n'),
      orderNo: index + 1,
    };
  });
}