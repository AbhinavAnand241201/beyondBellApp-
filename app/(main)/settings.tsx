import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Banner, Button, Card, Segmented, Text } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { fetchSettings, updateSettings, NOTIFICATION_TYPES, type DigestFrequency, type Language, type SettingsState } from '@/features/settings/queries';
import { apiPost, isApiConfigured } from '@/lib/api';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const me = useCurrentUser(user?.id);
  const [state, setState] = useState<SettingsState | null>(null);

  const loaded = useQuery({
    queryKey: ['settings', user?.id],
    queryFn: () => fetchSettings(user?.id as string),
    enabled: !!user?.id && env.isConfigured,
  });
  useEffect(() => {
    if (loaded.data) setState(loaded.data);
  }, [loaded.data]);

  /** Persist a patch immediately (§2.126), updating local state optimistically. */
  function patch(p: Record<string, unknown>, local: Partial<SettingsState>) {
    setState((prev) => (prev ? { ...prev, ...local } : prev));
    if (user?.id && env.isConfigured) void updateSettings(user.id, p).catch((e) => Alert.alert('Couldn’t save', (e as Error).message));
  }

  function confirmDelete() {
    Alert.alert(
      'Delete your account?',
      'Your account enters a 30-day recovery window, then all personal data is permanently removed and your shared resources are anonymised.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!isApiConfigured) {
              Alert.alert('Backend required', 'Account deletion runs via an Edge Function. Connect EXPO_PUBLIC_API_BASE_URL to enable it.');
              return;
            }
            try {
              await apiPost('/api/account/delete', {});
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (e) {
              Alert.alert('Couldn’t delete', (e as Error).message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings', headerBackTitle: 'Profile' }} />
      {env.isConfigured && !state ? (
        <LoadingState />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
          {!env.isConfigured ? <Banner tone="warning" title="Backend not connected" message="Preferences won’t persist until Supabase is connected." /> : null}

          {/* Subscription (§2.131) */}
          <Section title="Subscription">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text variant="body" style={{ flex: 1 }}>
                Current plan
              </Text>
              <TierBadge tier={me.data?.tier ?? 'free'} />
            </View>
            <Button title={me.data?.tier === 'pro' ? 'Manage subscription' : 'Upgrade'} size="sm" variant="secondary" onPress={() => router.push('/(main)/upgrade')} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} />
          </Section>

          {/* Notification preferences (§2.126) */}
          <Section title="Notifications">
            {NOTIFICATION_TYPES.map((n) => (
              <ToggleRow
                key={n.key}
                label={n.label}
                value={state?.notifications[n.key] ?? true}
                onChange={(v) => patch({ [n.key]: v }, { notifications: { ...(state?.notifications ?? {}), [n.key]: v } })}
              />
            ))}
          </Section>

          {/* Privacy (§2.127) */}
          <Section title="Privacy">
            <ToggleRow label="Show school name on profile" value={state?.showSchoolName ?? true} onChange={(v) => patch({ show_school_name: v }, { showSchoolName: v })} />
          </Section>

          {/* Email digest (§2.128) */}
          <Section title="Email digest">
            <Segmented
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'never', label: 'Never' },
              ]}
              value={state?.digestFrequency ?? 'weekly'}
              onChange={(v) => patch({ email_digest_frequency: v }, { digestFrequency: v as DigestFrequency })}
            />
          </Section>

          {/* Language (§2.129) */}
          <Section title="Language">
            <Segmented
              options={[
                { value: 'english', label: 'English' },
                { value: 'hindi', label: 'हिंदी' },
              ]}
              value={state?.language ?? 'english'}
              onChange={(v) => patch({ language_preference: v }, { language: v as Language })}
            />
            <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
              Affects email communications. Full in-app Hindi localisation is on the roadmap.
            </Text>
          </Section>

          {/* Account (§2.130, §2.132) */}
          <Section title="Account">
            <Button title="Log out" variant="secondary" onPress={() => void signOut()} fullWidth />
            <Button title="Delete my account" variant="ghost" onPress={confirmDelete} fullWidth style={{ marginTop: spacing.sm }} />
            <Text variant="caption" color={colors.danger} style={{ textAlign: 'center', marginTop: spacing.xs }}>
              Deleting is permanent after a 30-day recovery window.
            </Text>
          </Section>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label" color={colors.muted}>
        {title.toUpperCase()}
      </Text>
      <Card>{children}</Card>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.amber, false: colors.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
});
