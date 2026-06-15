import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { colors, fonts, fontSize } from '@/theme/tokens';

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodyMedium' | 'label' | 'caption';

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.headingBold, fontSize: fontSize.display, color: colors.ink },
  h1: { fontFamily: fonts.headingBold, fontSize: fontSize.xxl, color: colors.ink },
  h2: { fontFamily: fonts.heading, fontSize: fontSize.xl, color: colors.ink },
  h3: { fontFamily: fonts.heading, fontSize: fontSize.lg, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: fontSize.md, color: colors.ink },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: fontSize.md, color: colors.ink },
  label: { fontFamily: fonts.bodySemibold, fontSize: fontSize.sm, color: colors.ink },
  caption: { fontFamily: fonts.body, fontSize: fontSize.xs, color: colors.muted },
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  color?: string;
}

/** Typed text primitive that bakes in the Inter/Poppins type scale (§10). */
export function Text({ variant = 'body', color, style, ...rest }: TextProps) {
  return <RNText style={[VARIANTS[variant], color ? { color } : null, style]} {...rest} />;
}
