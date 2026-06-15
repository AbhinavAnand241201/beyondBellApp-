import { supabase } from '@/lib/supabase';
import type { EmojiType } from '@/types/db';

/**
 * Community writes done directly from the client (§13): reactions and replies are
 * RLS-permitted direct writes, and the DB triggers keep `reaction_counts` and
 * `reply_count` in sync. (Post *creation* goes through a centralised path for
 * tier checks — see Task 15.)
 */

/**
 * Single-reaction semantics: a user has at most one emoji per post. Selecting the
 * same emoji clears it; selecting a different one replaces it.
 */
export async function toggleReaction(
  userId: string,
  postId: string,
  emoji: EmojiType,
  current: EmojiType | null,
): Promise<EmojiType | null> {
  // Clear any existing reaction by this user on this post.
  if (current) {
    await supabase.from('reactions').delete().eq('post_id', postId).eq('user_id', userId);
  }

  // Toggling the same emoji off → done.
  if (current === emoji) return null;

  const { error } = await supabase.from('reactions').insert({
    post_id: postId,
    user_id: userId,
    emoji_type: emoji,
  });
  if (error) throw error;
  return emoji;
}

/** Toggle a bookmark (Save) on a post (§2.26 three-dot menu, §2.25 Saved tab). */
export async function toggleBookmark(userId: string, postId: string, currentlySaved: boolean): Promise<boolean> {
  if (currentlySaved) {
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', userId).eq('post_id', postId);
    if (error) throw error;
    return false;
  }
  const { error } = await supabase.from('bookmarks').insert({ user_id: userId, post_id: postId });
  if (error) throw error;
  return true;
}

/** Flag/report a post with a reason (§2.114). Anonymous to the poster. */
export async function flagPost(userId: string, postId: string, reason: string): Promise<void> {
  const { error } = await supabase.from('post_flags').insert({ post_id: postId, flagged_by: userId, reason });
  if (error) throw error;
}

export async function addReply(postId: string, userId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  // RLS enforces tier (standard/pro) and not-banned on insert, and verifies
  // author_id === auth.uid(); we still set author_id since the column is NOT NULL.
  const { error } = await supabase
    .from('replies')
    .insert({ post_id: postId, author_id: userId, body_text: trimmed });
  if (error) throw error;
}
