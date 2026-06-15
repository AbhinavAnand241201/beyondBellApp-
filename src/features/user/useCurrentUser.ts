import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Tier, UserRole } from '@/types/db';

export interface CurrentUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  tier: Tier;
  role: UserRole;
  circlePoints: number;
  level: number;
  isBanned: boolean;
  isFoundingMember: boolean;
}

async function fetchCurrentUser(userId: string): Promise<CurrentUser> {
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, tier, role, circle_points, level, is_banned, is_founding_member')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;

  const u = data as {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    tier: Tier | null;
    role: UserRole | null;
    circle_points: number | null;
    level: number | null;
    is_banned: boolean | null;
    is_founding_member: boolean | null;
  } | null;

  return {
    id: userId,
    displayName: u?.display_name ?? 'Member',
    avatarUrl: u?.avatar_url ?? null,
    tier: u?.tier ?? 'free',
    role: u?.role ?? 'classroom_teacher',
    circlePoints: u?.circle_points ?? 0,
    level: u?.level ?? 1,
    isBanned: u?.is_banned ?? false,
    isFoundingMember: u?.is_founding_member ?? false,
  };
}

/** The current user's `users` row — tier, identity, reputation. Shared widely. */
export function useCurrentUser(userId: string | undefined) {
  return useQuery<CurrentUser>({
    queryKey: ['current-user', userId],
    queryFn: () => fetchCurrentUser(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
