import { apiPost } from '@/lib/api';
import type { CustomisableSection, LessonInput, LessonPlan } from './types';

/**
 * Lesson Architect API bindings (§3.3–§3.5). These call the deployed Next.js
 * routes (or future Edge Functions) with the user's JWT via `apiPost`. The server
 * owns auth, tier rate-limiting, the Claude/Gemini call, JSON parsing and
 * `ai_tool_usage` persistence — the client just sends inputs and renders output.
 *
 * Until `EXPO_PUBLIC_API_BASE_URL` is set, `apiPost` throws `ApiError` with
 * status 0; the screen catches that and falls back to the bundled sample so the
 * full UX stays reviewable.
 */
export async function generateLesson(input: LessonInput): Promise<LessonPlan> {
  return apiPost<LessonPlan>('/api/ai/lesson-architect', input);
}

/** Customise-with-AI: edit a single section without regenerating the rest (§3.5). */
export async function customiseSection(
  plan: LessonPlan,
  section: CustomisableSection,
  instruction: string,
): Promise<LessonPlan> {
  return apiPost<LessonPlan>('/api/ai/lesson-architect/section', { plan, section, instruction });
}
