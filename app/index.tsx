import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { Button, Screen, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useOnboardingStatus } from '@/features/onboarding/useOnboardingStatus';
import { colors } from '@/theme/tokens';

function FullScreenSpinner() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
      <ActivityIndicator color={colors.amber} />
    </View>
  );
}

/**
 * Root gate. Mirrors the web's post-auth routing (§7):
 *   no session            → auth stack
 *   session + not onboarded → onboarding wizard
 *   session + onboarded     → main tabs
 */
export default function Index() {
  const { initializing, user } = useAuth();
  const status = useOnboardingStatus(user?.id);

  if (initializing) return <FullScreenSpinner />;
  if (!user) return <Redirect href="/(auth)/sign-in" />;

  if (status.isLoading) return <FullScreenSpinner />;

  if (status.isError) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Text variant="h3">Couldn’t load your account</Text>
          <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            Check your connection and try again.
          </Text>
          <Button title="Retry" onPress={() => status.refetch()} />
        </View>
      </Screen>
    );
  }

  return status.data?.done ? <Redirect href="/(main)" /> : <Redirect href="/onboarding" />;
}
