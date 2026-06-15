import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface EducatorBasics {
  board: string | null; // primary board (boards[0])
  subject: string | null; // primary subject (subjects[0])
}

async function fetchEducatorBasics(userId: string): Promise<EducatorBasics> {
  const { data } = await supabase.from('educator_profiles').select('boards, subjects').eq('user_id', userId).maybeSingle();
  const row = data as { boards: string[] | null; subjects: string[] | null } | null;
  return { board: row?.boards?.[0] ?? null, subject: row?.subjects?.[0] ?? null };
}

/** Primary board + subject — used to personalise the feed tab names (§2.25). */
export function useEducatorBasics(userId: string | undefined) {
  return useQuery<EducatorBasics>({
    queryKey: ['educator-basics', userId],
    queryFn: () => fetchEducatorBasics(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });
}
