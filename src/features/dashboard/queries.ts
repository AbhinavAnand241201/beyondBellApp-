import { supabase } from '@/lib/supabase';
import type { Tier } from '@/types/db';

/**
 * Dashboard aggregation — the RN analogue of the web's `dashboard/page.tsx`
 * server reads (§10). It gathers the user record, profile completion, and a few
 * activity counts in parallel, then derives a 3-state view.
 *
 * The web computes `new_user | returning | power_user` from `onboarding_completed`
 * + `circle_points`. The exact thresholds aren't documented, so we use sensible
 * ones (documented below) — tune to match the web once confirmed.
 */
export type DashboardState = 'new_user' | 'returning' | 'power_user';

export interface DashboardData {
  state: DashboardState;
  displayName: string;
  tier: Tier;
  avatarUrl: string | null;
  circlePoints: number;
  level: number;
  isFoundingMember: boolean;
  profileCompletionPct: number;
  /** Profile meta for the dashboard profile card: "Subject · Board · City". */
  meta: {
    subject: string | null;
    board: string | null;
    city: string | null;
  };
  counts: {
    resources: number;
    replies: number;
    badges: number;
  };
  /** New-user 7-day checklist milestones (null = not yet done). */
  checklist: {
    firstPostAt: string | null;
    firstAiToolAt: string | null;
  };
}

function deriveState(circlePoints: number): DashboardState {
  if (circlePoints >= 150) return 'power_user';
  if (circlePoints >= 20) return 'returning';
  return 'new_user';
}

async function countFor(table: 'resources' | 'replies' | 'badges', column: string, userId: string): Promise<number> {
  const { count } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(column, userId);
  return count ?? 0;
}

export async function fetchDashboard(userId: string): Promise<DashboardData> {
  const [userRes, profileRes, progressRes, resources, replies, badges] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, tier, avatar_url, circle_points, level, is_founding_member')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('educator_profiles').select('profile_completion_pct, subjects, boards, city').eq('user_id', userId).maybeSingle(),
    supabase.from('onboarding_progress').select('first_post_at, first_ai_tool_at').eq('user_id', userId).maybeSingle(),
    countFor('resources', 'author_id', userId),
    countFor('replies', 'author_id', userId),
    countFor('badges', 'user_id', userId),
  ]);

  const user = userRes.data as {
    display_name: string | null;
    tier: Tier | null;
    avatar_url: string | null;
    circle_points: number | null;
    level: number | null;
    is_founding_member: boolean | null;
  } | null;
  const profile = profileRes.data as {
    profile_completion_pct: number | null;
    subjects: string[] | null;
    boards: string[] | null;
    city: string | null;
  } | null;
  const progress = progressRes.data as { first_post_at: string | null; first_ai_tool_at: string | null } | null;

  const circlePoints = user?.circle_points ?? 0;

  return {
    state: deriveState(circlePoints),
    displayName: user?.display_name ?? 'there',
    tier: user?.tier ?? 'free',
    avatarUrl: user?.avatar_url ?? null,
    circlePoints,
    level: user?.level ?? 1,
    isFoundingMember: user?.is_founding_member ?? false,
    profileCompletionPct: profile?.profile_completion_pct ?? 0,
    meta: {
      subject: profile?.subjects?.[0] ?? null,
      board: profile?.boards?.[0] ?? null,
      city: profile?.city ?? null,
    },
    counts: { resources, replies, badges },
    checklist: {
      firstPostAt: progress?.first_post_at ?? null,
      firstAiToolAt: progress?.first_ai_tool_at ?? null,
    },
  };
}
