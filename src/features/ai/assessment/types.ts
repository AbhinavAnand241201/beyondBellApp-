/**
 * Assessment Builder (Tool 02 / BBAI-02) data model — mirrors design doc
 * src/config/project.md/tool2.md (§2.1 inputs, §2.2 + §3.2/§3.3 output JSON).
 *
 * Board/grade/subject come from the shared curriculum module.
 */
import { type Board, BOARD_OPTIONS, gradesForBoard, subjectsFor } from '@/features/ai/shared/curriculum';

export { BOARD_OPTIONS, gradesForBoard, subjectsFor };
export type { Board };

// ---------------------------------------------------------------------------
// Shared enums (§3.2)
// ---------------------------------------------------------------------------

export type QuestionType = 'MCQ' | 'VSA' | 'SA' | 'LA' | 'CaseStudy' | 'SourceBased' | 'MapBased' | 'Match' | 'FillIn';
export type BloomLevel = 'Remember' | 'Understand' | 'Apply' | 'Analyse' | 'Evaluate' | 'Create';
export type QDifficulty = 'Easy' | 'Medium' | 'Hard' | 'HOTS';
export type HotsMode = 'Yes' | 'No' | 'Auto';
export type SetCount = 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Input model (§2.1)
// ---------------------------------------------------------------------------

export interface DifficultyMix {
  easy: number;
  medium: number;
  hard: number;
}

export interface AssessmentInput {
  board: Board;
  grade: string;
  subject: string;
  topics: string[];
  totalMarks: number;
  durationMins: number;
  questionTypes: QuestionType[];
  difficultyMix: DifficultyMix;
  bloomFocus: BloomLevel[]; // empty = balanced
  hots: HotsMode;
  numSets: SetCount;
  includeAnswerKey: boolean;
  includeMarkingScheme: boolean;
  specialInstructions: string;
}

// ---------------------------------------------------------------------------
// Output model (§2.2 — the 4-component package)
// ---------------------------------------------------------------------------

export interface Question {
  id: string;
  type: QuestionType;
  bloom: BloomLevel;
  difficulty: QDifficulty;
  marks: number;
  topic: string;
  question: string;
  options?: string[]; // MCQ only
  answer: string;
  valuePoints: string[];
  examinerNote?: string;
}

export interface PaperSection {
  id: string; // 'A', 'B', …
  name: string; // 'Section A'
  title: string; // 'Multiple Choice Questions'
  marksEach: number;
  instructions?: string;
  questions: Question[];
}

export interface AssessmentPaper {
  header: {
    board: Board | string;
    grade: string;
    subject: string;
    totalMarks: number;
    duration: string;
    generalInstructions: string[];
  };
  sections: PaperSection[];
}

/** One set (single, or A/B/C in multi-set mode §3.4). */
export interface AssessmentSet {
  label: string; // 'Set A' | 'Single'
  paper: AssessmentPaper;
}

export interface AssessmentPackage {
  sets: AssessmentSet[];
  includeAnswerKey: boolean;
  includeMarkingScheme: boolean;
}

/** Output tabs (§2.4). */
export type OutputTab = 'paper' | 'answers' | 'scheme' | 'blueprint';

export const OUTPUT_TABS: { id: OutputTab; label: string; icon: string }[] = [
  { id: 'paper', label: 'Paper', icon: 'document-text-outline' },
  { id: 'answers', label: 'Answer Key', icon: 'key-outline' },
  { id: 'scheme', label: 'Marking', icon: 'checkbox-outline' },
  { id: 'blueprint', label: 'Blueprint', icon: 'grid-outline' },
];

// ---------------------------------------------------------------------------
// Form option sets (§2.1) — pure data; edit freely.
// ---------------------------------------------------------------------------

export const TOTAL_MARKS_OPTIONS = [10, 20, 25, 30, 40, 50, 80, 100];
export const DEFAULT_TOTAL_MARKS = 25;

export const DURATION_OPTIONS = [30, 45, 60, 90, 120, 180];
export const DEFAULT_DURATION = 60;

export const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'MCQ', label: 'MCQ' },
  { value: 'VSA', label: 'Very short' },
  { value: 'SA', label: 'Short answer' },
  { value: 'LA', label: 'Long answer' },
  { value: 'CaseStudy', label: 'Case study' },
  { value: 'SourceBased', label: 'Source-based' },
  { value: 'MapBased', label: 'Map-based' },
  { value: 'Match', label: 'Match' },
  { value: 'FillIn', label: 'Fill-in' },
];

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = Object.fromEntries(
  QUESTION_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<QuestionType, string>;

export const BLOOM_LEVELS: BloomLevel[] = ['Remember', 'Understand', 'Apply', 'Analyse', 'Evaluate', 'Create'];

export const HOTS_OPTIONS: { value: HotsMode; label: string }[] = [
  { value: 'Auto', label: 'Auto' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export const SET_OPTIONS: { value: SetCount; label: string }[] = [
  { value: 1, label: '1 set' },
  { value: 2, label: '2 (A/B)' },
  { value: 3, label: '3 (A/B/C)' },
];

/** Difficulty-mix presets (design uses a slider; mobile uses presets §2.1). */
export const DIFFICULTY_PRESETS: { label: string; mix: DifficultyMix }[] = [
  { label: 'Balanced', mix: { easy: 30, medium: 50, hard: 20 } },
  { label: 'Easier', mix: { easy: 50, medium: 40, hard: 10 } },
  { label: 'Harder', mix: { easy: 20, medium: 45, hard: 35 } },
  { label: 'Exam-tough', mix: { easy: 10, medium: 40, hard: 50 } },
];

export function emptyAssessmentInput(): AssessmentInput {
  return {
    board: 'CBSE',
    grade: 'Class 10',
    subject: '',
    topics: [],
    totalMarks: DEFAULT_TOTAL_MARKS,
    durationMins: DEFAULT_DURATION,
    questionTypes: [],
    difficultyMix: { easy: 30, medium: 50, hard: 20 },
    bloomFocus: [],
    hots: 'Auto',
    numSets: 1,
    includeAnswerKey: true,
    includeMarkingScheme: true,
    specialInstructions: '',
  };
}
