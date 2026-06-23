import { View, StyleSheet } from 'react-native';

import { BrandLogo, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.wrap}>
      {/* Black logo reads on the white auth screen. */}
      <BrandLogo variant="black" height={40} style={{ marginBottom: spacing.md }} />
      <Text variant="h1">{title}</Text>
      <Text variant="body" color={colors.muted}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.xl },
});
