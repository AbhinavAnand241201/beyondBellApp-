import type { PrincipalAnswer } from './types';

/**
 * Demo answer generator — powers the no-backend preview so the conversational UX
 * (4-part structure, confidence badge, citations, escalation) is reviewable.
 * Real answers come from the RAG pipeline server-side (§3.4). This heuristic only
 * detects safeguarding keywords to demonstrate the Escalate path (§3.6).
 */
const SAFEGUARDING = /\b(abuse|pocso|child protection|safeguard|harassment|suicide|self-harm)\b/i;
const LEGAL = /\b(legal|lawyer|court|complaint|fir|terminate|dismiss)\b/i;

export function demoAnswer(query: string): PrincipalAnswer {
  if (SAFEGUARDING.test(query)) {
    return {
      directAnswer:
        'Any disclosure or suspicion of child abuse triggers a mandatory reporting obligation under the POCSO Act, 2012. Failure to report is itself a punishable offence.',
      source: 'POCSO Act 2012, Sections 19–21 · NCPCR safeguarding guidelines',
      recommendedAction:
        'Record the disclosure factually, do not investigate yourself, inform the designated child-protection officer, and report to the local Special Juvenile Police Unit / Childline (1098) without delay.',
      caution:
        'This requires immediate action. Contact the SJPU / Childline (1098) now and involve your legal advisor and management. Do not contact the alleged abuser.',
      confidence: 'Escalate',
      citations: [
        { label: 'POCSO Act 2012', reference: 'Sections 19–21 (mandatory reporting)' },
        { label: 'Childline India', reference: 'Helpline 1098' },
      ],
    };
  }

  if (LEGAL.test(query)) {
    return {
      directAnswer:
        'Your position depends on the documented process you have followed. Most actions of this kind are defensible only when due process, written notice, and records are in order.',
      source: 'Applicable service rules / Labour law + school’s own approved policy',
      recommendedAction:
        'Assemble the relevant records, follow the prescribed notice and hearing procedure, and document every step before acting.',
      caution:
        'This carries legal exposure. Have your school’s legal advisor review the specific facts before you act or communicate externally.',
      confidence: 'Medium',
      citations: [{ label: 'Education service rules', reference: 'Verify the exact provision for your state/board' }],
    };
  }

  return {
    directAnswer:
      'Here is the general policy framework for your question. The specifics can vary by board circular and state rules, so treat this as guidance rather than a final ruling.',
    source: 'NEP 2020 / RTE Act / relevant board circular (general framework)',
    recommendedAction:
      'Confirm the current circular on the official board portal, then apply the steps to your school’s context and document the decision.',
    caution:
      'If this becomes a dispute or involves money, safety, or staff action, escalate to your board/management and seek professional advice.',
    confidence: 'Medium',
    citations: [{ label: 'Official board portal', reference: 'Check the latest circular before acting' }],
  };
}
