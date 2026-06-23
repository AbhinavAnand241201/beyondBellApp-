import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button, Card, Text, TextField } from '@/components/ui';
import { fetchMorningBriefing } from './queries';
import { addReply } from './mutations';
import { colors, fonts, spacing } from '@/theme/tokens';

/**
 * Morning Briefing card (§2.24) — ALWAYS amber background + black text (brand
 * rule). Expanded: question + inline reply. After replying it collapses to the
 * question + the user's reply but stays visible. Hidden if no briefing exists.
 */
export function MorningBriefingCard({ userId }: { userId: string | undefined }) {
  const [reply, setReply] = useState('');
  const [myReply, setMyReply] = useState<string | null>(null);

  const briefing = useQuery({
    queryKey: ['morning-briefing', userId],
    queryFn: () => fetchMorningBriefing(userId as string),
    enabled: !!userId,
  });

  const submit = useMutation({
    mutationFn: () => addReply(briefing.data?.id as string, userId as string, reply),
    onSuccess: () => {
      setMyReply(reply.trim());
      setReply('');
    },
    onError: (e) => Alert.alert('Couldn’t reply', (e as Error).message),
  });

  const post = briefing.data;

  // Empty state — the web shows the amber card even with no briefing yet.
  if (!post) {
    return (
      <Card highlight>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
          <Ionicons name="sunny" size={16} color={colors.ink} />
          <Text style={styles.kicker}>MORNING BRIEFING</Text>
        </View>
        <Text variant="body" color={colors.ink}>
          No briefing yet today. Check back at 7:00 AM IST.
        </Text>
      </Card>
    );
  }

  return (
    <Card highlight>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs }}>
        <Ionicons name="sunny" size={16} color={colors.ink} />
        <Text style={styles.kicker}>MORNING BRIEFING</Text>
      </View>
      <Text variant="h3" color={colors.ink}>
        {post.bodyText}
      </Text>

      {myReply ? (
        <View style={styles.replied}>
          <Ionicons name="checkmark-circle" size={16} color={colors.ink} />
          <Text variant="body" color={colors.ink} style={{ flex: 1 }}>
            You: {myReply}
          </Text>
        </View>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          <TextField value={reply} onChangeText={setReply} placeholder="Share your thoughts…" multiline />
          <Button title="Reply" size="sm" loading={submit.isPending} disabled={reply.trim().length === 0} onPress={() => submit.mutate()} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}

      <Text variant="caption" color={colors.ink} style={{ marginTop: spacing.sm, opacity: 0.7 }}>
        {post.replyCount + (myReply ? 1 : 0)} replies
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  replied: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  kicker: { fontFamily: fonts.bodySemibold, fontSize: 12, color: colors.ink, letterSpacing: 0.6 },
});
