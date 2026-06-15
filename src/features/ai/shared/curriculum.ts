/**
 * Shared curriculum config used by ALL AI tools (board → grade → subject).
 * This is pure data + pure functions — edit the tables here and every tool picks
 * up the change. Do not duplicate this per tool.
 *
 * Sources: tool design docs §4 (board knowledge) and §4.2 (subject coverage).
 */

export type Board = 'CBSE' | 'ICSE' | 'IGCSE' | 'Cambridge' | 'State Board';

export const BOARD_OPTIONS: Board[] = ['CBSE', 'ICSE', 'IGCSE', 'Cambridge', 'State Board'];

/** Grade labels per board: Cambridge/IGCSE use "Year", others "Class". */
export function gradesForBoard(board: Board): string[] {
  if (board === 'Cambridge' || board === 'IGCSE') {
    return Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`);
  }
  return Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
}

/** Numeric grade extracted from "Class 7" / "Year 9". */
export function gradeNumber(grade: string): number {
  const m = grade.match(/\d+/);
  return m ? Number(m[0]) : 0;
}

interface SubjectRule {
  subject: string;
  boards: Board[];
  min: number;
  max: number;
}

// Subject coverage — Phase 1 matrix (design doc §4.2). EDIT HERE to change coverage.
const SUBJECT_MATRIX: SubjectRule[] = [
  { subject: 'English Language & Literature', boards: ['CBSE', 'ICSE', 'IGCSE', 'Cambridge'], min: 1, max: 13 },
  { subject: 'Mathematics', boards: ['CBSE', 'ICSE', 'IGCSE', 'Cambridge'], min: 1, max: 13 },
  { subject: 'Science (General)', boards: ['CBSE', 'ICSE'], min: 1, max: 8 },
  { subject: 'Physics', boards: ['CBSE', 'ICSE', 'IGCSE'], min: 9, max: 13 },
  { subject: 'Chemistry', boards: ['CBSE', 'ICSE', 'IGCSE'], min: 9, max: 13 },
  { subject: 'Biology', boards: ['CBSE', 'ICSE', 'IGCSE'], min: 9, max: 13 },
  { subject: 'Social Studies / History / Geography', boards: ['CBSE', 'ICSE'], min: 1, max: 10 },
  { subject: 'Economics', boards: ['CBSE', 'ICSE', 'Cambridge'], min: 11, max: 13 },
  { subject: 'Computer Science', boards: ['CBSE', 'ICSE', 'Cambridge'], min: 6, max: 12 },
  { subject: 'Hindi', boards: ['CBSE', 'ICSE'], min: 1, max: 10 },
  { subject: 'EVS (Environmental Studies)', boards: ['CBSE', 'ICSE'], min: 1, max: 5 },
];

/** Subjects available for a board + grade. State Board falls back to a general set. */
export function subjectsFor(board: Board, grade: string): string[] {
  const n = gradeNumber(grade);
  if (board === 'State Board') {
    const general = ['English Language & Literature', 'Mathematics', 'Hindi'];
    if (n <= 5) return [...general, 'EVS (Environmental Studies)'];
    if (n <= 8) return [...general, 'Science (General)', 'Social Studies / History / Geography'];
    return [...general, 'Physics', 'Chemistry', 'Biology', 'Social Studies / History / Geography'];
  }
  return SUBJECT_MATRIX.filter((r) => r.boards.includes(board) && n >= r.min && n <= r.max).map((r) => r.subject);
}
