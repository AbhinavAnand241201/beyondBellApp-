/**
 * Parent Communicator (Tool 03 / BBAI-03) data model — mirrors design doc
 * src/config/project.md/tool3.md (§1.3 situations, §2.1 inputs, §2.2 formats,
 * §3.3 refinements).
 */

export type Sensitivity = 'Low' | 'Medium' | 'High' | 'Very High';

export type SituationCategory =
  | 'Academic'
  | 'Behaviour'
  | 'Attendance'
  | 'Administrative'
  | 'Pastoral'
  | 'Recognition'
  | 'Escalation';

export type Tone = 'Warm' | 'Firm but caring' | 'Neutral' | 'Urgent' | 'Celebratory';

export type MessageFormat = 'whatsapp' | 'email' | 'diary' | 'sms';

export type Language = 'English' | 'Hindi' | 'Hinglish';

export interface SituationDef {
  id: string;
  label: string;
  category: SituationCategory;
  sensitivity: Sensitivity;
  /** Shown when the situation is selected (§2.3 dynamic guidance). */
  toneGuidance: string;
  defaultTone: Tone;
}

// ---------------------------------------------------------------------------
// The 20 communication situations (§1.3). EDIT HERE to add/adjust situations.
// ---------------------------------------------------------------------------

export const SITUATIONS: SituationDef[] = [
  { id: 'progress_positive', label: 'Progress update (positive)', category: 'Academic', sensitivity: 'Low', defaultTone: 'Warm', toneGuidance: 'Warm and specific — name a real strength you observed.' },
  { id: 'performance_concern', label: 'Performance concern', category: 'Academic', sensitivity: 'Medium', defaultTone: 'Firm but caring', toneGuidance: 'Caring and solution-focused. Never blame, never catastrophise.' },
  { id: 'learning_difficulty', label: 'Learning difficulty flag', category: 'Academic', sensitivity: 'High', defaultTone: 'Firm but caring', toneGuidance: 'Gentle and collaborative. No diagnosis language — suggest a meeting.' },
  { id: 'exam_result', label: 'Exam result communication', category: 'Academic', sensitivity: 'Medium', defaultTone: 'Neutral', toneGuidance: 'Factual and encouraging; frame results as a step, not a verdict.' },
  { id: 'behaviour_positive', label: 'Positive behaviour recognition', category: 'Behaviour', sensitivity: 'Low', defaultTone: 'Celebratory', toneGuidance: 'Genuine and specific — describe exactly what the student did well.' },
  { id: 'behaviour_minor', label: 'Behaviour concern (minor)', category: 'Behaviour', sensitivity: 'Medium', defaultTone: 'Firm but caring', toneGuidance: 'Informative and partnership-focused: “let’s work together”.' },
  { id: 'behaviour_serious', label: 'Behaviour concern (serious)', category: 'Behaviour', sensitivity: 'High', defaultTone: 'Firm but caring', toneGuidance: 'Calm and factual. Document facts, not interpretations.' },
  { id: 'bullying', label: 'Bullying involvement', category: 'Behaviour', sensitivity: 'Very High', defaultTone: 'Firm but caring', toneGuidance: 'Extremely careful. Never name the other child. Request an in-person meeting.' },
  { id: 'attendance_first', label: 'Attendance concern (first warning)', category: 'Attendance', sensitivity: 'Medium', defaultTone: 'Firm but caring', toneGuidance: 'Concerned but supportive; assume a reason, ask to understand.' },
  { id: 'attendance_chronic', label: 'Chronic absenteeism (escalation)', category: 'Attendance', sensitivity: 'High', defaultTone: 'Urgent', toneGuidance: 'Clear and firm with a concrete next step and timeline.' },
  { id: 'meeting_request', label: 'Meeting request (PTM / 1:1)', category: 'Administrative', sensitivity: 'Low', defaultTone: 'Neutral', toneGuidance: 'Polite and concise; offer specific time options.' },
  { id: 'fee_reminder', label: 'Fee reminder', category: 'Administrative', sensitivity: 'Medium', defaultTone: 'Neutral', toneGuidance: 'Respectful and non-judgemental; state the fact and the action.' },
  { id: 'event_info', label: 'Event / activity information', category: 'Administrative', sensitivity: 'Low', defaultTone: 'Warm', toneGuidance: 'Clear and inviting; lead with the what/when/where.' },
  { id: 'permission_followup', label: 'Permission slip follow-up', category: 'Administrative', sensitivity: 'Low', defaultTone: 'Neutral', toneGuidance: 'Brief and friendly reminder with the deadline.' },
  { id: 'wellbeing', label: 'Emotional wellbeing concern', category: 'Pastoral', sensitivity: 'Very High', defaultTone: 'Warm', toneGuidance: 'Gentle, non-alarmist. Frame as “we noticed”. Keep it minimal; request a meeting.' },
  { id: 'family_situation', label: 'Family situation acknowledgement', category: 'Pastoral', sensitivity: 'Very High', defaultTone: 'Warm', toneGuidance: 'Acknowledge with care, don’t probe, offer support, keep it brief.' },
  { id: 'grief', label: 'Grief / bereavement support', category: 'Pastoral', sensitivity: 'Very High', defaultTone: 'Warm', toneGuidance: 'Deeply gentle and brief. Offer presence and flexibility, not solutions.' },
  { id: 'achievement', label: 'Student achievement celebration', category: 'Recognition', sensitivity: 'Low', defaultTone: 'Celebratory', toneGuidance: 'Genuine and specific — parents love exact details of the achievement.' },
  { id: 'award', label: 'Award / selection notification', category: 'Recognition', sensitivity: 'Low', defaultTone: 'Celebratory', toneGuidance: 'Proud and warm; congratulate the student by name.' },
  { id: 'final_warning', label: 'Final warning before disciplinary action', category: 'Escalation', sensitivity: 'High', defaultTone: 'Urgent', toneGuidance: 'Serious and factual. Reference the formal process, never legal threats.' },
];

