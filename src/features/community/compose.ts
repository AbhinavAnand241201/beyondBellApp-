import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';
import type { PostType } from '@/types/db';

/**
 * Post composition. The web routes creation through `POST /api/community/posts`
 * so tier checks stay centralised (§13). With no deployed Next backend here, we
 * insert directly — RLS still enforces tier (standard/pro) + not-banned via its
 * WITH CHECK clause, so the gate holds. Swap to an Edge Function later by
 * replacing only `createPost`.
 */

export interface RoomOption {
  roomId: string;
  roomName: string;
  spaceName: string;
}

/** Rooms the user can post into — standard rooms in their joined spaces. */
export async function fetchPostableRooms(userId: string): Promise<RoomOption[]> {
  const { data: members } = await supabase.from('space_members').select('space_id').eq('user_id', userId);
  const spaceIds = (members ?? []).map((m) => (m as { space_id: string }).space_id);
  if (spaceIds.length === 0) return [];

  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, slug, room_type, is_archived, space:spaces(name)')
    .in('space_id', spaceIds)
    .eq('is_archived', false)
    .in('room_type', ['standard', 'guided']);
  if (error) throw error;

  type RawRoom = {
    id: string;
    name: string | null;
    slug: string;
    space: { name: string | null } | { name: string | null }[] | null;
  };

  return ((data ?? []) as RawRoom[]).map((r) => {
    const space = Array.isArray(r.space) ? r.space[0] : r.space;
    return {
      roomId: r.id,
      roomName: r.name ?? r.slug,
      spaceName: space?.name ?? 'Space',
    };
  });
}

export const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'discussion', label: 'Discussion' },
  { value: 'question', label: 'Question' },
  { value: 'teaching_win', label: 'Teaching win' },
  { value: 'resource_share', label: 'Resource' },
  { value: 'appreciation', label: 'Appreciation' },
];

export const POST_MAX_LENGTH = 1500; // matches the DB CHECK on posts.body_text

export async function createPost(
  userId: string,
  roomId: string,
  bodyText: string,
  postType: PostType,
  imageUrl?: string | null,
): Promise<void> {
  const { error } = await supabase.from('posts').insert({
    author_id: userId,
    room_id: roomId,
    body_text: bodyText.trim(),
    post_type: postType,
    image_url: imageUrl ?? null,
  });
  if (error) throw error;
}

const URL_RE = /(https?:\/\/|www\.)\S+/i;
/** Free-tier posts may not contain links (§2.34). */
export function containsLink(text: string): boolean {
  return URL_RE.test(text);
}

/**
 * Pick → compress (<1 MB target) → upload an image to Storage, returning a public
 * URL (§2.36). Uses the `post-images` bucket; returns null on any failure so the
 * post can still publish without the image.
 */
export async function pickCompressAndUpload(userId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
  if (res.canceled || !res.assets?.[0]) return null;

  // Resize to max 1280px wide + JPEG 0.6 → well under 1 MB.
  const manipulated = await ImageManipulator.manipulateAsync(res.assets[0].uri, [{ resize: { width: 1280 } }], {
    compress: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  try {
    const resp = await fetch(manipulated.uri);
    const bytes = await resp.arrayBuffer();
    const path = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('post-images').upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('post-images').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
