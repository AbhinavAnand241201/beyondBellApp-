import { useQuery } from '@tanstack/react-query';

import { fetchFeed } from './queries';
import type { FeedPost } from './types';

export function feedQueryKey(userId: string | undefined) {
  return ['feed', userId] as const;
}

export function useFeed(userId: string | undefined) {
  return useQuery<FeedPost[]>({
    queryKey: feedQueryKey(userId),
    queryFn: () => fetchFeed(userId as string),
    enabled: !!userId,
  });
}
