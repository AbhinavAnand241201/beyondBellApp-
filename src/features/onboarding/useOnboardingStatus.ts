import { useQuery } from '@tanstack/react-query';

import { fetchOnboardingStatus, type OnboardingStatus } from './status';

/**
 * Loads the onboarding gate status for a user. Disabled until we have a user id.
 * Cached so the root gate and the wizard share one source of truth.
 */
export function useOnboardingStatus(userId: string | undefined) {
  return useQuery<OnboardingStatus>({
    queryKey: ['onboarding-status', userId],
    queryFn: () => fetchOnboardingStatus(userId as string),
    enabled: !!userId,
    staleTime: 0, // always re-check on entry; cheap and routing-critical
  });
}
