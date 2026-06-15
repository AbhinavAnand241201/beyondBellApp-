import { apiPost } from '@/lib/api';
import type { ComplianceDocument, ComplianceInput } from './types';

/**
 * Compliance Generator API binding (design doc §3). Accuracy-critical, Claude on
 * the server; the client sends the mode + inputs and renders the document.
 *
 * Backend off ⇒ ApiError status 0 ⇒ screen falls back to `demoDocument`.
 */
export async function generateCompliance(input: ComplianceInput): Promise<ComplianceDocument> {
  return apiPost<ComplianceDocument>('/api/ai/compliance-generator', input);
}
