import { supabase } from '@/lib/supabase';

/**
 * Spaces & Rooms (§8.2, checklist 2.41–2.47). Spaces are the top-level community
 * containers; Rooms are channels within them. Membership is the user's own
 * `space_members` rows (RLS-scoped). Member counts use Supabase's embedded
 * `count` aggregate so they stay RLS-aware.
 */

export type SpaceType = 'general' | 'board' | 'subject' | 'leadership' | 'resource' | 'events';
export type Tier = 'free' | 'standard' | 'pro';

export interface SpaceSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: SpaceType;
  accessTier: Tier;
  isPermanent: boolean;
  isAutoJoined: boolean;
  memberCount: number;
  joined: boolean;
}

type RawSpace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: SpaceType;
  access_tier: Tier | null;
  is_permanent: boolean | null;
  is_auto_joined: boolean | null;
  sort_order: number | null;
  space_members?: { count: number }[];
};

export async function fetchSpaces(userId: string): Promise<SpaceSummary[]> {
  const [spacesRes, membersRes] = await Promise.all([
    supabase
      .from('spaces')
      .select('id, name, slug, description, type, access_tier, is_permanent, is_auto_joined, sort_order, space_members(count)')
      .order('sort_order', { ascending: true }),
    supabase.from('space_members').select('space_id').eq('user_id', userId),
  ]);
  if (spacesRes.error) throw spacesRes.error;

  const joined = new Set((membersRes.data ?? []).map((m) => (m as { space_id: string }).space_id));

  return ((spacesRes.data ?? []) as RawSpace[]).map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    type: s.type,
    accessTier: s.access_tier ?? 'free',
    isPermanent: s.is_permanent ?? false,
    isAutoJoined: s.is_auto_joined ?? false,
    memberCount: s.space_members?.[0]?.count ?? 0,
    joined: joined.has(s.id),
  }));
}

export async function joinSpace(userId: string, spaceId: string): Promise<void> {
  const { error } = await supabase.from('space_members').insert({ user_id: userId, space_id: spaceId });
  if (error) throw error;
}

export async function leaveSpace(userId: string, spaceId: string): Promise<void> {
  const { error } = await supabase.from('space_members').delete().eq('user_id', userId).eq('space_id', spaceId);
  if (error) throw error;
}

export interface RoomSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  roomType: string;
  isArchived: boolean;
}

export interface SpaceDetail {
  space: SpaceSummary;
  rooms: RoomSummary[];
}

export async function fetchSpaceDetail(spaceId: string, userId: string): Promise<SpaceDetail> {
  const [spaceRes, roomsRes, memberRes, countRes] = await Promise.all([
    supabase.from('spaces').select('id, name, slug, description, type, access_tier, is_permanent, is_auto_joined').eq('id', spaceId).maybeSingle(),
    supabase.from('rooms').select('id, name, slug, description, room_type, is_archived').eq('space_id', spaceId).order('created_at', { ascending: true }),
    supabase.from('space_members').select('id', { head: true, count: 'exact' }).eq('space_id', spaceId).eq('user_id', userId),
    supabase.from('space_members').select('id', { head: true, count: 'exact' }).eq('space_id', spaceId),
  ]);
  if (spaceRes.error) throw spaceRes.error;
  if (!spaceRes.data) throw new Error('Space not found');
  const s = spaceRes.data as RawSpace;

  return {
    space: {
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      type: s.type,
      accessTier: s.access_tier ?? 'free',
      isPermanent: s.is_permanent ?? false,
      isAutoJoined: s.is_auto_joined ?? false,
      memberCount: countRes.count ?? 0,
      joined: (memberRes.count ?? 0) > 0,
    },
    rooms: ((roomsRes.data ?? []) as { id: string; name: string | null; slug: string; description: string | null; room_type: string | null; is_archived: boolean | null }[]).map((r) => ({
      id: r.id,
      name: r.name ?? r.slug,
      slug: r.slug,
      description: r.description,
      roomType: r.room_type ?? 'standard',
      isArchived: r.is_archived ?? false,
    })),
  };
}

export const SPACE_TYPE_ICON: Record<SpaceType, string> = {
  general: 'home-outline',
  board: 'school-outline',
  subject: 'book-outline',
  leadership: 'briefcase-outline',
  resource: 'folder-outline',
  events: 'calendar-outline',
};
