import { View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { PointsListener } from '@/features/reputation/PointsListener';
import { colors, spacing } from '@/theme/tokens';

/**
 * Protected app group. Every screen under `(main)` is guarded uniformly (no
 * session → sign-in). This is a Stack so feature detail screens push *over* the
 * bottom tabs. Permanently-banned users (§2.118) are blocked from the whole app.
 */
export default function MainLayout() {
  const { session, initializing, signOut } = useAuth();
  const me = useCurrentUser(session?.user.id);

  if (initializing) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;

  if (me.data?.isBanned) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Ionicons name="ban-outline" size={44} color={colors.danger} />
        <Text variant="h2" style={{ textAlign: 'center' }}>
          Account suspended
        </Text>
        <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
          Your account has been suspended for violating our community standards. Contact support if you believe this is a mistake.
        </Text>
        <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <PointsListener />
    </>
  );
}
