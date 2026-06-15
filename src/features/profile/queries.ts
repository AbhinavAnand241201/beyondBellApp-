import { supabase } from '@/lib/supabase';
import type { Tier, UserRole, YearsExp } from '@/types/db';

/**
 * Profile reads (self + others), the RN analogue of the web's `profile/_data.ts`
 * (§17 — the one "mock" file that's actually real query logic). Reputation
 * (`circle_points`/`level`/`badges`) is read-only here — points flow only from
 * triggered actions (§9), never written by the app.
 */

export interface Badge {
  id: string;
  badgeType: string;
  earnedAt: string;
}

export interface ProfileData {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  tier: Tier;
  circlePoints: number;
  level: number;
  isFoundingMember: boolean;
  foundingMemberNumber: number | null;
  // educator_profiles
  designation: string | null;
  schoolName: string | null;
  showSchoolName: boolean;
  city: string | null;
  state: string | null;
  yearsExp: YearsExp | null;
  bio: string | null;
  boards: string[];
  grades: number[];
  subjects: string[];
  specialistAreas: string[];
  badges: Badge[];
  isSelf: boolean;
  isFollowing: boolean;
  stats: { posts: number; resources: number; helpfulReplies: number; eventsAttended: number };
}


export async function fetchProfile(userId: string, viewerId: string): Promise<ProfileData> {
  const [userRes, profileRes, badgesRes, postsRes, resourcesRes, helpfulRes, eventsRes, followRes] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, avatar_url, role, tier, circle_points, level, is_founding_member, founding_member_number')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('educator_profiles')
      .select('designation, school_name, show_school_name, city, state, years_exp, bio, boards, grades, subjects, specialist_areas')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('badges').select('id, badge_type, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('posts').select('id', { head: true, count: 'exact' }).eq('author_id', userId).is('deleted_at', null),
    supabase.from('resources').select('id', { head: true, count: 'exact' }).eq('author_id', userId).is('deleted_at', null),
    supabase.from('replies').select('id', { head: true, count: 'exact' }).eq('author_id', userId).eq('is_helpful', true),
    supabase.from('event_rsvps').select('id', { head: true, count: 'exact' }).eq('user_id', userId).eq('attended', true),
    viewerId !== userId
      ? supabase.from('follows').select('id', { head: true, count: 'exact' }).eq('follower_id', viewerId).eq('following_id', userId)
      : Promise.resolve({ count: 0 }),
  ]);

  if (userRes.error) throw userRes.error;

  const u = userRes.data as {
    display_name: string | null;
    avatar_url: string | null;
    role: UserRole | null;
    tier: Tier | null;
    circle_points: number | null;
    level: number | null;
    is_founding_member: boolean | null;
    founding_member_number: number | null;
  } | null;
  if (!u) throw new Error('Profile not found');

  const p = profileRes.data as {
    designation: string | null;
    school_name: string | null;
    show_school_name: boolean | null;
    city: string | null;
    state: string | null;
    years_exp: YearsExp | null;
    bio: string | null;
    boards: string[] | null;
    grades: number[] | null;
    subjects: string[] | null;
    specialist_areas: string[] | null;
  } | null;

  const badges = ((badgesRes.data ?? []) as { id: string; badge_type: string; created_at: string }[]).map((b) => ({
    id: b.id,
    badgeType: b.badge_type,
    earnedAt: b.created_at,
  }));

  return {
    userId,
    displayName: u.display_name ?? 'Member',
    avatarUrl: u.avatar_url,
    role: u.role ?? 'classroom_teacher',
    tier: u.tier ?? 'free',
    circlePoints: u.circle_points ?? 0,
    level: u.level ?? 1,
    isFoundingMember: u.is_founding_member ?? false,
    foundingMemberNumber: u.founding_member_number,
    designation: p?.designation ?? null,
    schoolName: p?.school_name ?? null,
    showSchoolName: p?.show_school_name ?? false,
    city: p?.city ?? null,
    state: p?.state ?? null,
    yearsExp: p?.years_exp ?? null,
    bio: p?.bio ?? null,
    boards: p?.boards ?? [],
    grades: p?.grades ?? [],
    subjects: p?.subjects ?? [],
    specialistAreas: p?.specialist_areas ?? [],
    badges,
    isSelf: userId === viewerId,
    isFollowing: (followRes.count ?? 0) > 0,
    stats: {
      posts: postsRes.count ?? 0,
      resources: resourcesRes.count ?? 0,
      helpfulReplies: helpfulRes.count ?? 0,
      eventsAttended: eventsRes.count ?? 0,
    },
  };
}

/** Human label for a badge_type slug (best-effort title-casing). */
export function badgeLabel(badgeType: string): string {
  return badgeType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Follow / unfollow another educator (§2.125 follow toggle). */
export async function followUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
  if (error) throw error;
}
