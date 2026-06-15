import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';

/**
 * Auth route group. If a session already exists, bounce to the root gate (`/`)
 * which decides dashboard-vs-onboarding (§7). Otherwise render the auth stack.
 */
export default function AuthLayout() {
  const { session, initializing } = useAuth();

  if (initializing) return null;
  if (session) return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
