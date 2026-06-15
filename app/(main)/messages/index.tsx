import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Avatar, Banner, Pill, SkeletonList, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/QueryStates';
import { fetchConversations } from '@/features/messages/queries';
import type { Conversation } from '@/features/messages/types';
import { useAuth } from '@/providers/AuthProvider';
import { timeAgo } from '@/lib/format';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

/** DM inbox (§2.105). Reached from the Home header (not a bottom tab per brief §2.4). */
export default function MessagesInbox() {
  const { user } = useAuth();
  const convos = useQuery<Conversation[]>({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user?.id as string),
    enabled: !!user?.id && env.isConfigured,
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Messages', headerBackTitle: 'Home' }} />
      {!env.isConfigured ? (
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load your messages." />
        </View>
      ) : convos.isLoading ? (
        <SkeletonList />
      ) : convos.isError ? (
        <ErrorState message="Couldn’t load conversations." onRetry={() => convos.refetch()} />
      ) : (
        <FlatList
          data={convos.data}
          keyExtractor={(c) => c.partnerId}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={convos.isRefetching} onRefresh={() => convos.refetch()} tintColor={colors.amber} />}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => <ConversationRow convo={item} />}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No messages yet" message="Start a conversation from someone’s profile." />}
        />
      )}
    </SafeAreaView>
  );
}

function ConversationRow({ convo }: { convo: Conversation }) {
  return (
    <Pressable style={styles.row} onPress={() => router.push(`/(main)/messages/${convo.partnerId}`)}>
      <Avatar uri={convo.partnerAvatar} name={convo.partnerName} size={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.rowTop}>
          <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
            {convo.partnerName}
          </Text>
          <Text variant="caption" color={colors.muted}>
            {timeAgo(convo.lastAt)}
          </Text>
        </View>
        <View style={styles.rowTop}>
          <Text variant="body" color={colors.muted} numberOfLines={1} style={{ flex: 1 }}>
            {convo.lastFromMe ? 'You: ' : ''}
            {convo.lastMessage}
          </Text>
          {convo.unreadCount > 0 ? <Pill label={String(convo.unreadCount)} tone="amber" /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 76 },
});
