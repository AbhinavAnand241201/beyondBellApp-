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
import { ToolActionBar, type ToolAction } from '@/features/ai/shared/ToolActionBar';
import { ExportSheet, type ExportFormat } from '@/features/ai/shared/ExportSheet';
import { ApiError, isApiConfigured } from '@/lib/api';
import { tierAtLeast } from '@/lib/tier';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

import { EventForm } from '@/features/ai/event/EventForm';
import { ThemeSheet } from '@/features/ai/event/ThemeSheet';
import { BlueprintOutput } from '@/features/ai/event/BlueprintOutput';
import { generateBlueprint, suggestThemes } from '@/features/ai/event/api';
import { copyBlueprint, exportBlueprintPdf } from '@/features/ai/event/export';
import { demoBlueprint, SAMPLE_THEMES } from '@/features/ai/event/sample';
import {
  emptyEventInput,
  getEventType,
  type EventBlueprint,
  type EventInput,
  type ThemeSuggestion,
} from '@/features/ai/event/types';

const tool = getTool('event');
type Stage = 'form' | 'generating' | 'result' | 'error';

export default function EventArchitect() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const tier: Tier = me.data?.tier ?? 'free';
  const isPro = tierAtLeast(tier, 'pro');

  const [stage, setStage] = useState<Stage>('form');
  const [input, setInput] = useState<EventInput>(emptyEventInput);
  const [blueprint, setBlueprint] = useState<EventBlueprint | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);

  const [themeOpen, setThemeOpen] = useState(false);
  const [themes, setThemes] = useState<ThemeSuggestion[]>([]);
  const [themesLoading, setThemesLoading] = useState(false);

  const eventName = getEventType(input.eventTypeId)?.label ?? 'Event';
  const canRun = input.eventTypeId.length > 0 && input.grades.length > 0;

  async function onSuggestThemes() {
    setThemeOpen(true);
    setThemesLoading(true);
    try {
      const result = await suggestThemes(input);
      setThemes(result);
    } catch (e) {
      // Backend off → sample themes so the flow is reviewable.
      if (e instanceof ApiError && e.status === 0) setThemes(SAMPLE_THEMES);
      else {
        setThemes(SAMPLE_THEMES);
      }
    } finally {
      setThemesLoading(false);
    }
  }

  function onSelectTheme(theme: ThemeSuggestion) {
    setInput({ ...input, theme: theme.name });
    setThemeOpen(false);
    setToast(`Theme set: ${theme.name}`);
  }

  async function runGenerate() {
    setStage('generating');
    try {
      const result = await generateBlueprint(input);
      setBlueprint(result);
      setDemoMode(false);
      setStage('result');
      void queryClient.invalidateQueries({ queryKey: ['ai-history', user?.id] });
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        setBlueprint(demoBlueprint(input));
        setDemoMode(true);
        setStage('result');
        return;
      }
      setErrorMsg(e instanceof Error ? e.message : 'Generation failed.');
      setStage('error');
    }
  }

  async function onCopy() {
    if (!blueprint) return;
    await copyBlueprint(blueprint, eventName);
    setToast('Blueprint copied');
  }

  async function onExportSelect(format: ExportFormat) {
    setShowExport(false);
    if (!blueprint) return;
    try {
      if (format === 'pdf') await exportBlueprintPdf(blueprint, eventName);
      else {
        await copyBlueprint(blueprint, eventName);
        setToast(format === 'word' ? 'Copied — paste into Word' : 'Copied to clipboard');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    }
  }

  function onSaveLibrary() {
    if (!isPro) {
      setToast('Past event library is a Pro feature');
      return;
    }
    setToast(isApiConfigured ? 'Saved to your event library' : 'Preview: connect backend to save');
  }

  // --- gating (Standard+; free → upgrade) ---
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
  if (stage === 'result' && blueprint) {
    const actions: ToolAction[] = [
      { id: 'copy', icon: 'copy-outline', label: 'Copy', onPress: onCopy },
      { id: 'save', icon: 'albums-outline', label: isPro ? 'Library' : 'Library (Pro)', onPress: onSaveLibrary },
      { id: 'export', icon: 'share-outline', label: 'Export', onPress: () => setShowExport(true), primary: true },
    ];
    return (
      <Shell>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl }}>
          {demoMode ? (
            <Banner tone="info" title="Sample preview" message="Demo blueprint so you can review the UI. Connect the AI backend for a tailored plan." />
          ) : null}
          <Pressable onPress={() => setStage('form')} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.amberDark} />
            <Text variant="label" color={colors.amberDark}>
              New blueprint
            </Text>
          </Pressable>
          <Text variant="h2">{eventName}</Text>
          <BlueprintOutput blueprint={blueprint} />
        </ScrollView>
        <ToolActionBar actions={actions} />
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
            A complete, execution-ready event blueprint — 8 documents in one generation.
          </Text>
        </View>

        {!isApiConfigured ? (
          <Banner tone="info" title="Preview mode" message="Fill the form and generate to preview the full 8-document blueprint with a sample. Connect the backend for real generation." />
        ) : null}

        <EventForm value={input} onChange={setInput} onSuggestThemes={onSuggestThemes} />

        <Button title="Generate blueprint" onPress={runGenerate} disabled={!canRun} fullWidth />
      </ScrollView>

      <ThemeSheet visible={themeOpen} loading={themesLoading} themes={themes} onSelect={onSelectTheme} onClose={() => setThemeOpen(false)} />

      <GeneratingOverlay
        visible={stage === 'generating'}
        title="Event Architect is planning…"
        subtitle="Usually under 2 minutes"
        steps={['Shaping the concept & programme…', 'Assigning roles & budget…', 'Writing comms & scripts…']}
        icon="calendar-outline"
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
