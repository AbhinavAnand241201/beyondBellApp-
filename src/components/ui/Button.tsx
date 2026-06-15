import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';

import { colors, fonts, fontSize, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

const SIZE_PADDING: Record<ButtonSize, ViewStyle> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  lg: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
};

const SIZE_FONT: Record<ButtonSize, number> = {
  sm: fontSize.sm,
  md: fontSize.md,
  lg: fontSize.lg,
};

function bg(variant: ButtonVariant, pressed: boolean): string {
  switch (variant) {
    case 'primary':
      return pressed ? colors.amberDark : colors.amber;
    case 'danger':
      return pressed ? '#B42318' : colors.danger;
    case 'secondary':
      return pressed ? '#EFEBE3' : colors.surface;
    case 'ghost':
      return pressed ? '#EFEBE3' : 'transparent';
  }
}

function fg(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return colors.ink; // amber bg → black text (brand rule)
    case 'danger':
      return '#FFFFFF';
    case 'secondary':
    case 'ghost':
      return colors.ink;
  }
}

/** Primary action button. Amber primary uses black text per the brand rule (§10). */
export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        SIZE_PADDING[size],
        {
          backgroundColor: bg(variant, pressed),
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg(variant)} />
      ) : (
        <View style={styles.row}>
          {leftIcon}
          <Text
            style={{ fontFamily: fonts.bodySemibold, fontSize: SIZE_FONT[size], color: fg(variant) }}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
