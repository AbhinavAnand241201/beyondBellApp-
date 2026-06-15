/**
 * Event Architect (Tool 04 / BBAI-04) data model — mirrors design doc
 * src/config/project.md/tool4.md (§1.2 events, §1.3 8-doc output, §2.1 inputs,
 * §3.2–§3.4 agent output schemas).
 */

// ---------------------------------------------------------------------------
// Event catalog (§1.2) — 25 types across 8 categories. EDIT HERE to add events.
// ---------------------------------------------------------------------------

export type EventCategory =
  | 'Annual & Cultural'
  | 'Academic'
  | 'Sports & Physical'
  | 'National & Civic'
  | 'Student Welfare'
  | 'Community'
  | 'Inter-school'
  | 'International Days';

export interface EventTypeDef {
  id: string;
  label: string;
  category: EventCategory;
}

export const EVENT_TYPES: EventTypeDef[] = [
  { id: 'annual_day', label: 'Annual Day', category: 'Annual & Cultural' },
  { id: 'cultural_fest', label: 'Cultural Fest', category: 'Annual & Cultural' },
  { id: 'talent_show', label: 'Talent Show', category: 'Annual & Cultural' },
  { id: 'farewell', label: 'Farewell', category: 'Annual & Cultural' },
  { id: 'science_exhibition', label: 'Science Exhibition', category: 'Academic' },
  { id: 'math_olympiad', label: 'Math Olympiad', category: 'Academic' },
  { id: 'quiz', label: 'Quiz Competition', category: 'Academic' },
  { id: 'debate', label: 'Debate', category: 'Academic' },
  { id: 'sports_day', label: 'Sports Day', category: 'Sports & Physical' },
  { id: 'inter_house', label: 'Inter-house Competition', category: 'Sports & Physical' },
  { id: 'swimming', label: 'Swimming Meet', category: 'Sports & Physical' },
  { id: 'yoga_day', label: 'Yoga Day', category: 'Sports & Physical' },
  { id: 'republic_day', label: 'Republic Day', category: 'National & Civic' },
  { id: 'independence_day', label: 'Independence Day', category: 'National & Civic' },
  { id: 'gandhi_jayanti', label: 'Gandhi Jayanti', category: 'National & Civic' },
  { id: 'constitution_day', label: 'Constitution Day', category: 'National & Civic' },
  { id: 'ptm', label: 'Parent Teacher Meeting', category: 'Student Welfare' },
  { id: 'orientation', label: 'Orientation Day', category: 'Student Welfare' },
  { id: 'graduation', label: 'Graduation', category: 'Student Welfare' },
  { id: 'health_camp', label: 'Health Camp', category: 'Community' },
  { id: 'tree_plantation', label: 'Tree Plantation', category: 'Community' },
  { id: 'clean_india', label: 'Clean India Drive', category: 'Community' },
  { id: 'interschool', label: 'Inter-school Competition (hosted)', category: 'Inter-school' },
  { id: 'earth_day', label: 'Earth Day', category: 'International Days' },
  { id: 'environment_day', label: 'World Environment Day', category: 'International Days' },
];

export function getEventType(id: string): EventTypeDef | undefined {
  return EVENT_TYPES.find((e) => e.id === id);
}

// ---------------------------------------------------------------------------
// Input model (§2.1)
// ---------------------------------------------------------------------------

export type Audience = 'Students only' | 'Students + Parents' | 'Full community' | 'Staff only';
export type AttendanceRange = 'Under 100' | '100–300' | '300–500' | '500–1000' | '1000+';
export type Venue = 'School auditorium' | 'Playground' | 'Classroom' | 'Off-campus';
export type BudgetRange = 'Under ₹5K' | '₹5–20K' | '₹20–50K' | '₹50K+';
export type LeadTime = '1 week' | '2 weeks' | '1 month' | '3 months';

export interface EventInput {
  eventTypeId: string;
  audience: Audience;
  attendance: AttendanceRange;
  venue: Venue;
  date: string; // optional, free text DD/MM/YYYY
  budgetRange: BudgetRange;
  grades: number[];
  theme: string; // optional; may be filled by theme suggestion
  specialRequirements: string;
  leadTime: LeadTime;
}

