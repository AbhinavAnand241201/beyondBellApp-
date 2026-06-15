import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, Button, Card, Pill, Text, TextField } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { fetchPostDetail, type PostDetail, type ReplyWithAuthor } from '@/features/community/queries';
import { addReply } from '@/features/community/mutations';
import { feedQueryKey } from '@/features/community/useFeed';
import { POST_TYPE_LABEL } from '@/features/community/types';
import { useAuth } from '@/providers/AuthProvider';
import { roleLabel, timeAgo } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function PostThread() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [body, setBody] = useState('');

  const detail = useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPostDetail(id as string, user?.id as string),
    enabled: !!id && !!user?.id,
  });

  const reply = useMutation({
    mutationFn: () => addReply(id as string, user?.id as string, body),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: ['post', id] });
      void queryClient.invalidateQueries({ queryKey: feedQueryKey(user?.id) });
    },
    onError: (err) => Alert.alert('Couldn’t post reply', (err as Error).message),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Post', headerBackTitle: 'Back' }} />
      {detail.isLoading ? (
        <LoadingState />
      ) : detail.isError || !detail.data ? (
        <ErrorState message="Couldn’t load this post." onRetry={() => detail.refetch()} />
      ) : (
        <ThreadBody
          data={detail.data}
          body={body}
          onChangeBody={setBody}
          sending={reply.isPending}
          onSend={() => reply.mutate()}
        />
      )}
    </SafeAreaView>
  );
}

function ThreadBody({
  data,
  body,
  onChangeBody,
  sending,
  onSend,
}: {
  data: PostDetail;
  body: string;
  onChangeBody: (v: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const typeLabel = POST_TYPE_LABEL[data.post.postType];
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        data={data.replies}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
            <Card>
              <View style={styles.authorRow}>
                <Avatar uri={data.post.author.avatarUrl} name={data.post.author.displayName} size={40} />
                <View style={{ flex: 1 }}>
                  <Text variant="label">{data.post.author.displayName}</Text>
                  <Text variant="caption" color={colors.muted}>
                    {roleLabel(data.post.author.role)} · {timeAgo(data.post.createdAt)}
                  </Text>
                </View>
                {typeLabel ? <Pill label={typeLabel} tone="amber" /> : null}
              </View>
              <Text variant="body" style={{ marginTop: spacing.md, lineHeight: 22 }}>
                {data.post.bodyText}
              </Text>
            </Card>
            <Text variant="label">
              {data.replies.length} {data.replies.length === 1 ? 'reply' : 'replies'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <ReplyItem reply={item} />}
        ListEmptyComponent={
          <Text variant="body" color={colors.muted}>
            No replies yet — be the first to respond.
          </Text>
        }
      />

      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <TextField value={body} onChangeText={onChangeBody} placeholder="Write a reply…" multiline />
        </View>
        <Button title="Send" size="sm" loading={sending} disabled={body.trim().length === 0} onPress={onSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

function ReplyItem({ reply }: { reply: ReplyWithAuthor }) {
  return (
    <Card>
      <View style={styles.authorRow}>
        <Avatar uri={reply.author.avatarUrl} name={reply.author.displayName} size={32} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Text variant="label">{reply.author.displayName}</Text>
            {reply.isHelpful ? <Pill label="Helpful" tone="success" /> : null}
          </View>
          <Text variant="caption" color={colors.muted}>
            {timeAgo(reply.createdAt)}
          </Text>
        </View>
      </View>
      <Text variant="body" style={{ marginTop: spacing.sm, lineHeight: 21 }}>
        {reply.bodyText}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
