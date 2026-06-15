import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Button, Card, Pill, ProgressBar, Text } from '@/components/ui';
import { TierBadge } from '@/components/TierBadge';
import { BadgeGridModal } from '@/features/reputation/BadgeGridModal';
import { levelDef, levelName, levelProgress } from '@/features/reputation/levels';
import { roleLabel } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';
import { badgeLabel, type ProfileData } from './queries';

export function ProfileView({
  profile,
  onMessage,
  onSignOut,
  onToggleFollow,
  followBusy,
}: {
  profile: ProfileData;
  onMessage?: () => void;
  onSignOut?: () => void;
  onToggleFollow?: (next: boolean) => void;
  followBusy?: boolean;
}) {
  const [badgesOpen, setBadgesOpen] = useState(false);
  const location = [profile.city, profile.state].filter(Boolean).join(', ');
  const ring = levelDef(profile.level).ring;
  const prog = levelProgress(profile.level, profile.circlePoints);
  const earned = new Set(profile.badges.map((b) => b.badgeType));

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
      {/* Identity */}
      <Card>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <View style={[styles.ring, { borderColor: ring }]}>
            <Avatar uri={profile.avatarUrl} name={profile.displayName} size={64} />
          </View>
          <View style={{ flex: 1, gap: spacing.xs }}>
            <Text variant="h2">{profile.displayName}</Text>
            <Text variant="caption" color={colors.muted}>
              {profile.designation || roleLabel(profile.role)}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
              <TierBadge tier={profile.tier} />
              {profile.isFoundingMember ? (
                <Pill label={profile.foundingMemberNumber ? `Founding #${profile.foundingMemberNumber}` : 'Founding'} tone="amber" />
              ) : null}
            </View>
          </View>
        </View>

        {profile.bio ? (
          <Text variant="body" color={colors.ink} style={{ marginTop: spacing.md, lineHeight: 21 }}>
            {profile.bio}
          </Text>
        ) : null}
        {profile.showSchoolName && profile.schoolName ? <DetailRow icon="business-outline" text={profile.schoolName} /> : null}
        {location ? <DetailRow icon="location-outline" text={location} /> : null}

        {/* Action buttons on others' profiles (§2.125) */}
        {onMessage || onToggleFollow ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            {onToggleFollow ? (
              <Button
                title={profile.isFollowing ? 'Following' : 'Follow'}
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                loading={followBusy}
                onPress={() => onToggleFollow(!profile.isFollowing)}
                style={{ flex: 1 }}
              />
            ) : null}
            {onMessage ? <Button title="Message" variant="secondary" onPress={onMessage} style={{ flex: 1 }} /> : null}
          </View>
        ) : null}
      </Card>

      {/* Reputation with progress to next level (§2.86/2.120) */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Stat label="Circle Points" value={profile.circlePoints} />
          <Stat label="Level" value={profile.level} sub={levelName(profile.level)} />
          <Stat label="Badges" value={profile.badges.length} />
        </View>
        <ProgressBar progress={prog.pct} />
        <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
          {prog.nextName ? `${prog.toNext} points to ${prog.nextName}` : 'Top level reached 🎉'}
        </Text>
      </Card>

      {/* Stats row (§2.122) */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Stat label="Posts" value={profile.stats.posts} />
          <Stat label="Resources" value={profile.stats.resources} />
          <Stat label="Helpful" value={profile.stats.helpfulReplies} />
          <Stat label="Events" value={profile.stats.eventsAttended} />
        </View>
      </Card>

      {/* Badge shelf (§2.88) */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text variant="label" style={{ flex: 1 }}>
            Badges
          </Text>
          <Button title={`View all 28`} variant="ghost" size="sm" onPress={() => setBadgesOpen(true)} />
        </View>
        {profile.badges.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {profile.badges.slice(0, 6).map((b) => (
              <View key={b.id} style={styles.badge}>
                <Ionicons name="ribbon-outline" size={14} color={colors.amberDark} />
                <Text variant="caption" color={colors.ink}>
                  {badgeLabel(b.badgeType)}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="caption" color={colors.muted}>
            No badges yet — contribute to earn your first.
          </Text>
        )}
      </Card>

      {/* Teaching */}
      {profile.boards.length + profile.subjects.length + profile.grades.length > 0 ? (
        <Card>
          <Text variant="label" style={{ marginBottom: spacing.sm }}>
            Teaching
          </Text>
          <ChipList label="Boards" values={profile.boards} />
          <ChipList label="Grades" values={profile.grades.map((g) => `Grade ${g}`)} />
          <ChipList label="Subjects" values={profile.subjects} />
          <ChipList label="Specialist areas" values={profile.specialistAreas} />
        </Card>
      ) : null}

      {onSignOut ? <Button title="Sign out" variant="secondary" onPress={onSignOut} fullWidth /> : null}

      <BadgeGridModal visible={badgesOpen} onClose={() => setBadgesOpen(false)} earned={earned} />
    </ScrollView>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text variant="body" color={colors.muted}>
        {text}
      </Text>
    </View>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="h2">{value}</Text>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      {sub ? (
        <Text variant="caption" color={colors.amberDark}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

function ChipList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text variant="caption" color={colors.muted} style={{ marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {values.map((v) => (
          <Pill key={v} label={v} tone="neutral" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 3, borderRadius: 40, padding: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FCE8B8', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 999 },
});
