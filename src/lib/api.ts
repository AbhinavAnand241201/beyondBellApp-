import { supabase } from '@/lib/supabase';
import { env } from '@/config/env';

/**
 * HTTP client for Path-B server logic (§5, §18.2). The web keeps tier checks,
 * rate limits and AI calls in Next.js `/api/*` routes. The mobile app reaches the
 * same logic by POSTing to the deployed backend with the user's Supabase JWT as a
 * Bearer token (the routes currently read the cookie session — they need a small
 * tweak to also accept `Authorization: Bearer`, per §18.2).
 *
 * `EXPO_PUBLIC_API_BASE_URL` selects the backend; when unset, `isApiConfigured`
 * is false and callers should show a "not available" state rather than failing.
 */
export const isApiConfigured = env.apiBaseUrl.trim().length > 0;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError('AI backend is not configured. Set EXPO_PUBLIC_API_BASE_URL.', 0);
  }
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json', ...(await authHeader()) };

  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const text = await res.text();
  const json: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && 'error' in json && typeof (json as { error: unknown }).error === 'string'
        ? (json as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return json as T;
}
