import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** Compact single-select segmented control (e.g. difficulty levels). */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.active]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text variant="caption" color={active ? colors.ink : colors.muted} style={active ? styles.activeText : undefined}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm - 2,
  },
  active: { backgroundColor: colors.amber },
  activeText: { fontWeight: '700' },
});
