import { supabase } from '@/lib/supabase';
import type { WizardData } from './types';

/**
 * Onboarding writes — the RN analogue of `src/lib/onboarding/actions.ts` (§18.3).
 *
 * The `handle_new_user` trigger already created the `users`, `educator_profiles`
 * and `onboarding_progress` rows at signup, so every write here is an UPDATE, not
 * an INSERT. We never touch `circle_points` (DB-driven, §9).
 */

export type SaveResult = { error: string | null };

/** Persist the editable identity field on `users`. */
async function saveUserFields(userId: string, data: WizardData): Promise<SaveResult> {
  const { error } = await supabase
    .from('users')
    .update({ display_name: data.display_name.trim(), role: data.role })
    .eq('id', userId);
  return { error: error?.message ?? null };
}

/** Persist the educator profile fields. */
async function saveProfileFields(userId: string, data: WizardData): Promise<SaveResult> {
  const { error } = await supabase
    .from('educator_profiles')
    .update({
      designation: data.designation.trim() || null,
      boards: data.boards,
      grades: data.grades,
      subjects: data.subjects,
      school_name: data.school_name.trim() || null,
      show_school_name: data.show_school_name,
      city: data.city.trim() || null,
      state: data.state.trim() || null,
      years_exp: data.years_exp,
      specialist_areas: data.specialist_areas,
      bio: data.bio.trim() || null,
      language_preference: data.language_preference,
      contact_phone: data.contact_phone.trim() || null,
    })
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

/** Record how far the user has progressed, so the wizard can resume (§8.1). */
export async function advanceStep(userId: string, step: number): Promise<SaveResult> {
  const { error } = await supabase
    .from('onboarding_progress')
    .update({ wizard_step: step })
    .eq('user_id', userId);
  return { error: error?.message ?? null };
}

/**
 * Final commit: write all collected fields, then mark the wizard complete. The
 * completion stamps are what the §7 gate reads to route to the dashboard.
 */
export async function finishOnboarding(userId: string, data: WizardData): Promise<SaveResult> {
  const userRes = await saveUserFields(userId, data);
  if (userRes.error) return userRes;

  const profileRes = await saveProfileFields(userId, data);
  if (profileRes.error) return profileRes;

  const { error: completeProfileError } = await supabase
    .from('educator_profiles')
    .update({ onboarding_completed: true })
    .eq('user_id', userId);
  if (completeProfileError) return { error: completeProfileError.message };

  const { error: completeProgressError } = await supabase
    .from('onboarding_progress')
    .update({ wizard_step: 5, wizard_completed_at: new Date().toISOString() })
    .eq('user_id', userId);
  return { error: completeProgressError?.message ?? null };
}
