import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card, ProgressBar, Text } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/useDashboard';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

/**
 * "Getting started" card (§2.17) — the RN port of the web home checklist. Six
 * tasks with done/strike-through states, an "UP NEXT" marker on the first
 * outstanding task, a percent-complete header and progress bar. Hidden once all
 * six are done. Matches the web screenshot in `docs/images of the web app/`.
 */
export function OnboardingChecklistCard({ userId }: { userId: string | undefined }) {
  const dash = useDashboard(userId);
  const [collapsed, setCollapsed] = useState(false);

  const d = dash.data;
  if (!d) return null;

  const items = [
    { label: 'Complete your profile', done: d.profileCompletionPct >= 80 },
    { label: 'Generate your first lesson plan', done: d.checklist.firstAiToolAt != null },
    { label: 'Introduce yourself to the community', done: d.checklist.firstPostAt != null },
    { label: 'Follow a fellow educator', done: false },
    { label: 'React to a post', done: false },
    { label: 'Try a second AI tool', done: false },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  const upNextIndex = items.findIndex((i) => !i.done);

  if (doneCount === items.length) return null;

  return (
    <Card padded={false} style={{ overflow: 'hidden' }}>
      <Pressable onPress={() => setCollapsed((c) => !c)} style={styles.headerRow}>
        <View style={styles.iconTile}>
          <Ionicons name="checkbox-outline" size={20} color={colors.amberDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="label">Getting started</Text>
          <Text variant="caption" color={colors.muted}>
            {doneCount} of {items.length} tasks · {pct}% complete
          </Text>
        </View>
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={colors.mutedLight} />
      </Pressable>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <ProgressBar progress={doneCount / items.length} />
      </View>

      {!collapsed ? (
        <View style={styles.list}>
          {items.map((it, idx) => (
            <View key={it.label} style={styles.item}>
              <Ionicons
                name={it.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={it.done ? colors.success : colors.border}
              />
              <Text
                variant="body"
                color={it.done ? colors.mutedLight : colors.ink}
                style={[{ flex: 1 }, it.done && styles.struck]}
              >
                {it.label}
              </Text>
              {!it.done && idx === upNextIndex ? <Text style={styles.upNext}>UP NEXT</Text> : null}
            </View>
          ))}

          <Pressable onPress={() => router.push('/(main)/onboarding/profile')} style={styles.viewAll}>
            <Text variant="label" color={colors.amberDark}>View full checklist →</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.md },
  iconTile: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: '#FCEFCB', alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  struck: { textDecorationLine: 'line-through' },
  upNext: { fontFamily: fonts.bodySemibold, fontSize: 11, color: colors.amberDark, letterSpacing: 0.5 },
  viewAll: { marginTop: spacing.xs },
});
