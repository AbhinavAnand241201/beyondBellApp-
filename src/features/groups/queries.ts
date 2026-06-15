import { supabase } from '@/lib/supabase';

/**
 * Study Groups (§8.6, checklist 2.106–2.113). Public groups are discoverable +
 * filterable; invite-only groups never appear in discovery. Creation needs Level 3
 * (500+ Circle Points). A 30-member cap flips Join → Request to Join.
 */
export type GroupPrivacy = 'public' | 'invite_only';

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  privacy: GroupPrivacy;
  subjectTag: string | null;
  memberCount: number;
  maxMembers: number;
  isMember: boolean;
  isCreator: boolean;
  isArchived: boolean;
}

type RawGroup = {
  id: string;
  name: string;
  description: string | null;
  privacy: GroupPrivacy | null;
  subject_tag: string | null;
  max_members: number | null;
  creator_id: string;
  is_archived: boolean | null;
  study_group_members?: { count: number }[];
};

function mapGroup(g: RawGroup, memberIds: Set<string>, userId: string): GroupSummary {
  return {
    id: g.id,
    name: g.name,
    description: g.description,
    privacy: g.privacy ?? 'public',
    subjectTag: g.subject_tag,
    memberCount: g.study_group_members?.[0]?.count ?? 0,
    maxMembers: g.max_members ?? 30,
    isMember: memberIds.has(g.id),
    isCreator: g.creator_id === userId,
    isArchived: g.is_archived ?? false,
  };
}

const SELECT = 'id, name, description, privacy, subject_tag, max_members, creator_id, is_archived, study_group_members(count)';

export interface GroupFilters {
  subject: string | null;
  search: string;
}

/** Public, non-archived groups for discovery (§2.106). */
export async function fetchPublicGroups(userId: string, filters: GroupFilters): Promise<GroupSummary[]> {
  let q = supabase.from('study_groups').select(SELECT).eq('privacy', 'public').eq('is_archived', false);
  if (filters.subject) q = q.eq('subject_tag', filters.subject);
  if (filters.search.trim()) q = q.ilike('name', `%${filters.search.trim()}%`);

  const [groupsRes, membersRes] = await Promise.all([
    q.order('created_at', { ascending: false }).limit(50),
    supabase.from('study_group_members').select('group_id').eq('user_id', userId),
  ]);
  if (groupsRes.error) throw groupsRes.error;
  const memberIds = new Set((membersRes.data ?? []).map((m) => (m as { group_id: string }).group_id));
  return ((groupsRes.data ?? []) as RawGroup[]).map((g) => mapGroup(g, memberIds, userId));
}

/** Groups the user belongs to (My Groups). */
export async function fetchMyGroups(userId: string): Promise<GroupSummary[]> {
  const { data: memberships } = await supabase.from('study_group_members').select('group_id').eq('user_id', userId);
  const ids = (memberships ?? []).map((m) => (m as { group_id: string }).group_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('study_groups').select(SELECT).in('id', ids).eq('is_archived', false);
  if (error) throw error;
  const memberIds = new Set(ids);
  return ((data ?? []) as RawGroup[]).map((g) => mapGroup(g, memberIds, userId));
}

export interface GroupPost {
  id: string;
  bodyText: string;
  createdAt: string;
  authorName: string;
  authorAvatar: string | null;
}

export interface GroupDetail {
  group: GroupSummary;
  posts: GroupPost[];
}

export async function fetchGroupDetail(groupId: string, userId: string): Promise<GroupDetail> {
  const [groupRes, memberRes, countRes, postsRes] = await Promise.all([
    supabase.from('study_groups').select('id, name, description, privacy, subject_tag, max_members, creator_id, is_archived').eq('id', groupId).maybeSingle(),
    supabase.from('study_group_members').select('id', { head: true, count: 'exact' }).eq('group_id', groupId).eq('user_id', userId),
    supabase.from('study_group_members').select('id', { head: true, count: 'exact' }).eq('group_id', groupId),
    supabase
      .from('study_group_posts')
      .select('id, body_text, created_at, author:users!study_group_posts_author_id_fkey(display_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);
  if (groupRes.error) throw groupRes.error;
  if (!groupRes.data) throw new Error('Group not found');
  const g = groupRes.data as RawGroup;

  type RawGP = { id: string; body_text: string; created_at: string; author: { display_name: string | null; avatar_url: string | null } | { display_name: string | null; avatar_url: string | null }[] | null };
  const posts = ((postsRes.data ?? []) as RawGP[]).map((p) => {
    const a = Array.isArray(p.author) ? p.author[0] : p.author;
    return { id: p.id, bodyText: p.body_text, createdAt: p.created_at, authorName: a?.display_name ?? 'Member', authorAvatar: a?.avatar_url ?? null };
  });

  return {
    group: {
      id: g.id,
      name: g.name,
      description: g.description,
      privacy: g.privacy ?? 'public',
      subjectTag: g.subject_tag,
      memberCount: countRes.count ?? 0,
      maxMembers: g.max_members ?? 30,
      isMember: (memberRes.count ?? 0) > 0,
      isCreator: g.creator_id === userId,
      isArchived: g.is_archived ?? false,
    },
    posts,
  };
}

export async function joinGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase.from('study_group_members').insert({ group_id: groupId, user_id: userId, role: 'member' });
  if (error) throw error;
}

export async function leaveGroup(userId: string, groupId: string): Promise<void> {
  const { error } = await supabase.from('study_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

export async function postToGroup(groupId: string, userId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase.from('study_group_posts').insert({ group_id: groupId, author_id: userId, body_text: trimmed });
  if (error) throw error;
}

export interface CreateGroupInput {
  name: string;
  description: string;
  privacy: GroupPrivacy;
  maxMembers: number;
  subjectTag: string;
}

export async function createGroup(userId: string, input: CreateGroupInput): Promise<string> {
  const { data, error } = await supabase
    .from('study_groups')
    .insert({
      creator_id: userId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      privacy: input.privacy,
      max_members: input.maxMembers,
      subject_tag: input.subjectTag || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  const groupId = (data as { id: string }).id;
  // Creator auto-joins as owner.
  await supabase.from('study_group_members').insert({ group_id: groupId, user_id: userId, role: 'owner' });
  return groupId;
}

export const GROUP_SUBJECTS = [
  'English', 'Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology',
  'Social Studies', 'Computer Science', 'Economics', 'Hindi', 'Other',
];
export const GROUP_NAME_MAX = 60;
export const GROUP_DESC_MAX = 200;
