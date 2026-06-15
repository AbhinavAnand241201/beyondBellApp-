import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, Text, Toast } from '@/components/ui';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canAccessTool, getDailyLimit, getRemaining, getTool } from '@/features/ai/tools';
import { fetchDailyUsage } from '@/features/ai/usage';
import { GeneratingOverlay } from '@/features/ai/shared/GeneratingOverlay';
import { ToolActionBar } from '@/features/ai/shared/ToolActionBar';
import { ExportSheet, type ExportFormat } from '@/features/ai/shared/ExportSheet';
import { ApiError, isApiConfigured } from '@/lib/api';
import { tierAtLeast } from '@/lib/tier';
import { env } from '@/config/env';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

import { AssessmentForm } from '@/features/ai/assessment/AssessmentForm';
import { AssessmentOutput } from '@/features/ai/assessment/AssessmentOutput';
import { QuestionEditSheet } from '@/features/ai/assessment/QuestionEditSheet';
import { generateAssessment, rephraseQuestion, saveQuestionToBank } from '@/features/ai/assessment/api';
import { copyPaper, exportPaperPdf } from '@/features/ai/assessment/export';
import { demoAssessment, SAMPLE_INPUT } from '@/features/ai/assessment/sample';
import { emptyAssessmentInput, type AssessmentInput, type AssessmentPackage, type Question } from '@/features/ai/assessment/types';

const tool = getTool('assessment');
type Stage = 'form' | 'generating' | 'result' | 'error';

interface EditTarget {
  setIndex: number;
  sectionId: string;
  question: Question;
}

