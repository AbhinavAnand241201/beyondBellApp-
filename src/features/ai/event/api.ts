import { apiPost } from '@/lib/api';
import type { EventBlueprint, EventInput, ThemeSuggestion } from './types';

/**
 * Event Architect API bindings (design doc §3 — three-agent pipeline). Server runs
 * the concept → operations → comms agents and persists; the client sends inputs.
 *
 * Backend off ⇒ `apiPost` throws ApiError status 0 ⇒ screen falls back to sample.ts.
 */

/** Pre-generation theme suggestions (§2.2) — returns 3 options. */
export async function suggestThemes(input: EventInput): Promise<ThemeSuggestion[]> {
  return apiPost<ThemeSuggestion[]>('/api/ai/event-architect/themes', input);
}

/** Full 8-document blueprint (§1.3). */
export async function generateBlueprint(input: EventInput): Promise<EventBlueprint> {
  return apiPost<EventBlueprint>('/api/ai/event-architect', input);
}
