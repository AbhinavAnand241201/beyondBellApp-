/**
 * Hand-written row shapes for the tables this app touches.
 *
 * The web app deliberately avoids `supabase gen types` and hand-writes row types
 * inline (§19). We mirror that here in one shared module so screens and queries
 * stay in sync. Column names match the DB exactly — where the web app aliases
 * DB→TS (Decision 6, e.g. `is_founding_member` → `founding_member`), we keep the
 * raw DB name to avoid the aliasing footgun and document the mapping inline.
 *
 * Enum-like columns are `CHECK (col IN (...))` text constraints in Postgres, so
 * we model them as string unions (not Postgres ENUM types).
 */

export type Tier = 'free' | 'standard' | 'pro';

export type UserRole =
  | 'classroom_teacher'
  | 'coordinator_hod'
  | 'principal_vp'
  | 'community_champion'
  | 'beyondbell_expert'
  | 'moderator'
  | 'beyondbell_team'
  | 'founding_member';

export type YearsExp = '<2' | '2-5' | '5-10' | '10-20' | '20+';
export type LanguagePreference = 'english' | 'hindi';

/** `public.users` — 1:1 with `auth.users`. */
export interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  tier: Tier;
  circle_points: number;
  level: number; // 1–7
  is_banned: boolean;
  is_founding_member: boolean;
  founding_member_number: number | null; // 1–500
  created_at: string;
}

/** `educator_profiles` — 1:1 with users (`user_id UNIQUE`). */
export interface EducatorProfileRow {
  id: string;
  user_id: string;
  boards: string[] | null;
  grades: number[] | null;
  subjects: string[] | null;
  specialist_areas: string[] | null;
  designation: string | null;
  school_name: string | null;
  show_school_name: boolean;
  city: string | null;
  state: string | null;
  years_exp: YearsExp | null;
  bio: string | null;
  contact_phone: string | null; // product phone, NOT the auth phone (Decision 3)
  language_preference: LanguagePreference;
  profile_completion_pct: number;
  onboarding_completed: boolean; // legacy fallback gate (§7)
  created_at: string;
}

/** `onboarding_progress` — 1:1. `wizard_completed_at` is the canonical onboarded gate. */
export interface OnboardingProgressRow {
  id: string;
  user_id: string;
  wizard_step: number; // 1–5
  wizard_completed_at: string | null;
  first_post_at: string | null;
  first_ai_tool_at: string | null;
  assigned_champion_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Community (§8.2)
// ---------------------------------------------------------------------------

/** Reaction emoji keys stored as text; the UI maps these to 👍❤️🎉💡🙏 (§8.2). */
export type EmojiType = 'thumbs_up' | 'heart' | 'celebrate' | 'bulb' | 'hands';

export type PostType =
  | 'discussion'
  | 'question'
  | 'teaching_win'
  | 'resource_share'
  | 'appreciation'
  | 'announcement'
  | 'morning_briefing';

/** Per-emoji aggregate counts kept in sync by a DB trigger on `reactions`. */
export type ReactionCounts = Partial<Record<EmojiType, number>>;

/** `posts` — body_tsvector/reaction_counts/reply_count are trigger-maintained. */
export interface PostRow {
  id: string;
  author_id: string;
  room_id: string;
  body_text: string;
  post_type: PostType;
  reaction_counts: ReactionCounts | null;
  reply_count: number;
  is_pinned: boolean;
  is_hidden: boolean;
  image_url: string | null;
  deleted_at: string | null;
  created_at: string;
}

/** `replies` — `is_helpful` set by the original poster. */
export interface ReplyRow {
  id: string;
  post_id: string;
  author_id: string;
  body_text: string;
  is_helpful: boolean;
  created_at: string;
}
