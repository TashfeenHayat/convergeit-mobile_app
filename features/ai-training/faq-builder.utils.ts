export type FaqBuilderRow = {
  id: string;
  question: string;
  answer: string;
};

export function createEmptyFaqRow(): FaqBuilderRow {
  return {
    id: `faq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    question: "",
    answer: "",
  };
}

export function compileFaqRowsToSourceRef(rows: FaqBuilderRow[]): string {
  return rows
    .filter((r) => r.question.trim() && r.answer.trim())
    .map((r) => `Q: ${r.question.trim()}\nA: ${r.answer.trim()}`)
    .join("\n\n");
}

export function countValidFaqRows(rows: FaqBuilderRow[]): number {
  return rows.filter((r) => r.question.trim() && r.answer.trim()).length;
}
