import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, Text, Toast } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canAccessTool, getDailyLimit, getRemaining, getTool } from '@/features/ai/tools';
import { fetchDailyUsage } from '@/features/ai/usage';
import { GeneratingOverlay } from '@/features/ai/shared/GeneratingOverlay';
import { ToolActionBar, type ToolAction } from '@/features/ai/shared/ToolActionBar';
import { ApiError, isApiConfigured } from '@/lib/api';
import { tierAtLeast } from '@/lib/tier';
import { env } from '@/config/env';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

import { SituationPicker } from '@/features/ai/parent/SituationPicker';
import { ParentForm } from '@/features/ai/parent/ParentForm';
import { MessageOutput } from '@/features/ai/parent/MessageOutput';
import { generateMessage, refineMessage, saveTemplate } from '@/features/ai/parent/api';
import { copyFormat, openEmail, shareFormat } from '@/features/ai/parent/export';
import { demoMessage, SAMPLE_INPUT } from '@/features/ai/parent/sample';
import {
  emptyParentInput,
  FORMAT_LABEL,
  getSituation,
  type MessageFormat,
  type ParentInput,
  type ParentMessageOutput,
} from '@/features/ai/parent/types';

const tool = getTool('parent');
type Stage = 'pick' | 'form' | 'generating' | 'result' | 'error';

