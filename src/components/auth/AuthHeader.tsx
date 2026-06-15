import { View, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Text style={styles.markText}>BB</Text>
      </View>
      <Text variant="h1">{title}</Text>
      <Text variant="body" color={colors.muted}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.xl },
  mark: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  markText: { color: colors.ink, fontWeight: '800', fontSize: 18 },
});
