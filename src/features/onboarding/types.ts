import type { LanguagePreference, UserRole, YearsExp } from '@/types/db';

/**
 * The data the 5-step wizard collects. Mirrors the columns the web wizard writes
 * across `users` + `educator_profiles` + `onboarding_progress` (§8.1, §18.3).
 *
 * Step → fields:
 *   1 Identity   → display_name (users), role (users), designation
 *   2 Teaching   → boards[], grades[], subjects[]
 *   3 School     → school_name, show_school_name, city, state, years_exp
 *   4 About you  → specialist_areas[], bio, language_preference, contact_phone
 *   5 Review     → finish (writes wizard_completed_at + onboarding_completed)
 */
export interface WizardData {
  display_name: string;
  role: UserRole;
  designation: string;
  boards: string[];
  grades: number[];
  subjects: string[];
  school_name: string;
  show_school_name: boolean;
  city: string;
  state: string;
  years_exp: YearsExp | null;
  specialist_areas: string[];
  bio: string;
  language_preference: LanguagePreference;
  contact_phone: string;
}

export const TOTAL_STEPS = 5;

export const STEP_TITLES: Record<number, string> = {
  1: 'About you',
  2: 'What you teach',
  3: 'Your school',
  4: 'Your expertise',
  5: 'Review & finish',
};

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'classroom_teacher', label: 'Classroom teacher' },
  { value: 'coordinator_hod', label: 'Coordinator / HOD' },
  { value: 'principal_vp', label: 'Principal / Vice-principal' },
];

export const BOARD_OPTIONS = ['CBSE', 'ICSE / CISCE', 'State Board', 'IB', 'IGCSE'];

export const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export const SUBJECT_OPTIONS = [
  'English',
  'Hindi',
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Social Studies',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Arts',
  'Physical Education',
];

export const YEARS_EXP_OPTIONS: { value: YearsExp; label: string }[] = [
  { value: '<2', label: 'Less than 2 years' },
  { value: '2-5', label: '2–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10-20', label: '10–20 years' },
  { value: '20+', label: '20+ years' },
];

export const LANGUAGE_OPTIONS: { value: LanguagePreference; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
];

export function emptyWizardData(displayNameSeed = ''): WizardData {
  return {
    display_name: displayNameSeed,
    role: 'classroom_teacher',
    designation: '',
    boards: [],
    grades: [],
    subjects: [],
    school_name: '',
    show_school_name: true,
    city: '',
    state: '',
    years_exp: null,
    specialist_areas: [],
    bio: '',
    language_preference: 'english',
    contact_phone: '',
  };
}
