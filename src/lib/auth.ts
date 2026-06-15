import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { AuthError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

/**
 * Auth operations — the RN analogue of the web app's server actions in
 * `src/app/(auth)/actions.ts` (§7): signUp, signIn, signInWithGoogle,
 * signInWithPhone, verifyPhoneOtp, signOut.
 *
 * The `handle_new_user` DB trigger provisions `users` / `educator_profiles` /
 * `onboarding_progress` and auto-joins default spaces regardless of which client
 * created the auth user, so mobile signups get the same bootstrap as web (§7).
 */

export type AuthResult = { error: string | null };

function toMessage(error: AuthError | null): string | null {
  return error ? error.message : null;
}

/** Indian numbers: normalise to E.164 (+91XXXXXXXXXX). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return `+${digits}`;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  return { error: toMessage(error) };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
  });
  return { error: toMessage(error) };
}

/** Request an SMS OTP for the given Indian phone number. */
export async function signInWithPhone(phone: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
  return { error: toMessage(error) };
}

/** Verify the 6-digit SMS OTP and establish a session. */
export async function verifyPhoneOtp(phone: string, token: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token: token.trim(),
    type: 'sms',
  });
  return { error: toMessage(error) };
}

/**
 * Google OAuth via the system browser + a deep-link redirect back into the app.
 * Web uses a server callback route; mobile uses the PKCE code-exchange flow:
 *  1. ask Supabase for the provider URL (skip its own redirect),
 *  2. open it in an auth session bound to our `beyondbell://` scheme,
 *  3. exchange the returned `?code=` for a session.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectTo = Linking.createURL('/auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: error.message };
  if (!data.url) return { error: 'Could not start Google sign-in.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    return { error: result.type === 'cancel' ? 'Sign-in cancelled.' : 'Sign-in failed.' };
  }

  const { queryParams } = Linking.parse(result.url);
  const getParam = (key: string): string | undefined => {
    const v = queryParams?.[key];
    return Array.isArray(v) ? v[0] : (v ?? undefined);
  };

  const errorCode = getParam('error') ?? getParam('error_code');
  if (errorCode) return { error: errorCode };

  const code = getParam('code');
  if (!code) return { error: 'No authorization code returned.' };

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  return { error: toMessage(exchangeError) };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Send a password-reset email with a deep link back into the app (§2.11). */
export async function resetPassword(email: string): Promise<AuthResult> {
  const redirectTo = Linking.createURL('/auth/reset-password');
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
  return { error: toMessage(error) };
}

/** Set a new password (used after the recovery deep link establishes a session). */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: toMessage(error) };
}
