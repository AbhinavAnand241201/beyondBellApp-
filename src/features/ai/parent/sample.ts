import { getSituation, type ParentInput, type ParentMessageOutput } from './types';

/**
 * Demo message generator — powers the empty-state preview and no-backend demo.
 * Produces only the requested formats. Replace with real `generateMessage`
 * output once the backend is connected.
 */
export function demoMessage(input: ParentInput): ParentMessageOutput {
  const sit = getSituation(input.situationId);
  const student = input.studentName.trim() || 'your child';
  const parent = input.parentName.trim() || `Parent of ${student}`;
  const tone = input.tone === 'Auto' ? (sit?.defaultTone ?? 'Warm') : input.tone;
  const ctx = input.context.trim() || 'the matter we discussed';

  const out: ParentMessageOutput = {
    toneApplied: tone,
    toneNote: `Applied a ${tone.toLowerCase()} tone — ${sit?.toneGuidance ?? 'matched to the situation.'}`,
    formats: {},
  };

  if (input.formats.includes('whatsapp')) {
    out.formats.whatsapp =
      `Dear ${parent},\n\n` +
      `I wanted to share a quick note about ${student}. ${ctx}.\n\n` +
      `We value our partnership in supporting ${student}, and I’m happy to talk further.\n\n` +
      `Please let me know if you have any questions.`;
  }
  if (input.formats.includes('email')) {
    out.formats.email = {
      subject: `Regarding ${student} — ${sit?.label ?? 'a quick update'}`,
      body:
        `Dear ${parent},\n\n` +
        `I hope this message finds you well. I’m writing regarding ${student}. ${ctx}.\n\n` +
        `We would welcome the chance to work together on this. Please feel free to reach out at a time that suits you.\n\n` +
        `Warm regards,\n[Teacher Name]\n[School Name]`,
    };
  }
  if (input.formats.includes('diary')) {
    out.formats.diary = `[Date] — Note regarding ${student}: ${ctx}. Kindly acknowledge. Parent signature: ____________`;
  }
  if (input.formats.includes('sms')) {
    out.formats.sms = `Dear ${parent}, a quick note about ${student}: ${ctx.slice(0, 80)}. Please contact the school. — [Teacher]`.slice(0, 160);
  }

  return out;
}

export const SAMPLE_INPUT: ParentInput = {
  situationId: 'progress_positive',
  studentName: 'Aarav',
  grade: 'Class 7',
  parentName: '',
  context: 'Has shown excellent improvement in maths this month, especially in problem-solving',
  tone: 'Auto',
  formats: ['whatsapp', 'email'],
  language: 'English',
  additionalInstruction: '',
};
