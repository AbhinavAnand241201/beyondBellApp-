import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, SkeletonList, Text } from '@/components/ui';
import { ErrorState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { fetchSpaces, joinSpace, leaveSpace, SPACE_TYPE_ICON, type SpaceSummary } from '@/features/spaces/queries';
import { tierAtLeast } from '@/lib/tier';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function SpacesTab() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const tier = me.data?.tier ?? 'free';
  const queryClient = useQueryClient();

  const spaces = useQuery({
    queryKey: ['spaces', user?.id],
    queryFn: () => fetchSpaces(user?.id as string),
    enabled: !!user?.id,
  });

  const toggle = useMutation({
    mutationFn: ({ space, join }: { space: SpaceSummary; join: boolean }) =>
      join ? joinSpace(user?.id as string, space.id) : leaveSpace(user?.id as string, space.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['spaces', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t update', (e as Error).message),
  });

  function onCardPress(space: SpaceSummary) {
    const locked = space.accessTier === 'pro' && !tierAtLeast(tier, 'pro');
    if (locked) {
      Alert.alert(space.name, 'Connect with principals and school leaders. Available on the Pro plan.', [
        { text: 'Maybe later', style: 'cancel' },
        { text: 'See Pro', onPress: () => router.push('/(main)/upgrade') },
      ]);
      return;
    }
    router.push(`/(main)/spaces/${space.id}`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">Spaces</Text>
        <Text variant="body" color={colors.muted}>
          Join circles for your board, subject and interests.
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Button title="Study Groups" variant="secondary" size="sm" onPress={() => router.push('/(main)/groups')} leftIcon={<Ionicons name="people-circle-outline" size={15} color={colors.ink} />} />
          <Button title="Resources" variant="secondary" size="sm" onPress={() => router.push('/(main)/resources')} leftIcon={<Ionicons name="library-outline" size={15} color={colors.ink} />} />
        </View>
      </View>

      {!env.isConfigured ? (
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load Spaces." />
        </View>
      ) : spaces.isLoading ? (
        <SkeletonList />
      ) : spaces.isError ? (
        <ErrorState message="Couldn’t load Spaces." onRetry={() => spaces.refetch()} />
      ) : (
        <FlatList
          data={spaces.data}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          renderItem={({ item }) => (
            <SpaceCard space={item} tier={tier} busy={toggle.isPending} onPress={() => onCardPress(item)} onToggle={(join) => toggle.mutate({ space: item, join })} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SpaceCard({
  space,
  tier,
  busy,
  onPress,
  onToggle,
}: {
  space: SpaceSummary;
  tier: string;
  busy: boolean;
  onPress: () => void;
  onToggle: (join: boolean) => void;
}) {
  const locked = space.accessTier === 'pro' && tier !== 'pro';
  const canLeave = space.joined && !space.isPermanent && !space.isAutoJoined;
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={styles.icon}>
            <Ionicons name={SPACE_TYPE_ICON[space.type] as keyof typeof Ionicons.glyphMap} size={20} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                {space.name}
              </Text>
              {locked ? <Ionicons name="lock-closed" size={13} color={colors.amberDark} /> : null}
              {space.accessTier === 'pro' ? <Pill label="Pro" tone="amber" /> : null}
            </View>
            <Text variant="caption" color={colors.muted}>
              {space.memberCount} member{space.memberCount === 1 ? '' : 's'}
            </Text>
          </View>
          {space.joined ? (
            canLeave ? (
              <Button title="Leave" variant="secondary" size="sm" loading={busy} onPress={() => onToggle(false)} />
            ) : (
              <Pill label="Joined" tone="success" />
            )
          ) : (
            <Button title="Join" size="sm" loading={busy} onPress={() => onToggle(true)} />
          )}
        </View>
        {space.description ? (
          <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }} numberOfLines={2}>
            {space.description}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: 2 },
  icon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FCE8B8', alignItems: 'center', justifyContent: 'center' },
});
