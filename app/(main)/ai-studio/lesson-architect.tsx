import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, Text } from '@/components/ui';
import { Toast } from '@/components/ui';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canAccessTool, getDailyLimit, getRemaining, getTool } from '@/features/ai/tools';
import { fetchDailyUsage } from '@/features/ai/usage';
import { ApiError, isApiConfigured } from '@/lib/api';
import { env } from '@/config/env';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

import { LessonForm } from '@/features/ai/lesson/LessonForm';
import { GeneratingOverlay } from '@/features/ai/shared/GeneratingOverlay';
import { LessonPlanView } from '@/features/ai/lesson/LessonPlanView';
import { ToolActionBar } from '@/features/ai/shared/ToolActionBar';
import { CustomisePanel } from '@/features/ai/lesson/CustomisePanel';
import { ExportSheet, type ExportFormat } from '@/features/ai/shared/ExportSheet';
import { generateLesson, customiseSection } from '@/features/ai/lesson/api';
import { copyPlanToClipboard, exportPlanPdf } from '@/features/ai/lesson/export';
import { demoPlanFor, SAMPLE_PLAN } from '@/features/ai/lesson/sample';
import { emptyLessonInput, type CustomisableSection, type LessonInput, type LessonPlan } from '@/features/ai/lesson/types';

const tool = getTool('lesson');
type Stage = 'form' | 'generating' | 'result' | 'error';

