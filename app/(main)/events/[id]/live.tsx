import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Card, OptionChip, Pill, Text, TextField } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { fetchEventDetail } from '@/features/events/queries';
import { fetchQuestions, submitQuestion, voteQuestion, type EventQuestion } from '@/features/events/qa';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { colors, radius, spacing } from '@/theme/tokens';

type Panel = 'chat' | 'qa';
interface ChatMsg { id: string; name: string; text: string }

export default function LiveRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const [panel, setPanel] = useState<Panel>('chat');

  const event = useQuery({ queryKey: ['event', id, user?.id], queryFn: () => fetchEventDetail(id as string, user?.id as string), enabled: !!id && !!user?.id });
  const url = event.data?.streamUrl || event.data?.recordingUrl || null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: event.data?.title ?? 'Live', headerBackTitle: 'Back' }} />
      {event.isLoading ? (
        <LoadingState />
      ) : event.isError || !event.data ? (
        <ErrorState message="Couldn’t load the live room." onRetry={() => event.refetch()} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
          <View style={styles.video}>
            {url ? (
              <WebView source={{ uri: url }} allowsFullscreenVideo style={{ flex: 1 }} />
            ) : (
              <View style={styles.noVideo}>
                <Ionicons name="videocam-off-outline" size={28} color={colors.mutedLight} />
                <Text variant="caption" color={colors.mutedLight}>
                  Stream link not available yet
                </Text>
              </View>
            )}
          </View>

          <View style={styles.panelTabs}>
            <OptionChip label="Live chat" selected={panel === 'chat'} onPress={() => setPanel('chat')} />
            <OptionChip label="Q&A" selected={panel === 'qa'} onPress={() => setPanel('qa')} />
          </View>

          {panel === 'chat' ? (
            <LiveChat eventId={id as string} myName={me.data?.displayName ?? 'You'} />
          ) : (
            <QAPanel eventId={id as string} userId={user?.id as string} onChanged={() => queryClient.invalidateQueries({ queryKey: ['event-qa', id] })} />
          )}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

/** Ephemeral realtime chat via a Supabase broadcast channel (§2.94). */
function LiveChat({ eventId, myName }: { eventId: string; myName: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const channel = supabase.channel(`event:${eventId}:chat`, { config: { broadcast: { self: true } } });
    channel
      .on('broadcast', { event: 'msg' }, (payload) => {
        const m = payload.payload as ChatMsg;
        setMessages((prev) => [...prev, m]);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [eventId]);

  function send() {
    const t = text.trim();
    if (!t || !channelRef.current) return;
    const msg: ChatMsg = { id: `c${(idRef.current += 1)}-${myName}`, name: myName, text: t };
    void channelRef.current.send({ type: 'broadcast', event: 'msg', payload: msg });
    setText('');
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }) => (
          <Text variant="body">
            <Text variant="label" color={colors.amberDark}>
              {item.name}:{' '}
            </Text>
            {item.text}
          </Text>
        )}
        ListEmptyComponent={<Text variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.lg }}>Say hello to the room 👋</Text>}
      />
      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <TextField value={text} onChangeText={setText} placeholder="Message…" />
        </View>
        <Button title="Send" size="sm" disabled={text.trim().length === 0} onPress={send} />
      </View>
    </View>
  );
}

function QAPanel({ eventId, userId, onChanged }: { eventId: string; userId: string; onChanged: () => void }) {
  const [text, setText] = useState('');
  const questions = useQuery({ queryKey: ['event-qa', eventId], queryFn: () => fetchQuestions(eventId), enabled: !!eventId });

  const submit = useMutation({
    mutationFn: () => submitQuestion(eventId, userId, text),
    onSuccess: () => {
      setText('');
      questions.refetch();
      onChanged();
    },
    onError: (e) => Alert.alert('Couldn’t submit', (e as Error).message),
  });
  const vote = useMutation({
    mutationFn: (qid: string) => voteQuestion(qid, userId),
    onSuccess: () => questions.refetch(),
    onError: (e) => Alert.alert('Couldn’t vote', (e as Error).message),
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={questions.data}
        keyExtractor={(q) => q.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
        renderItem={({ item }: { item: EventQuestion }) => (
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <Pressable onPress={() => vote.mutate(item.id)} style={styles.vote}>
                <Ionicons name="arrow-up" size={16} color={colors.amberDark} />
                <Text variant="caption" color={colors.ink}>
                  {item.upvotes}
                </Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text variant="body">{item.question}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: 4, alignItems: 'center' }}>
                  <Text variant="caption" color={colors.muted}>
                    {item.authorName}
                  </Text>
                  {item.status === 'promoted' ? <Pill label="On screen" tone="amber" /> : null}
                  {item.status === 'resolved' ? <Pill label="Resolved" tone="success" /> : null}
                </View>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text variant="caption" color={colors.muted} style={{ textAlign: 'center', marginTop: spacing.lg }}>No questions yet — ask the first one.</Text>}
      />
      <View style={styles.composer}>
        <View style={{ flex: 1 }}>
          <TextField value={text} onChangeText={setText} placeholder="Ask a question…" multiline />
        </View>
        <Button title="Ask" size="sm" loading={submit.isPending} disabled={text.trim().length === 0} onPress={() => submit.mutate()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  video: { height: 220, backgroundColor: '#000' },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.ink },
  panelTabs: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, backgroundColor: colors.surface },
  vote: { alignItems: 'center', backgroundColor: colors.canvas, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4, gap: 2 },
});
