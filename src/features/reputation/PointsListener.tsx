import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { Toast } from '@/components/ui';
import { LevelUpOverlay } from './LevelUpOverlay';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';

/**
 * Listens to the user's Circle Points ledger via Realtime (§2.87) and shows a
 * "+X points" toast for each award, plus an in-app level-up celebration (§2.89)
 * when `users.level` increases. Renders nothing but the toast/overlay.
 *
 * The ledger `points` value already reflects the Pro 2× multiplier (applied by
 * the DB trigger), so the toast shows the real awarded amount (§2.90).
 */
const ACTION_LABEL: Record<string, string> = {
  post_created: 'your post',
  reply_created: 'your reply',
  reply_helpful: 'a helpful reply',
  post_reactions: 'a popular post',
  resource_rated: 'a great resource',
  event_attended: 'attending an event',
  profile_completed: 'completing your profile',
  level_up_bonus: 'levelling up',
};

export function PointsListener() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const lastLevel = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.id || !env.isConfigured) return;

    const ledger = supabase
      .channel(`points:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'circle_points_ledger', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = payload.new as { points: number; action_type: string };
          if (row.points > 0) {
            const reason = ACTION_LABEL[row.action_type] ?? 'contributing';
            setToast(`+${row.points} points for ${reason}`);
          }
          void queryClient.invalidateQueries({ queryKey: ['current-user', user.id] });
          void queryClient.invalidateQueries({ queryKey: ['dashboard', user.id] });
        },
      )
      .subscribe();

    const levelCh = supabase
      .channel(`level:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { level: number }).level;
          if (lastLevel.current != null && next > lastLevel.current) setLevelUp(next);
          lastLevel.current = next;
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ledger);
      void supabase.removeChannel(levelCh);
    };
  }, [user?.id, queryClient]);

  return (
    <>
      <Toast visible={!!toast} message={toast ?? ''} icon="add-circle" onHide={() => setToast(null)} />
      <LevelUpOverlay level={levelUp} onClose={() => setLevelUp(null)} />
    </>
  );
}
