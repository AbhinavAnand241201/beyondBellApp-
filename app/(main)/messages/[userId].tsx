import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Text, TextField } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { fetchThread, markThreadRead } from '@/features/messages/queries';
import { blockUser, reportConversation, sendDirectMessage } from '@/features/messages/mutations';
import { DM_MAX_LENGTH, type DirectMessage } from '@/features/messages/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canDirectMessage } from '@/lib/tier';
import { timeAgo } from '@/lib/format';
import { colors, radius, spacing } from '@/theme/tokens';

export default function DmThread() {
  const { userId: partnerId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  const me = user?.id;
  const queryClient = useQueryClient();
  const myProfile = useCurrentUser(me);
  const canDM = canDirectMessage(myProfile.data?.tier ?? 'free');
  const [body, setBody] = useState('');
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const threadKey = ['thread', me, partnerId];
  const thread = useQuery({
    queryKey: threadKey,
    queryFn: () => fetchThread(me as string, partnerId as string),
    enabled: !!me && !!partnerId,
  });

  // Mark partner→me messages read whenever the thread loads/changes.
  useEffect(() => {
    if (me && partnerId && thread.data) {
      void markThreadRead(me, partnerId).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['conversations', me] });
      });
    }
  }, [me, partnerId, thread.data, queryClient]);

  // Realtime: the only Realtime feature in the product (§14). Subscribe to new
  // DMs addressed to me and append the ones from this partner.
  useEffect(() => {
    if (!me || !partnerId) return;
    const channel = supabase
      .channel(`dm:${me}:${partnerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `recipient_id=eq.${me}` },
        (payload) => {
          const row = payload.new as { sender_id: string };
          if (row.sender_id === partnerId) {
            void queryClient.invalidateQueries({ queryKey: threadKey });
            void markThreadRead(me, partnerId);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, partnerId]);

  const send = useMutation({
    mutationFn: () => sendDirectMessage(me as string, partnerId as string, body),
    onSuccess: () => {
      setBody('');
      void queryClient.invalidateQueries({ queryKey: threadKey });
      void queryClient.invalidateQueries({ queryKey: ['conversations', me] });
    },
    onError: (err) => Alert.alert('Couldn’t send', (err as Error).message),
  });

  function openActions() {
    Alert.alert('Conversation', undefined, [
      { text: 'Report', style: 'destructive', onPress: onReport },
      { text: 'Block', style: 'destructive', onPress: onBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function onBlock() {
    if (!me || !partnerId) return;
    Alert.alert('Block this person?', 'They won’t be able to message you, and you won’t message them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(me, partnerId);
            void queryClient.invalidateQueries({ queryKey: ['conversations', me] });
            Alert.alert('Blocked', 'You’ve blocked this person.');
          } catch (e) {
            Alert.alert('Couldn’t block', (e as Error).message);
          }
        },
      },
    ]);
  }

  async function onReport() {
    if (!partnerId) return;
    try {
      await reportConversation(partnerId, 'Reported from mobile app');
      Alert.alert('Reported', 'Thanks — our team will review this conversation.');
    } catch (e) {
      Alert.alert('Couldn’t report', (e as Error).message);
    }
  }

  const partnerName = thread.data?.partner.name ?? 'Conversation';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: partnerName,
          headerBackTitle: 'Back',
          headerRight: () => (
            <Pressable onPress={openActions} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
            </Pressable>
          ),
        }}
      />

      {thread.isLoading ? (
        <LoadingState />
      ) : thread.isError || !thread.data ? (
        <ErrorState message="Couldn’t load this conversation." onRetry={() => thread.refetch()} />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={90}
        >
          <FlatList
            ref={listRef}
            data={thread.data.messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => <Bubble message={item} mine={item.senderId === me} />}
            ListEmptyComponent={
              <Text variant="body" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.xl }}>
                Say hello 👋
              </Text>
            }
          />

          {canDM ? (
            <View style={styles.composer}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={body}
                  onChangeText={setBody}
                  placeholder="Message…"
                  multiline
                  maxLength={DM_MAX_LENGTH}
                />
              </View>
              <Button
                title="Send"
                size="sm"
                loading={send.isPending}
                disabled={body.trim().length === 0}
                onPress={() => send.mutate()}
              />
            </View>
          ) : (
            <View style={{ padding: spacing.lg }}>
              <UpgradePrompt requiredTier="standard" feature="Direct messaging" />
            </View>
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function Bubble({ message, mine }: { message: DirectMessage; mine: boolean }) {
  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
        <Text variant="body" color={mine ? colors.ink : colors.ink} style={{ lineHeight: 21 }}>
          {message.bodyText}
        </Text>
        <Text variant="caption" color={colors.muted} style={{ marginTop: 2, textAlign: 'right' }}>
          {timeAgo(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '82%', borderRadius: radius.md, padding: spacing.md },
  mine: { backgroundColor: '#FCE8B8' },
  theirs: { backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
