import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { Banner, Card, OptionChip, Pill, SkeletonList, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/QueryStates';
import { PostCard } from '@/features/community/PostCard';
import { MorningBriefingCard } from '@/features/community/MorningBriefingCard';
import { OnboardingChecklistCard } from '@/features/community/OnboardingChecklistCard';
import { fetchFeed, fetchSavedPosts, fetchFollowingIds } from '@/features/community/queries';
import { applyReaction } from '@/features/community/useReact';
import { toggleReaction } from '@/features/community/mutations';
import type { FeedPost } from '@/features/community/types';
import type { EmojiType } from '@/types/db';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { useEducatorBasics } from '@/features/user/useEducatorBasics';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

type FeedTab = 'all' | 'following' | 'board' | 'subject' | 'saved';
const PAGE = 50;

export default function HomeFeed() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const basics = useEducatorBasics(user?.id);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FeedTab>('all');

  const feedKey = ['feed', user?.id];
  const feed = useInfiniteQuery({
    queryKey: feedKey,
    queryFn: ({ pageParam }) => fetchFeed(user?.id as string, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, all) => (last.length === PAGE ? all.length : undefined),
    enabled: !!user?.id && env.isConfigured,
  });

  const saved = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: () => fetchSavedPosts(user?.id as string),
    enabled: !!user?.id && env.isConfigured && tab === 'saved',
  });

  const following = useQuery({
    queryKey: ['following-ids', user?.id],
    queryFn: () => fetchFollowingIds(user?.id as string),
    enabled: !!user?.id && env.isConfigured && tab === 'following',
  });

  const allPosts = useMemo<FeedPost[]>(() => feed.data?.pages.flat() ?? [], [feed.data]);

  const posts = useMemo<FeedPost[]>(() => {
    if (tab === 'saved') return saved.data ?? [];
    if (tab === 'following') {
      const set = new Set(following.data ?? []);
      return allPosts.filter((p) => set.has(p.authorId));
    }
    if (tab === 'board') return allPosts.filter((p) => p.spaceType === 'board');
    if (tab === 'subject') return allPosts.filter((p) => p.spaceType === 'subject');
    return allPosts;
  }, [tab, allPosts, saved.data, following.data]);

  // Optimistic reaction against the infinite-query cache.
  const react = useMutation({
    mutationFn: ({ post, emoji }: { post: FeedPost; emoji: EmojiType }) => toggleReaction(user?.id as string, post.id, emoji, post.myReaction),
    onMutate: async ({ post, emoji }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const prev = queryClient.getQueryData<InfiniteData<FeedPost[]>>(feedKey);
      queryClient.setQueryData<InfiniteData<FeedPost[]>>(feedKey, (old: InfiniteData<FeedPost[]> | undefined) =>
        old ? { ...old, pages: old.pages.map((pg: FeedPost[]) => pg.map((p: FeedPost) => (p.id === post.id ? applyReaction(p, emoji) : p))) } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(feedKey, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });

  const boardLabel = basics.data?.board ? `${basics.data.board}` : 'Board';
  const subjectLabel = basics.data?.subject ?? 'Subject';
  const TABS: { value: FeedTab; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'following', label: 'Following' },
    { value: 'board', label: boardLabel },
    { value: 'subject', label: subjectLabel },
    { value: 'saved', label: 'Saved' },
  ];

  const loading = feed.isLoading || (tab === 'saved' && saved.isLoading);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h1">Home</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {me.data ? <Pill label={`${me.data.circlePoints} pts`} tone="amber" /> : null}
          <Pressable onPress={() => router.push('/(main)/messages')} hitSlop={8} accessibilityLabel="Messages">
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} tintColor={colors.amber} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (tab !== 'saved' && feed.hasNextPage && !feed.isFetchingNextPage) void feed.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            {!env.isConfigured ? (
              <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load your feed." />
            ) : null}
            <OnboardingChecklistCard userId={user?.id} />
            {tab === 'all' ? <MorningBriefingCard userId={user?.id} /> : null}
            <FlatList
              horizontal
              data={TABS}
              keyExtractor={(t) => t.value}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
              renderItem={({ item }) => <OptionChip label={item.label} selected={tab === item.value} onPress={() => setTab(item.value)} />}
            />
          </View>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onToggleReaction={(post, emoji) => react.mutate({ post, emoji })} onOpenReplies={(post) => router.push(`/(main)/post/${post.id}`)} />
        )}
        ListEmptyComponent={
          loading ? (
            <SkeletonList />
          ) : feed.isError ? (
            <ErrorState message="Couldn’t load your feed." onRetry={() => feed.refetch()} />
          ) : (
            <EmptyState
              icon="people-outline"
              title="Your feed is quiet"
              message="Join a Space to see posts from educators like you."
            />
          )
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? (
            <Text variant="caption" color={colors.muted} style={{ textAlign: 'center', padding: spacing.lg }}>
              Loading more…
            </Text>
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(main)/compose')} accessibilityLabel="New post">
        <Ionicons name="add" size={28} color={colors.ink} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
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
