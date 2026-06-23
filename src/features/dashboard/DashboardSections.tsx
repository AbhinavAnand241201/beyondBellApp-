import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, BrandLogo, Button, Card, ProgressBar, Text } from '@/components/ui';
import { levelName, levelProgress } from '@/features/reputation/levels';
import type { DashboardData } from './queries';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

/**
 * Presentational dashboard sections — the RN port of the web home dashboard
 * (the "Good afternoon" screen): top bar, greeting, Library/Resources cards,
 * the profile summary card, Your Impact and Upcoming Events. Matches the web
 * screenshots in `docs/images of the web app/`.
 */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Top app bar: B logo · search · bell(badge) · settings · Upgrade. */
export function DashboardHeader({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <View style={styles.header}>
      <BrandLogo variant="black" height={30} />
      <View style={{ flex: 1 }} />
      <Pressable hitSlop={8} style={styles.headerIcon} onPress={() => router.push('/(main)/resources')} accessibilityLabel="Search">
        <Ionicons name="search" size={22} color={colors.ink} />
      </Pressable>
      <Pressable hitSlop={8} style={styles.headerIcon} accessibilityLabel="Notifications">
        <Ionicons name="notifications-outline" size={22} color={colors.ink} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable hitSlop={8} style={styles.headerIcon} onPress={() => router.push('/(main)/settings')} accessibilityLabel="Settings">
        <Ionicons name="settings-outline" size={22} color={colors.ink} />
      </Pressable>
      <Pressable style={styles.upgradeBtn} onPress={() => router.push('/(main)/upgrade')} accessibilityLabel="Upgrade">
        <Ionicons name="sparkles" size={14} color={colors.ink} />
        <Text style={styles.upgradeText}>Upgrade</Text>
      </Pressable>
    </View>
  );
}

/** "Good afternoon, {name}." with the amber accent bar + subtitle. */
export function GreetingBlock({ name }: { name: string }) {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return (
    <View style={styles.greetRow}>
      <View style={styles.accentBar} />
      <View style={{ flex: 1 }}>
        <Text variant="display" style={styles.greetTitle}>
          {greeting()}, {first}.
        </Text>
        <Text variant="body" color={colors.muted} style={{ marginTop: 2 }}>
          Check out what other educators are discussing today.
        </Text>
      </View>
    </View>
  );
}

/** My Library / Public Resources — two square cards side by side. */
export function LibraryResourceCards() {
  return (
    <View style={styles.dualRow}>
      <Pressable style={{ flex: 1 }} onPress={() => router.push('/(main)/library')}>
        <Card style={styles.dualCard}>
          <View style={[styles.dualIcon, { backgroundColor: '#D8F2E6' }]}>
            <Ionicons name="folder-open-outline" size={22} color={colors.success} />
          </View>
          <Text variant="label" style={{ textAlign: 'center' }}>My Library</Text>
          <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>Your saved resources</Text>
        </Card>
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => router.push('/(main)/resources')}>
        <Card style={styles.dualCard}>
          <View style={[styles.dualIcon, { backgroundColor: '#DCEBFB' }]}>
            <Ionicons name="globe-outline" size={22} color="#2F6FBF" />
          </View>
          <Text variant="label" style={{ textAlign: 'center' }}>Public Resources</Text>
          <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>Community library</Text>
        </Card>
      </Pressable>
    </View>
  );
}

const TIER_LABEL: Record<string, string> = { free: 'Free Plan', standard: 'Standard', pro: 'Pro' };