export function getSituation(id: string): SituationDef | undefined {
  return SITUATIONS.find((s) => s.id === id);
}

export const CATEGORY_ICON: Record<SituationCategory, string> = {
  Academic: 'book-outline',
  Behaviour: 'people-outline',
  Attendance: 'calendar-outline',
  Administrative: 'document-text-outline',
  Pastoral: 'heart-outline',
  Recognition: 'trophy-outline',
  Escalation: 'warning-outline',
};

export const CATEGORY_ORDER: SituationCategory[] = [
  'Academic',
  'Behaviour',
  'Attendance',
  'Pastoral',
  'Recognition',
  'Administrative',
  'Escalation',
];

export const SENSITIVITY_TONE: Record<Sensitivity, 'neutral' | 'amber' | 'danger'> = {
  Low: 'neutral',
  Medium: 'amber',
  High: 'amber',
  'Very High': 'danger',
};

// ---------------------------------------------------------------------------
// Input model (§2.1)
// ---------------------------------------------------------------------------

export interface ParentInput {
  situationId: string;
  studentName: string;
  grade: string;
  parentName: string;
  context: string; // key facts (required, 1–3 sentences)
  tone: Tone | 'Auto';
  formats: MessageFormat[];
  language: Language;
  additionalInstruction: string;
}

// ---------------------------------------------------------------------------
// Output model (§2.2)
// ---------------------------------------------------------------------------

export interface EmailMessage {
  subject: string;
  body: string;
}

export interface ParentMessageOutput {
  toneApplied: string;
  toneNote: string; // §3.2 one-line tone rationale
  formats: {
    whatsapp?: string;
    email?: EmailMessage;
    diary?: string;
    sms?: string;
  };
}

// ---------------------------------------------------------------------------
// Form option sets (§2.1)
// ---------------------------------------------------------------------------

export const TONE_OPTIONS: { value: Tone | 'Auto'; label: string }[] = [
  { value: 'Auto', label: 'Auto' },
  { value: 'Warm', label: 'Warm' },
  { value: 'Firm but caring', label: 'Firm + caring' },
  { value: 'Neutral', label: 'Neutral' },
  { value: 'Urgent', label: 'Urgent' },
  { value: 'Celebratory', label: 'Celebratory' },
];

export const FORMAT_OPTIONS: { value: MessageFormat; label: string; icon: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp' },
  { value: 'email', label: 'Email', icon: 'mail-outline' },
  { value: 'diary', label: 'Diary note', icon: 'book-outline' },
  { value: 'sms', label: 'SMS', icon: 'chatbox-outline' },
];

export const FORMAT_LABEL: Record<MessageFormat, string> = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  diary: 'Diary note',
  sms: 'SMS',
};

export const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Hinglish', label: 'Hinglish' },
];

/** One-click refinement chips (§3.3). `instruction` is sent to the refine endpoint. */
export interface RefinementChip {
  id: string;
  label: string;
  instruction: string;
}

export const REFINEMENT_CHIPS: RefinementChip[] = [
  { id: 'shorter', label: 'Make shorter', instruction: 'Reduce to about 60% of the current length. Keep the key information.' },
  { id: 'urgent', label: 'More urgent', instruction: 'Increase urgency. Add a clearer consequence or timeline.' },
  { id: 'softer', label: 'Softer tone', instruction: 'Reduce firmness by about 30%. Add more empathetic framing.' },
  { id: 'hindi', label: 'Translate to Hindi', instruction: 'Rewrite the entire message in formal Hindi.' },
  { id: 'meeting', label: 'Add meeting request', instruction: 'Add a request for an in-person or phone meeting with suggested times.' },
  { id: 'anon', label: 'Remove student name', instruction: 'Replace the student name with “your child” throughout.' },
  { id: 'diary', label: 'Add diary note', instruction: 'Also produce a brief school-diary-note version.' },
];

export function emptyParentInput(): ParentInput {
  return {
    situationId: '',
    studentName: '',
    grade: 'Class 7',
    parentName: '',
    context: '',
    tone: 'Auto',
    formats: ['whatsapp'],
    language: 'English',
    additionalInstruction: '',
  };
}

export const CONTEXT_MAX = 400;
