import { supabase } from '@/lib/supabase';
import type { Conversation, DirectMessage } from './types';

/**
 * Direct-message reads. RLS scopes `direct_messages` to rows where the viewer is
 * sender or recipient, so these queries only ever see the user's own threads.
 * Per-side soft deletes (`deleted_by_sender` / `deleted_by_recipient`) are honored
 * client-side.
 */

type RawDm = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body_text: string;
  read_at: string | null;
  created_at: string;
  deleted_by_sender: boolean | null;
  deleted_by_recipient: boolean | null;
};

function visibleToMe(m: RawDm, userId: string): boolean {
  if (m.sender_id === userId) return !m.deleted_by_sender;
  if (m.recipient_id === userId) return !m.deleted_by_recipient;
  return false;
}

function toDm(m: RawDm): DirectMessage {
  return {
    id: m.id,
    senderId: m.sender_id,
    recipientId: m.recipient_id,
    bodyText: m.body_text,
    readAt: m.read_at,
    createdAt: m.created_at,
  };
}

/** Build the conversation list by grouping the user's recent DMs by partner. */
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, body_text, read_at, created_at, deleted_by_sender, deleted_by_recipient')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;

  const rows = ((data ?? []) as RawDm[]).filter((m) => visibleToMe(m, userId));

  // Group by partner; first row per partner is the latest (already sorted desc).
  const byPartner = new Map<string, { latest: RawDm; unread: number }>();
  for (const m of rows) {
    const partnerId = m.sender_id === userId ? m.recipient_id : m.sender_id;
    const entry = byPartner.get(partnerId);
    const isUnread = m.recipient_id === userId && m.read_at == null;
    if (!entry) {
      byPartner.set(partnerId, { latest: m, unread: isUnread ? 1 : 0 });
    } else if (isUnread) {
      entry.unread += 1;
    }
  }

  const partnerIds = [...byPartner.keys()];
  if (partnerIds.length === 0) return [];

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, avatar_url')
    .in('id', partnerIds);
  const userMap = new Map(
    ((users ?? []) as { id: string; display_name: string | null; avatar_url: string | null }[]).map((u) => [u.id, u]),
  );

  return partnerIds
    .map((partnerId) => {
      const { latest, unread } = byPartner.get(partnerId)!;
      const u = userMap.get(partnerId);
      return {
        partnerId,
        partnerName: u?.display_name ?? 'Member',
        partnerAvatar: u?.avatar_url ?? null,
        lastMessage: latest.body_text,
        lastAt: latest.created_at,
        lastFromMe: latest.sender_id === userId,
        unreadCount: unread,
      };
    })
    .sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
}

export interface ThreadData {
  partner: { id: string; name: string; avatar: string | null };
  messages: DirectMessage[];
}

/** Full message history with one partner, oldest → newest. */
export async function fetchThread(userId: string, partnerId: string): Promise<ThreadData> {
  const [dmRes, partnerRes] = await Promise.all([
    supabase
      .from('direct_messages')
      .select('id, sender_id, recipient_id, body_text, read_at, created_at, deleted_by_sender, deleted_by_recipient')
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`,
      )
      .order('created_at', { ascending: true })
      .limit(500),
    supabase.from('users').select('id, display_name, avatar_url').eq('id', partnerId).maybeSingle(),
  ]);

  if (dmRes.error) throw dmRes.error;
  const messages = ((dmRes.data ?? []) as RawDm[]).filter((m) => visibleToMe(m, userId)).map(toDm);
  const p = partnerRes.data as { id: string; display_name: string | null; avatar_url: string | null } | null;

  return {
    partner: { id: partnerId, name: p?.display_name ?? 'Member', avatar: p?.avatar_url ?? null },
    messages,
  };
}

/** Mark all messages from `partnerId` to me as read. */
export async function markThreadRead(userId: string, partnerId: string): Promise<void> {
  await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .eq('sender_id', partnerId)
    .is('read_at', null);
}
