import { supabase } from '@/lib/supabase';
import type { EmojiType, PostType, ReactionCounts } from '@/types/db';
import type { FeedPost } from './types';

/**
 * Community feed — the RN analogue of `community/page.tsx` (§13). A user's feed
 * is the most recent posts from rooms in their joined spaces, with the author
 * embedded and the viewer's own reactions resolved.
 *
 * RLS already restricts which posts are readable (not deleted; not hidden unless
 * you're a moderator), but we scope to joined spaces explicitly to match the web
 * feed semantics. Not realtime — refetched on action (the web behaves the same).
 */
const PAGE_SIZE = 50;

type RawAuthor = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  level: number | null;
};

type RawPost = {
  id: string;
  author_id: string;
  room_id: string;
  body_text: string;
  post_type: PostType;
  reaction_counts: ReactionCounts | null;
  reply_count: number | null;
  is_pinned: boolean | null;
  is_hidden: boolean | null;
  image_url: string | null;
  created_at: string;
  // Supabase returns an embedded to-one relation as an object (or array depending
  // on inference); we normalise both shapes.
  author: RawAuthor | RawAuthor[] | null;
  room?: RawRoom | RawRoom[] | null;
};

type RawSpaceEmbed = { type: string | null; name: string | null };
type RawRoom = { space: RawSpaceEmbed | RawSpaceEmbed[] | null };

function firstAuthor(a: RawPost['author']): RawAuthor | null {
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function postSpace(p: RawPost): RawSpaceEmbed | null {
  const room = Array.isArray(p.room) ? p.room[0] : p.room;
  if (!room) return null;
  return Array.isArray(room.space) ? (room.space[0] ?? null) : room.space;
}

/** Resolve the room ids the user can see posts from (rooms in their joined spaces). */
async function joinedRoomIds(userId: string): Promise<string[]> {
  const { data: members } = await supabase.from('space_members').select('space_id').eq('user_id', userId);
  const spaceIds = (members ?? []).map((m) => (m as { space_id: string }).space_id);
  if (spaceIds.length === 0) return [];

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id')
    .in('space_id', spaceIds)
    .eq('is_archived', false);
  return (rooms ?? []).map((r) => (r as { id: string }).id);
}

const POST_SELECT = `id, author_id, room_id, body_text, post_type, reaction_counts, reply_count, is_pinned, is_hidden, image_url, created_at,
       author:users!posts_author_id_fkey(id, display_name, avatar_url, role, level),
       room:rooms!posts_room_id_fkey(space:spaces(type, name))`;

/** Resolve the viewer's own reactions for a set of posts → map of post_id → emoji. */
async function myReactionsFor(userId: string, postIds: string[]): Promise<Map<string, EmojiType>> {
  const map = new Map<string, EmojiType>();
  if (postIds.length === 0) return map;
  const { data } = await supabase.from('reactions').select('post_id, emoji_type').eq('user_id', userId).in('post_id', postIds);
  for (const r of (data ?? []) as { post_id: string; emoji_type: EmojiType }[]) map.set(r.post_id, r.emoji_type);
  return map;
}

/** Feed for a single room (§2.43). */
export async function fetchRoomFeed(roomId: string, userId: string, page = 0): Promise<FeedPost[]> {
  const from = page * PAGE_SIZE;
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .eq('room_id', roomId)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  const posts = (data ?? []) as RawPost[];
  const myReactions = await myReactionsFor(userId, posts.map((p) => p.id));
  return posts.map((p) => mapPost(p, myReactions.get(p.id) ?? null));
}

export async function fetchFeed(userId: string, page = 0): Promise<FeedPost[]> {
  const roomIds = await joinedRoomIds(userId);
  if (roomIds.length === 0) return [];

  const from = page * PAGE_SIZE;
  const { data, error } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('room_id', roomIds)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (error) throw error;
  const posts = (data ?? []) as RawPost[];
  const myReactions = await myReactionsFor(userId, posts.map((p) => p.id));
  return posts.map((p) => mapPost(p, myReactions.get(p.id) ?? null));
}

function mapPost(p: RawPost, myReaction: EmojiType | null): FeedPost {
  const author = firstAuthor(p.author);
  return {
    id: p.id,
    authorId: p.author_id,
    roomId: p.room_id,
    bodyText: p.body_text,
    postType: p.post_type,
    reactionCounts: p.reaction_counts ?? {},
    replyCount: p.reply_count ?? 0,
    isPinned: p.is_pinned ?? false,
    isHidden: p.is_hidden ?? false,
    imageUrl: p.image_url,
    createdAt: p.created_at,
    author: {
      id: author?.id ?? p.author_id,
      displayName: author?.display_name ?? 'Member',
      avatarUrl: author?.avatar_url ?? null,
      role: author?.role ?? 'classroom_teacher',
      level: author?.level ?? 1,
    },
    myReaction,
    spaceType: postSpace(p)?.type ?? null,
    spaceName: postSpace(p)?.name ?? null,
  };
}

/** Latest Morning Briefing post from the user's joined rooms (§2.24). */
export async function fetchMorningBriefing(userId: string): Promise<FeedPost | null> {
  const roomIds = await joinedRoomIds(userId);
  if (roomIds.length === 0) return null;
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT)
    .in('room_id', roomIds)
    .eq('post_type', 'morning_briefing')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return mapPost(data as unknown as RawPost, null);
}

