import { apiPost } from '@/lib/api';
import type { ParentInput, ParentMessageOutput } from './types';

/**
 * Parent Communicator API bindings (design doc §3). This tool is Claude-only on
 * the server (§3.1) and enforces safety guardrails (§3.4) server-side; the client
 * just sends inputs / refinement instructions and renders the result.
 *
 * Backend off ⇒ `apiPost` throws ApiError status 0 ⇒ screen falls back to sample.ts.
 */
export async function generateMessage(input: ParentInput): Promise<ParentMessageOutput> {
  return apiPost<ParentMessageOutput>('/api/ai/parent-communicator', input);
}

/** One-click / freeform refinement — returns the updated message set (§3.3). */
export async function refineMessage(
  current: ParentMessageOutput,
  instruction: string,
  input: ParentInput,
): Promise<ParentMessageOutput> {
  return apiPost<ParentMessageOutput>('/api/ai/parent-communicator/refine', { current, instruction, input });
}

/** Save the message as a reusable template — Standard/Pro (§4.1). */
export async function saveTemplate(title: string, situationId: string, text: string, format: string): Promise<void> {
  await apiPost<{ ok: true }>('/api/ai/parent-communicator/template', { title, situationId, text, format });
}