// ---------------------------------------------------------------------------
// Theme suggestion (§2.2)
// ---------------------------------------------------------------------------

export interface ThemeSuggestion {
  name: string;
  tagline: string;
  palette: string[]; // hex colours
  concept: string;
}

// ---------------------------------------------------------------------------
// Output — the 8-document blueprint (§1.3, §3.2–§3.4)
// ---------------------------------------------------------------------------

export interface ProgrammeItem {
  time: string;
  activity: string;
  responsible: string;
}

export interface StudentRole {
  title: string;
  gradeRange: string;
  responsibilities: string[];
  reportsTo: string;
}

export interface Committee {
  name: string;
  lead: string;
  scope: string;
}

export interface BudgetGroup {
  name: string;
  items: { item: string; range: string }[];
}

export interface ChecklistItem {
  item: string;
  responsible: string;
  deadline: string;
}

export interface ChecklistPhase {
  phase: string;
  items: ChecklistItem[];
}

export interface CommsItem {
  what: string;
  audience: string;
  channel: string;
  when: string;
  draft: string;
}

export interface RehearsalPhase {
  label: string;
  focus: string;
}

export interface EventBlueprint {
  brief: {
    purpose: string;
    theme: string;
    audience: string;
    highlights: string[];
    successMetrics: string[];
  };
  programme: { totalDuration: string; items: ProgrammeItem[] };
  roles: { committees: Committee[]; studentRoles: StudentRole[]; staffRoles: { title: string; responsibilities: string[] }[] };
  rehearsal: RehearsalPhase[];
  budget: { groups: BudgetGroup[]; contingency: string; total: string };
  comms: CommsItem[];
  checklist: ChecklistPhase[];
  scripts: { mc: string[]; welcomeAddress: string[]; voteOfThanks: string[] };
}

/** Output document tabs (§1.3). */
export type DocTab = 'brief' | 'programme' | 'roles' | 'rehearsal' | 'budget' | 'comms' | 'checklist' | 'scripts';

export const DOC_TABS: { id: DocTab; label: string; icon: string }[] = [
  { id: 'brief', label: 'Brief', icon: 'newspaper-outline' },
  { id: 'programme', label: 'Programme', icon: 'time-outline' },
  { id: 'roles', label: 'Roles', icon: 'people-outline' },
  { id: 'rehearsal', label: 'Rehearsal', icon: 'repeat-outline' },
  { id: 'budget', label: 'Budget', icon: 'cash-outline' },
  { id: 'comms', label: 'Comms', icon: 'megaphone-outline' },
  { id: 'checklist', label: 'Checklist', icon: 'checkbox-outline' },
  { id: 'scripts', label: 'Scripts', icon: 'mic-outline' },
];

// ---------------------------------------------------------------------------
// Form option sets (§2.1)
// ---------------------------------------------------------------------------

export const AUDIENCE_OPTIONS: Audience[] = ['Students only', 'Students + Parents', 'Full community', 'Staff only'];
export const ATTENDANCE_OPTIONS: AttendanceRange[] = ['Under 100', '100–300', '300–500', '500–1000', '1000+'];
export const VENUE_OPTIONS: Venue[] = ['School auditorium', 'Playground', 'Classroom', 'Off-campus'];
export const BUDGET_OPTIONS: BudgetRange[] = ['Under ₹5K', '₹5–20K', '₹20–50K', '₹50K+'];
export const LEAD_TIME_OPTIONS: LeadTime[] = ['1 week', '2 weeks', '1 month', '3 months'];
export const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function emptyEventInput(): EventInput {
  return {
    eventTypeId: '',
    audience: 'Students + Parents',
    attendance: '300–500',
    venue: 'School auditorium',
    date: '',
    budgetRange: '₹20–50K',
    grades: [],
    theme: '',
    specialRequirements: '',
    leadTime: '1 month',
  };
}
