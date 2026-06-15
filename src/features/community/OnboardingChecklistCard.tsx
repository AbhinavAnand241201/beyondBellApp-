import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, ProgressBar, Text } from '@/components/ui';
import { useDashboard } from '@/features/dashboard/useDashboard';
import { colors, spacing } from '@/theme/tokens';

/**
 * Persistent 7-day onboarding checklist card (§2.17) shown on the home feed for
 * new users. Collapses once everything is done (then hides). Backed by the
 * dashboard query (profile completion + first-post / first-AI milestones).
 */
export function OnboardingChecklistCard({ userId }: { userId: string | undefined }) {
  const dash = useDashboard(userId);
  const [collapsed, setCollapsed] = useState(false);

  const d = dash.data;
  if (!d) return null;

  const items = [
    { label: 'Complete your profile', done: d.profileCompletionPct >= 100 },
    { label: 'Share your first post', done: d.checklist.firstPostAt != null },
    { label: 'Try an AI tool', done: d.checklist.firstAiToolAt != null },
    { label: 'Earn your first Circle Points', done: d.circlePoints > 0 },
  ];
  const doneCount = items.filter((i) => i.done).length;
  const pct = doneCount / items.length;

  // Once fully complete, don't clutter the feed.
  if (doneCount === items.length) return null;

  return (
    <Card>
      <Pressable onPress={() => setCollapsed((c) => !c)} style={styles.headerRow}>
        <Ionicons name="rocket-outline" size={18} color={colors.amberDark} />
        <View style={{ flex: 1 }}>
          <Text variant="label">Get started ({doneCount}/{items.length})</Text>
        </View>
        <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={18} color={colors.mutedLight} />
      </Pressable>
      <View style={{ marginTop: spacing.sm }}>
        <ProgressBar progress={pct} />
      </View>
      {!collapsed ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
          {items.map((it) => (
            <View key={it.label} style={styles.item}>
              <Ionicons name={it.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={it.done ? colors.success : colors.mutedLight} />
              <Text variant="body" color={it.done ? colors.muted : colors.ink}>
                {it.label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
