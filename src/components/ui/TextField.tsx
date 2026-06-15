import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
}

/** Labeled text input with focus ring + inline error. */
export function TextField({ label, error, hint, style, onFocus, onBlur, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.mutedLight}
        style={[
          styles.input,
          {
            borderColor: error ? colors.danger : focused ? colors.amber : colors.border,
          },
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color={colors.danger} style={styles.helper}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" style={styles.helper}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginBottom: 2 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.body,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  helper: { marginTop: 2 },
});
