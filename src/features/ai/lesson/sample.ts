import type { LessonInput, LessonPlan } from './types';

/**
 * A fully-worked sample lesson plan. It powers two UI needs while the AI backend
 * is not yet connected (§2.3 "Empty state" sample preview):
 *   1. the preview card on the empty input screen, and
 *   2. the demo generation so the output / customise / export UX is reviewable.
 * Replace with real `generateLesson` output once `EXPO_PUBLIC_API_BASE_URL` is set.
 */
export const SAMPLE_PLAN: LessonPlan = {
  header: {
    board: 'CBSE',
    grade: 'Class 7',
    subject: 'Science (General)',
    topic: 'Photosynthesis',
    duration: '40 min',
    date: '[Date]',
    teacher: '[Teacher Name]',
  },
  objectives: [
    'Explain how plants make their own food through photosynthesis.',
    'Identify the raw materials and products of photosynthesis.',
    'Describe the role of chlorophyll and sunlight in the process.',
  ],
  bloom_levels: ['Understand', 'Remember', 'Apply'],
  materials: [
    'NCERT Science Class 7 — Chapter 1 "Nutrition in Plants"',
    'A potted green plant and a variegated leaf',
    'Chart / projector for the photosynthesis diagram',
    'Worksheet: "Label the leaf" (printable)',
  ],
  hook: {
    activity: 'The “invisible kitchen” puzzle',
    duration: '6 min',
    instructions:
      'Hold up a leaf and ask: “This plant has never eaten a meal — so how is it alive and growing?” Let pairs guess for 60 seconds, then reveal that every green leaf is a tiny food factory powered by sunlight.',
  },
  concept_delivery: [
    {
      step: 1,
      title: 'The raw materials',
      content:
        'Introduce the three ingredients a plant needs: carbon dioxide (from air), water (from roots), and sunlight (energy).',
      teacher_action: 'Draw the leaf cross-section and label stomata, water path, and sunlight.',
      student_action: 'Copy the labelled diagram and underline the three raw materials.',
    },
    {
      step: 2,
      title: 'The role of chlorophyll',
      content:
        'Explain that chlorophyll (the green pigment) captures sunlight. Use the variegated leaf to show where photosynthesis can and cannot happen.',
      teacher_action: 'Compare the green vs. white parts of the variegated leaf.',
      student_action: 'Predict which part makes food and justify the answer to a partner.',
    },
    {
      step: 3,
      title: 'The products',
      content:
        'Show the word equation: Carbon dioxide + Water → (sunlight + chlorophyll) → Glucose + Oxygen. Connect glucose to plant growth and oxygen to the air we breathe.',
      teacher_action: 'Write the word equation and think aloud through each term.',
      student_action: 'Recite the equation and tag each term as “raw material” or “product”.',
    },
  ],
  student_activity: {
    type: 'Pair',
    title: 'Build the photosynthesis equation',
    instructions:
      'In pairs, cut out the word cards (CO₂, water, sunlight, chlorophyll, glucose, oxygen) and arrange them into the correct equation on your desk. Then write one sentence explaining what the plant gains.',
    success_criteria:
      'The equation is arranged correctly and the sentence names glucose as the plant’s food.',
    duration: '12 min',
  },
  formative_check: {
    questions: [
      'Name the two raw materials a plant takes in for photosynthesis.',
      'Why can a plant not make food in the dark?',
      'Which gas do plants release that humans need?',
    ],
    exit_ticket: 'In one sentence: why is a green leaf like a tiny kitchen?',
  },
  differentiation: {
    support: 'Provide a half-completed diagram and word bank for learners who need scaffolding.',
    extension: 'Ask advanced learners to explain what happens to photosynthesis on a cloudy day.',
  },
  homework:
    'Read NCERT Chapter 1, pages 1–4, and draw a labelled diagram of photosynthesis with the word equation underneath.',
};

export const SAMPLE_INPUT: LessonInput = {
  board: 'CBSE',
  grade: 'Class 7',
  subject: 'Science (General)',
  topic: 'Photosynthesis',
  durationMinutes: 40,
  objective: '',
  difficulty: 'Standard',
  studentProfile: ['Mixed ability'],
  language: 'English',
  specialInstructions: 'Include a group activity',
};

/** Build a plan from arbitrary inputs by adapting the sample's header (demo only). */
export function demoPlanFor(input: LessonInput): LessonPlan {
  return {
    ...SAMPLE_PLAN,
    header: {
      ...SAMPLE_PLAN.header,
      board: input.board,
      grade: input.grade,
      subject: input.subject || SAMPLE_PLAN.header.subject,
      topic: input.topic || SAMPLE_PLAN.header.topic,
      duration: `${input.durationMinutes} min`,
    },
  };
}
