import { Image, type ImageStyle, type StyleProp } from 'react-native';

/**
 * The official BeyondBell logo (bell mark + "BeyondBell" wordmark). Single source
 * of truth for the brand mark across the app.
 *
 * Two variants ship so the wordmark always has contrast:
 *  - `black` — black "Beyond" + orange "Bell". Use on white/light surfaces (default).
 *  - `white` — white "Beyond" + orange "Bell". Use on dark / amber / navy surfaces.
 */
const SOURCES = {
  black: require('../../../assets/logo-black.PNG'),
  white: require('../../../assets/logo-white.PNG'),
} as const;

// Intrinsic aspect ratio of the asset (width / height).
const ASPECT = 1.68;

export interface BrandLogoProps {
  /** Pick the variant to match the background. Defaults to `black` (light surfaces). */
  variant?: 'black' | 'white';
  /** Rendered height in px; width is derived from the logo aspect ratio. */
  height?: number;
  style?: StyleProp<ImageStyle>;
}

export function BrandLogo({ variant = 'black', height = 40, style }: BrandLogoProps) {
  return (
    <Image
      source={SOURCES[variant]}
      resizeMode="contain"
      accessibilityLabel="BeyondBell"
      style={[{ height, width: height * ASPECT }, style]}
    />
  );
}
