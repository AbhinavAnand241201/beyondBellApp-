import { supabase } from '@/lib/supabase';
import type { Tier } from '@/types/db';

/**
 * Events platform (§8.5, checklist 2.91–2.98). Upcoming events + RSVP, plus a
 * recordings archive (past events with a recording_url). Tier access:
 * Free = recording only · Standard = live · Pro = live + priority Q&A.
 */
export interface EventItem {
  id: string;
  title: string;
  type: string;
  hostName: string;
  startsAt: string;
  endsAt: string | null;
  accessTier: Tier;
  streamUrl: string | null;
  recordingUrl: string | null;
  isLive: boolean;
  rsvpCount: number;
  maxRsvp: number | null;
  rsvped: boolean;
}

type RawEvent = {
  id: string;
  title: string;
  type: string | null;
  starts_at: string;
  ends_at: string | null;
  access_tier: Tier | null;
  stream_url: string | null;
  recording_url: string | null;
  is_live: boolean | null;
  rsvp_count: number | null;
  max_rsvp: number | null;
  host: { display_name: string | null } | { display_name: string | null }[] | null;
};

function mapEvent(e: RawEvent, rsvpedIds: Set<string>): EventItem {
  const host = Array.isArray(e.host) ? e.host[0] : e.host;
  return {
    id: e.id,
    title: e.title,
    type: e.type ?? 'Webinar',
    hostName: host?.display_name ?? 'BeyondBell',
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    accessTier: e.access_tier ?? 'free',
    streamUrl: e.stream_url,
    recordingUrl: e.recording_url,
    isLive: e.is_live ?? false,
    rsvpCount: e.rsvp_count ?? 0,
    maxRsvp: e.max_rsvp,
    rsvped: rsvpedIds.has(e.id),
  };
}

const SELECT =
  'id, title, type, starts_at, ends_at, access_tier, stream_url, recording_url, is_live, rsvp_count, max_rsvp, host:users!events_host_id_fkey(display_name)';

export async function fetchUpcomingEvents(userId: string, nowIso: string): Promise<EventItem[]> {
  const [eventsRes, rsvpRes] = await Promise.all([
    supabase.from('events').select(SELECT).gte('starts_at', nowIso).order('starts_at', { ascending: true }).limit(50),
    supabase.from('event_rsvps').select('event_id').eq('user_id', userId),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  const rsvped = new Set((rsvpRes.data ?? []).map((r) => (r as { event_id: string }).event_id));
  return ((eventsRes.data ?? []) as RawEvent[]).map((e) => mapEvent(e, rsvped));
}

export async function fetchRecordings(userId: string, nowIso: string): Promise<EventItem[]> {
  const [eventsRes, rsvpRes] = await Promise.all([
    supabase.from('events').select(SELECT).lt('starts_at', nowIso).not('recording_url', 'is', null).order('starts_at', { ascending: false }).limit(50),
    supabase.from('event_rsvps').select('event_id').eq('user_id', userId),
  ]);
  if (eventsRes.error) throw eventsRes.error;
  const rsvped = new Set((rsvpRes.data ?? []).map((r) => (r as { event_id: string }).event_id));
  return ((eventsRes.data ?? []) as RawEvent[]).map((e) => mapEvent(e, rsvped));
}

export async function fetchEventDetail(eventId: string, userId: string): Promise<EventItem> {
  const [eventRes, rsvpRes] = await Promise.all([
    supabase.from('events').select(SELECT).eq('id', eventId).maybeSingle(),
    supabase.from('event_rsvps').select('event_id').eq('user_id', userId).eq('event_id', eventId).maybeSingle(),
  ]);
  if (eventRes.error) throw eventRes.error;
  if (!eventRes.data) throw new Error('Event not found');
  const rsvped = new Set(rsvpRes.data ? [eventId] : []);
  return mapEvent(eventRes.data as RawEvent, rsvped);
}

export async function rsvpEvent(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase.from('event_rsvps').insert({ user_id: userId, event_id: eventId });
  if (error) throw error;
}

export async function cancelRsvp(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase.from('event_rsvps').delete().eq('user_id', userId).eq('event_id', eventId);
  if (error) throw error;
}