export default function ParentCommunicator() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const tier: Tier = me.data?.tier ?? 'free';
  const canSaveTemplate = tierAtLeast(tier, 'standard'); // §4.1 templates = Standard/Pro

  const [stage, setStage] = useState<Stage>('pick');
  const [input, setInput] = useState<ParentInput>(emptyParentInput);
  const [output, setOutput] = useState<ParentMessageOutput | null>(null);
  const [activeFormat, setActiveFormat] = useState<MessageFormat>('whatsapp');
  const [demoMode, setDemoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [refining, setRefining] = useState(false);

  const usage = useQuery({
    queryKey: ['daily-usage', user?.id, 'parent'],
    queryFn: () => fetchDailyUsage(user?.id as string, 'parent'),
    enabled: !!user?.id && env.isConfigured && tier === 'free',
  });
  const remaining = getRemaining(tool, tier, usage.data ?? 0);
  const limitReached = env.isConfigured && tier === 'free' && remaining <= 0;
  const situation = getSituation(input.situationId);
  const canRun = input.studentName.trim().length > 0 && input.context.trim().length > 0 && input.formats.length > 0;

  function pickSituation(situationId: string) {
    const sit = getSituation(situationId);
    setInput({ ...input, situationId, tone: 'Auto' });
    setStage('form');
    if (sit) setActiveFormat(input.formats[0] ?? 'whatsapp');
  }

  async function runGenerate() {
    setStage('generating');
    try {
      const result = await generateMessage(input);
      applyResult(result, false);
      void queryClient.invalidateQueries({ queryKey: ['ai-history', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['daily-usage', user?.id, 'parent'] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        applyResult(demoMessage(input), true);
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed.');
      setStage('error');
    }
  }

  function applyResult(result: ParentMessageOutput, demo: boolean) {
    setOutput(result);
    setDemoMode(demo);
    const first = (Object.keys(result.formats) as MessageFormat[]).find((f) => result.formats[f]);
    if (first) setActiveFormat(first);
    setStage('result');
  }

  async function onRefine(instruction: string) {
    if (!output) return;
    if (!isApiConfigured) {
      setToast('Preview: connect backend to refine');
      return;
    }
    setRefining(true);
    try {
      const updated = await refineMessage(output, instruction, input);
      setOutput(updated);
      setToast('Message refined');
    } catch (e) {
      Alert.alert('Couldn’t refine', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRefining(false);
    }
  }

  async function onCopy() {
    if (!output) return;
    await copyFormat(output, activeFormat);
    setToast(`${FORMAT_LABEL[activeFormat]} copied`);
  }

  async function onShareOrEmail() {
    if (!output) return;
    if (activeFormat === 'email') {
      const opened = await openEmail(output);
      if (!opened) setToast('No email app found');
      return;
    }
    await shareFormat(output, activeFormat);
  }

  async function onSaveTemplate() {
    if (!output || !situation) return;
    if (!canSaveTemplate) {
      setToast('Template saving is a Standard feature');
      return;
    }
    if (!isApiConfigured) {
      setToast('Preview: connect backend to save templates');
      return;
    }
    try {
      const text =
        activeFormat === 'email' ? `${output.formats.email?.subject}\n\n${output.formats.email?.body}` : output.formats[activeFormat] ?? '';
      await saveTemplate(situation.label, situation.id, text, activeFormat);
      setToast('Saved to your templates');
    } catch (e) {
      Alert.alert('Couldn’t save', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  // --- gating ---
  if (me.isLoading) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }
  if (!canAccessTool(tool, tier)) {
    return (
      <Shell>
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Unavailable" message="This tool isn’t available on your plan." />
        </View>
      </Shell>
    );
  }

  // --- result ---
  if (stage === 'result' && output) {
    const actions: ToolAction[] = [
      { id: 'copy', icon: 'copy-outline', label: 'Copy', onPress: onCopy },
      activeFormat === 'email'
        ? { id: 'email', icon: 'mail-outline', label: 'Open email', onPress: onShareOrEmail }
        : { id: 'share', icon: 'share-outline', label: 'Share', onPress: onShareOrEmail },
      { id: 'save', icon: 'bookmark-outline', label: canSaveTemplate ? 'Template' : 'Template (Std)', onPress: onSaveTemplate, primary: true },
    ];
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
          {demoMode ? (
            <Banner tone="info" title="Sample preview" message="Demo message so you can review the UI. Connect the AI backend for real drafts." />
          ) : null}
          <Pressable onPress={() => setStage('form')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
            <Text variant="label" color={colors.amberDark}>
              Edit details
            </Text>
          </Pressable>
          <MessageOutput output={output} activeFormat={activeFormat} onFormatChange={setActiveFormat} onRefine={onRefine} refining={refining} />
        </ScrollView>
        <ToolActionBar actions={actions} />
        <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} />
      </Shell>
    );
  }

  // --- error ---
  if (stage === 'error') {
    return (
      <Shell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
          <Text variant="h3">Something went wrong</Text>
          <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            {errorMsg} Your inputs are saved.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button title="Back" variant="secondary" onPress={() => setStage('form')} />
            <Button title="Try again" onPress={runGenerate} />
          </View>
        </View>
      </Shell>
    );
  }

  // --- pick (empty state) ---
  if (stage === 'pick') {
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="h2">{tool.label}</Text>
            <Text variant="body" color={colors.muted}>
              Every message matters. Pick a situation to start.
            </Text>
          </View>
          {!isApiConfigured ? (
            <Banner tone="info" title="Preview mode" message="Pick a situation and generate to preview the full output with a sample message." />
          ) : tier === 'free' ? (
            <UsageMeter remaining={remaining} limit={getDailyLimit(tool, tier)} />
          ) : null}
          <SituationPicker onSelect={pickSituation} />
        </ScrollView>
      </Shell>
    );
  }

  // --- form ---
  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => setStage('pick')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
          <Text variant="label" color={colors.amberDark}>
            Change situation
          </Text>
        </Pressable>

        {limitReached ? <Paywall limit={getDailyLimit(tool, tier)} /> : null}

        <ParentForm value={input} onChange={setInput} />

        <Button title="Write the message" onPress={runGenerate} disabled={!canRun || limitReached} fullWidth />
      </ScrollView>

      <GeneratingOverlay
        visible={stage === 'generating'}
        title="Parent Communicator is writing…"
        subtitle="Usually under 30 seconds"
        steps={['Reading the situation…', 'Calibrating the tone…', 'Drafting your message…']}
        icon="mail-outline"
      />
    </Shell>
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

function UsageMeter({ remaining, limit }: { remaining: number; limit: number }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="flash-outline" size={18} color={colors.amberDark} />
        <Text variant="body" style={{ flex: 1 }}>
          {remaining} of {limit} free messages left today
        </Text>
        <Pill label="Free" tone="neutral" />
      </View>
    </Card>
  );
}

function Paywall({ limit }: { limit: number }) {
  return (
    <Card>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Ionicons name="lock-closed" size={20} color={colors.amberDark} />
        <View style={{ flex: 1, gap: spacing.xs }}>
          <Text variant="label">You’ve used your {limit} free messages today</Text>
          <Text variant="body" color={colors.muted}>
            Upgrade to Standard for unlimited messages, or come back tomorrow.
          </Text>
          <Button title="Upgrade" size="sm" onPress={() => {}} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
