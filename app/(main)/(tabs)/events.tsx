import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { Banner, OptionChip, SkeletonList, Text } from '@/components/ui';
import { EmptyState, ErrorState } from '@/components/QueryStates';
import { EventCard } from '@/features/events/EventCard';
import { fetchRecordings, fetchUpcomingEvents, type EventItem } from '@/features/events/queries';
import { useAuth } from '@/providers/AuthProvider';
import { useNow } from '@/lib/useNow';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

type Tab = 'upcoming' | 'recordings';

export default function EventsTab() {
  const { user } = useAuth();
  const now = useNow();
  const [tab, setTab] = useState<Tab>('upcoming');

  const upcoming = useQuery({
    queryKey: ['events-upcoming', user?.id],
    queryFn: () => fetchUpcomingEvents(user?.id as string, now),
    enabled: !!user?.id && tab === 'upcoming',
  });
  const recordings = useQuery({
    queryKey: ['events-recordings', user?.id],
    queryFn: () => fetchRecordings(user?.id as string, now),
    enabled: !!user?.id && tab === 'recordings',
  });

  const active = tab === 'upcoming' ? upcoming : recordings;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text variant="h1">Events</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <OptionChip label="Upcoming" selected={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
          <OptionChip label="Recordings" selected={tab === 'recordings'} onPress={() => setTab('recordings')} />
        </View>
      </View>

      {!env.isConfigured ? (
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to load events." />
        </View>
      ) : active.isLoading ? (
        <SkeletonList />
      ) : active.isError ? (
        <ErrorState message="Couldn’t load events." onRetry={() => active.refetch()} />
      ) : (
        <FlatList
          data={active.data as EventItem[] | undefined}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}
          renderItem={({ item }) => <EventCard event={item} onPress={() => router.push(`/(main)/events/${item.id}`)} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={tab === 'upcoming' ? 'No upcoming events' : 'No recordings yet'}
              message={tab === 'upcoming' ? 'Check back soon for live sessions.' : 'Past event recordings will appear here.'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
