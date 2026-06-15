/**
 * Lesson Architect (Tool 01 / BBAI-01) data model — mirrors the design doc
 * (src/config/project.md/tool1.md §2.1 inputs, §2.2 + §3.2 output JSON).
 *
 * Board/grade/subject logic is shared across all tools — see
 * `src/features/ai/shared/curriculum.ts`. Re-exported here for convenience.
 */
import { type Board, BOARD_OPTIONS, gradesForBoard, subjectsFor } from '@/features/ai/shared/curriculum';

export { BOARD_OPTIONS, gradesForBoard, subjectsFor };
export type { Board };

// ---------------------------------------------------------------------------
// Input model (§2.1)
// ---------------------------------------------------------------------------

export type Difficulty = 'Foundational' | 'Standard' | 'Advanced' | 'HOTS';
export type Language = 'English' | 'Hindi' | 'Mixed';
export type StudentProfileTag = 'Mixed ability' | 'Struggling learners' | 'Advanced';

export interface LessonInput {
  board: Board;
  grade: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  objective: string; // optional — AI generates if blank
  difficulty: Difficulty;
  studentProfile: StudentProfileTag[];
  language: Language;
  specialInstructions: string;
}

// ---------------------------------------------------------------------------
// Output model — the 7-part plan (§2.2 / §3.2 JSON schema)
// ---------------------------------------------------------------------------

export interface LessonHeader {
  board: string;
  grade: string;
  subject: string;
  topic: string;
  duration: string;
  date: string;
  teacher: string;
}

export interface ConceptStep {
  step: number;
  title: string;
  content: string;
  teacher_action: string;
  student_action: string;
}

export interface StudentActivity {
  type: 'Individual' | 'Pair' | 'Group';
  title: string;
  instructions: string;
  success_criteria: string;
  duration: string;
}

export interface LessonPlan {
  header: LessonHeader;
  objectives: string[];
  bloom_levels: string[];
  materials: string[];
  hook: { activity: string; duration: string; instructions: string };
  concept_delivery: ConceptStep[];
  student_activity: StudentActivity;
  formative_check: { questions: string[]; exit_ticket: string };
  differentiation: { support: string; extension: string };
  homework: string;
}

/** Sections that can be targeted by the Customise-with-AI agent (§3.5). */
export type CustomisableSection =
  | 'objectives'
  | 'materials'
  | 'hook'
  | 'concept_delivery'
  | 'student_activity'
  | 'formative_check'
  | 'differentiation'
  | 'homework';

export const SECTION_LABELS: Record<CustomisableSection, string> = {
  objectives: 'Learning objectives',
  materials: 'Materials & resources',
  hook: 'Hook / starter',
  concept_delivery: 'Concept delivery',
  student_activity: 'Student activity',
  formative_check: 'Formative check + exit ticket',
  differentiation: 'Differentiation',
  homework: 'Homework',
};

// ---------------------------------------------------------------------------
// Form option sets (§2.1)
// ---------------------------------------------------------------------------

export const DURATION_OPTIONS = [30, 40, 45, 60, 90];
export const DEFAULT_DURATION = 40;

export const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; hint: string }[] = [
  { value: 'Foundational', label: 'Foundational', hint: 'Build the basics' },
  { value: 'Standard', label: 'Standard', hint: 'Grade-level' },
  { value: 'Advanced', label: 'Advanced', hint: 'Stretch & challenge' },
  { value: 'HOTS', label: 'HOTS', hint: 'Higher-order thinking' },
];

export const STUDENT_PROFILE_OPTIONS: StudentProfileTag[] = [
  'Mixed ability',
  'Struggling learners',
  'Advanced',
];

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Mixed', label: 'English + Hindi' },
];

export function emptyLessonInput(): LessonInput {
  return {
    board: 'CBSE',
    grade: 'Class 7',
    subject: '',
    topic: '',
    durationMinutes: DEFAULT_DURATION,
    objective: '',
    difficulty: 'Standard',
    studentProfile: [],
    language: 'English',
    specialInstructions: '',
  };
}
