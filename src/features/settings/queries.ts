import { supabase } from '@/lib/supabase';

/**
 * Settings (§2.126–2.131). Notification preferences + privacy + digest + language
 * live on `educator_profiles` (per-type toggles + language_preference +
 * show_school_name). The exact notification columns vary; we model the 12 types
 * (checklist 3.9) and read/write whatever columns exist, defaulting to on.
 */

export type DigestFrequency = 'daily' | 'weekly' | 'never';
export type Language = 'english' | 'hindi';

/** The 12 notification types (checklist 3.9). `key` is the educator_profiles column. */
export const NOTIFICATION_TYPES: { key: string; label: string }[] = [
  { key: 'notify_morning_briefing', label: 'Morning Briefing' },
  { key: 'notify_reply', label: 'Reply to my post' },
  { key: 'notify_helpful_reply', label: 'My reply marked helpful' },
  { key: 'notify_resource_rated', label: 'My resource rated' },
  { key: 'notify_level_up', label: 'Level up' },
  { key: 'notify_event_reminder', label: 'Event reminder' },
  { key: 'notify_new_dm', label: 'New direct message' },
  { key: 'notify_champion_nudge', label: 'Champion nudge' },
  { key: 'notify_new_follower', label: 'New follower' },
  { key: 'notify_cohort_reminder', label: 'Cohort reminder' },
  { key: 'notify_weekly_digest', label: 'Weekly digest' },
  { key: 'notify_announcements', label: 'Announcements' },
];

export interface SettingsState {
  notifications: Record<string, boolean>;
  showSchoolName: boolean;
  language: Language;
  digestFrequency: DigestFrequency;
}

export async function fetchSettings(userId: string): Promise<SettingsState> {
  const cols = NOTIFICATION_TYPES.map((n) => n.key).join(', ');
  const { data } = await supabase
    .from('educator_profiles')
    .select(`${cols}, show_school_name, language_preference, email_digest_frequency`)
    .eq('user_id', userId)
    .maybeSingle();
  const row = (data ?? {}) as Record<string, unknown>;

  const notifications: Record<string, boolean> = {};
  for (const n of NOTIFICATION_TYPES) {
    const v = row[n.key];
    notifications[n.key] = typeof v === 'boolean' ? v : true; // default on
  }

  return {
    notifications,
    showSchoolName: typeof row.show_school_name === 'boolean' ? row.show_school_name : true,
    language: row.language_preference === 'hindi' ? 'hindi' : 'english',
    digestFrequency: (['daily', 'weekly', 'never'].includes(row.email_digest_frequency as string) ? row.email_digest_frequency : 'weekly') as DigestFrequency,
  };
}

/** Patch a subset of settings columns (immediate save, §2.126). */
export async function updateSettings(userId: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('educator_profiles').update(patch).eq('user_id', userId);
  if (error) throw error;
}
