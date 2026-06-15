import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Selectable pill for multi/single-select option groups (onboarding, filters). */
export function OptionChip({ label, selected, onPress }: OptionChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.amber : colors.surface,
          borderColor: selected ? colors.amber : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text variant="label" color={selected ? colors.ink : colors.muted}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
