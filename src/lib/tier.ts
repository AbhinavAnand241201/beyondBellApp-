import type { Tier } from '@/types/db';

/**
 * UI-side tier helpers. RLS is the *real* gate (§6/§19) — these just let us hide
 * or annotate actions the DB would reject, for a friendlier UX. Never rely on
 * these for security.
 */

const RANK: Record<Tier, number> = { free: 0, standard: 1, pro: 2 };

export function tierAtLeast(tier: Tier, min: Tier): boolean {
  return RANK[tier] >= RANK[min];
}

/** Posting/replying requires standard or pro (§8.2). */
export function canPost(tier: Tier): boolean {
  return tierAtLeast(tier, 'standard');
}

/** Free tier cannot DM (§14). */
export function canDirectMessage(tier: Tier): boolean {
  return tierAtLeast(tier, 'standard');
}

export const TIER_LABEL: Record<Tier, string> = {
  free: 'Free',
  standard: 'Standard',
  pro: 'Pro',
};
