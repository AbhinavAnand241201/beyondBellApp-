import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, Button, Card, Pill, Text, TextField } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { fetchGroupDetail, leaveGroup, postToGroup, type GroupPost } from '@/features/groups/queries';
import { timeAgo } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const key = ['group', id, user?.id];
  const detail = useQuery({ queryKey: key, queryFn: () => fetchGroupDetail(id as string, user?.id as string), enabled: !!id && !!user?.id });

  const post = useMutation({
    mutationFn: () => postToGroup(id as string, user?.id as string, body),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e) => Alert.alert('Couldn’t post', (e as Error).message),
  });

  const leave = useMutation({
    mutationFn: () => leaveGroup(user?.id as string, id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: ['my-groups', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t leave', (e as Error).message),
  });

  const g = detail.data?.group;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: g?.name ?? 'Group', headerBackTitle: 'Groups' }} />
      {detail.isLoading ? (
        <LoadingState />
      ) : detail.isError || !detail.data || !g ? (
        <ErrorState message="Couldn’t load this group." onRetry={() => detail.refetch()} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <FlatList
            data={detail.data.posts}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
            ListHeaderComponent={
              <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
                <Card>
                  <Text variant="h3">{g.name}</Text>
                  {g.description ? (
                    <Text variant="body" color={colors.muted} style={{ marginTop: spacing.xs, lineHeight: 21 }}>
                      {g.description}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
                    <Text variant="caption" color={colors.muted}>
                      {g.memberCount}/{g.maxMembers} members
                    </Text>
                    {g.subjectTag ? <Pill label={g.subjectTag} tone="amber" /> : null}
                    <View style={{ flex: 1 }} />
                    {g.isMember && !g.isCreator ? <Button title="Leave" variant="secondary" size="sm" loading={leave.isPending} onPress={() => leave.mutate()} /> : null}
                  </View>
                </Card>

                {/* Group resource shelf (members-only) */}
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name="folder-outline" size={18} color={colors.amberDark} />
                    <Text variant="label" style={{ flex: 1 }}>
                      Group resources
                    </Text>
                  </View>
                  <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
                    Resources shared here are visible only to members.
                  </Text>
                </Card>

                <Text variant="label">Group feed</Text>
              </View>
            }
            renderItem={({ item }: { item: GroupPost }) => (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Avatar uri={item.authorAvatar} name={item.authorName} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{item.authorName}</Text>
                    <Text variant="caption" color={colors.muted}>
                      {timeAgo(item.createdAt)}
                    </Text>
                  </View>
                </View>
                <Text variant="body" style={{ marginTop: spacing.sm, lineHeight: 21 }}>
                  {item.bodyText}
                </Text>
              </Card>
            )}
            ListEmptyComponent={
              <Text variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.lg }}>
                No posts yet — start the conversation.
              </Text>
            }
          />

          {g.isMember ? (
            <View style={styles.composer}>
              <View style={{ flex: 1 }}>
                <TextField value={body} onChangeText={setBody} placeholder="Share with the group…" multiline />
              </View>
              <Button title="Post" size="sm" loading={post.isPending} disabled={body.trim().length === 0} onPress={() => post.mutate()} />
            </View>
          ) : null}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface },
});
