import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';

/** Onboarding requires a session but (by definition) not a completed profile. */
export default function OnboardingLayout() {
  const { session, initializing } = useAuth();

  if (initializing) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
