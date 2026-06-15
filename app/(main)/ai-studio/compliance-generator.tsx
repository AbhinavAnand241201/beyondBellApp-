import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Text, Toast } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canAccessTool, getTool } from '@/features/ai/tools';
import { GeneratingOverlay } from '@/features/ai/shared/GeneratingOverlay';
import { ToolActionBar } from '@/features/ai/shared/ToolActionBar';
import { ExportSheet, type ExportFormat } from '@/features/ai/shared/ExportSheet';
import { ApiError, isApiConfigured } from '@/lib/api';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

import { ComplianceForm } from '@/features/ai/compliance/ComplianceForm';
import { ComplianceOutput } from '@/features/ai/compliance/ComplianceOutput';
import { generateCompliance } from '@/features/ai/compliance/api';
import { copyDocument, exportDocumentPdf } from '@/features/ai/compliance/export';
import { demoDocument } from '@/features/ai/compliance/sample';
import { emptyComplianceInput, type ComplianceDocument, type ComplianceInput } from '@/features/ai/compliance/types';

const tool = getTool('compliance');
type Stage = 'form' | 'generating' | 'result' | 'error';

export default function ComplianceGenerator() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const tier: Tier = me.data?.tier ?? 'free';

  const [stage, setStage] = useState<Stage>('form');
  const [input, setInput] = useState<ComplianceInput>(emptyComplianceInput);
  const [doc, setDoc] = useState<ComplianceDocument | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const canRun = input.mode === 'sqaa' ? input.domain >= 1 : input.documentType.length > 0;

  async function runGenerate() {
    setStage('generating');
    try {
      const result = await generateCompliance(input);
      setDoc(result);
      setDemoMode(false);
      setStage('result');
      void queryClient.invalidateQueries({ queryKey: ['ai-history', user?.id] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setDoc(demoDocument(input));
        setDemoMode(true);
        setStage('result');
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed.');
      setStage('error');
    }
  }

  async function onCopy() {
    if (!doc) return;
    await copyDocument(doc);
    setToast('Document copied');
  }

  async function onExportSelect(format: ExportFormat) {
    setShowExport(false);
    if (!doc) return;
    try {
      if (format === 'pdf') await exportDocumentPdf(doc);
      else {
        await copyDocument(doc);
        setToast(format === 'word' ? 'Copied — paste into Word' : 'Copied to clipboard');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  if (me.isLoading) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }

  // Pro-only.
  if (!canAccessTool(tool, tier)) {
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <Text variant="h2">{tool.label}</Text>
            <Text variant="body" color={colors.muted}>
              Turn months of SQAA and policy documentation into minutes — audit-ready, school-specific.
            </Text>
          </View>
          <UpgradePrompt requiredTier="pro" feature="Compliance Generator" />
        </ScrollView>
      </Shell>
    );
  }

  // --- result ---
  if (stage === 'result' && doc) {
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
          {demoMode ? (
            <Banner tone="info" title="Sample preview" message="Demo document so you can review the UI. Connect the AI backend for accurate, school-specific output." />
          ) : null}
          <Pressable onPress={() => setStage('form')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
            <Text variant="label" color={colors.amberDark}>
              New document
            </Text>
          </Pressable>
          <ComplianceOutput doc={doc} />
        </ScrollView>
        <ToolActionBar
          actions={[
            { id: 'copy', icon: 'copy-outline', label: 'Copy', onPress: onCopy },
            { id: 'export', icon: 'share-outline', label: 'Export', onPress: () => setShowExport(true), primary: true },
          ]}
        />
        <ExportSheet visible={showExport} onClose={() => setShowExport(false)} onSelect={onExportSelect} />
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
            SQAA documentation and audit-ready policies — review, customise, submit.
          </Text>
        </View>

        {!isApiConfigured ? (
          <Banner tone="info" title="Preview mode" message="Fill the form and generate to preview the full document with a sample. Connect the backend for accurate output." />
        ) : null}

        <ComplianceForm value={input} onChange={setInput} />

        <Button title="Generate document" onPress={runGenerate} disabled={!canRun} fullWidth />
      </ScrollView>

      <GeneratingOverlay
        visible={stage === 'generating'}
        title="Compliance Generator is working…"
        subtitle="Usually under 3 minutes"
        steps={['Reading the framework…', 'Drafting the document…', 'Building evidence checklist…']}
        icon="shield-checkmark-outline"
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
});
