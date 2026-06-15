import { apiPost } from '@/lib/api';
import type { ChatMessage, PrincipalAnswer } from './types';

/**
 * Principal Desk API binding (design doc §3). The server runs the RAG pipeline
 * (embed → pgvector search → Claude with retrieved context, §3.4) and returns the
 * 4-part structured answer + confidence + citations. The client sends the prior
 * turns for session context (§3.5).
 *
 * Backend off ⇒ ApiError status 0 ⇒ screen falls back to `demoAnswer`.
 */
export async function askPrincipalDesk(history: ChatMessage[], query: string): Promise<PrincipalAnswer> {
  // Send a compact transcript so the server can maintain context.
  const turns = history
    .map((m) =>
      m.role === 'user'
        ? { role: 'user' as const, content: m.text }
        : m.pending
          ? null
          : { role: 'assistant' as const, content: m.answer.directAnswer },
    )
    .filter(Boolean);
  return apiPost<PrincipalAnswer>('/api/ai/principal-desk', { history: turns, query });
}
