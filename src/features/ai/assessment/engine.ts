/**
 * Board-pattern engine for the Assessment Builder (design doc §2.3 format,
 * §4.2 Bloom distribution). PURE FUNCTIONS over PURE CONFIG TABLES — this is the
 * single place to change how papers are structured.
 *
 * TO ADD/EDIT A BOARD PATTERN: edit `SECTION_TEMPLATES` below. Each template
 * section has a marks weight (fraction of the paper) and marks-per-question; the
 * engine derives question counts to hit the requested total. No logic changes
 * needed elsewhere — the form, preview and generate request all read from here.
 */
import type { Board } from '@/features/ai/shared/curriculum';
import type { BloomLevel, Question, QuestionType } from './types';

interface SectionTemplate {
  id: string;
  title: string;
  type: QuestionType;
  marksEach: number;
  weight: number; // fraction of total marks (templates sum ~1.0)
}

// Per-board section templates. Weights are approximate; the engine rounds counts
// and corrects the largest section so the structure sums to the requested total.
const SECTION_TEMPLATES: Record<Board, SectionTemplate[]> = {
  CBSE: [
    { id: 'A', title: 'Multiple Choice Questions', type: 'MCQ', marksEach: 1, weight: 0.25 },
    { id: 'B', title: 'Very Short Answer', type: 'VSA', marksEach: 2, weight: 0.13 },
    { id: 'C', title: 'Short Answer', type: 'SA', marksEach: 3, weight: 0.22 },
    { id: 'D', title: 'Long Answer / Case Study', type: 'LA', marksEach: 5, weight: 0.25 },
    { id: 'E', title: 'Source / Map / Passage based', type: 'SourceBased', marksEach: 4, weight: 0.15 },
  ],
  ICSE: [
    { id: 'A', title: 'Short Answer (compulsory)', type: 'VSA', marksEach: 2, weight: 0.3 },
    { id: 'B', title: 'Structured Questions', type: 'SA', marksEach: 4, weight: 0.4 },
    { id: 'C', title: 'Long / Analytical Answers', type: 'LA', marksEach: 6, weight: 0.3 },
  ],
  IGCSE: [
    { id: 'A', title: 'Knowledge (AO1)', type: 'MCQ', marksEach: 1, weight: 0.3 },
    { id: 'B', title: 'Understanding (AO2)', type: 'SA', marksEach: 4, weight: 0.4 },
    { id: 'C', title: 'Analysis / Evaluation (AO3)', type: 'LA', marksEach: 6, weight: 0.3 },
  ],
  Cambridge: [
    { id: 'A', title: 'Structured Questions', type: 'SA', marksEach: 4, weight: 0.5 },
    { id: 'B', title: 'Extended Response', type: 'LA', marksEach: 8, weight: 0.5 },
  ],
  'State Board': [
    { id: 'A', title: 'Objective', type: 'MCQ', marksEach: 1, weight: 0.25 },
    { id: 'B', title: 'Short Answer', type: 'SA', marksEach: 3, weight: 0.4 },
    { id: 'C', title: 'Long Answer', type: 'LA', marksEach: 5, weight: 0.35 },
  ],
};

export interface PlannedSection {
  id: string;
  name: string; // "Section A"
  title: string;
  type: QuestionType;
  marksEach: number;
  count: number;
  marks: number; // marksEach * count
}

export interface SectionPlan {
  sections: PlannedSection[];
  computedTotal: number;
  matchesRequested: boolean;
}

/** Build the section structure for a board + total marks (reactive marks→counts). */
export function buildSectionPlan(board: Board, totalMarks: number): SectionPlan {
  const template = SECTION_TEMPLATES[board];
  const sections: PlannedSection[] = template.map((t) => {
    const target = totalMarks * t.weight;
    const count = Math.max(1, Math.round(target / t.marksEach));
    return {
      id: t.id,
      name: `Section ${t.id}`,
      title: t.title,
      type: t.type,
      marksEach: t.marksEach,
      count,
      marks: count * t.marksEach,
    };
  });

  // Correct the lowest-marksEach section so the structure sums to the request.
  let computed = sections.reduce((s, x) => s + x.marks, 0);
  const diff = totalMarks - computed;
  if (diff !== 0) {
    const adjustable = [...sections].sort((a, b) => a.marksEach - b.marksEach).find((s) => (diff % s.marksEach) === 0 || s.marksEach === 1);
    if (adjustable) {
      const delta = adjustable.marksEach === 1 ? diff : diff / adjustable.marksEach;
      const nextCount = adjustable.count + delta;
      if (nextCount >= 1) {
        adjustable.count = nextCount;
        adjustable.marks = adjustable.count * adjustable.marksEach;
      }
    }
    computed = sections.reduce((s, x) => s + x.marks, 0);
  }

  return { sections, computedTotal: computed, matchesRequested: computed === totalMarks };
}

/** The board's default question types (auto-selected on board change, §2.1). */
export function defaultQuestionTypes(board: Board): QuestionType[] {
  return Array.from(new Set(SECTION_TEMPLATES[board].map((s) => s.type)));
}

// Default Bloom distribution by assessment size (§4.2).
export interface BloomDistribution {
  rememberUnderstand: number;
  applyAnalyse: number;
  evaluateCreate: number;
}

export function bloomDistributionFor(totalMarks: number): BloomDistribution {
  if (totalMarks <= 30) return { rememberUnderstand: 50, applyAnalyse: 40, evaluateCreate: 10 };
  if (totalMarks <= 50) return { rememberUnderstand: 40, applyAnalyse: 45, evaluateCreate: 15 };
  if (totalMarks <= 80) return { rememberUnderstand: 35, applyAnalyse: 45, evaluateCreate: 20 };
  return { rememberUnderstand: 30, applyAnalyse: 45, evaluateCreate: 25 };
}

// ---------------------------------------------------------------------------
// Blueprint — topics × Bloom's marks grid (§3.3 task 7). Derived from questions.
// ---------------------------------------------------------------------------

export interface BlueprintRow {
  topic: string;
  byBloom: Record<BloomLevel, number>;
  total: number;
}

export interface Blueprint {
  blooms: BloomLevel[];
  rows: BlueprintRow[];
  columnTotals: Record<BloomLevel, number>;
  grandTotal: number;
}

const BLUEPRINT_BLOOMS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'];

export function computeBlueprint(questions: Question[]): Blueprint {
  const rowsMap = new Map<string, BlueprintRow>();
  const columnTotals = Object.fromEntries(BLUEPRINT_BLOOMS.map((b) => [b, 0])) as Record<BloomLevel, number>;
  let grandTotal = 0;

  for (const q of questions) {
    let row = rowsMap.get(q.topic);
    if (!row) {
      row = {
        topic: q.topic,
        byBloom: Object.fromEntries(BLUEPRINT_BLOOMS.map((b) => [b, 0])) as Record<BloomLevel, number>,
        total: 0,
      };
      rowsMap.set(q.topic, row);
    }
    row.byBloom[q.bloom] += q.marks;
    row.total += q.marks;
    columnTotals[q.bloom] += q.marks;
    grandTotal += q.marks;
  }

  return { blooms: BLUEPRINT_BLOOMS, rows: [...rowsMap.values()], columnTotals, grandTotal };
}

/** Flatten all questions across a paper's sections (for blueprint / answer key). */
export function allQuestions(sections: { questions: Question[] }[]): Question[] {
  return sections.flatMap((s) => s.questions);
}
