import { supabase } from '@/lib/supabase';
import { DM_MAX_LENGTH } from './types';

/**
 * DM writes. The web routes sends through `POST /api/messages/send` to enforce
 * tier (free can't DM), not-banned, not-blocked (both directions), and a
 * Standard = 5/day rate limit (§14). With no deployed backend here we insert
 * directly: RLS still blocks free-tier and blocked-pair sends via WITH CHECK, so
 * the security gate holds. The *rate limit* is the one rule not expressible in
 * RLS alone — port `messages/send` to an Edge Function to restore it. We surface
 * this gap rather than pretend it's enforced.
 */
export async function sendDirectMessage(senderId: string, recipientId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  if (trimmed.length > DM_MAX_LENGTH) throw new Error(`Messages are limited to ${DM_MAX_LENGTH} characters.`);

  const { error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body_text: trimmed });
  if (error) throw error;
}

/** Block a user (prevents DMs both directions). RPC mirrors the web's behaviour. */
export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error) throw error;
}

/** Report a conversation via the `report_conversation` RPC (§8.6). */
export async function reportConversation(partnerId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('report_conversation', {
    p_reported_user_id: partnerId,
    p_reason: reason,
  });
  if (error) throw error;
}
