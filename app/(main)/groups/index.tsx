import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, OptionChip, Pill, SkeletonList, Text, TextField } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { fetchMyGroups, fetchPublicGroups, joinGroup, GROUP_SUBJECTS, type GroupSummary } from '@/features/groups/queries';
import { analytics } from '@/lib/analytics';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

const LEVEL_TO_CREATE = 3;

export default function GroupsScreen() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<string | null>(null);

  const mine = useQuery({ queryKey: ['my-groups', user?.id], queryFn: () => fetchMyGroups(user?.id as string), enabled: !!user?.id && env.isConfigured });
  const explore = useQuery({
    queryKey: ['public-groups', user?.id, subject, search],
    queryFn: () => fetchPublicGroups(user?.id as string, { subject, search }),
    enabled: !!user?.id && env.isConfigured,
  });

  const join = useMutation({
    mutationFn: (g: GroupSummary) => joinGroup(user?.id as string, g.id),
    onSuccess: () => {
      analytics.track('group_joined');
      void queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      void queryClient.invalidateQueries({ queryKey: ['my-groups', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t join', (e as Error).message),
  });

  const canCreate = (me.data?.level ?? 1) >= LEVEL_TO_CREATE;

  function onCreate() {
    if (!canCreate) {
      Alert.alert('Reach Level 3 to create groups', 'Earn 500+ Circle Points by contributing to unlock group creation.');
      return;
    }
    router.push('/(main)/groups/create');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Study Groups', headerBackTitle: 'Back' }} />
      {!env.isConfigured ? (
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load Study Groups." />
        </View>
      ) : (
        <FlatList
          data={explore.data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          ListHeaderComponent={
            <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
              <Button title={canCreate ? 'Create a group' : 'Create a group (Level 3)'} onPress={onCreate} leftIcon={<Ionicons name="add" size={16} color={colors.ink} />} />

              {(mine.data?.length ?? 0) > 0 ? (
                <View style={{ gap: spacing.sm }}>
                  <Text variant="label">Your groups</Text>
                  {mine.data?.map((g: GroupSummary) => (
                    <GroupCard key={g.id} group={g} busy={false} onOpen={() => router.push(`/(main)/groups/${g.id}`)} onJoin={() => {}} />
                  ))}
                </View>
              ) : null}

              <Text variant="label">Explore</Text>
              <TextField value={search} onChangeText={setSearch} placeholder="Search groups…" autoCapitalize="none" />
              <FlatList
                horizontal
                data={['All', ...GROUP_SUBJECTS]}
                keyExtractor={(s) => s}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
                renderItem={({ item }) => (
                  <OptionChip label={item} selected={item === 'All' ? subject === null : subject === item} onPress={() => setSubject(item === 'All' ? null : item)} />
                )}
              />
            </View>
          }
          renderItem={({ item }) => (
            <GroupCard group={item} busy={join.isPending} onOpen={() => router.push(`/(main)/groups/${item.id}`)} onJoin={() => join.mutate(item)} />
          )}
          ListEmptyComponent={
            explore.isLoading ? <SkeletonList /> : explore.isError ? <ErrorState onRetry={() => explore.refetch()} /> : <EmptyState icon="people-circle-outline" title="No groups found" message="Try a different subject or be the first to create one." />
          }
        />
      )}
    </SafeAreaView>
  );
}

function GroupCard({ group, busy, onOpen, onJoin }: { group: GroupSummary; busy: boolean; onOpen: () => void; onJoin: () => void }) {
  const full = group.memberCount >= group.maxMembers;
  return (
    <Pressable onPress={onOpen}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="label" numberOfLines={1} style={{ flexShrink: 1 }}>
                {group.name}
              </Text>
              {group.subjectTag ? <Pill label={group.subjectTag} tone="amber" /> : null}
            </View>
            <Text variant="caption" color={colors.muted}>
              {group.memberCount}/{group.maxMembers} members
            </Text>
          </View>
          {group.isMember ? (
            <Pill label="Member" tone="success" />
          ) : (
            <Button title={full ? 'Request' : 'Join'} size="sm" loading={busy} onPress={onJoin} />
          )}
        </View>
        {group.description ? (
          <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
