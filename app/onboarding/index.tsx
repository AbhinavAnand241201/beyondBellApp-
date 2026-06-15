import { Redirect } from 'expo-router';

// The wizard lives under /onboarding/profile (matching the web route). Entering
// /onboarding forwards to step 1. Built out in Tasks 9–10.
export default function OnboardingEntry() {
  return <Redirect href="/onboarding/profile" />;
}
