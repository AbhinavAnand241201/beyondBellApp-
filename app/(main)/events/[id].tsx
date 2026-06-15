import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, Text } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { TierBadge } from '@/components/TierBadge';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { cancelRsvp, fetchEventDetail, rsvpEvent, type EventItem } from '@/features/events/queries';
import { tierAtLeast } from '@/lib/tier';
import { analytics } from '@/lib/analytics';
import { formatEventTime } from '@/lib/format';
import { colors, spacing } from '@/theme/tokens';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const tier = me.data?.tier ?? 'free';
  const queryClient = useQueryClient();

  const event = useQuery({
    queryKey: ['event', id, user?.id],
    queryFn: () => fetchEventDetail(id as string, user?.id as string),
    enabled: !!id && !!user?.id,
  });

  const rsvp = useMutation({
    mutationFn: (join: boolean) => (join ? rsvpEvent(user?.id as string, id as string) : cancelRsvp(user?.id as string, id as string)),
    onSuccess: (_d, join) => {
      if (join) analytics.track('event_rsvp', { eventId: id });
      void queryClient.invalidateQueries({ queryKey: ['event', id, user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['events-upcoming', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t update RSVP', (e as Error).message),
  });

  const e = event.data;
  const canLive = tierAtLeast(tier, 'standard');
  const isPro = tierAtLeast(tier, 'pro');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Event', headerBackTitle: 'Events' }} />
      {event.isLoading ? (
        <LoadingState />
      ) : event.isError || !e ? (
        <ErrorState message="Couldn’t load this event." onRetry={() => event.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}>
          <Card highlight>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Pill label={e.type} tone="neutral" />
              {e.isLive ? <Pill label="● Live now" tone="danger" /> : null}
            </View>
            <Text variant="h2" color={colors.ink} style={{ marginTop: spacing.sm }}>
              {e.title}
            </Text>
            <Text variant="caption" color={colors.ink} style={{ marginTop: 2 }}>
              {formatEventTime(e.startsAt)} · Hosted by {e.hostName}
            </Text>
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <TierBadge tier={e.accessTier} />
            <Text variant="caption" color={colors.muted}>
              {e.rsvpCount}
              {e.maxRsvp ? ` / ${e.maxRsvp}` : ''} going
            </Text>
          </View>

          {/* Access-gated actions (§2.93) */}
          {renderActions(e, { canLive, isPro, rsvping: rsvp.isPending, onRsvp: (j) => rsvp.mutate(j), onJoin: () => router.push(`/(main)/events/${e.id}/live`) })}

          {/* Discussion threads (§2.98) */}
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="chatbubbles-outline" size={18} color={colors.amberDark} />
              <View style={{ flex: 1 }}>
                <Text variant="label">Event discussion</Text>
                <Text variant="caption" color={colors.muted}>
                  Pre-event thread opens 48h before · post-event thread stays open 7 days.
                </Text>
              </View>
            </View>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function renderActions(
  e: EventItem,
  o: { canLive: boolean; isPro: boolean; rsvping: boolean; onRsvp: (join: boolean) => void; onJoin: () => void },
) {
  // Live now → join (standard+)
  if (e.isLive && o.canLive) {
    return <Button title="Join Live" onPress={o.onJoin} fullWidth />;
  }
  // Recording available → watch
  if (e.recordingUrl) {
    return <Button title="Watch recording" onPress={o.onJoin} fullWidth />;
  }
  // Free tier: recording-only messaging (§2.93)
  if (!o.canLive) {
    return (
      <Banner
        tone="info"
        title="Recording available after the event"
        message="Free members can watch the recording 7 days after the event. Upgrade to Standard to attend live."
      />
    );
  }
  // Standard/Pro: RSVP toggle
  return (
    <View style={{ gap: spacing.sm }}>
      {e.rsvped ? (
        <Button title="Cancel RSVP" variant="secondary" loading={o.rsvping} onPress={() => o.onRsvp(false)} fullWidth />
      ) : (
        <Button title={o.isPro ? 'RSVP · Priority Q&A' : 'RSVP'} loading={o.rsvping} onPress={() => o.onRsvp(true)} fullWidth />
      )}
      {e.rsvped ? (
        <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
          A calendar invite + 1-hour reminder are scheduled. {o.isPro ? 'Your questions get host priority.' : ''}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
