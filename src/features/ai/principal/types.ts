/**
 * Principal Desk (Tool 05 / BBAI-05) data model — mirrors design doc
 * src/config/project.md/tool5.md. Unlike the other tools, this is a
 * CONVERSATIONAL interface (§2.1) with a fixed 4-part structured answer (§2.2)
 * and a confidence flag (§3.6). Pro-only (§Membership).
 */

/** §3.6 confidence levels drive the answer's badge + behaviour. */
export type Confidence = 'High' | 'Medium' | 'Low' | 'Escalate';

export interface Citation {
  label: string; // e.g. "CBSE Circular No. 12/2024"
  reference: string; // section / clause / URL
}

/** The always-4-part response (§2.2). */
export interface PrincipalAnswer {
  directAnswer: string;
  source: string;
  recommendedAction: string;
  caution: string;
  confidence: Confidence;
  citations: Citation[];
}

export type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'assistant'; pending: true }
  | { id: string; role: 'assistant'; pending: false; answer: PrincipalAnswer };

/** Knowledge domains (§1.3) — shown in the Pro preview + empty state. */
export const KNOWLEDGE_DOMAINS: { title: string; topics: string; icon: string }[] = [
  { title: 'Education Policy', topics: 'NEP 2020 · RTE · CBSE/CISCE circulars', icon: 'school-outline' },
  { title: 'Child Safety', topics: 'POCSO · child protection · mandatory reporting', icon: 'shield-checkmark-outline' },
  { title: 'HR & Staff', topics: 'appointment · termination · PF/ESI · grievance', icon: 'people-outline' },
  { title: 'Parent Conflict', topics: 'escalation scripts · complaints · social media', icon: 'chatbubbles-outline' },
  { title: 'Governance', topics: 'Trust/Society Act · fees · admissions · audit', icon: 'business-outline' },
  { title: 'Curriculum & Exams', topics: 'affiliation · exam rules · malpractice', icon: 'book-outline' },
  { title: 'Infrastructure & Safety', topics: 'fire · building · bus · canteen', icon: 'construct-outline' },
  { title: 'Financial Management', topics: 'fee structure · scholarship · audit', icon: 'cash-outline' },
];

/** Suggested starter queries (§2.3) — tappable chips when the chat is empty. */
export const SUGGESTED_QUERIES = [
  'What does NEP 2020 say about the no-detention policy in Classes 1–8?',
  'A parent is threatening to complain to the DM about fees. What are our rights?',
  'Can I terminate a teacher on sick leave for 4 months?',
  'A student was caught with a mobile during the CBSE board exam. What is the procedure?',
  'What documents are required for CBSE affiliation renewal?',
];

export const CONFIDENCE_META: Record<Confidence, { label: string; tone: 'success' | 'amber' | 'neutral' | 'danger'; note: string }> = {
  High: { label: 'High confidence', tone: 'success', note: 'Matches a known policy source.' },
  Medium: { label: 'Verify before acting', tone: 'amber', note: 'General guidance — confirm against the current source.' },
  Low: { label: 'Limited guidance', tone: 'neutral', note: 'State-specific or novel — consult the named authority.' },
  Escalate: { label: 'Act now', tone: 'danger', note: 'Time-sensitive — contact the authority immediately.' },
};

export const MAX_TURNS = 20; // §3.5 session memory cap
