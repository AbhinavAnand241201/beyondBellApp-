/** Compact relative time ("just now", "4m", "2h", "3d", or a date). */
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 45) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w`;
  return new Date(iso).toLocaleDateString();
}

const ROLE_LABELS: Record<string, string> = {
  classroom_teacher: 'Teacher',
  coordinator_hod: 'Coordinator / HOD',
  principal_vp: 'Principal',
  community_champion: 'Community Champion',
  beyondbell_expert: 'Expert',
  moderator: 'Moderator',
  beyondbell_team: 'BeyondBell Team',
  founding_member: 'Founding Member',
};

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? 'Member';
}

/** Absolute event date + time, e.g. "Mon, 14 Jun · 5:00 PM". */
export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}
