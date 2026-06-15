import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SkeletonList, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/QueryStates';
import { PostCard } from '@/features/community/PostCard';
import { fetchRoomFeed } from '@/features/community/queries';
import { toggleReaction } from '@/features/community/mutations';
import type { FeedPost } from '@/features/community/types';
import type { EmojiType } from '@/types/db';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme/tokens';

export default function RoomFeedScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['room-feed', id, user?.id];

  const feed = useQuery({
    queryKey: key,
    queryFn: () => fetchRoomFeed(id as string, user?.id as string),
    enabled: !!id && !!user?.id,
  });

  const react = useMutation({
    mutationFn: ({ post, emoji }: { post: FeedPost; emoji: EmojiType }) =>
      toggleReaction(user?.id as string, post.id, emoji, post.myReaction),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e) => Alert.alert('Couldn’t react', (e as Error).message),
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: name ?? 'Room', headerBackTitle: 'Back' }} />
      {feed.isLoading ? (
        <SkeletonList />
      ) : feed.isError ? (
        <ErrorState message="Couldn’t load this room." onRetry={() => feed.refetch()} />
      ) : (
        <FlatList
          data={feed.data}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.amber} />}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onToggleReaction={(post, emoji) => react.mutate({ post, emoji })}
              onOpenReplies={(post) => router.push(`/(main)/post/${post.id}`)}
            />
          )}
          ListEmptyComponent={<EmptyState icon="chatbubbles-outline" title="No posts yet" message="Be the first to post in this room." />}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push(`/(main)/compose?roomId=${id}`)} accessibilityLabel="New post">
        <Ionicons name="add" size={28} color={colors.ink} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
