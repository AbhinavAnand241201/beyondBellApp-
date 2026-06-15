import type { AssessmentInput, AssessmentPackage, AssessmentPaper, Question } from './types';
import { buildSectionPlan } from './engine';

/**
 * Worked sample assessment — powers the empty-state preview and the no-backend
 * demo (so the full output/tabs/edit/export UX is reviewable before keys are in).
 * Replace with real `generateAssessment` output once the backend is connected.
 */

const Q = (q: Partial<Question> & { id: string; question: string; marks: number }): Question => ({
  type: 'SA',
  bloom: 'Understand',
  difficulty: 'Medium',
  topic: 'Light',
  answer: 'Model answer to be expanded by the AI backend.',
  valuePoints: ['Key point 1', 'Key point 2'],
  ...q,
});

const SAMPLE_QUESTIONS: Question[] = [
  Q({
    id: 'Q1',
    type: 'MCQ',
    bloom: 'Remember',
    difficulty: 'Easy',
    marks: 1,
    topic: 'Reflection',
    question: 'The angle of incidence is always ____ the angle of reflection.',
    options: ['A) greater than', 'B) less than', 'C) equal to', 'D) unrelated to'],
    answer: 'C) equal to',
    valuePoints: ['Law of reflection'],
  }),
  Q({
    id: 'Q2',
    type: 'MCQ',
    bloom: 'Understand',
    difficulty: 'Easy',
    marks: 1,
    topic: 'Refraction',
    question: 'Light bends when it passes from air into water because its ____ changes.',
    options: ['A) colour', 'B) speed', 'C) frequency', 'D) amplitude'],
    answer: 'B) speed',
    valuePoints: ['Speed changes across media → bending'],
  }),
  Q({
    id: 'Q3',
    type: 'VSA',
    bloom: 'Understand',
    difficulty: 'Medium',
    marks: 2,
    topic: 'Reflection',
    question: 'State the two laws of reflection.',
    answer: '1) Angle of incidence = angle of reflection. 2) Incident ray, reflected ray and normal lie in the same plane.',
    valuePoints: ['Law 1 (1 mark)', 'Law 2 (1 mark)'],
  }),
  Q({
    id: 'Q4',
    type: 'SA',
    bloom: 'Apply',
    difficulty: 'Medium',
    marks: 3,
    topic: 'Refraction',
    question: 'A ray of light enters a glass slab at 40°. Explain what happens to its path and why.',
    answer: 'It bends towards the normal on entering (denser medium, slower speed) and bends away on exiting, emerging parallel to the incident ray.',
    valuePoints: ['Bends towards normal entering (1)', 'Reason: denser/slower (1)', 'Emerges parallel (1)'],
    examinerNote: 'Accept a correctly labelled diagram in place of description.',
  }),
  Q({
    id: 'Q5',
    type: 'LA',
    bloom: 'Analyse',
    difficulty: 'Hard',
    marks: 5,
    topic: 'Lenses',
    question: 'Compare the image formed by a convex lens when the object is (a) beyond 2F and (b) between F and the lens. Support with ray diagrams.',
    answer: '(a) Real, inverted, diminished, between F and 2F. (b) Virtual, erect, magnified, same side as object.',
    valuePoints: ['Case (a) nature + position (2)', 'Case (b) nature + position (2)', 'Diagrams (1)'],
  }),
  Q({
    id: 'Q6',
    type: 'SourceBased',
    bloom: 'Evaluate',
    difficulty: 'HOTS',
    marks: 4,
    topic: 'Applications',
    question: 'A student claims a concave mirror can be used as a shaving mirror at any distance. Evaluate this claim.',
    answer: 'False — it gives an erect, magnified image only when the face is within the focal length; beyond F the image is real and inverted.',
    valuePoints: ['Identifies the within-F condition (2)', 'Explains beyond-F failure (2)'],
  }),
];

function paperFor(input: AssessmentInput): AssessmentPaper {
  const plan = buildSectionPlan(input.board, input.totalMarks);
  // Distribute the sample questions across the planned sections by type, padding
  // with copies so each section shows its planned count (demo only).
  const sections = plan.sections.map((s) => {
    const pool = SAMPLE_QUESTIONS.filter((q) => q.type === s.type);
    const base = pool.length ? pool : SAMPLE_QUESTIONS;
    const questions: Question[] = Array.from({ length: s.count }, (_, i) => {
      const src = base[i % base.length] as Question;
      return { ...src, id: `${s.id}${i + 1}`, marks: s.marksEach };
    });
    return {
      id: s.id,
      name: s.name,
      title: s.title,
      marksEach: s.marksEach,
      instructions: `${s.name}: ${s.title} (${s.marksEach} × ${s.count} = ${s.marks} marks)`,
      questions,
    };
  });

  return {
    header: {
      board: input.board,
      grade: input.grade,
      subject: input.subject || 'Science (Physics)',
      totalMarks: plan.computedTotal,
      duration: `${input.durationMins} min`,
      generalInstructions: [
        'All questions are compulsory.',
        'Marks for each question are indicated against it.',
        'Draw neat, labelled diagrams where necessary.',
        'Write answers in the space provided.',
      ],
    },
    sections,
  };
}

export function demoAssessment(input: AssessmentInput): AssessmentPackage {
  const labels = input.numSets === 1 ? ['Single'] : ['Set A', 'Set B', 'Set C'].slice(0, input.numSets);
  return {
    sets: labels.map((label) => ({ label, paper: paperFor(input) })),
    includeAnswerKey: input.includeAnswerKey,
    includeMarkingScheme: input.includeMarkingScheme,
  };
}

export const SAMPLE_INPUT: AssessmentInput = {
  board: 'CBSE',
  grade: 'Class 10',
  subject: 'Science (Physics)',
  topics: ['Light — Reflection & Refraction'],
  totalMarks: 25,
  durationMins: 60,
  questionTypes: ['MCQ', 'VSA', 'SA', 'LA', 'SourceBased'],
  difficultyMix: { easy: 30, medium: 50, hard: 20 },
  bloomFocus: [],
  hots: 'Auto',
  numSets: 1,
  includeAnswerKey: true,
  includeMarkingScheme: true,
  specialInstructions: '',
};
