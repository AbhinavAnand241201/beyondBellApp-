import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '@/theme/tokens';
import { BottomSheet } from './BottomSheet';
import { Text } from './Text';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
}

/** Dropdown field that opens a bottom-sheet picker. */
export function Select({ label, value, options, onChange, placeholder, disabled, disabledHint }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, disabled && styles.disabled]}
      >
        <Text variant="body" color={selected ? colors.ink : colors.mutedLight} numberOfLines={1} style={{ flex: 1 }}>
          {selected?.label ?? placeholder ?? 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {disabled && disabledHint ? (
        <Text variant="caption" color={colors.mutedLight}>
          {disabledHint}
        </Text>
      ) : null}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <FlatList
          data={options}
          keyExtractor={(o) => o.value}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => {
            const active = item.value === value;
            return (
              <Pressable
                style={styles.row}
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Text variant="body" color={active ? colors.ink : colors.muted}>
                  {item.label}
                </Text>
                {active ? <Ionicons name="checkmark" size={18} color={colors.amberDark} /> : null}
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  disabled: { opacity: 0.5, backgroundColor: colors.canvas },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