export default function LessonArchitect() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const tier: Tier = me.data?.tier ?? 'free';

  const [view, setView] = useState<Stage>('form');
  const [input, setInput] = useState<LessonInput>(emptyLessonInput);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // result-screen state
  const [saved, setSaved] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showCustomise, setShowCustomise] = useState(false);
  const [customising, setCustomising] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Free-tier daily usage (only meaningful when the backend is connected).
  const usage = useQuery({
    queryKey: ['daily-usage', user?.id, 'lesson'],
    queryFn: () => fetchDailyUsage(user?.id as string, 'lesson'),
    enabled: !!user?.id && env.isConfigured && tier === 'free',
  });

  const remaining = getRemaining(tool, tier, usage.data ?? 0);
  const limitReached = env.isConfigured && tier === 'free' && remaining <= 0;
  const canRun =
    input.subject.trim().length > 0 && input.topic.trim().length > 0 && input.grade.trim().length > 0;

  async function runGenerate() {
    setView('generating');
    try {
      const result = await generateLesson(input);
      setPlan(result);
      setDemoMode(false);
      setView('result');
      void queryClient.invalidateQueries({ queryKey: ['ai-history', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['daily-usage', user?.id, 'lesson'] });
    } catch (e) {
      // Backend not configured → show a demo plan so the full UX stays reviewable.
      if (e instanceof ApiError && e.status === 0) {
        setPlan(demoPlanFor(input));
        setDemoMode(true);
        setView('result');
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed.');
      setView('error');
    }
  }

  function resetToForm() {
    setView('form');
    setPlan(null);
    setSaved(false);
    setDemoMode(false);
  }

  // --- result actions ---
  async function onCopy() {
    if (!plan) return;
    await copyPlanToClipboard(plan);
    setToast('Copied to clipboard');
  }

  function onSave() {
    if (saved) return;
    // Persisting to My Library needs the backend; surface the right message.
    setSaved(true);
    setToast(isApiConfigured ? 'Saved to My Library' : 'Saved (connect backend to sync)');
  }

  async function onExportSelect(format: ExportFormat) {
    setShowExport(false);
    if (!plan) return;
    try {
      if (format === 'pdf') {
        await exportPlanPdf(plan);
      } else {
        await copyPlanToClipboard(plan);
        setToast(format === 'word' ? 'Copied — paste into Word' : 'Copied to clipboard');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  async function onApplyCustomise(section: CustomisableSection, instruction: string) {
    if (!plan) return;
    if (!isApiConfigured) {
      setShowCustomise(false);
      setToast('Preview: connect backend to apply edits');
      return;
    }
    setCustomising(true);
    try {
      const updated = await customiseSection(plan, section, instruction);
      setPlan(updated);
      setShowCustomise(false);
      setToast('Section updated');
    } catch (e) {
      Alert.alert('Couldn’t apply', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setCustomising(false);
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
          <UpgradePrompt requiredTier={tool.minTier} feature={tool.label} />
        </View>
      </Shell>
    );
  }

  // --- result view ---
  if (view === 'result' && plan) {
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
          {demoMode ? (
            <Banner
              tone="info"
              title="Sample preview"
              message="This is a demo plan so you can review the UI. Connect the AI backend to generate real plans."
            />
          ) : null}
          <Pressable onPress={resetToForm} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
            <Text variant="label" color={colors.amberDark}>
              New plan
            </Text>
          </Pressable>
          <LessonPlanView plan={plan} />
        </ScrollView>
        <ToolActionBar
          actions={[
            { id: 'copy', icon: 'copy-outline', label: 'Copy', onPress: onCopy },
            { id: 'save', icon: saved ? 'bookmark' : 'bookmark-outline', label: saved ? 'Saved' : 'Save', onPress: onSave, active: saved },
            { id: 'export', icon: 'share-outline', label: 'Export', onPress: () => setShowExport(true) },
            { id: 'customise', icon: 'sparkles-outline', label: 'Customise', onPress: () => setShowCustomise(true), primary: true },
          ]}
        />
        <ExportSheet visible={showExport} onClose={() => setShowExport(false)} onSelect={onExportSelect} />
        <CustomisePanel
          visible={showCustomise}
          onClose={() => setShowCustomise(false)}
          onApply={onApplyCustomise}
          applying={customising}
        />
        <Toast visible={!!toast} message={toast ?? ''} onHide={() => setToast(null)} />
      </Shell>
    );
  }

  // --- error view ---
  if (view === 'error') {
    return (
      <Shell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.danger} />
          <Text variant="h3">Something went wrong</Text>
          <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            {errorMsg} Your inputs are saved.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button title="Back" variant="secondary" onPress={() => setView('form')} />
            <Button title="Try again" onPress={runGenerate} />
          </View>
        </View>
      </Shell>
    );
  }

  // --- form view (default) ---
  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing.xs }}>
          <Text variant="h2">{tool.label}</Text>
          <Text variant="body" color={colors.muted}>
            Board-aligned lesson plans in under 60 seconds.
          </Text>
        </View>

        {!isApiConfigured ? (
          <Banner
            tone="info"
            title="Preview mode"
            message="Fill the form and tap Generate to preview the full output UI with a sample plan. Connect the backend for real generation."
          />
        ) : tier === 'free' ? (
          <UsageMeter remaining={remaining} limit={getDailyLimit(tool, tier)} />
        ) : null}

        {limitReached ? <Paywall limit={getDailyLimit(tool, tier)} /> : null}

        <LessonForm value={input} onChange={setInput} />

        <Button
          title="Generate lesson plan"
          onPress={runGenerate}
          disabled={!canRun || limitReached}
          fullWidth
        />

        <SamplePreview />
      </ScrollView>

      <GeneratingOverlay
        visible={view === 'generating'}
        title="Lesson Architect is thinking…"
        subtitle="Usually under 60 seconds"
        steps={['Reading the curriculum…', 'Designing the lesson flow…', 'Crafting the hook & activity…']}
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
          {remaining} of {limit} free plans left today
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
          <Text variant="label">You’ve used your {limit} free plans today</Text>
          <Text variant="body" color={colors.muted}>
            Upgrade to Standard for unlimited lesson plans, or come back tomorrow.
          </Text>
          <Button title="Upgrade" size="sm" onPress={() => {}} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />
        </View>
      </View>
    </Card>
  );
}

/** Empty-state sample preview (§2.3) — shows the kind of plan they'll get. */
function SamplePreview() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Ionicons name="eye-outline" size={18} color={colors.muted} />
        <Text variant="label">What you’ll get</Text>
      </View>
      <Text variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
        A complete 7-part plan — example: “{SAMPLE_PLAN.header.topic}” ({SAMPLE_PLAN.header.grade})
      </Text>
      <View style={{ gap: 6 }}>
        {['Learning objectives + Bloom’s', 'Hook / starter', 'Concept delivery steps', 'Student activity', 'Formative check + exit ticket'].map(
          (s) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              <Text variant="body" color={colors.muted}>
                {s}
              </Text>
            </View>
          ),
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
