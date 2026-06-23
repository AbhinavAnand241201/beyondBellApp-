import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button, Card, Pill, Text } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { fetchSpaceDetail, joinSpace, leaveSpace, type RoomSummary } from '@/features/spaces/queries';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function SpaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ['space', id, user?.id],
    queryFn: () => fetchSpaceDetail(id as string, user?.id as string),
    enabled: !!id && !!user?.id,
  });

  const toggle = useMutation({
    mutationFn: (join: boolean) => (join ? joinSpace(user?.id as string, id as string) : leaveSpace(user?.id as string, id as string)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['space', id, user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['spaces', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['feed', user?.id] });
    },
    onError: (e) => Alert.alert('Couldn’t update', (e as Error).message),
  });

  const space = detail.data?.space;
  const canLeave = space?.joined && !space.isPermanent && !space.isAutoJoined;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: space?.name ?? 'Space', headerBackTitle: 'Spaces' }} />
      {detail.isLoading ? (
        <LoadingState />
      ) : detail.isError || !detail.data || !space ? (
        <ErrorState message="Couldn’t load this Space." onRetry={() => detail.refetch()} />
      ) : (
        <FlatList
          data={detail.data.rooms.filter((r: RoomSummary) => !r.isArchived)}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
          ListHeaderComponent={
            <Card style={{ marginBottom: spacing.sm }}>
              <Text variant="h2">{space.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }}>
                <View style={styles.typeTag}>
                  <Text style={styles.typeTagText}>{space.type.charAt(0).toUpperCase() + space.type.slice(1)}</Text>
                </View>
                <Text variant="caption" color={colors.muted}>
                  {space.memberCount} members
                </Text>
              </View>
              {space.description ? (
                <Text variant="body" color={colors.muted} style={{ marginTop: spacing.md, lineHeight: 21 }}>
                  {space.description}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
                {space.joined ? (
                  canLeave ? (
                    <Button title="Leave Space" variant="secondary" size="sm" loading={toggle.isPending} onPress={() => toggle.mutate(false)} />
                  ) : (
                    <Pill label="Joined" tone="success" />
                  )
                ) : (
                  <Button title="Join Space" size="sm" loading={toggle.isPending} onPress={() => toggle.mutate(true)} />
                )}
              </View>
            </Card>
          }
          renderItem={({ item }) => <RoomCard room={item} onPress={() => router.push(`/(main)/rooms/${item.id}?name=${encodeURIComponent(item.name)}`)} />}
          ListEmptyComponent={
            <Text variant="body" color={colors.muted} style={{ padding: spacing.lg, textAlign: 'center' }}>
              No rooms in this Space yet.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function RoomCard({ room, onPress }: { room: RoomSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.amberDark} />
          <View style={{ flex: 1 }}>
            <Text variant="label">{room.name}</Text>
            {room.description ? (
              <Text variant="caption" color={colors.muted} numberOfLines={1}>
                {room.description}
              </Text>
            ) : null}
          </View>
          {room.roomType === 'read_only' ? <Pill label="Read-only" tone="neutral" /> : null}
          <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  typeTag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: '#FFEDD5' },
  typeTagText: { fontFamily: fonts.bodySemibold, fontSize: 12, color: '#D97706' },
});
