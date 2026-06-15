import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ErrorState, LoadingState } from '@/components/QueryStates';
import { ProfileView } from '@/features/profile/ProfileView';
import { fetchProfile, followUser, unfollowUser, type ProfileData } from '@/features/profile/queries';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canDirectMessage } from '@/lib/tier';
import { colors } from '@/theme/tokens';

export default function PublicProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();

  const profile = useQuery<ProfileData>({
    queryKey: ['profile', userId, user?.id],
    queryFn: () => fetchProfile(userId as string, user?.id as string),
    enabled: !!userId && !!user?.id,
  });

  const follow = useMutation({
    mutationFn: (next: boolean) => (next ? followUser(user?.id as string, userId as string) : unfollowUser(user?.id as string, userId as string)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', userId, user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['following-ids', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t update', (e as Error).message),
  });

  const isSelf = profile.data?.isSelf ?? false;
  // DM button only for Standard+ (§2.99/2.125).
  const canDM = canDirectMessage(me.data?.tier ?? 'free');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: profile.data?.displayName ?? 'Profile', headerBackTitle: 'Back' }} />
      {profile.isLoading ? (
        <LoadingState />
      ) : profile.isError || !profile.data ? (
        <ErrorState message="Couldn’t load this profile." onRetry={() => profile.refetch()} />
      ) : (
        <ProfileView
          profile={profile.data}
          onToggleFollow={isSelf ? undefined : (next) => follow.mutate(next)}
          followBusy={follow.isPending}
          onMessage={isSelf || !canDM ? undefined : () => router.push(`/(main)/messages/${userId}`)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
});
