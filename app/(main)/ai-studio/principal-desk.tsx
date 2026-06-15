import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Banner, Button, Card, OptionChip, Text, TextField } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canAccessTool, getTool } from '@/features/ai/tools';
import { ApiError, isApiConfigured } from '@/lib/api';
import { colors, spacing } from '@/theme/tokens';

import { ChatMessageView } from '@/features/ai/principal/ChatMessageView';
import { askPrincipalDesk } from '@/features/ai/principal/api';
import { demoAnswer } from '@/features/ai/principal/sample';
import { KNOWLEDGE_DOMAINS, SUGGESTED_QUERIES, type ChatMessage } from '@/features/ai/principal/types';

const tool = getTool('principal');

export default function PrincipalDesk() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const tier = me.data?.tier ?? 'free';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const idRef = useRef(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const nextId = () => `m${(idRef.current += 1)}`;

  async function send(text: string) {
    const query = text.trim();
    if (!query || sending) return;
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: query };
    const pendingId = nextId();
    const history = messages;
    setMessages((prev) => [...prev, userMsg, { id: pendingId, role: 'assistant', pending: true }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const answer = await askPrincipalDesk(history, query);
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { id: pendingId, role: 'assistant', pending: false, answer } : m)));
    } catch (e) {
      // Backend off → demo answer so the conversational UX is reviewable.
      const answer = e instanceof ApiError && e.status === 0 ? demoAnswer(query) : demoAnswer(query);
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { id: pendingId, role: 'assistant', pending: false, answer } : m)));
    } finally {
      setSending(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  if (me.isLoading) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }

  // Pro-only — rich preview for non-Pro (§2.71 / checklist 2.71).
  if (!canAccessTool(tool, tier)) {
    return (
      <Shell>
        <ProPreview />
      </Shell>
    );
  }

  const empty = messages.length === 0;

  return (
    <Shell>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        {empty ? (
          <EmptyState onPick={send} configured={isApiConfigured} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
            renderItem={({ item }) => <ChatMessageView message={item} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={styles.composer}>
          <View style={{ flex: 1 }}>
            <TextField value={input} onChangeText={setInput} placeholder="Ask a policy or leadership question…" multiline />
          </View>
          <Button title="Ask" size="sm" loading={sending} disabled={input.trim().length === 0} onPress={() => send(input)} />
        </View>
      </KeyboardAvoidingView>
    </Shell>
  );
}

function EmptyState({ onPick, configured }: { onPick: (q: string) => void; configured: boolean }) {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
      <View style={{ gap: spacing.xs }}>
        <Text variant="h2">{tool.label}</Text>
        <Text variant="body" color={colors.muted}>
          Your AI advisor for policy, governance, compliance and conflict — with sources and a clear next step.
        </Text>
      </View>
      {!configured ? (
        <Banner tone="info" title="Preview mode" message="Ask anything to preview the structured answer format. Connect the backend for cited, RAG-grounded guidance." />
      ) : null}
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Try asking</Text>
        <View style={{ gap: spacing.sm }}>
          {SUGGESTED_QUERIES.map((q) => (
            <Pressable key={q} onPress={() => onPick(q)}>
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Ionicons name="sparkles-outline" size={16} color={colors.amberDark} />
                  <Text variant="body" style={{ flex: 1 }}>
                    {q}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.mutedLight} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function ProPreview() {
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={{ gap: spacing.xs }}>
        <Text variant="h2">{tool.label}</Text>
        <Text variant="body" color={colors.muted}>
          A conversational advisor for school leaders. Structured guidance, source citations, and a clear next step — in under 60 seconds.
        </Text>
      </View>
      <UpgradePrompt requiredTier="pro" feature="Principal Desk" />
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">What it covers</Text>
        {KNOWLEDGE_DOMAINS.map((d) => (
          <Card key={d.title}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name={d.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.amberDark} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{d.title}</Text>
                <Text variant="caption" color={colors.muted}>
                  {d.topics}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
      <View style={{ gap: spacing.sm }}>
        <Text variant="label">Example questions</Text>
        {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
          <Text key={q} variant="body" color={colors.muted}>
            • {q}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: tool.label, headerBackTitle: 'Studio' }} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
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
