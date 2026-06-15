import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { EmojiType } from '@/types/db';
import { toggleReaction } from './mutations';
import { feedQueryKey } from './useFeed';
import type { FeedPost } from './types';

/** Apply a reaction toggle to a single post in-memory (for optimistic updates). */
export function applyReaction(post: FeedPost, emoji: EmojiType): FeedPost {
  const counts = { ...post.reactionCounts };
  const current = post.myReaction;

  const dec = (e: EmojiType) => {
    counts[e] = Math.max(0, (counts[e] ?? 0) - 1);
  };
  const inc = (e: EmojiType) => {
    counts[e] = (counts[e] ?? 0) + 1;
  };

  if (current === emoji) {
    dec(emoji);
    return { ...post, reactionCounts: counts, myReaction: null };
  }
  if (current) dec(current);
  inc(emoji);
  return { ...post, reactionCounts: counts, myReaction: emoji };
}

/**
 * Optimistic reaction toggle: updates the feed cache immediately, fires the write,
 * and rolls back on error. The DB trigger reconciles authoritative counts on the
 * next refetch.
 */
export function useReact(userId: string | undefined) {
  const queryClient = useQueryClient();
  const key = feedQueryKey(userId);

  return useMutation({
    mutationFn: ({ post, emoji }: { post: FeedPost; emoji: EmojiType }) =>
      toggleReaction(userId as string, post.id, emoji, post.myReaction),
    onMutate: async ({ post, emoji }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FeedPost[]>(key);
      queryClient.setQueryData<FeedPost[]>(key, (old: FeedPost[] | undefined) =>
        (old ?? []).map((p) => (p.id === post.id ? applyReaction(p, emoji) : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
