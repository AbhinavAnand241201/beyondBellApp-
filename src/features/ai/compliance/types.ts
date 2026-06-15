/**
 * Compliance Generator (Tool 06 / BBAI-06) data model — mirrors design doc
 * src/config/project.md/tool6.md (§1.2 SQAA domains, §2.1 two modes, §2.2 inputs,
 * §3.2 document output, §3.3 evidence folder). Pro-only.
 */

export type Mode = 'sqaa' | 'pack';

// ---------------------------------------------------------------------------
// SQAA domains (§1.2). EDIT HERE to adjust domain titles / doc types.
// ---------------------------------------------------------------------------

export interface SqaaDomain {
  number: number;
  title: string;
  docTypes: string;
}

export const SQAA_DOMAINS: SqaaDomain[] = [
  { number: 1, title: 'Curricular Aspects', docTypes: 'Curriculum plan · learning-outcome mapping · co-curricular records' },
  { number: 2, title: 'Teaching-Learning & Evaluation', docTypes: 'Lesson plan samples · assessment records · feedback mechanisms' },
  { number: 3, title: 'Research, Innovation & Best Practices', docTypes: 'Innovation documentation · best-practice case studies' },
  { number: 4, title: 'Infrastructure & Learning Resources', docTypes: 'Facility inventory · library records · lab registers' },
  { number: 5, title: 'Student Support & Progression', docTypes: 'Scholarship · counselling · welfare policies' },
  { number: 6, title: 'Governance, Leadership & Management', docTypes: 'Management structure · minutes · staff development' },
  { number: 7, title: 'Institutional Values & Best Practices', docTypes: 'Value education · community engagement · environment' },
];

export function getDomain(n: number): SqaaDomain | undefined {
  return SQAA_DOMAINS.find((d) => d.number === n);
}

// ---------------------------------------------------------------------------
// Full Compliance Pack catalog (§1.3) — category → document types.
// ---------------------------------------------------------------------------

export type PackCategory = 'Child Safety' | 'HR Policies' | 'Academic Policies' | 'Safety & Infrastructure' | 'Financial Governance' | 'CBSE Affiliation';

export const PACK_CATALOG: { category: PackCategory; documents: string[] }[] = [
  { category: 'Child Safety', documents: ['Child Protection Policy', 'Anti-bullying Policy', 'POCSO Compliance Statement', 'Safe Internet Policy'] },
  { category: 'HR Policies', documents: ['Leave Policy', 'Grievance Redressal Mechanism', 'Appraisal Policy', 'Code of Conduct'] },
  { category: 'Academic Policies', documents: ['Assessment Policy', 'Homework Policy', 'Detention & Promotion Policy', 'Special Needs Policy'] },
  { category: 'Safety & Infrastructure', documents: ['Fire Safety Compliance', 'Bus Safety Checklist', 'First Aid Readiness', 'Emergency Response Plan'] },
  { category: 'Financial Governance', documents: ['Fee Policy', 'Scholarship Policy', 'Audit Committee Charter', 'Financial Disclosure Statement'] },
  { category: 'CBSE Affiliation', documents: ['Compliance Checklist', 'Infrastructure Certificate', 'Staff Qualification Register', 'Safety Audit'] },
];

// ---------------------------------------------------------------------------
// Input model (§2.2)
// ---------------------------------------------------------------------------

export type SchoolType = 'Day school' | 'Boarding' | 'Co-ed' | 'Girls' | 'Boys';
export type ComplianceBoard = 'CBSE' | 'ICSE' | 'Both';
export type SchoolSize = 'Under 500' | '500–1000' | '1000–2000' | '2000+';
export type SchoolStage = 'Primary only' | 'Secondary only' | 'Senior secondary' | 'All stages';

export interface ComplianceInput {
  mode: Mode;
  // SQAA mode
  domain: number;
  // Pack mode
  category: PackCategory;
  documentType: string;
  // shared
  schoolType: SchoolType;
  board: ComplianceBoard;
  schoolSize: SchoolSize;
  schoolStage: SchoolStage;
  strengths: string;
  gaps: string;
  reviewDate: string;
}

// ---------------------------------------------------------------------------
// Output model (§3.2 / §3.3)
// ---------------------------------------------------------------------------

export interface DocSection {
  heading: string;
  body: string;
}

export interface EvidenceItem {
  item: string;
  format: string;
  responsible: string;
}

export interface ImprovementAction {
  action: string;
  timeline: string;
  measure: string;
}

export interface ComplianceDocument {
  title: string;
  rating?: string; // SQAA scoring language (Comprehensive / Significant / Some / Emerging)
  sections: DocSection[];
  evidenceChecklist: EvidenceItem[];
  /** Recommended evidence folder tree (§3.3) — newline-separated, indented. */
  folderStructure: string;
  improvementPlan: ImprovementAction[];
}

// ---------------------------------------------------------------------------
// Form option sets (§2.2)
// ---------------------------------------------------------------------------

export const SCHOOL_TYPE_OPTIONS: SchoolType[] = ['Day school', 'Boarding', 'Co-ed', 'Girls', 'Boys'];
export const COMPLIANCE_BOARD_OPTIONS: ComplianceBoard[] = ['CBSE', 'ICSE', 'Both'];
export const SCHOOL_SIZE_OPTIONS: SchoolSize[] = ['Under 500', '500–1000', '1000–2000', '2000+'];
export const SCHOOL_STAGE_OPTIONS: SchoolStage[] = ['Primary only', 'Secondary only', 'Senior secondary', 'All stages'];

/** SQAA self-appraisal scoring language (§3.1). */
export const SQAA_RATINGS = ['Comprehensive Evidence', 'Significant Evidence', 'Some Evidence', 'Emerging Evidence'];

export function emptyComplianceInput(): ComplianceInput {
  return {
    mode: 'sqaa',
    domain: 1,
    category: 'Child Safety',
    documentType: 'Child Protection Policy',
    schoolType: 'Co-ed',
    board: 'CBSE',
    schoolSize: '500–1000',
    schoolStage: 'All stages',
    strengths: '',
    gaps: '',
    reviewDate: '',
  };
}