/** The profile summary card: avatar, name, meta, plan, stats, level, badges. */
export function ProfileSummaryCard({ d }: { d: DashboardData }) {
  const lp = levelProgress(d.level, d.circlePoints);
  const metaParts = [d.meta.subject, d.meta.board, d.meta.city].filter(Boolean);
  return (
    <Card style={{ alignItems: 'center', borderRadius: 16 }}>
      <Avatar uri={d.avatarUrl} name={d.displayName} size={72} />
      <Text variant="h2" style={{ marginTop: spacing.sm }}>{d.displayName}</Text>
      {metaParts.length > 0 ? (
        <Text variant="body" color={colors.muted} style={{ marginTop: 2 }}>{metaParts.join(' · ')}</Text>
      ) : null}
      <View style={styles.planPill}>
        <Ionicons name="ribbon-outline" size={13} color={colors.muted} />
        <Text variant="caption" color={colors.muted}>{TIER_LABEL[d.tier] ?? 'Free Plan'}</Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="CIRCLE POINTS" value={d.circlePoints} />
        <View style={styles.statDivider} />
        <Stat label="RESOURCES" value={d.counts.resources} />
        <View style={styles.statDivider} />
        <Stat label="HELPFUL" value={d.counts.replies} />
      </View>

      <View style={styles.hr} />

      <View style={styles.levelRow}>
        <Text variant="label">Level {d.level} — {levelName(d.level)}</Text>
        {lp.nextName ? (
          <Text variant="caption" color={colors.muted}>{lp.toNext} pts to Level {d.level + 1}</Text>
        ) : null}
      </View>
      <View style={{ width: '100%', marginTop: spacing.sm }}>
        <ProgressBar progress={lp.pct} />
      </View>

      {d.counts.badges > 0 ? (
        <View style={{ width: '100%', marginTop: spacing.md }}>
          <Text variant="caption" color={colors.muted}>{d.counts.badges} badge{d.counts.badges === 1 ? '' : 's'} earned</Text>
          <View style={styles.badgeRow}>
            {Array.from({ length: Math.min(d.counts.badges, 5) }).map((_, i) => (
              <View key={i} style={styles.badgeDisc}>
                <Ionicons name="ribbon" size={18} color={colors.amberDark} />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <Button
        title="Edit Profile"
        variant="secondary"
        size="md"
        onPress={() => router.push('/(main)/onboarding/profile')}
        style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
      />
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text variant="h2">{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** "YOUR IMPACT" empty card. */
export function ImpactCard({ hasImpact }: { hasImpact: boolean }) {
  return (
    <Card>
      <View style={styles.sectionLabelRow}>
        <Ionicons name="trending-up" size={16} color={colors.amberDark} />
        <Text style={styles.sectionLabel}>YOUR IMPACT</Text>
      </View>
      <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm }}>
        {hasImpact
          ? 'Your shared resources and replies are helping fellow educators.'
          : 'Create resources, reply to peers, and share to start building your impact.'}
      </Text>
    </Card>
  );
}

/** "Upcoming Events" empty card. */
export function UpcomingEventsCard() {
  return (
    <Card>
      <View style={styles.sectionLabelRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.amberDark} />
        <Text style={styles.sectionLabel}>Upcoming Events</Text>
      </View>
      <Text variant="body" color={colors.muted} style={{ marginTop: spacing.sm }}>
        No upcoming sessions. New events will appear here when scheduled.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerIcon: { padding: 2 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontFamily: fonts.bodySemibold, fontSize: 10 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.amber,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  upgradeText: { fontFamily: fonts.bodySemibold, fontSize: 14, color: colors.ink },

  greetRow: { flexDirection: 'row', gap: spacing.md },
  accentBar: { width: 4, borderRadius: 2, backgroundColor: colors.amber },
  greetTitle: { fontSize: 30, lineHeight: 36 },

  dualRow: { flexDirection: 'row', gap: spacing.md },
  dualCard: { alignItems: 'center', gap: 6, paddingVertical: spacing.lg, borderRadius: 16 },
  dualIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },

  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statsRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: spacing.lg },
  statDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: '#F3F4F6' },
  statLabel: { fontFamily: fonts.bodySemibold, fontSize: 10, color: colors.muted, letterSpacing: 0.5, marginTop: 2 },
  hr: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch', marginTop: spacing.lg },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', marginTop: spacing.lg },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  badgeDisc: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FCEFCB', alignItems: 'center', justifyContent: 'center' },

  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontFamily: fonts.bodySemibold, fontSize: 13, color: colors.amberDark, letterSpacing: 0.5, textTransform: 'uppercase' },
});
