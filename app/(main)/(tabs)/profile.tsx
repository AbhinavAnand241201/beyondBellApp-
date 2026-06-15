import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Banner, Text } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { ProfileView } from '@/features/profile/ProfileView';
import { fetchProfile, type ProfileData } from '@/features/profile/queries';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const profile = useQuery<ProfileData>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id as string, user?.id as string),
    enabled: !!user?.id,
  });

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You’ll need to sign in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }

  if (!env.isConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <Text variant="h1">Profile</Text>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load your profile." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.headerBar}>
        <Text variant="h2">Profile</Text>
        <Pressable onPress={() => router.push('/(main)/settings')} hitSlop={8} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>
      {profile.isLoading ? (
        <LoadingState />
      ) : profile.isError || !profile.data ? (
        <ErrorState message="Couldn’t load your profile." onRetry={() => profile.refetch()} />
      ) : (
        <ProfileView profile={profile.data} onSignOut={confirmSignOut} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
