import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { RESOURCE_TYPE_LABEL, type Resource } from './types';

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card>
      <View style={styles.topRow}>
        <Pill label={RESOURCE_TYPE_LABEL[resource.resourceType]} tone="neutral" />
        {resource.isAiGenerated ? <Pill label="AI" tone="amber" /> : null}
        {resource.isProOnly ? <Pill label="Pro" tone="success" /> : null}
      </View>

      <Text variant="h3" style={{ marginTop: spacing.sm }} numberOfLines={2}>
        {resource.title}
      </Text>
      {resource.description ? (
        <Text variant="body" color={colors.muted} style={{ marginTop: spacing.xs }} numberOfLines={2}>
          {resource.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        {resource.subject ? (
          <Text variant="caption" color={colors.muted}>
            {resource.subject}
          </Text>
        ) : null}
        <View style={styles.metric}>
          <Ionicons name="star" size={13} color={colors.amberDark} />
          <Text variant="caption" color={colors.muted}>
            {resource.ratingAvg.toFixed(1)} ({resource.ratingCount})
          </Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="download-outline" size={13} color={colors.muted} />
          <Text variant="caption" color={colors.muted}>
            {resource.downloadCount}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
