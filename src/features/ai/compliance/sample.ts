import { getDomain, type ComplianceDocument, type ComplianceInput } from './types';

/**
 * Demo compliance document — powers the no-backend preview so the output UX
 * (sections, evidence checklist, folder tree, improvement plan) is reviewable.
 * Real, accuracy-critical documents come from the server (§3.1). The "[Verify
 * before submission]" markers mirror the system prompt's accuracy rule.
 */
export function demoDocument(input: ComplianceInput): ComplianceDocument {
  if (input.mode === 'sqaa') {
    const d = getDomain(input.domain);
    const title = `SQAA Domain ${input.domain} — ${d?.title ?? ''} (Self-Appraisal)`;
    return {
      title,
      rating: 'Significant Evidence',
      sections: [
        { heading: 'Domain overview', body: `This self-appraisal covers ${d?.title}. Documentation types expected: ${d?.docTypes}. [Verify against the current SQAA framework before submission].` },
        { heading: 'Criterion-wise response', body: 'For each criterion, the school provides evidence-oriented, honest responses using SQAA language (Comprehensive / Significant / Some / Emerging Evidence). Each strength is paired with one area for development.' },
        { heading: 'Evidence summary', body: 'A narrative summarising the physical and digital evidence available, mapped to each criterion in this domain.' },
        { heading: 'Improvement plan', body: 'Specific, time-bound, measurable actions to move from the current rating toward Comprehensive Evidence.' },
      ],
      evidenceChecklist: [
        { item: 'Annual curriculum / domain plan', format: 'PDF', responsible: 'Academic Coordinator' },
        { item: 'Sample records (lesson plans / minutes / registers)', format: 'Folder', responsible: 'Domain Lead' },
        { item: 'Feedback instruments & analysis', format: 'PDF / Sheet', responsible: 'Coordinator' },
        { item: 'Training attendance & certificates', format: 'Folder', responsible: 'HR' },
      ],
      folderStructure: `Domain_${input.domain}_${(d?.title ?? '').replace(/[^A-Za-z]+/g, '_')}/
  ├── ${input.domain}.1_Planning/
  │   ├── Annual_Plans/
  │   └── Samples/
  ├── ${input.domain}.2_Records/
  │   ├── Primary_Evidence/
  │   └── Analysis_Reports/
  └── ${input.domain}.3_Training/
      ├── Attendance/
      └── Certificates/`,
      improvementPlan: [
        { action: 'Digitise all domain evidence into the recommended folder structure', timeline: 'Within 30 days', measure: '100% of evidence items uploaded' },
        { action: 'Conduct an internal mock review against each criterion', timeline: '2 weeks before review', measure: 'Mock score per criterion recorded' },
      ],
    };
  }

  // Pack mode — a policy / SOP / governance document.
  return {
    title: input.documentType,
    sections: [
      { heading: 'Purpose', body: `This document establishes ${input.documentType} for the school, in line with CBSE/CISCE norms and applicable law. [Verify references before adoption].` },
      { heading: 'Scope', body: 'Applies to all students, staff, and stakeholders of the school across all stages.' },
      { heading: 'Definitions', body: 'Key terms used in this policy are defined here for clarity and consistent interpretation.' },
      { heading: 'Policy statements', body: 'The school commits to the principles set out below, with clear responsibilities and procedures for implementation.' },
      { heading: 'Procedures', body: 'Step-by-step procedures for routine and exceptional situations covered by this document.' },
      { heading: 'Roles & responsibilities', body: 'Designated authorities and their responsibilities under this document.' },
      { heading: 'Review', body: 'Version 1.0 · Approved by: [Management] · Review date: [Annual].' },
    ],
    evidenceChecklist: [
      { item: 'Signed & dated policy copy', format: 'PDF', responsible: 'Principal' },
      { item: 'Staff acknowledgement records', format: 'Folder', responsible: 'HR' },
      { item: 'Display / circulation proof', format: 'Photo / Circular', responsible: 'Admin' },
    ],
    folderStructure: `${input.documentType.replace(/[^A-Za-z]+/g, '_')}/
  ├── Signed_Policy/
  ├── Acknowledgements/
  └── Circulation_Proof/`,
    improvementPlan: [
      { action: 'Circulate the policy and collect staff acknowledgements', timeline: 'Within 2 weeks', measure: '100% staff signed' },
    ],
  };
}

export const SAMPLE_INPUT: ComplianceInput = {
  mode: 'sqaa',
  domain: 2,
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
