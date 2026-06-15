import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, Pill, StarRating, Text, TextField } from '@/components/ui';
import { ErrorState, LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { fetchResourceDetail, incrementDownload, rateResource, type ResourceDetail } from '@/features/resources/queries';
import { RESOURCE_TYPE_LABEL } from '@/features/resources/types';
import { tierAtLeast } from '@/lib/tier';
import { analytics } from '@/lib/analytics';
import { colors, spacing } from '@/theme/tokens';

export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const detail = useQuery({
    queryKey: ['resource', id, user?.id],
    queryFn: () => fetchResourceDetail(id as string, user?.id as string),
    enabled: !!id && !!user?.id,
  });
  useEffect(() => {
    if (detail.data?.myRating) setRating(detail.data.myRating);
  }, [detail.data?.myRating]);

  const submitRating = useMutation({
    mutationFn: () => rateResource(id as string, user?.id as string, rating, comment),
    onSuccess: () => {
      analytics.track('resource_rated', { resourceId: id, rating });
      void queryClient.invalidateQueries({ queryKey: ['resource', id, user?.id] });
      Alert.alert('Thanks!', 'Your rating helps the community find great resources.');
    },
    onError: (e) => Alert.alert('Couldn’t rate', (e as Error).message),
  });

  const r: ResourceDetail | undefined = detail.data;
  const tier = me.data?.tier ?? 'free';
  const downloadGated = !!r?.isProOnly && !tierAtLeast(tier, 'pro');

  async function onDownload() {
    if (!r) return;
    if (downloadGated) return;
    analytics.track('resource_downloaded', { resourceId: r.id });
    void incrementDownload(r.id);
    if (r.fileUrl) {
      const can = await Linking.canOpenURL(r.fileUrl);
      if (can) await Linking.openURL(r.fileUrl);
      else Alert.alert('Download', 'File link is not available.');
    } else {
      Alert.alert('Download', 'This resource has no attached file.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Resource', headerBackTitle: 'Back' }} />
      {detail.isLoading ? (
        <LoadingState />
      ) : detail.isError || !r ? (
        <ErrorState message="Couldn’t load this resource." onRetry={() => detail.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}>
          <Card>
            <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
              <Pill label={RESOURCE_TYPE_LABEL[r.resourceType]} tone="neutral" />
              {r.isAiGenerated ? <Pill label="AI-generated" tone="amber" /> : null}
              {r.isProOnly ? <Pill label="Pro" tone="success" /> : null}
            </View>
            <Text variant="h2" style={{ marginTop: spacing.sm }}>
              {r.title}
            </Text>
            <Text variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
              by {r.authorName}
            </Text>
            {r.description ? (
              <Text variant="body" style={{ marginTop: spacing.md, lineHeight: 22 }}>
                {r.description}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              <View style={styles.meta}>
                <Ionicons name="star" size={14} color={colors.amberDark} />
                <Text variant="caption" color={colors.muted}>
                  {r.ratingAvg.toFixed(1)} ({r.ratingCount})
                </Text>
              </View>
              <View style={styles.meta}>
                <Ionicons name="download-outline" size={14} color={colors.muted} />
                <Text variant="caption" color={colors.muted}>
                  {r.downloadCount} downloads
                </Text>
              </View>
              {r.subject ? (
                <Text variant="caption" color={colors.muted}>
                  {r.subject}
                </Text>
              ) : null}
            </View>
          </Card>

          {/* Download / Pro gate (§2.85) */}
          {downloadGated ? (
            <UpgradePrompt requiredTier="pro" feature="Downloading this resource" />
          ) : (
            <Button title={r.fileFormat ? `Download ${r.fileFormat.toUpperCase()}` : 'Download'} onPress={onDownload} fullWidth />
          )}

          {/* Rate (§2.82) */}
          <Card>
            <Text variant="label" style={{ marginBottom: spacing.sm }}>
              {r.myRating ? 'Your rating' : 'Rate this resource'}
            </Text>
            <StarRating value={rating} onChange={setRating} />
            <TextField value={comment} onChangeText={setComment} placeholder="Add a comment (optional)" multiline style={{ marginTop: spacing.md, minHeight: 60, textAlignVertical: 'top' }} />
            <Button title={r.myRating ? 'Update rating' : 'Submit rating'} size="sm" loading={submitRating.isPending} disabled={rating === 0} onPress={() => submitRating.mutate()} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} />
          </Card>

          {r.ratingCount < 2 ? (
            <Banner tone="info" title="New resource" message="Resources need 2+ ratings before appearing in public search — yours helps." />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, flexWrap: 'wrap' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
