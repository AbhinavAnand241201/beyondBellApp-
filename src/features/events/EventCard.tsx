import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { TierBadge } from '@/components/TierBadge';
import { colors, spacing } from '@/theme/tokens';
import { formatEventTime } from '@/lib/format';
import type { EventItem } from './queries';

/** Event list card (§2.91) — title, type, host, time, access badge, RSVP count. */
export function EventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Pill label={event.type} tone="neutral" />
          {event.isLive ? <Pill label="● Live" tone="danger" /> : null}
          <View style={{ flex: 1 }} />
          <TierBadge tier={event.accessTier} />
        </View>
        <Text variant="h3" style={{ marginTop: spacing.sm }} numberOfLines={2}>
          {event.title}
        </Text>
        <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
          Hosted by {event.hostName}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={14} color={colors.amberDark} />
            <Text variant="caption" color={colors.ink}>
              {formatEventTime(event.startsAt)}
            </Text>
          </View>
          <View style={styles.meta}>
            <Ionicons name="people-outline" size={14} color={colors.muted} />
            <Text variant="caption" color={colors.muted}>
              {event.rsvpCount}
              {event.maxRsvp ? `/${event.maxRsvp}` : ''} going
            </Text>
          </View>
          {event.rsvped ? <Pill label="RSVP’d" tone="success" /> : null}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
