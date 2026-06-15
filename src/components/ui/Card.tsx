import { View, StyleSheet, type ViewProps } from 'react-native';

import { colors, radius, shadow, spacing } from '@/theme/tokens';

export interface CardProps extends ViewProps {
  /** Amber background + black text — reserved for the Morning Briefing card (§10). */
  highlight?: boolean;
  padded?: boolean;
}

/** Standard surface: 12px radius, 1px border, soft shadow (§10). */
export function Card({ highlight = false, padded = true, style, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        highlight
          ? { backgroundColor: colors.amber, borderColor: colors.amber }
          : { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
});
