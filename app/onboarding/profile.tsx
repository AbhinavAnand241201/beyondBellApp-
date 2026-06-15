import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Button, ProgressBar, Screen, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWizard } from '@/features/onboarding/useWizard';
import { StepRenderer } from '@/features/onboarding/StepRenderer';
import { advanceStep, finishOnboarding } from '@/features/onboarding/actions';
import { STEP_TITLES, TOTAL_STEPS } from '@/features/onboarding/types';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

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
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ gap: spacing.sm }}>
          <Text variant="caption" color={colors.muted}>
            Step {wizard.step} of {TOTAL_STEPS}
          </Text>
          <ProgressBar progress={wizard.step / TOTAL_STEPS} />
          <Text variant="h1">{STEP_TITLES[wizard.step]}</Text>
        </View>

        <View style={{ minHeight: 240 }}>
          <StepRenderer
            step={wizard.step}
            data={wizard.data}
            update={wizard.update}
            toggleInArray={wizard.toggleInArray}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          {wizard.step > 1 ? (
            <Button title="Back" variant="secondary" onPress={wizard.goBack} style={{ flex: 1 }} />
          ) : null}
          <Button
            title={isLast ? 'Finish' : 'Continue'}
            onPress={onNext}
            loading={saving}
            disabled={!wizard.canProceed}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Screen>
  );
}
