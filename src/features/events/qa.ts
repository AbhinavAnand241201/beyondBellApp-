import { supabase } from '@/lib/supabase';

/**
 * Live event Q&A (§8.5, checklist 2.95). Questions are upvotable; a moderator can
 * promote/resolve them server-side (status reflected here). Live chat (§2.94) uses
 * an ephemeral Realtime broadcast channel — see the live room screen.
 */
export interface EventQuestion {
  id: string;
  question: string;
  upvotes: number;
  status: 'pending' | 'promoted' | 'resolved';
  authorName: string;
}

type RawQ = {
  id: string;
  question: string;
  upvote_count: number | null;
  status: string | null;
  author: { display_name: string | null } | { display_name: string | null }[] | null;
};

export async function fetchQuestions(eventId: string): Promise<EventQuestion[]> {
  const { data, error } = await supabase
    .from('event_questions')
    .select('id, question, upvote_count, status, author:users!event_questions_user_id_fkey(display_name)')
    .eq('event_id', eventId)
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as RawQ[]).map((q) => {
    const a = Array.isArray(q.author) ? q.author[0] : q.author;
    const status = q.status === 'promoted' || q.status === 'resolved' ? q.status : 'pending';
    return { id: q.id, question: q.question, upvotes: q.upvote_count ?? 0, status, authorName: a?.display_name ?? 'Attendee' };
  });
}

export async function submitQuestion(eventId: string, userId: string, question: string): Promise<void> {
  const trimmed = question.trim();
  if (!trimmed) return;
  const { error } = await supabase.from('event_questions').insert({ event_id: eventId, user_id: userId, question: trimmed });
  if (error) throw error;
}

export async function voteQuestion(questionId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('event_question_votes').insert({ question_id: questionId, user_id: userId });
  if (error) throw error;
}
