import { apiPost } from '@/lib/api';
import type { AssessmentInput, AssessmentPackage, Question } from './types';

/**
 * Assessment Builder API bindings (design doc §3 — two-agent generation, §3.4
 * multi-set, §5.2 question bank). Server owns the AI calls, guardrails (§3.5),
 * and persistence; the client sends inputs and renders the package.
 *
 * When `EXPO_PUBLIC_API_BASE_URL` is unset, `apiPost` throws ApiError status 0
 * and the screen falls back to the bundled sample (see sample.ts).
 */
export async function generateAssessment(input: AssessmentInput): Promise<AssessmentPackage> {
  return apiPost<AssessmentPackage>('/api/ai/assessment-builder', input);
}

/** Rephrase / edit a single question with AI (§2.4 edit mode). */
export async function rephraseQuestion(question: Question, instruction: string): Promise<Question> {
  return apiPost<Question>('/api/ai/assessment-builder/question', { question, instruction });
}

/** Save a question to the personal question bank — Pro feature (§5.2). */
export async function saveQuestionToBank(question: Question, meta: { subject: string; board: string; grade: string }): Promise<void> {
  await apiPost<{ ok: true }>('/api/ai/assessment-builder/bank', { question, ...meta });
}