/** Ids of users the viewer follows (for the Following feed tab, §2.25). */
export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
  return (data ?? []).map((f) => (f as { following_id: string }).following_id);
}

/** Bookmarked posts (Saved feed tab, §2.25). */
export async function fetchSavedPosts(userId: string): Promise<FeedPost[]> {
  const { data: marks } = await supabase.from('bookmarks').select('post_id').eq('user_id', userId).order('created_at', { ascending: false });
  const postIds = (marks ?? []).map((m) => (m as { post_id: string }).post_id);
  if (postIds.length === 0) return [];
  const { data, error } = await supabase.from('posts').select(POST_SELECT).in('id', postIds).is('deleted_at', null);
  if (error) throw error;
  const posts = (data ?? []) as RawPost[];
  const myReactions = await myReactionsFor(userId, posts.map((p) => p.id));
  return posts.map((p) => mapPost(p, myReactions.get(p.id) ?? null));
}

export interface ReplyWithAuthor {
  id: string;
  bodyText: string;
  isHelpful: boolean;
  createdAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null; role: string };
}

export interface PostDetail {
  post: FeedPost;
  replies: ReplyWithAuthor[];
}

/** A single post with its replies, for the thread screen. */
export async function fetchPostDetail(postId: string, userId: string): Promise<PostDetail> {
  const [postRes, repliesRes, myReactionRes] = await Promise.all([
    supabase
      .from('posts')
      .select(
        `id, author_id, room_id, body_text, post_type, reaction_counts, reply_count, is_pinned, image_url, created_at,
         author:users!posts_author_id_fkey(id, display_name, avatar_url, role, level)`,
      )
      .eq('id', postId)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase
      .from('replies')
      .select('id, body_text, is_helpful, created_at, author:users!replies_author_id_fkey(id, display_name, avatar_url, role)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }),
    supabase.from('reactions').select('emoji_type').eq('post_id', postId).eq('user_id', userId).maybeSingle(),
  ]);

  if (postRes.error) throw postRes.error;
  if (!postRes.data) throw new Error('Post not found');

  const myReaction = (myReactionRes.data as { emoji_type: EmojiType } | null)?.emoji_type ?? null;
  const post = mapPost(postRes.data as unknown as RawPost, myReaction);

  type RawReply = {
    id: string;
    body_text: string;
    is_helpful: boolean | null;
    created_at: string;
    author: RawAuthor | RawAuthor[] | null;
  };

  const replies = ((repliesRes.data ?? []) as RawReply[]).map((r) => {
    const a = firstAuthor(r.author);
    return {
      id: r.id,
      bodyText: r.body_text,
      isHelpful: r.is_helpful ?? false,
      createdAt: r.created_at,
      author: {
        id: a?.id ?? '',
        displayName: a?.display_name ?? 'Member',
        avatarUrl: a?.avatar_url ?? null,
        role: a?.role ?? 'classroom_teacher',
      },
    };
  });

  return { post, replies };
}
