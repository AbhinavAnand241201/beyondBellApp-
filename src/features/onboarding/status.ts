import { supabase } from '@/lib/supabase';

/**
 * The canonical post-auth routing rule, reused on web in `actions.ts`,
 * `auth/callback/route.ts`, and `middleware.ts` (§7):
 *
 *   onboardingDone =
 *     onboarding_progress.wizard_completed_at != null
 *     OR onboarding_progress.wizard_step >= 5
 *     OR educator_profiles.onboarding_completed === true   // legacy fallback
 *
 * If done → dashboard tabs, else → onboarding wizard.
 */
export interface OnboardingStatus {
  done: boolean;
  /** Current wizard step (1–5) so the wizard can resume where the user left off. */
  step: number;
}

export async function fetchOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const [progressRes, profileRes] = await Promise.all([
    supabase
      .from('onboarding_progress')
      .select('wizard_step, wizard_completed_at')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('educator_profiles')
      .select('onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const progress = progressRes.data as { wizard_step: number | null; wizard_completed_at: string | null } | null;
  const profile = profileRes.data as { onboarding_completed: boolean | null } | null;

  const step = progress?.wizard_step ?? 1;
  const done =
    progress?.wizard_completed_at != null ||
    (progress?.wizard_step ?? 0) >= 5 ||
    profile?.onboarding_completed === true;

  return { done, step };
}
