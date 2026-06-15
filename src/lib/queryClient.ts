import { QueryClient } from '@tanstack/react-query';

/**
 * App-wide TanStack Query client. The onboarding guide (§18.2) recommends a data
 * layer like TanStack Query for caching the Path-A direct Supabase reads.
 *
 * Defaults tuned for a mobile feed app: a short stale window so pull-to-refresh
 * feels live, one retry (RLS/permission errors shouldn't be hammered), and no
 * refetch-on-window-focus (RN has no window focus the way the web does).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
