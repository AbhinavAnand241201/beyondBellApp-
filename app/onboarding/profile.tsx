import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { BrandLogo, Button, ProgressBar, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWizard } from '@/features/onboarding/useWizard';
import { StepRenderer } from '@/features/onboarding/StepRenderer';
import { advanceStep, finishOnboarding } from '@/features/onboarding/actions';
import { STEP_TITLES, TOTAL_STEPS } from '@/features/onboarding/types';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

/** Short helper copy under each step title (display only). */
const STEP_SUBTITLES: Record<number, string> = {
  1: 'Tell the circle who you are.',
  2: 'Helps us connect you with the right educators.',
  3: 'Where you teach — your city and state.',
  4: 'Pick the spaces and topics that fit you.',
  5: 'A quick look before you join your circle.',
};

/**
 * The 5-step onboarding wizard (single route, internal stepper — matching the
 * web's `/onboarding/profile`). State lives in `useWizard`; persistence runs
 * through `features/onboarding/actions`.
 */
export default function OnboardingProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const seed = (user?.user_metadata?.full_name as string | undefined) ?? '';
  const wizard = useWizard(seed);
  const [saving, setSaving] = useState(false);

  const isLast = wizard.step === TOTAL_STEPS;

  async function onNext() {
    if (!wizard.canProceed) return;

    if (isLast) {
      await onFinish();
      return;
    }

    // Best-effort progress checkpoint (don't block the UX if it fails offline).
    if (user && env.isConfigured) {
      void advanceStep(user.id, wizard.step + 1);
    }
    wizard.goNext();
  }

  async function onFinish() {
    if (!user) return;
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to save your profile.');
      return;
    }
    setSaving(true);
    const { error } = await finishOnboarding(user.id, wizard.data);
    setSaving(false);
    if (error) {
      Alert.alert('Could not save profile', error);
      return;
    }
    // Refresh the gate so it now routes to the dashboard.
    await queryClient.invalidateQueries({ queryKey: ['onboarding-status', user.id] });
    router.replace('/(main)');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Top app bar: logo + step tracker, progress bar flush below */}
      <View style={styles.topBar}>
        <BrandLogo variant="black" height={26} />
        <Text variant="bodyMedium" color={colors.muted}>
          Step {wizard.step} / {TOTAL_STEPS}
        </Text>
      </View>
      <ProgressBar progress={wizard.step / TOTAL_STEPS} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
            <Text variant="h1">{STEP_TITLES[wizard.step]}</Text>
            {STEP_SUBTITLES[wizard.step] ? (
              <Text variant="body" color={colors.muted}>
                {STEP_SUBTITLES[wizard.step]}
              </Text>
            ) : null}
          </View>

          <StepRenderer step={wizard.step} data={wizard.data} update={wizard.update} toggleInArray={wizard.toggleInArray} />
        </ScrollView>

        {/* Sticky footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            {wizard.step > 1 ? <Button title="Back" variant="ghost" onPress={wizard.goBack} style={{ flex: 1 }} /> : null}
            <Button
              title={isLast ? 'Take me to my Circle' : 'Continue'}
              size="lg"
              onPress={onNext}
              loading={saving}
              disabled={!wizard.canProceed}
              style={{ flex: wizard.step > 1 ? 2 : 1 }}
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 120, gap: spacing.xl },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