export default function AssessmentBuilder() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const tier: Tier = me.data?.tier ?? 'free';
  const isPro = tierAtLeast(tier, 'pro');

  const [stage, setStage] = useState<Stage>('form');
  const [input, setInput] = useState<AssessmentInput>(emptyAssessmentInput);
  const [pkg, setPkg] = useState<AssessmentPackage | null>(null);
  const [setIndex, setSetIndex] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [toast, setToast] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [edit, setEdit] = useState<EditTarget | null>(null);
  const [rephrasing, setRephrasing] = useState(false);
  const [savingToBank, setSavingToBank] = useState(false);

  const usage = useQuery({
    queryKey: ['daily-usage', user?.id, 'assessment'],
    queryFn: () => fetchDailyUsage(user?.id as string, 'assessment'),
    enabled: !!user?.id && env.isConfigured && tier === 'free',
  });
  const remaining = getRemaining(tool, tier, usage.data ?? 0);
  const limitReached = env.isConfigured && tier === 'free' && remaining <= 0;
  const canRun = input.subject.trim().length > 0 && input.topics.length > 0 && input.questionTypes.length > 0;

  const activePaper = pkg?.sets[setIndex]?.paper ?? null;

  async function runGenerate() {
    setStage('generating');
    setSetIndex(0);
    try {
      const result = await generateAssessment(input);
      setPkg(result);
      setDemoMode(false);
      setStage('result');
      void queryClient.invalidateQueries({ queryKey: ['ai-history', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['daily-usage', user?.id, 'assessment'] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setPkg(demoAssessment(input));
        setDemoMode(true);
        setStage('result');
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed.');
      setStage('error');
    }
  }

  function resetToForm() {
    setStage('form');
    setPkg(null);
    setDemoMode(false);
    setSetIndex(0);
  }

  async function onCopy() {
    if (!activePaper) return;
    await copyPaper(activePaper, pkg?.includeAnswerKey ?? false);
    setToast('Copied to clipboard');
  }

  async function onExportSelect(format: ExportFormat) {
    setShowExport(false);
    if (!activePaper || !pkg) return;
    try {
      if (format === 'pdf') {
        await exportPaperPdf(activePaper, { answerKey: pkg.includeAnswerKey, markingScheme: pkg.includeMarkingScheme });
      } else {
        await copyPaper(activePaper, pkg.includeAnswerKey);
        setToast(format === 'word' ? 'Copied — paste into Word' : 'Copied to clipboard');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  /** Immutably replace a question within the package. */
  function replaceQuestion(target: EditTarget, updated: Question) {
    setPkg((prev) => {
      if (!prev) return prev;
      const sets = prev.sets.map((set, si) => {
        if (si !== target.setIndex) return set;
        const sections = set.paper.sections.map((sec) => {
          if (sec.id !== target.sectionId) return sec;
          return { ...sec, questions: sec.questions.map((q) => (q.id === updated.id ? updated : q)) };
        });
        return { ...set, paper: { ...set.paper, sections } };
      });
      return { ...prev, sets };
    });
  }

  function onSaveEdit(updated: Question) {
    if (!edit) return;
    replaceQuestion(edit, updated);
    setEdit(null);
    setToast('Question updated');
  }

  async function onRephrase(question: Question, instruction: string) {
    if (!edit) return;
    if (!isApiConfigured) {
      setEdit(null);
      setToast('Preview: connect backend to rephrase');
      return;
    }
    setRephrasing(true);
    try {
      const updated = await rephraseQuestion(question, instruction);
      replaceQuestion(edit, updated);
      setEdit(null);
      setToast('Question rephrased');
    } catch (e) {
      Alert.alert('Couldn’t rephrase', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRephrasing(false);
    }
  }

  async function onSaveToBank(question: Question) {
    if (!isApiConfigured) {
      setToast('Preview: connect backend to save to bank');
      return;
    }
    setSavingToBank(true);
    try {
      await saveQuestionToBank(question, { subject: input.subject, board: input.board, grade: input.grade });
      setToast('Saved to question bank');
    } catch (e) {
      Alert.alert('Couldn’t save', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingToBank(false);
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

  // --- result ---
  if (stage === 'result' && pkg) {
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
          {demoMode ? (
            <Banner tone="info" title="Sample preview" message="Demo package so you can review the UI. Connect the AI backend for real generation." />
          ) : null}
          <Pressable onPress={resetToForm} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
            <Text variant="label" color={colors.amberDark}>
              New paper
            </Text>
          </Pressable>
          <AssessmentOutput
            pkg={pkg}
            setIndex={setIndex}
            onSetChange={setSetIndex}
            onEditQuestion={(si, sectionId, question) => setEdit({ setIndex: si, sectionId, question })}
          />
        </ScrollView>
        <ToolActionBar
          actions={[
            { id: 'copy', icon: 'copy-outline', label: 'Copy', onPress: onCopy },
            { id: 'export', icon: 'share-outline', label: 'Export', onPress: () => setShowExport(true), primary: true },
          ]}
        />
        <ExportSheet visible={showExport} onClose={() => setShowExport(false)} onSelect={onExportSelect} />
        <QuestionEditSheet
          visible={!!edit}
          question={edit?.question ?? null}
          onClose={() => setEdit(null)}
          onSave={onSaveEdit}
          onRephrase={onRephrase}
          rephrasing={rephrasing}
          onSaveToBank={onSaveToBank}
          canSaveToBank={isPro}
          savingToBank={savingToBank}
        />
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

  // --- form ---
  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing.xs }}>
          <Text variant="h2">{tool.label}</Text>
          <Text variant="body" color={colors.muted}>
            Board-pattern question papers with answer key, marking scheme & blueprint.
          </Text>
        </View>

        {!isApiConfigured ? (
          <Banner tone="info" title="Preview mode" message="Fill the form and tap Generate to preview the full output with a sample paper. Connect the backend for real generation." />
        ) : tier === 'free' ? (
          <UsageMeter remaining={remaining} limit={getDailyLimit(tool, tier)} />
        ) : null}

        {limitReached ? <Paywall limit={getDailyLimit(tool, tier)} /> : null}

        <AssessmentForm value={input} onChange={setInput} />

        <Button title="Generate assessment" onPress={runGenerate} disabled={!canRun || limitReached} fullWidth />

        <SamplePreview />
      </ScrollView>

      <GeneratingOverlay
        visible={stage === 'generating'}
        title="Building your assessment…"
        subtitle="Usually under 90 seconds"
        steps={['Selecting questions…', 'Checking Bloom’s balance…', 'Writing the answer key…']}
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
          {remaining} of {limit} free paper{limit === 1 ? '' : 's'} left today
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
          <Text variant="label">You’ve used your {limit} free paper today</Text>
          <Text variant="body" color={colors.muted}>
            Upgrade to Standard for unlimited papers, or come back tomorrow.
          </Text>
          <Button title="Upgrade" size="sm" onPress={() => {}} style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} />
        </View>
      </View>
    </Card>
  );
}

function SamplePreview() {
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Ionicons name="eye-outline" size={18} color={colors.muted} />
        <Text variant="label">What you’ll get</Text>
      </View>
      <Text variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
        A 4-part package — example: “{SAMPLE_INPUT.topics[0]}” ({SAMPLE_INPUT.grade})
      </Text>
      <View style={{ gap: 6 }}>
        {['Print-ready question paper', 'Full answer key', 'Examiner marking scheme', 'Bloom’s × topic blueprint'].map((s) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text variant="body" color={colors.muted}>
              {s}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
